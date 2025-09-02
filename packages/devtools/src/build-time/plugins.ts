/**
 * Build Tool Plugin Integration
 *
 * Auto-detects build tools and provides zero-setup integration
 * for TachUI validation across different build environments.
 */

import type {
  BuildIntegrationResult,
  BuildToolInfo,
  ValidationOptions,
} from './types'
import {
  detectBuildEnvironment,
  getPrimaryBuildTool,
  shouldEnableValidation,
  getEnvironmentConfig,
} from './detection'
import { createTachUITransformer } from './transformer'
import { globalRuleRegistry } from './rules'

/**
 * Auto-integrate validation with detected build tools
 */
export async function autoIntegrateValidation(
  _projectRoot: string = process.cwd(),
  config: Partial<ValidationOptions> = {}
): Promise<BuildIntegrationResult> {
  try {
    // Detect build environment
    const buildTools = detectBuildEnvironment(_projectRoot)
    const primaryTool = getPrimaryBuildTool(buildTools)

    if (!primaryTool) {
      return {
        success: false,
        buildTool: 'unknown',
        message: 'No supported build tool detected',
        pluginRegistered: false,
        configurationApplied: false,
        errors: [
          'No Vite, Webpack, Next.js, Create React App, or Parcel detected',
        ],
      }
    }

    // Check if validation should be enabled
    if (!shouldEnableValidation()) {
      return {
        success: true,
        buildTool: primaryTool.name,
        message: 'Validation disabled for production environment',
        pluginRegistered: false,
        configurationApplied: false,
      }
    }

    // Merge configuration
    const envConfig = getEnvironmentConfig()
    const finalConfig: ValidationOptions = {
      enabled: true,
      strictMode: false,
      errorLevel: 'error',
      excludeFiles: [],
      includeFiles: [],
      customRules: globalRuleRegistry.getAllRules(),
      ...envConfig,
      ...config,
    }

    // Integrate with specific build tool
    const result = await integrateBuildTool(
      primaryTool,
      finalConfig,
      _projectRoot
    )

    if (result.success && process.env.NODE_ENV !== 'production') {
      console.info(
        `🔍 TachUI validation integrated with ${primaryTool.name} v${primaryTool.version}`
      )
      console.info(
        `✅ Build-time validation: ${finalConfig.enabled ? 'enabled' : 'disabled'}`
      )
      console.info(`✅ Error level: ${finalConfig.errorLevel}`)
      console.info(
        `✅ Strict mode: ${finalConfig.strictMode ? 'enabled' : 'disabled'}`
      )
    }

    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      buildTool: 'unknown',
      message: `Integration failed: ${errorMessage}`,
      pluginRegistered: false,
      configurationApplied: false,
      errors: [errorMessage],
    }
  }
}

/**
 * Integrate with specific build tool
 */
async function integrateBuildTool(
  _buildTool: BuildToolInfo,
  config: ValidationOptions,
  _projectRoot: string
): Promise<BuildIntegrationResult> {
  switch (_buildTool.name) {
    case 'vite':
      return integrateVite(_buildTool, config, _projectRoot)

    case 'webpack':
      return integrateWebpack(_buildTool, config, _projectRoot)

    case 'nextjs':
      return integrateNextJS(_buildTool, config, _projectRoot)

    case 'create-react-app':
      return integrateCRA(_buildTool, config, _projectRoot)

    case 'parcel':
      return integrateParcel(_buildTool, config, _projectRoot)

    default:
      return {
        success: false,
        buildTool: _buildTool.name,
        message: `Build tool ${_buildTool.name} not supported`,
        pluginRegistered: false,
        configurationApplied: false,
        errors: [`Unsupported build tool: ${_buildTool.name}`],
      }
  }
}

/**
 * Vite plugin integration
 */
async function integrateVite(
  _buildTool: BuildToolInfo,
  config: ValidationOptions,
  _projectRoot: string
): Promise<BuildIntegrationResult> {
  // Note: _buildTool and _projectRoot available for future enhancements
  try {
    // Create Vite plugin
    const plugin = createVitePlugin(config)

    // Register plugin globally for auto-detection
    if (typeof globalThis !== 'undefined') {
      ;(globalThis as any).__TACHUI_VITE_PLUGIN__ = plugin
    }

    return {
      success: true,
      buildTool: 'vite',
      message: 'Vite plugin created and registered',
      pluginRegistered: true,
      configurationApplied: true,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      buildTool: 'vite',
      message: `Vite integration failed: ${errorMessage}`,
      pluginRegistered: false,
      configurationApplied: false,
      errors: [errorMessage],
    }
  }
}

