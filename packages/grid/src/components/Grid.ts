/**
 * Grid Layout Components (Phase 1)
 *
 * SwiftUI-inspired Grid components with CSS Grid integration.
 * Provides Grid, GridRow, LazyVGrid, and LazyHGrid components
 * that mirror SwiftUI's grid system while leveraging modern CSS Grid capabilities.
 */

import type { ModifiableComponent, ModifierBuilder } from '@tachui/core'
import type { ComponentInstance, ComponentProps } from '@tachui/core'
import { withModifiers } from '@tachui/core'
import { processElementOverride, type ElementOverrideProps } from '@tachui/core'
import { ComponentWithCSSClasses, type CSSClassesProps } from '@tachui/core'
import { useLifecycle } from '@tachui/core'
import { registerComponentWithLifecycleHooks } from '@tachui/core'
import type { ResponsiveValue } from '@tachui/core'
import {
  GridResponsiveUtils,
  createResponsiveGridModifier,
  GridDebugger,
  GridPerformanceMonitor,
  type EnhancedResponsiveGridConfig,
} from './GridResponsive'
import { transition } from '@tachui/core'

// Lazy import debug manager to avoid circular dependencies
let debugManager: any = null
const getDebugManager = () => {
  if (!debugManager) {
    try {
      const debugModule = require('../debug')
      debugManager = debugModule.debugManager
    } catch {
      // Debug module not available, create a mock
      debugManager = {
        isEnabled: () => false,
        logComponent: () => {},
      }
    }
  }
  return debugManager
}

/**
 * GridItem sizing configuration (SwiftUI-equivalent)
 */
export interface GridItemConfig {
  type: 'fixed' | 'flexible' | 'adaptive'
  size?: number
  minimum?: number
  maximum?: number
  spacing?: number
}

/**
 * Grid item spanning configuration (Phase 3)
 */
export interface GridSpanConfig {
  columnSpan?: number
  rowSpan?: number
  columnStart?: number
  rowStart?: number
  area?: string
  alignment?: 'start' | 'center' | 'end' | 'stretch'
}

/**
 * Enhanced grid item with spanning support (Phase 3)
 */
export interface EnhancedGridItemConfig extends GridItemConfig {
  span?: GridSpanConfig
}

/**
 * GridItem factory class - matches SwiftUI GridItem exactly
 */
export class GridItem {
  /**
   * Fixed-size grid column/row
   */
  static fixed(size: number, spacing?: number): GridItemConfig {
    return {
      type: 'fixed',
      size,
      spacing,
    }
  }

  /**
   * Flexible grid column/row with optional constraints
   */
  static flexible(minimum: number = 0, maximum?: number): GridItemConfig {
    return {
      type: 'flexible',
      minimum,
      maximum,
    }
  }

  /**
   * Adaptive grid column/row with minimum size
   */
  static adaptive(minimum: number, maximum?: number): GridItemConfig {
    return {
      type: 'adaptive',
      minimum,
      maximum,
    }
  }

  /**
   * Create spanning configuration for grid items (Phase 3)
   */
  static spanning(config: GridSpanConfig): GridSpanConfig {
    return config
  }

  /**
   * Create enhanced grid item with spanning support (Phase 3)
   */
  static withSpan(
    baseConfig: GridItemConfig,
    spanConfig: GridSpanConfig
  ): EnhancedGridItemConfig {
    return {
      ...baseConfig,
      span: spanConfig,
    }
  }
}

/**
 * Responsive grid configuration for breakpoint-aware layouts
 */
export type ResponsiveGridItemConfig = {
  base?: GridItemConfig[]
  sm?: GridItemConfig[]
  md?: GridItemConfig[]
  lg?: GridItemConfig[]
  xl?: GridItemConfig[]
  xxl?: GridItemConfig[]
}

/**
 * Grid alignment options (SwiftUI-equivalent)
 */
export type GridAlignment =
  | 'topLeading'
  | 'top'
  | 'topTrailing'
  | 'leading'
  | 'center'
  | 'trailing'
  | 'bottomLeading'
  | 'bottom'
  | 'bottomTrailing'

/**
 * Base Grid component properties
 */
export interface BaseGridProps
  extends ComponentProps,
    ElementOverrideProps,
    CSSClassesProps {
  children?: ComponentInstance[]
  alignment?: GridAlignment
  spacing?: number | { horizontal?: number; vertical?: number }
  debugLabel?: string
  /** Animation configuration for grid layout changes (Phase 3) */
  animations?: GridAnimationConfig
  /** Accessibility configuration for grid components (Phase 3) */
  accessibility?: GridAccessibilityConfig
  /** Advanced styling configuration for grid components (Phase 3) */
  styling?: GridStylingConfig
}

/**
 * Grid component properties (explicit row/column control)
 */
export interface GridProps extends BaseGridProps {
  // Grid uses explicit rows defined by GridRow children
}

/**
 * LazyVGrid component properties (vertical scrolling with flexible columns)
 */
export interface LazyVGridProps extends BaseGridProps {
  columns:
    | GridItemConfig[]
    | ResponsiveGridItemConfig
    | ResponsiveValue<GridItemConfig[]>
  pinnedViews?: ('sectionHeaders' | 'sectionFooters')[]
  /** Enhanced responsive configuration (Phase 2) */
  responsive?: EnhancedResponsiveGridConfig
  /** Sectioned data with headers/footers (Phase 3) */
  sections?: GridSection[]
}

/**
 * LazyHGrid component properties (horizontal scrolling with flexible rows)
 */
export interface LazyHGridProps extends BaseGridProps {
  rows:
    | GridItemConfig[]
    | ResponsiveGridItemConfig
    | ResponsiveValue<GridItemConfig[]>
  pinnedViews?: ('sectionHeaders' | 'sectionFooters')[]
  /** Enhanced responsive configuration (Phase 2) */
  responsive?: EnhancedResponsiveGridConfig
  /** Sectioned data with headers/footers (Phase 3) */
  sections?: GridSection[]
}

/**
 * Grid animation configuration (Phase 3)
 */
export interface GridAnimationConfig {
  /** Enable layout animations when grid structure changes */
  layoutChanges?:
    | boolean
    | {
        duration?: number
        easing?: string
        delay?: number
      }
  /** Enable animations when items are added/removed */
  itemChanges?:
    | boolean
    | {
        enter?: {
          duration?: number
          easing?: string
          delay?: number
          from?:
            | 'fade'
            | 'scale'
            | 'slide-up'
            | 'slide-down'
            | 'slide-left'
            | 'slide-right'
        }
        exit?: {
          duration?: number
          easing?: string
          delay?: number
          to?:
            | 'fade'
            | 'scale'
            | 'slide-up'
            | 'slide-down'
            | 'slide-left'
            | 'slide-right'
        }
      }
  /** Enable animations for responsive breakpoint changes */
  responsive?:
    | boolean
    | {
        duration?: number
        easing?: string
        delay?: number
      }
  /** Enable animations for section header/footer changes */
  sections?:
    | boolean
    | {
        duration?: number
        easing?: string
        delay?: number
      }
}

/**
 * Grid accessibility configuration (Phase 3)
 */
export interface GridAccessibilityConfig {
  /** Main accessibility label for the grid */
  label?: string
  /** Description of the grid's purpose */
  description?: string
  /** ARIA role override (defaults to 'grid' for data grids, 'group' for layout grids) */
  role?: 'grid' | 'group' | 'list' | 'region'
  /** Enable keyboard navigation between grid items */
  keyboardNavigation?:
    | boolean
    | {
        enabled?: boolean
        /** Arrow key behavior: 'grid' for 2D navigation, 'list' for linear navigation */
        mode?: 'grid' | 'list'
        /** Enable page up/down navigation */
        pageNavigation?: boolean
        /** Enable home/end navigation */
        homeEndNavigation?: boolean
      }
  /** Enable focus management */
  focusManagement?:
    | boolean
    | {
        enabled?: boolean
        /** Focus trap within grid */
        trapFocus?: boolean
        /** Restore focus when grid is unmounted */
        restoreFocus?: boolean
        /** Skip links for screen readers */
        skipLinks?: boolean
      }
  /** Screen reader optimizations */
  screenReader?:
    | boolean
    | {
        enabled?: boolean
        /** Announce grid structure changes */
        announceChanges?: boolean
        /** Provide row/column count information */
        announceStructure?: boolean
        /** Announce item positions */
        announcePositions?: boolean
      }
  /** Reduced motion support */
  reducedMotion?:
    | boolean
    | {
        respectPreference?: boolean
        fallbackBehavior?: 'disable' | 'reduce' | 'instant'
      }
}

/**
 * Advanced grid styling configuration (Phase 3)
 */
export interface GridStylingConfig {
  /** Custom grid template areas for named grid positioning */
  templateAreas?: string[]
  /** Advanced gap configuration with different spacing for different breakpoints */
  advancedGap?: {
    row?: number | string | { [breakpoint: string]: number | string }
    column?: number | string | { [breakpoint: string]: number | string }
  }
  /** Grid debugging and overlay styles */
  debug?:
    | boolean
    | {
        enabled?: boolean
        /** Show grid lines */
        showLines?: boolean
        /** Show grid areas */
        showAreas?: boolean
        /** Grid line color */
        lineColor?: string
        /** Grid line style */
        lineStyle?: 'solid' | 'dashed' | 'dotted'
        /** Show item numbers */
        showItemNumbers?: boolean
      }
  /** Theme integration */
  theme?: {
    /** Use theme-based grid colors */
    useThemeColors?: boolean
    /** Custom theme variant */
    variant?: string
    /** Grid-specific theme overrides */
    overrides?: Record<string, string | number>
  }
  /** Advanced hover and focus states */
  itemStates?: {
    /** Grid item hover effects */
    hover?: {
      enabled?: boolean
      transform?: 'scale' | 'lift' | 'glow' | 'highlight'
      transition?: string
      customCSS?: Record<string, string>
    }
    /** Grid item focus effects */
    focus?: {
      enabled?: boolean
      style?: 'ring' | 'outline' | 'background' | 'border'
      color?: string
      customCSS?: Record<string, string>
    }
    /** Grid item active/pressed effects */
    active?: {
      enabled?: boolean
      transform?: 'scale' | 'inset' | 'darken'
      customCSS?: Record<string, string>
    }
  }
  /** Grid container styling */
  container?: {
    /** Background patterns or overlays */
    background?:
      | string
      | {
          pattern?: 'dots' | 'lines' | 'grid' | 'none'
          color?: string
          opacity?: number
        }
    /** Container border and shadow */
    border?: string
    borderRadius?: number | string
    boxShadow?: string
    /** Container padding */
    padding?:
      | number
      | string
      | {
          top?: number | string
          right?: number | string
          bottom?: number | string
          left?: number | string
        }
  }
}

