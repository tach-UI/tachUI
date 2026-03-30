/**
 * Navigation Modifiers Implementation
 *
 * Implements SwiftUI's navigation modifiers as proper TachUI modifiers
 * with inheritance support and automatic state management.
 */

import {
  createEffect,
  getSignalImpl,
  isSignal,
  mountComponentTree,
} from '@tachui/core'
import type { Accessor, Binding, ComponentInstance } from '@tachui/core'
import type { NavigationContext } from './types'

/**
 * Navigation modifier configuration
 */
export interface NavigationModifierConfig {
  title?: string
  titleDisplayMode?: 'automatic' | 'inline' | 'large'
  barHidden?: boolean
  backButtonHidden?: boolean
  backButtonTitle?: string
  toolbarBackground?: string
  foregroundColor?: string
  leadingItems?: ComponentInstance[]
  trailingItems?: ComponentInstance[]
}

type SheetPresentationState = Accessor<boolean> | Binding<boolean>

export interface SheetPresentationOptions {
  dismissOnBackdropTap?: boolean
  dismissOnEscape?: boolean
  backdropColor?: string
  transitionDurationMs?: number
  maxWidth?: string
  zIndex?: number
  ariaLabel?: string
  onDismiss?: () => void
}

export type PopoverArrowEdge = 'top' | 'bottom' | 'leading' | 'trailing'

export interface PopoverPresentationOptions {
  dismissOnOutsideClick?: boolean
  dismissOnEscape?: boolean
  offset?: number
  zIndex?: number
  maxWidth?: string
  ariaLabel?: string
  onDismiss?: () => void
}

/**
 * Navigation modifier state management
 */
class NavigationModifierManager {
  private _modifierStack: NavigationModifierConfig[] = []
  private _listeners: Set<(config: NavigationModifierConfig) => void> = new Set()

  /**
   * Push a new navigation modifier configuration
   */
  pushModifier(config: NavigationModifierConfig): void {
    this._modifierStack.push(config)
    this._notifyListeners()
  }

  /**
   * Pop the last navigation modifier configuration
   */
  popModifier(): NavigationModifierConfig | undefined {
    const popped = this._modifierStack.pop()
    this._notifyListeners()
    return popped
  }

  /**
   * Get the current merged configuration
   */
  getCurrentConfig(): NavigationModifierConfig {
    // Merge all configurations in the stack
    return this._modifierStack.reduce((merged, config) => ({
      ...merged,
      ...config
    }), {} as NavigationModifierConfig)
  }

  /**
   * Subscribe to configuration changes
   */
  onChange(listener: (config: NavigationModifierConfig) => void): () => void {
    this._listeners.add(listener)
    return () => {
      this._listeners.delete(listener)
    }
  }

  /**
   * Clear all modifiers
   */
  clear(): void {
    this._modifierStack = []
    this._notifyListeners()
  }

  /**
   * Notify all listeners of configuration changes
   */
  private _notifyListeners(): void {
    const config = this.getCurrentConfig()
    this._listeners.forEach(listener => {
      try {
        listener(config)
      } catch (error) {
        console.error('Navigation modifier listener error:', error)
      }
    })
  }
}

// Global modifier manager
const navigationModifierManager = new NavigationModifierManager()

/**
 * .navigationTitle() modifier
 *
 * @param component - The component to modify
 * @param title - The navigation title
 * @returns The component with navigation title metadata
 */
export function navigationTitle(
  component: ComponentInstance,
  title: string
): ComponentInstance {
  // Store modifier on component
  ;(component as any)._navigationModifiers = {
    ...(component as any)._navigationModifiers,
    title
  }

  // Apply to current navigation context
  navigationModifierManager.pushModifier({ title })

  return component
}

/**
 * .navigationBarTitleDisplayMode() modifier
 *
 * @param component - The component to modify
 * @param mode - The title display mode
 * @returns The component with title display mode metadata
 */
export function navigationBarTitleDisplayMode(
  component: ComponentInstance,
  mode: 'automatic' | 'inline' | 'large'
): ComponentInstance {
  ;(component as any)._navigationModifiers = {
    ...(component as any)._navigationModifiers,
    titleDisplayMode: mode
  }

  navigationModifierManager.pushModifier({ titleDisplayMode: mode })

  return component
}

