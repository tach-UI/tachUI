/**
 * Margin Modifier - spacing around elements
 *
 * Provides a unified interface for setting element margins
 * with support for shorthand and directional properties.
 */

// CSS-compatible margin values
export type MarginValue = number | string

// Type-safe options with conflict prevention
export type MarginOptions =
  | {
      all: MarginValue
      vertical?: never
      horizontal?: never
      top?: never
      right?: never
      bottom?: never
      left?: never
    }
  | {
      all?: never
      vertical: MarginValue
      horizontal: MarginValue
      top?: never
      right?: never
      bottom?: never
      left?: never
    }
  | {
      all?: never
      vertical?: MarginValue
      horizontal?: MarginValue
      top?: MarginValue
      right?: MarginValue
      bottom?: MarginValue
      left?: MarginValue
    }

// TODO: Implement full MarginModifier when core imports are available
export class MarginModifier {
  readonly type = 'margin'
  readonly priority = 50

  constructor(public readonly properties: any) {}
}

export function margin(options: any): MarginModifier
export function margin(all: MarginValue): MarginModifier
export function margin(optionsOrAll: any | MarginValue): MarginModifier {
  if (typeof optionsOrAll === 'number' || typeof optionsOrAll === 'string') {
    return new MarginModifier({ all: optionsOrAll })
  }
  return new MarginModifier(optionsOrAll)
}

export function marginTop(value: MarginValue): MarginModifier {
  return new MarginModifier({ top: value })
}

export function marginBottom(value: MarginValue): MarginModifier {
  return new MarginModifier({ bottom: value })
}

export function marginHorizontal(value: MarginValue): MarginModifier {
  return new MarginModifier({ horizontal: value })
}

export function marginVertical(value: MarginValue): MarginModifier {
  return new MarginModifier({ vertical: value })
}

export function marginLeft(value: MarginValue): MarginModifier {
  return new MarginModifier({ left: value })
}

export function marginRight(value: MarginValue): MarginModifier {
  return new MarginModifier({ right: value })
}
