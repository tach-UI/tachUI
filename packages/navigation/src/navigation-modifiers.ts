/**
 * Navigation Modifiers Implementation
 *
 * Implements SwiftUI's navigation modifiers as proper TachUI modifiers
 * with inheritance support and automatic state management.
 */

import {
  createEffect,
  getSignalImpl,
  isSignal,
  mountComponentTree,
  untrack,
} from '@tachui/core'
import type { Accessor, Binding, ComponentInstance } from '@tachui/core'
import { HStack, HTML, VStack } from '@tachui/primitives'
import type { NavigationContext } from './types'
import { _pushNavigationEnvironmentDismiss } from './navigation-environment'

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
  toolbarBackgroundVisibility?: Partial<
    Record<ToolbarBackgroundVisibilityTarget, ToolbarBackgroundVisibility>
  >
  foregroundColor?: string
  toolbarItems?: ToolbarItemConfig[]
  leadingItems?: ComponentInstance[]
  trailingItems?: ComponentInstance[]
  searchable?: SearchableConfig
  searchSuggestions?: SearchSuggestionsInput
  searchScopes?: SearchScopesConfig
}

type SheetPresentationState = Accessor<boolean> | Binding<boolean>

export interface SheetPresentationOptions {
  dismissOnBackdropTap?: boolean
  dismissOnEscape?: boolean
  backdropColor?: string
  transitionDurationMs?: number
  maxWidth?: string
  zIndex?: number
  ariaLabel?: string
  onDismiss?: () => void
}

export type PresentationDetent =
  | 'medium'
  | 'large'
  | { fraction: number }
  | { height: number }

export interface FullScreenCoverOptions {
  zIndex?: number
  backgroundColor?: string
  ariaLabel?: string
  onDismiss?: () => void
}

export type ToolbarItemPlacement =
  | 'navigation'
  | 'primaryAction'
  | 'destructiveAction'
  | 'bottomBar'

export interface ToolbarItemConfig {
  id: string
  placement: ToolbarItemPlacement
  content: () => ComponentInstance
}

export interface ToolbarItemInput {
  placement: ToolbarItemPlacement
  content: () => ComponentInstance
}

/**
 * Toolbar background visibility state.
 *
 * Note: `automatic` currently aliases `visible` in web rendering.
 */
export type ToolbarBackgroundVisibility = 'visible' | 'hidden' | 'automatic'
export type ToolbarBackgroundVisibilityTarget = 'navigationBar' | 'bottomBar'

export type PopoverArrowEdge = 'top' | 'bottom' | 'leading' | 'trailing'

export interface PopoverPresentationOptions {
  dismissOnOutsideClick?: boolean
  dismissOnEscape?: boolean
  offset?: number
  zIndex?: number
  maxWidth?: string
  ariaLabel?: string
  onDismiss?: () => void
}

export type SearchableTextState = Accessor<string> | Binding<string>
export type SearchablePlacement = 'navigationBar' | 'toolbar'

export interface SearchableConfig {
  text: SearchableTextState
  placement: SearchablePlacement
}

export type SearchSuggestionsInput =
  | string[]
  | ((query: string) => string[])

export type SearchScopeState = Accessor<string> | Binding<string>

export interface SearchScopeOption {
  value: string
  label: string
}

export interface SearchScopesConfig {
  scope: SearchScopeState
  scopes: SearchScopeOption[]
}

export type ConfirmationDialogButtonRole = 'default' | 'cancel' | 'destructive'

export interface ConfirmationDialogAction {
  label: string
  role?: ConfirmationDialogButtonRole
  action?: () => void
}

/**
 * ToolbarItem descriptor factory
 */
let toolbarItemIdCounter = 0

export function ToolbarItem(input: ToolbarItemInput): ToolbarItemConfig {
  return {
    id: `toolbar-item-${toolbarItemIdCounter++}`,
    placement: input.placement,
    content: input.content,
  }
}

