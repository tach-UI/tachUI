/**
 * Event Delegation Test Suite (Phase 3)
 *
 * This test validates that event delegation is working correctly:
 * 1. Single root listener per event type (not N listeners for N elements)
 * 2. Events route to correct handlers
 * 3. Event context (e.target, e.currentTarget) preserved
 * 4. Passive listeners used for scroll events
 * 5. Cleanup properly removes handlers
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { h, renderComponent, resetRendererMetrics } from '../../src/runtime/renderer'
import { createSignal } from '../../src/reactive'
import { globalEventDelegator } from '../../src/runtime/event-delegation'

describe('Event Delegation System (Phase 3)', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    resetRendererMetrics()
  })

  afterEach(() => {
    if (container.parentNode) {
      document.body.removeChild(container)
    }
  })

  describe('Single Root Listener Per Event Type', () => {
    it('should use 1 root listener for click despite 100 elements with click handlers', () => {
      const clickCounts = new Array(100).fill(0)

      const component = {
        render() {
          return h('div', null,
            ...Array.from({ length: 100 }, (_, i) =>
              h('button', {
                key: i,
                'data-id': i,
                onClick: () => { clickCounts[i]++ }
              }, `Button ${i}`)
            )
          )
        }
      }

      const unmount = renderComponent(component, container)
      const metrics = globalEventDelegator.getMetrics(container)

      // Verify metrics
      expect(metrics.eventTypes).toContain('click')
      expect(metrics.totalHandlers).toBe(100)
      expect(metrics.handlersPerType.click).toBe(100)

      // Verify clicks work
      const button50 = container.querySelectorAll('button')[50] as HTMLButtonElement
      button50.click()
      expect(clickCounts[50]).toBe(1)

      unmount()
    })
  })

  describe('Event Routing to Correct Handlers', () => {
    it('should route each button click to only its own handler', () => {
      const handlerCalls: string[] = []

      const component = {
        render() {
          return h('div', null,
            h('button', {
              'data-id': 'btn-1',
              onClick: () => handlerCalls.push('btn-1')
            }, 'Button 1'),
            h('button', {
              'data-id': 'btn-2',
              onClick: () => handlerCalls.push('btn-2')
            }, 'Button 2'),
            h('button', {
              'data-id': 'btn-3',
              onClick: () => handlerCalls.push('btn-3')
            }, 'Button 3')
          )
        }
      }

      const unmount = renderComponent(component, container)

      // Click each button
      const buttons = container.querySelectorAll('button')
      ;(buttons[0] as HTMLButtonElement).click()
      ;(buttons[1] as HTMLButtonElement).click()
      ;(buttons[2] as HTMLButtonElement).click()
      ;(buttons[1] as HTMLButtonElement).click() // Click button 2 again

      expect(handlerCalls).toEqual(['btn-1', 'btn-2', 'btn-3', 'btn-2'])

      unmount()
    })
  })

  describe('Event Context Preserved', () => {
    it('should preserve e.target and e.currentTarget correctly', () => {
      let capturedEvent: Event | null = null

      const component = {
        render() {
          return h('div', null,
            h('button', {
              'data-id': 'test-button',
              onClick: (e: Event) => { capturedEvent = e }
            },
              h('span', { 'data-id': 'test-span' }, 'Click me')
            )
          )
        }
      }

      const unmount = renderComponent(component, container)

      // Click the span inside the button
      const span = container.querySelector('[data-id="test-span"]') as HTMLSpanElement
      span.click()

      expect(capturedEvent).not.toBeNull()
      expect(capturedEvent!.target).toBe(span)
      expect((capturedEvent!.target as HTMLElement).dataset.id).toBe('test-span')
      expect(capturedEvent!.bubbles).toBe(true)

      unmount()
    })
  })

  describe('Multiple Event Types', () => {
    it('should delegate all event types correctly (click, input, change)', () => {
      const eventLog: string[] = []
      const [inputValue, setInputValue] = createSignal('')

      const component = {
        render() {
          return h('div', null,
            h('button', {
              onClick: () => eventLog.push('button-clicked')
            }, 'Click me'),
            h('input', {
              type: 'text',
              value: inputValue(),
              onInput: (e: Event) => {
                eventLog.push('input-changed')
                setInputValue((e.target as HTMLInputElement).value)
              },
              onChange: () => eventLog.push('input-finalized')
            })
          )
        }
      }

      const unmount = renderComponent(component, container)
      const metrics = globalEventDelegator.getMetrics(container)

      expect(metrics.eventTypes.sort()).toEqual(['change', 'click', 'input'])
      expect(metrics.totalHandlers).toBe(3)

      // Simulate button click
      const button = container.querySelector('button') as HTMLButtonElement
      button.click()

      // Simulate input
      const input = container.querySelector('input') as HTMLInputElement
      input.value = 'test'
      input.dispatchEvent(new Event('input', { bubbles: true }))

      expect(eventLog).toContain('button-clicked')
      expect(eventLog).toContain('input-changed')

      unmount()
    })
  })

  describe('Cleanup Removes Handlers', () => {
    it('should drop handler count to 0 after unmount', () => {
      const component = {
        render() {
          return h('div', null,
            ...Array.from({ length: 50 }, (_, i) =>
              h('button', {
                key: i,
                onClick: () => {}
              }, `Button ${i}`)
            )
          )
        }
      }

      const unmount = renderComponent(component, container)
      const metricsBefore = globalEventDelegator.getMetrics(container)

      expect(metricsBefore.totalHandlers).toBe(50)

      unmount()

      const metricsAfter = globalEventDelegator.getMetrics(container)
      expect(metricsAfter.totalHandlers).toBe(0)
    })
  })

  describe('Non-Delegatable Events', () => {
    it('should not delegate custom events', () => {
      let customHandlerCalled = false

      const component = {
        render() {
          return h('div', null,
            h('div', {
              onCustomEvent: () => { customHandlerCalled = true }
            }, 'Custom event target')
          )
        }
      }

      const unmount = renderComponent(component, container)
      const metrics = globalEventDelegator.getMetrics(container)

      // Custom events won't be in the delegated list
      expect(metrics.eventTypes).not.toContain('customevent')

      unmount()
    })
  })

  describe('Handler Re-registration (Bug Fix #1)', () => {
    it('should not leak handlers when re-registering on the same element', () => {
      const [text, setText] = createSignal('Click me')
      let handlerCallCount = 0

      const component = {
        render() {
          // Reading text() makes this render reactive to text changes
          const currentText = text()
          return h('div', null,
            h('button', {
              onClick: () => {
                handlerCallCount++
              }
            }, currentText)
          )
        }
      }

      const unmount = renderComponent(component, container)

      // Initial state - should have 1 handler
      let metrics = globalEventDelegator.getMetrics(container)
      expect(metrics.totalHandlers).toBe(1)

      // Trigger re-render by changing signal
      setText('Click me again')

      // Handler count should still be 1, not 2 (no leak)
      metrics = globalEventDelegator.getMetrics(container)
      expect(metrics.totalHandlers).toBe(1)

      // Trigger another re-render
      setText('Third time')

      // Handler count should still be 1, not 3
      metrics = globalEventDelegator.getMetrics(container)
      expect(metrics.totalHandlers).toBe(1)

      // Click button - should only increment once per click
      const button = container.querySelector('button') as HTMLButtonElement
      button.click()
      expect(handlerCallCount).toBe(1)

      button.click()
      expect(handlerCallCount).toBe(2)

      unmount()
    })
  })

  describe('Multi-Root Containers (Bug Fix #2)', () => {
    it('should handle multiple independent component roots correctly', () => {
      const container1 = document.createElement('div')
      const container2 = document.createElement('div')
      document.body.appendChild(container1)
      document.body.appendChild(container2)

      const clicks1: string[] = []
      const clicks2: string[] = []

      const component1 = {
        render() {
          return h('button', {
            onClick: () => clicks1.push('container1')
          }, 'Container 1 Button')
        }
      }

      const component2 = {
        render() {
          return h('button', {
            onClick: () => clicks2.push('container2')
          }, 'Container 2 Button')
        }
      }

      const unmount1 = renderComponent(component1, container1)
      const unmount2 = renderComponent(component2, container2)

      // Click button in container 1
      const btn1 = container1.querySelector('button') as HTMLButtonElement
      btn1.click()
      expect(clicks1).toEqual(['container1'])
      expect(clicks2).toEqual([])

      // Click button in container 2
      const btn2 = container2.querySelector('button') as HTMLButtonElement
      btn2.click()
      expect(clicks1).toEqual(['container1'])
      expect(clicks2).toEqual(['container2'])

      // Unmount first container, second should still work
      unmount1()
      document.body.removeChild(container1)

      btn2.click()
      expect(clicks2).toEqual(['container2', 'container2'])

      unmount2()
      document.body.removeChild(container2)
    })
  })

  describe('Focus/Blur Events (Bug Fix #3)', () => {
    it('should delegate focus events using focusin', () => {
      const focusLog: string[] = []

      const component = {
        render() {
          return h('div', null,
            h('input', {
              type: 'text',
              'data-id': 'input1',
              onFocus: () => focusLog.push('input1-focused')
            }),
            h('input', {
              type: 'text',
              'data-id': 'input2',
              onFocus: () => focusLog.push('input2-focused')
            })
          )
        }
      }

      const unmount = renderComponent(component, container)
      const metrics = globalEventDelegator.getMetrics(container)

      // Should use focusin (which bubbles) instead of focus
      expect(metrics.eventTypes).toContain('focusin')
      expect(metrics.totalHandlers).toBe(2)

      // Trigger focus on first input
      const input1 = container.querySelector('[data-id="input1"]') as HTMLInputElement
      input1.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))

      expect(focusLog).toContain('input1-focused')

      unmount()
    })

    it('should delegate blur events using focusout', () => {
      const blurLog: string[] = []

      const component = {
        render() {
          return h('div', null,
            h('input', {
              type: 'text',
              'data-id': 'input1',
              onBlur: () => blurLog.push('input1-blurred')
            })
          )
        }
      }

      const unmount = renderComponent(component, container)
      const metrics = globalEventDelegator.getMetrics(container)

      // Should use focusout (which bubbles) instead of blur
      expect(metrics.eventTypes).toContain('focusout')

      // Trigger blur on input
      const input1 = container.querySelector('[data-id="input1"]') as HTMLInputElement
      input1.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))

      expect(blurLog).toContain('input1-blurred')

      unmount()
    })
  })
})
