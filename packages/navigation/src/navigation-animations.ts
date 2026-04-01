/**
 * Navigation Stack Transition Animations
 *
 * Implements spring-based and standard transitions for NavigationStack
 * using the Web Animations API with prefers-reduced-motion support.
 */

import { createEffect } from '@tachui/core'

export type TransitionType = 'slide' | 'fade' | 'spring'

export interface SpringTransitionConfig {
  type: 'spring'
  /** Damping ratio (0-1, default: 0.8) - lower = more oscillation */
  damping?: number
  /** Stiffness (default: 200) - higher = faster animation */
  stiffness?: number
  /** Mass (default: 1) - higher = more inertia */
  mass?: number
}

export type TransitionConfig = TransitionType | SpringTransitionConfig

export interface AnimationKeyframe {
  transform?: string
  opacity?: number | string
  offset?: number
}

export interface SpringPhysics {
  damping: number
  stiffness: number
  mass: number
}

const DEFAULT_SPRING: SpringPhysics = {
  damping: 0.8,
  stiffness: 200,
  mass: 1,
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Generate spring keyframes using damped harmonic oscillator physics
 */
function generateSpringKeyframes(
  from: AnimationKeyframe,
  to: AnimationKeyframe,
  physics: SpringPhysics,
  duration: number
): AnimationKeyframe[] {
  const keyframes: AnimationKeyframe[] = []
  const steps = 60 // 60fps

  const { damping, stiffness, mass } = physics

  // Calculate spring parameters
  const omega = Math.sqrt(stiffness / mass) // Natural frequency
  const zeta = damping / (2 * Math.sqrt(mass * stiffness)) // Damping ratio

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * (duration / 1000) // Time in seconds

    // Damped oscillation
    let displacement: number
    if (zeta < 1) {
      // Underdamped - oscillates
      const omegaD = omega * Math.sqrt(1 - zeta * zeta)
      displacement = 1 - Math.exp(-zeta * omega * t) * (
        Math.cos(omegaD * t) + (zeta * omega / omegaD) * Math.sin(omegaD * t)
      )
    } else if (Math.abs(zeta - 1) < 0.001) {
      // Critically damped (with tolerance for floating point)
      displacement = 1 - Math.exp(-omega * t) * (1 + omega * t)
    } else {
      // Overdamped
      const r1 = -omega * (zeta - Math.sqrt(zeta * zeta - 1))
      const r2 = -omega * (zeta + Math.sqrt(zeta * zeta - 1))
      displacement = 1 - (
        (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1)
      )
    }

    // Allow displacement outside [0, 1] for spring overshoot effect
    // The Web Animations API handles out-of-range values correctly

    const keyframe: AnimationKeyframe = { offset: i / steps }

    // Interpolate transform
    if (from.transform !== undefined && to.transform !== undefined) {
      // Extract translateX values
      const fromMatch = from.transform.match(/translateX\(([-\d.]+)%\)/)
      const toMatch = to.transform.match(/translateX\(([-\d.]+)%\)/)

      if (fromMatch && toMatch) {
        const fromX = parseFloat(fromMatch[1])
        const toX = parseFloat(toMatch[1])
        const currentX = fromX + (toX - fromX) * displacement
        keyframe.transform = `translateX(${currentX}%)`
      }
    }

    // Interpolate opacity
    if (from.opacity !== undefined && to.opacity !== undefined) {
      const fromOp = typeof from.opacity === 'number' ? from.opacity : parseFloat(from.opacity)
      const toOp = typeof to.opacity === 'number' ? to.opacity : parseFloat(to.opacity)
      keyframe.opacity = fromOp + (toOp - fromOp) * displacement
    }

    keyframes.push(keyframe)
  }

  return keyframes
}

/**
 * Get animation keyframes for push operation
 */
export function getPushKeyframes(
  transition: TransitionConfig,
  isReducedMotion: boolean
): AnimationKeyframe[] {
  if (isReducedMotion) {
    return [{ opacity: 1 }, { opacity: 1 }]
  }

  const type = typeof transition === 'string' ? transition : transition.type

  switch (type) {
    case 'fade':
      return [
        { opacity: 0, transform: 'translateX(0%)' },
        { opacity: 1, transform: 'translateX(0%)' },
      ]
    case 'spring':
    case 'slide':
    default:
      return [
        { transform: 'translateX(100%)' },
        { transform: 'translateX(0%)' },
      ]
  }
}

/**
 * Get animation keyframes for pop operation
 */
export function getPopKeyframes(
  transition: TransitionConfig,
  isReducedMotion: boolean
): AnimationKeyframe[] {
  if (isReducedMotion) {
    return [{ opacity: 1 }, { opacity: 1 }]
  }

  const type = typeof transition === 'string' ? transition : transition.type

  switch (type) {
    case 'fade':
      return [
        { opacity: 1, transform: 'translateX(0%)' },
        { opacity: 0, transform: 'translateX(0%)' },
      ]
    case 'spring':
    case 'slide':
    default:
      return [
        { transform: 'translateX(0%)' },
        { transform: 'translateX(100%)' },
      ]
  }
}

