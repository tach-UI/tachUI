/**
 * Base Modifier System Implementation
 *
 * Core modifier classes and utilities for the SwiftUI-inspired modifier system.
 */

import {
  createEffect,
  isComputed,
  isSignal,
  getThemeSignal,
} from '@tachui/core/reactive'
import type { Signal } from '@tachui/types/reactive'
import type { DOMNode } from '@tachui/types/runtime'
import type {
  CSSStyleProperties,
  LifecycleModifierProps,
  Modifier,
  ModifierContext,
  ReactiveModifierProps,
  StyleComputationContext,
} from './types'
import { ModifierPriority } from '@tachui/types/modifiers'
import {
  isInfinity,
  dimensionToCSS,
  shouldExpandForInfinity,
} from '@tachui/core/constants/layout'

/**
 * Abstract base modifier class
 */
export abstract class BaseModifier<TProps = {}> implements Modifier<TProps> {
  abstract readonly type: string
  abstract readonly priority: number

  constructor(public readonly properties: TProps) {}

  /**
   * Apply the modifier to a DOM node
   */
  abstract apply(node: DOMNode, context: ModifierContext): DOMNode | undefined

  /**
   * Helper to resolve reactive properties
   */
  protected resolveReactiveProps<T extends Record<string, any>>(
    props: ReactiveModifierProps<T>,
    context: StyleComputationContext
  ): T {
    const resolved = {} as T

    for (const [key, value] of Object.entries(props)) {
      if (isSignal(value) || isComputed(value)) {
        // Preserve the signal/computed - let applyStyles handle reactivity
        resolved[key as keyof T] = value as T[keyof T]
      } else {
        // Static value
        resolved[key as keyof T] = value
      }
    }

    // Context parameter is kept for compatibility but not used in new approach
    void context

    return resolved
  }

  /**
   * Apply a single style change to an element with reactive support
   */
  protected applyStyleChange(
    element: Element,
    property: string,
    value: any
  ): void {
    if (element instanceof HTMLElement) {
      const cssProperty = this.toCSSProperty(property)

      // Handle reactive values (signals and computed)
      if (isSignal(value) || isComputed(value)) {
        // Create reactive effect for this style property
        createEffect(() => {
          const currentValue = value()
          const cssValue = String(currentValue)

          // Check if value contains !important and handle it properly
          if (cssValue.includes('!important')) {
            const actualValue = cssValue.replace(/\s*!important\s*$/, '').trim()
            element.style.setProperty(cssProperty, actualValue, 'important')
          } else {
            element.style.setProperty(cssProperty, cssValue)
          }
        })
      } else {
        // Handle static values
        const cssValue = String(value)

        // Check if value contains !important and handle it properly
        if (cssValue.includes('!important')) {
          const actualValue = cssValue.replace(/\s*!important\s*$/, '').trim()
          element.style.setProperty(cssProperty, actualValue, 'important')
        } else {
          element.style.setProperty(cssProperty, cssValue)
        }
      }
    }
  }

  /**
   * Convert camelCase property to CSS kebab-case
   */
  protected toCSSProperty(property: string): string {
    return property.replace(/([A-Z])/g, '-$1').toLowerCase()
  }

  /**
   * Convert value to CSS value string
   */
  protected toCSSValue(value: any): string {
    if (typeof value === 'number') {
      return `${value}px`
    }
    return String(value)
  }

  /**
   * Convert value to CSS value string with property-specific handling
   */
  protected toCSSValueForProperty(property: string, value: any): string {
    if (typeof value === 'number') {
      // Properties that should be unitless
      const unitlessProperties = [
        'opacity',
        'z-index',
        'line-height',
        'flex-grow',
        'flex-shrink',
        'order',
        'column-count',
        'font-weight',
      ]

      if (unitlessProperties.includes(property)) {
        return String(value)
      }

      return `${value}px`
    }

    // Properties that should be passed through as-is (no processing)
    const passthroughProperties = [
      'filter', // CSS filter strings should not be processed
      'transform', // CSS transform strings
      'clip-path', // CSS clip-path strings
    ]

    if (passthroughProperties.includes(property)) {
      return String(value)
    }

    return String(value)
  }

  /**
   * Apply multiple CSS properties to an element with reactive support
   */
  protected applyStyles(element: Element, styles: CSSStyleProperties): void {
    // Check if element has a style property (for testing and real elements)
    if (element instanceof HTMLElement || (element as any).style) {
      const styleTarget =
        element instanceof HTMLElement ? element.style : (element as any).style

      for (const [property, value] of Object.entries(styles)) {
        if (value !== undefined) {
          const cssProperty = this.toCSSProperty(property)

          // Handle reactive values (signals and computed)
          if (isSignal(value) || isComputed(value)) {
            console.log(
              'BaseModifier applyStyles - creating reactive effect for property:',
              cssProperty,
              'value type:',
              typeof value
            )
            // Create reactive effect for this style property
            createEffect(() => {
              const currentValue = value()
              console.log(
                'BaseModifier reactive effect fired - property:',
                cssProperty,
                'currentValue:',
                currentValue
              )
              const cssValue = this.toCSSValueForProperty(
                cssProperty,
                currentValue
              )

              if (styleTarget.setProperty) {
                // Check if value contains !important and handle it properly
                if (
                  typeof cssValue === 'string' &&
                  cssValue.includes('!important')
                ) {
                  const actualValue = cssValue
                    .replace(/\s*!important\s*$/, '')
                    .trim()
                  styleTarget.setProperty(cssProperty, actualValue, 'important')
                } else {
                  styleTarget.setProperty(cssProperty, cssValue)
                }
              } else {
                ;(styleTarget as any)[cssProperty] = cssValue
              }
            })
          } else {
            // Handle static values
            const cssValue = this.toCSSValueForProperty(cssProperty, value)

            if (process.env.NODE_ENV === 'development' && cssProperty === 'font-family') {
              console.log('[AppearanceModifier.applyStyles] Setting font-family property:', cssProperty, 'value:', cssValue)
              console.log('[AppearanceModifier.applyStyles] Element:', element)
              console.log('[AppearanceModifier.applyStyles] Current computed font-family:', getComputedStyle(element).fontFamily)
            }

            if (styleTarget.setProperty) {
              // Check if value contains !important and handle it properly
              if (
                typeof cssValue === 'string' &&
                cssValue.includes('!important')
              ) {
                const actualValue = cssValue
                  .replace(/\s*!important\s*$/, '')
                  .trim()
                styleTarget.setProperty(cssProperty, actualValue, 'important')
              } else {
                styleTarget.setProperty(cssProperty, cssValue)
              }
            } else {
              ;(styleTarget as any)[cssProperty] = cssValue
            }
          }
        }
      }
    }
  }

  /**
   * Add CSS classes to an element
   */
  protected addClasses(element: Element, classes: string[]): void {
    if (element instanceof HTMLElement) {
      element.classList.add(...classes)
    }
  }

  /**
   * Remove CSS classes from an element
   */
  protected removeClasses(element: Element, classes: string[]): void {
    if (element instanceof HTMLElement) {
      element.classList.remove(...classes)
    }
  }

  /**
   * Create a style computation context
   */
  protected createStyleContext(
    componentId: string,
    element: Element,
    modifiers: Modifier[]
  ): StyleComputationContext {
    return {
      componentId,
      element,
      modifiers,
      signals: new Set(),
      cleanup: [],
    }
  }
}

/**
 * Layout modifier for frame, padding, margin
 */
export class LayoutModifier extends BaseModifier {
  readonly type = 'layout'
  readonly priority = ModifierPriority.LAYOUT

