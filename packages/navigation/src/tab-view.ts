/**
 * TabView Component Implementation
 *
 * Implements SwiftUI's TabView component that provides tab-based navigation
 * with customizable tab bars, selection binding, and tab item management.
 */

import type { ComponentInstance } from '@tachui/core'
import {
  Button,
  createEffect,
  createSignal,
  getSignalImpl,
  HStack,
  HTML,
  isBinding,
  isSignal,
  Text,
  VStack,
} from '@tachui/core'
import { useNavigationEnvironmentContext } from './navigation-environment'
import type {
  NavigationComponent,
  TabCoordinator,
  TabItem,
  TabViewOptions,
} from './types'

/**
 * Internal tab coordinator implementation
 */
class TabCoordinatorImpl implements TabCoordinator {
  private _tabs: TabItem[] = []
  private _activeTabId: string = ''

  constructor(private onTabChange?: (activeTabId: string) => void) {}

  get activeTabId(): string {
    return this._activeTabId
  }

  get tabs(): TabItem[] {
    return [...this._tabs]
  }

  addTab(tab: TabItem): void {
    // Allow duplicate IDs but warn (test expects both present)
    if (this._tabs.some(t => t.id === tab.id)) {
      console.warn(`Tab with ID "${tab.id}" already exists`)
    }

    this._tabs.push(tab)

    // Set as active if it's the first tab
    if (this._tabs.length === 1) {
      this._activeTabId = tab.id
    }
  }

  removeTab(tabId: string): void {
    const index = this._tabs.findIndex(t => t.id === tabId)
    if (index >= 0) {
      this._tabs.splice(index, 1)

      // If removed tab was active, select another tab
      if (this._activeTabId === tabId) {
        if (this._tabs.length > 0) {
          // Select the tab at the same index, or the last one
          const newIndex = Math.min(index, this._tabs.length - 1)
          this.selectTab(this._tabs[newIndex].id)
        } else {
          this._activeTabId = ''
        }
      }
    }
  }

  selectTab(tabId: string): void {
    const tab = this._tabs.find(t => t.id === tabId)
    if (tab && !tab.disabled) {
      this._activeTabId = tabId

      if (this.onTabChange) {
        this.onTabChange(tabId)
      }
    }
  }

  updateTabBadge(tabId: string, badge?: string | number): void {
    const tab = this._tabs.find(t => t.id === tabId) as
      | { badge?: string | number }
      | undefined
    if (tab) {
      tab.badge = badge
    }
  }

  /**
   * Get the currently active tab
   */
  getActiveTab(): TabItem | undefined {
    return this._tabs.find(t => t.id === this._activeTabId)
  }

  /**
   * Get tab by ID
   */
  getTab(tabId: string): TabItem | undefined {
    return this._tabs.find(t => t.id === tabId)
  }
}

/**
 * TabView component factory
 *
 * Creates a tab-based navigation interface with customizable tab items,
 * selection binding, and tab placement options.
 *
 * @param tabs - Array of tab items to display
 * @param options - Configuration options for the tab view
 * @returns A TabView component
 *
 * @example
 * ```typescript
 * const [selectedTab, setSelectedTab] = createSignal('home')
 *
 * const tabView = TabView([
 *   {
 *     id: 'home',
 *     title: 'Home',
 *     icon: '🏠',
 *     content: HomeView()
 *   },
 *   {
 *     id: 'search',
 *     title: 'Search',
 *     icon: '🔍',
 *     content: SearchView(),
 *     badge: '3'
 *   },
 *   {
 *     id: 'profile',
 *     title: 'Profile',
 *     icon: '👤',
 *     content: ProfileView()
 *   }
 * ], {
 *   selection: selectedTab,
 *   tabPlacement: 'bottom',
 *   accentColor: '#007AFF'
 * })
 * ```
 */