export function __resetToolbarItemIdCounterForTests(): void {
  toolbarItemIdCounter = 0
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
const activeSheetStack: string[] = []

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
 * .toolbarBackgroundVisibility() modifier
 */
export function toolbarBackgroundVisibility(
  component: ComponentInstance,
  visibility: ToolbarBackgroundVisibility,
  target: ToolbarBackgroundVisibilityTarget = 'navigationBar'
): ComponentInstance {
  const currentModifiers = ((component as any)._navigationModifiers ?? {}) as
    NavigationModifierConfig
  const nextVisibility = {
    ...currentModifiers.toolbarBackgroundVisibility,
    [target]: visibility,
  }
  const nextModifiers = {
    ...currentModifiers,
    toolbarBackgroundVisibility: nextVisibility,
  }

  ;(component as any)._navigationModifiers = nextModifiers

  const toolbarBaseComponent = ((component as any)
    ._toolbarBaseComponent ?? component) as ComponentInstance
  const toolbarItemList = (nextModifiers.toolbarItems ?? []) as
    ToolbarItemConfig[]
  if (toolbarItemList.length === 0) {
    return component
  }

  const wrappedComponent = wrapComponentWithToolbar(
    toolbarBaseComponent,
    toolbarItemList,
    nextModifiers
  )
  ;(wrappedComponent as any)._navigationModifiers = {
    ...(wrappedComponent as any)._navigationModifiers,
    ...nextModifiers,
  }
  ;(wrappedComponent as any)._toolbarBaseComponent = toolbarBaseComponent
  return wrappedComponent
}

function partitionToolbarItems(items: ToolbarItemConfig[]): {
  navigation: ToolbarItemConfig[]
  trailing: ToolbarItemConfig[]
  bottomBar: ToolbarItemConfig[]
} {
  const navigation = items.filter(item => item.placement === 'navigation')
  const trailing = items.filter(
    item =>
      item.placement === 'primaryAction' ||
      item.placement === 'destructiveAction'
  )
  const bottomBar = items.filter(item => item.placement === 'bottomBar')

  return { navigation, trailing, bottomBar }
}

export function getToolbarItemsByPlacement(component: ComponentInstance): {
  navigation: ToolbarItemConfig[]
  trailing: ToolbarItemConfig[]
  bottomBar: ToolbarItemConfig[]
} {
  const toolbarItemList = ((component as any)._navigationModifiers
    ?.toolbarItems ?? []) as ToolbarItemConfig[]
  return partitionToolbarItems(toolbarItemList)
}

function createToolbarItemNode(item: ToolbarItemConfig): ComponentInstance {
  const contentHost = HTML.div({}).build()
  const existingLifecycle = (contentHost as any)._enhancedLifecycle ?? {}
  const existingOnDOMReady = existingLifecycle.onDOMReady as
    | ((elements: Map<string, Element>, primary?: Element) => void | (() => void))
    | undefined

  ;(contentHost as any)._enhancedLifecycle = {
    ...existingLifecycle,
    onDOMReady: (elements: Map<string, Element>, primary?: Element) => {
      const existingCleanup = existingOnDOMReady?.(elements, primary)
      if (!(primary instanceof HTMLElement)) {
        return existingCleanup
      }

      const cleanup = mountComponentTree(item.content(), primary)

      return () => {
        cleanup()
        if (typeof existingCleanup === 'function') {
          existingCleanup()
        }
      }
    },
  }

  if (item.placement === 'destructiveAction') {
    return HStack({
      children: [contentHost],
      spacing: 0,
    })
      .foregroundColor('var(--tachui-toolbar-destructive-color, #d32f2f)')
      .build()
  }

  return contentHost
}

function wrapComponentWithToolbar(
  component: ComponentInstance,
  items: ToolbarItemConfig[],
  modifiers: NavigationModifierConfig = {}
): ComponentInstance {
  const partitions = partitionToolbarItems(items)
  const searchableConfig = modifiers.searchable
  const hasNavigationBarSearch = searchableConfig?.placement !== 'toolbar'
  const hasToolbarSearch = searchableConfig?.placement === 'toolbar'
  const hasTopBar =
    partitions.navigation.length > 0 || partitions.trailing.length > 0
  const hasBottomBar = partitions.bottomBar.length > 0

  if (!hasTopBar && !hasBottomBar && !searchableConfig) {
    return component
  }

  const children: ComponentInstance[] = []
  const visibilityMap = modifiers.toolbarBackgroundVisibility ?? {}
  const topBarVisibility = visibilityMap.navigationBar ?? 'visible'
  const bottomBarVisibility = visibilityMap.bottomBar ?? 'visible'
  const toolbarBackgroundColor = modifiers.toolbarBackground ?? '#f9fafb'

  const createSearchableInputNode = (
    config: SearchableConfig,
    suggestionsInput?: SearchSuggestionsInput,
    searchScopesConfig?: SearchScopesConfig
  ): ComponentInstance => {
    const searchHost = HTML.div({}).build()
    const existingLifecycle = (searchHost as any)._enhancedLifecycle ?? {}
    const existingOnDOMReady = existingLifecycle.onDOMReady as
      | ((elements: Map<string, Element>, primary?: Element) => void | (() => void))
      | undefined

    const readSearchState = (state: SearchableTextState): string => {
      if (typeof state === 'function') {
        return String(state() ?? '')
      }
      return String(state.get() ?? '')
    }

    const setSearchState = (
      state: SearchableTextState,
      value: string
    ): boolean => {
      if (typeof state !== 'function') {
        state.set(value)
        return true
      }
      if (isSignal(state)) {
        const signal = getSignalImpl(state)
        if (signal) {
          signal.set(value)
          return true
        }
      }
      console.error(
        '.searchable requires a writable signal accessor or Binding<string>. Computed/read-only accessors are not writable.'
      )
      return false
    }

    const readScopeState = (state: SearchScopeState): string => {
      if (typeof state === 'function') {
        return String(state() ?? '')
      }
      return String(state.get() ?? '')
    }

    const setScopeState = (state: SearchScopeState, value: string): boolean => {
      if (typeof state !== 'function') {
        state.set(value)
        return true
      }
      if (isSignal(state)) {
        const signal = getSignalImpl(state)
        if (signal) {
          signal.set(value)
          return true
        }
      }
      console.error(
        '.searchScopes requires a writable signal accessor or Binding<string>. Computed/read-only accessors are not writable.'
      )
      return false
    }

    const resolveSuggestions = (query: string): string[] => {
      if (!query.trim()) {
        return []
      }
      if (!suggestionsInput) {
        return []
      }
      const resolved =
        typeof suggestionsInput === 'function'
          ? suggestionsInput(query)
          : suggestionsInput
      if (!Array.isArray(resolved)) {
        return []
      }
      return resolved
        .map(item => String(item ?? '').trim())
        .filter(item => item.length > 0)
    }

    ;(searchHost as any)._enhancedLifecycle = {
      ...existingLifecycle,
      onDOMReady: (elements: Map<string, Element>, primary?: Element) => {
        const existingCleanup = existingOnDOMReady?.(elements, primary)
        if (!(primary instanceof HTMLElement)) {
          return existingCleanup
        }

        primary.setAttribute(
          'data-tachui-searchable-placement',
          config.placement
        )
        primary.style.width = '100%'
        primary.style.display = 'flex'
        primary.style.alignItems = 'center'
        primary.style.gap = '8px'
        primary.style.padding = '8px 12px'

        const input = document.createElement('input')
        input.type = 'search'
        input.setAttribute('data-tachui-searchable-input', 'true')
        input.placeholder = 'Search'
        input.style.width = '100%'
        input.style.minHeight = '34px'
        input.style.padding = '6px 10px'
        input.style.border = '1px solid #d1d5db'
        input.style.borderRadius = '8px'
        input.style.outline = 'none'
        input.setAttribute('aria-label', 'Search')
        input.value = readSearchState(config.text)

        const clearButton = document.createElement('button')
        clearButton.type = 'button'
        clearButton.setAttribute('data-tachui-searchable-clear', 'true')
        clearButton.setAttribute('aria-label', 'Clear search')
        clearButton.textContent = '×'
        clearButton.style.minWidth = '30px'
        clearButton.style.height = '30px'
        clearButton.style.border = '0'
        clearButton.style.borderRadius = '999px'
        clearButton.style.background = '#e5e7eb'
        clearButton.style.cursor = 'pointer'
        clearButton.style.fontSize = '18px'
        clearButton.style.lineHeight = '1'
        clearButton.style.display = input.value ? 'inline-flex' : 'none'
        clearButton.style.alignItems = 'center'
        clearButton.style.justifyContent = 'center'

        const scopesContainer = document.createElement('div')
        scopesContainer.setAttribute('data-tachui-search-scopes', 'true')
        scopesContainer.style.display = 'none'
        scopesContainer.style.marginTop = '8px'
        scopesContainer.style.padding = '2px'
        scopesContainer.style.border = '1px solid #d1d5db'
        scopesContainer.style.borderRadius = '10px'
        scopesContainer.style.background = '#f3f4f6'
        scopesContainer.style.gap = '4px'

        const suggestionsDropdown = document.createElement('div')
        suggestionsDropdown.setAttribute(
          'data-tachui-searchable-suggestions',
          'true'
        )
        suggestionsDropdown.style.position = 'absolute'
        suggestionsDropdown.style.top = '100%'
        suggestionsDropdown.style.left = '12px'
        suggestionsDropdown.style.right = '12px'
        suggestionsDropdown.style.zIndex = '40'
        suggestionsDropdown.style.border = '1px solid #d1d5db'
        suggestionsDropdown.style.borderRadius = '8px'
        suggestionsDropdown.style.background = '#ffffff'
        suggestionsDropdown.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)'
        suggestionsDropdown.style.marginTop = '4px'
        suggestionsDropdown.style.maxHeight = '220px'
        suggestionsDropdown.style.overflowY = 'auto'
        suggestionsDropdown.style.display = 'none'

        let isFocused = false
        let suggestionsDismissedBySelection = false
        let blurTimer: number | null = null
        let currentScopeValue = searchScopesConfig
          ? readScopeState(searchScopesConfig.scope)
          : ''

        const closeSuggestions = (): void => {
          suggestionsDropdown.style.display = 'none'
          suggestionsDropdown.replaceChildren()
        }

        const setSearchValue = (value: string): void => {
          if (setSearchState(config.text, value)) {
            input.value = value
          }
        }

        const renderScopeSegments = (): void => {
          if (!searchScopesConfig || !isFocused || searchScopesConfig.scopes.length === 0) {
            scopesContainer.style.display = 'none'
            scopesContainer.replaceChildren()
            return
          }

          scopesContainer.replaceChildren(
            ...searchScopesConfig.scopes.map(scopeOption => {
              const button = document.createElement('button')
              const isActive = currentScopeValue === scopeOption.value
              button.type = 'button'
              button.setAttribute('data-tachui-search-scope-item', 'true')
              button.setAttribute('data-tachui-search-scope-value', scopeOption.value)
              button.setAttribute('data-active', isActive ? 'true' : 'false')
              button.setAttribute('aria-pressed', isActive ? 'true' : 'false')
              button.textContent = scopeOption.label
              button.style.border = '0'
              button.style.borderRadius = '8px'
              button.style.padding = '6px 10px'
              button.style.cursor = 'pointer'
              button.style.fontSize = '13px'
              button.style.lineHeight = '1.1'
              button.style.background = isActive ? '#ffffff' : 'transparent'
              button.style.color = isActive ? '#111827' : '#374151'
              button.style.boxShadow = isActive
                ? '0 1px 2px rgba(0, 0, 0, 0.10)'
                : 'none'
              button.addEventListener('click', () => {
                if (setScopeState(searchScopesConfig.scope, scopeOption.value)) {
                  currentScopeValue = scopeOption.value
                  renderScopeSegments()
                }
              })
              return button
            })
          )
          scopesContainer.style.display = 'inline-flex'
        }

        const renderSuggestions = (query: string): void => {
          const suggestions = resolveSuggestions(query)
          if (
            !isFocused ||
            suggestionsDismissedBySelection ||
            !query.trim() ||
            suggestions.length === 0
          ) {
            closeSuggestions()
            return
          }

          suggestionsDropdown.replaceChildren(
            ...suggestions.map(suggestion => {
              const button = document.createElement('button')
              button.type = 'button'
              button.setAttribute('data-tachui-searchable-suggestion-item', 'true')
              button.textContent = suggestion
              button.style.display = 'block'
              button.style.width = '100%'
              button.style.textAlign = 'left'
              button.style.padding = '8px 10px'
              button.style.border = '0'
              button.style.background = 'transparent'
              button.style.cursor = 'pointer'
              button.style.fontSize = '14px'
              button.style.lineHeight = '1.3'
              button.addEventListener('mousedown', event => {
                event.preventDefault()
              })
              button.addEventListener('click', () => {
                setSearchValue(suggestion)
                suggestionsDismissedBySelection = true
                clearButton.style.display = suggestion
                  ? 'inline-flex'
                  : 'none'
                closeSuggestions()
                input.focus()
              })
              return button
            })
          )
          suggestionsDropdown.style.display = 'block'
        }

        const onInput = (): void => {
          suggestionsDismissedBySelection = false
          const nextValue = input.value
          setSearchState(config.text, nextValue)
          clearButton.style.display = nextValue ? 'inline-flex' : 'none'
          renderSuggestions(nextValue)
        }

        const onClear = (): void => {
          suggestionsDismissedBySelection = false
          if (setSearchState(config.text, '')) {
            input.value = ''
            clearButton.style.display = 'none'
            closeSuggestions()
            input.focus()
          }
        }

        const onFocus = (): void => {
          isFocused = true
          renderScopeSegments()
          renderSuggestions(input.value)
        }

        const onBlur = (): void => {
          if (blurTimer !== null) {
            window.clearTimeout(blurTimer)
          }
          blurTimer = window.setTimeout(() => {
            isFocused = false
            suggestionsDismissedBySelection = false
            closeSuggestions()
            renderScopeSegments()
            blurTimer = null
          }, 0)
        }

        const onKeyDown = (event: KeyboardEvent): void => {
          if (event.key === 'Escape') {
            closeSuggestions()
          }
        }

        input.addEventListener('input', onInput)
        clearButton.addEventListener('click', onClear)
        input.addEventListener('focus', onFocus)
        input.addEventListener('blur', onBlur)
        input.addEventListener('keydown', onKeyDown)

        const searchShell = document.createElement('div')
        searchShell.style.position = 'relative'

        const inputRow = document.createElement('div')
        inputRow.style.display = 'flex'
        inputRow.style.alignItems = 'center'
        inputRow.style.gap = '8px'

        inputRow.append(input, clearButton)
        searchShell.append(inputRow, suggestionsDropdown)

        primary.style.position = 'relative'
        primary.style.display = 'block'
        primary.append(searchShell, scopesContainer)

        const scopeSyncEffect = searchScopesConfig
          ? createEffect(() => {
              currentScopeValue = readScopeState(searchScopesConfig.scope)
              renderScopeSegments()
            })
          : null

        const syncEffect = createEffect(() => {
          const currentValue = readSearchState(config.text)
          if (input.value !== currentValue) {
            input.value = currentValue
          }
          clearButton.style.display = currentValue ? 'inline-flex' : 'none'
          renderSuggestions(currentValue)
        })

        return () => {
          syncEffect.dispose()
          scopeSyncEffect?.dispose()
          if (blurTimer !== null) {
            window.clearTimeout(blurTimer)
          }
          closeSuggestions()
          scopesContainer.replaceChildren()
          input.removeEventListener('input', onInput)
          clearButton.removeEventListener('click', onClear)
          input.removeEventListener('focus', onFocus)
          input.removeEventListener('blur', onBlur)
          input.removeEventListener('keydown', onKeyDown)
          if (typeof existingCleanup === 'function') {
            existingCleanup()
          }
        }
      },
    }

    return searchHost
  }

  if (hasTopBar) {
    const topBarChildren: ComponentInstance[] = []
    const hasLeadingItems = partitions.navigation.length > 0
    const hasTrailingItems = partitions.trailing.length > 0

    if (hasLeadingItems) {
      topBarChildren.push(
        HStack({
          children: partitions.navigation.map(createToolbarItemNode),
          spacing: 8,
        }).build()
      )
    }

    if (hasTrailingItems) {
      topBarChildren.push(
        HStack({
          children: partitions.trailing.map(createToolbarItemNode),
          spacing: 8,
        }).build()
      )
    }

    const topBarJustifyContent =
      hasLeadingItems && hasTrailingItems
        ? 'space-between'
        : hasTrailingItems
          ? 'flex-end'
          : 'flex-start'

    const topBarNode = HStack({
      children: topBarChildren,
      spacing: 12,
    })
      .role('toolbar')
      .justifyContent(topBarJustifyContent)
      .alignItems('center')
      .padding({ top: 10, right: 12, bottom: 10, left: 12 })
    if (topBarVisibility === 'hidden') {
      topBarNode.border(0).backgroundColor('transparent')
    } else {
      topBarNode.border({ width: 1, color: '#e5e7eb' })
      topBarNode.backgroundColor(toolbarBackgroundColor)
    }

    children.push(topBarNode.build())
  }

  if (hasNavigationBarSearch && searchableConfig) {
    const searchNode = HStack({
      children: [
        createSearchableInputNode(
          searchableConfig,
          modifiers.searchSuggestions,
          modifiers.searchScopes
        ),
      ],
      spacing: 0,
    })
      .role('search')
      .padding({ top: 6, right: 12, bottom: 8, left: 12 })
      .backgroundColor(toolbarBackgroundColor)
      .border({ width: 1, color: '#e5e7eb' })
      .build()
    children.push(searchNode)
  }

  children.push(component)

  if (hasBottomBar) {
    const bottomBarNode = HStack({
      children: partitions.bottomBar.map(createToolbarItemNode),
      spacing: 8,
    })
      .role('toolbar')
      .alignItems('center')
      .padding({ top: 10, right: 12, bottom: 10, left: 12 })
    if (bottomBarVisibility === 'hidden') {
      bottomBarNode.border(0).backgroundColor('transparent')
    } else {
      bottomBarNode.border({ width: 1, color: '#e5e7eb' })
      bottomBarNode.backgroundColor(toolbarBackgroundColor)
    }

    children.push(bottomBarNode.build())
  }

  if (hasToolbarSearch && searchableConfig) {
    const searchNode = HStack({
      children: [
        createSearchableInputNode(
          searchableConfig,
          modifiers.searchSuggestions,
          modifiers.searchScopes
        ),
      ],
      spacing: 0,
    })
      .role('search')
      .padding({ top: 8, right: 12, bottom: 10, left: 12 })
      .backgroundColor(toolbarBackgroundColor)
      .border({ width: 1, color: '#e5e7eb' })
      .build()
    children.push(searchNode)
  }

  return VStack({
    children,
    spacing: 0,
  })
    .build()
}

