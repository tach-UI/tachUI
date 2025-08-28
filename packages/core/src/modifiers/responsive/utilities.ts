/**
 * Responsive Design Utilities
 * 
 * Provides utility functions and hooks for working with responsive design
 * in tachUI applications. Includes breakpoint detection, media query helpers,
 * and responsive value resolution.
 */

import { 
  BreakpointKey, 
  BreakpointContext, 
  ResponsiveValue,
  isResponsiveValue 
} from './types'
import { 
  getCurrentBreakpoint,
  createBreakpointContext,
  getBreakpointIndex
} from './breakpoints'
import { createSignal, createComputed, Signal } from '../../reactive'

/**
 * Hook to get current breakpoint information
 */
export function useBreakpoint(): {
  current: Signal<BreakpointKey>
  context: Signal<BreakpointContext>
  isAbove: (breakpoint: BreakpointKey) => Signal<boolean>
  isBelow: (breakpoint: BreakpointKey) => Signal<boolean>
  isBetween: (min: BreakpointKey, max: BreakpointKey) => Signal<boolean>
  matches: (query: string) => Signal<boolean>
} {
  const current = getCurrentBreakpoint()
  
  const context = createComputed(() => createBreakpointContext())
  
  const isAbove = (breakpoint: BreakpointKey) => 
    createComputed(() => getBreakpointIndex(current()) > getBreakpointIndex(breakpoint))
  
  const isBelow = (breakpoint: BreakpointKey) => 
    createComputed(() => getBreakpointIndex(current()) < getBreakpointIndex(breakpoint))
  
  const isBetween = (min: BreakpointKey, max: BreakpointKey) => 
    createComputed(() => {
      const currentIndex = getBreakpointIndex(current())
      const minIndex = getBreakpointIndex(min)
      const maxIndex = getBreakpointIndex(max)
      return currentIndex >= minIndex && currentIndex <= maxIndex
    })
  
  const matches = (query: string) => {
    const [matchesSignal, setMatches] = createSignal(false)
    
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia(query)
      setMatches(mediaQuery.matches)
      
      const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
      mediaQuery.addEventListener('change', handler)
      
      // Cleanup would need to be handled by caller
    }
    
    return matchesSignal as Signal<boolean>
  }
  
  return {
    current,
    context,
    isAbove,
    isBelow,
    isBetween,
    matches
  }
}

/**
 * Hook to create a reactive media query
 */
export function useMediaQuery(query: string): Signal<boolean> {
  const [matches, setMatches] = createSignal(false)
  
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)
    
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mediaQuery.addEventListener('change', handler)
    
    // TODO: Implement cleanup mechanism
  }
  
  return matches as Signal<boolean>
}

/**
 * Resolve a responsive value to its current value based on the current breakpoint
 */
