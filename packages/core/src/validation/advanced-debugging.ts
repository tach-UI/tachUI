/**
 * Advanced Developer Debugging Tools - Phase 1D
 * 
 * Enhanced validation state inspection, visual debugging tools,
 * and comprehensive developer diagnostics.
 */

import type { ValidationDebugEventType, DebugEvent } from './debug-tools'
import type { FormattedErrorMessage } from './developer-experience'

/**
 * Advanced debugging configuration
 */
export interface AdvancedDebuggingConfig {
  // Visual debugging
  enableVisualDebugging: boolean
  highlightValidationErrors: boolean
  showComponentBoundaries: boolean
  showModifierEffects: boolean
  
  // State inspection
  enableStateInspection: boolean
  trackStateChanges: boolean
  showStateHistory: boolean
  maxHistorySize: number
  
  // Performance debugging
  enablePerformanceDebugging: boolean
  trackRenderTimes: boolean
  showMemoryUsage: boolean
  enableFrameProfiler: boolean
  
  // Interactive debugging
  enableInteractiveMode: boolean
  showDebugPanel: boolean
  enableBreakpoints: boolean
  enableStepThrough: boolean
  
  // Export and sharing
  enableDebugExport: boolean
  exportFormat: 'json' | 'csv' | 'html'
  includeSourceMaps: boolean
}

/**
 * Component state snapshot for debugging
 */
export interface ComponentStateSnapshot {
  id: string
  componentType: string
  timestamp: number
  
  // Component data
  props: Record<string, any>
  state: Record<string, any>
  modifiers: string[]
  
  // Validation state
  validationErrors: FormattedErrorMessage[]
  validationWarnings: FormattedErrorMessage[]
  isValid: boolean
  
  // Performance data
  renderTime: number
  memoryUsage: number
  updateCount: number
  
  // DOM information
  domNode?: {
    tagName: string
    className: string
    attributes: Record<string, string>
    computedStyles: Record<string, string>
  }
  
  // Parent/child relationships
  parent?: string
  children: string[]
}

/**
 * Validation state inspector
 */
export interface ValidationStateInspector {
  id: string
  target: 'component' | 'modifier' | 'global'
  targetId?: string
  
  // Inspection configuration
  watchProperties: string[]
  watchEvents: ValidationDebugEventType[]
  
  // Collected data
  snapshots: ComponentStateSnapshot[]
  events: DebugEvent[]
  
  // Analysis
  trends: {
    errorFrequency: number
    performanceRegression: boolean
    memoryLeaks: boolean
    stateInconsistencies: boolean
  }
  
  // Status
  isActive: boolean
  startTime: number
  lastUpdate: number
}

/**
 * Visual debugging overlay
 */
export interface VisualDebuggingOverlay {
  id: string
  type: 'error-highlight' | 'component-boundary' | 'modifier-effect' | 'performance-heatmap'
  
  // Visual properties
  color: string
  opacity: number
  strokeWidth: number
  animation?: 'pulse' | 'fade' | 'shake'
  
  // Positioning
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
  
  // Content
  label?: string
  tooltip?: string
  additionalInfo?: Record<string, any>
  
  // Lifecycle
  duration: number // milliseconds, -1 for persistent
  createdAt: number
  expiresAt: number
}

/**
 * Advanced debugging session
 */
export interface AdvancedDebuggingSession {
  id: string
  name: string
  description: string
  
  // Session metadata
  startTime: number
  endTime?: number
  duration?: number
  
  // Captured data
  components: Map<string, ComponentStateSnapshot[]>
  validators: ValidationStateInspector[]
  overlays: VisualDebuggingOverlay[]
  events: DebugEvent[]
  
  // Analysis results
  summary: {
    totalErrors: number
    totalWarnings: number
    criticalIssues: string[]
    performanceIssues: string[]
    recommendations: string[]
  }
  
  // Export metadata
  exported: boolean
  exportFormat?: string
  exportPath?: string
}

/**
 * Global advanced debugging configuration
 */
let advancedDebugConfig: AdvancedDebuggingConfig = {
  enableVisualDebugging: false,
  highlightValidationErrors: true,
  showComponentBoundaries: false,
  showModifierEffects: false,
  enableStateInspection: true,
  trackStateChanges: true,
  showStateHistory: true,
  maxHistorySize: 100,
  enablePerformanceDebugging: true,
  trackRenderTimes: true,
  showMemoryUsage: true,
  enableFrameProfiler: false,
  enableInteractiveMode: false,
  showDebugPanel: false,
  enableBreakpoints: false,
  enableStepThrough: false,
  enableDebugExport: true,
  exportFormat: 'json',
  includeSourceMaps: false
}