/**
 * Grid section configuration (Phase 3)
 */
export interface GridSection {
  id: string
  header?: ComponentInstance | string
  footer?: ComponentInstance | string
  items: ComponentInstance[]
  headerStyle?: 'automatic' | 'grouped' | 'plain' | 'sticky'
  footerStyle?: 'automatic' | 'grouped' | 'plain' | 'sticky'
}

/**
 * Grid section header/footer properties (Phase 3)
 */
export interface GridSectionHeaderProps
  extends ComponentProps,
    ElementOverrideProps,
    CSSClassesProps {
  content: ComponentInstance | string
  sectionId: string
  type: 'header' | 'footer'
  style: 'automatic' | 'grouped' | 'plain' | 'sticky'
  debugLabel?: string
}

/**
 * GridRow component properties
 */
export interface GridRowProps
  extends ComponentProps,
    ElementOverrideProps,
    CSSClassesProps {
  children?: ComponentInstance[]
  alignment?: 'leading' | 'center' | 'trailing'
  debugLabel?: string
}

/**
 * CSS Grid generation utilities
 */
class GridCSSGenerator {
  /**
   * Generate CSS grid-template-columns from GridItem configurations
   */
  static generateColumns(items: GridItemConfig[]): string {
    return items
      .map(item => {
        switch (item.type) {
          case 'fixed':
            return `${item.size}px`
          case 'flexible':
            const minSize = item.minimum || 0
            const maxSize = item.maximum ? `${item.maximum}px` : '1fr'
            return minSize > 0 ? `minmax(${minSize}px, ${maxSize})` : '1fr'
          case 'adaptive':
            const adaptiveMin = item.minimum
            const adaptiveMax = item.maximum ? `${item.maximum}px` : '1fr'
            return `minmax(${adaptiveMin}px, ${adaptiveMax})`
          default:
            return '1fr'
        }
      })
      .join(' ')
  }

  /**
   * Generate CSS grid-template-rows from GridItem configurations
   */
  static generateRows(items: GridItemConfig[]): string {
    return this.generateColumns(items) // Same logic applies
  }

  /**
   * Generate responsive CSS for grid layouts
   */
  static generateResponsiveGridCSS(
    config: ResponsiveGridItemConfig,
    property: 'grid-template-columns' | 'grid-template-rows'
  ): Record<string, string | Record<string, string>> {
    const responsiveCSS: Record<string, string | Record<string, string>> = {}

    if (config.base) {
      responsiveCSS[property] =
        property === 'grid-template-columns'
          ? this.generateColumns(config.base)
          : this.generateRows(config.base)
    }

    // Generate media queries for other breakpoints
    const breakpoints = {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      xxl: '1536px',
    }

    Object.entries(breakpoints).forEach(([breakpoint, minWidth]) => {
      const breakpointConfig =
        config[breakpoint as keyof ResponsiveGridItemConfig]
      if (breakpointConfig) {
        const mediaQuery = `@media (min-width: ${minWidth})`
        const gridValue =
          property === 'grid-template-columns'
            ? this.generateColumns(breakpointConfig)
            : this.generateRows(breakpointConfig)

        if (!responsiveCSS[mediaQuery]) {
          responsiveCSS[mediaQuery] = {}
        }
        const existing = responsiveCSS[mediaQuery] as Record<string, string>
        responsiveCSS[mediaQuery] = {
          ...existing,
          [property]: gridValue,
        }
      }
    })

    return responsiveCSS
  }

  /**
   * Convert spacing configuration to CSS gap values
   */
  static generateSpacing(
    spacing?: number | { horizontal?: number; vertical?: number }
  ): string {
    if (typeof spacing === 'number') {
      return `${spacing}px`
    }
    if (spacing && typeof spacing === 'object') {
      const horizontal = spacing.horizontal ?? 0
      const vertical = spacing.vertical ?? 0
      return `${vertical}px ${horizontal}px`
    }
    return '0'
  }

  /**
   * Convert GridAlignment to CSS grid alignment properties
   */
  static generateAlignment(alignment: GridAlignment): {
    justifyItems?: string
    alignItems?: string
  } {
    const alignmentMap: Record<
      GridAlignment,
      { justifyItems: string; alignItems: string }
    > = {
      topLeading: { justifyItems: 'start', alignItems: 'start' },
      top: { justifyItems: 'center', alignItems: 'start' },
      topTrailing: { justifyItems: 'end', alignItems: 'start' },
      leading: { justifyItems: 'start', alignItems: 'center' },
      center: { justifyItems: 'center', alignItems: 'center' },
      trailing: { justifyItems: 'end', alignItems: 'center' },
      bottomLeading: { justifyItems: 'start', alignItems: 'end' },
      bottom: { justifyItems: 'center', alignItems: 'end' },
      bottomTrailing: { justifyItems: 'end', alignItems: 'end' },
    }

    return alignmentMap[alignment] || alignmentMap.center
  }

  /**
   * Generate CSS for section header/footer styling (Phase 3)
   */
  static generateSectionHeaderCSS(
    style: 'automatic' | 'grouped' | 'plain' | 'sticky',
    type: 'header' | 'footer',
    columnSpan: number
  ): Record<string, string> {
    const baseStyles: Record<string, string> = {
      gridColumn: `1 / span ${columnSpan}`,
      display: 'flex',
      alignItems: 'center',
    }

    switch (style) {
      case 'sticky':
        baseStyles.position = 'sticky'
        baseStyles.top = type === 'header' ? '0' : 'auto'
        baseStyles.bottom = type === 'footer' ? '0' : 'auto'
        baseStyles.zIndex = '10'
        baseStyles.backgroundColor = 'var(--background-color, white)'
        break
      case 'grouped':
        baseStyles.padding = '12px 16px'
        baseStyles.backgroundColor = 'var(--section-bg, #f8f9fa)'
        baseStyles.borderRadius =
          type === 'header' ? '8px 8px 0 0' : '0 0 8px 8px'
        break
      case 'plain':
        baseStyles.padding = '8px 0'
        break
      case 'automatic':
      default:
        baseStyles.padding = '12px 0'
        baseStyles.fontWeight = '600'
        baseStyles.fontSize = '1.1em'
        if (type === 'footer') {
          baseStyles.fontSize = '0.9em'
          baseStyles.fontWeight = '400'
          baseStyles.color = 'var(--text-secondary, #6b7280)'
        }
        break
    }

    return baseStyles
  }

  /**
   * Generate CSS animations for grid layout changes (Phase 3)
   */
  static generateGridAnimationCSS(
    animations: GridAnimationConfig
  ): Record<string, string> {
    const animationStyles: Record<string, string> = {}

    // Layout change animations
    if (animations.layoutChanges) {
      const config =
        typeof animations.layoutChanges === 'boolean'
          ? {}
          : animations.layoutChanges
      const duration = config.duration || 300
      const easing = config.easing || 'ease-out'
      const delay = config.delay || 0

      animationStyles.transition = `grid-template-columns ${duration}ms ${easing}${delay > 0 ? ` ${delay}ms` : ''}, grid-template-rows ${duration}ms ${easing}${delay > 0 ? ` ${delay}ms` : ''}`
    }

    // Responsive breakpoint change animations
    if (animations.responsive) {
      const config =
        typeof animations.responsive === 'boolean' ? {} : animations.responsive
      const duration = config.duration || 250
      const easing = config.easing || 'ease-out'
      const delay = config.delay || 0

      const responsiveTransition = `grid-template-columns ${duration}ms ${easing}${delay > 0 ? ` ${delay}ms` : ''}, grid-template-rows ${duration}ms ${easing}${delay > 0 ? ` ${delay}ms` : ''}, gap ${duration}ms ${easing}${delay > 0 ? ` ${delay}ms` : ''}`

      if (animationStyles.transition) {
        animationStyles.transition += `, ${responsiveTransition}`
      } else {
        animationStyles.transition = responsiveTransition
      }
    }

    return animationStyles
  }

  /**
   * Generate item entrance/exit animation keyframes (Phase 3)
   */
  static generateItemAnimationKeyframes(
    type: 'enter' | 'exit',
    animation:
      | 'fade'
      | 'scale'
      | 'slide-up'
      | 'slide-down'
      | 'slide-left'
      | 'slide-right'
  ): Record<string, string> {
    const keyframeName = `grid-item-${type}-${animation}`

    let keyframeContent = ''
    switch (animation) {
      case 'fade':
        keyframeContent =
          type === 'enter'
            ? 'from { opacity: 0; } to { opacity: 1; }'
            : 'from { opacity: 1; } to { opacity: 0; }'
        break
      case 'scale':
        keyframeContent =
          type === 'enter'
            ? 'from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); }'
            : 'from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.8); }'
        break
      case 'slide-up':
        keyframeContent =
          type === 'enter'
            ? 'from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); }'
            : 'from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-20px); }'
        break
      case 'slide-down':
        keyframeContent =
          type === 'enter'
            ? 'from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); }'
            : 'from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(20px); }'
        break
      case 'slide-left':
        keyframeContent =
          type === 'enter'
            ? 'from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); }'
            : 'from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(-20px); }'
        break
      case 'slide-right':
        keyframeContent =
          type === 'enter'
            ? 'from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); }'
            : 'from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(20px); }'
        break
    }

    return {
      [`@keyframes ${keyframeName}`]: `{ ${keyframeContent} }`,
      [`--${keyframeName}-keyframes`]: keyframeName,
    }
  }

