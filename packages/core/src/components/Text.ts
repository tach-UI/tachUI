/**
 * Enhanced Text Component (Phase 5.1)
 *
 * SwiftUI-inspired Text component with full typography support,
 * text formatting, and advanced styling capabilities.
 */

import type { ModifiableComponent, ModifierBuilder } from '../modifiers/types'
import type { Signal } from '../reactive/types'
import { h, text } from '../runtime'
import type { ComponentInstance, ComponentProps } from '../runtime/types'
import { withModifiers } from './wrapper'
import type { 
  Concatenatable, 
  ComponentSegment, 
  ConcatenationMetadata 
} from '../concatenation/types'
import { ConcatenatedComponent } from '../concatenation/concatenated-component'
import { 
  processElementOverride, 
  type ElementOverrideProps 
} from '../runtime/element-override'
import {
  ComponentWithCSSClasses,
  type CSSClassesProps
} from '../css-classes'


/**
 * Text component properties with element override support and CSS classes
 */
export interface TextProps extends ComponentProps, ElementOverrideProps, CSSClassesProps {
  content?: string | (() => string) | Signal<string>

  // Typography
  font?: {
    family?: string
    size?: number | string
    weight?:
      | 'normal'
      | 'bold'
      | '100'
      | '200'
      | '300'
      | '400'
      | '500'
      | '600'
      | '700'
      | '800'
      | '900'
    style?: 'normal' | 'italic' | 'oblique'
    variant?: 'normal' | 'small-caps'
  }

  // Text styling
  color?: string | Signal<string>
  backgroundColor?: string | Signal<string>
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  textDecoration?: 'none' | 'underline' | 'line-through' | 'overline'
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  lineHeight?: number | string
  letterSpacing?: number | string
  wordSpacing?: number | string

  // Layout
  lineLimit?: number
  truncationMode?: 'head' | 'tail' | 'middle'
  allowsSelection?: boolean

  // Accessibility
  accessibilityLabel?: string
  accessibilityRole?: 'text' | 'heading' | 'label'
  accessibilityLevel?: 1 | 2 | 3 | 4 | 5 | 6

  // Interactive
  onTap?: () => void
  onLongPress?: () => void
}

/**
 * Text formatting options
 */
export interface TextFormatting {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  monospace?: boolean
  smallCaps?: boolean
}

/**
 * Typography presets following SwiftUI patterns
 */
export const Typography = {
  largeTitle: { size: 34, weight: '400' as const, lineHeight: 1.2 },
  title: { size: 28, weight: '400' as const, lineHeight: 1.3 },
  title2: { size: 22, weight: '400' as const, lineHeight: 1.3 },
  title3: { size: 20, weight: '400' as const, lineHeight: 1.4 },
  headline: { size: 17, weight: '600' as const, lineHeight: 1.4 },
  body: { size: 17, weight: '400' as const, lineHeight: 1.5 },
  callout: { size: 16, weight: '400' as const, lineHeight: 1.4 },
  subheadline: { size: 15, weight: '400' as const, lineHeight: 1.4 },
  footnote: { size: 13, weight: '400' as const, lineHeight: 1.3 },
  caption: { size: 12, weight: '400' as const, lineHeight: 1.2 },
  caption2: { size: 11, weight: '400' as const, lineHeight: 1.1 },
}

/**
 * Enhanced Text component class with reactive content handling, concatenation support, element override, and CSS classes
 */
export class EnhancedText extends ComponentWithCSSClasses implements ComponentInstance<TextProps>, Concatenatable<TextProps> {
  public readonly type = 'component' as const
  public readonly id: string
  public mounted = false
  public cleanup: (() => void)[] = []
  private effectiveTag: string
  private validationResult: any

