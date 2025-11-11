/**
 * Props and Children Handling Tests (Phase 3.1.2)
 *
 * Tests for the enhanced props system, children handling,
 * and component composition patterns.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createComponent, createRef, forwardRef } from '../../src/runtime/component'
import {
  ChildrenManager,
  createChildrenManager,
  createPropsManager,
  createRefManager,
  PropsManager,
  propsUtils,
  RefManager,
} from '../../src/runtime/props'
import type { ComponentInstance, ComponentProps } from '../../src/runtime/types'
import type { ModifierBuilder } from '../../src/modifiers/types'

describe('Props and Children Handling System', () => {
  describe('PropsManager', () => {
    interface TestProps extends ComponentProps {
      name: string
      count?: number
      enabled?: boolean
    }

    it('should create props manager with initial props', () => {
      const initialProps: TestProps = { name: 'test', count: 5 }
      const manager = new PropsManager(initialProps)

      expect(manager.getProps()).toEqual(initialProps)
    })

    it('should apply default props', () => {
      const initialProps: TestProps = { name: 'test' }
      const manager = new PropsManager(initialProps, {
        defaults: { count: 10, enabled: true },
      })

      const props = manager.getProps()
      expect(props.name).toBe('test')
      expect(props.count).toBe(10)
      expect(props.enabled).toBe(true)
    })

    it('should validate required props', () => {
      expect(() => {
        new PropsManager({} as TestProps, {
          required: ['name'],
        })
      }).toThrow("Required prop 'name' is missing")
    })

    it('should run custom validator', () => {
      const validator = vi.fn().mockReturnValue('Invalid name')

      expect(() => {
        new PropsManager({ name: 'test' }, { validator })
      }).toThrow('Props validation failed: Invalid name')

      expect(validator).toHaveBeenCalledWith({ name: 'test' })
    })

    it('should track prop changes', () => {
      const manager = new PropsManager<TestProps>({ name: 'test', count: 5 })

      manager.setProps({ count: 10 })

      const changedKeys = manager.getChangedKeys()
      expect(changedKeys).toContain('count')
      expect(changedKeys).not.toContain('name')
    })

    it('should create reactive computed for specific prop', () => {
      const manager = new PropsManager<TestProps>({ name: 'test', count: 5 })
      const countComputed = manager.createPropComputed('count')

      expect(countComputed()).toBe(5)

      manager.setProps({ count: 10 })
      expect(countComputed()).toBe(10)
    })

    it('should create effects for prop changes', async () => {
      const manager = new PropsManager<TestProps>({ name: 'test', count: 5 })
      const effectCallback = vi.fn()

      // Create the effect
      const cleanup = manager.createPropsEffect(['count'], effectCallback)

      // Wait for initial effect run
      await new Promise((resolve) => setTimeout(resolve, 0))

      // Update props
      manager.setProps({ count: 10 })

      // Wait for effect to run
      await new Promise((resolve) => setTimeout(resolve, 0))

      // Effect should be called when count changes
      expect(effectCallback).toHaveBeenCalledWith(expect.objectContaining({ count: 10 }), ['count'])

      // Cleanup
      cleanup()
    })
  })

  describe('ChildrenManager', () => {
    it('should create children manager with initial children', () => {
      const children = 'Hello World'
      const manager = new ChildrenManager(children)

      expect(manager.getChildren()).toBe(children)
    })

    it('should render string children to text nodes', () => {
      const manager = new ChildrenManager('Hello World')
      const nodes = manager.renderChildren()

      expect(nodes).toHaveLength(1)
      expect(nodes[0]).toEqual({
        type: 'text',
        text: 'Hello World',
      })
    })

    it('should render number children to text nodes', () => {
      const manager = new ChildrenManager(42)
      const nodes = manager.renderChildren()

      expect(nodes).toHaveLength(1)
      expect(nodes[0]).toEqual({
        type: 'text',
        text: '42',
      })
    })

    it('should skip null and undefined children', () => {
      const manager = new ChildrenManager([null, 'text', undefined])
      const nodes = manager.renderChildren()

      expect(nodes).toHaveLength(1)
      expect(nodes[0]).toEqual({
        type: 'text',
        text: 'text',
      })
    })

    it('should skip boolean children', () => {
      const manager = new ChildrenManager([true, 'text', false])
      const nodes = manager.renderChildren()

      expect(nodes).toHaveLength(1)
      expect(nodes[0]).toEqual({
        type: 'text',
        text: 'text',
      })
    })

    it('should handle nested arrays of children', () => {
      const manager = new ChildrenManager(['hello', [' ', 'world']])
      const nodes = manager.renderChildren()

      expect(nodes).toHaveLength(3)
      expect(nodes[0].text).toBe('hello')
      expect(nodes[1].text).toBe(' ')
      expect(nodes[2].text).toBe('world')
    })

    it('should map children correctly', () => {
      const manager = new ChildrenManager(['a', 'b', 'c'])
      const mapped = manager.mapChildren((child, index) => `${child}-${index}`)

      expect(mapped).toEqual(['a-0', 'b-1', 'c-2'])
    })

    it('should filter children correctly', () => {
      const manager = new ChildrenManager(['a', null, 'b', undefined])
      const filtered = manager.filterChildren((child) => child !== null && child !== undefined)

      expect(filtered).toEqual(['a', 'b'])
    })

    it('should count non-null children', () => {
      const manager = new ChildrenManager(['a', null, 'b', undefined])
      expect(manager.countChildren()).toBe(2)
    })

    it('should create fragments', () => {
      const manager = new ChildrenManager()
      const fragment = manager.createFragment(['a', 'b', 'c'])

      expect(fragment).toEqual({
        children: ['a', 'b', 'c'],
      })
    })

    it('auto-builds modifier builder children before rendering', () => {
      const builtComponent: ComponentInstance = {
        type: 'component',
        render: vi.fn(() => ({
          type: 'text' as const,
          text: 'built child',
        })),
        props: {},
        id: 'child',
      }

      const builder = {
        build: vi.fn(() => builtComponent),
      } as unknown as ModifierBuilder<ComponentInstance>

      const manager = new ChildrenManager(builder as any)
      const nodes = manager.renderChildren()

      expect(builder.build).toHaveBeenCalledTimes(1)
      expect(builtComponent.render).toHaveBeenCalledTimes(1)
      expect(nodes).toHaveLength(1)
      expect(nodes[0]).toEqual({
        type: 'text',
        text: 'built child',
      })
    })

  })

  describe('RefManager', () => {
    it('should create ref with initial value', () => {
      const manager = new RefManager('initial')
      expect(manager.getValue()).toBe('initial')
    })

    it('should update ref value', () => {
      const manager = new RefManager<string>()
      manager.setValue('test')
      expect(manager.getValue()).toBe('test')
    })

    it('should create ref object', () => {
      const ref = RefManager.createRef('initial')
      expect(ref.current).toBe('initial')
    })

    it('should apply callback ref', () => {
      const callback = vi.fn()
      RefManager.applyRef(callback, 'value')
      expect(callback).toHaveBeenCalledWith('value')
    })

    it('should apply ref object', () => {
      const ref = { current: null }
      RefManager.applyRef(ref, 'value')
      expect(ref.current).toBe('value')
    })

    it('should handle null ref', () => {
      expect(() => {
        RefManager.applyRef(null, 'value')
      }).not.toThrow()
    })

    it('should forward ref correctly', () => {
      const renderFunction = vi.fn().mockReturnValue([])
      const forwardedComponent = RefManager.forwardRef(renderFunction)
      const ref = { current: null }

      forwardedComponent({ ref, prop: 'value' })

      expect(renderFunction).toHaveBeenCalledWith({ prop: 'value' }, ref)
    })
  })

  describe('propsUtils', () => {
    interface TestProps extends ComponentProps {
      name: string
      count: number
      enabled: boolean
    }

    const props1: TestProps = { name: 'test', count: 5, enabled: true }
    const props2: TestProps = { name: 'test', count: 10, enabled: true }
    const props3: TestProps = { name: 'test', count: 5, enabled: true }

    it('should compare props and return changed keys', () => {
      const changed = propsUtils.compareProps(props1, props2)
      expect(changed).toContain('count')
      expect(changed).not.toContain('name')
      expect(changed).not.toContain('enabled')
    })

    it('should perform shallow equality check', () => {
      expect(propsUtils.shallowEqual(props1, props2)).toBe(false)
      expect(propsUtils.shallowEqual(props1, props3)).toBe(true)
    })

    it('should pick specific props', () => {
      const picked = propsUtils.pickProps(props1, ['name', 'enabled'])
      expect(picked).toEqual({ name: 'test', enabled: true })
      expect('count' in picked).toBe(false)
    })

    it('should omit specific props', () => {
      const omitted = propsUtils.omitProps(props1, ['count'])
      expect(omitted).toEqual({ name: 'test', enabled: true })
      expect('count' in omitted).toBe(false)
    })
  })

  describe('Enhanced Component System', () => {
    let consoleWarnSpy: any

    beforeEach(() => {
      // Suppress expected "onCleanup called outside of reactive context" warnings during component tests
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation((message) => {
        if (
          typeof message === 'string' &&
          message.includes('onCleanup called outside of reactive context')
        ) {
          return // Suppress this expected warning
        }
        // Allow other warnings through
        console.warn.call(console, message)
      })
    })

    afterEach(() => {
      consoleWarnSpy.mockRestore()
    })
    it('should create component with props validation', () => {
      interface TestProps extends ComponentProps {
        name: string
        count?: number
      }

      const TestComponent = createComponent<TestProps>(
        (props) => {
          return [
            {
              type: 'text',
              text: `${props.name}: ${props.count || 0}`,
            },
          ]
        },
        {
          validation: {
            required: ['name'],
            defaults: { count: 0 },
          },
        }
      )

      const instance = TestComponent({ name: 'test' })
      expect(instance.props.name).toBe('test')
      expect(instance.props.count).toBe(0)
    })

    it('should handle children in components', () => {
      const ParentComponent = createComponent<ComponentProps>((_props, children) => {
        return [
          {
            type: 'element',
            tag: 'div',
            children: [
              {
                type: 'text',
                text: typeof children === 'string' ? children : 'no children',
              },
            ],
          },
        ]
      })

      const instance = ParentComponent({ children: 'Hello World' })
      const result = instance.render()

      expect(Array.isArray(result)).toBe(true)
      const nodes = Array.isArray(result) ? result : [result]
      expect(nodes[0].type).toBe('element')
      expect(nodes[0].tag).toBe('div')
    })

    it('should create and use refs', () => {
      const ref = createRef<HTMLElement>()
      expect(ref.current).toBe(null)

      ref.current = document.createElement('div')
      expect(ref.current.tagName).toBe('DIV')
    })

    it('should forward refs correctly', () => {
      const ForwardedComponent = forwardRef<HTMLElement, ComponentProps>((_props, ref) => {
        return [
          {
            type: 'element',
            tag: 'div',
            props: { ref },
          },
        ]
      })

      const ref = createRef<HTMLElement>()
      const instance = ForwardedComponent({ ref })
      const result = instance.render()

      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('Factory Functions', () => {
    it('should create props manager via factory', () => {
      const manager = createPropsManager({ name: 'test' })
      expect(manager.getProps()).toEqual({ name: 'test' })
    })

    it('should create children manager via factory', () => {
      const manager = createChildrenManager('hello')
      expect(manager.getChildren()).toBe('hello')
    })

    it('should create ref manager via factory', () => {
      const manager = createRefManager('initial')
      expect(manager.getValue()).toBe('initial')
    })
  })
})
