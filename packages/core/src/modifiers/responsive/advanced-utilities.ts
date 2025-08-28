/**
 * Advanced Responsive Utilities
 * 
 * Provides programmatic access to responsive behavior, advanced hooks,
 * and complex responsive logic utilities for sophisticated applications.
 */

import { createSignal, createComputed, createEffect, createMemo, Signal } from '../../reactive'
import { 
  ResponsiveValue, 
  BreakpointKey, 
  BreakpointContext,
  isResponsiveValue 
} from './types'
import { 
  getCurrentBreakpoint, 
  getBreakpointIndex, 
  createBreakpointContext,
  getCurrentBreakpointConfig 
} from './breakpoints'

/**
 * Advanced breakpoint utilities with enhanced functionality
 */
export class AdvancedBreakpointUtils {
  /**
   * Create a responsive value resolver with custom logic
   */
  static createResponsiveResolver<T>(
    getValue: (breakpoint: BreakpointKey, context: BreakpointContext) => T,
    dependencies: Signal<any>[] = []
  ): Signal<T> {
    const currentBreakpoint = getCurrentBreakpoint()
    
    return createComputed(() => {
      // Include dependencies in computation
      dependencies.forEach(dep => dep())
      
      const breakpoint = currentBreakpoint()
      const context = createBreakpointContext()
      return getValue(breakpoint, context)
    })
  }
  
  /**
   * Create responsive value that interpolates between breakpoints
   */
  static createInterpolatedValue(
    values: Partial<Record<BreakpointKey, number>>,
    options: {
      smoothing?: 'linear' | 'ease' | 'ease-in' | 'ease-out'
      clamp?: boolean
    } = {}
  ): Signal<number> {
    const { smoothing = 'linear', clamp = true } = options
    
    return createComputed(() => {
      const context = createBreakpointContext()
      const width = context.width
      const breakpointConfig = getCurrentBreakpointConfig()
      
      // Convert breakpoint values to numeric widths
      const sortedPoints: Array<{ width: number; value: number }> = []
      
      for (const [bp, value] of Object.entries(values)) {
        if (value !== undefined) {
          const bpWidth = bp === 'base' ? 0 : parseInt(breakpointConfig[bp as BreakpointKey] || '0')
          sortedPoints.push({ width: bpWidth, value })
        }
      }
      
      sortedPoints.sort((a, b) => a.width - b.width)
      
      if (sortedPoints.length === 0) return 0
      if (sortedPoints.length === 1) return sortedPoints[0].value
      
      // Find interpolation points
      let lowerPoint = sortedPoints[0]
      let upperPoint = sortedPoints[sortedPoints.length - 1]
      
      for (let i = 0; i < sortedPoints.length - 1; i++) {
        if (width >= sortedPoints[i].width && width <= sortedPoints[i + 1].width) {
          lowerPoint = sortedPoints[i]
          upperPoint = sortedPoints[i + 1]
          break
        }
      }
      
      // Handle edge cases
      if (clamp) {
        if (width <= lowerPoint.width) return lowerPoint.value
        if (width >= upperPoint.width) return upperPoint.value
      }
      
      // Calculate interpolation factor
      const factor = (width - lowerPoint.width) / (upperPoint.width - lowerPoint.width)
      
      // Apply smoothing function
      let smoothedFactor = factor
      switch (smoothing) {
        case 'ease':
          smoothedFactor = 0.5 - 0.5 * Math.cos(factor * Math.PI)
          break
        case 'ease-in':
          smoothedFactor = factor * factor
          break
        case 'ease-out':
          smoothedFactor = 1 - (1 - factor) * (1 - factor)
          break
        case 'linear':
        default:
          smoothedFactor = factor
          break
      }
      
      // Interpolate value
      return lowerPoint.value + (upperPoint.value - lowerPoint.value) * smoothedFactor
    }) as Signal<number>
  }
  
