/**
 * Build-Time Validation Stub - Lightweight Production Version
 *
 * Minimal build-time validation for production builds.
 * Full implementation moved to @tachui/devtools package.
 */
/**
 * Lightweight build-time detection stub
 */
export declare function isDevelopmentEnvironment(): boolean
export declare function isCIEnvironment(): boolean
export declare function shouldEnableValidation(): boolean
export declare function detectBuildEnvironment(): string
export declare function getPrimaryBuildTool(): string
export declare function getEnvironmentConfig(): any
/**
 * Build-time development tools stub
 */
export declare const BuildTimeDevTools: {
  test: () => void
  getStats: () => {
    environment: {
      isDevelopment: boolean
      isCI: boolean
      shouldEnable: boolean
    }
    buildTool: string
    available: boolean
    movedTo: string
  }
  initialize: () => void
}
//# sourceMappingURL=build-time-stub.d.ts.map
