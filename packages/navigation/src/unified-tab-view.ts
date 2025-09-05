/**
 * Unified TabView Component Implementation
 *
 * Combines advanced and enhanced TabView features into a single, comprehensive
 * SwiftUI-compatible TabView with modern 2024-2025 features and backwards compatibility.
 */

import type { ComponentInstance } from '@tachui/core'
import {
  createComputed,
  createEffect,
  createSignal,
  isBinding,
} from '@tachui/core'
import { Button, HStack, HTML, Text, VStack } from '@tachui/primitives'
import { type SimpleTabViewOptions } from './simple-tab-view'
import type { NavigationComponent, TabItem } from './types'

/**
 * Unified tab view style options
 */
export type UnifiedTabViewStyle =
  | 'automatic'
  | 'floating'
  | 'sidebar'
  | 'sidebar-adaptable'
  | 'page'
  | 'grouped'

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
 * Tab section for hierarchical organization
 */
export interface TabSection {
  id: string
  title: string
  icon?: string
  tabs: TabItem[]
  collapsed?: boolean
}

/**
 * Unified tab item with all features
 */
export interface UnifiedTabItem {
  readonly id: string
  readonly title: string
  readonly label: string
  readonly icon?: string
  readonly content: ComponentInstance | (() => ComponentInstance)
  readonly disabled?: boolean
  badge?: string | number
  badgeColor?: string
  isReorderable?: boolean
  isClosable?: boolean
  contextMenu?: ComponentInstance[]
  accessibilityLabel?: string
  accessibilityHint?: string
}

/**
 * Tab reordering event
 */
export interface TabReorderEvent {
  fromIndex: number
  toIndex: number
  tab: UnifiedTabItem
}

/**
 * Tab closing event
 */
export interface TabCloseEvent {
  index: number
  tab: UnifiedTabItem
  canClose: boolean
}

/**
 * Unified TabView options combining all features
 */
export interface UnifiedTabViewOptions
  extends Omit<SimpleTabViewOptions, 'tabPlacement'> {
  // Style options (unified)
  style?: UnifiedTabViewStyle
  customization?: 'none' | 'visible' | 'hidden'

  // Layout options
  breakpoint?: number // px width for sidebar adaptation
  maxFloatingTabs?: number // Max tabs before overflow
  maxVisibleTabs?: number // Max visible tabs
  tabPlacement?: 'top' | 'bottom' | 'leading' | 'trailing'

  // Visual options
  material?: 'none' | 'glass' | 'blur'
  prominence?: 'minimal' | 'standard' | 'increased'
  appearance?: TabBarAppearance
  animationDuration?: number

  // Behavior options
  allowReordering?: boolean
  allowsReordering?: boolean // Backwards compatibility alias
  allowHiding?: boolean
  allowsClosing?: boolean
  overflowBehavior?: 'scroll' | 'dropdown' | 'stack'
  isScrollEnabled?: boolean
  indexDisplayMode?: 'automatic' | 'always' | 'never'
  backgroundStyle?: 'automatic' | 'prominent' | 'regular'

  // Event handlers
  onTabSelect?: (tabId: string) => void
  onTabReorder?: (event: TabReorderEvent) => void
  onTabClose?: (event: TabCloseEvent) => void
  onCustomizationChange?: (visibleTabs: string[], hiddenTabs: string[]) => void
}

/**
 * Unified tab coordinator with all features
 */
class UnifiedTabCoordinatorImpl {
  private _tabs: UnifiedTabItem[] = []
  private _sections: TabSection[] = []
  private _activeTabId: string = ''
  private _hiddenTabIds: Set<string> = new Set()
  private _customTabOrder: string[] = []

  constructor(
    private onTabChange?: (activeTabId: string) => void,
    private onTabReorder?: (tabs: UnifiedTabItem[]) => void,
    private onCustomizationChange?: (
      visibleTabs: string[],
      hiddenTabs: string[]
    ) => void
  ) {}

