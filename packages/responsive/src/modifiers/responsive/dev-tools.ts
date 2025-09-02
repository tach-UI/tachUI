/**
 * Responsive Development Tools and Debugging Features
 *
 * Provides comprehensive debugging, inspection, and development tools
 * for the responsive design system.
 */

import { createComputed, Signal } from '@tachui/core'
import {
  ResponsiveValue,
  BreakpointKey,
  BreakpointContext,
  isResponsiveValue,
} from './types'
import {
  getCurrentBreakpoint,
  createBreakpointContext,
  getCurrentBreakpointConfig,
} from './breakpoints'
import { ResponsivePerformanceMonitor, cssRuleCache } from './performance'
import { MediaQueries } from './utilities'

/**
 * Development mode responsive debugging
 */
export class ResponsiveDevTools {
  private static isEnabled = false
  private static debugOverlay: HTMLElement | null = null
  private static logLevel: 'error' | 'warn' | 'info' | 'debug' = 'info'

  /**
   * Enable responsive development tools
   */
  static enable(
    options: {
      showOverlay?: boolean
      showBreakpoints?: boolean
      showPerformance?: boolean
      logLevel?: 'error' | 'warn' | 'info' | 'debug'
      highlightResponsiveElements?: boolean
      position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    } = {}
  ): void {
    if (process.env.NODE_ENV === 'production') {
      console.warn('ResponsiveDevTools: Not enabling in production mode')
      return
    }

    this.isEnabled = true
    this.logLevel = options.logLevel || 'info'

    this.log('info', 'ResponsiveDevTools: Enabled')

    if (options.showOverlay) {
      this.createDebugOverlay(options)
    }

    if (options.highlightResponsiveElements) {
      this.enableElementHighlighting()
    }

    if (options.showPerformance) {
      this.enablePerformanceMonitoring()
    }

    // Log initial state
    this.logResponsiveState()
  }

  /**
   * Disable responsive development tools
   */
  static disable(): void {
    this.isEnabled = false

    if (this.debugOverlay) {
      this.debugOverlay.remove()
      this.debugOverlay = null
    }

    this.disableElementHighlighting()
    this.log('info', 'ResponsiveDevTools: Disabled')
  }

  /**
   * Check if development tools are enabled
   */
  static get enabled(): boolean {
    return this.isEnabled && process.env.NODE_ENV !== 'production'
  }

  /**
   * Log responsive information
   */
  private static log(
    level: 'error' | 'warn' | 'info' | 'debug',
    ...args: any[]
  ): void {
    if (!this.enabled) return

    const levels = ['error', 'warn', 'info', 'debug']
    const currentLevel = levels.indexOf(this.logLevel)
    const messageLevel = levels.indexOf(level)

    if (messageLevel <= currentLevel) {
      console[level]('[ResponsiveDevTools]', ...args)
    }
  }

