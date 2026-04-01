/**
 * Navigation Stack Transition Animation Tests
 *
 * Tests for spring-based and standard transitions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getPushKeyframes,
  getPopKeyframes,
  getSpringPhysics,
  calculateSpringDuration,
  prefersReducedMotion,
  animateTransition,
} from '../src/navigation-animations'
import type { TransitionConfig, SpringPhysics } from '../src/navigation-animations'
import { NavigationStack } from '../src/navigation-stack'

describe('Navigation Stack Transitions', () => {
  let mockElement: HTMLElement

  beforeEach(() => {
    mockElement = document.createElement('div')
    document.body.appendChild(mockElement)
  })

  afterEach(() => {
    mockElement.remove()
  })

  describe('Push Keyframes', () => {
    it('generates slide push keyframes by default', () => {
      const keyframes = getPushKeyframes('slide', false)

      expect(keyframes).toHaveLength(2)
      expect(keyframes[0]).toEqual({ transform: 'translateX(100%)' })
      expect(keyframes[1]).toEqual({ transform: 'translateX(0%)' })
    })

    it('generates fade push keyframes', () => {
      const keyframes = getPushKeyframes('fade', false)

      expect(keyframes).toHaveLength(2)
      expect(keyframes[0]).toEqual({ opacity: 0, transform: 'translateX(0%)' })
      expect(keyframes[1]).toEqual({ opacity: 1, transform: 'translateX(0%)' })
    })

    it('generates spring push keyframes (same as slide)', () => {
      const keyframes = getPushKeyframes({ type: 'spring' }, false)

      expect(keyframes).toHaveLength(2)
      expect(keyframes[0]).toEqual({ transform: 'translateX(100%)' })
      expect(keyframes[1]).toEqual({ transform: 'translateX(0%)' })
    })

    it('returns instant keyframes for reduced motion', () => {
      const keyframes = getPushKeyframes('slide', true)

      expect(keyframes).toHaveLength(2)
      expect(keyframes[0]).toEqual({ opacity: 1 })
      expect(keyframes[1]).toEqual({ opacity: 1 })
    })
  })

  describe('Pop Keyframes', () => {
    it('generates slide pop keyframes by default', () => {
      const keyframes = getPopKeyframes('slide', false)

      expect(keyframes).toHaveLength(2)
      expect(keyframes[0]).toEqual({ transform: 'translateX(0%)' })
      expect(keyframes[1]).toEqual({ transform: 'translateX(100%)' })
    })

    it('generates fade pop keyframes', () => {
      const keyframes = getPopKeyframes('fade', false)

      expect(keyframes).toHaveLength(2)
      expect(keyframes[0]).toEqual({ opacity: 1, transform: 'translateX(0%)' })
      expect(keyframes[1]).toEqual({ opacity: 0, transform: 'translateX(0%)' })
    })

    it('generates spring pop keyframes (same as slide)', () => {
      const keyframes = getPopKeyframes({ type: 'spring' }, false)

      expect(keyframes).toHaveLength(2)
      expect(keyframes[0]).toEqual({ transform: 'translateX(0%)' })
      expect(keyframes[1]).toEqual({ transform: 'translateX(100%)' })
    })

    it('returns instant keyframes for reduced motion', () => {
      const keyframes = getPopKeyframes('slide', true)

      expect(keyframes).toHaveLength(2)
      expect(keyframes[0]).toEqual({ opacity: 1 })
      expect(keyframes[1]).toEqual({ opacity: 1 })
    })
  })

  describe('Spring Physics', () => {
    it('returns default spring physics for string transitions', () => {
      const physics = getSpringPhysics('slide')

      expect(physics.damping).toBe(0.8)
      expect(physics.stiffness).toBe(200)
      expect(physics.mass).toBe(1)
    })

    it('returns default spring physics for fade transition', () => {
      const physics = getSpringPhysics('fade')

      expect(physics.damping).toBe(0.8)
      expect(physics.stiffness).toBe(200)
      expect(physics.mass).toBe(1)
    })

    it('returns custom spring physics when provided', () => {
      const physics = getSpringPhysics({
        type: 'spring',
        damping: 0.7,
        stiffness: 180,
        mass: 2,
      })

      expect(physics.damping).toBe(0.7)
      expect(physics.stiffness).toBe(180)
      expect(physics.mass).toBe(2)
    })

    it('uses defaults for partially specified spring config', () => {
      const physics = getSpringPhysics({
        type: 'spring',
        stiffness: 150,
      })

      expect(physics.damping).toBe(0.8) // default
      expect(physics.stiffness).toBe(150) // custom
      expect(physics.mass).toBe(1) // default
    })
  })

  describe('Spring Duration Calculation', () => {
    it('calculates duration for underdamped spring (zeta < 1)', () => {
      const physics: SpringPhysics = {
        damping: 0.8,
        stiffness: 200,
        mass: 1,
      }

      const duration = calculateSpringDuration(physics)

      // Should be a reasonable positive number within clamped range
      expect(duration).toBeGreaterThanOrEqual(100)
      expect(duration).toBeLessThanOrEqual(3000) // clamped at 3s
    })

    it('calculates duration for critically damped spring (zeta = 1)', () => {
      const physics: SpringPhysics = {
        damping: 2 * Math.sqrt(200), // Critical damping
        stiffness: 200,
        mass: 1,
      }

      const duration = calculateSpringDuration(physics)

      expect(duration).toBeGreaterThan(0)
      expect(duration).toBeLessThan(5000)
    })

    it('calculates duration for overdamped spring (zeta > 1)', () => {
      const physics: SpringPhysics = {
        damping: 50,
        stiffness: 200,
        mass: 1,
      }

      const duration = calculateSpringDuration(physics)

      expect(duration).toBeGreaterThan(0)
      expect(duration).toBeLessThan(5000)
    })

    it('higher stiffness results in shorter duration', () => {
      const lowStiffness = calculateSpringDuration({
        damping: 0.8,
        stiffness: 100,
        mass: 1,
      })

      const highStiffness = calculateSpringDuration({
        damping: 0.8,
        stiffness: 400,
        mass: 1,
      })

      expect(highStiffness).toBeLessThanOrEqual(lowStiffness)
    })
  })

  describe('Reduced Motion Preference', () => {
    it('detects reduced motion preference', () => {
      // Mock matchMedia
      const originalMatchMedia = window.matchMedia
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })) as unknown as typeof window.matchMedia

      expect(prefersReducedMotion()).toBe(true)

      // Restore
      window.matchMedia = originalMatchMedia
    })

    it('returns false when no reduced motion preference', () => {
      // Mock matchMedia
      const originalMatchMedia = window.matchMedia
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })) as unknown as typeof window.matchMedia

      expect(prefersReducedMotion()).toBe(false)

      // Restore
      window.matchMedia = originalMatchMedia
    })
  })

  describe('Animate Transition', () => {
    beforeEach(() => {
      // Ensure matchMedia is available
      if (typeof window.matchMedia === 'undefined') {
        window.matchMedia = (query: string): MediaQueryList => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        } as MediaQueryList)
      }
    })

    it('creates animation for slide transition', () => {
      const keyframes = getPushKeyframes('slide', false)
      const animation = animateTransition(mockElement, keyframes, 'slide', 'push')

      expect(animation).toBeDefined()
      expect(animation.playState).toBe('running')

      animation.cancel()
    })

    it('creates animation for fade transition', () => {
      const keyframes = getPushKeyframes('fade', false)
      const animation = animateTransition(mockElement, keyframes, 'fade', 'push')

      expect(animation).toBeDefined()
      expect(animation.playState).toBe('running')

      animation.cancel()
    })

    it('creates animation for spring transition', () => {
      const keyframes = getPushKeyframes({ type: 'spring' }, false)
      const animation = animateTransition(
        mockElement,
        keyframes,
        { type: 'spring', damping: 0.7, stiffness: 180 },
        'push'
      )

      expect(animation).toBeDefined()
      expect(animation.playState).toBe('running')

      animation.cancel()
    })

    it('creates instant animation for reduced motion', () => {
      // Mock matchMedia for reduced motion
      const originalMatchMedia = window.matchMedia
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })) as unknown as typeof window.matchMedia

      const keyframes = getPushKeyframes('slide', false)
      const animation = animateTransition(mockElement, keyframes, 'slide', 'push')

      expect(animation).toBeDefined()
      expect(animation.effect?.getComputedTiming().duration).toBe(0)

      animation.cancel()

      // Restore
      window.matchMedia = originalMatchMedia
    })
  })

  describe('Integration with NavigationStack', () => {
    it('calls element.animate() when NavigationStack triggers push animation', () => {
      const animateSpy = vi.spyOn(mockElement, 'animate')

      // Create a simple view
      const rootView = document.createElement('div')
      rootView.setAttribute('data-testid', 'root-view')

      // Create NavigationStack with spring transition
      const navStack = NavigationStack(
        { type: 'div', props: { children: rootView } } as any,
        {
          transition: { type: 'spring', damping: 0.7, stiffness: 180 },
          transitionDurationMs: 300,
        }
      )

      // Simulate DOM ready
      const lifecycle = (navStack as any)._enhancedLifecycle
      expect(lifecycle).toBeDefined()

      // Call onDOMReady to wire up the content element
      const elements = new Map<string, Element>()
      lifecycle.onDOMReady(elements, mockElement)

      // Get the navigation context and trigger a push
      const context = (navStack as any).navigationContext
      expect(context).toBeDefined()

      // Trigger push operation which should call animate
      context.push(
        { type: 'div', props: { children: 'Test View' } } as any,
        '/test',
        'Test'
      )

      // Verify element.animate was called
      expect(animateSpy).toHaveBeenCalled()

      // Clean up
      animateSpy.mockRestore()
    })

    it('calls element.animate() when NavigationStack triggers pop animation', () => {
      const animateSpy = vi.spyOn(mockElement, 'animate')

      // Create a simple view
      const rootView = document.createElement('div')

      // Create NavigationStack with slide transition
      const navStack = NavigationStack(
        { type: 'div', props: { children: rootView } } as any,
        {
          transition: 'slide',
          transitionDurationMs: 300,
        }
      )

      // Simulate DOM ready
      const lifecycle = (navStack as any)._enhancedLifecycle
      const elements = new Map<string, Element>()
      lifecycle.onDOMReady(elements, mockElement)

      // Get the navigation context
      const context = (navStack as any).navigationContext

      // First push a view so we have something to pop
      context.push(
        { type: 'div', props: { children: 'Test View' } } as any,
        '/test',
        'Test'
      )

      // Reset spy to check only the pop animation
      animateSpy.mockClear()

      // Trigger pop operation
      context.pop()

      // Verify element.animate was called for pop
      expect(animateSpy).toHaveBeenCalled()

      // Clean up
      animateSpy.mockRestore()
    })

    it('respects reduced motion preference in NavigationStack', () => {
      // Mock matchMedia for reduced motion
      const originalMatchMedia = window.matchMedia
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })) as unknown as typeof window.matchMedia

      const animateSpy = vi.spyOn(mockElement, 'animate')

      // Create NavigationStack
      const rootView = document.createElement('div')
      const navStack = NavigationStack(
        { type: 'div', props: { children: rootView } } as any,
        {
          transition: 'spring',
        }
      )

      // Simulate DOM ready
      const lifecycle = (navStack as any)._enhancedLifecycle
      const elements = new Map<string, Element>()
      lifecycle.onDOMReady(elements, mockElement)

      // Get the navigation context
      const context = (navStack as any).navigationContext

      // Trigger push - should still call animate but with 0 duration
      context.push(
        { type: 'div', props: { children: 'Test View' } } as any,
        '/test',
        'Test'
      )

      // Verify element.animate was called with 0 duration for reduced motion
      expect(animateSpy).toHaveBeenCalled()
      const lastCall = animateSpy.mock.calls[animateSpy.mock.calls.length - 1]
      const options = lastCall[1] as { duration: number }
      expect(options.duration).toBe(0)

      // Clean up
      animateSpy.mockRestore()
      window.matchMedia = originalMatchMedia
    })
  })
})
