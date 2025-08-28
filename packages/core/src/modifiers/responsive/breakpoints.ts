/**
 * Breakpoint Configuration System
 * 
 * Manages responsive breakpoint configuration, validation, and utilities.
 * Supports both default Tailwind-inspired breakpoints and custom configurations.
 */

import { 
  BreakpointKey, 
  BreakpointConfig, 
  DEFAULT_BREAKPOINTS,
  BreakpointContext,
  isValidBreakpointKey
} from './types'
import { createSignal, Signal } from '../../reactive'

/**
 * Global breakpoint configuration state
 */
let currentBreakpointConfig: Required<BreakpointConfig> = { ...DEFAULT_BREAKPOINTS }

/**
 * Current active breakpoint signal
 */
const [currentBreakpoint, setCurrentBreakpoint] = createSignal<BreakpointKey>('base')

/**
 * Current viewport dimensions signal
 */
const [viewportDimensions, setViewportDimensions] = createSignal({ width: 0, height: 0 })

/**
 * Configure global breakpoints for the application
 */
export function configureBreakpoints(config: Partial<BreakpointConfig>): void {
  // Validate breakpoint configuration
  validateBreakpointConfig(config)
  
  // Update global configuration
  currentBreakpointConfig = {
    ...DEFAULT_BREAKPOINTS,
    ...config
  }
  
  // Re-evaluate current breakpoint
  updateCurrentBreakpoint()
  
  if (typeof window !== 'undefined') {
    // Update breakpoint on window resize
    window.addEventListener('resize', updateCurrentBreakpoint)
  }
}

/**
 * Get the current breakpoint configuration
 */
export function getCurrentBreakpointConfig(): Required<BreakpointConfig> {
  return { ...currentBreakpointConfig }
}

/**
 * Get the current active breakpoint
 */
export function getCurrentBreakpoint(): Signal<BreakpointKey> {
  return currentBreakpoint as Signal<BreakpointKey>
}

/**
 * Get current viewport dimensions
 */
export function getViewportDimensions(): Signal<{ width: number; height: number }> {
  return viewportDimensions as Signal<{ width: number; height: number }>
}

/**
 * Initialize the responsive system (should be called once on app startup)
 */
export function initializeResponsiveSystem(): void {
  if (typeof window === 'undefined') {
    return // Skip on server-side
  }
  
  // Set initial viewport dimensions
  updateViewportDimensions()
  updateCurrentBreakpoint()
  
  // Listen for window resize events
  window.addEventListener('resize', () => {
    updateViewportDimensions()
    updateCurrentBreakpoint()
  })
  
  // Listen for orientation changes
  window.addEventListener('orientationchange', () => {
    // Delay to ensure accurate dimensions after orientation change
    setTimeout(() => {
      updateViewportDimensions()
      updateCurrentBreakpoint()
    }, 100)
  })
}

/**
 * Create a breakpoint context for utilities
 */
export function createBreakpointContext(): BreakpointContext {
  const current = currentBreakpoint()
  const dimensions = viewportDimensions()
  
  return {
    current,
    width: dimensions.width,
    height: dimensions.height,
    isAbove: (breakpoint: BreakpointKey) => isBreakpointAbove(current, breakpoint),
    isBelow: (breakpoint: BreakpointKey) => isBreakpointBelow(current, breakpoint),
    isBetween: (min: BreakpointKey, max: BreakpointKey) => 
      isBreakpointAbove(current, min) && isBreakpointBelow(current, max),
    matches: (query: string) => window.matchMedia(query).matches
  }
}

/**
 * Convert breakpoint value to numeric pixels for comparison
 */
export function breakpointToPixels(breakpoint: BreakpointKey): number {
  const value = currentBreakpointConfig[breakpoint]
  
  // Handle different CSS units
  if (value.endsWith('px')) {
    return parseInt(value, 10)
  } else if (value.endsWith('em')) {
    return parseInt(value, 10) * 16 // Assume 16px base font size
  } else if (value.endsWith('rem')) {
    return parseInt(value, 10) * 16 // Assume 16px base font size
  }
  
  // Fallback to direct number conversion
  return parseInt(value, 10) || 0
}

/**
 * Get breakpoint index for comparison (base = 0, sm = 1, etc.)
 */