/**
 * .navigationBarHidden() modifier
 *
 * @param component - The component to modify
 * @param hidden - Whether the navigation bar should be hidden
 * @returns The component with navigation bar visibility metadata
 */
export function navigationBarHidden(
  component: ComponentInstance,
  hidden: boolean = true
): ComponentInstance {
  ;(component as any)._navigationModifiers = {
    ...(component as any)._navigationModifiers,
    barHidden: hidden
  }

  navigationModifierManager.pushModifier({ barHidden: hidden })

  return component
}

/**
 * .navigationBarItems() modifier
 *
 * @param component - The component to modify
 * @param options - Leading and trailing navigation bar items
 * @returns The component with navigation bar items metadata
 */
export function navigationBarItems(
  component: ComponentInstance,
  options: {
    leading?: ComponentInstance | ComponentInstance[]
    trailing?: ComponentInstance | ComponentInstance[]
  }
): ComponentInstance {
  const leadingItems = Array.isArray(options.leading) ? options.leading :
                     options.leading ? [options.leading] : []
  const trailingItems = Array.isArray(options.trailing) ? options.trailing :
                       options.trailing ? [options.trailing] : []

  ;(component as any)._navigationModifiers = {
    ...(component as any)._navigationModifiers,
    leadingItems,
    trailingItems
  }

  navigationModifierManager.pushModifier({ leadingItems, trailingItems })

  return component
}

/**
 * .navigationBarBackButtonHidden() modifier
 *
 * @param component - The component to modify
 * @param hidden - Whether the back button should be hidden
 * @returns The component with back button visibility metadata
 */
export function navigationBarBackButtonHidden(
  component: ComponentInstance,
  hidden: boolean = true
): ComponentInstance {
  ;(component as any)._navigationModifiers = {
    ...(component as any)._navigationModifiers,
    backButtonHidden: hidden
  }

  navigationModifierManager.pushModifier({ backButtonHidden: hidden })

  return component
}

/**
 * .navigationBarBackButtonTitle() modifier
 *
 * @param component - The component to modify
 * @param title - The back button title
 * @returns The component with back button title metadata
 */
export function navigationBarBackButtonTitle(
  component: ComponentInstance,
  title: string
): ComponentInstance {
  ;(component as any)._navigationModifiers = {
    ...(component as any)._navigationModifiers,
    backButtonTitle: title
  }

  navigationModifierManager.pushModifier({ backButtonTitle: title })

  return component
}

/**
 * .toolbarBackground() modifier
 *
 * @param component - The component to modify
 * @param background - The toolbar background color
 * @returns The component with toolbar background metadata
 */
export function toolbarBackground(
  component: ComponentInstance,
  background: string
): ComponentInstance {
  ;(component as any)._navigationModifiers = {
    ...(component as any)._navigationModifiers,
    toolbarBackground: background
  }

  navigationModifierManager.pushModifier({ toolbarBackground: background })

  return component
}

/**
 * .toolbarForegroundColor() modifier
 *
 * @param component - The component to modify
 * @param color - The toolbar foreground color
 * @returns The component with toolbar foreground color metadata
 */
export function toolbarForegroundColor(
  component: ComponentInstance,
  color: string
): ComponentInstance {
  ;(component as any)._navigationModifiers = {
    ...(component as any)._navigationModifiers,
    foregroundColor: color
  }

  navigationModifierManager.pushModifier({ foregroundColor: color })

  return component
}

function readPresentedState(isPresented: SheetPresentationState): boolean {
  if (typeof isPresented === 'function') {
    return Boolean(isPresented())
  }

  return Boolean(isPresented.get())
}

function dismissPresentedState(
  isPresented: SheetPresentationState,
  options: SheetPresentationOptions
): boolean {
  if (typeof isPresented !== 'function') {
    isPresented.set(false)
    options.onDismiss?.()
    return true
  }

  if (isSignal(isPresented)) {
    const signal = getSignalImpl(isPresented)
    if (signal) {
      signal.set(false)
      options.onDismiss?.()
      return true
    }
  }

  console.error(
    '.sheet dismiss requires a writable signal accessor or Binding<boolean>. Computed/read-only accessors are not dismissible.'
  )
  options.onDismiss?.()
  return false
}

