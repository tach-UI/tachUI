/**
 * Plugin Combination Testing Infrastructure
 * 
 * Framework for testing TachUI plugins in combination to catch integration bugs,
 * conflicts, and compatibility issues that only emerge when multiple plugins
 * are used together.
 */

import { beforeEach, afterEach } from 'vitest'

export interface PluginTestConfig {
  enableSandboxing?: boolean
  timeout?: number
  enableConflictDetection?: boolean
  enablePerformanceMonitoring?: boolean
}

export interface PluginCombination {
  plugins: TachUIPlugin[]
  expectedConflicts?: string[]
  requiredCapabilities?: string[]
  description?: string
}

export interface TachUIPlugin {
  name: string
  version: string
  author?: string
  dependencies?: string[]
  requiredCapabilities?: string[]
  install: (manager: PluginManager) => Promise<void> | void
  uninstall?: (manager: PluginManager) => Promise<void> | void
}

export interface PluginManager {
  install(plugin: TachUIPlugin): Promise<void>
  uninstall(pluginName: string): Promise<void>
  getPlugin(name: string): TachUIPlugin | undefined
  getInstalledPlugins(): TachUIPlugin[]
  hasCapability(capability: string): boolean
  grantCapability(capability: string): void
  revokeCapability(capability: string): void
  registerComponent(name: string, component: any): void
  registerService(name: string, service: any): void
  getService<T>(name: string): T
  createComponent(name: string, props?: any): any
}

export interface PluginConflict {
  type: 'component-name' | 'service-name' | 'capability' | 'dependency' | 'version'
  plugin1: string
  plugin2: string
  conflictingItem: string
  severity: 'error' | 'warning' | 'info'
  description: string
}

export interface PluginCombinationResult {
  success: boolean
  conflicts: PluginConflict[]
  warnings: string[]
  performance: {
    installTime: number
    memoryUsage: number
    componentCount: number
    serviceCount: number
  }
  installedPlugins: string[]
}

export class PluginCombinationTester {
  private config: Required<PluginTestConfig>
  private pluginManager: PluginManager | null = null
  private installedPlugins: Set<string> = new Set()
  private registeredComponents: Map<string, string> = new Map() // component -> plugin
  private registeredServices: Map<string, string> = new Map() // service -> plugin
  private grantedCapabilities: Set<string> = new Set()

  constructor(config: PluginTestConfig = {}) {
    this.config = {
      enableSandboxing: config.enableSandboxing ?? true,
      timeout: config.timeout ?? 5000,
      enableConflictDetection: config.enableConflictDetection ?? true,
      enablePerformanceMonitoring: config.enablePerformanceMonitoring ?? true,
      ...config
    }
  }

  /**
   * Set up testing environment
   */
  setup(): void {
    this.pluginManager = this.createMockPluginManager()
    this.installedPlugins.clear()
    this.registeredComponents.clear()
    this.registeredServices.clear()
    this.grantedCapabilities.clear()
  }

  /**
   * Clean up testing environment
   */
  async cleanup(): Promise<void> {
    if (this.pluginManager) {
      // Uninstall all plugins
      const installedPluginNames = Array.from(this.installedPlugins)
      for (const pluginName of installedPluginNames) {
        try {
          await this.pluginManager.uninstall(pluginName)
        } catch (error) {
          console.warn(`Failed to uninstall plugin ${pluginName}:`, error)
        }
      }
    }
    
    this.pluginManager = null
    this.installedPlugins.clear()
    this.registeredComponents.clear()
    this.registeredServices.clear()
    this.grantedCapabilities.clear()
  }