/**
 * .toolbarItems() modifier
 */
export function toolbarItems(
  component: ComponentInstance,
  items: ToolbarItemConfig[]
): ComponentInstance {
  const currentModifiers = ((component as any)._navigationModifiers ?? {}) as
    NavigationModifierConfig & {
    toolbarItems?: ToolbarItemConfig[]
  }
  const existingItems = currentModifiers.toolbarItems ?? []
  const mergedItems = [...existingItems, ...items]
  const toolbarBaseComponent = ((component as any)
    ._toolbarBaseComponent ?? component) as ComponentInstance

  const wrappedComponent = wrapComponentWithToolbar(
    toolbarBaseComponent,
    mergedItems,
    currentModifiers
  )
  const nextModifiers = {
    ...currentModifiers,
    toolbarItems: mergedItems,
  }
  ;(wrappedComponent as any)._navigationModifiers = {
    ...(wrappedComponent as any)._navigationModifiers,
    ...nextModifiers,
  }
  ;(wrappedComponent as any)._toolbarBaseComponent = toolbarBaseComponent

  return wrappedComponent
}

/**
 * .toolbar() modifier alias
 */
export function toolbar(
  component: ComponentInstance,
  items: ToolbarItemConfig[]
): ComponentInstance {
  return toolbarItems(component, items)
}

export function searchable(
  component: ComponentInstance,
  text: SearchableTextState,
  placement: SearchablePlacement = 'navigationBar'
): ComponentInstance {
  const currentModifiers = ((component as any)._navigationModifiers ?? {}) as
    NavigationModifierConfig & {
      toolbarItems?: ToolbarItemConfig[]
    }
  const toolbarItemList = currentModifiers.toolbarItems ?? []
  const toolbarBaseComponent = ((component as any)
    ._toolbarBaseComponent ?? component) as ComponentInstance
  const nextModifiers = {
    ...currentModifiers,
    searchable: { text, placement } as SearchableConfig,
  }

  const wrappedComponent = wrapComponentWithToolbar(
    toolbarBaseComponent,
    toolbarItemList,
    nextModifiers
  )
  ;(wrappedComponent as any)._navigationModifiers = {
    ...(wrappedComponent as any)._navigationModifiers,
    ...nextModifiers,
  }
  ;(wrappedComponent as any)._toolbarBaseComponent = toolbarBaseComponent

  return wrappedComponent
}

export function searchSuggestions(
  component: ComponentInstance,
  suggestions: SearchSuggestionsInput
): ComponentInstance {
  const currentModifiers = ((component as any)._navigationModifiers ?? {}) as
    NavigationModifierConfig & {
      toolbarItems?: ToolbarItemConfig[]
    }
  const toolbarItemList = currentModifiers.toolbarItems ?? []
  const toolbarBaseComponent = ((component as any)
    ._toolbarBaseComponent ?? component) as ComponentInstance
  const nextModifiers = {
    ...currentModifiers,
    searchSuggestions: suggestions,
  }

  const searchableConfig = nextModifiers.searchable
  if (!searchableConfig) {
    ;(component as any)._navigationModifiers = nextModifiers
    return component
  }

  const wrappedComponent = wrapComponentWithToolbar(
    toolbarBaseComponent,
    toolbarItemList,
    nextModifiers
  )
  ;(wrappedComponent as any)._navigationModifiers = {
    ...(wrappedComponent as any)._navigationModifiers,
    ...nextModifiers,
  }
  ;(wrappedComponent as any)._toolbarBaseComponent = toolbarBaseComponent

  return wrappedComponent
}

export function searchScopes(
  component: ComponentInstance,
  scope: SearchScopeState,
  scopes: SearchScopeOption[]
): ComponentInstance {
  const currentModifiers = ((component as any)._navigationModifiers ?? {}) as
    NavigationModifierConfig & {
      toolbarItems?: ToolbarItemConfig[]
    }
  const toolbarItemList = currentModifiers.toolbarItems ?? []
  const toolbarBaseComponent = ((component as any)
    ._toolbarBaseComponent ?? component) as ComponentInstance
  const nextModifiers = {
    ...currentModifiers,
    searchScopes: {
      scope,
      scopes: [...scopes],
    } as SearchScopesConfig,
  }

  const searchableConfig = nextModifiers.searchable
  if (!searchableConfig) {
    ;(component as any)._navigationModifiers = nextModifiers
    return component
  }

  const wrappedComponent = wrapComponentWithToolbar(
    toolbarBaseComponent,
    toolbarItemList,
    nextModifiers
  )
  ;(wrappedComponent as any)._navigationModifiers = {
    ...(wrappedComponent as any)._navigationModifiers,
    ...nextModifiers,
  }
  ;(wrappedComponent as any)._toolbarBaseComponent = toolbarBaseComponent

  return wrappedComponent
}