function setupSheetPresentation(
  isPresented: SheetPresentationState,
  content: () => ComponentInstance,
  options: SheetPresentationOptions
): () => void {
  if (typeof document === 'undefined') {
    return () => {}
  }

  let portalRoot: HTMLDivElement | null = null
  let backdrop: HTMLDivElement | null = null
  let sheetHost: HTMLDivElement | null = null
  let disposeSheetContent: (() => void) | null = null
  let previousActiveElement: HTMLElement | null = null
  let removeEscapeListener: (() => void) | null = null
  let isMounted = false
  let transitionFrameId: number | null = null
  let focusFrameId: number | null = null
  let isTransitionQueued = false
  const transitionDurationMs = options.transitionDurationMs ?? 220

  const clearTransitionQueue = () => {
    if (transitionFrameId !== null) {
      cancelAnimationFrame(transitionFrameId)
      transitionFrameId = null
    }
    isTransitionQueued = false
  }

  const scheduleEntranceTransition = () => {
    if (!backdrop || !sheetHost || isTransitionQueued) {
      return
    }

    isTransitionQueued = true
    transitionFrameId = requestAnimationFrame(() => {
      if (backdrop) {
        backdrop.style.opacity = '1'
      }
      if (sheetHost) {
        sheetHost.style.transform = 'translateY(0)'
      }
      transitionFrameId = null
      isTransitionQueued = false
    })
  }

  const unmountPortal = () => {
    clearTransitionQueue()

    if (disposeSheetContent) {
      disposeSheetContent()
      disposeSheetContent = null
    }

    if (focusFrameId !== null) {
      cancelAnimationFrame(focusFrameId)
      focusFrameId = null
    }

    if (portalRoot) {
      portalRoot.remove()
      portalRoot = null
    }

    if (removeEscapeListener) {
      removeEscapeListener()
      removeEscapeListener = null
    }

    if (
      previousActiveElement &&
      previousActiveElement.isConnected &&
      typeof previousActiveElement.focus === 'function'
    ) {
      previousActiveElement.focus()
    }
    previousActiveElement = null

    backdrop = null
    sheetHost = null
    isMounted = false
  }

  const mountPortal = () => {
    if (isMounted) {
      return
    }

    portalRoot = document.createElement('div')
    portalRoot.setAttribute('data-tachui-sheet-root', 'true')
    portalRoot.style.position = 'fixed'
    portalRoot.style.inset = '0'
    portalRoot.style.zIndex = String(options.zIndex ?? 1000)
    portalRoot.style.display = 'flex'
    portalRoot.style.alignItems = 'flex-end'
    portalRoot.style.justifyContent = 'center'
    portalRoot.style.pointerEvents = 'none'

    backdrop = document.createElement('div')
    backdrop.setAttribute('data-tachui-sheet-backdrop', 'true')
    backdrop.style.position = 'absolute'
    backdrop.style.inset = '0'
    backdrop.style.background =
      options.backdropColor ?? 'rgba(0, 0, 0, 0.45)'
    backdrop.style.opacity = '0'
    backdrop.style.pointerEvents = 'auto'
    backdrop.style.transition = `opacity ${transitionDurationMs}ms ease`

    sheetHost = document.createElement('div')
    sheetHost.setAttribute('data-tachui-sheet-content', 'true')
    sheetHost.setAttribute('role', 'dialog')
    sheetHost.setAttribute('aria-modal', 'true')
    if (options.ariaLabel) {
      sheetHost.setAttribute('aria-label', options.ariaLabel)
    }
    sheetHost.tabIndex = -1
    sheetHost.style.position = 'relative'
    sheetHost.style.width = '100%'
    sheetHost.style.maxWidth = options.maxWidth ?? '640px'
    sheetHost.style.transform = 'translateY(100%)'
    sheetHost.style.transition = `transform ${transitionDurationMs}ms ease`
    sheetHost.style.pointerEvents = 'auto'

    if (options.dismissOnBackdropTap !== false) {
      backdrop.addEventListener('click', () => {
        dismissPresentedState(isPresented, options)
      })
    }

    if (options.dismissOnEscape !== false) {
      const escapeListener = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          dismissPresentedState(isPresented, options)
        }
      }
      document.addEventListener('keydown', escapeListener)
      removeEscapeListener = () => {
        document.removeEventListener('keydown', escapeListener)
      }
    }

    portalRoot.append(backdrop, sheetHost)
    document.body.appendChild(portalRoot)

    previousActiveElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    disposeSheetContent = mountComponentTree(content(), sheetHost)
    isMounted = true
    scheduleEntranceTransition()

    focusFrameId = requestAnimationFrame(() => {
      const focusableElement = sheetHost?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      if (focusableElement && typeof focusableElement.focus === 'function') {
        focusableElement.focus()
      } else if (sheetHost) {
        sheetHost.focus()
      }
      focusFrameId = null
    })
  }

  const presentationEffect = createEffect(() => {
    const presented = readPresentedState(isPresented)

    if (presented) {
      mountPortal()
      return
    }

    unmountPortal()
  })

  return () => {
    presentationEffect.dispose()
    unmountPortal()
  }
}

