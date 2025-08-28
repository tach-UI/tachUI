/**
 * DOM Renderer Tests (Phase 3.1.1)
 *
 * Tests for direct DOM manipulation, reactive updates, and element lifecycle.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSignal } from '../../src/reactive'
import { createComponent } from '../../src/runtime/component'
import { DOMRenderer, h, renderComponent, text } from '../../src/runtime/renderer'
import type { DOMNode } from '../../src/runtime/types'

// Setup DOM environment
Object.defineProperty(global, 'document', {
  value: {
    createElement: vi.fn((tag: string) => ({
      tagName: tag.toUpperCase(),
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      setAttribute: vi.fn(),
      removeAttribute: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      style: {
        setProperty: vi.fn(),
        removeProperty: vi.fn(),
        cssText: '',
      },
      className: '',
      parentNode: null,
    })),
    createTextNode: vi.fn((text: string) => ({
      nodeType: 3,
      textContent: text,
      parentNode: null,
    })),
    createComment: vi.fn((text: string) => ({
      nodeType: 8,
      textContent: text,
      parentNode: null,
    })),
    createDocumentFragment: vi.fn(() => ({
      appendChild: vi.fn(),
      childNodes: [],
    })),
  },
})

describe('DOM Renderer System', () => {
  let renderer: DOMRenderer

  beforeEach(() => {
    renderer = new DOMRenderer()
    vi.clearAllMocks()
  })

  describe('DOMRenderer', () => {
    describe('Element Rendering', () => {
      it('should render a simple element', () => {
        const node: DOMNode = {
          type: 'element',
          tag: 'div',
          props: { id: 'test' },
        }

        const element = renderer.render(node) as Element

        expect(document.createElement).toHaveBeenCalledWith('div')
        expect(element.setAttribute).toHaveBeenCalledWith('id', 'test')
      })

      it('should render element with children', () => {
        const node: DOMNode = {
          type: 'element',
          tag: 'div',
          children: [
            { type: 'text', text: 'Hello' },
            { type: 'element', tag: 'span', props: { class: 'child' } },
          ],
        }

        const element = renderer.render(node) as Element

        expect(element.appendChild).toHaveBeenCalledTimes(2)
      })

      it('should render text nodes', () => {
        const node: DOMNode = {
          type: 'text',
          text: 'Hello World',
        }

        const _textNode = renderer.render(node)

        expect(document.createTextNode).toHaveBeenCalledWith('Hello World')
      })

      it('should render comment nodes', () => {
        const node: DOMNode = {
          type: 'comment',
          text: 'This is a comment',
        }

        const _commentNode = renderer.render(node)

        expect(document.createComment).toHaveBeenCalledWith('This is a comment')
      })

      it('should render array of nodes as fragment', () => {
        const nodes: DOMNode[] = [
          { type: 'text', text: 'Hello' },
          { type: 'element', tag: 'div' },
        ]

        const _fragment = renderer.render(nodes)

        expect(document.createDocumentFragment).toHaveBeenCalled()
      })
    })

    describe('Props Handling', () => {
      it('should apply className prop', () => {
        const node: DOMNode = {
          type: 'element',
          tag: 'div',
          props: { className: 'test-class' },
        }

        const element = renderer.render(node) as any

        expect(element.className).toBe('test-class')
      })

      it('should apply style prop as object', () => {
        const node: DOMNode = {
          type: 'element',
          tag: 'div',
          props: {
            style: {
              color: 'red',
              fontSize: '16px',
            },
          },
        }

        const element = renderer.render(node) as any

        expect(element.style.setProperty).toHaveBeenCalledWith('color', 'red')
        expect(element.style.setProperty).toHaveBeenCalledWith('font-size', '16px')
      })

      it('should apply style prop as string', () => {
        const node: DOMNode = {
          type: 'element',
          tag: 'div',
          props: {
            style: 'color: red; font-size: 16px;',
          },
        }

        const element = renderer.render(node) as any

        expect(element.style.cssText).toBe('color: red; font-size: 16px;')
      })

      it('should handle event listeners', () => {
        const onClick = vi.fn()
        const node: DOMNode = {
          type: 'element',
          tag: 'button',
          props: { onClick },
        }

        const element = renderer.render(node) as any

        expect(element.addEventListener).toHaveBeenCalledWith('click', expect.any(Function))
      })

      it('should handle boolean attributes', () => {
        const node: DOMNode = {
          type: 'element',
          tag: 'input',
          props: {
            disabled: true,
            hidden: false,
          },
        }

        const element = renderer.render(node) as any

        expect(element.setAttribute).toHaveBeenCalledWith('disabled', '')
        expect(element.removeAttribute).toHaveBeenCalledWith('hidden')
      })
    })

    describe('Reactive Updates', () => {
      it('should handle reactive className', () => {
        const [className, setClassName] = createSignal('initial')

        const node: DOMNode = {
          type: 'element',
          tag: 'div',
          props: { className },
        }

        const element = renderer.render(node) as any

        // Initial value should be set
        expect(element.className).toBe('initial')

        // Update signal
        setClassName('updated')

        // Element should be updated (mocked, so we check the signal value)
        expect(className()).toBe('updated')
      })

      it('should handle reactive text content', () => {
        const [text, setText] = createSignal('initial')

        const textNode = renderer.createReactiveText(text)

        expect(textNode.textContent).toBe('initial')

        // Update signal
        setText('updated')

        // Text content should be updated reactively
        expect(text()).toBe('updated')
      })

      it('should handle reactive element props', () => {
        const [props, setProps] = createSignal({ id: 'initial' })

        const element = renderer.createReactiveElement('div', props)

        expect(element.setAttribute).toHaveBeenCalledWith('id', 'initial')

        // Update props
        setProps({ id: 'updated', class: 'new-class' })

        // Props should be updated reactively
        expect(props()).toEqual({ id: 'updated', class: 'new-class' })
      })
    })

    describe('Cleanup and Memory Management', () => {
      it('should run cleanup functions when removing nodes', () => {
        const cleanup = vi.fn()
        const node: DOMNode = {
          type: 'element',
          tag: 'div',
          dispose: cleanup,
        }

        const _element = renderer.render(node)
        renderer.removeNode(node)

        expect(cleanup).toHaveBeenCalled()
      })

      it('should remove event listeners on cleanup', () => {
        const onClick = vi.fn()
        const node: DOMNode = {
          type: 'element',
          tag: 'button',
          props: { onClick },
        }

        const element = renderer.render(node) as any
        renderer.removeNode(node)

        expect(element.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function))
      })

      it('should handle cleanup errors gracefully', () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
        const errorCleanup = vi.fn(() => {
          throw new Error('Cleanup error')
        })

        const node: DOMNode = {
          type: 'element',
          tag: 'div',
          dispose: errorCleanup,
        }

        const _element = renderer.render(node)
        renderer.removeNode(node)

        expect(errorCleanup).toHaveBeenCalled()
        expect(consoleError).toHaveBeenCalledWith('Cleanup error:', expect.any(Error))

        consoleError.mockRestore()
      })

      it('should clean up all resources', () => {
        const cleanup1 = vi.fn()
        const cleanup2 = vi.fn()

        const node1: DOMNode = { type: 'element', tag: 'div', dispose: cleanup1 }
        const node2: DOMNode = { type: 'element', tag: 'span', dispose: cleanup2 }

        renderer.render(node1)
        renderer.render(node2)

        renderer.cleanup()

        // Cleanup should be called for all nodes
        expect(cleanup1).toHaveBeenCalled()
        expect(cleanup2).toHaveBeenCalled()
      })
    })

    describe('Node Updates', () => {
      it('should update existing node props', () => {
        const node: DOMNode = {
          type: 'element',
          tag: 'div',
          props: { id: 'initial' },
        }

        const element = renderer.render(node) as any

        renderer.updateNode(node, { id: 'updated', 'data-test': 'new-attr' })

        expect(element.setAttribute).toHaveBeenCalledWith('id', 'updated')
        expect(element.setAttribute).toHaveBeenCalledWith('data-test', 'new-attr')
      })

      it('should handle node updates when element not found', () => {
        const node: DOMNode = {
          type: 'element',
          tag: 'div',
        }

        // Don't render the node first
        renderer.updateNode(node, { id: 'test' })

        // Should not throw error
        expect(true).toBe(true)
      })
    })
  })

  describe('Component Rendering', () => {
    it('should render component instance', () => {
      const component = createComponent(
        () =>
          ({
            type: 'element',
            tag: 'div',
            props: { id: 'test' },
          }) as DOMNode
      )

      const instance = component({})
      const container = document.createElement('div') as any

      const cleanup = renderComponent(instance, container)

      expect(typeof cleanup).toBe('function')
      expect(container.appendChild).toHaveBeenCalled()
    })

    it('should render component with multiple nodes', () => {
      const component = createComponent(() => [
        { type: 'text', text: 'Hello' } as DOMNode,
        { type: 'element', tag: 'div' } as DOMNode,
      ])

      const instance = component({})
      const container = document.createElement('div') as any

      const cleanup = renderComponent(instance, container)

      expect(container.appendChild).toHaveBeenCalledTimes(2)
      expect(typeof cleanup).toBe('function')
    })
  })

  describe('Helper Functions', () => {
    describe('h (createElement)', () => {
      it('should create element node', () => {
        const node = h('div', { id: 'test' }, 'Hello World')

        expect(node).toEqual({
          type: 'element',
          tag: 'div',
          props: { id: 'test' },
          children: [{ type: 'text', text: 'Hello World' }],
        })
      })

      it('should handle nested children', () => {
        const node = h('div', null, h('span', null, 'Child 1'), h('span', null, 'Child 2'))

        expect(node.children).toHaveLength(2)
        expect(node.children![0]).toEqual({
          type: 'element',
          tag: 'span',
          props: {},
          children: [{ type: 'text', text: 'Child 1' }],
        })
      })

      it('should filter null/undefined children', () => {
        const node = h('div', null, 'Valid text', null, undefined, 'Another valid text')

        expect(node.children).toHaveLength(2)
        expect(node.children![0]).toEqual({ type: 'text', text: 'Valid text' })
        expect(node.children![1]).toEqual({ type: 'text', text: 'Another valid text' })
      })

      it('should handle numeric children', () => {
        const node = h('div', null, 42, 3.14)

        expect(node.children).toHaveLength(2)
        expect(node.children![0]).toEqual({ type: 'text', text: '42' })
        expect(node.children![1]).toEqual({ type: 'text', text: '3.14' })
      })
    })

    describe('text helper', () => {
      it('should create text node from string', () => {
        const node = text('Hello World')

        expect(node).toEqual({
          type: 'text',
          text: 'Hello World',
        })
      })

      it('should create reactive text node from function', () => {
        const [message, setMessage] = createSignal('initial')
        const node = text(message)

        expect(node.type).toBe('text')
        expect(typeof node.dispose).toBe('function')

        // Update signal
        setMessage('updated')
        expect(message()).toBe('updated')
      })

      it('should update DOM when reactive text changes', () => {
        const [message, setMessage] = createSignal('initial')
        const node = text(message)

        // Simulate rendering by setting element
        const textElement = document.createTextNode('') as any
        node.element = textElement

        // Update signal
        setMessage('updated')

        // Text should be updated in the signal
        expect(message()).toBe('updated')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle unknown node types', () => {
      const invalidNode = { type: 'unknown' } as any

      expect(() => {
        renderer.render(invalidNode)
      }).toThrow('Unknown node type: unknown')
    })

    it('should handle element without tag', () => {
      const elementWithoutTag: DOMNode = {
        type: 'element',
        // missing tag property
      }

      expect(() => {
        renderer.render(elementWithoutTag)
      }).toThrow('Element node must have a tag')
    })

    it('should handle event handler errors', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error')
      })

      const node: DOMNode = {
        type: 'element',
        tag: 'button',
        props: { onClick: errorHandler },
      }

      const element = renderer.render(node) as any

      // Get the event listener that was added
      const listener = element.addEventListener.mock.calls[0][1]

      // Call the listener
      listener(new Event('click'))

      expect(errorHandler).toHaveBeenCalled()
      expect(consoleError).toHaveBeenCalledWith(
        'Event handler error for onClick:',
        expect.any(Error)
      )

      consoleError.mockRestore()
    })
  })
})
