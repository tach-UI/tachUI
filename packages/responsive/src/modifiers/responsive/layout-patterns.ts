/**
 * Responsive Layout Utility Patterns
 *
 * Provides common responsive layout patterns and utilities that make it easy
 * to create responsive designs without writing custom CSS for every use case.
 */

import {
  ResponsiveValue,
  BreakpointKey,
  ResponsiveSpacingConfig,
} from './types'
import { createResponsiveModifier } from './responsive-modifier'

/**
 * Configuration for responsive grid layout
 */
export interface ResponsiveGridConfig {
  columns?: ResponsiveValue<number>
  rows?: ResponsiveValue<number>
  gap?: ResponsiveValue<string | number>
  columnGap?: ResponsiveValue<string | number>
  rowGap?: ResponsiveValue<string | number>
  autoFlow?: ResponsiveValue<'row' | 'column' | 'row dense' | 'column dense'>
  autoRows?: ResponsiveValue<string>
  autoColumns?: ResponsiveValue<string>
  templateAreas?: ResponsiveValue<string>
}

/**
 * Configuration for responsive flexbox layout
 */
export interface ResponsiveFlexConfig {
  direction?: ResponsiveValue<
    'row' | 'row-reverse' | 'column' | 'column-reverse'
  >
  wrap?: ResponsiveValue<'nowrap' | 'wrap' | 'wrap-reverse'>
  justify?: ResponsiveValue<
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly'
  >
  align?: ResponsiveValue<
    'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
  >
  alignContent?: ResponsiveValue<
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'stretch'
    | 'space-between'
    | 'space-around'
  >
  gap?: ResponsiveValue<string | number>
  columnGap?: ResponsiveValue<string | number>
  rowGap?: ResponsiveValue<string | number>
}

/**
 * Configuration for responsive container layout
 */
export interface ResponsiveContainerConfig {
  maxWidth?: ResponsiveValue<string | number>
  width?: ResponsiveValue<string | number>
  padding?: ResponsiveValue<string | number>
  margin?: ResponsiveValue<string | number>
  centerContent?: ResponsiveValue<boolean>
}

/**
 * Responsive Grid Layout Utilities
 */
export class ResponsiveGridPatterns {
  /**
   * Create a responsive grid with automatic column sizing
   */
  static autoFit(config: {
    minColumnWidth: ResponsiveValue<string | number>
    gap?: ResponsiveValue<string | number>
    maxColumns?: ResponsiveValue<number>
  }) {
    const gridConfig: any = {}

    if (typeof config.minColumnWidth === 'object') {
      // Handle responsive minColumnWidth
      gridConfig.gridTemplateColumns = {}
      for (const [breakpoint, width] of Object.entries(config.minColumnWidth)) {
        const widthValue = typeof width === 'number' ? `${width}px` : width
        const maxCols =
          config.maxColumns && typeof config.maxColumns === 'object'
            ? config.maxColumns[breakpoint as BreakpointKey] || 'auto'
            : config.maxColumns || 'auto'

        gridConfig.gridTemplateColumns[breakpoint] =
          maxCols === 'auto'
            ? `repeat(auto-fit, minmax(${widthValue}, 1fr))`
            : `repeat(${maxCols}, minmax(${widthValue}, 1fr))`
      }
    } else {
      const widthValue =
        typeof config.minColumnWidth === 'number'
          ? `${config.minColumnWidth}px`
          : config.minColumnWidth
      const maxCols = config.maxColumns || 'auto'
      gridConfig.gridTemplateColumns =
        maxCols === 'auto'
          ? `repeat(auto-fit, minmax(${widthValue}, 1fr))`
          : `repeat(${maxCols}, minmax(${widthValue}, 1fr))`
    }

    if (config.gap) {
      gridConfig.gap = config.gap
    }

    gridConfig.display = 'grid'

    return createResponsiveModifier(gridConfig)
  }

  /**
   * Create a responsive grid with explicit column counts
   */
  static columns(
    columns: ResponsiveValue<number>,
    config?: {
      gap?: ResponsiveValue<string | number>
      rowGap?: ResponsiveValue<string | number>
      autoRows?: ResponsiveValue<string>
    }
  ) {
    const gridConfig: any = {
      display: 'grid',
      gridTemplateColumns:
        typeof columns === 'object'
          ? Object.fromEntries(
              Object.entries(columns).map(([bp, cols]) => [
                bp,
                `repeat(${cols}, 1fr)`,
              ])
            )
          : `repeat(${columns}, 1fr)`,
    }

    if (config?.gap) gridConfig.gap = config.gap
    if (config?.rowGap) gridConfig.rowGap = config.rowGap
    if (config?.autoRows) gridConfig.gridAutoRows = config.autoRows

    return createResponsiveModifier(gridConfig)
  }

