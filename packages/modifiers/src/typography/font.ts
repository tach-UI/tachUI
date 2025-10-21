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
import type {
  Asset,
  ColorAssetProxy,
  ImageAssetProxy,
  FontAssetProxy,
} from '@tachui/core/assets'

type FontAssetInput = Asset | ColorAssetProxy | ImageAssetProxy | FontAssetProxy

export interface FontOptions {
  family?: string | FontAssetInput
  size?: number | string
  weight?: FontWeight | any
  style?: FontStyle
}

export function font(options: FontOptions | string): TypographyModifier {
  if (typeof options === 'string') {
    return handleFontPreset(options)
  }

  return new TypographyModifier({
    family: options.family,
    size: options.size,
    weight: options.weight,
    style: options.style,
  })
}

function handleFontPreset(preset: string): TypographyModifier {
  const presets: Record<string, FontOptions> = {
    '.largeTitle': { size: 34, weight: 400 },
    '.title': { size: 28, weight: 400 },
    '.title2': { size: 22, weight: 400 },
    '.title3': { size: 20, weight: 400 },
    '.headline': { size: 17, weight: 600 },
    '.subheadline': { size: 15, weight: 400 },
    '.body': { size: 17, weight: 400 },
    '.callout': { size: 16, weight: 400 },
    '.footnote': { size: 13, weight: 400 },
    '.caption': { size: 12, weight: 400 },
    '.caption2': { size: 11, weight: 400 },
  }

  const presetOptions = presets[preset]
  if (!presetOptions) {
    return new TypographyModifier(presets['.body'])
  }

  return new TypographyModifier(presetOptions)
}

export function system(options: {
  size?: number | string
  weight?: FontWeight | any
  design?: 'default' | 'serif' | 'rounded' | 'monospaced'
}): TypographyModifier {
  let family: string

  switch (options.design) {
    case 'serif':
      family = 'ui-serif, Georgia, serif'
      break
    case 'rounded':
      family = 'ui-rounded, system-ui, -apple-system, sans-serif'
      break
    case 'monospaced':
      family = 'ui-monospace, SFMono-Regular, Consolas, monospace'
      break
    default:
      family = 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
  }

  return new TypographyModifier({
    family,
    size: options.size,
    weight: options.weight,
  })
}

export function custom(
  family: string | FontAssetInput,
  options?: {
    size?: number | string
    weight?: FontWeight | any
    style?: FontStyle
  }
): TypographyModifier {
  return new TypographyModifier({
    family,
    size: options?.size,
    weight: options?.weight,
    style: options?.style,
  })
}