  /**
   * Create conditional responsive behavior
   */
  static createConditionalResponsive<T>(
    condition: (context: BreakpointContext) => boolean,
    trueValue: ResponsiveValue<T>,
    falseValue: ResponsiveValue<T>
  ): Signal<T> {
    const currentBreakpoint = getCurrentBreakpoint()
    
    return createComputed(() => {
      const context = createBreakpointContext()
      const shouldUseTrue = condition(context)
      const activeValue = shouldUseTrue ? trueValue : falseValue
      
      return this.resolveResponsiveValue(activeValue, currentBreakpoint())
    })
  }
  
  /**
   * Resolve responsive value at specific breakpoint
   */
  private static resolveResponsiveValue<T>(
    value: ResponsiveValue<T>,
    breakpoint: BreakpointKey
  ): T {
    if (!isResponsiveValue(value)) {
      return value as T
    }
    
    const responsiveObj = value as Partial<Record<BreakpointKey, T>>
    const breakpointOrder: BreakpointKey[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl']
    const currentIndex = breakpointOrder.indexOf(breakpoint)
    
    // Search backwards from current breakpoint
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
    
    throw new Error('No responsive value found')
  }
}

/**
 * Advanced responsive hooks for complex scenarios
 */
export class ResponsiveHooks {
  /**
   * Hook for responsive arrays (e.g., responsive grid columns data)
   */
  static useResponsiveArray<T>(
    arrays: Partial<Record<BreakpointKey, T[]>>
  ): Signal<T[]> {
    const currentBreakpoint = getCurrentBreakpoint()
    
    return createComputed(() => {
      const breakpoint = currentBreakpoint()
      return AdvancedBreakpointUtils['resolveResponsiveValue'](arrays, breakpoint) || []
    })
  }
  
  /**
   * Hook for responsive object selection
   */
  static useResponsiveObject<T extends Record<string, any>>(
    objects: Partial<Record<BreakpointKey, T>>
  ): Signal<T | null> {
    const currentBreakpoint = getCurrentBreakpoint()
    
    return createComputed(() => {
      const breakpoint = currentBreakpoint()
      try {
        return AdvancedBreakpointUtils['resolveResponsiveValue'](objects, breakpoint)
      } catch {
        return null
      }
    })
  }
  
  /**
   * Hook for responsive function selection and execution
   */
  static useResponsiveFunction<TArgs extends any[], TReturn>(
    functions: Partial<Record<BreakpointKey, (...args: TArgs) => TReturn>>
  ): Signal<((...args: TArgs) => TReturn) | null> {
    const currentBreakpoint = getCurrentBreakpoint()
    
    return createComputed(() => {
      const breakpoint = currentBreakpoint()
      try {
        return AdvancedBreakpointUtils['resolveResponsiveValue'](functions, breakpoint)
      } catch {
        return null
      }
    })
  }
  
  /**
   * Hook for responsive state management
   */
  static useResponsiveState<T>(
    initialValues: Partial<Record<BreakpointKey, T>>
  ): [Signal<T | undefined>, (value: T | Partial<Record<BreakpointKey, T>>) => void] {
    const [state, setState] = createSignal<Partial<Record<BreakpointKey, T>>>(initialValues)
    const currentBreakpoint = getCurrentBreakpoint()
    
    const currentValue = createComputed(() => {
      const stateObj = state()
      const breakpoint = currentBreakpoint()
      
      try {
        return AdvancedBreakpointUtils['resolveResponsiveValue'](stateObj, breakpoint)
      } catch {
        return undefined
      }
    })
    
    const setResponsiveState = (value: T | Partial<Record<BreakpointKey, T>>) => {
      if (isResponsiveValue(value)) {
        setState(value as Partial<Record<BreakpointKey, T>>)
      } else {
        setState({ [currentBreakpoint()]: value as T })
      }
    }
    
    return [currentValue, setResponsiveState]
  }
  
  /**
   * Hook for responsive computations with memoization
   */
  static useResponsiveComputation<T>(
    computation: (context: BreakpointContext) => T,
    dependencies: Signal<any>[] = []
  ): Signal<T> {
    return createMemo(() => {
      // Include dependencies
      dependencies.forEach(dep => dep())
      
      const context = createBreakpointContext()
      return computation(context)
    })
  }
  