/**
 * Webpack plugin integration
 */
async function integrateWebpack(
  _buildTool: BuildToolInfo,
  config: ValidationOptions,
  _projectRoot: string
): Promise<BuildIntegrationResult> {
  // Note: _buildTool and _projectRoot available for future enhancements
  try {
    // Create Webpack plugin
    const plugin = createWebpackPlugin(config)

    // Register plugin for auto-detection
    if (typeof globalThis !== 'undefined') {
      ;(globalThis as any).__TACHUI_WEBPACK_PLUGIN__ = plugin
    }

    return {
      success: true,
      buildTool: 'webpack',
      message: 'Webpack plugin created and registered',
      pluginRegistered: true,
      configurationApplied: true,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      buildTool: 'webpack',
      message: `Webpack integration failed: ${errorMessage}`,
      pluginRegistered: false,
      configurationApplied: false,
      errors: [errorMessage],
    }
  }
}

/**
 * Next.js plugin integration
 */
async function integrateNextJS(
  _buildTool: BuildToolInfo,
  config: ValidationOptions,
  _projectRoot: string
): Promise<BuildIntegrationResult> {
  // Note: _buildTool and _projectRoot available for future enhancements
  try {
    // Next.js uses Webpack under the hood
    const webpackPlugin = createWebpackPlugin(config)
    const nextPlugin = createNextJSPlugin(config, webpackPlugin)

    // Register plugin for auto-detection
    if (typeof globalThis !== 'undefined') {
      ;(globalThis as any).__TACHUI_NEXTJS_PLUGIN__ = nextPlugin
    }

    return {
      success: true,
      buildTool: 'nextjs',
      message: 'Next.js plugin created and registered',
      pluginRegistered: true,
      configurationApplied: true,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      buildTool: 'nextjs',
      message: `Next.js integration failed: ${errorMessage}`,
      pluginRegistered: false,
      configurationApplied: false,
      errors: [errorMessage],
    }
  }
}

/**
 * Create React App integration
 */
async function integrateCRA(
  _buildTool: BuildToolInfo,
  config: ValidationOptions,
  _projectRoot: string
): Promise<BuildIntegrationResult> {
  // CRA doesn't allow webpack config modification without ejecting
  // Provide TypeScript transformer instead
  // Note: _buildTool and _projectRoot available for future enhancements

  try {
    const transformer = createTachUITransformer({} as any, {
      strict: config.strictMode,
    })

    // Register transformer for auto-detection
    if (typeof globalThis !== 'undefined') {
      ;(globalThis as any).__TACHUI_TS_TRANSFORMER__ = transformer
    }

    return {
      success: true,
      buildTool: 'create-react-app',
      message: 'TypeScript transformer registered (limited CRA support)',
      pluginRegistered: true,
      configurationApplied: false, // Can't modify webpack config
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      buildTool: 'create-react-app',
      message: `CRA integration failed: ${errorMessage}`,
      pluginRegistered: false,
      configurationApplied: false,
      errors: [errorMessage],
    }
  }
}

/**
 * Parcel plugin integration
 */
async function integrateParcel(
  _buildTool: BuildToolInfo,
  _config: ValidationOptions,
  _projectRoot: string
): Promise<BuildIntegrationResult> {
  // Note: _buildTool, _config, and _projectRoot available for future implementation
  return {
    success: false,
    buildTool: 'parcel',
    message: 'Parcel integration not yet supported',
    pluginRegistered: false,
    configurationApplied: false,
    errors: ['Parcel support is limited - consider using Vite or Webpack'],
  }
}

/**
 * Create Vite plugin
 */
export function createVitePlugin(config: ValidationOptions) {
  return {
    name: 'tachui-validation',
    enforce: 'pre' as const,

    configResolved(_resolvedConfig: any) {
      // Plugin is active
    },

    transform(code: string, id: string) {
      if (!config.enabled) return null

      // Only transform TypeScript/JavaScript files
      if (!/\.(ts|tsx|js|jsx)$/.test(id)) return null

      // Skip excluded files
      if (config.excludeFiles.some(pattern => id.includes(pattern))) {
        return null
      }

      // Skip node_modules unless specifically included
      if (
        id.includes('node_modules') &&
        !config.includeFiles?.some(pattern => id.includes(pattern))
      ) {
        return null
      }

      // Apply validation transformer
      return applyValidationTransform(code, id, config)
    },
  }
}

/**
 * Create Webpack plugin
 */
