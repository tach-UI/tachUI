/**
 * Enhanced Text Component
 *
 * SwiftUI-inspired Text component with full typography support,
 * text formatting, and advanced styling capabilities.
 */

import type {
  ModifiableComponent,
  ModifierBuilder,
} from '@tachui/core/modifiers/types'
import type { Signal } from '@tachui/core/reactive/types'
import { h, text } from '@tachui/core/runtime'
import type {
  ComponentInstance,
  ComponentProps,
} from '@tachui/core/runtime/types'
import {
  createModifiableComponent,
  createModifierBuilder,
} from '@tachui/core/modifiers'
import type {
  Concatenatable,
  ComponentSegment,
  ConcatenationMetadata,
} from '@tachui/core/concatenation/types'
import { ConcatenatedComponent } from '@tachui/core/concatenation/concatenated-component'
import {
  processElementOverride,
  type ElementOverrideProps,
} from '@tachui/core/runtime/element-override'
import {
  ComponentWithCSSClasses,
  type CSSClassesProps,
} from '@tachui/core/css-classes'

/**
 * Text component properties with element override support and CSS classes
 */
export interface TextProps
  extends ComponentProps,
    ElementOverrideProps,
    CSSClassesProps {
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
 * Enhanced component wrapper that adds modifier support and preserves concatenation methods
 */
function withModifiers<P extends ComponentProps>(
  component: ComponentInstance<P>
): ModifiableComponent<P> & {
  modifier: ModifierBuilder<ModifiableComponent<P>>
} & (ComponentInstance<P> extends Concatenatable ? Concatenatable : {}) {
  const modifiableComponent = createModifiableComponent(component)
  const modifierBuilder = createModifierBuilder(modifiableComponent)

  const result: any = {
    ...modifiableComponent,
    modifier: modifierBuilder,
    modifierBuilder: modifierBuilder,
  }

  // If the original component supports concatenation, preserve those methods
  if (component && typeof (component as any).concat === 'function') {
    result.concat = function (other: any) {
      return (component as any).concat(other)
    }
    result.toSegment = function () {
      return (component as any).toSegment()
    }
    result.isConcatenatable = function () {
      return (component as any).isConcatenatable()
    }
  }

  return result
}

/**
 * Enhanced Text component class with reactive content handling, concatenation support, element override, and CSS classes
 */
export class EnhancedText
  extends ComponentWithCSSClasses
  implements ComponentInstance<TextProps>, Concatenatable<TextProps>
{
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
        // Add component metadata for semantic role processing
        componentMetadata: {
          originalType: 'Text',
          overriddenTo:
            this.effectiveTag !== 'span' ? this.effectiveTag : undefined,
          validationResult: this.validationResult,
        },
      },
      text(this.props.content || '')
    )

    return [element]
  }

  // Concatenation support
  concat(other: ComponentInstance | string): ConcatenatedComponent<TextProps> {
    return new ConcatenatedComponent<TextProps>([this.toSegment()], other)
  }

  toSegment(): ComponentSegment<TextProps> {
    return {
      type: 'component',
      component: this,
      metadata: this.getConcatenationMetadata(),
    }
  }

  isConcatenatable(): boolean {
    return true
  }

  private getConcatenationMetadata(): ConcatenationMetadata {
    return {
      type: 'text',
      semanticRole: 'text',
      canMerge: true,
      priority: 'normal',
    }
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.cleanup.forEach(fn => {
      try {
        fn()
      } catch (error) {
        console.error('Text component cleanup error:', error)
      }
    })
    this.cleanup = []
  }
}

/**
 * Create enhanced Text component with modifier support and concatenation
 */
export function Text(
  content?: string | (() => string) | Signal<string>
): ModifiableComponent<TextProps> & {
  modifier: ModifierBuilder<ModifiableComponent<TextProps>>
} & Concatenatable<TextProps> {
  const component = new EnhancedText({ content })
  return withModifiers(component) as any
}

/**
 * Text formatting utility functions
 */
export const TextFormat = {
  /**
   * Create bold text
   */
  bold(
    content: string | (() => string) | Signal<string>
  ): ModifiableComponent<TextProps> & {
    modifier: ModifierBuilder<ModifiableComponent<TextProps>>
  } & Concatenatable<TextProps> {
    return Text(content).fontWeight('bold') as any
  },

  /**
   * Create italic text
   */
  italic(
    content: string | (() => string) | Signal<string>
  ): ModifiableComponent<TextProps> & {
    modifier: ModifierBuilder<ModifiableComponent<TextProps>>
  } & Concatenatable<TextProps> {
    return Text(content).fontStyle('italic') as any
  },

  /**
   * Create monospace text
   */
  monospace(
    content: string | (() => string) | Signal<string>
  ): ModifiableComponent<TextProps> & {
    modifier: ModifierBuilder<ModifiableComponent<TextProps>>
  } & Concatenatable<TextProps> {
    return Text(content).fontFamily('monospace') as any
  },
}

/**
 * Text styling utilities
 */
export const TextStyles = {
  heading: (level: 1 | 2 | 3 | 4 | 5 | 6 = 1) => ({
    font: Typography[
      level === 1
        ? 'largeTitle'
        : level === 2
          ? 'title'
          : level === 3
            ? 'title2'
            : level === 4
              ? 'title3'
              : level === 5
                ? 'headline'
                : 'body'
    ],
    accessibilityRole: 'heading' as const,
    accessibilityLevel: level,
  }),

  body: () => ({
    font: Typography.body,
    accessibilityRole: 'text' as const,
  }),

  caption: () => ({
    font: Typography.caption,
    color: '#666666',
  }),

  footnote: () => ({
    font: Typography.footnote,
    color: '#888888',
  }),
}
