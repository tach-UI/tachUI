/**
 * Background Modifiers
 *
 * Background styling modifiers with asset and gradient support
 */

import { BaseModifier } from '../basic/base'
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

    console.log(
      'BackgroundModifier apply - background value:',
      this.properties.background,
      'type:',
      typeof this.properties.background
    )

    // Use reactive infrastructure instead of direct style setting
    const styles = {
      background: this.properties.background,
    }

    this.applyStyles(context.element, styles)

    return undefined
  }

  private resolveBackground(background: any): string {
    if (typeof background === 'string') {
      return background
    }

    if (
      typeof background === 'object' &&
      background !== null &&
      'resolve' in background
    ) {
      return background.resolve()
    }

    if (
      typeof background === 'object' &&
      background !== null &&
      'value' in background
    ) {
      return background.value
    }

    return String(background)
  }
}

export interface BackgroundClipOptions {
  backgroundImage?: string
  backgroundClip?: 'text' | 'border-box' | 'padding-box' | 'content-box'
  color?: string
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

export function backgroundColor(color: string): BackgroundModifier {
  return new BackgroundModifier({ background: color })
}

export function background(value: string): BackgroundModifier {
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
    color: 'transparent',
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
