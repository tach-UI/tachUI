/**
 * Shadow Modifiers
 *
 * Comprehensive shadow system with presets and text shadows
 */

import { BaseModifier } from '@tachui/core/modifiers/base'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'

export interface ShadowConfig {
  x: number
  y: number
  blur: number
  spread?: number
  color: string
  inset?: boolean
  type?: 'drop' | 'inner' | 'text'
}

export interface ShadowPreset {
  name: string
  shadows: ShadowConfig[]
  description?: string
}

export interface ShadowOptions {
  shadow?: ShadowConfig
  shadows?: ShadowConfig[]
  textShadow?: ShadowConfig | ShadowConfig[]
  preset?: string
}

export class ShadowModifier extends BaseModifier<ShadowOptions> {
  readonly type = 'shadow'
  readonly priority = 30

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const styles = this.computeShadowStyles(this.properties)
    this.applyStyles(context.element, styles)

    return undefined
  }

  private computeShadowStyles(props: ShadowOptions) {
    const styles: Record<string, string> = {}

    if (props.preset) {
      const preset = shadowPresets[props.preset]
      if (preset) {
        styles.boxShadow = this.generateShadowCSS(preset.shadows)
      }
    }

    if (props.shadow) {
      styles.boxShadow = this.generateShadowCSS([props.shadow])
    }

    if (props.shadows) {
      styles.boxShadow = this.generateShadowCSS(props.shadows)
    }

    if (props.textShadow) {
      const shadowConfigs = Array.isArray(props.textShadow)
        ? props.textShadow
        : [props.textShadow]
      styles.textShadow = this.generateTextShadowCSS(shadowConfigs)
    }

    return styles
  }

  private generateShadowCSS(shadows: ShadowConfig[]): string {
    return shadows
      .map(shadow => {
        const { x, y, blur, spread = 0, color, inset = false } = shadow
        const insetKeyword = inset ? 'inset ' : ''
        return `${insetKeyword}${x}px ${y}px ${blur}px ${spread}px ${color}`
      })
      .join(', ')
  }

  private generateTextShadowCSS(shadows: ShadowConfig[]): string {
    return shadows
      .map(shadow => {
        const { x, y, blur, color } = shadow
        return `${x}px ${y}px ${blur}px ${color}`
      })
      .join(', ')
  }
}

const shadowPresets: Record<string, ShadowPreset> = {
  none: {
    name: 'none',
    shadows: [],
    description: 'No shadow',
  },
  xs: {
    name: 'xs',
    shadows: [{ x: 0, y: 1, blur: 2, spread: 0, color: 'rgba(0, 0, 0, 0.05)' }],
    description: 'Extra small shadow',
  },
  sm: {
    name: 'sm',
    shadows: [{ x: 0, y: 1, blur: 3, spread: 0, color: 'rgba(0, 0, 0, 0.1)' }],
    description: 'Small shadow',
  },
  md: {
    name: 'md',
    shadows: [{ x: 0, y: 4, blur: 6, spread: -1, color: 'rgba(0, 0, 0, 0.1)' }],
    description: 'Medium shadow',
  },
  lg: {
    name: 'lg',
    shadows: [
      { x: 0, y: 10, blur: 15, spread: -3, color: 'rgba(0, 0, 0, 0.1)' },
    ],
    description: 'Large shadow',
  },
  xl: {
    name: 'xl',
    shadows: [
      { x: 0, y: 20, blur: 25, spread: -5, color: 'rgba(0, 0, 0, 0.1)' },
    ],
    description: 'Extra large shadow',
  },
}

export function shadow(config: ShadowConfig): ShadowModifier
export function shadow(
  x: number,
  y: number,
  blur: number,
  color: string
): ShadowModifier
export function shadow(
  configOrX: ShadowConfig | number,
  y?: number,
  blur?: number,
  color?: string
): ShadowModifier {
  if (typeof configOrX === 'object') {
    return new ShadowModifier({ shadow: configOrX })
  }

  return new ShadowModifier({
    shadow: {
      x: configOrX,
      y: y!,
      blur: blur!,
      color: color!,
    },
  })
}

export function shadows(configs: ShadowConfig[]): ShadowModifier {
  return new ShadowModifier({ shadows: configs })
}

export function textShadow(config: ShadowConfig): ShadowModifier
export function textShadow(
  x: number,
  y: number,
  blur: number,
  color: string
): ShadowModifier
export function textShadow(
  configOrX: ShadowConfig | number,
  y?: number,
  blur?: number,
  color?: string
): ShadowModifier {
  if (typeof configOrX === 'object') {
    return new ShadowModifier({ textShadow: configOrX })
  }

  return new ShadowModifier({
    textShadow: {
      x: configOrX,
      y: y!,
      blur: blur!,
      color: color!,
    },
  })
}

export function shadowPreset(preset: string): ShadowModifier {
  return new ShadowModifier({ preset })
}

export function createShadowPreset(
  name: string,
  shadows: ShadowConfig[],
  description?: string
): ShadowPreset {
  return { name, shadows, description }
}

export function getShadowPresets(): Record<string, ShadowPreset> {
  return shadowPresets
}

export function getShadowPreset(name: string): ShadowPreset | undefined {
  return shadowPresets[name]
}
