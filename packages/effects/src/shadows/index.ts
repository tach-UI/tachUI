/**
 * Shadow Modifiers - Comprehensive shadow system
 *
 * Provides comprehensive shadow capabilities including box shadows, text shadows,
 * inset shadows, multiple shadows, and filter-based drop shadows with SwiftUI compatibility.
 */

import type { Signal } from '@tachui/core/reactive/types'
import { isSignal, isComputed, createEffect } from '@tachui/core/reactive'
import type { DOMNode } from '@tachui/core/runtime/types'
import { BaseModifier } from '@tachui/modifiers'
import type { ModifierContext, ReactiveModifierProps } from '@tachui/modifiers'

// ============================================================================
// Shadow Configuration Types
// ============================================================================

export interface ShadowConfig {
  x?: number | Signal<number>
  y?: number | Signal<number>
  blur?: number | Signal<number>
  spread?: number | Signal<number>
  color?: string | Signal<string>
  inset?: boolean | Signal<boolean>
}

export interface TextShadowConfig {
  x?: number | Signal<number>
  y?: number | Signal<number>
  blur?: number | Signal<number>
  color?: string | Signal<string>
}

export interface DropShadowConfig {
  x?: number | Signal<number>
  y?: number | Signal<number>
  blur?: number | Signal<number>
  color?: string | Signal<string>
}

export interface ShadowOptions {
  shadow?: ShadowConfig | ShadowConfig[] | string
}

export interface TextShadowOptions {
  textShadow?: TextShadowConfig | TextShadowConfig[] | string
}

export interface DropShadowOptions {
  dropShadow?: DropShadowConfig | DropShadowConfig[] | string
}

export type ReactiveShadowOptions = ReactiveModifierProps<ShadowOptions>
export type ReactiveTextShadowOptions = ReactiveModifierProps<TextShadowOptions>
export type ReactiveDropShadowOptions = ReactiveModifierProps<DropShadowOptions>

// ============================================================================
// Shadow Modifier Classes
// ============================================================================

export class ShadowModifier extends BaseModifier<ShadowOptions> {
  readonly type = 'shadow'
  readonly priority = 25

  constructor(options: ReactiveShadowOptions) {
    const resolvedOptions: ShadowOptions = {}
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

    this.applyShadowStyles(context.element, this.properties)

    return undefined
  }

  private applyShadowStyles(element: Element, props: ShadowOptions): void {
    if (!props.shadow) return

    if (typeof props.shadow === 'string') {
      // Direct CSS string
      this.applyStyles(element, { boxShadow: props.shadow })
    } else if (Array.isArray(props.shadow)) {
      // Multiple shadows
      this.applyMultipleShadows(element, props.shadow)
    } else {
      // Single shadow config
      this.applySingleShadow(element, props.shadow)
    }
  }

  private applySingleShadow(element: Element, config: ShadowConfig): void {
    // Check if any values are reactive
    const hasReactiveValues = Object.values(config).some(
      value => isSignal(value) || isComputed(value)
    )

    if (hasReactiveValues) {
      // Create reactive effect for shadow
      createEffect(() => {
        const shadowValue = this.generateShadowCSS(config)
        this.applyStyleChange(element, 'boxShadow', shadowValue)
      })
    } else {
      // Static shadow
      const shadowValue = this.generateShadowCSS(config)
      this.applyStyles(element, { boxShadow: shadowValue })
    }
  }

  private applyMultipleShadows(
    element: Element,
    configs: ShadowConfig[]
  ): void {
    // Check if any shadow configs have reactive values
    const hasReactiveValues = configs.some(config =>
      Object.values(config).some(value => isSignal(value) || isComputed(value))
    )

    if (hasReactiveValues) {
      // Create reactive effect for multiple shadows
      createEffect(() => {
        const shadowValues = configs
          .map(config => this.generateShadowCSS(config))
          .join(', ')
        this.applyStyleChange(element, 'boxShadow', shadowValues)
      })
    } else {
      // Static multiple shadows
      const shadowValues = configs
        .map(config => this.generateShadowCSS(config))
        .join(', ')
      this.applyStyles(element, { boxShadow: shadowValues })
    }
  }

