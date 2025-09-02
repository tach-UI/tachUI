/**
 * Development Tools System
 *
 * Comprehensive debugging and development tools for TachUI.
 * Provides component tree inspection, performance analysis,
 * and runtime debugging capabilities.
 */

import { createSignal } from '@tachui/core'
import type { ComponentInstance } from '@tachui/core'

/**
 * Component tree node for debugging
 */
export interface ComponentTreeNode {
  id: string
  name: string
  type: 'component' | 'element' | 'text' | 'fragment'
  props: Record<string, any>
  children: ComponentTreeNode[]
  parent: ComponentTreeNode | null
  depth: number
  renderCount: number
  lastRenderTime: number
  memoryUsage: number
  warnings: string[]
  errors: string[]
}

/**
 * Development environment state
 */
export interface DevState {
  enabled: boolean
  performanceTracking: boolean
  componentInspection: boolean
  reactiveDebugging: boolean
  memoryTracking: boolean
  warningsEnabled: boolean
  logLevel: 'error' | 'warn' | 'info' | 'debug'
}

/**
 * Development tools configuration
 */
export interface DevToolsConfig {
  autoEnable: boolean
  trackAllComponents: boolean
  trackMemoryUsage: boolean
  enableWarnings: boolean
  enableErrors: boolean
  maxTreeDepth: number
  updateInterval: number
}

/**
 * Runtime debugging event
 */
export interface DebugEvent {
  type:
    | 'component_mount'
    | 'component_unmount'
    | 'component_update'
    | 'reactive_create'
    | 'reactive_update'
    | 'context_change'
    | 'performance_warning'
    | 'error'
  timestamp: number
  componentId?: string
  componentName?: string
  data: any
  stack?: string
}

/**
 * Development tools manager
 */
export class DevTools {
  private static instance: DevTools

  private config: DevToolsConfig = {
    autoEnable: false,
    trackAllComponents: true,
    trackMemoryUsage: true,
    enableWarnings: true,
    enableErrors: true,
    maxTreeDepth: 50,
    updateInterval: 100,
  }

  private state: DevState = {
    enabled: false,
    performanceTracking: false,
    componentInspection: false,
    reactiveDebugging: false,
    memoryTracking: false,
    warningsEnabled: true,
    logLevel: 'warn',
  }

  private componentTree = new Map<string, ComponentTreeNode>()
  private componentRegistry = new Map<string, ComponentInstance>()
  private debugEvents: DebugEvent[] = []
  private activeComponents = new Set<string>()

  // Reactive signals for real-time updates
  private treeSignal: () => Map<string, ComponentTreeNode>
  private setTree: (value: Map<string, ComponentTreeNode>) => void
  private eventsSignal: () => DebugEvent[]
  private setEvents: (value: DebugEvent[]) => void
  private stateSignal: () => DevState
  private setState: (value: DevState) => void

  // Update timer
  private updateTimer: number | null = null

  constructor() {
    // Initialize reactive signals
    const [treeSignal, setTree] = createSignal<Map<string, ComponentTreeNode>>(
      new Map()
    )
    const [eventsSignal, setEvents] = createSignal<DebugEvent[]>([])
    const [stateSignal, setState] = createSignal<DevState>({ ...this.state })

    this.treeSignal = treeSignal
    this.setTree = setTree
    this.eventsSignal = eventsSignal
    this.setEvents = setEvents
    this.stateSignal = stateSignal
    this.setState = setState
  }

  static getInstance(): DevTools {
    if (!DevTools.instance) {
      DevTools.instance = new DevTools()
    }
    return DevTools.instance
  }

  /**
   * Configure development tools
   */
  configure(config: Partial<DevToolsConfig>): void {
    this.config = { ...this.config, ...config }

    if (config.autoEnable) {
      this.enable()
    }
  }

  /**
   * Enable development tools
   */
  enable(): void {
    this.state.enabled = true
    this.state.performanceTracking = true
    this.state.componentInspection = true
    this.state.reactiveDebugging = true
    this.state.memoryTracking = this.config.trackMemoryUsage
    this.setState({ ...this.state })

    // Start update timer
    this.startUpdateTimer()

    this.addDebugEvent({
      type: 'component_mount',
      timestamp: performance.now(),
      data: { message: 'DevTools enabled' },
    })

    console.log('🛠️ TachUI DevTools enabled')
  }

  /**
   * Disable development tools
   */
  disable(): void {
    this.state.enabled = false
    this.setState({ ...this.state })

    this.stopUpdateTimer()

    console.log('🛠️ TachUI DevTools disabled')
  }