  get activeTabId(): string {
    return this._activeTabId
  }

  get tabs(): TabItem[] {
    return [...this._tabs] as TabItem[]
  }

  get sections(): TabSection[] {
    return [...this._sections]
  }

  get visibleTabs(): UnifiedTabItem[] {
    const orderedTabs =
      this._customTabOrder.length > 0
        ? (this._customTabOrder
            .map(id => this._tabs.find(t => t.id === id))
            .filter(Boolean) as UnifiedTabItem[])
        : this._tabs

    return orderedTabs.filter(tab => !this._hiddenTabIds.has(tab.id))
  }

  get hiddenTabs(): UnifiedTabItem[] {
    return this._tabs.filter(tab => this._hiddenTabIds.has(tab.id))
  }

  addTab(tab: UnifiedTabItem): void {
    if (this._tabs.some(t => t.id === tab.id)) {
      console.warn(`Tab with ID "${tab.id}" already exists`)
      return
    }

    this._tabs.push(tab)

    if (this._tabs.length === 1) {
      this._activeTabId = tab.id
    }
  }

  removeTab(tabId: string): void {
    const index = this._tabs.findIndex(t => t.id === tabId)
    if (index >= 0) {
      this._tabs.splice(index, 1)
      this._hiddenTabIds.delete(tabId)
      this._customTabOrder = this._customTabOrder.filter(id => id !== tabId)

      if (this._activeTabId === tabId) {
        if (this._tabs.length > 0) {
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
    if (tab && !tab.disabled && !this._hiddenTabIds.has(tabId)) {
      this._activeTabId = tabId

      if (this.onTabChange) {
        this.onTabChange(tabId)
      }
    }
  }

  updateTabBadge(tabId: string, badge?: string | number): void {
    const tab = this._tabs.find(t => t.id === tabId)
    if (tab) {
      tab.badge = badge
    }
  }

  // Enhanced methods
  reorderTabs(newOrder: string[]): void {
    const validOrder = newOrder.filter(id => this._tabs.some(t => t.id === id))

    // Actually reorder the internal tabs array to match the new order
    const reorderedTabs: UnifiedTabItem[] = []

    // Add tabs in the specified order
    for (const id of validOrder) {
      const tab = this._tabs.find(t => t.id === id)
      if (tab) {
        reorderedTabs.push(tab)
      }
    }

    // Hide tabs that weren't specified in the reorder (they become hidden, not removed)
    for (const tab of this._tabs) {
      if (!validOrder.includes(tab.id)) {
        this._hiddenTabIds.add(tab.id)
        reorderedTabs.push(tab) // Keep them but mark as hidden
      }
    }

    this._tabs = reorderedTabs
    this._customTabOrder = validOrder

    if (this.onTabReorder) {
      this.onTabReorder(this.visibleTabs)
    }
  }

  hideTab(tabId: string): void {
    if (this._tabs.some(t => t.id === tabId)) {
      this._hiddenTabIds.add(tabId)

      if (this._activeTabId === tabId) {
        const visibleTabs = this.visibleTabs
        if (visibleTabs.length > 0) {
          this.selectTab(visibleTabs[0].id)
        }
      }

      this._notifyCustomizationChange()
    }
  }

  showTab(tabId: string): void {
    this._hiddenTabIds.delete(tabId)
    this._notifyCustomizationChange()
  }

  addSection(section: TabSection): void {
    this._sections.push(section)
    section.tabs.forEach(tab => {
      // Convert TabItem to UnifiedTabItem
      const unifiedTab: UnifiedTabItem = {
        ...tab,
        label: tab.title, // Map title to label
        content: tab.content,
      }
      this.addTab(unifiedTab)
    })
  }

  toggleSection(sectionId: string): void {
    const section = this._sections.find(s => s.id === sectionId)
    if (section) {
      section.collapsed = !section.collapsed
    }
  }

  private _notifyCustomizationChange(): void {
    if (this.onCustomizationChange) {
      const visibleIds = this.visibleTabs.map(t => t.id)
      const hiddenIds = this.hiddenTabs.map(t => t.id)
      this.onCustomizationChange(visibleIds, hiddenIds)
    }
  }

  getActiveTab(): UnifiedTabItem | undefined {
    return this._tabs.find(t => t.id === this._activeTabId)
  }

  getTab(tabId: string): UnifiedTabItem | undefined {
    return this._tabs.find(t => t.id === tabId)
  }
}

/**
 * Unified TabView with all features
 */
export function UnifiedTabView(
  tabs: UnifiedTabItem[],
  options: UnifiedTabViewOptions = {}
): NavigationComponent {
  // Normalize options (handle backwards compatibility)
  const normalizedOptions = {
    ...options,
    allowReordering:
      options.allowReordering || options.allowsReordering || false,
    maxVisibleTabs: options.maxVisibleTabs || options.maxFloatingTabs || 8,
  }

  const {
    style = 'automatic',
    customization = 'none',
    breakpoint = 768,
    maxVisibleTabs = 8,
    material = 'none',
    appearance = {},
    allowHiding = false,
    indexDisplayMode = 'automatic',
    onTabSelect,
    onTabReorder,
    onCustomizationChange,
    ..._simpleOptions
  } = normalizedOptions

  // Reactive state
  const [activeTabId, setActiveTabId] = createSignal(tabs[0]?.id || '')
  const [currentBreakpoint, setCurrentBreakpoint] = createSignal(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  )
  const [isCustomizing, setIsCustomizing] = createSignal(false)
  const [tabItems, setTabItems] = createSignal(tabs)
  const [_visibleTabs, _setVisibleTabs] = createSignal<UnifiedTabItem[]>([])
  const [overflowTabs, setOverflowTabs] = createSignal<UnifiedTabItem[]>([])

  // Create unified coordinator
  const tabCoordinator = new UnifiedTabCoordinatorImpl(
    newTabId => {
      setActiveTabId(newTabId)

      if (options.selection && isBinding(options.selection)) {
        options.selection.set(newTabId)
      }

      onTabSelect?.(newTabId)
      if (options.onSelectionChange) {
        options.onSelectionChange(newTabId)
      }
    },
    onTabReorder
      ? (tabs: UnifiedTabItem[]) => {
          // Convert to TabReorderEvent format for compatibility
          if (tabs.length > 0) {
            onTabReorder({
              fromIndex: 0,
              toIndex: tabs.length - 1,
              tab: tabs[0],
            })
          }
        }
      : undefined,
    onCustomizationChange
  )

  // Initialize tabs
  tabs.forEach(tab => tabCoordinator.addTab(tab))

  // Handle external selection binding
  if (options.selection && isBinding(options.selection)) {
    createEffect(() => {
      const externalSelection = options.selection!.get()
      if (externalSelection && externalSelection !== activeTabId()) {
        tabCoordinator.selectTab(externalSelection)
      }
    })
  }

  // Update visible/overflow tabs when tabs change
  createEffect(() => {
    const currentTabs = tabItems()
    if (currentTabs.length <= maxVisibleTabs) {
      _setVisibleTabs(currentTabs)
      setOverflowTabs([])
    } else {
      _setVisibleTabs(currentTabs.slice(0, maxVisibleTabs - 1))
      setOverflowTabs(currentTabs.slice(maxVisibleTabs - 1))
    }
  })

  // Responsive breakpoint handling
  if (typeof window !== 'undefined') {
    createEffect(() => {
      const handleResize = () => setCurrentBreakpoint(window.innerWidth)
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    })
  }

  // Determine current tab style
  const tabStyle = createComputed(() => {
    if (style === 'sidebar-adaptable') {
      return currentBreakpoint() >= breakpoint ? 'sidebar' : 'floating'
    }
    return style === 'automatic' ? 'floating' : style
  })

  // Enhanced Tab Bar Component
  const UnifiedTabBar = () => {
    const currentStyle = tabStyle()
    const visibleTabsArray = tabCoordinator.visibleTabs
    const showOverflow = visibleTabsArray.length > maxVisibleTabs

    const backgroundColor = getBackgroundColor()
    const accentColor =
      options.accentColor || appearance.selectedColor || '#007AFF'

    // Create tab buttons
    const tabButtons = visibleTabsArray.map(tab =>
      createTabButton(tab, currentStyle, accentColor)
    )

    // Add overflow/customization buttons
    if (showOverflow || customization === 'visible') {
      tabButtons.push(...createUtilityButtons())
    }

    return createTabContainer(tabButtons, currentStyle, backgroundColor)
  }

  // Helper functions
  function getBackgroundColor(): string {
    if (appearance.backgroundColor) return appearance.backgroundColor

    switch (material) {
      case 'glass':
        return 'rgba(255, 255, 255, 0.8)'
      case 'blur':
        return 'rgba(248, 249, 250, 0.95)'
      default:
        return '#f8f9fa'
    }
  }

  function createTabButton(
    tab: UnifiedTabItem,
    currentStyle: string,
    _accentColor: string
  ): ComponentInstance {
    const _isActive = activeTabId() === tab.id
    const isDisabled = tab.disabled || false

    const button = Button('', () => {
      if (!isDisabled) {
        tabCoordinator.selectTab(tab.id)
      }
    })

    // Apply unified styling
    return button.modifier
      .backgroundColor('transparent')
      .border(0)
      .padding(
        currentStyle === 'sidebar'
          ? { top: 12, bottom: 12, left: 16, right: 16 }
          : { top: 8, bottom: 8, left: 12, right: 12 }
      )
      .opacity(isDisabled ? 0.5 : 1)
      .disabled(isDisabled)
      .cornerRadius(currentStyle === 'floating' ? 12 : 0)
      .build()
  }

  function createUtilityButtons(): ComponentInstance[] {
    const buttons: ComponentInstance[] = []

    // Overflow button
    if (overflowTabs().length > 0) {
      buttons.push(
        Button('···', () => {
          setIsCustomizing(!isCustomizing())
        })
          .modifier.backgroundColor('transparent')
          .border(0)
          .padding({ top: 8, bottom: 8, left: 12, right: 12 })
          .build()
      )
    }

    // Customization button
    if (customization === 'visible') {
      buttons.push(
        Button('⚙️', () => {
          setIsCustomizing(!isCustomizing())
        })
          .modifier.backgroundColor('transparent')
          .border(0)
          .padding({ top: 8, bottom: 8, left: 12, right: 12 })
          .build()
      )
    }

    return buttons
  }

  function createTabContainer(
    tabButtons: ComponentInstance[],
    currentStyle: string,
    backgroundColor: string
  ): ComponentInstance {
    const containerStyles = getContainerStyles(currentStyle, backgroundColor)
    const StackComponent = currentStyle === 'sidebar' ? VStack : HStack

    return StackComponent({
      children: tabButtons,
      spacing: currentStyle === 'sidebar' ? 8 : 0,
      alignment: 'center',
    })
      .modifier.backgroundColor(containerStyles.backgroundColor)
      .cornerRadius((containerStyles as any).borderRadius || 0)
      .padding(containerStyles.padding || 0)
      .build()
  }

  function getContainerStyles(currentStyle: string, backgroundColor: string) {
    const styleMap = {
      floating: {
        backgroundColor,
        borderRadius: 16,
        padding: { top: 8, bottom: 8, left: 12, right: 12 },
        boxShadow:
          material === 'glass'
            ? '0 8px 32px rgba(0, 0, 0, 0.1)'
            : '0 2px 16px rgba(0, 0, 0, 0.1)',
        backdropFilter: material === 'blur' ? 'blur(20px)' : undefined,
      },
      sidebar: {
        backgroundColor,
        borderRight: '1px solid #e0e0e0',
        width: 240,
        padding: { top: 16, bottom: 16 },
      },
      page: {
        backgroundColor: 'transparent',
        padding: { top: 8, bottom: 8 },
      },
      grouped: {
        backgroundColor,
        borderRadius: 8,
        padding: { top: 4, bottom: 4 },
      },
    }

    return styleMap[currentStyle as keyof typeof styleMap] || styleMap.floating
  }

  // Tab Content Component
  const TabContent = () => {
    const activeTab = tabCoordinator.getActiveTab()

    if (!activeTab) {
      return Text('No tab selected')
        .modifier.padding(20)
        .foregroundColor('#999')
        .build()
    }

    const content =
      typeof activeTab.content === 'function'
        ? activeTab.content()
        : activeTab.content

    return HTML.div({ children: [content] }).modifier.build()
  }

  // Customization Panel
  const CustomizationPanel = () => {
    if (!isCustomizing()) return null

    const visibleTabsArray = tabCoordinator.visibleTabs
    const hiddenTabsArray = tabCoordinator.hiddenTabs

    return HTML.div({
      children: [
        HTML.div({ children: 'Customize Tabs' })
          .modifier.fontSize(18)
          .fontWeight('bold')
          .padding({ bottom: 16 })
          .build(),

        // Visible tabs
        ...visibleTabsArray.map(tab =>
          HTML.div({
            children: [
              HTML.span({ children: tab.icon || '📄' }),
              HTML.span({ children: tab.label }),
              allowHiding
                ? Button('Hide', () => tabCoordinator.hideTab(tab.id))
                    .modifier.fontSize(12)
                    .build()
                : null,
            ].filter(Boolean),
          })
            .modifier.padding({ top: 8, bottom: 8 })
            .build()
        ),

        // Hidden tabs
        ...(hiddenTabsArray.length > 0
          ? [
              HTML.div({ children: 'Hidden Tabs' })
                .modifier.fontSize(16)
                .fontWeight('600')
                .padding({ top: 16, bottom: 8 })
                .build(),

              ...hiddenTabsArray.map(tab =>
                HTML.div({
                  children: [
                    HTML.span({ children: tab.icon || '📄' }),
                    HTML.span({ children: tab.label }),
                    Button('Show', () => tabCoordinator.showTab(tab.id))
                      .modifier.fontSize(12)
                      .build(),
                  ],
                })
                  .modifier.padding({ top: 8, bottom: 8 })
                  .opacity(0.7)
                  .build()
              ),
            ]
          : []),
      ],
    })
      .modifier.backgroundColor('#ffffff')
      .border(1, '#e0e0e0')
      .cornerRadius(12)
      .padding(20)
      .build()
  }

  // Main assembly
  const assembleTabView = () => {
    const currentStyle = tabStyle()

    if (currentStyle === 'sidebar') {
      return HStack({
        children: [UnifiedTabBar(), TabContent()],
        spacing: 0,
        alignment: 'center',
      })
    } else if (currentStyle === 'page') {
      // Page style shows content with indicators
      return VStack({
        children: [
          TabContent(),
          ...(indexDisplayMode !== 'never' ? [UnifiedTabBar()] : []),
        ],
        spacing: 0,
        alignment: 'center',
      })
    } else {
      return VStack({
        children: [
          ...(currentStyle === 'floating'
            ? [TabContent(), UnifiedTabBar()]
            : [UnifiedTabBar(), TabContent()]),
          ...(isCustomizing() ? [CustomizationPanel()!] : []),
        ],
        spacing: 0,
        alignment: 'center',
      })
    }
  }

  const tabViewComponent: NavigationComponent = assembleTabView()
    .modifier.backgroundColor('#ffffff')
    .build() as NavigationComponent

  // Add unified coordinator and metadata
  ;(tabViewComponent as any).tabCoordinator = tabCoordinator
  ;(tabViewComponent as any).isUnified = true
  ;(tabViewComponent as any)._unifiedTabView = {
    type: 'UnifiedTabView',
    style,
    options: normalizedOptions,
    addTab: (tab: UnifiedTabItem) => {
      tabCoordinator.addTab(tab)
      setTabItems([...tabItems(), tab])
    },
    removeTab: (tabId: string) => {
      tabCoordinator.removeTab(tabId)
      setTabItems(tabs => tabs.filter(t => t.id !== tabId))
    },
    updateAppearance: (newAppearance: TabBarAppearance) => {
      Object.assign(appearance, newAppearance)
    },
  }

  return tabViewComponent
}

/**
 * Create hierarchical tab view with sections
 */
export function HierarchicalTabView(
  sections: TabSection[],
  options: UnifiedTabViewOptions = {}
): NavigationComponent {
  const allTabs: UnifiedTabItem[] = []

  sections.forEach(section => {
    section.tabs.forEach(tab => {
      allTabs.push({
        ...tab,
        section: section.id,
      } as UnifiedTabItem & { section: string })
    })
  })

  return UnifiedTabView(allTabs, {
    ...options,
    style: 'sidebar', // Hierarchical works best with sidebar
  })
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
  } = options

  const [currentIndex, setCurrentIndex] = createSignal(selection?.() || 0)

  createEffect(() => {
    if (selection) {
      setCurrentIndex(selection())
    }
  })

  return HTML.div({
    children: [
      // Page content
      HTML.div({
        children: pages.map((page, index) =>
          HTML.div({ children: page })
            .modifier.display(index === currentIndex() ? 'block' : 'none')
            .build()
        ),
      }).modifier.build(),

      // Page indicators
      ...(indexDisplayMode !== 'never'
        ? [
            HTML.div({
              children: pages.map((_, index) =>
                Button(`${index + 1}`, () => {
                  setCurrentIndex(index)
                  onSelectionChange?.(index)
                })
                  .modifier.fontSize(12)
                  .build()
              ),
            }).modifier.build(),
          ]
        : []),
    ],
  }).modifier.build()
}

/**
 * Unified TabView utilities
 */
export const UnifiedTabViewUtils = {
  /**
   * Check if component is a UnifiedTabView
   */
  isUnifiedTabView(component: ComponentInstance): boolean {
    return !!(component as any)._unifiedTabView
  },

  /**
   * Get UnifiedTabView metadata
   */
  getUnifiedTabViewMetadata(component: ComponentInstance): any {
    return (component as any)._unifiedTabView
  },

  /**
   * Create appearance preset
   */
  createAppearancePreset(
    preset: 'default' | 'prominent' | 'minimal'
  ): TabBarAppearance {
    const presets = {
      prominent: {
        backgroundColor: '#007AFF',
        selectedColor: '#FFFFFF',
        unselectedColor: 'rgba(255, 255, 255, 0.7)',
        indicatorColor: '#FFFFFF',
        padding: { top: 12, bottom: 12, leading: 16, trailing: 16 },
      },
      minimal: {
        backgroundColor: 'transparent',
        selectedColor: '#007AFF',
        unselectedColor: '#8E8E93',
        indicatorColor: '#007AFF',
        padding: { top: 8, bottom: 8, leading: 8, trailing: 8 },
      },
      default: {
        backgroundColor: '#F8F9FA',
        selectedColor: '#007AFF',
        unselectedColor: '#8E8E93',
        indicatorColor: '#007AFF',
        padding: { top: 10, bottom: 10, leading: 12, trailing: 12 },
      },
    }
    return presets[preset]
  },
}

// Export backwards compatibility aliases
export const AdvancedTabView = UnifiedTabView
export const EnhancedTabView = UnifiedTabView
export type AdvancedTabItem = UnifiedTabItem
export type AdvancedTabViewOptions = UnifiedTabViewOptions
export type EnhancedTabViewOptions = UnifiedTabViewOptions

// Backwards compatibility type guards
export const isAdvancedTabView = UnifiedTabViewUtils.isUnifiedTabView
export const isEnhancedTabView = UnifiedTabViewUtils.isUnifiedTabView
