/**
 * Navigation Modifiers Implementation
 *
 * Implements SwiftUI's navigation modifiers as proper TachUI modifiers
 * with inheritance support and automatic state management.
 */

import type { ComponentInstance } from '@tachui/core'
import type { NavigationContext } from './types'

/**
 * Navigation modifier configuration
 */
export interface NavigationModifierConfig {
  title?: string
  titleDisplayMode?: 'automatic' | 'inline' | 'large'
  barHidden?: boolean
  backButtonHidden?: boolean
  backButtonTitle?: string
  toolbarBackground?: string
  foregroundColor?: string
  leadingItems?: ComponentInstance[]
  trailingItems?: ComponentInstance[]
}

/**
 * Navigation modifier state management
 */
class NavigationModifierManager {
  private _modifierStack: NavigationModifierConfig[] = []
  private _listeners: Set<(config: NavigationModifierConfig) => void> = new Set()

  /**
   * Push a new navigation modifier configuration
   */
  pushModifier(config: NavigationModifierConfig): void {
    this._modifierStack.push(config)
    this._notifyListeners()
  }

  /**
   * Pop the last navigation modifier configuration
   */
  popModifier(): NavigationModifierConfig | undefined {
    const popped = this._modifierStack.pop()
    this._notifyListeners()
    return popped
  }

  /**
   * Get the current merged configuration
   */
  getCurrentConfig(): NavigationModifierConfig {
    // Merge all configurations in the stack
    return this._modifierStack.reduce((merged, config) => ({
      ...merged,
      ...config
    }), {} as NavigationModifierConfig)
  }

  /**
   * Subscribe to configuration changes
   */
  onChange(listener: (config: NavigationModifierConfig) => void): () => void {
    this._listeners.add(listener)
    return () => {
      this._listeners.delete(listener)
    }
  }

  /**
   * Clear all modifiers
   */
  clear(): void {
    this._modifierStack = []
    this._notifyListeners()
  }

  /**
   * Notify all listeners of configuration changes
   */
  private _notifyListeners(): void {
    const config = this.getCurrentConfig()
    this._listeners.forEach(listener => {
      try {
        listener(config)
      } catch (error) {
        console.error('Navigation modifier listener error:', error)
      }
    })
  }
}

// Global modifier manager
const navigationModifierManager = new NavigationModifierManager()

/**
 * .navigationTitle() modifier
 *
 * @param component - The component to modify
 * @param title - The navigation title
 * @returns The component with navigation title metadata
 */
export function navigationTitle(
  component: ComponentInstance,
  title: string
): ComponentInstance {
  // Store modifier on component
  ;(component as any)._navigationModifiers = {
    ...(component as any)._navigationModifiers,
    title
  }

  // Apply to current navigation context
  navigationModifierManager.pushModifier({ title })

  return component
}

/**
 * .navigationBarTitleDisplayMode() modifier
 *
 * @param component - The component to modify
 * @param mode - The title display mode
 * @returns The component with title display mode metadata
 */
export function navigationBarTitleDisplayMode(
  component: ComponentInstance,
  mode: 'automatic' | 'inline' | 'large'
): ComponentInstance {
  ;(component as any)._navigationModifiers = {
    ...(component as any)._navigationModifiers,
    titleDisplayMode: mode
  }

  navigationModifierManager.pushModifier({ titleDisplayMode: mode })

  return component
}

/**
 * .navigationBarHidden() modifier
 *
 * @param component - The component to modify
 * @param hidden - Whether the navigation bar should be hidden
 * @returns The component with navigation bar visibility metadata
 */
export function navigationBarHidden(
  component: ComponentInstance,
  hidden: boolean = true
): ComponentInstance {
  ;(component as any)._navigationModifiers = {
    ...(component as any)._navigationModifiers,
    barHidden: hidden
  }

  navigationModifierManager.pushModifier({ barHidden: hidden })

  return component
}

/**
 * .navigationBarItems() modifier
 *
 * @param component - The component to modify
 * @param options - Leading and trailing navigation bar items
 * @returns The component with navigation bar items metadata
 */