  /**
   * Check if dev tools are enabled
   */
  isEnabled(): boolean {
    return this.state.enabled
  }

  /**
   * Register a component instance
   */
  registerComponent(
    componentId: string,
    instance: ComponentInstance,
    parentId?: string
  ): void {
    if (!this.state.enabled || !this.state.componentInspection) return

    this.componentRegistry.set(componentId, instance)
    this.activeComponents.add(componentId)

    // Find parent node
    const parent = parentId ? this.componentTree.get(parentId) || null : null
    const depth = parent ? parent.depth + 1 : 0

    // Create tree node
    const treeNode: ComponentTreeNode = {
      id: componentId,
      name: this.getComponentName(instance),
      type: instance.type || 'component',
      props: instance.props || {},
      children: [],
      parent,
      depth,
      renderCount: 0,
      lastRenderTime: 0,
      memoryUsage: 0,
      warnings: [],
      errors: [],
    }

    // Add to parent's children
    if (parent) {
      parent.children.push(treeNode)
    }

    this.componentTree.set(componentId, treeNode)
    this.setTree(new Map(this.componentTree))

    this.addDebugEvent({
      type: 'component_mount',
      timestamp: performance.now(),
      componentId,
      componentName: treeNode.name,
      data: { props: instance.props, parentId, depth },
    })
  }

  /**
   * Unregister a component instance
   */
  unregisterComponent(componentId: string): void {
    if (!this.state.enabled) return

    const treeNode = this.componentTree.get(componentId)
    if (treeNode) {
      // Remove from parent's children
      if (treeNode.parent) {
        const childIndex = treeNode.parent.children.indexOf(treeNode)
        if (childIndex !== -1) {
          treeNode.parent.children.splice(childIndex, 1)
        }
      }

      // Remove all descendants
      this.removeNodeAndDescendants(treeNode)

      this.addDebugEvent({
        type: 'component_unmount',
        timestamp: performance.now(),
        componentId,
        componentName: treeNode.name,
        data: {
          lifetime:
            performance.now() - treeNode.renderCount * treeNode.lastRenderTime,
        },
      })
    }

    this.componentRegistry.delete(componentId)
    this.componentTree.delete(componentId)
    this.activeComponents.delete(componentId)
    this.setTree(new Map(this.componentTree))
  }

  /**
   * Update component data
   */
  updateComponent(
    componentId: string,
    updates: Partial<ComponentTreeNode>
  ): void {
    if (!this.state.enabled) return

    const treeNode = this.componentTree.get(componentId)
    if (treeNode) {
      Object.assign(treeNode, updates)
      this.setTree(new Map(this.componentTree))

      this.addDebugEvent({
        type: 'component_update',
        timestamp: performance.now(),
        componentId,
        componentName: treeNode.name,
        data: updates,
      })
    }
  }

  /**
   * Track reactive operation
   */
  trackReactiveOperation(
    type: string,
    operation: string,
    componentId?: string
  ): void {
    if (!this.state.enabled || !this.state.reactiveDebugging) return

    this.addDebugEvent({
      type: 'reactive_update',
      timestamp: performance.now(),
      componentId,
      data: { type, operation },
    })
  }

  /**
   * Track context changes
   */
  trackContextChange(
    contextName: string,
    newValue: any,
    componentId?: string
  ): void {
    if (!this.state.enabled) return

    this.addDebugEvent({
      type: 'context_change',
      timestamp: performance.now(),
      componentId,
      data: { contextName, newValue },
    })
  }

  /**
   * Add warning to component
   */
  addWarning(componentId: string, message: string): void {
    if (!this.state.enabled || !this.state.warningsEnabled) return

    const treeNode = this.componentTree.get(componentId)
    if (treeNode) {
      treeNode.warnings.push(message)
      this.setTree(new Map(this.componentTree))

      this.addDebugEvent({
        type: 'performance_warning',
        timestamp: performance.now(),
        componentId,
        componentName: treeNode.name,
        data: { message },
      })

      if (this.state.logLevel === 'warn' || this.state.logLevel === 'debug') {
        console.warn(`⚠️ [${treeNode.name}] ${message}`)
      }
    }
  }

  /**
   * Add error to component
   */
  addError(componentId: string, error: Error | string): void {
    if (!this.state.enabled) return

    const message = error instanceof Error ? error.message : error
    const stack = error instanceof Error ? error.stack : undefined

    const treeNode = this.componentTree.get(componentId)
    if (treeNode) {
      treeNode.errors.push(message)
      this.setTree(new Map(this.componentTree))

      this.addDebugEvent({
        type: 'error',
        timestamp: performance.now(),
        componentId,
        componentName: treeNode.name,
        data: { message, error: error instanceof Error ? error : undefined },
        stack,
      })

      console.error(`❌ [${treeNode.name}] ${message}`, error)
    }
  }