export function getBreakpointIndex(breakpoint: BreakpointKey): number {
  const order: BreakpointKey[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl']
  return order.indexOf(breakpoint)
}

/**
 * Check if breakpoint A is above breakpoint B
 */
export function isBreakpointAbove(a: BreakpointKey, b: BreakpointKey): boolean {
  return getBreakpointIndex(a) > getBreakpointIndex(b)
}

/**
 * Check if breakpoint A is below breakpoint B
 */
export function isBreakpointBelow(a: BreakpointKey, b: BreakpointKey): boolean {
  return getBreakpointIndex(a) < getBreakpointIndex(b)
}

/**
 * Generate CSS media query string for a breakpoint
 */
export function generateMediaQuery(breakpoint: BreakpointKey): string {
  if (breakpoint === 'base') {
    return '' // No media query for base (mobile-first)
  }
  
  const minWidth = currentBreakpointConfig[breakpoint]
  return `(min-width: ${minWidth})`
}

/**
 * Generate CSS media query for a range of breakpoints
 */
export function generateRangeMediaQuery(min: BreakpointKey, max?: BreakpointKey): string {
  const queries: string[] = []
  
  if (min !== 'base') {
    queries.push(`(min-width: ${currentBreakpointConfig[min]})`)
  }
  
  if (max && max !== '2xl') {
    const maxBreakpoints: BreakpointKey[] = ['sm', 'md', 'lg', 'xl', '2xl']
    const maxIndex = maxBreakpoints.indexOf(max)
    if (maxIndex >= 0 && maxIndex < maxBreakpoints.length - 1) {
      const nextBreakpoint = maxBreakpoints[maxIndex + 1]
      const maxWidth = `${breakpointToPixels(nextBreakpoint) - 1}px`
      queries.push(`(max-width: ${maxWidth})`)
    }
  }
  
  return queries.length > 0 ? queries.join(' and ') : ''
}

/**
 * Get all breakpoints sorted by size
 */
export function getSortedBreakpoints(): BreakpointKey[] {
  return ['base', 'sm', 'md', 'lg', 'xl', '2xl']
}

/**
 * Get breakpoints above a given breakpoint
 */
export function getBreakpointsAbove(breakpoint: BreakpointKey): BreakpointKey[] {
  const sorted = getSortedBreakpoints()
  const index = sorted.indexOf(breakpoint)
  return index >= 0 ? sorted.slice(index + 1) : []
}

/**
 * Get breakpoints below a given breakpoint
 */
export function getBreakpointsBelow(breakpoint: BreakpointKey): BreakpointKey[] {
  const sorted = getSortedBreakpoints()
  const index = sorted.indexOf(breakpoint)
  return index > 0 ? sorted.slice(0, index) : []
}

/**
 * Resolve current breakpoint based on viewport width
 */
function updateCurrentBreakpoint(): void {
  if (typeof window === 'undefined') {
    return
  }
  
  const width = window.innerWidth
  const breakpoints = getSortedBreakpoints().reverse() // Start from largest
  
  for (const breakpoint of breakpoints) {
    if (breakpoint === 'base' || width >= breakpointToPixels(breakpoint)) {
      setCurrentBreakpoint(breakpoint)
      return
    }
  }
  
  setCurrentBreakpoint('base')
}

/**
 * Update viewport dimensions
 */
function updateViewportDimensions(): void {
  if (typeof window !== 'undefined') {
    setViewportDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    })
  }
}

/**
 * Validate breakpoint configuration
 */
function validateBreakpointConfig(config: Partial<BreakpointConfig>): void {
  for (const [key, value] of Object.entries(config)) {
    if (!isValidBreakpointKey(key)) {
      throw new Error(`Invalid breakpoint key: "${key}". Valid keys are: base, sm, md, lg, xl, 2xl`)
    }
    
    if (typeof value !== 'string') {
      throw new Error(`Breakpoint value for "${key}" must be a string (e.g., "768px")`)
    }
    
    if (!value.match(/^\d+(\.\d+)?(px|em|rem|%)$/)) {
      throw new Error(`Invalid breakpoint value for "${key}": "${value}". Must be a valid CSS length (e.g., "768px", "48em")`)
    }
  }
  
  // Validate that breakpoints are in ascending order
  const sortedKeys = Object.keys(config).filter(isValidBreakpointKey).sort((a, b) => {
    return getBreakpointIndex(a as BreakpointKey) - getBreakpointIndex(b as BreakpointKey)
  })
  
  for (let i = 1; i < sortedKeys.length; i++) {
    const prev = sortedKeys[i - 1] as BreakpointKey
    const current = sortedKeys[i] as BreakpointKey
    const prevValue = config[prev]!
    const currentValue = config[current]!
    
    if (breakpointToPixels(prev) >= parseInt(currentValue, 10)) {
      throw new Error(`Breakpoint "${current}" (${currentValue}) must be larger than "${prev}" (${prevValue})`)
    }
  }
}

/**
 * Create common breakpoint configurations
 */
export const BreakpointPresets = {
  // Tailwind CSS (default)
  tailwind: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  } as BreakpointConfig,
  
  // Bootstrap
  bootstrap: {
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px',
    '2xl': '1400px'
  } as BreakpointConfig,
  
  // Material Design
  material: {
    sm: '600px',
    md: '960px',
    lg: '1280px',
    xl: '1920px',
    '2xl': '2560px'
  } as BreakpointConfig,
  
  // Custom mobile-first
  mobileFocus: {
    sm: '480px',
    md: '768px',
    lg: '1024px',
    xl: '1200px',
    '2xl': '1440px'
  } as BreakpointConfig
} as const