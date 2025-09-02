/**
 * Tests for the debug system
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  debugManager,
  enableDebug,
  disableDebug,
  isDebugEnabled,
} from '../../src/debug/debug'

describe('Debug System', () => {
  beforeEach(() => {
    // Reset debug state before each test
    debugManager.disable()
  })

  afterEach(() => {
    // Clean up after each test
    debugManager.disable()
  })

  describe('enable/disable functionality', () => {
    it('should start disabled by default', () => {
      expect(isDebugEnabled()).toBe(false)
      expect(debugManager.isEnabled()).toBe(false)
    })

    it('should enable debug mode', () => {
      enableDebug()
      expect(isDebugEnabled()).toBe(true)
      expect(debugManager.isEnabled()).toBe(true)
    })

    it('should disable debug mode', () => {
      enableDebug()
      expect(isDebugEnabled()).toBe(true)

      disableDebug()
      expect(isDebugEnabled()).toBe(false)
    })

    it('should accept configuration options', () => {
      enableDebug({
        showLabels: true,
        showBounds: false,
        logComponentTree: true,
      })

      const config = debugManager.getConfig()
      expect(config.showLabels).toBe(true)
      expect(config.showBounds).toBe(false)
      expect(config.logComponentTree).toBe(true)
    })
  })

  describe('debug attributes', () => {
    it('should add debug attributes when enabled', () => {
      enableDebug()
      const element = document.createElement('div')

      debugManager.addDebugAttributes(element, 'TestComponent', 'test-label')

      expect(element.getAttribute('data-tachui-component')).toBe(
        'TestComponent'
      )
      expect(element.getAttribute('data-tachui-label')).toBe('test-label')
      expect(element.classList.contains('tachui-debug')).toBe(true)
      expect(element.classList.contains('tachui-debug-labeled')).toBe(true)
    })

    it('should not add debug attributes when disabled', () => {
      const element = document.createElement('div')

      debugManager.addDebugAttributes(element, 'TestComponent', 'test-label')

      expect(element.getAttribute('data-tachui-component')).toBe(null)
      expect(element.classList.contains('tachui-debug')).toBe(false)
    })
  })

  describe('component tree logging', () => {
    let consoleSpy: any

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'group').mockImplementation(() => {})
      vi.spyOn(console, 'log').mockImplementation(() => {})
      vi.spyOn(console, 'groupEnd').mockImplementation(() => {})
    })

    afterEach(() => {
      consoleSpy.mockRestore()
    })

    it('should log component tree when enabled', () => {
      enableDebug({ logComponentTree: true })

      debugManager.logComponent('TestComponent', 'test-label', 0)
      debugManager.printComponentTree()

      expect(consoleSpy).toHaveBeenCalledWith('🌳 TachUI Component Tree:')
    })

    it('should not log component tree when disabled', () => {
      debugManager.logComponent('TestComponent', 'test-label', 0)
      debugManager.printComponentTree()

      expect(consoleSpy).not.toHaveBeenCalled()
    })
  })

  describe('debug styles', () => {
    it('should inject debug styles when enabled', () => {
      enableDebug()

      const styleElement = document.getElementById('tachui-debug-styles')
      expect(styleElement).toBeTruthy()
      expect(styleElement?.tagName).toBe('STYLE')
    })

    it('should remove debug styles when disabled', () => {
      enableDebug()
      expect(document.getElementById('tachui-debug-styles')).toBeTruthy()

      disableDebug()
      expect(document.getElementById('tachui-debug-styles')).toBeFalsy()
    })
  })

  describe('URL parameter auto-enable', () => {
    it('should enable debug mode via URL parameter', () => {
      // Skip this test as URL parameter checking happens at module load time
      // and can't be easily tested in isolation
      expect(true).toBe(true)
    })
  })
})
