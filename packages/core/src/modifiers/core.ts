/**
 * Core SwiftUI Modifiers
 *
 * Implementation of the most commonly used SwiftUI modifiers
 * for layout, appearance, and interaction.
 */

import type { Asset } from '../assets/Asset'
import type { Signal } from '../reactive/types'
import type { Dimension } from '../constants/layout'
import type { GradientDefinition } from '../gradients/types'
import {
  AnimationModifier,
  AppearanceModifier,
  InteractionModifier,
  LayoutModifier,
  LifecycleModifier,
} from './base'
import { BackgroundModifier } from './background'
import type {
  AnimationModifierProps,
  AppearanceModifierProps,
  LayoutModifierProps,
  Modifier,
} from './types'

/**
 * Layout Modifiers
 */
export const layoutModifiers = {
  /**
   * Set foreground (text) color
   */
  foregroundColor(color: string | Signal<string> | any): Modifier {
    return new AppearanceModifier({ foregroundColor: color })
  },

  /**
   * Set frame dimensions with support for infinity
   */
  frame(
    width?: Dimension,
    height?: Dimension,
    options?: Omit<LayoutModifierProps['frame'], 'width' | 'height'>
  ): Modifier {
    return new LayoutModifier({
      frame: {
        width,
        height,
        ...options,
      },
    })
  },

  /**
   * Set padding on all sides
   */
  padding(value: number): Modifier {
    return new LayoutModifier({ padding: value })
  },

  /**
   * Set padding with detailed control
   */
  paddingDetailed(options: LayoutModifierProps['padding']): Modifier {
    return new LayoutModifier({ padding: options })
  },

  /**
   * Set horizontal and vertical padding
   */
  paddingSymmetric(horizontal?: number, vertical?: number): Modifier {
    return new LayoutModifier({
      padding: {
        left: horizontal,
        right: horizontal,
        top: vertical,
        bottom: vertical,
      },
    })
  },

  /**
   * Set margin on all sides
   */
  margin(value: number): Modifier {
    return new LayoutModifier({ margin: value })
  },

  /**
   * Set margin with detailed control
   */
  marginDetailed(options: LayoutModifierProps['margin']): Modifier {
    return new LayoutModifier({ margin: options })
  },

  /**
   * Set content alignment
   */
  alignment(value: LayoutModifierProps['alignment']): Modifier {
    return new LayoutModifier({ alignment: value })
  },

  /**
   * Set layout priority for ZStack container sizing and flexible layout
   * Higher priority views determine container size in ZStack
   */
  layoutPriority(priority: number | Signal<number>): Modifier {
    return new LayoutModifier({ layoutPriority: priority })
  },
}

/**
 * Appearance Modifiers
 */
export const appearanceModifiers = {
  /**
   * Set foreground (text) color
   */
  foregroundColor(color: string | Asset | Signal<string>): Modifier {
    return new AppearanceModifier({ foregroundColor: color })
  },

  /**
   * Set background color
   */
  backgroundColor(color: string | Asset | Signal<string>): Modifier {
    return new AppearanceModifier({ backgroundColor: color })
  },

  /**
   * Set background (supports gradients)
   */
  background(value: string | GradientDefinition | Asset): Modifier {
    return new BackgroundModifier({ background: value })
  },

  /**
   * Set font properties
   */
  font(options: AppearanceModifierProps['font']): Modifier {
    return new AppearanceModifier({ font: options })
  },

  /**
   * Set font size
   */
  fontSize(size: number | string): Modifier {
    return new AppearanceModifier({ font: { size } })
  },

  /**
   * Set font weight
   */
  fontWeight(weight: NonNullable<AppearanceModifierProps['font']>['weight']): Modifier {
    return new AppearanceModifier({ font: { weight } })
  },

  /**
   * Set font family
   */
  fontFamily(family: string): Modifier {
    return new AppearanceModifier({ font: { family } })
  },

  /**
   * Set opacity
   */
  opacity(value: number | Signal<number>): Modifier {
    return new AppearanceModifier({ opacity: value })
  },

  /**
   * Set corner radius (enhanced)
   */
  cornerRadius(radius: number | Signal<number>): Modifier {
    return new AppearanceModifier({ cornerRadius: radius })
  },

  /**
   * Set border
   */
  border(
    width: number,
    color: string | Asset = '#000000',
    style: 'solid' | 'dashed' | 'dotted' = 'solid'
  ): Modifier {
    return new AppearanceModifier({
      border: { width, color, style },
    })
  },

  /**
   * Set detailed border properties
   */
  borderDetailed(options: AppearanceModifierProps['border']): Modifier {
    return new AppearanceModifier({ border: options })
  },

  /**
   * Add shadow
   */
  shadow(options: AppearanceModifierProps['shadow']): Modifier {
    return new AppearanceModifier({ shadow: options })
  },

  /**
   * Add drop shadow with common settings
   */
  dropShadow(
    x: number = 0,
    y: number = 2,
    radius: number = 4,
    color: string = 'rgba(0,0,0,0.25)'
  ): Modifier {
    return new AppearanceModifier({
      shadow: { x, y, radius, color },
    })
  },
}