  /**
   * Generate accessibility attributes for grid elements (Phase 3)
   */
  static generateAccessibilityAttributes(
    accessibility: GridAccessibilityConfig,
    gridType: 'grid' | 'lazy-vgrid' | 'lazy-hgrid',
    columnCount?: number,
    rowCount?: number
  ): Record<string, string | number | boolean> {
    const attributes: Record<string, string | number | boolean> = {}

    // Determine appropriate ARIA role
    const defaultRole = gridType === 'grid' ? 'grid' : 'group'
    const role = accessibility.role || defaultRole
    attributes.role = role

    // Add accessibility labels
    if (accessibility.label) {
      attributes['aria-label'] = accessibility.label
    }
    if (accessibility.description) {
      attributes['aria-describedby'] = accessibility.description
    }

    // Grid structure information for screen readers
    if (accessibility.screenReader !== false) {
      const screenReaderConfig =
        typeof accessibility.screenReader === 'boolean'
          ? {}
          : accessibility.screenReader || {}

      if (
        screenReaderConfig.announceStructure !== false &&
        columnCount !== undefined
      ) {
        attributes['aria-colcount'] = columnCount
      }
      if (
        screenReaderConfig.announceStructure !== false &&
        rowCount !== undefined
      ) {
        attributes['aria-rowcount'] = rowCount
      }
    }

    // Keyboard navigation attributes
    if (accessibility.keyboardNavigation !== false) {
      const keyboardConfig =
        typeof accessibility.keyboardNavigation === 'boolean'
          ? {}
          : accessibility.keyboardNavigation || {}

      if (keyboardConfig.enabled !== false) {
        attributes.tabIndex = 0
        attributes['data-keyboard-navigation'] = keyboardConfig.mode || 'grid'

        if (keyboardConfig.pageNavigation) {
          attributes['data-page-navigation'] = true
        }
        if (keyboardConfig.homeEndNavigation) {
          attributes['data-home-end-navigation'] = true
        }
      }
    }

    // Focus management attributes
    if (accessibility.focusManagement !== false) {
      const focusConfig =
        typeof accessibility.focusManagement === 'boolean'
          ? {}
          : accessibility.focusManagement || {}

      if (focusConfig.trapFocus) {
        attributes['data-focus-trap'] = true
      }
      if (focusConfig.skipLinks) {
        attributes['data-skip-links'] = true
      }
    }

    // Reduced motion attributes
    if (accessibility.reducedMotion !== false) {
      const motionConfig =
        typeof accessibility.reducedMotion === 'boolean'
          ? {}
          : accessibility.reducedMotion || {}

      if (motionConfig.respectPreference !== false) {
        attributes['data-respect-reduced-motion'] = true
        attributes['data-reduced-motion-fallback'] =
          motionConfig.fallbackBehavior || 'disable'
      }
    }

    return attributes
  }

  /**
   * Generate reduced motion CSS based on user preferences (Phase 3)
   */
  static generateReducedMotionCSS(
    accessibility?: GridAccessibilityConfig
  ): Record<string, string> {
    if (!accessibility?.reducedMotion) return {}

    const motionConfig =
      typeof accessibility.reducedMotion === 'boolean'
        ? {}
        : accessibility.reducedMotion
    const fallback = motionConfig.fallbackBehavior || 'disable'

    const reducedMotionCSS: Record<string, string> = {}

    switch (fallback) {
      case 'disable':
        reducedMotionCSS['@media (prefers-reduced-motion: reduce)'] =
          '{ transition: none !important; animation: none !important; }'
        break
      case 'reduce':
        reducedMotionCSS['@media (prefers-reduced-motion: reduce)'] =
          '{ transition-duration: 0.1s !important; animation-duration: 0.1s !important; }'
        break
      case 'instant':
        reducedMotionCSS['@media (prefers-reduced-motion: reduce)'] =
          '{ transition-duration: 0s !important; animation-duration: 0s !important; }'
        break
    }

    return reducedMotionCSS
  }

  /**
   * Generate advanced styling CSS for grid components (Phase 3)
   */
  static generateAdvancedStylingCSS(
    styling: GridStylingConfig
  ): Record<string, string> {
    const styles: Record<string, string> = {}

    // Grid template areas
    if (styling.templateAreas && styling.templateAreas.length > 0) {
      const areas = styling.templateAreas.map(area => `"${area}"`).join(' ')
      styles.gridTemplateAreas = areas
    }

    // Advanced gap configuration
    if (styling.advancedGap) {
      if (styling.advancedGap.row) {
        if (typeof styling.advancedGap.row === 'object') {
          // Responsive row gap - would need media queries
          Object.entries(styling.advancedGap.row).forEach(
            ([breakpoint, value]) => {
              const mediaQuery = this.getMediaQueryForBreakpoint(breakpoint)
              if (mediaQuery) {
                styles[mediaQuery] = styles[mediaQuery] || '{}'
                styles[mediaQuery] = styles[mediaQuery].replace(
                  '}',
                  ` row-gap: ${value}px; }`
                )
              }
            }
          )
        } else {
          styles.rowGap =
            typeof styling.advancedGap.row === 'number'
              ? `${styling.advancedGap.row}px`
              : styling.advancedGap.row
        }
      }

      if (styling.advancedGap.column) {
        if (typeof styling.advancedGap.column === 'object') {
          // Responsive column gap
          Object.entries(styling.advancedGap.column).forEach(
            ([breakpoint, value]) => {
              const mediaQuery = this.getMediaQueryForBreakpoint(breakpoint)
              if (mediaQuery) {
                styles[mediaQuery] = styles[mediaQuery] || '{}'
                styles[mediaQuery] = styles[mediaQuery].replace(
                  '}',
                  ` column-gap: ${value}px; }`
                )
              }
            }
          )
        } else {
          styles.columnGap =
            typeof styling.advancedGap.column === 'number'
              ? `${styling.advancedGap.column}px`
              : styling.advancedGap.column
        }
      }
    }

    // Container styling (handle first to allow debug to override/combine)
    if (styling.container) {
      if (styling.container.background) {
        if (typeof styling.container.background === 'string') {
          styles.background = styling.container.background
        } else {
          const bgConfig = styling.container.background
          switch (bgConfig.pattern) {
            case 'dots':
              styles.background = `radial-gradient(circle, ${bgConfig.color || '#e0e0e0'} 1px, transparent 1px)`
              styles.backgroundSize = '20px 20px'
              if (bgConfig.opacity) {
                styles.opacity = bgConfig.opacity.toString()
              }
              break
            case 'lines':
              styles.background = `linear-gradient(90deg, ${bgConfig.color || '#e0e0e0'} 1px, transparent 1px), linear-gradient(${bgConfig.color || '#e0e0e0'} 1px, transparent 1px)`
              styles.backgroundSize = '20px 20px'
              break
            case 'grid':
              styles.background = `linear-gradient(to right, ${bgConfig.color || '#e0e0e0'} 1px, transparent 1px), linear-gradient(to bottom, ${bgConfig.color || '#e0e0e0'} 1px, transparent 1px)`
              styles.backgroundSize = '20px 20px'
              break
          }
        }
      }

      if (styling.container.border) {
        styles.border = styling.container.border
      }
      if (styling.container.borderRadius) {
        styles.borderRadius =
          typeof styling.container.borderRadius === 'number'
            ? `${styling.container.borderRadius}px`
            : styling.container.borderRadius
      }
      if (styling.container.boxShadow) {
        styles.boxShadow = styling.container.boxShadow
      }
      if (styling.container.padding) {
        if (typeof styling.container.padding === 'object') {
          const p = styling.container.padding
          styles.padding = `${p.top || 0} ${p.right || 0} ${p.bottom || 0} ${p.left || 0}`
        } else {
          styles.padding =
            typeof styling.container.padding === 'number'
              ? `${styling.container.padding}px`
              : styling.container.padding
        }
      }
    }

    // Debug visualization (applies after container background to combine properly)
    if (styling.debug && (styling.debug === true || styling.debug.enabled)) {
      const debugConfig =
        typeof styling.debug === 'boolean' ? {} : styling.debug
      const lineColor = debugConfig.lineColor || '#ff0000'

      if (debugConfig.showLines !== false) {
        const debugGradient = `linear-gradient(to right, ${lineColor} 1px, transparent 1px), linear-gradient(to bottom, ${lineColor} 1px, transparent 1px)`

        // Combine with existing background if present
        if (
          styles.background &&
          !styles.background.includes('linear-gradient')
        ) {
          styles.background = `${debugGradient}, ${styles.background}`
        } else {
          styles.background = debugGradient
        }
        styles.backgroundSize =
          'var(--grid-debug-size, 20px) var(--grid-debug-size, 20px)'
      }

      if (debugConfig.showAreas) {
        styles.position = 'relative'
        styles['&::after'] =
          `{ content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: repeating-linear-gradient(45deg, transparent, transparent 10px, ${lineColor}22 10px, ${lineColor}22 20px); pointer-events: none; }`
      }
    }

    return styles
  }

