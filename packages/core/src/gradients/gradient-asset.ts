import { Asset } from '../assets/Asset'
import type { GradientAssetDefinitions } from './types'
import { gradientToCSS } from './css-generator'

export class GradientAsset extends Asset<string> {
  constructor(
    name: string,
    private definitions: GradientAssetDefinitions
  ) {
    super(name)
  }

  resolve(): string {
    const currentTheme = this.getCurrentTheme()
    const gradientDef = this.definitions[currentTheme] || this.definitions.light
    return gradientToCSS(gradientDef)
  }

  private getCurrentTheme(): string {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      return prefersDark ? 'dark' : 'light'
    }
    return 'light'
  }
}

export function createGradientAsset(definitions: GradientAssetDefinitions): GradientAsset {
  return new GradientAsset('gradient-asset', definitions)
}