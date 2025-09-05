/**
 * Validation Debugging Tools - Phase 1C
 *
 * Comprehensive debugging helpers, diagnostic tools, validation inspector,
 * and developer utilities for analyzing validation behavior.
 *
 * Moved from @tachui/core to @tachui/devtools for better separation of concerns.
 */

// Note: These imports will need to be adapted for devtools package
// import type { ComponentInstance } from '../runtime/types'
// For now, we'll create local types or import from @tachui/core
export type ComponentInstance = any // TODO: Import from @tachui/core when available

// Enhanced runtime imports - these will need to be handled differently in devtools
// For now, we'll create mocks or import what's needed
const _enhancedConfig = { recovery: { enableRecovery: true } }
const performanceMonitor = {
  getSnapshot: () => ({
    memory: 0,
    timing: {},
    validationOverhead: 0,
    cacheEfficiency: 0.85,
  }),
}
const _validationCache = { size: 0, hitRate: 0 }

/**
 * Debug session information
 */
export interface DebugSession {
  id: string
  startTime: number
  endTime?: number
  validationEvents: DebugEvent[]
  components: ComponentDebugInfo[]
  errors: any[]
  performance: PerformanceSnapshot
}

/**
 * Debug event types
 */
export type ValidationDebugEventType =
  | 'validation-start'
  | 'validation-end'
  | 'validation-error'
  | 'validation-warning'
  | 'validation-recovery'
  | 'component-mount'
  | 'component-update'
  | 'component-unmount'
  | 'cache-hit'
  | 'cache-miss'
  | 'performance-warning'

/**
 * Debug event
 */
export interface DebugEvent {
  id: string
  type: ValidationDebugEventType
  timestamp: number
  componentType?: string
  componentId?: string
  message: string
  data?: any
  duration?: number
  stackTrace?: string
}

/**
 * Component debug information
 */
export interface ComponentDebugInfo {
  type: string
  id: string
  props: any
  lifecycle: {
    created: number
    mounted?: number
    lastUpdate?: number
    unmounted?: number
  }
  validation: {
    passed: boolean
    errors: string[]
    warnings: string[]
    lastCheck: number
  }
  performance: {
    mountTime?: number
    updateTimes: number[]
    validationTime: number
  }
}

/**
 * Performance snapshot
 */
export interface PerformanceSnapshot {
  memory: number
  timing: {
    [key: string]: number
  }
  validationOverhead: number
  cacheEfficiency: number
}

/**
 * Validation debugging inspector
 */
export class ValidationDebugger {
  private static instance: ValidationDebugger
  private sessions = new Map<string, DebugSession>()
  private currentSession: DebugSession | null = null
  private eventListeners = new Map<ValidationDebugEventType, Function[]>()
  private componentRegistry = new Map<string, ComponentDebugInfo>()

  static getInstance(): ValidationDebugger {
    if (!this.instance) {
      this.instance = new ValidationDebugger()
    }
    return this.instance
  }

