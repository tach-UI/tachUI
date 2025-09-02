/**
 * TachUI Debug System
 *
 * Provides visual debugging tools for component hierarchy and layout
 */

export interface DebugConfig {
  enabled: boolean
  showLabels: boolean
  showBounds: boolean
  logComponentTree: boolean
}

class DebugManager {
  private config: DebugConfig = {
    enabled: false,
    showLabels: false,
    showBounds: false,
    logComponentTree: false,
  }

  private componentTree: Array<{ label: string; type: string; depth: number }> =
    []

  /**
   * Enable debug mode with optional configuration
   */
  enable(options: Partial<DebugConfig> = {}): void {
    this.config = {
      enabled: true,
      showLabels: true,
      showBounds: true,
      logComponentTree: true,
      ...options,
    }

    if (this.config.enabled) {
      this.injectDebugStyles()
      // Only log in development mode
      if (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV) {
        console.log('🔧 TachUI Debug Mode Enabled')
      }
    }
  }

  /**
   * Disable debug mode
   */
  disable(): void {
    this.config.enabled = false
    this.removeDebugStyles()
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV) {
      console.log('🔧 TachUI Debug Mode Disabled')
    }
  }

  /**
   * Check if debug mode is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled
  }

  /**
   * Get current debug configuration
   */
  getConfig(): DebugConfig {
    return { ...this.config }
  }

  /**
   * Add debug attributes to DOM element
   */
  addDebugAttributes(
    element: HTMLElement,
    componentType: string,
    debugLabel?: string
  ): void {
    if (!this.config.enabled) return

    element.setAttribute('data-tachui-component', componentType)

    if (debugLabel) {
      element.setAttribute('data-tachui-label', debugLabel)
    }

    if (this.config.showLabels || this.config.showBounds) {
      element.classList.add('tachui-debug')
    }

    if (this.config.showLabels && debugLabel) {
      element.classList.add('tachui-debug-labeled')
    }

    if (this.config.showBounds) {
      element.classList.add('tachui-debug-bounds')
    }
  }

  /**
   * Log component to tree (for hierarchical debugging)
   */
  logComponent(type: string, label?: string, depth: number = 0): void {
    if (!this.config.enabled || !this.config.logComponentTree) return

    this.componentTree.push({
      label: label || `<${type}>`,
      type,
      depth,
    })
  }

  /**
   * Print component tree to console
   */
  printComponentTree(): void {
    if (!this.config.enabled || !this.config.logComponentTree) return

    console.group('🌳 TachUI Component Tree:')
    this.componentTree.forEach(({ label, type, depth }) => {
      const indent = '  '.repeat(depth)
      const icon = this.getComponentIcon(type)
      console.log(`${indent}${icon} ${type}: "${label}"`)
    })
    console.groupEnd()

    // Clear tree for next render cycle
    this.componentTree = []
  }

  /**
   * Get icon for component type
   */
  private getComponentIcon(type: string): string {
    const icons: Record<string, string> = {
      VStack: '📚',
      HStack: '➡️',
      ZStack: '📑',
      Button: '🔘',
      Text: '📝',
      Image: '🖼️',
      ScrollView: '📜',
      List: '📋',
      Form: '📋',
      Section: '📁',
      default: '🧩',
    }
    return icons[type] || icons.default
  }

  /**
   * Inject debug CSS styles
   */
  private injectDebugStyles(): void {
    if (document.getElementById('tachui-debug-styles')) return

    const styles = `
      /* TachUI Debug Styles */
      .tachui-debug {
        position: relative;
      }

      .tachui-debug-bounds {
        outline: 1px dashed rgba(255, 0, 0, 0.3) !important;
        outline-offset: -1px;
      }

      .tachui-debug-labeled::before {
        content: attr(data-tachui-label);
        position: absolute;
        top: -1px;
        left: -1px;
        background: rgba(255, 0, 0, 0.9);
        color: white;
        font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
        font-size: 10px;
        font-weight: bold;
        line-height: 1;
        padding: 2px 4px;
        border-radius: 2px;
        z-index: 9999;
        pointer-events: none;
        white-space: nowrap;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .tachui-debug-labeled:hover::before {
        background: rgba(255, 0, 0, 1);
        max-width: none;
        white-space: normal;
      }

      /* Component type indicators */
      [data-tachui-component="VStack"] {
        border-left: 2px solid rgba(0, 255, 0, 0.5) !important;
      }

      [data-tachui-component="HStack"] {
        border-top: 2px solid rgba(0, 0, 255, 0.5) !important;
      }

      [data-tachui-component="Button"] {
        box-shadow: inset 0 0 0 1px rgba(255, 165, 0, 0.5) !important;
      }
    `

    const styleElement = document.createElement('style')
    styleElement.id = 'tachui-debug-styles'
    styleElement.textContent = styles
    document.head.appendChild(styleElement)
  }

  /**
   * Remove debug CSS styles
   */
  private removeDebugStyles(): void {
    const styleElement = document.getElementById('tachui-debug-styles')
    if (styleElement) {
      styleElement.remove()
    }

    // Remove debug classes from all elements
    document.querySelectorAll('.tachui-debug').forEach(el => {
      el.classList.remove(
        'tachui-debug',
        'tachui-debug-labeled',
        'tachui-debug-bounds'
      )
    })
  }
}

// Global debug instance
export const debugManager = new DebugManager()

// Convenience functions
export const enableDebug = (options?: Partial<DebugConfig>) =>
  debugManager.enable(options)
export const disableDebug = () => debugManager.disable()
export const isDebugEnabled = () => debugManager.isEnabled()

// Auto-enable debug mode based on URL parameters
if (typeof window !== 'undefined') {
  const urlParams = new URLSearchParams(window.location.search)
  const debugParam = urlParams.get('debug')

  if (debugParam === 'true' || debugParam === '1') {
    // Enable full debug mode
    debugManager.enable({
      enabled: true,
      showLabels: true,
      showBounds: true,
      logComponentTree: true,
    })
    console.log('🔧 TachUI Debug Mode: Enabled via URL parameter (?debug=true)')
  } else if (debugParam === 'labels') {
    // Enable only labels
    debugManager.enable({
      enabled: true,
      showLabels: true,
      showBounds: false,
      logComponentTree: false,
    })
    console.log('🔧 TachUI Debug Mode: Labels only (?debug=labels)')
  } else if (debugParam === 'bounds') {
    // Enable only bounds
    debugManager.enable({
      enabled: true,
      showLabels: false,
      showBounds: true,
      logComponentTree: false,
    })
    console.log('🔧 TachUI Debug Mode: Bounds only (?debug=bounds)')
  }
}
