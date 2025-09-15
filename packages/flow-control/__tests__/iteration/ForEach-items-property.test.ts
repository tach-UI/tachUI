/**
 * ForEach Component - Items Property Test
 * 
 * Tests the backward compatibility support for the `items` property
 * as mentioned in the calculator tape bug report.
 */

import { describe, expect, test } from 'vitest'
import { ForEach } from '../../src/iteration/ForEach'
import { createSignal } from '@tachui/core'
import type { Signal } from '@tachui/core'

// Mock Text component for testing
const Text = (content: string) => ({
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
})

describe('ForEach Component - Items Property Support', () => {
  test('should support items property with static array', () => {
    const items = ['item1', 'item2', 'item3']
    
    const forEach = ForEach({
      items: items,
      children: item => Text(item),
    })

    expect(forEach).toBeDefined()
    expect(forEach.props.data).toBe(items)
  })

  test('should support items property with reactive signal', () => {
    const [items, setItems] = createSignal(['reactive1', 'reactive2'])
    
    const forEach = ForEach({
      items: items as Signal<string[]>,
      children: item => Text(item),
    })

    expect(forEach).toBeDefined()
    expect(forEach.props.data).toBe(items)
    
    // Test reactivity
    setItems(['updated1', 'updated2', 'updated3'])
    expect(items()).toEqual(['updated1', 'updated2', 'updated3'])
  })

  test('should prefer data property over items property when both provided', () => {
    const dataArray = ['data1', 'data2']
    const itemsArray = ['items1', 'items2']
    
    const forEach = ForEach({
      data: dataArray,
      items: itemsArray,
      children: item => Text(item),
    })

    expect(forEach.props.data).toBe(dataArray)
    expect(forEach.props.data).not.toBe(itemsArray)
  })

  test('should render correctly with items property', () => {
    const items = ['test1', 'test2']
    
    const forEach = ForEach({
      items: items,
      children: item => Text(item),
    })

    const rendered = forEach.render()
    expect(Array.isArray(rendered)).toBe(true)
    expect(rendered.length).toBeGreaterThan(0)
  })

  test('should handle empty items array', () => {
    const forEach = ForEach({
      items: [],
      children: item => Text(item),
    })

    expect(forEach).toBeDefined()
    expect(forEach.props.data).toEqual([])
  })

  test('should throw error when neither data nor items provided', () => {
    expect(() => {
      ForEach({
        children: item => Text(item),
      } as any)
    }).toThrow('ForEach component requires either "data" or "items" property')
  })

  test('should support items property with complex objects', () => {
    const items = [
      { id: 1, name: 'First' },
      { id: 2, name: 'Second' },
    ]
    
    const forEach = ForEach({
      items: items,
      children: item => Text(item.name),
      getItemId: item => item.id,
    })

    expect(forEach).toBeDefined()
    expect(forEach.props.data).toBe(items)
    expect(forEach.props.getItemId).toBeDefined()
  })
})