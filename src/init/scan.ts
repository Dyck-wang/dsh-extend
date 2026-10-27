/**
 * Deterministic repository scanner for the dsh-extend `/init` command.
 *
 * Collects a bounded, compact Markdown summary of the repository root:
 * a directory tree (ignoring heavy/vendored paths), the README, a package.json
 * digest, selected config files, and the existing root AGENTS.md when present.
 *
 * The scanner has no dsh dependency: it uses only Node builtins so the
 * scanning logic stays unit-testable outside a harness and free of model
 * token cost surprises (everything is byte-bounded).
 *
 * @module dsh-extend/init/scan
 */

import { readdir, readFile } from 'node:fs/promises'
import type { Dirent } from 'node:fs'
import { join } from 'node:path'

/** Default directory names never walked into (matched by basename). */
const DEFAULT_IGNORES = [
  '.git',
  'node_modules',
  '.dsh-shots',
  '.pnpm-store',
  '.npm-cache',
  '.cache',
  '.turbo',
  '.next',
  'dist',
  'build',
  'out',
  'coverage',
  'lib',
  'tmp',
  '.scratch',
]

/** Config files summarized when present at the repository root. */
const CONFIG_CANDIDATES = [
  'tsconfig.json',
  'tsconfig.base.json',
  'tsconfig.host.json',
  'tsconfig.client.json',
  'pnpm-workspace.yaml',
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.ts',
  '.eslintrc.json',
  '.gitignore',
  '.prettierrc.json',
  'vitest.config.ts',
  'vitest.shared.ts',
  'CONTRIBUTING.md',
  'SAFETY.md',
  'lefthook.yml',
]

/** README candidates, in preference order. */
const README_CANDIDATES = ['README.md', 'README.zh.md', 'readme.md']

/** Scan knobs; defaults are tuned for a small-to-medium repository. */
export interface ScanOptions {
  /** Directory basenames skipped entirely. */
  ignore?: string[]
  /** Maximum tree entries rendered. */
  maxTreeEntries?: number
  /** Maximum tree depth. */
  maxDepth?: number
  /** Byte budget for the rendered tree (the tree is the last thing kept). */
  maxTreeBytes?: number
  /** Total summary byte budget; the final summary is cut to fit. */
  maxSummaryBytes?: number
  /** Byte budget for the README excerpt. */
  maxReadmeBytes?: number
  /** Byte budget for the existing AGENTS.md excerpt. */
  maxAgentsBytes?: number
  /** Byte budget per config file excerpt. */
  maxConfigBytes?: number
}

/** Result of one scan. */
export interface ScanResult {
  /** Absolute root that was scanned. */
  root: string
  /** Rendered directory tree (relative paths, one per line). */
  tree: string
  /** README excerpt (preferred candidate only). */
  readme: string
  /** package.json digest (selected fields only). */
  packageJson: string
  /** Config excerpts concatenated. */
  configs: string
  /** Existing root AGENTS.md excerpt, or an empty string. */
  existingAgents: string
  /** Combined Markdown summary; bounded by maxSummaryBytes. */
  summary: string
  /** True when any part was cut to fit a budget. */
  truncated: boolean
}

/** UTF-8 byte length of a string. */
function byteLength(text: string): number {
  return Buffer.byteLength(text, 'utf8')
}

/**
 * Slice a string to a byte budget on a valid UTF-8 boundary: the result
 * never ends inside a surrogate pair.
 */
function sliceToBytes(text: string, budget: number): string {
  if (byteLength(text) <= budget) return text
  let bytes = 0
  let end = 0
  for (; end < text.length; end++) {
    const code = text.charCodeAt(end)
    const size = code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0xd800 || code >= 0xe000 ? 3 : 4
    if (bytes + size > budget) break
    bytes += size
  }
  // Never leave a lone high surrogate: pull it back in.
  const last = charCodeAtSafe(text, end - 1)
  if (last >= 0xd800 && last < 0xdc00) end--
  return text.slice(0, end)
}