  /**
   * Generate item state CSS (hover, focus, active) (Phase 3)
   */
  static generateItemStateCSS(
    itemStates: NonNullable<GridStylingConfig['itemStates']>
  ): Record<string, string> {
    const styles: Record<string, string> = {}

    // Hover effects
    if (itemStates.hover && itemStates.hover.enabled !== false) {
      const hoverConfig = itemStates.hover
      const hoverStyles: string[] = []

      switch (hoverConfig.transform) {
        case 'scale':
          hoverStyles.push('transform: scale(1.05)')
          break
        case 'lift':
          hoverStyles.push(
            'transform: translateY(-2px)',
            'box-shadow: 0 4px 8px rgba(0,0,0,0.12)'
          )
          break
        case 'glow':
          hoverStyles.push('box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4)')
          break
        case 'highlight':
          hoverStyles.push('background-color: rgba(59, 130, 246, 0.1)')
          break
      }

      if (hoverConfig.transition) {
        hoverStyles.push(`transition: ${hoverConfig.transition}`)
      } else {
        hoverStyles.push('transition: all 0.2s ease')
      }

      if (hoverConfig.customCSS) {
        Object.entries(hoverConfig.customCSS).forEach(([prop, value]) => {
          hoverStyles.push(`${prop}: ${value}`)
        })
      }

      styles['& > *:hover'] = `{ ${hoverStyles.join('; ')} }`
    }

    // Focus effects
    if (itemStates.focus && itemStates.focus.enabled !== false) {
      const focusConfig = itemStates.focus
      const focusStyles: string[] = []

      switch (focusConfig.style) {
        case 'ring':
          focusStyles.push(
            `box-shadow: 0 0 0 2px ${focusConfig.color || '#3b82f6'}`
          )
          break
        case 'outline':
          focusStyles.push(
            `outline: 2px solid ${focusConfig.color || '#3b82f6'}`,
            'outline-offset: 2px'
          )
          break
        case 'background':
          focusStyles.push(
            `background-color: ${focusConfig.color || 'rgba(59, 130, 246, 0.1)'}`
          )
          break
        case 'border':
          focusStyles.push(
            `border: 2px solid ${focusConfig.color || '#3b82f6'}`
          )
          break
      }

      if (focusConfig.customCSS) {
        Object.entries(focusConfig.customCSS).forEach(([prop, value]) => {
          focusStyles.push(`${prop}: ${value}`)
        })
      }

      styles['& > *:focus'] = `{ ${focusStyles.join('; ')} }`
    }

    // Active effects
    if (itemStates.active && itemStates.active.enabled !== false) {
      const activeConfig = itemStates.active
      const activeStyles: string[] = []

      switch (activeConfig.transform) {
        case 'scale':
          activeStyles.push('transform: scale(0.95)')
          break
        case 'inset':
          activeStyles.push('box-shadow: inset 0 2px 4px rgba(0,0,0,0.1)')
          break
        case 'darken':
          activeStyles.push('filter: brightness(0.9)')
          break
      }

      if (activeConfig.customCSS) {
        Object.entries(activeConfig.customCSS).forEach(([prop, value]) => {
          activeStyles.push(`${prop}: ${value}`)
        })
      }

      styles['& > *:active'] = `{ ${activeStyles.join('; ')} }`
    }

    return styles
  }

  /**
   * Get media query for breakpoint (helper function)
   */
  private static getMediaQueryForBreakpoint(breakpoint: string): string | null {
    const breakpoints: Record<string, string> = {
      sm: '@media (min-width: 640px)',
      md: '@media (min-width: 768px)',
      lg: '@media (min-width: 1024px)',
      xl: '@media (min-width: 1280px)',
      xxl: '@media (min-width: 1536px)',
    }
    return breakpoints[breakpoint] || null
  }
}

/**
 * Grid Section Header/Footer component (Phase 3)
 */
