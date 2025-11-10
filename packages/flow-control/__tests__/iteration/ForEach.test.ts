/**
 * ForEach Component Tests
 *
 * Tests for reactive list iteration component
 */

import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  ForEach,
  ForEachComponent,
  For,
  type ForEachProps,
} from '../../src/iteration/ForEach'
import { createSignal } from '@tachui/core'
import type { Signal, DOMNode } from '@tachui/core'

// Mock Text component for testing
const Text = (content: string) => {
  const component = {
    type: 'component' as const,
    render: () => [
      {
        type: 'element' as const,
        tag: 'span',
        props: {},
        children: [{ type: 'text' as const, text: content }],
      },
    ],
    props: { content },
    children: [],
    cleanup: [],
    id: `text-${Date.now()}`,
  }

  const builder: any = {
    ...component,
    build: () => component,
  }

  builder.modifier = {
    build: () => component,
  }

  return builder
}
import type { ComponentInstance } from '@tachui/core'

describe('ForEach Component', () => {
  let mockItems: string[]
  let mockComponent: ComponentInstance

  beforeEach(() => {
    mockItems = ['item1', 'item2', 'item3']
    mockComponent = Text('test').build()
  })

  describe('Basic Functionality', () => {
    test('should create ForEach component with static array', () => {
      const forEach = ForEach({
        data: mockItems,
        children: item => Text(item),
      })

      expect(forEach).toBeInstanceOf(ForEachComponent)
      expect(forEach.type).toBe('component')
      expect(forEach.props.data).toBe(mockItems)
    })

    test('should create ForEach component with reactive signal', () => {
      const [items, setItems] = createSignal(mockItems)
      const forEach = ForEach({
        data: items as Signal<string[]>,
        children: item => Text(item),
      })

      expect(forEach.props.data).toBe(items)
    })

    test('should render correct number of children', () => {
      const forEach = ForEach({
        data: mockItems,
        children: item => Text(item),
      })

      const rendered = forEach.render()
      expect(Array.isArray(rendered)).toBe(true)
      // Should render container + items
      expect((rendered as DOMNode[]).length).toBeGreaterThan(0)
    })

    test('should handle empty arrays', () => {
      const forEach = ForEach({
        data: [],
        children: item => Text(item),
      })

      const rendered = forEach.render()
      expect(Array.isArray(rendered)).toBe(true)
    })
  })

  describe('Reactive Updates', () => {
    test('should handle reactive data changes', () => {
      const [items, setItems] = createSignal(mockItems)
      const forEach = ForEach({
        data: items as Signal<string[]>,
        children: item => Text(item),
      })

      // Initial render
      const initialRender = forEach.render()

      // Update data
      setItems(['new1', 'new2'])

      // Component should handle reactive updates
      expect(forEach.props.data).toBe(items)
      expect(items()).toEqual(['new1', 'new2'])
    })

    test('should handle dynamic array changes', () => {
      const [items, setItems] = createSignal(['initial'])
      const forEach = ForEach({
        data: items as Signal<string[]>,
        children: item => Text(item),
      })

      // Add items
      setItems(['item1', 'item2', 'item3'])
      expect(items()).toHaveLength(3)

      // Remove items
      setItems(['item1'])
      expect(items()).toHaveLength(1)

      // Clear array
      setItems([])
      expect(items()).toHaveLength(0)
    })
  })

  describe('Key Functions', () => {
    test('should support custom key functions', () => {
      const items = [
        { id: 1, name: 'test1' },
        { id: 2, name: 'test2' },
      ]

      const forEach = ForEach({
        data: items,
        children: item => Text(item.name),
        getItemId: item => item.id,
      })

      expect(forEach.props.getItemId).toBeDefined()
      expect(typeof forEach.props.getItemId).toBe('function')
    })

    test('should use default key function when none provided', () => {
      const forEach = ForEach({
        data: mockItems,
        children: item => Text(item),
      })

      expect(forEach.props.getItemId).toBeUndefined()
    })

    test('should handle key function with index parameter', () => {
      const items = ['a', 'b', 'c']

      const forEach = ForEach({
        data: items,
        children: (item, index) => Text(`${item}-${index}`),
        getItemId: (item, index) => `item-${index}`,
      })

      expect(forEach.props.getItemId).toBeDefined()
    })
  })

  describe('Component Lifecycle', () => {
    test('should have proper cleanup functions', () => {
      const forEach = ForEach({
        data: mockItems,
        children: item => Text(item),
      })

      expect(forEach.cleanup).toBeDefined()
      expect(Array.isArray(forEach.cleanup)).toBe(true)
    })

    test('should initialize with mounted false', () => {
      const forEach = ForEach({
        data: mockItems,
        children: item => Text(item),
      })

      expect(forEach.mounted).toBe(false)
    })

    test('should have unique component ID', () => {
      const forEach1 = ForEach({
        data: mockItems,
        children: item => Text(item),
      })

      const forEach2 = ForEach({
        data: mockItems,
        children: item => Text(item),
      })

      expect(forEach1.id).toBeDefined()
      expect(forEach2.id).toBeDefined()
      expect(forEach1.id).not.toBe(forEach2.id)
    })
  })

  describe('Error Handling', () => {
    test('should handle null/undefined data gracefully', () => {
      const forEach = ForEach({
        data: null as any,
        children: item => Text(item || 'null'),
      })

      expect(forEach).toBeDefined()
      expect(forEach.props.data).toBeNull()
    })

    test('should handle children function errors', () => {
      const errorChildren = vi.fn(() => {
        throw new Error('Children function error')
      })

      const forEach = ForEach({
        data: mockItems,
        children: errorChildren,
      })

      // Should not throw during construction
      expect(forEach).toBeDefined()
      expect(errorChildren).not.toHaveBeenCalled() // Not called during construction
    })
  })
})

