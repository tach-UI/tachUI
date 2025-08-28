/**
 * Flexbox Modifier - comprehensive flexbox layout properties
 *
 * Provides a unified interface for flexbox properties
 * including flex-grow, justify-content, align-items, etc.
 */

import type { DOMNode } from '../runtime/types'
import { BaseModifier } from './base'
import type { ModifierContext, ReactiveModifierProps } from './types'

export interface FlexboxOptions {
  flexGrow?: number
  flexShrink?: number
  flexBasis?: number | string
  flex?: string
  justifyContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly'
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
  alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
  flexDirection?: 'row' | 'row-reverse' | 'column' | 'column-reverse'
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  alignContent?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'space-between' | 'space-around'
  gap?: number | string
  rowGap?: number | string
  columnGap?: number | string
}

export type ReactiveFlexboxOptions = ReactiveModifierProps<FlexboxOptions>

export class FlexboxModifier extends BaseModifier<FlexboxOptions> {
  readonly type = 'flexbox'
  readonly priority = 60 // Priority 60 for flexbox layout

  constructor(options: ReactiveFlexboxOptions) {
    // Convert reactive options to regular options for immediate use
    const resolvedOptions: FlexboxOptions = {}
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

    const styles = this.computeFlexboxStyles(this.properties)
    this.applyStyles(context.element, styles)
    
    return undefined
  }

  private computeFlexboxStyles(props: FlexboxOptions) {
    const styles: Record<string, string> = {}

    if (props.flexGrow !== undefined) {
      styles.flexGrow = props.flexGrow.toString()
    }
    if (props.flexShrink !== undefined) {
      styles.flexShrink = props.flexShrink.toString()
    }
    if (props.flexBasis !== undefined) {
      styles.flexBasis = this.toCSSValue(props.flexBasis)
    }
    if (props.flex !== undefined) {
      styles.flex = props.flex
    }
    if (props.justifyContent !== undefined) {
      styles.justifyContent = props.justifyContent
    }
    if (props.alignItems !== undefined) {
      styles.alignItems = props.alignItems
    }
    if (props.alignSelf !== undefined) {
      styles.alignSelf = props.alignSelf
    }
    if (props.flexDirection !== undefined) {
      styles.flexDirection = props.flexDirection
    }
    if (props.flexWrap !== undefined) {
      styles.flexWrap = props.flexWrap
    }
    if (props.alignContent !== undefined) {
      styles.alignContent = props.alignContent
    }
    if (props.gap !== undefined) {
      styles.gap = this.toCSSValue(props.gap)
    }
    if (props.rowGap !== undefined) {
      styles.rowGap = this.toCSSValue(props.rowGap)
    }
    if (props.columnGap !== undefined) {
      styles.columnGap = this.toCSSValue(props.columnGap)
    }

    return styles
  }
}

/**
 * Create a flexbox modifier with comprehensive flexbox properties
 *
 * @example
 * ```typescript
 * // Complete flexbox layout
 * .flexbox({
 *   flexGrow: 1,
 *   justifyContent: 'center',
 *   alignItems: 'stretch',
 *   gap: 16
 * })
 *
 * // Simple flex grow
 * .flexGrow(1)
 *
 * // Justify content
 * .justifyContent('space-between')
 * ```
 */
export function flexbox(options: ReactiveFlexboxOptions): FlexboxModifier {
  return new FlexboxModifier(options)
}

/**
 * Convenience function for flex-grow
 */
export function flexGrow(value: number): FlexboxModifier {
  return new FlexboxModifier({ flexGrow: value })
}

/**
 * Convenience function for flex-shrink
 */
export function flexShrink(value: number): FlexboxModifier {
  return new FlexboxModifier({ flexShrink: value })
}

/**
 * Convenience function for justify-content
 */
export function justifyContent(value: FlexboxOptions['justifyContent']): FlexboxModifier {
  return new FlexboxModifier({ justifyContent: value })
}

/**
 * Convenience function for align-items
 */
export function alignItems(value: FlexboxOptions['alignItems']): FlexboxModifier {
  return new FlexboxModifier({ alignItems: value })
}

/**
 * Convenience function for gap
 */
export function gap(value: number | string): FlexboxModifier {
  return new FlexboxModifier({ gap: value })
}

/**
 * Convenience function for flex-direction
 */
export function flexDirection(value: FlexboxOptions['flexDirection']): FlexboxModifier {
  return new FlexboxModifier({ flexDirection: value })
}

/**
 * Convenience function for flex-wrap
 */
export function flexWrap(value: FlexboxOptions['flexWrap']): FlexboxModifier {
  return new FlexboxModifier({ flexWrap: value })
}