  private generateShadowCSS(config: ShadowConfig): string {
    const x = this.resolveValue(config.x, 0)
    const y = this.resolveValue(config.y, 0)
    const blur = this.resolveValue(config.blur, 0)
    const spread =
      config.spread !== undefined ? this.resolveValue(config.spread, 0) : 0
    const color = this.resolveValue(config.color, 'rgba(0,0,0,0.25)')
    const inset = this.resolveValue(config.inset, false)

    const insetPrefix = inset ? 'inset ' : ''
    return `${insetPrefix}${x}px ${y}px ${blur}px ${spread}px ${color}`
  }

  private resolveValue<T>(value: T | Signal<T>, defaultValue: T): T {
    if (isSignal(value) || isComputed(value)) {
      return (value as any)()
    }
    return value !== undefined ? value : defaultValue
  }
}

export class TextShadowModifier extends BaseModifier<TextShadowOptions> {
  readonly type = 'textShadow'
  readonly priority = 26

  constructor(options: ReactiveTextShadowOptions) {
    const resolvedOptions: TextShadowOptions = {}
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

    this.applyTextShadowStyles(context.element, this.properties)

    return undefined
  }

  private applyTextShadowStyles(
    element: Element,
    props: TextShadowOptions
  ): void {
    if (!props.textShadow) return

    if (typeof props.textShadow === 'string') {
      // Direct CSS string
      this.applyStyles(element, { textShadow: props.textShadow })
    } else if (Array.isArray(props.textShadow)) {
      // Multiple text shadows
      this.applyMultipleTextShadows(element, props.textShadow)
    } else {
      // Single text shadow config
      this.applySingleTextShadow(element, props.textShadow)
    }
  }

  private applySingleTextShadow(
    element: Element,
    config: TextShadowConfig
  ): void {
    // Check if any values are reactive
    const hasReactiveValues = Object.values(config).some(
      value => isSignal(value) || isComputed(value)
    )

    if (hasReactiveValues) {
      // Create reactive effect for text shadow
      createEffect(() => {
        const shadowValue = this.generateTextShadowCSS(config)
        this.applyStyleChange(element, 'textShadow', shadowValue)
      })
    } else {
      // Static text shadow
      const shadowValue = this.generateTextShadowCSS(config)
      this.applyStyles(element, { textShadow: shadowValue })
    }
  }

  private applyMultipleTextShadows(
    element: Element,
    configs: TextShadowConfig[]
  ): void {
    // Check if any shadow configs have reactive values
    const hasReactiveValues = configs.some(config =>
      Object.values(config).some(value => isSignal(value) || isComputed(value))
    )

    if (hasReactiveValues) {
      // Create reactive effect for multiple text shadows
      createEffect(() => {
        const shadowValues = configs
          .map(config => this.generateTextShadowCSS(config))
          .join(', ')
        this.applyStyleChange(element, 'textShadow', shadowValues)
      })
    } else {
      // Static multiple text shadows
      const shadowValues = configs
        .map(config => this.generateTextShadowCSS(config))
        .join(', ')
      this.applyStyles(element, { textShadow: shadowValues })
    }
  }

  private generateTextShadowCSS(config: TextShadowConfig): string {
    const x = this.resolveValue(config.x, 0)
    const y = this.resolveValue(config.y, 0)
    const blur = this.resolveValue(config.blur, 0)
    const color = this.resolveValue(config.color, 'rgba(0,0,0,0.5)')

    return `${x}px ${y}px ${blur}px ${color}`
  }

  private resolveValue<T>(value: T | Signal<T>, defaultValue: T): T {
    if (isSignal(value) || isComputed(value)) {
      return (value as any)()
    }
    return value !== undefined ? value : defaultValue
  }
}

export class DropShadowModifier extends BaseModifier<DropShadowOptions> {
  readonly type = 'dropShadow'
  readonly priority = 27

