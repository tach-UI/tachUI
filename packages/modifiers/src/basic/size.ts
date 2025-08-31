/**
 * Size Modifier - width, height, min/max dimensions
 *
 * Provides a unified interface for setting element dimensions
 * with support for SwiftUI-style infinity constants.
 */

export interface SizeOptions {
  width?: any // TODO: Use Dimension type when imports available
  height?: any
  minWidth?: any
  maxWidth?: any
  minHeight?: any
  maxHeight?: any
}

// TODO: Implement full SizeModifier when core imports are available
export class SizeModifier {
  readonly type = 'size'
  readonly priority = 80

  constructor(public readonly properties: any) {}
}

export function size(options: any): SizeModifier {
  return new SizeModifier(options)
}

export function width(value: any): SizeModifier {
  return new SizeModifier({ width: value })
}

export function height(value: any): SizeModifier {
  return new SizeModifier({ height: value })
}

export function maxWidth(value: any): SizeModifier {
  return new SizeModifier({ maxWidth: value })
}

export function minWidth(value: any): SizeModifier {
  return new SizeModifier({ minWidth: value })
}

export function maxHeight(value: any): SizeModifier {
  return new SizeModifier({ maxHeight: value })
}

export function minHeight(value: any): SizeModifier {
  return new SizeModifier({ minHeight: value })
}
