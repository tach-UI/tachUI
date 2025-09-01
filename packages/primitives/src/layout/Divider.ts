/**
 * Divider Component
 *
 * SwiftUI-inspired Divider component for visual separation between content.
 * Simple, clean line separator with customizable styling.
 */

import type { ModifiableComponent, ModifierBuilder } from '@tachui/core'
import { createEffect, isSignal } from '@tachui/core'
import type { Signal } from '@tachui/core'
import { h } from '@tachui/core'
import type { ComponentInstance, ComponentProps, DOMNode } from '@tachui/core'
import { createModifiableComponent, createModifierBuilder } from '@tachui/core'

/**
 * Divider component properties
 */
export interface DividerProps extends ComponentProps {
  // Appearance
  color?: string | Signal<string>
  thickness?: number | Signal<number>
  length?: number | string | Signal<number | string>

  // Orientation
  orientation?: 'horizontal' | 'vertical'

  // Spacing
  margin?: number | Signal<number>

  // Style
  style?: 'solid' | 'dashed' | 'dotted'
  opacity?: number | Signal<number>
}

/**
 * Default divider theme
 */
export interface DividerTheme {
  colors: {
    default: string
    light: string
    medium: string
    heavy: string
    primary: string
    secondary: string
    subtle: string
    prominent: string
  }
  thickness: {
    thin: number
    medium: number
    thick: number
  }
  spacing: {
    small: number
    medium: number
    large: number
  }
}

export const defaultDividerTheme: DividerTheme = {
  colors: {
    default: '#E5E5E5',
    light: '#F0F0F0',
    medium: '#D1D1D1',
    heavy: '#A0A0A0',
    primary: '#007AFF',
    secondary: '#5AC8FA',
    subtle: '#F2F2F7',
    prominent: '#1C1C1E',
  },
  thickness: {
    thin: 1,
    medium: 2,
    thick: 3,
  },
  spacing: {
    small: 8,
    medium: 16,
    large: 24,
  },
}

/**
 * Enhanced component wrapper that adds modifier support
 */
function withModifiers<P extends ComponentProps>(
  component: ComponentInstance<P>
): ModifiableComponent<P> & {
  modifier: ModifierBuilder<ModifiableComponent<P>>
} {
  const modifiableComponent = createModifiableComponent(component)
  const modifierBuilder = createModifierBuilder(modifiableComponent)

  return {
    ...modifiableComponent,
    modifier: modifierBuilder,
    modifierBuilder: modifierBuilder,
  }
}

/**
 * Divider component implementation
 */
export class DividerComponent implements ComponentInstance<DividerProps> {
  public readonly type = 'component' as const
  public readonly id: string
  public readonly props: DividerProps
  public cleanup: (() => void)[] = []
  private theme: DividerTheme = defaultDividerTheme

