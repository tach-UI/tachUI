/**
 * Simplified Plugin Utilities Tests - Phase 1 Implementation
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  compareSemver,
  normalizePluginName,
  PluginDevUtils,
  validatePluginName,
  validateSemver,
} from '../../src/plugins/simplified-utils'

describe('Plugin Utils', () => {
  describe('validateSemver', () => {
    it('validates correct semantic versions', () => {
      expect(validateSemver('1.0.0')).toBe(true)
      expect(validateSemver('0.1.0')).toBe(true)
      expect(validateSemver('10.20.30')).toBe(true)
      expect(validateSemver('1.0.0-alpha')).toBe(true)
      expect(validateSemver('1.0.0-alpha.1')).toBe(true)
      expect(validateSemver('1.0.0+build.1')).toBe(true)
    })

    it('rejects invalid semantic versions', () => {
      expect(validateSemver('')).toBe(false)
      expect(validateSemver('1')).toBe(false)
      expect(validateSemver('1.0')).toBe(false)
      expect(validateSemver('v1.0.0')).toBe(false)
      expect(validateSemver('1.0.0.0')).toBe(false)
      expect(validateSemver('abc')).toBe(false)
      expect(validateSemver('1.0.0-')).toBe(false)
    })

    it('handles invalid inputs', () => {
      expect(validateSemver(null as any)).toBe(false)
      expect(validateSemver(undefined as any)).toBe(false)
      expect(validateSemver(123 as any)).toBe(false)
    })
  })

  describe('compareSemver', () => {
    it('compares major versions correctly', () => {
      expect(compareSemver('2.0.0', '1.0.0')).toBe(1)
      expect(compareSemver('1.0.0', '2.0.0')).toBe(-1)
      expect(compareSemver('1.0.0', '1.0.0')).toBe(0)
    })

    it('compares minor versions correctly', () => {
      expect(compareSemver('1.2.0', '1.1.0')).toBe(1)
      expect(compareSemver('1.1.0', '1.2.0')).toBe(-1)
      expect(compareSemver('1.1.0', '1.1.0')).toBe(0)
    })

    it('compares patch versions correctly', () => {
      expect(compareSemver('1.0.2', '1.0.1')).toBe(1)
      expect(compareSemver('1.0.1', '1.0.2')).toBe(-1)
      expect(compareSemver('1.0.1', '1.0.1')).toBe(0)
    })

    it('handles prerelease versions', () => {
      expect(compareSemver('1.0.0-alpha', '1.0.0')).toBe(-1)
      expect(compareSemver('1.0.0', '1.0.0-alpha')).toBe(1)
      expect(compareSemver('1.0.0-alpha', '1.0.0-beta')).toBe(-1)
      expect(compareSemver('1.0.0-beta', '1.0.0-alpha')).toBe(1)
    })

    it('throws on invalid versions', () => {
      expect(() => compareSemver('invalid', '1.0.0')).toThrow()
      expect(() => compareSemver('1.0.0', 'invalid')).toThrow()
    })
  })

  describe('normalizePluginName', () => {
    it('removes scope prefixes', () => {
      expect(normalizePluginName('@tachui/forms')).toBe('forms')
      expect(normalizePluginName('@myorg/plugin')).toBe('plugin')
      expect(normalizePluginName('plugin')).toBe('plugin')
    })

    it('handles edge cases', () => {
      expect(normalizePluginName('@scope/')).toBe('')
      expect(normalizePluginName('@')).toBe('@')
      expect(normalizePluginName('')).toBe('')
    })
  })

  describe('validatePluginName', () => {
    it('validates correct plugin names', () => {
      expect(validatePluginName('plugin')).toBe(true)
      expect(validatePluginName('my-plugin')).toBe(true)
      expect(validatePluginName('plugin_name')).toBe(true)
      expect(validatePluginName('@scope/plugin')).toBe(true)
      expect(validatePluginName('@my-org/my-plugin')).toBe(true)
    })

    it('rejects invalid plugin names', () => {
      expect(validatePluginName('')).toBe(false)
      expect(validatePluginName('Plugin')).toBe(false) // uppercase
      expect(validatePluginName('plugin name')).toBe(false) // space
      expect(validatePluginName('@/plugin')).toBe(false) // invalid scope
      expect(validatePluginName('@scope/')).toBe(false) // missing name
    })

    it('handles invalid inputs', () => {
      expect(validatePluginName(null as any)).toBe(false)
      expect(validatePluginName(undefined as any)).toBe(false)
      expect(validatePluginName(123 as any)).toBe(false)
    })
  })

  describe('PluginDevUtils', () => {
    // Mock console methods
    const originalConsole = { ...console }
    const mockLog = vi.fn()
    const mockWarn = vi.fn()
    const mockGroup = vi.fn()
    const mockGroupEnd = vi.fn()

    beforeEach(() => {
      console.log = mockLog
      console.warn = mockWarn
      console.group = mockGroup
      console.groupEnd = mockGroupEnd
      vi.clearAllMocks()
    })

    afterEach(() => {
      Object.assign(console, originalConsole)
    })

    it('logs in development mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      PluginDevUtils.log('test-plugin', 'test message', { data: 'value' })

      expect(mockGroup).toHaveBeenCalledWith('🔌 [test-plugin]')
      expect(mockLog).toHaveBeenCalledWith('test message')
      expect(mockLog).toHaveBeenCalledWith('Data:', { data: 'value' })
      expect(mockGroupEnd).toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })

    it('does not log in production mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      PluginDevUtils.log('test-plugin', 'test message')

      expect(mockGroup).not.toHaveBeenCalled()
      expect(mockLog).not.toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })

    it('warns in development mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      PluginDevUtils.warn('test-plugin', 'warning message')

      expect(mockWarn).toHaveBeenCalledWith('⚠️  [test-plugin] warning message')

      process.env.NODE_ENV = originalEnv
    })
  })
})
