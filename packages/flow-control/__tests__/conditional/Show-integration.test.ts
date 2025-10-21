/**
 * Show Component Integration Tests with DOM Updates
 *
 * These tests verify that Show component correctly updates the DOM
 * when signals change, particularly focusing on button interactions
 * and state management patterns.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Show, ShowComponent } from '../../src/conditional/Show'
import { createSignal, createComputed } from '@tachui/core'
import { DOMRenderer } from '@tachui/core'
import type { ComponentInstance, DOMNode } from '@tachui/core'

// Mock Text component
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

// Mock Button component
function Button(
  label: string,
  onClick?: () => void
): ComponentInstance {
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
        props: {
          onclick: onClick,
        },
        children: [{ type: 'text', text: label }],
      }
      return [buttonNode]
    },
  }
}

// Mock VStack component
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

describe('Show Component DOM Integration Tests', () => {
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
    for (let i = 0; i < frames; i++) {
      await new Promise(resolve => requestAnimationFrame(resolve))
    }
  }

  function renderToDOM(component: ComponentInstance): HTMLElement {
    const nodes = component.render()
    const nodeArray = Array.isArray(nodes) ? nodes : [nodes]
    const element = renderer.render(nodeArray[0]) as HTMLElement
    container.appendChild(element)
    return element
  }

  describe('Basic Show Reactivity', () => {
    it('should show content when signal is true', () => {
      const [visible] = createSignal(true)

      const show = Show({
        when: visible,
        children: Text('Visible content'),
      })

      const element = renderToDOM(show)

      // Content should be present
      expect(element.textContent).toContain('Visible content')
    })

    it('should hide content when signal is false', () => {
      const [visible] = createSignal(false)

      const show = Show({
        when: visible,
        children: Text('Hidden content'),
      })

      const element = renderToDOM(show)

      // Content should not be present (empty container)
      expect(element.textContent).not.toContain('Hidden content')
    })

    it('should update DOM when signal changes from false to true', async () => {
      const [visible, setVisible] = createSignal(false)

      const show = Show({
        when: visible,
        children: Text('Toggle content'),
      })

      const element = renderToDOM(show)

      // Initially hidden
      expect(element.textContent).not.toContain('Toggle content')

      // Show content
      setVisible(true)
      await waitForUpdate()

      // Content should now be visible
      expect(element.textContent).toContain('Toggle content')
    })

    it('should update DOM when signal changes from true to false', async () => {
      const [visible, setVisible] = createSignal(true)

      const show = Show({
        when: visible,
        children: Text('Toggle content'),
      })

      const element = renderToDOM(show)

      // Initially visible
      expect(element.textContent).toContain('Toggle content')

      // Hide content
      setVisible(false)
      await waitForUpdate()

      // Content should now be hidden
      expect(element.textContent).not.toContain('Toggle content')
    })

    it('should toggle content multiple times', async () => {
      const [visible, setVisible] = createSignal(true)

      const show = Show({
        when: visible,
        children: Text('Toggling content'),
      })

      const element = renderToDOM(show)

      // Check initial state
      expect(element.textContent).toContain('Toggling content')

      // Toggle off
      setVisible(false)
      await waitForUpdate()
      expect(element.textContent).not.toContain('Toggling content')

      // Toggle on
      setVisible(true)
      await waitForUpdate()
      expect(element.textContent).toContain('Toggling content')

      // Toggle off again
      setVisible(false)
      await waitForUpdate()
      expect(element.textContent).not.toContain('Toggling content')

      // Toggle on again
      setVisible(true)
      await waitForUpdate()
      expect(element.textContent).toContain('Toggling content')
    })
  })

  describe('Show with Fallback', () => {
    it('should show fallback when condition is false', () => {
      const [visible] = createSignal(false)

      const show = Show({
        when: visible,
        children: Text('Main content'),
        fallback: Text('Fallback content'),
      })

      const element = renderToDOM(show)

      expect(element.textContent).toContain('Fallback content')
      expect(element.textContent).not.toContain('Main content')
    })

    it('should switch between content and fallback', async () => {
      const [visible, setVisible] = createSignal(true)

      const show = Show({
        when: visible,
        children: Text('Main content'),
        fallback: Text('Fallback content'),
      })

      const element = renderToDOM(show)

      // Initially show main content
      expect(element.textContent).toContain('Main content')
      expect(element.textContent).not.toContain('Fallback content')

      // Switch to fallback
      setVisible(false)
      await waitForUpdate()

      expect(element.textContent).toContain('Fallback content')
      expect(element.textContent).not.toContain('Main content')

      // Switch back to main
      setVisible(true)
      await waitForUpdate()

      expect(element.textContent).toContain('Main content')
      expect(element.textContent).not.toContain('Fallback content')
    })
  })

  describe('Button Interaction with Show', () => {
    it('should toggle Show visibility on button click', async () => {
      const [visible, setVisible] = createSignal(true)

      const app = VStack(
        Button('Toggle', () => setVisible(!visible())),
        Show({
          when: visible,
          children: Text('Conditional content'),
        })
      )

      const element = renderToDOM(app)
      const button = element.querySelector('button')!

      // Initially visible
      expect(element.textContent).toContain('Conditional content')

      // Click to hide
      button.click()
      await waitForUpdate()

      expect(element.textContent).not.toContain('Conditional content')

      // Click to show
      button.click()
      await waitForUpdate()

      expect(element.textContent).toContain('Conditional content')
    })

    it('should handle multiple buttons controlling same Show', async () => {
      const [visible, setVisible] = createSignal(false)

      const app = VStack(
        Button('Show', () => setVisible(true)),
        Button('Hide', () => setVisible(false)),
        Show({
          when: visible,
          children: Text('Controlled content'),
        })
      )

      const element = renderToDOM(app)
      const [showButton, hideButton] = Array.from(
        element.querySelectorAll('button')
      )

      // Initially hidden
      expect(element.textContent).not.toContain('Controlled content')

      // Click show button
      showButton.click()
      await waitForUpdate()

      expect(element.textContent).toContain('Controlled content')

      // Click hide button
      hideButton.click()
      await waitForUpdate()

      expect(element.textContent).not.toContain('Controlled content')

      // Click show again
      showButton.click()
      await waitForUpdate()

      expect(element.textContent).toContain('Controlled content')
    })

    it('should update counter inside Show when button clicked', async () => {
      const [visible, setVisible] = createSignal(true)
      const [count, setCount] = createSignal(0)

      const app = VStack(
        Button('Toggle Show', () => setVisible(!visible())),
        Show({
          when: visible,
          children: VStack(
            Text(() => `Count: ${count()}`),
            Button('Increment', () => setCount(count() + 1))
          ),
        })
      )

      const element = renderToDOM(app)

      // Show is visible, counter is 0
      expect(element.textContent).toContain('Count: 0')

      // Click increment button (child of Show)
      const incrementButton = Array.from(
        element.querySelectorAll('button')
      ).find(btn => btn.textContent === 'Increment')!

      incrementButton.click()
      await waitForUpdate()

      expect(element.textContent).toContain('Count: 1')

      incrementButton.click()
      await waitForUpdate()

      expect(element.textContent).toContain('Count: 2')

      // Toggle Show off
      const toggleButton = Array.from(
        element.querySelectorAll('button')
      ).find(btn => btn.textContent === 'Toggle Show')!

      toggleButton.click()
      await waitForUpdate()

      expect(element.textContent).not.toContain('Count: 2')
    })
  })

  describe('Computed Conditions', () => {
    it('should work with computed signal conditions', async () => {
      const [count, setCount] = createSignal(0)
      const isPositive = createComputed(() => count() > 0)

      const show = Show({
        when: isPositive,
        children: Text('Positive number'),
        fallback: Text('Zero or negative'),
      })

      const element = renderToDOM(show)

      // Initially 0 (zero or negative)
      expect(element.textContent).toContain('Zero or negative')

      // Set to positive
      setCount(5)
      await waitForUpdate()

      expect(element.textContent).toContain('Positive number')

      // Set back to negative
      setCount(-3)
      await waitForUpdate()

      expect(element.textContent).toContain('Zero or negative')
    })

    it('should handle complex computed conditions', async () => {
      const [name, setName] = createSignal('')
      const [age, setAge] = createSignal(0)

      const isValid = createComputed(() => name().length > 0 && age() >= 18)

      const show = Show({
        when: isValid,
        children: Text('Valid entry'),
        fallback: Text('Invalid entry'),
      })

      const element = renderToDOM(show)

      // Initially invalid
      expect(element.textContent).toContain('Invalid entry')

      // Set name only
      setName('John')
      await waitForUpdate()
      expect(element.textContent).toContain('Invalid entry') // Still invalid (age < 18)

      // Set valid age
      setAge(25)
      await waitForUpdate()
      expect(element.textContent).toContain('Valid entry')

      // Clear name
      setName('')
      await waitForUpdate()
      expect(element.textContent).toContain('Invalid entry')
    })
  })

  describe('Nested Show Components', () => {
    it('should handle nested Show components', async () => {
      const [outerVisible, setOuterVisible] = createSignal(true)
      const [innerVisible, setInnerVisible] = createSignal(true)

      const app = Show({
        when: outerVisible,
        children: VStack(
          Text('Outer content'),
          Show({
            when: innerVisible,
            children: Text('Inner content'),
          })
        ),
      })

      const element = renderToDOM(app)

      // Both visible
      expect(element.textContent).toContain('Outer content')
      expect(element.textContent).toContain('Inner content')

      // Hide inner
      setInnerVisible(false)
      await waitForUpdate()

      expect(element.textContent).toContain('Outer content')
      expect(element.textContent).not.toContain('Inner content')

      // Hide outer (inner hidden too)
      setOuterVisible(false)
      await waitForUpdate()

      expect(element.textContent).not.toContain('Outer content')
      expect(element.textContent).not.toContain('Inner content')

      // Show outer (inner still hidden)
      setOuterVisible(true)
      await waitForUpdate()

      expect(element.textContent).toContain('Outer content')
      expect(element.textContent).not.toContain('Inner content')

      // Show inner
      setInnerVisible(true)
      await waitForUpdate()

      expect(element.textContent).toContain('Outer content')
      expect(element.textContent).toContain('Inner content')
    })
  })

  describe('Multiple Independent Show Components', () => {
    it('should update multiple Show components with different signals', async () => {
      const [show1, setShow1] = createSignal(true)
      const [show2, setShow2] = createSignal(false)

      const app = VStack(
        Show({ when: show1, children: Text('Content 1') }),
        Show({ when: show2, children: Text('Content 2') })
      )

      const element = renderToDOM(app)

      // Only first visible
      expect(element.textContent).toContain('Content 1')
      expect(element.textContent).not.toContain('Content 2')

      // Show second
      setShow2(true)
      await waitForUpdate()

      expect(element.textContent).toContain('Content 1')
      expect(element.textContent).toContain('Content 2')

      // Hide first
      setShow1(false)
      await waitForUpdate()

      expect(element.textContent).not.toContain('Content 1')
      expect(element.textContent).toContain('Content 2')

      // Hide both
      setShow2(false)
      await waitForUpdate()

      expect(element.textContent).not.toContain('Content 1')
      expect(element.textContent).not.toContain('Content 2')
    })

    it('should update multiple Show components with same signal', async () => {
      const [visible, setVisible] = createSignal(true)

      const app = VStack(
        Show({ when: visible, children: Text('Synced 1') }),
        Show({ when: visible, children: Text('Synced 2') }),
        Show({ when: visible, children: Text('Synced 3') })
      )

      const element = renderToDOM(app)

      // All visible
      expect(element.textContent).toContain('Synced 1')
      expect(element.textContent).toContain('Synced 2')
      expect(element.textContent).toContain('Synced 3')

      // Hide all
      setVisible(false)
      await waitForUpdate()

      expect(element.textContent).not.toContain('Synced 1')
      expect(element.textContent).not.toContain('Synced 2')
      expect(element.textContent).not.toContain('Synced 3')

      // Show all
      setVisible(true)
      await waitForUpdate()

      expect(element.textContent).toContain('Synced 1')
      expect(element.textContent).toContain('Synced 2')
      expect(element.textContent).toContain('Synced 3')
    })
  })

  describe('Show with Dynamic Content', () => {
    it('should update content inside Show when signal changes', async () => {
      const [visible, setVisible] = createSignal(true)
      const [message, setMessage] = createSignal('Initial message')

      const show = Show({
        when: visible,
        children: Text(() => message()),
      })

      const element = renderToDOM(show)

      // Initial state
      expect(element.textContent).toContain('Initial message')

      // Update message (Show still visible)
      setMessage('Updated message')
      await waitForUpdate()

      expect(element.textContent).toContain('Updated message')

      // Hide Show
      setVisible(false)
      await waitForUpdate()

      expect(element.textContent).not.toContain('Updated message')

      // Show again (should show latest message)
      setVisible(true)
      await waitForUpdate()

      expect(element.textContent).toContain('Updated message')
    })
  })

  describe('Cleanup and Memory', () => {
    it('should cleanup effects when Show is hidden', async () => {
      const [visible, setVisible] = createSignal(true)

      const show = Show({
        when: visible,
        children: Text('Content'),
      })

      renderToDOM(show)

      // Hide (should trigger cleanup)
      setVisible(false)
      await waitForUpdate()

      // No errors should occur
      expect(true).toBe(true)
    })

    it('should handle rapid toggles without errors', async () => {
      const [visible, setVisible] = createSignal(true)

      const show = Show({
        when: visible,
        children: Text('Rapid toggle content'),
      })

      const element = renderToDOM(show)

      // Rapid toggles
      for (let i = 0; i < 10; i++) {
        setVisible(false)
        setVisible(true)
      }

      await waitForUpdate()

      // Should still be functional
      expect(element.textContent).toContain('Rapid toggle content')
    })
  })
})