  constructor(options: ReactiveDropShadowOptions) {
    const resolvedOptions: DropShadowOptions = {}
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

    this.applyDropShadowStyles(context.element, this.properties)

    return undefined
  }

  private applyDropShadowStyles(
    element: Element,
    props: DropShadowOptions
  ): void {
    if (!props.dropShadow) return

    if (typeof props.dropShadow === 'string') {
      // Direct CSS string
      this.applyFilterDropShadow(element, props.dropShadow)
    } else if (Array.isArray(props.dropShadow)) {
      // Multiple drop shadows
      this.applyMultipleDropShadows(element, props.dropShadow)
    } else {
      // Single drop shadow config
      this.applySingleDropShadow(element, props.dropShadow)
    }
  }

  private applySingleDropShadow(
    element: Element,
    config: DropShadowConfig
  ): void {
    // Check if any values are reactive
    const hasReactiveValues = Object.values(config).some(
      value => isSignal(value) || isComputed(value)
    )

    if (hasReactiveValues) {
      // Create reactive effect for drop shadow
      createEffect(() => {
        const shadowValue = this.generateDropShadowCSS(config)
        this.applyFilterDropShadow(element, shadowValue)
      })
    } else {
      // Static drop shadow
      const shadowValue = this.generateDropShadowCSS(config)
      this.applyFilterDropShadow(element, shadowValue)
    }
  }

  private applyMultipleDropShadows(
    element: Element,
    configs: DropShadowConfig[]
  ): void {
    // Check if any shadow configs have reactive values
    const hasReactiveValues = configs.some(config =>
      Object.values(config).some(value => isSignal(value) || isComputed(value))
    )

    if (hasReactiveValues) {
      // Create reactive effect for multiple drop shadows
      createEffect(() => {
        const shadowValues = configs
          .map(config => `drop-shadow(${this.generateDropShadowCSS(config)})`)
          .join(' ')
        this.applyStyles(element, { filter: shadowValues })
      })
    } else {
      // Static multiple drop shadows
      const shadowValues = configs
        .map(config => `drop-shadow(${this.generateDropShadowCSS(config)})`)
        .join(' ')
      this.applyStyles(element, { filter: shadowValues })
    }
  }

  private applyFilterDropShadow(element: Element, shadowValue: string): void {
    // Get existing filter and add/update drop-shadow
    const existingFilter = (element as HTMLElement).style.filter || ''
    const otherFilters = existingFilter
      .split(' ')
      .filter(f => f && !f.startsWith('drop-shadow('))
      .join(' ')

    const newFilter = otherFilters
      ? `${otherFilters} drop-shadow(${shadowValue})`
      : `drop-shadow(${shadowValue})`

    this.applyStyles(element, { filter: newFilter })
  }

  private generateDropShadowCSS(config: DropShadowConfig): string {
    const x = this.resolveValue(config.x, 0)
    const y = this.resolveValue(config.y, 0)
    const blur = this.resolveValue(config.blur, 0)
    const color = this.resolveValue(config.color, 'rgba(0,0,0,0.25)')

    return `${x}px ${y}px ${blur}px ${color}`
  }

  private resolveValue<T>(value: T | Signal<T>, defaultValue: T): T {
    if (isSignal(value) || isComputed(value)) {
      return (value as any)()
    }
    return value !== undefined ? value : defaultValue
  }
}

// ============================================================================
// Shadow Functions - Basic shadow modifiers
// ============================================================================

/**
 * General box shadow modifier with flexible configuration
 *
 * @example
 * ```typescript
 * .shadow({ x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,0.1)' })
 * .shadow('0 2px 4px rgba(0,0,0,0.1)')  // Direct CSS shadow string
 * ```
 */
export function shadow(
  config: ShadowConfig | ShadowConfig[] | string
): ShadowModifier {
  return new ShadowModifier({ shadow: config })
}

/**
 * Text shadow modifier for typography effects
 *
 * @example
 * ```typescript
 * .textShadow({ x: 1, y: 1, blur: 2, color: 'rgba(0,0,0,0.5)' })
 * .textShadow('1px 1px 2px rgba(0,0,0,0.5)')  // Direct CSS text shadow
 * ```
 */