  /**
   * Create visual debug overlay
   */
  private static createDebugOverlay(options: {
    showBreakpoints?: boolean
    showPerformance?: boolean
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  }): void {
    if (typeof document === 'undefined') return

    const position = options.position || 'top-right'

    this.debugOverlay = document.createElement('div')
    this.debugOverlay.id = 'tachui-responsive-debug'
    this.debugOverlay.style.cssText = `
      position: fixed;
      ${position.includes('top') ? 'top: 10px' : 'bottom: 10px'};
      ${position.includes('right') ? 'right: 10px' : 'left: 10px'};
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 12px;
      border-radius: 8px;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
      font-size: 12px;
      z-index: 10000;
      pointer-events: auto;
      cursor: pointer;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
    `

    // Add close button
    const closeButton = document.createElement('div')
    closeButton.textContent = '×'
    closeButton.style.cssText = `
      position: absolute;
      top: 4px;
      right: 8px;
      cursor: pointer;
      font-size: 16px;
      color: #ff6b6b;
    `
    closeButton.onclick = () => this.disable()
    this.debugOverlay.appendChild(closeButton)

    document.body.appendChild(this.debugOverlay)

    // Update overlay content reactively
    this.updateDebugOverlay(options)

    // Update on resize
    let resizeTimer: number
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        this.updateDebugOverlay(options)
      }, 100)
    })
  }

  /**
   * Update debug overlay content
   */
  private static updateDebugOverlay(options: {
    showBreakpoints?: boolean
    showPerformance?: boolean
  }): void {
    if (!this.debugOverlay) return

    const context = createBreakpointContext()
    const breakpointConfig = getCurrentBreakpointConfig()

    let content = `
      <div style="margin-bottom: 8px; font-weight: bold; color: #4fc3f7;">
        📱 Responsive Debug
      </div>
    `

    // Current breakpoint info
    content += `
      <div style="margin-bottom: 6px;">
        <strong>Current:</strong> <span style="color: #66bb6a;">${context.current}</span>
      </div>
      <div style="margin-bottom: 6px;">
        <strong>Size:</strong> ${context.width}×${context.height}
      </div>
    `

    // Breakpoint ranges
    if (options.showBreakpoints) {
      content += `<div style="margin: 8px 0; font-weight: bold; color: #ffb74d;">Breakpoints:</div>`

      for (const [name, value] of Object.entries(breakpointConfig)) {
        const isActive = name === context.current
        const color = isActive ? '#66bb6a' : '#999'
        content += `
          <div style="color: ${color}; margin-bottom: 2px;">
            ${isActive ? '▶' : '▷'} ${name}: ${value}
          </div>
        `
      }
    }

    // Performance info
    if (options.showPerformance) {
      const perfStats = ResponsivePerformanceMonitor.getStats()
      const cacheStats = cssRuleCache.getStats()

      content += `<div style="margin: 8px 0; font-weight: bold; color: #f06292;">Performance:</div>`
      content += `
        <div style="margin-bottom: 2px;">
          Cache: ${cacheStats.size} rules (${(cacheStats.hitRate * 100).toFixed(1)}% hit rate)
        </div>
      `

      if (Object.keys(perfStats).length > 0) {
        for (const [name, stats] of Object.entries(perfStats)) {
          content += `
            <div style="margin-bottom: 2px;">
              ${name}: ${stats.average.toFixed(2)}ms avg
            </div>
          `
        }
      }
    }

    // Media query test results
    content += `<div style="margin: 8px 0; font-weight: bold; color: #ba68c8;">Media Queries:</div>`

    const testQueries = {
      Touch: MediaQueries.touchDevice,
      Dark: MediaQueries.darkMode,
      'Reduced Motion': MediaQueries.reducedMotion,
      'High Contrast': MediaQueries.highContrast,
    }

    for (const [name, query] of Object.entries(testQueries)) {
      const matches = window.matchMedia(query).matches
      const color = matches ? '#66bb6a' : '#666'
      content += `
        <div style="color: ${color}; margin-bottom: 2px;">
          ${matches ? '✓' : '✗'} ${name}
        </div>
      `
    }

    this.debugOverlay.innerHTML =
      content + this.debugOverlay.querySelector('div:last-child')?.outerHTML ||
      ''
  }

  /**
   * Enable element highlighting for responsive elements
   */
  private static enableElementHighlighting(): void {
    if (typeof document === 'undefined') return

    const style = document.createElement('style')
    style.id = 'tachui-responsive-highlight'
    style.textContent = `
      .tachui-responsive-element {
        outline: 2px dashed #4fc3f7 !important;
        outline-offset: 2px !important;
        position: relative !important;
      }

      .tachui-responsive-element::before {
        content: 'R';
        position: absolute !important;
        top: -8px !important;
        right: -8px !important;
        background: #4fc3f7 !important;
        color: white !important;
        width: 16px !important;
        height: 16px !important;
        border-radius: 50% !important;
        font-size: 10px !important;
        font-weight: bold !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        z-index: 10001 !important;
        font-family: monospace !important;
      }
    `

    document.head.appendChild(style)

    // Find and mark responsive elements
    const observer = new MutationObserver(() => {
      this.highlightResponsiveElements()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    })

    // Initial highlighting
    this.highlightResponsiveElements()
  }

  /**
   * Disable element highlighting
   */
  private static disableElementHighlighting(): void {
    if (typeof document === 'undefined') return

    const style = document.getElementById('tachui-responsive-highlight')
    if (style) {
      style.remove()
    }

    document.querySelectorAll('.tachui-responsive-element').forEach(el => {
      el.classList.remove('tachui-responsive-element')
    })
  }

  /**
   * Highlight elements with responsive classes
   */
  private static highlightResponsiveElements(): void {
    if (typeof document === 'undefined') return

    // Find elements with tachui responsive classes
    const responsiveSelectors = [
      '[class*="tachui-responsive-"]',
      '[class*="tachui-mq-"]',
    ]

    responsiveSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        if (!el.classList.contains('tachui-responsive-element')) {
          el.classList.add('tachui-responsive-element')
        }
      })
    })
  }

  /**
   * Enable performance monitoring display
   */
  private static enablePerformanceMonitoring(): void {
    // Log performance stats periodically
    setInterval(() => {
      if (!this.enabled) return

      const perfStats = ResponsivePerformanceMonitor.getStats()
      const cacheStats = cssRuleCache.getStats()

      this.log('debug', 'Performance Stats:', {
        cache: cacheStats,
        performance: perfStats,
      })
    }, 5000)
  }

  /**
   * Log current responsive state
   */
  static logResponsiveState(): void {
    if (!this.enabled) return

    const context = createBreakpointContext()
    const config = getCurrentBreakpointConfig()

    console.group('🔍 TachUI Responsive State')
    console.log('Current breakpoint:', context.current)
    console.log('Viewport:', `${context.width}×${context.height}`)
    console.log('Configuration:', config)

    // Test media queries only in browser environment
    if (typeof window !== 'undefined' && window.matchMedia) {
      const queries = {
        Mobile: MediaQueries.mobile,
        Tablet: MediaQueries.tablet,
        Desktop: MediaQueries.desktop,
        'Touch Device': MediaQueries.touchDevice,
        'Dark Mode': MediaQueries.darkMode,
        'Reduced Motion': MediaQueries.reducedMotion,
      }

      console.log('Media Query Results:')
      for (const [name, query] of Object.entries(queries)) {
        try {
          console.log(`  ${name}: ${window.matchMedia(query).matches}`)
        } catch (_error) {
          console.log(`  ${name}: Error testing query`)
        }
      }
    }

    console.groupEnd()
  }

  /**
   * Inspect a responsive value
   */
  static inspectResponsiveValue<T>(
    value: ResponsiveValue<T>,
    label?: string
  ): void {
    if (!this.enabled) return

    const currentBreakpoint = getCurrentBreakpoint()

    console.group(`🔍 Responsive Value${label ? ` - ${label}` : ''}`)

    if (isResponsiveValue(value)) {
      const responsiveObj = value as Partial<Record<BreakpointKey, T>>
      console.log('Responsive object:', responsiveObj)

      // Show resolved value for current breakpoint
      const breakpointOrder: BreakpointKey[] = [
        'base',
        'sm',
        'md',
        'lg',
        'xl',
        '2xl',
      ]
      const currentIndex = breakpointOrder.indexOf(currentBreakpoint())

      let resolvedValue: T | undefined
      for (let i = currentIndex; i >= 0; i--) {
        const bp = breakpointOrder[i]
        if (responsiveObj[bp] !== undefined) {
          resolvedValue = responsiveObj[bp]
          console.log(`Resolved value (${bp}):`, resolvedValue)
          break
        }
      }

      // Show all defined breakpoints
      console.log('Defined breakpoints:')
      for (const [bp, val] of Object.entries(responsiveObj)) {
        if (val !== undefined) {
          const isCurrent = bp === currentBreakpoint()
          console.log(`  ${isCurrent ? '→' : ' '} ${bp}:`, val)
        }
      }
    } else {
      console.log('Static value:', value)
    }

    console.groupEnd()
  }

  /**
   * Test responsive behavior
   */
  static testResponsiveBehavior(
    responsiveValue: ResponsiveValue<any>,
    testBreakpoints: BreakpointKey[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl']
  ): Partial<Record<BreakpointKey, any>> {
    if (!this.enabled) return {}

    const results: Partial<Record<BreakpointKey, any>> = {}

    // Mock different breakpoints and test resolution
    testBreakpoints.forEach(bp => {
      // This would require breakpoint mocking functionality
      // For now, just log what would happen
      this.log('debug', `Testing breakpoint ${bp}:`, responsiveValue)
    })

    return results
  }

  /**
   * Export responsive configuration for debugging
   */
  static exportConfiguration(): {
    breakpoints: Record<BreakpointKey, string>
    currentContext: BreakpointContext
    performance: any
    mediaQueries: Record<string, boolean>
  } {
    const context = createBreakpointContext()
    const config = getCurrentBreakpointConfig()
    const perfStats = ResponsivePerformanceMonitor.getStats()
    const cacheStats = cssRuleCache.getStats()

    const mediaQueryResults: Record<string, boolean> = {}
    if (typeof window !== 'undefined' && window.matchMedia) {
      for (const [name, query] of Object.entries(MediaQueries)) {
        if (typeof query === 'string') {
          try {
            mediaQueryResults[name] = window.matchMedia(query).matches
          } catch (_error) {
            mediaQueryResults[name] = false
          }
        }
      }
    }

    return {
      breakpoints: config,
      currentContext: context,
      performance: {
        cache: cacheStats,
        timings: perfStats,
      },
      mediaQueries: mediaQueryResults,
    }
  }
}

