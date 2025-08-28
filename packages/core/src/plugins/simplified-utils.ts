/**
 * Simplified Plugin Utilities - Phase 1 Implementation
 * 
 * Essential utility functions only, removing complex debounce/throttle/deepClone
 * functionality that adds unnecessary complexity for simple plugin use cases.
 */

/**
 * Validates a semantic version string
 */
export function validateSemver(version: string): boolean {
  if (!version || typeof version !== 'string') {
    return false
  }

  const semverRegex =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/
  return semverRegex.test(version)
}

/**
 * Compares two semantic version strings
 * @param a First version
 * @param b Second version
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareSemver(a: string, b: string): number {
  if (!validateSemver(a) || !validateSemver(b)) {
    throw new Error('Invalid semantic version format')
  }

  const parseVersion = (version: string) => {
    const [main, prerelease] = version.split('-')
    const [major, minor, patch] = main.split('.').map(Number)
    return { major, minor, patch, prerelease }
  }

  const versionA = parseVersion(a)
  const versionB = parseVersion(b)

  // Compare major version
  if (versionA.major !== versionB.major) {
    return versionA.major < versionB.major ? -1 : 1
  }

  // Compare minor version
  if (versionA.minor !== versionB.minor) {
    return versionA.minor < versionB.minor ? -1 : 1
  }

  // Compare patch version
  if (versionA.patch !== versionB.patch) {
    return versionA.patch < versionB.patch ? -1 : 1
  }

  // Compare prerelease versions
  if (versionA.prerelease && versionB.prerelease) {
    return versionA.prerelease < versionB.prerelease
      ? -1
      : versionA.prerelease > versionB.prerelease
        ? 1
        : 0
  }

  // Version with prerelease is less than version without
  if (versionA.prerelease && !versionB.prerelease) return -1
  if (!versionA.prerelease && versionB.prerelease) return 1

  return 0
}

/**
 * Validates plugin name format
 */
export function validatePluginName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false
  }

  // Allow scoped packages (@scope/name) or simple names
  const nameRegex = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/
  return nameRegex.test(name)
}

/**
 * Normalizes a plugin name (removes @scope/ prefix for ID generation)
 */
export function normalizePluginName(name: string): string {
  return name.replace(/^@[^/]+\//, '')
}

/**
 * Simple plugin development utilities for debugging
 */
export const PluginDevUtils = {
  /**
   * Logs plugin debug information in development mode
   */
  log(pluginName: string, message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔌 [${pluginName}]`)
      console.log(message)
      if (data) {
        console.log('Data:', data)
      }
      console.groupEnd()
    }
  },

  /**
   * Creates a development-only warning
   */
  warn(pluginName: string, message: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️  [${pluginName}] ${message}`)
    }
  },
}