export function presentationDetents(
  component: ComponentInstance,
  detents: PresentationDetent[]
): ComponentInstance {
  ;(component as any)._sheetPresentationDetents = {
    detents: [...detents],
  }
  return component
}

function readPresentedState(isPresented: SheetPresentationState): boolean {
  if (typeof isPresented === 'function') {
    return Boolean(isPresented())
  }

  return Boolean(isPresented.get())
}

function dismissPresentedState(
  isPresented: SheetPresentationState,
  options: SheetPresentationOptions
): boolean {
  if (typeof isPresented !== 'function') {
    isPresented.set(false)
    options.onDismiss?.()
    return true
  }

  if (isSignal(isPresented)) {
    const signal = getSignalImpl(isPresented)
    if (signal) {
      signal.set(false)
      options.onDismiss?.()
      return true
    }
  }

  console.error(
    '.sheet dismiss requires a writable signal accessor or Binding<boolean>. Computed/read-only accessors are not dismissible.'
  )
  options.onDismiss?.()
  return false
}

function setupModalDismissEnvironment(
  isPresented: SheetPresentationState,
  options: SheetPresentationOptions
): () => void {
  return _pushNavigationEnvironmentDismiss(() => {
    dismissPresentedState(isPresented, options)
  })
}

function setupSheetPresentation(
  isPresented: SheetPresentationState,
  content: () => ComponentInstance,
  options: SheetPresentationOptions
): () => void {
  if (typeof document === 'undefined') {
    return () => {}
  }

  let portalRoot: HTMLDivElement | null = null
  let backdrop: HTMLDivElement | null = null
  let sheetHost: HTMLDivElement | null = null
  let disposeSheetContent: (() => void) | null = null
  let previousActiveElement: HTMLElement | null = null
  let removeEscapeListener: (() => void) | null = null
  let isMounted = false
  const sheetId = `sheet-${Math.random().toString(36).slice(2, 10)}`
  let transitionFrameId: number | null = null
  let focusFrameId: number | null = null
  let isTransitionQueued = false
  const transitionDurationMs = options.transitionDurationMs ?? 220
  let removeDetentDragListeners: (() => void) | null = null
  let removeDetentResizeListener: (() => void) | null = null
  let removeDismissScope: (() => void) | null = null

  const clearTransitionQueue = () => {
    if (transitionFrameId !== null) {
      cancelAnimationFrame(transitionFrameId)
      transitionFrameId = null
    }
    isTransitionQueued = false
  }

  const scheduleEntranceTransition = () => {
    if (!backdrop || !sheetHost || isTransitionQueued) {
      return
    }

    isTransitionQueued = true
    transitionFrameId = requestAnimationFrame(() => {
      transitionFrameId = requestAnimationFrame(() => {
        if (backdrop) {
          backdrop.style.opacity = '1'
        }
        if (sheetHost) {
          sheetHost.style.transform = 'translateY(0)'
        }
        transitionFrameId = null
        isTransitionQueued = false
      })
    })
  }

  const unmountPortal = () => {
    clearTransitionQueue()

    if (disposeSheetContent) {
      disposeSheetContent()
      disposeSheetContent = null
    }

    if (focusFrameId !== null) {
      cancelAnimationFrame(focusFrameId)
      focusFrameId = null
    }

    if (portalRoot) {
      portalRoot.remove()
      portalRoot = null
    }

    const stackIndex = activeSheetStack.lastIndexOf(sheetId)
    if (stackIndex >= 0) {
      activeSheetStack.splice(stackIndex, 1)
    }

    if (removeEscapeListener) {
      removeEscapeListener()
      removeEscapeListener = null
    }
    if (removeDetentDragListeners) {
      removeDetentDragListeners()
      removeDetentDragListeners = null
    }
    if (removeDetentResizeListener) {
      removeDetentResizeListener()
      removeDetentResizeListener = null
    }
    if (removeDismissScope) {
      removeDismissScope()
      removeDismissScope = null
    }

    if (
      previousActiveElement &&
      previousActiveElement.isConnected &&
      typeof previousActiveElement.focus === 'function'
    ) {
      previousActiveElement.focus()
    }
    previousActiveElement = null

    backdrop = null
    sheetHost = null
    isMounted = false
  }

  const mountPortal = () => {
    if (isMounted) {
      return
    }

    portalRoot = document.createElement('div')
    portalRoot.setAttribute('data-tachui-sheet-root', 'true')
    portalRoot.setAttribute('data-tachui-sheet-id', sheetId)
    portalRoot.style.position = 'fixed'
    portalRoot.style.inset = '0'
    portalRoot.style.zIndex = String(options.zIndex ?? 1000)
    portalRoot.style.display = 'flex'
    portalRoot.style.alignItems = 'flex-end'
    portalRoot.style.justifyContent = 'center'
    portalRoot.style.pointerEvents = 'none'

    backdrop = document.createElement('div')
    backdrop.setAttribute('data-tachui-sheet-backdrop', 'true')
    backdrop.style.position = 'absolute'
    backdrop.style.inset = '0'
    backdrop.style.background =
      options.backdropColor ?? 'rgba(0, 0, 0, 0.45)'
    backdrop.style.opacity = '0'
    backdrop.style.pointerEvents = 'auto'
    backdrop.style.transition = `opacity ${transitionDurationMs}ms ease`

    sheetHost = document.createElement('div')
    sheetHost.setAttribute('data-tachui-sheet-content', 'true')
    sheetHost.setAttribute('role', 'dialog')
    sheetHost.setAttribute('aria-modal', 'true')
    if (options.ariaLabel) {
      sheetHost.setAttribute('aria-label', options.ariaLabel)
    }
    sheetHost.tabIndex = -1
    sheetHost.style.position = 'relative'
    sheetHost.style.width = '100%'
    sheetHost.style.maxWidth = options.maxWidth ?? '640px'
    sheetHost.style.transform = 'translateY(100%)'
    sheetHost.style.transition = `transform ${transitionDurationMs}ms ease`
    sheetHost.style.pointerEvents = 'auto'
    sheetHost.style.overflow = 'hidden'
    sheetHost.style.display = 'flex'
    sheetHost.style.flexDirection = 'column'

    if (options.dismissOnBackdropTap !== false) {
      backdrop.addEventListener('click', () => {
        dismissPresentedState(isPresented, options)
      })
    }

    if (options.dismissOnEscape !== false) {
      const escapeListener = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && activeSheetStack.at(-1) === sheetId) {
          event.preventDefault()
          event.stopPropagation()
          dismissPresentedState(isPresented, options)
        }
      }
      document.addEventListener('keydown', escapeListener)
      removeEscapeListener = () => {
        document.removeEventListener('keydown', escapeListener)
      }
    }

    const resolveDetentHeightPx = (detent: PresentationDetent): number => {
      const viewportHeight = window.innerHeight
      if (detent === 'medium') {
        return Math.round(viewportHeight * 0.5)
      }
      if (detent === 'large') {
        return Math.round(viewportHeight * 0.9)
      }
      if ('fraction' in detent) {
        const fraction = Math.min(Math.max(detent.fraction, 0.1), 0.95)
        return Math.round(viewportHeight * fraction)
      }
      return Math.round(
        Math.max(1, Math.min(detent.height, viewportHeight * 0.95))
      )
    }

    const applyDetentToHost = (
      detentHeights: number[],
      detentIndex: number
    ): void => {
      const clampedIndex = Math.max(0, Math.min(detentIndex, detentHeights.length - 1))
      const height = detentHeights[clampedIndex]
      sheetHost!.style.height = `${height}px`
      sheetHost!.style.maxHeight = `${Math.round(window.innerHeight * 0.95)}px`
    }

    removeDismissScope = setupModalDismissEnvironment(isPresented, options)

    const sheetContent = untrack(() => content())
    const requestedDetents = untrack(() =>
      (((sheetContent as any)._sheetPresentationDetents
        ?.detents ?? []) as PresentationDetent[]).filter(Boolean)
    )
    let detentHeights = requestedDetents.map(resolveDetentHeightPx)
    let currentDetentIndex = detentHeights.length > 0
      ? detentHeights.reduce((smallestIndex, currentHeight, currentIndex) => {
          return currentHeight < detentHeights[smallestIndex]
            ? currentIndex
            : smallestIndex
        }, 0)
      : 0

    if (detentHeights.length > 0) {
      applyDetentToHost(detentHeights, currentDetentIndex)
      sheetHost.style.transition = `transform ${transitionDurationMs}ms ease, height ${transitionDurationMs}ms ease`
    }

    if (detentHeights.length > 1) {
      const currentSheetHost = sheetHost
      if (!currentSheetHost) {
        return
      }

      const dragHandle = document.createElement('div')
      dragHandle.setAttribute('data-tachui-sheet-drag-handle', 'true')
      dragHandle.style.width = '100%'
      dragHandle.style.display = 'flex'
      dragHandle.style.justifyContent = 'center'
      dragHandle.style.padding = '10px 0 6px 0'
      dragHandle.style.cursor = 'grab'
      dragHandle.style.touchAction = 'none'
      dragHandle.setAttribute('role', 'slider')
      dragHandle.setAttribute('tabindex', '0')
      dragHandle.setAttribute('aria-label', 'Adjust sheet height')
      dragHandle.setAttribute('aria-valuemin', '0')
      dragHandle.setAttribute(
        'aria-valuemax',
        String(Math.max(0, detentHeights.length - 1))
      )

      const indicator = document.createElement('div')
      indicator.style.width = '36px'
      indicator.style.height = '4px'
      indicator.style.borderRadius = '999px'
      indicator.style.background = 'rgba(60, 60, 67, 0.35)'
      dragHandle.appendChild(indicator)
      currentSheetHost.appendChild(dragHandle)

      let isDragging = false
      let startY = 0
      let startHeight = detentHeights[currentDetentIndex] ?? 0
      let activeTouchIdentifier: number | null = null

      const updateDragHandleAriaValue = () => {
        dragHandle.setAttribute('aria-valuenow', String(currentDetentIndex))
      }
      updateDragHandleAriaValue()

      const onDragMove = (clientY: number) => {
        if (!isDragging) return
        const deltaY = clientY - startY
        const minHeight = Math.min(...detentHeights)
        const maxHeight = Math.max(...detentHeights)
        const nextHeight = Math.min(
          maxHeight,
          Math.max(minHeight, startHeight - deltaY)
        )
        currentSheetHost.style.height = `${Math.round(nextHeight)}px`
      }

      const onDragEnd = () => {
        if (!isDragging) return
        isDragging = false
        activeTouchIdentifier = null
        dragHandle.style.cursor = 'grab'

        const currentHeight = Number.parseFloat(currentSheetHost.style.height)
        const nearestIndex = detentHeights.reduce((nearest, detentHeight, index) => {
          const nearestDistance = Math.abs(detentHeights[nearest] - currentHeight)
          const currentDistance = Math.abs(detentHeight - currentHeight)
          return currentDistance < nearestDistance ? index : nearest
        }, 0)
        currentDetentIndex = nearestIndex
        applyDetentToHost(detentHeights, currentDetentIndex)
        updateDragHandleAriaValue()

        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
        window.removeEventListener('touchmove', onTouchMove)
        window.removeEventListener('touchend', onTouchEnd)
        window.removeEventListener('touchcancel', onTouchEnd)
      }

      const beginDrag = (clientY: number) => {
        isDragging = true
        startY = clientY
        startHeight = Number.parseFloat(currentSheetHost.style.height)
        dragHandle.style.cursor = 'grabbing'
      }

      const onMouseMove = (event: MouseEvent) => {
        onDragMove(event.clientY)
      }

      const onMouseUp = () => {
        onDragEnd()
      }

      const onTouchMove = (event: TouchEvent) => {
        if (!isDragging) return
        const matchingTouch = Array.from(event.touches).find(
          touch => touch.identifier === activeTouchIdentifier
        )
        const activeTouch = matchingTouch ?? event.touches[0]
        if (!activeTouch) return
        event.preventDefault()
        onDragMove(activeTouch.clientY)
      }

      const onTouchEnd = () => {
        onDragEnd()
      }

      const onMouseDown = (event: MouseEvent) => {
        event.preventDefault()
        beginDrag(event.clientY)
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
      }

      const onTouchStart = (event: TouchEvent) => {
        const touch = event.touches[0]
        if (!touch) return
        event.preventDefault()
        activeTouchIdentifier = touch.identifier
        beginDrag(touch.clientY)
        window.addEventListener('touchmove', onTouchMove, { passive: false })
        window.addEventListener('touchend', onTouchEnd)
        window.addEventListener('touchcancel', onTouchEnd)
      }

      const onHandleKeyDown = (event: KeyboardEvent) => {
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
          return
        }
        event.preventDefault()
        const nextIndex =
          event.key === 'ArrowUp'
            ? Math.min(detentHeights.length - 1, currentDetentIndex + 1)
            : Math.max(0, currentDetentIndex - 1)
        if (nextIndex === currentDetentIndex) {
          return
        }
        currentDetentIndex = nextIndex
        applyDetentToHost(detentHeights, currentDetentIndex)
        updateDragHandleAriaValue()
      }

      dragHandle.addEventListener('mousedown', onMouseDown)
      dragHandle.addEventListener('touchstart', onTouchStart, { passive: false })
      dragHandle.addEventListener('keydown', onHandleKeyDown)

      removeDetentDragListeners = () => {
        dragHandle.removeEventListener('mousedown', onMouseDown)
        dragHandle.removeEventListener('touchstart', onTouchStart)
        dragHandle.removeEventListener('keydown', onHandleKeyDown)
        if (isDragging) {
          isDragging = false
          activeTouchIdentifier = null
          window.removeEventListener('mousemove', onMouseMove)
          window.removeEventListener('mouseup', onMouseUp)
          window.removeEventListener('touchmove', onTouchMove)
          window.removeEventListener('touchend', onTouchEnd)
          window.removeEventListener('touchcancel', onTouchEnd)
        }
      }
    }

    if (detentHeights.length > 0) {
      const onResize = () => {
        detentHeights = requestedDetents.map(resolveDetentHeightPx)
        currentDetentIndex = Math.min(currentDetentIndex, detentHeights.length - 1)
        applyDetentToHost(detentHeights, currentDetentIndex)
      }
      window.addEventListener('resize', onResize)
      removeDetentResizeListener = () => {
        window.removeEventListener('resize', onResize)
      }
    }

    const contentHost = document.createElement('div')
    contentHost.setAttribute('data-tachui-sheet-body', 'true')
    contentHost.style.width = '100%'
    contentHost.style.height = '100%'
    contentHost.style.overflow = 'auto'
    sheetHost.appendChild(contentHost)

    portalRoot.append(backdrop, sheetHost)
    document.body.appendChild(portalRoot)
    activeSheetStack.push(sheetId)

    previousActiveElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    disposeSheetContent = untrack(() => mountComponentTree(sheetContent, contentHost))
    isMounted = true
    scheduleEntranceTransition()

    focusFrameId = requestAnimationFrame(() => {
      const focusableElement = sheetHost?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      if (focusableElement && typeof focusableElement.focus === 'function') {
        focusableElement.focus()
      } else if (sheetHost) {
        sheetHost.focus()
      }
      focusFrameId = null
    })
  }

  const presentationEffect = createEffect(() => {
    const presented = readPresentedState(isPresented)

    if (presented) {
      mountPortal()
      return
    }

    unmountPortal()
  })

  return () => {
    presentationEffect.dispose()
    unmountPortal()
  }
}

