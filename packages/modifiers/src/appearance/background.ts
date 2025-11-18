/**
 * Background Modifiers
 *
 * Background styling modifiers with asset and gradient support
 */

import { BaseModifier } from '../basic/base'
import { createEffect, getThemeSignal } from '@tachui/core/reactive'
import type { ModifierContext } from '@tachui/types/modifiers'
import type { DOMNode } from '@tachui/types/runtime'
import type { GradientDefinition } from '@tachui/core/gradients'
import type {
  StatefulBackgroundValue,
  StateGradientOptions,
} from '@tachui/core/gradients/types'
import type { Asset } from '@tachui/core/assets'
import { gradientToCSS } from '@tachui/core/gradients/css-generator'

type BackgroundState = 'default' | 'hover' | 'active' | 'focus' | 'disabled'
type BasicBackgroundValue = string | GradientDefinition | Asset | undefined | null

export interface BackgroundOptions {
  background: StatefulBackgroundValue
}

export class BackgroundModifier extends BaseModifier<BackgroundOptions> {
  readonly type = 'background'
  readonly priority = 95

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const backgroundValue = this.properties.background

    // Handle stateful gradients/backgrounds
    if (
      context.element instanceof HTMLElement &&
      this.isStateGradientOption(backgroundValue)
    ) {
      this.applyStatefulBackground(context.element, backgroundValue)
      return undefined
    }

    // Handle theme-aware Assets (ColorAsset, etc.)
    if (this.isAssetValue(backgroundValue)) {
      this.applyColorAssetWithThemeReactivity(
        context.element,
        'background',
        backgroundValue
      )
      return undefined
    }

    const resolvedBackground = this.resolveBackgroundValue(
      backgroundValue as BasicBackgroundValue
    )

    if (resolvedBackground !== undefined) {
      const styles = { background: resolvedBackground }
      this.applyStyles(context.element, styles)
    }

    return undefined
  }

  /**
   * Check if a value is a ColorAsset (has a resolve method)
   */
  private isAssetValue(value: any): value is Asset {
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
    asset: Asset
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

  private isGradientDefinition(value: any): value is GradientDefinition {
    return (
      value !== null &&
      typeof value === 'object' &&
      typeof value.type === 'string' &&
      'options' in value
    )
  }

  private resolveBackgroundValue(value: BasicBackgroundValue): string | undefined {
    if (value === null || value === undefined) {
      return undefined
    }

    if (this.isGradientDefinition(value)) {
      return gradientToCSS(value)
    }

    if (this.isAssetValue(value)) {
      const resolved = value.resolve()
      return typeof resolved === 'string' ? resolved : String(resolved)
    }

    return String(value)
  }

  private isStateGradientOption(
    value: StatefulBackgroundValue
  ): value is StateGradientOptions {
    return (
      value !== null &&
      typeof value === 'object' &&
      'default' in value &&
      !this.isGradientDefinition(value)
    )
  }

  private applyStatefulBackground(
    element: HTMLElement,
    stateOptions: StateGradientOptions
  ): void {
    const resolvedStates: Partial<Record<BackgroundState, string>> = {
      default: this.resolveBackgroundValue(stateOptions.default),
      hover: stateOptions.hover
        ? this.resolveBackgroundValue(stateOptions.hover as BasicBackgroundValue)
        : undefined,
      active: stateOptions.active
        ? this.resolveBackgroundValue(stateOptions.active as BasicBackgroundValue)
        : undefined,
      focus: stateOptions.focus
        ? this.resolveBackgroundValue(stateOptions.focus as BasicBackgroundValue)
        : undefined,
      disabled: stateOptions.disabled
        ? this.resolveBackgroundValue(
            stateOptions.disabled as BasicBackgroundValue
          )
        : undefined,
    }

    const applyState = (state?: BackgroundState): void => {
      if (!state) return
      const value = resolvedStates[state]
      if (value !== undefined) {
        this.applyStyleChange(element, 'background', value)
      }
    }

    const getFallbackState = (): BackgroundState => {
      if (this.isElementDisabled(element) && resolvedStates.disabled) {
        return 'disabled'
      }
      if (
        resolvedStates.focus &&
        this.matchesSelector(element, ':focus')
      ) {
        return 'focus'
      }
      return 'default'
    }

    const applyAnimation = (): void => {
      const animation = stateOptions.animation
      if (!animation) return
      const duration = animation.duration ?? 200
      const easing = animation.easing ?? 'ease'
      const delay = animation.delay ?? 0
      const transitionValue = `background ${duration}ms ${easing} ${delay}ms`
      element.style.transition = transitionValue
      const cssText = element.style.cssText || ''
      if (!cssText.includes('transition')) {
        element.style.cssText = `${cssText}${cssText ? ';' : ''}transition: ${transitionValue};`
      }
    }

    const handleMouseLeave = (): void => {
      const priorityState = getFallbackState()
      if (
        priorityState === 'focus' &&
        this.matchesSelector(element, ':hover') &&
        resolvedStates.hover
      ) {
        applyState('hover')
        return
      }
      applyState(priorityState)
    }

    const handleMouseUp = (): void => {
      if (this.isElementDisabled(element) && resolvedStates.disabled) {
        applyState('disabled')
        return
      }
      if (
        resolvedStates.hover &&
        this.matchesSelector(element, ':hover')
      ) {
        applyState('hover')
        return
      }
      if (
        resolvedStates.focus &&
        this.matchesSelector(element, ':focus')
      ) {
        applyState('focus')
        return
      }
      applyState('default')
    }

    // Apply initial state
    if (this.isElementDisabled(element) && resolvedStates.disabled) {
      applyState('disabled')
    } else {
      applyState('default')
    }

    applyAnimation()

    if (resolvedStates.hover) {
      element.addEventListener('mouseenter', () => {
        if (this.isElementDisabled(element)) return
        applyState('hover')
      })
      element.addEventListener('mouseleave', handleMouseLeave)
    }

    if (resolvedStates.active) {
      element.addEventListener('mousedown', () => {
        if (this.isElementDisabled(element)) return
        applyState('active')
      })
      element.addEventListener('mouseup', handleMouseUp)
    }

    if (resolvedStates.focus) {
      element.addEventListener('focus', () => {
        if (this.isElementDisabled(element)) return
        applyState('focus')
      })
      element.addEventListener('blur', () => {
        handleMouseLeave()
      })
    }

    if (resolvedStates.disabled) {
      const observer = new MutationObserver(() => {
        if (this.isElementDisabled(element)) {
          applyState('disabled')
        } else if (
          resolvedStates.hover &&
          this.matchesSelector(element, ':hover')
        ) {
          applyState('hover')
        } else if (
          resolvedStates.focus &&
          this.matchesSelector(element, ':focus')
        ) {
          applyState('focus')
        } else {
          applyState('default')
        }
      })
      observer.observe(element, {
        attributes: true,
        attributeFilter: ['disabled', 'aria-disabled'],
      })
    }
  }

  private matchesSelector(element: HTMLElement, selector: string): boolean {
    if (typeof element.matches !== 'function') {
      return false
    }
    try {
      return element.matches(selector)
    } catch {
      return false
    }
  }

  private isElementDisabled(element: HTMLElement): boolean {
    if (element.hasAttribute && element.hasAttribute('disabled')) {
      return true
    }
    if (
      element.getAttribute &&
      element.getAttribute('aria-disabled') === 'true'
    ) {
      return true
    }
    return false
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
