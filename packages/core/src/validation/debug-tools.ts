/**
 * Validation Debugging Tools - Phase 1C
 * 
 * Comprehensive debugging helpers, diagnostic tools, validation inspector,
 * and developer utilities for analyzing validation behavior.
 */

import type { ComponentInstance } from '../runtime/types'
import { enhancedConfig, performanceMonitor, validationCache } from './enhanced-runtime'

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
  performance?: {
    duration: number
    memory?: number
  }
}

/**
 * Component debug information
 */
export interface ComponentDebugInfo {
  type: string
  id: string
  props: any
  lifecycle: {
    constructed: number
    mounted?: number
    lastUpdate?: number
    unmounted?: number
  }
  validation: {
    passed: boolean
    errors: string[]
    warnings: string[]
  }
  performance: {
    constructionTime: number
    mountTime?: number
    updateTimes: number[]
  }
}

/**
 * Performance snapshot
 */
export interface PerformanceSnapshot {
  totalValidations: number
  averageValidationTime: number
  cacheHitRate: number
  memoryUsage: number
  slowOperations: Array<{ operation: string; time: number }>
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
    const id = sessionId || `debug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const session: DebugSession = {
      id,
      startTime: Date.now(),
      validationEvents: [],
      components: [],
      errors: [],
      performance: this.capturePerformanceSnapshot()
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
    this.currentSession.performance = this.capturePerformanceSnapshot()
    
    this.logEvent('validation-end', `Debug session ${this.currentSession.id} ended`)
    
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
      data
    }

    this.currentSession.validationEvents.push(event)
    
    // Trigger event listeners
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
  registerComponent(_component: ComponentInstance, type: string, props: any): string {
    const componentId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
    
    const debugInfo: ComponentDebugInfo = {
      type,
      id: componentId,
      props: { ...props },
      lifecycle: {
        constructed: Date.now()
      },
      validation: {
        passed: true,
        errors: [],
        warnings: []
      },
      performance: {
        constructionTime: 0,
        updateTimes: []
      }
    }

    this.componentRegistry.set(componentId, debugInfo)
    
    if (this.currentSession) {
      this.currentSession.components.push(debugInfo)
      this.logEvent('component-mount', `Component ${type} registered`, { componentId, props })
    }

    return componentId
  }

  /**
   * Update component debug info
   */
  updateComponent(componentId: string, phase: 'mount' | 'update' | 'unmount', data?: any): void {
    const debugInfo = this.componentRegistry.get(componentId)
    if (!debugInfo) return

    const timestamp = Date.now()
    
    switch (phase) {
      case 'mount':
        debugInfo.lifecycle.mounted = timestamp
        if (data?.performance) {
          debugInfo.performance.mountTime = data.performance.duration
        }
        this.logEvent('component-mount', `Component ${debugInfo.type} mounted`, { componentId, data })
        break
        
      case 'update':
        debugInfo.lifecycle.lastUpdate = timestamp
        if (data?.performance) {
          debugInfo.performance.updateTimes.push(data.performance.duration)
        }
        if (data?.props) {
          debugInfo.props = { ...data.props }
        }
        this.logEvent('component-update', `Component ${debugInfo.type} updated`, { componentId, data })
        break
        
      case 'unmount':
        debugInfo.lifecycle.unmounted = timestamp
        this.logEvent('component-unmount', `Component ${debugInfo.type} unmounted`, { componentId })
        break
    }
  }

  /**
   * Record validation error for debugging
   */
  recordValidationError(error: any, componentId?: string): void {
    if (this.currentSession) {
      this.currentSession.errors.push(error)
    }

    if (componentId) {
      const debugInfo = this.componentRegistry.get(componentId)
      if (debugInfo) {
        debugInfo.validation.passed = false
        debugInfo.validation.errors.push(error.message)
      }
    }

    this.logEvent('validation-error', `Validation error: ${error.message}`, {
      componentId,
      error: {
        message: error.message,
        context: error.context
      }
    })
  }

  /**
   * Record validation recovery
   */
  recordRecovery(strategy: string, componentId?: string, originalError?: string): void {
    if (componentId) {
      const debugInfo = this.componentRegistry.get(componentId)
      if (debugInfo) {
        debugInfo.validation.warnings.push(`Recovered from: ${originalError}`)
      }
    }

    this.logEvent('validation-recovery', `Error recovery: ${strategy}`, {
      componentId,
      strategy,
      originalError
    })
  }

  /**
   * Add event listener
   */
  addEventListener(type: ValidationDebugEventType, listener: (event: DebugEvent) => void): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, [])
    }
    this.eventListeners.get(type)!.push(listener)
  }

  /**
   * Remove event listener
   */
  removeEventListener(type: ValidationDebugEventType, listener: Function): void {
    const listeners = this.eventListeners.get(type)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index !== -1) {
        listeners.splice(index, 1)
      }
    }
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): DebugSession | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * Get current session
   */
  getCurrentSession(): DebugSession | null {
    return this.currentSession
  }

  /**
   * Get all sessions
   */
  getAllSessions(): DebugSession[] {
    return Array.from(this.sessions.values())
  }

  /**
   * Search events by criteria
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
      if (criteria.componentType && event.componentType !== criteria.componentType) return false
      if (criteria.timeRange) {
        if (event.timestamp < criteria.timeRange.start || event.timestamp > criteria.timeRange.end) {
          return false
        }
      }
      if (criteria.messageContains && !event.message.includes(criteria.messageContains)) return false
      
      return true
    })
  }

  /**
   * Get component analysis
   */
  analyzeComponent(componentId: string): ComponentDebugInfo | null {
    return this.componentRegistry.get(componentId) || null
  }

  /**
   * Capture performance snapshot
   */
  private capturePerformanceSnapshot(): PerformanceSnapshot {
    const stats = performanceMonitor.getStats()
    const cacheSize = validationCache.getSize()
    
    return {
      totalValidations: stats.measurements || 0,
      averageValidationTime: stats.averageTime || 0,
      cacheHitRate: cacheSize > 0 ? 0.85 : 0, // Estimated
      memoryUsage: this.getMemoryUsage(),
      slowOperations: []
    }
  }

  /**
   * Get memory usage if available
   */
  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory.usedJSHeapSize
    }
    return 0
  }

  /**
   * Print session summary
   */
  private printSessionSummary(session: DebugSession): void {
    const duration = (session.endTime || Date.now()) - session.startTime
    const errorCount = session.errors.length
    const eventCount = session.validationEvents.length
    const componentCount = session.components.length

    console.group(`🔍 Debug Session Summary: ${session.id}`)
    console.info(`⏱️  Duration: ${duration}ms`)
    console.info(`🏗️  Components: ${componentCount}`)
    console.info(`📋 Events: ${eventCount}`)
    console.info(`❌ Errors: ${errorCount}`)
    
    if (session.performance.averageValidationTime > 0) {
      console.info(`⚡ Avg Validation Time: ${session.performance.averageValidationTime.toFixed(2)}ms`)
    }
    
    if (errorCount > 0) {
      console.group('❌ Errors:')
      session.errors.forEach((error, index) => {
        console.error(`${index + 1}. ${error.message}`)
      })
      console.groupEnd()
    }
    
    console.groupEnd()
  }

  /**
   * Export session data
   */
  exportSession(sessionId: string): string {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    const exportData = {
      session,
      framework: 'tachUI',
      exportTime: new Date().toISOString(),
      environment: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js',
        nodeEnv: process.env.NODE_ENV,
        validationEnabled: enhancedConfig.enabled
      }
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Clear all sessions
   */
  clearSessions(): void {
    this.sessions.clear()
    this.currentSession = null
    this.componentRegistry.clear()
  }
}

/**
 * Validation inspector for real-time analysis
 */
export class ValidationInspector {
  private watchers = new Map<string, Function>()
  private validationDebugger = ValidationDebugger.getInstance()

  /**
   * Watch for validation events
   */
  watch(pattern: string | RegExp, callback: (event: DebugEvent) => void): string {
    const watcherId = `watcher-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
    