  /**
   * Test a combination of plugins
   */
  async testPluginCombination(combination: PluginCombination): Promise<PluginCombinationResult> {
    if (!this.pluginManager) {
      throw new Error('Plugin manager not initialized. Call setup() first.')
    }

    const startTime = Date.now()
    const initialMemory = process.memoryUsage().heapUsed
    const conflicts: PluginConflict[] = []
    const warnings: string[] = []
    const installedPlugins: string[] = []

    try {
      // Install plugins in order
      for (const plugin of combination.plugins) {
        await this.installPlugin(plugin, conflicts, warnings)
        installedPlugins.push(plugin.name)
      }

      // Check for additional conflicts after all plugins are installed
      if (this.config.enableConflictDetection) {
        const postInstallConflicts = this.detectPostInstallationConflicts(combination.plugins)
        conflicts.push(...postInstallConflicts)
      }

      // Validate expected conflicts
      if (combination.expectedConflicts) {
        this.validateExpectedConflicts(conflicts, combination.expectedConflicts, warnings)
      }

      const installTime = Date.now() - startTime
      const finalMemory = process.memoryUsage().heapUsed
      const memoryUsage = finalMemory - initialMemory

      return {
        success: conflicts.filter(c => c.severity === 'error').length === 0,
        conflicts,
        warnings,
        performance: {
          installTime,
          memoryUsage,
          componentCount: this.registeredComponents.size,
          serviceCount: this.registeredServices.size
        },
        installedPlugins
      }
    } catch (error) {
      return {
        success: false,
        conflicts: [
          ...conflicts,
          {
            type: 'dependency',
            plugin1: 'unknown',
            plugin2: 'unknown',
            conflictingItem: 'installation',
            severity: 'error',
            description: `Installation failed: ${error.message}`
          }
        ],
        warnings,
        performance: {
          installTime: Date.now() - startTime,
          memoryUsage: 0,
          componentCount: this.registeredComponents.size,
          serviceCount: this.registeredServices.size
        },
        installedPlugins
      }
    }
  }

  /**
   * Test all possible combinations of plugins
   */
  async testAllCombinations(plugins: TachUIPlugin[]): Promise<Map<string, PluginCombinationResult>> {
    const results = new Map<string, PluginCombinationResult>()

    // Test individual plugins
    for (const plugin of plugins) {
      const combinationKey = plugin.name
      await this.setup()
      try {
        const result = await this.testPluginCombination({ plugins: [plugin] })
        results.set(combinationKey, result)
      } finally {
        await this.cleanup()
      }
    }

    // Test pairs
    for (let i = 0; i < plugins.length; i++) {
      for (let j = i + 1; j < plugins.length; j++) {
        const combinationKey = `${plugins[i].name}+${plugins[j].name}`
        await this.setup()
        try {
          const result = await this.testPluginCombination({
            plugins: [plugins[i], plugins[j]]
          })
          results.set(combinationKey, result)
        } finally {
          await this.cleanup()
        }
      }
    }

    // Test all together
    if (plugins.length > 2) {
      const combinationKey = plugins.map(p => p.name).join('+')
      await this.setup()
      try {
        const result = await this.testPluginCombination({ plugins })
        results.set(combinationKey, result)
      } finally {
        await this.cleanup()
      }
    }

    return results
  }

  /**
   * Generate test scenarios for common plugin patterns
   */
  generateCommonScenarios(availablePlugins: TachUIPlugin[]): PluginCombination[] {
    const scenarios: PluginCombination[] = []

    // Find common plugin types
    const formsPlugin = availablePlugins.find(p => p.name.toLowerCase().includes('forms'))
    const navigationPlugin = availablePlugins.find(p => p.name.toLowerCase().includes('navigation'))
    const validationPlugin = availablePlugins.find(p => p.name.toLowerCase().includes('validation'))
    const uiPlugin = availablePlugins.find(p => p.name.toLowerCase().includes('ui'))

    // Common combinations
    if (formsPlugin && navigationPlugin) {
      scenarios.push({
        plugins: [formsPlugin, navigationPlugin],
        description: 'Forms + Navigation - Common pattern for multi-step forms'
      })
    }

    if (formsPlugin && validationPlugin) {
      scenarios.push({
        plugins: [formsPlugin, validationPlugin],
        description: 'Forms + Validation - Form validation pattern'
      })
    }

    if (formsPlugin && navigationPlugin && validationPlugin) {
      scenarios.push({
        plugins: [formsPlugin, navigationPlugin, validationPlugin],
        description: 'Complete form application - Forms + Navigation + Validation'
      })
    }

    // Plugin isolation test - plugins that shouldn't interact
    const isolatedPlugins = availablePlugins.filter(p => 
      !p.name.toLowerCase().includes('forms') && 
      !p.name.toLowerCase().includes('navigation')
    )
    
    if (isolatedPlugins.length >= 2) {
      scenarios.push({
        plugins: isolatedPlugins.slice(0, 2),
        description: 'Plugin isolation test - unrelated plugins'
      })
    }

    return scenarios
  }

