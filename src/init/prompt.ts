/**
 * Task-message construction for the dsh-init command.
 *
 * The shell command handler never runs a model itself: it hands the scanned
 * repository summary to the receiving agent as a model-visible message
 * (`agent.steer`), and the agent loop takes over — asking the user about an
 * existing AGENTS.md, generating the file with its own tools, and iterating on
 * refinement requests. This mirrors how `dsh-plan-mode` submits the optional
 * `/plan` message.
 *
 * @module dsh-extend/init/prompt
 */

import { join } from 'node:path'
import { createUserMessage, type UserMessage } from './message.ts'
import type { ScanResult } from './scan.ts'

/** Task instructions embedded in the steered message. */
export function buildInitTaskText(scan: ScanResult, userInput: string): string {
  const extra = userInput.trim()
  const target = join(scan.root, 'AGENTS.md')
  return [
    '# Task: generate or update AGENTS.md for this repository',
    '',
    'Create or update the repository-root `AGENTS.md`. AGENTS.md is dsh\'s native',
    'project instruction file: it is loaded into the agent context every session,',
    'subject to byte-budget truncation, so it must stay concise and factual.',
    '',
    `The repository root for this task is this exact absolute directory: ${scan.root}`,
    `The file to create or update is at this exact absolute path: ${target}`,
    'Write only to that path. Never place AGENTS.md in a subdirectory or in a nested',
    'Git repository — the scanned root above is authoritative.',
    '',
    'Cover the sections that apply to this repository (skip what does not):',
    '1. **Project overview** — what this repository is, two or three sentences.',
    '2. **Common commands** — install, build, test, lint, run, using the exact',
    '   scripts declared in package.json.',
    '3. **Code style conventions** — formatting, language, naming, import rules,',
    '   enforcement tools.',
    '4. **Architecture notes** — layout, key modules and how they relate, known',
    '   extension points or seams.',
    '5. **Important cautions** — invariants, secrets, required gates or build',
    '   steps that must not be skipped.',
    '',
    'Process:',
    '- Read the scan summary below, then read key files yourself (README,',
    '  package.json, configs) to verify or extend it.',
    '- If an AGENTS.md already exists, ask the user first how to proceed',
    '  (overwrite / merge / append / skip) and wait for the answer.',
    '- Ask the user one to three short questions about anything ambiguous before',
    '  writing (language, audience, missing sections).',
    '- Write the file with your normal file tools. Keep it under ~200 lines, one',
    '  fact per line, no project history narration.',
    '- After writing, summarize what you produced and offer refinements; the user',
    '  can keep asking for changes.',
    '',
    extra === '' ? '' : `User\'s extra request: ${extra}`,
    '',
    '--- Repository scan summary ---',
    scan.summary,
  ].filter(line => line !== '').join('\n')
}

/**
 * Build the model-visible task message steered to the receiving agent.
 *
 * @param scan The scanned repository summary.
 * @param userInput Raw text following `/init`, if any.
 * @returns The user message accepted by `agent.steer`.
 */
export function buildInitMessage(scan: ScanResult, userInput: string): UserMessage {
  return createUserMessage({
    content: [{ type: 'text', text: buildInitTaskText(scan, userInput) }],
    source: {
      kind: 'dsh-extend',
      form: 'notice',
      summary: 'Generate or update the repository AGENTS.md (init).',
    },
  })
}