export function textShadow(
  config: TextShadowConfig | TextShadowConfig[] | string
): TextShadowModifier {
  return new TextShadowModifier({ textShadow: config })
}

/**
 * Filter-based drop shadow modifier (alternative to box-shadow)
 *
 * @example
 * ```typescript
 * .dropShadow({ x: 0, y: 4, blur: 8, color: 'rgba(0,0,0,0.2)' })
 * .dropShadow('0 4px 8px rgba(0,0,0,0.2)')  // Direct CSS drop shadow
 * ```
 */
export function dropShadow(
  config: DropShadowConfig | DropShadowConfig[] | string
): DropShadowModifier {
  return new DropShadowModifier({ dropShadow: config })
}

/**
 * Multiple box shadows for complex shadow effects
 *
 * @example
 * ```typescript
 * .shadows([
 *   { x: 0, y: 1, blur: 3, color: 'rgba(0,0,0,0.12)' },
 *   { x: 0, y: 1, blur: 2, color: 'rgba(0,0,0,0.24)' }
 * ])
 * ```
 */
export function shadows(configs: ShadowConfig[]): ShadowModifier {
  return new ShadowModifier({ shadow: configs })
}

/**
 * Inset shadow for inner depth effects
 *
 * @example
 * ```typescript
 * .insetShadow({ x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,0.1)' })
 * ```
 */
export function insetShadow(
  config: Omit<ShadowConfig, 'inset'>
): ShadowModifier {
  return new ShadowModifier({ shadow: { ...config, inset: true } })
}

// ============================================================================
// Shadow Presets - Common shadow patterns
// ============================================================================

export type ShadowPreset =
  | 'none'
  | 'small'
  | 'medium'
  | 'large'
  | 'xlarge'
  | '2xlarge'
  | 'inner'
  | 'outline'

/**
 * Predefined shadow presets based on common design patterns
 *
 * @example
 * ```typescript
 * .shadowPreset('small')    // Subtle shadow
 * .shadowPreset('medium')   // Standard shadow
 * .shadowPreset('large')    // Prominent shadow
 * .shadowPreset('inner')    // Inset shadow
 * ```
 */
export function shadowPreset(preset: ShadowPreset): ShadowModifier {
  const presets: Record<ShadowPreset, ShadowConfig | ShadowConfig[] | string> =
    {
      none: 'none',
      small: { x: 0, y: 1, blur: 3, spread: 0, color: 'rgba(0, 0, 0, 0.12)' },
      medium: { x: 0, y: 4, blur: 6, spread: -1, color: 'rgba(0, 0, 0, 0.1)' },
      large: { x: 0, y: 10, blur: 15, spread: -3, color: 'rgba(0, 0, 0, 0.1)' },
      xlarge: {
        x: 0,
        y: 20,
        blur: 25,
        spread: -5,
        color: 'rgba(0, 0, 0, 0.1)',
      },
      '2xlarge': {
        x: 0,
        y: 25,
        blur: 50,
        spread: -12,
        color: 'rgba(0, 0, 0, 0.25)',
      },
      inner: {
        x: 0,
        y: 2,
        blur: 4,
        spread: 0,
        color: 'rgba(0, 0, 0, 0.06)',
        inset: true,
      },
      outline: { x: 0, y: 0, blur: 0, spread: 1, color: 'rgba(0, 0, 0, 0.05)' },
    }

  return new ShadowModifier({ shadow: presets[preset] })
}

/**
 * Material Design elevation shadows
 *
 * @example
 * ```typescript
 * .elevationShadow(1)    // Card elevation
 * .elevationShadow(4)    // Button elevation
 * .elevationShadow(8)    // Modal elevation
 * ```
 */
