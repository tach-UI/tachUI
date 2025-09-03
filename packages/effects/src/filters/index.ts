/**
 * Filter Modifiers - CSS filter effects system
 *
 * Provides comprehensive CSS filter capabilities including blur, brightness,
 * contrast, saturation, and other visual effects for enhanced styling.
 */

import type { DOMNode } from '@tachui/core/runtime/types'
import { BaseModifier } from '@tachui/modifiers/base'
import type {
  ModifierContext,
  ReactiveModifierProps,
} from '@tachui/modifiers/types'

export interface FilterConfig {
  blur?: number // Blur radius in pixels
  brightness?: number // Brightness multiplier (1 = normal, >1 brighter, <1 darker)
  contrast?: number // Contrast multiplier (1 = normal, >1 more contrast, <1 less contrast)
  saturate?: number // Saturation multiplier (1 = normal, >1 more saturated, 0 = grayscale)
  sepia?: number // Sepia effect (0-1, where 1 is full sepia)
  hueRotate?: string // Hue rotation (e.g., '90deg', '0.25turn')
  invert?: number // Invert colors (0-1, where 1 is full invert)
  opacity?: number // Opacity filter (0-1, alternative to CSS opacity)
  dropShadow?: string // Drop shadow filter (e.g., '2px 2px 4px rgba(0,0,0,0.5)')
  grayscale?: number // Grayscale effect (0-1, where 1 is full grayscale)
}

export interface FilterOptions {
  filter?: FilterConfig | string
}

export type ReactiveFilterOptions = ReactiveModifierProps<FilterOptions>

export class FilterModifier extends BaseModifier<FilterOptions> {
  readonly type = 'filter'
  readonly priority = 30

  constructor(options: ReactiveFilterOptions) {
    const resolvedOptions: FilterOptions = {}
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

    const styles = this.computeFilterStyles(this.properties)
    this.applyStyles(context.element, styles)

    return undefined
  }

  private computeFilterStyles(props: FilterOptions) {
    const styles: Record<string, string> = {}

    if (props.filter) {
      const filterValue =
        typeof props.filter === 'string'
          ? props.filter
          : this.generateFilterCSS(props.filter)

      styles.filter = filterValue
    }

    return styles
  }

  private generateFilterCSS(config: FilterConfig): string {
    const filters: string[] = []

    Object.entries(config).forEach(([filterType, value]) => {
      switch (filterType) {
        case 'blur':
          filters.push(`blur(${value}px)`)
          break
        case 'brightness':
          filters.push(`brightness(${value})`)
          break
        case 'contrast':
          filters.push(`contrast(${value})`)
          break
        case 'saturate':
          filters.push(`saturate(${value})`)
          break
        case 'sepia':
          filters.push(`sepia(${value})`)
          break
        case 'hueRotate':
          filters.push(`hue-rotate(${value})`)
          break
        case 'invert':
          filters.push(`invert(${value})`)
          break
        case 'opacity':
          filters.push(`opacity(${value})`)
          break
        case 'dropShadow':
          filters.push(`drop-shadow(${value})`)
          break
        case 'grayscale':
          filters.push(`grayscale(${value})`)
          break
      }
    })

    return filters.join(' ')
  }
}

// ============================================================================
// Filter Functions
// ============================================================================

/**
 * General filter modifier with flexible configuration
 *
 * @example
 * ```typescript
 * .filter({ blur: 5, brightness: 1.2, contrast: 1.1 })
 * .filter('blur(3px) sepia(0.8)')  // Direct CSS filter string
 * ```
 */
export function filter(config: FilterConfig | string): FilterModifier {
  return new FilterModifier({ filter: config })
}

/**
 * Blur filter effect
 *
 * @example
 * ```typescript
 * .blur(5)      // 5px blur
 * .blur(0.5)    // Subtle 0.5px blur
 * .blur(10)     // Heavy 10px blur
 * ```
 */
export function blur(radius: number): FilterModifier {
  return new FilterModifier({ filter: { blur: radius } })
}

/**
 * Brightness adjustment filter
 *
 * @example
 * ```typescript
 * .brightness(1.2)    // 20% brighter
 * .brightness(0.8)    // 20% darker
 * .brightness(2.0)    // Double brightness
 * ```
 */
export function brightness(value: number): FilterModifier {
  return new FilterModifier({ filter: { brightness: value } })
}

