

export function handleDebug(coreEnableDebug?: any, debugManager?: any): void {
  try {
    // In production builds, debug functions won't be available
    if (!coreEnableDebug || !debugManager) {
      return;
    }

    // Check if debug should be enabled via URL parameter
    const shouldEnable =
      typeof window !== "undefined" &&
      window.location?.search.includes("debug=true");

    // Enable debug mode if URL parameter is present
    if (shouldEnable) {
      coreEnableDebug({
        showLabels: true,
        showBounds: true,
        logComponentTree: false,
      });
    }

    // Make debug functions available globally for manual control
    if (typeof window !== "undefined") {
      (window as any).enableDebug = coreEnableDebug;
      (window as any).debugManager = debugManager;

      // Add helper function to check debug integration
      (window as any).checkDebugIntegration = () => {
        const debugElements =
          document.querySelectorAll("[data-tachui-component]").length;
        const labeledElements =
          document.querySelectorAll("[data-tachui-label]").length;

        console.group("🔧 Debug Integration Check");
        console.info(`Debug elements detected: ${debugElements}`);
        console.info(`Labeled elements detected: ${labeledElements}`);
        console.groupEnd();

        return {
          enabled: debugManager.isEnabled(),
          debugElements,
          labeledElements,
        };
      };
    }
  } catch (_e) {
    // Silent fail for debug system - don't pollute console
  }
}
