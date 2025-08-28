/**
 * Advanced TabView Features
 *
 * Implements SwiftUI's advanced TabView features including customization,
 * reordering, nested navigation, and different view styles.
 */

import type { ComponentInstance } from '@tachui/core'
import { createSignal, createEffect, HTML } from '@tachui/core'
import { SimpleTabView, type SimpleTabItem, type SimpleTabViewOptions } from './simple-tab-view'
import { useNavigationEnvironmentContext } from './navigation-environment'
import type { NavigationDestination } from './types'

/**
 * Tab view style options
 */
export type TabViewStyle = 'automatic' | 'page' | 'grouped' | 'sidebar'

/**
 * Tab bar appearance configuration
 */
export interface TabBarAppearance {
  backgroundColor?: string
  foregroundColor?: string
  selectedColor?: string
  unselectedColor?: string
  indicatorColor?: string
  shadowColor?: string
  borderColor?: string
  itemSpacing?: number
  padding?: {
    top?: number
    bottom?: number
    leading?: number
    trailing?: number
  }
}

/**
 * Advanced tab item with reordering and customization
 */
export interface AdvancedTabItem extends Omit<SimpleTabItem, 'content'> {
  content: ComponentInstance | (() => ComponentInstance)
  badge?: string | number
  badgeColor?: string
  isReorderable?: boolean
  isClosable?: boolean
  contextMenu?: ComponentInstance[]
  accessibilityLabel?: string
  accessibilityHint?: string
}

/**
 * Advanced TabView options
 */
export interface AdvancedTabViewOptions extends Omit<SimpleTabViewOptions, 'tabPlacement'> {
  style?: TabViewStyle
  appearance?: TabBarAppearance
  allowsReordering?: boolean
  allowsClosing?: boolean
  maxVisibleTabs?: number
  overflowBehavior?: 'scroll' | 'dropdown' | 'stack'
  animationDuration?: number
  tabPlacement?: 'top' | 'bottom' | 'leading' | 'trailing'
  isScrollEnabled?: boolean
  indexDisplayMode?: 'automatic' | 'always' | 'never'
  backgroundStyle?: 'automatic' | 'prominent' | 'regular'
  onTabSelect?: (tabId: string) => void
  onTabReorder?: (event: TabReorderEvent) => void
  onTabClose?: (event: TabCloseEvent) => void
}

/**
 * Tab reordering event
 */
export interface TabReorderEvent {
  fromIndex: number
  toIndex: number
  tab: AdvancedTabItem
}

/**
 * Tab closing event
 */
export interface TabCloseEvent {
  index: number
  tab: AdvancedTabItem
  canClose: boolean
}

/**
 * Advanced TabView implementation
 */
