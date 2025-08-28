/**
 * Basic Component Context Tests
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  consumeEnvironmentValue,
  createComponentContext,
  createEnvironmentKey,
  getCurrentComponentContext,
  provideEnvironmentValue,
  runWithComponentContext,
  setCurrentComponentContext,
} from '../../src/runtime/component-context'

describe('Component Context Basic Tests', () => {
  beforeEach(() => {
    setCurrentComponentContext(null)
  })

  afterEach(() => {
    setCurrentComponentContext(null)
  })

  it('creates component context', () => {
    const context = createComponentContext('test-component')
    expect(context.id).toBe('test-component')
    expect(context.providers.size).toBe(0)
  })

  it('throws error when accessing context outside component', () => {
    expect(() => {
      getCurrentComponentContext()
    }).toThrow()
  })

  it('provides current context when set', () => {
    const context = createComponentContext('test-component')
    setCurrentComponentContext(context)
    expect(getCurrentComponentContext()).toBe(context)
  })

  it('runs function with context', () => {
    const context = createComponentContext('test-component')
    let capturedContext: any = null

    const result = runWithComponentContext(context, () => {
      capturedContext = getCurrentComponentContext()
      return 'test-result'
    })

    expect(result).toBe('test-result')
    expect(capturedContext).toBe(context)
  })

  it('provides and consumes environment values', () => {
    const context = createComponentContext('test-component')
    const TestKey = createEnvironmentKey<string>('TestKey')

    runWithComponentContext(context, () => {
      provideEnvironmentValue(TestKey, 'test-value')
      const value = consumeEnvironmentValue(TestKey)
      expect(value).toBe('test-value')
    })
  })
})
