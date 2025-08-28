/**
 * Advanced Symbol Animation System (Phase 2)
 * 
 * Provides sophisticated animation effects with variable values and performance optimization
 */

import type { SymbolEffect } from '../types.js'

export interface AnimationConfig {
  effect: SymbolEffect
  duration?: number
  timing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | string
  iterationCount?: number | 'infinite'
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both'
  delay?: number
  value?: number // Variable effect value (0-1)
  speed?: number // Speed multiplier
}

export interface ComputedAnimation {
  animationName: string
  animationDuration: string
  animationTimingFunction: string
  animationIterationCount: string
  animationDirection: string
  animationFillMode: string
  animationDelay: string
  transform?: string
  customProperties?: Record<string, string>
}

/**
 * Generate animation CSS properties from configuration
 */
export function generateAnimation(config: AnimationConfig): ComputedAnimation {
  const {
    effect,
    duration = getDefaultDuration(effect),
    timing = getDefaultTiming(effect),
    iterationCount = 'infinite',
    direction = 'normal',
    fillMode = 'both',
    delay = 0,
    value = 0.5,
    speed = 1
  } = config
  
  const actualDuration = duration / speed
  const animationName = getAnimationName(effect)
  
  const baseAnimation: ComputedAnimation = {
    animationName,
    animationDuration: `${actualDuration}s`,
    animationTimingFunction: timing,
    animationIterationCount: iterationCount.toString(),
    animationDirection: direction,
    animationFillMode: fillMode,
    animationDelay: `${delay}s`
  }
  
  // Add effect-specific enhancements
  return enhanceAnimation(baseAnimation, effect, value)
}
/**
 * Get CSS animation name for effect
 */
function getAnimationName(effect: SymbolEffect): string {
  switch (effect) {
    case 'bounce': return 'tachui-symbol-bounce'
    case 'pulse': return 'tachui-symbol-pulse'
    case 'wiggle': return 'tachui-symbol-wiggle'
    case 'rotate': return 'tachui-symbol-rotate'
    case 'breathe': return 'tachui-symbol-breathe'
    case 'shake': return 'tachui-symbol-shake'
    case 'heartbeat': return 'tachui-symbol-heartbeat'
    case 'glow': return 'tachui-symbol-glow'
    default: return 'none'
  }
}

/**
 * Get default duration for effect type
 */
function getDefaultDuration(effect: SymbolEffect): number {
  switch (effect) {
    case 'bounce': return 0.6
    case 'pulse': return 2.0
    case 'wiggle': return 0.5
    case 'rotate': return 2.0
    case 'breathe': return 3.0
    case 'shake': return 0.3
    case 'heartbeat': return 1.2
    case 'glow': return 2.5
    default: return 1.0
  }
}

/**
 * Get default timing function for effect type
 */
function getDefaultTiming(effect: SymbolEffect): string {
  switch (effect) {
    case 'bounce': return 'ease-in-out'
    case 'pulse': return 'ease-in-out'
    case 'wiggle': return 'ease-in-out'
    case 'rotate': return 'linear'
    case 'breathe': return 'ease-in-out'
    case 'shake': return 'ease-in-out'
    case 'heartbeat': return 'ease-in-out'
    case 'glow': return 'ease-in-out'
    default: return 'ease'
  }
}

/**
 * Enhance animation with effect-specific properties
 */