describe('For Component (SolidJS Compatibility)', () => {
  test('should create For component with SolidJS-style props', () => {
    const items = ['item1', 'item2']

    const forComponent = For({
      each: items,
      children: item => Text(item),
    })

    expect(forComponent).toBeInstanceOf(ForEachComponent)
    expect(forComponent.type).toBe('component')
  })

  test('should convert each prop to data prop', () => {
    const items = ['item1', 'item2']

    const forComponent = For({
      each: items,
      children: item => Text(item),
    })

    // Should internally convert to ForEach format
    expect(forComponent.props.data).toBe(items)
  })

  test('should handle fallback content', () => {
    const items: string[] = []
    const fallback = Text('No items')

    const forComponent = For({
      each: items,
      children: item => Text(item),
      fallback,
    })

    expect(forComponent.props.fallback).toBe(fallback)
  })

  test('should work with reactive signals', () => {
    const [items, setItems] = createSignal(['item1'])

    const forComponent = For({
      each: items as Signal<string[]>,
      children: item => Text(item),
    })

    expect(forComponent.props.data).toBe(items)

    // Update signal
    setItems(['item1', 'item2'])
    expect(items()).toEqual(['item1', 'item2'])
  })

  test('should support key prop', () => {
    const items = ['item1', 'item2']

    const forComponent = For({
      each: items,
      children: item => Text(item),
      key: 'test-key',
    })

    expect(forComponent.props.key).toBe('test-key')
  })

  test('should support ref prop', () => {
    const items = ['item1', 'item2']
    const mockRef = { current: null }

    const forComponent = For({
      each: items,
      children: item => Text(item),
      ref: mockRef,
    })

    expect(forComponent.props.ref).toBe(mockRef)
  })
})

describe('ForEach vs For Component Compatibility', () => {
  test('ForEach and For should produce equivalent results', () => {
    const items = ['test1', 'test2']
    const childrenFn = (item: string) => Text(item)

    const forEachComponent = ForEach({
      data: items,
      children: childrenFn,
    })

    const forComponent = For({
      each: items,
      children: childrenFn,
    })

    // Both should be ForEachComponent instances
    expect(forEachComponent).toBeInstanceOf(ForEachComponent)
    expect(forComponent).toBeInstanceOf(ForEachComponent)

    // Both should have same data
    expect(forEachComponent.props.data).toEqual(forComponent.props.data)
  })

  test('For should handle all ForEach props through conversion', () => {
    const items = [{ id: 1, name: 'test' }]
    const childrenFn = (item: any) => Text(item.name)
    const keyFn = (item: any) => item.id

    const forComponent = For({
      each: items,
      children: childrenFn,
      key: 'test-key',
    })

    expect(forComponent.props.data).toBe(items)
    expect(forComponent.props.key).toBe('test-key')
  })
})
