/**
 * Text Modifiers Implementation
 *
 * Specialized text handling modifiers including line clamping, word breaking,
 * overflow wrapping, and hyphenation control for enhanced typography.
 */

import type { DOMNode } from '@tachui/types/runtime'
import { BaseModifier } from '../basic/base'
import type {
  ModifierContext,
  ReactiveModifierProps,
} from '@tachui/types/modifiers'
import { ModifierPriority } from '@tachui/types/modifiers'

// ============================================================================
// Line Clamp Modifier - Multi-line Text Truncation
// ============================================================================

export interface LineClampOptions {
  lines: number
}

export type ReactiveLineClampOptions = ReactiveModifierProps<LineClampOptions>

export class LineClampModifier extends BaseModifier<LineClampOptions> {
  readonly type = 'lineClamp'
  readonly priority = ModifierPriority.APPEARANCE + 15

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const { lines } = this.properties

    // Validate lines in development mode
    if (process.env.NODE_ENV === 'development') {
      this.validateLines(lines)
    }

    // Apply line clamp styles
    const styles = this.generateLineClampStyles(lines)
    this.applyStyles(context.element, styles)

    return undefined
  }

  private generateLineClampStyles(lines: number): Record<string, string> {
    const styles: Record<string, string> = {}

    // Modern browsers: Use -webkit-line-clamp
    styles.display = '-webkit-box'
    styles.webkitLineClamp = String(lines)
    styles.webkitBoxOrient = 'vertical'
    styles.overflow = 'hidden'

    // Additional properties for better cross-browser support
    styles.textOverflow = 'ellipsis'
    styles.wordWrap = 'break-word'

    return styles
  }

  private validateLines(lines: number): void {
    if (typeof lines !== 'number' || !Number.isInteger(lines) || lines < 1) {
      console.warn(
        'TachUI LineClamp Modifier: lines must be a positive integer'
      )
      return
    }

    if (lines > 10) {
      console.info(
        'TachUI LineClamp Modifier: Large line clamp values (>10) may impact readability. Consider if this is intentional.'
      )
    }
  }
}

/**
 * Line clamp modifier function - SwiftUI .lineLimit() equivalent
 */
export function lineClamp(lines: number): LineClampModifier {
  return new LineClampModifier({ lines })
}

// ============================================================================
// Word Break Modifier - Word Breaking Behavior
// ============================================================================

export type WordBreakValue = 'normal' | 'break-all' | 'keep-all' | 'break-word'

export interface WordBreakOptions {
  wordBreak: WordBreakValue
}

export type ReactiveWordBreakOptions = ReactiveModifierProps<WordBreakOptions>

export class WordBreakModifier extends BaseModifier<WordBreakOptions> {
  readonly type = 'wordBreak'
  readonly priority = ModifierPriority.APPEARANCE + 8

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const { wordBreak } = this.properties

    // Validate word break value in development mode
    if (process.env.NODE_ENV === 'development') {
      this.validateWordBreak(wordBreak)
    }

    this.applyStyles(context.element, { wordBreak })

    return undefined
  }

  private validateWordBreak(value: string): void {
    const validValues: WordBreakValue[] = [
      'normal',
      'break-all',
      'keep-all',
      'break-word',
    ]

    if (!validValues.includes(value as WordBreakValue)) {
      console.warn(
        `TachUI WordBreak Modifier: Invalid word-break value "${value}". Valid values are: ${validValues.join(', ')}`
      )
    }

    if (value === 'break-word') {
      console.info(
        'TachUI WordBreak Modifier: "break-word" is deprecated. Consider using overflowWrap("break-word") instead.'
      )
    }
  }
}

/**
 * Word break modifier function
 */
export function wordBreak(value: WordBreakValue): WordBreakModifier {
  return new WordBreakModifier({ wordBreak: value })
}

// ============================================================================
// Overflow Wrap Modifier - Word Wrapping
// ============================================================================

export type OverflowWrapValue = 'normal' | 'break-word' | 'anywhere'

export interface OverflowWrapOptions {
  overflowWrap: OverflowWrapValue
}

export type ReactiveOverflowWrapOptions =
  ReactiveModifierProps<OverflowWrapOptions>

export class OverflowWrapModifier extends BaseModifier<OverflowWrapOptions> {
  readonly type = 'overflowWrap'
  readonly priority = ModifierPriority.APPEARANCE + 9

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const { overflowWrap } = this.properties

    // Validate overflow wrap value in development mode
    if (process.env.NODE_ENV === 'development') {
      this.validateOverflowWrap(overflowWrap)
    }

    this.applyStyles(context.element, { overflowWrap })

    return undefined
  }

  private validateOverflowWrap(value: string): void {
    const validValues: OverflowWrapValue[] = [
      'normal',
      'break-word',
      'anywhere',
    ]

    if (!validValues.includes(value as OverflowWrapValue)) {
      console.warn(
        `TachUI OverflowWrap Modifier: Invalid overflow-wrap value "${value}". Valid values are: ${validValues.join(', ')}`
      )
    }
  }
}

/**
 * Overflow wrap modifier function
 */
export function overflowWrap(value: OverflowWrapValue): OverflowWrapModifier {
  return new OverflowWrapModifier({ overflowWrap: value })
}

// ============================================================================
// Hyphens Modifier - Hyphenation Control
// ============================================================================

export type HyphensValue = 'none' | 'manual' | 'auto'

export interface HyphensOptions {
  hyphens: HyphensValue
}

export type ReactiveHyphensOptions = ReactiveModifierProps<HyphensOptions>

export class HyphensModifier extends BaseModifier<HyphensOptions> {
  readonly type = 'hyphens'
  readonly priority = ModifierPriority.APPEARANCE + 10

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const { hyphens } = this.properties

    // Validate hyphens value in development mode
    if (process.env.NODE_ENV === 'development') {
      this.validateHyphens(hyphens)
    }

    this.applyStyles(context.element, {
      hyphens,
      // Add vendor prefixes for better browser support
      webkitHyphens: hyphens,
      msHyphens: hyphens,
    })

    return undefined
  }

  private validateHyphens(value: string): void {
    const validValues: HyphensValue[] = ['none', 'manual', 'auto']

    if (!validValues.includes(value as HyphensValue)) {
      console.warn(
        `TachUI Hyphens Modifier: Invalid hyphens value "${value}". Valid values are: ${validValues.join(', ')}`
      )
    }

    if (value === 'auto') {
      console.info(
        'TachUI Hyphens Modifier: Automatic hyphenation requires proper lang attribute on the document or element for best results.'
      )
    }
  }
}

/**
 * Hyphens modifier function
 */
export function hyphens(value: HyphensValue): HyphensModifier {
  return new HyphensModifier({ hyphens: value })
}

// Note: Background clip modifiers are already available in the appearance package
// Import them from @tachui/modifiers/appearance for gradient text effects
