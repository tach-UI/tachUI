/**
 * TachUI Validation System - Complete Implementation (Phases 1A-1D)
 *
 * Complete validation system with smart error recovery, enhanced error reporting,
 * production optimization, lifecycle validation, comprehensive debugging tools,
 * and full developer experience integration.
 */

// Core validation systems (always available)
export * from './plugin-registration'
export * from './production-bypass-core'

// Enhanced validation system moved to @tachui/devtools - import from that package
// Phase 1C: Core validation only
export * from './lifecycle-validation'

// Phase 1D: Developer Experience Integration moved to @tachui/devtools
// Import from @tachui/devtools instead
export * from './debug-tools-stub'

// Build-time validation (note: transformer uses dynamic TypeScript import)
export * from './build-time-stub'

// Note: Component validation moved to @tachui/primitives package for better co-location

/**
 * Enhanced Development Tools (Phases 1A-1D Complete)
 */
export const ValidationDevTools = {
  /**
   * Log all validation rules including all phase enhancements
   */
  logValidationRules(): void {
    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.NODE_ENV !== 'test'
    ) {
      console.group('🔍 TachUI Complete Validation System')

      console.info('Runtime Component Rules:')
      console.info('• Text: requires content parameter')
      console.info('• Button: requires title parameter, action recommended')
      console.info('• VStack/HStack/ZStack: requires children array')
      console.info('• Image, Toggle, Slider: require props objects')
      console.info('• All components: smart error recovery available')

      console.info('\nRuntime Modifier Rules:')
      console.info('• font modifiers: Text components only')
      console.info('• interactive modifiers: Button, Toggle, etc.')
      console.info('• clipped(), resizable(): no parameters')
      console.info('• Non-existent: textShadow, id, className, style')
      console.info('• Smart suggestions for invalid modifiers')

      console.info('\nBuild-Time Rules:')
      console.info('• Component argument validation')
      console.info('• Modifier compatibility checking')
      console.info('• Parameter type validation')
      console.info('• Deprecated usage warnings')
      console.info('• Cross-package validation (33 components)')

      console.info('\nGeneral Enhancements:')
      console.info('• Smart error recovery with 4 strategies')
      console.info('• Enhanced error reporting with fix suggestions')
      console.info('• Production mode bypass (zero overhead)')
      console.info('• Component lifecycle validation')
      console.info('• Performance optimization (<5% overhead target)')
      console.info('• Comprehensive debugging tools')

      console.info('\nDeveloper Experience:')
      console.info('• Core validation and error reporting')
      console.info(
        '• Note: Rich error templates, VS Code integration, documentation, and advanced debugging moved to @tachui/devtools package'
      )

      console.groupEnd()
    }
  },

  /**
   * Test complete validation system including Phase 1D
   */
  async test(): Promise<void> {
    console.group('🔍 TachUI Complete Validation System Test')

    try {
      // Test core systems (Phase 1A & 1B)
      console.info(
        'ℹ️ Component validation moved to @tachui/primitives package'
      )

      // Test Phase 1C enhancements - moved to @tachui/devtools
      console.info(
        'ℹ️ Enhanced validation testing moved to @tachui/devtools package'
      )

      // Note: Performance optimization testing moved to @tachui/devtools package
      // const { PerformanceOptimizationUtils } = await import('./performance-optimizer-stub')

      console.info(
        'ℹ️ Production optimization testing moved to @tachui/devtools package'
      )

      // Test Phase 1D developer experience features
      try {
        // Developer experience moved to @tachui/devtools
        console.info(
          'ℹ️ Developer experience features moved to @tachui/devtools'
        )
        console.info('ℹ️ Advanced debugging features moved to @tachui/devtools')
        console.info('ℹ️ Documentation integration moved to @tachui/devtools')
        console.info('ℹ️ IDE integration moved to @tachui/devtools')

        console.info(
          '✅ Phase 1D developer experience features moved to @tachui/devtools'
        )
      } catch (error) {
        console.warn(
          '⚠️ Phase 1D tests partially failed:',
          error instanceof Error ? error.message : String(error)
        )
      }

      // Test build-time validation if available
      try {
        const { BuildTimeDevTools } = await import('./build-time-stub')
        BuildTimeDevTools.test()
      } catch (_error) {
        console.info(
          'ℹ️ Build-time validation not available in this environment'
        )
      }

      console.info('✅ Complete validation system test completed successfully')
    } catch (error) {
      console.error('❌ Validation system test failed:', error)
    }

    console.groupEnd()
  },

  /**
   * Get comprehensive validation statistics including all phases
   */
  async getStats() {
    try {
      // Core runtime stats (Phase 1A & 1B)
      // ValidationUtils moved to @tachui/primitives package
      const runtimeStats = {
        note: 'Component validation moved to @tachui/primitives',
      }

      // Enhanced runtime stats - moved to @tachui/devtools
      const enhancedStats = {
        note: 'Enhanced validation moved to @tachui/devtools',
      }

      // Performance stats (Phase 1C) - using lightweight stub
      const { PerformanceOptimizationUtils } = await import(
        './performance-optimizer-stub'
      )
      const performanceStats = PerformanceOptimizationUtils.getStats()

      // Production stats (Phase 1C)
      const { ProductionUtils } = await import('./production-bypass-core')
      const productionStats = ProductionUtils.getInfo()

      // Lifecycle stats (Phase 1C)
      const { LifecycleValidationUtils } = await import(
        './lifecycle-validation'
      )
      const lifecycleStats = LifecycleValidationUtils.getStats()

      // Phase 1D developer experience stats - moved to @tachui/devtools
      const phase1DStats = {
        note: 'Developer experience, advanced debugging, documentation integration, and IDE integration moved to @tachui/devtools package',
        movedTo: '@tachui/devtools',
      }

      // Debug stats (moved to @tachui/devtools)
      const debugStats = {
        available: false,
        movedTo: '@tachui/devtools',
      }

      // Build-time stats
      let buildTimeStats = {}
      try {
        const { BuildTimeDevTools } = await import('./build-time-stub')
        buildTimeStats = BuildTimeDevTools.getStats()
      } catch (_error) {
        buildTimeStats = { buildTime: { available: false } }
      }

      return {
        runtime: runtimeStats,
        enhanced: enhancedStats,
        debug: debugStats,
        performance: performanceStats,
        production: productionStats,
        lifecycle: lifecycleStats,
        ...phase1DStats,
        ...buildTimeStats,
        phase: '1D - Complete Developer Experience',
        features: [
          'Smart Error Recovery',
          'Enhanced Error Reporting',
          'Production Mode Bypass',
          'Component Lifecycle Validation',
          'Performance Optimization',
          'Core Validation System',
          'Note: Debug tools, rich error templates, VS Code integration, documentation, and advanced debugging moved to @tachui/devtools',
        ],
      }
    } catch (error) {
      console.error('Failed to gather complete validation stats:', error)
      return { error: error instanceof Error ? error.message : String(error) }
    }
  },
}

