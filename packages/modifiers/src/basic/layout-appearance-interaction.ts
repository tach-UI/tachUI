/**
 * Layout, Appearance and Interaction Modifiers (`@tachui/modifiers` root)
 *
 * These classes still differ from the ones in `@tachui/core`, so they stay
 * here until their branches are reconciled into core. They extend core's
 * `BaseModifier`; `BaseModifier`, `AnimationModifier` and `LifecycleModifier`
 * themselves have a single implementation in `@tachui/core/modifiers/base`.
 */

import {
  createEffect,
  getThemeSignal,
  isComputed,
  isSignal,
} from '@tachui/core/reactive'
import { BaseModifier } from '@tachui/core/modifiers/base'
import type { Signal } from '@tachui/types/reactive'
import type { DOMNode } from '@tachui/types/runtime'
import type { ModifierResult, TransformAnchor } from '@tachui/types/modifiers'
import type {
  CSSStyleProperties,
  ModifierContext,
  StyleComputationContext,
} from '../types'
import { ModifierPriority } from '@tachui/types/modifiers'
import {
  isInfinity,
  dimensionToCSS,
  shouldExpandForInfinity,
} from '@tachui/core/constants/layout'
import { clipPathFor } from '../appearance/clip-path'
import { anchorTransform, setTransformPart } from '@tachui/core/modifiers'

function isHTMLElementRuntimeElement(element: unknown): element is HTMLElement {
  return typeof HTMLElement !== 'undefined' && element instanceof HTMLElement
}

function canUseDocument(): boolean {
  return typeof document !== 'undefined'
}