  /**
   * Get component tree
   */
  getComponentTree(): Map<string, ComponentTreeNode> {
    return new Map(this.componentTree)
  }

  /**
   * Get component tree signal
   */
  getComponentTreeSignal(): () => Map<string, ComponentTreeNode> {
    return this.treeSignal
  }

  /**
   * Get root components
   */
  getRootComponents(): ComponentTreeNode[] {
    return Array.from(this.componentTree.values()).filter(
      node => node.parent === null
    )
  }

  /**
   * Get component by ID
   */
  getComponent(componentId: string): ComponentTreeNode | undefined {
    return this.componentTree.get(componentId)
  }

  /**
   * Find components by name
   */
  findComponentsByName(name: string): ComponentTreeNode[] {
    return Array.from(this.componentTree.values()).filter(node =>
      node.name.toLowerCase().includes(name.toLowerCase())
    )
  }

  /**
   * Get debug events
   */
  getDebugEvents(): DebugEvent[] {
    return [...this.debugEvents]
  }

  /**
   * Get debug events signal
   */
  getDebugEventsSignal(): () => DebugEvent[] {
    return this.eventsSignal
  }

  /**
   * Get development state
   */
  getDevState(): DevState {
    return { ...this.state }
  }

  /**
   * Get development state signal
   */
  getDevStateSignal(): () => DevState {
    return this.stateSignal
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    componentCount: number
    averageRenderTime: number
    memoryUsage: number
    warningCount: number
    errorCount: number
    slowComponents: { id: string; name: string; renderTime: number }[]
  } {
    const components = Array.from(this.componentTree.values())
    const totalRenderTime = components.reduce(
      (sum, c) => sum + c.lastRenderTime,
      0
    )
    const averageRenderTime =
      components.length > 0 ? totalRenderTime / components.length : 0
    const totalMemory = components.reduce((sum, c) => sum + c.memoryUsage, 0)
    const warningCount = components.reduce(
      (sum, c) => sum + c.warnings.length,
      0
    )
    const errorCount = components.reduce((sum, c) => sum + c.errors.length, 0)

    // Find slow components (>5ms render time)
    const slowComponents = components
      .filter(c => c.lastRenderTime > 5)
      .map(c => ({ id: c.id, name: c.name, renderTime: c.lastRenderTime }))
      .sort((a, b) => b.renderTime - a.renderTime)
      .slice(0, 10)

    return {
      componentCount: components.length,
      averageRenderTime,
      memoryUsage: totalMemory,
      warningCount,
      errorCount,
      slowComponents,
    }
  }

  /**
   * Export debug data
   */
  exportDebugData(): string {
    return JSON.stringify(
      {
        componentTree: Array.from(this.componentTree.entries()),
        debugEvents: [...this.debugEvents],
        timestamp: Date.now(),
      },
      null,
      2
    )
  }

  /**
   * Clear debug data
   */
  clear(): void {
    this.componentTree.clear()
    this.componentRegistry.clear()
    this.debugEvents.length = 0
    this.activeComponents.clear()

    this.setTree(new Map())
    this.setEvents([])
  }

  // Private helper methods

  private getComponentName(instance: ComponentInstance): string {
    // Check for displayName first
    if ('displayName' in instance && typeof instance.displayName === 'string') {
      return instance.displayName
    }

    // Check component type first (this should be the primary source)
    if (instance.type && typeof instance.type === 'string') {
      return instance.type
    }

    // Check for HTML tag
    if ((instance as any).tag) {
      return (instance as any).tag || 'Element'
    }

    // Check for text content
    if ((instance as any).text) {
      return 'Text'
    }

    // Check for fragment
    if ((instance as any).fragment) {
      return 'Fragment'
    }

    // Fallback to id or generic name (only if nothing else works)
    return instance.id || 'Component'
  }

  private removeNodeAndDescendants(node: ComponentTreeNode): void {
    // Remove all children recursively
    for (const child of node.children) {
      this.removeNodeAndDescendants(child)
      this.componentTree.delete(child.id)
      this.componentRegistry.delete(child.id)
      this.activeComponents.delete(child.id)
    }
  }

  private addDebugEvent(event: DebugEvent): void {
    this.debugEvents.push(event)

    // Limit events array size
    if (this.debugEvents.length > 1000) {
      this.debugEvents.shift()
    }

    // Update reactive signal if available
    try {
      this.setEvents([...this.debugEvents])
    } catch (_error) {
      // In test environments, the signal might not work properly
    }
  }

