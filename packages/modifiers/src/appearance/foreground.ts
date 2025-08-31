/**
 * Foreground Modifiers
 *
 * Text color and foreground styling modifiers
 */

import { BaseModifier } from '@tachui/core/modifiers/base'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'

export interface ForegroundOptions {
  color: string
}

export class ForegroundModifier extends BaseModifier<ForegroundOptions> {
  readonly type = 'foreground'
  readonly priority = 90

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const element = context.element as HTMLElement
    element.style.color = this.properties.color

    return undefined
  }
}

export type LineClampValue = number

export interface LineClampOptions {
  lines: LineClampValue
}

export class LineClampModifier extends BaseModifier<LineClampOptions> {
  readonly type = 'lineClamp'
  readonly priority = 85

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const { lines } = this.properties
    const styles = this.generateLineClampStyles(lines)
    this.applyStyles(context.element, styles)

    return undefined
  }

  private generateLineClampStyles(lines: number): Record<string, string> {
    const styles: Record<string, string> = {}

    styles.display = '-webkit-box'
    styles.webkitLineClamp = String(lines)
    styles.webkitBoxOrient = 'vertical'
    styles.overflow = 'hidden'
    styles.textOverflow = 'ellipsis'
    styles.wordWrap = 'break-word'

    return styles
  }
}

export type WordBreakValue = 'normal' | 'break-all' | 'keep-all' | 'break-word'

export interface WordBreakOptions {
  wordBreak: WordBreakValue
}

export class WordBreakModifier extends BaseModifier<WordBreakOptions> {
  readonly type = 'wordBreak'
  readonly priority = 80

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    this.applyStyles(context.element, { wordBreak: this.properties.wordBreak })

    return undefined
  }
}

export function foregroundColor(color: string): ForegroundModifier {
  return new ForegroundModifier({ color })
}

export function foreground(color: string): ForegroundModifier {
  return new ForegroundModifier({ color })
}

export function lineClamp(lines: number): LineClampModifier {
  return new LineClampModifier({ lines })
}

export function wordBreak(value: WordBreakValue): WordBreakModifier {
  return new WordBreakModifier({ wordBreak: value })
}