export function AdvancedTabView(
  tabs: AdvancedTabItem[],
  options: AdvancedTabViewOptions = {}
): ComponentInstance {
  const {
    style = 'automatic',
    appearance = {},
    allowsReordering = false,
    allowsClosing = false,
    maxVisibleTabs = 8,
    overflowBehavior = 'scroll',
    animationDuration = 300,
    tabPlacement = 'bottom',
    isScrollEnabled = true,
    indexDisplayMode = 'automatic',
    backgroundStyle = 'automatic',
    onTabSelect,
    onTabReorder,
    onTabClose,
    ...simpleOptions
  } = options

  // Tab state management
  const [tabItems, setTabItems] = createSignal(tabs)
  const [visibleTabs, setVisibleTabs] = createSignal<AdvancedTabItem[]>([])
  const [overflowTabs, setOverflowTabs] = createSignal<AdvancedTabItem[]>([])
  const [_draggedTab, _setDraggedTab] = createSignal<AdvancedTabItem | null>(null)
  const [_dragOverIndex, _setDragOverIndex] = createSignal<number>(-1)

  // Update visible/overflow tabs when tabs change
  createEffect(() => {
    const currentTabs = tabItems()
    if (currentTabs.length <= maxVisibleTabs) {
      setVisibleTabs(currentTabs)
      setOverflowTabs([])
    } else {
      setVisibleTabs(currentTabs.slice(0, maxVisibleTabs - 1))
      setOverflowTabs(currentTabs.slice(maxVisibleTabs - 1))
    }
  })

  // Create components with tabItem modifiers for SimpleTabView
  const tabComponents = tabItems().map(tab => {
    const component = typeof tab.content === 'function' ? tab.content() : tab.content
    ;(component as any)._tabItem = {
      id: tab.id,
      label: tab.label,
      icon: tab.icon,
      badge: tab.badge,
      disabled: tab.disabled
    }
    return component
  })

  const baseTabView = SimpleTabView(tabComponents, {
    ...simpleOptions,
    onSelectionChange: (tabId: string) => {
      const tab = tabItems().find(t => t.id === tabId)
      if (tab) {
        onTabSelect?.(tabId)
      }
    }
  })

  // Enhance with advanced features
  const advancedTabView = enhanceTabViewWithAdvancedFeatures(
    baseTabView,
    {
      style,
      appearance,
      allowsReordering,
      allowsClosing,
      maxVisibleTabs,
      overflowBehavior,
      animationDuration,
      tabPlacement,
      isScrollEnabled,
      indexDisplayMode,
      backgroundStyle,
      tabItems: tabItems(),
      visibleTabs: visibleTabs(),
      overflowTabs: overflowTabs(),
      onTabReorder: (event: TabReorderEvent) => {
        handleTabReorder(event)
        onTabReorder?.(event)
      },
      onTabClose: (event: TabCloseEvent) => {
        if (event.canClose) {
          handleTabClose(event)
        }
        onTabClose?.(event)
      }
    }
  )

  // Tab reordering handler
  function handleTabReorder(event: TabReorderEvent): void {
    const currentTabs = [...tabItems()]
    const [movedTab] = currentTabs.splice(event.fromIndex, 1)
    currentTabs.splice(event.toIndex, 0, movedTab)
    setTabItems(currentTabs)
  }

  // Tab closing handler
  function handleTabClose(event: TabCloseEvent): void {
    const currentTabs = tabItems().filter((_, index) => index !== event.index)
    setTabItems(currentTabs)
  }

  // Store advanced metadata
  ;(advancedTabView as any)._advancedTabView = {
    type: 'AdvancedTabView',
    style,
    appearance,
    tabItems: tabItems(),
    addTab: (tab: AdvancedTabItem) => {
      setTabItems([...tabItems(), tab])
    },
    removeTab: (tabId: string) => {
      setTabItems(tabItems().filter(tab => tab.id !== tabId))
    },
    reorderTabs: (fromIndex: number, toIndex: number) => {
      handleTabReorder({
        fromIndex,
        toIndex,
        tab: tabItems()[fromIndex]
      })
    },
    updateAppearance: (newAppearance: TabBarAppearance) => {
      // Update appearance dynamically
      Object.assign(appearance, newAppearance)
      applyTabBarAppearance(advancedTabView, appearance)
    }
  }

  return advancedTabView
}

/**
 * Enhance TabView with advanced features
 */
function enhanceTabViewWithAdvancedFeatures(
  baseTabView: ComponentInstance,
  config: any
): ComponentInstance {
  // Apply tab view style
  applyTabViewStyle(baseTabView, config.style)
  
  // Apply appearance customization
  applyTabBarAppearance(baseTabView, config.appearance)
  
  // Add reordering capabilities
  if (config.allowsReordering) {
    addReorderingCapability(baseTabView, config)
  }
  
  // Add closing capabilities
  if (config.allowsClosing) {
    addClosingCapability(baseTabView, config)
  }
  
  // Handle overflow tabs
  if (config.overflowTabs.length > 0) {
    addOverflowHandling(baseTabView, config)
  }
  
  // Add scrolling if enabled
  if (config.isScrollEnabled) {
    addScrollingCapability(baseTabView, config)
  }
  
  // Add nested navigation support
  addNestedNavigationSupport(baseTabView, config)
  
  return baseTabView
}