function oppositePopoverEdge(edge: PopoverArrowEdge): PopoverArrowEdge {
  switch (edge) {
    case 'top':
      return 'bottom'
    case 'bottom':
      return 'top'
    case 'leading':
      return 'trailing'
    case 'trailing':
      return 'leading'
  }
}

function calculatePopoverPosition(
  edge: PopoverArrowEdge,
  anchorRect: DOMRect,
  popoverWidth: number,
  popoverHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  offset: number
): { top: number; left: number } {
  switch (edge) {
    // arrow on top edge => popover shown below anchor
    case 'top':
      return {
        top: anchorRect.bottom + offset,
        left: anchorRect.left + anchorRect.width / 2 - popoverWidth / 2,
      }
    // arrow on bottom edge => popover shown above anchor
    case 'bottom':
      return {
        top: anchorRect.top - popoverHeight - offset,
        left: anchorRect.left + anchorRect.width / 2 - popoverWidth / 2,
      }
    // arrow on leading edge => popover shown right of anchor
    case 'leading':
      return {
        top: anchorRect.top + anchorRect.height / 2 - popoverHeight / 2,
        left: anchorRect.right + offset,
      }
    // arrow on trailing edge => popover shown left of anchor
    case 'trailing':
      return {
        top: anchorRect.top + anchorRect.height / 2 - popoverHeight / 2,
        left: anchorRect.left - popoverWidth - offset,
      }
  }
}

function hasPopoverOverflow(
  position: { top: number; left: number },
  popoverWidth: number,
  popoverHeight: number,
  viewportWidth: number,
  viewportHeight: number
): boolean {
  const viewportPadding = 8
  return (
    position.top < viewportPadding ||
    position.left < viewportPadding ||
    position.top + popoverHeight > viewportHeight - viewportPadding ||
    position.left + popoverWidth > viewportWidth - viewportPadding
  )
}

function clampPopoverPosition(
  position: { top: number; left: number },
  popoverWidth: number,
  popoverHeight: number,
  viewportWidth: number,
  viewportHeight: number
): { top: number; left: number } {
  const viewportPadding = 8
  return {
    top: Math.min(
      Math.max(position.top, viewportPadding),
      Math.max(viewportPadding, viewportHeight - popoverHeight - viewportPadding)
    ),
    left: Math.min(
      Math.max(position.left, viewportPadding),
      Math.max(viewportPadding, viewportWidth - popoverWidth - viewportPadding)
    ),
  }
}