  apply(node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!node.element || !context.element) return

    const styleContext = this.createStyleContext(
      context.componentId,
      context.element,
      []
    )

    const styles = this.computeLayoutStyles(
      this.properties as any,
      styleContext
    )

    this.applyStyles(context.element, styles)

    // Handle offset separately for proper transform combining
    const props = this.properties as any
    if (props.offset && context.element instanceof HTMLElement) {
      this.applyOffsetTransform(context.element, props.offset)
    }

    // Handle aspectRatio separately for reactive support
    if (props.aspectRatio && context.element instanceof HTMLElement) {
      this.applyAspectRatio(context.element, props.aspectRatio)
    }

    // Handle scaleEffect separately for proper transform combining (Phase 3 - Epic: Butternut)
    if (props.scaleEffect && context.element instanceof HTMLElement) {
      this.applyScaleTransform(context.element, props.scaleEffect)
    }

    // Handle absolutePosition separately for proper positioning (Phase 3 - Epic: Butternut)
    if (props.position && context.element instanceof HTMLElement) {
      this.applyAbsolutePosition(context.element, props.position)
    }

    // Handle zIndex separately for proper layering (Phase 3 - Epic: Butternut)
    if (props.zIndex !== undefined && context.element instanceof HTMLElement) {
      this.applyZIndex(context.element, props.zIndex)
    }