  private async installPlugin(
    plugin: TachUIPlugin, 
    conflicts: PluginConflict[], 
    warnings: string[]
  ): Promise<void> {
    if (!this.pluginManager) {
      throw new Error('Plugin manager not available')
    }

    // Check for conflicts before installation
    if (this.config.enableConflictDetection) {
      const preInstallConflicts = this.detectPreInstallationConflicts(plugin)
      conflicts.push(...preInstallConflicts)
    }

    // Check dependencies
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.installedPlugins.has(dep)) {
          conflicts.push({
            type: 'dependency',
            plugin1: plugin.name,
            plugin2: dep,
            conflictingItem: dep,
            severity: 'error',
            description: `Plugin ${plugin.name} requires ${dep} but it's not installed`
          })
        }
      }
    }

    // Check required capabilities
    if (plugin.requiredCapabilities) {
      for (const capability of plugin.requiredCapabilities) {
        if (!this.grantedCapabilities.has(capability)) {
          warnings.push(`Plugin ${plugin.name} requires capability ${capability}`)
          this.grantedCapabilities.add(capability)
        }
      }
    }

    // Install with timeout
    await this.withTimeout(
      this.pluginManager.install(plugin),
      this.config.timeout,
      `Plugin ${plugin.name} installation timeout`
    )
    
    // Add small delay to ensure measurable timing
    await new Promise(resolve => setTimeout(resolve, 1))

    this.installedPlugins.add(plugin.name)
  }

  private detectPreInstallationConflicts(plugin: TachUIPlugin): PluginConflict[] {
    const conflicts: PluginConflict[] = []

    // Check for name conflicts with already installed plugins
    if (this.installedPlugins.has(plugin.name)) {
      conflicts.push({
        type: 'component-name',
        plugin1: plugin.name,
        plugin2: 'existing',
        conflictingItem: plugin.name,
        severity: 'error',
        description: `Plugin ${plugin.name} is already installed`
      })
    }

    return conflicts
  }

  private detectPostInstallationConflicts(plugins: TachUIPlugin[]): PluginConflict[] {
    const conflicts: PluginConflict[] = []

    // Check for version conflicts
    const versionMap = new Map<string, string[]>()
    plugins.forEach(plugin => {
      const baseName = plugin.name.split('@')[0]
      if (!versionMap.has(baseName)) {
        versionMap.set(baseName, [])
      }
      versionMap.get(baseName)!.push(plugin.version)
    })

    versionMap.forEach((versions, pluginName) => {
      if (versions.length > 1 && new Set(versions).size > 1) {
        conflicts.push({
          type: 'version',
          plugin1: pluginName,
          plugin2: pluginName,
          conflictingItem: versions.join(', '),
          severity: 'warning',
          description: `Multiple versions of ${pluginName}: ${versions.join(', ')}`
        })
      }
    })

    return conflicts
  }

  private validateExpectedConflicts(
    actualConflicts: PluginConflict[], 
    expectedConflicts: string[], 
    warnings: string[]
  ): void {
    const actualConflictTypes = actualConflicts.map(c => c.type)
    
    for (const expected of expectedConflicts) {
      if (!actualConflictTypes.includes(expected as any)) {
        warnings.push(`Expected conflict '${expected}' was not detected`)
      }
    }
  }

  private createMockPluginManager(): PluginManager {
    const self = this
    
    return {
      async install(plugin: TachUIPlugin): Promise<void> {
        // Simulate plugin installation
        await plugin.install(this)
        self.installedPlugins.add(plugin.name)
      },

      async uninstall(pluginName: string): Promise<void> {
        const plugin = this.getPlugin(pluginName)
        if (plugin?.uninstall) {
          await plugin.uninstall(this)
        }
        self.installedPlugins.delete(pluginName)
        
        // Remove registered components and services
        self.registeredComponents.forEach((ownerPlugin, componentName) => {
          if (ownerPlugin === pluginName) {
            self.registeredComponents.delete(componentName)
          }
        })
        
        self.registeredServices.forEach((ownerPlugin, serviceName) => {
          if (ownerPlugin === pluginName) {
            self.registeredServices.delete(serviceName)
          }
        })
      },

      getPlugin(name: string): TachUIPlugin | undefined {
        // Mock implementation - would lookup from installed plugins
        return undefined
      },

      getInstalledPlugins(): TachUIPlugin[] {
        // Mock implementation
        return []
      },

      hasCapability(capability: string): boolean {
        return self.grantedCapabilities.has(capability)
      },

      grantCapability(capability: string): void {
        self.grantedCapabilities.add(capability)
      },

      revokeCapability(capability: string): void {
        self.grantedCapabilities.delete(capability)
      },

      registerComponent(name: string, component: any): void {
        if (self.registeredComponents.has(name)) {
          const existingOwner = self.registeredComponents.get(name)!
          throw new Error(`Component "${name}" already registered by plugin "${existingOwner}"`)
        }
        
        // Find which plugin is currently installing
        const currentPlugin = Array.from(self.installedPlugins).pop() || 'unknown'
        self.registeredComponents.set(name, currentPlugin)
      },

      registerService(name: string, service: any): void {
        if (self.registeredServices.has(name)) {
          const existingOwner = self.registeredServices.get(name)!
          throw new Error(`Service "${name}" already registered by plugin "${existingOwner}"`)
        }
        
        const currentPlugin = Array.from(self.installedPlugins).pop() || 'unknown'
        self.registeredServices.set(name, currentPlugin)
      },

      getService<T>(name: string): T {
        if (!self.registeredServices.has(name)) {
          throw new Error(`Service "${name}" not found`)
        }
        return {} as T // Mock service
      },

      createComponent(name: string, props?: any): any {
        if (!self.registeredComponents.has(name)) {
          throw new Error(`Component "${name}" not found`)
        }
        return {} // Mock component
      }
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeout: number, errorMessage: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(errorMessage))
      }, timeout)

      promise
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timer))
    })
  }
}