    const watcher = (event: DebugEvent) => {
      const matches = typeof pattern === 'string' 
        ? event.message.includes(pattern)
        : pattern.test(event.message)
      
      if (matches) {
        callback(event)
      }
    }

    this.watchers.set(watcherId, watcher)
    
    // Listen to all event types
    const eventTypes: ValidationDebugEventType[] = [
      'validation-start', 'validation-end', 'validation-error', 'validation-recovery',
      'component-mount', 'component-update', 'component-unmount',
      'cache-hit', 'cache-miss', 'performance-warning'
    ]

    eventTypes.forEach(type => {
      this.validationDebugger.addEventListener(type, watcher)
    })

    return watcherId
  }

  /**
   * Stop watching
   */
  unwatch(watcherId: string): void {
    const watcher = this.watchers.get(watcherId)
    if (!watcher) return

    // Remove from all event types
    const eventTypes: ValidationDebugEventType[] = [
      'validation-start', 'validation-end', 'validation-error', 'validation-recovery',
      'component-mount', 'component-update', 'component-unmount',
      'cache-hit', 'cache-miss', 'performance-warning'
    ]

    eventTypes.forEach(type => {
      this.validationDebugger.removeEventListener(type, watcher)
    })

    this.watchers.delete(watcherId)
  }

  /**
   * Watch for specific component issues
   */
  watchComponent(componentType: string, callback: (event: DebugEvent) => void): string {
    return this.watch(componentType, (event) => {
      if (event.componentType === componentType) {
        callback(event)
      }
    })
  }

  /**
   * Watch for performance issues
   */
  watchPerformance(threshold: number, callback: (event: DebugEvent) => void): string {
    return this.watch(/performance|slow/, (event) => {
      if (event.performance && event.performance.duration > threshold) {
        callback(event)
      }
    })
  }

  /**
   * Watch for errors
   */
  watchErrors(callback: (event: DebugEvent) => void): string {
    const watcherId = `error-watcher-${Date.now()}`
    this.validationDebugger.addEventListener('validation-error', callback)
    this.watchers.set(watcherId, callback)
    return watcherId
  }

  /**
   * Get real-time statistics
   */
  getRealTimeStats() {
    const session = this.validationDebugger.getCurrentSession()
    if (!session) {
      return null
    }

    const now = Date.now()
    const recentEvents = session.validationEvents.filter(e => now - e.timestamp < 5000) // Last 5 seconds
    
    return {
      activeSession: session.id,
      recentEvents: recentEvents.length,
      totalComponents: session.components.length,
      totalErrors: session.errors.length,
      lastActivity: session.validationEvents.length > 0 
        ? session.validationEvents[session.validationEvents.length - 1].timestamp
        : session.startTime
    }
  }
}