    return undefined
  }

  private applyOffsetTransform(
    element: HTMLElement,
    offset: { x?: any; y?: any }
  ): void {
    const { x, y } = offset

    // Handle reactive values
    if (isSignal(x) || isComputed(x) || isSignal(y) || isComputed(y)) {
      createEffect(() => {
        const currentX = isSignal(x) || isComputed(x) ? x() : (x ?? 0)
        const currentY = isSignal(y) || isComputed(y) ? y() : (y ?? 0)

        const offsetX = this.toCSSValue(currentX)
        const offsetY = this.toCSSValue(currentY)
        const translateValue = `translate(${offsetX}, ${offsetY})`

        // Preserve existing transforms but replace any existing translate
        const existingTransform = element.style.transform || ''
        const existingTransforms = existingTransform
          .split(' ')
          .filter(t => t && !t.startsWith('translate('))
          .join(' ')

        const newTransform = existingTransforms
          ? `${existingTransforms} ${translateValue}`
          : translateValue

        element.style.transform = newTransform
      })
    } else {
      // Handle static values
      const currentX = x ?? 0
      const currentY = y ?? 0

      const offsetX = this.toCSSValue(currentX)
      const offsetY = this.toCSSValue(currentY)
      const translateValue = `translate(${offsetX}, ${offsetY})`

      // Preserve existing transforms but replace any existing translate
      const existingTransform = element.style.transform || ''
      const existingTransforms = existingTransform
        .split(' ')
        .filter(t => t && !t.startsWith('translate('))
        .join(' ')

      const newTransform = existingTransforms
        ? `${existingTransforms} ${translateValue}`
        : translateValue

      element.style.transform = newTransform
    }
  }

  private applyAspectRatio(
    element: HTMLElement,
    aspectRatio: { ratio?: any; contentMode?: 'fit' | 'fill' }
  ): void {
    const { ratio, contentMode } = aspectRatio

    if (ratio !== undefined) {
      // Handle reactive aspect ratio
      if (isSignal(ratio) || isComputed(ratio)) {
        createEffect(() => {
          const currentRatio = typeof ratio === 'function' ? ratio() : ratio
          element.style.aspectRatio = String(currentRatio)
        })
      } else {
        element.style.aspectRatio = String(ratio)
      }

      // Set content mode
      if (contentMode === 'fill') {
        element.style.objectFit = 'cover'
      } else {
        element.style.objectFit = 'contain'
      }
    }
  }

  // Phase 3 - Epic: Butternut Transform Methods

  private applyScaleTransform(
    element: HTMLElement,
    scaleEffect: { x?: any; y?: any; anchor?: string }
  ): void {
    const { x, y, anchor } = scaleEffect
    const scaleX = x ?? 1
    const scaleY = y ?? scaleX // Default to uniform scaling if y not provided

    // Handle reactive values
    if (
      isSignal(scaleX) ||
      isComputed(scaleX) ||
      isSignal(scaleY) ||
      isComputed(scaleY)
    ) {
      createEffect(() => {
        const currentX =
          isSignal(scaleX) || isComputed(scaleX) ? scaleX() : scaleX
        const currentY =
          isSignal(scaleY) || isComputed(scaleY) ? scaleY() : scaleY

        const scaleValue = `scale(${currentX}, ${currentY})`

        // Set transform-origin based on anchor
        element.style.transformOrigin = this.getTransformOrigin(
          anchor || 'center'
        )

        // Preserve existing transforms but replace any existing scale
        const existingTransform = element.style.transform || ''
        const existingTransforms = existingTransform
          .replace(/\s*scale\([^)]*\)\s*/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()

        const newTransform = existingTransforms
          ? `${existingTransforms} ${scaleValue}`
          : scaleValue

        element.style.transform = newTransform
      })
    } else {
      // Handle static values
      const scaleValue = `scale(${scaleX}, ${scaleY})`

      // Set transform-origin based on anchor
      element.style.transformOrigin = this.getTransformOrigin(
        anchor || 'center'
      )

      // Preserve existing transforms but replace any existing scale
      const existingTransform = element.style.transform || ''
      const existingTransforms = existingTransform
        .replace(/\s*scale\([^)]*\)\s*/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      const newTransform = existingTransforms
        ? `${existingTransforms} ${scaleValue}`
        : scaleValue

      element.style.transform = newTransform
    }
  }

  private applyAbsolutePosition(
    element: HTMLElement,
    position: { x?: any; y?: any }
  ): void {
    const { x, y } = position

    // Set position to absolute for SwiftUI-style absolute positioning
    element.style.position = 'absolute'

    // Handle reactive values
    if (isSignal(x) || isComputed(x) || isSignal(y) || isComputed(y)) {
      createEffect(() => {
        const currentX = isSignal(x) || isComputed(x) ? x() : (x ?? 0)
        const currentY = isSignal(y) || isComputed(y) ? y() : (y ?? 0)

        element.style.left = this.toCSSValue(currentX)
        element.style.top = this.toCSSValue(currentY)
      })
    } else {
      // Handle static values
      const currentX = x ?? 0
      const currentY = y ?? 0

      element.style.left = this.toCSSValue(currentX)
      element.style.top = this.toCSSValue(currentY)
    }
  }

  private applyZIndex(element: HTMLElement, zIndex: any): void {
    // Handle reactive values
    if (isSignal(zIndex) || isComputed(zIndex)) {
      createEffect(() => {
        const currentZIndex = zIndex()
        element.style.zIndex = String(currentZIndex)
      })
    } else {
      // Handle static values
      element.style.zIndex = String(zIndex)
    }
  }

  private getTransformOrigin(anchor: string): string {
    const anchorMap: Record<string, string> = {
      center: 'center center',
      top: 'center top',
      topLeading: 'left top',
      topTrailing: 'right top',
      bottom: 'center bottom',
      bottomLeading: 'left bottom',
      bottomTrailing: 'right bottom',
      leading: 'left center',
      trailing: 'right center',
    }

    return anchorMap[anchor] || 'center center'
  }

  private computeLayoutStyles(
    props: any,
    _context: StyleComputationContext
  ): CSSStyleProperties {
    const styles: CSSStyleProperties = {}

    // Frame properties - handle infinity values properly
    if (props.frame) {
      const frame = props.frame

      // Check for infinity constraints and apply appropriate flex/size styles
      const infinityResult = shouldExpandForInfinity(frame)
      Object.assign(styles, infinityResult.cssProps)

      // Convert dimensions to CSS, handling infinity appropriately
      // Don't apply explicit width/height if infinity expansion is happening
      if (frame.width !== undefined) {
        const cssValue = dimensionToCSS(frame.width)
        if (
          cssValue !== undefined &&
          !isInfinity(frame.width) &&
          !infinityResult.expandWidth
        ) {
          styles.width = cssValue
        }
      }

      if (frame.height !== undefined) {
        const cssValue = dimensionToCSS(frame.height)
        if (
          cssValue !== undefined &&
          !isInfinity(frame.height) &&
          !infinityResult.expandHeight
        ) {
          styles.height = cssValue
        }
      }

      if (frame.minWidth !== undefined) {
        const cssValue = dimensionToCSS(frame.minWidth)
        if (cssValue !== undefined) {
          styles.minWidth = cssValue
        }
      }

      if (frame.maxWidth !== undefined && !isInfinity(frame.maxWidth)) {
        const cssValue = dimensionToCSS(frame.maxWidth)
        if (cssValue !== undefined) {
          styles.maxWidth = cssValue
        }
      } else if (isInfinity(frame.maxWidth)) {
        // SwiftUI compatibility: maxWidth infinity means expand to fill available width
        // Remove maxWidth constraint and use flex properties for expansion
        styles.maxWidth = 'none'
        styles.flexGrow = '1 !important'
        styles.flexShrink = '1 !important'
        styles.flexBasis = '0% !important'
        styles.alignSelf = 'stretch !important'
      }

      if (frame.minHeight !== undefined) {
        const cssValue = dimensionToCSS(frame.minHeight)
        if (cssValue !== undefined) {
          styles.minHeight = cssValue
        }
      }

      if (frame.maxHeight !== undefined && !isInfinity(frame.maxHeight)) {
        const cssValue = dimensionToCSS(frame.maxHeight)
        if (cssValue !== undefined) {
          styles.maxHeight = cssValue
        }
      } else if (isInfinity(frame.maxHeight)) {
        // SwiftUI compatibility: maxHeight infinity means expand to fill available height
        // Remove maxHeight constraint and use flex properties for expansion
        styles.maxHeight = 'none'
        styles.flexGrow = '1 !important'
        styles.flexShrink = '1 !important'
        styles.flexBasis = '0% !important'
        styles.alignSelf = 'stretch !important'
      }
    }

    // Padding
    if (props.padding !== undefined) {
      if (typeof props.padding === 'number') {
        styles.padding = this.toCSSValue(props.padding)
      } else {
        const p = props.padding
        if (p.top !== undefined) styles.paddingTop = this.toCSSValue(p.top)
        if (p.right !== undefined)
          styles.paddingRight = this.toCSSValue(p.right)
        if (p.bottom !== undefined)
          styles.paddingBottom = this.toCSSValue(p.bottom)
        if (p.left !== undefined) styles.paddingLeft = this.toCSSValue(p.left)
      }
    }

    // Margin
    if (props.margin !== undefined) {
      if (typeof props.margin === 'number') {
        styles.margin = this.toCSSValue(props.margin)
      } else {
        const m = props.margin
        if (m.top !== undefined) styles.marginTop = this.toCSSValue(m.top)
        if (m.right !== undefined) styles.marginRight = this.toCSSValue(m.right)
        if (m.bottom !== undefined)
          styles.marginBottom = this.toCSSValue(m.bottom)
        if (m.left !== undefined) styles.marginLeft = this.toCSSValue(m.left)
      }
    }

    // Alignment
    if (props.alignment) {
      switch (props.alignment) {
        case 'leading':
          styles.textAlign = 'left'
          styles.alignItems = 'flex-start'
          break
        case 'center':
          styles.textAlign = 'center'
          styles.alignItems = 'center'
          break
        case 'trailing':
          styles.textAlign = 'right'
          styles.alignItems = 'flex-end'
          break
        case 'top':
          styles.alignItems = 'flex-start'
          break
        case 'bottom':
          styles.alignItems = 'flex-end'
          break
      }
    }

    // Layout Priority
    // In SwiftUI, layoutPriority determines which views get priority in sizing
    // Higher priority views determine container size in ZStack
    // We implement this using CSS flexbox properties for flexible layouts
    if (props.layoutPriority !== undefined) {
      const priority = Number(props.layoutPriority)

      // Set flex properties based on priority
      // Higher priority = less flex shrink, more flex grow
      if (priority > 0) {
        // High priority: Don't shrink, allow growth
        styles.flexShrink = '0'
        styles.flexGrow = String(Math.max(1, priority / 10))

        // For ZStack containers, higher priority elements determine size
        // We use z-index for layering and flex properties for sizing behavior
        styles.zIndex = String(priority)

        // In grid layouts, higher priority gets more space
        styles.gridRowEnd = `span ${String(Math.min(10, Math.max(1, Math.ceil(priority / 10))))}`
        styles.gridColumnEnd = `span ${String(Math.min(10, Math.max(1, Math.ceil(priority / 10))))}`
      } else if (priority === 0) {
        // Default priority: Normal flex behavior
        styles.flexShrink = '1'
        styles.flexGrow = '1'
      } else {
        // Low priority: Shrink more, grow less
        styles.flexShrink = String(Math.abs(priority))
        styles.flexGrow = '0'
        styles.zIndex = String(priority)
      }

      // For containers that need to size based on highest priority child
      // We use CSS custom properties that can be read by parent containers
      if (styles && typeof styles === 'object' && 'setProperty' in styles) {
        ;(styles as any).setProperty('--layout-priority', String(priority))
      }
    }

    // Offset modifier (SwiftUI .offset(x, y))
    // Note: Offset handling is done in the apply method with proper reactive support
    // This is just for setting up the basic structure
    if (props.offset) {
      // The actual transform application happens in apply() method
      // to handle both reactive and static values properly
    }

    // Aspect Ratio modifier (SwiftUI .aspectRatio(ratio, contentMode))
    if (props.aspectRatio) {
      const { ratio, contentMode } = props.aspectRatio

      if (ratio !== undefined) {
        // Apply CSS aspect-ratio property
        styles.aspectRatio = typeof ratio === 'number' ? String(ratio) : ratio

        // Handle content mode
        if (contentMode === 'fill') {
          styles.objectFit = 'cover'
        } else {
          styles.objectFit = 'contain'
        }
      }
    }

    // Fixed Size modifier (SwiftUI .fixedSize())
    if (props.fixedSize) {
      const { horizontal, vertical } = props.fixedSize

      if (horizontal) {
        styles.flexShrink = '0'
        styles.width = 'max-content'
      }
      if (vertical) {
        styles.flexShrink = '0'
        styles.height = 'max-content'
      }
    }

    return styles
  }
}

/**
 * Appearance modifier for colors, fonts, borders, shadows
 */
export class AppearanceModifier extends BaseModifier {
  readonly type = 'appearance'
  readonly priority = ModifierPriority.APPEARANCE