/**
 * Responsive value inspector hook
 */
export function useResponsiveInspector<T>(
  value: ResponsiveValue<T>,
  label?: string
): Signal<{
  resolvedValue: T | undefined
  activeBreakpoint: BreakpointKey
  allValues: Partial<Record<BreakpointKey, T>>
  isResponsive: boolean
}> {
  const currentBreakpoint = getCurrentBreakpoint()

  return createComputed(() => {
    const breakpoint = currentBreakpoint()
    const isResponsive = isResponsiveValue(value)

    let resolvedValue: T | undefined
    let allValues: Partial<Record<BreakpointKey, T>> = {}

    if (isResponsive) {
      const responsiveObj = value as Partial<Record<BreakpointKey, T>>
      allValues = responsiveObj

      // Resolve value for current breakpoint
      const breakpointOrder: BreakpointKey[] = [
        'base',
        'sm',
        'md',
        'lg',
        'xl',
        '2xl',
      ]
      const currentIndex = breakpointOrder.indexOf(breakpoint)

      for (let i = currentIndex; i >= 0; i--) {
        const bp = breakpointOrder[i]
        if (responsiveObj[bp] !== undefined) {
          resolvedValue = responsiveObj[bp]
          break
        }
      }
    } else {
      resolvedValue = value as T
      allValues = { [breakpoint]: resolvedValue }
    }

    // Log in development mode
    if (ResponsiveDevTools.enabled && label) {
      ResponsiveDevTools.inspectResponsiveValue(value, label)
    }

    return {
      resolvedValue,
      activeBreakpoint: breakpoint,
      allValues,
      isResponsive,
    }
  }) as Signal<{
    resolvedValue: T | undefined
    activeBreakpoint: BreakpointKey
    allValues: Partial<Record<BreakpointKey, T>>
    isResponsive: boolean
  }>
}

