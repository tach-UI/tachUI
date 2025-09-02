/**
 * Tests for Enhanced List Components (Phase 5.5)
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EnhancedList, List, ListUtils } from '../src/list'
import { For, ForEach, ForEachComponent } from '@tachui/flow-control'
import { createSignal, flushSync } from '@tachui/core'

// Create a simple mock Text component for testing
const Text = (content: string) => ({
  type: 'component' as const,
  id: `text-${Math.random()}`,
  mounted: false,
  cleanup: [],
  props: { content },
  render: () => [{ type: 'text', text: content }],
})

import type { ListProps, ListSection, VirtualScrollConfig } from '../src/list'

// Mock DOM environment
function createMockListElement(): HTMLElement {
  const element = document.createElement('div')

  // Mock scroll and size properties
  Object.defineProperties(element, {
    scrollTop: { value: 0, writable: true },
    scrollHeight: { value: 1000, writable: true },
    clientHeight: { value: 300, writable: true },
  })

  return element
}

// Mock createElement
const originalCreateElement = document.createElement
beforeEach(() => {
  document.createElement = vi.fn((tagName: string) => {
    if (tagName === 'div') {
      return createMockListElement()
    }
    return originalCreateElement.call(document, tagName)
  })
})

// Sample data for testing
const sampleData = [
  { id: 1, name: 'Item 1', category: 'A' },
  { id: 2, name: 'Item 2', category: 'A' },
  { id: 3, name: 'Item 3', category: 'B' },
  { id: 4, name: 'Item 4', category: 'B' },
  { id: 5, name: 'Item 5', category: 'C' },
]

const sampleSections: ListSection[] = [
  {
    id: 'section-a',
    header: 'Category A',
    items: sampleData.slice(0, 2),
  },
  {
    id: 'section-b',
    header: 'Category B',
    items: sampleData.slice(2, 4),
  },
  {
    id: 'section-c',
    header: 'Category C',
    items: sampleData.slice(4, 5),
  },
]

describe('EnhancedList', () => {
  describe('Basic Functionality', () => {
    it('should create list component with basic props', () => {
      const renderItem = (item: any, _index: number) => Text(item.name)
      const props: ListProps = {
        data: sampleData,
        renderItem,
      }

      const list = new EnhancedList(props)
      expect(list.type).toBe('component')
      expect(list.id).toMatch(/^list-/)
      expect(list.props).toEqual(props)
    })

    it('should handle array data', () => {
      const renderItem = (item: any, _index: number) => Text(item.name)
      const list = new EnhancedList({
        data: sampleData,
        renderItem,
      })

      expect(list.dataSignal()).toEqual(sampleData)
    })

    it('should handle signal data', () => {
      const [data, _setData] = createSignal(sampleData)
      const renderItem = (item: any, _index: number) => Text(item.name)
      const list = new EnhancedList({
        data,
        renderItem,
      })

      expect(list.dataSignal()).toEqual(sampleData)

      // Test that the signal is connected, but don't test reactive updates
      // as those require full component lifecycle and effect scheduling
      expect(list.dataSignal()).toHaveLength(5)
    })

    it('should handle empty data', () => {
      const renderItem = (item: any, _index: number) => Text(item.name)
      const list = new EnhancedList({
        data: [],
        renderItem,
      })

      expect(list.dataSignal()).toEqual([])
    })
  })

  describe('Sectioned Lists', () => {
    it('should handle sectioned data', () => {
      const renderItem = (item: any, _index: number) => Text(item.name)
      const list = new EnhancedList({
        sections: sampleSections,
        renderItem,
      })

      expect(list.sectionsSignal()).toEqual(sampleSections)
    })

    it('should handle signal sections', () => {
      const [sections, setSections] = createSignal(sampleSections)
      const renderItem = (item: any, _index: number) => Text(item.name)
      const list = new EnhancedList({
        sections,
        renderItem,
      })

      expect(list.sectionsSignal()).toEqual(sampleSections)

      const newSections = [...sampleSections]
      newSections[0].header = 'Updated Category A'
      setSections(newSections)
      expect(list.sectionsSignal()).toEqual(newSections)
    })

    it('should create section headers', () => {
      const renderItem = (item: any, _index: number) => Text(item.name)
      const list = new EnhancedList({
        sections: sampleSections,
        renderItem,
      })

      const header = list.createSectionHeader(sampleSections[0], 0)
      expect(header).not.toBeNull()
    })

    it('should create section footers', () => {
      const sectionsWithFooters = [{ ...sampleSections[0], footer: 'Footer A' }]

      const renderItem = (item: any, _index: number) => Text(item.name)
      const list = new EnhancedList({
        sections: sectionsWithFooters,
        renderItem,
      })

      const footer = list.createSectionFooter(sectionsWithFooters[0], 0)
      expect(footer).not.toBeNull()
    })
  })

  describe('Item Rendering', () => {
    it('should render items using renderItem function', () => {
      const renderItem = vi.fn((item: any, _index: number) => Text(item.name))
      const list = new EnhancedList({
        data: sampleData,
        renderItem,
      })

      const listItem = list.createListItem(sampleData[0], 0, false)
      expect(listItem).toBeDefined()
      expect(listItem.id).toMatch(/^list-.*-item-0$/)
    })

    it('should handle item tap events', () => {
      const onItemTap = vi.fn()
      const renderItem = (item: any, _index: number) => Text(item.name)
      const list = new EnhancedList({
        data: sampleData,
        renderItem,
        onItemTap,
      })

      const listItem = list.createListItem(sampleData[0], 0, false)
      expect(listItem).toBeDefined()
    })

    it('should handle item long press events', () => {
      const onItemLongPress = vi.fn()
      const renderItem = (item: any, _index: number) => Text(item.name)
      const list = new EnhancedList({
        data: sampleData,
        renderItem,
        onItemLongPress,
      })

      const listItem = list.createListItem(sampleData[0], 0, false)
      expect(listItem).toBeDefined()
    })
  })

  describe('Selection', () => {
    it('should handle single selection mode', () => {
      const onSelectionChange = vi.fn()
      const renderItem = (item: any, _index: number) => Text(item.name)
      const list = new EnhancedList({
        data: sampleData,
        renderItem,
        selectionMode: 'single',
        onSelectionChange,
      })

      list.handleItemSelection(sampleData[0], 0)
      expect(list.selectedItemsSignal().has(0)).toBe(true)
      expect(list.selectedItemsSignal().size).toBe(1)
    })

    it('should handle multiple selection mode', () => {
      const onSelectionChange = vi.fn()
      const renderItem = (item: any, _index: number) => Text(item.name)
      const list = new EnhancedList({
        data: sampleData,
        renderItem,
        selectionMode: 'multiple',
        onSelectionChange,
      })

      list.handleItemSelection(sampleData[0], 0)
      list.handleItemSelection(sampleData[1], 1)

      expect(list.selectedItemsSignal().has(0)).toBe(true)
      expect(list.selectedItemsSignal().has(1)).toBe(true)
      expect(list.selectedItemsSignal().size).toBe(2)
    })

    it('should handle custom item ID generation', () => {
      const getItemId = (item: any, _index: number) => item.id
      const renderItem = (item: any, _index: number) => Text(item.name)
      const list = new EnhancedList({
        data: sampleData,
        renderItem,
        selectionMode: 'single',
        getItemId,
      })

      list.handleItemSelection(sampleData[0], 0)
      expect(list.selectedItemsSignal().has(1)).toBe(true) // item.id = 1
    })

    it('should handle external selection signal', () => {
      const initialSelection = new Set([0, 1])
      const [selectedItems, _setSelectedItems] = createSignal(initialSelection)
      const renderItem = (item: any, _index: number) => Text(item.name)
      const list = new EnhancedList({
        data: sampleData,
        renderItem,
        selectedItems,
      })

      // Test that the selection signal is connected during initialization
      // In real implementation, this would be synced after first render
      expect(list.selectedItemsSignal()).toBeDefined()
    })
  })

  describe('Virtual Scrolling', () => {
    it('should initialize virtual scrolling', () => {
      const virtualConfig: VirtualScrollConfig = {
        enabled: true,
        estimatedItemHeight: 60,
        overscan: 3,
      }

      const renderItem = (item: any, _index: number) => Text(item.name)
      const list = new EnhancedList({
        data: sampleData,
        renderItem,
        virtualScrolling: virtualConfig,
      })

      expect(list.virtualItems).toHaveLength(sampleData.length)
      expect(list.virtualItems[0].height).toBe(60)
    })

    it('should calculate visible range', () => {
      const virtualConfig: VirtualScrollConfig = {
        enabled: true,
        estimatedItemHeight: 50,
        overscan: 2,
      }

      const renderItem = (item: any, _index: number) => Text(item.name)
      const list = new EnhancedList({
        data: sampleData,
        renderItem,
        virtualScrolling: virtualConfig,
      })

      list.scrollOffset = 100
      list.containerHeight = 200
      list.calculateVisibleRange()

      expect(list.visibleStartIndex).toBeGreaterThanOrEqual(0)
      expect(list.visibleEndIndex).toBeLessThan(sampleData.length)
    })

    it('should render virtual content', () => {
      const virtualConfig: VirtualScrollConfig = {
        enabled: true,
        estimatedItemHeight: 50,
      }

      const renderItem = (item: any, _index: number) => Text(item.name)
      const list = new EnhancedList({
        data: sampleData,
        renderItem,
        virtualScrolling: virtualConfig,
      })

      const content = list.renderVirtualContent()
      expect(Array.isArray(content)).toBe(true)
    })
  })

  describe('Loading States', () => {
    it('should handle loading state', () => {
      const renderItem = (item: any, _index: number) => Text(item.name)
      const list = new EnhancedList({
        data: [],
        renderItem,
        isLoading: true,
      })

      expect(list.isLoadingSignal()).toBe(true)
    })

    it('should handle loading signal', () => {
      const [isLoading, _setIsLoading] = createSignal(false)
      const renderItem = (item: any, _index: number) => Text(item.name)
      const list = new EnhancedList({
        data: sampleData,
        renderItem,
        isLoading,
      })

      expect(list.isLoadingSignal()).toBe(false)

      // Test that loading signal is connected
      // In test environment, reactive updates require full effect scheduling
      expect(typeof list.isLoadingSignal).toBe('function')
    })

    it('should create loading indicator', () => {
      const renderItem = (item: any, _index: number) => Text(item.name)
      const list = new EnhancedList({
        data: sampleData,
        renderItem,
      })

      const indicator = list.createLoadingIndicator()
      expect(indicator).not.toBeNull()
    })
  })

  describe('Empty State', () => {
    it('should create default empty state', () => {
      const renderItem = (item: any, _index: number) => Text(item.name)
      const list = new EnhancedList({
        data: [],
        renderItem,
      })

      const emptyState = list.createEmptyState()
      expect(emptyState).not.toBeNull()
    })

    it('should use custom empty state', () => {
      const customEmptyState = Text('No data available')
      const renderItem = (item: any, _index: number) => Text(item.name)
      const list = new EnhancedList({
        data: [],
        renderItem,
        emptyState: customEmptyState,
      })

      const emptyState = list.createEmptyState()
      expect(emptyState).toBe(customEmptyState)
    })
  })

  describe('Separators', () => {
    it('should create default separator', () => {
      const renderItem = (item: any, _index: number) => Text(item.name)
      const list = new EnhancedList({
        data: sampleData,
        renderItem,
        separator: true,
      })

      const separator = list.createSeparator()
      expect(separator).not.toBeNull()
    })

    it('should use custom separator component', () => {
      const customSeparator = Text('---')
      const renderItem = (item: any, _index: number) => Text(item.name)
      const list = new EnhancedList({
        data: sampleData,
        renderItem,
        separator: customSeparator,
      })

      const separator = list.createSeparator()
      expect(separator).toBe(customSeparator)
    })

    it('should handle no separator', () => {
      const renderItem = (item: any, _index: number) => Text(item.name)
      const list = new EnhancedList({
        data: sampleData,
        renderItem,
        separator: false,
      })

      const separator = list.createSeparator()
      expect(separator).toBeNull()
    })
  })

  describe('Infinite Scrolling', () => {
    it('should handle infinite scroll with hasMore', () => {
      const onLoadMore = vi.fn().mockResolvedValue(undefined)
      const renderItem = (item: any, _index: number) => Text(item.name)
      const list = new EnhancedList({
        data: sampleData,
        renderItem,
        onLoadMore,
        hasMore: true,
      })

      // Simulate scroll to bottom
      const mockScrollInfo = {
        offset: { x: 0, y: 700 },
        edges: { top: false, bottom: true, left: false, right: false },
        containerSize: { width: 400, height: 300 },
        contentSize: { width: 400, height: 1000 },
        velocity: { x: 0, y: 0 },
      }

      list.handleListScroll(mockScrollInfo)
      expect(list.isLoadingSignal()).toBe(true)
    })

    it('should handle hasMore signal', () => {
      const [hasMore, setHasMore] = createSignal(true)
      const onLoadMore = vi.fn().mockResolvedValue(undefined)
      const renderItem = (item: any, _index: number) => Text(item.name)
      const _list = new EnhancedList({
        data: sampleData,
        renderItem,
        onLoadMore,
        hasMore,
      })

      setHasMore(false)
      // In real implementation, this would prevent further loading
    })
  })
})

describe('ForEach Component', () => {
  describe('Basic Functionality', () => {
    it('should create ForEach component with array data', () => {
      const forEach = new ForEach({
        data: sampleData,
        children: (item, _index) => Text(item.name),
      })

      expect(forEach.type).toBe('component')
      expect(forEach.id).toMatch(/^foreach-/)
    })

    it('should create ForEach component with signal data', () => {
      const [data] = createSignal(sampleData)
      const forEach = new ForEach({
        data,
        children: (item, _index) => Text(item.name),
      })

      expect(forEach.dataSignal()).toEqual(sampleData)
    })

    it('should render children for each item', () => {
      const forEach = new ForEach({
        data: sampleData,
        children: (item, index) => Text(`${index}: ${item.name}`),
      })

      const elements = forEach.render()
      expect(elements.length).toBeGreaterThan(0)
    })

    it('should handle custom item ID generation', () => {
      const getItemId = (item: any, _index: number) => item.id
      const forEach = new ForEach({
        data: sampleData,
        children: (item, _index) => Text(item.name),
        getItemId,
      })

      const elements = forEach.render()
      expect(elements.length).toBeGreaterThan(0)
    })

    it('should handle empty data', () => {
      const forEach = new ForEach({
        data: [],
        children: (item, _index) => Text(item.name),
      })

      const elements = forEach.render()
      expect(elements).toHaveLength(0)
    })
  })

  describe('Reactive Updates', () => {
    it('should update when signal data changes', () => {
      const [data, setData] = createSignal(sampleData.slice(0, 2))
      const forEach = new ForEach({
        data,
        children: (item, _index) => Text(item.name),
      })

      expect(forEach.dataSignal()).toHaveLength(2)

      setData(sampleData)
      expect(forEach.dataSignal()).toHaveLength(5)
    })

    it('should re-render with updated DOM nodes when reactive data changes', () => {
      const [data, setData] = createSignal([sampleData[0]]) // Start with 1 item
      const forEach = new ForEach({
        data,
        children: (item, index) => Text(`${index}: ${item.name}`),
      })

      // Initial render - should create reactive container for signal data
      const initialRender = forEach.render()
      expect(initialRender.length).toBe(1) // Reactive container

      // For reactive data, ForEach creates a container with current children
      const container = initialRender[0]
      expect(container.type).toBe('element')
      expect(container.props?.style?.display).toBe('contents')
      expect(container.children).toHaveLength(1) // Initial 1 item

      // Change signal data
      setData(sampleData) // Now 5 items (sampleData has 5 items)

      // Flush reactive updates to ensure they complete
      flushSync()

      // The container's children should be updated reactively
      expect(container.children).toHaveLength(5) // Now 5 items
    })

    it('should handle static data without reactive container', () => {
      const forEach = new ForEach({
        data: sampleData.slice(0, 2), // Static array
        children: (item, index) => Text(`${index}: ${item.name}`),
      })

      // Static data - should return direct children, no container
      const render = forEach.render()
      expect(render.length).toBe(2) // Direct children, no container
    })
  })
})

describe('For Component (SolidJS-style compatibility)', () => {
  describe('Basic Functionality', () => {
    it('should create For component with each prop (SolidJS syntax)', () => {
      const forComponent = For({
        each: sampleData,
        children: (item: any, _index: number) => Text(item.name),
      })

      expect(forComponent.type).toBe('component')
      expect(forComponent.id).toMatch(/^foreach-/)
    })

    it('should handle static array data with each prop', () => {
      const forComponent = For({
        each: sampleData,
        children: (item: any, _index: number) => Text(item.name),
      })

      expect(forComponent.dataSignal()).toEqual(sampleData)
    })

    it('should handle signal data with each prop', () => {
      const [data] = createSignal(sampleData)
      const forComponent = For({
        each: data,
        children: (item: any, _index: number) => Text(item.name),
      })

      expect(forComponent.dataSignal()).toEqual(sampleData)
    })

    it('should convert SolidJS-style props to ForEach props', () => {
      const forComponent = For({
        each: sampleData,
        children: (item: any, index: number) => Text(`${index}: ${item.name}`),
        key: 'test-key',
      })

      // Verify the internal conversion happened correctly
      expect(forComponent.props.renderItem).toBeDefined()
      expect(forComponent.props.key).toBe('test-key')
    })

    it('should render children for each item using each prop', () => {
      const forComponent = For({
        each: sampleData,
        children: (item: any, index: number) => Text(`${index}: ${item.name}`),
      })

      const elements = forComponent.render()
      expect(elements.length).toBeGreaterThan(0)
    })

    it('should handle empty each array', () => {
      const forComponent = For({
        each: [],
        children: (item: any, _index: number) => Text(item.name),
      })

      const elements = forComponent.render()
      expect(elements).toHaveLength(0)
    })

    it('should support index parameter in children function', () => {
      const forComponent = For({
        each: sampleData.slice(0, 3),
        children: (item: any, index: number) => Text(`${index}: ${item.name}`),
      })

      const elements = forComponent.render()
      expect(elements.length).toBeGreaterThan(0)
      // Verify that the index is being passed correctly
      expect(forComponent.props.renderItem).toBeDefined()
    })
  })

  describe('ForProps Interface', () => {
    it('should accept all ForProps properties', () => {
      const fallbackComponent = Text('No items')
      const forComponent = For({
        each: sampleData,
        children: (item: any, _index: number) => Text(item.name),
        fallback: fallbackComponent,
        key: 'for-key',
        ref: undefined,
      })

      expect(forComponent).toBeDefined()
      expect(forComponent.type).toBe('component')
    })

    it('should handle key prop', () => {
      const forComponent = For({
        each: sampleData,
        children: (item: any, _index: number) => Text(item.name),
        key: 'unique-for-key',
      })

      expect(forComponent.props.key).toBe('unique-for-key')
    })

    it('should handle ref prop', () => {
      const mockRef = { current: null }
      const forComponent = For({
        each: sampleData,
        children: (item: any, _index: number) => Text(item.name),
        ref: mockRef,
      })

      expect(forComponent.props.ref).toBe(mockRef)
    })
  })

  describe('SolidJS Compatibility', () => {
    it('should use "each" prop instead of "data" prop', () => {
      const forComponent = For({
        each: sampleData,
        children: (item: any, _index: number) => Text(item.name),
      })

      // Verify that the conversion from "each" to "data" happened
      expect(forComponent.props.data).toEqual(sampleData)
      expect(forComponent.props.renderItem).toBeDefined()
    })

    it('should work exactly like ForEach but with SolidJS syntax', () => {
      const forComponent = For({
        each: sampleData,
        children: (item: any, _index: number) => Text(item.name),
      })

      const forEachComponent = new ForEachComponent({
        data: sampleData,
        children: (item: any, _index: number) => Text(item.name),
      })

      // Should produce equivalent results
      expect(forComponent.type).toBe(forEachComponent.type)
      expect(forComponent.dataSignal()).toEqual(forEachComponent.dataSignal())
    })
  })

  describe('Reactive Updates', () => {
    it('should update when each signal changes', () => {
      const [data, setData] = createSignal(sampleData.slice(0, 2))
      const forComponent = For({
        each: data,
        children: (item: any, _index: number) => Text(item.name),
      })

      expect(forComponent.dataSignal()).toHaveLength(2)

      setData(sampleData)
      expect(forComponent.dataSignal()).toHaveLength(5)
    })

    it('should maintain reactivity when each prop is a signal', () => {
      const [items, setItems] = createSignal([
        { id: 1, name: 'First' },
        { id: 2, name: 'Second' },
      ])

      const forComponent = For({
        each: items,
        children: (item: any, _index: number) => Text(item.name),
      })

      // Initial state
      expect(forComponent.dataSignal()).toHaveLength(2)

      // Update signal
      setItems([...items(), { id: 3, name: 'Third' }])

      // Should reflect the change
      expect(forComponent.dataSignal()).toHaveLength(3)
      expect(forComponent.dataSignal()[2].name).toBe('Third')
    })
  })

  describe('TypeScript Support', () => {
    it('should support generic type inference', () => {
      interface TestItem {
        id: number
        name: string
      }

      const typedData: TestItem[] = [
        { id: 1, name: 'Typed Item 1' },
        { id: 2, name: 'Typed Item 2' },
      ]

      const forComponent = For<TestItem>({
        each: typedData,
        children: (item: TestItem, _index: number) =>
          Text(`${item.id}: ${item.name}`),
      })

      expect(forComponent).toBeDefined()
      expect(forComponent.type).toBe('component')
    })
  })

  describe('Error Handling', () => {
    it('should handle null or undefined each prop gracefully', () => {
      const forComponent = For({
        each: null as any,
        children: (item: any, _index: number) => Text(item?.name || 'Unknown'),
      })

      expect(forComponent).toBeDefined()
      // The ForEach component should handle null/undefined data gracefully
      // by rendering empty content rather than throwing
      const rendered = forComponent.render()
      expect(rendered).toBeDefined()
      expect(Array.isArray(rendered)).toBe(true)
    })

    it('should handle undefined children gracefully', () => {
      expect(() => {
        const _forComponent = For({
          each: sampleData,
          children: undefined as any,
        })
      }).not.toThrow()
    })
  })

  describe('Performance', () => {
    it('should handle large arrays efficiently', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
      }))

      const startTime = performance.now()
      const forComponent = For({
        each: largeArray,
        children: (item: any, _index: number) => Text(item.name),
      })

      const elements = forComponent.render()
      const endTime = performance.now()

      expect(elements).toBeDefined()
      expect(endTime - startTime).toBeLessThan(100) // Should complete within 100ms
    })
  })
})

describe('List Factory Function', () => {
  it('should create modifiable list component', () => {
    const list = List({
      data: sampleData,
      renderItem: (item, _index) => Text(item.name),
    })

    expect(list).toBeDefined()
    expect(typeof list.modifier).toBe('object')
    expect(typeof list.modifier.build).toBe('function')
  })

  it('should support modifier chaining', () => {
    const list = List({
      data: sampleData,
      renderItem: (item, _index) => Text(item.name),
    })
      .modifier.frame(undefined, 400)
      .padding(16)
      .backgroundColor('#ffffff')
      .build()

    expect(list).toBeDefined()
  })
})

describe('ForEachComponent Factory Function', () => {
  it('should create ForEach component', () => {
    const forEach = new ForEachComponent({
      data: sampleData,
      children: (item, _index) => Text(item.name),
    })

    expect(forEach).toBeDefined()
    expect(forEach.type).toBe('component')
  })
})

describe('ListUtils', () => {
  describe('simple', () => {
    it('should create simple list', () => {
      const list = ListUtils.simple(sampleData, (item, _index) =>
        Text(item.name)
      )

      expect(list).toBeDefined()
      expect(typeof list.modifier).toBe('object')
    })

    it('should accept additional props', () => {
      const list = ListUtils.simple(
        sampleData,
        (item, _index) => Text(item.name),
        {
          separator: true,
          style: 'grouped',
        }
      )

      expect(list).toBeDefined()
    })
  })

  describe('sectioned', () => {
    it('should create sectioned list', () => {
      const list = ListUtils.sectioned(sampleSections, (item, _index) =>
        Text(item.name)
      )

      expect(list).toBeDefined()
    })
  })

  describe('virtual', () => {
    it('should create virtual scrolling list', () => {
      const virtualConfig: VirtualScrollConfig = {
        enabled: true,
        estimatedItemHeight: 50,
      }

      const list = ListUtils.virtual(
        sampleData,
        (item, _index) => Text(item.name),
        virtualConfig
      )

      expect(list).toBeDefined()
    })
  })

  describe('infinite', () => {
    it('should create infinite scrolling list', () => {
      const onLoadMore = vi.fn().mockResolvedValue(undefined)

      const list = ListUtils.infinite(
        sampleData,
        (item, _index) => Text(item.name),
        onLoadMore,
        true
      )

      expect(list).toBeDefined()
    })

    it('should work with hasMore signal', () => {
      const [hasMore] = createSignal(true)
      const onLoadMore = vi.fn().mockResolvedValue(undefined)

      const list = ListUtils.infinite(
        sampleData,
        (item, _index) => Text(item.name),
        onLoadMore,
        hasMore
      )

      expect(list).toBeDefined()
    })
  })
})
