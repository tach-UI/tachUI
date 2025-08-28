/**
 * Spacer Component
 *
 * SwiftUI-inspired Spacer component that expands to fill available space
 * along the main axis of its container. Behaves like SwiftUI.Spacer.
 */

import type { ModifiableComponent, ModifierBuilder } from '../modifiers/types'
import { h } from '../runtime'
import type { ComponentInstance, ComponentProps, DOMNode } from '../runtime/types'
import { withModifiers } from './wrapper'
import {
  ComponentWithCSSClasses,
  type CSSClassesProps
} from '../css-classes'

/**
 * Spacer component properties with CSS classes support
 */
export interface SpacerProps extends ComponentProps, CSSClassesProps {
  minLength?: number // Minimum space along the main axis
}

/**
 * Spacer component implementation with CSS classes support
 */
export class SpacerComponent extends ComponentWithCSSClasses implements ComponentInstance<SpacerProps> {
  public readonly type = 'component' as const
  public readonly id: string
  public readonly props: SpacerProps

  constructor(props: SpacerProps) {
    super()
    this.props = props
    this.id = `spacer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  render(): DOMNode {
    const minLength = this.props.minLength ?? 0
    
    // Process CSS classes for this component
    const baseClasses = ['tachui-spacer']
    const classString = this.createClassString(this.props, baseClasses)

    // Create a div element that acts as a flexible spacer
    const element = h('div', {
      className: classString,
      style: {
        // Core flex properties for expansion
        flexGrow: '1',
        flexShrink: '1',
        flexBasis: '0',

        // Minimum size constraints
        minWidth: `${minLength}px`,
        minHeight: `${minLength}px`,

        // Ensure proper behavior in both directions
        alignSelf: 'stretch',

        // Visual debugging (remove in production)
        // backgroundColor: 'rgba(255, 0, 0, 0.1)', // Uncomment to visualize spacers
      },
    })

    return element
  }
}

/**
 * Create a Spacer component with optional minimum length
 */
export function Spacer(minLength?: number): ModifiableComponent<SpacerProps> & {
  modifier: ModifierBuilder<ModifiableComponent<SpacerProps>>
}
export function Spacer(props?: SpacerProps): ModifiableComponent<SpacerProps> & {
  modifier: ModifierBuilder<ModifiableComponent<SpacerProps>>
}
export function Spacer(
  minLengthOrProps?: number | SpacerProps
): ModifiableComponent<SpacerProps> & {
  modifier: ModifierBuilder<ModifiableComponent<SpacerProps>>
} {
  let props: SpacerProps

  if (typeof minLengthOrProps === 'number') {
    props = { minLength: minLengthOrProps }
  } else {
    props = minLengthOrProps || {}
  }

  return withModifiers(new SpacerComponent(props))
}