export function TabView(
  tabs: TabItem[],
  options: TabViewOptions = {}
): NavigationComponent {
  // Create tab state
  const [activeTabId, setActiveTabId] = createSignal(tabs[0]?.id || '')
  const tabCoordinator = new TabCoordinatorImpl(newTabId => {
    setActiveTabId(newTabId)

    // Update external selection binding
    if (options.selection) {
      if (isBinding(options.selection)) {
        options.selection.set(newTabId)
      } else if (isSignal(options.selection)) {
        getSignalImpl(
          options.selection as (() => string) & { peek: () => string }
        )?.set(newTabId)
      }
    }

    // Call external handler
    if (options.onSelectionChange) {
      options.onSelectionChange(newTabId)
    }
  })

  // Initialize tabs
  tabs.forEach(tab => tabCoordinator.addTab(tab))

  // Handle external selection binding
  if (options.selection) {
    if (isBinding(options.selection)) {
      createEffect(() => {
        const externalSelection = options.selection!.get()
        if (externalSelection && externalSelection !== activeTabId()) {
          tabCoordinator.selectTab(externalSelection)
        }
      })
    } else if (isSignal(options.selection)) {
      createEffect(() => {
        const externalSelection =
          typeof options.selection === 'function'
            ? (options.selection as () => string)()
            : (options.selection as { get?: () => string })?.get?.()
        if (externalSelection && externalSelection !== activeTabId()) {
          tabCoordinator.selectTab(externalSelection)
        }
      })
    }
  }

  // Tab bar component
  const TabBar = () => {
    // const placement = options.tabPlacement || 'bottom'
    const backgroundColor = options.backgroundColor || '#f8f9fa'
    const accentColor = options.accentColor || '#007AFF'

    const tabButtons = tabs.map(tab => {
      const isDisabled = tab.disabled || false

      return Button(
        '', // We'll use custom content
        () => {
          if (!isDisabled) {
            tabCoordinator.selectTab(tab.id)
          }
        }
      )
        .modifier.backgroundColor('transparent')
        .border(0)
        .padding({ top: 8, bottom: 8, left: 12, right: 12 })
        .opacity(isDisabled ? 0.5 : 1)
        .disabled(isDisabled)
        .build()
    })

    // Override button content with custom tab items
    tabButtons.forEach((button, index) => {
      const tab = tabs[index]
      const isActive = activeTabId() === tab.id

      const tabContent = VStack({
        children: [
          // Icon
          ...(tab.icon
            ? [
                HTML.div({
                  children: tab.icon,
                })
                  .modifier.fontSize(20)
                  .foregroundColor(isActive ? accentColor : '#666666')
                  .build(),
              ]
            : []),

          // Title with badge
          HStack({
            children: [
              Text(tab.title)
                .modifier.fontSize(12)
                .fontWeight(isActive ? '600' : '400')
                .foregroundColor(isActive ? accentColor : '#666666')
                .build(),

              // Badge
              ...(tab.badge
                ? [
                    HTML.div({
                      children: String(tab.badge),
                    })
                      .modifier.backgroundColor('#FF3B30')
                      .foregroundColor('#ffffff')
                      .fontSize(10)
                      .fontWeight('bold')
                      .padding({ top: 2, bottom: 2, left: 6, right: 6 })
                      .cornerRadius(8)
                      .frame({ width: 16, height: 16 })
                      .build(),
                  ]
                : []),
            ],
            spacing: 4,
            alignment: 'center',
          }),
        ],
        spacing: 4,
        alignment: 'center',
      })
        .modifier.padding(4)
        .build()

      // Replace button content
      ;(button as any).children = [tabContent]
    })

    return HStack({
      children: tabButtons,
      spacing: 0,
      alignment: 'center',
    })
      .modifier.backgroundColor(backgroundColor)
      .border(1, '#e0e0e0')
      .frame({ height: 60 })
      .build()
  }

  // Content area
  const TabContent = () => {
    const activeTab = tabCoordinator.getActiveTab()

    if (!activeTab) {
      return Text('No tab selected')
        .modifier.padding(20)
        .foregroundColor('#999')
        .build()
    }

    return HTML.div({
      children: [activeTab.content],
    }).modifier.build()
  }

  // Main tab view component
  const tabViewComponent: NavigationComponent = VStack({
    children:
      options.tabPlacement === 'top'
        ? [TabBar(), TabContent()]
        : [TabContent(), TabBar()],
    spacing: 0,
    alignment: 'leading',
  })
    .modifier.frame({ minHeight: '100vh' })
    .backgroundColor('#ffffff')
    .build() as NavigationComponent

  // Add tab coordinator to component
  ;(tabViewComponent as any).tabCoordinator = tabCoordinator

  // Integrate with navigation environment (if available)
  const navContext = useNavigationEnvironmentContext()
  if (navContext) {
    ;(tabViewComponent as any).navigationContext = navContext
    ;(tabViewComponent as any)._integratedWithNavigation = true
  }

  return tabViewComponent
}

/**
 * Create a tab item configuration
 *
 * @param id - Unique identifier for the tab
 * @param title - Display title
 * @param content - Tab content component
 * @param options - Additional tab options
 * @returns A TabItem configuration
 */
export function createTabItem(
  id: string,
  title: string,
  content: ComponentInstance,
  options: {
    icon?: string
    badge?: string | number
    disabled?: boolean
  } = {}
): TabItem {
  return {
    id,
    title,
    content,
    icon: options.icon,
    badge: options.badge,
    disabled: options.disabled,
  }
}

/**
 * Create a tab view with icon tabs
 *
 * @param tabs - Array of tab configurations
 * @param options - Tab view options
 * @returns A TabView with icon-based tabs
 */
