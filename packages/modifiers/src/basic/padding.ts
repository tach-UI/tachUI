/**
 * Padding Modifier - internal spacing within elements
 *
 * Provides a comprehensive interface for setting element padding
 * with support for shorthand and directional properties, matching SwiftUI's padding modifiers.
 */

// CSS-compatible padding values
export type PaddingValue = number | string

// Type-safe options with conflict prevention
export type PaddingOptions =
  | {
      all: PaddingValue
      vertical?: never
      horizontal?: never
      top?: never
      right?: never
      bottom?: never
      left?: never
      leading?: never
      trailing?: never
    }
  | {
      all?: never
      vertical: PaddingValue
      horizontal: PaddingValue
      top?: never
      right?: never
      bottom?: never
      left?: never
      leading?: never
      trailing?: never
    }
  | {
      all?: never
      vertical?: PaddingValue
      horizontal?: PaddingValue
      top?: PaddingValue
      right?: PaddingValue
      bottom?: PaddingValue
      left?: PaddingValue
      leading?: never
      trailing?: never
    }
  | {
      all?: never
      vertical?: PaddingValue
      horizontal?: PaddingValue
      top?: PaddingValue
      leading?: PaddingValue
      trailing?: PaddingValue
      bottom?: PaddingValue
      right?: never
      left?: never
    }

// TODO: Implement full PaddingModifier when core imports are available
export class PaddingModifier {
  readonly type = 'padding'
  readonly priority = 45

  constructor(public readonly properties: any) {}
}

// Convenience functions for creating padding modifiers
export function padding(value: PaddingValue): PaddingModifier {
  return new PaddingModifier({ all: value })
}

export function paddingVertical(value: PaddingValue): PaddingModifier {
  return new PaddingModifier({ vertical: value, horizontal: 0 })
}

export function paddingHorizontal(value: PaddingValue): PaddingModifier {
  return new PaddingModifier({ vertical: 0, horizontal: value })
}

export function paddingTop(value: PaddingValue): PaddingModifier {
  return new PaddingModifier({ top: value })
}

export function paddingBottom(value: PaddingValue): PaddingModifier {
  return new PaddingModifier({ bottom: value })
}

export function paddingLeft(value: PaddingValue): PaddingModifier {
  return new PaddingModifier({ left: value })
}

export function paddingRight(value: PaddingValue): PaddingModifier {
  return new PaddingModifier({ right: value })
}

export function paddingLeading(value: PaddingValue): PaddingModifier {
  return new PaddingModifier({ leading: value })
}

export function paddingTrailing(value: PaddingValue): PaddingModifier {
  return new PaddingModifier({ trailing: value })
}

export const paddingPresets = {
  none: () => padding(0),
  xs: () => padding(4),
  sm: () => padding(8),
  md: () => padding(16),
  lg: () => padding(24),
  xl: () => padding(32),
  '2xl': () => padding(48),
} as const