class GridSectionHeaderComponent
  extends ComponentWithCSSClasses
  implements ComponentInstance<GridSectionHeaderProps>
{
  public readonly type = 'component' as const
  public readonly id: string
  public mounted = false
  public cleanup: (() => void)[] = []
  private effectiveTag: string
  private validationResult: any

  constructor(public props: GridSectionHeaderProps) {
    super()
    this.id = `grid-section-${props.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Process element override
    const componentType = `GridSection${props.type === 'header' ? 'Header' : 'Footer'}`
    const override = processElementOverride(
      componentType,
      'div',
      this.props.element
    )
    this.effectiveTag = override.tag
    this.validationResult = override.validation
  }

  render() {
    const { content, sectionId, type, style, debugLabel } = this.props

    // Log component for debugging
    const debug = getDebugManager()
    debug.logComponent(`GRID_SECTION_${type.toUpperCase()}`, debugLabel)

    // Process CSS classes for this component
    const baseClasses = [
      `tachui-grid-section-${type}`,
      ...(debug.isEnabled() ? ['tachui-debug'] : []),
    ]
    const classString = this.createClassString(this.props, baseClasses)

    // Determine column span (will be set by parent grid)
    const columnSpan = 12 // Default, should be overridden by parent

    // Generate section header styles
    const sectionStyles = GridCSSGenerator.generateSectionHeaderCSS(
      style,
      type,
      columnSpan
    )

    // Render content
    let renderedContent: any
    if (typeof content === 'string') {
      renderedContent = [
        {
          type: 'element' as const,
          tag: 'span',
          props: {
            className: `tachui-grid-section-${type}-text`,
            children: [{ type: 'text' as const, text: content }],
          },
        },
      ]
    } else {
      const contentResult = content.render()
      renderedContent = Array.isArray(contentResult)
        ? contentResult
        : [contentResult]
    }

    const element = {
      type: 'element' as const,
      tag: this.effectiveTag,
      props: {
        className: classString,
        style: sectionStyles,
        'data-section-id': sectionId,
        'data-section-type': type,
        // Add debug attributes
        ...(debug.isEnabled() && {
          'data-tachui-component': `GridSection${type === 'header' ? 'Header' : 'Footer'}`,
          ...(debugLabel && { 'data-tachui-label': debugLabel }),
        }),
      },
      children: renderedContent,
      // Add component metadata
      componentMetadata: {
        originalType: `GridSection${type === 'header' ? 'Header' : 'Footer'}`,
        overriddenTo:
          this.effectiveTag !== 'div' ? this.effectiveTag : undefined,
        validationResult: this.validationResult,
      },
    }

    return [element]
  }
}

/**
 * Base Grid component class with CSS Grid layout
 */
class BaseGridComponent
  extends ComponentWithCSSClasses
  implements ComponentInstance<BaseGridProps>
{
  public readonly type = 'component' as const
  public readonly id: string
  public mounted = false
  public cleanup: (() => void)[] = []
  protected effectiveTag: string
  protected validationResult: any

  constructor(
    public props: BaseGridProps,
    protected gridType: 'grid' | 'lazy-vgrid' | 'lazy-hgrid',
    public children: ComponentInstance[] = []
  ) {
    super()
    this.id = `${gridType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Process element override for tag specification enhancement
    const componentType =
      gridType === 'grid'
        ? 'Grid'
        : gridType === 'lazy-vgrid'
          ? 'LazyVGrid'
          : 'LazyHGrid'
    const override = processElementOverride(
      componentType,
      'div',
      this.props.element
    )
    this.effectiveTag = override.tag
    this.validationResult = override.validation

    // Set up lifecycle hooks for child components
    this.setupLifecycleHooks()

    // Register this component for lifecycle processing
    registerComponentWithLifecycleHooks(this)
  }

  /**
   * Generate animation styles for grid layout (Phase 3)
   */
  protected generateAnimationStyles(
    animations?: GridAnimationConfig
  ): Record<string, string> {
    if (!animations) return {}

    return GridCSSGenerator.generateGridAnimationCSS(animations)
  }

  /**
   * Apply item animations to child elements (Phase 3)
   */
  protected applyItemAnimations(
    children: ComponentInstance[],
    animations?: GridAnimationConfig
  ): ComponentInstance[] {
    if (!animations?.itemChanges) return children

    const itemConfig =
      typeof animations.itemChanges === 'boolean' ? {} : animations.itemChanges

    // Apply enter animations to new items
    if (itemConfig.enter) {
      const enterConfig = itemConfig.enter
      const duration = enterConfig.duration || 250
      const easing = enterConfig.easing || 'ease-out'
      const delay = enterConfig.delay || 0

      // Apply animation styles to children
      return children.map((child, index) => {
        // Add animation modifier to child (if child supports modifiers)
        if ('modifiers' in child && Array.isArray((child as any).modifiers)) {
          const animationDelay = delay + index * 50 // Stagger animations
          const animationModifier = transition(
            'all',
            duration,
            easing,
            animationDelay
          )
          ;(child as any).modifiers.push(animationModifier)
        }
        return child
      })
    }

    return children
  }

  /**
   * Generate accessibility attributes for grid (Phase 3)
   */
  protected generateAccessibilityAttributes(
    accessibility?: GridAccessibilityConfig,
    columnCount?: number,
    rowCount?: number
  ): Record<string, any> {
    if (!accessibility) return {}

    return GridCSSGenerator.generateAccessibilityAttributes(
      accessibility,
      this.gridType,
      columnCount,
      rowCount
    )
  }

  /**
   * Generate advanced styling CSS for grid (Phase 3)
   */
  protected generateStylingCSS(
    styling?: GridStylingConfig
  ): Record<string, string> {
    if (!styling) return {}

    const stylingCSS = GridCSSGenerator.generateAdvancedStylingCSS(styling)

    // Add item state CSS if configured
    if (styling.itemStates) {
      const itemStateCSS = GridCSSGenerator.generateItemStateCSS(
        styling.itemStates
      )
      Object.assign(stylingCSS, itemStateCSS)
    }

    return stylingCSS
  }

  /**
   * Handle keyboard navigation events (Phase 3)
   */
  protected setupKeyboardNavigation(
    element: HTMLElement,
    accessibility?: GridAccessibilityConfig
  ) {
    if (!accessibility?.keyboardNavigation) return

    const keyboardConfig =
      typeof accessibility.keyboardNavigation === 'boolean'
        ? {}
        : accessibility.keyboardNavigation
    if (keyboardConfig.enabled === false) return

    const mode = keyboardConfig.mode || 'grid'

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (!element.contains(target)) return

      let handled = false

      switch (event.key) {
        case 'ArrowUp':
          if (mode === 'grid') {
            this.navigateGrid(element, 'up')
            handled = true
          }
          break
        case 'ArrowDown':
          if (mode === 'grid') {
            this.navigateGrid(element, 'down')
            handled = true
          } else if (mode === 'list') {
            this.navigateList(element, 'next')
            handled = true
          }
          break
        case 'ArrowLeft':
          this.navigateGrid(element, 'left')
          handled = true
          break
        case 'ArrowRight':
          this.navigateGrid(element, 'right')
          handled = true
          break
        case 'Home':
          if (keyboardConfig.homeEndNavigation) {
            this.navigateToFirst(element)
            handled = true
          }
          break
        case 'End':
          if (keyboardConfig.homeEndNavigation) {
            this.navigateToLast(element)
            handled = true
          }
          break
        case 'PageUp':
          if (keyboardConfig.pageNavigation) {
            this.navigatePage(element, 'up')
            handled = true
          }
          break
        case 'PageDown':
          if (keyboardConfig.pageNavigation) {
            this.navigatePage(element, 'down')
            handled = true
          }
          break
      }

      if (handled) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    element.addEventListener('keydown', handleKeyDown)

    // Store cleanup function
    this.cleanup.push(() => {
      element.removeEventListener('keydown', handleKeyDown)
    })
  }

  /**
   * Navigate within grid structure (Phase 3)
   */
  private navigateGrid(
    container: HTMLElement,
    direction: 'up' | 'down' | 'left' | 'right'
  ) {
    const focusableElements = container.querySelectorAll(
      '[tabindex="0"], button, input, select, textarea, [contenteditable]'
    )
    const currentIndex = Array.from(focusableElements).indexOf(
      document.activeElement as HTMLElement
    )

    if (currentIndex === -1) return

    // Get grid dimensions (simplified - assumes regular grid)
    const computedStyle = getComputedStyle(container)
    const columns = computedStyle.gridTemplateColumns.split(' ').length

    let targetIndex = currentIndex

    switch (direction) {
      case 'up':
        targetIndex = Math.max(0, currentIndex - columns)
        break
      case 'down':
        targetIndex = Math.min(
          focusableElements.length - 1,
          currentIndex + columns
        )
        break
      case 'left':
        targetIndex = Math.max(0, currentIndex - 1)
        break
      case 'right':
        targetIndex = Math.min(focusableElements.length - 1, currentIndex + 1)
        break
    }

    if (targetIndex !== currentIndex) {
      ;(focusableElements[targetIndex] as HTMLElement).focus()
    }
  }

  /**
   * Navigate in list mode (Phase 3)
   */
  private navigateList(container: HTMLElement, direction: 'previous' | 'next') {
    const focusableElements = container.querySelectorAll(
      '[tabindex="0"], button, input, select, textarea, [contenteditable]'
    )
    const currentIndex = Array.from(focusableElements).indexOf(
      document.activeElement as HTMLElement
    )

    if (currentIndex === -1) return

    const targetIndex =
      direction === 'next'
        ? Math.min(focusableElements.length - 1, currentIndex + 1)
        : Math.max(0, currentIndex - 1)

    if (targetIndex !== currentIndex) {
      ;(focusableElements[targetIndex] as HTMLElement).focus()
    }
  }

  /**
   * Navigate to first/last elements (Phase 3)
   */
  private navigateToFirst(container: HTMLElement) {
    const focusableElements = container.querySelectorAll(
      '[tabindex="0"], button, input, select, textarea, [contenteditable]'
    )
    if (focusableElements.length > 0) {
      ;(focusableElements[0] as HTMLElement).focus()
    }
  }

  private navigateToLast(container: HTMLElement) {
    const focusableElements = container.querySelectorAll(
      '[tabindex="0"], button, input, select, textarea, [contenteditable]'
    )
    if (focusableElements.length > 0) {
      ;(focusableElements[focusableElements.length - 1] as HTMLElement).focus()
    }
  }

  /**
   * Navigate by page (Phase 3)
   */
  private navigatePage(container: HTMLElement, direction: 'up' | 'down') {
    const focusableElements = container.querySelectorAll(
      '[tabindex="0"], button, input, select, textarea, [contenteditable]'
    )
    const currentIndex = Array.from(focusableElements).indexOf(
      document.activeElement as HTMLElement
    )

    if (currentIndex === -1) return

    // Page navigation jumps by ~10 items or to start/end
    const pageSize = 10
    const targetIndex =
      direction === 'down'
        ? Math.min(focusableElements.length - 1, currentIndex + pageSize)
        : Math.max(0, currentIndex - pageSize)

    if (targetIndex !== currentIndex) {
      ;(focusableElements[targetIndex] as HTMLElement).focus()
    }
  }

  private setupLifecycleHooks() {
    useLifecycle(this, {
      onDOMReady: (_elements, primaryElement) => {
        // Process lifecycle hooks for child components that have them
        this.children.forEach((child, index) => {
          const enhancedLifecycle = (child as any)._enhancedLifecycle

          if (
            enhancedLifecycle &&
            enhancedLifecycle.onDOMReady &&
            !child.domReady
          ) {
            try {
              if (primaryElement) {
                const childElements = this.findChildDOMElements(
                  child,
                  primaryElement,
                  index
                )

                if (childElements.length > 0) {
                  child.domElements = new Map()
                  childElements.forEach((element, idx) => {
                    const key = element.id || `element-${idx}`
                    child.domElements!.set(key, element)
                    if (!child.primaryElement) {
                      child.primaryElement = element
                    }
                  })

                  child.domReady = true

                  // Call the child's onDOMReady hook
                  const cleanup = enhancedLifecycle.onDOMReady(
                    child.domElements,
                    child.primaryElement
                  )
                  if (typeof cleanup === 'function') {
                    child.cleanup = child.cleanup || []
                    child.cleanup.push(cleanup)
                  }

                  // Also call onMount if it exists
                  if (enhancedLifecycle.onMount) {
                    const mountCleanup = enhancedLifecycle.onMount()
                    if (typeof mountCleanup === 'function') {
                      child.cleanup = child.cleanup || []
                      child.cleanup.push(mountCleanup)
                    }
                  }
                }
              }
            } catch (error) {
              console.error(
                `Error processing lifecycle hooks for child ${child.id}:`,
                error
              )
            }
          }
        })
      },
    })
  }

  /**
   * Find DOM elements for child components (reusing pattern from LayoutComponent)
   */
  private findChildDOMElements(
    child: ComponentInstance,
    container: Element,
    childIndex: number
  ): Element[] {
    // For Image components, look for img elements with the tachui-image class
    if (child.id.startsWith('image-')) {
      const images = container.querySelectorAll('img.tachui-image')
      if (images[childIndex]) {
        return [images[childIndex]]
      }
      return Array.from(images)
    }

    // For Button components, look for button elements with the tachui-button class
    if (child.id.startsWith('button-')) {
      const buttons = container.querySelectorAll('button.tachui-button')
      if (buttons[childIndex]) {
        return [buttons[childIndex]]
      }
      return Array.from(buttons)
    }

    // For Text components, look for span elements with the tachui-text class
    if (child.id.startsWith('text-')) {
      const textElements = container.querySelectorAll(
        'span.tachui-text, .tachui-text'
      )
      if (textElements[childIndex]) {
        return [textElements[childIndex]]
      }
      return Array.from(textElements)
    }

    // For other components, try to find any direct children elements
    const allChildren = Array.from(container.children)
    if (allChildren[childIndex]) {
      return [allChildren[childIndex]]
    }

    return allChildren
  }

  render(): any[] {
    // To be implemented by specific grid component subclasses
    throw new Error(
      'BaseGridComponent.render() must be implemented by subclass'
    )
  }
}

/**
 * Grid component class (explicit row/column control)
 */
class GridComponent extends BaseGridComponent {
  constructor(
    public props: GridProps,
    children: ComponentInstance[] = []
  ) {
    super(props, 'grid', children)
  }

  render() {
    const {
      alignment = 'center',
      spacing,
      debugLabel,
      animations,
      accessibility,
      styling,
    } = this.props

    // Log component for debugging
    const debug = getDebugManager()
    debug.logComponent('GRID', debugLabel)

    // Process CSS classes for this component
    const baseClasses = [
      'tachui-grid',
      ...(debug.isEnabled() ? ['tachui-debug'] : []),
    ]
    const classString = this.createClassString(this.props, baseClasses)

    // Apply item animations to children before rendering (Phase 3)
    const animatedChildren = this.applyItemAnimations(this.children, animations)

    // Render children - Grid expects GridRow children for explicit layout
    const renderedChildren = animatedChildren
      .map(child => {
        const childResult = child.render()
        return Array.isArray(childResult) ? childResult : [childResult]
      })
      .flat()

    // Generate base CSS Grid styles
    const alignmentStyles = GridCSSGenerator.generateAlignment(alignment)
    const gapValue = GridCSSGenerator.generateSpacing(spacing)

    // Phase 3: Generate animation styles
    const animationStyles = this.generateAnimationStyles(animations)

    // Phase 3: Generate accessibility attributes
    const accessibilityAttrs =
      this.generateAccessibilityAttributes(accessibility)

    // Phase 3: Generate reduced motion CSS
    const reducedMotionCSS =
      GridCSSGenerator.generateReducedMotionCSS(accessibility)

    // Phase 3: Generate advanced styling CSS
    const advancedStylingCSS = this.generateStylingCSS(styling)

    const finalStyles = {
      display: 'grid',
      gap: gapValue,
      ...alignmentStyles,
      ...animationStyles,
      ...reducedMotionCSS,
      ...advancedStylingCSS,
    }

    const element = {
      type: 'element' as const,
      tag: this.effectiveTag,
      props: {
        className: classString,
        style: finalStyles,
        ...accessibilityAttrs,
        // Add debug attributes
        ...(debug.isEnabled() && {
          'data-tachui-component': 'Grid',
          ...(debugLabel && { 'data-tachui-label': debugLabel }),
        }),
      },
      children: renderedChildren,
      // Add component metadata for semantic role processing
      componentMetadata: {
        originalType: 'Grid',
        overriddenTo:
          this.effectiveTag !== 'div' ? this.effectiveTag : undefined,
        validationResult: this.validationResult,
      },
    }

    return [element]
  }
}

/**
 * GridRow component class
 */
class GridRowComponent
  extends ComponentWithCSSClasses
  implements ComponentInstance<GridRowProps>
{
  public readonly type = 'component' as const
  public readonly id: string
  public mounted = false
  public cleanup: (() => void)[] = []
  private effectiveTag: string
  private validationResult: any

  constructor(
    public props: GridRowProps,
    public children: ComponentInstance[] = []
  ) {
    super()
    this.id = `gridrow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Process element override for tag specification enhancement
    const override = processElementOverride(
      'GridRow',
      'div',
      this.props.element
    )
    this.effectiveTag = override.tag
    this.validationResult = override.validation
  }

  render() {
    const { debugLabel } = this.props

    // Log component for debugging
    const debug = getDebugManager()
    debug.logComponent('GRIDROW', debugLabel)

    // Process CSS classes for this component
    const baseClasses = [
      'tachui-gridrow',
      ...(debug.isEnabled() ? ['tachui-debug'] : []),
    ]
    const classString = this.createClassString(this.props, baseClasses)

    // Render children
    const renderedChildren = this.children
      .map(child => {
        const childResult = child.render()
        return Array.isArray(childResult) ? childResult : [childResult]
      })
      .flat()

    // GridRow creates a row within the parent Grid - contents are positioned within the grid row
    const element = {
      type: 'element' as const,
      tag: this.effectiveTag,
      props: {
        className: classString,
        style: {
          display: 'contents', // GridRow acts as a transparent container within CSS Grid
        },
        // Add debug attributes
        ...(debug.isEnabled() && {
          'data-tachui-component': 'GridRow',
          ...(debugLabel && { 'data-tachui-label': debugLabel }),
        }),
      },
      children: renderedChildren,
      // Add component metadata
      componentMetadata: {
        originalType: 'GridRow',
        overriddenTo:
          this.effectiveTag !== 'div' ? this.effectiveTag : undefined,
        validationResult: this.validationResult,
      },
    }

    return [element]
  }
}

/**
 * LazyVGrid component class (vertical scrolling with flexible columns)
 */
class LazyVGridComponent extends BaseGridComponent {
  constructor(
    public props: LazyVGridProps,
    children: ComponentInstance[] = []
  ) {
    super(props, 'lazy-vgrid', children)
  }

  render() {
    const {
      columns,
      alignment = 'center',
      spacing,
      debugLabel,
      responsive,
      sections,
      pinnedViews,
      animations,
      accessibility,
      styling,
    } = this.props

    // Log component for debugging
    const debug = getDebugManager()
    debug.logComponent('LAZYVGRID', debugLabel)

    // Process CSS classes for this component
    const baseClasses = [
      'tachui-lazy-vgrid',
      ...(debug.isEnabled() ? ['tachui-debug'] : []),
    ]
    const classString = this.createClassString(this.props, baseClasses)

    // Phase 3: Handle sectioned data with headers and footers
    let renderedChildren: any[]
    if (sections && sections.length > 0) {
      renderedChildren = this.renderSections(sections, pinnedViews)
    } else {
      // Apply item animations to children before rendering (Phase 3)
      const animatedChildren = this.applyItemAnimations(
        this.children,
        animations
      )

      // Render regular children (backward compatibility)
      renderedChildren = animatedChildren
        .map(child => {
          const childResult = child.render()
          return Array.isArray(childResult) ? childResult : [childResult]
        })
        .flat()
    }

    // Generate CSS Grid styles
    let gridTemplateColumns: string
    let baseStyles: Record<string, any> = {
      display: 'grid',
    }

    // Phase 2: Enhanced responsive integration
    if (responsive) {
      // Performance monitoring for responsive CSS generation
      const endMeasurement = GridPerformanceMonitor.startMeasurement(
        'responsive-css-generation'
      )

      try {
        // Use enhanced responsive configuration
        const responsiveConfig = GridResponsiveUtils.createResponsiveGridConfig(
          {
            columns: columns as any,
            spacing,
            alignment,
          }
        )

        // Merge with provided responsive config
        const finalConfig = { ...responsiveConfig, ...responsive }

        // Debug: Register grid instance and visualize breakpoints
        GridDebugger.registerGrid(this.id, finalConfig, `#${this.id}`)
        GridDebugger.visualizeBreakpoints(finalConfig)

        // Generate responsive modifier (would be applied by modifier system)
        const responsiveModifier = createResponsiveGridModifier(finalConfig)

        // For Phase 2, we'll apply base styles and let the modifier system handle responsive styles
        if (
          finalConfig.columns &&
          typeof finalConfig.columns === 'object' &&
          'base' in finalConfig.columns &&
          finalConfig.columns.base
        ) {
          gridTemplateColumns = this.generateColumnsFromConfig(
            finalConfig.columns.base
          )
        } else if (Array.isArray(columns)) {
          gridTemplateColumns = GridCSSGenerator.generateColumns(columns)
        } else {
          gridTemplateColumns = '1fr'
        }

        // Add responsive modifier to component metadata for processing
        baseStyles._responsiveModifier = responsiveModifier
      } finally {
        endMeasurement()
      }
    } else {
      // Phase 1: Basic responsive support (backward compatibility)
      const alignmentStyles = GridCSSGenerator.generateAlignment(alignment)
      const gapValue = GridCSSGenerator.generateSpacing(spacing)

      if (Array.isArray(columns)) {
        // Simple column configuration
        gridTemplateColumns = GridCSSGenerator.generateColumns(columns)
      } else {
        // Responsive column configuration (legacy)
        const responsiveCSS = GridCSSGenerator.generateResponsiveGridCSS(
          columns,
          'grid-template-columns'
        )
        const templateValue = responsiveCSS['grid-template-columns']
        gridTemplateColumns =
          typeof templateValue === 'string' ? templateValue : '1fr'
      }

      baseStyles = {
        ...baseStyles,
        gap: gapValue,
        ...alignmentStyles,
      }
    }

    baseStyles.gridTemplateColumns = gridTemplateColumns

    // Phase 3: Apply animation styles
    const animationStyles = this.generateAnimationStyles(animations)
    Object.assign(baseStyles, animationStyles)

    // Phase 3: Generate accessibility attributes
    const columnCount = this.getColumnCount()
    const accessibilityAttrs = this.generateAccessibilityAttributes(
      accessibility,
      columnCount
    )

    // Phase 3: Generate reduced motion CSS
    const reducedMotionCSS =
      GridCSSGenerator.generateReducedMotionCSS(accessibility)
    Object.assign(baseStyles, reducedMotionCSS)

    // Phase 3: Generate advanced styling CSS
    const advancedStylingCSS = this.generateStylingCSS(styling)
    Object.assign(baseStyles, advancedStylingCSS)

    const element = {
      type: 'element' as const,
      tag: this.effectiveTag,
      props: {
        className: classString,
        style: baseStyles,
        ...accessibilityAttrs,
        // Add debug attributes
        ...(debug.isEnabled() && {
          'data-tachui-component': 'LazyVGrid',
          ...(debugLabel && { 'data-tachui-label': debugLabel }),
        }),
      },
      children: renderedChildren,
      // Add component metadata
      componentMetadata: {
        originalType: 'LazyVGrid',
        overriddenTo:
          this.effectiveTag !== 'div' ? this.effectiveTag : undefined,
        validationResult: this.validationResult,
        // Phase 2: Include responsive modifier for processing
        ...(responsive &&
          baseStyles._responsiveModifier && {
            responsiveModifier: baseStyles._responsiveModifier,
          }),
      },
    }

    // Clean up internal responsive modifier from styles
    if (baseStyles._responsiveModifier) {
      delete baseStyles._responsiveModifier
    }

    return [element]
  }

  /**
   * Render sectioned data with headers and footers (Phase 3)
   */
  private renderSections(
    sections: GridSection[],
    pinnedViews?: ('sectionHeaders' | 'sectionFooters')[]
  ): any[] {
    const renderedElements: any[] = []
    const columnCount = this.getColumnCount()
    const isPinnedHeaders = pinnedViews?.includes('sectionHeaders')
    const isPinnedFooters = pinnedViews?.includes('sectionFooters')

    sections.forEach(section => {
      // Render section header
      if (section.header) {
        const headerStyle =
          section.headerStyle || (isPinnedHeaders ? 'sticky' : 'automatic')
        const headerComponent = new GridSectionHeaderComponent({
          content: section.header,
          sectionId: section.id,
          type: 'header',
          style: headerStyle,
        })

        const headerResult = headerComponent.render()
        if (Array.isArray(headerResult)) {
          // Update grid-column style to span all columns
          headerResult.forEach(element => {
            if (element.props && element.props.style) {
              element.props.style.gridColumn = `1 / span ${columnCount}`
            }
          })
          renderedElements.push(...headerResult)
        }
      }

      // Render section items
      section.items.forEach(item => {
        const itemResult = item.render()
        const flatResult = Array.isArray(itemResult) ? itemResult : [itemResult]
        renderedElements.push(...flatResult)
      })

      // Render section footer
      if (section.footer) {
        const footerStyle =
          section.footerStyle || (isPinnedFooters ? 'sticky' : 'automatic')
        const footerComponent = new GridSectionHeaderComponent({
          content: section.footer,
          sectionId: section.id,
          type: 'footer',
          style: footerStyle,
        })

        const footerResult = footerComponent.render()
        if (Array.isArray(footerResult)) {
          // Update grid-column style to span all columns
          footerResult.forEach(element => {
            if (element.props && element.props.style) {
              element.props.style.gridColumn = `1 / span ${columnCount}`
            }
          })
          renderedElements.push(...footerResult)
        }
      }
    })

    return renderedElements
  }

  /**
   * Get the number of columns in the grid (Phase 3 helper)
   */
  private getColumnCount(): number {
    const { columns } = this.props

    if (Array.isArray(columns)) {
      return columns.length
    }

    // For responsive configurations, use the base or first available
    if (typeof columns === 'object' && columns !== null) {
      const responsiveConfig = columns as any
      const baseColumns =
        responsiveConfig.base ||
        responsiveConfig.sm ||
        responsiveConfig.md ||
        responsiveConfig.lg ||
        responsiveConfig.xl ||
        responsiveConfig.xxl
      return Array.isArray(baseColumns) ? baseColumns.length : 1
    }

    return 1
  }

  /**
   * Generate columns from GridItemConfig array (Phase 2 helper)
   */
  private generateColumnsFromConfig(items: GridItemConfig[]): string {
    return items
      .map(item => {
        switch (item.type) {
          case 'fixed':
            return `${item.size}px`
          case 'flexible':
            const minSize = item.minimum || 0
            const maxSize = item.maximum ? `${item.maximum}px` : '1fr'
            return minSize > 0 ? `minmax(${minSize}px, ${maxSize})` : '1fr'
          case 'adaptive':
            const adaptiveMin = item.minimum
            const adaptiveMax = item.maximum ? `${item.maximum}px` : '1fr'
            return `minmax(${adaptiveMin}px, ${adaptiveMax})`
          default:
            return '1fr'
        }
      })
      .join(' ')
  }
}

