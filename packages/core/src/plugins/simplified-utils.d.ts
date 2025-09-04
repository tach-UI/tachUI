/**
 * Simplified Plugin Utilities - Phase 1 Implementation
 *
 * Essential utility functions only, removing complex debounce/throttle/deepClone
 * functionality that adds unnecessary complexity for simple plugin use cases.
 */
/**
 * Validates a semantic version string
 */
export declare function validateSemver(version: string): boolean
/**
 * Compares two semantic version strings
 * @param a First version
 * @param b Second version
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
export declare function compareSemver(a: string, b: string): number
/**
 * Validates plugin name format
 */
export declare function validatePluginName(name: string): boolean
/**
 * Normalizes a plugin name (removes @scope/ prefix for ID generation)
 */
export declare function normalizePluginName(name: string): string
/**
 * Simple plugin development utilities for debugging
 */
export declare const PluginDevUtils: {
  /**
   * Logs plugin debug information in development mode
   */
  log(pluginName: string, message: string, data?: any): void
  /**
   * Creates a development-only warning
   */
  warn(pluginName: string, message: string): void
}
//# sourceMappingURL=simplified-utils.d.ts.map