/**
 * Get spring physics from transition config
 */
export function getSpringPhysics(transition: TransitionConfig): SpringPhysics {
  if (typeof transition === 'string' || transition.type !== 'spring') {
    return DEFAULT_SPRING
  }

  return {
    damping: transition.damping ?? DEFAULT_SPRING.damping,
    stiffness: transition.stiffness ?? DEFAULT_SPRING.stiffness,
    mass: transition.mass ?? DEFAULT_SPRING.mass,
  }
}

/**
 * Calculate animation duration from spring physics
 * Duration is calculated as time to reach 99% of target
 */
export function calculateSpringDuration(physics: SpringPhysics): number {
  const { damping, stiffness, mass } = physics

  // Handle edge cases
  if (stiffness <= 0 || mass <= 0) {
    return 300 // Return default duration for invalid physics
  }

  const omega = Math.sqrt(stiffness / mass)
  const zeta = damping / (2 * Math.sqrt(mass * stiffness))

  // Handle near-zero damping case
  if (zeta <= 0.01) {
    return 300 // Default duration for very low damping
  }

  // Time constant for exponential decay
  let tau: number
  if (zeta < 1) {
    // Underdamped
    tau = 1 / (zeta * omega)
  } else if (Math.abs(zeta - 1) < 0.001) {
    // Critically damped (with tolerance for floating point)
    tau = 1 / omega
  } else {
    // Overdamped
    const sqrtTerm = Math.sqrt(zeta * zeta - 1)
    const r1 = omega * (zeta - sqrtTerm)
    tau = 1 / r1
  }

  // Time to reach 99% (approx 5 time constants)
  // Clamp between 100ms and 3000ms for reasonable animation duration
  const duration = Math.round(tau * 5 * 1000)
  return Math.max(100, Math.min(3000, duration))
}

/**
 * Animate element with transition
 */
export function animateTransition(
  element: HTMLElement,
  keyframes: AnimationKeyframe[],
  transition: TransitionConfig,
  direction: 'push' | 'pop',
  isReducedMotion: boolean = prefersReducedMotion(),
  durationMs?: number
): Animation {
  if (isReducedMotion) {
    // Instant transition for reduced motion preference
    return element.animate(
      [{ opacity: 1 }, { opacity: 1 }],
      { duration: 0, fill: 'forwards' }
    )
  }

  const type = typeof transition === 'string' ? transition : transition.type

  if (type === 'spring') {
    const physics = getSpringPhysics(transition)
    const duration = calculateSpringDuration(physics)
    const springKeyframes = generateSpringKeyframes(
      keyframes[0],
      keyframes[keyframes.length - 1],
      physics,
      duration
    )

    const animation = element.animate(springKeyframes as Keyframe[], {
      duration,
      fill: 'forwards',
      easing: 'linear', // Spring physics handled in keyframes
    })

    // Clean up animation after finish to prevent style accumulation
    animation.addEventListener('finish', () => {
      animation.commitStyles?.()
      animation.cancel()
    }, { once: true })

    return animation
  }

  // Standard slide/fade transitions
  const duration = durationMs ?? 300 // Use provided duration or default
  const easing = type === 'fade' ? 'ease-in-out' : 'ease-out'

  const animation = element.animate(keyframes as Keyframe[], {
    duration,
    easing,
    fill: 'forwards',
  })

  // Clean up animation after finish to prevent style accumulation
  animation.addEventListener('finish', () => {
    animation.commitStyles?.()
    animation.cancel()
  }, { once: true })

  return animation
}

/**
 * Create a reactive animation that updates with signal changes
 */
export function createReactiveAnimation(
  element: HTMLElement,
  isNavigating: () => boolean,
  transition: TransitionConfig,
  direction: 'push' | 'pop',
  durationMs?: number
): () => void {
  let currentAnimation: Animation | null = null
  const isReducedMotion = prefersReducedMotion()

  const effect = createEffect(() => {
    const navigating = isNavigating()
    if (navigating) {
      const keyframes = direction === 'push'
        ? getPushKeyframes(transition, isReducedMotion)
        : getPopKeyframes(transition, isReducedMotion)

      currentAnimation = animateTransition(element, keyframes, transition, direction, isReducedMotion, durationMs)
    } else {
      // Finish any running animation to jump to end state (don't snap back)
      if (currentAnimation) {
        try {
          currentAnimation.finish()
        } catch {
          // Animation may already be finished or cancelled
        }
        currentAnimation = null
      }
    }
  })

  return () => {
    effect.dispose()
    if (currentAnimation) {
      try {
        currentAnimation.finish()
      } catch {
        // Animation may already be finished or cancelled
      }
    }
  }
}
