/**
 * Responsive Modifier Builder
 *
 * Extends the existing ModifierBuilder with responsive capabilities.
 * Provides a fluent API for creating responsive modifiers that integrate
 * seamlessly with the existing modifier system.
 */

import type { ModifierBuilder, Modifier } from '@tachui/core'
import type { ComponentInstance } from '@tachui/core'
import {
  ResponsiveValue,
  ResponsiveStyleConfig,
  ResponsiveSpacingConfig,
  ResponsiveDimensionConfig,
  ResponsiveTypographyConfig,
  BreakpointKey,
  isResponsiveValue,
} from './types'
import {
  createResponsiveModifier,
  createMediaQueryModifier,
  createResponsivePropertyModifier,
  createResponsiveLayoutModifier,
} from './responsive-modifier'

/**
 * Responsive modifier builder interface
 */
export interface ResponsiveModifierBuilder<
  T extends ComponentInstance = ComponentInstance,
> {
  // Core responsive methods
  responsive(config: ResponsiveStyleConfig): ResponsiveModifierBuilder<T>
  mediaQuery(
    query: string,
    styles: Record<string, any>
  ): ResponsiveModifierBuilder<T>

  // Advanced media query methods
  orientation(
    orientation: 'portrait' | 'landscape',
    styles: Record<string, any>
  ): ResponsiveModifierBuilder<T>
  colorScheme(
    scheme: 'light' | 'dark',
    styles: Record<string, any>
  ): ResponsiveModifierBuilder<T>
  reducedMotion(styles: Record<string, any>): ResponsiveModifierBuilder<T>
  highContrast(styles: Record<string, any>): ResponsiveModifierBuilder<T>
  touchDevice(styles: Record<string, any>): ResponsiveModifierBuilder<T>
  mouseDevice(styles: Record<string, any>): ResponsiveModifierBuilder<T>
  retina(styles: Record<string, any>): ResponsiveModifierBuilder<T>
  print(styles: Record<string, any>): ResponsiveModifierBuilder<T>

  // Responsive layout methods
  responsiveLayout(config: {
    direction?: ResponsiveValue<
      'row' | 'column' | 'row-reverse' | 'column-reverse'
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
    gap?: ResponsiveValue<number | string>
  }): ResponsiveModifierBuilder<T>

  // Responsive dimension methods
  responsiveWidth(
    value: ResponsiveValue<number | string>
  ): ResponsiveModifierBuilder<T>
  responsiveHeight(
    value: ResponsiveValue<number | string>
  ): ResponsiveModifierBuilder<T>
  responsiveSize(
    config: ResponsiveDimensionConfig
  ): ResponsiveModifierBuilder<T>

  // Responsive spacing methods
  responsivePadding(
    value: ResponsiveValue<number | string> | ResponsiveSpacingConfig
  ): ResponsiveModifierBuilder<T>
  responsiveMargin(
    value: ResponsiveValue<number | string> | ResponsiveSpacingConfig
  ): ResponsiveModifierBuilder<T>

  // Responsive typography methods
  responsiveFont(
    config: ResponsiveTypographyConfig
  ): ResponsiveModifierBuilder<T>
  responsiveFontSize(
    value: ResponsiveValue<number | string>
  ): ResponsiveModifierBuilder<T>
  responsiveTextAlign(
    value: ResponsiveValue<'left' | 'center' | 'right' | 'justify'>
  ): ResponsiveModifierBuilder<T>

  // Breakpoint shorthand methods
  base: ResponsiveBreakpointBuilder<T>
  sm: ResponsiveBreakpointBuilder<T>
  md: ResponsiveBreakpointBuilder<T>
  lg: ResponsiveBreakpointBuilder<T>
  xl: ResponsiveBreakpointBuilder<T>
  '2xl': ResponsiveBreakpointBuilder<T>

  // Builder methods
  addModifier(modifier: Modifier): void
  build(): T
}

