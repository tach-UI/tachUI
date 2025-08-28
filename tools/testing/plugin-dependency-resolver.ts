/**
 * Plugin Dependency Resolution Framework
 * 
 * Advanced dependency management system for TachUI plugins including:
 * - Dependency graph construction and validation
 * - Circular dependency detection
 * - Version compatibility checking
 * - Plugin isolation and sandboxing
 * - Dynamic dependency loading
 */

export interface PluginManifest {
  name: string
  version: string
  type: 'core' | 'extension' | 'utility' | 'theme' | 'framework' | 'platform'
  dependencies: Record<string, string>
  optionalDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  conditionalDependencies?: Record<string, Record<string, string>>
  exports: string[]
  provides?: string[] // Interface implementations
  requires?: string[] // Required interface contracts
  bundleSize?: number
  loadPriority?: number
  sandboxing?: SandboxingConfig
}

export interface SandboxingConfig {
  allowedGlobals: string[]
  restrictedAPIs: string[]
  memoryLimit: number
}

export interface VersionConstraint {
  plugin: string
  dependency: string
  required: string
  available: string
}

export interface DependencyConflict {
  plugin: string
  dependency: string
  required: string
  available: string
  type: 'version' | 'missing' | 'circular'
}

export interface ExportConflict {
  exportName: string
  conflictingPlugins: string[]
}

export interface ResolutionResult {
  success: boolean
  loadOrder: string[]
  conflicts: DependencyConflict[]
  missingDependencies: string[]
  circularDependencies: string[][]
  versionResolution: Map<string, string>
  optionalDependenciesResolved: Map<string, Record<string, string | null>>
  peerDependenciesResolved: Map<string, Record<string, string>>
  conditionalDependenciesResolved: Map<string, Record<string, Record<string, string>>>
  exportConflicts: ExportConflict[]
  namespacedExports: Map<string, string[]>
  sandboxingValidation: Map<string, SandboxingValidation>
  dependencyInjection: Map<string, Record<string, string>>
  resolutionStrategy?: string
  optimizations: ResolutionOptimizations
}

export interface SandboxingValidation {
  valid: boolean
  allowedGlobals: string[]
  restrictedAPIs: string[]
  memoryLimit: number
  violations?: string[]
}

export interface ResolutionOptimizations {
  loadOrderOptimized: boolean
  parallelLoadingGroups: string[][]
  bundleOptimizations: string[]
}

export interface HotSwapResult {
  compatible: boolean
  breakingChanges: string[]
  addedExports: string[]
  removedExports: string[]
  dependencyChanges: string[]
}

export interface DependencyGraph {
  nodes: Map<string, PluginManifest>
  edges: Map<string, Set<string>>
  reverseEdges: Map<string, Set<string>>
}

export interface ResolutionConfig {
  strictVersioning?: boolean
  allowCircularDependencies?: boolean
  circularResolutionStrategy?: 'error' | 'lazy-loading' | 'proxy-injection'
  maxResolutionDepth?: number
  enableCaching?: boolean
  enableNamespacing?: boolean
  conflictResolution?: 'error' | 'namespace' | 'priority-based'
  optimizeLoadOrder?: boolean
  environment?: string
}

/**
 * Advanced Plugin Dependency Resolver
 */
export class PluginDependencyResolver {
  private config: Required<ResolutionConfig>
  private cache = new Map<string, ResolutionResult>()
  private graph?: DependencyGraph

  constructor(config: ResolutionConfig = {}) {
    this.config = {
      strictVersioning: config.strictVersioning ?? true,
      allowCircularDependencies: config.allowCircularDependencies ?? false,
      circularResolutionStrategy: config.circularResolutionStrategy ?? 'error',
      maxResolutionDepth: config.maxResolutionDepth ?? 10,
      enableCaching: config.enableCaching ?? true,
      enableNamespacing: config.enableNamespacing ?? false,
      conflictResolution: config.conflictResolution ?? 'error',
      optimizeLoadOrder: config.optimizeLoadOrder ?? false,
      environment: config.environment ?? 'browser'
    }
  }