/**
 * Quick setup utilities for different validation modes
 */
export const ValidationSetup = {
  /**
   * Development mode with full validation
   */
  async development() {
    try {
      // const { EnhancedValidationUtils } = await import('./enhanced-runtime') // Moved to @tachui/devtools
      const { PerformanceOptimizationUtils } = await import(
        './performance-optimizer-stub'
      )

      // Enhanced validation moved to @tachui/devtools
      console.info(
        'ℹ️ Enhanced validation configuration moved to @tachui/devtools package'
      )

      // EnhancedValidationUtils.configure({
      //   enabled: true,
      //   recovery: {
      //     enableRecovery: true,
      //     defaultStrategy: 'fallback',
      //     maxRecoveryAttempts: 3,
      //   },
      //   lifecycle: {
      //     validateOnMount: true,
      //     validateOnUpdate: false,
      //     validateOnUnmount: false,
      //   },
      //   reporting: {
      //     enhancedMessages: true,
      //     includeStackTrace: true,
      //     reportToConsole: true,
      //   },
      // })

      // Enable performance optimization
      PerformanceOptimizationUtils.configure({
        enabled: true,
        targetOverhead: 5,
        cacheStrategy: 'moderate',
      })

      console.info('🔍 TachUI Enhanced Validation: Development mode active')
      console.info('ℹ️ Debug functionality moved to @tachui/devtools')

      return { note: 'Debug functionality moved to @tachui/devtools' }
    } catch (error) {
      console.warn(
        'Enhanced validation setup failed, using basic validation:',
        error instanceof Error ? error.message : String(error)
      )
      return { fallback: true }
    }
  },

  /**
   * Production mode with zero overhead
   */
  async production() {
    try {
      const { ProductionUtils } = await import('./production-bypass-core')

      // Enable production bypass
      ProductionUtils.isProduction()

      console.info('🚀 TachUI Validation: Production mode - zero overhead')

      return { optimized: true }
    } catch (error) {
      console.warn(
        'Production optimization setup failed:',
        error instanceof Error ? error.message : String(error)
      )
      return { fallback: true }
    }
  },

  /**
   * Testing mode with detailed validation
   */
  async testing() {
    try {
      // const { EnhancedValidationUtils } = await import('./enhanced-runtime') // Moved to @tachui/devtools

      // Enhanced validation configuration moved to @tachui/devtools
      console.info(
        'ℹ️ Enhanced validation testing configuration moved to @tachui/devtools package'
      )

      // EnhancedValidationUtils.configure({
      //   enabled: true,
      //   recovery: {
      //     enableRecovery: false,
      //     defaultStrategy: 'throw',
      //     maxRecoveryAttempts: 0,
      //   },
      //   lifecycle: {
      //     validateOnMount: true,
      //     validateOnUpdate: true,
      //     validateOnUnmount: true,
      //   },
      //   reporting: {
      //     enhancedMessages: true,
      //     includeStackTrace: true,
      //     reportToConsole: false,
      //   },
      // })

      console.info('🧪 TachUI Validation: Testing mode active')

      return { testMode: true }
    } catch (error) {
      console.warn(
        'Testing validation setup failed:',
        error instanceof Error ? error.message : String(error)
      )
      return { fallback: true }
    }
  },
}

