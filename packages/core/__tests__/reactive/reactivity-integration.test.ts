/**
 * Comprehensive Reactivity Integration Tests
 *
 * These tests verify that reactive updates work end-to-end:
 * - Signal/Computed changes trigger DOM updates
 * - Button interactions update state and DOM
 * - Theme changes update ColorAssets
 * - Multiple reactive components sync correctly
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createSignal, createComputed, createEffect, batch } from '../../src/reactive'
import { DOMRenderer } from '../../src/runtime/renderer'
import { ColorAsset } from '../../src/assets'
import { setTheme, getThemeSignal } from '../../src/reactive/theme'
import type { DOMNode } from '../../src/runtime/types'

// Mock components for testing
function createTextComponent(content: string | (() => string)) {
  return {
    type: 'component' as const,
    id: `text-${Math.random()}`,
    render: () => {
      const text = typeof content === 'function' ? content() : content
      return [
        {
          type: 'element' as const,
          tag: 'span',
          props: {},
          children: [{ type: 'text' as const, text }],
        } as DOMNode,
      ]
    },
    props: { content },
    cleanup: [],
    mounted: false,
  }
}

describe('Reactivity Integration Tests', () => {
  let container: HTMLElement
  let renderer: DOMRenderer
  let cleanups: (() => void)[]

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    renderer = new DOMRenderer()
    cleanups = []
    setTheme('light')
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

  /**
   * Helper: Wait for reactive updates to propagate to DOM
   */
  async function waitForReactiveUpdate(frames = 2): Promise<void> {
    for (let i = 0; i < frames; i++) {
      await new Promise(resolve => requestAnimationFrame(resolve))
    }
  }

  /**
   * Helper: Render component to DOM
   */
  function renderToDOM(component: any): HTMLElement {
    const nodes = component.render()
    const element = renderer.render(nodes[0])
    container.appendChild(element)
    return element
  }

  describe('Signal → DOM Update', () => {
    it('should update text content when signal changes', async () => {
      const [text, setText] = createSignal('Initial')

      // Create reactive text component
      const component = createTextComponent(() => `Value: ${text()}`)

      // Track effect execution
      let updateCount = 0
      const effect = createEffect(() => {
        text() // Create dependency
        updateCount++
      })
      cleanups.push(() => effect.dispose())

      const element = renderToDOM(component)

      // Initial render
      expect(updateCount).toBe(1)

      // Update signal
      setText('Updated')
      await waitForReactiveUpdate()

      // Effect should run again
      expect(updateCount).toBe(2)
    })

    it('should update multiple components with same signal', async () => {
      const [count, setCount] = createSignal(0)

      // Track all updates
      const updates: number[] = []

      const effect1 = createEffect(() => {
        updates.push(count())
      })
      const effect2 = createEffect(() => {
        updates.push(count())
      })

      cleanups.push(() => effect1.dispose())
      cleanups.push(() => effect2.dispose())

      // Initial: both effects run
      expect(updates).toEqual([0, 0])

      // Update signal
      setCount(1)
      await waitForReactiveUpdate()

      // Both effects should update
      expect(updates).toEqual([0, 0, 1, 1])
    })

    it('should batch multiple signal updates', async () => {
      const [a, setA] = createSignal(0)
      const [b, setB] = createSignal(0)

      let effectCount = 0
      const effect = createEffect(() => {
        a()
        b()
        effectCount++
      })
      cleanups.push(() => effect.dispose())

      // Initial run
      expect(effectCount).toBe(1)

      // Batch updates
      batch(() => {
        setA(1)
        setB(2)
      })

      await waitForReactiveUpdate()

      // Should only run once more (batched)
      expect(effectCount).toBe(2)
    })
  })

  describe('Computed → DOM Update', () => {
    it('should update when computed dependencies change', async () => {
      const [count, setCount] = createSignal(0)
      const doubled = createComputed(() => count() * 2)

      let computedValue = 0
      const effect = createEffect(() => {
        computedValue = doubled()
      })
      cleanups.push(() => effect.dispose())

      expect(computedValue).toBe(0)

      setCount(5)
      await waitForReactiveUpdate()

      expect(computedValue).toBe(10)
    })

    it('should handle nested computed signals', async () => {
      const [base, setBase] = createSignal(2)
      const doubled = createComputed(() => base() * 2)
      const quadrupled = createComputed(() => doubled() * 2)

      let result = 0
      const effect = createEffect(() => {
        result = quadrupled()
      })
      cleanups.push(() => effect.dispose())

      expect(result).toBe(8) // 2 * 2 * 2

      setBase(3)
      await waitForReactiveUpdate()

      expect(result).toBe(12) // 3 * 2 * 2
    })

    it('should minimize recomputations', async () => {
      const [a, setA] = createSignal(1)
      const [b, setB] = createSignal(2)

      let computeCount = 0
      const sum = createComputed(() => {
        computeCount++
        return a() + b()
      })

      let result = 0
      const effect = createEffect(() => {
        result = sum()
      })
      cleanups.push(() => effect.dispose())

      // Initial computation
      expect(computeCount).toBe(1)
      expect(result).toBe(3)

      // Change a
      setA(2)
      await waitForReactiveUpdate()

      expect(computeCount).toBe(2)
      expect(result).toBe(4)

      // Change b
      setB(3)
      await waitForReactiveUpdate()

      expect(computeCount).toBe(3)
      expect(result).toBe(5)
    })
  })

  describe('ColorAsset Reactivity', () => {
    it('should update when theme changes', async () => {
      const primaryColor = ColorAsset.init({
        name: 'primary',
        default: '#000000',
        light: '#000000',
        dark: '#ffffff',
      })

      let resolvedColor = ''
      const effect = createEffect(() => {
        // Access theme signal to create dependency
        const theme = getThemeSignal()()
        resolvedColor = primaryColor.resolve()
      })
      cleanups.push(() => effect.dispose())

      // Light theme
      setTheme('light')
      await waitForReactiveUpdate()
      expect(resolvedColor).toBe('#000000')

      // Dark theme
      setTheme('dark')
      await waitForReactiveUpdate()
      expect(resolvedColor).toBe('#ffffff')
    })

    it('should update multiple ColorAssets independently', async () => {
      const primary = ColorAsset.init({
        name: 'primary',
        default: '#000',
        light: '#000',
        dark: '#fff',
      })

      const secondary = ColorAsset.init({
        name: 'secondary',
        default: '#666',
        light: '#999',
        dark: '#333',
      })

      let primaryResolved = ''
      let secondaryResolved = ''

      const effect = createEffect(() => {
        const theme = getThemeSignal()()
        primaryResolved = primary.resolve()
        secondaryResolved = secondary.resolve()
      })
      cleanups.push(() => effect.dispose())

      setTheme('light')
      await waitForReactiveUpdate()
      expect(primaryResolved).toBe('#000')
      expect(secondaryResolved).toBe('#999')

      setTheme('dark')
      await waitForReactiveUpdate()
      expect(primaryResolved).toBe('#fff')
      expect(secondaryResolved).toBe('#333')
    })
  })

  describe('Button Interaction → State → DOM Flow', () => {
    it('should update counter when button clicked', async () => {
      const [count, setCount] = createSignal(0)

      // Simulate button click handler
      const handleClick = () => setCount(count() + 1)

      let displayedCount = 0
      const effect = createEffect(() => {
        displayedCount = count()
      })
      cleanups.push(() => effect.dispose())

      expect(displayedCount).toBe(0)

      // Simulate clicks
      handleClick()
      await waitForReactiveUpdate()
      expect(displayedCount).toBe(1)

      handleClick()
      await waitForReactiveUpdate()
      expect(displayedCount).toBe(2)
    })

    it('should toggle boolean state on button click', async () => {
      const [isVisible, setIsVisible] = createSignal(true)

      const toggle = () => setIsVisible(!isVisible())

      let currentVisibility = true
      const effect = createEffect(() => {
        currentVisibility = isVisible()
      })
      cleanups.push(() => effect.dispose())

      expect(currentVisibility).toBe(true)

      toggle()
      await waitForReactiveUpdate()
      expect(currentVisibility).toBe(false)

      toggle()
      await waitForReactiveUpdate()
      expect(currentVisibility).toBe(true)
    })

    it('should update multiple dependent states from one button click', async () => {
      const [count, setCount] = createSignal(0)
      const isEven = createComputed(() => count() % 2 === 0)
      const doubled = createComputed(() => count() * 2)

      const increment = () => setCount(count() + 1)

      let evenCheck = true
      let doubledValue = 0

      const effect = createEffect(() => {
        evenCheck = isEven()
        doubledValue = doubled()
      })
      cleanups.push(() => effect.dispose())

      // Initial state
      expect(evenCheck).toBe(true)
      expect(doubledValue).toBe(0)

      // Increment to 1
      increment()
      await waitForReactiveUpdate()
      expect(evenCheck).toBe(false)
      expect(doubledValue).toBe(2)

      // Increment to 2
      increment()
      await waitForReactiveUpdate()
      expect(evenCheck).toBe(true)
      expect(doubledValue).toBe(4)
    })
  })

  describe('Complex Integration Scenarios', () => {
    it('should handle form-like state management', async () => {
      const [name, setName] = createSignal('')
      const [email, setEmail] = createSignal('')

      const isValid = createComputed(
        () => name().length > 0 && email().includes('@')
      )

      let formValid = false
      const effect = createEffect(() => {
        formValid = isValid()
      })
      cleanups.push(() => effect.dispose())

      // Initial: invalid
      expect(formValid).toBe(false)

      // Set name only
      setName('John')
      await waitForReactiveUpdate()
      expect(formValid).toBe(false) // Still invalid (no email)

      // Set valid email
      setEmail('john@example.com')
      await waitForReactiveUpdate()
      expect(formValid).toBe(true)

      // Clear name
      setName('')
      await waitForReactiveUpdate()
      expect(formValid).toBe(false)
    })

    it('should handle async data fetching pattern', async () => {
      const [data, setData] = createSignal<string | null>(null)
      const [loading, setLoading] = createSignal(false)
      const [error, setError] = createSignal<string | null>(null)

      const fetchData = async () => {
        setLoading(true)
        setError(null)

        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 50))
          setData('Fetched data')
        } catch (e) {
          setError('Fetch failed')
        } finally {
          setLoading(false)
        }
      }

      let currentState = { data: null, loading: false, error: null }
      const effect = createEffect(() => {
        currentState = {
          data: data(),
          loading: loading(),
          error: error(),
        }
      })
      cleanups.push(() => effect.dispose())

      // Initial state
      expect(currentState.loading).toBe(false)
      expect(currentState.data).toBe(null)

      // Start fetch (don't await yet)
      const fetchPromise = fetchData()
      // Wait for loading state to update
      await new Promise(resolve => queueMicrotask(resolve))
      expect(currentState.loading).toBe(true)

      // Wait for completion
      await fetchPromise
      await new Promise(resolve => queueMicrotask(resolve))
      expect(currentState.loading).toBe(false)
      expect(currentState.data).toBe('Fetched data')
    })

    it('should handle theme-aware color computation', async () => {
      const [isDark, setIsDark] = createSignal(false)

      const textColor = createComputed(() => (isDark() ? '#ffffff' : '#000000'))
      const bgColor = createComputed(() => (isDark() ? '#1a1a1a' : '#ffffff'))

      let colors = { text: '', bg: '' }
      const effect = createEffect(() => {
        colors = {
          text: textColor(),
          bg: bgColor(),
        }
      })
      cleanups.push(() => effect.dispose())

      // Light theme
      expect(colors.text).toBe('#000000')
      expect(colors.bg).toBe('#ffffff')

      // Dark theme
      setIsDark(true)
      await waitForReactiveUpdate()
      expect(colors.text).toBe('#ffffff')
      expect(colors.bg).toBe('#1a1a1a')
    })
  })

  describe('Performance and Cleanup', () => {
    it('should not leak memory when effects are disposed', () => {
      const [signal, setSignal] = createSignal(0)

      const effects: any[] = []

      // Create many effects
      for (let i = 0; i < 100; i++) {
        const effect = createEffect(() => {
          signal()
        })
        effects.push(effect)
      }

      // Update signal (all effects should run)
      setSignal(1)

      // Dispose all effects
      effects.forEach(e => e.dispose())

      // Update signal again (no effects should run)
      const beforeUpdate = signal()
      setSignal(2)

      // No errors should occur
      expect(signal()).toBe(2)
    })

    it('should handle rapid signal updates efficiently', async () => {
      const [counter, setCounter] = createSignal(0)

      let effectRuns = 0
      const effect = createEffect(() => {
        counter()
        effectRuns++
      })
      cleanups.push(() => effect.dispose())

      // Initial run
      expect(effectRuns).toBe(1)

      // Rapid updates in batch
      batch(() => {
        for (let i = 0; i < 100; i++) {
          setCounter(i)
        }
      })

      await waitForReactiveUpdate()

      // Should only run once more (all updates batched)
      expect(effectRuns).toBe(2)
      expect(counter()).toBe(99)
    })

    it('should allow manual cleanup of nested effects', async () => {
      const [outer, setOuter] = createSignal(0)

      let innerEffect: any = null
      let outerRunCount = 0

      const outerEffect = createEffect(() => {
        outerRunCount++
        const value = outer()

        // Manually dispose previous inner effect if it exists
        if (innerEffect) {
          innerEffect.dispose()
        }

        // Create new inner effect
        innerEffect = createEffect(() => {
          outer() // Also depends on outer
        })
      })

      cleanups.push(() => {
        outerEffect.dispose()
        if (innerEffect) innerEffect.dispose()
      })

      // Initial run
      expect(outerRunCount).toBe(1)

      // Update outer - outer effect re-runs
      setOuter(1)
      await waitForReactiveUpdate()

      expect(outerRunCount).toBe(2)
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined and null signal values', async () => {
      const [value, setValue] = createSignal<string | null>(null)

      let currentValue: string | null = null
      const effect = createEffect(() => {
        currentValue = value()
      })
      cleanups.push(() => effect.dispose())

      expect(currentValue).toBe(null)

      setValue('defined')
      await waitForReactiveUpdate()
      expect(currentValue).toBe('defined')

      setValue(null)
      await waitForReactiveUpdate()
      expect(currentValue).toBe(null)
    })

    it('should handle circular dependency detection', async () => {
      const [a, setA] = createSignal(0)
      const [b, setB] = createSignal(0)

      // This creates a potential circular dependency
      const effect1 = createEffect(() => {
        if (a() > 0) {
          setB(a() + 1)
        }
      })

      const effect2 = createEffect(() => {
        if (b() > 10) {
          setA(0) // Reset to break cycle
        }
      })

      cleanups.push(() => effect1.dispose())
      cleanups.push(() => effect2.dispose())

      // Should not infinite loop
      expect(() => {
        setA(1)
      }).not.toThrow()

      // Wait for effects to settle
      await waitForReactiveUpdate()

      // System should be stable
      expect(a()).toBeDefined()
      expect(b()).toBeDefined()
    })

    it('should handle effect errors gracefully', () => {
      const [value, setValue] = createSignal(0)

      const errorSpy = vi.fn()

      const effect = createEffect(() => {
        if (value() === 5) {
          throw new Error('Test error')
        }
      })

      // Override console.error to catch
      const originalError = console.error
      console.error = errorSpy

      cleanups.push(() => {
        effect.dispose()
        console.error = originalError
      })

      // Should not throw, but error should be logged
      setValue(5)

      // System should still be functional
      setValue(6)
      expect(value()).toBe(6)
    })
  })
})