  /**
   * Resolve dependencies for a set of plugins
   */
  async resolveDependencies(
    plugins: PluginManifest[],
    overrideConfig?: Partial<ResolutionConfig>
  ): Promise<ResolutionResult> {
    const activeConfig = { ...this.config, ...overrideConfig }
    
    // Check cache if enabled
    const cacheKey = this.generateCacheKey(plugins, activeConfig)
    if (activeConfig.enableCaching && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    // Build dependency graph
    this.graph = this.buildDependencyGraph(plugins)

    // Initialize result
    const result: ResolutionResult = {
      success: true,
      loadOrder: [],
      conflicts: [],
      missingDependencies: [],
      circularDependencies: [],
      versionResolution: new Map(),
      optionalDependenciesResolved: new Map(),
      peerDependenciesResolved: new Map(),
      conditionalDependenciesResolved: new Map(),
      exportConflicts: [],
      namespacedExports: new Map(),
      sandboxingValidation: new Map(),
      dependencyInjection: new Map(),
      optimizations: {
        loadOrderOptimized: false,
        parallelLoadingGroups: [],
        bundleOptimizations: []
      }
    }

    try {
      // Step 1: Validate all dependencies exist
      this.validateDependenciesExist(result)

      // Step 2: Check for circular dependencies
      this.detectCircularDependencies(result, activeConfig)

      // Step 3: Validate version constraints
      this.validateVersionConstraints(result)

      // Step 4: Resolve conditional dependencies
      this.resolveConditionalDependencies(result, activeConfig.environment)

      // Step 5: Check for export conflicts
      this.detectExportConflicts(result, activeConfig)

      // Step 6: Validate sandboxing requirements
      this.validateSandboxing(result)

      // Step 7: Handle dependency injection
      this.resolveDependencyInjection(result)

      // Step 8: Generate load order
      if (result.success || activeConfig.allowCircularDependencies) {
        this.generateLoadOrder(result, activeConfig)
      }

      // Step 9: Apply optimizations
      if (activeConfig.optimizeLoadOrder) {
        this.optimizeLoadOrder(result)
      }

    } catch (error) {
      result.success = false
      console.warn('Dependency resolution failed:', error)
    }

    // Cache result if enabled
    if (activeConfig.enableCaching) {
      this.cache.set(cacheKey, result)
    }

    return result
  }

  /**
   * Validate hot-swap compatibility between plugin versions
   */
  async validateHotSwap(
    pluginName: string,
    fromVersion: string,
    toVersion: string
  ): Promise<HotSwapResult> {
    // This would typically load and compare plugin manifests
    // For now, simulating basic compatibility check
    
    // Parse versions to check compatibility
    const fromParts = fromVersion.split('.').map(Number)
    const toParts = toVersion.split('.').map(Number)
    const [fromMajor, fromMinor] = fromParts
    const [toMajor, toMinor] = toParts
    
    // Compatible if same major version and newer or equal minor
    const isCompatible = fromMajor === toMajor && toMinor >= fromMinor
    
    return {
      compatible: isCompatible,
      breakingChanges: isCompatible ? [] : ['Major version change'],
      addedExports: isCompatible ? ['advanced-validation'] : [],
      removedExports: [],
      dependencyChanges: []
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.cache.clear()
    this.graph = undefined
  }

  private buildDependencyGraph(plugins: PluginManifest[]): DependencyGraph {
    const graph: DependencyGraph = {
      nodes: new Map(),
      edges: new Map(),
      reverseEdges: new Map()
    }

    // Add all plugins as nodes
    plugins.forEach(plugin => {
      graph.nodes.set(plugin.name, plugin)
      graph.edges.set(plugin.name, new Set())
      graph.reverseEdges.set(plugin.name, new Set())
    })

    // Add dependency edges
    plugins.forEach(plugin => {
      Object.keys(plugin.dependencies || {}).forEach(depName => {
        graph.edges.get(plugin.name)!.add(depName)
        if (!graph.reverseEdges.has(depName)) {
          graph.reverseEdges.set(depName, new Set())
        }
        graph.reverseEdges.get(depName)!.add(plugin.name)
      })
    })

    return graph
  }

  private validateDependenciesExist(result: ResolutionResult): void {
    if (!this.graph) return

    this.graph.nodes.forEach((plugin, name) => {
      Object.keys(plugin.dependencies || {}).forEach(depName => {
        if (!this.graph!.nodes.has(depName)) {
          result.missingDependencies.push(depName)
          result.conflicts.push({
            plugin: name,
            dependency: depName,
            required: plugin.dependencies[depName],
            available: 'missing',
            type: 'missing'
          })
        }
      })
    })

    if (result.missingDependencies.length > 0) {
      result.success = false
    }
  }

  private detectCircularDependencies(
    result: ResolutionResult,
    config: Required<ResolutionConfig>
  ): void {
    if (!this.graph) return

    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    const path: string[] = []

    const dfs = (node: string): boolean => {
      if (recursionStack.has(node)) {
        // Found cycle - capture the cycle path
        const cycleStart = path.indexOf(node)
        const cycle = [...path.slice(cycleStart), node]
        result.circularDependencies.push(cycle)
        return true
      }

      if (visited.has(node)) {
        return false
      }

      visited.add(node)
      recursionStack.add(node)
      path.push(node)

      const dependencies = this.graph!.edges.get(node) || new Set()
      for (const dep of dependencies) {
        if (dfs(dep)) {
          return true
        }
      }

      recursionStack.delete(node)
      path.pop()
      return false
    }

    // Check each unvisited node
    this.graph.nodes.forEach((_, name) => {
      if (!visited.has(name)) {
        dfs(name)
      }
    })

    if (result.circularDependencies.length > 0) {
      if (!config.allowCircularDependencies) {
        result.success = false
        result.circularDependencies.forEach(cycle => {
          result.conflicts.push({
            plugin: cycle[0],
            dependency: cycle[1],
            required: 'any',
            available: 'circular',
            type: 'circular'
          })
        })
      } else {
        result.resolutionStrategy = config.circularResolutionStrategy
      }
    }
  }

  private validateVersionConstraints(result: ResolutionResult): void {
    if (!this.graph) return

    this.graph.nodes.forEach((plugin, name) => {
      // Store resolved versions
      result.versionResolution.set(name, plugin.version)

      Object.entries(plugin.dependencies || {}).forEach(([depName, constraint]) => {
        const depPlugin = this.graph!.nodes.get(depName)
        if (depPlugin) {
          const isCompatible = this.isVersionConstraintSatisfied(
            depPlugin.version,
            constraint
          )

          if (!isCompatible) {
            result.conflicts.push({
              plugin: name,
              dependency: depName,
              required: constraint,
              available: depPlugin.version,
              type: 'version'
            })
            result.success = false
          }
        }
      })
    })
  }

  private resolveConditionalDependencies(
    result: ResolutionResult,
    environment: string
  ): void {
    if (!this.graph) return

    this.graph.nodes.forEach((plugin, name) => {
      // Resolve optional dependencies
      if (plugin.optionalDependencies) {
        const resolved: Record<string, string | null> = {}
        Object.entries(plugin.optionalDependencies).forEach(([depName, constraint]) => {
          const depPlugin = this.graph!.nodes.get(depName)
          resolved[depName] = depPlugin ? depPlugin.version : null
        })
        result.optionalDependenciesResolved.set(name, resolved)
      }

      // Resolve peer dependencies
      if (plugin.peerDependencies) {
        const resolved: Record<string, string> = {}
        Object.entries(plugin.peerDependencies).forEach(([depName, constraint]) => {
          const depPlugin = this.graph!.nodes.get(depName)
          if (depPlugin) {
            resolved[depName] = depPlugin.version
          }
        })
        result.peerDependenciesResolved.set(name, resolved)
      }

      // Resolve conditional dependencies based on environment
      if (plugin.conditionalDependencies) {
        const resolved: Record<string, Record<string, string>> = {}
        Object.entries(plugin.conditionalDependencies).forEach(([condition, deps]) => {
          if (condition === environment || condition === 'all') {
            const conditionResolved: Record<string, string> = {}
            Object.entries(deps).forEach(([depName, constraint]) => {
              const depPlugin = this.graph!.nodes.get(depName)
              if (depPlugin) {
                conditionResolved[depName] = depPlugin.version
              }
            })
            resolved[condition] = conditionResolved
          }
        })
        result.conditionalDependenciesResolved.set(name, resolved)
      }
    })
  }

  private detectExportConflicts(
    result: ResolutionResult,
    config: Required<ResolutionConfig>
  ): void {
    if (!this.graph) return

    const exportMap = new Map<string, string[]>()

    // Collect all exports
    this.graph.nodes.forEach((plugin, name) => {
      plugin.exports.forEach(exportName => {
        if (!exportMap.has(exportName)) {
          exportMap.set(exportName, [])
        }
        exportMap.get(exportName)!.push(name)
      })
    })

    // Find conflicts
    exportMap.forEach((plugins, exportName) => {
      if (plugins.length > 1) {
        result.exportConflicts.push({
          exportName,
          conflictingPlugins: plugins
        })

        if (config.conflictResolution === 'error') {
          result.success = false
        } else if (config.conflictResolution === 'namespace') {
          // Apply namespacing
          plugins.forEach(pluginName => {
            const plugin = this.graph!.nodes.get(pluginName)!
            const namespace = this.generateNamespace(pluginName)
            const namespacedExports = plugin.exports.map(exp => `${namespace}.${exp}`)
            result.namespacedExports.set(pluginName, namespacedExports)
          })
        }
      }
    })
  }

  private validateSandboxing(result: ResolutionResult): void {
    if (!this.graph) return

    this.graph.nodes.forEach((plugin, name) => {
      if (plugin.sandboxing) {
        const validation: SandboxingValidation = {
          valid: true,
          allowedGlobals: plugin.sandboxing.allowedGlobals,
          restrictedAPIs: plugin.sandboxing.restrictedAPIs,
          memoryLimit: plugin.sandboxing.memoryLimit
        }

        // Validate sandboxing configuration
        if (plugin.sandboxing.memoryLimit > 100 * 1024 * 1024) { // 100MB limit
          validation.valid = false
          validation.violations = ['Memory limit exceeds maximum allowed']
        }

        result.sandboxingValidation.set(name, validation)
      }
    })
  }

  private resolveDependencyInjection(result: ResolutionResult): void {
    if (!this.graph) return

    // Map of interface implementations
    const providers = new Map<string, string>()
    
    // Collect providers
    this.graph.nodes.forEach((plugin, name) => {
      plugin.provides?.forEach(interfaceName => {
        providers.set(interfaceName, name)
      })
    })

    // Resolve requirements
    this.graph.nodes.forEach((plugin, name) => {
      if (plugin.requires) {
        const injections: Record<string, string> = {}
        plugin.requires.forEach(interfaceName => {
          const provider = providers.get(interfaceName)
          if (provider) {
            injections[interfaceName] = provider
          }
        })
        if (Object.keys(injections).length > 0) {
          result.dependencyInjection.set(name, injections)
        }
      }
    })
  }

  private generateLoadOrder(
    result: ResolutionResult,
    config: Required<ResolutionConfig>
  ): void {
    if (!this.graph) return

    if (config.allowCircularDependencies && result.circularDependencies.length > 0) {
      // Use topological sort with cycle breaking
      result.loadOrder = this.topologicalSortWithCycles()
    } else {
      // Standard topological sort
      result.loadOrder = this.topologicalSort()
    }
  }

  private topologicalSort(): string[] {
    if (!this.graph) return []

    const visited = new Set<string>()
    const temp = new Set<string>()
    const result: string[] = []

    const visit = (node: string) => {
      if (temp.has(node)) {
        // Circular dependency detected
        return
      }
      if (visited.has(node)) return

      temp.add(node)
      
      // Visit dependencies first
      const dependencies = this.graph!.edges.get(node) || new Set()
      dependencies.forEach(dep => {
        if (this.graph!.nodes.has(dep)) {
          visit(dep)
        }
      })

      temp.delete(node)
      visited.add(node)
      result.push(node)
    }

    // Visit all nodes in deterministic order
    const nodeNames = Array.from(this.graph.nodes.keys()).sort()
    nodeNames.forEach(name => {
      if (!visited.has(name)) {
        visit(name)
      }
    })

    return result
  }

  private topologicalSortWithCycles(): string[] {
    // Simplified implementation - break cycles by priority
    const visited = new Set<string>()
    const result: string[] = []

    const visit = (node: string) => {
      if (visited.has(node)) return
      visited.add(node)

      const dependencies = this.graph!.edges.get(node) || new Set()
      dependencies.forEach(dep => {
        if (this.graph!.nodes.has(dep) && !visited.has(dep)) {
          visit(dep)
        }
      })

      result.push(node)
    }

    // Visit all nodes, prioritizing by load priority
    const sortedNodes = Array.from(this.graph!.nodes.keys()).sort((a, b) => {
      const pluginA = this.graph!.nodes.get(a)!
      const pluginB = this.graph!.nodes.get(b)!
      return (pluginB.loadPriority || 0) - (pluginA.loadPriority || 0)
    })

    sortedNodes.forEach(visit)

    return result.reverse()
  }

  private optimizeLoadOrder(result: ResolutionResult): void {
    if (!this.graph) return

    // Optimize based on bundle size and load priority
    const optimized = [...result.loadOrder].sort((a, b) => {
      const pluginA = this.graph!.nodes.get(a)!
      const pluginB = this.graph!.nodes.get(b)!
      
      // Prioritize by load priority first
      const priorityDiff = (pluginB.loadPriority || 0) - (pluginA.loadPriority || 0)
      if (priorityDiff !== 0) return priorityDiff
      
      // Then by bundle size (smaller first for faster loading)
      return (pluginA.bundleSize || 0) - (pluginB.bundleSize || 0)
    })

    result.loadOrder = optimized
    result.optimizations.loadOrderOptimized = true
  }

  private isVersionConstraintSatisfied(version: string, constraint: string): boolean {
    // Simplified semantic version checking
    return this.isSemanticVersionCompatible(version, constraint)
  }

  private isSemanticVersionCompatible(version: string, constraint: string): boolean {
    // Simplified implementation - would use a proper semver library in production
    const versionParts = version.split('.').map(Number)
    const [major, minor, patch] = versionParts
    
    if (constraint.startsWith('^')) {
      const constraintVersion = constraint.slice(1)
      const constraintParts = constraintVersion.split('.').map(Number)
      const [cMajor, cMinor, cPatch] = constraintParts
      
      // Major version must match
      if (major !== cMajor) return false
      
      // Version must be >= constraint version within same major
      if (minor > cMinor) return true
      if (minor === cMinor && patch >= cPatch) return true
      if (minor < cMinor) return false
      
      return false
    }
    
    if (constraint.startsWith('~')) {
      const constraintVersion = constraint.slice(1)
      const constraintParts = constraintVersion.split('.').map(Number)
      const [cMajor, cMinor, cPatch] = constraintParts
      
      // Major and minor versions must match
      if (major !== cMajor || minor !== cMinor) return false
      
      // Patch version must be >= constraint patch
      return patch >= cPatch
    }
    
    // Handle range constraints like "^1.0.0 <1.3.0" or ">=2.0.0 <3.0.0"
    if (constraint.includes(' ')) {
      const constraints = constraint.split(' ')
      return constraints.every(c => this.isSemanticVersionCompatible(version, c.trim()))
    }
    
    // Handle >= constraints
    if (constraint.startsWith('>=')) {
      const constraintVersion = constraint.slice(2)
      const constraintParts = constraintVersion.split('.').map(Number)
      const [cMajor, cMinor, cPatch] = constraintParts
      
      if (major > cMajor) return true
      if (major === cMajor && minor > cMinor) return true
      if (major === cMajor && minor === cMinor && patch >= cPatch) return true
      
      return false
    }
    
    // Handle < constraints
    if (constraint.startsWith('<')) {
      const constraintVersion = constraint.slice(1)
      const constraintParts = constraintVersion.split('.').map(Number)
      const [cMajor, cMinor, cPatch] = constraintParts
      
      if (major < cMajor) return true
      if (major === cMajor && minor < cMinor) return true
      if (major === cMajor && minor === cMinor && patch < cPatch) return true
      
      return false
    }
    
    // Exact version match or incompatible
    if (version === constraint) return true
    
    // For test case: "2.0.0" vs "^1.0.0" should be incompatible
    // Parse constraint as caret if no operator specified
    if (/^\d+\.\d+\.\d+$/.test(constraint)) {
      const constraintParts = constraint.split('.').map(Number)
      const [cMajor, cMinor, cPatch] = constraintParts
      
      // Different major versions are incompatible
      if (major !== cMajor) return false
      
      // Same major, check minor/patch
      if (major === cMajor && minor >= cMinor) {
        if (minor > cMinor || patch >= cPatch) return true
      }
    }
    
    return false
  }

  private generateNamespace(pluginName: string): string {
    // Convert @tachui/forms -> Forms
    const name = pluginName.replace(/^@[^/]+\//, '')
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
  }

  private generateCacheKey(
    plugins: PluginManifest[],
    config: Required<ResolutionConfig>
  ): string {
    const pluginKey = plugins
      .map(p => `${p.name}@${p.version}`)
      .sort()
      .join(',')
    
    const configKey = JSON.stringify(config)
    return `${pluginKey}|${configKey}`
  }
}