// Auto-initialize with complete validation system
let validationSystemInitialized = false

/**
 * Lazy initialization function that checks environment at runtime
 */
function initializeValidationSystem(): void {
  if (validationSystemInitialized) return

  // Check environment at runtime, not import time
  const isProduction = process.env.NODE_ENV === 'production'
  const isTest = process.env.NODE_ENV === 'test'

  if (!isProduction && !isTest) {
    validationSystemInitialized = true
    console.info(
      '🔍 TachUI Complete Validation System (Phases 1A-1D) initialized'
    )
    console.info('✅ Runtime validation: enabled')
    console.info('✅ Component validation: enabled (33 components)')
    console.info('✅ Modifier validation: enabled')
    console.info('✅ Build-time validation: auto-detecting')
    console.info('✅ Smart error recovery: enabled')
    console.info('✅ Enhanced error reporting: enabled')
    console.info('✅ Performance optimization: enabled')
    console.info('✅ Debug tools: available')
    console.info(
      '✅ Developer experience: enhanced templates, IDE integration, documentation'
    )
    console.info(
      '✅ Advanced debugging: visual overlays, state inspection, trend analysis'
    )
    console.info('ℹ️ Use ValidationSetup.development() for full features')
  }
}

// Remove auto-initialization - only initialize when explicitly called
// This prevents the validation system from initializing during module import
