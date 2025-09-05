/**
 * Build Tool Detection System
 *
 * Automatically detects the build environment and provides appropriate
 * integration strategies for different build tools.
 */

// Conditional imports for Node.js environment
let fs: any
let path: any

try {
  if (typeof process !== 'undefined' && process.versions?.node) {
    fs = require('fs')
    path = require('path')
  }
} catch (_error) {
  // Browser environment - fs and path not available
}
import type { BuildToolInfo } from './types'

/**
 * Detect the current build environment
 */
export function detectBuildEnvironment(
  projectRoot: string = typeof process !== 'undefined' ? process.cwd() : '.'
): BuildToolInfo[] {
  // Return empty array if not in Node.js environment
  if (!fs || !path) {
    return []
  }

  const detectedTools: BuildToolInfo[] = []

  // Check for Vite
  const viteInfo = detectVite(projectRoot)
  if (viteInfo.detected) {
    detectedTools.push(viteInfo)
  }

  // Check for Webpack
  const webpackInfo = detectWebpack(projectRoot)
  if (webpackInfo.detected) {
    detectedTools.push(webpackInfo)
  }

  // Check for Next.js
  const nextjsInfo = detectNextJS(projectRoot)
  if (nextjsInfo.detected) {
    detectedTools.push(nextjsInfo)
  }

  // Check for Create React App
  const craInfo = detectCRA(projectRoot)
  if (craInfo.detected) {
    detectedTools.push(craInfo)
  }

  // Check for Parcel
  const parcelInfo = detectParcel(projectRoot)
  if (parcelInfo.detected) {
    detectedTools.push(parcelInfo)
  }

  return detectedTools
}

/**
 * Detect Vite build tool
 */
function detectVite(projectRoot: string): BuildToolInfo {
  const viteConfigFiles = [
    'vite.config.js',
    'vite.config.ts',
    'vite.config.mjs',
    'vite.config.mts',
  ]

  for (const configFile of viteConfigFiles) {
    const configPath = path.join(projectRoot, configFile)
    if (fs.existsSync(configPath)) {
      const version = getPackageVersion(projectRoot, 'vite')
      return {
        name: 'vite',
        version,
        configFile: configPath,
        detected: true,
        supported: true,
      }
    }
  }

  // Check if vite is in dependencies without config file
  const version = getPackageVersion(projectRoot, 'vite')
  if (version) {
    return {
      name: 'vite',
      version,
      detected: true,
      supported: true,
    }
  }

  return {
    name: 'vite',
    detected: false,
    supported: true,
  }
}

/**
 * Detect Webpack build tool
 */
function detectWebpack(projectRoot: string): BuildToolInfo {
  const webpackConfigFiles = [
    'webpack.config.js',
    'webpack.config.ts',
    'webpack.config.mjs',
    'webpack.config.babel.js',
  ]

  for (const configFile of webpackConfigFiles) {
    const configPath = path.join(projectRoot, configFile)
    if (fs.existsSync(configPath)) {
      const version = getPackageVersion(projectRoot, 'webpack')
      return {
        name: 'webpack',
        version,
        configFile: configPath,
        detected: true,
        supported: true,
      }
    }
  }

  // Check if webpack is in dependencies
  const version = getPackageVersion(projectRoot, 'webpack')
  if (version) {
    return {
      name: 'webpack',
      version,
      detected: true,
      supported: true,
    }
  }

  return {
    name: 'webpack',
    detected: false,
    supported: true,
  }
}

/**
 * Detect Next.js framework
 */
function detectNextJS(projectRoot: string): BuildToolInfo {
  const nextConfigFiles = [
    'next.config.js',
    'next.config.ts',
    'next.config.mjs',
  ]

  for (const configFile of nextConfigFiles) {
    const configPath = path.join(projectRoot, configFile)
    if (fs.existsSync(configPath)) {
      const version = getPackageVersion(projectRoot, 'next')
      return {
        name: 'nextjs',
        version,
        configFile: configPath,
        detected: true,
        supported: true,
      }
    }
  }

  // Check if next is in dependencies
  const version = getPackageVersion(projectRoot, 'next')
  if (version) {
    return {
      name: 'nextjs',
      version,
      detected: true,
      supported: true,
    }
  }

  return {
    name: 'nextjs',
    detected: false,
    supported: true,
  }
}

/**
 * Detect Create React App
 */