/**
 * Breakpoint-specific builder for shorthand syntax
 * Returns ModifierBuilder to allow chaining with regular modifiers after responsive ones
 */
export interface ResponsiveBreakpointBuilder<
  T extends ComponentInstance = ComponentInstance,
> {
  // Layout properties
  width(value: number | string): ModifierBuilder<T>
  height(value: number | string): ModifierBuilder<T>
  minWidth(value: number | string): ModifierBuilder<T>
  maxWidth(value: number | string): ModifierBuilder<T>
  minHeight(value: number | string): ModifierBuilder<T>
  maxHeight(value: number | string): ModifierBuilder<T>

  // Padding properties
  padding(value: number | string): ModifierBuilder<T>
  paddingHorizontal(value: number | string): ModifierBuilder<T>
  paddingVertical(value: number | string): ModifierBuilder<T>
  paddingTop(value: number | string): ModifierBuilder<T>
  paddingBottom(value: number | string): ModifierBuilder<T>
  paddingLeft(value: number | string): ModifierBuilder<T>
  paddingRight(value: number | string): ModifierBuilder<T>

  // Margin properties
  margin(value: number | string): ModifierBuilder<T>
  marginHorizontal(value: number | string): ModifierBuilder<T>
  marginVertical(value: number | string): ModifierBuilder<T>
  marginTop(value: number | string): ModifierBuilder<T>
  marginBottom(value: number | string): ModifierBuilder<T>
  marginLeft(value: number | string): ModifierBuilder<T>
  marginRight(value: number | string): ModifierBuilder<T>

  // Typography properties
  fontSize(value: number | string): ModifierBuilder<T>
  textAlign(value: 'left' | 'center' | 'right' | 'justify'): ModifierBuilder<T>

  // Display properties
  display(
    value:
      | 'none'
      | 'block'
      | 'inline'
      | 'inline-block'
      | 'flex'
      | 'inline-flex'
      | 'grid'
  ): ModifierBuilder<T>

  // Flexbox properties
  flexDirection(
    value: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  ): ModifierBuilder<T>
  justifyContent(
    value:
      | 'flex-start'
      | 'flex-end'
      | 'center'
      | 'space-between'
      | 'space-around'
      | 'space-evenly'
  ): ModifierBuilder<T>
  alignItems(
    value: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
  ): ModifierBuilder<T>

  // Visual properties
  backgroundColor(value: string): ModifierBuilder<T>
  color(value: string): ModifierBuilder<T>
  opacity(value: number): ModifierBuilder<T>
}

/**
 * Implementation of responsive modifier builder using Proxy delegation
 */
export class ResponsiveModifierBuilderImpl<
  T extends ComponentInstance = ComponentInstance,