  private startUpdateTimer(): void {
    if (this.updateTimer) return

    this.updateTimer = window.setInterval(() => {
      this.updateComponentMetrics()
    }, this.config.updateInterval)
  }

  private stopUpdateTimer(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer)
      this.updateTimer = null
    }
  }

  private updateComponentMetrics(): void {
    if (!this.state.enabled) return

    for (const [componentId, treeNode] of this.componentTree) {
      // Update render count and timing (simplified for now)
      treeNode.renderCount += 1
      treeNode.lastRenderTime = Math.random() * 10 // Placeholder

      // Check for performance warnings
      if (treeNode.lastRenderTime > 16) {
        this.addWarning(
          componentId,
          `Slow render: ${treeNode.lastRenderTime.toFixed(2)}ms`
        )
      }

      if (treeNode.memoryUsage > 1024 * 1024) {
        // 1MB
        this.addWarning(
          componentId,
          `High memory usage: ${(treeNode.memoryUsage / (1024 * 1024)).toFixed(2)}MB`
        )
      }
    }

    this.setTree(new Map(this.componentTree))
  }
}

/**
 * Global dev tools instance
 */
export const globalDevTools = DevTools.getInstance()

/**
 * Enable performance tracking
 */
export function enablePerformanceTracking(): void {
  globalDevTools.enable()
}

/**
 * Get component tree
 */
export function getComponentTree(): Map<string, ComponentTreeNode> {
  return globalDevTools.getComponentTree()
}

/**
 * Enable development mode with full debugging
 */
export function enableDevelopmentMode(config?: Partial<DevToolsConfig>): void {
  globalDevTools.configure({
    autoEnable: true,
    trackAllComponents: true,
    trackMemoryUsage: true,
    enableWarnings: true,
    enableErrors: true,
    ...config,
  })

  console.log('🚀 TachUI Development Mode enabled')
}

/**
 * Get development tools instance
 */
export function getDevTools(): DevTools {
  return globalDevTools
}

/**
 * Development utilities
 */
export const devUtils = {
  /**
   * Log component tree to console
   */
  logComponentTree(): void {
    const roots = globalDevTools.getRootComponents()

    function logNode(node: ComponentTreeNode, indent = 0): void {
      const prefix = '  '.repeat(indent)
      const warnings =
        node.warnings.length > 0 ? ` ⚠️(${node.warnings.length})` : ''
      const errors = node.errors.length > 0 ? ` ❌(${node.errors.length})` : ''
      const renderTime =
        node.lastRenderTime > 0 ? ` ${node.lastRenderTime.toFixed(2)}ms` : ''

      console.log(
        `${prefix}${node.name}#${node.id}${renderTime}${warnings}${errors}`
      )

      for (const child of node.children) {
        logNode(child, indent + 1)
      }
    }

    console.group('🌳 Component Tree')
    for (const root of roots) {
      logNode(root)
    }
    console.groupEnd()
  },

  /**
   * Log performance summary
   */
  logPerformanceSummary(): void {
    const summary = globalDevTools.getPerformanceSummary()

    console.group('📊 Performance Summary')
    console.log(`Components: ${summary.componentCount}`)
    console.log(
      `Average Render Time: ${summary.averageRenderTime.toFixed(2)}ms`
    )
    console.log(
      `Memory Usage: ${(summary.memoryUsage / (1024 * 1024)).toFixed(2)}MB`
    )
    console.log(`Warnings: ${summary.warningCount}`)
    console.log(`Errors: ${summary.errorCount}`)

    if (summary.slowComponents.length > 0) {
      console.group('🐌 Slow Components')
      for (const comp of summary.slowComponents) {
        console.log(`${comp.name}: ${comp.renderTime.toFixed(2)}ms`)
      }
      console.groupEnd()
    }

    console.groupEnd()
  },

  /**
   * Find component by name
   */
  findComponent(name: string): ComponentTreeNode[] {
    return globalDevTools.findComponentsByName(name)
  },

  /**
   * Inspect component
   */
  inspectComponent(componentId: string): ComponentTreeNode | undefined {
    const component = globalDevTools.getComponent(componentId)
    if (component) {
      console.group(`🔍 Component: ${component.name}`)
      console.log('Props:', component.props)
      console.log('Children:', component.children.length)
      console.log('Warnings:', component.warnings)
      console.log('Errors:', component.errors)
      console.groupEnd()
    }
    return component
  },
}