function setupPopoverPresentation(
  anchorElement: Element | undefined,
  isPresented: SheetPresentationState,
  preferredEdge: PopoverArrowEdge,
  content: () => ComponentInstance,
  options: PopoverPresentationOptions
): () => void {
  if (typeof document === 'undefined' || !anchorElement) {
    return () => {}
  }

  let portalRoot: HTMLDivElement | null = null
  let popoverHost: HTMLDivElement | null = null
  let popoverArrow: HTMLDivElement | null = null
  let popoverContentHost: HTMLDivElement | null = null
  let removeEscapeListener: (() => void) | null = null
  let removeOutsideClickListener: (() => void) | null = null
  let removeRepositionListener: (() => void) | null = null
  let disposePopoverContent: (() => void) | null = null
  let initialPositionFrameId: number | null = null
  let isMounted = false
  let removeDismissScope: (() => void) | null = null
  const offset = options.offset ?? 12

  const applyArrowStyle = (edge: PopoverArrowEdge) => {
    if (!popoverArrow) {
      return
    }

    popoverArrow.style.width = '10px'
    popoverArrow.style.height = '10px'
    popoverArrow.style.position = 'absolute'
    popoverArrow.style.background = 'white'
    popoverArrow.style.transform = 'rotate(45deg)'
    popoverArrow.style.boxShadow = '-1px -1px 1px rgba(0, 0, 0, 0.08)'

    popoverArrow.style.top = ''
    popoverArrow.style.bottom = ''
    popoverArrow.style.left = ''
    popoverArrow.style.right = ''
    popoverArrow.style.marginLeft = ''
    popoverArrow.style.marginTop = ''

    if (edge === 'top') {
      popoverArrow.style.top = '-5px'
      popoverArrow.style.left = '50%'
      popoverArrow.style.marginLeft = '-5px'
    } else if (edge === 'bottom') {
      popoverArrow.style.bottom = '-5px'
      popoverArrow.style.left = '50%'
      popoverArrow.style.marginLeft = '-5px'
    } else if (edge === 'leading') {
      popoverArrow.style.left = '-5px'
      popoverArrow.style.top = '50%'
      popoverArrow.style.marginTop = '-5px'
    } else {
      popoverArrow.style.right = '-5px'
      popoverArrow.style.top = '50%'
      popoverArrow.style.marginTop = '-5px'
    }
  }

  const positionPopover = () => {
    if (!popoverHost || !anchorElement) {
      return
    }

    const anchorRect = anchorElement.getBoundingClientRect()
    const measuredRect = popoverHost.getBoundingClientRect()
    const popoverWidth = measuredRect.width || 280
    const popoverHeight = measuredRect.height || 200
    const viewportWidth = window.innerWidth || 1024
    const viewportHeight = window.innerHeight || 768

    const preferredPosition = calculatePopoverPosition(
      preferredEdge,
      anchorRect,
      popoverWidth,
      popoverHeight,
      viewportWidth,
      viewportHeight,
      offset
    )

    let resolvedEdge = preferredEdge
    let resolvedPosition = preferredPosition

    if (
      hasPopoverOverflow(
        preferredPosition,
        popoverWidth,
        popoverHeight,
        viewportWidth,
        viewportHeight
      )
    ) {
      const flippedEdge = oppositePopoverEdge(preferredEdge)
      const flippedPosition = calculatePopoverPosition(
        flippedEdge,
        anchorRect,
        popoverWidth,
        popoverHeight,
        viewportWidth,
        viewportHeight,
        offset
      )

      resolvedEdge = flippedEdge
      resolvedPosition = flippedPosition
    }

    const clampedPosition = clampPopoverPosition(
      resolvedPosition,
      popoverWidth,
      popoverHeight,
      viewportWidth,
      viewportHeight
    )

    popoverHost.style.top = `${clampedPosition.top}px`
    popoverHost.style.left = `${clampedPosition.left}px`
    popoverHost.setAttribute('data-tachui-popover-edge', resolvedEdge)
    applyArrowStyle(resolvedEdge)
  }

  const unmountPortal = () => {
    if (disposePopoverContent) {
      disposePopoverContent()
      disposePopoverContent = null
    }

    if (removeEscapeListener) {
      removeEscapeListener()
      removeEscapeListener = null
    }

    if (removeOutsideClickListener) {
      removeOutsideClickListener()
      removeOutsideClickListener = null
    }

    if (removeRepositionListener) {
      removeRepositionListener()
      removeRepositionListener = null
    }

    if (initialPositionFrameId !== null) {
      cancelAnimationFrame(initialPositionFrameId)
      initialPositionFrameId = null
    }
    if (removeDismissScope) {
      removeDismissScope()
      removeDismissScope = null
    }

    if (portalRoot) {
      portalRoot.remove()
      portalRoot = null
    }

    popoverHost = null
    popoverArrow = null
    popoverContentHost = null
    isMounted = false
  }

  const mountPortal = () => {
    if (isMounted) {
      positionPopover()
      return
    }

    portalRoot = document.createElement('div')
    portalRoot.setAttribute('data-tachui-popover-root', 'true')
    portalRoot.style.position = 'fixed'
    portalRoot.style.inset = '0'
    portalRoot.style.pointerEvents = 'none'
    portalRoot.style.zIndex = String(options.zIndex ?? 1100)

    popoverHost = document.createElement('div')
    popoverHost.setAttribute('data-tachui-popover-content', 'true')
    popoverHost.setAttribute('role', 'dialog')
    if (options.ariaLabel) {
      popoverHost.setAttribute('aria-label', options.ariaLabel)
    }
    popoverHost.style.position = 'fixed'
    popoverHost.style.pointerEvents = 'auto'
    popoverHost.style.background = 'white'
    popoverHost.style.border = '1px solid rgba(0, 0, 0, 0.12)'
    popoverHost.style.borderRadius = '10px'
    popoverHost.style.boxShadow =
      '0 10px 30px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0, 0, 0, 0.08)'
    popoverHost.style.padding = '12px'
    popoverHost.style.maxWidth = options.maxWidth ?? '320px'

    popoverArrow = document.createElement('div')
    popoverArrow.setAttribute('data-tachui-popover-arrow', 'true')

    popoverContentHost = document.createElement('div')
    popoverContentHost.setAttribute('data-tachui-popover-body', 'true')

    popoverHost.append(popoverArrow, popoverContentHost)
    portalRoot.append(popoverHost)
    document.body.appendChild(portalRoot)
    removeDismissScope = setupModalDismissEnvironment(isPresented, {
      dismissOnEscape: options.dismissOnEscape,
      onDismiss: options.onDismiss,
    })

    disposePopoverContent = untrack(() => mountComponentTree(untrack(() => content()), popoverContentHost!))

    initialPositionFrameId = requestAnimationFrame(() => {
      positionPopover()
      initialPositionFrameId = null
    })

    if (options.dismissOnOutsideClick !== false) {
      const outsideListener = (event: MouseEvent) => {
        const target = event.target as Node | null
        if (!target || !popoverHost || !anchorElement) {
          return
        }

        if (popoverHost.contains(target) || anchorElement.contains(target)) {
          return
        }

        dismissPresentedState(isPresented, {
          dismissOnEscape: options.dismissOnEscape,
          onDismiss: options.onDismiss,
        })
      }

      document.addEventListener('mousedown', outsideListener)
      removeOutsideClickListener = () => {
        document.removeEventListener('mousedown', outsideListener)
      }
    }

    if (options.dismissOnEscape !== false) {
      const escapeListener = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          dismissPresentedState(isPresented, {
            dismissOnEscape: options.dismissOnEscape,
            onDismiss: options.onDismiss,
          })
        }
      }

      document.addEventListener('keydown', escapeListener)
      removeEscapeListener = () => {
        document.removeEventListener('keydown', escapeListener)
      }
    }

    const repositionListener = () => {
      positionPopover()
    }
    window.addEventListener('resize', repositionListener)
    window.addEventListener('scroll', repositionListener, true)
    removeRepositionListener = () => {
      window.removeEventListener('resize', repositionListener)
      window.removeEventListener('scroll', repositionListener, true)
    }

    isMounted = true
  }

  const presentationEffect = createEffect(() => {
    const presented = readPresentedState(isPresented)

    if (presented) {
      mountPortal()
      return
    }

    unmountPortal()
  })

  return () => {
    presentationEffect.dispose()
    unmountPortal()
  }
}

/**
 * .sheet() modifier
 *
 * @param component - The component to anchor sheet presentation to
 * @param isPresented - Reactive sheet presentation state accessor/binding
 * @param content - Sheet content factory
 * @param options - Presentation options
 * @returns The modified component
 */
