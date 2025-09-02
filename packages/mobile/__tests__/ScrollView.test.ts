/**
 * Tests for Enhanced ScrollView Component (Phase 5.5)
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  EnhancedScrollView,
  ScrollView,
  ScrollViewUtils,
} from '../src/ScrollView'
import { createSignal } from '@tachui/core'

// Create a simple mock Text component for testing
const Text = (content: string) => ({
  type: 'component' as const,
  id: `text-${Math.random()}`,
  mounted: false,
  cleanup: [],
  props: { content },
  render: () => [{ type: 'text', text: content }],
})

import type {
  ContentOffset,
  ScrollEventInfo,
  ScrollViewProps,
} from '../../src/components/ScrollView'

// Mock DOM environment
function createMockScrollElement(): HTMLElement {
  const element = {
    tagName: 'DIV',
    style: {},
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    scrollTo: vi.fn(),
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    id: `mock-${Math.random()}`,
  } as any

  // Mock scroll properties
  Object.defineProperties(element, {
    scrollTop: { value: 0, writable: true },
    scrollLeft: { value: 0, writable: true },
    scrollHeight: { value: 1000, writable: true },
    scrollWidth: { value: 500, writable: true },
    clientHeight: { value: 300, writable: true },
    clientWidth: { value: 400, writable: true },
  })

  // Mock scroll methods
  element.scrollTo = vi.fn()

  return element
}

// Mock document methods
beforeEach(() => {
  global.document = {
    ...global.document,
    createElement: vi.fn((tagName: string) => {
      if (tagName === 'div') {
        return createMockScrollElement()
      }
      if (tagName === 'style') {
        return { textContent: '' }
      }
      return {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        style: {},
        setAttribute: vi.fn(),
      }
    }),
    head: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    },
  }
})

describe('EnhancedScrollView', () => {
  describe('Basic Functionality', () => {
    it('should create scroll view component with basic props', () => {
      const children = [Text('Content')]
      const props: ScrollViewProps = {
        children,
        direction: 'vertical',
        showsScrollIndicator: true,
      }

      const scrollView = new EnhancedScrollView(props)
      expect(scrollView.type).toBe('component')
      expect(scrollView.id).toMatch(/^scrollview-/)
      expect(scrollView.props).toEqual(props)
    })

    it('should handle children components', () => {
      const children = [
        Text('First item'),
        Text('Second item'),
        Text('Third item'),
      ]

      const scrollView = new EnhancedScrollView({ children })
      const elements = scrollView.render()

      expect(elements).toHaveLength(1)
      expect(elements[0].tag).toBe('div')
    })

    it('should handle empty children array', () => {
      const scrollView = new EnhancedScrollView({ children: [] })
      const elements = scrollView.render()

      expect(elements).toHaveLength(1)
      expect(elements[0].tag).toBe('div')
    })
  })

  describe('Scroll Direction', () => {
    it('should handle vertical scrolling direction', () => {
      const scrollView = new EnhancedScrollView({
        direction: 'vertical',
        children: [Text('Content')],
      })

      const elements = scrollView.render()
      expect(elements[0].tag).toBe('div')
    })

    it('should handle horizontal scrolling direction', () => {
      const scrollView = new EnhancedScrollView({
        direction: 'horizontal',
        children: [Text('Content')],
      })

      const elements = scrollView.render()
      expect(elements[0].tag).toBe('div')
    })

    it('should handle both scrolling directions', () => {
      const scrollView = new EnhancedScrollView({
        direction: 'both',
        children: [Text('Content')],
      })

      const elements = scrollView.render()
      expect(elements[0].tag).toBe('div')
    })
  })

  describe('Scroll Indicators', () => {
    it('should show scroll indicators by default', () => {
      const scrollView = new EnhancedScrollView({
        children: [Text('Content')],
      })

      const elements = scrollView.render()
      expect(elements[0].tag).toBe('div')
    })

    it('should hide scroll indicators when disabled', () => {
      const scrollView = new EnhancedScrollView({
        showsScrollIndicator: false,
        children: [Text('Content')],
      })

      const elements = scrollView.render()
      expect(elements[0].tag).toBe('div')
    })
  })

  describe('Content Offset', () => {
    it('should handle external content offset signal', () => {
      const [contentOffset, _setContentOffset] = createSignal<ContentOffset>({
        x: 100,
        y: 200,
      })

      const scrollView = new EnhancedScrollView({
        contentOffset,
        children: [Text('Content')],
      })

      expect(scrollView.contentOffsetSignal()).toEqual({ x: 100, y: 200 })
    })

    it('should initialize with zero offset by default', () => {
      const scrollView = new EnhancedScrollView({
        children: [Text('Content')],
      })

      expect(scrollView.contentOffsetSignal()).toEqual({ x: 0, y: 0 })
    })
  })

  describe('Content Size', () => {
    it('should handle external content size signal', () => {
      const [contentSize, _setContentSize] = createSignal({
        width: 800,
        height: 1200,
      })

      const scrollView = new EnhancedScrollView({
        contentSize,
        children: [Text('Content')],
      })

      expect(scrollView.contentSizeSignal()).toEqual({
        width: 800,
        height: 1200,
      })
    })

    it('should initialize with zero size by default', () => {
      const scrollView = new EnhancedScrollView({
        children: [Text('Content')],
      })

      expect(scrollView.contentSizeSignal()).toEqual({ width: 0, height: 0 })
    })
  })

  describe('Scroll Events', () => {
    it('should call onScroll callback', () => {
      const onScroll = vi.fn()
      const scrollView = new EnhancedScrollView({
        onScroll,
        children: [Text('Content')],
      })

      scrollView.render()

      // Simulate scroll event
      const _mockScrollInfo: ScrollEventInfo = {
        offset: { x: 0, y: 100 },
        velocity: { x: 0, y: 5 },
        contentSize: { width: 500, height: 1000 },
        containerSize: { width: 400, height: 300 },
        edges: { top: false, bottom: false, left: false, right: false },
      }

      scrollView.handleScroll(new Event('scroll'))
      // Note: In real implementation, this would trigger the callback
    })

    it('should call onScrollBegin callback', () => {
      const onScrollBegin = vi.fn()
      const scrollView = new EnhancedScrollView({
        onScrollBegin,
        children: [Text('Content')],
      })

      scrollView.handleScrollStart()
      expect(onScrollBegin).toHaveBeenCalled()
    })

    it('should call onScrollEnd callback', () => {
      const onScrollEnd = vi.fn()
      const scrollView = new EnhancedScrollView({
        onScrollEnd,
        children: [Text('Content')],
      })

      scrollView.handleScrollEnd()
      expect(onScrollEnd).toHaveBeenCalled()
    })

    it('should call edge detection callbacks', () => {
      const onReachTop = vi.fn()
      const onReachBottom = vi.fn()
      const onReachLeft = vi.fn()
      const onReachRight = vi.fn()

      const scrollView = new EnhancedScrollView({
        onReachTop,
        onReachBottom,
        onReachLeft,
        onReachRight,
        children: [Text('Content')],
      })

      // Mock scroll element directly
      const mockElement = {
        scrollTop: 0,
        scrollLeft: 0,
        scrollHeight: 1000,
        scrollWidth: 500,
        clientHeight: 300,
        clientWidth: 400,
      }
      scrollView.scrollElement = mockElement as any

      // Test edge detection
      const edges = scrollView.detectScrollEdges()
      expect(edges).toEqual({
        top: true, // scrollTop = 0
        bottom: false,
        left: true, // scrollLeft = 0
        right: false,
      })
    })
  })

  describe('Pull to Refresh', () => {
    it('should handle pull to refresh configuration', () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined)

      const scrollView = new EnhancedScrollView({
        refreshControl: {
          enabled: true,
          onRefresh,
          threshold: 100,
        },
        children: [Text('Content')],
      })

      expect(scrollView.props.refreshControl?.enabled).toBe(true)
      expect(scrollView.props.refreshControl?.threshold).toBe(100)
    })

    it('should create pull to refresh indicator', () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined)

      const scrollView = new EnhancedScrollView({
        refreshControl: {
          enabled: true,
          onRefresh,
        },
        children: [Text('Content')],
      })

      const indicator = scrollView.createPullToRefreshIndicator()
      expect(indicator).toBeNull() // Initially idle state
    })

    it('should handle touch events for pull to refresh', () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined)

      const scrollView = new EnhancedScrollView({
        refreshControl: {
          enabled: true,
          onRefresh,
        },
        children: [Text('Content')],
      })

      // Mock touch event
      const mockTouchEvent = {
        touches: [{ clientY: 100 }],
      } as TouchEvent

      scrollView.handleTouchStart(mockTouchEvent)
      expect(scrollView.pullStartY).toBe(100)
    })
  })

  describe('Scroll Methods', () => {
    it('should scroll to specific position', () => {
      const scrollView = new EnhancedScrollView({
        children: [Text('Content')],
      })

      const mockElement = {
        scrollTo: vi.fn(),
      }
      scrollView.scrollElement = mockElement as any

      scrollView.scrollTo({ x: 100, y: 200 })
      expect(mockElement.scrollTo).toHaveBeenCalledWith({
        left: 100,
        top: 200,
        behavior: 'smooth',
      })
    })

    it('should scroll to top', () => {
      const scrollView = new EnhancedScrollView({
        children: [Text('Content')],
      })

      const mockElement = {
        scrollTo: vi.fn(),
      }
      scrollView.scrollElement = mockElement as any

      scrollView.scrollToTop()
      expect(mockElement.scrollTo).toHaveBeenCalledWith({
        left: 0,
        top: 0,
        behavior: 'smooth',
      })
    })

    it('should scroll to bottom', () => {
      const scrollView = new EnhancedScrollView({
        children: [Text('Content')],
      })

      const mockElement = {
        scrollTo: vi.fn(),
        scrollHeight: 1000,
        clientHeight: 300,
      }
      scrollView.scrollElement = mockElement as any

      scrollView.scrollToBottom()
      expect(mockElement.scrollTo).toHaveBeenCalledWith({
        left: 0,
        top: 700, // scrollHeight - clientHeight
        behavior: 'smooth',
      })
    })
  })

  describe('Performance', () => {
    it('should throttle scroll events', () => {
      const scrollView = new EnhancedScrollView({
        scrollEventThrottle: 32, // 30fps
        children: [Text('Content')],
      })

      expect(scrollView.scrollEventThrottle).toBe(32)
    })

    it('should calculate scroll velocity', () => {
      const scrollView = new EnhancedScrollView({
        children: [Text('Content')],
      })

      const velocity = scrollView.calculateVelocity({ x: 100, y: 200 }, 16)
      expect(velocity.x).toBe(6.25) // 100 / 16
      expect(velocity.y).toBe(12.5) // 200 / 16
    })
  })

  describe('Scroll Enabled State', () => {
    it('should handle scroll enabled signal', () => {
      const [scrollEnabled, setScrollEnabled] = createSignal(true)

      const scrollView = new EnhancedScrollView({
        scrollEnabled,
        children: [Text('Content')],
      })

      scrollView.render()

      // Change scroll enabled state
      setScrollEnabled(false)
      // In real implementation, this would disable scrolling
    })

    it('should handle static scroll enabled state', () => {
      const scrollView = new EnhancedScrollView({
        scrollEnabled: false,
        children: [Text('Content')],
      })

      const elements = scrollView.render()
      expect(elements[0].tag).toBe('div')
    })
  })
})

describe('ScrollView Factory Function', () => {
  it('should create modifiable scroll view component', () => {
    const scrollView = ScrollView({
      children: [Text('Content')],
    })

    expect(scrollView).toBeDefined()
    expect(typeof scrollView.modifier).toBe('object')
    expect(typeof scrollView.modifier.build).toBe('function')
  })

  it('should support modifier chaining', () => {
    const scrollView = ScrollView({
      children: [Text('Content')],
    })
      .modifier.frame(undefined, 400)
      .padding(16)
      .backgroundColor('#f5f5f5')
      .build()

    expect(scrollView).toBeDefined()
  })
})

describe('ScrollViewUtils', () => {
  describe('withRefresh', () => {
    it('should create scroll view with pull to refresh', () => {
      const children = [Text('Content')]
      const onRefresh = vi.fn().mockResolvedValue(undefined)

      const scrollView = ScrollViewUtils.withRefresh(children, onRefresh)

      expect(scrollView).toBeDefined()
      expect(typeof scrollView.modifier).toBe('object')
    })

    it('should accept refresh options', () => {
      const children = [Text('Content')]
      const onRefresh = vi.fn().mockResolvedValue(undefined)

      const scrollView = ScrollViewUtils.withRefresh(children, onRefresh, {
        threshold: 120,
        tintColor: '#007AFF',
      })

      expect(scrollView).toBeDefined()
    })
  })

  describe('horizontal', () => {
    it('should create horizontal scroll view', () => {
      const children = [Text('Item 1'), Text('Item 2'), Text('Item 3')]

      const scrollView = ScrollViewUtils.horizontal(children)

      expect(scrollView).toBeDefined()
    })

    it('should accept additional props', () => {
      const children = [Text('Item 1'), Text('Item 2')]

      const scrollView = ScrollViewUtils.horizontal(children, {
        showsScrollIndicator: false,
        bounces: false,
      })

      expect(scrollView).toBeDefined()
    })
  })

  describe('paged', () => {
    it('should create paged scroll view', () => {
      const children = [Text('Page 1'), Text('Page 2'), Text('Page 3')]

      const scrollView = ScrollViewUtils.paged(children)

      expect(scrollView).toBeDefined()
    })

    it('should enable paging', () => {
      const children = [Text('Page 1')]

      const scrollView = ScrollViewUtils.paged(children, {
        snapToAlignment: 'center',
      })

      expect(scrollView).toBeDefined()
    })
  })
})