/**
 * Interaction Modifiers
 */
export const interactionModifiers = {
  /**
   * Add tap handler
   */
  onTap(handler: (event: MouseEvent) => void): Modifier {
    return new InteractionModifier({ onTap: handler })
  },

  /**
   * Add hover handler
   */
  onHover(handler: (isHovered: boolean) => void): Modifier {
    return new InteractionModifier({ onHover: handler })
  },

  /**
   * Add focus handler
   */
  onFocus(handler: (isFocused: boolean) => void): Modifier {
    return new InteractionModifier({ onFocus: handler })
  },

  /**
   * Set disabled state
   */
  disabled(isDisabled: boolean | Signal<boolean> = true): Modifier {
    return new InteractionModifier({ disabled: isDisabled })
  },

  /**
   * Set accessibility label
   */
  accessibilityLabel(label: string): Modifier {
    return new InteractionModifier({ accessibilityLabel: label })
  },

  /**
   * Set accessibility hint
   */
  accessibilityHint(hint: string): Modifier {
    return new InteractionModifier({ accessibilityHint: hint })
  },
}

/**
 * Animation Modifiers
 */
export const animationModifiers = {
  /**
   * Add transition
   */
  transition(
    property: string = 'all',
    duration: number = 300,
    easing: string = 'ease',
    delay: number = 0
  ): Modifier {
    return new AnimationModifier({
      transition: { property, duration, easing, delay },
    })
  },

  /**
   * Add detailed transition
   */
  transitionDetailed(options: AnimationModifierProps['transition']): Modifier {
    return new AnimationModifier({ transition: options })
  },

  /**
   * Add animation
   */
  animation(options: AnimationModifierProps['animation']): Modifier {
    return new AnimationModifier({ animation: options })
  },

  /**
   * Add fade in animation
   */
  fadeIn(duration: number = 300): Modifier {
    return new AnimationModifier({
      animation: {
        keyframes: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        duration,
        easing: 'ease-out',
      },
    })
  },

  /**
   * Add fade out animation
   */
  fadeOut(duration: number = 300): Modifier {
    return new AnimationModifier({
      animation: {
        keyframes: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        duration,
        easing: 'ease-in',
      },
    })
  },

  /**
   * Add slide in animation
   */
  slideIn(
    direction: 'up' | 'down' | 'left' | 'right' = 'up',
    duration: number = 300,
    distance: number = 20
  ): Modifier {
    const transforms = {
      up: [`translateY(${distance}px)`, 'translateY(0)'],
      down: [`translateY(-${distance}px)`, 'translateY(0)'],
      left: [`translateX(${distance}px)`, 'translateX(0)'],
      right: [`translateX(-${distance}px)`, 'translateX(0)'],
    }

    const [from, to] = transforms[direction]

    return new AnimationModifier({
      animation: {
        keyframes: {
          '0%': { transform: from, opacity: '0' },
          '100%': { transform: to, opacity: '1' },
        },
        duration,
        easing: 'ease-out',
      },
    })
  },

  /**
   * Add scale animation
   */
  scaleAnimation(from: number = 0.8, to: number = 1, duration: number = 300): Modifier {
    return new AnimationModifier({
      animation: {
        keyframes: {
          '0%': { transform: `scale(${from})`, opacity: '0' },
          '100%': { transform: `scale(${to})`, opacity: '1' },
        },
        duration,
        easing: 'ease-out',
      },
    })
  },
}