/** charCodeAt without throwing on -1. */
function charCodeAtSafe(text: string, index: number): number {
  return index < 0 ? -1 : text.charCodeAt(index)
}

/**
 * Cut a string to a byte budget, appending a notice when bytes were lost.
 * The notice itself counts toward the budget, so the returned text always
 * fits.
 */
function cutToBytes(text: string, budget: number, label: string): { text: string; cut: boolean } {
  if (byteLength(text) <= budget) return { text, cut: false }
  const comment = `\n… (${label} truncated at ${budget} bytes)`
  const contentBudget = Math.max(0, budget - byteLength(comment))
  return { text: sliceToBytes(text, contentBudget) + comment, cut: true }
}

/** A directory with more entries than this is collapsed instead of expanded. */
const COLLAPSE_AT = 40

/** Render a bounded tree of directory entries. */
async function renderTree(
  root: string,
  ignores: ReadonlySet<string>,
  maxTreeEntries: number,
  maxDepth: number,
  maxTreeBytes: number,
): Promise<{ tree: string; truncated: boolean }> {
  const lines: string[] = []
  let truncated = false
  let bytes = 0

  async function walk(dir: string, depth: number, prefix: string): Promise<void> {
    if (depth > maxDepth || lines.length >= maxTreeEntries) {
      truncated = true
      return
    }
    let entries: Dirent[]
    try {
      entries = (await readdir(dir, { withFileTypes: true }))
        .sort((a, b) => a.name.localeCompare(b.name))
    } catch {
      return // Unreadable directory: skip silently, it is not part of the summary.
    }
    for (const entry of entries) {
      if (lines.length >= maxTreeEntries) { truncated = true; return }
      if (entry.isDirectory() && ignores.has(entry.name)) continue
      const childPrefix = `${prefix}${entry.name}/`
      if (entry.isDirectory()) {
        // Collapse directories with lots of entries so one big subtree cannot
        // consume the whole tree budget (a monorepo's top level, node_modules-
        // like caches, generator output). The collapsed row keeps its count.
        let childCount: number | undefined
        try {
          if (depth <= 1) {
            childCount = (await readdir(join(dir, entry.name), { withFileTypes: true })).length
          }
        } catch {
          childCount = undefined
        }
        const line = childCount !== undefined && childCount > COLLAPSE_AT
          ? `${childPrefix} (collapsed, ${childCount} entries)`
          : childPrefix
        const lineBytes = byteLength(line) + 1 // + newline
        if (bytes + lineBytes > maxTreeBytes) { truncated = true; return }
        bytes += lineBytes
        lines.push(line)
        if (childCount === undefined || childCount <= COLLAPSE_AT) {
          await walk(join(dir, entry.name), depth + 1, childPrefix)
        }
        continue
      }
      const line = `${prefix}${entry.name}`
      const lineBytes = byteLength(line) + 1 // + newline
      if (bytes + lineBytes > maxTreeBytes) { truncated = true; return }
      bytes += lineBytes
      lines.push(line)
    }
  }

  await walk(root, 0, '')
  if (lines.length >= maxTreeEntries) truncated = true
  return { tree: lines.join('\n'), truncated }
}

/** Read the first existing candidate file. */
async function readFirst(root: string, candidates: string[]): Promise<string | null> {
  for (const name of candidates) {
    try {
      return await readFile(join(root, name), 'utf8')
    } catch {
      // Not present or not readable: try the next candidate.
    }
  }
  return null
}

