/** 把用户覆盖应用到一次系统提示词组装结果。 */
import type { PromptState } from './state.ts'

/** 组装结果中的一段（最小面）。 */
export interface PromptSectionLike {
  name: string
  text: string
  interpolate?: boolean
}

/** 组装结果（最小面）。 */
export interface PromptPresentationLike {
  sections: PromptSectionLike[]
}

/** 已组装段摘要（面板列表用）。 */
export interface AssembledSectionSummary {
  readonly name: string
  readonly size: number
  readonly overridden: boolean
  readonly disabled: boolean
  /** 当前生效文本（优先用户覆盖）。 */
  readonly text: string
}

/**
 * 按状态过滤、替换并追加段落；原地修改并返回同一个对象。
 * @param presentation 组装结果。
 * @param state 覆盖状态。
 * @returns 修改后的组装结果。
 */
export function applyPromptOverrides<T extends PromptPresentationLike>(presentation: T, state: PromptState): T {
  const disabled = new Set(state.disabled)
  const sections: PromptSectionLike[] = []
  for (const section of presentation.sections) {
    if (disabled.has(section.name)) continue
    const replacement = state.replacements[section.name]
    sections.push(replacement === undefined
      ? section
      : { ...section, text: replacement, interpolate: false })
  }
  for (const custom of state.custom) {
    if (!custom.enabled) continue
    sections.push({
      name: `dsh-extend:custom:${custom.id}`,
      text: custom.text,
      interpolate: false,
    })
  }
  presentation.sections = sections
  return presentation
}

/**
 * 汇总官方段（默认组装结果 + 当前覆盖状态）。
 * @param sections 默认组装出的段。
 * @param state 覆盖状态。
 * @returns 列表摘要。
 */
export function summarizeAssembled(
  sections: readonly PromptSectionLike[],
  state: PromptState,
): AssembledSectionSummary[] {
  return sections.map((section) => ({
    name: section.name,
    size: Buffer.byteLength(currentSectionText(section.name, section.text, state), 'utf8'),
    overridden: Object.hasOwn(state.replacements, section.name),
    disabled: state.disabled.includes(section.name),
    text: currentSectionText(section.name, section.text, state),
  }))
}

/**
 * 取某段的当前文本（优先用户覆盖）。
 * @param name 段名。
 * @param defaultText 默认文本。
 * @param state 覆盖状态。
 * @returns 文本。
 */
export function currentSectionText(name: string, defaultText: string, state: PromptState): string {
  return state.replacements[name] ?? defaultText
}


