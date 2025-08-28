/**
 * Enhanced State Management Tests
 *
 * Tests for the fixed @State, @Binding, and @EnvironmentObject implementations
 * that now work with proper component context injection.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot } from '../../src/reactive/context'
import {
  createComponentContext,
  createEnvironmentKey,
  runWithComponentContext,
  setCurrentComponentContext,
} from '../../src/runtime/component-context'
import {
  BindingUtils,
  createBinding as createEnhancedBinding,
  isBinding as isEnhancedBinding,
} from '../../src/state/binding'
import {
  CommonEnvironmentKeys,
  createObservableEnvironmentObject,
  EnvironmentObject,
  EnvironmentObjectUtils,
  isEnvironmentObject,
  provideEnvironmentObject,
} from '../../src/state/environment'
import { isBinding, isState, State } from '../../src/state/state'

describe('Enhanced State Management', () => {
  let context: any
  let dispose: (() => void) | undefined

  beforeEach(() => {
    dispose = createRoot((d) => {
      dispose = d
      context = createComponentContext('test-component')
      setCurrentComponentContext(context)
      return d
    })
  })

  afterEach(() => {
    setCurrentComponentContext(null)
    if (dispose) {
      dispose()
    }
  })

  describe('@State Property Wrapper', () => {
    it('creates state with initial value', () => {
      runWithComponentContext(context, () => {
        const state = State(42)

        expect(isState(state)).toBe(true)
        expect(state.wrappedValue).toBe(42)
        expect(state.accessor()).toBe(42)
      })
    })

    it('updates state value reactively', () => {
      runWithComponentContext(context, () => {
        const state = State(0)

        state.wrappedValue = 10
        expect(state.wrappedValue).toBe(10)
        expect(state.accessor()).toBe(10)
      })
    })

    it('provides projected binding', () => {
      runWithComponentContext(context, () => {
        const state = State('hello')
        const binding = state.projectedValue

        expect(isBinding(binding)).toBe(true)
        expect(binding.wrappedValue).toBe('hello')

        binding.wrappedValue = 'world'
        expect(state.wrappedValue).toBe('world')
      })
    })

    it('stores state in component context', () => {
      runWithComponentContext(context, () => {
        const state = State(42)

        // State should be registered in component context
        expect(context.hasState(state.metadata.propertyName)).toBe(true)
      })
    })

    it('handles persistence when configured', () => {
      const originalLocalStorage = global.localStorage
      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue(null), // Return null when no item exists
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      }

      Object.defineProperty(global, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      })

      runWithComponentContext(context, () => {
        const _state = State(42, { persist: true })

        expect(mockLocalStorage.getItem).toHaveBeenCalled()
      })

      global.localStorage = originalLocalStorage
    })

    it('handles cleanup on component unmount', () => {
      const cleanupSpy = vi.fn()

      runWithComponentContext(context, () => {
        const state = State(42)
        // Mock the cleanup
        state.cleanup = cleanupSpy
      })

      context.dispose()

      // Cleanup should be called when context is disposed
      expect(context.cleanup.size).toBe(0) // Cleanup functions should be cleared
    })
  })

  describe('@Binding Property Wrapper', () => {
    it('creates binding from getter/setter', () => {
      runWithComponentContext(context, () => {
        let value = 42
        const binding = createEnhancedBinding(
          () => value,
          (newValue) => {
            value = typeof newValue === 'function' ? newValue(value) : newValue
          }
        )

        expect(isEnhancedBinding(binding)).toBe(true)
        expect(binding.wrappedValue).toBe(42)

        binding.wrappedValue = 100
        expect(value).toBe(100)
        expect(binding.wrappedValue).toBe(100)
      })
    })

    it('creates mapped binding with transformation', () => {
      runWithComponentContext(context, () => {
        let value = 42
        const binding = createEnhancedBinding(
          () => value,
          (newValue) => {
            value = typeof newValue === 'function' ? newValue(value) : newValue
          }
        )

        const mappedBinding = binding.map(
          (v) => v.toString(),
          (strValue, _oldValue) => parseInt(strValue, 10)
        )

        expect(mappedBinding.wrappedValue).toBe('42')

        mappedBinding.wrappedValue = '100'
        expect(value).toBe(100)
      })
    })

    it('creates constant binding (read-only)', () => {
      runWithComponentContext(context, () => {
        let value = 42
        const binding = createEnhancedBinding(
          () => value,
          (newValue) => {
            value = typeof newValue === 'function' ? newValue(value) : newValue
          }
        )

        const constantBinding = binding.constant()

        expect(constantBinding.wrappedValue).toBe(42)

        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

        // Setting should warn but not change value
        constantBinding.wrappedValue = 100
        expect(constantBinding.wrappedValue).toBe(42)
        expect(consoleSpy).toHaveBeenCalledWith('Attempted to set value on constant binding')

        consoleSpy.mockRestore()
      })
    })

    it('creates validated binding', () => {
      runWithComponentContext(context, () => {
        let value = 42
        const binding = createEnhancedBinding(
          () => value,
          (newValue) => {
            value = typeof newValue === 'function' ? newValue(value) : newValue
          }
        )

        const validatedBinding = binding.withValidation((v) => v >= 0, 'Value must be non-negative')

        validatedBinding.wrappedValue = 100
        expect(value).toBe(100)

        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

        // Invalid value should not be set
        validatedBinding.wrappedValue = -5
        expect(value).toBe(100) // Should remain unchanged
        expect(consoleSpy).toHaveBeenCalledWith('Value must be non-negative')

        consoleSpy.mockRestore()
      })
    })

    it('creates debounced binding', async () => {
      let value = 42
      let debouncedBinding: any

      runWithComponentContext(context, () => {
        const binding = createEnhancedBinding(
          () => value,
          (newValue) => {
            value = typeof newValue === 'function' ? newValue(value) : newValue
          }
        )

        debouncedBinding = binding.debounced(50)

        debouncedBinding.wrappedValue = 100
        debouncedBinding.wrappedValue = 200
        debouncedBinding.wrappedValue = 300

        // Value should not change immediately
        expect(value).toBe(42)
      })

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Should have the final value
      expect(value).toBe(300)
    })

    it('triggers component re-render on value change', () => {
      runWithComponentContext(context, () => {
        let value = 42
        const binding = createEnhancedBinding(
          () => value,
          (newValue) => {
            value = typeof newValue === 'function' ? newValue(value) : newValue
          }
        )

        const initialUpdateCount = context.getMetrics().updateCount

        binding.wrappedValue = 100

        // Should trigger update in component context
        const finalUpdateCount = context.getMetrics().updateCount
        expect(finalUpdateCount).toBeGreaterThan(initialUpdateCount)
      })
    })
  })

  describe('Binding Utilities', () => {
    it('checks if binding is read-only', () => {
      runWithComponentContext(context, () => {
        let value = 42
        const normalBinding = createEnhancedBinding(
          () => value,
          (newValue) => {
            value = typeof newValue === 'function' ? newValue(value) : newValue
          }
        )

        const readOnlyBinding = normalBinding.constant()

        expect(BindingUtils.isReadOnly(normalBinding)).toBe(false)
        expect(BindingUtils.isReadOnly(readOnlyBinding)).toBe(true)
      })
    })

    it('creates computed binding from multiple sources', () => {
      runWithComponentContext(context, () => {
        let value1 = 10
        let value2 = 20

        const binding1 = createEnhancedBinding(
          () => value1,
          (newValue) => {
            value1 = typeof newValue === 'function' ? newValue(value1) : newValue
          }
        )

        const binding2 = createEnhancedBinding(
          () => value2,
          (newValue) => {
            value2 = typeof newValue === 'function' ? newValue(value2) : newValue
          }
        )

        const computedBinding = BindingUtils.computed([binding1, binding2], (a, b) => a + b)

        expect(computedBinding.wrappedValue).toBe(30)

        binding1.wrappedValue = 15
        expect(computedBinding.wrappedValue).toBe(35)
      })
    })

    it('chains multiple bindings together', () => {
      runWithComponentContext(context, () => {
        const values = [1, 2, 3]
        const bindings = values.map((_, index) =>
          createEnhancedBinding(
            () => values[index],
            (newValue) => {
              values[index] = typeof newValue === 'function' ? newValue(values[index]) : newValue
            }
          )
        )

        const chainedBinding = BindingUtils.chain(bindings)

        expect(chainedBinding.wrappedValue).toEqual([1, 2, 3])

        chainedBinding.wrappedValue = [10, 20, 30]
        expect(values).toEqual([10, 20, 30])
      })
    })
  })

  describe('@EnvironmentObject Property Wrapper', () => {
    it('creates environment object with key', () => {
      const TestKey = createEnvironmentKey<string>('TestService')

      runWithComponentContext(context, () => {
        provideEnvironmentObject(TestKey, 'test-value')
        const envObject = EnvironmentObject(TestKey)

        expect(isEnvironmentObject(envObject)).toBe(true)
        expect(envObject.key).toBe(TestKey)
        expect(envObject.wrappedValue).toBe('test-value')
      })
    })

    it('creates observable environment object', () => {
      interface TestData {
        count: number
        name: string
      }

      runWithComponentContext(context, () => {
        const TestKey = createEnvironmentKey<any>('TestData')
        const observable = createObservableEnvironmentObject(TestKey, {
          count: 0,
          name: 'test',
        })

        expect(observable.value.count).toBe(0)
        expect(observable.value.name).toBe('test')

        observable.updateProperty('count', 42)
        expect(observable.value.count).toBe(42)
      })
    })

    it('subscribes to observable environment object changes', () => {
      runWithComponentContext(context, () => {
        const TestKey = createEnvironmentKey<any>('TestData')
        const observable = createObservableEnvironmentObject(TestKey, {
          count: 0,
        })

        const subscriber = vi.fn()
        const unsubscribe = observable.subscribe(subscriber)

        observable.updateProperty('count', 42)
        expect(subscriber).toHaveBeenCalledTimes(1)

        unsubscribe()
        observable.updateProperty('count', 100)
        expect(subscriber).toHaveBeenCalledTimes(1) // Should not be called again
      })
    })

    it('triggers component re-render when environment object changes', () => {
      runWithComponentContext(context, () => {
        const TestKey = createEnvironmentKey<any>('TestData')
        const observable = createObservableEnvironmentObject(TestKey, {
          count: 0,
        })

        provideEnvironmentObject(TestKey, observable)
        const envObject = EnvironmentObject(TestKey)

        const initialUpdateCount = context.getMetrics().updateCount

        // Access the environment object to establish subscription
        const _value = envObject.wrappedValue

        // Change the observable
        observable.updateProperty('count', 42)

        // Should trigger update in component context
        const finalUpdateCount = context.getMetrics().updateCount
        expect(finalUpdateCount).toBeGreaterThan(initialUpdateCount)
      })
    })

    it('cleans up environment object subscriptions', () => {
      runWithComponentContext(context, () => {
        const TestKey = createEnvironmentKey<any>('TestData')
        const observable = createObservableEnvironmentObject(TestKey, {
          count: 0,
        })

        provideEnvironmentObject(TestKey, observable)
        const envObject = EnvironmentObject(TestKey)

        // Access to establish subscription
        const _value = envObject.wrappedValue

        expect(observable._subscribers.size).toBe(1)

        // Cleanup should happen when context is disposed
        context.dispose()

        expect(observable._subscribers.size).toBe(0)
      })
    })
  })

  describe('Environment Object Utilities', () => {
    it('checks if environment object is available', () => {
      const TestKey = createEnvironmentKey<string>('TestService')

      runWithComponentContext(context, () => {
        expect(EnvironmentObjectUtils.isAvailable(TestKey)).toBe(false)

        provideEnvironmentObject(TestKey, 'test-value')
        expect(EnvironmentObjectUtils.isAvailable(TestKey)).toBe(true)
      })
    })

    it('peeks environment object value without creating dependency', () => {
      const TestKey = createEnvironmentKey<string>('TestService')

      runWithComponentContext(context, () => {
        expect(EnvironmentObjectUtils.peek(TestKey)).toBeUndefined()

        provideEnvironmentObject(TestKey, 'test-value')
        expect(EnvironmentObjectUtils.peek(TestKey)).toBe('test-value')
      })
    })

    it('creates derived environment object', () => {
      const SourceKey = createEnvironmentKey<number>('SourceData')
      const DerivedKey = createEnvironmentKey<string>('DerivedData')

      runWithComponentContext(context, () => {
        provideEnvironmentObject(SourceKey, 42)

        EnvironmentObjectUtils.derived(SourceKey, DerivedKey, (value) => `Number: ${value}`)

        const derivedObject = EnvironmentObject(DerivedKey)
        expect(derivedObject.wrappedValue).toBe('Number: 42')
      })
    })

    it('creates scoped environment context', () => {
      const setupSpy = vi.fn()
      const cleanupSpy = vi.fn()

      runWithComponentContext(context, () => {
        const cleanup = EnvironmentObjectUtils.scoped(setupSpy, cleanupSpy)

        expect(setupSpy).toHaveBeenCalledTimes(1)

        cleanup()
        expect(cleanupSpy).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Common Environment Keys', () => {
    it('provides theme environment key with defaults', () => {
      runWithComponentContext(context, () => {
        const themeObject = EnvironmentObject(CommonEnvironmentKeys.Theme)

        expect(themeObject.wrappedValue.mode).toBe('light')
        expect(themeObject.wrappedValue.primaryColor).toBe('#007AFF')
        expect(themeObject.wrappedValue.secondaryColor).toBe('#5856D6')
      })
    })

    it('allows overriding common environment keys', () => {
      runWithComponentContext(context, () => {
        const customTheme = {
          mode: 'dark' as const,
          primaryColor: '#FF0000',
          secondaryColor: '#00FF00',
        }

        provideEnvironmentObject(CommonEnvironmentKeys.Theme, customTheme)
        const themeObject = EnvironmentObject(CommonEnvironmentKeys.Theme)

        expect(themeObject.wrappedValue.mode).toBe('dark')
        expect(themeObject.wrappedValue.primaryColor).toBe('#FF0000')
      })
    })
  })

  describe('Integration Tests', () => {
    it('integrates State, Binding, and EnvironmentObject', () => {
      const ServiceKey = createEnvironmentKey<{ getValue: () => number }>('NumberService')

      runWithComponentContext(context, () => {
        // Provide environment service
        const numberService = {
          getValue: () => 42,
        }
        provideEnvironmentObject(ServiceKey, numberService)

        // Create state
        const state = State(0)

        // Create binding from state
        const binding = state.projectedValue

        // Get environment object
        const service = EnvironmentObject(ServiceKey)

        // Use service to update state via binding
        binding.wrappedValue = service.wrappedValue.getValue()

        expect(state.wrappedValue).toBe(42)
      })
    })

    it('maintains reactivity across all property wrappers', () => {
      const ServiceKey = createEnvironmentKey<any>('ReactiveService')

      runWithComponentContext(context, () => {
        // Create observable service
        const observableService = createObservableEnvironmentObject(ServiceKey, {
          count: 0,
        })
        provideEnvironmentObject(ServiceKey, observableService)

        // Create state that depends on service
        const state = State(0)
        const service = EnvironmentObject(ServiceKey)

        // Update state to match service
        const serviceValue = service.wrappedValue
        expect(serviceValue).toBeDefined()

        // The service value should be the observable environment object
        expect(serviceValue.value).toBeDefined()
        expect(serviceValue.value.count).toBe(0)

        state.wrappedValue = serviceValue.value.count
        expect(state.wrappedValue).toBe(0)

        // Update service
        observableService.updateProperty('count', 100)

        // Manual sync (in real usage, this would be automatic via reactive effects)
        state.wrappedValue = service.wrappedValue.value.count
        expect(state.wrappedValue).toBe(100)
      })
    })
  })
})
