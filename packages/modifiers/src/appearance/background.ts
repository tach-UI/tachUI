/**
 * Background Modifiers
 *
 * Background styling modifiers with asset and gradient support
 */

import { BaseModifier } from '../basic/base'
import { createEffect, getThemeSignal } from '@tachui/core/reactive'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'

export interface BackgroundOptions {
  background: string | any
}

export class BackgroundModifier extends BaseModifier<BackgroundOptions> {
  readonly type = 'background'
  readonly priority = 95

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    // Check if background is a ColorAsset and apply with theme reactivity
    if (this.isColorAsset(this.properties.background)) {
      this.applyColorAssetWithThemeReactivity(context.element, 'background', this.properties.background)
    } else {
      // Handle normal values (strings, signals, computed, gradients)
      const styles = {
        background: this.properties.background,
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

export interface BackgroundClipOptions {
  backgroundImage?: string
  backgroundClip?: 'text' | 'border-box' | 'padding-box' | 'content-box'
  webkitBackgroundClip?: 'text' | 'border-box' | 'padding-box' | 'content-box'
  color?: string
  webkitTextFillColor?: string
}

export class BackgroundClipModifier extends BaseModifier<BackgroundClipOptions> {
  readonly type = 'backgroundClip'
  readonly priority = 40

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const styles = this.computeBackgroundClipStyles(this.properties)
    this.applyStyles(context.element, styles)

    return undefined
  }

  private computeBackgroundClipStyles(props: BackgroundClipOptions) {
    const styles: Record<string, string> = {}

    if (props.backgroundImage) {
      styles.backgroundImage = props.backgroundImage
    }

    if (props.backgroundClip) {
      styles.backgroundClip = props.backgroundClip
      styles.webkitBackgroundClip = props.backgroundClip
    }

    if (props.color) {
      styles.color = props.color
      if (props.backgroundClip === 'text') {
        styles.webkitTextFillColor = props.color
      }
    }

    return styles
  }
}

export function backgroundColor(color: string | any): BackgroundModifier {
  return new BackgroundModifier({ background: color })
}

export function background(value: string | any): BackgroundModifier {
  return new BackgroundModifier({ background: value })
}

export function backgroundClip(
  backgroundImage: string,
  clip: 'text' | 'border-box' | 'padding-box' | 'content-box' = 'text',
  color: string = 'transparent'
): BackgroundClipModifier {
  return new BackgroundClipModifier({
    backgroundImage,
    backgroundClip: clip,
    color,
  })
}

export function gradientText(gradient: string): BackgroundClipModifier {
  return new BackgroundClipModifier({
    backgroundImage: gradient,
    backgroundClip: 'text',
    webkitBackgroundClip: 'text',
    color: 'transparent',
    webkitTextFillColor: 'transparent',
  })
}

export function blueGradientText(): BackgroundClipModifier {
  return gradientText('linear-gradient(45deg, #007AFF, #5856D6)')
}

export function rainbowGradientText(): BackgroundClipModifier {
  return gradientText(
    'linear-gradient(90deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff80, #0080ff, #8000ff)'
  )
}

export function sunsetGradientText(): BackgroundClipModifier {
  return gradientText('linear-gradient(45deg, #ff6b6b, #feca57, #ff9ff3)')
}

export function oceanGradientText(): BackgroundClipModifier {
  return gradientText('linear-gradient(45deg, #667eea, #764ba2)')
}

export function goldGradientText(): BackgroundClipModifier {
  return gradientText('linear-gradient(45deg, #f7971e, #ffd200)')
}