/**
 * Lifecycle Modifiers
 */
export const lifecycleModifiers = {
  /**
   * Execute handler when component appears in viewport
   */
  onAppear(handler: () => void): Modifier {
    return new LifecycleModifier({ onAppear: handler })
  },

  /**
   * Execute handler when component disappears from viewport
   */
  onDisappear(handler: () => void): Modifier {
    return new LifecycleModifier({ onDisappear: handler })
  },

  /**
   * Execute async task with automatic cancellation on component unmount
   */
  task(
    operation: () => Promise<void> | void,
    options?: {
      id?: string
      priority?: 'background' | 'userInitiated' | 'utility' | 'default'
    }
  ): Modifier {
    return new LifecycleModifier({
      task: {
        operation,
        id: options?.id,
        priority: options?.priority || 'default',
      },
    })
  },

  /**
   * Add pull-to-refresh functionality
   */
  refreshable(onRefresh: () => Promise<void>, isRefreshing?: boolean | Signal<boolean>): Modifier {
    return new LifecycleModifier({
      refreshable: {
        onRefresh,
        isRefreshing,
      },
    })
  },
}

/**
 * Preset Modifiers - Common combinations
 */
export const presetModifiers = {
  /**
   * Card-like appearance
   */
  card(padding: number = 16): Modifier[] {
    return [
      appearanceModifiers.backgroundColor('#ffffff'),
      appearanceModifiers.cornerRadius(8),
      appearanceModifiers.shadow({
        x: 0,
        y: 2,
        radius: 8,
        color: 'rgba(0,0,0,0.1)',
      }),
      layoutModifiers.padding(padding),
    ]
  },

  /**
   * Button-like appearance
   */
  button(
    backgroundColor: string | Asset = '#007AFF',
    textColor: string | Asset = '#ffffff'
  ): Modifier[] {
    return [
      appearanceModifiers.backgroundColor(backgroundColor),
      appearanceModifiers.foregroundColor(textColor),
      appearanceModifiers.cornerRadius(6),
      layoutModifiers.paddingSymmetric(16, 8),
      interactionModifiers.onHover((_hovered) => {
        // This would need a more sophisticated hover state system
      }),
      animationModifiers.transition('all', 150),
    ]
  },

  /**
   * Input field appearance
   */
  input(): Modifier[] {
    return [
      appearanceModifiers.border(1, '#d1d5db'),
      appearanceModifiers.cornerRadius(4),
      layoutModifiers.padding(8),
      animationModifiers.transition('border-color', 150),
      interactionModifiers.onFocus((_focused) => {
        // Focus state would need more sophisticated handling
      }),
    ]
  },

  /**
   * Typography presets
   */
  typography: {
    title: (): Modifier[] => [
      appearanceModifiers.fontSize(24),
      appearanceModifiers.fontWeight('bold'),
    ],

    heading: (): Modifier[] => [
      appearanceModifiers.fontSize(20),
      appearanceModifiers.fontWeight('600'),
    ],

    body: (): Modifier[] => [
      appearanceModifiers.fontSize(16),
      appearanceModifiers.fontWeight('normal'),
    ],

    caption: (): Modifier[] => [
      appearanceModifiers.fontSize(12),
      appearanceModifiers.fontWeight('normal'),
      appearanceModifiers.opacity(0.7),
    ],
  },
}

/**
 * Export all core modifiers
 */
export const coreModifiers = {
  ...layoutModifiers,
  ...appearanceModifiers,
  ...interactionModifiers,
  ...animationModifiers,
  ...lifecycleModifiers,
  presets: presetModifiers,
}
