/**
 * Basic Component Context Tests
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  createDeterministicComponentId,
  consumeEnvironmentValue,
  createComponentContext,
  createEnvironmentKey,
  getCurrentComponentContext,
  provideEnvironmentValue,
  runWithComponentContext,
  setCurrentComponentContext,
} from '../../src/runtime/component-context'
import { createComponent } from '../../src/runtime/component'

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

  it('creates deterministic child IDs from parent structural position', () => {
    const parent = createComponentContext('app:vstack:0')
    parent.beginRenderPass()

    const first = createDeterministicComponentId('Counter', parent)
    const second = createDeterministicComponentId('Counter', parent)

    expect(first).toBe('app:vstack:0:counter:0')
    expect(second).toBe('app:vstack:0:counter:1')
  })

  it('resets sibling index each render pass', () => {
    const parent = createComponentContext('app:vstack:0')

    parent.beginRenderPass()
    expect(createDeterministicComponentId('Counter', parent)).toBe(
      'app:vstack:0:counter:0'
    )

    parent.beginRenderPass()
    expect(createDeterministicComponentId('Counter', parent)).toBe(
      'app:vstack:0:counter:0'
    )
  })

  it('assigns deterministic IDs in createComponent for root and nested renders', () => {
    const Counter = createComponent(
      () => ({ type: 'element' as const, tag: 'div' }),
      { displayName: 'Counter' }
    )

    const rootFirst = Counter({})
    const rootSecond = Counter({})
    expect(rootFirst.id).toBe('app:counter:0')
    expect(rootSecond.id).toBe('app:counter:0')

    const parent = createComponentContext('app:vstack:0')
    parent.beginRenderPass()
    const [nestedFirst, nestedSecond] = runWithComponentContext(parent, () => [
      Counter({}),
      Counter({}),
    ])

    expect(nestedFirst.id).toBe('app:vstack:0:counter:0')
    expect(nestedSecond.id).toBe('app:vstack:0:counter:1')
  })
})