  apply(node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (process.env.NODE_ENV === 'development') {
      console.log('[AppearanceModifier.apply] Called with properties:', Object.keys(this.properties))
    }

    if (!node.element || !context.element) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[AppearanceModifier.apply] Early return - no element', { hasNodeElement: !!node.element, hasContextElement: !!context.element })
      }
      return
    }

    const styleContext = this.createStyleContext(
      context.componentId,
      context.element,
      []
    )

    const resolved = this.resolveReactiveProps(
      this.properties as any,
      styleContext
    )

    // Handle Assets separately with theme reactivity
    this.applyAssetBasedStyles(context.element, resolved)

    // Handle non-Asset styles normally
    let styles = this.computeAppearanceStyles(resolved)
    
    // Merge font properties with existing element styles to prevent overwriting
    if (styles.fontFamily || styles.fontSize || styles.fontWeight || styles.fontStyle) {
      const element = context.element as HTMLElement
      const currentStyles = element.style
      const mergedStyles: Record<string, any> = { ...styles }
      
      // If this modifier doesn't have a font family, preserve the existing one
      if (!styles.fontFamily && currentStyles.fontFamily) {
        mergedStyles.fontFamily = currentStyles.fontFamily
        if (process.env.NODE_ENV === 'development') {
          console.log('[AppearanceModifier.apply] Preserved existing fontFamily:', currentStyles.fontFamily)
        }
      }
      
      // If this modifier doesn't have font-size, preserve the existing one
      if (!styles.fontSize && currentStyles.fontSize) {
        mergedStyles.fontSize = currentStyles.fontSize
        if (process.env.NODE_ENV === 'development') {
          console.log('[AppearanceModifier.apply] Preserved existing fontSize:', currentStyles.fontSize)
        }
      }
      
      // If this modifier doesn't have font-weight, preserve the existing one
      if (!styles.fontWeight && currentStyles.fontWeight) {
        mergedStyles.fontWeight = currentStyles.fontWeight
        if (process.env.NODE_ENV === 'development') {
          console.log('[AppearanceModifier.apply] Preserved existing fontWeight:', currentStyles.fontWeight)
        }
      }
      
      // If this modifier doesn't have font-style, preserve the existing one
      if (!styles.fontStyle && currentStyles.fontStyle) {
        mergedStyles.fontStyle = currentStyles.fontStyle
        if (process.env.NODE_ENV === 'development') {
          console.log('[AppearanceModifier.apply] Preserved existing fontStyle:', currentStyles.fontStyle)
        }
      }
      
      styles = mergedStyles
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[AppearanceModifier.apply] Final merged styles:', styles)
      console.log('[AppearanceModifier.apply] fontFamily in final styles?', 'fontFamily' in styles, 'fontFamily value:', styles.fontFamily)
    }
    
    this.applyStyles(context.element, styles)

    // Handle HTML attributes (ARIA, role, navigation, etc.)
    this.applyAttributes(context.element, resolved)

    return undefined
  }

  /**
   * Apply Asset-based styles with theme reactivity
   */
  private applyAssetBasedStyles(element: Element, props: any): void {
    // Get the shared theme signal
    const themeSignal = getThemeSignal()

    // Handle foregroundColor Asset
    if (props.foregroundColor && this.isAsset(props.foregroundColor)) {
      createEffect(() => {
        // Watch theme changes to trigger re-resolution
        themeSignal()
        // Re-resolve Asset when theme changes
        const resolvedColor = props.foregroundColor.resolve()
        this.applyStyleChange(element, 'color', resolvedColor)
      })
    }

    // Handle backgroundColor Asset
    if (props.backgroundColor && this.isAsset(props.backgroundColor)) {
      createEffect(() => {
        // Watch theme changes to trigger re-resolution
        themeSignal()
        // Re-resolve Asset when theme changes
        const resolvedColor = props.backgroundColor.resolve()
        this.applyStyleChange(element, 'backgroundColor', resolvedColor)
      })
    }

    // Handle border color Asset
    if (props.border?.color && this.isAsset(props.border.color)) {
      createEffect(() => {
        // Watch theme changes
        themeSignal()
        // Re-resolve Asset when theme changes
        const resolvedColor = props.border.color.resolve()
        this.applyStyleChange(element, 'borderColor', resolvedColor)
      })
    }
  }

  /**
   * Check if a value is an Asset object (including Asset proxies)
   */
  private isAsset(value: any): boolean {
    return (
      value !== null &&
      value !== undefined &&
      typeof value === 'object' &&
      'resolve' in value &&
      typeof value.resolve === 'function'
    )
  }

  private computeAppearanceStyles(props: any): CSSStyleProperties {
    const styles: CSSStyleProperties = {}



    // Colors (skip Assets - they're handled reactively in applyAssetBasedStyles)
    if (props.foregroundColor && !this.isAsset(props.foregroundColor)) {
      styles.color = props.foregroundColor
    }
    if (props.backgroundColor && !this.isAsset(props.backgroundColor)) {
      styles.backgroundColor = props.backgroundColor
    }
    if (props.opacity !== undefined) styles.opacity = props.opacity

    // Font
    if (props.font) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[AppearanceModifier] Processing font, keys:', Object.keys(props.font))
        console.log('[AppearanceModifier] font.family:', props.font.family)
        console.log('[AppearanceModifier] font.size:', props.font.size)
        console.log('[AppearanceModifier] font.weight:', props.font.weight)
      }
      const font = props.font
      if (font.family) {
        // Handle FontAsset objects that need to be resolved
        if (
          typeof font.family === 'object' &&
          font.family !== null &&
          'resolve' in font.family
        ) {
          const resolved = (font.family as any).resolve()
          if (process.env.NODE_ENV === 'development') {
            console.log('[AppearanceModifier] Resolved font.family:', resolved)
          }
          styles.fontFamily = resolved
          if (process.env.NODE_ENV === 'development') {
            console.log('[AppearanceModifier] Set styles.fontFamily to:', styles.fontFamily)
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('[AppearanceModifier] Using font.family as string:', font.family)
          }
          styles.fontFamily = font.family as string
          if (process.env.NODE_ENV === 'development') {
            console.log('[AppearanceModifier] Set styles.fontFamily to:', styles.fontFamily)
          }
        }
      }
      if (font.size) styles.fontSize = this.toCSSValue(font.size)
      if (font.weight) styles.fontWeight = String(font.weight)
      if (font.style) styles.fontStyle = font.style
    }

    // Corner radius
    if (props.cornerRadius !== undefined) {
      styles.borderRadius = this.toCSSValue(props.cornerRadius)
    }

    // Border
    if (props.border) {
      const border = props.border
      if (border.width !== undefined)
        styles.borderWidth = this.toCSSValue(border.width)
      if (border.color && !this.isAsset(border.color)) {
        styles.borderColor = border.color as string
      }
      if (border.style) styles.borderStyle = border.style
    }

    // Shadow
    if (props.shadow) {
      const shadow = props.shadow
      const x = shadow.x || 0
      const y = shadow.y || 0
      // Support both 'blur' and 'radius' for backward compatibility
      const blur = shadow.blur !== undefined ? shadow.blur : (shadow.radius || 0)
      const spread = shadow.spread || 0
      const color = shadow.color || 'rgba(0,0,0,0.25)'
      // CSS box-shadow: offset-x offset-y blur-radius spread-radius color
      styles.boxShadow = spread !== 0
        ? `${x}px ${y}px ${blur}px ${spread}px ${color}`
        : `${x}px ${y}px ${blur}px ${color}`
    }

    // Clipped modifier (SwiftUI .clipped())
    if (props.clipped) {
      styles.overflow = 'hidden'
    }

    // Clip Shape modifier (SwiftUI .clipShape())
    if (props.clipShape) {
      const { shape, parameters } = props.clipShape

      switch (shape) {
        case 'circle':
          styles.clipPath = 'circle(50%)'
          break
        case 'ellipse': {
          const radiusX = parameters?.radiusX || '50%'
          const radiusY = parameters?.radiusY || '50%'
          styles.clipPath = `ellipse(${radiusX} ${radiusY} at center)`
          break
        }
        case 'rect': {
          const inset = parameters?.inset || 0
          styles.clipPath = `inset(${inset}px)`
          break
        }
        case 'polygon': {
          const points =
            parameters?.points || '0% 0%, 100% 0%, 100% 100%, 0% 100%'
          styles.clipPath = `polygon(${points})`
          break
        }
      }
    }

    // Visual Effects (Phase 2 - Epic: Butternut)
    const filters: string[] = []

    if (props.blur !== undefined) {
      filters.push(`blur(${props.blur}px)`)
    }
    if (props.brightness !== undefined) {
      filters.push(`brightness(${props.brightness})`)
    }
    if (props.contrast !== undefined) {
      filters.push(`contrast(${props.contrast})`)
    }
    if (props.saturation !== undefined) {
      filters.push(`saturate(${props.saturation})`)
    }
    if (props.hueRotation !== undefined) {
      filters.push(`hue-rotate(${props.hueRotation}deg)`)
    }
    if (props.grayscale !== undefined) {
      filters.push(`grayscale(${props.grayscale})`)
    }
    if (props.colorInvert !== undefined) {
      filters.push(`invert(${props.colorInvert})`)
    }

    if (filters.length > 0) {
      styles.filter = filters.join(' ')
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[AppearanceModifier.computeAppearanceStyles] Returning styles object:', styles)
      console.log('[AppearanceModifier.computeAppearanceStyles] fontFamily in styles?', 'fontFamily' in styles, 'fontFamily value:', styles.fontFamily)
    }

    return styles
  }

  /**
   * Apply HTML attributes (ARIA, role, data attributes, etc.)
   */
  private applyAttributes(element: Element, props: any): void {
    if (!element) return

    // Also need to get the component from the context to update props
    // This is a hack, but needed for tests that expect attributes on component.props
    const component = this.findComponentFromElement(element)

    // Common HTML attributes
    if (props.role !== undefined) {
      element.setAttribute('role', String(props.role))
      if (component?.props) {
        component.props.role = String(props.role)
      }
    }

    // ARIA attributes
    if (props['aria-label'] !== undefined) {
      element.setAttribute('aria-label', String(props['aria-label']))
      if (component?.props) {
        component.props['aria-label'] = String(props['aria-label'])
      }
    }

    if (props['aria-live'] !== undefined) {
      element.setAttribute('aria-live', String(props['aria-live']))
      if (component?.props) {
        component.props['aria-live'] = String(props['aria-live'])
      }
    }

    if (props['aria-describedby'] !== undefined) {
      element.setAttribute(
        'aria-describedby',
        String(props['aria-describedby'])
      )
      if (component?.props) {
        component.props['aria-describedby'] = String(props['aria-describedby'])
      }
    }

    if (props['aria-modal'] !== undefined) {
      element.setAttribute('aria-modal', String(props['aria-modal']))
      if (component?.props) {
        component.props['aria-modal'] = String(props['aria-modal'])
      }
    }

    if (props['aria-hidden'] !== undefined) {
      element.setAttribute('aria-hidden', String(props['aria-hidden']))
      if (component?.props) {
        component.props['aria-hidden'] = String(props['aria-hidden'])
      }
    }

    // Navigation attributes (for custom processing by navigation system)
    if (props.navigationTitle !== undefined) {
      element.setAttribute(
        'data-navigation-title',
        String(props.navigationTitle)
      )
      if (component?.props) {
        component.props.navigationTitle = String(props.navigationTitle)
      }
    }

    if (props.navigationBarHidden !== undefined) {
      element.setAttribute(
        'data-navigation-bar-hidden',
        String(props.navigationBarHidden)
      )
      if (component?.props) {
        component.props.navigationBarHidden = props.navigationBarHidden
      }
      // Also apply aria-hidden for accessibility
      if (props.navigationBarHidden) {
        element.setAttribute('aria-hidden', 'true')
        if (component?.props) {
          component.props['aria-hidden'] = 'true'
        }
      }
    }

    if (props.navigationBarItems !== undefined) {
      // Store as JSON in data attribute for navigation system to process
      element.setAttribute(
        'data-navigation-bar-items',
        JSON.stringify(props.navigationBarItems)
      )
      if (component?.props) {
        component.props.navigationBarItems = props.navigationBarItems
      }
    }
  }

  private findComponentFromElement(element: Element): any {
    // Try to find the component instance associated with this element
    // This is a simplified approach - in a real implementation, we'd have a proper mapping
    return (element as any)._tachui_component || null
  }
}