export function createWebpackPlugin(config: ValidationOptions) {
  return class TachUIValidationPlugin {
    apply(compiler: any) {
      if (!config.enabled) return

      compiler.hooks.compilation.tap(
        'TachUIValidationPlugin',
        (compilation: any) => {
          compilation.hooks.buildModule.tap(
            'TachUIValidationPlugin',
            (module: any) => {
              if (!module.resource) return

              // Only process TypeScript/JavaScript files
              if (!/\.(ts|tsx|js|jsx)$/.test(module.resource)) return

              // Apply validation
              this.validateModule(module, config)
            }
          )
        }
      )
    }

    validateModule(_module: any, _config: ValidationOptions) {
      // Validation logic would be applied here
      // This is a simplified implementation
    }
  }
}

/**
 * Create Next.js plugin
 */
export function createNextJSPlugin(
  _config: ValidationOptions,
  webpackPlugin: any
) {
  // Note: _config available for future enhancements
  return (nextConfig: any = {}) => {
    return {
      ...nextConfig,
      webpack(webpackConfig: any, options: any) {
        // Add TachUI validation plugin
        webpackConfig.plugins = webpackConfig.plugins || []
        webpackConfig.plugins.push(new webpackPlugin())

        // Call original webpack config if it exists
        if (typeof nextConfig.webpack === 'function') {
          return nextConfig.webpack(webpackConfig, options)
        }

        return webpackConfig
      },
    }
  }
}

/**
 * Apply validation transform to code
 */
function applyValidationTransform(
  code: string,
  _fileName: string,
  config: ValidationOptions
): { code: string; map?: any } | null {
  // This is a simplified implementation
  // In practice, we'd use the TypeScript transformer here

  if (process.env.NODE_ENV !== 'production' && config.enabled) {
    // Add runtime validation checks
    const validationImport = `import { ValidationDevTools } from '@tachui/core';\n`

    // Only add if not already imported
    if (
      !code.includes('ValidationDevTools') &&
      !code.includes('@tachui/core')
    ) {
      return {
        code: validationImport + code,
      }
    }
  }

  return null
}

/**
 * Get validation plugin for current environment
 */
export function getValidationPlugin(): any {
  // Try to get auto-registered plugin
  if (typeof globalThis !== 'undefined') {
    const global = globalThis as any
    return (
      global.__TACHUI_VITE_PLUGIN__ ||
      global.__TACHUI_WEBPACK_PLUGIN__ ||
      global.__TACHUI_NEXTJS_PLUGIN__ ||
      global.__TACHUI_TS_TRANSFORMER__
    )
  }

  return null
}

/**
 * Manual plugin registration helpers
 */
export const PluginHelpers = {
  /**
   * Get Vite plugin for manual registration
   */
  vite(options: Partial<ValidationOptions> = {}) {
    const config: ValidationOptions = {
      enabled: shouldEnableValidation(),
      strictMode: false,
      errorLevel: 'error',
      excludeFiles: [],
      includeFiles: [],
      customRules: [],
      ...getEnvironmentConfig(),
      ...options,
    }

    return createVitePlugin(config)
  },

  /**
   * Get Webpack plugin for manual registration
   */
  webpack(options: Partial<ValidationOptions> = {}) {
    const config: ValidationOptions = {
      enabled: shouldEnableValidation(),
      strictMode: false,
      errorLevel: 'error',
      excludeFiles: [],
      includeFiles: [],
      customRules: [],
      ...getEnvironmentConfig(),
      ...options,
    }

    return createWebpackPlugin(config)
  },

  /**
   * Get Next.js plugin for manual registration
   */
  nextjs(options: Partial<ValidationOptions> = {}) {
    const config: ValidationOptions = {
      enabled: shouldEnableValidation(),
      strictMode: false,
      errorLevel: 'error',
      excludeFiles: [],
      includeFiles: [],
      customRules: [],
      ...getEnvironmentConfig(),
      ...options,
    }

    const webpackPlugin = createWebpackPlugin(config)
    return createNextJSPlugin(config, webpackPlugin)
  },
}

/**
 * Initialize validation system
 */
export async function initializeValidation(
  options: Partial<ValidationOptions> = {}
): Promise<BuildIntegrationResult> {
  return autoIntegrateValidation(process.cwd(), options)
}

// Auto-initialize on import in development
if (process.env.NODE_ENV !== 'production') {
  // Delay initialization to allow build tools to register first
  setTimeout(() => {
    initializeValidation().catch(_error => {
      // console.warn('🔍 TachUI validation auto-initialization failed:', error.message)
    })
  }, 100)
}
