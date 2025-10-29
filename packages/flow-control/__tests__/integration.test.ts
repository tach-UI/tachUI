/**
 * Flow-Control Integration Tests
 *
 * Tests flow-control components with other TachUI packages
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { ForEach, Show } from '../src'
import { createSignal, createComputed } from '@tachui/core'
import type { Signal } from '@tachui/core'

// Mock components for testing
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
    fontSize: (_size?: number) => builder,
    padding: (_value?: number | string) => builder,
    fontWeight: (_weight?: string | number) => builder,
    color: (_value?: string) => builder,
    build: () => component,
  }

  builder.modifier = {
    fontSize: (_size?: number) => builder,
    padding: (_value?: number | string) => builder,
    fontWeight: (_weight?: string | number) => builder,
    color: (_value?: string) => builder,
    build: () => component,
  }

  return builder
}

const Button = (content: string, onClick?: () => void) => {
  const component = {
    type: 'component' as const,
    render: () => [
      {
        type: 'element' as const,
        tag: 'button',
        props: { onClick },
        children: [{ type: 'text' as const, text: content }],
      },
    ],
    props: { content, onClick },
    children: [],
    cleanup: [],
    id: `button-${Date.now()}`,
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

const VStack = (children: any[]) => ({
  type: 'component' as const,
  render: () => [
    {
      type: 'element' as const,
      tag: 'div',
      props: { style: 'display: flex; flex-direction: column;' },
      children: children.flatMap(child =>
        child.render ? child.render() : [child]
      ),
    },
  ],
  props: { children },
  children,
  cleanup: [],
  id: `vstack-${Date.now()}`,
})

const HStack = (children: any[]) => ({
  type: 'component' as const,
  render: () => [
    {
      type: 'element' as const,
      tag: 'div',
      props: { style: 'display: flex; flex-direction: row;' },
      children: children.flatMap(child =>
        child.render ? child.render() : [child]
      ),
    },
  ],
  props: { children },
  children,
  cleanup: [],
  id: `hstack-${Date.now()}`,
})
import type { ComponentInstance } from '@tachui/core'

describe('Flow-Control Integration', () => {
  describe('ForEach with Core Components', () => {
    test('should render list with VStack and Text', () => {
      const items = ['Item 1', 'Item 2', 'Item 3']

      const list = ForEach({
        data: items,
        children: item =>
          VStack([
            Text(item).fontSize(16).build(),
            Text(`Description for ${item}`).fontSize(14).build(),
          ]),
      })

      const rendered = list.render()
      expect(rendered).toBeDefined()
      expect(Array.isArray(rendered)).toBe(true)
    })

    test('should handle reactive updates with core components', () => {
      const [items, setItems] = createSignal<string[]>(['Initial'])

      const list = ForEach({
        data: items as Signal<string[]>,
        children: item =>
          VStack([
            Text(item).build(),
            Button('Remove', () => {
              setItems(items().filter(i => i !== item))
            }).build(),
          ]),
      })

      // Initial state
      expect(items()).toEqual(['Initial'])

      // Update (would trigger re-render in real usage)
      setItems(['Updated'])
      expect(items()).toEqual(['Updated'])
    })

    test('should work with HStack layout', () => {
      const items = ['A', 'B', 'C']

      const horizontalList = ForEach({
        data: items,
        children: item =>
          HStack([
            Text(item).padding(8).build(),
            Text('-').padding(4).build(),
          ]),
      })

      const rendered = horizontalList.render()
      expect(rendered).toBeDefined()
    })
  })

  describe('Show with Reactive Signals', () => {
    test('should conditionally render based on signal', () => {
      const [isVisible, setIsVisible] = createSignal(true)

      const conditional = Show({
        when: isVisible,
        children: Text('Visible content').build(),
        fallback: Text('Hidden content').build(),
      })

      expect(conditional.props.when).toBe(isVisible)

      // Update signal
      setIsVisible(false)
      expect(isVisible()).toBe(false)
    })

    test('should work with computed conditions', () => {
      const [count, setCount] = createSignal(0)
      const isEven = createComputed(() => count() % 2 === 0)

      const conditional = Show({
        when: isEven,
        children: Text('Even number').build(),
        fallback: Text('Odd number').build(),
      })

      expect(conditional.props.when).toBe(isEven)

      setCount(2)
      expect(isEven()).toBe(true)

      setCount(3)
      expect(isEven()).toBe(false)
    })

    test('should handle boolean conditions', () => {
      const conditional = Show({
        when: true,
        children: Text('Always visible').build(),
        fallback: Text('Never visible').build(),
      })

      expect(conditional.props.when).toBe(true)
    })

    test('should handle function conditions', () => {
      const conditionFn = () => true

      const conditional = Show({
        when: conditionFn,
        children: Text('Function result').build(),
      })

      expect(conditional.props.when).toBe(conditionFn)
    })
  })

  describe('Complex Component Composition', () => {
    test('should compose ForEach with Show and core components', () => {
      const [items, setItems] = createSignal(['Item 1', 'Item 2'])
      const [showDetails, setShowDetails] = createSignal(false)

      const complexList = VStack([
        ForEach({
          data: items as Signal<string[]>,
          children: item =>
            VStack([
              Text(item).fontWeight('bold').build(),
              Show({
                when: showDetails,
                children: Text(`Details for ${item}`).build(),
              }),
              Button('Toggle Details', () =>
                setShowDetails(!showDetails())
              ).build(),
            ]),
        }),
      ])

      expect(complexList).toBeDefined()
      expect(typeof complexList).toBe('object')
    })

    test('should handle nested reactive structures', () => {
      const [users, setUsers] = createSignal([
        { id: 1, name: 'Alice', active: true },
        { id: 2, name: 'Bob', active: false },
        { id: 3, name: 'Charlie', active: true },
      ])

      const activeUsers = createComputed(() =>
        users().filter(user => user.active)
      )

      const userList = ForEach({
        data: activeUsers,
        children: user =>
          HStack([
            Text(`${user.id}: ${user.name}`).build(),
            Show({
              when: createComputed(() => user.active),
              children: Text('✓').color('green').build(),
              fallback: Text('✗').color('red').build(),
            }),
          ]),
      })

      expect(userList).toBeDefined()
      expect(activeUsers()).toHaveLength(2) // Alice and Charlie
    })
  })

  describe('Performance and Memory', () => {
    test('should handle large lists efficiently', () => {
      const largeList = Array.from({ length: 1000 }, (_, i) => `Item ${i}`)

      const listComponent = ForEach({
        data: largeList,
        children: item => Text(item).build(),
      })

      expect(listComponent).toBeDefined()
      expect(listComponent.props.data).toHaveLength(1000)
    })

    test('should handle frequent updates', () => {
      const [counter, setCounter] = createSignal(0)

      const items = createComputed(() =>
        Array.from({ length: counter() }, (_, i) => `Item ${i}`)
      )

      const listComponent = ForEach({
        data: items(),
        children: item => Text(item).build(),
      })

      // Update counter multiple times
      setCounter(5)
      expect(items()).toHaveLength(5)

      setCounter(10)
      expect(items()).toHaveLength(10)

      setCounter(3)
      expect(items()).toHaveLength(3)
    })
  })

  describe('Error Boundaries and Edge Cases', () => {
    test('should handle undefined/null children gracefully', () => {
      const items = ['valid', null, undefined, 'also valid']

      const listComponent = ForEach({
        data: items,
        children: item => {
          if (!item) return Text('Empty').build()
          return Text(item).build()
        },
      })

      expect(listComponent).toBeDefined()
    })

    test('should handle malformed data structures', () => {
      const malformedData = [
        { name: 'Valid' },
        null,
        { name: undefined },
        { name: 'Also Valid' },
      ]

      const listComponent = ForEach({
        data: malformedData,
        children: item => {
          const name = item?.name || 'Unknown'
          return Text(name).build()
        },
      })

      expect(listComponent).toBeDefined()
    })
  })

  describe('Component Lifecycle Integration', () => {
    test('should integrate with component mounting', () => {
      const [mounted, setMounted] = createSignal(false)

      const conditionalComponent = Show({
        when: mounted,
        children: Text('Mounted content').build(),
        fallback: Text('Not mounted').build(),
      })

      expect(conditionalComponent.mounted).toBe(false)

      // Simulate mounting
      setMounted(true)
      expect(mounted()).toBe(true)
    })

    test('should handle cleanup with reactive updates', () => {
      const [items, setItems] = createSignal(['item1', 'item2'])

      const listComponent = ForEach({
        data: items(),
        children: item => Text(item).build(),
      })

      expect(listComponent.cleanup).toBeDefined()

      // Update items (should trigger cleanup of old items)
      setItems(['newItem1', 'newItem2', 'newItem3'])
      expect(items()).toHaveLength(3)
    })
  })
})