  constructor(props: DividerProps) {
    this.props = props
    this.id = `divider-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private resolveValue<T>(value: T | Signal<T>): T {
    return isSignal(value) ? value() : value
  }

  private getBaseStyles(): Record<string, string> {
    const isVertical = this.props.orientation === 'vertical'
    const thickness = this.resolveValue(
      this.props.thickness ?? this.theme.thickness.thin
    )
    const color = this.resolveValue(
      this.props.color ?? this.theme.colors.default
    )
    const style = this.props.style ?? 'solid'
    const opacity = this.resolveValue(this.props.opacity ?? 1)
    const margin = this.resolveValue(
      this.props.margin ?? this.theme.spacing.medium
    )
    const length = this.resolveValue(this.props.length ?? '100%')

    const baseStyles: Record<string, string> = {
      backgroundColor: color,
      opacity: opacity.toString(),
      borderStyle: style,
      borderColor: color,
      flexShrink: '0', // Prevent shrinking
    }

    if (isVertical) {
      // Vertical divider
      baseStyles.width = `${thickness}px`
      baseStyles.height = typeof length === 'number' ? `${length}px` : length
      baseStyles.marginLeft = `${margin}px`
      baseStyles.marginRight = `${margin}px`
      baseStyles.borderLeftWidth = `${thickness}px`
      baseStyles.backgroundColor = 'transparent'
    } else {
      // Horizontal divider (default)
      baseStyles.height = `${thickness}px`
      baseStyles.width = typeof length === 'number' ? `${length}px` : length
      baseStyles.marginTop = `${margin}px`
      baseStyles.marginBottom = `${margin}px`
      baseStyles.borderTopWidth = `${thickness}px`
      baseStyles.backgroundColor = 'transparent'
    }

    return baseStyles
  }

  render(): DOMNode {
    const isVertical = this.props.orientation === 'vertical'

    // Check if any props are reactive
    const hasReactiveProps =
      isSignal(this.props.color) ||
      isSignal(this.props.thickness) ||
      isSignal(this.props.length) ||
      isSignal(this.props.margin) ||
      isSignal(this.props.opacity)

    // Base element
    const element = h('div', {
      className: `tachui-divider tachui-divider-${isVertical ? 'vertical' : 'horizontal'}`,
      style: this.getBaseStyles(),
      role: 'separator',
      'aria-orientation': isVertical ? 'vertical' : 'horizontal',
    })

    // Set up reactive updates if needed
    if (hasReactiveProps) {
      const effect = createEffect(() => {
        const newStyles = this.getBaseStyles()
        if (element.element) {
          Object.assign((element.element as HTMLElement).style, newStyles)
        }
      })

      this.cleanup.push(() => effect.dispose())
      element.dispose = () => {
        this.cleanup.forEach(fn => fn())
      }
    }

    return element
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.cleanup.forEach(fn => {
      try {
        fn()
      } catch (error) {
        console.error('Divider component cleanup error:', error)
      }
    })
    this.cleanup = []
  }
}

/**
 * Create a Divider component
 */
export function Divider(
  props: DividerProps = {}
): ModifiableComponent<DividerProps> & {
  modifier: ModifierBuilder<ModifiableComponent<DividerProps>>
} {
  return withModifiers(new DividerComponent(props))
}

/**
 * Divider utility functions
 */
export const DividerUtils = {
  /**
   * Create a horizontal divider
   */
  horizontal(
    props: Omit<DividerProps, 'orientation'> = {}
  ): ModifiableComponent<DividerProps> & {
    modifier: ModifierBuilder<ModifiableComponent<DividerProps>>
  } {
    return Divider({ ...props, orientation: 'horizontal' })
  },

  /**
   * Create a vertical divider
   */
  vertical(
    lengthOrProps?: number | string | Omit<DividerProps, 'orientation'>,
    thickness?: number
  ): ModifiableComponent<DividerProps> & {
    modifier: ModifierBuilder<ModifiableComponent<DividerProps>>
  } {
    if (typeof lengthOrProps === 'object') {
      return Divider({ ...lengthOrProps, orientation: 'vertical' })
    }
    return Divider({
      orientation: 'vertical',
      length: lengthOrProps,
      thickness,
    })
  },

  /**
   * Create a thin divider
   */
  thin(color?: string): ModifiableComponent<DividerProps> & {
    modifier: ModifierBuilder<ModifiableComponent<DividerProps>>
  } {
    return Divider({ thickness: defaultDividerTheme.thickness.thin, color })
  },

  /**
   * Create a medium divider
   */
  medium(color?: string): ModifiableComponent<DividerProps> & {
    modifier: ModifierBuilder<ModifiableComponent<DividerProps>>
  } {
    return Divider({ thickness: defaultDividerTheme.thickness.medium, color })
  },

  /**
   * Create a thick divider
   */
  thick(color?: string): ModifiableComponent<DividerProps> & {
    modifier: ModifierBuilder<ModifiableComponent<DividerProps>>
  } {
    return Divider({ thickness: defaultDividerTheme.thickness.thick, color })
  },

  /**
   * Create a dashed divider
   */
  dashed(
    color?: string,
    thickness?: number
  ): ModifiableComponent<DividerProps> & {
    modifier: ModifierBuilder<ModifiableComponent<DividerProps>>
  } {
    return Divider({ style: 'dashed', color, thickness })
  },

  /**
   * Create a dotted divider
   */
  dotted(
    color?: string,
    thickness?: number
  ): ModifiableComponent<DividerProps> & {
    modifier: ModifierBuilder<ModifiableComponent<DividerProps>>
  } {
    return Divider({ style: 'dotted', color, thickness })
  },

  /**
   * Create a subtle divider
   */
  subtle(color?: string): ModifiableComponent<DividerProps> & {
    modifier: ModifierBuilder<ModifiableComponent<DividerProps>>
  } {
    return Divider({
      color: color || defaultDividerTheme.colors.light,
      opacity: 0.6,
    })
  },

  /**
   * Create a prominent divider
   */
  prominent(color?: string): ModifiableComponent<DividerProps> & {
    modifier: ModifierBuilder<ModifiableComponent<DividerProps>>
  } {
    return Divider({
      color: color || defaultDividerTheme.colors.heavy,
      thickness: defaultDividerTheme.thickness.medium,
    })
  },
}

/**
 * Divider styles utility
 */
export const DividerStyles = {
  theme: defaultDividerTheme,

  colors: {
    primary: '#007AFF',
    success: '#34C759',
    warning: '#FF9500',
    danger: '#FF3B30',
  },

  thin: (color?: string) => ({
    thickness: defaultDividerTheme.thickness.thin,
    color,
  }),
  medium: (color?: string) => ({
    thickness: defaultDividerTheme.thickness.medium,
    color,
  }),
  thick: (color?: string) => ({
    thickness: defaultDividerTheme.thickness.thick,
    color,
  }),

  createTheme: (overrides: Partial<DividerTheme>): DividerTheme => ({
    colors: {
      ...defaultDividerTheme.colors,
      ...overrides.colors,
    },
    thickness: {
      ...defaultDividerTheme.thickness,
      ...overrides.thickness,
    },
    spacing: {
      ...defaultDividerTheme.spacing,
      ...overrides.spacing,
    },
  }),

  // Color presets
  primary: (color?: string) =>
    Divider({ color: color || defaultDividerTheme.colors.primary }),
  secondary: (color?: string) =>
    Divider({ color: color || defaultDividerTheme.colors.secondary }),
  subtle: (color?: string) =>
    Divider({ color: color || defaultDividerTheme.colors.subtle }),
  prominent: (color?: string) =>
    Divider({ color: color || defaultDividerTheme.colors.prominent }),
}
