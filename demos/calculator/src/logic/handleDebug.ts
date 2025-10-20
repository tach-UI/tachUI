

export function handleDebug(coreEnableDebug?: any, debugManager?: any): void {
  try {
    // In production builds, debug functions won't be available
    if (!coreEnableDebug || !debugManager) {
      return
    }

    // Check if debug should be enabled via URL parameter
    const shouldEnable = typeof window !== 'undefined' &&
                        window.location?.search.includes('debug=true')

    // Enable debug mode if URL parameter is present
    if (shouldEnable) {
      coreEnableDebug({
        showLabels: true,
        showBounds: true,
        logComponentTree: false  // Disable noisy component tree logging
      })
    }

    // Make debug functions available globally for manual control
    if (typeof window !== 'undefined') {
      (window as any).enableDebug = coreEnableDebug;
      (window as any).debugManager = debugManager;

      // Add helper function to check debug integration
      (window as any).checkDebugIntegration = () => {
        const debugElements = document.querySelectorAll('[data-tachui-component]')
        const labeledElements = document.querySelectorAll('[data-tachui-label]')

        console.group('🔧 Debug Integration Check')

        if (labeledElements.length > 0) {
          labeledElements.forEach(el => {
            const component = el.getAttribute('data-tachui-component')
            const label = el.getAttribute('data-tachui-label')
          })
        } else {
        }
        console.groupEnd()

        return {
          enabled: debugManager.isEnabled(),
          debugElements: debugElements.length,
          labeledElements: labeledElements.length
        }
      }
    }

    // Only log if debug is actually enabled
    if (debugManager.isEnabled()) {
    }
  } catch (_e) {
    // Silent fail for debug system - don't pollute console
  }
}
