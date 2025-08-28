/**
 * Migration Utilities for Reactive System v2.0
 *
 * Provides backward compatibility and migration tools for transitioning
 * from the old reactive system to the new unified scheduler system.
 */

import { createComputed } from './computed'
import { createEnhancedEffect } from './enhanced-effect'
import { createEnhancedSignal } from './enhanced-signal'
import { deepEquals, shallowEquals } from './equality'
import { createSignal } from './signal'
import { ReactiveScheduler, type UpdatePriority } from './unified-scheduler'

/**
 * Migration status tracking
 */
let migrationWarningsEnabled = true
let migrationStats = {
  signalsConverted: 0,
  computedsConverted: 0,
  effectsConverted: 0,
  errorsFixed: 0,
}

/**
 * Legacy compatibility wrapper for signals
 */
export function createLegacySignal<T>(value: T): any {
  if (migrationWarningsEnabled) {
    console.warn(
      'createLegacySignal is deprecated. Use createSignal() or createEnhancedSignal() instead. ' +
        'See: https://docs.tachui.dev/migration/reactive-system'
    )
  }
  migrationStats.signalsConverted++
  return createSignal(value)
}

/**
 * Migrate existing signals to enhanced signals with options
 */
export function migrateToEnhancedSignal<T>(
  originalSignal: [() => T, (value: T) => T],
  options?: {
    equals?: 'reference' | 'deep' | 'shallow' | 'custom'
    customEquals?: (a: T, b: T) => boolean
    priority?: UpdatePriority
    debugName?: string
  }
): [() => T, (value: T) => T] {
  const currentValue = originalSignal[0]()

  let equalsFn
  switch (options?.equals) {
    case 'deep':
      equalsFn = deepEquals
      break
    case 'shallow':
      equalsFn = shallowEquals
      break
    case 'custom':
      equalsFn = options.customEquals
      break
    default:
      equalsFn = undefined // Use default
  }

  migrationStats.signalsConverted++

  return createEnhancedSignal(currentValue, {
    equals: equalsFn,
    priority: options?.priority,
    debugName: options?.debugName,
  })
}

/**
 * Automatically detect and suggest signal migration improvements
 */
export function analyzeSignalUsage<T>(signal: () => T): {
  recommendations: string[]
  suggestedMigration: 'enhanced' | 'deep' | 'shallow'
} {
  const value = signal()
  const recommendations: string[] = []
  let suggestedMigration: 'enhanced' | 'deep' | 'shallow' = 'enhanced'

  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      recommendations.push('Consider using deepEquals for array values to detect mutations')
      recommendations.push('Use createDeepSignal() for automatic deep comparison')
      suggestedMigration = 'deep'
    } else {
      recommendations.push('Consider using shallowEquals for object values with simple properties')
      recommendations.push('Use createShallowSignal() for automatic shallow comparison')
      suggestedMigration = 'shallow'
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('Signal looks good for reference equality')
  }

  return { recommendations, suggestedMigration }
}

/**
 * Batch migration utility for multiple reactive primitives
 */
export function migrateBatch(config: {
  signals?: Array<{
    original: [() => any, (value: any) => any]
    options?: any
  }>
  computeds?: Array<{
    original: () => any
    options?: any
  }>
  effects?: Array<{
    original: () => undefined | (() => void)
    options?: any
  }>
}): {
  signals: Array<[() => any, (value: any) => any]>
  computeds: Array<() => any>
  effects: Array<() => void>
  cleanup: () => void
} {
  const results = {
    signals: [] as Array<[() => any, (value: any) => any]>,
    computeds: [] as Array<() => any>,
    effects: [] as Array<() => void>,
    cleanup: () => {},
  }

  // Migrate signals
  if (config.signals) {
    results.signals = config.signals.map(({ original, options }) =>
      migrateToEnhancedSignal(original, options)
    )
  }

  // Migrate computeds
  if (config.computeds) {
    results.computeds = config.computeds.map(({ original, options }) => {
      migrationStats.computedsConverted++
      return createComputed(original, options)
    })
  }

  // Migrate effects with cleanup functions
  const effectCleanups: Array<() => void> = []
  if (config.effects) {
    config.effects.forEach(({ original, options }) => {
      migrationStats.effectsConverted++
      const cleanup = createEnhancedEffect(original, options)
      effectCleanups.push(cleanup)
    })
  }

  results.cleanup = () => {
    effectCleanups.forEach((cleanup) => cleanup())
  }

  return results
}