export function IconTabView(
  tabs: Array<{
    id: string
    title: string
    icon: string
    content: ComponentInstance
    badge?: string | number
    disabled?: boolean
  }>,
  options: TabViewOptions = {}
): NavigationComponent {
  const tabItems: TabItem[] = tabs.map(tab => ({
    id: tab.id,
    title: tab.title,
    icon: tab.icon,
    content: tab.content,
    badge: tab.badge,
    disabled: tab.disabled,
  }))

  return TabView(tabItems, options)
}

/**
 * Create a simple text-only tab view
 *
 * @param tabs - Array of tab configurations
 * @param options - Tab view options
 * @returns A TabView with text-only tabs
 */
export function TextTabView(
  tabs: Array<{
    id: string
    title: string
    content: ComponentInstance
    disabled?: boolean
  }>,
  options: TabViewOptions = {}
): NavigationComponent {
  const tabItems: TabItem[] = tabs.map(tab => ({
    id: tab.id,
    title: tab.title,
    content: tab.content,
    disabled: tab.disabled,
  }))

  return TabView(tabItems, options)
}

/**
 * Tab view builder for declarative API
 */
export const TabViewBuilder = {
  /**
   * Start building a tab view
   */
  create() {
    const tabs: TabItem[] = []

    return {
      /**
       * Add a tab to the view
       */
      tab(
        id: string,
        title: string,
        content: ComponentInstance,
        options: {
          icon?: string
          badge?: string | number
          disabled?: boolean
        } = {}
      ) {
        tabs.push(createTabItem(id, title, content, options))
        return this
      },

      /**
       * Build the tab view with options
       */
      build(options: TabViewOptions = {}) {
        return TabView(tabs, options)
      },
    }
  },

  /**
   * Create a tab view from tab configurations
   */
  fromTabs(tabs: TabItem[], options: TabViewOptions = {}) {
    return TabView(tabs, options)
  },
}

/**
 * Get tab coordinator from tab view component
 *
 * @param tabView - The tab view component
 * @returns The tab coordinator or undefined
 */
export function getTabCoordinator(tabView: any): TabCoordinator | undefined {
  return tabView?.tabCoordinator
}

/**
 * Use tab coordination in a component
 *
 * @returns Tab coordination functions
 */
export function useTabCoordination() {
  // This would be implemented by the component system to find the nearest TabView
  // For now, return placeholder functions
  return {
    selectTab: (tabId: string) => {
      console.log('Select tab:', tabId)
    },
    addTab: (tab: TabItem) => {
      console.log('Add tab:', tab)
    },
    removeTab: (tabId: string) => {
      console.log('Remove tab:', tabId)
    },
    updateBadge: (tabId: string, badge?: string | number) => {
      console.log('Update badge:', tabId, badge)
    },
    getActiveTab: () => null,
    getAllTabs: () => [],
  }
}

/**
 * Create a nested tab view (tabs within tabs)
 *
 * @param mainTabs - Main level tabs
 * @param options - Tab view options
 * @returns A nested TabView structure
 */
export function NestedTabView(
  mainTabs: Array<{
    id: string
    title: string
    icon?: string
    subTabs: TabItem[]
    tabViewOptions?: TabViewOptions
  }>,
  options: TabViewOptions = {}
): NavigationComponent {
  const mainTabItems: TabItem[] = mainTabs.map(mainTab => ({
    id: mainTab.id,
    title: mainTab.title,
    icon: mainTab.icon,
    content: TabView(mainTab.subTabs, mainTab.tabViewOptions || {}),
  }))

  return TabView(mainTabItems, options)
}

/**
 * Type guard for TabView components
 */
export function isTabView(component: any): boolean {
  return (
    component && typeof component === 'object' && 'tabCoordinator' in component
  )
}

/**
 * Create a dynamic tab view that can add/remove tabs at runtime
 *
 * @param initialTabs - Initial set of tabs
 * @param options - Tab view options
 * @returns A dynamic TabView with management methods
 */
export function DynamicTabView(
  initialTabs: TabItem[] = [],
  options: TabViewOptions = {}
) {
  const [tabList, setTabList] = createSignal<TabItem[]>(initialTabs)

  const tabView = (() => {
    return TabView(tabList(), options)
  })()

  return {
    component: tabView,
    addTab: (tab: TabItem) => {
      setTabList([...tabList(), tab])
    },
    removeTab: (tabId: string) => {
      setTabList(tabList().filter((t: TabItem) => t.id !== tabId))
    },
    updateTab: (tabId: string, updates: Partial<TabItem>) => {
      setTabList(
        tabList().map((tab: TabItem) =>
          tab.id === tabId ? { ...tab, ...updates } : tab
        )
      )
    },
    getTabs: () => tabList(),
    getTabCount: () => tabList().length,
  }
}