/**
 * LazyHGrid component class (horizontal scrolling with flexible rows)
 */
class LazyHGridComponent extends BaseGridComponent {
  constructor(
    public props: LazyHGridProps,
    children: ComponentInstance[] = []
  ) {
    super(props, 'lazy-hgrid', children)
  }

  render() {
    const {
      rows,
      alignment = 'center',
      spacing,
      debugLabel,
      responsive,
      sections,
      pinnedViews,
      animations,
      accessibility,
      styling,
    } = this.props

    // Log component for debugging
    const debug = getDebugManager()
    debug.logComponent('LAZYHGRID', debugLabel)

    // Process CSS classes for this component
    const baseClasses = [
      'tachui-lazy-hgrid',
      ...(debug.isEnabled() ? ['tachui-debug'] : []),
    ]
    const classString = this.createClassString(this.props, baseClasses)

    // Phase 3: Handle sectioned data with headers and footers
    let renderedChildren: any[]
    if (sections && sections.length > 0) {
      renderedChildren = this.renderSections(sections, pinnedViews)
    } else {
      // Apply item animations to children before rendering (Phase 3)
      const animatedChildren = this.applyItemAnimations(
        this.children,
        animations
      )

      // Render regular children (backward compatibility)
      renderedChildren = animatedChildren
        .map(child => {
          const childResult = child.render()
          return Array.isArray(childResult) ? childResult : [childResult]
        })
        .flat()
    }

    // Generate CSS Grid styles
    let gridTemplateRows: string
    let baseStyles: Record<string, any> = {
      display: 'grid',
      gridAutoFlow: 'column', // Horizontal flow for LazyHGrid
      overflowX: 'auto', // Enable horizontal scrolling
    }

    // Phase 2: Enhanced responsive integration
    if (responsive) {
      // Performance monitoring for responsive CSS generation
      const endMeasurement = GridPerformanceMonitor.startMeasurement(
        'responsive-css-generation'
      )

      try {
        // Use enhanced responsive configuration
        const responsiveConfig = GridResponsiveUtils.createResponsiveGridConfig(
          {
            rows: rows as any,
            spacing,
            alignment,
          }
        )

        // Merge with provided responsive config
        const finalConfig = { ...responsiveConfig, ...responsive }

        // Debug: Register grid instance and visualize breakpoints
        GridDebugger.registerGrid(this.id, finalConfig, `#${this.id}`)
        GridDebugger.visualizeBreakpoints(finalConfig)

        // Generate responsive modifier (would be applied by modifier system)
        const responsiveModifier = createResponsiveGridModifier(finalConfig)

        // For Phase 2, we'll apply base styles and let the modifier system handle responsive styles
        if (
          finalConfig.rows &&
          typeof finalConfig.rows === 'object' &&
          'base' in finalConfig.rows &&
          finalConfig.rows.base
        ) {
          gridTemplateRows = this.generateRowsFromConfig(finalConfig.rows.base)
        } else if (Array.isArray(rows)) {
          gridTemplateRows = GridCSSGenerator.generateRows(rows)
        } else {
          gridTemplateRows = 'auto'
        }

        // Add responsive modifier to component metadata for processing
        baseStyles._responsiveModifier = responsiveModifier
      } finally {
        endMeasurement()
      }
    } else {
      // Phase 1: Basic responsive support (backward compatibility)
      const alignmentStyles = GridCSSGenerator.generateAlignment(alignment)
      const gapValue = GridCSSGenerator.generateSpacing(spacing)

      if (Array.isArray(rows)) {
        // Simple row configuration
        gridTemplateRows = GridCSSGenerator.generateRows(rows)
      } else {
        // Responsive row configuration (legacy)
        const responsiveCSS = GridCSSGenerator.generateResponsiveGridCSS(
          rows,
          'grid-template-rows'
        )
        const templateValue = responsiveCSS['grid-template-rows']
        gridTemplateRows =
          typeof templateValue === 'string' ? templateValue : 'auto'
      }

      baseStyles = {
        ...baseStyles,
        gap: gapValue,
        ...alignmentStyles,
      }
    }

    baseStyles.gridTemplateRows = gridTemplateRows

    // Phase 3: Apply animation styles
    const animationStyles = this.generateAnimationStyles(animations)
    Object.assign(baseStyles, animationStyles)

    // Phase 3: Generate accessibility attributes
    const rowCount = this.getRowCount()
    const accessibilityAttrs = this.generateAccessibilityAttributes(
      accessibility,
      undefined,
      rowCount
    )

    // Phase 3: Generate reduced motion CSS
    const reducedMotionCSS =
      GridCSSGenerator.generateReducedMotionCSS(accessibility)
    Object.assign(baseStyles, reducedMotionCSS)

    // Phase 3: Generate advanced styling CSS
    const advancedStylingCSS = this.generateStylingCSS(styling)
    Object.assign(baseStyles, advancedStylingCSS)

    const element = {
      type: 'element' as const,
      tag: this.effectiveTag,
      props: {
        className: classString,
        style: baseStyles,
        ...accessibilityAttrs,
        // Add debug attributes
        ...(debug.isEnabled() && {
          'data-tachui-component': 'LazyHGrid',
          ...(debugLabel && { 'data-tachui-label': debugLabel }),
        }),
      },
      children: renderedChildren,
      // Add component metadata
      componentMetadata: {
        originalType: 'LazyHGrid',
        overriddenTo:
          this.effectiveTag !== 'div' ? this.effectiveTag : undefined,
        validationResult: this.validationResult,
        // Phase 2: Include responsive modifier for processing
        ...(responsive &&
          baseStyles._responsiveModifier && {
            responsiveModifier: baseStyles._responsiveModifier,
          }),
      },
    }

    // Clean up internal responsive modifier from styles
    if (baseStyles._responsiveModifier) {
      delete baseStyles._responsiveModifier
    }

    return [element]
  }

