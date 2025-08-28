import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BackgroundModifier } from '../../modifiers/background'
import { LinearGradient } from '../index'
import type { StateGradientOptions } from '../types'
import type { ModifierContext } from '../../modifiers/types'

// Mock DOM environment
Object.defineProperty(window, 'MutationObserver', {
  writable: true,
  value: vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(),
  }))
})

describe('BackgroundModifier with State Support', () => {
  let mockElement: HTMLElement
  let mockContext: ModifierContext
  let addEventListener: ReturnType<typeof vi.fn>
  let removeEventListener: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    
    addEventListener = vi.fn()
    removeEventListener = vi.fn()
    
    // Mock HTML element
    mockElement = {
      style: {},
      addEventListener,
      removeEventListener,
      hasAttribute: vi.fn().mockReturnValue(false),
      matches: vi.fn().mockReturnValue(false),
      setAttribute: vi.fn(),
      getAttribute: vi.fn()
    } as unknown as HTMLElement

    mockContext = {
      componentId: 'test-component',
      element: mockElement,
      phase: 'creation'
    }
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('basic background support', () => {
    it('should apply string background', () => {
      const modifier = new BackgroundModifier({ background: '#ff0000' })
      modifier.apply({} as any, mockContext)
      
      expect(mockElement.style.background).toBe('#ff0000')
    })

    it('should apply gradient background', () => {
      const gradient = LinearGradient({
        startPoint: 'top',
        endPoint: 'bottom',
        colors: ['#ff0000', '#0000ff']
      })
      
      const modifier = new BackgroundModifier({ background: gradient })
      modifier.apply({} as any, mockContext)
      
      expect(mockElement.style.background).toContain('linear-gradient')
      expect(mockElement.style.background).toContain('#ff0000')
      expect(mockElement.style.background).toContain('#0000ff')
    })
  })

  describe('state-based gradient support', () => {
    let stateGradients: StateGradientOptions

    beforeEach(() => {
      stateGradients = {
        default: LinearGradient({
          startPoint: 'top',
          endPoint: 'bottom',
          colors: ['#ff0000', '#0000ff']
        }),
        hover: LinearGradient({
          startPoint: 'top',
          endPoint: 'bottom',
          colors: ['#ff6666', '#6666ff']
        }),
        active: LinearGradient({
          startPoint: 'top',
          endPoint: 'bottom',
          colors: ['#cc0000', '#0000cc']
        }),
        focus: '#ffaa00',
        disabled: '#cccccc',
        animation: {
          duration: 200,
          easing: 'ease-out',
          delay: 0
        }
      }
    })

    it('should setup state gradient with default state', () => {
      const modifier = new BackgroundModifier({ background: stateGradients })
      modifier.apply({} as any, mockContext)
      
      expect(mockElement.style.background).toContain('linear-gradient')
      expect(mockElement.style.background).toContain('#ff0000')
      expect(mockElement.style.cssText).toContain('transition: background 200ms ease-out 0ms')
    })

    it('should setup hover event listeners when hover state exists', () => {
      const modifier = new BackgroundModifier({ background: stateGradients })
      modifier.apply({} as any, mockContext)
      
      expect(addEventListener).toHaveBeenCalledWith('mouseenter', expect.any(Function))
      expect(addEventListener).toHaveBeenCalledWith('mouseleave', expect.any(Function))
    })

    it('should setup active/pressed event listeners when active state exists', () => {
      const modifier = new BackgroundModifier({ background: stateGradients })
      modifier.apply({} as any, mockContext)
      
      expect(addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function))
      expect(addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function))
    })

    it('should setup focus event listeners when focus state exists', () => {
      const modifier = new BackgroundModifier({ background: stateGradients })
      modifier.apply({} as any, mockContext)
      
      expect(addEventListener).toHaveBeenCalledWith('focus', expect.any(Function))
      expect(addEventListener).toHaveBeenCalledWith('blur', expect.any(Function))
    })

    it('should change background on hover', () => {
      const modifier = new BackgroundModifier({ background: stateGradients })
      modifier.apply({} as any, mockContext)
      
      // Get the mouseenter handler
      const mouseenterCall = addEventListener.mock.calls.find(call => call[0] === 'mouseenter')
      const mouseenterHandler = mouseenterCall![1]
      
      // Trigger hover
      mouseenterHandler()
      
      expect(mockElement.style.background).toContain('#ff6666')
      expect(mockElement.style.background).toContain('#6666ff')
    })

    it('should return to default on mouse leave', () => {
      // Use no animation to avoid throttling
      const noAnimationGradients = {
        ...stateGradients,
        animation: { duration: 0 }
      }
      
      mockElement.matches = vi.fn().mockReturnValue(false) // Not hovering
      
      const modifier = new BackgroundModifier({ background: noAnimationGradients })
      modifier.apply({} as any, mockContext)
      
      // Get handlers
      const mouseenterHandler = addEventListener.mock.calls.find(call => call[0] === 'mouseenter')![1]
      const mouseleaveHandler = addEventListener.mock.calls.find(call => call[0] === 'mouseleave')![1]
      
      // Hover then leave
      mouseenterHandler()
      mouseleaveHandler()
      
      // Should contain the default gradient colors
      expect(mockElement.style.background).toContain('#ff0000')
      expect(mockElement.style.background).toContain('#0000ff')
    })

    it('should handle active state correctly', () => {
      const modifier = new BackgroundModifier({ background: stateGradients })
      modifier.apply({} as any, mockContext)
      
      const mousedownHandler = addEventListener.mock.calls.find(call => call[0] === 'mousedown')![1]
      
      // Trigger mousedown
      mousedownHandler()
      
      expect(mockElement.style.background).toContain('#cc0000')
      expect(mockElement.style.background).toContain('#0000cc')
    })

    it('should handle focus state correctly', () => {
      const modifier = new BackgroundModifier({ background: stateGradients })
      modifier.apply({} as any, mockContext)
      
      const focusHandler = addEventListener.mock.calls.find(call => call[0] === 'focus')![1]
      
      // Trigger focus
      focusHandler()
      
      expect(mockElement.style.background).toBe('#ffaa00')
    })

    it('should setup mutation observer for disabled state', () => {
      const modifier = new BackgroundModifier({ background: stateGradients })
      modifier.apply({} as any, mockContext)
      
      expect(window.MutationObserver).toHaveBeenCalled()
    })

    it('should not setup event listeners for missing states', () => {
      const minimalGradients: StateGradientOptions = {
        default: '#ff0000'
        // No hover, active, focus, or disabled states
      }
      
      const modifier = new BackgroundModifier({ background: minimalGradients })
      modifier.apply({} as any, mockContext)
      
      // Should only have setup for default, no event listeners
      expect(addEventListener).not.toHaveBeenCalled()
    })
  })

  describe('state transition logic', () => {
    let stateGradients: StateGradientOptions

    beforeEach(() => {
      stateGradients = {
        default: '#ff0000',
        hover: '#00ff00',
        active: '#0000ff',
        focus: '#ffaa00',
        disabled: '#cccccc'
      }
    })

    it('should return to hover state after mouseup if still hovering', () => {
      mockElement.matches = vi.fn().mockReturnValue(true) // Is hovering
      
      const modifier = new BackgroundModifier({ background: stateGradients })
      modifier.apply({} as any, mockContext)
      
      const mouseenterHandler = addEventListener.mock.calls.find(call => call[0] === 'mouseenter')![1]
      const mousedownHandler = addEventListener.mock.calls.find(call => call[0] === 'mousedown')![1]
      const mouseupHandler = addEventListener.mock.calls.find(call => call[0] === 'mouseup')![1]
      
      // Simulate hover -> press -> release while still hovering
      mouseenterHandler() // Enter hover
      mousedownHandler()   // Press (active)
      mouseupHandler()     // Release (should return to hover)
      
      expect(mockElement.style.background).toBe('#00ff00') // Hover color
    })

    it('should return to default after mouseup if not hovering', () => {
      // Use no animation to avoid throttling
      const noAnimationGradients = {
        ...stateGradients,
        animation: { duration: 0 }
      }
      
      mockElement.matches = vi.fn().mockReturnValue(false) // Not hovering
      
      const modifier = new BackgroundModifier({ background: noAnimationGradients })
      modifier.apply({} as any, mockContext)
      
      const mousedownHandler = addEventListener.mock.calls.find(call => call[0] === 'mousedown')![1]
      const mouseupHandler = addEventListener.mock.calls.find(call => call[0] === 'mouseup')![1]
      
      // Simulate press -> release without hovering
      mousedownHandler() // Press (active)
      expect(mockElement.style.background).toBe('#0000ff') // Active color from stateGradients
      
      mouseupHandler()   // Release (should return to default)
      
      // Should return to default color (string, not gradient in this test)
      expect(mockElement.style.background).toBe('#ff0000')
    })

    it('should prioritize disabled state', () => {
      mockElement.hasAttribute = vi.fn().mockImplementation(attr => attr === 'disabled')
      
      const modifier = new BackgroundModifier({ background: stateGradients })
      modifier.apply({} as any, mockContext)
      
      const mouseleaveHandler = addEventListener.mock.calls.find(call => call[0] === 'mouseleave')![1]
      
      // Should return to disabled state, not default
      mouseleaveHandler()
      
      expect(mockElement.style.background).toBe('#cccccc') // Disabled color
    })

    it('should prioritize focus state over default', () => {
      mockElement.matches = vi.fn().mockImplementation(selector => selector === ':focus')
      
      const modifier = new BackgroundModifier({ background: stateGradients })
      modifier.apply({} as any, mockContext)
      
      const mouseleaveHandler = addEventListener.mock.calls.find(call => call[0] === 'mouseleave')![1]
      
      // Should return to focus state, not default
      mouseleaveHandler()
      
      expect(mockElement.style.background).toBe('#ffaa00') // Focus color
    })
  })

  describe('edge cases', () => {
    it('should handle missing element gracefully', () => {
      const modifier = new BackgroundModifier({ background: '#ff0000' })
      const contextWithoutElement = { ...mockContext, element: undefined }
      
      expect(() => {
        modifier.apply({} as any, contextWithoutElement)
      }).not.toThrow()
    })

    it('should handle asset backgrounds', () => {
      const mockAsset = {
        resolve: vi.fn().mockReturnValue('#asset-color')
      }
      
      const modifier = new BackgroundModifier({ background: mockAsset as any })
      modifier.apply({} as any, mockContext)
      
      expect(mockAsset.resolve).toHaveBeenCalled()
      expect(mockElement.style.background).toBe('#asset-color')
    })

    it('should handle empty/invalid backgrounds gracefully', () => {
      const modifier = new BackgroundModifier({ background: null as any })
      
      expect(() => {
        modifier.apply({} as any, mockContext)
      }).not.toThrow()
    })
  })
})