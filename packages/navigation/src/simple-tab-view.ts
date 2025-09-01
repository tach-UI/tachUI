/**
 * Simple TabView Implementation
 *
 * Implements SwiftUI's TabView component with simple selection binding
 * and .tabItem() modifier support, replacing the complex coordinator system.
 */

import type { ComponentInstance, Binding } from '@tachui/core'
import { createEffect, createSignal, isBinding } from '@tachui/core'
import { HStack, HTML, Text, VStack } from '@tachui/primitives'
import type { NavigationComponent } from './types'

/**
 * Tab item configuration for simple TabView
 */
export interface SimpleTabItem {
  readonly id: string
  readonly label: string
  readonly icon?: string
  readonly badge?: string | number
  readonly content: ComponentInstance
  readonly disabled?: boolean
}

/**
 * Simple TabView options
 */
export interface SimpleTabViewOptions {
  selection?: Binding<string>
  tabPlacement?: 'top' | 'bottom'
  backgroundColor?: string
  accentColor?: string
  onSelectionChange?: (selectedId: string) => void
}

/**
 * TabView component factory (SwiftUI-compatible)
 *
 * Creates a tab-based navigation interface with simple selection binding.
 * Matches SwiftUI's TabView(selection: Binding<TabID>) { ... } pattern.
 *
 * @param children - Array of components with .tabItem() modifiers
 * @param options - Configuration options
 * @returns A TabView component
 *
 * @example
 * ```typescript
 * const [selection, setSelection] = createSignal('home')
 *
 * SimpleTabView([
 *   HomeView().tabItem('home', 'Home', '🏠'),
 *   SearchView().tabItem('search', 'Search', '🔍'),
 *   ProfileView().tabItem('profile', 'Profile', '👤')
 * ], {
 *   selection: createBinding(() => selection(), setSelection),
 *   tabPlacement: 'bottom'
 * })
 * ```
 */
export function SimpleTabView(
  children: ComponentInstance[],
  options: SimpleTabViewOptions = {}
): NavigationComponent {
  // Extract tab items from children with .tabItem() modifiers
  const tabItems: SimpleTabItem[] = children.map((child, index) => {
    const tabData = (child as any)._tabItem
    if (tabData) {
      return {
        id: tabData.id,
        label: tabData.label,
        icon: tabData.icon,
        badge: tabData.badge,
        content: child,
        disabled: tabData.disabled,
      }
    }

    // Fallback for components without .tabItem() modifier
    return {
      id: `tab-${index}`,
      label: `Tab ${index + 1}`,
      content: child,
      disabled: false,
    }
  })

  // Tab selection state
  let initialSelection = tabItems[0]?.id || ''
  if (options?.selection) {
    if (isBinding(options.selection)) {
      initialSelection = options.selection.get() || initialSelection
    } else if (typeof options.selection === 'function') {
      initialSelection = options.selection() || initialSelection
    }
  }
  const [selectedTabId, setSelectedTabId] = createSignal(initialSelection)

  // Handle selection changes
  const handleTabSelection = (tabId: string) => {
    const tab = tabItems.find(t => t.id === tabId)
    if (tab && !tab.disabled) {
      setSelectedTabId(tabId)

      // Update external binding
      if (options.selection && isBinding(options.selection)) {
        options.selection.set(tabId)
      }

      // Call external handler
      if (options.onSelectionChange) {
        options.onSelectionChange(tabId)
      }
    }
  }

  // Handle external selection binding changes
  if (options.selection && isBinding(options.selection)) {
    createEffect(() => {
      const externalSelection = options.selection!.get()
      if (externalSelection && externalSelection !== selectedTabId()) {
        handleTabSelection(externalSelection)
      }
    })
  }

  // Tab bar component
  const TabBar = () => {
    const _placement = options.tabPlacement || 'bottom'
    const backgroundColor = options.backgroundColor || '#f8f9fa'
    const accentColor = options.accentColor || '#007AFF'

    const tabButtons = tabItems.map(tab => {
      const isSelected = selectedTabId() === tab.id
      const isDisabled = tab.disabled || false

      // Tab button content
      const buttonContent = VStack({
        children: [
          // Icon (if provided)
          ...(tab.icon
            ? [
                HTML.div({
                  children: tab.icon,
                })
                  .modifier.fontSize(20)
                  .lineHeight('1')
                  .build(),
              ]
            : []),

          // Label
          Text(tab.label)
            .modifier.fontSize(12)
            .fontWeight(isSelected ? '600' : '400')
            .foregroundColor(isSelected ? accentColor : '#666666')
            .textAlign('center')
            .build(),

          // Badge (if provided)
          ...(tab.badge
            ? [
                HTML.div({
                  children: String(tab.badge),
                })
                  .modifier.backgroundColor('#ff3b30')
                  .foregroundColor('#ffffff')
                  .fontSize(10)
                  .fontWeight('bold')
                  .padding({ top: 2, bottom: 2, left: 6, right: 6 })
                  .cornerRadius(10)
                  .textAlign('center')
                  .build(),
              ]
            : []),
        ],
        spacing: 4,
        alignment: 'center',
      }).modifier.build()

      // Tab button
      const button = HTML.div({
        children: [buttonContent],
      })
        .modifier.padding({ top: 8, bottom: 8, left: 4, right: 4 })
        .backgroundColor(isSelected ? '#ffffff' : 'transparent')
        .cornerRadius(8)
        .cursor(isDisabled ? 'not-allowed' : 'pointer')
        .opacity(isDisabled ? 0.5 : 1)
        .build()

      // Add click handler
      ;(button as any).onClick = () => !isDisabled && handleTabSelection(tab.id)

      return button
    })

    return HStack({
      children: tabButtons,
      spacing: 0,
      alignment: 'center',
    })
      .modifier.backgroundColor(backgroundColor)
      .padding({ top: 8, bottom: 8, left: 8, right: 8 })
      .border(1, '#e0e0e0')
      .build()
  }

  // Tab content component
  const TabContent = () => {
    const selectedTab = tabItems.find(tab => tab.id === selectedTabId())

    if (!selectedTab) {
      return HTML.div({
        children: [Text('No content').modifier.build()],
      }).modifier.build()
    }

    return HTML.div({
      children: [selectedTab.content],
    }).modifier.build()
  }

  // Main tab view component
  const placement = options.tabPlacement || 'bottom'
  const tabViewComponent: NavigationComponent = VStack({
    children:
      placement === 'bottom'
        ? [TabContent(), TabBar()]
        : [TabBar(), TabContent()],
    spacing: 0,
    alignment: 'leading',
  })
    .modifier.frame({ minHeight: '100vh' })
    .backgroundColor('#ffffff')
    .build() as NavigationComponent

  // Add accessibility and interaction props that tests expect
  ;(tabViewComponent as any).props = {
    ...(tabViewComponent as any).props,
    role: 'tablist',
    'aria-live': 'polite',
    'aria-label': 'Tab navigation',
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const currentIndex = tabItems.findIndex(
          tab => tab.id === selectedTabId()
        )
        const nextIndex =
          e.key === 'ArrowLeft'
            ? Math.max(0, currentIndex - 1)
            : Math.min(tabItems.length - 1, currentIndex + 1)

        if (nextIndex !== currentIndex) {
          setSelectedTabId(tabItems[nextIndex].id)
          if (options.onSelectionChange) {
            options.onSelectionChange(tabItems[nextIndex].id)
          }
        }
      }
    },
  }

  // Add tab view metadata
  ;(tabViewComponent as any)._simpleTabView = {
    type: 'SimpleTabView',
    selectedTabId: selectedTabId,
    tabs: tabItems,
    selectTab: handleTabSelection,
  }

  return tabViewComponent
}