/**
 * Browser compatibility testing utilities
 */
export class BrowserCompatibility {
  /**
   * Test CSS features support
   */
  static testCSSFeatures(): Record<string, boolean> {
    if (
      typeof window === 'undefined' ||
      typeof CSS === 'undefined' ||
      !CSS.supports
    ) {
      return {}
    }

    const features: Record<string, boolean> = {}

    try {
      // Test CSS Grid
      features.cssGrid = CSS.supports('display', 'grid')

      // Test CSS Flexbox
      features.flexbox = CSS.supports('display', 'flex')

      // Test CSS Custom Properties
      features.customProperties = CSS.supports('--test', 'value')

      // Test viewport units
      features.viewportUnits = CSS.supports('width', '100vw')

      // Test media queries
      features.mediaQueries = typeof window.matchMedia === 'function'

      // Test container queries (modern feature)
      features.containerQueries = CSS.supports('container-type', 'inline-size')

      // Test CSS logical properties
      features.logicalProperties = CSS.supports('margin-inline-start', '1rem')
    } catch (_error) {
      // If any test fails, just return what we have so far
    }

    return features
  }

  /**
   * Test responsive behavior across different viewport sizes
   */
  static testViewportSizes(
    callback: (width: number, height: number) => void
  ): void {
    if (typeof window === 'undefined') return

    const testSizes = [
      { width: 320, height: 568, name: 'iPhone SE' },
      { width: 375, height: 667, name: 'iPhone 8' },
      { width: 768, height: 1024, name: 'iPad Portrait' },
      { width: 1024, height: 768, name: 'iPad Landscape' },
      { width: 1280, height: 720, name: 'Desktop Small' },
      { width: 1920, height: 1080, name: 'Desktop Large' },
    ]

    // This would require a testing environment or dev tools integration
    if (ResponsiveDevTools.enabled) {
      ResponsiveDevTools['log']('info', 'Testing viewport sizes:', testSizes)
    }

    testSizes.forEach(size => {
      // In a real implementation, this would simulate the viewport size
      callback(size.width, size.height)
    })
  }
}

/**
 * Development-only global helpers
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // Add global helpers for development
  ;(window as any).tachUIResponsive = {
    devTools: ResponsiveDevTools,
    inspector: useResponsiveInspector,
    compatibility: BrowserCompatibility,
    logState: () => ResponsiveDevTools.logResponsiveState(),
    export: () => ResponsiveDevTools.exportConfiguration(),
  }
}
