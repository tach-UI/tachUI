import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { StateGradientAsset, StateGradient } from '../state-gradient-asset'
import { LinearGradient } from '../index'
import type { StateGradientOptions } from '../types'

describe('StateGradientAsset', () => {
  let stateGradients: StateGradientOptions
  let asset: StateGradientAsset

  beforeEach(() => {
    vi.useFakeTimers()

    stateGradients = {
      default: LinearGradient({
        startPoint: 'top',
        endPoint: 'bottom',
        colors: ['#ff0000', '#0000ff'],
      }),
      hover: LinearGradient({
        startPoint: 'top',
        endPoint: 'bottom',
        colors: ['#ff6666', '#6666ff'],
      }),
      active: LinearGradient({
        startPoint: 'top',
        endPoint: 'bottom',
        colors: ['#cc0000', '#0000cc'],
      }),
      focus: LinearGradient({
        startPoint: 'top',
        endPoint: 'bottom',
        colors: ['#ffaa00', '#00aaff'],
      }),
      disabled: '#cccccc',
      animation: {
        duration: 300,
        easing: 'ease-in-out',
        delay: 50,
      },
    }

    asset = new StateGradientAsset('test-gradient', stateGradients)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('construction and initialization', () => {
    it('should initialize with default state', () => {
      expect(asset.getState()).toBe('default')
    })

    it('should resolve default gradient initially', () => {
      const resolved = asset.resolve()
      expect(resolved).toContain('linear-gradient')
      expect(resolved).toContain('#ff0000')
      expect(resolved).toContain('#0000ff')
    })

    it('should pre-cache all gradients on construction', () => {
      // All states should be resolvable immediately
      expect(asset.getStateGradient('default')).toBeTruthy()
      expect(asset.getStateGradient('hover')).toBeTruthy()
      expect(asset.getStateGradient('active')).toBeTruthy()
      expect(asset.getStateGradient('focus')).toBeTruthy()
      expect(asset.getStateGradient('disabled')).toBe('#cccccc')
    })

    it('should create asset with StateGradient factory function', () => {
      const factoryAsset = StateGradient('factory-test', stateGradients)
      expect(factoryAsset).toBeInstanceOf(StateGradientAsset)
      expect(factoryAsset.name).toBe('factory-test')
    })
  })

  describe('state management', () => {
    it('should change state when setState is called', () => {
      asset.setState('hover')
      expect(asset.getState()).toBe('hover')
    })

    it('should resolve different gradients for different states', () => {
      const defaultGradient = asset.resolve()

      asset.setState('hover')
      const hoverGradient = asset.resolve()

      expect(defaultGradient).not.toBe(hoverGradient)
      expect(hoverGradient).toContain('#ff6666')
      expect(hoverGradient).toContain('#6666ff')
    })

    it('should ignore invalid state changes', () => {
      asset.setState('hover')
      // @ts-ignore - Testing invalid state
      asset.setState('invalid')
      expect(asset.getState()).toBe('hover')
    })

    it('should ignore state changes during transition', () => {
      asset.setState('hover')
      asset.setState('active') // Should be ignored due to transition
      expect(asset.getState()).toBe('hover')

      // After transition completes
      vi.advanceTimersByTime(350) // duration + delay
      asset.setState('active')
      expect(asset.getState()).toBe('active')
    })

    it('should handle string gradients correctly', () => {
      asset.setState('disabled')
      expect(asset.resolve()).toBe('#cccccc')
    })
  })

  describe('available states', () => {
    it('should return all available states', () => {
      const states = asset.getAvailableStates()
      expect(states).toContain('default')
      expect(states).toContain('hover')
      expect(states).toContain('active')
      expect(states).toContain('focus')
      expect(states).toContain('disabled')
      expect(states).toContain('animation')
    })

    it('should check if specific states are available', () => {
      expect(asset.hasState('hover')).toBe(true)
      expect(asset.hasState('active')).toBe(true)
      // @ts-ignore - Testing invalid state
      expect(asset.hasState('invalid')).toBe(false)
    })
  })

  describe('animation configuration', () => {
    it('should generate correct animation CSS', () => {
      const animationCSS = asset.getAnimationCSS()
      expect(animationCSS).toContain(
        'transition: background 300ms ease-in-out 50ms;'
      )
    })

    it('should handle default animation options', () => {
      const simpleGradients = {
        default: '#ff0000',
        hover: '#0000ff',
      }
      const simpleAsset = new StateGradientAsset('simple', simpleGradients)
      const animationCSS = simpleAsset.getAnimationCSS()
      expect(animationCSS).toContain('transition: background 300ms ease 0ms;')
    })

    it('should update animation options', () => {
      asset.setAnimation({ duration: 500, easing: 'ease-out' })
      const animationCSS = asset.getAnimationCSS()
      expect(animationCSS).toContain('transition: background 500ms ease-out')
    })
  })

  describe('performance optimizations', () => {
    it('should cache resolved gradients', () => {
      const resolved1 = asset.resolve()
      const resolved2 = asset.resolve()

      // Should return the same instance (cached)
      expect(resolved1).toBe(resolved2)
    })

    it('should clear cache when requested', () => {
      asset.resolve() // Cache the result
      asset.clearCache()

      // Should work fine after cache clear
      const resolved = asset.resolve()
      expect(resolved).toBeTruthy()
    })

    it('should update gradients and clear cache', () => {
      const originalResolved = asset.resolve()

      const newGradients: StateGradientOptions = {
        default: '#ffffff',
        hover: '#000000',
      }

      asset.updateStateGradients(newGradients)
      const newResolved = asset.resolve()

      expect(newResolved).not.toBe(originalResolved)
      expect(newResolved).toBe('#ffffff')
    })
  })

  describe('gradient value resolution', () => {
    it('should resolve gradient definitions correctly', () => {
      asset.setState('hover')
      const resolved = asset.resolve()
      expect(resolved).toContain('linear-gradient')
      expect(resolved).toContain('to bottom')
      expect(resolved).toContain('#ff6666')
      expect(resolved).toContain('#6666ff')
    })

    it('should resolve string values correctly', () => {
      asset.setState('disabled')
      expect(asset.resolve()).toBe('#cccccc')
    })

    it('should get specific state gradients without changing current state', () => {
      asset.setState('default')
      const hoverGradient = asset.getStateGradient('hover')

      expect(asset.getState()).toBe('default') // Should not change
      expect(hoverGradient).toContain('#ff6666')
    })

    it('should fall back to default for missing states', () => {
      const defaultResolved = asset.getStateGradient('default')
      // @ts-ignore - Testing missing state
      const missingResolved = asset.getStateGradient('missing')

      expect(missingResolved).toBe(defaultResolved)
    })
  })

  describe('edge cases', () => {
    it('should handle asset with only default gradient', () => {
      const minimalGradients: StateGradientOptions = {
        default: '#ff0000',
      }

      const minimalAsset = new StateGradientAsset('minimal', minimalGradients)
      expect(minimalAsset.resolve()).toBe('#ff0000')
      expect(minimalAsset.getAvailableStates()).toEqual(['default'])
    })

    it('should handle zero duration animations', () => {
      const quickGradients: StateGradientOptions = {
        default: '#ff0000',
        hover: '#0000ff',
        animation: { duration: 0 },
      }

      const quickAsset = new StateGradientAsset('quick', quickGradients)
      quickAsset.setState('hover')
      // Should allow immediate state changes with zero duration
      quickAsset.setState('default')
      expect(quickAsset.getState()).toBe('default')
    })

    it('should handle missing animation configuration', () => {
      const noAnimGradients: StateGradientOptions = {
        default: '#ff0000',
        hover: '#0000ff',
      }

      const noAnimAsset = new StateGradientAsset('no-anim', noAnimGradients)
      const animCSS = noAnimAsset.getAnimationCSS()
      expect(animCSS).toContain('300ms ease 0ms') // Default values
    })
  })
})