/**
 * Apply tab view style
 */
function applyTabViewStyle(tabView: ComponentInstance, style: TabViewStyle): void {
  const styleClasses = {
    automatic: 'tachui-tabview-automatic',
    page: 'tachui-tabview-page',
    grouped: 'tachui-tabview-grouped',
    sidebar: 'tachui-tabview-sidebar'
  }
  
  const className = styleClasses[style]
  if (className) {
    ;(tabView as any).className = `${(tabView as any).className || ''} ${className}`.trim()
  }
}

/**
 * Apply tab bar appearance
 */
function applyTabBarAppearance(tabView: ComponentInstance, appearance: TabBarAppearance): void {
  const styles: Record<string, string> = {}
  
  if (appearance.backgroundColor) {
    styles['--tab-bar-background-color'] = appearance.backgroundColor
  }
  
  if (appearance.foregroundColor) {
    styles['--tab-bar-foreground-color'] = appearance.foregroundColor
  }
  
  if (appearance.selectedColor) {
    styles['--tab-selected-color'] = appearance.selectedColor
  }
  
  if (appearance.unselectedColor) {
    styles['--tab-unselected-color'] = appearance.unselectedColor
  }
  
  if (appearance.indicatorColor) {
    styles['--tab-indicator-color'] = appearance.indicatorColor
  }
  
  if (appearance.itemSpacing) {
    styles['--tab-item-spacing'] = `${appearance.itemSpacing}px`
  }
  
  if (appearance.padding) {
    const { top, bottom, leading, trailing } = appearance.padding
    if (top !== undefined) styles['--tab-bar-padding-top'] = `${top}px`
    if (bottom !== undefined) styles['--tab-bar-padding-bottom'] = `${bottom}px`
    if (leading !== undefined) styles['--tab-bar-padding-leading'] = `${leading}px`
    if (trailing !== undefined) styles['--tab-bar-padding-trailing'] = `${trailing}px`
  }
  
  // Apply styles to component
  Object.assign((tabView as any).style || {}, styles)
}

/**
 * Add tab reordering capability
 */
function addReorderingCapability(tabView: ComponentInstance, config: any): void {
  // This would add drag and drop event handlers for reordering tabs
  ;(tabView as any)._reorderingEnabled = true
  
  // Add drag event handlers
  ;(tabView as any).onDragStart = (event: DragEvent, tabIndex: number) => {
    event.dataTransfer?.setData('text/plain', tabIndex.toString())
    config.setDraggedTab?.(config.tabItems[tabIndex])
  }
  
  ;(tabView as any).onDragOver = (event: DragEvent, tabIndex: number) => {
    event.preventDefault()
    config.setDragOverIndex?.(tabIndex)
  }
  
  ;(tabView as any).onDrop = (event: DragEvent, toIndex: number) => {
    event.preventDefault()
    const fromIndex = parseInt(event.dataTransfer?.getData('text/plain') || '-1')
    
    if (fromIndex >= 0 && fromIndex !== toIndex) {
      config.onTabReorder?.({
        fromIndex,
        toIndex,
        tab: config.tabItems[fromIndex]
      })
    }
    
    config.setDraggedTab?.(null)
    config.setDragOverIndex?.(-1)
  }
}

/**
 * Add tab closing capability
 */
function addClosingCapability(tabView: ComponentInstance, config: any): void {
  ;(tabView as any)._closingEnabled = true
  
  // Add close button handlers
  ;(tabView as any).onTabClose = (tabIndex: number) => {
    const tab = config.tabItems[tabIndex]
    const canClose = tab.isClosable !== false
    
    config.onTabClose?.({
      index: tabIndex,
      tab,
      canClose
    })
  }
}

/**
 * Add overflow handling
 */
function addOverflowHandling(tabView: ComponentInstance, config: any): void {
  switch (config.overflowBehavior) {
    case 'scroll':
      addHorizontalScrolling(tabView, config)
      break
    case 'dropdown':
      addOverflowDropdown(tabView, config)
      break
    case 'stack':
      addOverflowStacking(tabView, config)
      break
  }
}