  /**
   * Create responsive masonry-style grid
   */
  static masonry(config: {
    columns: ResponsiveValue<number>
    gap?: ResponsiveValue<string | number>
  }) {
    const gridConfig: any = {
      display: 'grid',
      gridTemplateColumns:
        typeof config.columns === 'object'
          ? Object.fromEntries(
              Object.entries(config.columns).map(([bp, cols]) => [
                bp,
                `repeat(${cols}, 1fr)`,
              ])
            )
          : `repeat(${config.columns}, 1fr)`,
      gridAutoRows: 'max-content',
    }

    if (config.gap) gridConfig.gap = config.gap

    return createResponsiveModifier(gridConfig)
  }
}

/**
 * Responsive Flexbox Layout Utilities
 */
export class ResponsiveFlexPatterns {
  /**
   * Create a responsive flex container that stacks on mobile, flows horizontally on desktop
   */
  static stackToRow(config?: {
    stackBreakpoint?: BreakpointKey
    gap?: ResponsiveValue<string | number>
    align?: ResponsiveValue<
      'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
    >
    justify?: ResponsiveValue<
      | 'flex-start'
      | 'flex-end'
      | 'center'
      | 'space-between'
      | 'space-around'
      | 'space-evenly'
    >
  }) {
    const stackBreakpoint = config?.stackBreakpoint || 'md'

    const flexConfig: any = {
      display: 'flex',
      flexDirection: {
        base: 'column',
        [stackBreakpoint]: 'row',
      },
    }

    if (config?.gap) flexConfig.gap = config.gap
    if (config?.align) flexConfig.alignItems = config.align
    if (config?.justify) flexConfig.justifyContent = config.justify

    return createResponsiveModifier(flexConfig)
  }

  /**
   * Create a responsive flex container with wrapping behavior
   */
  static wrap(config?: ResponsiveFlexConfig) {
    const flexConfig: any = {
      display: 'flex',
      flexWrap: 'wrap',
      ...config,
    }

    return createResponsiveModifier(flexConfig)
  }

  /**
   * Create centered flex layout
   */
  static center(direction: ResponsiveValue<'row' | 'column'> = 'row') {
    const flexConfig: any = {
      display: 'flex',
      flexDirection: direction,
      justifyContent: 'center',
      alignItems: 'center',
    }

    return createResponsiveModifier(flexConfig)
  }

  /**
   * Create space-between flex layout
   */
  static spaceBetween(direction: ResponsiveValue<'row' | 'column'> = 'row') {
    const flexConfig: any = {
      display: 'flex',
      flexDirection: direction,
      justifyContent: 'space-between',
      alignItems: 'center',
    }

    return createResponsiveModifier(flexConfig)
  }
}

/**
 * Responsive Container Utilities
 */
export class ResponsiveContainerPatterns {
  /**
   * Create a responsive container with max-width constraints
   */
  static container(config?: ResponsiveContainerConfig) {
    const containerConfig: any = {
      width: '100%',
      marginLeft: 'auto',
      marginRight: 'auto',
    }

    if (config?.maxWidth) {
      containerConfig.maxWidth = config.maxWidth
    } else {
      // Default responsive max-widths
      containerConfig.maxWidth = {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      }
    }

    if (config?.padding) {
      containerConfig.paddingLeft = config.padding
      containerConfig.paddingRight = config.padding
    }

    if (config?.margin) {
      containerConfig.marginTop = config.margin
      containerConfig.marginBottom = config.margin
    }

    return createResponsiveModifier(containerConfig)
  }

  /**
   * Create a full-width container that breaks out of constraints
   */
  static fullWidth() {
    return createResponsiveModifier({
      width: '100vw',
      marginLeft: 'calc(-50vw + 50%)',
      marginRight: 'calc(-50vw + 50%)',
    })
  }