function oppositePopoverEdge(edge: PopoverArrowEdge): PopoverArrowEdge {
  switch (edge) {
    case 'top':
      return 'bottom'
    case 'bottom':
      return 'top'
    case 'leading':
      return 'trailing'
    case 'trailing':
      return 'leading'
  }
}

function calculatePopoverPosition(
  edge: PopoverArrowEdge,
  anchorRect: DOMRect,
  popoverWidth: number,
  popoverHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  offset: number
): { top: number; left: number } {
  switch (edge) {
    // arrow on top edge => popover shown below anchor
    case 'top':
      return {
        top: anchorRect.bottom + offset,
        left: anchorRect.left + anchorRect.width / 2 - popoverWidth / 2,
      }
    // arrow on bottom edge => popover shown above anchor
    case 'bottom':
      return {
        top: anchorRect.top - popoverHeight - offset,
        left: anchorRect.left + anchorRect.width / 2 - popoverWidth / 2,
      }
    // arrow on leading edge => popover shown right of anchor
    case 'leading':
      return {
        top: anchorRect.top + anchorRect.height / 2 - popoverHeight / 2,
        left: anchorRect.right + offset,
      }
    // arrow on trailing edge => popover shown left of anchor
    case 'trailing':
      return {
        top: anchorRect.top + anchorRect.height / 2 - popoverHeight / 2,
        left: anchorRect.left - popoverWidth - offset,
      }
  }
}

function hasPopoverOverflow(
  position: { top: number; left: number },
  popoverWidth: number,
  popoverHeight: number,
  viewportWidth: number,
  viewportHeight: number
): boolean {
  const viewportPadding = 8
  return (
    position.top < viewportPadding ||
    position.left < viewportPadding ||
    position.top + popoverHeight > viewportHeight - viewportPadding ||
    position.left + popoverWidth > viewportWidth - viewportPadding
  )
}

function clampPopoverPosition(
  position: { top: number; left: number },
  popoverWidth: number,
  popoverHeight: number,
  viewportWidth: number,
  viewportHeight: number
): { top: number; left: number } {
  const viewportPadding = 8
  return {
    top: Math.min(
      Math.max(position.top, viewportPadding),
      Math.max(viewportPadding, viewportHeight - popoverHeight - viewportPadding)
    ),
    left: Math.min(
      Math.max(position.left, viewportPadding),
      Math.max(viewportPadding, viewportWidth - popoverWidth - viewportPadding)
    ),
  }
}

