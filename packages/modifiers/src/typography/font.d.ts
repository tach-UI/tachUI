/**
 * Font Modifiers
 *
 * SwiftUI-style font configuration modifiers
 */
import {
  TypographyModifier,
  type FontStyle,
  type FontWeight,
} from './typography'
export interface FontOptions {
  family?: string | any
  size?: number | string
  weight?: FontWeight | any
  style?: FontStyle
}
export declare function font(options: FontOptions | string): TypographyModifier
export declare function system(options: {
  size?: number | string
  weight?: FontWeight | any
  design?: 'default' | 'serif' | 'rounded' | 'monospaced'
}): TypographyModifier
export declare function custom(
  family: string | any,
  options?: {
    size?: number | string
    weight?: FontWeight | any
    style?: FontStyle
  }
): TypographyModifier
//# sourceMappingURL=font.d.ts.map