export function elevationShadow(level: number): ShadowModifier {
  const elevations: Record<number, ShadowConfig[]> = {
    0: [],
    1: [
      { x: 0, y: 1, blur: 3, spread: 0, color: 'rgba(0, 0, 0, 0.12)' },
      { x: 0, y: 1, blur: 2, spread: 0, color: 'rgba(0, 0, 0, 0.24)' },
    ],
    2: [
      { x: 0, y: 3, blur: 6, spread: 0, color: 'rgba(0, 0, 0, 0.15)' },
      { x: 0, y: 2, blur: 4, spread: 0, color: 'rgba(0, 0, 0, 0.12)' },
    ],
    3: [
      { x: 0, y: 10, blur: 20, spread: 0, color: 'rgba(0, 0, 0, 0.15)' },
      { x: 0, y: 3, blur: 6, spread: 0, color: 'rgba(0, 0, 0, 0.10)' },
    ],
    4: [
      { x: 0, y: 15, blur: 25, spread: 0, color: 'rgba(0, 0, 0, 0.15)' },
      { x: 0, y: 5, blur: 10, spread: 0, color: 'rgba(0, 0, 0, 0.12)' },
    ],
    8: [
      { x: 0, y: 30, blur: 60, spread: 0, color: 'rgba(0, 0, 0, 0.15)' },
      { x: 0, y: 8, blur: 16, spread: 0, color: 'rgba(0, 0, 0, 0.12)' },
    ],
  }

  const shadowConfig = elevations[level] || elevations[1]
  return new ShadowModifier({ shadow: shadowConfig })
}

// ============================================================================
// Specialized Shadow Effects
// ============================================================================

/**
 * Glow effect using multiple colored shadows
 *
 * @example
 * ```typescript
 * .glowEffect('#007AFF', 4)     // Blue glow
 * .glowEffect('#FF3B30', 8)     // Red glow with larger radius
 * ```
 */
export function glowEffect(
  color: string,
  intensity: number = 6
): ShadowModifier {
  const shadows: ShadowConfig[] = [
    { x: 0, y: 0, blur: intensity, spread: 0, color },
    { x: 0, y: 0, blur: intensity * 2, spread: 0, color: color + '80' }, // 50% opacity
    { x: 0, y: 0, blur: intensity * 3, spread: 0, color: color + '40' }, // 25% opacity
  ]

  return new ShadowModifier({ shadow: shadows })
}

/**
 * Neon effect with bright colored glow
 *
 * @example
 * ```typescript
 * .neonEffect('#00FF00')        // Green neon
 * .neonEffect('#FF006E', 8)     // Pink neon with custom intensity
 * ```
 */
export function neonEffect(
  color: string,
  intensity: number = 10
): ShadowModifier {
  const shadows: ShadowConfig[] = [
    { x: 0, y: 0, blur: intensity / 2, spread: 0, color },
    { x: 0, y: 0, blur: intensity, spread: 0, color: color + 'CC' }, // 80% opacity
    { x: 0, y: 0, blur: intensity * 2, spread: 0, color: color + '99' }, // 60% opacity
    { x: 0, y: 0, blur: intensity * 3, spread: 0, color: color + '66' }, // 40% opacity
  ]

  return new ShadowModifier({ shadow: shadows })
}

/**
 * Neumorphism (soft UI) shadow effect
 *
 * @example
 * ```typescript
 * .neumorphism('#f0f0f0')          // Light neumorphism
 * .neumorphism('#2d2d2d', true)    // Dark neumorphism
 * ```
 */
export function neumorphism(
  _backgroundColor: string,
  dark: boolean = false
): ShadowModifier {
  const lightColor = dark
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(255, 255, 255, 0.7)'
  const darkColor = dark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.15)'

  const shadows: ShadowConfig[] = [
    { x: -8, y: -8, blur: 16, spread: 0, color: lightColor }, // Top-left light
    { x: 8, y: 8, blur: 16, spread: 0, color: darkColor }, // Bottom-right dark
  ]

  return new ShadowModifier({ shadow: shadows })
}

/**
 * Pressed/inset neumorphism effect
 *
 * @example
 * ```typescript
 * .neumorphismPressed('#f0f0f0')   // Light pressed effect
 * ```
 */