export function navigationBarItems(
  component: ComponentInstance,
  options: {
    leading?: ComponentInstance | ComponentInstance[]
    trailing?: ComponentInstance | ComponentInstance[]
  }
): ComponentInstance {
  const leadingItems = Array.isArray(options.leading) ? options.leading :
                     options.leading ? [options.leading] : []
  const trailingItems = Array.isArray(options.trailing) ? options.trailing :
                       options.trailing ? [options.trailing] : []

  ;(component as any)._navigationModifiers = {
    ...(component as any)._navigationModifiers,
    leadingItems,
    trailingItems
  }

  navigationModifierManager.pushModifier({ leadingItems, trailingItems })

  return component
}

/**
 * .navigationBarBackButtonHidden() modifier
 *
 * @param component - The component to modify
 * @param hidden - Whether the back button should be hidden
 * @returns The component with back button visibility metadata
 */
export function navigationBarBackButtonHidden(
  component: ComponentInstance,
  hidden: boolean = true
): ComponentInstance {
  ;(component as any)._navigationModifiers = {
    ...(component as any)._navigationModifiers,
    backButtonHidden: hidden
  }

  navigationModifierManager.pushModifier({ backButtonHidden: hidden })

  return component
}

/**
 * .navigationBarBackButtonTitle() modifier
 *
 * @param component - The component to modify
 * @param title - The back button title
 * @returns The component with back button title metadata
 */
export function navigationBarBackButtonTitle(
  component: ComponentInstance,
  title: string
): ComponentInstance {
  ;(component as any)._navigationModifiers = {
    ...(component as any)._navigationModifiers,
    backButtonTitle: title
  }

  navigationModifierManager.pushModifier({ backButtonTitle: title })

  return component
}

/**
 * .toolbarBackground() modifier
 *
 * @param component - The component to modify
 * @param background - The toolbar background color
 * @returns The component with toolbar background metadata
 */
export function toolbarBackground(
  component: ComponentInstance,
  background: string
): ComponentInstance {
  ;(component as any)._navigationModifiers = {
    ...(component as any)._navigationModifiers,
    toolbarBackground: background
  }

  navigationModifierManager.pushModifier({ toolbarBackground: background })

  return component
}

/**
 * .toolbarForegroundColor() modifier
 *
 * @param component - The component to modify
 * @param color - The toolbar foreground color
 * @returns The component with toolbar foreground color metadata
 */
export function toolbarForegroundColor(
  component: ComponentInstance,
  color: string
): ComponentInstance {
  ;(component as any)._navigationModifiers = {
    ...(component as any)._navigationModifiers,
    foregroundColor: color
  }

  navigationModifierManager.pushModifier({ foregroundColor: color })

  return component
}

/**
 * Get the current navigation modifier configuration
 */
export function getCurrentNavigationModifiers(): NavigationModifierConfig {
  return navigationModifierManager.getCurrentConfig()
}

/**
 * Subscribe to navigation modifier changes
 */
export function onNavigationModifierChange(
  listener: (config: NavigationModifierConfig) => void
): () => void {
  return navigationModifierManager.onChange(listener)
}

/**
 * Clear all navigation modifiers
 */
export function clearNavigationModifiers(): void {
  navigationModifierManager.clear()
}

/**
 * Extract navigation modifiers from a component
 */
export function extractNavigationModifiers(component: ComponentInstance): NavigationModifierConfig {
  return (component as any)._navigationModifiers || {}
}

/**
 * Check if a component has navigation modifiers
 */
export function hasNavigationModifiers(component: ComponentInstance): boolean {
  return !!(component as any)._navigationModifiers
}

/**
 * Apply navigation modifiers to a navigation context
 */
export function applyNavigationModifiers(
  context: NavigationContext,
  modifiers: NavigationModifierConfig
): void {
  // This would update the navigation context with the modifier configuration
  // Implementation depends on how NavigationContext is structured
  ;(context as any)._appliedModifiers = {
    ...(context as any)._appliedModifiers,
    ...modifiers
  }
}

/**
 * Enhanced NavigationStack that responds to modifiers
 */
export function enhanceNavigationStackWithModifiers(
  navigationStack: ComponentInstance
): ComponentInstance {
  // Listen for modifier changes and update navigation bar
  const unsubscribe = onNavigationModifierChange((config) => {
    // Update navigation bar based on modifier configuration
    updateNavigationBarFromModifiers(navigationStack, config)
  })

  // Store cleanup function
  ;(navigationStack as any)._modifierCleanup = unsubscribe

  return navigationStack
}