  /**
   * Create a section container with responsive padding
   */
  static section(config?: {
    paddingY?: ResponsiveValue<string | number>
    paddingX?: ResponsiveValue<string | number>
    maxWidth?: ResponsiveValue<string | number>
  }) {
    const sectionConfig: any = {}

    if (config?.paddingY) {
      sectionConfig.paddingTop = config.paddingY
      sectionConfig.paddingBottom = config.paddingY
    }

    if (config?.paddingX) {
      sectionConfig.paddingLeft = config.paddingX
      sectionConfig.paddingRight = config.paddingX
    }

    if (config?.maxWidth) {
      sectionConfig.maxWidth = config.maxWidth
      sectionConfig.marginLeft = 'auto'
      sectionConfig.marginRight = 'auto'
    }

    return createResponsiveModifier(sectionConfig)
  }
}

/**
 * Responsive Visibility Utilities
 */
export class ResponsiveVisibilityPatterns {
  /**
   * Show element only on specific breakpoints
   */
  static showOn(breakpoints: BreakpointKey[]) {
    const displayConfig: any = {
      display: {}, // Start with empty object
    }

    // Show on specified breakpoints
    for (const breakpoint of breakpoints) {
      displayConfig.display[breakpoint] = 'block'
    }

    return createResponsiveModifier(displayConfig)
  }

  /**
   * Hide element only on specific breakpoints
   */
  static hideOn(breakpoints: BreakpointKey[]) {
    const displayConfig: any = {
      display: {}, // Start with empty object
    }

    // Hide on specified breakpoints
    for (const breakpoint of breakpoints) {
      displayConfig.display[breakpoint] = 'none'
    }

    return createResponsiveModifier(displayConfig)
  }

  /**
   * Show on mobile, hide on desktop
   */
  static mobileOnly() {
    return createResponsiveModifier({
      display: {
        base: 'block',
        md: 'none',
      },
    })
  }

  /**
   * Hide on mobile, show on desktop
   */
  static desktopOnly() {
    return createResponsiveModifier({
      display: {
        base: 'none',
        md: 'block',
      },
    })
  }

  /**
   * Show only on tablet breakpoint
   */
  static tabletOnly() {
    return createResponsiveModifier({
      display: {
        base: 'none',
        md: 'block',
        lg: 'none',
      },
    })
  }
}

/**
 * Responsive Spacing Utilities
 */
export class ResponsiveSpacingPatterns {
  /**
   * Create responsive padding
   */
  static padding(config: ResponsiveSpacingConfig) {
    const paddingConfig: any = {}

    if (config.all) paddingConfig.padding = config.all
    if (config.horizontal) {
      paddingConfig.paddingLeft = config.horizontal
      paddingConfig.paddingRight = config.horizontal
    }
    if (config.vertical) {
      paddingConfig.paddingTop = config.vertical
      paddingConfig.paddingBottom = config.vertical
    }
    if (config.top) paddingConfig.paddingTop = config.top
    if (config.right) paddingConfig.paddingRight = config.right
    if (config.bottom) paddingConfig.paddingBottom = config.bottom
    if (config.left) paddingConfig.paddingLeft = config.left

    return createResponsiveModifier(paddingConfig)
  }

  /**
   * Create responsive margin
   */
  static margin(config: ResponsiveSpacingConfig) {
    const marginConfig: any = {}

    if (config.all) marginConfig.margin = config.all
    if (config.horizontal) {
      marginConfig.marginLeft = config.horizontal
      marginConfig.marginRight = config.horizontal
    }
    if (config.vertical) {
      marginConfig.marginTop = config.vertical
      marginConfig.marginBottom = config.vertical
    }
    if (config.top) marginConfig.marginTop = config.top
    if (config.right) marginConfig.marginRight = config.right
    if (config.bottom) marginConfig.marginBottom = config.bottom
    if (config.left) marginConfig.marginLeft = config.left

    return createResponsiveModifier(marginConfig)
  }

  /**
   * Create responsive gap (for flexbox and grid)
   */
  static gap(config: {
    all?: ResponsiveValue<string | number>
    column?: ResponsiveValue<string | number>
    row?: ResponsiveValue<string | number>
  }) {
    const gapConfig: any = {}

    if (config.all) gapConfig.gap = config.all
    if (config.column) gapConfig.columnGap = config.column
    if (config.row) gapConfig.rowGap = config.row

    return createResponsiveModifier(gapConfig)
  }
}

/**
 * Responsive Typography Utilities
 */