/** Build a compact digest of package.json, selecting the fields that matter. */
function packageJsonDigest(raw: string): string {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return raw.slice(0, 4000)
  }
  if (typeof parsed !== 'object' || parsed === null) return ''
  const record = parsed as Record<string, unknown>
  const pick = <K extends string>(keys: readonly K[]): Partial<Record<K, unknown>> => {
    const out: Partial<Record<K, unknown>> = {}
    for (const key of keys) {
      if (record[key] !== undefined) out[key] = record[key]
    }
    return out
  }
  const digest = pick(['name', 'description', 'version', 'type', 'engines', 'private', 'workspaces'])
  const scripts = record.scripts as Record<string, unknown> | undefined
  const deps = record.dependencies as Record<string, unknown> | undefined
  const devDeps = record.devDependencies as Record<string, unknown> | undefined
  return JSON.stringify({ ...digest, scripts, dependencies: deps, devDependencies: devDeps }, null, 2)
}

/**
 * Scan a repository root and return a bounded Markdown summary.
 *
 * @param root Repository root to scan.
 * @param options Overrides for budgets and ignores.
 * @returns The scan result with a byte-bounded `summary`.
 */
export async function scanProject(root: string, options: ScanOptions = {}): Promise<ScanResult> {
  const ignores = new Set(options.ignore ?? DEFAULT_IGNORES)
  const maxTreeEntries = options.maxTreeEntries ?? 1200
  const maxDepth = options.maxDepth ?? 6
  const maxTreeBytes = options.maxTreeBytes ?? 6_000
  const maxSummaryBytes = options.maxSummaryBytes ?? 24_000
  const maxReadmeBytes = options.maxReadmeBytes ?? 8_000
  const maxAgentsBytes = options.maxAgentsBytes ?? 12_000
  const maxConfigBytes = options.maxConfigBytes ?? 4_000

  let truncated = false

  const { tree: rawTree, truncated: treeTruncated } = await renderTree(
    root, ignores, maxTreeEntries, maxDepth, maxTreeBytes,
  )
  truncated ||= treeTruncated
  const { text: tree, cut: treeCut } = cutToBytes(rawTree, maxTreeBytes, 'tree')
  truncated ||= treeCut

  let readme = ''
  {
    const raw = await readFirst(root, README_CANDIDATES)
    if (raw !== null) {
      const { text, cut } = cutToBytes(raw, maxReadmeBytes, 'README')
      readme = text
      truncated ||= cut
    }
  }

  let packageJson = ''
  {
    try {
      const raw = await readFile(join(root, 'package.json'), 'utf8')
      packageJson = packageJsonDigest(raw)
    } catch {
      packageJson = ''
    }
  }

  let configs = ''
  for (const name of CONFIG_CANDIDATES) {
    try {
      const raw = await readFile(join(root, name), 'utf8')
      const { text, cut } = cutToBytes(raw, maxConfigBytes, name)
      configs += `### ${name}\n\n${text}\n\n`
      truncated ||= cut
    } catch {
      // Config file absent: skip.
    }
  }

  let existingAgents = ''
  {
    const raw = await readFirst(root, ['AGENTS.md'])
    if (raw !== null) {
      const { text, cut } = cutToBytes(raw, maxAgentsBytes, 'AGENTS.md')
      existingAgents = text
      truncated ||= cut
    }
  }

  // Priority order in the summary: facts (package.json, configs, existing
  // AGENTS.md, README) first; the tree is the lowest priority and is cut first.
  const parts = [
    `## Repository scan summary (${root})`,
    '',
  ]
  if (packageJson !== '') {
    parts.push('### package.json', '', '```json', packageJson, '```', '')
  }
  if (configs !== '') {
    parts.push('### Selected config files', '', configs)
  }
  if (existingAgents !== '') {
    parts.push('### Existing AGENTS.md', '', existingAgents, '')
  }
  if (readme !== '') {
    parts.push('### README excerpt', '', readme, '')
  }
  parts.push('### Directory tree', '', '```text', tree, '```', '')

  let summary = parts.join('\n')
  const { text, cut } = cutToBytes(summary, maxSummaryBytes, 'summary')
  summary = text
  truncated ||= cut

  return {
    root,
    tree,
    readme,
    packageJson,
    configs,
    existingAgents,
    summary,
    truncated,
  }
}