function setupPopoverPresentation(
  anchorElement: Element | undefined,
  isPresented: SheetPresentationState,
  preferredEdge: PopoverArrowEdge,
  content: () => ComponentInstance,
  options: PopoverPresentationOptions
): () => void {
  if (typeof document === 'undefined' || !anchorElement) {
    return () => {}
  }

  let portalRoot: HTMLDivElement | null = null
  let popoverHost: HTMLDivElement | null = null
  let popoverArrow: HTMLDivElement | null = null
  let popoverContentHost: HTMLDivElement | null = null
  let removeEscapeListener: (() => void) | null = null
  let removeOutsideClickListener: (() => void) | null = null
  let removeRepositionListener: (() => void) | null = null
  let disposePopoverContent: (() => void) | null = null
  let isMounted = false
  const offset = options.offset ?? 12

  const applyArrowStyle = (edge: PopoverArrowEdge) => {
    if (!popoverArrow) {
      return
    }

    popoverArrow.style.width = '10px'
    popoverArrow.style.height = '10px'
    popoverArrow.style.position = 'absolute'
    popoverArrow.style.background = 'white'
    popoverArrow.style.transform = 'rotate(45deg)'
    popoverArrow.style.boxShadow = '-1px -1px 1px rgba(0, 0, 0, 0.08)'

    popoverArrow.style.top = ''
    popoverArrow.style.bottom = ''
    popoverArrow.style.left = ''
    popoverArrow.style.right = ''
    popoverArrow.style.marginLeft = ''
    popoverArrow.style.marginTop = ''

    if (edge === 'top') {
      popoverArrow.style.top = '-5px'
      popoverArrow.style.left = '50%'
      popoverArrow.style.marginLeft = '-5px'
    } else if (edge === 'bottom') {
      popoverArrow.style.bottom = '-5px'
      popoverArrow.style.left = '50%'
      popoverArrow.style.marginLeft = '-5px'
    } else if (edge === 'leading') {
      popoverArrow.style.left = '-5px'
      popoverArrow.style.top = '50%'
      popoverArrow.style.marginTop = '-5px'
    } else {
      popoverArrow.style.right = '-5px'
      popoverArrow.style.top = '50%'
      popoverArrow.style.marginTop = '-5px'
    }
  }

  const positionPopover = () => {
    if (!popoverHost || !anchorElement) {
      return
    }

    const anchorRect = anchorElement.getBoundingClientRect()
    const measuredRect = popoverHost.getBoundingClientRect()
    const popoverWidth = measuredRect.width || 280
    const popoverHeight = measuredRect.height || 200
    const viewportWidth = window.innerWidth || 1024
    const viewportHeight = window.innerHeight || 768

    const preferredPosition = calculatePopoverPosition(
      preferredEdge,
      anchorRect,
      popoverWidth,
      popoverHeight,
      viewportWidth,
      viewportHeight,
      offset
    )

    let resolvedEdge = preferredEdge
    let resolvedPosition = preferredPosition

    if (
      hasPopoverOverflow(
        preferredPosition,
        popoverWidth,
        popoverHeight,
        viewportWidth,
        viewportHeight
      )
    ) {
      const flippedEdge = oppositePopoverEdge(preferredEdge)
      const flippedPosition = calculatePopoverPosition(
        flippedEdge,
        anchorRect,
        popoverWidth,
        popoverHeight,
        viewportWidth,
        viewportHeight,
        offset
      )

      resolvedEdge = flippedEdge
      resolvedPosition = flippedPosition
    }

    const clampedPosition = clampPopoverPosition(
      resolvedPosition,
      popoverWidth,
      popoverHeight,
      viewportWidth,
      viewportHeight
    )

    popoverHost.style.top = `${clampedPosition.top}px`
    popoverHost.style.left = `${clampedPosition.left}px`
    popoverHost.setAttribute('data-tachui-popover-edge', resolvedEdge)
    applyArrowStyle(resolvedEdge)
  }

  const unmountPortal = () => {
    if (disposePopoverContent) {
      disposePopoverContent()
      disposePopoverContent = null
    }

    if (removeEscapeListener) {
      removeEscapeListener()
      removeEscapeListener = null
    }

    if (removeOutsideClickListener) {
      removeOutsideClickListener()
      removeOutsideClickListener = null
    }

    if (removeRepositionListener) {
      removeRepositionListener()
      removeRepositionListener = null
    }

    if (portalRoot) {
      portalRoot.remove()
      portalRoot = null
    }

    popoverHost = null
    popoverArrow = null
    popoverContentHost = null
    isMounted = false
  }

  const mountPortal = () => {
    if (isMounted) {
      positionPopover()
      return
    }

    portalRoot = document.createElement('div')
    portalRoot.setAttribute('data-tachui-popover-root', 'true')
    portalRoot.style.position = 'fixed'
    portalRoot.style.inset = '0'
    portalRoot.style.pointerEvents = 'none'
    portalRoot.style.zIndex = String(options.zIndex ?? 1100)

    popoverHost = document.createElement('div')
    popoverHost.setAttribute('data-tachui-popover-content', 'true')
    popoverHost.setAttribute('role', 'dialog')
    popoverHost.setAttribute('aria-modal', 'false')
    if (options.ariaLabel) {
      popoverHost.setAttribute('aria-label', options.ariaLabel)
    }
    popoverHost.style.position = 'fixed'
    popoverHost.style.pointerEvents = 'auto'
    popoverHost.style.background = 'white'
    popoverHost.style.border = '1px solid rgba(0, 0, 0, 0.12)'
    popoverHost.style.borderRadius = '10px'
    popoverHost.style.boxShadow =
      '0 10px 30px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0, 0, 0, 0.08)'
    popoverHost.style.padding = '12px'
    popoverHost.style.maxWidth = options.maxWidth ?? '320px'

    popoverArrow = document.createElement('div')
    popoverArrow.setAttribute('data-tachui-popover-arrow', 'true')

    popoverContentHost = document.createElement('div')
    popoverContentHost.setAttribute('data-tachui-popover-body', 'true')

    popoverHost.append(popoverArrow, popoverContentHost)
    portalRoot.append(popoverHost)
    document.body.appendChild(portalRoot)

    disposePopoverContent = mountComponentTree(content(), popoverContentHost)
    positionPopover()

    if (options.dismissOnOutsideClick !== false) {
      const outsideListener = (event: MouseEvent) => {
        const target = event.target as Node | null
        if (!target || !popoverHost || !anchorElement) {
          return
        }

        if (popoverHost.contains(target) || anchorElement.contains(target)) {
          return
        }

        dismissPresentedState(isPresented, {
          dismissOnEscape: options.dismissOnEscape,
          onDismiss: options.onDismiss,
        })
      }

      document.addEventListener('mousedown', outsideListener)
      removeOutsideClickListener = () => {
        document.removeEventListener('mousedown', outsideListener)
      }
    }

    if (options.dismissOnEscape !== false) {
      const escapeListener = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          dismissPresentedState(isPresented, {
            dismissOnEscape: options.dismissOnEscape,
            onDismiss: options.onDismiss,
          })
        }
      }

      document.addEventListener('keydown', escapeListener)
      removeEscapeListener = () => {
        document.removeEventListener('keydown', escapeListener)
      }
    }

    const repositionListener = () => {
      positionPopover()
    }
    window.addEventListener('resize', repositionListener)
    window.addEventListener('scroll', repositionListener, true)
    removeRepositionListener = () => {
      window.removeEventListener('resize', repositionListener)
      window.removeEventListener('scroll', repositionListener, true)
    }

    isMounted = true
  }

  const presentationEffect = createEffect(() => {
    const presented = readPresentedState(isPresented)

    if (presented) {
      mountPortal()
      return
    }

    unmountPortal()
  })

  return () => {
    presentationEffect.dispose()
    unmountPortal()
  }
}