/**
 * Interaction modifier for events and accessibility
 */
export class InteractionModifier extends BaseModifier {
  readonly type = 'interaction'
  readonly priority = ModifierPriority.INTERACTION

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const props = this.properties as any

    // Event handlers
    if (props.onTap) {
      context.element.addEventListener('click', props.onTap)
    }

    if (props.onHover) {
      context.element.addEventListener('mouseenter', () => props.onHover(true))
      context.element.addEventListener('mouseleave', () => props.onHover(false))
    }

    if (props.onMouseEnter) {
      context.element.addEventListener('mouseenter', props.onMouseEnter)
    }

    if (props.onMouseLeave) {
      context.element.addEventListener('mouseleave', props.onMouseLeave)
    }

    if (props.onMouseDown) {
      context.element.addEventListener('mousedown', props.onMouseDown)
    }

    if (props.onMouseUp) {
      context.element.addEventListener('mouseup', props.onMouseUp)
    }

    if (props.onDragStart) {
      context.element.addEventListener('dragstart', props.onDragStart)
    }

    if (props.onDragOver) {
      context.element.addEventListener('dragover', props.onDragOver)
    }

    if (props.onDragLeave) {
      context.element.addEventListener('dragleave', props.onDragLeave)
    }

    if (props.onDrop) {
      context.element.addEventListener('drop', props.onDrop)
    }

    // Additional mouse events
    if (props.onDoubleClick) {
      context.element.addEventListener('dblclick', props.onDoubleClick)
    }

    if (props.onContextMenu) {
      context.element.addEventListener('contextmenu', props.onContextMenu)
    }

    // Focus events
    if (props.onFocus) {
      context.element.addEventListener('focus', () => props.onFocus(true))
      context.element.addEventListener('blur', () => props.onFocus(false))
    }

    if (props.onBlur) {
      context.element.addEventListener('blur', () => props.onBlur(false))
    }

    // Keyboard events
    if (props.onKeyPress) {
      context.element.addEventListener('keypress', props.onKeyPress)
    }

    if (props.onKeyDown) {
      context.element.addEventListener('keydown', props.onKeyDown)
    }

    if (props.onKeyUp) {
      context.element.addEventListener('keyup', props.onKeyUp)
    }

    // Touch events
    if (props.onTouchStart) {
      context.element.addEventListener('touchstart', props.onTouchStart, {
        passive: true,
      })
    }

    if (props.onTouchMove) {
      context.element.addEventListener('touchmove', props.onTouchMove, {
        passive: true,
      })
    }

    if (props.onTouchEnd) {
      context.element.addEventListener('touchend', props.onTouchEnd, {
        passive: true,
      })
    }

    if (props.onTouchCancel) {
      context.element.addEventListener('touchcancel', props.onTouchCancel, {
        passive: true,
      })
    }

