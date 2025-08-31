/**
 * Enhanced List Components (Phase 5.5)
 *
 * SwiftUI-inspired List components with virtual scrolling, ForEach patterns,
 * and high-performance rendering for large datasets.
 */

import type { ModifiableComponent, ModifierBuilder } from '@tachui/core'
import {
  createEffect,
  createRoot,
  createSignal,
  isComputed,
  isSignal,
} from '@tachui/core'
import type { Signal } from '@tachui/core'
import { h } from '@tachui/core'
import type {
  ComponentInstance,
  ComponentProps,
  ComponentRef,
  DOMNode,
} from '@tachui/core'
import { DOMRenderer } from '@tachui/core'
import { ScrollView, type ScrollViewProps } from '@tachui/core'
import { withModifiers } from '@tachui/core'
import {
  ForEach,
  ForEachComponent,
  For,
  type ForEachProps,
  type ForProps,
} from '@tachui/flow-control'

/**
 * List item selection mode
 */
export type SelectionMode = 'none' | 'single' | 'multiple'

/**
 * List style
 */
export type ListStyle = 'plain' | 'grouped' | 'inset' | 'sidebar'

/**
 * List item swipe action
 */
export interface SwipeAction {
  id: string
  title: string
  backgroundColor?: string
  foregroundColor?: string
  icon?: string
  destructive?: boolean
  onTap: () => void
}

/**
 * List section header/footer
 */
export interface ListSection<T = any> {
  id: string
  header?: string | ComponentInstance
  footer?: string | ComponentInstance
  items: T[]
}

/**
 * Virtual scrolling configuration
 */
export interface VirtualScrollConfig {
  enabled: boolean
  itemHeight?: number | ((index: number, item: any) => number)
  estimatedItemHeight?: number
  overscan?: number
  threshold?: number
}

/**
 * List component properties
 */
export interface ListProps<T = any> extends Omit<ScrollViewProps, 'children'> {
  // Data
  data?: T[] | Signal<T[]>
  sections?: ListSection<T>[] | Signal<ListSection<T>[]>

  // Rendering
  renderItem: (item: T, index: number) => ComponentInstance
  renderSectionHeader?: (
    section: ListSection<T>,
    index: number
  ) => ComponentInstance
  renderSectionFooter?: (
    section: ListSection<T>,
    index: number
  ) => ComponentInstance

  // Appearance
  style?: ListStyle
  separator?: boolean | ComponentInstance

  // Selection
  selectionMode?: SelectionMode
  selectedItems?: Signal<Set<string | number>>
  onSelectionChange?: (selectedItems: Set<string | number>) => void

  // Item actions
  leadingSwipeActions?: (item: T, index: number) => SwipeAction[]
  trailingSwipeActions?: (item: T, index: number) => SwipeAction[]
  onItemTap?: (item: T, index: number) => void
  onItemLongPress?: (item: T, index: number) => void

  // Virtual scrolling
  virtualScrolling?: VirtualScrollConfig

  // Performance
  getItemId?: (item: T, index: number) => string | number

  // Empty state
  emptyState?: ComponentInstance

  // Loading
  isLoading?: boolean | Signal<boolean>
  loadingIndicator?: ComponentInstance

  // Pull to refresh (inherited from ScrollView)
  onRefresh?: () => Promise<void>

  // Infinite scroll
  onLoadMore?: () => Promise<void>
  hasMore?: boolean | Signal<boolean>
}

// ForEach components imported from @tachui/flow-control

/**
 * Virtual scroll item info
 */
interface VirtualScrollItem {
  index: number
  height: number
  offset: number
  item: any
}

/**
 * Enhanced List component class
 */
export class EnhancedList<T = any> implements ComponentInstance<ListProps<T>> {
  public readonly type = 'component' as const
  public readonly id: string
  public mounted = false
  public cleanup: (() => void)[] = []