/**
 * Code transformation utility for automatic migration
 */
export function migrateReactiveCode(oldCode: string): {
  newCode: string
  transformations: string[]
} {
  const transformations: string[] = []
  let newCode = oldCode

  // Basic regex-based transformations
  const patterns = [
    {
      from: /createSignal\(/g,
      to: 'createEnhancedSignal(',
      description: 'Upgraded createSignal to createEnhancedSignal',
    },
    {
      from: /createComputed\(([^,]+)\)/g,
      to: "createComputed($1, { debugName: 'computed' })",
      description: 'Added debug name to createComputed',
    },
    {
      from: /createEffect\(([^,]+)\)/g,
      to: "createEnhancedEffect($1, { debugName: 'effect' })",
      description: 'Upgraded createEffect to createEnhancedEffect with debug name',
    },
  ]

  patterns.forEach((pattern) => {
    const matches = newCode.match(pattern.from)
    if (matches) {
      newCode = newCode.replace(pattern.from, pattern.to)
      transformations.push(pattern.description)
    }
  })

  return { newCode, transformations }
}

/**
 * Performance analyzer for reactive systems
 */
export function analyzeReactivePerformance(): {
  scheduler: any
  signals: { total: number; recommendations: string[] }
  computeds: { total: number; recommendations: string[] }
  effects: { total: number; recommendations: string[] }
  overallScore: number
  recommendations: string[]
} {
  const scheduler = ReactiveScheduler.getInstance()
  const metrics = scheduler.getPerformanceMetrics()

  const recommendations: string[] = []
  let score = 100

  // Analyze metrics
  if (metrics.errorCount > 0) {
    recommendations.push(`Fix ${metrics.errorCount} reactive errors for better stability`)
    score -= metrics.errorCount * 5
  }

  if (metrics.averageUpdateTime > 16) {
    recommendations.push('Update times exceed 16ms - consider optimizing computations')
    score -= 20
  }

  if (metrics.totalNodes > 1000) {
    recommendations.push('High number of reactive nodes - consider batching updates')
    score -= 10
  }

  return {
    scheduler: scheduler.getDebugInfo(),
    signals: {
      total: migrationStats.signalsConverted,
      recommendations: ['Use appropriate equality functions for your data types'],
    },
    computeds: {
      total: migrationStats.computedsConverted,
      recommendations: ['Add error recovery for critical computations'],
    },
    effects: {
      total: migrationStats.effectsConverted,
      recommendations: ['Use appropriate priorities for different effect types'],
    },
    overallScore: Math.max(0, score),
    recommendations,
  }
}

/**
 * Debug utilities for migration
 */
export function enableReactiveDebugging(options = { verbose: false }): () => void {
  const scheduler = ReactiveScheduler.getInstance()

  const errorHandler = (error: any) => {
    console.error('🔥 Reactive System Error:', error)
    migrationStats.errorsFixed++
  }

  const cleanup = scheduler.onError(errorHandler)

  if (options.verbose) {
    console.log('🔍 Reactive debugging enabled')
    console.log('📊 Migration stats:', migrationStats)
  }

  return () => {
    cleanup()
    if (options.verbose) {
      console.log('🔍 Reactive debugging disabled')
    }
  }
}

/**
 * Get migration statistics
 */
export function getMigrationStats() {
  return { ...migrationStats }
}

/**
 * Reset migration statistics
 */
export function resetMigrationStats() {
  migrationStats = {
    signalsConverted: 0,
    computedsConverted: 0,
    effectsConverted: 0,
    errorsFixed: 0,
  }
}

/**
 * Enable/disable migration warnings
 */
export function setMigrationWarnings(enabled: boolean) {
  migrationWarningsEnabled = enabled
}

/**
 * Create a migration report
 */
export function createMigrationReport(): string {
  const performance = analyzeReactivePerformance()

  return `
# TachUI Reactive System Migration Report

## Statistics
- Signals converted: ${migrationStats.signalsConverted}
- Computeds converted: ${migrationStats.computedsConverted}
- Effects converted: ${migrationStats.effectsConverted}
- Errors fixed: ${migrationStats.errorsFixed}

## Performance Score: ${performance.overallScore}/100

## Recommendations
${performance.recommendations.map((r) => `- ${r}`).join('\n')}

## Generated: ${new Date().toISOString()}
`
}