function detectCRA(projectRoot: string): BuildToolInfo {
  // Check for react-scripts in dependencies
  const version = getPackageVersion(projectRoot, 'react-scripts')
  if (version) {
    return {
      name: 'create-react-app',
      version,
      detected: true,
      supported: true,
    }
  }

  return {
    name: 'create-react-app',
    detected: false,
    supported: true,
  }
}

/**
 * Detect Parcel build tool
 */
function detectParcel(projectRoot: string): BuildToolInfo {
  const parcelConfigFiles = ['.parcelrc', '.parcelrc.json', 'parcel.config.js']

  for (const configFile of parcelConfigFiles) {
    const configPath = path.join(projectRoot, configFile)
    if (fs.existsSync(configPath)) {
      const version = getPackageVersion(projectRoot, 'parcel')
      return {
        name: 'parcel',
        version,
        configFile: configPath,
        detected: true,
        supported: true,
      }
    }
  }

  // Check if parcel is in dependencies
  const version = getPackageVersion(projectRoot, 'parcel')
  if (version) {
    return {
      name: 'parcel',
      version,
      detected: true,
      supported: true,
    }
  }

  return {
    name: 'parcel',
    detected: false,
    supported: false, // Limited support for Parcel
  }
}

/**
 * Get package version from package.json
 */
function getPackageVersion(
  projectRoot: string,
  packageName: string
): string | undefined {
  try {
    const packageJsonPath = path.join(projectRoot, 'package.json')
    if (!fs.existsSync(packageJsonPath)) {
      return undefined
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

    // Check dependencies and devDependencies
    const dependencies = packageJson.dependencies || {}
    const devDependencies = packageJson.devDependencies || {}

    return dependencies[packageName] || devDependencies[packageName]
  } catch (_error) {
    return undefined
  }
}

/**
 * Check if we're in a development environment
 */
export function isDevelopmentEnvironment(): boolean {
  return process.env.NODE_ENV !== 'production'
}

/**
 * Check if we're running in CI/CD environment
 */
export function isCIEnvironment(): boolean {
  return !!(
    process.env.CI ||
    process.env.CONTINUOUS_INTEGRATION ||
    process.env.BUILD_NUMBER ||
    process.env.GITHUB_ACTIONS ||
    process.env.GITLAB_CI ||
    process.env.JENKINS_URL
  )
}

/**
 * Get the primary build tool (highest priority detected tool)
 */
export function getPrimaryBuildTool(
  buildTools: BuildToolInfo[]
): BuildToolInfo | null {
  if (buildTools.length === 0) {
    return null
  }

  // Priority order: Next.js > Vite > Webpack > CRA > Parcel
  const priorityOrder = [
    'nextjs',
    'vite',
    'webpack',
    'create-react-app',
    'parcel',
  ]

  for (const toolName of priorityOrder) {
    const tool = buildTools.find(t => t.name === toolName)
    if (tool && tool.detected && tool.supported) {
      return tool
    }
  }

  // Return the first detected supported tool
  return buildTools.find(t => t.detected && t.supported) || null
}

/**
 * Check if TachUI validation should be enabled
 */
export function shouldEnableValidation(): boolean {
  // Disable in production
  if (!isDevelopmentEnvironment()) {
    return false
  }

  // Disable in CI unless explicitly enabled
  if (isCIEnvironment() && !process.env.TACHUI_VALIDATION_CI) {
    return false
  }

  // Check for explicit disable flag
  if (process.env.TACHUI_VALIDATION === 'false') {
    return false
  }

  return true
}

/**
 * Get validation configuration from environment
 */
export function getEnvironmentConfig(): Partial<
  import('./types').ValidationOptions
> {
  const config: Partial<import('./types').ValidationOptions> = {}

  // Check enabled state
  config.enabled = shouldEnableValidation()

  // Check error level
  if (process.env.TACHUI_VALIDATION_LEVEL) {
    const level = process.env.TACHUI_VALIDATION_LEVEL.toLowerCase()
    if (['error', 'warn', 'info'].includes(level)) {
      config.errorLevel = level as 'error' | 'warn' | 'info'
    }
  }

  // Check strict mode
  if (process.env.TACHUI_VALIDATION_STRICT === 'true') {
    config.strictMode = true
  }

  // Check excluded files
  if (process.env.TACHUI_VALIDATION_EXCLUDE) {
    config.excludeFiles = process.env.TACHUI_VALIDATION_EXCLUDE.split(',').map(
      f => f.trim()
    )
  }

  return config
}