  /**
   * Start a debugging session
   */
  startSession(sessionId?: string): string {
    const id =
      sessionId ||
      `debug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const session: DebugSession = {
      id,
      startTime: Date.now(),
      validationEvents: [],
      components: [],
      errors: [],
      performance: performanceMonitor.getSnapshot(),
    }

    this.sessions.set(id, session)
    this.currentSession = session

    this.logEvent('validation-start', `Debug session ${id} started`)

    if (process.env.NODE_ENV !== 'production') {
      console.info(`🔍 TachUI Debug Session Started: ${id}`)
    }

    return id
  }

  /**
   * End the current debugging session
   */
  endSession(): DebugSession | null {
    if (!this.currentSession) {
      console.warn('No active debug session to end')
      return null
    }

    this.currentSession.endTime = Date.now()

    this.logEvent(
      'validation-end',
      `Debug session ${this.currentSession.id} ended`
    )

    const session = this.currentSession
    this.currentSession = null

    if (process.env.NODE_ENV !== 'production') {
      console.info(`🔍 TachUI Debug Session Ended: ${session.id}`)
      this.printSessionSummary(session)
    }

    return session
  }

  /**
   * Log a debug event
   */
  logEvent(type: ValidationDebugEventType, message: string, data?: any): void {
    if (!this.currentSession) return

    const event: DebugEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type,
      timestamp: Date.now(),
      message,
      data,
      stackTrace:
        process.env.NODE_ENV !== 'production' ? new Error().stack : undefined,
    }

    this.currentSession.validationEvents.push(event)

    // Notify event listeners
    const listeners = this.eventListeners.get(type) || []
    listeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('Debug event listener error:', error)
      }
    })
  }

  /**
   * Register component for debugging
   */
  registerComponent(
    _component: ComponentInstance,
    type: string,
    props: any
  ): string {
    const componentId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`

    const debugInfo: ComponentDebugInfo = {
      type,
      id: componentId,
      props,
      lifecycle: {
        created: Date.now(),
      },
      validation: {
        passed: true,
        errors: [],
        warnings: [],
        lastCheck: Date.now(),
      },
      performance: {
        updateTimes: [],
        validationTime: 0,
      },
    }

    this.componentRegistry.set(componentId, debugInfo)

    if (this.currentSession) {
      this.currentSession.components.push(debugInfo)
      this.logEvent('component-mount', `Component ${type} registered`, {
        componentId,
        props,
      })
    }

    return componentId
  }

  /**
   * Update component debug info
   */
  updateComponent(
    componentId: string,
    phase: 'mount' | 'update' | 'unmount',
    data?: any
  ): void {
    const debugInfo = this.componentRegistry.get(componentId)
    if (!debugInfo) return

    const timestamp = Date.now()

    switch (phase) {
      case 'mount':
        debugInfo.lifecycle.mounted = timestamp
        if (data?.performance) {
          debugInfo.performance.mountTime = data.performance.duration
        }
        this.logEvent(
          'component-mount',
          `Component ${debugInfo.type} mounted`,
          { componentId, data }
        )
        break

      case 'update':
        debugInfo.lifecycle.lastUpdate = timestamp
        if (data?.performance) {
          debugInfo.performance.updateTimes.push(data.performance.duration)
        }
        if (data?.props) {
          debugInfo.props = { ...data.props }
        }
        this.logEvent(
          'component-update',
          `Component ${debugInfo.type} updated`,
          { componentId, data }
        )
        break

      case 'unmount':
        debugInfo.lifecycle.unmounted = timestamp
        this.logEvent(
          'component-unmount',
          `Component ${debugInfo.type} unmounted`,
          { componentId }
        )
        break
    }
  }

  /**
   * Record validation error for debugging
   */
  recordValidationError(error: any, componentId?: string): void {
    if (this.currentSession) {
      this.currentSession.errors.push(error)
      this.logEvent('validation-error', `Validation error: ${error.message}`, {
        error,
        componentId,
      })
    }

    if (componentId) {
      const debugInfo = this.componentRegistry.get(componentId)
      if (debugInfo) {
        debugInfo.validation.passed = false
        debugInfo.validation.errors.push(error.message)
      }
    }
  }

  /**
   * Record validation recovery for debugging
   */
  recordValidationRecovery(
    originalError: string,
    recoveryStrategy: string,
    componentId?: string
  ): void {
    this.logEvent(
      'validation-recovery',
      `Recovered from validation error using ${recoveryStrategy}`,
      { originalError, recoveryStrategy, componentId }
    )

    if (componentId) {
      const debugInfo = this.componentRegistry.get(componentId)
      if (debugInfo) {
        debugInfo.validation.warnings.push(`Recovered from: ${originalError}`)
      }
    }
  }