    // Swipe gestures (simplified implementation)
    if (props.onSwipeLeft || props.onSwipeRight) {
      let startX = 0
      let startY = 0

      context.element.addEventListener(
        'touchstart',
        (e: Event) => {
          const touchEvent = e as TouchEvent
          const touch = touchEvent.touches[0]
          startX = touch.clientX
          startY = touch.clientY
        },
        { passive: true }
      )

      context.element.addEventListener(
        'touchend',
        (e: Event) => {
          const touchEvent = e as TouchEvent
          const touch = touchEvent.changedTouches[0]
          const deltaX = touch.clientX - startX
          const deltaY = touch.clientY - startY
          const minSwipeDistance = 50

          // Only register as swipe if horizontal movement is greater than vertical
          if (
            Math.abs(deltaX) > Math.abs(deltaY) &&
            Math.abs(deltaX) > minSwipeDistance
          ) {
            if (deltaX < 0 && props.onSwipeLeft) {
              props.onSwipeLeft()
            } else if (deltaX > 0 && props.onSwipeRight) {
              props.onSwipeRight()
            }
          }
        },
        { passive: true }
      )
    }

    // Scroll and wheel events
    if (props.onScroll) {
      context.element.addEventListener('scroll', props.onScroll, {
        passive: true,
      })
    }

    if (props.onWheel) {
      context.element.addEventListener('wheel', props.onWheel, {
        passive: false,
      })
    }

    // Input events
    if (props.onInput) {
      context.element.addEventListener('input', props.onInput)
    }

    if (props.onChange) {
      context.element.addEventListener('change', event => {
        const target = event.target as HTMLInputElement
        const value = target.value || target.textContent || ''
        props.onChange(value, event)
      })
    }

    // Clipboard events
    if (props.onCopy) {
      context.element.addEventListener('copy', props.onCopy)
    }

    if (props.onCut) {
      context.element.addEventListener('cut', props.onCut)
    }

    if (props.onPaste) {
      context.element.addEventListener('paste', props.onPaste)
    }

    // Selection events
    if (props.onSelect) {
      context.element.addEventListener('select', props.onSelect)
    }

    // Disabled state
    if (props.disabled !== undefined) {
      if (context.element instanceof HTMLElement) {
        if (props.disabled) {
          context.element.setAttribute('disabled', 'true')
          context.element.style.pointerEvents = 'none'
          context.element.style.opacity = '0.6'
        } else {
          context.element.removeAttribute('disabled')
          context.element.style.pointerEvents = ''
          context.element.style.opacity = ''
        }
      }
    }

    // Draggable state
    if (props.draggable !== undefined) {
      if (context.element instanceof HTMLElement) {
        context.element.draggable = props.draggable
      }
    }

    // Accessibility
    if (props.accessibilityLabel) {
      context.element.setAttribute('aria-label', props.accessibilityLabel)
    }

    if (props.accessibilityHint) {
      context.element.setAttribute('aria-describedby', props.accessibilityHint)
    }

    // Advanced Gesture Modifiers (Phase 4 - Epic: Butternut)
    if (props.onLongPressGesture) {
      this.setupLongPressGesture(context.element, props.onLongPressGesture)
    }

    if (props.keyboardShortcut) {
      this.setupKeyboardShortcut(context.element, props.keyboardShortcut)
    }

    if (props.focused !== undefined) {
      this.setupFocusManagement(context.element, props.focused)
    }

    if (props.focusable) {
      this.setupFocusable(context.element, props.focusable)
    }

    if (props.onContinuousHover) {
      this.setupContinuousHover(context.element, props.onContinuousHover)
    }

    if (props.allowsHitTesting !== undefined) {
      this.setupHitTesting(context.element, props.allowsHitTesting)
    }

    return undefined
  }

  // Phase 4 Advanced Gesture Methods

  /**
   * Setup long press gesture with timing and distance constraints
   */
  private setupLongPressGesture(
    element: Element,
    options: {
      minimumDuration?: number
      maximumDistance?: number
      perform: () => void
      onPressingChanged?: (isPressing: boolean) => void
    }
  ): void {
    const minimumDuration = options.minimumDuration ?? 500 // ms
    const maximumDistance = options.maximumDistance ?? 10 // px

    let timeoutId: number | undefined
    let startPoint: { x: number; y: number } | null = null
    let isPressing = false

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = undefined
      }
      if (isPressing && options.onPressingChanged) {
        options.onPressingChanged(false)
      }
      isPressing = false
      startPoint = null
    }

    const handlePointerDown = (event: Event) => {
      const pointerEvent = event as PointerEvent
      startPoint = { x: pointerEvent.clientX, y: pointerEvent.clientY }
      isPressing = true

      if (options.onPressingChanged) {
        options.onPressingChanged(true)
      }

      timeoutId = window.setTimeout(() => {
        if (isPressing && startPoint) {
          options.perform()
          cleanup()
        }
      }, minimumDuration)
    }

    const handlePointerMove = (event: Event) => {
      const pointerEvent = event as PointerEvent
      if (!startPoint || !isPressing) return

      const distance = Math.sqrt(
        Math.pow(pointerEvent.clientX - startPoint.x, 2) +
          Math.pow(pointerEvent.clientY - startPoint.y, 2)
      )

      if (distance > maximumDistance) {
        cleanup()
      }
    }

    const handlePointerUp = () => {
      cleanup()
    }

    const handlePointerCancel = () => {
      cleanup()
    }

    // Use pointer events for better touch/mouse compatibility
    element.addEventListener('pointerdown', handlePointerDown as EventListener)
    element.addEventListener('pointermove', handlePointerMove as EventListener)
    element.addEventListener('pointerup', handlePointerUp as EventListener)
    element.addEventListener(
      'pointercancel',
      handlePointerCancel as EventListener
    )

    // Store cleanup function for later removal
    ;(element as any)._longPressCleanup = cleanup
  }

  /**
   * Setup keyboard shortcut handling
   */
  private setupKeyboardShortcut(
    element: Element,
    shortcut: {
      key: string
      modifiers?: ('cmd' | 'ctrl' | 'shift' | 'alt' | 'meta')[]
      action: () => void
    }
  ): void {
    const modifiers = shortcut.modifiers ?? []

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if all required modifiers are pressed
      const requiredModifiers = {
        cmd: modifiers.includes('cmd') || modifiers.includes('meta'),
        ctrl: modifiers.includes('ctrl'),
        shift: modifiers.includes('shift'),
        alt: modifiers.includes('alt'),
      }

      const actualModifiers = {
        cmd: event.metaKey || event.ctrlKey, // Handle both Mac (meta) and PC (ctrl)
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
        alt: event.altKey,
      }

      // Check key match (case insensitive)
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()

      // Check modifier requirements
      const modifiersMatch = Object.entries(requiredModifiers).every(
        ([mod, required]) =>
          required === actualModifiers[mod as keyof typeof actualModifiers]
      )

      if (keyMatches && modifiersMatch) {
        event.preventDefault()
        shortcut.action()
      }
    }

    // Add keyboard event listener to document for global shortcuts
    document.addEventListener('keydown', handleKeyDown)

    // Store cleanup function
    ;(element as any)._keyboardShortcutCleanup = () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }

  /**
   * Setup focus management with reactive binding
   */
  private setupFocusManagement(
    element: Element,
    focused: boolean | Signal<boolean>
  ): void {
    if (!(element instanceof HTMLElement)) return

    const htmlElement = element as HTMLElement

    // Make element focusable if it's not naturally focusable
    if (!htmlElement.hasAttribute('tabindex')) {
      htmlElement.setAttribute('tabindex', '0')
    }

    if (isSignal(focused) || isComputed(focused)) {
      // Reactive focus management
      createEffect(() => {
        const shouldFocus = focused()
        if (shouldFocus) {
          htmlElement.focus()
        } else {
          htmlElement.blur()
        }
      })
    } else {
      // Static focus management
      if (focused) {
        htmlElement.focus()
      }
    }
  }

  /**
   * Setup focusable behavior
   */
  private setupFocusable(
    element: Element,
    options: {
      isFocusable?: boolean
      interactions?: ('activate' | 'edit')[]
    }
  ): void {
    if (!(element instanceof HTMLElement)) return

    const htmlElement = element as HTMLElement

    if (options.isFocusable === false) {
      htmlElement.setAttribute('tabindex', '-1')
    } else {
      if (!htmlElement.hasAttribute('tabindex')) {
        htmlElement.setAttribute('tabindex', '0')
      }
    }

    // Setup interaction behaviors
    if (options.interactions?.includes('activate')) {
      htmlElement.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          htmlElement.click()
        }
      })
    }

    if (options.interactions?.includes('edit')) {
      htmlElement.setAttribute('role', 'textbox')
      htmlElement.setAttribute('contenteditable', 'true')
    }
  }

  /**
   * Setup continuous hover tracking with coordinates
   */
  private setupContinuousHover(
    element: Element,
    options: {
      coordinateSpace?: 'local' | 'global'
      perform: (location: { x: number; y: number } | null) => void
    }
  ): void {
    const coordinateSpace = options.coordinateSpace ?? 'local'

    const handleMouseMove = (event: Event) => {
      const mouseEvent = event as MouseEvent
      let x: number, y: number

      if (coordinateSpace === 'local') {
        const rect = element.getBoundingClientRect()
        x = mouseEvent.clientX - rect.left
        y = mouseEvent.clientY - rect.top
      } else {
        x = mouseEvent.clientX
        y = mouseEvent.clientY
      }

      options.perform({ x, y })
    }

    const handleMouseLeave = () => {
      options.perform(null)
    }

    element.addEventListener('mousemove', handleMouseMove as EventListener)
    element.addEventListener('mouseleave', handleMouseLeave as EventListener)

    // Store cleanup
    ;(element as any)._continuousHoverCleanup = () => {
      element.removeEventListener('mousemove', handleMouseMove as EventListener)
      element.removeEventListener(
        'mouseleave',
        handleMouseLeave as EventListener
      )
    }
  }

  /**
   * Setup hit testing control
   */
  private setupHitTesting(element: Element, enabled: boolean): void {
    if (element instanceof HTMLElement) {
      element.style.pointerEvents = enabled ? '' : 'none'
    }
  }
}