/**
 * Add horizontal scrolling for overflow
 */
function addHorizontalScrolling(tabView: ComponentInstance, _config: any): void {
  ;(tabView as any)._scrollingEnabled = true
  ;(tabView as any).style = {
    ...(tabView as any).style,
    overflowX: 'auto',
    overflowY: 'hidden',
    whiteSpace: 'nowrap'
  }
}

/**
 * Add overflow dropdown
 */
function addOverflowDropdown(tabView: ComponentInstance, _config: any): void {
  // Create overflow menu button
  const overflowButton = HTML.button({
    children: '•••',
    onClick: () => {
      // Show dropdown with overflow tabs
      showOverflowDropdown(_config.overflowTabs)
    }
  }).modifier.build()
  
  ;(tabView as any)._overflowButton = overflowButton
}

/**
 * Add overflow stacking
 */
function addOverflowStacking(tabView: ComponentInstance, _config: any): void {
  // Stack overflow tabs with reduced opacity
  ;(tabView as any)._stackingEnabled = true
}

/**
 * Show overflow dropdown
 */
function showOverflowDropdown(overflowTabs: AdvancedTabItem[]): void {
  // Implementation would show a dropdown menu with overflow tabs
  console.log('Showing overflow dropdown with tabs:', overflowTabs)
}

/**
 * Add scrolling capability
 */
function addScrollingCapability(tabView: ComponentInstance, config: any): void {
  if (config.tabPlacement === 'top' || config.tabPlacement === 'bottom') {
    // Horizontal scrolling for top/bottom tabs
    ;(tabView as any).style = {
      ...(tabView as any).style,
      overflowX: 'auto',
      scrollBehavior: 'smooth'
    }
  } else {
    // Vertical scrolling for leading/trailing tabs
    ;(tabView as any).style = {
      ...(tabView as any).style,
      overflowY: 'auto',
      scrollBehavior: 'smooth'
    }
  }
}

/**
 * Add nested navigation support
 */
function addNestedNavigationSupport(tabView: ComponentInstance, config: any): void {
  // Each tab can have its own navigation context
  const navigationContext = useNavigationEnvironmentContext()
  
  ;(tabView as any)._nestedNavigation = {
    enabled: true,
    parentContext: navigationContext,
    tabContexts: new Map()
  }
  
  // Create navigation context for each tab
  config.tabItems.forEach((tab: AdvancedTabItem) => {
    if (typeof tab.content === 'function') {
      // Create isolated navigation context for this tab
      const tabContext = createTabNavigationContext(tab.id, navigationContext)
      ;(tabView as any)._nestedNavigation.tabContexts.set(tab.id, tabContext)
    }
  })
}

/**
 * Create navigation context for a tab
 */
function createTabNavigationContext(tabId: string, parentContext: any): any {
  // This would create an isolated navigation context for the tab
  return {
    tabId,
    parent: parentContext,
    stack: [],
    currentPath: `/tab/${tabId}`,
    push: (destination: NavigationDestination, path?: string, title?: string) => {
      // Handle navigation within this tab
      console.log(`Navigation in tab ${tabId}:`, { destination, path, title })
    },
    pop: () => {
      // Handle back navigation within this tab
      console.log(`Back navigation in tab ${tabId}`)
    }
  }
}

/**
 * PageTabView - SwiftUI-style page tab view
 */