/**
 * .sheet() modifier
 *
 * @param component - The component to anchor sheet presentation to
 * @param isPresented - Reactive sheet presentation state accessor/binding
 * @param content - Sheet content factory
 * @param options - Presentation options
 * @returns The modified component
 */
export function sheet(
  component: ComponentInstance,
  isPresented: SheetPresentationState,
  content: () => ComponentInstance,
  options: SheetPresentationOptions = {}
): ComponentInstance {
  ;(component as any)._navigationModifiers = {
    ...(component as any)._navigationModifiers,
    sheet: { isPresented, content, options },
  }

  const existingLifecycle = (component as any)._enhancedLifecycle ?? {}
  const existingOnDOMReady = existingLifecycle.onDOMReady as
    | ((elements: Map<string, Element>, primary?: Element) => void | (() => void))
    | undefined

  ;(component as any)._enhancedLifecycle = {
    ...existingLifecycle,
    onDOMReady: (elements: Map<string, Element>, primary?: Element) => {
      const existingCleanup = existingOnDOMReady?.(elements, primary)
      const sheetCleanup = setupSheetPresentation(isPresented, content, options)

      return () => {
        sheetCleanup()
        if (typeof existingCleanup === 'function') {
          existingCleanup()
        }
      }
    },
  }

  return component
}