/**
 * Animation modifier for transitions and animations
 */
export class AnimationModifier extends BaseModifier {
  readonly type = 'animation'
  readonly priority = ModifierPriority.ANIMATION

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const props = this.properties as any

    // Transition
    if (props.transition) {
      const t = props.transition
      const property = t.property || 'all'
      const duration = t.duration || 300
      const easing = t.easing || 'ease'
      const delay = t.delay || 0

      if (context.element instanceof HTMLElement) {
        context.element.style.transition = `${property} ${duration}ms ${easing} ${delay}ms`
      }
    }

    // Animation
    if (props.animation && context.element instanceof HTMLElement) {
      const anim = props.animation

      if (anim.keyframes) {
        // Create keyframes
        const keyframeName = `tachui-animation-${context.componentId}-${Date.now()}`
        const keyframeRule = this.createKeyframeRule(
          keyframeName,
          anim.keyframes
        )

        // Add keyframes to stylesheet
        this.addKeyframesToStylesheet(keyframeRule)

        // Apply animation
        const duration = anim.duration || 1000
        const easing = anim.easing || 'ease'
        const iterations = anim.iterations || 1
        const direction = anim.direction || 'normal'

        context.element.style.animation = `${keyframeName} ${duration}ms ${easing} ${iterations} ${direction}`
      }
    }

    // Transform
    if (props.transform && context.element instanceof HTMLElement) {
      if (isSignal(props.transform) || isComputed(props.transform)) {
        // Create reactive effect for transform
        createEffect(() => {
          const transformValue = props.transform()
          if (context.element instanceof HTMLElement) {
            context.element.style.transform = transformValue
          }
        })
      } else {
        context.element.style.transform = props.transform
      }
    }

    // Rotation Effect (SwiftUI .rotationEffect(angle))
    if (props.rotationEffect && context.element instanceof HTMLElement) {
      const { angle, anchor } = props.rotationEffect

      // Convert anchor to CSS transform-origin
      const anchorOrigins: Record<string, string> = {
        center: '50% 50%',
        top: '50% 0%',
        topLeading: '0% 0%',
        topTrailing: '100% 0%',
        bottom: '50% 100%',
        bottomLeading: '0% 100%',
        bottomTrailing: '100% 100%',
        leading: '0% 50%',
        trailing: '100% 50%',
      }

      const transformOrigin = anchorOrigins[anchor || 'center'] || '50% 50%'

      // Create rotation transform
      const rotationTransform = `rotate(${angle}deg)`

      if (isSignal(angle) || isComputed(angle)) {
        // Reactive rotation
        createEffect(() => {
          const currentAngle = typeof angle === 'function' ? angle() : angle
          const currentRotation = `rotate(${currentAngle}deg)`

          if (context.element instanceof HTMLElement) {
            context.element.style.transformOrigin = transformOrigin

            // Combine with existing transforms if any
            const existingTransform = context.element.style.transform || ''
            const existingTransforms = existingTransform
              .split(' ')
              .filter(t => t && !t.startsWith('rotate('))
              .join(' ')

            const newTransform = existingTransforms
              ? `${existingTransforms} ${currentRotation}`
              : currentRotation

            context.element.style.transform = newTransform
          }
        })
      } else {
        // Static rotation
        if (context.element instanceof HTMLElement) {
          context.element.style.transformOrigin = transformOrigin

          // Combine with existing transforms if any
          const existingTransform = context.element.style.transform || ''
          const existingTransforms = existingTransform
            .split(' ')
            .filter(t => t && !t.startsWith('rotate('))
            .join(' ')

          const newTransform = existingTransforms
            ? `${existingTransforms} ${rotationTransform}`
            : rotationTransform

          context.element.style.transform = newTransform
        }
      }
    }

    // Overlay modifier (SwiftUI .overlay())
    if (props.overlay && context.element instanceof HTMLElement) {
      this.applyOverlay(context.element, props.overlay, context)
    }