> implements ResponsiveModifierBuilder<T>
{
  constructor(private baseBuilder: ModifierBuilder<T>) {
    // Return a Proxy that delegates unknown methods to baseBuilder
    return new Proxy(this, {
      get(target, prop) {
        // If the method exists on this class, use it
        if (prop in target) {
          return target[prop as keyof ResponsiveModifierBuilderImpl<T>]
        }

        // Special handling for responsive breakpoint getters
        if (
          prop === 'base' ||
          prop === 'sm' ||
          prop === 'md' ||
          prop === 'lg' ||
          prop === 'xl' ||
          prop === '2xl'
        ) {
          return target[prop as keyof ResponsiveModifierBuilderImpl<T>]
        }

        // Delegate everything else to baseBuilder
        const baseProp = (target.baseBuilder as any)[prop]
        if (typeof baseProp === 'function') {
          return (...args: any[]) => {
            baseProp.apply(target.baseBuilder, args)
            // Return baseBuilder to maintain fluent chain
            return target.baseBuilder
          }
        }

        return baseProp
      },
    }) as ResponsiveModifierBuilderImpl<T>
  }

  // Delegate essential builder methods
  addModifier(modifier: Modifier): void {
    this.baseBuilder.addModifier(modifier)
  }

  build(): T {
    return this.baseBuilder.build()
  }

  // Core responsive methods
  responsive(config: ResponsiveStyleConfig): ResponsiveModifierBuilder<T> {
    const modifier = createResponsiveModifier(config)
    this.baseBuilder.addModifier(modifier)
    return this
  }

  mediaQuery(
    query: string,
    styles: Record<string, any>
  ): ResponsiveModifierBuilder<T> {
    const modifier = createMediaQueryModifier(query, styles)
    this.baseBuilder.addModifier(modifier)
    return this
  }

  // Advanced media query methods
  orientation(
    orientation: 'portrait' | 'landscape',
    styles: Record<string, any>
  ): ResponsiveModifierBuilder<T> {
    const query = `(orientation: ${orientation})`
    const modifier = createMediaQueryModifier(query, styles)
    this.baseBuilder.addModifier(modifier)
    return this
  }

  colorScheme(
    scheme: 'light' | 'dark',
    styles: Record<string, any>
  ): ResponsiveModifierBuilder<T> {
    const query = `(prefers-color-scheme: ${scheme})`
    const modifier = createMediaQueryModifier(query, styles)
    this.baseBuilder.addModifier(modifier)
    return this
  }

  reducedMotion(styles: Record<string, any>): ResponsiveModifierBuilder<T> {
    const query = '(prefers-reduced-motion: reduce)'
    const modifier = createMediaQueryModifier(query, styles)
    this.baseBuilder.addModifier(modifier)
    return this
  }

  highContrast(styles: Record<string, any>): ResponsiveModifierBuilder<T> {
    const query = '(prefers-contrast: high)'
    const modifier = createMediaQueryModifier(query, styles)
    this.baseBuilder.addModifier(modifier)
    return this
  }

  touchDevice(styles: Record<string, any>): ResponsiveModifierBuilder<T> {
    const query = '(pointer: coarse)'
    const modifier = createMediaQueryModifier(query, styles)
    this.baseBuilder.addModifier(modifier)
    return this
  }

  mouseDevice(styles: Record<string, any>): ResponsiveModifierBuilder<T> {
    const query = '(pointer: fine)'
    const modifier = createMediaQueryModifier(query, styles)
    this.baseBuilder.addModifier(modifier)
    return this
  }

  retina(styles: Record<string, any>): ResponsiveModifierBuilder<T> {
    const query = '(min-resolution: 2dppx)'
    const modifier = createMediaQueryModifier(query, styles)
    this.baseBuilder.addModifier(modifier)
    return this
  }

  print(styles: Record<string, any>): ResponsiveModifierBuilder<T> {
    const query = 'print'
    const modifier = createMediaQueryModifier(query, styles)
    this.baseBuilder.addModifier(modifier)
    return this
  }

  // Responsive layout methods
  responsiveLayout(config: {
    direction?: ResponsiveValue<
      'row' | 'column' | 'row-reverse' | 'column-reverse'
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
    gap?: ResponsiveValue<number | string>
  }): ResponsiveModifierBuilder<T> {
    const modifier = createResponsiveLayoutModifier(config)
    this.baseBuilder.addModifier(modifier)
    return this
  }

  // Responsive dimension methods
  responsiveWidth(
    value: ResponsiveValue<number | string>
  ): ResponsiveModifierBuilder<T> {
    const modifier = createResponsivePropertyModifier('width', value)
    this.baseBuilder.addModifier(modifier)
    return this
  }

  responsiveHeight(
    value: ResponsiveValue<number | string>
  ): ResponsiveModifierBuilder<T> {
    const modifier = createResponsivePropertyModifier('height', value)
    this.baseBuilder.addModifier(modifier)
    return this
  }

  responsiveSize(
    config: ResponsiveDimensionConfig
  ): ResponsiveModifierBuilder<T> {
    const modifier = createResponsiveModifier(config)
    this.baseBuilder.addModifier(modifier)
    return this
  }

  // Responsive spacing methods
  responsivePadding(
    value: ResponsiveValue<number | string> | ResponsiveSpacingConfig
  ): ResponsiveModifierBuilder<T> {
    if (
      isResponsiveValue(value) ||
      typeof value === 'string' ||
      typeof value === 'number'
    ) {
      const modifier = createResponsivePropertyModifier(
        'padding',
        value as ResponsiveValue<number | string>
      )
      this.baseBuilder.addModifier(modifier)
    } else {
      // Handle spacing config
      const styleConfig: ResponsiveStyleConfig = {}
      const config = value as ResponsiveSpacingConfig

      if (config.all) styleConfig.padding = config.all
      if (config.horizontal) {
        styleConfig.paddingLeft = config.horizontal
        styleConfig.paddingRight = config.horizontal
      }
      if (config.vertical) {
        styleConfig.paddingTop = config.vertical
        styleConfig.paddingBottom = config.vertical
      }
      if (config.top) styleConfig.paddingTop = config.top
      if (config.right) styleConfig.paddingRight = config.right
      if (config.bottom) styleConfig.paddingBottom = config.bottom
      if (config.left) styleConfig.paddingLeft = config.left

      const modifier = createResponsiveModifier(styleConfig)
      this.baseBuilder.addModifier(modifier)
    }
    return this
  }

  responsiveMargin(
    value: ResponsiveValue<number | string> | ResponsiveSpacingConfig
  ): ResponsiveModifierBuilder<T> {
    if (
      isResponsiveValue(value) ||
      typeof value === 'string' ||
      typeof value === 'number'
    ) {
      const modifier = createResponsivePropertyModifier(
        'margin',
        value as ResponsiveValue<number | string>
      )
      this.baseBuilder.addModifier(modifier)
    } else {
      // Handle spacing config
      const styleConfig: ResponsiveStyleConfig = {}
      const config = value as ResponsiveSpacingConfig

      if (config.all) styleConfig.margin = config.all
      if (config.horizontal) {
        styleConfig.marginLeft = config.horizontal
        styleConfig.marginRight = config.horizontal
      }
      if (config.vertical) {
        styleConfig.marginTop = config.vertical
        styleConfig.marginBottom = config.vertical
      }
      if (config.top) styleConfig.marginTop = config.top
      if (config.right) styleConfig.marginRight = config.right
      if (config.bottom) styleConfig.marginBottom = config.bottom
      if (config.left) styleConfig.marginLeft = config.left

      const modifier = createResponsiveModifier(styleConfig)
      this.baseBuilder.addModifier(modifier)
    }
    return this
  }

  // Responsive typography methods
  responsiveFont(
    config: ResponsiveTypographyConfig
  ): ResponsiveModifierBuilder<T> {
    const modifier = createResponsiveModifier(config)
    this.baseBuilder.addModifier(modifier)
    return this
  }

  responsiveFontSize(
    value: ResponsiveValue<number | string>
  ): ResponsiveModifierBuilder<T> {
    const modifier = createResponsivePropertyModifier('fontSize', value)
    this.baseBuilder.addModifier(modifier)
    return this
  }

  responsiveTextAlign(
    value: ResponsiveValue<'left' | 'center' | 'right' | 'justify'>
  ): ResponsiveModifierBuilder<T> {
    const modifier = createResponsivePropertyModifier('textAlign', value)
    this.baseBuilder.addModifier(modifier)
    return this
  }

  // Breakpoint shorthand methods
  get base(): ResponsiveBreakpointBuilder<T> {
    return new ResponsiveBreakpointBuilderImpl('base', this, this.baseBuilder)
  }

  get sm(): ResponsiveBreakpointBuilder<T> {
    return new ResponsiveBreakpointBuilderImpl('sm', this, this.baseBuilder)
  }

  get md(): ResponsiveBreakpointBuilder<T> {
    return new ResponsiveBreakpointBuilderImpl('md', this, this.baseBuilder)
  }

  get lg(): ResponsiveBreakpointBuilder<T> {
    return new ResponsiveBreakpointBuilderImpl('lg', this, this.baseBuilder)
  }

  get xl(): ResponsiveBreakpointBuilder<T> {
    return new ResponsiveBreakpointBuilderImpl('xl', this, this.baseBuilder)
  }

  get '2xl'(): ResponsiveBreakpointBuilder<T> {
    return new ResponsiveBreakpointBuilderImpl('2xl', this, this.baseBuilder)
  }

  // Delegate to base builder methods
  [key: string]: any
}