  /**
   * Hook for responsive side effects
   */
  static useResponsiveEffect(
    effect: (context: BreakpointContext, prevContext?: BreakpointContext) => void | (() => void),
    dependencies: Signal<any>[] = []
  ): void {
    let cleanup: (() => void) | undefined
    let prevContext: BreakpointContext | undefined
    
    createEffect(() => {
      // Include dependencies
      dependencies.forEach(dep => dep())
      
      const context = createBreakpointContext()
      
      // Run cleanup from previous effect
      if (cleanup) {
        cleanup()
        cleanup = undefined
      }
      
      // Run the effect
      const result = effect(context, prevContext)
      
      if (typeof result === 'function') {
        cleanup = result
      }
      
      prevContext = context
    })
  }
}

/**
 * Responsive breakpoint targeting utilities
 */
export class ResponsiveTargeting {
  /**
   * Execute callback only on specific breakpoints
   */
  static onBreakpoints(
    breakpoints: BreakpointKey[],
    callback: (context: BreakpointContext) => void | (() => void)
  ): () => void {
    let cleanup: (() => void) | undefined
    
    createEffect(() => {
      const context = createBreakpointContext()
      
      if (breakpoints.includes(context.current)) {
        // Run cleanup from previous execution
        if (cleanup) {
          cleanup()
          cleanup = undefined
        }
        
        // Execute callback
        const result = callback(context)
        if (typeof result === 'function') {
          cleanup = result
        }
      }
    })
    
    return () => {
      if (cleanup) cleanup()
    }
  }
  
  /**
   * Execute callback when breakpoint changes
   */
  static onBreakpointChange(
    callback: (newBreakpoint: BreakpointKey, oldBreakpoint: BreakpointKey, context: BreakpointContext) => void
  ): () => void {
    let oldBreakpoint: BreakpointKey | undefined
    
    createEffect(() => {
      const context = createBreakpointContext()
      const newBreakpoint = context.current
      
      if (oldBreakpoint && oldBreakpoint !== newBreakpoint) {
        callback(newBreakpoint, oldBreakpoint, context)
      }
      
      oldBreakpoint = newBreakpoint
    })
    
    return () => {
      // No-op for now since createEffect doesn't return dispose function
    }
  }
  