  private dataSignal: () => T[]
  private setData: (data: T[]) => void
  private sectionsSignal: () => ListSection<T>[]
  private setSections: (sections: ListSection<T>[]) => void
  private selectedItemsSignal: () => Set<string | number>
  private setSelectedItems: (items: Set<string | number>) => void
  private isLoadingSignal: () => boolean
  private setIsLoading: (loading: boolean) => void

  // Virtual scrolling state
  private virtualItems: VirtualScrollItem[] = []
  private visibleStartIndex = 0
  private visibleEndIndex = 0
  private scrollOffset = 0
  private containerHeight = 0
  private totalHeight = 0

  constructor(public props: ListProps<T>) {
    this.id = `list-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Create reactive signals
    const [dataSignal, setData] = createSignal<T[]>(this.resolveData())
    this.dataSignal = dataSignal
    this.setData = setData

    const [sectionsSignal, setSections] = createSignal<ListSection<T>[]>(
      this.resolveSections()
    )
    this.sectionsSignal = sectionsSignal
    this.setSections = setSections

    const initialSelection = new Set<string | number>()
    const [selectedItemsSignal, setSelectedItems] =
      createSignal(initialSelection)
    this.selectedItemsSignal = selectedItemsSignal
    this.setSelectedItems = setSelectedItems

    const [isLoadingSignal, setIsLoading] = createSignal(
      this.resolveIsLoading()
    )
    this.isLoadingSignal = isLoadingSignal
    this.setIsLoading = setIsLoading

    // Set up reactive data updates
    this.setupReactiveUpdates()

    // Initialize virtual scrolling if enabled
    if (props.virtualScrolling?.enabled) {
      this.initializeVirtualScrolling()
    }
  }

  /**
   * Helper to flatten render results
   */
  private flattenRenderResult(result: any): any[] {
    return Array.isArray(result) ? result : [result]
  }

  /**
   * Resolve data from various input types
   */
  private resolveData(): T[] {
    const { data } = this.props

    if (Array.isArray(data)) {
      return data
    } else if (isSignal(data)) {
      return data()
    } else {
      return []
    }
  }

  /**
   * Resolve sections from various input types
   */
  private resolveSections(): ListSection<T>[] {
    const { sections } = this.props

    if (Array.isArray(sections)) {
      return sections
    } else if (isSignal(sections)) {
      return sections()
    } else {
      return []
    }
  }

  /**
   * Resolve loading state
   */
  private resolveIsLoading(): boolean {
    const { isLoading } = this.props

    if (typeof isLoading === 'boolean') {
      return isLoading
    } else if (isSignal(isLoading)) {
      return isLoading()
    } else {
      return false
    }
  }

  /**
   * Set up reactive updates for data and state
   */
  private setupReactiveUpdates(): void {
    // Data updates
    if (isSignal(this.props.data)) {
      const effect = createEffect(() => {
        this.setData(this.resolveData())
        this.updateVirtualScrolling()
      })
      this.cleanup.push(() => effect.dispose())
    }

    // Sections updates
    if (isSignal(this.props.sections)) {
      const effect = createEffect(() => {
        this.setSections(this.resolveSections())
        this.updateVirtualScrolling()
      })
      this.cleanup.push(() => effect.dispose())
    }

    // Loading state updates
    if (isSignal(this.props.isLoading)) {
      const effect = createEffect(() => {
        this.setIsLoading(this.resolveIsLoading())
      })
      this.cleanup.push(() => effect.dispose())
    }

    // Selection updates
    if (this.props.selectedItems) {
      const effect = createEffect(() => {
        if (this.props.selectedItems) {
          this.setSelectedItems(this.props.selectedItems())
        }
      })
      this.cleanup.push(() => effect.dispose())
    }
  }

  /**
   * Initialize virtual scrolling calculations
   */
  private initializeVirtualScrolling(): void {
    const data = this.dataSignal()
    const config = this.props.virtualScrolling!
    const estimatedHeight = config.estimatedItemHeight || 50

    this.virtualItems = data.map((item, index) => ({
      index,
      height: estimatedHeight,
      offset: index * estimatedHeight,
      item,
    }))

    this.totalHeight = data.length * estimatedHeight
  }

  /**
   * Update virtual scrolling calculations
   */
  private updateVirtualScrolling(): void {
    if (!this.props.virtualScrolling?.enabled) return

    this.initializeVirtualScrolling()
    this.calculateVisibleRange()
  }

  /**
   * Calculate visible item range for virtual scrolling
   */
  private calculateVisibleRange(): void {
    if (!this.props.virtualScrolling?.enabled) return

    const config = this.props.virtualScrolling
    const overscan = config.overscan || 5
    const threshold = config.threshold || 0

    // Find first visible item
    let startIndex = 0
    for (let i = 0; i < this.virtualItems.length; i++) {
      if (
        this.virtualItems[i].offset + this.virtualItems[i].height >
        this.scrollOffset - threshold
      ) {
        startIndex = Math.max(0, i - overscan)
        break
      }
    }

    // Find last visible item
    let endIndex = this.virtualItems.length - 1
    for (let i = startIndex; i < this.virtualItems.length; i++) {
      if (
        this.virtualItems[i].offset >
        this.scrollOffset + this.containerHeight + threshold
      ) {
        endIndex = Math.min(this.virtualItems.length - 1, i + overscan)
        break
      }
    }

    this.visibleStartIndex = startIndex
    this.visibleEndIndex = endIndex
  }

  /**
   * Handle item selection
   */
  private handleItemSelection(item: T, index: number): void {
    const { selectionMode, getItemId, onSelectionChange } = this.props

    if (selectionMode === 'none') return

    const itemId = getItemId ? getItemId(item, index) : index
    const currentSelection = new Set(this.selectedItemsSignal())

    if (selectionMode === 'single') {
      currentSelection.clear()
      currentSelection.add(itemId)
    } else if (selectionMode === 'multiple') {
      if (currentSelection.has(itemId)) {
        currentSelection.delete(itemId)
      } else {
        currentSelection.add(itemId)
      }
    }

    this.setSelectedItems(currentSelection)

    if (onSelectionChange) {
      onSelectionChange(currentSelection)
    }
  }

  /**
   * Create list item component
   */
  private createListItem(
    item: T,
    index: number,
    isSelected: boolean
  ): ComponentInstance {
    const { renderItem, style, onItemTap, onItemLongPress } = this.props

    const itemContent = renderItem(item, index)

    // Wrap in interactive container
    return {
      type: 'component',
      id: `${this.id}-item-${index}`,
      mounted: false,
      cleanup: [],
      props: {},
      render: () => {
        const itemElement = h(
          'div',
          {
            class: `tachui-list-item tachui-list-item-${style || 'plain'}`,
            style: {
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              backgroundColor: isSelected ? '#e6f3ff' : 'transparent',
              transition: 'background-color 0.2s ease',
              cursor: onItemTap ? 'pointer' : 'default',
            },
          },
          ...this.flattenRenderResult(itemContent.render())
        )

        // Add event handlers
        if (itemElement.element) {
          const element = itemElement.element as HTMLElement

          if (onItemTap) {
            element.addEventListener('click', () => onItemTap(item, index))
          }

          if (onItemLongPress) {
            let longPressTimer: NodeJS.Timeout

            const startLongPress = () => {
              longPressTimer = setTimeout(
                () => onItemLongPress(item, index),
                500
              )
            }

            const cancelLongPress = () => {
              clearTimeout(longPressTimer)
            }

            element.addEventListener('mousedown', startLongPress)
            element.addEventListener('mouseup', cancelLongPress)
            element.addEventListener('mouseleave', cancelLongPress)
            element.addEventListener('touchstart', startLongPress)
            element.addEventListener('touchend', cancelLongPress)
          }

          // Selection handling
          if (this.props.selectionMode !== 'none') {
            element.addEventListener('click', e => {
              if (
                e.metaKey ||
                e.ctrlKey ||
                this.props.selectionMode === 'multiple'
              ) {
                e.preventDefault()
                this.handleItemSelection(item, index)
              }
            })
          }
        }

        return [itemElement]
      },
    }
  }

  /**
   * Create list separator
   */
  private createSeparator(): ComponentInstance | null {
    const { separator } = this.props

    if (!separator) return null

    if (typeof separator === 'object' && 'render' in separator) {
      return separator
    }

    return {
      type: 'component',
      id: `${this.id}-separator`,
      mounted: false,
      cleanup: [],
      props: {},
      render: () => [
        h('div', {
          class: 'tachui-list-separator',
          style: {
            height: '1px',
            backgroundColor: '#e0e0e0',
            margin: '0 16px',
          },
        }),
      ],
    }
  }

  /**
   * Create section header
   */
  private createSectionHeader(
    section: ListSection<T>,
    index: number
  ): ComponentInstance | null {
    if (!section.header) return null

    if (typeof section.header === 'string') {
      return {
        type: 'component',
        id: `${this.id}-section-header-${index}`,
        mounted: false,
        cleanup: [],
        props: {},
        render: () => [
          h(
            'div',
            {
              class: 'tachui-list-section-header',
              style: {
                padding: '8px 16px',
                backgroundColor: '#f8f9fa',
                fontWeight: '600',
                fontSize: '14px',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              },
            },
            section.header as string
          ),
        ],
      }
    }

    return this.props.renderSectionHeader
      ? this.props.renderSectionHeader(section, index)
      : (section.header as ComponentInstance)
  }

  /**
   * Create section footer
   */
  private createSectionFooter(
    section: ListSection<T>,
    index: number
  ): ComponentInstance | null {
    if (!section.footer) return null

    if (typeof section.footer === 'string') {
      return {
        type: 'component',
        id: `${this.id}-section-footer-${index}`,
        mounted: false,
        cleanup: [],
        props: {},
        render: () => [
          h(
            'div',
            {
              class: 'tachui-list-section-footer',
              style: {
                padding: '8px 16px',
                fontSize: '12px',
                color: '#999',
              },
            },
            section.footer as string
          ),
        ],
      }
    }

    return this.props.renderSectionFooter
      ? this.props.renderSectionFooter(section, index)
      : (section.footer as ComponentInstance)
  }

  /**
   * Create empty state component
   */
  private createEmptyState(): ComponentInstance | null {
    const { emptyState } = this.props

    if (!emptyState) {
      return {
        type: 'component',
        id: `${this.id}-empty`,
        mounted: false,
        cleanup: [],
        props: {},
        render: () => [
          h(
            'div',
            {
              class: 'tachui-list-empty',
              style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px',
                color: '#999',
                fontSize: '16px',
              },
            },
            'No items to display'
          ),
        ],
      }
    }

    return emptyState
  }

  /**
   * Create loading indicator
   */
  private createLoadingIndicator(): ComponentInstance | null {
    const { loadingIndicator } = this.props

    if (!loadingIndicator) {
      return {
        type: 'component',
        id: `${this.id}-loading`,
        mounted: false,
        cleanup: [],
        props: {},
        render: () => [
          h(
            'div',
            {
              class: 'tachui-list-loading',
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                color: '#999',
              },
            },
            'Loading...'
          ),
        ],
      }
    }

    return loadingIndicator
  }

  /**
   * Render virtual scrolling content
   */
  private renderVirtualContent(): ComponentInstance[] {
    if (!this.props.virtualScrolling?.enabled) {
      return this.renderRegularContent()
    }

    const data = this.dataSignal()
    const selectedItems = this.selectedItemsSignal()
    const separator = this.createSeparator()

    const visibleItems: ComponentInstance[] = []

    // Add spacer for items before visible range
    if (this.visibleStartIndex > 0) {
      const spacerHeight =
        this.virtualItems[this.visibleStartIndex]?.offset || 0
      visibleItems.push({
        type: 'component',
        id: `${this.id}-spacer-top`,
        mounted: false,
        cleanup: [],
        props: {},
        render: () => [
          h('div', {
            style: { height: `${spacerHeight}px` },
          }),
        ],
      })
    }

    // Render visible items
    for (
      let i = this.visibleStartIndex;
      i <= this.visibleEndIndex && i < data.length;
      i++
    ) {
      const item = data[i]
      const itemId = this.props.getItemId ? this.props.getItemId(item, i) : i
      const isSelected = selectedItems.has(itemId)

      visibleItems.push(this.createListItem(item, i, isSelected))

      if (separator && i < data.length - 1) {
        visibleItems.push(separator)
      }
    }

    // Add spacer for items after visible range
    if (this.visibleEndIndex < data.length - 1) {
      const remainingHeight =
        this.totalHeight -
        (this.virtualItems[this.visibleEndIndex + 1]?.offset || 0)
      visibleItems.push({
        type: 'component',
        id: `${this.id}-spacer-bottom`,
        mounted: false,
        cleanup: [],
        props: {},
        render: () => [
          h('div', {
            style: { height: `${remainingHeight}px` },
          }),
        ],
      })
    }

    return visibleItems
  }

  /**
   * Render regular (non-virtual) content
   */
  private renderRegularContent(): ComponentInstance[] {
    const data = this.dataSignal()
    const sections = this.sectionsSignal()
    const selectedItems = this.selectedItemsSignal()
    const separator = this.createSeparator()

    const content: ComponentInstance[] = []

    // Render sections if available
    if (sections.length > 0) {
      sections.forEach((section, sectionIndex) => {
        // Section header
        const header = this.createSectionHeader(section, sectionIndex)
        if (header) content.push(header)

        // Section items
        section.items.forEach((item, itemIndex) => {
          const globalIndex = sectionIndex * 1000 + itemIndex // Simple global index
          const itemId = this.props.getItemId
            ? this.props.getItemId(item, globalIndex)
            : globalIndex
          const isSelected = selectedItems.has(itemId)

          content.push(this.createListItem(item, globalIndex, isSelected))

          if (separator && itemIndex < section.items.length - 1) {
            content.push(separator)
          }
        })

        // Section footer
        const footer = this.createSectionFooter(section, sectionIndex)
        if (footer) content.push(footer)
      })
    } else {
      // Render flat data
      data.forEach((item, index) => {
        const itemId = this.props.getItemId
          ? this.props.getItemId(item, index)
          : index
        const isSelected = selectedItems.has(itemId)

        content.push(this.createListItem(item, index, isSelected))

        if (separator && index < data.length - 1) {
          content.push(separator)
        }
      })
    }

    return content
  }

  /**
   * Handle scroll events for virtual scrolling and infinite scroll
   */
  private handleListScroll = (scrollInfo: any) => {
    this.scrollOffset = scrollInfo.offset.y
    this.containerHeight = scrollInfo.containerSize.height

    // Update virtual scrolling
    if (this.props.virtualScrolling?.enabled) {
      this.calculateVisibleRange()
    }

    // Handle infinite scroll
    if (this.props.onLoadMore && scrollInfo.edges.bottom) {
      const hasMore = isSignal(this.props.hasMore)
        ? this.props.hasMore()
        : this.props.hasMore
      if (hasMore && !this.isLoadingSignal()) {
        this.setIsLoading(true)
        this.props.onLoadMore().finally(() => {
          this.setIsLoading(false)
        })
      }
    }

    // Forward to parent scroll handler
    if (this.props.onScroll) {
      this.props.onScroll(scrollInfo)
    }
  }

  /**
   * Render the list component
   */
  render() {
    const data = this.dataSignal()
    const isLoading = this.isLoadingSignal()

    // Show loading indicator if loading and no data
    if (isLoading && data.length === 0) {
      const loadingIndicator = this.createLoadingIndicator()
      return loadingIndicator ? loadingIndicator.render() : []
    }

    // Show empty state if no data
    if (data.length === 0 && !isLoading) {
      const emptyState = this.createEmptyState()
      return emptyState ? emptyState.render() : []
    }

    // Render list content
    const content = this.props.virtualScrolling?.enabled
      ? this.renderVirtualContent()
      : this.renderRegularContent()

    // Add loading indicator at bottom if loading more
    if (isLoading && data.length > 0) {
      const loadingIndicator = this.createLoadingIndicator()
      if (loadingIndicator) {
        content.push(loadingIndicator)
      }
    }

    // Create scroll view props
    const scrollViewProps: ScrollViewProps = {
      ...this.props,
      children: content,
      onScroll: this.handleListScroll,
    }

    // Create scroll view
    const scrollView = new (ScrollView as any)(scrollViewProps)
    return scrollView.render()
  }
}

// ForEach class implementation available from @tachui/flow-control

/**
 * Create enhanced List component with modifier support
 */
export function List<T = any>(
  props: ListProps<T>
): ModifiableComponent<ListProps<T>> & {
  modifier: ModifierBuilder<ModifiableComponent<ListProps<T>>>
} {
  const component = new EnhancedList(props)
  return withModifiers(component)
}

// ForEach functions are imported from @tachui/flow-control

/**
 * List utility functions
 */
export const ListUtils = {
  /**
   * Create a simple list from array
   */
  simple<T>(
    data: T[] | Signal<T[]>,
    renderItem: (item: T, index: number) => ComponentInstance,
    props: Omit<ListProps<T>, 'data' | 'renderItem'> = {}
  ): ModifiableComponent<ListProps<T>> & {
    modifier: ModifierBuilder<ModifiableComponent<ListProps<T>>>
  } {
    return List({
      ...props,
      data,
      renderItem,
    })
  },

  /**
   * Create a sectioned list
   */
  sectioned<T>(
    sections: ListSection<T>[] | Signal<ListSection<T>[]>,
    renderItem: (item: T, index: number) => ComponentInstance,
    props: Omit<ListProps<T>, 'sections' | 'renderItem'> = {}
  ): ModifiableComponent<ListProps<T>> & {
    modifier: ModifierBuilder<ModifiableComponent<ListProps<T>>>
  } {
    return List({
      ...props,
      sections,
      renderItem,
    })
  },

  /**
   * Create a virtual scrolling list for large datasets
   */
  virtual<T>(
    data: T[] | Signal<T[]>,
    renderItem: (item: T, index: number) => ComponentInstance,
    virtualConfig: VirtualScrollConfig,
    props: Omit<ListProps<T>, 'data' | 'renderItem' | 'virtualScrolling'> = {}
  ): ModifiableComponent<ListProps<T>> & {
    modifier: ModifierBuilder<ModifiableComponent<ListProps<T>>>
  } {
    return List({
      ...props,
      data,
      renderItem,
      virtualScrolling: virtualConfig,
    })
  },

  /**
   * Create an infinite scrolling list
   */
  infinite<T>(
    data: T[] | Signal<T[]>,
    renderItem: (item: T, index: number) => ComponentInstance,
    onLoadMore: () => Promise<void>,
    hasMore: boolean | Signal<boolean>,
    props: Omit<
      ListProps<T>,
      'data' | 'renderItem' | 'onLoadMore' | 'hasMore'
    > = {}
  ): ModifiableComponent<ListProps<T>> & {
    modifier: ModifierBuilder<ModifiableComponent<ListProps<T>>>
  } {
    return List({
      ...props,
      data,
      renderItem,
      onLoadMore,
      hasMore,
    })
  },
}
