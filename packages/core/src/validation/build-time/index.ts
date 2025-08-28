/**
 * Build-Time Validation System
 * 
 * Complete build-time validation system with auto-detection,
 * TypeScript transformers, and zero-setup integration.
 */

// Core build-time validation
export * from './types'
export * from './detection'
export * from './transformer'
export * from './rules'
export * from './plugins'

// Main API exports
export {
  autoIntegrateValidation,
  initializeValidation,
  getValidationPlugin,
  PluginHelpers
} from './plugins'

export {
  createTachUITransformer,
  createValidationRule,
  runValidationRules
} from './transformer'

export {
  componentPatterns,
  modifierPatterns,
  builtInRules,
  globalRuleRegistry,
  ValidationRuleRegistry,
  RuleHelpers
} from './rules'

export {
  detectBuildEnvironment,
  getPrimaryBuildTool,
  shouldEnableValidation,
  getEnvironmentConfig,
  isDevelopmentEnvironment,
  isCIEnvironment
} from './detection'

/**
 * Build-time validation configuration
 */
export interface BuildTimeValidationConfig {
  enabled: boolean
  strictMode: boolean
  errorLevel: 'error' | 'warn' | 'info'
  excludeFiles: string[]
  includeFiles?: string[]
  customRules: any[]
  buildTool?: string
  autoDetect: boolean
}

/**
 * Default build-time validation configuration
 */
export const defaultBuildTimeConfig: BuildTimeValidationConfig = {
  enabled: process.env.NODE_ENV !== 'production',
  strictMode: false,
  errorLevel: 'error',
  excludeFiles: ['node_modules/**', '**/*.d.ts', '**/*.test.*', '**/*.spec.*'],
  includeFiles: ['src/**/*.{ts,tsx,js,jsx}'],
  customRules: [],
  autoDetect: true
}

/**
 * Configure build-time validation
 */
export function configureBuildTimeValidation(config: Partial<BuildTimeValidationConfig>): void {
  Object.assign(defaultBuildTimeConfig, config)
  
  if (process.env.NODE_ENV !== 'production') {
    console.info('🔍 TachUI build-time validation configured:', {
      enabled: defaultBuildTimeConfig.enabled,
      strictMode: defaultBuildTimeConfig.strictMode,
      errorLevel: defaultBuildTimeConfig.errorLevel,
      autoDetect: defaultBuildTimeConfig.autoDetect
    })
  }
}

/**
 * Development tools for build-time validation
 */
export const BuildTimeDevTools = {
  /**
   * Test build-time validation system
   */
  test(): void {
    if (process.env.NODE_ENV === 'production') {
      console.info('ℹ️ Build-time validation testing is disabled in production')
      return
    }
    
    console.group('🔍 TachUI Build-Time Validation Test')
    
    try {
      // Import functions locally (Node.js only)
      if (typeof window !== 'undefined') {
        throw new Error('Build-time validation cannot run in browser environment')
      }
      
      const { detectBuildEnvironment, getPrimaryBuildTool } = require('./detection')
      const { autoIntegrateValidation } = require('./plugins')
      const { globalRuleRegistry } = require('./rules')
      
      // Test build tool detection
      const buildTools = detectBuildEnvironment()
      const primaryTool = getPrimaryBuildTool(buildTools)
      
      console.info('📦 Detected build tools:', buildTools.map((t: any) => `${t.name} v${t.version}`).join(', '))
      console.info('🎯 Primary build tool:', primaryTool ? `${primaryTool.name} v${primaryTool.version}` : 'None')
      
      // Test validation integration
      const result = autoIntegrateValidation()
      console.info('✅ Integration result:', result)
      
      // Test rule registry
      const rules = globalRuleRegistry.getAllRules()
      console.info('📋 Available validation rules:', rules.length)
      
      console.info('✅ Build-time validation system is working correctly')
      
    } catch (error) {
      console.error('❌ Build-time validation test failed:', error)
    }
    
    console.groupEnd()
  },
  
  /**
   * List available build tool plugins
   */
  listPlugins(): void {
    console.group('🔧 Available Build Tool Plugins')
    
    if (typeof window !== 'undefined') {
      console.warn('⚠️ Build-time validation cannot run in browser environment')
      console.groupEnd()
      return
    }
    
    const { PluginHelpers, getValidationPlugin } = require('./plugins')
    
    console.info('Vite Plugin:', !!PluginHelpers.vite)
    console.info('Webpack Plugin:', !!PluginHelpers.webpack)
    console.info('Next.js Plugin:', !!PluginHelpers.nextjs)
    
    const currentPlugin = getValidationPlugin()
    console.info('Current Plugin:', currentPlugin ? 'Registered' : 'None')
    
    console.groupEnd()
  },
  
  /**
   * Show validation statistics
   */
  getStats() {
    if (typeof window !== 'undefined') {
      return { buildTime: { available: false, error: 'Cannot run in browser environment' } }
    }
    
    const { detectBuildEnvironment, getPrimaryBuildTool, isDevelopmentEnvironment, isCIEnvironment, shouldEnableValidation } = require('./detection')
    const { globalRuleRegistry } = require('./rules')
    
    const buildTools = detectBuildEnvironment()
    const primaryTool = getPrimaryBuildTool(buildTools)
    const rules = globalRuleRegistry.getAllRules()
    
    return {
      buildTime: {
        enabled: defaultBuildTimeConfig.enabled,
        strictMode: defaultBuildTimeConfig.strictMode,
        errorLevel: defaultBuildTimeConfig.errorLevel,
        buildTool: primaryTool?.name || 'unknown',
        buildToolVersion: primaryTool?.version || 'unknown',
        availableRules: rules.length,
        customRules: defaultBuildTimeConfig.customRules.length
      },
      environment: {
        isDevelopment: isDevelopmentEnvironment(),
        isCI: isCIEnvironment(),
        shouldEnable: shouldEnableValidation()
      }
    }
  }
}

// Auto-configuration based on environment
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
  // Server-side/build-time environment
  
  // Configure based on environment variables
  const envConfig: Partial<BuildTimeValidationConfig> = {}
  
  if (process.env.TACHUI_BUILD_VALIDATION === 'false') {
    envConfig.enabled = false
  }
  
  if (process.env.TACHUI_BUILD_VALIDATION_STRICT === 'true') {
    envConfig.strictMode = true
  }
  
  if (process.env.TACHUI_BUILD_VALIDATION_LEVEL) {
    const level = process.env.TACHUI_BUILD_VALIDATION_LEVEL.toLowerCase()
    if (['error', 'warn', 'info'].includes(level)) {
      envConfig.errorLevel = level as 'error' | 'warn' | 'info'
    }
  }
  
  if (Object.keys(envConfig).length > 0) {
    configureBuildTimeValidation(envConfig)
  }
}