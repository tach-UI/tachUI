/**
 * Platform Detection Utilities
 *
 * Detects the current runtime environment and capabilities for viewport management.
 * Provides accurate platform identification and capability detection.
 */

import type { ViewportCapabilities, ViewportEnvironment } from './types'

/**
 * Configuration for platform detection behavior
 */
export interface PlatformDetectionConfig {
  /** Enable popup capability testing (creates temporary 1x1 window). Default: false */
  enablePopupTest?: boolean
}

/**
 * Detect the current platform and capabilities
 */
export function detectViewportEnvironment(
  config: PlatformDetectionConfig = {}
): ViewportEnvironment {
  const platform = detectPlatform()
  const capabilities = detectCapabilities(platform, config)
  const userAgent = getUserAgent()
  const screenSize = getScreenSize()
  const isTouch = detectTouchSupport()

  return {
    platform,
    capabilities,
    userAgent,
    screenSize,
    isTouch,
  }
}

/**
 * Detect the primary platform
 */
function detectPlatform(): ViewportEnvironment['platform'] {
  // Check for Electron first
  if (isElectron()) {
    return 'electron'
  }

  // Check for mobile
  if (isMobile()) {
    return 'mobile'
  }

  // Check for embedded contexts (iframe, web component, etc.)
  if (isEmbedded()) {
    return 'embedded'
  }

  // Default to web
  return 'web'
}

/**
 * Detect if running in Electron
 */
function isElectron(): boolean {
  // Check for Electron-specific globals
  if (typeof window !== 'undefined') {
    // Electron renderer process
    return (
      !!(window as any).electronAPI ||
      !!(window as any).electron ||
      !!(window as any).require ||
      navigator.userAgent.toLowerCase().includes('electron')
    )
  }

  // Node.js environment (main process)
  if (typeof process !== 'undefined') {
    return (
      !!(process as any).electron ||
      !!(process as any).versions?.electron ||
      process.env.ELECTRON === 'true'
    )
  }

  return false
}

/**
 * Detect mobile platform
 */
function isMobile(): boolean {
  if (typeof window === 'undefined') return false

  // Check for mobile-specific features
  const isTouchOnly = 'ontouchstart' in window && !('onmousedown' in window)
  const hasSmallScreen = window.innerWidth <= 768 || window.innerHeight <= 768
  const isMobileUserAgent =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )

  // Modern mobile detection
  const hasCoarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches
  const hasSmallViewport = window.matchMedia?.('(max-width: 768px)')?.matches

  return (
    isTouchOnly ||
    (hasSmallScreen && isMobileUserAgent) ||
    hasCoarsePointer ||
    hasSmallViewport
  )
}

/**
 * Detect if running in embedded context
 */
function isEmbedded(): boolean {
  if (typeof window === 'undefined') return false

  try {
    // Check if we're in an iframe
    return window.self !== window.top
  } catch {
    // Cross-origin iframe - can't access window.top
    return true
  }
}

/**
 * Detect platform capabilities
 */
function detectCapabilities(
  platform: ViewportEnvironment['platform'],
  config: PlatformDetectionConfig
): ViewportCapabilities {
  const base: ViewportCapabilities = {
    multiWindow: false,
    nativeWindows: false,
    modalOverlays: true,
    crossWindowCommunication: false,
    windowResizing: false,
    windowMinimizing: false,
    fullscreenSupport: false,
    menuBarSupport: false,
  }

  switch (platform) {
    case 'electron':
      return {
        ...base,
        multiWindow: true,
        nativeWindows: true,
        crossWindowCommunication: true,
        windowResizing: true,
        windowMinimizing: true,
        fullscreenSupport: true,
        menuBarSupport: true,
      }

    case 'web':
      return {
        ...base,
        multiWindow: config.enablePopupTest ? canOpenPopups() : false,
        crossWindowCommunication:
          canUseBroadcastChannel() || canUseMessageChannel(),
        fullscreenSupport: canUseFullscreen(),
        windowResizing: false, // Browser windows can't be resized programmatically
        windowMinimizing: false,
      }

    case 'mobile':
      return {
        ...base,
        fullscreenSupport: canUseFullscreen(),
        modalOverlays: true,
      }

    case 'embedded':
      return {
        ...base,
        modalOverlays: true,
      }

    default:
      return base
  }
}

/**
 * Check if we can open popup windows
 */
function canOpenPopups(): boolean {
  if (typeof window === 'undefined') return false

  // Check for jsdom test environment
  if (
    typeof window.navigator !== 'undefined' &&
    window.navigator.userAgent.includes('jsdom')
  ) {
    return false // jsdom doesn't support window.open
  }

  try {
    // Try to open and immediately close a popup to test
    const testWindow = window.open('', '', 'width=1,height=1')
    if (testWindow) {
      testWindow.close()
      return true
    }
    return false
  } catch {
    return false
  }
}

/**
 * Check if BroadcastChannel is supported
 */
function canUseBroadcastChannel(): boolean {
  return typeof window !== 'undefined' && 'BroadcastChannel' in window
}

/**
 * Check if MessageChannel is supported
 */
function canUseMessageChannel(): boolean {
  return typeof window !== 'undefined' && 'MessageChannel' in window
}

/**
 * Check if Fullscreen API is supported
 */