function canUseWindow(): boolean {
  return typeof window !== 'undefined'
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
    if (props.offset && isHTMLElementRuntimeElement(context.element)) {
      this.applyOffsetTransform(context.element, props.offset)
    }

    // Handle aspectRatio separately for reactive support
    if (props.aspectRatio && isHTMLElementRuntimeElement(context.element)) {
      this.applyAspectRatio(context.element, props.aspectRatio)
    }

    // Handle scaleEffect separately for proper transform combining (Phase 3 - Epic: Butternut)
    if (props.scaleEffect && isHTMLElementRuntimeElement(context.element)) {
      this.applyScaleTransform(context.element, props.scaleEffect)
    }

    // Handle absolutePosition separately for proper positioning (Phase 3 - Epic: Butternut)
    if (props.position && isHTMLElementRuntimeElement(context.element)) {
      this.applyAbsolutePosition(context.element, props.position)
    }

    // Handle zIndex separately for proper layering (Phase 3 - Epic: Butternut)
    if (props.zIndex !== undefined && isHTMLElementRuntimeElement(context.element)) {
      this.applyZIndex(context.element, props.zIndex)
    }

    return undefined
  }

  private applyOffsetTransform(
    element: HTMLElement,
    offset: { x?: any; y?: any }
  ): void {
    const { x, y } = offset
    const write = (currentX: any, currentY: any) =>
      setTransformPart(
        element,
        'offset',
        `translate(${this.toCSSValue(currentX)}, ${this.toCSSValue(currentY)})`
      )

    if (isSignal(x) || isComputed(x) || isSignal(y) || isComputed(y)) {
      createEffect(() => {
        write(
          isSignal(x) || isComputed(x) ? x() : (x ?? 0),
          isSignal(y) || isComputed(y) ? y() : (y ?? 0)
        )
      })
    } else {
      write(x ?? 0, y ?? 0)
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
    // The anchor travels inside the part rather than through
    // `transform-origin`, so another effect can keep an anchor of its own.
    const write = (currentX: any, currentY: any) =>
      setTransformPart(
        element,
        'scale',
        anchorTransform(
          `scale(${currentX}, ${currentY})`,
          anchor as TransformAnchor | undefined
        )
      )

    if (
      isSignal(scaleX) ||
      isComputed(scaleX) ||
      isSignal(scaleY) ||
      isComputed(scaleY)
    ) {
      createEffect(() => {
        write(
          isSignal(scaleX) || isComputed(scaleX) ? scaleX() : scaleX,
          isSignal(scaleY) || isComputed(scaleY) ? scaleY() : scaleY
        )
      })
    } else {
      write(scaleX, scaleY)
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

    // Shadow
    if (props.shadow) {
      const shadow = props.shadow
      const x = shadow.x || 0
      const y = shadow.y || 0
      const radius = shadow.radius || 0
      const color = shadow.color || 'rgba(0,0,0,0.25)'
      styles.boxShadow = `${x}px ${y}px ${radius}px ${color}`
    }

    // Clipped modifier (SwiftUI .clipped())
    if (props.clipped) {
      styles.overflow = 'hidden'
    }

    // Clip Shape modifier (SwiftUI .clipShape())
    if (props.clipShape) {
      const { shape, parameters } = props.clipShape
      // Through the same serializer `ClipShapeModifier` uses, so the props
      // form and the modifier form cannot drift. A polygon with no points is
      // the one difference: this path has always fallen back to the full box.
      const clipPath =
        clipPathFor(shape, parameters) ||
        (shape === 'polygon' ? 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' : '')
      if (clipPath) styles.clipPath = clipPath
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

    return styles
  }
}

/**
 * Interaction modifier for events and accessibility
 */
export class InteractionModifier extends BaseModifier {
  readonly type = 'interaction'
  readonly priority = ModifierPriority.INTERACTION

  apply(node: DOMNode, context: ModifierContext): DOMNode | ModifierResult | undefined {
    if (!context.element) return

    const props = this.properties as any
    const element = context.element

    // Track every registered listener so the returned cleanup can remove them (#216)
    const listeners: {
      target: EventTarget
      type: string
      handler: EventListener
      options?: AddEventListenerOptions | boolean
    }[] = []
    const lifecycleCleanups: (() => void)[] = []

    const addListener = (
      target: EventTarget,
      type: string,
      handler: EventListener,
      options?: AddEventListenerOptions | boolean
    ): void => {
      target.addEventListener(type, handler, options)
      listeners.push({ target, type, handler, options })
    }

    // Event handlers
    if (props.onTap) {
      addListener(element, 'click', props.onTap)
    }

    if (props.onHover) {
      addListener(element, 'mouseenter', () => props.onHover(true))
      addListener(element, 'mouseleave', () => props.onHover(false))
    }

    if (props.onMouseEnter) {
      addListener(element, 'mouseenter', props.onMouseEnter)
    }

    if (props.onMouseLeave) {
      addListener(element, 'mouseleave', props.onMouseLeave)
    }

    if (props.onMouseDown) {
      addListener(element, 'mousedown', props.onMouseDown)
    }

    if (props.onMouseUp) {
      addListener(element, 'mouseup', props.onMouseUp)
    }

    if (props.onDragStart) {
      addListener(element, 'dragstart', props.onDragStart)
    }

    if (props.onDragOver) {
      addListener(element, 'dragover', props.onDragOver)
    }

    if (props.onDragLeave) {
      addListener(element, 'dragleave', props.onDragLeave)
    }

    if (props.onDrop) {
      addListener(element, 'drop', props.onDrop)
    }

    // Additional mouse events
    if (props.onDoubleClick) {
      addListener(element, 'dblclick', props.onDoubleClick)
    }

    if (props.onContextMenu) {
      addListener(element, 'contextmenu', props.onContextMenu)
    }

    // Focus events
    if (props.onFocus) {
      addListener(element, 'focus', () => props.onFocus(true))
      addListener(element, 'blur', () => props.onFocus(false))
    }

    if (props.onBlur) {
      addListener(element, 'blur', () => props.onBlur(false))
    }

    // Keyboard events
    if (props.onKeyPress) {
      addListener(element, 'keypress', props.onKeyPress)
    }

    if (props.onKeyDown) {
      addListener(element, 'keydown', props.onKeyDown)
    }

    if (props.onKeyUp) {
      addListener(element, 'keyup', props.onKeyUp)
    }

    // Scroll and wheel events
    if (props.onScroll) {
      addListener(element, 'scroll', props.onScroll, {
        passive: true,
      })
    }

    if (props.onWheel) {
      addListener(element, 'wheel', props.onWheel, {
        passive: false,
      })
    }

    // Input events
    if (props.onInput) {
      addListener(element, 'input', props.onInput)
    }

    if (props.onChange) {
      addListener(element, 'change', event => {
        const target = event.target as HTMLInputElement
        const value = target.value || target.textContent || ''
        props.onChange(value, event)
      })
    }

    // Clipboard events
    if (props.onCopy) {
      addListener(element, 'copy', props.onCopy)
    }

    if (props.onCut) {
      addListener(element, 'cut', props.onCut)
    }

    if (props.onPaste) {
      addListener(element, 'paste', props.onPaste)
    }

    // Selection events
    if (props.onSelect) {
      addListener(element, 'select', props.onSelect)
    }

    // Disabled state
    if (props.disabled !== undefined) {
      if (isHTMLElementRuntimeElement(element)) {
        const htmlElement = element
        const applyDisabledState = (isDisabled: boolean): void => {
          if (isDisabled) {
            htmlElement.setAttribute('disabled', 'true')
            htmlElement.style.pointerEvents = 'none'
            htmlElement.style.opacity = '0.6'
          } else {
            htmlElement.removeAttribute('disabled')
            htmlElement.style.pointerEvents = ''
            htmlElement.style.opacity = ''
          }
        }

        if (isSignal(props.disabled) || isComputed(props.disabled)) {
          createEffect(() => {
            const currentDisabled = Boolean((props.disabled as () => unknown)())
            applyDisabledState(currentDisabled)
          })
        } else {
          applyDisabledState(Boolean(props.disabled))
        }
      }
    }

    // Draggable state
    if (props.draggable !== undefined) {
      if (isHTMLElementRuntimeElement(element)) {
        element.draggable = props.draggable
      }
    }

    // Accessibility
    if (props.accessibilityLabel) {
      element.setAttribute('aria-label', props.accessibilityLabel)
    }

    if (props.accessibilityHint) {
      element.setAttribute('aria-describedby', props.accessibilityHint)
    }

    // Advanced Gesture Modifiers (Phase 4 - Epic: Butternut)
    if (props.onLongPressGesture) {
      lifecycleCleanups.push(
        this.setupLongPressGesture(element, props.onLongPressGesture)
      )
    }

    if (props.keyboardShortcut) {
      const cleanup = this.setupKeyboardShortcut(element, props.keyboardShortcut)
      if (cleanup) lifecycleCleanups.push(cleanup)
    }

    if (props.focused !== undefined) {
      this.setupFocusManagement(element, props.focused)
    }

    if (props.focusable) {
      const cleanup = this.setupFocusable(element, props.focusable)
      if (cleanup) lifecycleCleanups.push(cleanup)
    }

    if (props.onContinuousHover) {
      lifecycleCleanups.push(
        this.setupContinuousHover(element, props.onContinuousHover)
      )
    }

    if (props.allowsHitTesting !== undefined) {
      this.setupHitTesting(element, props.allowsHitTesting)
    }

    // Teardown removes every registered listener from the same target it was
    // added to (including document/window targets) and runs gesture cleanups.
    const teardown = () => {
      for (const { target, type, handler, options } of listeners) {
        target.removeEventListener(type, handler, options)
      }
      listeners.length = 0

      for (const fn of lifecycleCleanups) {
        fn()
      }
      lifecycleCleanups.length = 0
    }

    return { node, cleanup: [teardown] }
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
  ): () => void {
    const minimumDuration = options.minimumDuration ?? 500 // ms
    const maximumDistance = options.maximumDistance ?? 10 // px

    let timeoutId: ReturnType<typeof setTimeout> | undefined
    let startPoint: { x: number; y: number } | null = null
    let isPressing = false

    // Ends the current press (timer/state reset). Invoked on pointerup,
    // pointercancel, movement-cancel, and when the long-press fires — must NOT
    // remove listeners, or the first press would unregister the gesture.
    const endPress = () => {
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

    // Unmount teardown: reset any in-flight press and remove the listeners.
    const teardown = () => {
      endPress()
      element.removeEventListener('pointerdown', handlePointerDown as EventListener)
      element.removeEventListener('pointermove', handlePointerMove as EventListener)
      element.removeEventListener('pointerup', handlePointerUp as EventListener)
      element.removeEventListener(
        'pointercancel',
        handlePointerCancel as EventListener
      )
    }

    const handlePointerDown = (event: Event) => {
      const pointerEvent = event as PointerEvent
      startPoint = { x: pointerEvent.clientX, y: pointerEvent.clientY }
      isPressing = true

      if (options.onPressingChanged) {
        options.onPressingChanged(true)
      }

      timeoutId = (canUseWindow() ? window.setTimeout : setTimeout)(() => {
        if (isPressing && startPoint) {
          options.perform()
          endPress()
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
        endPress()
      }
    }

    const handlePointerUp = () => {
      endPress()
    }

    const handlePointerCancel = () => {
      endPress()
    }

    // Use pointer events for better touch/mouse compatibility
    element.addEventListener('pointerdown', handlePointerDown as EventListener)
    element.addEventListener('pointermove', handlePointerMove as EventListener)
    element.addEventListener('pointerup', handlePointerUp as EventListener)
    element.addEventListener(
      'pointercancel',
      handlePointerCancel as EventListener
    )

    // Store unmount teardown for later removal
    ;(element as any)._longPressCleanup = teardown

    return teardown
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
  ): (() => void) | undefined {
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
    if (!canUseDocument()) return undefined
    document.addEventListener('keydown', handleKeyDown)

    // Store cleanup function
    const cleanup = () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
    ;(element as any)._keyboardShortcutCleanup = cleanup

    return cleanup
  }

  /**
   * Setup focus management with reactive binding
   */
  private setupFocusManagement(
    element: Element,
    focused: boolean | Signal<boolean>
  ): void {
    if (!isHTMLElementRuntimeElement(element)) return

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
  ): (() => void) | undefined {
    if (!isHTMLElementRuntimeElement(element)) return undefined

    const htmlElement = element as HTMLElement

    if (options.isFocusable === false) {
      htmlElement.setAttribute('tabindex', '-1')
    } else {
      if (!htmlElement.hasAttribute('tabindex')) {
        htmlElement.setAttribute('tabindex', '0')
      }
    }

    // Setup interaction behaviors
    let keydownCleanup: (() => void) | undefined
    if (options.interactions?.includes('activate')) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          htmlElement.click()
        }
      }
      htmlElement.addEventListener('keydown', handleKeyDown)
      keydownCleanup = () => {
        htmlElement.removeEventListener('keydown', handleKeyDown)
      }
    }

    if (options.interactions?.includes('edit')) {
      htmlElement.setAttribute('role', 'textbox')
      htmlElement.setAttribute('contenteditable', 'true')
    }

    return keydownCleanup
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
  ): () => void {
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
    const cleanup = () => {
      element.removeEventListener('mousemove', handleMouseMove as EventListener)
      element.removeEventListener(
        'mouseleave',
        handleMouseLeave as EventListener
      )
    }
    ;(element as any)._continuousHoverCleanup = cleanup

    return cleanup
  }

  /**
   * Setup hit testing control
   */
  private setupHitTesting(element: Element, enabled: boolean): void {
    if (isHTMLElementRuntimeElement(element)) {
      element.style.pointerEvents = enabled ? '' : 'none'
    }
  }
}