export function PageTabView(
  pages: ComponentInstance[],
  options: {
    selection?: () => number
    onSelectionChange?: (index: number) => void
    indexDisplayMode?: 'automatic' | 'always' | 'never'
    backgroundStyle?: 'automatic' | 'prominent' | 'regular'
  } = {}
): ComponentInstance {
  const {
    selection,
    onSelectionChange,
    indexDisplayMode = 'automatic',
    backgroundStyle = 'automatic'
  } = options
  
  const [currentIndex, setCurrentIndex] = createSignal(selection?.() || 0)
  
  createEffect(() => {
    if (selection) {
      setCurrentIndex(selection())
    }
  })
  
  const pageTabView = HTML.div({
    children: [
      // Page content
      HTML.div({
        children: pages.map((page, index) => {
          const pageDiv = HTML.div({
            children: page
          }).modifier.build()
          
          // Apply inline styles
          ;(pageDiv as any).style = {
            display: index === currentIndex() ? 'block' : 'none'
          }
          
          return pageDiv
        })
      }).modifier.build(),
      
      // Page indicators (if enabled)
      indexDisplayMode !== 'never' ? HTML.div({
        children: pages.map((_, index) => 
          HTML.button({
            children: `${index + 1}`,
            onClick: () => {
              setCurrentIndex(index)
              onSelectionChange?.(index)
            }
          }).modifier.build()
        )
      }).modifier.build() : null
    ].filter(Boolean)
  }).modifier.build()
  
  // Store metadata
  ;(pageTabView as any)._pageTabView = {
    type: 'PageTabView',
    currentIndex: currentIndex(),
    pageCount: pages.length,
    indexDisplayMode,
    backgroundStyle,
    goToPage: (index: number) => {
      if (index >= 0 && index < pages.length) {
        setCurrentIndex(index)
        onSelectionChange?.(index)
      }
    },
    nextPage: () => {
      const next = (currentIndex() + 1) % pages.length
      setCurrentIndex(next)
      onSelectionChange?.(next)
    },
    previousPage: () => {
      const prev = (currentIndex() - 1 + pages.length) % pages.length
      setCurrentIndex(prev)
      onSelectionChange?.(prev)
    }
  }
  
  return pageTabView
}

/**
 * GroupedTabView - SwiftUI-style grouped tab view
 */
export function GroupedTabView(
  sections: Array<{
    title?: string
    tabs: AdvancedTabItem[]
  }>,
  options: AdvancedTabViewOptions = {}
): ComponentInstance {
  const groupedTabView = HTML.div({
    children: sections.map((section, _sectionIndex) => 
      HTML.div({
        children: [
          section.title ? HTML.div({
            children: section.title
          }).modifier.build() : null,
          AdvancedTabView(section.tabs, {
            ...options,
            style: 'grouped'
          })
        ].filter(Boolean)
      }).modifier.build()
    )
  }).modifier.build()
  
  ;(groupedTabView as any)._groupedTabView = {
    type: 'GroupedTabView',
    sections,
    options
  }
  
  return groupedTabView
}

/**
 * Advanced TabView utilities
 */
export const AdvancedTabViewUtils = {
  /**
   * Check if a component is an AdvancedTabView
   */
  isAdvancedTabView(component: ComponentInstance): boolean {
    return !!(component as any)._advancedTabView
  },

  /**
   * Get AdvancedTabView metadata
   */
  getAdvancedTabViewMetadata(component: ComponentInstance): any {
    return (component as any)._advancedTabView
  },

  /**
   * Create tab bar appearance preset
   */
  createAppearancePreset(preset: 'default' | 'prominent' | 'minimal'): TabBarAppearance {
    switch (preset) {
      case 'prominent':
        return {
          backgroundColor: '#007AFF',
          selectedColor: '#FFFFFF',
          unselectedColor: 'rgba(255, 255, 255, 0.7)',
          indicatorColor: '#FFFFFF',
          padding: { top: 12, bottom: 12, leading: 16, trailing: 16 }
        }
      case 'minimal':
        return {
          backgroundColor: 'transparent',
          selectedColor: '#007AFF',
          unselectedColor: '#8E8E93',
          indicatorColor: '#007AFF',
          padding: { top: 8, bottom: 8, leading: 8, trailing: 8 }
        }
      default:
        return {
          backgroundColor: '#F8F9FA',
          selectedColor: '#007AFF',
          unselectedColor: '#8E8E93',
          indicatorColor: '#007AFF',
          padding: { top: 10, bottom: 10, leading: 12, trailing: 12 }
        }
    }
  }
}

// Types are exported through the interfaces above