  /**
   * Add event listener for debug events
   */
  addEventListener(
    type: ValidationDebugEventType,
    listener: (event: DebugEvent) => void
  ): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, [])
    }
    this.eventListeners.get(type)!.push(listener)
  }

  /**
   * Remove event listener
   */
  removeEventListener(
    type: ValidationDebugEventType,
    listener: Function
  ): void {
    const listeners = this.eventListeners.get(type)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  /**
   * Get debug session by ID
   */
  getSession(sessionId: string): DebugSession | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * Get current active session
   */
  getCurrentSession(): DebugSession | null {
    return this.currentSession
  }

  /**
   * Get all debug sessions
   */
  getAllSessions(): DebugSession[] {
    return Array.from(this.sessions.values())
  }

  /**
   * Search debug events by criteria
   */
  searchEvents(criteria: {
    type?: ValidationDebugEventType
    componentType?: string
    timeRange?: { start: number; end: number }
    messageContains?: string
  }): DebugEvent[] {
    if (!this.currentSession) return []

    return this.currentSession.validationEvents.filter(event => {
      if (criteria.type && event.type !== criteria.type) return false
      if (
        criteria.componentType &&
        event.componentType !== criteria.componentType
      )
        return false
      if (criteria.timeRange) {
        if (
          event.timestamp < criteria.timeRange.start ||
          event.timestamp > criteria.timeRange.end
        )
          return false
      }
      if (
        criteria.messageContains &&
        !event.message.includes(criteria.messageContains)
      )
        return false
      return true
    })
  }

  /**
   * Analyze component performance
   */
  analyzeComponent(componentId: string): ComponentDebugInfo | null {
    const debugInfo = this.componentRegistry.get(componentId)
    if (!debugInfo) return null

    // Calculate average update time
    if (debugInfo.performance.updateTimes.length > 0) {
      const average =
        debugInfo.performance.updateTimes.reduce((sum, time) => sum + time, 0) /
        debugInfo.performance.updateTimes.length
      console.info(
        `📊 Component ${debugInfo.type} average update time: ${average.toFixed(2)}ms`
      )
    }

    // Calculate component age
    const age = Date.now() - debugInfo.lifecycle.created
    console.info(`📊 Component ${debugInfo.type} age: ${age}ms`)

    return debugInfo
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): string {
    if (!this.currentSession) return 'No active debug session'

    const components = this.currentSession.components
    const totalValidationTime = components.reduce(
      (sum, comp) => sum + comp.performance.validationTime,
      0
    )
    const averageValidationTime =
      components.length > 0 ? totalValidationTime / components.length : 0

    const report = [
      '🔍 TachUI Validation Performance Report',
      `Session ID: ${this.currentSession.id}`,
      `Duration: ${this.currentSession.endTime ? this.currentSession.endTime - this.currentSession.startTime : 'Ongoing'}ms`,
      `Components: ${components.length}`,
      `Validation Events: ${this.currentSession.validationEvents.length}`,
      `Errors: ${this.currentSession.errors.length}`,
      `Average Validation Time: ${averageValidationTime.toFixed(2)}ms`,
      '',
      'Component Performance:',
      ...components.map(comp => {
        const updateCount = comp.performance.updateTimes.length
        const avgUpdateTime =
          updateCount > 0
            ? comp.performance.updateTimes.reduce(
                (sum, time) => sum + time,
                0
              ) / updateCount
            : 0
        return `  ${comp.type} (${comp.id}): ${comp.performance.validationTime}ms validation, ${avgUpdateTime.toFixed(2)}ms avg update, ${updateCount} updates`
      }),
    ].join('\n')

    return report
  }

  /**
   * Clear all debug data
   */
  clearDebugData(): void {
    this.sessions.clear()
    this.currentSession = null
    this.componentRegistry.clear()
    this.eventListeners.clear()
    console.info('🔍 Debug data cleared')
  }

  /**
   * Export debug data for external analysis
   */
  exportDebugData(): string {
    const data = {
      sessions: Array.from(this.sessions.entries()),
      currentSession: this.currentSession,
      components: Array.from(this.componentRegistry.entries()),
      timestamp: Date.now(),
    }
    return JSON.stringify(data, null, 2)
  }

  /**
   * Import debug data from external source
   */
  importDebugData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData)

      if (data.sessions) {
        this.sessions = new Map(data.sessions)
      }

      if (data.components) {
        this.componentRegistry = new Map(data.components)
      }

      if (data.currentSession) {
        this.currentSession = data.currentSession
      }

      console.info('🔍 Debug data imported successfully')
    } catch (error) {
      console.error('Failed to import debug data:', error)
    }
  }

  /**
   * Print session summary to console
   */
  private printSessionSummary(session: DebugSession): void {
    const duration = session.endTime ? session.endTime - session.startTime : 0
    const errorCount = session.errors.length
    const componentCount = session.components.length
    const eventCount = session.validationEvents.length

    console.group(`📊 Debug Session Summary: ${session.id}`)
    console.info(`Duration: ${duration}ms`)
    console.info(`Components: ${componentCount}`)
    console.info(`Events: ${eventCount}`)
    console.info(`Errors: ${errorCount}`)

    if (errorCount > 0) {
      console.warn(
        'Errors encountered:',
        session.errors.map(e => e.message)
      )
    }

    const performanceEvents = session.validationEvents.filter(
      e => e.type === 'performance-warning'
    )
    if (performanceEvents.length > 0) {
      console.warn(`Performance warnings: ${performanceEvents.length}`)
    }

    console.groupEnd()
  }
}

