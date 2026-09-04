import { Asset } from '../assets/Asset'
import type { GradientAssetDefinitions, GradientDefinition } from './types'
import { gradientToCSS, gradientToDeclarations } from './css-generator'

export class GradientAsset extends Asset<string> {
  constructor(
    name: string,
    private definitions: GradientAssetDefinitions
  ) {
    super(name)
  }

  resolve(): string {
    return gradientToCSS(this.currentDefinition())
  }

  /**
   * The fallback pair for the current theme (see `gradientToDeclarations`).
   * Background modifiers prefer this over `resolve()` when present.
   */
  resolveDeclarations(): string[] {
    return gradientToDeclarations(this.currentDefinition())
  }

  private currentDefinition(): GradientDefinition {
    const currentTheme = this.getCurrentTheme()
    return this.definitions[currentTheme] || this.definitions.light
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