/**
 * .popover() modifier
 *
 * @param component - The component to anchor popover presentation to
 * @param isPresented - Reactive popover presentation state accessor/binding
 * @param arrowEdge - Preferred popover arrow edge orientation
 * @param content - Popover content factory
 * @param options - Presentation options
 * @returns The modified component
 */
export function popover(
  component: ComponentInstance,
  isPresented: SheetPresentationState,
  arrowEdge: PopoverArrowEdge,
  content: () => ComponentInstance,
  options: PopoverPresentationOptions = {}
): ComponentInstance {
  ;(component as any)._navigationModifiers = {
    ...(component as any)._navigationModifiers,
    popover: { isPresented, arrowEdge, content, options },
  }

  const existingLifecycle = (component as any)._enhancedLifecycle ?? {}
  const existingOnDOMReady = existingLifecycle.onDOMReady as
    | ((elements: Map<string, Element>, primary?: Element) => void | (() => void))
    | undefined

  ;(component as any)._enhancedLifecycle = {
    ...existingLifecycle,
    onDOMReady: (elements: Map<string, Element>, primary?: Element) => {
      const existingCleanup = existingOnDOMReady?.(elements, primary)
      const popoverCleanup = setupPopoverPresentation(
        primary,
        isPresented,
        arrowEdge,
        content,
        options
      )

      return () => {
        popoverCleanup()
        if (typeof existingCleanup === 'function') {
          existingCleanup()
        }
      }
    },
  }

  return component
}

/**
 * Get the current navigation modifier configuration
 */
export function getCurrentNavigationModifiers(): NavigationModifierConfig {
  return navigationModifierManager.getCurrentConfig()
}

/**
 * Subscribe to navigation modifier changes
 */
export function onNavigationModifierChange(
  listener: (config: NavigationModifierConfig) => void
): () => void {
  return navigationModifierManager.onChange(listener)
}

/**
 * Clear all navigation modifiers
 */
export function clearNavigationModifiers(): void {
  navigationModifierManager.clear()
}

/**
 * Extract navigation modifiers from a component
 */
export function extractNavigationModifiers(component: ComponentInstance): NavigationModifierConfig {
  return (component as any)._navigationModifiers || {}
}

/**
 * Check if a component has navigation modifiers
 */
export function hasNavigationModifiers(component: ComponentInstance): boolean {
  return !!(component as any)._navigationModifiers
}

/**
 * Apply navigation modifiers to a navigation context
 */
export function applyNavigationModifiers(
  context: NavigationContext,
  modifiers: NavigationModifierConfig
): void {
  // This would update the navigation context with the modifier configuration
  // Implementation depends on how NavigationContext is structured
  ;(context as any)._appliedModifiers = {
    ...(context as any)._appliedModifiers,
    ...modifiers
  }
}

/**
 * Enhanced NavigationStack that responds to modifiers
 */
export function enhanceNavigationStackWithModifiers(
  navigationStack: ComponentInstance
): ComponentInstance {
  // Listen for modifier changes and update navigation bar
  const unsubscribe = onNavigationModifierChange((config) => {
    // Update navigation bar based on modifier configuration
    updateNavigationBarFromModifiers(navigationStack, config)
  })

  // Store cleanup function
  ;(navigationStack as any)._modifierCleanup = unsubscribe

  return navigationStack
}

/**
 * Update navigation bar based on modifier configuration
 */
function updateNavigationBarFromModifiers(
  navigationStack: ComponentInstance,
  config: NavigationModifierConfig
): void {
  const navigationBar = (navigationStack as any)._navigationBar

  if (navigationBar && config) {
    // Update navigation bar properties based on configuration
    if (config.title !== undefined) {
      ;(navigationBar as any).title = config.title
    }

    if (config.barHidden !== undefined) {
      ;(navigationBar as any).hidden = config.barHidden
    }

    if (config.toolbarBackground !== undefined) {
      ;(navigationBar as any).backgroundColor = config.toolbarBackground
    }

    if (config.foregroundColor !== undefined) {
      ;(navigationBar as any).foregroundColor = config.foregroundColor
    }

    // Add more updates as needed...
  }
}