  constructor(public props: TextProps) {
    super()
    this.id = `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Process element override for tag specification enhancement
    const override = processElementOverride('Text', 'span', this.props.element)
    this.effectiveTag = override.tag
    this.validationResult = override.validation
  }


  /**
   * Render the text component with reactive content handling, element override support, and CSS classes
   */
  render() {
    // Process CSS classes for this component
    const baseClasses = ['tachui-text']
    const classString = this.createClassString(this.props, baseClasses)
    
    // Let the runtime's text() helper handle all reactive detection
    // Pass the original content prop directly without resolving
    const element = h(
      this.effectiveTag,
      {
        className: classString,
        // Pass through debug label for debug system
        ...(this.props.debugLabel && { debugLabel: this.props.debugLabel }),
      },
      text(this.props.content || '')
    )

    // Add component metadata for debug system and semantic role processing
    if ('componentMetadata' in element) {
      element.componentMetadata = {
        id: this.id,
        type: 'Text',
        originalType: 'Text',
        overriddenTo: this.effectiveTag !== 'span' ? this.effectiveTag : undefined,
        validationResult: this.validationResult
      }
    } else {
      ;(element as any).componentMetadata = {
        id: this.id,
        type: 'Text',
        originalType: 'Text',
        overriddenTo: this.effectiveTag !== 'span' ? this.effectiveTag : undefined,
        validationResult: this.validationResult
      }
    }

    // Note: Styling is applied through the modifier system after DOM creation
    // The .element property isn't available during render phase

    return [element]
  }

  /**
   * Concatenate this text component with another concatenatable component
   */
  concat<U extends Concatenatable<any>>(other: U): ConcatenatedComponent<TextProps | U> {
    const thisSegment = this.toSegment()
    const otherSegment = other.toSegment()
    
    // Determine metadata based on what we're concatenating with
    const metadata: ConcatenationMetadata = {
      totalSegments: other instanceof ConcatenatedComponent 
        ? other.segments.length + 1
        : 2,
      accessibilityRole: other instanceof ConcatenatedComponent
        ? this.mergeAccessibilityRoles('text', other.metadata.accessibilityRole)
        : this.determineAccessibilityRole(other),
      semanticStructure: other instanceof ConcatenatedComponent
        ? this.mergeSemanticStructures('inline', other.metadata.semanticStructure)
        : this.determineSemanticStructure(other)
    }
    
    // If other is already concatenated, merge with its segments
    if (other instanceof ConcatenatedComponent) {
      return new ConcatenatedComponent([thisSegment, ...other.segments], metadata)
    }
    
    return new ConcatenatedComponent([thisSegment, otherSegment], metadata)
  }
  
  /**
   * Convert this text component to a segment for concatenation
   */
  toSegment(): ComponentSegment {
    return {
      id: this.id,
      component: this,
      modifiers: (this as any).modifiers || [],
      render: () => this.render()[0]
    }
  }
  
  /**
   * Check if this component supports concatenation
   */
  isConcatenatable(): boolean {
    return true
  }

  /**
   * Get the text content for accessibility purposes
   */
  getTextContent(): string {
    const content = this.props.content
    if (typeof content === 'string') return content
    if (typeof content === 'function') return content()
    if (content && typeof content === 'object' && 'peek' in content) {
      return (content as any).peek() || ''
    }
    return ''
  }

  /**
   * Determine accessibility role when concatenating with another component
   */
  private determineAccessibilityRole<U>(other: Concatenatable<U>): 'text' | 'group' | 'composite' {
    const otherType = other.constructor.name
    
    // Text + Text = text
    if (otherType === 'EnhancedText') return 'text'
    
    // Text + Interactive elements = group
    if (otherType === 'EnhancedButton' || otherType === 'EnhancedLink') return 'group'
    
    // Text + Other = group (images, etc.)
    return 'group'
  }

  /**
   * Determine semantic structure when concatenating with another component
   */
  private determineSemanticStructure<U>(other: Concatenatable<U>): 'inline' | 'block' | 'mixed' {
    const otherType = other.constructor.name
    
    // Text + Text/Image = inline
    if (otherType === 'EnhancedText' || otherType === 'EnhancedImage') return 'inline'
    
    // Text + Interactive elements usually inline in concatenation context
    if (otherType === 'EnhancedButton' || otherType === 'EnhancedLink') return 'inline'
    
    // Other combinations are mixed
    return 'mixed'
  }

  /**
   * Merge accessibility roles
   */
  private mergeAccessibilityRoles(
    thisRole: 'text' | 'group' | 'composite',
    otherRole: 'text' | 'group' | 'composite'
  ): 'text' | 'group' | 'composite' {
    // If both are text, keep text
    if (thisRole === 'text' && otherRole === 'text') return 'text'
    
    // If either is composite, result is composite
    if (thisRole === 'composite' || otherRole === 'composite') return 'composite'
    
    // Otherwise, it's a group
    return 'group'
  }

  /**
   * Merge semantic structures
   */
  private mergeSemanticStructures(
    thisStructure: 'inline' | 'block' | 'mixed',
    otherStructure: 'inline' | 'block' | 'mixed'
  ): 'inline' | 'block' | 'mixed' {
    // If both are inline, keep inline
    if (thisStructure === 'inline' && otherStructure === 'inline') return 'inline'
    
    // If both are block, keep block
    if (thisStructure === 'block' && otherStructure === 'block') return 'block'
    
    // Otherwise, it's mixed
    return 'mixed'
  }
}

/**
 * Create enhanced Text component with modifier support
 */
export function Text(
  content: string | (() => string) | Signal<string>,
  props: Omit<TextProps, 'content'> = {}
): ModifiableComponent<TextProps> & { modifier: ModifierBuilder<ModifiableComponent<TextProps>> } {
  const textProps: TextProps = { ...props, content }
  const component = new EnhancedText(textProps)
  return withModifiers(component)
}

/**
 * Typography preset components
 */
export const TextStyles = {
  LargeTitle: (
    content: string | (() => string) | Signal<string>,
    props: Omit<TextProps, 'content' | 'font'> = {}
  ) => Text(content, { ...props, font: Typography.largeTitle }),

  Title: (
    content: string | (() => string) | Signal<string>,
    props: Omit<TextProps, 'content' | 'font'> = {}
  ) => Text(content, { ...props, font: Typography.title }),

  Title2: (
    content: string | (() => string) | Signal<string>,
    props: Omit<TextProps, 'content' | 'font'> = {}
  ) => Text(content, { ...props, font: Typography.title2 }),

  Title3: (
    content: string | (() => string) | Signal<string>,
    props: Omit<TextProps, 'content' | 'font'> = {}
  ) => Text(content, { ...props, font: Typography.title3 }),

  Headline: (
    content: string | (() => string) | Signal<string>,
    props: Omit<TextProps, 'content' | 'font'> = {}
  ) => Text(content, { ...props, font: Typography.headline }),

  Body: (
    content: string | (() => string) | Signal<string>,
    props: Omit<TextProps, 'content' | 'font'> = {}
  ) => Text(content, { ...props, font: Typography.body }),

  Callout: (
    content: string | (() => string) | Signal<string>,
    props: Omit<TextProps, 'content' | 'font'> = {}
  ) => Text(content, { ...props, font: Typography.callout }),

  Subheadline: (
    content: string | (() => string) | Signal<string>,
    props: Omit<TextProps, 'content' | 'font'> = {}
  ) => Text(content, { ...props, font: Typography.subheadline }),

  Footnote: (
    content: string | (() => string) | Signal<string>,
    props: Omit<TextProps, 'content' | 'font'> = {}
  ) => Text(content, { ...props, font: Typography.footnote }),

  Caption: (
    content: string | (() => string) | Signal<string>,
    props: Omit<TextProps, 'content' | 'font'> = {}
  ) => Text(content, { ...props, font: Typography.caption }),

  Caption2: (
    content: string | (() => string) | Signal<string>,
    props: Omit<TextProps, 'content' | 'font'> = {}
  ) => Text(content, { ...props, font: Typography.caption2 }),
}

/**
 * Text formatting utilities
 */
export const TextFormat = {
  /**
   * Apply multiple formatting options to text
   */
  formatted(
    content: string | (() => string) | Signal<string>,
    formatting: TextFormatting,
    props: Omit<TextProps, 'content'> = {}
  ): ModifiableComponent<TextProps> & {
    modifier: ModifierBuilder<ModifiableComponent<TextProps>>
  } {
    const font = { ...props.font }
    let textDecoration = props.textDecoration || 'none'

    if (formatting.bold) font.weight = 'bold'
    if (formatting.italic) font.style = 'italic'
    if (formatting.monospace) font.family = 'monospace'
    if (formatting.smallCaps) font.variant = 'small-caps'

    const decorations: string[] = []
    if (formatting.underline) decorations.push('underline')
    if (formatting.strikethrough) decorations.push('line-through')
    if (decorations.length > 0) {
      textDecoration = decorations.join(' ')
    }

    return Text(content, {
      ...props,
      font,
      textDecoration: textDecoration as any,
    })
  },

  /**
   * Create bold text
   */
  bold(content: string | (() => string) | Signal<string>, props: Omit<TextProps, 'content'> = {}) {
    return this.formatted(content, { bold: true }, props)
  },

  /**
   * Create italic text
   */
  italic(
    content: string | (() => string) | Signal<string>,
    props: Omit<TextProps, 'content'> = {}
  ) {
    return this.formatted(content, { italic: true }, props)
  },

  /**
   * Create underlined text
   */
  underline(
    content: string | (() => string) | Signal<string>,
    props: Omit<TextProps, 'content'> = {}
  ) {
    return this.formatted(content, { underline: true }, props)
  },

  /**
   * Create monospace text
   */
  monospace(
    content: string | (() => string) | Signal<string>,
    props: Omit<TextProps, 'content'> = {}
  ) {
    return this.formatted(content, { monospace: true }, props)
  },
}