export function neumorphismPressed(
  _backgroundColor: string,
  dark: boolean = false
): ShadowModifier {
  const lightColor = dark
    ? 'rgba(255, 255, 255, 0.05)'
    : 'rgba(255, 255, 255, 0.5)'
  const darkColor = dark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.2)'

  const shadows: ShadowConfig[] = [
    { x: 8, y: 8, blur: 16, spread: 0, color: darkColor, inset: true }, // Inner dark
    { x: -8, y: -8, blur: 16, spread: 0, color: lightColor, inset: true }, // Inner light
  ]

  return new ShadowModifier({ shadow: shadows })
}

/**
 * Layered shadow for depth perception
 *
 * @example
 * ```typescript
 * .layeredShadow()           // Default layered effect
 * .layeredShadow(3, 0.8)     // 3 layers with 80% opacity multiplier
 * ```
 */
export function layeredShadow(
  layers: number = 3,
  opacityMultiplier: number = 0.6
): ShadowModifier {
  const shadows: ShadowConfig[] = []

  for (let i = 1; i <= layers; i++) {
    const opacity = Math.max(0.05, opacityMultiplier * (1 - (i - 1) / layers))
    shadows.push({
      x: 0,
      y: i * 2,
      blur: i * 4,
      spread: 0,
      color: `rgba(0, 0, 0, ${opacity})`,
    })
  }

  return new ShadowModifier({ shadow: shadows })
}

// ============================================================================
// Text Shadow Presets
// ============================================================================

/**
 * Subtle text shadow for readability on light backgrounds
 *
 * @example
 * ```typescript
 * .textShadowSubtle()                    // Default subtle shadow
 * .textShadowSubtle('rgba(0,0,0,0.3)')   // Custom color
 * ```
 */
export function textShadowSubtle(
  color: string = 'rgba(0, 0, 0, 0.2)'
): TextShadowModifier {
  return new TextShadowModifier({
    textShadow: { x: 0, y: 1, blur: 1, color },
  })
}

/**
 * Strong text shadow for readability on busy backgrounds
 *
 * @example
 * ```typescript
 * .textShadowStrong()                    // Default strong shadow
 * .textShadowStrong('rgba(0,0,0,0.8)')   // Custom color
 * ```
 */
export function textShadowStrong(
  color: string = 'rgba(0, 0, 0, 0.5)'
): TextShadowModifier {
  return new TextShadowModifier({
    textShadow: { x: 1, y: 1, blur: 3, color },
  })
}

/**
 * Outline text effect using multiple text shadows
 *
 * @example
 * ```typescript
 * .textOutline('#000000')          // Black outline
 * .textOutline('#FFFFFF', 2)       // White outline with 2px thickness
 * ```
 */
export function textOutline(
  color: string,
  thickness: number = 1
): TextShadowModifier {
  const shadows: TextShadowConfig[] = []

  // Create shadows in all directions for outline effect
  for (let x = -thickness; x <= thickness; x++) {
    for (let y = -thickness; y <= thickness; y++) {
      if (x !== 0 || y !== 0) {
        shadows.push({ x, y, blur: 0, color })
      }
    }
  }

  return new TextShadowModifier({ textShadow: shadows })
}

/**
 * Embossed text effect
 *
 * @example
 * ```typescript
 * .textEmbossed()                      // Default embossed effect
 * .textEmbossed('#ffffff', '#000000')  // Custom light and dark colors
 * ```
 */
export function textEmbossed(
  lightColor: string = 'rgba(255, 255, 255, 0.8)',
  darkColor: string = 'rgba(0, 0, 0, 0.3)'
): TextShadowModifier {
  const shadows: TextShadowConfig[] = [
    { x: 0, y: 1, blur: 0, color: lightColor }, // Light highlight
    { x: 0, y: -1, blur: 0, color: darkColor }, // Dark shadow
  ]

  return new TextShadowModifier({ textShadow: shadows })
}

/**
 * Engraved text effect (opposite of embossed)
 *
 * @example
 * ```typescript
 * .textEngraved()                      // Default engraved effect
 * .textEngraved('#000000', '#ffffff')  // Custom dark and light colors
 * ```
 */