/**
 * Global validation debugger instance
 */
export const validationDebugger = ValidationDebugger.getInstance()

/**
 * Validation debugging utilities
 */
export const ValidationDebugUtils = {
  /**
   * Start debugging session
   */
  startSession: (sessionId?: string) =>
    validationDebugger.startSession(sessionId),

  /**
   * End debugging session
   */
  endSession: () => validationDebugger.endSession(),

  /**
   * Log debug event
   */
  logEvent: (type: ValidationDebugEventType, message: string, data?: any) =>
    validationDebugger.logEvent(type, message, data),

  /**
   * Register component for debugging
   */
  registerComponent: (component: ComponentInstance, type: string, props: any) =>
    validationDebugger.registerComponent(component, type, props),

  /**
   * Record validation error
   */
  recordError: (error: any, componentId?: string) =>
    validationDebugger.recordValidationError(error, componentId),

  /**
   * Record validation recovery
   */
  recordRecovery: (
    originalError: string,
    strategy: string,
    componentId?: string
  ) =>
    validationDebugger.recordValidationRecovery(
      originalError,
      strategy,
      componentId
    ),

  /**
   * Get performance report
   */
  getPerformanceReport: () => validationDebugger.generatePerformanceReport(),

  /**
   * Search events
   */
  searchEvents: (criteria: any) => validationDebugger.searchEvents(criteria),

  /**
   * Export debug data
   */
  export: () => validationDebugger.exportDebugData(),

  /**
   * Import debug data
   */
  import: (data: string) => validationDebugger.importDebugData(data),

  /**
   * Clear all debug data
   */
  clear: () => validationDebugger.clearDebugData(),

  /**
   * Test debugging system
   */
  test: () => {
    console.group('🔍 Validation Debug System Test')

    try {
      // Start a test session
      const sessionId = validationDebugger.startSession('test-session')
      console.info('✅ Debug session started:', sessionId)

      // Register a test component
      const componentId = validationDebugger.registerComponent(
        {} as ComponentInstance,
        'TestComponent',
        { prop: 'value' }
      )
      console.info('✅ Test component registered:', componentId)

      // Log some test events
      validationDebugger.logEvent('validation-start', 'Test validation started')
      validationDebugger.logEvent('cache-hit', 'Test cache hit', {
        key: 'test-key',
      })
      validationDebugger.logEvent('validation-end', 'Test validation completed')

      // Update component
      validationDebugger.updateComponent(componentId, 'mount', {
        performance: { duration: 5 },
      })
      validationDebugger.updateComponent(componentId, 'update', {
        props: { updated: true },
      })

      // Record a test error and recovery
      validationDebugger.recordValidationError(
        new Error('Test error'),
        componentId
      )
      validationDebugger.recordValidationRecovery(
        'Test error',
        'fallback',
        componentId
      )

      // Generate and log performance report
      const _report = validationDebugger.generatePerformanceReport()
      console.info('✅ Performance report generated')

      // Search events
      const errorEvents = validationDebugger.searchEvents({
        type: 'validation-error',
      })
      console.info('✅ Event search:', errorEvents.length, 'error events found')

      // End session
      const session = validationDebugger.endSession()
      console.info('✅ Debug session ended:', session?.id)

      console.info('✅ Validation debugging system is working correctly')
    } catch (error) {
      console.error('❌ Validation debugging test failed:', error)
    }

    console.groupEnd()
  },
}
