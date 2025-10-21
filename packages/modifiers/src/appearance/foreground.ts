/**
 * Foreground Modifiers
 *
 * Text color and foreground styling modifiers
 */

import { BaseModifier } from '../basic/base'
import { createEffect, getThemeSignal } from '@tachui/core/reactive'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'

export interface ForegroundOptions {
  color: string | any // Allow ColorAssets, signals, and computed values
}

export class ForegroundModifier extends BaseModifier<ForegroundOptions> {
  readonly type = 'foreground'
  readonly priority = 90

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    // Check if color is a ColorAsset and apply with theme reactivity
    if (this.isColorAsset(this.properties.color)) {
      this.applyColorAssetWithThemeReactivity(context.element, 'color', this.properties.color)
    } else {
      // Handle normal values (strings, signals, computed)
      const styles = {
        color: this.properties.color,
      }
      this.applyStyles(context.element, styles)
    }

    return undefined
  }

  /**
   * Check if a value is a ColorAsset (has a resolve method)
   */
  private isColorAsset(value: any): boolean {
    return (
      value !== null &&
      value !== undefined &&
      typeof value === 'object' &&
      'resolve' in value &&
      typeof value.resolve === 'function'
    )
  }

  /**
   * Apply ColorAsset with theme reactivity
   * This mirrors the core AppearanceModifier pattern
   */
  private applyColorAssetWithThemeReactivity(
    element: Element,
    property: string,
    asset: any
  ): void {
    const themeSignal = getThemeSignal()

    createEffect(() => {
      // Watch theme changes to trigger re-resolution
      themeSignal()
      // Re-resolve Asset when theme changes
      const resolved = asset.resolve()
      this.applyStyleChange(element, property, resolved)
    })
  }
}

export function foregroundColor(color: string | any): ForegroundModifier {
  return new ForegroundModifier({ color })
}

export function foreground(color: string | any): ForegroundModifier {
  return new ForegroundModifier({ color })
}
