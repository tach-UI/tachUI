/**
 * Phase 4.1: Simple Real-World Scenario Test
 *
 * Basic validation that our real-world testing framework works
 * before building complex e-commerce scenarios.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  RealWorldScenarioTester,
  type RealWorldScenario,
} from '../../../../tools/testing/real-world-scenario-tester'
import { createSignal } from '../../src/reactive'
import { VStack, Text, Button } from '@tachui/primitives'
import { DOMRenderer } from '../../src/runtime/renderer'

describe('Phase 4.1: Simple Real-World Scenario Validation', () => {
  let tester: RealWorldScenarioTester

  beforeEach(() => {
    // Clear DOM and set up test root
    document.body.innerHTML = '<div id="test-app-root"></div>'

    tester = new RealWorldScenarioTester({
      enableMemoryTracking: true,
      enablePerformanceTracking: true,
      defaultTimeout: 5000,
    })
  })

  afterEach(() => {
    // Cleanup after each test
    document.body.innerHTML = ''
  })

  afterEach(async () => {
    // Additional cleanup
  })

  it('should execute a basic button click scenario', async () => {
    const basicClickScenario: RealWorldScenario = {
      name: 'Basic Button Click Test',
      description: 'Test basic button interaction and state updates',
      tags: ['basic', 'interaction'],
      estimatedDuration: 2000,

      setup: async () => {
        // Create a simple counter component
        const [count, setCount] = createSignal(0)

        // Simple counter app using basic DOM creation
        const testRoot = document.querySelector('#test-app-root')
        if (!testRoot) {
          throw new Error(
            'Test root element not found. Expected #test-app-root to exist.'
          )
        }
        testRoot.innerHTML = `
          <div class="counter-app">
            <div class="count-display">Count: ${count()}</div>
            <button class="increment-btn" type="button">Increment</button>
            <button class="decrement-btn" type="button">Decrement</button>
            <button class="reset-btn" type="button">Reset</button>
          </div>
        `

        // Attach event listeners
        const incrementBtn = testRoot.querySelector(
          '.increment-btn'
        ) as HTMLButtonElement
        const decrementBtn = testRoot.querySelector(
          '.decrement-btn'
        ) as HTMLButtonElement
        const resetBtn = testRoot.querySelector(
          '.reset-btn'
        ) as HTMLButtonElement
        const countDisplay = testRoot.querySelector(
          '.count-display'
        ) as HTMLDivElement

        incrementBtn.addEventListener('click', () => {
          setCount(count() + 1)
          countDisplay.textContent = `Count: ${count()}`
        })

        decrementBtn.addEventListener('click', () => {
          setCount(count() - 1)
          countDisplay.textContent = `Count: ${count()}`
        })

        resetBtn.addEventListener('click', () => {
          setCount(0)
          countDisplay.textContent = `Count: ${count()}`
        })

        tester.updateState('count', count())
      },

      steps: [
        {
          name: 'Check Initial State',
          description: 'Verify the counter starts at 0',
          actions: [{ type: 'wait', value: 100 }],
          assertions: [
            { type: 'element-exists', selector: '.counter-app' },
            {
              type: 'element-contains',
              selector: '.count-display',
              expected: 'Count: 0',
            },
          ],
        },

        {
          name: 'Increment Counter',
          description: 'Click increment button and verify count increases',
          actions: [
            { type: 'click', target: '.increment-btn' },
            { type: 'wait', value: 100 },
          ],
          assertions: [
            {
              type: 'element-contains',
              selector: '.count-display',
              expected: 'Count: 1',
            },
          ],
        },

        {
          name: 'Multiple Increments',
          description: 'Click increment multiple times',
          actions: [
            { type: 'click', target: '.increment-btn' },
            { type: 'wait', value: 50 },
            { type: 'click', target: '.increment-btn' },
            { type: 'wait', value: 50 },
            { type: 'click', target: '.increment-btn' },
            { type: 'wait', value: 100 },
          ],
          assertions: [
            {
              type: 'element-contains',
              selector: '.count-display',
              expected: 'Count: 4',
            },
          ],
        },

        {
          name: 'Decrement Counter',
          description: 'Click decrement button',
          actions: [
            { type: 'click', target: '.decrement-btn' },
            { type: 'wait', value: 100 },
          ],
          assertions: [
            {
              type: 'element-contains',
              selector: '.count-display',
              expected: 'Count: 3',
            },
          ],
        },

        {
          name: 'Reset Counter',
          description: 'Click reset button to return to 0',
          actions: [
            { type: 'click', target: '.reset-btn' },
            { type: 'wait', value: 100 },
          ],
          assertions: [
            {
              type: 'element-contains',
              selector: '.count-display',
              expected: 'Count: 0',
            },
          ],
        },
      ],

      successCriteria: [
        'Counter starts at 0',
        'Increment button increases count',
        'Decrement button decreases count',
        'Reset button returns count to 0',
        'UI updates reflect state changes',
      ],
    }

    const result = await tester.executeScenario(basicClickScenario)

    // Debug logging
    console.log('Basic Click Test Result:', {
      success: result.success,
      completedSteps: result.completedSteps,
      totalSteps: result.totalSteps,
      errors: result.errors.map(e => ({
        step: e.step,
        message: e.error.message,
      })),
      duration: result.duration,
    })

    // Assertions
    expect(result.success).toBe(true)
    expect(result.completedSteps).toBe(result.totalSteps)
    expect(result.errors).toHaveLength(0)
    expect(result.duration).toBeLessThan(5000)
  }, 8000)

  it('should handle form input scenario', async () => {
    const formInputScenario: RealWorldScenario = {
      name: 'Basic Form Input Test',
      description: 'Test form input and validation',
      tags: ['form', 'input'],
      estimatedDuration: 3000,

      setup: async () => {
        // Create simple form with validation
        const testRoot = document.querySelector('#test-app-root')!
        testRoot.innerHTML = `
          <div class="form-app">
            <form class="test-form">
              <div class="form-group">
                <label for="name">Name:</label>
                <input type="text" name="name" id="name" class="name-input" required>
              </div>
              <div class="form-group">
                <label for="email">Email:</label>
                <input type="email" name="email" id="email" class="email-input" required>
              </div>
              <button type="submit" class="submit-btn">Submit</button>
              <div class="form-message" style="display: none;"></div>
            </form>
          </div>
        `

        const form = testRoot.querySelector('.test-form') as HTMLFormElement
        const messageDiv = testRoot.querySelector(
          '.form-message'
        ) as HTMLDivElement

        // Add click handler to submit button instead of submit event
        const submitBtn = testRoot.querySelector(
          '.submit-btn'
        ) as HTMLButtonElement

        submitBtn.addEventListener('click', e => {
          e.preventDefault()

          const nameInput = form.querySelector(
            '.name-input'
          ) as HTMLInputElement
          const emailInput = form.querySelector(
            '.email-input'
          ) as HTMLInputElement

          if (
            nameInput.value &&
            emailInput.value &&
            emailInput.value.includes('@')
          ) {
            messageDiv.textContent = 'Form submitted successfully!'
            messageDiv.style.display = 'block'
            messageDiv.className = 'form-message success'
          } else {
            messageDiv.textContent = 'Please fill in all fields correctly.'
            messageDiv.style.display = 'block'
            messageDiv.className = 'form-message error'
          }
        })
      },

      steps: [
        {
          name: 'Check Initial Form',
          description: 'Verify form elements are present',
          actions: [{ type: 'wait', value: 100 }],
          assertions: [
            { type: 'element-exists', selector: '.test-form' },
            { type: 'element-exists', selector: '.name-input' },
            { type: 'element-exists', selector: '.email-input' },
          ],
        },

        {
          name: 'Submit Empty Form',
          description: 'Try to submit form without data',
          actions: [
            { type: 'click', target: '.submit-btn' },
            { type: 'wait', value: 200 },
          ],
          assertions: [
            {
              type: 'element-contains',
              selector: '.form-message',
              expected: 'Please fill in all fields correctly.',
            },
          ],
        },

        {
          name: 'Fill Valid Data',
          description: 'Fill form with valid data and submit',
          actions: [
            { type: 'input', target: '.name-input', value: 'John Doe' },
            {
              type: 'input',
              target: '.email-input',
              value: 'john@example.com',
            },
            { type: 'click', target: '.submit-btn' },
            { type: 'wait', value: 200 },
          ],
          assertions: [
            {
              type: 'element-contains',
              selector: '.form-message',
              expected: 'Form submitted successfully!',
            },
          ],
        },
      ],

      successCriteria: [
        'Form validates empty fields',
        'Form accepts valid input',
        'Success message appears on valid submission',
      ],
    }

    const result = await tester.executeScenario(formInputScenario)

    // Debug logging
    console.log('Form Input Test Result:', {
      success: result.success,
      completedSteps: result.completedSteps,
      totalSteps: result.totalSteps,
      errors: result.errors.map(e => ({
        step: e.step,
        message: e.error.message,
      })),
    })

    expect(result.success).toBe(true)
    expect(result.completedSteps).toBe(3)
    expect(result.errors).toHaveLength(0)
  }, 6000)
})