/**
 * Auto-setup for plugin combination testing
 */
export function setupPluginCombinationTesting(config?: PluginTestConfig): PluginCombinationTester {
  const tester = new PluginCombinationTester(config)

  beforeEach(() => {
    tester.setup()
  })

  afterEach(async () => {
    await tester.cleanup()
  })

  return tester
}

/**
 * Plugin testing utilities
 */
export const pluginTestUtils = {
  /**
   * Create a mock plugin for testing
   */
  createMockPlugin(
    name: string, 
    options: Partial<TachUIPlugin> = {}
  ): TachUIPlugin {
    return {
      name,
      version: options.version || '1.0.0',
      author: options.author || 'test-author',
      dependencies: options.dependencies || [],
      requiredCapabilities: options.requiredCapabilities || [],
      install: options.install || (() => {}),
      uninstall: options.uninstall,
      ...options
    }
  },

  /**
   * Create a forms plugin mock
   */
  createFormsPlugin(): TachUIPlugin {
    return this.createMockPlugin('forms', {
      install: (manager) => {
        manager.registerComponent('TextField', {})
        manager.registerComponent('Form', {})
        manager.registerComponent('ValidationMessage', {})
        manager.registerService('formValidator', {})
      }
    })
  },

  /**
   * Create a navigation plugin mock
   */
  createNavigationPlugin(): TachUIPlugin {
    return this.createMockPlugin('navigation', {
      install: (manager) => {
        manager.registerComponent('Router', {})
        manager.registerComponent('Route', {})
        manager.registerComponent('NavigationLink', {})
        manager.registerService('router', {})
      }
    })
  },

  /**
   * Create a conflicting plugin for testing
   */
  createConflictingPlugin(conflictType: 'component' | 'service'): TachUIPlugin {
    return this.createMockPlugin('conflicting-plugin', {
      install: (manager) => {
        if (conflictType === 'component') {
          manager.registerComponent('TextField', {}) // Conflicts with forms
        } else {
          manager.registerService('router', {}) // Conflicts with navigation
        }
      }
    })
  }
}