/**
 * Advanced validation state inspector
 */
export class AdvancedValidationInspector {
  private inspectors = new Map<string, ValidationStateInspector>()
  private snapshots = new Map<string, ComponentStateSnapshot[]>()
  private overlays = new Map<string, VisualDebuggingOverlay>()
  private activeSession: AdvancedDebuggingSession | null = null

  /**
   * Create a new state inspector
   */
  createInspector(
    target: 'component' | 'modifier' | 'global',
    targetId?: string,
    options: {
      watchProperties?: string[]
      watchEvents?: ValidationDebugEventType[]
    } = {}
  ): string {
    const inspectorId = `inspector-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
    
    const inspector: ValidationStateInspector = {
      id: inspectorId,
      target,
      targetId,
      watchProperties: options.watchProperties || ['*'],
      watchEvents: options.watchEvents || ['validation-error', 'validation-end', 'validation-start'],
      snapshots: [],
      events: [],
      trends: {
        errorFrequency: 0,
        performanceRegression: false,
        memoryLeaks: false,
        stateInconsistencies: false
      },
      isActive: true,
      startTime: Date.now(),
      lastUpdate: Date.now()
    }

    this.inspectors.set(inspectorId, inspector)
    return inspectorId
  }

  /**
   * Take a component state snapshot
   */
  takeSnapshot(componentId: string, componentData: {
    type: string
    props: Record<string, any>
    state: Record<string, any>
    modifiers: string[]
    domElement?: HTMLElement
  }): string {
    const snapshotId = `snapshot-${Date.now()}-${componentId}`
    
    const snapshot: ComponentStateSnapshot = {
      id: snapshotId,
      componentType: componentData.type,
      timestamp: Date.now(),
      props: { ...componentData.props },
      state: { ...componentData.state },
      modifiers: [...componentData.modifiers],
      validationErrors: [],
      validationWarnings: [],
      isValid: true,
      renderTime: 0,
      memoryUsage: this.getMemoryUsage(),
      updateCount: 0,
      children: [],
      domNode: componentData.domElement ? this.extractDOMInfo(componentData.domElement) : undefined
    }

    // Get existing snapshots for this component
    const existingSnapshots = this.snapshots.get(componentId) || []
    existingSnapshots.push(snapshot)

    // Limit history size
    if (existingSnapshots.length > advancedDebugConfig.maxHistorySize) {
      existingSnapshots.shift()
    }

    this.snapshots.set(componentId, existingSnapshots)

    // Update active inspectors
    this.updateInspectors(componentId, snapshot)

    return snapshotId
  }

  /**
   * Add visual debugging overlay
   */
  addVisualOverlay(
    type: VisualDebuggingOverlay['type'],
    bounds: { x: number; y: number; width: number; height: number },
    options: {
      color?: string
      label?: string
      tooltip?: string
      duration?: number
      animation?: VisualDebuggingOverlay['animation']
    } = {}
  ): string {
    if (!advancedDebugConfig.enableVisualDebugging) {
      return ''
    }

    const overlayId = `overlay-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
    const now = Date.now()
    const duration = options.duration || 5000

    const overlay: VisualDebuggingOverlay = {
      id: overlayId,
      type,
      color: options.color || this.getDefaultColor(type),
      opacity: 0.7,
      strokeWidth: 2,
      animation: options.animation,
      bounds,
      label: options.label,
      tooltip: options.tooltip,
      duration,
      createdAt: now,
      expiresAt: duration > 0 ? now + duration : -1
    }

    this.overlays.set(overlayId, overlay)

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.overlays.delete(overlayId)
      }, duration)
    }

    return overlayId
  }

  /**
   * Start advanced debugging session
   */
  startSession(name: string, description: string = ''): string {
    const sessionId = `session-${Date.now()}`
    
    this.activeSession = {
      id: sessionId,
      name,
      description,
      startTime: Date.now(),
      components: new Map(),
      validators: [],
      overlays: [],
      events: [],
      summary: {
        totalErrors: 0,
        totalWarnings: 0,
        criticalIssues: [],
        performanceIssues: [],
        recommendations: []
      },
      exported: false
    }

    return sessionId
  }

  /**
   * Stop debugging session and generate report
   */
  stopSession(): AdvancedDebuggingSession | null {
    if (!this.activeSession) {
      return null
    }

    this.activeSession.endTime = Date.now()
    this.activeSession.duration = this.activeSession.endTime - this.activeSession.startTime

    // Analyze collected data
    this.analyzeSession(this.activeSession)

    const session = this.activeSession
    this.activeSession = null

    return session
  }

  /**
   * Get component state history
   */
  getComponentHistory(componentId: string): ComponentStateSnapshot[] {
    return this.snapshots.get(componentId) || []
  }

  /**
   * Get validation trends analysis
   */
  getValidationTrends(componentId?: string): {
    errorRate: number
    warningRate: number
    performanceRegression: boolean
    memoryTrend: 'increasing' | 'stable' | 'decreasing'
    recommendations: string[]
  } {
    const snapshots = componentId 
      ? this.snapshots.get(componentId) || []
      : Array.from(this.snapshots.values()).flat()

    if (snapshots.length === 0) {
      return {
        errorRate: 0,
        warningRate: 0,
        performanceRegression: false,
        memoryTrend: 'stable',
        recommendations: []
      }
    }

    const errorRate = snapshots.filter(s => s.validationErrors.length > 0).length / snapshots.length
    const warningRate = snapshots.filter(s => s.validationWarnings.length > 0).length / snapshots.length

    // Performance analysis
    const renderTimes = snapshots.map(s => s.renderTime).filter(t => t > 0)
    const avgRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length
    const performanceRegression = renderTimes.length > 5 && 
      renderTimes.slice(-3).every(t => t > avgRenderTime * 1.2)

    // Memory analysis
    const memoryUsages = snapshots.map(s => s.memoryUsage).filter(m => m > 0)
    let memoryTrend: 'increasing' | 'stable' | 'decreasing' = 'stable'
    
    if (memoryUsages.length > 5) {
      const firstHalf = memoryUsages.slice(0, Math.floor(memoryUsages.length / 2))
      const secondHalf = memoryUsages.slice(Math.floor(memoryUsages.length / 2))
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
      
      if (secondAvg > firstAvg * 1.1) {
        memoryTrend = 'increasing'
      } else if (secondAvg < firstAvg * 0.9) {
        memoryTrend = 'decreasing'
      }
    }

    // Generate recommendations
    const recommendations: string[] = []
    if (errorRate > 0.1) {
      recommendations.push('High error rate detected - review component validation')
    }
    if (performanceRegression) {
      recommendations.push('Performance regression detected - optimize render methods')
    }
    if (memoryTrend === 'increasing') {
      recommendations.push('Memory usage increasing - check for memory leaks')
    }

    return {
      errorRate,
      warningRate,
      performanceRegression,
      memoryTrend,
      recommendations
    }
  }

  /**
   * Export debugging session data
   */
  exportSessionData(session: AdvancedDebuggingSession, format: 'json' | 'csv' | 'html' = 'json'): string {
    switch (format) {
      case 'json':
        return this.exportAsJSON(session)
      case 'csv':
        return this.exportAsCSV(session)
      case 'html':
        return this.exportAsHTML(session)
      default:
        return this.exportAsJSON(session)
    }
  }

  /**
   * Extract DOM information from element
   */
  private extractDOMInfo(element: HTMLElement): ComponentStateSnapshot['domNode'] {
    return {
      tagName: element.tagName.toLowerCase(),
      className: element.className,
      attributes: Array.from(element.attributes).reduce((acc, attr) => {
        acc[attr.name] = attr.value
        return acc
      }, {} as Record<string, string>),
      computedStyles: this.getComputedStyles(element)
    }
  }

  /**
   * Get computed styles for an element
   */
  private getComputedStyles(element: HTMLElement): Record<string, string> {
    if (typeof window === 'undefined' || !window.getComputedStyle) {
      return {}
    }

    const styles = window.getComputedStyle(element)
    const importantStyles = [
      'width', 'height', 'padding', 'margin', 'border',
      'background-color', 'color', 'font-size', 'font-weight',
      'display', 'position', 'z-index', 'opacity'
    ]

    return importantStyles.reduce((acc, prop) => {
      acc[prop] = styles.getPropertyValue(prop)
      return acc
    }, {} as Record<string, string>)
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory.usedJSHeapSize
    }
    return 0
  }

  /**
   * Get default color for overlay type
   */
  private getDefaultColor(type: VisualDebuggingOverlay['type']): string {
    const colors = {
      'error-highlight': '#ff4444',
      'component-boundary': '#0088ff',
      'modifier-effect': '#ffaa00',
      'performance-heatmap': '#ff6600'
    }
    return colors[type] || '#888888'
  }

  /**
   * Update active inspectors with new snapshot
   */
  private updateInspectors(componentId: string, snapshot: ComponentStateSnapshot): void {
    for (const inspector of this.inspectors.values()) {
      if (!inspector.isActive) continue

      // Check if this inspector should track this component
      const shouldTrack = inspector.target === 'global' || 
        (inspector.target === 'component' && inspector.targetId === componentId)

      if (shouldTrack) {
        inspector.snapshots.push(snapshot)
        inspector.lastUpdate = Date.now()

        // Update trends
        this.updateInspectorTrends(inspector)
      }
    }
  }

  /**
   * Update inspector trends analysis
   */
  private updateInspectorTrends(inspector: ValidationStateInspector): void {
    const snapshots = inspector.snapshots
    if (snapshots.length < 2) return

    // Calculate error frequency
    const recentSnapshots = snapshots.slice(-10)
    const errorsInRecent = recentSnapshots.filter(s => s.validationErrors.length > 0).length
    inspector.trends.errorFrequency = errorsInRecent / recentSnapshots.length

    // Check for performance regression
    const renderTimes = recentSnapshots.map(s => s.renderTime).filter(t => t > 0)
    if (renderTimes.length > 3) {
      const avgTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length
      const recentAvg = renderTimes.slice(-3).reduce((a, b) => a + b, 0) / 3
      inspector.trends.performanceRegression = recentAvg > avgTime * 1.5
    }

    // Check for memory leaks
    const memoryUsages = recentSnapshots.map(s => s.memoryUsage).filter(m => m > 0)
    if (memoryUsages.length > 5) {
      const isIncreasing = memoryUsages.every((usage, index) => 
        index === 0 || usage >= memoryUsages[index - 1]
      )
      inspector.trends.memoryLeaks = isIncreasing && 
        memoryUsages[memoryUsages.length - 1] > memoryUsages[0] * 1.2
    }
  }

  /**
   * Analyze debugging session
   */
  private analyzeSession(session: AdvancedDebuggingSession): void {
    const allSnapshots = Array.from(session.components.values()).flat()
    
    session.summary.totalErrors = allSnapshots.reduce((sum, s) => sum + s.validationErrors.length, 0)
    session.summary.totalWarnings = allSnapshots.reduce((sum, s) => sum + s.validationWarnings.length, 0)

    // Find critical issues
    session.summary.criticalIssues = allSnapshots
      .filter(s => s.validationErrors.some(e => e.template?.severity === 'error'))
      .map(s => `${s.componentType}: ${s.validationErrors[0]?.error.message}`)
      .slice(0, 5)

    // Find performance issues
    const slowComponents = allSnapshots
      .filter(s => s.renderTime > 16) // Slower than 60fps
      .map(s => `${s.componentType}: ${s.renderTime.toFixed(2)}ms render time`)
      .slice(0, 5)
    
    session.summary.performanceIssues = slowComponents

    // Generate recommendations
    const recommendations: string[] = []
    if (session.summary.totalErrors > 0) {
      recommendations.push('Fix validation errors to improve stability')
    }
    if (slowComponents.length > 0) {
      recommendations.push('Optimize slow-rendering components')
    }
    if (allSnapshots.some(s => s.memoryUsage > 50 * 1024 * 1024)) {
      recommendations.push('Investigate high memory usage')
    }

    session.summary.recommendations = recommendations
  }

  /**
   * Export session as JSON
   */
  private exportAsJSON(session: AdvancedDebuggingSession): string {
    return JSON.stringify(session, null, 2)
  }

  /**
   * Export session as CSV
   */
  private exportAsCSV(session: AdvancedDebuggingSession): string {
    const allSnapshots = Array.from(session.components.values()).flat()
    
    const headers = [
      'timestamp', 'componentType', 'componentId', 'isValid',
      'errorCount', 'warningCount', 'renderTime', 'memoryUsage'
    ]

    const rows = allSnapshots.map(snapshot => [
      new Date(snapshot.timestamp).toISOString(),
      snapshot.componentType,
      snapshot.id,
      snapshot.isValid,
      snapshot.validationErrors.length,
      snapshot.validationWarnings.length,
      snapshot.renderTime,
      snapshot.memoryUsage
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  /**
   * Export session as HTML report
   */
  private exportAsHTML(session: AdvancedDebuggingSession): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>TachUI Debugging Report - ${session.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f0f0f0; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .issue { color: #d32f2f; }
        .warning { color: #f57c00; }
        .success { color: #388e3c; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>TachUI Debugging Report</h1>
    <h2>${session.name}</h2>
    <p>${session.description}</p>
    
    <div class="summary">
        <h3>Summary</h3>
        <p><strong>Duration:</strong> ${session.duration}ms</p>
        <p><strong>Total Errors:</strong> <span class="issue">${session.summary.totalErrors}</span></p>
        <p><strong>Total Warnings:</strong> <span class="warning">${session.summary.totalWarnings}</span></p>
        
        <h4>Critical Issues:</h4>
        <ul>
            ${session.summary.criticalIssues.map(issue => `<li class="issue">${issue}</li>`).join('')}
        </ul>
        
        <h4>Recommendations:</h4>
        <ul>
            ${session.summary.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
    
    <p><em>Generated by TachUI Advanced Debugging Tools</em></p>
</body>
</html>
    `
  }

  /**
   * Get inspector statistics
   */
  getStatistics() {
    return {
      activeInspectors: Array.from(this.inspectors.values()).filter(i => i.isActive).length,
      totalSnapshots: Array.from(this.snapshots.values()).reduce((sum, snapshots) => sum + snapshots.length, 0),
      activeOverlays: this.overlays.size,
      sessionActive: !!this.activeSession,
      memoryUsage: this.getMemoryUsage()
    }
  }
}

/**
 * Configure advanced debugging
 */
export function configureAdvancedDebugging(config: Partial<AdvancedDebuggingConfig>): void {
  advancedDebugConfig = { ...advancedDebugConfig, ...config }
}

/**
 * Get current advanced debugging configuration
 */
export function getAdvancedDebuggingConfig(): AdvancedDebuggingConfig {
  return { ...advancedDebugConfig }
}

// Global advanced inspector instance
const advancedInspector = new AdvancedValidationInspector()

/**
 * Advanced Debugging utilities
 */
export const AdvancedDebuggingUtils = {
  /**
   * Create new inspector
   */
  createInspector: (target: 'component' | 'modifier' | 'global', targetId?: string, options?: any) =>
    advancedInspector.createInspector(target, targetId, options),

  /**
   * Take component snapshot
   */
  takeSnapshot: (componentId: string, componentData: any) =>
    advancedInspector.takeSnapshot(componentId, componentData),

  /**
   * Add visual overlay
   */
  addVisualOverlay: (type: VisualDebuggingOverlay['type'], bounds: any, options?: any) =>
    advancedInspector.addVisualOverlay(type, bounds, options),

  /**
   * Start debugging session
   */
  startSession: (name: string, description?: string) =>
    advancedInspector.startSession(name, description),

  /**
   * Stop debugging session
   */
  stopSession: () => advancedInspector.stopSession(),

  /**
   * Get component history
   */
  getComponentHistory: (componentId: string) =>
    advancedInspector.getComponentHistory(componentId),

  /**
   * Get validation trends
   */
  getValidationTrends: (componentId?: string) =>
    advancedInspector.getValidationTrends(componentId),

  /**
   * Export session data
   */
  exportSessionData: (session: AdvancedDebuggingSession, format?: 'json' | 'csv' | 'html') =>
    advancedInspector.exportSessionData(session, format),

  /**
   * Configure debugging
   */
  configure: configureAdvancedDebugging,

  /**
   * Get configuration
   */
  getConfig: getAdvancedDebuggingConfig,

  /**
   * Get statistics
   */
  getStatistics: () => advancedInspector.getStatistics(),

  /**
   * Test advanced debugging system
   */
  test: () => {
    console.group('🔍 Advanced Debugging System Test')
    
    try {
      // Test session management
      const sessionId = advancedInspector.startSession('Test Session', 'Testing advanced debugging features')
      console.info('✅ Session started:', sessionId)

      // Test inspector creation
      const inspectorId = advancedInspector.createInspector('component', 'test-component')
      console.info('✅ Inspector created:', inspectorId)

      // Test snapshot taking
      const snapshotId = advancedInspector.takeSnapshot('test-component', {
        type: 'Text',
        props: { content: 'Hello' },
        state: {},
        modifiers: ['fontSize', 'foregroundColor']
      })
      console.info('✅ Snapshot taken:', snapshotId)

      // Test visual overlay
      const overlayId = advancedInspector.addVisualOverlay('error-highlight', 
        { x: 0, y: 0, width: 100, height: 50 },
        { label: 'Test Error', duration: 1000 }
      )
      console.info('✅ Visual overlay added:', overlayId)

      // Test trends analysis
      const trends = advancedInspector.getValidationTrends('test-component')
      console.info('✅ Trends analysis:', trends.recommendations.length, 'recommendations')

      // Test session stop
      const session = advancedInspector.stopSession()
      console.info('✅ Session stopped:', session?.summary.totalErrors)

      console.info('✅ Advanced debugging system is working correctly')
      
    } catch (error) {
      console.error('❌ Advanced debugging test failed:', error)
    }
    
    console.groupEnd()
  }
}

// Export inspector instance
export { advancedInspector }