export function sheet(
  component: ComponentInstance,
  isPresented: SheetPresentationState,
  content: () => ComponentInstance,
  options: SheetPresentationOptions = {}
): ComponentInstance {
  ;(component as any)._navigationModifiers = {
    ...(component as any)._navigationModifiers,
    sheet: { isPresented, content, options },
  }

  const existingLifecycle = (component as any)._enhancedLifecycle ?? {}
  const existingOnDOMReady = existingLifecycle.onDOMReady as
    | ((elements: Map<string, Element>, primary?: Element) => void | (() => void))
    | undefined

  ;(component as any)._enhancedLifecycle = {
    ...existingLifecycle,
    onDOMReady: (elements: Map<string, Element>, primary?: Element) => {
      const existingCleanup = existingOnDOMReady?.(elements, primary)
      const sheetCleanup = setupSheetPresentation(isPresented, content, options)

      return () => {
        sheetCleanup()
        if (typeof existingCleanup === 'function') {
          existingCleanup()
        }
      }
    },
  }

  return component
}

function setupFullScreenCoverPresentation(
  isPresented: SheetPresentationState,
  content: () => ComponentInstance,
  options: FullScreenCoverOptions
): () => void {
  if (typeof document === 'undefined') {
    return () => {}
  }

  let portalRoot: HTMLDivElement | null = null
  let contentHost: HTMLDivElement | null = null
  let disposeCoverContent: (() => void) | null = null
  let previousActiveElement: HTMLElement | null = null
  let removeFocusTrapListener: (() => void) | null = null
  let focusFrameId: number | null = null
  let isMounted = false
  let removeDismissScope: (() => void) | null = null

  const getFocusableElements = (): HTMLElement[] => {
    if (!contentHost) return []
    return Array.from(
      contentHost.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    )
  }

  const unmountPortal = () => {
    if (disposeCoverContent) {
      disposeCoverContent()
      disposeCoverContent = null
    }

    if (removeFocusTrapListener) {
      removeFocusTrapListener()
      removeFocusTrapListener = null
    }

    if (focusFrameId !== null) {
      cancelAnimationFrame(focusFrameId)
      focusFrameId = null
    }
    if (removeDismissScope) {
      removeDismissScope()
      removeDismissScope = null
    }

    if (portalRoot) {
      portalRoot.remove()
      portalRoot = null
    }

    if (
      previousActiveElement &&
      previousActiveElement.isConnected &&
      typeof previousActiveElement.focus === 'function'
    ) {
      previousActiveElement.focus()
    }
    previousActiveElement = null

    contentHost = null
    isMounted = false
  }

  const mountPortal = () => {
    if (isMounted) return

    portalRoot = document.createElement('div')
    portalRoot.setAttribute('data-tachui-fullscreen-cover-root', 'true')
    portalRoot.style.position = 'fixed'
    portalRoot.style.inset = '0'
    portalRoot.style.width = '100vw'
    portalRoot.style.height = '100vh'
    portalRoot.style.zIndex = String(options.zIndex ?? 1200)
    portalRoot.style.background = options.backgroundColor ?? '#ffffff'
    portalRoot.style.pointerEvents = 'auto'

    contentHost = document.createElement('div')
    contentHost.setAttribute('data-tachui-fullscreen-cover-content', 'true')
    contentHost.setAttribute('role', 'dialog')
    contentHost.setAttribute('aria-modal', 'true')
    if (options.ariaLabel) {
      contentHost.setAttribute('aria-label', options.ariaLabel)
    }
    contentHost.tabIndex = -1
    contentHost.style.width = '100%'
    contentHost.style.height = '100%'

    portalRoot.appendChild(contentHost)
    document.body.appendChild(portalRoot)
    removeDismissScope = setupModalDismissEnvironment(isPresented, {
      onDismiss: options.onDismiss,
    })
    previousActiveElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    disposeCoverContent = untrack(() => mountComponentTree(untrack(() => content()), contentHost!))

    const focusTrapHandler = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !contentHost) return

      const focusable = getFocusableElements()
      if (focusable.length === 0) {
        event.preventDefault()
        contentHost.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', focusTrapHandler)
    removeFocusTrapListener = () => {
      document.removeEventListener('keydown', focusTrapHandler)
    }

    focusFrameId = requestAnimationFrame(() => {
      const focusable = getFocusableElements()
      if (focusable.length > 0) {
        focusable[0].focus()
      } else if (contentHost) {
        contentHost.focus()
      }
      focusFrameId = null
    })

    isMounted = true
  }

  const effect = createEffect(() => {
    if (readPresentedState(isPresented)) {
      mountPortal()
    } else {
      unmountPortal()
    }
  })

  return () => {
    effect.dispose()
    unmountPortal()
  }
}

/**
 * .fullScreenCover() modifier
 */
export function fullScreenCover(
  component: ComponentInstance,
  isPresented: SheetPresentationState,
  content: () => ComponentInstance,
  options: FullScreenCoverOptions = {}
): ComponentInstance {
  ;(component as any)._navigationModifiers = {
    ...(component as any)._navigationModifiers,
    fullScreenCover: { isPresented, content, options },
  }

  const existingLifecycle = (component as any)._enhancedLifecycle ?? {}
  const existingOnDOMReady = existingLifecycle.onDOMReady as
    | ((elements: Map<string, Element>, primary?: Element) => void | (() => void))
    | undefined

  ;(component as any)._enhancedLifecycle = {
    ...existingLifecycle,
    onDOMReady: (elements: Map<string, Element>, primary?: Element) => {
      const existingCleanup = existingOnDOMReady?.(elements, primary)
      const coverCleanup = setupFullScreenCoverPresentation(
        isPresented,
        content,
        options
      )

      return () => {
        coverCleanup()
        if (typeof existingCleanup === 'function') {
          existingCleanup()
        }
      }
    },
  }

  return component
}

/**
 * .popover() modifier
 *
 * @param component - The component to anchor popover presentation to
 * @param isPresented - Reactive popover presentation state accessor/binding
 * @param arrowEdge - Preferred popover arrow edge orientation
 * @param content - Popover content factory
 * @param options - Presentation options
 * @returns The modified component
 */
export function popover(
  component: ComponentInstance,
  isPresented: SheetPresentationState,
  arrowEdge: PopoverArrowEdge,
  content: () => ComponentInstance,
  options: PopoverPresentationOptions = {}
): ComponentInstance {
  ;(component as any)._navigationModifiers = {
    ...(component as any)._navigationModifiers,
    popover: { isPresented, arrowEdge, content, options },
  }

  const existingLifecycle = (component as any)._enhancedLifecycle ?? {}
  const existingOnDOMReady = existingLifecycle.onDOMReady as
    | ((elements: Map<string, Element>, primary?: Element) => void | (() => void))
    | undefined

  ;(component as any)._enhancedLifecycle = {
    ...existingLifecycle,
    onDOMReady: (elements: Map<string, Element>, primary?: Element) => {
      const existingCleanup = existingOnDOMReady?.(elements, primary)
      const popoverCleanup = setupPopoverPresentation(
        primary,
        isPresented,
        arrowEdge,
        content,
        options
      )

      return () => {
        popoverCleanup()
        if (typeof existingCleanup === 'function') {
          existingCleanup()
        }
      }
    },
  }

  return component
}

