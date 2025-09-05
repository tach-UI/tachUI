/**
 * Backdrop Filter Modifiers Implementation
 *
 * Unified implementation combining the best elements of both previous backdrop filter
 * implementations - production-ready browser support with enhanced developer experience.
 */

import type { DOMNode } from '@tachui/core/runtime/types'
import { BaseModifier } from '@tachui/modifiers'
import type { ModifierContext, ReactiveModifierProps } from '@tachui/modifiers'
import type { ColorValue } from '@tachui/core'
import { ModifierPriority } from '@tachui/core/modifiers/types'

// ============================================================================
// Enhanced Backdrop Filter Configuration
// ============================================================================

export interface BackdropFilterConfig {
  blur?: number
  brightness?: number
  contrast?: number
  dropShadow?:
    | {
        x: number
        y: number
        blur: number
        color: string
      }
    | string // Support both object config and CSS string
  grayscale?: number
  hueRotate?: number
  invert?: number
  opacity?: number
  saturate?: number
  sepia?: number
}

export interface BackdropFilterOptions {
  backdropFilter: BackdropFilterConfig | string
  fallbackColor?: ColorValue // Browser compatibility fallback - supports ColorAssets
}

export type ReactiveBackdropFilterOptions =
  ReactiveModifierProps<BackdropFilterOptions>

// ============================================================================
// Unified Backdrop Filter Modifier
// ============================================================================

export class BackdropFilterModifier extends BaseModifier<BackdropFilterOptions> {
  readonly type = 'backdropFilter'
  readonly priority = ModifierPriority.APPEARANCE + 15

  constructor(options: ReactiveBackdropFilterOptions) {
    // Handle backdropFilter specifically
    let backdropFilterValue: BackdropFilterConfig | string = 'blur(10px)'
    if (options.backdropFilter) {
      if (
        typeof options.backdropFilter === 'function' &&
        'peek' in options.backdropFilter
      ) {
        backdropFilterValue = (options.backdropFilter as any).peek()
      } else {
        backdropFilterValue = options.backdropFilter as
          | BackdropFilterConfig
          | string
      }
    }

    const resolvedOptions: BackdropFilterOptions = {
      backdropFilter: backdropFilterValue,
    }

    // Handle fallbackColor
    if ('fallbackColor' in options && options.fallbackColor !== undefined) {
      if (
        typeof options.fallbackColor === 'function' &&
        'peek' in options.fallbackColor
      ) {
        resolvedOptions.fallbackColor = (options.fallbackColor as any).peek()
      } else {
        resolvedOptions.fallbackColor = options.fallbackColor as ColorValue
      }
    }

    super(resolvedOptions)
  }

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const styles = this.computeBackdropFilterStyles(this.properties)
    this.applyStyles(context.element, styles)

    return undefined
  }

  private computeBackdropFilterStyles(props: BackdropFilterOptions) {
    const styles: Record<string, string> = {}

    if (props.backdropFilter) {
      if (this.supportsBackdropFilter()) {
        const filterValue = this.formatBackdropFilter(props.backdropFilter)

        // Apply with vendor prefixes for maximum browser support
        styles.backdropFilter = filterValue
        styles.webkitBackdropFilter = filterValue // Safari support
      } else if (props.fallbackColor) {
        // Graceful fallback for browsers without backdrop-filter support
        const resolvedColor = this.resolveColorValue(props.fallbackColor)
        styles.backgroundColor = resolvedColor
        if (process.env.NODE_ENV === 'development') {
          console.info(
            'TachUI: backdrop-filter not supported, using fallback color:',
            resolvedColor
          )
        }
      }
    }

    return styles
  }

  private formatBackdropFilter(filter: BackdropFilterConfig | string): string {
    if (typeof filter === 'string') {
      return filter
    }

    const filterFunctions: string[] = []

    // Convert config object to CSS filter functions
    // Order matters for consistent output
    if (filter.blur !== undefined) {
      filterFunctions.push(`blur(${filter.blur}px)`)
    }
    if (filter.brightness !== undefined) {
      filterFunctions.push(`brightness(${filter.brightness})`)
    }
    if (filter.contrast !== undefined) {
      filterFunctions.push(`contrast(${filter.contrast})`)
    }
    if (filter.dropShadow) {
      if (typeof filter.dropShadow === 'string') {
        filterFunctions.push(`drop-shadow(${filter.dropShadow})`)
      } else {
        const { x, y, blur, color } = filter.dropShadow
        filterFunctions.push(`drop-shadow(${x}px ${y}px ${blur}px ${color})`)
      }
    }
    if (filter.grayscale !== undefined) {
      filterFunctions.push(`grayscale(${filter.grayscale})`)
    }
    if (filter.hueRotate !== undefined) {
      filterFunctions.push(`hue-rotate(${filter.hueRotate}deg)`)
    }
    if (filter.invert !== undefined) {
      filterFunctions.push(`invert(${filter.invert})`)
    }
    if (filter.opacity !== undefined) {
      filterFunctions.push(`opacity(${filter.opacity})`)
    }
    if (filter.saturate !== undefined) {
      filterFunctions.push(`saturate(${filter.saturate})`)
    }
    if (filter.sepia !== undefined) {
      filterFunctions.push(`sepia(${filter.sepia})`)
    }

    if (filterFunctions.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          'TachUI BackdropFilter: No filter functions specified - provide blur, brightness, contrast, etc.'
        )
      }
      return 'none'
    }

    return filterFunctions.join(' ')
  }

  private supportsBackdropFilter(): boolean {
    // Runtime browser feature detection
    if (typeof CSS !== 'undefined' && CSS.supports) {
      return (
        CSS.supports('backdrop-filter', 'blur(1px)') ||
        CSS.supports('-webkit-backdrop-filter', 'blur(1px)')
      )
    }
    // Conservative fallback if CSS.supports is not available
    return false
  }

  /**
   * Resolve ColorValue (including ColorAssets) to CSS color string
   */
  private resolveColorValue(color: ColorValue): string {
    if (typeof color === 'string') {
      return color
    }

    // Handle Signal<string>
    if (typeof color === 'function' && 'peek' in color) {
      return (color as any).peek()
    }

    // Handle Asset types (ColorAssetProxy, Asset)
    if (color && typeof color === 'object') {
      // ColorAssetProxy has a getValue method
      if ('getValue' in color && typeof color.getValue === 'function') {
        return color.getValue()
      }

      // Asset has a value property
      if ('value' in color && typeof color.value === 'string') {
        return color.value
      }

      // Asset proxy might have toString
      if ('toString' in color && typeof color.toString === 'function') {
        return color.toString()
      }
    }

    // Fallback - convert to string
    return String(color)
  }
}

