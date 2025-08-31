/**
 * Filter Modifiers
 *
 * CSS filter effects for visual enhancements
 */

import { BaseModifier } from '@tachui/core/modifiers/base'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'

export interface FilterConfig {
  blur?: number
  brightness?: number
  contrast?: number
  saturate?: number
  sepia?: number
  hueRotate?: string
  invert?: number
  opacity?: number
  dropShadow?: string
  grayscale?: number
}

export interface FilterOptions {
  filter?: FilterConfig | string
}

export class FilterModifier extends BaseModifier<FilterOptions> {
  readonly type = 'filter'
  readonly priority = 30

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

export function filter(config: FilterConfig | string): FilterModifier {
  return new FilterModifier({ filter: config })
}

export function blur(radius: number): FilterModifier {
  return new FilterModifier({ filter: { blur: radius } })
}

export function brightness(value: number): FilterModifier {
  return new FilterModifier({ filter: { brightness: value } })
}

export function contrast(value: number): FilterModifier {
  return new FilterModifier({ filter: { contrast: value } })
}

export function saturate(value: number): FilterModifier {
  return new FilterModifier({ filter: { saturate: value } })
}

export function grayscale(value: number): FilterModifier {
  return new FilterModifier({ filter: { grayscale: value } })
}

export function sepia(value: number): FilterModifier {
  return new FilterModifier({ filter: { sepia: value } })
}

export function hueRotate(angle: string): FilterModifier {
  return new FilterModifier({ filter: { hueRotate: angle } })
}

export function invert(value: number): FilterModifier {
  return new FilterModifier({ filter: { invert: value } })
}

export function dropShadow(shadow: string): FilterModifier {
  return new FilterModifier({ filter: { dropShadow: shadow } })
}

export function vintagePhoto(): FilterModifier {
  return new FilterModifier({
    filter: { sepia: 0.8, contrast: 1.2, brightness: 1.1, saturate: 0.8 },
  })
}

export function blackAndWhite(): FilterModifier {
  return new FilterModifier({ filter: { grayscale: 1 } })
}

export function vibrant(): FilterModifier {
  return new FilterModifier({ filter: { saturate: 1.5, contrast: 1.1 } })
}

export function warmTone(): FilterModifier {
  return new FilterModifier({ filter: { hueRotate: '15deg', saturate: 1.2 } })
}

export function coolTone(): FilterModifier {
  return new FilterModifier({ filter: { hueRotate: '-15deg', saturate: 1.1 } })
}