function canUseFullscreen(): boolean {
  if (typeof document === 'undefined') return false

  return !!(
    document.fullscreenEnabled ||
    (document as any).webkitFullscreenEnabled ||
    (document as any).mozFullScreenEnabled ||
    (document as any).msFullscreenEnabled
  )
}

/**
 * Get user agent string safely
 */
function getUserAgent(): string {
  if (typeof navigator === 'undefined') return 'unknown'
  return navigator.userAgent
}

/**
 * Get screen size safely
 */
function getScreenSize(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: 1920, height: 1080 } // Default fallback
  }

  return {
    width: window.screen?.width || window.innerWidth || 1920,
    height: window.screen?.height || window.innerHeight || 1080,
  }
}

/**
 * Detect touch support
 */
function detectTouchSupport(): boolean {
  if (typeof window === 'undefined') return false

  return !!(
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  )
}

/**
 * Get detailed browser information
 */
export function getBrowserInfo() {
  if (typeof navigator === 'undefined') {
    return {
      name: 'unknown',
      version: 'unknown',
      engine: 'unknown',
    }
  }

  const ua = navigator.userAgent
  let name = 'unknown'
  let version = 'unknown'
  let engine = 'unknown'

  // Detect browser
  if (ua.includes('Chrome')) {
    name = 'Chrome'
    const match = ua.match(/Chrome\/(\d+)/)
    version = match ? match[1] : 'unknown'
    engine = 'Blink'
  } else if (ua.includes('Firefox')) {
    name = 'Firefox'
    const match = ua.match(/Firefox\/(\d+)/)
    version = match ? match[1] : 'unknown'
    engine = 'Gecko'
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    name = 'Safari'
    const match = ua.match(/Version\/(\d+)/)
    version = match ? match[1] : 'unknown'
    engine = 'WebKit'
  } else if (ua.includes('Edge')) {
    name = 'Edge'
    const match = ua.match(/Edge\/(\d+)/) || ua.match(/Edg\/(\d+)/)
    version = match ? match[1] : 'unknown'
    engine = 'Blink'
  }

  return { name, version, engine }
}

/**
 * Get OS information
 */
export function getOSInfo() {
  if (typeof navigator === 'undefined') {
    return {
      name: 'unknown',
      version: 'unknown',
    }
  }

  const ua = navigator.userAgent
  let name = 'unknown'
  let version = 'unknown'

  if (ua.includes('Windows')) {
    name = 'Windows'
    if (ua.includes('Windows NT 10.0')) version = '10/11'
    else if (ua.includes('Windows NT 6.3')) version = '8.1'
    else if (ua.includes('Windows NT 6.2')) version = '8'
    else if (ua.includes('Windows NT 6.1')) version = '7'
  } else if (ua.includes('Mac OS X')) {
    name = 'macOS'
    const match = ua.match(/Mac OS X (\d+_\d+_?\d*)/)
    if (match) {
      version = match[1].replace(/_/g, '.')
    }
  } else if (ua.includes('Linux')) {
    name = 'Linux'
  } else if (ua.includes('Android')) {
    name = 'Android'
    const match = ua.match(/Android (\d+\.?\d*\.?\d*)/)
    version = match ? match[1] : 'unknown'
  } else if (ua.includes('iPhone OS') || ua.includes('OS ')) {
    name = 'iOS'
    const match = ua.match(/OS (\d+_\d+_?\d*)/)
    if (match) {
      version = match[1].replace(/_/g, '.')
    }
  }

  return { name, version }
}

/**
 * Check if specific features are available
 */
export function checkFeatureSupport() {
  if (typeof window === 'undefined') {
    return {
      webgl: false,
      webgl2: false,
      webWorkers: false,
      serviceWorkers: false,
      pushNotifications: false,
      webAssembly: false,
      intersectionObserver: false,
      resizeObserver: false,
    }
  }

  return {
    webgl: !!window.WebGLRenderingContext,
    webgl2: !!window.WebGL2RenderingContext,
    webWorkers: 'Worker' in window,
    serviceWorkers: 'serviceWorker' in navigator,
    pushNotifications: 'PushManager' in window,
    webAssembly: 'WebAssembly' in window,
    intersectionObserver: 'IntersectionObserver' in window,
    resizeObserver: 'ResizeObserver' in window,
  }
}

/**
 * Create a capability checker function
 */
export function createCapabilityChecker(environment: ViewportEnvironment) {
  return {
    canOpenWindow: (preferNative = false) => {
      if (preferNative) {
        return environment.capabilities.nativeWindows
      }
      return (
        environment.capabilities.multiWindow ||
        environment.capabilities.modalOverlays
      )
    },

    canCommunicateBetweenWindows: () => {
      return environment.capabilities.crossWindowCommunication
    },

    canResizeWindows: () => {
      return environment.capabilities.windowResizing
    },

    canMinimizeWindows: () => {
      return environment.capabilities.windowMinimizing
    },

    canUseFullscreen: () => {
      return environment.capabilities.fullscreenSupport
    },

    canUseMenuBar: () => {
      return environment.capabilities.menuBarSupport
    },

    getOptimalViewportType: (preferNative = false) => {
      if (preferNative && environment.capabilities.nativeWindows) {
        return 'window'
      }

      if (environment.capabilities.modalOverlays) {
        return 'modal'
      }

      if (environment.platform === 'mobile') {
        return 'sheet'
      }

      return 'portal'
    },
  }
}
