/**
 * Tests for Advanced Symbol Animation System (Phase 2)
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { 
  generateAnimation,
  generateAnimationShorthand,
  generateEffectClasses,
  supportsVariableValue,
  getPerformanceImpact,
  generateReducedMotionAnimation
} from '../../src/animations/SymbolAnimations.js'
import type { SymbolEffect } from '../../src/types.js'

describe('SymbolAnimations', () => {
  describe('generateAnimation', () => {
    test('should generate basic animation configuration', () => {
      const config = {
        effect: 'bounce' as SymbolEffect,
        duration: 1,
        timing: 'ease-in-out' as const,
        value: 0.5,
        speed: 1,
      }

      const animation = generateAnimation(config)

      expect(animation.animationName).toBe('tachui-symbol-bounce')
      expect(animation.animationDuration).toBe('1s')
      expect(animation.animationTimingFunction).toBe('ease-in-out')
      expect(animation.animationIterationCount).toBe('infinite')
      expect(animation.animationDirection).toBe('normal')
      expect(animation.animationFillMode).toBe('both')
      expect(animation.animationDelay).toBe('0s')
    })

    test('should apply speed multiplier correctly', () => {
      const config = {
        effect: 'pulse' as SymbolEffect,
        speed: 2, // 2x speed
      }

      const animation = generateAnimation(config)

      // Default pulse duration is 2s, with 2x speed it should be 1s
      expect(animation.animationDuration).toBe('1s')
    })

    test('should use default values when not provided', () => {
      const config = {
        effect: 'wiggle' as SymbolEffect,
      }

      const animation = generateAnimation(config)

      expect(animation.animationDuration).toBe('0.5s') // Default wiggle duration
      expect(animation.animationTimingFunction).toBe('ease-in-out') // Default wiggle timing
      expect(animation.animationIterationCount).toBe('infinite')
      expect(animation.animationDelay).toBe('0s')
    })

    test('should handle custom timing and iteration count', () => {
      const config = {
        effect: 'rotate' as SymbolEffect,
        timing: 'cubic-bezier(0.4, 0, 0.2, 1)' as const,
        iterationCount: 3,
        direction: 'alternate' as const,
        fillMode: 'forwards' as const,
        delay: 0.5,
      }

      const animation = generateAnimation(config)

      expect(animation.animationTimingFunction).toBe('cubic-bezier(0.4, 0, 0.2, 1)')
      expect(animation.animationIterationCount).toBe('3')
      expect(animation.animationDirection).toBe('alternate')
      expect(animation.animationFillMode).toBe('forwards')
      expect(animation.animationDelay).toBe('0.5s')
    })
  })

  describe('enhanceAnimation', () => {
    test('should enhance bounce animation with variable value', () => {
      const config = {
        effect: 'bounce' as SymbolEffect,
        value: 0.8,
      }

      const animation = generateAnimation(config)

      expect(animation.customProperties).toEqual({
        '--bounce-height': '24%'
      })
    })

    test('should enhance pulse animation with variable values', () => {
      const config = {
        effect: 'pulse' as SymbolEffect,
        value: 0.6,
      }

      const animation = generateAnimation(config)

      expect(animation.customProperties).toEqual({
        '--pulse-scale': '1.18',
        '--pulse-opacity': '0.88'
      })
    })

    test('should enhance wiggle animation with angle value', () => {
      const config = {
        effect: 'wiggle' as SymbolEffect,
        value: 0.3,
      }

      const animation = generateAnimation(config)

      expect(animation.customProperties).toEqual({
        '--wiggle-angle': '3deg'
      })
    })

    test('should enhance breathe animation with scale and opacity', () => {
      const config = {
        effect: 'breathe' as SymbolEffect,
        value: 0.7,
      }

      const animation = generateAnimation(config)

      expect(animation.customProperties).toEqual({
        '--breathe-scale': '1.14',
        '--breathe-opacity': '0.94'
      })
    })

    test('should enhance shake animation with distance', () => {
      const config = {
        effect: 'shake' as SymbolEffect,
        value: 0.9,
      }

      const animation = generateAnimation(config)

      expect(animation.customProperties).toEqual({
        '--shake-distance': '3.6px'
      })
    })

    test('should enhance heartbeat animation with dual scales', () => {
      const config = {
        effect: 'heartbeat' as SymbolEffect,
        value: 0.4,
      }

      const animation = generateAnimation(config)

      expect(animation.customProperties).toEqual({
        '--heartbeat-scale-1': '1.04',
        '--heartbeat-scale-2': '1.06'
      })
    })

    test('should enhance glow animation with intensity and opacity', () => {
      const config = {
        effect: 'glow' as SymbolEffect,
        value: 0.5,
      }

      const animation = generateAnimation(config)

      expect(animation.customProperties).toEqual({
        '--glow-intensity': '5px',
        '--glow-opacity': '0.4'
      })
    })

    test('should clamp effect values between 0 and 1', () => {
      const configHigh = {
        effect: 'bounce' as SymbolEffect,
        value: 1.5, // Should be clamped to 1
      }

      const configLow = {
        effect: 'pulse' as SymbolEffect,
        value: -0.3, // Should be clamped to 0
      }

      const animationHigh = generateAnimation(configHigh)
      const animationLow = generateAnimation(configLow)

      expect(animationHigh.customProperties).toEqual({
        '--bounce-height': '30%' // 1 * 30 = 30%
      })

      expect(animationLow.customProperties).toEqual({
        '--pulse-scale': '1', // 0.7 + (0 * 0.3) = 0.7
        '--pulse-opacity': '0.7'
      })
    })

    test('should not add custom properties for unsupported effects', () => {
      const config = {
        effect: 'rotate' as SymbolEffect,
        value: 0.5,
      }

      const animation = generateAnimation(config)

      expect(animation.customProperties).toBeUndefined()
    })
  })

  describe('generateAnimationShorthand', () => {
    test('should generate proper CSS animation shorthand', () => {
      const config = {
        effect: 'bounce' as SymbolEffect,
        duration: 1,
        timing: 'ease-out' as const,
        delay: 0.2,
        iterationCount: 3,
        direction: 'reverse' as const,
        fillMode: 'forwards' as const,
      }

      const shorthand = generateAnimationShorthand(config)

      expect(shorthand).toBe('tachui-symbol-bounce 1s ease-out 0.2s 3 reverse forwards')
    })

    test('should handle infinite iteration count', () => {
      const config = {
        effect: 'pulse' as SymbolEffect,
        iterationCount: 'infinite' as const,
      }

      const shorthand = generateAnimationShorthand(config)

      expect(shorthand).toContain('infinite')
    })
  })

  describe('generateEffectClasses', () => {
    test('should generate base animated class', () => {
      const config = {
        effect: 'bounce' as SymbolEffect,
      }

      const classes = generateEffectClasses(config)

      expect(classes).toContain('tachui-symbol--animated')
      expect(classes).toContain('tachui-symbol--effect-bounce')
    })

    test('should add speed modifier classes', () => {
      const slowConfig = {
        effect: 'pulse' as SymbolEffect,
        speed: 0.5, // Slow
      }

      const fastConfig = {
        effect: 'wiggle' as SymbolEffect,
        speed: 1.5, // Fast
      }

      const slowClasses = generateEffectClasses(slowConfig)
      const fastClasses = generateEffectClasses(fastConfig)

      expect(slowClasses).toContain('tachui-symbol--effect-slow')
      expect(fastClasses).toContain('tachui-symbol--effect-fast')
    })

    test('should add intensity modifier classes', () => {
      const subtleConfig = {
        effect: 'glow' as SymbolEffect,
        value: 0.2, // Subtle
      }

      const intenseConfig = {
        effect: 'shake' as SymbolEffect,
        value: 0.8, // Intense
      }

      const subtleClasses = generateEffectClasses(subtleConfig)
      const intenseClasses = generateEffectClasses(intenseConfig)

      expect(subtleClasses).toContain('tachui-symbol--effect-subtle')
      expect(intenseClasses).toContain('tachui-symbol--effect-intense')
    })

    test('should not add modifier classes for none effect', () => {
      const config = {
        effect: 'none' as SymbolEffect,
        speed: 2,
        value: 0.8,
      }

      const classes = generateEffectClasses(config)

      expect(classes).toEqual(['tachui-symbol--animated'])
    })
  })

  describe('supportsVariableValue', () => {
    test('should return true for effects with variable support', () => {
      const supportedEffects: SymbolEffect[] = [
        'bounce', 'pulse', 'wiggle', 'breathe', 'shake', 'heartbeat', 'glow'
      ]

      supportedEffects.forEach(effect => {
        expect(supportsVariableValue(effect)).toBe(true)
      })
    })

    test('should return false for effects without variable support', () => {
      const unsupportedEffects: SymbolEffect[] = ['none', 'rotate']

      unsupportedEffects.forEach(effect => {
        expect(supportsVariableValue(effect)).toBe(false)
      })
    })
  })

  describe('getPerformanceImpact', () => {
    test('should return correct performance impact ratings', () => {
      const performanceRatings = {
        'none': 0,
        'pulse': 1,
        'rotate': 1,
        'breathe': 1,
        'bounce': 2,
        'wiggle': 2,
        'heartbeat': 2,
        'shake': 3,
        'glow': 4,
      }

      Object.entries(performanceRatings).forEach(([effect, rating]) => {
        expect(getPerformanceImpact(effect as SymbolEffect)).toBe(rating)
      })
    })
  })

  describe('generateReducedMotionAnimation', () => {
    test('should disable animations for most effects', () => {
      const reducedMotionEffects: SymbolEffect[] = [
        'bounce', 'wiggle', 'rotate', 'breathe', 'shake', 'heartbeat'
      ]

      reducedMotionEffects.forEach(effect => {
        const config = { effect, value: 0.5 }
        const animation = generateReducedMotionAnimation(config)

        expect(animation.animationName).toBe('none')
        expect(animation.animationDuration).toBe('0s')
      })
    })

    test('should convert pulse to static state with subtle transform', () => {
      const config = {
        effect: 'pulse' as SymbolEffect,
        value: 0.6,
      }

      const animation = generateReducedMotionAnimation(config)

      expect(animation.animationName).toBe('none')
      expect(animation.transform).toBe('scale(1.06)') // 1 + (0.6 * 0.1)
      expect(animation.customProperties).toEqual({
        opacity: '0.96' // 0.9 + (0.6 * 0.1)
      })
    })

    test('should use default value when not provided', () => {
      const config = {
        effect: 'pulse' as SymbolEffect,
      }

      const animation = generateReducedMotionAnimation(config)

      expect(animation.transform).toBe('scale(1.05)') // 1 + (0.5 * 0.1)
      expect(animation.customProperties).toEqual({
        opacity: '0.95' // 0.9 + (0.5 * 0.1)
      })
    })

    test('should fallback to normal animation for unknown effects', () => {
      const config = {
        effect: 'none' as SymbolEffect,
      }

      const normalAnimation = generateAnimation(config)
      const reducedMotionAnimation = generateReducedMotionAnimation(config)

      expect(reducedMotionAnimation).toEqual(normalAnimation)
    })
  })

  describe('default values', () => {
    test('should have correct default durations', () => {
      const durations = {
        'bounce': 0.6,
        'pulse': 2.0,
        'wiggle': 0.5,
        'rotate': 2.0,
        'breathe': 3.0,
        'shake': 0.3,
        'heartbeat': 1.2,
        'glow': 2.5,
      }

      Object.entries(durations).forEach(([effect, duration]) => {
        const config = { effect: effect as SymbolEffect }
        const animation = generateAnimation(config)
        expect(animation.animationDuration).toBe(`${duration}s`)
      })
    })

    test('should have correct default timing functions', () => {
      const timings = {
        'bounce': 'ease-in-out',
        'pulse': 'ease-in-out',
        'wiggle': 'ease-in-out',
        'rotate': 'linear',
        'breathe': 'ease-in-out',
        'shake': 'ease-in-out',
        'heartbeat': 'ease-in-out',
        'glow': 'ease-in-out',
      }

      Object.entries(timings).forEach(([effect, timing]) => {
        const config = { effect: effect as SymbolEffect }
        const animation = generateAnimation(config)
        expect(animation.animationTimingFunction).toBe(timing)
      })
    })
  })
})