function setupConfirmationDialogPresentation(
  isPresented: SheetPresentationState,
  title: string,
  actions: ConfirmationDialogAction[]
): () => void {
  if (typeof document === 'undefined') {
    return () => {}
  }

  let portalRoot: HTMLDivElement | null = null
  let backdrop: HTMLDivElement | null = null
  let dialogHost: HTMLDivElement | null = null
  let removeKeydownListener: (() => void) | null = null
  let removeDismissScope: (() => void) | null = null
  let focusFrameId: number | null = null
  let previousActiveElement: HTMLElement | null = null
  let isMounted = false
  const dialogId = `confirmation-dialog-${Math.random().toString(36).slice(2, 10)}`

  const dismissOptions: SheetPresentationOptions = {}
  const dismiss = () => {
    dismissPresentedState(isPresented, dismissOptions)
  }

  const getFocusableElements = (): HTMLElement[] => {
    if (!dialogHost) {
      return []
    }
    return Array.from(
      dialogHost.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    )
  }

  const unmountPortal = () => {
    if (focusFrameId !== null) {
      cancelAnimationFrame(focusFrameId)
      focusFrameId = null
    }
    if (portalRoot) {
      portalRoot.remove()
      portalRoot = null
    }
    if (removeKeydownListener) {
      removeKeydownListener()
      removeKeydownListener = null
    }
    if (removeDismissScope) {
      removeDismissScope()
      removeDismissScope = null
    }
    const stackIndex = activeSheetStack.lastIndexOf(dialogId)
    if (stackIndex >= 0) {
      activeSheetStack.splice(stackIndex, 1)
    }
    if (
      previousActiveElement &&
      previousActiveElement.isConnected &&
      typeof previousActiveElement.focus === 'function'
    ) {
      previousActiveElement.focus()
    }
    previousActiveElement = null
    backdrop = null
    dialogHost = null
    isMounted = false
  }

  const mountPortal = () => {
    if (isMounted) return

    portalRoot = document.createElement('div')
    portalRoot.setAttribute('data-tachui-confirmation-dialog-root', 'true')
    portalRoot.style.position = 'fixed'
    portalRoot.style.inset = '0'
    portalRoot.style.display = 'flex'
    portalRoot.style.alignItems = 'flex-end'
    portalRoot.style.justifyContent = 'center'
    portalRoot.style.zIndex = '1300'
    portalRoot.style.pointerEvents = 'none'

    backdrop = document.createElement('div')
    backdrop.setAttribute('data-tachui-confirmation-dialog-backdrop', 'true')
    backdrop.style.position = 'absolute'
    backdrop.style.inset = '0'
    backdrop.style.background = 'rgba(0, 0, 0, 0.45)'
    backdrop.style.pointerEvents = 'auto'
    backdrop.addEventListener('click', dismiss)

    dialogHost = document.createElement('div')
    dialogHost.setAttribute('data-tachui-confirmation-dialog-content', 'true')
    dialogHost.setAttribute('role', 'dialog')
    dialogHost.setAttribute('aria-modal', 'true')
    dialogHost.setAttribute('aria-labelledby', `${dialogId}-title`)
    dialogHost.style.position = 'relative'
    dialogHost.style.pointerEvents = 'auto'
    dialogHost.style.width = 'min(100%, 520px)'
    dialogHost.style.margin = '0 12px 12px'
    dialogHost.style.borderRadius = '14px'
    dialogHost.style.background = '#ffffff'
    dialogHost.style.border = '1px solid rgba(0, 0, 0, 0.12)'
    dialogHost.style.boxShadow = '0 20px 45px rgba(0, 0, 0, 0.24)'
    dialogHost.style.overflow = 'hidden'
    dialogHost.style.display = 'flex'
    dialogHost.style.flexDirection = 'column'

    const titleNode = document.createElement('div')
    titleNode.id = `${dialogId}-title`
    titleNode.setAttribute('data-tachui-confirmation-dialog-title', 'true')
    titleNode.textContent = title
    titleNode.style.padding = '14px 16px 10px'
    titleNode.style.fontSize = '15px'
    titleNode.style.fontWeight = '600'
    titleNode.style.textAlign = 'center'
    titleNode.style.borderBottom = '1px solid rgba(0, 0, 0, 0.08)'
    dialogHost.appendChild(titleNode)

    actions.forEach(actionItem => {
      const actionButton = document.createElement('button')
      const role = actionItem.role ?? 'default'
      actionButton.setAttribute('type', 'button')
      actionButton.setAttribute('data-tachui-confirmation-dialog-action', 'true')
      actionButton.setAttribute('data-role', role)
      actionButton.textContent = actionItem.label
      actionButton.style.border = '0'
      actionButton.style.background = 'transparent'
      actionButton.style.padding = '14px 16px'
      actionButton.style.cursor = 'pointer'
      actionButton.style.fontSize = '16px'
      actionButton.style.borderBottom = '1px solid rgba(0, 0, 0, 0.06)'

      if (role === 'destructive') {
        actionButton.style.color = '#d32f2f'
        actionButton.style.fontWeight = '600'
        actionButton.setAttribute(
          'aria-label',
          `${actionItem.label} (destructive action)`
        )
      } else if (role === 'cancel') {
        actionButton.style.fontWeight = '700'
      } else {
        actionButton.style.color = '#111827'
      }

      actionButton.addEventListener('click', () => {
        if (role !== 'cancel') {
          actionItem.action?.()
        }
        dismiss()
      })

      dialogHost!.appendChild(actionButton)
    })

    portalRoot.append(backdrop, dialogHost)
    document.body.appendChild(portalRoot)
    previousActiveElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    activeSheetStack.push(dialogId)

    const keydownListener = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && activeSheetStack.at(-1) === dialogId) {
        event.preventDefault()
        event.stopPropagation()
        dismiss()
        return
      }

      if (event.key !== 'Tab' || !dialogHost || activeSheetStack.at(-1) !== dialogId) {
        return
      }

      const focusable = getFocusableElements()
      if (focusable.length === 0) {
        event.preventDefault()
        dialogHost.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', keydownListener)
    removeKeydownListener = () => {
      document.removeEventListener('keydown', keydownListener)
    }

    removeDismissScope = setupModalDismissEnvironment(isPresented, dismissOptions)
    focusFrameId = requestAnimationFrame(() => {
      const focusable = getFocusableElements()
      if (focusable.length > 0) {
        focusable[0].focus()
      } else if (dialogHost) {
        dialogHost.focus()
      }
      focusFrameId = null
    })
    isMounted = true
  }

  const presentationEffect = createEffect(() => {
    const presented = readPresentedState(isPresented)
    if (presented) {
      mountPortal()
      return
    }
    unmountPortal()
  })

  return () => {
    presentationEffect.dispose()
    unmountPortal()
  }
}

export function confirmationDialog(
  component: ComponentInstance,
  title: string,
  isPresented: SheetPresentationState,
  actions: ConfirmationDialogAction[]
): ComponentInstance {
  ;(component as any)._navigationModifiers = {
    ...(component as any)._navigationModifiers,
    confirmationDialog: { title, isPresented, actions },
  }

  const existingLifecycle = (component as any)._enhancedLifecycle ?? {}
  const existingOnDOMReady = existingLifecycle.onDOMReady as
    | ((elements: Map<string, Element>, primary?: Element) => void | (() => void))
    | undefined

  ;(component as any)._enhancedLifecycle = {
    ...existingLifecycle,
    onDOMReady: (elements: Map<string, Element>, primary?: Element) => {
      const existingCleanup = existingOnDOMReady?.(elements, primary)
      const dialogCleanup = setupConfirmationDialogPresentation(
        isPresented,
        title,
        actions
      )

      return () => {
        dialogCleanup()
        if (typeof existingCleanup === 'function') {
          existingCleanup()
        }
      }
    },
  }

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
    toolbarBackgroundVisibility(
      visibility: ToolbarBackgroundVisibility,
      target?: ToolbarBackgroundVisibilityTarget
    ): ComponentInstance
    presentationDetents(detents: PresentationDetent[]): ComponentInstance
    toolbar(items: ToolbarItemConfig[]): ComponentInstance
    toolbarItems(items: ToolbarItemConfig[]): ComponentInstance
    // Modal presentation modifiers
    sheet(
      isPresented: Accessor<boolean> | Binding<boolean>,
      content: () => ComponentInstance,
      options?: SheetPresentationOptions
    ): ComponentInstance
    fullScreenCover(
      isPresented: Accessor<boolean> | Binding<boolean>,
      content: () => ComponentInstance,
      options?: FullScreenCoverOptions
    ): ComponentInstance
    popover(
      isPresented: Accessor<boolean> | Binding<boolean>,
      arrowEdge: PopoverArrowEdge,
      content: () => ComponentInstance,
      options?: PopoverPresentationOptions
    ): ComponentInstance
    searchable(
      text: Accessor<string> | Binding<string>,
      placement?: SearchablePlacement
    ): ComponentInstance
    searchSuggestions(
      suggestions: SearchSuggestionsInput
    ): ComponentInstance
    searchScopes(
      scope: SearchScopeState,
      scopes: SearchScopeOption[]
    ): ComponentInstance
    confirmationDialog(
      title: string,
      isPresented: Accessor<boolean> | Binding<boolean>,
      actions: ConfirmationDialogAction[]
    ): ComponentInstance
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

  proto.toolbarBackgroundVisibility = function(
    visibility: ToolbarBackgroundVisibility,
    target: ToolbarBackgroundVisibilityTarget = 'navigationBar'
  ) {
    return toolbarBackgroundVisibility(this, visibility, target)
  }

  proto.presentationDetents = function(detents: PresentationDetent[]) {
    return presentationDetents(this, detents)
  }

  proto.toolbar = function(items: ToolbarItemConfig[]) {
    return toolbar(this, items)
  }

  proto.toolbarItems = function(items: ToolbarItemConfig[]) {
    return toolbarItems(this, items)
  }

  proto.sheet = function(
    isPresented: Accessor<boolean> | Binding<boolean>,
    content: () => ComponentInstance,
    options?: SheetPresentationOptions
  ) {
    return sheet(this, isPresented, content, options)
  }

  proto.fullScreenCover = function(
    isPresented: Accessor<boolean> | Binding<boolean>,
    content: () => ComponentInstance,
    options?: FullScreenCoverOptions
  ) {
    return fullScreenCover(this, isPresented, content, options)
  }

  proto.popover = function(
    isPresented: Accessor<boolean> | Binding<boolean>,
    arrowEdge: PopoverArrowEdge,
    content: () => ComponentInstance,
    options?: PopoverPresentationOptions
  ) {
    return popover(this, isPresented, arrowEdge, content, options)
  }

  proto.searchable = function(
    text: Accessor<string> | Binding<string>,
    placement: SearchablePlacement = 'navigationBar'
  ) {
    return searchable(this, text, placement)
  }

  proto.searchSuggestions = function(suggestions: SearchSuggestionsInput) {
    return searchSuggestions(this, suggestions)
  }

  proto.searchScopes = function(
    scope: SearchScopeState,
    scopes: SearchScopeOption[]
  ) {
    return searchScopes(this, scope, scopes)
  }

  proto.confirmationDialog = function(
    title: string,
    isPresented: Accessor<boolean> | Binding<boolean>,
    actions: ConfirmationDialogAction[]
  ) {
    return confirmationDialog(this, title, isPresented, actions)
  }
}