/**
 * Implementation of breakpoint-specific builder
 */
class ResponsiveBreakpointBuilderImpl<
  T extends ComponentInstance = ComponentInstance,
> implements ResponsiveBreakpointBuilder<T>
{
  constructor(
    private breakpoint: BreakpointKey,
    private parentBuilder: ResponsiveModifierBuilder<T>,
    private baseBuilder: ModifierBuilder<T>
  ) {}

  // Layout properties
  width(value: number | string): ModifierBuilder<T> {
    const responsiveValue = { [this.breakpoint]: value }
    const modifier = createResponsivePropertyModifier('width', responsiveValue)
    this.parentBuilder.addModifier(modifier)
    return this.baseBuilder
  }

  height(value: number | string): ModifierBuilder<T> {
    const responsiveValue = { [this.breakpoint]: value }
    const modifier = createResponsivePropertyModifier('height', responsiveValue)
    this.parentBuilder.addModifier(modifier)
    return this.baseBuilder
  }

  minWidth(value: number | string): ModifierBuilder<T> {
    const responsiveValue = { [this.breakpoint]: value }
    const modifier = createResponsivePropertyModifier(
      'minWidth',
      responsiveValue
    )
    this.parentBuilder.addModifier(modifier)
    return this.baseBuilder
  }

  maxWidth(value: number | string): ModifierBuilder<T> {
    const responsiveValue = { [this.breakpoint]: value }
    const modifier = createResponsivePropertyModifier(
      'maxWidth',
      responsiveValue
    )
    this.parentBuilder.addModifier(modifier)
    return this.baseBuilder
  }

  minHeight(value: number | string): ModifierBuilder<T> {
    const responsiveValue = { [this.breakpoint]: value }
    const modifier = createResponsivePropertyModifier(
      'minHeight',
      responsiveValue
    )
    this.parentBuilder.addModifier(modifier)
    return this.baseBuilder
  }

  maxHeight(value: number | string): ModifierBuilder<T> {
    const responsiveValue = { [this.breakpoint]: value }
    const modifier = createResponsivePropertyModifier(
      'maxHeight',
      responsiveValue
    )
    this.parentBuilder.addModifier(modifier)
    return this.baseBuilder
  }

  padding(value: number | string): ModifierBuilder<T> {
    const responsiveValue = { [this.breakpoint]: value }
    const modifier = createResponsivePropertyModifier(
      'padding',
      responsiveValue
    )
    this.parentBuilder.addModifier(modifier)
    return this.baseBuilder
  }

  paddingHorizontal(value: number | string): ModifierBuilder<T> {
    const responsiveValue = { [this.breakpoint]: value }
    const leftModifier = createResponsivePropertyModifier(
      'paddingLeft',
      responsiveValue
    )
    const rightModifier = createResponsivePropertyModifier(
      'paddingRight',
      responsiveValue
    )
    this.parentBuilder.addModifier(leftModifier)
    this.parentBuilder.addModifier(rightModifier)
    return this.baseBuilder
  }

  paddingVertical(value: number | string): ModifierBuilder<T> {
    const responsiveValue = { [this.breakpoint]: value }
    const topModifier = createResponsivePropertyModifier(
      'paddingTop',
      responsiveValue
    )
    const bottomModifier = createResponsivePropertyModifier(
      'paddingBottom',
      responsiveValue
    )
    this.parentBuilder.addModifier(topModifier)
    this.parentBuilder.addModifier(bottomModifier)
    return this.baseBuilder
  }

  paddingTop(value: number | string): ModifierBuilder<T> {
    const responsiveValue = { [this.breakpoint]: value }
    const modifier = createResponsivePropertyModifier(
      'paddingTop',
      responsiveValue
    )
    this.parentBuilder.addModifier(modifier)
    return this.baseBuilder
  }

  paddingBottom(value: number | string): ModifierBuilder<T> {
    const responsiveValue = { [this.breakpoint]: value }
    const modifier = createResponsivePropertyModifier(
      'paddingBottom',
      responsiveValue
    )
    this.parentBuilder.addModifier(modifier)
    return this.baseBuilder
  }

  paddingLeft(value: number | string): ModifierBuilder<T> {
    const responsiveValue = { [this.breakpoint]: value }
    const modifier = createResponsivePropertyModifier(
      'paddingLeft',
      responsiveValue
    )
    this.parentBuilder.addModifier(modifier)
    return this.baseBuilder
  }

  paddingRight(value: number | string): ModifierBuilder<T> {
    const responsiveValue = { [this.breakpoint]: value }
    const modifier = createResponsivePropertyModifier(
      'paddingRight',
      responsiveValue
    )
    this.parentBuilder.addModifier(modifier)
    return this.baseBuilder
  }

  margin(value: number | string): ModifierBuilder<T> {
    const responsiveValue = { [this.breakpoint]: value }
    const modifier = createResponsivePropertyModifier('margin', responsiveValue)
    this.parentBuilder.addModifier(modifier)
    return this.baseBuilder
  }

  marginHorizontal(value: number | string): ModifierBuilder<T> {
    const responsiveValue = { [this.breakpoint]: value }
    const leftModifier = createResponsivePropertyModifier(
      'marginLeft',
      responsiveValue
    )
    const rightModifier = createResponsivePropertyModifier(
      'marginRight',
      responsiveValue
    )
    this.parentBuilder.addModifier(leftModifier)
    this.parentBuilder.addModifier(rightModifier)
    return this.baseBuilder
  }

  marginVertical(value: number | string): ModifierBuilder<T> {
    const responsiveValue = { [this.breakpoint]: value }
    const topModifier = createResponsivePropertyModifier(
      'marginTop',
      responsiveValue
    )
    const bottomModifier = createResponsivePropertyModifier(
      'marginBottom',
      responsiveValue
    )
    this.parentBuilder.addModifier(topModifier)
    this.parentBuilder.addModifier(bottomModifier)
    return this.baseBuilder
  }

  marginTop(value: number | string): ModifierBuilder<T> {
    const responsiveValue = { [this.breakpoint]: value }
    const modifier = createResponsivePropertyModifier(
      'marginTop',
      responsiveValue
    )
    this.parentBuilder.addModifier(modifier)
    return this.baseBuilder
  }

  marginBottom(value: number | string): ModifierBuilder<T> {
    const responsiveValue = { [this.breakpoint]: value }
    const modifier = createResponsivePropertyModifier(
      'marginBottom',
      responsiveValue
    )
    this.parentBuilder.addModifier(modifier)
    return this.baseBuilder
  }

  marginLeft(value: number | string): ModifierBuilder<T> {
    const responsiveValue = { [this.breakpoint]: value }
    const modifier = createResponsivePropertyModifier(
      'marginLeft',
      responsiveValue
    )
    this.parentBuilder.addModifier(modifier)
    return this.baseBuilder
  }

  marginRight(value: number | string): ModifierBuilder<T> {
    const responsiveValue = { [this.breakpoint]: value }
    const modifier = createResponsivePropertyModifier(
      'marginRight',
      responsiveValue
    )
    this.parentBuilder.addModifier(modifier)
    return this.baseBuilder
  }

  // Typography properties
  fontSize(value: number | string): ModifierBuilder<T> {
    const responsiveValue = { [this.breakpoint]: value }
    const modifier = createResponsivePropertyModifier(
      'fontSize',
      responsiveValue
    )
    this.parentBuilder.addModifier(modifier)
    return this.baseBuilder
  }

  textAlign(
    value: 'left' | 'center' | 'right' | 'justify'
  ): ModifierBuilder<T> {
    const responsiveValue = { [this.breakpoint]: value }
    const modifier = createResponsivePropertyModifier(
      'textAlign',
      responsiveValue
    )
    this.parentBuilder.addModifier(modifier)
    return this.baseBuilder
  }

  // Display properties
  display(
    value:
      | 'none'
      | 'block'
      | 'inline'
      | 'inline-block'
      | 'flex'
      | 'inline-flex'
      | 'grid'
  ): ModifierBuilder<T> {
    const responsiveValue = { [this.breakpoint]: value }
    const modifier = createResponsivePropertyModifier(
      'display',
      responsiveValue
    )
    this.parentBuilder.addModifier(modifier)
    return this.baseBuilder
  }

  // Flexbox properties
  flexDirection(
    value: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  ): ModifierBuilder<T> {
    const responsiveValue = { [this.breakpoint]: value }
    const modifier = createResponsivePropertyModifier(
      'flexDirection',
      responsiveValue
    )
    this.parentBuilder.addModifier(modifier)
    return this.baseBuilder
  }

  justifyContent(
    value:
      | 'flex-start'
      | 'flex-end'
      | 'center'
      | 'space-between'
      | 'space-around'
      | 'space-evenly'
  ): ModifierBuilder<T> {
    const responsiveValue = { [this.breakpoint]: value }
    const modifier = createResponsivePropertyModifier(
      'justifyContent',
      responsiveValue
    )
    this.parentBuilder.addModifier(modifier)
    return this.baseBuilder
  }

  alignItems(
    value: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
  ): ModifierBuilder<T> {
    const responsiveValue = { [this.breakpoint]: value }
    const modifier = createResponsivePropertyModifier(
      'alignItems',
      responsiveValue
    )
    this.parentBuilder.addModifier(modifier)
    return this.baseBuilder
  }

  // Visual properties
  backgroundColor(value: string): ModifierBuilder<T> {
    const responsiveValue = { [this.breakpoint]: value }
    const modifier = createResponsivePropertyModifier(
      'backgroundColor',
      responsiveValue
    )
    this.parentBuilder.addModifier(modifier)
    return this.baseBuilder
  }

  color(value: string): ModifierBuilder<T> {
    const responsiveValue = { [this.breakpoint]: value }
    const modifier = createResponsivePropertyModifier('color', responsiveValue)
    this.parentBuilder.addModifier(modifier)
    return this.baseBuilder
  }

  opacity(value: number): ModifierBuilder<T> {
    const responsiveValue = { [this.breakpoint]: value }
    const modifier = createResponsivePropertyModifier(
      'opacity',
      responsiveValue
    )
    this.parentBuilder.addModifier(modifier)
    return this.baseBuilder
  }
}

/**
 * Utility function to wrap existing modifier builder with responsive capabilities
 */
export function withResponsive<T extends ComponentInstance = ComponentInstance>(
  builder: ModifierBuilder<T>
): ResponsiveModifierBuilder<T> {
  return new ResponsiveModifierBuilderImpl(builder)
}

/**
 * Create a responsive modifier builder from scratch
 */
export function createResponsiveBuilder<
  T extends ComponentInstance = ComponentInstance,
>(baseBuilder: ModifierBuilder<T>): ResponsiveModifierBuilder<T> {
  return new ResponsiveModifierBuilderImpl(baseBuilder)
}
