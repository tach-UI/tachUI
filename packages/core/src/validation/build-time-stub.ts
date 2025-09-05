/**
 * Build-Time Validation Stub - Lightweight Production Version
 *
 * Minimal build-time validation for production builds.
 * Full implementation moved to @tachui/devtools package.
 */

/**
 * Lightweight build-time detection stub
 */
export function isDevelopmentEnvironment(): boolean {
  return (
    process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test'
  )
}

export function isCIEnvironment(): boolean {
  return !!(process.env.CI || process.env.CONTINUOUS_INTEGRATION)
}

export function shouldEnableValidation(): boolean {
  return isDevelopmentEnvironment()
}

export function detectBuildEnvironment(): string {
  return process.env.NODE_ENV || 'development'
}

export function getPrimaryBuildTool(): string {
  return 'unknown'
}

export function getEnvironmentConfig(): any {
  return {
    environment: detectBuildEnvironment(),
    buildTool: getPrimaryBuildTool(),
    validationEnabled: shouldEnableValidation(),
  }
}

/**
 * Build-time development tools stub
 */
export const BuildTimeDevTools = {
  test: () => {
    console.info(
      'ℹ️ Build-time validation test - using stub. Full functionality available in @tachui/devtools'
    )
  },

  getStats: () => ({
    environment: {
      isDevelopment: isDevelopmentEnvironment(),
      isCI: isCIEnvironment(),
      shouldEnable: shouldEnableValidation(),
    },
    buildTool: getPrimaryBuildTool(),
    available: false,
    movedTo: '@tachui/devtools',
  }),

  initialize: () => {
    // No-op in production stub
  },
}