  /**
   * Render sectioned data with headers and footers (Phase 3)
   */
  private renderSections(
    sections: GridSection[],
    pinnedViews?: ('sectionHeaders' | 'sectionFooters')[]
  ): any[] {
    const renderedElements: any[] = []
    const rowCount = this.getRowCount()
    const isPinnedHeaders = pinnedViews?.includes('sectionHeaders')
    const isPinnedFooters = pinnedViews?.includes('sectionFooters')

    sections.forEach(section => {
      // Render section header
      if (section.header) {
        const headerStyle =
          section.headerStyle || (isPinnedHeaders ? 'sticky' : 'automatic')
        const headerComponent = new GridSectionHeaderComponent({
          content: section.header,
          sectionId: section.id,
          type: 'header',
          style: headerStyle,
        })

        const headerResult = headerComponent.render()
        if (Array.isArray(headerResult)) {
          // Update grid-row style to span all rows for horizontal grid
          headerResult.forEach(element => {
            if (element.props && element.props.style) {
              element.props.style.gridRow = `1 / span ${rowCount}`
              element.props.style.gridColumn = 'auto'
            }
          })
          renderedElements.push(...headerResult)
        }
      }

      // Render section items
      section.items.forEach(item => {
        const itemResult = item.render()
        const flatResult = Array.isArray(itemResult) ? itemResult : [itemResult]
        renderedElements.push(...flatResult)
      })

      // Render section footer
      if (section.footer) {
        const footerStyle =
          section.footerStyle || (isPinnedFooters ? 'sticky' : 'automatic')
        const footerComponent = new GridSectionHeaderComponent({
          content: section.footer,
          sectionId: section.id,
          type: 'footer',
          style: footerStyle,
        })

        const footerResult = footerComponent.render()
        if (Array.isArray(footerResult)) {
          // Update grid-row style to span all rows for horizontal grid
          footerResult.forEach(element => {
            if (element.props && element.props.style) {
              element.props.style.gridRow = `1 / span ${rowCount}`
              element.props.style.gridColumn = 'auto'
            }
          })
          renderedElements.push(...footerResult)
        }
      }
    })

    return renderedElements
  }

  /**
   * Get the number of rows in the grid (Phase 3 helper)
   */
  private getRowCount(): number {
    const { rows } = this.props

    if (Array.isArray(rows)) {
      return rows.length
    }

    // For responsive configurations, use the base or first available
    if (typeof rows === 'object' && rows !== null) {
      const responsiveConfig = rows as any
      const baseRows =
        responsiveConfig.base ||
        responsiveConfig.sm ||
        responsiveConfig.md ||
        responsiveConfig.lg ||
        responsiveConfig.xl ||
        responsiveConfig.xxl
      return Array.isArray(baseRows) ? baseRows.length : 1
    }

    return 1
  }

  /**
   * Generate rows from GridItemConfig array (Phase 2 helper)
   */
  private generateRowsFromConfig(items: GridItemConfig[]): string {
    return items
      .map(item => {
        switch (item.type) {
          case 'fixed':
            return `${item.size}px`
          case 'flexible':
            const minSize = item.minimum || 0
            const maxSize = item.maximum ? `${item.maximum}px` : '1fr'
            return minSize > 0 ? `minmax(${minSize}px, ${maxSize})` : '1fr'
          case 'adaptive':
            const adaptiveMin = item.minimum
            const adaptiveMax = item.maximum ? `${item.maximum}px` : '1fr'
            return `minmax(${adaptiveMin}px, ${adaptiveMax})`
          default:
            return 'auto'
        }
      })
      .join(' ')
  }
}

/**
 * Grid component factory function with modifier support
 */