/**
 * .tabItem() modifier for SwiftUI-style tab configuration
 *
 * @param component - The component to add the tab item modifier to
 * @param id - Tab identifier
 * @param label - Tab label text
 * @param icon - Optional tab icon
 * @param badge - Optional tab badge
 * @param disabled - Whether the tab is disabled
 * @returns The component with tab item metadata
 *
 * @example
 * ```typescript
 * HomeView().tabItem('home', 'Home', '🏠')
 * SearchView().tabItem('search', 'Search', '🔍', '3')
 * ```
 */
export function tabItem(
  component: ComponentInstance,
  id: string,
  label: string,
  icon?: string,
  badge?: string | number,
  disabled?: boolean
): ComponentInstance {
  // Store tab item configuration on the component
  ;(component as any)._tabItem = {
    id,
    label,
    icon,
    badge,
    disabled: disabled || false,
  }

  return component
}

/**
 * Add .tabItem() method to ComponentInstance prototype
 * This allows for fluent API: Component().tabItem(...)
 */
declare module '@tachui/core' {
  interface ComponentInstance {
    tabItem(
      id: string,
      label: string,
      icon?: string,
      badge?: string | number,
      disabled?: boolean
    ): ComponentInstance
  }
}

// Extend ComponentInstance prototype (if possible)
if (typeof window !== 'undefined' && (window as any).ComponentInstance) {
  ;(window as any).ComponentInstance.prototype.tabItem = function (
    id: string,
    label: string,
    icon?: string,
    badge?: string | number,
    disabled?: boolean
  ) {
    return tabItem(this, id, label, icon, badge, disabled)
  }
}

/**
 * Create a tab view with simple configuration
 *
 * @param tabs - Array of simple tab configurations
 * @param options - Tab view options
 * @returns A SimpleTabView component
 */
export function createSimpleTabView(
  tabs: Array<{
    id: string
    label: string
    icon?: string
    badge?: string | number
    content: ComponentInstance
    disabled?: boolean
  }>,
  options: SimpleTabViewOptions = {}
): NavigationComponent {
  const children = tabs.map(tab =>
    tabItem(tab.content, tab.id, tab.label, tab.icon, tab.badge, tab.disabled)
  )

  return SimpleTabView(children, options)
}

/**
 * Check if a component is a SimpleTabView
 */
export function isSimpleTabView(component: any): boolean {
  return (
    component && typeof component === 'object' && '_simpleTabView' in component
  )
}

/**
 * Get SimpleTabView metadata
 */
export function getSimpleTabViewMetadata(component: any): any {
  if (isSimpleTabView(component)) {
    return component._simpleTabView
  }
  return null
}