export function textEngraved(
  darkColor: string = 'rgba(0, 0, 0, 0.5)',
  lightColor: string = 'rgba(255, 255, 255, 0.2)'
): TextShadowModifier {
  const shadows: TextShadowConfig[] = [
    { x: 0, y: 1, blur: 0, color: darkColor }, // Dark shadow
    { x: 0, y: -1, blur: 0, color: lightColor }, // Light highlight
  ]

  return new TextShadowModifier({ textShadow: shadows })
}

// ============================================================================
// SwiftUI Compatibility Functions
// ============================================================================

/**
 * SwiftUI-compatible shadow modifier (matches SwiftUI .shadow() behavior)
 *
 * @example
 * ```typescript
 * .swiftUIShadow()                           // Default SwiftUI shadow
 * .swiftUIShadow({ radius: 8, y: 4 })        // Custom SwiftUI shadow
 * ```
 */
export function swiftUIShadow(
  config: {
    color?: string
    radius?: number
    x?: number
    y?: number
  } = {}
): ShadowModifier {
  const { color = 'rgba(0, 0, 0, 0.2)', radius = 10, x = 0, y = 0 } = config

  return new ShadowModifier({
    shadow: { x, y, blur: radius, color },
  })
}

/**
 * Convenience functions for common shadow directions
 */
export const shadowDirections = {
  /**
   * Top shadow (light coming from below)
   */
  top: (intensity: number = 4): ShadowModifier =>
    shadow({
      x: 0,
      y: -intensity,
      blur: intensity * 2,
      color: 'rgba(0,0,0,0.15)',
    }),

  /**
   * Bottom shadow (light coming from above) - most common
   */
  bottom: (intensity: number = 4): ShadowModifier =>
    shadow({
      x: 0,
      y: intensity,
      blur: intensity * 2,
      color: 'rgba(0,0,0,0.15)',
    }),

  /**
   * Left shadow (light coming from right)
   */
  left: (intensity: number = 4): ShadowModifier =>
    shadow({
      x: -intensity,
      y: 0,
      blur: intensity * 2,
      color: 'rgba(0,0,0,0.15)',
    }),

  /**
   * Right shadow (light coming from left)
   */
  right: (intensity: number = 4): ShadowModifier =>
    shadow({
      x: intensity,
      y: 0,
      blur: intensity * 2,
      color: 'rgba(0,0,0,0.15)',
    }),

  /**
   * All-around shadow (ambient lighting)
   */
  around: (intensity: number = 6): ShadowModifier =>
    shadow({
      x: 0,
      y: 0,
      blur: intensity * 2,
      spread: intensity,
      color: 'rgba(0,0,0,0.1)',
    }),
}

// ============================================================================
// Reactive Shadow Helpers
// ============================================================================

/**
 * Create a reactive shadow that responds to a signal
 *
 * @example
 * ```typescript
 * const isHovered = createSignal(false)
 * .reactiveShadow(isHovered,
 *   { x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,0.1)' },  // normal
 *   { x: 0, y: 8, blur: 16, color: 'rgba(0,0,0,0.2)' }  // hovered
 * )
 * ```
 */
export function reactiveShadow(
  condition: Signal<boolean>,
  trueShadow: ShadowConfig,
  falseShadow: ShadowConfig = { x: 0, y: 0, blur: 0, color: 'transparent' }
): ShadowModifier {
  // For now, return a basic shadow based on the current condition state
  // Full reactive implementation would require more complex signal handling
  const currentShadow = condition() ? trueShadow : falseShadow

  return new ShadowModifier({ shadow: currentShadow })
}

/**
 * Animated shadow that transitions between states
 *
 * @example
 * ```typescript
 * .animatedShadow(300)  // 300ms transition
 * ```
 */
export function animatedShadow(_duration: number = 200): ShadowModifier {
  // This would need to be combined with transition modifier
  // For now, return a basic shadow that can be overridden
  return shadowPreset('medium')
}