    return undefined
  }

  private applyOverlay(
    element: HTMLElement,
    overlay: { content: any; alignment?: string },
    _context: ModifierContext
  ): void {
    const { content, alignment = 'center' } = overlay

    // Make the element a positioned container
    if (element.style.position === '' || element.style.position === 'static') {
      element.style.position = 'relative'
    }

    // Create overlay container
    const overlayContainer = document.createElement('div')
    overlayContainer.style.position = 'absolute'
    overlayContainer.style.pointerEvents = 'none' // Allow clicks to pass through by default

    // Apply alignment positioning
    const alignmentStyles = this.getOverlayAlignment(alignment)
    Object.assign(overlayContainer.style, alignmentStyles)

    // Render content
    if (typeof content === 'function') {
      // If content is a function, call it to get component
      const contentComponent = content()
      if (contentComponent && typeof contentComponent.render === 'function') {
        const contentNode = contentComponent.render()
        if (contentNode.element) {
          overlayContainer.appendChild(contentNode.element)
        }
      }
    } else if (content && typeof content.render === 'function') {
      // If content is a component instance
      const contentNode = content.render()
      if (contentNode.element) {
        overlayContainer.appendChild(contentNode.element)
      }
    } else if (content instanceof HTMLElement) {
      // If content is already a DOM element
      overlayContainer.appendChild(content)
    }

    // Add overlay to the element
    element.appendChild(overlayContainer)
  }

  private getOverlayAlignment(alignment: string): Record<string, string> {
    const alignments: Record<string, Record<string, string>> = {
      center: {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      },
      top: {
        top: '0',
        left: '50%',
        transform: 'translateX(-50%)',
      },
      bottom: {
        bottom: '0',
        left: '50%',
        transform: 'translateX(-50%)',
      },
      leading: {
        top: '50%',
        left: '0',
        transform: 'translateY(-50%)',
      },
      trailing: {
        top: '50%',
        right: '0',
        transform: 'translateY(-50%)',
      },
      topLeading: {
        top: '0',
        left: '0',
      },
      topTrailing: {
        top: '0',
        right: '0',
      },
      bottomLeading: {
        bottom: '0',
        left: '0',
      },
      bottomTrailing: {
        bottom: '0',
        right: '0',
      },
    }

    return alignments[alignment] || alignments.center
  }

  private createKeyframeRule(
    name: string,
    keyframes: Record<string, Record<string, string>>
  ): string {
    let rule = `@keyframes ${name} {\n`

    for (const [percentage, styles] of Object.entries(keyframes)) {
      rule += `  ${percentage} {\n`
      for (const [property, value] of Object.entries(styles)) {
        const cssProperty = this.toCSSProperty(property)
        rule += `    ${cssProperty}: ${value};\n`
      }
      rule += `  }\n`
    }

    rule += '}'
    return rule
  }

  private addKeyframesToStylesheet(rule: string): void {
    let stylesheet = document.querySelector(
      '#tachui-animations'
    ) as HTMLStyleElement

    if (!stylesheet) {
      stylesheet = document.createElement('style')
      stylesheet.id = 'tachui-animations'
      document.head.appendChild(stylesheet)
    }

    stylesheet.appendChild(document.createTextNode(rule))
  }
}

/**
 * Lifecycle modifier for component lifecycle events
 */
export class LifecycleModifier extends BaseModifier {
  readonly type = 'lifecycle'
  readonly priority = ModifierPriority.CUSTOM

  private activeAbortController?: AbortController

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const props = this.properties as LifecycleModifierProps

    // Clean up any existing tasks on re-application
    if (this.activeAbortController) {
      this.activeAbortController.abort()
    }

    // Set up intersection observer for onAppear/onDisappear
    if (props.onAppear || props.onDisappear) {
      this.setupLifecycleObserver(context.element, props)
    }

    // Set up async task with cancellation
    if (props.task) {
      this.setupTask(context, props.task)
    }

    // Set up refreshable behavior
    if (props.refreshable) {
      this.setupRefreshable(context.element, props.refreshable)
    }

    return undefined
  }

  private setupLifecycleObserver(
    element: Element,
    props: LifecycleModifierProps
  ): void {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && props.onAppear) {
            // Element has appeared in viewport
            props.onAppear()
          } else if (!entry.isIntersecting && props.onDisappear) {
            // Element has disappeared from viewport
            props.onDisappear()
          }
        })
      },
      {
        threshold: 0.1, // Trigger when 10% of element is visible
        rootMargin: '10px', // Add some margin for better UX
      }
    )

    observer.observe(element)

    // Store cleanup function
    this.addCleanup(() => {
      observer.disconnect()
    })
  }

  private setupTask(
    _context: ModifierContext,
    task: LifecycleModifierProps['task']
  ): void {
    if (!task) return

    // Create abort controller for task cancellation
    this.activeAbortController = new AbortController()
    const { signal } = this.activeAbortController

    // Execute the task operation
    const executeTask = async () => {
      try {
        if (signal.aborted) return

        const result = task.operation()

        // Handle both sync and async operations
        if (result instanceof Promise) {
          await result
        }
      } catch (error) {
        if (signal.aborted) return
        console.error('TachUI Task Error:', error)
      }
    }

    // Start task execution
    executeTask()

    // Add cleanup to cancel task on component unmount
    this.addCleanup(() => {
      if (this.activeAbortController) {
        this.activeAbortController.abort()
      }
    })
  }

  private setupRefreshable(
    element: Element,
    refreshable: LifecycleModifierProps['refreshable']
  ): void {
    if (!refreshable) return

    let isRefreshing = false
    let pullDistance = 0
    let startY = 0

    const threshold = 70 // Pull threshold in pixels

    // Create refresh indicator element
    const refreshIndicator = document.createElement('div')
    refreshIndicator.style.cssText = `
      position: absolute;
      top: -50px;
      left: 50%;
      transform: translateX(-50%);
      width: 30px;
      height: 30px;
      border: 2px solid #ccc;
      border-top: 2px solid #007AFF;
      border-radius: 50%;
      animation: tachui-spin 1s linear infinite;
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 1000;
    `

    // Add spinner animation
    if (!document.querySelector('#tachui-refresh-styles')) {
      const style = document.createElement('style')
      style.id = 'tachui-refresh-styles'
      style.textContent = `
        @keyframes tachui-spin {
          0% { transform: translateX(-50%) rotate(0deg); }
          100% { transform: translateX(-50%) rotate(360deg); }
        }
      `
      document.head.appendChild(style)
    }

    const container = element.parentElement || element
    if (container instanceof HTMLElement) {
      container.style.position = 'relative'
      container.appendChild(refreshIndicator)
    }

    // Touch event handlers
    const handleTouchStart = (e: TouchEvent) => {
      if (isRefreshing) return
      startY = e.touches[0].clientY
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (isRefreshing) return

      const currentY = e.touches[0].clientY
      pullDistance = Math.max(0, currentY - startY)

      // Show indicator when pulling down
      if (pullDistance > 20) {
        const opacity = Math.min(1, pullDistance / threshold)
        refreshIndicator.style.opacity = String(opacity)
      }

      // Prevent default scroll behavior when pulling down at top
      if (pullDistance > 0 && element.scrollTop === 0) {
        e.preventDefault()
      }
    }

    const handleTouchEnd = async () => {
      if (isRefreshing) return

      if (pullDistance > threshold) {
        // Trigger refresh
        isRefreshing = true
        refreshIndicator.style.opacity = '1'

        try {
          await refreshable.onRefresh()
        } catch (error) {
          console.error('Refresh error:', error)
        } finally {
          isRefreshing = false
          refreshIndicator.style.opacity = '0'
          pullDistance = 0
        }
      } else {
        // Reset indicator
        refreshIndicator.style.opacity = '0'
        pullDistance = 0
      }
    }

    // Add touch event listeners
    element.addEventListener('touchstart', handleTouchStart as EventListener, {
      passive: true,
    })
    element.addEventListener('touchmove', handleTouchMove as EventListener, {
      passive: false,
    })
    element.addEventListener('touchend', handleTouchEnd as EventListener, {
      passive: true,
    })

    // Store cleanup function
    this.addCleanup(() => {
      element.removeEventListener(
        'touchstart',
        handleTouchStart as EventListener
      )
      element.removeEventListener('touchmove', handleTouchMove as EventListener)
      element.removeEventListener('touchend', handleTouchEnd as EventListener)
      if (refreshIndicator.parentElement) {
        refreshIndicator.parentElement.removeChild(refreshIndicator)
      }
    })
  }

  // Cleanup helpers
  private cleanupFunctions: (() => void)[] = []

  protected addCleanup(fn: () => void): void {
    this.cleanupFunctions.push(fn)
  }

  public cleanup(): void {
    this.cleanupFunctions.forEach(fn => fn())
    this.cleanupFunctions = []
  }
}
