/**
 * Base Modifier System Implementation
 *
 * Core modifier classes and utilities for the SwiftUI-inspired modifier system.
 */

import { createEffect, isComputed, isSignal, getThemeSignal } from '../reactive'
import type { DOMNode } from '../runtime/types'
import type {
  CSSStyleProperties,
  LifecycleModifierProps,
  Modifier,
  ModifierContext,
  ReactiveModifierProps,
  StyleComputationContext,
} from './types'
import { ModifierPriority } from './types'
import {
  isInfinity,
  dimensionToCSS,
  shouldExpandForInfinity,
} from '../constants/layout'

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
            // Create reactive effect for this style property
            createEffect(() => {
              const currentValue = value()
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

    // Layout modifiers (offset, aspectRatio, scaleEffect, zIndex) have been
    // migrated to @tachui/modifiers/layout for enhanced functionality

    // Handle absolutePosition separately for proper positioning (Phase 3 - Epic: Butternut)
    const props = this.properties as any
    if (props.position && context.element instanceof HTMLElement) {
      this.applyAbsolutePosition(context.element, props.position)
    }

    return undefined
  }

  // Layout modifier implementations have been migrated to @tachui/modifiers/layout

  private applyOffsetTransform_DEPRECATED(
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
    if (!node.element || !context.element) {
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
    const styles = this.computeAppearanceStyles(resolved)
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
      const font = props.font
      if (font.family) {
        // Handle FontAsset objects that need to be resolved
        if (
          typeof font.family === 'object' &&
          font.family !== null &&
          'resolve' in font.family
        ) {
          styles.fontFamily = (font.family as any).resolve()
        } else {
          styles.fontFamily = font.family as string
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

    // Shadow functionality moved to @tachui/effects package

    // Clipped and Clip Shape modifiers moved to @tachui/modifiers package

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

    return undefined
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

    // Scale Effect (SwiftUI .scaleEffect(x, y, anchor))
    if (props.scaleEffect && context.element instanceof HTMLElement) {
      const { x, y, anchor } = props.scaleEffect
      const scaleY = y ?? x // Default to uniform scaling if y not provided

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
      context.element.style.transformOrigin = transformOrigin

      // Create scale transform
      const scaleTransform = `scale(${x}, ${scaleY})`

      // Preserve existing transforms but replace any existing scale functions
      const existingTransform = context.element.style.transform || ''
      const existingTransforms = existingTransform
        .replace(/\s*scale[XYZ3d]*\([^)]*\)\s*/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      const newTransform = existingTransforms
        ? `${existingTransforms} ${scaleTransform}`.trim()
        : scaleTransform

      context.element.style.transform = newTransform
    }

    // Overlay modifier moved to @tachui/modifiers package

    return undefined
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

    // Set up async task with cancellation
    if (props.task) {
      this.setupTask(context, props.task)
    }

    return undefined
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

  private addCleanup(cleanup: () => void): void {
    // Store cleanup functions for proper disposal
    if (!(this.properties as any)._cleanupFunctions) {
      ;(this.properties as any)._cleanupFunctions = []
    }
    ;(this.properties as any)._cleanupFunctions.push(cleanup)
  }
}

/**
 * Resizable modifier for making images resizable
 * In SwiftUI, .resizable() allows images to be scaled to fit their container
 */
export class ResizableModifier extends BaseModifier {
  readonly type = 'resizable'
  readonly priority = ModifierPriority.APPEARANCE

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    // For images, resizable means they can be scaled to fit their container
    // This is typically achieved with object-fit: fill in CSS
    if (context.element instanceof HTMLImageElement) {
      context.element.style.objectFit = 'fill'
    }

    return undefined
  }
}