/**
 * Contrast adjustment filter
 *
 * @example
 * ```typescript
 * .contrast(1.5)     // 50% more contrast
 * .contrast(0.7)     // 30% less contrast
 * .contrast(2.0)     // Double contrast
 * ```
 */
export function contrast(value: number): FilterModifier {
  return new FilterModifier({ filter: { contrast: value } })
}

/**
 * Saturation adjustment filter
 *
 * @example
 * ```typescript
 * .saturate(1.5)     // 50% more saturated
 * .saturate(0.5)     // 50% less saturated
 * .saturate(0)       // Completely desaturated (grayscale)
 * .saturate(2.0)     // Double saturation
 * ```
 */
export function saturate(value: number): FilterModifier {
  return new FilterModifier({ filter: { saturate: value } })
}

/**
 * Grayscale filter effect
 *
 * @example
 * ```typescript
 * .grayscale(1)      // Full grayscale
 * .grayscale(0.5)    // 50% grayscale
 * .grayscale(0)      // No grayscale (full color)
 * ```
 */
export function grayscale(value: number): FilterModifier {
  return new FilterModifier({ filter: { grayscale: value } })
}

/**
 * Sepia filter effect for vintage look
 *
 * @example
 * ```typescript
 * .sepia(1)        // Full sepia effect
 * .sepia(0.6)      // 60% sepia effect
 * .sepia(0)        // No sepia effect
 * ```
 */
export function sepia(value: number): FilterModifier {
  return new FilterModifier({ filter: { sepia: value } })
}

/**
 * Hue rotation filter effect
 *
 * @example
 * ```typescript
 * .hueRotate('90deg')     // Rotate hue by 90 degrees
 * .hueRotate('0.25turn')  // Quarter turn hue rotation
 * .hueRotate('180deg')    // Half rotation (complementary colors)
 * ```
 */
export function hueRotate(angle: string): FilterModifier {
  return new FilterModifier({ filter: { hueRotate: angle } })
}

/**
 * Invert colors filter
 *
 * @example
 * ```typescript
 * .invert(1)       // Full color inversion
 * .invert(0.5)     // 50% color inversion
 * .invert(0)       // No inversion (normal colors)
 * ```
 */
export function invert(value: number): FilterModifier {
  return new FilterModifier({ filter: { invert: value } })
}

/**
 * Drop shadow filter (alternative to box-shadow)
 *
 * @example
 * ```typescript
 * .dropShadow('2px 2px 4px rgba(0,0,0,0.3)')
 * .dropShadow('0 4px 8px #000')
 * .dropShadow('inset 0 0 10px rgba(255,255,255,0.5)')
 * ```
 */
export function dropShadow(shadow: string): FilterModifier {
  return new FilterModifier({ filter: { dropShadow: shadow } })
}

// ============================================================================
// Filter Combinations - Common filter effect patterns
// ============================================================================

/**
 * Vintage photo effect - sepia + contrast + slight blur
 *
 * @example
 * ```typescript
 * .vintagePhoto()           // Default vintage effect
 * .vintagePhoto(0.8, 1.2)   // Custom sepia and contrast
 * ```
 */
export function vintagePhoto(
  sepiaAmount: number = 0.7,
  contrastAmount: number = 1.1
): FilterModifier {
  return new FilterModifier({
    filter: {
      sepia: sepiaAmount,
      contrast: contrastAmount,
      blur: 0.3,
    },
  })
}

/**
 * High contrast black and white effect
 *
 * @example
 * ```typescript
 * .blackAndWhite()          // Full grayscale with high contrast
 * .blackAndWhite(1.5)       // Custom contrast level
 * ```
 */
export function blackAndWhite(contrastAmount: number = 1.3): FilterModifier {
  return new FilterModifier({
    filter: {
      grayscale: 1,
      contrast: contrastAmount,
    },
  })
}

/**
 * Vibrant color enhancement
 *
 * @example
 * ```typescript
 * .vibrant()               // Enhanced saturation and contrast
 * .vibrant(1.4, 1.1)       // Custom saturation and contrast
 * ```
 */
export function vibrant(
  saturationAmount: number = 1.3,
  contrastAmount: number = 1.05
): FilterModifier {
  return new FilterModifier({
    filter: {
      saturate: saturationAmount,
      contrast: contrastAmount,
    },
  })
}