// ============================================================================
// Backdrop Filter Factory Functions
// ============================================================================

/**
 * Create a backdrop filter modifier with enhanced configuration options
 */
export function backdropFilter(
  config: BackdropFilterConfig,
  fallbackColor?: ColorValue
): BackdropFilterModifier
export function backdropFilter(
  cssValue: string,
  fallbackColor?: ColorValue
): BackdropFilterModifier
export function backdropFilter(
  value: BackdropFilterConfig | string,
  fallbackColor?: ColorValue
): BackdropFilterModifier {
  return new BackdropFilterModifier({
    backdropFilter: value,
    ...(fallbackColor && { fallbackColor }),
  })
}

// ============================================================================
// Enhanced Glassmorphism Presets
// ============================================================================

export type GlassmorphismIntensity = 'light' | 'medium' | 'heavy' | 'subtle'

interface GlassmorphismPreset {
  config: BackdropFilterConfig
  fallbackColor: ColorValue
}

/**
 * Refined glassmorphism presets with optimized blur, saturation, and brightness values
 */
const GLASSMORPHISM_PRESETS: Record<
  GlassmorphismIntensity,
  GlassmorphismPreset
> = {
  subtle: {
    config: { blur: 3, saturate: 1.05, brightness: 1.05 },
    fallbackColor: 'rgba(255, 255, 255, 0.05)',
  },
  light: {
    config: { blur: 8, saturate: 1.15, brightness: 1.1 },
    fallbackColor: 'rgba(255, 255, 255, 0.1)',
  },
  medium: {
    config: { blur: 16, saturate: 1.3, brightness: 1.15 },
    fallbackColor: 'rgba(255, 255, 255, 0.15)',
  },
  heavy: {
    config: { blur: 24, saturate: 1.5, brightness: 1.2 },
    fallbackColor: 'rgba(255, 255, 255, 0.2)',
  },
} as const

/**
 * Create glassmorphism effect with intensity-based presets
 */
export function glassmorphism(
  intensity: GlassmorphismIntensity = 'medium',
  customFallback?: ColorValue
): BackdropFilterModifier {
  const preset = GLASSMORPHISM_PRESETS[intensity]

  return new BackdropFilterModifier({
    backdropFilter: preset.config,
    fallbackColor: customFallback || preset.fallbackColor,
  })
}

/**
 * Create custom glassmorphism effect with fine-tuned parameters
 */
export function customGlassmorphism(
  blur: number,
  saturate: number = 1.2,
  brightness: number = 1.1,
  fallbackColor?: ColorValue
): BackdropFilterModifier {
  return new BackdropFilterModifier({
    backdropFilter: { blur, saturate, brightness },
    fallbackColor:
      fallbackColor || `rgba(255, 255, 255, ${Math.min(blur / 200, 0.25)})`,
  })
}
