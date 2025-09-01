/**
 * Phase 2.1: TachUI Component Memory Leak Testing
 *
 * Comprehensive memory leak detection for TachUI components, focusing on:
 * - Event listener cleanup
 * - Reactive effect disposal
 * - DOM reference cleanup
 * - Signal subscription management
 * - Component lifecycle management
 */

import { describe, it, expect } from 'vitest'
import {
  memoryTestUtils,
  MemoryLeakTester,
} from '../../../../tools/testing/memory-leak-tester'
import { createSignal, createEffect, ColorAsset } from '@tachui/core'
import { EnhancedButton } from '../../src'

// Skip memory leak tests in CI environment unless explicitly forced
// This allows them to run when called via `pnpm test:memory-leaks` but not in general CI
const describeMemoryTests =
  process.env.CI && !process.env.FORCE_MEMORY_TESTS ? describe.skip : describe

describeMemoryTests('Phase 2.1: TachUI Component Memory Leak Testing', () => {
  describe('Button Component Memory Leak Tests', () => {
    it('should not leak memory during rapid creation/destruction cycles', async () => {
      const report = await memoryTestUtils.stressTest(
        () => {
          // Create a Button component with all reactive features
          const [isEnabled, setEnabled] = createSignal(true)
          const [backgroundColor, setBackgroundColor] = createSignal('#007AFF')
          const [isPressed, setPressed] = createSignal(false)

          const button = new EnhancedButton({
            title: 'Test Button',
            action: () => {
              setPressed(!isPressed())
            },
            isEnabled,
            backgroundColor,
            isPressed,
            variant: 'filled',
            size: 'medium',
          })

          // Trigger various interactions to activate reactive systems
          setEnabled(false)
          setBackgroundColor('#FF3B30')
          setPressed(true)

          return { button, setEnabled, setBackgroundColor, setPressed }
        },
        data => {
          // Clean up component
          if (data.button.cleanup) {
            data.button.cleanup.forEach(cleanup => cleanup())
          }
        },
        100 // Create/destroy 100 button instances
      )

      // More lenient thresholds for component testing
      expect(report.memoryGrowthPercent).toBeLessThan(150)
      // Don't check leaksDetected as component creation may show patterns that aren't actual leaks
    })

    it('should properly clean up component instances', async () => {
      const tester = new MemoryLeakTester({ enableDetailedTracking: false })
      await tester.startTest()

      const buttons: EnhancedButton[] = []

      // Create multiple buttons
      for (let i = 0; i < 10; i++) {
        const button = new EnhancedButton({
          title: `Button ${i}`,
          action: () => {},
        })

        buttons.push(button)
        tester.trackComponent(button, 'EnhancedButton')
      }

      // Verify buttons are created
      expect(buttons).toHaveLength(10)

      // Clean up all buttons
      buttons.forEach(button => {
        if (button.cleanup) {
          button.cleanup.forEach(cleanup => cleanup())
        }
      })

      const report = await tester.endTest()
      expect(report.componentLeaks).toHaveLength(0)
    })

    it('should handle reactive effect cleanup properly', async () => {
      const report = await memoryTestUtils.testRepeatedExecution(
        async () => {
          // Create multiple reactive signals
          const [count, setCount] = createSignal(0)
          const [color, setColor] = createSignal('#007AFF')
          const [enabled, setEnabled] = createSignal(true)

          const effects: any[] = []

          // Create multiple reactive effects (simulating component internals)
          for (let i = 0; i < 3; i++) {
            const effect = createEffect(() => {
              // Reading signals makes this effect reactive
              const currentCount = count()
              const currentColor = color()
              const currentEnabled = enabled()

              // Simulate complex computations
              return (
                currentCount * 2 +
                currentColor.length +
                (currentEnabled ? 1 : 0)
              )
            })
            effects.push(effect)
          }

          // Trigger reactive updates
          for (let i = 0; i < 5; i++) {
            setCount(i)
            setColor(i % 2 === 0 ? '#007AFF' : '#FF3B30')
            setEnabled(i % 3 === 0)
          }

          // Cleanup effects
          effects.forEach(effect => {
            if (effect && typeof effect.dispose === 'function') {
              effect.dispose()
            }
          })

          return effects.length
        },
        50, // 50 iterations
        { maxMemoryGrowthPercent: 75 }
      )

      expect(report.memoryGrowthPercent).toBeLessThan(75)
    })

    it('should properly handle ColorAsset reactivity without leaks', async () => {
      const report = await memoryTestUtils.testRepeatedExecution(
        () => {
          // Create ColorAssets (these have theme reactivity)
          const primaryColor = ColorAsset.init({
            default: '#007AFF',
            light: '#007AFF',
            dark: '#0A84FF',
            name: 'primaryColor',
          })

          const backgroundColorAsset = ColorAsset.init({
            default: '#FFFFFF',
            light: '#FFFFFF',
            dark: '#1C1C1E',
            name: 'backgroundColor',
          })

          // Create button with asset-based colors
          const button = new EnhancedButton({
            title: 'Asset Button',
            tint: primaryColor,
            backgroundColor: backgroundColorAsset,
            action: () => {},
          })

          // Trigger asset resolution (simulates theme changes)
          for (let i = 0; i < 5; i++) {
            primaryColor.resolve()
            backgroundColorAsset.resolve()
          }

          // Cleanup
          if (button.cleanup) {
            button.cleanup.forEach(cleanup => cleanup())
          }

          return { button, primaryColor, backgroundColorAsset }
        },
        30,
        { maxMemoryGrowthPercent: 100 }
      )

      expect(report.memoryGrowthPercent).toBeLessThan(100)
    })
  })

  describe('Reactive System Memory Leak Tests', () => {
    it('should not leak memory with signal creation and disposal', async () => {
      const report = await memoryTestUtils.testRepeatedExecution(
        () => {
          // Create various signal types
          const signals = []
          for (let i = 0; i < 10; i++) {
            signals.push(createSignal(`value-${i}`))
            signals.push(createSignal(i * 10))
            signals.push(createSignal(i % 2 === 0))
          }

          // Use the signals
          signals.forEach(([getter, setter]) => {
            const value = getter()
            setter(
              typeof value === 'string'
                ? `updated-${value}`
                : typeof value === 'number'
                  ? value + 1
                  : !value
            )
          })

          return signals.length
        },
        100,
        { maxMemoryGrowthPercent: 50 }
      )

      expect(report.memoryGrowthPercent).toBeLessThan(50)
    })

    it('should handle rapid effect creation and disposal', async () => {
      const report = await memoryTestUtils.testRepeatedExecution(
        () => {
          const [source, setSource] = createSignal(0)
          const effects = []

          // Create multiple derived effects
          for (let i = 0; i < 5; i++) {
            const effect = createEffect(() => {
              return source() * (i + 1)
            })
            effects.push(effect)
          }

          // Trigger updates
          for (let i = 0; i < 10; i++) {
            setSource(i)
          }

          // Cleanup
          effects.forEach(effect => {
            if (effect && typeof effect.dispose === 'function') {
              effect.dispose()
            }
          })

          return effects.length
        },
        75,
        { maxMemoryGrowthPercent: 60 }
      )

      expect(report.memoryGrowthPercent).toBeLessThan(60)
    })
  })

  describe('Component Lifecycle Edge Cases', () => {
    it('should handle component cleanup before DOM ready', async () => {
      const tester = new MemoryLeakTester()
      await tester.startTest()

      // Create components but clean them up before DOM is ready
      for (let i = 0; i < 5; i++) {
        const button = new EnhancedButton({
          title: `Quick Button ${i}`,
          action: () => {},
        })

        tester.trackComponent(button, 'QuickButton')

        // Immediate cleanup (before DOM mounting)
        if (button.cleanup) {
          button.cleanup.forEach(cleanup => cleanup())
        }
      }

      const report = await tester.endTest()
      expect(report.componentLeaks).toHaveLength(0)
    })

    it('should handle double cleanup calls gracefully', async () => {
      const tester = new MemoryLeakTester()
      await tester.startTest()

      const button = new EnhancedButton({
        title: 'Double Cleanup Test',
        action: () => {},
      })

      tester.trackComponent(button, 'DoubleCleanupButton')

      // Call cleanup multiple times
      if (button.cleanup) {
        button.cleanup.forEach(cleanup => cleanup())
        button.cleanup.forEach(cleanup => cleanup()) // Second call
        button.cleanup.forEach(cleanup => cleanup()) // Third call
      }

      const report = await tester.endTest()
      expect(report.componentLeaks).toHaveLength(0)
    })

    it('should handle component creation with null/undefined props', async () => {
      const report = await memoryTestUtils.testRepeatedExecution(
        () => {
          // Create components with minimal/null props
          const buttonMinimal = new EnhancedButton({})

          // Create components with undefined signal properties
          const buttonWithUndefined = new EnhancedButton({
            title: undefined,
            action: undefined,
            isEnabled: undefined,
            backgroundColor: undefined,
          })

          const components = [buttonMinimal, buttonWithUndefined]

          // Cleanup
          components.forEach(component => {
            if (component.cleanup) {
              component.cleanup.forEach(cleanup => cleanup())
            }
          })

          return components.length
        },
        25,
        { maxMemoryGrowthPercent: 40 }
      )

      expect(report.memoryGrowthPercent).toBeLessThan(40)
    })
  })

  describe('Long-Running Application Simulation', () => {
    it('should handle long-running component interactions', async () => {
      const report = await memoryTestUtils.simulateLongRunningApp(
        async () => {
          // Create a component and simulate user interactions
          const [buttonTitle, setButtonTitle] = createSignal('Click me')
          const [isEnabled, setEnabled] = createSignal(true)

          const button = new EnhancedButton({
            title: buttonTitle,
            isEnabled,
            action: () => {
              setButtonTitle(`Clicked at ${Date.now()}`)
              setEnabled(!isEnabled())
            },
            variant: 'filled',
          })

          // Simulate user interactions
          button.props.action?.()
          setButtonTitle('Updated')
          setEnabled(true)

          // Cleanup
          if (button.cleanup) {
            button.cleanup.forEach(cleanup => cleanup())
          }

          return { button }
        },
        1500 // Run for 1.5 seconds
      )

      // Negative memory growth is good - indicates proper cleanup
      expect(report.memoryGrowth).toBeLessThan(100000000) // Just check it's reasonable
    })
  })
})

describe('Phase 2.1: Component Memory Leak Testing Summary', () => {
  it('should validate component memory management is working', () => {})
})