/**
 * Warm color temperature effect
 *
 * @example
 * ```typescript
 * .warmTone()              // Warm hue shift with brightness
 * .warmTone('15deg')       // Custom hue rotation
 * ```
 */
export function warmTone(hueShift: string = '10deg'): FilterModifier {
  return new FilterModifier({
    filter: {
      hueRotate: hueShift,
      brightness: 1.05,
      saturate: 1.1,
    },
  })
}

/**
 * Cool color temperature effect
 *
 * @example
 * ```typescript
 * .coolTone()              // Cool hue shift
 * .coolTone('-20deg')      // Custom hue rotation
 * ```
 */
export function coolTone(hueShift: string = '-15deg'): FilterModifier {
  return new FilterModifier({
    filter: {
      hueRotate: hueShift,
      brightness: 0.98,
      saturate: 1.05,
    },
  })
}

/**
 * Faded/washed out effect
 *
 * @example
 * ```typescript
 * .faded()                 // Reduced contrast and saturation
 * .faded(0.8, 0.7)         // Custom contrast and saturation
 * ```
 */
export function faded(
  contrastAmount: number = 0.85,
  saturationAmount: number = 0.75
): FilterModifier {
  return new FilterModifier({
    filter: {
      contrast: contrastAmount,
      saturate: saturationAmount,
      brightness: 1.1,
    },
  })
}

/**
 * High-key photography effect - bright and airy
 *
 * @example
 * ```typescript
 * .highKey()               // Bright, airy effect
 * .highKey(1.3, 0.9)       // Custom brightness and contrast
 * ```
 */
export function highKey(
  brightnessAmount: number = 1.2,
  contrastAmount: number = 0.85
): FilterModifier {
  return new FilterModifier({
    filter: {
      brightness: brightnessAmount,
      contrast: contrastAmount,
    },
  })
}

/**
 * Low-key photography effect - dark and moody
 *
 * @example
 * ```typescript
 * .lowKey()                // Dark, moody effect
 * .lowKey(0.8, 1.4)        // Custom brightness and contrast
 * ```
 */
export function lowKey(
  brightnessAmount: number = 0.85,
  contrastAmount: number = 1.3
): FilterModifier {
  return new FilterModifier({
    filter: {
      brightness: brightnessAmount,
      contrast: contrastAmount,
    },
  })
}

/**
 * Soft focus effect - subtle blur with brightness
 *
 * @example
 * ```typescript
 * .softFocus()             // Subtle blur with glow effect
 * .softFocus(1.5)          // Custom blur amount
 * ```
 */
export function softFocus(blurAmount: number = 1): FilterModifier {
  return new FilterModifier({
    filter: {
      blur: blurAmount,
      brightness: 1.05,
    },
  })
}

// ============================================================================
// Accessibility and Theme Filters
// ============================================================================

/**
 * High contrast mode for accessibility
 */
export function highContrastMode(): FilterModifier {
  return new FilterModifier({
    filter: {
      contrast: 2.0,
      brightness: 1.1,
    },
  })
}

/**
 * Reduced motion safe blur (very subtle)
 */
export function subtleBlur(): FilterModifier {
  return new FilterModifier({ filter: { blur: 0.5 } })
}

/**
 * Dark mode invert filter
 */
export function darkModeInvert(): FilterModifier {
  return new FilterModifier({
    filter: {
      invert: 1,
      hueRotate: '180deg',
    },
  })
}

// ============================================================================
// SwiftUI Compatibility Functions
// ============================================================================

/**
 * SwiftUI-compatible colorInvert modifier (full color inversion)
 *
 * @example
 * ```typescript
 * .colorInvert()   // Full color inversion (equivalent to .invert(1))
 * ```
 */
export function colorInvert(): FilterModifier {
  return invert(1)
}

/**
 * SwiftUI-compatible saturation modifier (alias for saturate)
 *
 * @example
 * ```typescript
 * .saturation(1.5)   // 50% more saturated
 * .saturation(0)     // Completely desaturated (grayscale)
 * ```
 */
export function saturation(amount: number): FilterModifier {
  return saturate(amount)
}

/**
 * SwiftUI-compatible hueRotation modifier (alias for hueRotate)
 *
 * @example
 * ```typescript
 * .hueRotation('90deg')     // Rotate hue by 90 degrees
 * .hueRotation('0.25turn')  // Quarter turn hue rotation
 * ```
 */
export function hueRotation(angle: string): FilterModifier {
  return hueRotate(angle)
}