function enhanceAnimation(
  animation: ComputedAnimation,
  effect: SymbolEffect,
  value: number
): ComputedAnimation {
  const clampedValue = Math.max(0, Math.min(1, value))
  
  switch (effect) {
    case 'bounce':
      return {
        ...animation,
        customProperties: {
          '--bounce-height': `${clampedValue * 30}%`
        }
      }
    
    case 'pulse':
      return {
        ...animation,
        customProperties: {
          '--pulse-scale': `${Math.round((1 + (clampedValue * 0.3)) * 100) / 100}`,
          '--pulse-opacity': `${Math.round((0.7 + (clampedValue * 0.3)) * 100) / 100}`
        }
      }
    
    case 'wiggle':
      return {
        ...animation,
        customProperties: {
          '--wiggle-angle': `${clampedValue * 10}deg`
        }
      }
    
    case 'breathe':
      return {
        ...animation,
        customProperties: {
          '--breathe-scale': `${Math.round((1 + (clampedValue * 0.2)) * 100) / 100}`,
          '--breathe-opacity': `${Math.round((0.8 + (clampedValue * 0.2)) * 100) / 100}`
        }
      }
    
    case 'shake':
      return {
        ...animation,
        customProperties: {
          '--shake-distance': `${clampedValue * 4}px`
        }
      }
    
    case 'heartbeat':
      return {
        ...animation,
        customProperties: {
          '--heartbeat-scale-1': `${1 + (clampedValue * 0.1)}`,
          '--heartbeat-scale-2': `${1 + (clampedValue * 0.15)}`
        }
      }
    
    case 'glow':
      return {
        ...animation,
        customProperties: {
          '--glow-intensity': `${clampedValue * 10}px`,
          '--glow-opacity': `${clampedValue * 0.8}`
        }
      }
    
    default:
      return animation
  }
}
/**
 * Generate CSS animation shorthand
 */
export function generateAnimationShorthand(config: AnimationConfig): string {
  const computed = generateAnimation(config)
  
  return [
    computed.animationName,
    computed.animationDuration,
    computed.animationTimingFunction,
    computed.animationDelay,
    computed.animationIterationCount,
    computed.animationDirection,
    computed.animationFillMode
  ].join(' ')
}

/**
 * Create CSS classes for effect combinations
 */
export function generateEffectClasses(config: AnimationConfig): string[] {
  const classes = ['tachui-symbol--animated']
  
  if (config.effect !== 'none') {
    classes.push(`tachui-symbol--effect-${config.effect}`)
    
    if (config.speed !== undefined) {
      if (config.speed < 0.8) {
        classes.push('tachui-symbol--effect-slow')
      } else if (config.speed > 1.2) {
        classes.push('tachui-symbol--effect-fast')
      }
    }
    
    if (config.value !== undefined) {
      if (config.value < 0.3) {
        classes.push('tachui-symbol--effect-subtle')
      } else if (config.value > 0.7) {
        classes.push('tachui-symbol--effect-intense')
      }
    }
  }
  
  return classes
}

/**
 * Check if effect supports variable values
 */
export function supportsVariableValue(effect: SymbolEffect): boolean {
  return ['bounce', 'pulse', 'wiggle', 'breathe', 'shake', 'heartbeat', 'glow'].includes(effect)
}

/**
 * Get effect performance impact (1-5, where 5 is most intensive)
 */
export function getPerformanceImpact(effect: SymbolEffect): number {
  switch (effect) {
    case 'bounce': return 2
    case 'pulse': return 1
    case 'wiggle': return 2
    case 'rotate': return 1
    case 'breathe': return 1
    case 'shake': return 3
    case 'heartbeat': return 2
    case 'glow': return 4
    default: return 0
  }
}

/**
 * Generate performance-optimized animation for reduced motion preference
 */
export function generateReducedMotionAnimation(config: AnimationConfig): ComputedAnimation {
  // For reduced motion, convert animations to simple state changes
  switch (config.effect) {
    case 'pulse':
      return {
        animationName: 'none',
        animationDuration: '0s',
        animationTimingFunction: 'ease',
        animationIterationCount: '1',
        animationDirection: 'normal',
        animationFillMode: 'both',
        animationDelay: '0s',
        transform: `scale(${Math.round((1 + ((config.value || 0.5) * 0.1)) * 100) / 100})`,
        customProperties: {
          opacity: `${Math.round((0.9 + ((config.value || 0.5) * 0.1)) * 100) / 100}`
        }
      }
    
    case 'bounce':
    case 'wiggle':
    case 'rotate':
    case 'breathe':
    case 'shake':
    case 'heartbeat':
      return {
        animationName: 'none',
        animationDuration: '0s',
        animationTimingFunction: 'ease',
        animationIterationCount: '1',
        animationDirection: 'normal',
        animationFillMode: 'both',
        animationDelay: '0s'
      }
    
    default:
      return generateAnimation(config)
  }
}