/**
 * Navigation modifier utilities
 */
export const NavigationModifierUtils = {
  /**
   * Create a modifier scope
   */
  createScope(): {
    push: (config: NavigationModifierConfig) => void
    pop: () => NavigationModifierConfig | undefined
    current: () => NavigationModifierConfig
  } {
    return {
      push: (config) => navigationModifierManager.pushModifier(config),
      pop: () => navigationModifierManager.popModifier(),
      current: () => navigationModifierManager.getCurrentConfig()
    }
  },

  /**
   * Merge modifier configurations
   */
  mergeConfigs(...configs: NavigationModifierConfig[]): NavigationModifierConfig {
    return configs.reduce((merged, config) => ({
      ...merged,
      ...config
    }), {})
  },

  /**
   * Check if configuration is empty
   */
  isEmpty(config: NavigationModifierConfig): boolean {
    return Object.keys(config).length === 0
  }
}

/**
 * Add navigation modifier methods to ComponentInstance prototype
 */
declare module '@tachui/core' {
  interface ComponentInstance {
    navigationTitle(title: string): ComponentInstance
    navigationBarTitleDisplayMode(mode: 'automatic' | 'inline' | 'large'): ComponentInstance
    navigationBarHidden(hidden?: boolean): ComponentInstance
    navigationBarItems(options: { leading?: ComponentInstance | ComponentInstance[], trailing?: ComponentInstance | ComponentInstance[] }): ComponentInstance
    navigationBarBackButtonHidden(hidden?: boolean): ComponentInstance
    navigationBarBackButtonTitle(title: string): ComponentInstance
    toolbarBackground(background: string): ComponentInstance
    toolbarForegroundColor(color: string): ComponentInstance
    // Modal presentation modifiers
    sheet(
      isPresented: Accessor<boolean> | Binding<boolean>,
      content: () => ComponentInstance,
      options?: SheetPresentationOptions
    ): ComponentInstance
    fullScreenCover(isPresented: () => boolean, content: () => ComponentInstance, options?: any): ComponentInstance
    popover(
      isPresented: Accessor<boolean> | Binding<boolean>,
      arrowEdge: PopoverArrowEdge,
      content: () => ComponentInstance,
      options?: PopoverPresentationOptions
    ): ComponentInstance
  }
}

// Extend ComponentInstance prototype if possible
if (typeof window !== 'undefined' && (window as any).ComponentInstance) {
  const proto = (window as any).ComponentInstance.prototype

  proto.navigationTitle = function(title: string) {
    return navigationTitle(this, title)
  }

  proto.navigationBarTitleDisplayMode = function(mode: 'automatic' | 'inline' | 'large') {
    return navigationBarTitleDisplayMode(this, mode)
  }

  proto.navigationBarHidden = function(hidden: boolean = true) {
    return navigationBarHidden(this, hidden)
  }

  proto.navigationBarItems = function(options: any) {
    return navigationBarItems(this, options)
  }

  proto.navigationBarBackButtonHidden = function(hidden: boolean = true) {
    return navigationBarBackButtonHidden(this, hidden)
  }

  proto.navigationBarBackButtonTitle = function(title: string) {
    return navigationBarBackButtonTitle(this, title)
  }

  proto.toolbarBackground = function(background: string) {
    return toolbarBackground(this, background)
  }

  proto.toolbarForegroundColor = function(color: string) {
    return toolbarForegroundColor(this, color)
  }

  proto.sheet = function(
    isPresented: Accessor<boolean> | Binding<boolean>,
    content: () => ComponentInstance,
    options?: SheetPresentationOptions
  ) {
    return sheet(this, isPresented, content, options)
  }

  proto.popover = function(
    isPresented: Accessor<boolean> | Binding<boolean>,
    arrowEdge: PopoverArrowEdge,
    content: () => ComponentInstance,
    options?: PopoverPresentationOptions
  ) {
    return popover(this, isPresented, arrowEdge, content, options)
  }
}
