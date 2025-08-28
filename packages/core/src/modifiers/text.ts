/**
 * Text Modifiers Implementation
 *
 * Specialized text handling modifiers including line clamping, word breaking,
 * overflow wrapping, and hyphenation control for enhanced typography.
 */

import type { DOMNode } from '../runtime/types'
import { BaseModifier } from './base'
import type { ModifierContext, ReactiveModifierProps } from './types'
import { ModifierPriority } from './types'

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
      console.warn('TachUI LineClamp Modifier: lines must be a positive integer')
      return
    }

    if (lines > 10) {
      console.info('TachUI LineClamp Modifier: Large line clamp values (>10) may impact readability. Consider if this is intentional.')
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
    const validValues: WordBreakValue[] = ['normal', 'break-all', 'keep-all', 'break-word']
    
    if (!validValues.includes(value as WordBreakValue)) {
      console.warn(`TachUI WordBreak Modifier: Invalid word-break value "${value}". Valid values are: ${validValues.join(', ')}`)
    }

    if (value === 'break-word') {
      console.info('TachUI WordBreak Modifier: "break-word" is deprecated. Consider using overflowWrap("break-word") instead.')
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

export type ReactiveOverflowWrapOptions = ReactiveModifierProps<OverflowWrapOptions>

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
    const validValues: OverflowWrapValue[] = ['normal', 'break-word', 'anywhere']
    
    if (!validValues.includes(value as OverflowWrapValue)) {
      console.warn(`TachUI OverflowWrap Modifier: Invalid overflow-wrap value "${value}". Valid values are: ${validValues.join(', ')}`)
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
      msHyphens: hyphens
    })
    
    return undefined
  }

  private validateHyphens(value: string): void {
    const validValues: HyphensValue[] = ['none', 'manual', 'auto']
    
    if (!validValues.includes(value as HyphensValue)) {
      console.warn(`TachUI Hyphens Modifier: Invalid hyphens value "${value}". Valid values are: ${validValues.join(', ')}`)
    }

    if (value === 'auto') {
      console.info('TachUI Hyphens Modifier: Automatic hyphenation requires proper lang attribute on the document or element for best results.')
    }
  }
}

/**
 * Hyphens modifier function
 */
export function hyphens(value: HyphensValue): HyphensModifier {
  return new HyphensModifier({ hyphens: value })
}

// ============================================================================
// Background Clip Modifier (Moved from css-features.ts)
// ============================================================================

export interface BackgroundClipOptions {
  backgroundImage?: string
  backgroundClip?: 'text' | 'border-box' | 'padding-box' | 'content-box'
  color?: string
  webkitBackgroundClip?: string
  webkitTextFillColor?: string
}

export type ReactiveBackgroundClipOptions = ReactiveModifierProps<BackgroundClipOptions>

export class BackgroundClipModifier extends BaseModifier<BackgroundClipOptions> {
  readonly type = 'backgroundClip'
  readonly priority = 40

  constructor(options: ReactiveBackgroundClipOptions) {
    const resolvedOptions: BackgroundClipOptions = {}
    for (const [key, value] of Object.entries(options)) {
      if (typeof value === 'function' && 'peek' in value) {
        ;(resolvedOptions as any)[key] = (value as any).peek()
      } else {
        ;(resolvedOptions as any)[key] = value
      }
    }
    super(resolvedOptions)
  }

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const styles = this.computeBackgroundClipStyles(this.properties)
    this.applyStyles(context.element, styles)
    
    return undefined
  }

  private computeBackgroundClipStyles(props: BackgroundClipOptions) {
    const styles: Record<string, string> = {}

    if (props.backgroundImage) {
      styles.backgroundImage = props.backgroundImage
    }

    if (props.backgroundClip) {
      styles.backgroundClip = props.backgroundClip
      // Add webkit prefix for better browser support
      styles.webkitBackgroundClip = props.backgroundClip
    }

    if (props.color) {
      styles.color = props.color
      // For text clipping, often need webkit-text-fill-color
      if (props.backgroundClip === 'text') {
        styles.webkitTextFillColor = props.color
      }
    }

    // Add webkit-specific properties if provided
    if (props.webkitBackgroundClip) {
      styles.webkitBackgroundClip = props.webkitBackgroundClip
    }

    if (props.webkitTextFillColor) {
      styles.webkitTextFillColor = props.webkitTextFillColor
    }

    return styles
  }
}

/**
 * Background clip modifier for advanced text effects
 *
 * @example
 * ```typescript
 * .backgroundClip(
 *   'linear-gradient(45deg, #007AFF, #34C759)',
 *   'text',
 *   'transparent'
 * )
 * ```
 */
export function backgroundClip(
  backgroundImage: string,
  clip: 'text' | 'border-box' | 'padding-box' | 'content-box' = 'text',
  color: string = 'transparent'
): BackgroundClipModifier {
  return new BackgroundClipModifier({
    backgroundImage,
    backgroundClip: clip,
    color,
    webkitBackgroundClip: clip,
    webkitTextFillColor: color
  })
}

/**
 * Gradient text modifier - creates text with gradient colors
 *
 * @example
 * ```typescript
 * .gradientText('linear-gradient(45deg, #007AFF, #34C759)')
 * .gradientText('radial-gradient(circle, #ff6b6b, #4ecdc4)')
 * .gradientText('linear-gradient(90deg, #667eea 0%, #764ba2 100%)')
 * ```
 */
export function gradientText(gradient: string): BackgroundClipModifier {
  return new BackgroundClipModifier({
    backgroundImage: gradient,
    backgroundClip: 'text',
    color: 'transparent',
    webkitBackgroundClip: 'text',
    webkitTextFillColor: 'transparent'
  })
}

/**
 * Background image modifier for text styling
 *
 * @example
 * ```typescript
 * .backgroundImage('url(texture.jpg)')
 * .backgroundImage('linear-gradient(to right, #667eea, #764ba2)')
 * ```
 */
export function backgroundImage(image: string): BackgroundClipModifier {
  return new BackgroundClipModifier({ backgroundImage: image })
}

// ============================================================================
// Common Gradient Text Presets
// ============================================================================

/**
 * Blue to purple gradient text
 */
export function blueGradientText(): BackgroundClipModifier {
  return gradientText('linear-gradient(45deg, #007AFF, #5856D6)')
}

/**
 * Rainbow gradient text
 */
export function rainbowGradientText(): BackgroundClipModifier {
  return gradientText('linear-gradient(90deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff80, #0080ff, #8000ff)')
}

/**
 * Warm sunset gradient text
 */
export function sunsetGradientText(): BackgroundClipModifier {
  return gradientText('linear-gradient(45deg, #ff6b6b, #feca57, #ff9ff3)')
}

/**
 * Cool ocean gradient text
 */
export function oceanGradientText(): BackgroundClipModifier {
  return gradientText('linear-gradient(45deg, #667eea, #764ba2)')
}

/**
 * Green nature gradient text
 */
export function natureGradientText(): BackgroundClipModifier {
  return gradientText('linear-gradient(45deg, #56ab2f, #a8e6cf)')
}

/**
 * Gold metallic gradient text
 */
export function goldGradientText(): BackgroundClipModifier {
  return gradientText('linear-gradient(45deg, #f7971e, #ffd200)')
}

/**
 * Silver metallic gradient text  
 */
export function silverGradientText(): BackgroundClipModifier {
  return gradientText('linear-gradient(45deg, #bdc3c7, #2c3e50)')
}