export function Grid(
  props: GridProps = {}
): ModifiableComponent<GridProps> & {
  modifier: ModifierBuilder<ModifiableComponent<GridProps>>
} {
  const { children = [], ...gridProps } = props
  const component = new GridComponent(gridProps, children)
  return withModifiers(component)
}

/**
 * GridRow component factory function with modifier support
 */
export function GridRow(
  children: ComponentInstance[] = [],
  props: Omit<GridRowProps, 'children'> = {}
): ModifiableComponent<GridRowProps> & {
  modifier: ModifierBuilder<ModifiableComponent<GridRowProps>>
} {
  const gridRowProps: GridRowProps = { ...props, children }
  const component = new GridRowComponent(gridRowProps, children)
  return withModifiers(component)
}

/**
 * LazyVGrid component factory function with modifier support
 */
export function LazyVGrid(
  props: LazyVGridProps
): ModifiableComponent<LazyVGridProps> & {
  modifier: ModifierBuilder<ModifiableComponent<LazyVGridProps>>
} {
  const { children = [], ...vgridProps } = props
  const component = new LazyVGridComponent(
    { ...vgridProps, children },
    children
  )
  return withModifiers(component)
}

/**
 * LazyHGrid component factory function with modifier support
 */
export function LazyHGrid(
  props: LazyHGridProps
): ModifiableComponent<LazyHGridProps> & {
  modifier: ModifierBuilder<ModifiableComponent<LazyHGridProps>>
} {
  const { children = [], ...hgridProps } = props
  const component = new LazyHGridComponent(
    { ...hgridProps, children },
    children
  )
  return withModifiers(component)
}

/**
 * Create a grid section with header, footer, and items (Phase 3)
 */
export function createGridSection(config: {
  id: string
  header?: ComponentInstance | string
  footer?: ComponentInstance | string
  items: ComponentInstance[]
  headerStyle?: 'automatic' | 'grouped' | 'plain' | 'sticky'
  footerStyle?: 'automatic' | 'grouped' | 'plain' | 'sticky'
}): GridSection {
  return {
    id: config.id,
    header: config.header,
    footer: config.footer,
    items: config.items,
    headerStyle: config.headerStyle || 'automatic',
    footerStyle: config.footerStyle || 'automatic',
  }
}

/**
 * Grid section header factory (Phase 3)
 */
export function GridSectionHeader(
  props: GridSectionHeaderProps
): ModifiableComponent<GridSectionHeaderProps> & {
  modifier: ModifierBuilder<ModifiableComponent<GridSectionHeaderProps>>
} {
  const component = new GridSectionHeaderComponent(props)
  return withModifiers(component)
}

/**
 * Grid animation preset functions (Phase 3)
 */
export const GridAnimations = {
  /**
   * Basic fade-in animation for new items
   */
  fadeIn(duration: number = 250, delay: number = 0): GridAnimationConfig {
    return {
      itemChanges: {
        enter: {
          duration,
          delay,
          easing: 'ease-out',
          from: 'fade',
        },
      },
    }
  },

  /**
   * Scale animation for new items
   */
  scaleIn(duration: number = 300, delay: number = 0): GridAnimationConfig {
    return {
      itemChanges: {
        enter: {
          duration,
          delay,
          easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
          from: 'scale',
        },
      },
    }
  },

  /**
   * Slide animation for new items
   */
  slideIn(
    direction: 'up' | 'down' | 'left' | 'right' = 'up',
    duration: number = 250
  ): GridAnimationConfig {
    return {
      itemChanges: {
        enter: {
          duration,
          easing: 'ease-out',
          from: `slide-${direction}` as any,
        },
      },
    }
  },

  /**
   * Smooth layout changes when grid structure changes
   */
  smoothLayout(duration: number = 300): GridAnimationConfig {
    return {
      layoutChanges: {
        duration,
        easing: 'ease-out',
      },
    }
  },

  /**
   * Responsive breakpoint animations
   */
  smoothResponsive(duration: number = 250): GridAnimationConfig {
    return {
      responsive: {
        duration,
        easing: 'ease-out',
      },
    }
  },

  /**
   * Comprehensive animation configuration
   */
  comprehensive(
    itemDuration: number = 250,
    layoutDuration: number = 300
  ): GridAnimationConfig {
    return {
      itemChanges: {
        enter: {
          duration: itemDuration,
          easing: 'ease-out',
          from: 'fade',
        },
      },
      layoutChanges: {
        duration: layoutDuration,
        easing: 'ease-out',
      },
      responsive: {
        duration: layoutDuration,
        easing: 'ease-out',
      },
      sections: {
        duration: itemDuration,
        easing: 'ease-out',
      },
    }
  },

  /**
   * Staggered entrance animation for multiple items
   */
  staggered(itemDuration: number = 250): GridAnimationConfig {
    return {
      itemChanges: {
        enter: {
          duration: itemDuration,
          delay: 0, // Stagger delay is calculated per-item in applyItemAnimations
          easing: 'ease-out',
          from: 'fade',
        },
      },
    }
  },
}

/**
 * Grid accessibility preset functions (Phase 3)
 */
export const GridAccessibility = {
  /**
   * Full accessibility support with keyboard navigation and screen reader optimizations
   */
  full(label: string, description?: string): GridAccessibilityConfig {
    return {
      label,
      description,
      keyboardNavigation: {
        enabled: true,
        mode: 'grid',
        pageNavigation: true,
        homeEndNavigation: true,
      },
      focusManagement: {
        enabled: true,
        skipLinks: true,
      },
      screenReader: {
        enabled: true,
        announceChanges: true,
        announceStructure: true,
        announcePositions: true,
      },
      reducedMotion: {
        respectPreference: true,
        fallbackBehavior: 'disable',
      },
    }
  },

  /**
   * Basic accessibility support for simple grids
   */
  basic(label: string): GridAccessibilityConfig {
    return {
      label,
      keyboardNavigation: true,
      reducedMotion: true,
    }
  },

  /**
   * Screen reader focused accessibility
   */
  screenReader(label: string, description?: string): GridAccessibilityConfig {
    return {
      label,
      description,
      role: 'grid',
      screenReader: {
        enabled: true,
        announceStructure: true,
        announceChanges: true,
      },
      reducedMotion: true,
    }
  },

  /**
   * Keyboard navigation focused accessibility
   */
  keyboardOnly(label: string): GridAccessibilityConfig {
    return {
      label,
      keyboardNavigation: {
        enabled: true,
        mode: 'grid',
        pageNavigation: true,
        homeEndNavigation: true,
      },
      focusManagement: {
        enabled: true,
      },
    }
  },
}

/**
 * Grid styling preset functions (Phase 3)
 */
export const GridStyling = {
  /**
   * Debug grid with visible lines and areas
   */
  debug(options?: {
    lineColor?: string
    showAreas?: boolean
  }): GridStylingConfig {
    return {
      debug: {
        enabled: true,
        showLines: true,
        showAreas: options?.showAreas || false,
        lineColor: options?.lineColor || '#ff0000',
        lineStyle: 'dashed',
      },
    }
  },

  /**
   * Interactive grid with hover and focus effects
   */
  interactive(
    hoverTransform: 'scale' | 'lift' | 'glow' | 'highlight' = 'scale'
  ): GridStylingConfig {
    return {
      itemStates: {
        hover: {
          enabled: true,
          transform: hoverTransform,
          transition: 'all 0.2s ease',
        },
        focus: {
          enabled: true,
          style: 'ring',
          color: '#3b82f6',
        },
        active: {
          enabled: true,
          transform: 'scale',
        },
      },
    }
  },

  /**
   * Card-style grid with background and borders
   */
  card(options?: {
    shadow?: string
    borderRadius?: number
    padding?: number
  }): GridStylingConfig {
    return {
      container: {
        background: '#ffffff',
        border: '1px solid #e0e0e0',
        borderRadius: options?.borderRadius || 8,
        boxShadow: options?.shadow || '0 2px 4px rgba(0,0,0,0.1)',
        padding: options?.padding || 16,
      },
      itemStates: {
        hover: {
          enabled: true,
          transform: 'lift',
        },
      },
    }
  },

  /**
   * Custom template areas grid
   */
  templateAreas(areas: string[]): GridStylingConfig {
    return {
      templateAreas: areas,
    }
  },

  /**
   * Grid with background pattern
   */
  backgroundPattern(
    pattern: 'dots' | 'lines' | 'grid',
    color?: string,
    opacity?: number
  ): GridStylingConfig {
    return {
      container: {
        background: {
          pattern,
          color: color || '#e0e0e0',
          opacity: opacity || 0.5,
        },
      },
    }
  },

  /**
   * Comprehensive styling with multiple features
   */
  comprehensive(options?: {
    debug?: boolean
    interactive?: boolean
    card?: boolean
    pattern?: 'dots' | 'lines' | 'grid'
  }): GridStylingConfig {
    const config: GridStylingConfig = {}

    if (options?.debug) {
      config.debug = { enabled: true, showLines: true }
    }

    if (options?.interactive) {
      config.itemStates = {
        hover: { enabled: true, transform: 'scale' },
        focus: { enabled: true, style: 'ring' },
        active: { enabled: true, transform: 'scale' },
      }
    }

    if (options?.card) {
      config.container = {
        background: '#ffffff',
        border: '1px solid #e0e0e0',
        borderRadius: 8,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: 16,
      }
    }

    if (options?.pattern) {
      config.container = {
        ...config.container,
        background: {
          pattern: options.pattern,
          color: '#e0e0e0',
          opacity: 0.3,
        },
      }
    }

    return config
  },
}

// Export all the types and components (including component classes for testing)
export {
  BaseGridComponent,
  GridComponent as EnhancedGrid,
  GridRowComponent as EnhancedGridRow,
  LazyVGridComponent as EnhancedLazyVGrid,
  LazyHGridComponent as EnhancedLazyHGrid,
  GridCSSGenerator,
  GridSectionHeaderComponent,
  // Phase 2: Enhanced debugging and performance utilities
  GridDebugger,
  GridPerformanceMonitor,
}