export class ResponsiveTypographyPatterns {
  /**
   * Create responsive font scale
   */
  static scale(config: {
    base: string | number
    scale?: ResponsiveValue<number>
    lineHeight?: ResponsiveValue<number | string>
  }) {
    const typographyConfig: any = {
      fontSize: config.base,
    }

    if (config.scale && typeof config.scale === 'object') {
      typographyConfig.fontSize = {}
      for (const [breakpoint, scaleValue] of Object.entries(config.scale)) {
        const baseSize =
          typeof config.base === 'number'
            ? config.base
            : parseFloat(config.base)
        typographyConfig.fontSize[breakpoint] = `${baseSize * scaleValue}px`
      }
    }

    if (config.lineHeight) {
      typographyConfig.lineHeight = config.lineHeight
    }

    return createResponsiveModifier(typographyConfig)
  }

  /**
   * Create fluid typography that scales smoothly
   */
  static fluid(config: {
    minSize: string | number
    maxSize: string | number
    minBreakpoint?: string
    maxBreakpoint?: string
  }) {
    const minBp = config.minBreakpoint || '320px'
    const maxBp = config.maxBreakpoint || '1200px'
    const minSize =
      typeof config.minSize === 'number'
        ? `${config.minSize}px`
        : config.minSize
    const maxSize =
      typeof config.maxSize === 'number'
        ? `${config.maxSize}px`
        : config.maxSize

    return createResponsiveModifier({
      fontSize: `clamp(${minSize}, calc(${minSize} + (${maxSize} - ${minSize}) * ((100vw - ${minBp}) / (${maxBp} - ${minBp}))), ${maxSize})`,
    })
  }
}

/**
 * Common Layout Patterns
 */
export const LayoutPatterns = {
  /**
   * Sidebar layout that collapses on mobile
   */
  sidebar: (config?: {
    sidebarWidth?: ResponsiveValue<string | number>
    collapseBreakpoint?: BreakpointKey
    gap?: ResponsiveValue<string | number>
  }) => {
    const collapseBreakpoint = config?.collapseBreakpoint || 'md'
    const sidebarWidth = config?.sidebarWidth || '250px'

    return createResponsiveModifier({
      display: 'grid',
      gridTemplateColumns: {
        base: '1fr',
        [collapseBreakpoint]: `${sidebarWidth} 1fr`,
      },
      gap: config?.gap || '1rem',
    })
  },

  /**
   * Holy grail layout (header, footer, sidebar, main content)
   */
  holyGrail: (config?: {
    headerHeight?: ResponsiveValue<string | number>
    footerHeight?: ResponsiveValue<string | number>
    sidebarWidth?: ResponsiveValue<string | number>
    collapseBreakpoint?: BreakpointKey
  }) => {
    const collapseBreakpoint = config?.collapseBreakpoint || 'lg'

    return createResponsiveModifier({
      display: 'grid',
      gridTemplateAreas: {
        base: '"header" "main" "footer"',
        [collapseBreakpoint]: '"header header" "sidebar main" "footer footer"',
      },
      gridTemplateRows: {
        base: `${config?.headerHeight || 'auto'} 1fr ${config?.footerHeight || 'auto'}`,
        [collapseBreakpoint]: `${config?.headerHeight || 'auto'} 1fr ${config?.footerHeight || 'auto'}`,
      },
      gridTemplateColumns: {
        base: '1fr',
        [collapseBreakpoint]: `${config?.sidebarWidth || '250px'} 1fr`,
      },
      minHeight: '100vh',
    })
  },

  /**
   * Card grid layout
   */
  cardGrid: (config?: {
    minCardWidth?: ResponsiveValue<string | number>
    gap?: ResponsiveValue<string | number>
    maxColumns?: ResponsiveValue<number>
  }) => {
    return ResponsiveGridPatterns.autoFit({
      minColumnWidth: config?.minCardWidth || '300px',
      gap: config?.gap || '1rem',
      maxColumns: config?.maxColumns,
    })
  },

  /**
   * Hero section layout
   */
  hero: (config?: {
    minHeight?: ResponsiveValue<string | number>
    textAlign?: ResponsiveValue<'left' | 'center' | 'right'>
    padding?: ResponsiveValue<string | number>
  }) => {
    return createResponsiveModifier({
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: config?.textAlign || 'center',
      minHeight: config?.minHeight || '50vh',
      padding: config?.padding || '2rem',
    })
  },
}

/**
 * Export all layout patterns for easy access
 */
export {
  ResponsiveGridPatterns as ResponsiveGrid,
  ResponsiveFlexPatterns as Flex,
  ResponsiveContainerPatterns as Container,
  ResponsiveVisibilityPatterns as Visibility,
  ResponsiveSpacingPatterns as Spacing,
  ResponsiveTypographyPatterns as ResponsiveTypography,
}
