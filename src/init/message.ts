/**
 * Local equivalent of `@deepseek-ai/dsh-llm`'s `createUserMessage`.
 *
 * The plugin cannot statically import `@deepseek-ai/dsh-llm`: the vendored
 * harness packages are not published yet, and a standalone plugin directory
 * has no resolvable copy. The official helper is tiny and self-contained —
 * see `packages/llm/llm/src/message.ts` in the harness: it adds a fresh
 * `id`, sets `role: 'user'`, and freezes the message before publication.
 *
 * This module reproduces exactly that contract (verified against the harness
 * source) so the plugin stays dependency-free at runtime. When the dsh
 * packages are published, replace this with the official import.
 *
 * @module dsh-extend/init/message
 */

import { randomUUID } from 'node:crypto'

/** A freezable content block used by the plugin's messages. */
export interface TextBlock {
  readonly type: 'text'
  readonly text: string
}

/**
 * Source describing which producer emitted the message.
 *
 * The harness declares sources as a merge-extensible map keyed by `kind` —
 * every producer declares its own kind in its own module, and there is no
 * catch-all `plugin` kind (`MessageSourceMap` in
 * `packages/llm/llm/src/message.ts`). Session format V4 enforces that at
 * message admission: a durable message whose `source.kind` is missing, empty,
 * or the retired `{ kind: 'plugin', plugin: '<name>' }` wrapper fails the turn
 * with `format v4 message requires a producer-owned source kind`. Naming this
 * plugin's own kind makes the retired form unrepresentable.
 */
export interface MessageSource {
  /** 本插件的生产者 kind（会话格式 V4 要求非空且非 plugin 包装）。 */
  readonly kind: 'dsh-extend'
  /** The `notice` form: a one-off account of something that happened. */
  readonly form: 'notice'
  /** One-line account of the steered task, within the harness's 120-character notice bound. */
  readonly summary: string
}

/** The user message shape consumed by `agent.steer`. */
export interface UserMessage {
  readonly id: string
  readonly role: 'user'
  readonly content: readonly TextBlock[]
  readonly source: MessageSource
}

/** Deep-freeze an object graph, mirroring the harness's `deepFreeze` for the plugin's plain data. */
function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value
  Object.freeze(value)
  for (const child of Object.values(value)) deepFreeze(child)
  return value
}

/** Detach a message into an immutable snapshot (mirrors the harness's `deepFreeze` + `structuredClone`). */
function freezeMessage<T>(message: T): T {
  return deepFreeze(structuredClone(message) as T)
}

/**
 * Create one user-role message with a fresh identity and frozen content.
 *
 * @param input - Complete content and source for a new user message.
 * @returns An immutable user message with a fresh stable id.
 */
export function createUserMessage(input: {
  readonly content: readonly TextBlock[]
  readonly source: MessageSource
}): UserMessage {
  return freezeMessage({
    ...input,
    id: randomUUID(),
    role: 'user',
  })
}