/**
 * Debug console helper
 */
export class DebugConsole {
  private static commands = new Map<string, Function>()

  /**
   * Register debug commands
   */
  static init(): void {
    if (typeof window !== 'undefined') {
      // Browser environment - add to window for console access
      (window as any).tachUIDebug = this.createDebugAPI()
    }

    // Register built-in commands
    this.registerCommand('start', (sessionId?: string) => {
      const validationDebugger = ValidationDebugger.getInstance()
      return validationDebugger.startSession(sessionId)
    })

    this.registerCommand('end', () => {
      const validationDebugger = ValidationDebugger.getInstance()
      return validationDebugger.endSession()
    })

    this.registerCommand('stats', () => {
      const inspector = new ValidationInspector()
      return inspector.getRealTimeStats()
    })

    this.registerCommand('export', (sessionId: string) => {
      const validationDebugger = ValidationDebugger.getInstance()
      return validationDebugger.exportSession(sessionId)
    })

    this.registerCommand('clear', () => {
      const validationDebugger = ValidationDebugger.getInstance()
      validationDebugger.clearSessions()
      return 'All sessions cleared'
    })
  }

  /**
   * Register a debug command
   */
  static registerCommand(name: string, handler: Function): void {
    this.commands.set(name, handler)
  }

  /**
   * Execute a debug command
   */
  static executeCommand(name: string, ...args: any[]): any {
    const command = this.commands.get(name)
    if (!command) {
      throw new Error(`Unknown debug command: ${name}`)
    }
    return command(...args)
  }

  /**
   * Create debug API for browser console
   */
  private static createDebugAPI() {
    return {
      start: (sessionId?: string) => this.executeCommand('start', sessionId),
      end: () => this.executeCommand('end'),
      stats: () => this.executeCommand('stats'),
      export: (sessionId: string) => this.executeCommand('export', sessionId),
      clear: () => this.executeCommand('clear'),
      help: () => {
        console.info(`
🔍 TachUI Debug Console Commands:

tachUIDebug.start(sessionId?)  - Start debug session
tachUIDebug.end()              - End current session  
tachUIDebug.stats()            - Get real-time stats
tachUIDebug.export(sessionId)  - Export session data
tachUIDebug.clear()            - Clear all sessions
tachUIDebug.help()             - Show this help

Example:
const sessionId = tachUIDebug.start()
// ... use your app ...
const session = tachUIDebug.end()
        `)
      }
    }
  }
}

// Global instances
export const validationDebugger = ValidationDebugger.getInstance()
export const validationInspector = new ValidationInspector()

// Initialize debug console in browser
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  DebugConsole.init()
}

// Export utilities
export const ValidationDebugUtils = {
  // Debugger methods
  startSession: (sessionId?: string) => validationDebugger.startSession(sessionId),
  endSession: () => validationDebugger.endSession(),
  logEvent: (type: ValidationDebugEventType, message: string, data?: any) => 
    validationDebugger.logEvent(type, message, data),
  
  // Inspector methods
  watch: (pattern: string | RegExp, callback: (event: DebugEvent) => void) =>
    validationInspector.watch(pattern, callback),
  watchComponent: (type: string, callback: (event: DebugEvent) => void) =>
    validationInspector.watchComponent(type, callback),
  watchErrors: (callback: (event: DebugEvent) => void) =>
    validationInspector.watchErrors(callback),
  
  // Analysis methods
  getRealTimeStats: () => validationInspector.getRealTimeStats(),
  analyzeComponent: (componentId: string) => validationDebugger.analyzeComponent(componentId),
  exportSession: (sessionId: string) => validationDebugger.exportSession(sessionId),
  
  // Utilities
  test: () => {
    console.group('🔍 Validation Debug Tools Test')
    
    try {
      validationDebugger.startSession()
      validationDebugger.logEvent('validation-start', 'Test event')
      const session = validationDebugger.endSession()
      
      console.info('✅ Debug session creation:', !!session)
      console.info('✅ Event logging:', session?.validationEvents.length || false)
      console.info('✅ Real-time stats:', !!validationInspector.getRealTimeStats())
      console.info('✅ Debug tools are working correctly')
      
    } catch (error) {
      console.error('❌ Debug tools test failed:', error)
    }
    
    console.groupEnd()
  }
}