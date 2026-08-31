/**
 * Component Management System Tests (Phase 3.1.1)
 * 
 * Tests for component lifecycle, registration, cleanup, and reactive integration.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createSignal, createEffect, flushSync } from '../../src/reactive'
import { 
  ComponentManager, 
  createComponent, 
  withLifecycle,
  createReactiveComponent,
  createErrorBoundary
} from '../../src/runtime/component'
import type { ComponentProps, LifecycleHooks, DOMNode } from '../../src/runtime/types'

describe('Component Management System', () => {
  let manager: ComponentManager

  beforeEach(() => {
    // Get fresh manager instance for each test
    manager = ComponentManager.getInstance()
    manager.cleanup() // Clean up any previous state
  })

  describe('ComponentManager', () => {
    it('should be a singleton', () => {
      const manager1 = ComponentManager.getInstance()
      const manager2 = ComponentManager.getInstance()
      expect(manager1).toBe(manager2)
    })

    it('should register and retrieve components', () => {
      const mockComponent = createComponent(() => ({ type: 'text', text: 'test' } as DOMNode))
      const instance = mockComponent({})
      
      manager.registerComponent(instance)
      
      expect(manager.getComponent(instance.id)).toBe(instance)
      expect(manager.getAllComponents()).toContain(instance)
    })

    it('should unregister components and run cleanup', () => {
      let cleanupCalled = false
      const cleanup = vi.fn(() => { cleanupCalled = true })
      
      const mockComponent = createComponent(() => ({ type: 'text', text: 'test' } as DOMNode))
      const instance = mockComponent({})
      instance.cleanup = [cleanup]
      
      manager.registerComponent(instance)
      manager.unregisterComponent(instance.id)
      
      expect(manager.getComponent(instance.id)).toBeUndefined()
      expect(cleanup).toHaveBeenCalled()
      expect(cleanupCalled).toBe(true)
    })

    it('should handle cleanup errors gracefully', () => {
      const errorCleanup = vi.fn(() => { throw new Error('Cleanup error') })
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const mockComponent = createComponent(() => ({ type: 'text', text: 'test' } as DOMNode))
      const instance = mockComponent({})
      instance.cleanup = [errorCleanup]
      
      manager.registerComponent(instance)
      manager.unregisterComponent(instance.id)
      
      expect(errorCleanup).toHaveBeenCalled()
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('Cleanup error for component'),
        expect.any(Error)
      )
      
      consoleError.mockRestore()
    })

    it('should schedule and flush updates', async () => {
      const mockComponent = createComponent(() => ({ type: 'text', text: 'test' } as DOMNode))
      const instance = mockComponent({})
      
      manager.registerComponent(instance)
      
      // Schedule update
      manager.scheduleUpdate(instance.id)
      
      // Wait for microtask
      await new Promise(resolve => queueMicrotask(resolve))
      
      // Component should still be registered (update doesn't remove it)
      expect(manager.getComponent(instance.id)).toBe(instance)
    })
  })

  describe('createComponent', () => {
    it('should create a basic component', () => {
      const render = vi.fn(() => ({ type: 'text', text: 'Hello' } as DOMNode))
      const component = createComponent(render)
      
      expect(typeof component).toBe('function')
    })

    it('should create component instance with correct structure', () => {
      const render = () => ({ type: 'text', text: 'Hello' } as DOMNode)
      const component = createComponent(render, { displayName: 'TestComponent' })
      
      const instance = component({})
      
      expect(instance.type).toBe('component')
      // Deterministic ID format: `${parentId}:${componentName}:${siblingIndex}`
      // (packages/core/src/runtime/component-context.ts:207-216)
      expect(instance.id).toMatch(/^[a-z0-9-]+:[a-z0-9-]+:\d+$/)
      expect(typeof instance.render).toBe('function')
      expect(instance.props).toEqual({})
      expect(instance.context).toBeDefined()
    })

    it('should merge default props', () => {
      interface Props extends ComponentProps {
        message: string
        count?: number
      }
      
      const component = createComponent<Props>(
        (props) => ({ type: 'text', text: props.message } as DOMNode),
        { 
          displayName: 'TestComponent',
          defaultProps: { count: 0 }
        }
      )
      
      const instance = component({ message: 'Hello' })
      
      expect(instance.props).toEqual({ message: 'Hello', count: 0 })
    })

    it('should handle lifecycle hooks', () => {
      const onMount = vi.fn()
      const onUnmount = vi.fn()
      const onError = vi.fn()
      
      const hooks: LifecycleHooks = {
        onMount,
        onUnmount,
        onError
      }
      
      const component = createComponent(
        () => ({ type: 'text', text: 'Test' } as DOMNode),
        { lifecycle: hooks }
      )
      
      const instance = component({})
      
      // Render to trigger lifecycle
      instance.render()
      
      expect(onMount).toHaveBeenCalled()
    })

    it('should handle onMount cleanup', () => {
      const cleanup = vi.fn()
      const onMount = vi.fn(() => cleanup)
      
      const component = createComponent(
        () => ({ type: 'text', text: 'Test' } as DOMNode),
        { lifecycle: { onMount } }
      )
      
      const instance = component({})
      instance.render()
      
      expect(onMount).toHaveBeenCalled()
      expect(instance.cleanup).toContain(cleanup)
    })
  })

  describe('withLifecycle', () => {
    it('should add lifecycle hooks to existing component', () => {
      const onMount = vi.fn()
      const onUnmount = vi.fn()
      
      const baseComponent = createComponent(() => ({ type: 'text', text: 'Base' } as DOMNode))
      const enhancedComponent = withLifecycle(baseComponent, { onMount, onUnmount })
      
      expect(enhancedComponent.displayName).toBe('withLifecycle(Component)')
      
      const instance = enhancedComponent({})
      instance.render()
      
      expect(onMount).toHaveBeenCalled()
    })

    it('should preserve existing cleanup functions', () => {
      const baseCleanup = vi.fn()
      const baseComponent = createComponent(() => {
        return { type: 'text', text: 'Base' } as DOMNode
      })
      
      const additionalCleanup = vi.fn()
      const enhancedComponent = withLifecycle(baseComponent, {
        onUnmount: additionalCleanup
      })
      
      const instance = enhancedComponent({})
      instance.render()
      
      expect(instance.cleanup).toContain(additionalCleanup)
    })
  })

  describe('createReactiveComponent', () => {
    // #238: the props-tracking effect used to be created inside the render
    // function, so it re-captured previousProps mid-pass and shouldUpdate
    // compared the props to themselves. The first render was skipped
    // entirely and render() returned [].
    it('executes the user render function on the first render', () => {
      let renderCount = 0

      const component = createReactiveComponent<{ message: string }>(props => {
        renderCount++
        return { type: 'text', text: props.message } as DOMNode
      })

      const instance = component({ message: 'Hello' })
      const result = instance.render()

      expect(renderCount).toBe(1)
      expect(result).toEqual({ type: 'text', text: 'Hello' })
    })

    it('memoizes re-renders while props are unchanged', () => {
      let renderCount = 0

      const component = createReactiveComponent<{ message: string }>(props => {
        renderCount++
        return { type: 'text', text: props.message } as DOMNode
      })

      const instance = component({ message: 'Hello' })
      instance.render()
      instance.render()

      // The point of the reactive wrapper: shouldUpdate skips the second
      // pass because the props are shallow-equal. Regression guard against
      // "fixing" #238 by deleting shouldUpdate, which would make
      // createReactiveComponent an alias for createComponent.
      expect(renderCount).toBe(1)
    })

    it('runs lifecycle tracking effects once per instance, not once per render', () => {
      const onUpdate = vi.fn()
      let renderCount = 0

      const component = createComponent<{ message: string }>(
        props => {
          renderCount++
          return { type: 'text', text: props.message } as DOMNode
        },
        { lifecycle: { onUpdate } }
      )

      const instance = component({ message: 'Hello' })
      instance.render()
      instance.render()
      instance.render()

      // The tracking effects used to be created inside the render function,
      // so every pass added another live effect (never disposed — the render
      // is wrapped in runWithComponentContext, not a per-render root) and
      // each new effect fired onUpdate against the snapshot the previous one
      // had just written. Props never changed here, so onUpdate must not
      // fire at all; at HEAD it fired once per render from pass 2 onward.
      expect(renderCount).toBe(3)
      expect(onUpdate).not.toHaveBeenCalled()
    })
  })

  describe('createErrorBoundary', () => {
    it('should catch and handle component errors', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const fallback = vi.fn(() => ({ type: 'text', text: 'Error occurred' } as DOMNode))
      
      const errorBoundary = createErrorBoundary(fallback)
      
      // Create a component that throws an error
      const errorComponent = createComponent(() => {
        throw new Error('Test error')
      })
      
      const errorInstance = errorComponent({})
      const boundaryInstance = errorBoundary({ children: errorInstance })
      
      const result = boundaryInstance.render()
      
      expect(fallback).toHaveBeenCalledWith(expect.any(Error))
      expect(consoleError).toHaveBeenCalled()
      
      consoleError.mockRestore()
    })

    it('should have correct display name', () => {
      const errorBoundary = createErrorBoundary(() => ({ type: 'text', text: 'Error' } as DOMNode))
      expect(errorBoundary.displayName).toBe('ErrorBoundary')
    })
  })

  describe('Component Integration with Reactive System', () => {
    it('should integrate with signals and effects', () => {
      const [count, setCount] = createSignal(0)
      let renderCount = 0
      
      const component = createComponent(() => {
        renderCount++
        let currentText = ''
        
        createEffect(() => {
          currentText = `Count: ${count()}`
        })
        
        return { type: 'text', text: currentText } as DOMNode
      })
      
      const instance = component({})
      instance.render()
      
      expect(renderCount).toBe(1)
      
      // Update signal
      setCount(1)
      
      // Effect should have run, but render count should be same
      expect(renderCount).toBe(1)
    })

    it('should propagate signal updates to effects created during render', () => {
      const [count, setCount] = createSignal(0)
      let effectCount = 0

      const component = createComponent(() => {
        createEffect(() => {
          count() // Subscribe to signal
          effectCount++
        })

        return { type: 'text', text: 'Test' } as DOMNode
      })

      const instance = component({})
      const cleanup = instance.render()

      expect(effectCount).toBe(1)

      // Update signal — effects run on the scheduler, so flush before asserting
      setCount(1)
      flushSync()
      expect(effectCount).toBe(2)

      // Note: ComponentInstance.render() returns a DOMNode (not a cleanup fn), and
      // render-scoped effects are disposed by the renderer on unmount (renderer.ts),
      // not by the bare instance — so unmount disposal is exercised in renderer tests.

      // Update signal again — effect is still subscribed
      setCount(2)
      flushSync()
      expect(effectCount).toBe(3)
    })
  })

  describe('Memory Management', () => {
    it('should not leak memory after component cleanup', () => {
      const component = createComponent(() => ({ type: 'text', text: 'Test' } as DOMNode))
      const instance = component({})
      
      manager.registerComponent(instance)
      
      const initialComponentCount = manager.getAllComponents().length
      
      manager.unregisterComponent(instance.id)
      
      expect(manager.getAllComponents().length).toBe(initialComponentCount - 1)
      expect(manager.getComponent(instance.id)).toBeUndefined()
    })

    it('should handle rapid component creation and cleanup', () => {
      const components: string[] = []

      // Create many components. Each needs a unique displayName because root-level
      // standalone instances share sibling index 0 in the deterministic ID scheme
      // (packages/core/src/runtime/component-context.ts:211-215).
      for (let i = 0; i < 100; i++) {
        const component = createComponent(
          () => ({ type: 'text', text: `Test ${i}` } as DOMNode),
          { displayName: `RapidTest${i}` }
        )
        const instance = component({})
        manager.registerComponent(instance)
        components.push(instance.id)
      }
      
      expect(manager.getAllComponents().length).toBe(100)
      
      // Clean up all components
      components.forEach(id => manager.unregisterComponent(id))
      
      expect(manager.getAllComponents().length).toBe(0)
    })
  })
})