/**
 * Update navigation bar based on modifier configuration
 */
function updateNavigationBarFromModifiers(
  navigationStack: ComponentInstance,
  config: NavigationModifierConfig
): void {
  const navigationBar = (navigationStack as any)._navigationBar

  if (navigationBar && config) {
    // Update navigation bar properties based on configuration
    if (config.title !== undefined) {
      ;(navigationBar as any).title = config.title
    }

    if (config.barHidden !== undefined) {
      ;(navigationBar as any).hidden = config.barHidden
    }

    if (config.toolbarBackground !== undefined) {
      ;(navigationBar as any).backgroundColor = config.toolbarBackground
    }

    if (config.foregroundColor !== undefined) {
      ;(navigationBar as any).foregroundColor = config.foregroundColor
    }

    // Add more updates as needed...
  }
}

/**
 * Navigation modifier utilities
 */
export const NavigationModifierUtils = {
  /**
   * Create a modifier scope
   */
  createScope(): {
    push: (config: NavigationModifierConfig) => void
    pop: () => NavigationModifierConfig | undefined
    current: () => NavigationModifierConfig
  } {
    return {
      push: (config) => navigationModifierManager.pushModifier(config),
      pop: () => navigationModifierManager.popModifier(),
      current: () => navigationModifierManager.getCurrentConfig()
    }
  },

  /**
   * Merge modifier configurations
   */
  mergeConfigs(...configs: NavigationModifierConfig[]): NavigationModifierConfig {
    return configs.reduce((merged, config) => ({
      ...merged,
      ...config
    }), {})
  },

  /**
   * Check if configuration is empty
   */
  isEmpty(config: NavigationModifierConfig): boolean {
    return Object.keys(config).length === 0
  }
}

/**
 * Add navigation modifier methods to ComponentInstance prototype
 */
declare module '@tachui/core' {
  interface ComponentInstance {
    navigationTitle(title: string): ComponentInstance
    navigationBarTitleDisplayMode(mode: 'automatic' | 'inline' | 'large'): ComponentInstance
    navigationBarHidden(hidden?: boolean): ComponentInstance
    navigationBarItems(options: { leading?: ComponentInstance | ComponentInstance[], trailing?: ComponentInstance | ComponentInstance[] }): ComponentInstance
    navigationBarBackButtonHidden(hidden?: boolean): ComponentInstance
    navigationBarBackButtonTitle(title: string): ComponentInstance
    toolbarBackground(background: string): ComponentInstance
    toolbarForegroundColor(color: string): ComponentInstance
    // Modal presentation modifiers
    sheet(isPresented: () => boolean, content: () => ComponentInstance, options?: any): ComponentInstance
    fullScreenCover(isPresented: () => boolean, content: () => ComponentInstance, options?: any): ComponentInstance
    popover(isPresented: () => boolean, content: () => ComponentInstance, options?: any): ComponentInstance
  }
}

// Extend ComponentInstance prototype if possible
if (typeof window !== 'undefined' && (window as any).ComponentInstance) {
  const proto = (window as any).ComponentInstance.prototype

  proto.navigationTitle = function(title: string) {
    return navigationTitle(this, title)
  }

  proto.navigationBarTitleDisplayMode = function(mode: 'automatic' | 'inline' | 'large') {
    return navigationBarTitleDisplayMode(this, mode)
  }

  proto.navigationBarHidden = function(hidden: boolean = true) {
    return navigationBarHidden(this, hidden)
  }

  proto.navigationBarItems = function(options: any) {
    return navigationBarItems(this, options)
  }

  proto.navigationBarBackButtonHidden = function(hidden: boolean = true) {
    return navigationBarBackButtonHidden(this, hidden)
  }

  proto.navigationBarBackButtonTitle = function(title: string) {
    return navigationBarBackButtonTitle(this, title)
  }

  proto.toolbarBackground = function(background: string) {
    return toolbarBackground(this, background)
  }

  proto.toolbarForegroundColor = function(color: string) {
    return toolbarForegroundColor(this, color)
  }
}