export function useResponsiveValue<T>(value: ResponsiveValue<T>): Signal<T> {
  const currentBreakpoint = getCurrentBreakpoint()
  
  return createComputed(() => {
    if (!isResponsiveValue(value)) {
      return value as T
    }
    
    const breakpoint = currentBreakpoint()
    const responsiveObj = value as Partial<Record<BreakpointKey, T>>
    
    // Try to find value for current breakpoint or closest smaller breakpoint
    const breakpointOrder: BreakpointKey[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl']
    const currentIndex = breakpointOrder.indexOf(breakpoint)
    
    // Search backwards from current breakpoint to find defined value
    for (let i = currentIndex; i >= 0; i--) {
      const bp = breakpointOrder[i]
      if (responsiveObj[bp] !== undefined) {
        return responsiveObj[bp]!
      }
    }
    
    // Fallback to any defined value
    for (const bp of breakpointOrder) {
      if (responsiveObj[bp] !== undefined) {
        return responsiveObj[bp]!
      }
    }
    
    // This shouldn't happen with proper TypeScript usage
    throw new Error('No responsive value found for any breakpoint')
  })
}

/**
 * Create a responsive value resolver for static resolution
 */
export function resolveResponsiveValue<T>(
  value: ResponsiveValue<T>, 
  targetBreakpoint?: BreakpointKey
): T {
  if (!isResponsiveValue(value)) {
    return value as T
  }
  
  const responsiveObj = value as Partial<Record<BreakpointKey, T>>
  const breakpoint = targetBreakpoint || getCurrentBreakpoint()()
  
  // Find value for target breakpoint or closest smaller breakpoint
  const breakpointOrder: BreakpointKey[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl']
  const targetIndex = breakpointOrder.indexOf(breakpoint)
  
  // Search backwards from target breakpoint
  for (let i = targetIndex; i >= 0; i--) {
    const bp = breakpointOrder[i]
    if (responsiveObj[bp] !== undefined) {
      return responsiveObj[bp]!
    }
  }
  
  // Fallback to any defined value
  for (const bp of breakpointOrder) {
    if (responsiveObj[bp] !== undefined) {
      return responsiveObj[bp]!
    }
  }
  
  throw new Error('No responsive value found for any breakpoint')
}

/**
 * Create responsive CSS custom properties (CSS variables)
 */
export function createResponsiveCSSVariables(
  prefix: string,
  values: Record<string, ResponsiveValue<string | number>>
): Record<string, string> {
  const cssVariables: Record<string, string> = {}
  
  for (const [key, value] of Object.entries(values)) {
    if (isResponsiveValue(value)) {
      const responsiveObj = value as Partial<Record<BreakpointKey, string | number>>
      
      // Create CSS variables for each breakpoint
      for (const [breakpoint, val] of Object.entries(responsiveObj)) {
        if (val !== undefined) {
          const varName = breakpoint === 'base' 
            ? `--${prefix}-${key}`
            : `--${prefix}-${key}-${breakpoint}`
          cssVariables[varName] = val.toString()
        }
      }
    } else {
      cssVariables[`--${prefix}-${key}`] = value.toString()
    }
  }
  
  return cssVariables
}

/**
 * Generate CSS media query string for common patterns
 */
export const MediaQueries = {
  // Viewport size queries
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)', 
  desktop: '(min-width: 1024px)',
  
  // Device orientation
  landscape: '(orientation: landscape)',
  portrait: '(orientation: portrait)',
  
  // Device pixel density
  highDPI: '(min-resolution: 2dppx)',
  lowDPI: '(max-resolution: 1dppx)',
  retinaDisplay: '(min-resolution: 2dppx)',
  standardDisplay: '(max-resolution: 1.9dppx)',
  
  // Color scheme preference
  darkMode: '(prefers-color-scheme: dark)',
  lightMode: '(prefers-color-scheme: light)',
  noColorSchemePreference: '(prefers-color-scheme: no-preference)',
  
  // Reduced motion preference
  reducedMotion: '(prefers-reduced-motion: reduce)',
  allowMotion: '(prefers-reduced-motion: no-preference)',
  
  // Contrast preference (accessibility)
  highContrast: '(prefers-contrast: high)',
  lowContrast: '(prefers-contrast: low)',
  normalContrast: '(prefers-contrast: no-preference)',
  
  // Data usage preference
  reduceData: '(prefers-reduced-data: reduce)',
  allowData: '(prefers-reduced-data: no-preference)',
  
  // Transparency preference
  reduceTransparency: '(prefers-reduced-transparency: reduce)',
  allowTransparency: '(prefers-reduced-transparency: no-preference)',
  
  // Hover capability
  canHover: '(hover: hover)',
  noHover: '(hover: none)',
  
  // Pointer capability
  finePointer: '(pointer: fine)',   // Mouse, trackpad
  coarsePointer: '(pointer: coarse)', // Touch
  
  // Any-hover (any input can hover)
  anyCanHover: '(any-hover: hover)',
  anyNoHover: '(any-hover: none)',
  
  // Any-pointer (any input type)
  anyFinePointer: '(any-pointer: fine)',
  anyCoarsePointer: '(any-pointer: coarse)',
  
  // Update preference
  slowUpdate: '(update: slow)',    // E-ink displays
  fastUpdate: '(update: fast)',    // Standard displays
  
  // Overflow-block capability
  blockScrolling: '(overflow-block: scroll)',
  blockPaged: '(overflow-block: paged)',
  
  // Overflow-inline capability
  inlineScrolling: '(overflow-inline: scroll)',
  
  // Forced colors (high contrast mode)
  forcedColors: '(forced-colors: active)',
  normalColors: '(forced-colors: none)',
  
  // Inverted colors
  invertedColors: '(inverted-colors: inverted)',
  normalInvertedColors: '(inverted-colors: none)',
  
  // Scripting capability
  scriptingEnabled: '(scripting: enabled)',
  scriptingDisabled: '(scripting: none)',
  scriptingInitialOnly: '(scripting: initial-only)',
  
  // Container queries (future)
  containerSmall: '(max-width: 400px)',
  containerMedium: '(min-width: 401px) and (max-width: 800px)',
  containerLarge: '(min-width: 801px)',
  
  // Custom breakpoint builders
  minWidth: (width: number | string) => `(min-width: ${width}${typeof width === 'number' ? 'px' : ''})`,
  maxWidth: (width: number | string) => `(max-width: ${width}${typeof width === 'number' ? 'px' : ''})`,
  between: (min: number | string, max: number | string) => 
    `(min-width: ${min}${typeof min === 'number' ? 'px' : ''}) and (max-width: ${max}${typeof max === 'number' ? 'px' : ''})`,
  
  // Height-based queries
  minHeight: (height: number | string) => `(min-height: ${height}${typeof height === 'number' ? 'px' : ''})`,
  maxHeight: (height: number | string) => `(max-height: ${height}${typeof height === 'number' ? 'px' : ''})`,
  heightBetween: (min: number | string, max: number | string) => 
    `(min-height: ${min}${typeof min === 'number' ? 'px' : ''}) and (max-height: ${max}${typeof max === 'number' ? 'px' : ''})`,
  
  // Aspect ratio queries
  square: '(aspect-ratio: 1/1)',
  landscape16_9: '(aspect-ratio: 16/9)',
  portrait9_16: '(aspect-ratio: 9/16)',
  widescreen: '(min-aspect-ratio: 16/9)',
  tallscreen: '(max-aspect-ratio: 9/16)',
  customAspectRatio: (ratio: string) => `(aspect-ratio: ${ratio})`,
  minAspectRatio: (ratio: string) => `(min-aspect-ratio: ${ratio})`,
  maxAspectRatio: (ratio: string) => `(max-aspect-ratio: ${ratio})`,
  
  // Resolution queries  
  lowRes: '(max-resolution: 120dpi)',
  standardRes: '(min-resolution: 120dpi) and (max-resolution: 192dpi)',
  highRes: '(min-resolution: 192dpi)',
  customResolution: (dpi: number) => `(min-resolution: ${dpi}dpi)`,
  
  // Print media
  print: 'print',
  screen: 'screen',
  speech: 'speech',
  
  // Device-specific queries (common patterns)
  iPhone: '(max-width: 428px)',
  iPad: '(min-width: 768px) and (max-width: 1024px)',
  desktopSmall: '(min-width: 1024px) and (max-width: 1440px)',
  desktopLarge: '(min-width: 1440px)',
  
  // Special conditions
  touchDevice: '(pointer: coarse)',
  mouseDevice: '(pointer: fine)',
  keyboardNavigation: '(hover: none) and (pointer: coarse)',
  
  // Modern display features
  wideColorGamut: '(color-gamut: p3)',
  standardColorGamut: '(color-gamut: srgb)',
  hdr: '(dynamic-range: high)',
  sdr: '(dynamic-range: standard)'
} as const

/**
 * Utility to combine multiple media queries
 */
export function combineMediaQueries(...queries: string[]): string {
  return queries.filter(q => q).join(' and ')
}

/**
 * Utility to create OR media queries
 */
export function orMediaQueries(...queries: string[]): string {
  return queries.filter(q => q).join(', ')
}

/**
 * Create a responsive show/hide utility
 */
export function createResponsiveVisibility(config: {
  showOn?: BreakpointKey[]
  hideOn?: BreakpointKey[]
}): Signal<boolean> {
  const currentBreakpoint = getCurrentBreakpoint()
  
  return createComputed(() => {
    const current = currentBreakpoint()
    
    if (config.hideOn && config.hideOn.includes(current)) {
      return false
    }
    
    if (config.showOn && !config.showOn.includes(current)) {
      return false
    }
    
    return true
  })
}

/**
 * Debug utility to log current responsive state
 */
export function logResponsiveState(): void {
  if (typeof window === 'undefined') return
  
  const context = createBreakpointContext()
  
  console.group('🔍 tachUI Responsive State')
  console.log('Current breakpoint:', context.current)
  console.log('Viewport dimensions:', `${context.width}x${context.height}`)
  console.log('Available breakpoints:', ['base', 'sm', 'md', 'lg', 'xl', '2xl'])
  
  // Test common media queries
  const commonQueries = {
    'Mobile': MediaQueries.mobile,
    'Tablet': MediaQueries.tablet,
    'Desktop': MediaQueries.desktop,
    'Dark mode': MediaQueries.darkMode,
    'Reduced motion': MediaQueries.reducedMotion,
    'Can hover': MediaQueries.canHover
  }
  
  console.log('Media query matches:')
  for (const [name, query] of Object.entries(commonQueries)) {
    console.log(`  ${name}: ${window.matchMedia(query).matches}`)
  }
  
  console.groupEnd()
}

/**
 * Utility function to wrap existing modifier builder with responsive capabilities
 */
export function withResponsive<T>(value: T): T {
  // For now, just return the value as-is
  // This would be enhanced to work with actual modifier builders
  return value
}

/**
 * Development-only responsive debugging overlay
 */
export function enableResponsiveDebugOverlay(options: {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  showDimensions?: boolean
  showBreakpoint?: boolean
} = {}): void {
  if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') {
    return
  }
  
  const { 
    position = 'top-right',
    showDimensions = true,
    showBreakpoint = true
  } = options
  
  // Create debug overlay element
  const overlay = document.createElement('div')
  overlay.id = 'tachui-responsive-debug'
  overlay.style.cssText = `
    position: fixed;
    ${position.includes('top') ? 'top: 10px' : 'bottom: 10px'};
    ${position.includes('right') ? 'right: 10px' : 'left: 10px'};
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
    z-index: 9999;
    pointer-events: none;
    white-space: pre-line;
  `
  
  document.body.appendChild(overlay)
  
  // Update overlay content
  function updateOverlay() {
    const context = createBreakpointContext()
    let content = ''
    
    if (showBreakpoint) {
      content += `Breakpoint: ${context.current}`
    }
    
    if (showDimensions) {
      if (content) content += '\n'
      content += `Size: ${context.width}×${context.height}`
    }
    
    overlay.textContent = content
  }
  
  // Initial update
  updateOverlay()
  
  // Update on resize
  window.addEventListener('resize', updateOverlay)
  
  // Log initial state
  logResponsiveState()
}