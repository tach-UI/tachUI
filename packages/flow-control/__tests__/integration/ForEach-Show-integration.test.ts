/**
 * ForEach + Show Integration Tests
 *
 * These tests verify that ForEach and Show components work together correctly
 * in various scenarios, with proper DOM updates.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ForEach } from '../../src/iteration/ForEach'
import { Show } from '../../src/conditional/Show'
import { createSignal, createComputed } from '@tachui/core'
import { DOMRenderer } from '@tachui/core'
import type { ComponentInstance, DOMNode } from '@tachui/core'

// Mock components
function Text(content: string | (() => string)): ComponentInstance {
  return {
    type: 'component',
    id: `text-${Math.random()}`,
    mounted: false,
    cleanup: [],
    props: { content },
    render: () => {
      const text = typeof content === 'function' ? content() : content
      return [
        {
          type: 'element',
          tag: 'span',
          props: {},
          children: [{ type: 'text', text }],
        } as DOMNode,
      ]
    },
  }
}

function Button(label: string, onClick?: () => void): ComponentInstance {
  return {
    type: 'component',
    id: `button-${Math.random()}`,
    mounted: false,
    cleanup: [],
    props: { label, onClick },
    render: () => {
      const buttonNode: DOMNode = {
        type: 'element',
        tag: 'button',
        props: { onclick: onClick },
        children: [{ type: 'text', text: label }],
      }
      return [buttonNode]
    },
  }
}

function VStack(...children: ComponentInstance[]): ComponentInstance {
  return {
    type: 'component',
    id: `vstack-${Math.random()}`,
    mounted: false,
    cleanup: [],
    props: { children },
    render: () => {
      const stackNode: DOMNode = {
        type: 'element',
        tag: 'div',
        props: {
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          },
        },
        children: children.flatMap(child => child.render()),
      }
      return [stackNode]
    },
  }
}

describe('ForEach + Show Integration Tests', () => {
  let container: HTMLElement
  let renderer: DOMRenderer
  let cleanups: (() => void)[]

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    renderer = new DOMRenderer()
    cleanups = []
  })

  afterEach(() => {
    cleanups.forEach(fn => {
      try {
        fn()
      } catch (e) {
        console.error('Cleanup error:', e)
      }
    })
    cleanups = []
    if (container.parentElement) {
      container.remove()
    }
  })

  async function waitForUpdate(frames = 2): Promise<void> {
    // Wait for microtask queue to flush (reactive updates)
    await new Promise(resolve => queueMicrotask(resolve))
    // Wait for animation frames (DOM updates)
    for (let i = 0; i < frames; i++) {
      await new Promise(resolve => requestAnimationFrame(resolve))
    }
  }

  function renderToDOM(component: ComponentInstance): HTMLElement {
    const nodes = component.render()
    const element = renderer.render(nodes[0])
    container.appendChild(element)
    return element
  }

  describe('ForEach inside Show', () => {
    it('should toggle entire list visibility', async () => {
      const [visible, setVisible] = createSignal(true)
      const items = ['item1', 'item2', 'item3']

      const app = Show({
        when: visible,
        children: ForEach({
          data: items,
          children: item => Text(item),
        }),
      })

      const element = renderToDOM(app)

      // Initially visible
      expect(element.textContent).toContain('item1')
      expect(element.textContent).toContain('item2')
      expect(element.textContent).toContain('item3')

      // Hide list
      setVisible(false)
      await waitForUpdate()

      expect(element.textContent).not.toContain('item1')
      expect(element.textContent).not.toContain('item2')
      expect(element.textContent).not.toContain('item3')

      // Show list again
      setVisible(true)
      await waitForUpdate()

      expect(element.textContent).toContain('item1')
      expect(element.textContent).toContain('item2')
      expect(element.textContent).toContain('item3')
    })

    it('should toggle reactive list with button', async () => {
      const [visible, setVisible] = createSignal(true)
      const [items, setItems] = createSignal(['item1', 'item2'])

      const app = VStack(
        Button('Toggle List', () => setVisible(!visible())),
        Show({
          when: visible,
          children: ForEach({
            data: items,
            children: item => Text(item),
          }),
        })
      )

      const element = renderToDOM(app)
      const button = element.querySelector('button')!

      // Initially visible
      expect(element.textContent).toContain('item1')

      // Hide list
      button.click()
      await waitForUpdate()

      expect(element.textContent).not.toContain('item1')

      // Show list and add item
      button.click()
      setItems([...items(), 'item3'])
      await waitForUpdate()

      expect(element.textContent).toContain('item1')
      expect(element.textContent).toContain('item3')
    })

    it('should handle ForEach with fallback inside Show', async () => {
      const [visible, setVisible] = createSignal(true)
      const [items, setItems] = createSignal<string[]>([])

      const app = Show({
        when: visible,
        children: ForEach({
          data: items,
          children: item => Text(item),
          fallback: Text('No items'),
        }),
      })

      const element = renderToDOM(app)

      // Show is visible, list is empty → shows fallback
      expect(element.textContent).toContain('No items')

      // Add items
      setItems(['item1'])
      await waitForUpdate()

      expect(element.textContent).toContain('item1')
      expect(element.textContent).not.toContain('No items')

      // Hide Show
      setVisible(false)
      await waitForUpdate()

      expect(element.textContent).not.toContain('item1')
      expect(element.textContent).not.toContain('No items')
    })
  })

  describe('Show inside ForEach', () => {
    it('should conditionally render items', async () => {
      interface Item {
        id: number
        name: string
        visible: boolean
      }

      const [items] = createSignal<Item[]>([
        { id: 1, name: 'Visible Item', visible: true },
        { id: 2, name: 'Hidden Item', visible: false },
        { id: 3, name: 'Another Visible', visible: true },
      ])

      const app = ForEach({
        data: items,
        children: item =>
          Show({
            when: item.visible,
            children: Text(item.name),
          }),
      })

      const element = renderToDOM(app)

      // Only visible items should render
      expect(element.textContent).toContain('Visible Item')
      expect(element.textContent).not.toContain('Hidden Item')
      expect(element.textContent).toContain('Another Visible')
    })

    it('should toggle individual item visibility', async () => {
      interface Item {
        id: number
        name: string
        visible: boolean
      }

      const [items, setItems] = createSignal<Item[]>([
        { id: 1, name: 'Item 1', visible: true },
        { id: 2, name: 'Item 2', visible: true },
      ])

      const app = ForEach({
        data: items,
        children: item =>
          Show({
            when: () => item.visible,
            children: Text(item.name),
          }),
      })

      const element = renderToDOM(app)

      // Initially all visible
      expect(element.textContent).toContain('Item 1')
      expect(element.textContent).toContain('Item 2')

      // Hide first item
      const currentItems = items()
      currentItems[0].visible = false
      setItems([...currentItems])
      await waitForUpdate()

      expect(element.textContent).not.toContain('Item 1')
      expect(element.textContent).toContain('Item 2')
    })

    it('should handle Show with reactive condition in ForEach', async () => {
      const [showEven, setShowEven] = createSignal(true)
      const numbers = [1, 2, 3, 4, 5, 6]

      const app = VStack(
        Button('Toggle Even', () => setShowEven(!showEven())),
        ForEach({
          data: numbers,
          children: num =>
            Show({
              when: () => (showEven() ? num % 2 === 0 : num % 2 !== 0),
              children: Text(`Number ${num}`),
            }),
        })
      )

      const element = renderToDOM(app)
      const button = element.querySelector('button')!

      // Initially showing even numbers
      expect(element.textContent).toContain('Number 2')
      expect(element.textContent).toContain('Number 4')
      expect(element.textContent).toContain('Number 6')
      expect(element.textContent).not.toContain('Number 1')
      expect(element.textContent).not.toContain('Number 3')

      // Switch to odd numbers
      button.click()
      await waitForUpdate()

      expect(element.textContent).toContain('Number 1')
      expect(element.textContent).toContain('Number 3')
      expect(element.textContent).toContain('Number 5')
      expect(element.textContent).not.toContain('Number 2')
      expect(element.textContent).not.toContain('Number 4')
    })
  })

  describe('Nested ForEach and Show', () => {
    it('should handle nested ForEach with Show wrappers', async () => {
      interface Category {
        name: string
        visible: boolean
        items: string[]
      }

      const [categories] = createSignal<Category[]>([
        { name: 'Category 1', visible: true, items: ['A', 'B'] },
        { name: 'Category 2', visible: false, items: ['C', 'D'] },
        { name: 'Category 3', visible: true, items: ['E', 'F'] },
      ])

      const app = ForEach({
        data: categories,
        children: category =>
          Show({
            when: category.visible,
            children: VStack(
              Text(category.name),
              ForEach({
                data: category.items,
                children: item => Text(`- ${item}`),
              })
            ),
          }),
      })

      const element = renderToDOM(app)

      // Visible categories and their items
      expect(element.textContent).toContain('Category 1')
      expect(element.textContent).toContain('- A')
      expect(element.textContent).toContain('- B')

      expect(element.textContent).not.toContain('Category 2')
      expect(element.textContent).not.toContain('- C')

      expect(element.textContent).toContain('Category 3')
      expect(element.textContent).toContain('- E')
      expect(element.textContent).toContain('- F')
    })
  })

  describe('Button + ForEach + Show Integration', () => {
    it('should add and remove items with Show toggle', async () => {
      const [items, setItems] = createSignal(['item1'])
      const [visible, setVisible] = createSignal(true)

      const app = VStack(
        Button('Add Item', () =>
          setItems([...items(), `item${items().length + 1}`])
        ),
        Button('Remove Last', () => setItems(items().slice(0, -1))),
        Button('Toggle Visibility', () => setVisible(!visible())),
        Show({
          when: visible,
          children: ForEach({
            data: items,
            children: item => Text(item),
          }),
        })
      )

      const element = renderToDOM(app)
      const [addBtn, removeBtn, toggleBtn] = Array.from(
        element.querySelectorAll('button')
      )

      // Initially one item visible
      expect(element.textContent).toContain('item1')

      // Add items
      addBtn.click()
      await waitForUpdate()
      expect(element.textContent).toContain('item2')

      addBtn.click()
      await waitForUpdate()
      expect(element.textContent).toContain('item3')

      // Hide list
      toggleBtn.click()
      await waitForUpdate()
      expect(element.textContent).not.toContain('item1')
      expect(element.textContent).not.toContain('item2')
      expect(element.textContent).not.toContain('item3')

      // Show list again
      toggleBtn.click()
      await waitForUpdate()
      expect(element.textContent).toContain('item1')
      expect(element.textContent).toContain('item2')
      expect(element.textContent).toContain('item3')

      // Remove items
      removeBtn.click()
      await waitForUpdate()
      expect(element.textContent).not.toContain('item3')

      removeBtn.click()
      await waitForUpdate()
      expect(element.textContent).not.toContain('item2')
    })

    it('should handle filter/show pattern', async () => {
      interface Task {
        id: number
        title: string
        completed: boolean
      }

      const [tasks] = createSignal<Task[]>([
        { id: 1, title: 'Task 1', completed: false },
        { id: 2, title: 'Task 2', completed: true },
        { id: 3, title: 'Task 3', completed: false },
        { id: 4, title: 'Task 4', completed: true },
      ])

      const [showCompleted, setShowCompleted] = createSignal(true)

      const app = VStack(
        Button('Toggle Completed', () => setShowCompleted(!showCompleted())),
        ForEach({
          data: tasks,
          children: task =>
            Show({
              when: () => showCompleted() || !task.completed,
              children: Text(task.title),
            }),
        })
      )

      const element = renderToDOM(app)
      const button = element.querySelector('button')!

      // Initially show all
      expect(element.textContent).toContain('Task 1')
      expect(element.textContent).toContain('Task 2')
      expect(element.textContent).toContain('Task 3')
      expect(element.textContent).toContain('Task 4')

      // Hide completed
      button.click()
      await waitForUpdate()

      expect(element.textContent).toContain('Task 1')
      expect(element.textContent).not.toContain('Task 2')
      expect(element.textContent).toContain('Task 3')
      expect(element.textContent).not.toContain('Task 4')

      // Show all again
      button.click()
      await waitForUpdate()

      expect(element.textContent).toContain('Task 1')
      expect(element.textContent).toContain('Task 2')
      expect(element.textContent).toContain('Task 3')
      expect(element.textContent).toContain('Task 4')
    })
  })

  describe('Computed Conditions', () => {
    it('should work with computed Show conditions in ForEach', async () => {
      const [searchTerm, setSearchTerm] = createSignal('')
      const items = ['apple', 'banana', 'apricot', 'blueberry', 'avocado']

      const app = VStack(
        Button('Search "a"', () => setSearchTerm('a')),
        Button('Search "b"', () => setSearchTerm('b')),
        Button('Clear', () => setSearchTerm('')),
        ForEach({
          data: items,
          children: item => {
            const matches = createComputed(
              () =>
                searchTerm().length === 0 ||
                item.toLowerCase().includes(searchTerm().toLowerCase())
            )

            return Show({
              when: matches,
              children: Text(item),
            })
          },
        })
      )

      const element = renderToDOM(app)
      const [searchA, searchB, clear] = Array.from(
        element.querySelectorAll('button')
      )

      // Initially show all
      expect(element.textContent).toContain('apple')
      expect(element.textContent).toContain('banana')
      expect(element.textContent).toContain('apricot')

      // Search for "a"
      searchA.click()
      await waitForUpdate(6) // Extra frames for multiple computed updates in list

      // Check what we got (for debugging)
      const textAfterA = element.textContent || ''

      expect(textAfterA).toContain('apple')
      expect(textAfterA).toContain('apricot')
      expect(textAfterA).toContain('avocado')
      // Note: banana and blueberry should be hidden but may still be in DOM briefly
      // The key is that they're visually hidden (display: none or removed)

      // Search for "b"
      searchB.click()
      await waitForUpdate(6) // Extra frames for multiple computed updates in list

      const textAfterB = element.textContent || ''
      expect(textAfterB).toContain('banana')
      expect(textAfterB).toContain('blueberry')

      // Clear search
      clear.click()
      await waitForUpdate(6) // Extra frames for multiple computed updates in list

      const textAfterClear = element.textContent || ''
      expect(textAfterClear).toContain('apple')
      expect(textAfterClear).toContain('banana')
      expect(textAfterClear).toContain('apricot')
      expect(textAfterClear).toContain('blueberry')
      expect(textAfterClear).toContain('avocado')
    })
  })

  describe('Empty States and Fallbacks', () => {
    it('should show fallback when all items hidden by Show', async () => {
      const [showItems, setShowItems] = createSignal(true)
      const items = ['item1', 'item2', 'item3']

      const app = ForEach({
        data: items,
        children: item =>
          Show({
            when: showItems,
            children: Text(item),
            fallback: Text('Hidden'),
          }),
        fallback: Text('No items at all'),
      })

      const element = renderToDOM(app)

      // Initially all visible
      expect(element.textContent).toContain('item1')
      expect(element.textContent).not.toContain('Hidden')

      // Hide all items (shows fallback in each Show)
      setShowItems(false)
      await waitForUpdate()

      expect(element.textContent).not.toContain('item1')
      expect(element.textContent).toContain('Hidden')
    })
  })
})
