/**
 * Interaction Modifier (`@tachui/modifiers` root)
 *
 * `InteractionModifier` still differs from the one in `@tachui/core`, so it
 * stays here until its branches are reconciled into core. It extends core's
 * `BaseModifier`; every other base modifier class has a single implementation
 * in `@tachui/core/modifiers/base`, apart from the shadow and clip branches of
 * `AppearanceModifier`, which `../appearance-modifier` adds on top of core's.
 */

import { createEffect, isComputed, isSignal } from '@tachui/core/reactive'
import { BaseModifier } from '@tachui/core/modifiers/base'
import type { Signal } from '@tachui/types/reactive'
import type { DOMNode } from '@tachui/types/runtime'
import type { ModifierResult } from '@tachui/types/modifiers'
import type { ModifierContext } from '../types'
import { ModifierPriority } from '@tachui/types/modifiers'

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