  /**
   * Execute callback when entering/leaving specific breakpoint ranges
   */
  static onBreakpointRange(
    minBreakpoint: BreakpointKey,
    maxBreakpoint: BreakpointKey,
    callbacks: {
      onEnter?: (context: BreakpointContext) => void | (() => void)
      onLeave?: (context: BreakpointContext) => void
      onWithin?: (context: BreakpointContext) => void | (() => void)
    }
  ): () => void {
    let isWithinRange = false
    let withinCleanup: (() => void) | undefined
    let enterCleanup: (() => void) | undefined
    
    createEffect(() => {
      const context = createBreakpointContext()
      const currentIndex = getBreakpointIndex(context.current)
      const minIndex = getBreakpointIndex(minBreakpoint)
      const maxIndex = getBreakpointIndex(maxBreakpoint)
      
      const nowWithinRange = currentIndex >= minIndex && currentIndex <= maxIndex
      
      if (nowWithinRange && !isWithinRange) {
        // Entering range
        if (callbacks.onEnter) {
          const result = callbacks.onEnter(context)
          if (typeof result === 'function') {
            enterCleanup = result
          }
        }
        isWithinRange = true
      } else if (!nowWithinRange && isWithinRange) {
        // Leaving range
        if (enterCleanup) {
          enterCleanup()
          enterCleanup = undefined
        }
        if (withinCleanup) {
          withinCleanup()
          withinCleanup = undefined
        }
        if (callbacks.onLeave) {
          callbacks.onLeave(context)
        }
        isWithinRange = false
      }
      
      if (nowWithinRange && callbacks.onWithin) {
        // Within range
        if (withinCleanup) {
          withinCleanup()
          withinCleanup = undefined
        }
        
        const result = callbacks.onWithin(context)
        if (typeof result === 'function') {
          withinCleanup = result
        }
      }
    })
    
    return () => {
      if (enterCleanup) enterCleanup()
      if (withinCleanup) withinCleanup()
    }
  }
}

/**
 * Responsive data management utilities
 */
export class ResponsiveDataUtils {
  /**
   * Create responsive pagination
   */
  static createResponsivePagination<T>(
    data: T[],
    itemsPerPage: ResponsiveValue<number>
  ): {
    currentPage: Signal<number>
    totalPages: Signal<number>
    currentItems: Signal<T[]>
    setPage: (page: number) => void
    nextPage: () => void
    prevPage: () => void
    hasNext: Signal<boolean>
    hasPrev: Signal<boolean>
  } {
    const [currentPage, setCurrentPage] = createSignal(1)
    const currentBreakpoint = getCurrentBreakpoint()
    
    const itemsPerPageResolved = createComputed(() => {
      const breakpoint = currentBreakpoint()
      return AdvancedBreakpointUtils['resolveResponsiveValue'](itemsPerPage, breakpoint)
    }) as Signal<number>
    
    const totalPages = createComputed(() => {
      return Math.ceil(data.length / itemsPerPageResolved())
    }) as Signal<number>
    
    const currentItems = createComputed(() => {
      const itemsCount = itemsPerPageResolved()
      const page = currentPage()
      const startIndex = (page - 1) * itemsCount
      const endIndex = startIndex + itemsCount
      return data.slice(startIndex, endIndex)
    }) as Signal<T[]>
    
    const hasNext = createComputed(() => currentPage() < totalPages()) as Signal<boolean>
    const hasPrev = createComputed(() => currentPage() > 1) as Signal<boolean>
    
    const setPage = (page: number) => {
      const maxPage = totalPages()
      setCurrentPage(Math.max(1, Math.min(page, maxPage)))
    }
    
    const nextPage = () => {
      if (hasNext()) {
        setCurrentPage(currentPage() + 1)
      }
    }
    
    const prevPage = () => {
      if (hasPrev()) {
        setCurrentPage(currentPage() - 1)
      }
    }
    
    // Reset to page 1 when items per page changes
    createEffect(() => {
      itemsPerPageResolved() // Subscribe to changes
      setCurrentPage(1)
    })
    
    return {
      currentPage: currentPage as Signal<number>,
      totalPages,
      currentItems,
      setPage,
      nextPage,
      prevPage,
      hasNext,
      hasPrev
    }
  }
  
  /**
   * Create responsive filtering
   */
  static createResponsiveFilter<T>(
    data: T[],
    filters: Partial<Record<BreakpointKey, (item: T) => boolean>>
  ): Signal<T[]> {
    const currentBreakpoint = getCurrentBreakpoint()
    
    return createComputed(() => {
      const breakpoint = currentBreakpoint()
      const filter = AdvancedBreakpointUtils['resolveResponsiveValue'](filters, breakpoint)
      
      if (!filter) return data
      return data.filter(filter)
    }) as Signal<T[]>
  }
  
  /**
   * Create responsive sorting
   */
  static createResponsiveSort<T>(
    data: T[],
    sorters: Partial<Record<BreakpointKey, (a: T, b: T) => number>>
  ): Signal<T[]> {
    const currentBreakpoint = getCurrentBreakpoint()
    
    return createComputed(() => {
      const breakpoint = currentBreakpoint()
      const sorter = AdvancedBreakpointUtils['resolveResponsiveValue'](sorters, breakpoint)
      
      if (!sorter) return data
      return [...data].sort(sorter)
    }) as Signal<T[]>
  }
}

/**
 * Export all advanced utilities
 */
export const ResponsiveAdvanced = {
  Breakpoints: AdvancedBreakpointUtils,
  Hooks: ResponsiveHooks,
  Targeting: ResponsiveTargeting,
  Data: ResponsiveDataUtils
}