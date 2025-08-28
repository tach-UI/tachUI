/**
 * Signal system tests
 *
 * Tests for the core signal implementation including creation,
 * updates, dependency tracking, and memory management.
 */

import { describe, expect, it, vi } from 'vitest'
import {
  batch,
  createComputed,
  createEffect,
  createRoot,
  createSignal,
  flushSync,
  isSignal,
  untrack,
} from '../../src/reactive'

describe('Signal', () => {
  describe('Basic functionality', () => {
    it('should create a signal with initial value', () => {
      const [count, _setCount] = createSignal(0)
      expect(count()).toBe(0)
    })

    it('should update signal value', () => {
      const [count, setCount] = createSignal(0)
      setCount(5)
      expect(count()).toBe(5)
    })

    it('should support functional updates', () => {
      const [count, setCount] = createSignal(0)
      setCount((prev) => prev + 1)
      expect(count()).toBe(1)
    })

    it('should return the new value from setter', () => {
      const [_count, setCount] = createSignal(0)
      const result = setCount(42)
      expect(result).toBe(42)
    })

    it('should not trigger updates for same value', () => {
      const [count, setCount] = createSignal(0)
      const spy = vi.fn()

      createRoot(() => {
        createEffect(() => {
          count()
          spy()
        })
      })

      expect(spy).toHaveBeenCalledTimes(1)

      setCount(0) // Same value
      flushSync()
      expect(spy).toHaveBeenCalledTimes(1)

      setCount(1) // Different value
      flushSync()
      expect(spy).toHaveBeenCalledTimes(2)
    })
  })

  describe('Type guards', () => {
    it('should identify signals correctly', () => {
      const [signal] = createSignal(0)
      const notSignal = () => 42

      expect(isSignal(signal)).toBe(true)
      expect(isSignal(notSignal)).toBe(false)
    })

    it('should provide peek method', () => {
      const [count, setCount] = createSignal(0)
      setCount(42)
      expect(count.peek()).toBe(42)
    })
  })

  describe('Dependency tracking', () => {
    it('should track dependencies in effects', () => {
      const [count, setCount] = createSignal(0)
      const spy = vi.fn()

      createRoot(() => {
        createEffect(() => {
          spy(count())
        })
      })

      expect(spy).toHaveBeenCalledWith(0)

      setCount(1)
      flushSync()
      expect(spy).toHaveBeenCalledWith(1)
      expect(spy).toHaveBeenCalledTimes(2)
    })

    it('should track dependencies in computed values', () => {
      const [count, setCount] = createSignal(0)

      createRoot(() => {
        const doubled = createComputed(() => count() * 2)

        expect(doubled()).toBe(0)

        setCount(5)
        expect(doubled()).toBe(10)
      })
    })

    it('should not track dependencies when using peek', () => {
      const [count, setCount] = createSignal(0)
      const spy = vi.fn()

      createRoot(() => {
        createEffect(() => {
          spy(count.peek()) // Using peek, should not track
        })
      })

      expect(spy).toHaveBeenCalledWith(0)

      setCount(1)
      flushSync()
      expect(spy).toHaveBeenCalledTimes(1) // Should not be called again
    })

    it('should not track dependencies outside reactive context', () => {
      const [count, setCount] = createSignal(0)

      // Read outside reactive context
      expect(count()).toBe(0)

      setCount(1)
      expect(count()).toBe(1)
    })
  })

  describe('Untrack functionality', () => {
    it('should not track dependencies when using untrack', () => {
      const [count, setCount] = createSignal(0)
      const [other, setOther] = createSignal(10)
      const spy = vi.fn()

      createRoot(() => {
        createEffect(() => {
          const tracked = count() // This will be tracked
          const untracked = untrack(() => other()) // This won't be tracked
          spy(tracked, untracked)
        })
      })

      expect(spy).toHaveBeenCalledWith(0, 10)

      setOther(20)
      flushSync()
      expect(spy).toHaveBeenCalledTimes(1) // Should not trigger

      setCount(1)
      flushSync()
      expect(spy).toHaveBeenCalledWith(1, 20) // Should trigger
      expect(spy).toHaveBeenCalledTimes(2)
    })
  })

  describe('Batching', () => {
    it('should batch updates', () => {
      const [count, setCount] = createSignal(0)
      const spy = vi.fn()

      createRoot(() => {
        createEffect(() => {
          spy(count())
        })
      })

      expect(spy).toHaveBeenCalledTimes(1)

      batch(() => {
        setCount(1)
        setCount(2)
        setCount(3)
      })

      expect(spy).toHaveBeenCalledWith(3)
      expect(spy).toHaveBeenCalledTimes(2) // Initial + batched update
    })

    it('should handle nested batching', () => {
      const [count, setCount] = createSignal(0)
      const spy = vi.fn()

      createRoot(() => {
        createEffect(() => {
          spy(count())
        })
      })

      batch(() => {
        setCount(1)
        batch(() => {
          setCount(2)
        })
        setCount(3)
      })

      expect(spy).toHaveBeenCalledWith(3)
      expect(spy).toHaveBeenCalledTimes(2)
    })
  })

  describe('Memory management', () => {
    it('should clean up observers when effect is disposed', () => {
      const [count, _setCount] = createSignal(0)
      let dispose: (() => void) | undefined

      createRoot((d) => {
        dispose = d
        createEffect(() => {
          count()
        })
      })

      // Signal should have an observer
      const signalImpl = (count as any)[Symbol.for('tachui.signal')]
      expect(signalImpl.observers.size).toBe(1)

      // Dispose the root
      dispose?.()

      // Signal should no longer have observers
      expect(signalImpl.observers.size).toBe(0)
    })

    it('should handle multiple observers', () => {
      const [count, setCount] = createSignal(0)
      const spy1 = vi.fn()
      const spy2 = vi.fn()

      createRoot(() => {
        createEffect(() => {
          spy1(count())
        })

        createEffect(() => {
          spy2(count())
        })
      })

      setCount(1)
      flushSync()

      expect(spy1).toHaveBeenCalledWith(1)
      expect(spy2).toHaveBeenCalledWith(1)
    })
  })

  describe('Complex scenarios', () => {
    it('should handle diamond dependency pattern', () => {
      const [source, setSource] = createSignal(1)

      createRoot(() => {
        const a = createComputed(() => source() * 2)
        const b = createComputed(() => source() * 3)
        const result = createComputed(() => a() + b())

        expect(result()).toBe(5) // (1*2) + (1*3) = 5

        setSource(2)
        expect(result()).toBe(10) // (2*2) + (2*3) = 10
      })
    })

    it('should handle conditional dependencies', () => {
      const [flag, setFlag] = createSignal(true)
      const [a, setA] = createSignal(1)
      const [b, setB] = createSignal(2)
      const spy = vi.fn()

      createRoot(() => {
        createEffect(() => {
          spy(flag() ? a() : b())
        })
      })

      expect(spy).toHaveBeenCalledWith(1) // flag is true, uses a()

      setB(10) // Should not trigger since b() is not being tracked
      flushSync()
      expect(spy).toHaveBeenCalledTimes(1)

      setA(5) // Should trigger since a() is being tracked
      flushSync()
      expect(spy).toHaveBeenCalledWith(5)
      expect(spy).toHaveBeenCalledTimes(2)

      setFlag(false) // Switch to b()
      flushSync()
      expect(spy).toHaveBeenCalledWith(10)
      expect(spy).toHaveBeenCalledTimes(3)

      setA(100) // Should not trigger anymore since a() is not tracked
      flushSync()
      expect(spy).toHaveBeenCalledTimes(3)

      setB(20) // Should trigger since b() is now being tracked
      flushSync()
      expect(spy).toHaveBeenCalledWith(20)
      expect(spy).toHaveBeenCalledTimes(4)
    })
  })

  describe('Error handling', () => {
    it('should handle errors in signal updates gracefully', () => {
      const [count, setCount] = createSignal(0)
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      createRoot(() => {
        createEffect(() => {
          if (count() === 5) {
            throw new Error('Test error')
          }
        })
      })

      setCount(1) // Should work fine
      flushSync()

      // Now errors properly propagate instead of being silently suppressed
      expect(() => {
        setCount(5) // Should trigger error
        flushSync()
      }).toThrow('Test error')

      // Error logging is suppressed in test environment, so we don't expect it to be called
      // expect(errorSpy).toHaveBeenCalled()
      errorSpy.mockRestore()
    })

    it('should demonstrate that errors now properly propagate (v2.0 behavior)', () => {
      const [count, setCount] = createSignal(0)
      let effectExecuted = false

      createRoot(() => {
        createEffect(() => {
          effectExecuted = true
          if (count() === 5) {
            throw new Error('Test error')
          }
        })
      })

      setCount(1) // Should work fine
      flushSync()
      expect(effectExecuted).toBe(true)

      // In v2.0, errors properly propagate instead of being silently suppressed
      // This is the CORRECT behavior for debugging and error handling
      expect(() => {
        setCount(5)
        flushSync()
      }).toThrow('Test error')
    })
  })
})

describe('Signal Performance', () => {
  it('should handle many signals efficiently', () => {
    const signals = Array.from({ length: 1000 }, (_, i) => createSignal(i))

    createRoot(() => {
      const sum = createComputed(() => signals.reduce((acc, [signal]) => acc + signal(), 0))

      expect(sum()).toBe(499500) // Sum of 0..999

      // Update one signal
      signals[0][1](1000)
      expect(sum()).toBe(500500) // Updated sum
    })
  })

  it('should batch many updates efficiently', () => {
    const [count, setCount] = createSignal(0)
    const spy = vi.fn()

    createRoot(() => {
      createEffect(() => {
        spy(count())
      })
    })

    const startTime = performance.now()

    batch(() => {
      for (let i = 0; i < 1000; i++) {
        setCount(i)
      }
    })

    const endTime = performance.now()

    expect(spy).toHaveBeenCalledWith(999)
    expect(spy).toHaveBeenCalledTimes(2) // Initial + final batched update
    expect(endTime - startTime).toBeLessThan(50) // Should be fast
  })
})
