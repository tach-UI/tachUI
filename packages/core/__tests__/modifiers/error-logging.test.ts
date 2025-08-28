/**
 * Error Logging Test
 *
 * Verifies that error logging works in production but is suppressed in tests
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { applyModifiersToNode } from '../../src/modifiers/registry'

describe('Error Logging in Batch Mode', () => {
  let consoleSpy: any
  let originalNodeEnv: string | undefined

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    originalNodeEnv = process.env.NODE_ENV
  })

  afterEach(() => {
    consoleSpy.mockRestore()
    process.env.NODE_ENV = originalNodeEnv
  })

  it('should suppress console.error in test environment', () => {
    // Ensure we're in test environment
    process.env.NODE_ENV = 'test'

    const node = { type: 'element' as const, tag: 'div' }
    const errorModifier = {
      type: 'test-error',
      priority: 1,
      properties: {},
      apply: () => {
        throw new Error('Test error')
      },
    }

    // This should not throw and should not log
    expect(() => {
      applyModifiersToNode(
        node,
        [errorModifier],
        {
          componentId: 'test',
          phase: 'creation',
        },
        { batch: true }
      )
    }).not.toThrow()

    // Console.error should not have been called due to test environment
    expect(consoleSpy).not.toHaveBeenCalled()
  })

  it('should log console.error in production environment', () => {
    // Simulate production environment
    process.env.NODE_ENV = 'production'

    const node = { type: 'element' as const, tag: 'div' }
    const errorModifier = {
      type: 'production-error',
      priority: 1,
      properties: {},
      apply: () => {
        throw new Error('Production error')
      },
    }

    // This should not throw but should log
    expect(() => {
      applyModifiersToNode(
        node,
        [errorModifier],
        {
          componentId: 'production-test',
          phase: 'creation',
        },
        { batch: true }
      )
    }).not.toThrow()

    // Console.error should have been called in production
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to apply modifier production-error:',
      expect.any(Error)
    )
  })
})
