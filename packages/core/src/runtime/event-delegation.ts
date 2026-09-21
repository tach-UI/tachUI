/**
 * Event Delegation System (Phase 3)
 *
 * Provides centralized event handling to reduce per-element listener overhead.
 * Instead of attaching N listeners for N elements, we attach 1 listener per event type
 * at the container level and route events to the correct handlers.
 */

type EventHandler = (event: Event) => void

interface DelegatedEventData {
  handler: EventHandler
  element: Element
}

/**
 * Events that should use delegation for performance
 * Note: Using focusin/focusout instead of focus/blur because they bubble
 */
const DELEGATABLE_EVENTS = new Set([
  'click',
  'dblclick',
  'mousedown',
  'mouseup',
  'mouseover',
  'mouseout',
  'mouseenter',
  'mouseleave',
  'focusin',   // Bubbles, unlike 'focus'
  'focusout',  // Bubbles, unlike 'blur'
  'input',
  'change',
  'submit',
  'keydown',
  'keyup',
  'keypress',
])

/**
 * Events that should be passive for scroll performance
 */
const PASSIVE_EVENTS = new Set([
  'scroll',
  'wheel',
  'touchstart',
  'touchmove',
  'touchend',
])

export class EventDelegator {
  // Map of container -> event type -> root listener
  private containerListeners = new WeakMap<Element, Map<string, EventListener>>()

  // Map of element -> event type -> handler data
  private elementHandlers = new WeakMap<Element, Map<string, DelegatedEventData>>()

  // Track number of handlers per container per event type
  private handlerCounts = new WeakMap<Element, Map<string, number>>()

  /**
   * Register an event handler with delegation
   */
  register(
    container: Element,
    element: Element,
    eventType: string,
    handler: EventHandler
  ): () => void {
    // Check if element already has a handler for this event type
    let elementMap = this.elementHandlers.get(element)
    if (elementMap && elementMap.has(eventType)) {
      // Handler already exists - unregister the old one first to prevent leaks
      this.unregister(container, element, eventType)
      // Re-read it: `unregister` drops the map from the WeakMap as soon as it
      // empties, and this binding still points at that detached map. Writing
      // the new handler into it files the handler where dispatch will never
      // look — and the count below still goes up, so the element ends up with
      // a live root listener, a count of one, and nothing to call.
      elementMap = this.elementHandlers.get(element)
    }

    // Store handler data
    if (!elementMap) {
      elementMap = new Map()
      this.elementHandlers.set(element, elementMap)
    }

    elementMap.set(eventType, { handler, element })

    // Increment handler count
    let countMap = this.handlerCounts.get(container)
    if (!countMap) {
      countMap = new Map()
      this.handlerCounts.set(container, countMap)
    }
    const currentCount = countMap.get(eventType) || 0
    countMap.set(eventType, currentCount + 1)

    // Ensure root listener exists
    this.ensureRootListener(container, eventType)

    // Return cleanup function
    return () => {
      this.unregister(container, element, eventType)
    }
  }

  /**
   * Unregister an event handler
   */
  private unregister(container: Element, element: Element, eventType: string): void {
    // Remove handler data
    const elementMap = this.elementHandlers.get(element)
    if (elementMap) {
      elementMap.delete(eventType)
      if (elementMap.size === 0) {
        this.elementHandlers.delete(element)
      }
    }

    // Decrement handler count
    const countMap = this.handlerCounts.get(container)
    if (countMap) {
      const currentCount = countMap.get(eventType) || 0
      const newCount = currentCount - 1

      if (newCount <= 0) {
        // No more handlers for this event type - remove root listener
        countMap.delete(eventType)
        this.removeRootListener(container, eventType)
      } else {
        countMap.set(eventType, newCount)
      }
    }
  }

  /**
   * Ensure root listener exists for event type on container
   */
  private ensureRootListener(container: Element, eventType: string): void {
    let listenerMap = this.containerListeners.get(container)
    if (!listenerMap) {
      listenerMap = new Map()
      this.containerListeners.set(container, listenerMap)
    }

    if (listenerMap.has(eventType)) {
      return // Already exists
    }

    // Create root listener that delegates to element handlers
    const rootListener: EventListener = (event: Event) => {
      this.handleDelegatedEvent(container, eventType, event)
    }

    // Determine if event should be passive
    const options: AddEventListenerOptions = PASSIVE_EVENTS.has(eventType)
      ? { passive: true }
      : { passive: false }

    container.addEventListener(eventType, rootListener, options)
    listenerMap.set(eventType, rootListener)
  }

  /**
   * Remove root listener for event type on container
   */
  private removeRootListener(container: Element, eventType: string): void {
    const listenerMap = this.containerListeners.get(container)
    if (!listenerMap) return

    const rootListener = listenerMap.get(eventType)
    if (rootListener) {
      container.removeEventListener(eventType, rootListener)
      listenerMap.delete(eventType)
    }
  }

  /**
   * Handle delegated event by dispatching to every registered handler between
   * the target and the container, innermost first.
   *
   * This walk stands in for the bubbling the browser would have done if each
   * handler were attached to its own element, so it does not stop at the first
   * handler it finds: a form listening for `input` has to hear a field inside
   * it even when that field registered an `input` handler of its own. A
   * handler ends the walk the same way it would end real bubbling, by calling
   * `stopPropagation()` — which is what `cancelBubble` reports.
   */
  private handleDelegatedEvent(
    container: Element,
    eventType: string,
    event: Event
  ): void {
    const target = event.target as Element | null
    if (!target) return

    // Traverse from target up to container, dispatching along the way
    let currentElement: Element | null = target

    while (currentElement && currentElement !== container) {
      const handlerData = this.elementHandlers.get(currentElement)?.get(eventType)

      if (handlerData) {
        // The handler may move or remove its own element, so the next step up
        // is read before it runs.
        const parent: Element | null = currentElement.parentElement

        this.dispatchTo(handlerData, eventType, event)

        if (event.cancelBubble) return

        currentElement = parent
        continue
      }

      currentElement = currentElement.parentElement
    }
  }

  /**
   * Run one handler with `currentTarget` reading as the element the handler
   * was registered on.
   *
   * The listener doing the work sits on the container, so without this every
   * delegated handler sees the container — the mount root — where an ordinary
   * listener would see its own element. A handler reaching for its form or
   * its parent node through `currentTarget` would get the wrong one, and
   * delegated and directly attached handlers would not agree.
   *
   * `currentTarget` lives on `Event.prototype` as an accessor and is only
   * meaningful during dispatch, so the override is an own property put on for
   * the call and removed after, leaving the event as the browser made it.
   */
  private dispatchTo(
    handlerData: DelegatedEventData,
    eventType: string,
    event: Event
  ): void {
    let overridden = false

    try {
      Object.defineProperty(event, 'currentTarget', {
        configurable: true,
        get: () => handlerData.element,
      })
      overridden = true
    } catch {
      // A non-configurable `currentTarget` is not worth failing the dispatch
      // over; the handler still runs, just without the correction.
    }

    try {
      handlerData.handler(event)
    } catch (error) {
      console.error(`Delegated event handler error for ${eventType}:`, error)
    } finally {
      if (overridden) {
        delete (event as { currentTarget?: unknown }).currentTarget
      }
    }
  }

  /**
   * Check if event type should use delegation
   */
  shouldDelegate(eventType: string): boolean {
    return DELEGATABLE_EVENTS.has(eventType)
  }

  /**
   * Check if event type should use passive listeners
   */
  shouldBePassive(eventType: string): boolean {
    return PASSIVE_EVENTS.has(eventType)
  }

  /**
   * Get metrics for debugging
   */
  getMetrics(container: Element): {
    eventTypes: string[]
    totalHandlers: number
    handlersPerType: Record<string, number>
  } {
    const countMap = this.handlerCounts.get(container)
    if (!countMap) {
      return { eventTypes: [], totalHandlers: 0, handlersPerType: {} }
    }

    const handlersPerType: Record<string, number> = {}
    let totalHandlers = 0

    countMap.forEach((count, eventType) => {
      handlersPerType[eventType] = count
      totalHandlers += count
    })

    return {
      eventTypes: Array.from(countMap.keys()),
      totalHandlers,
      handlersPerType,
    }
  }

  /**
   * Cleanup all handlers for a container
   */
  cleanupContainer(container: Element): void {
    const listenerMap = this.containerListeners.get(container)
    if (listenerMap) {
      listenerMap.forEach((listener, eventType) => {
        container.removeEventListener(eventType, listener)
      })
      this.containerListeners.delete(container)
    }

    this.handlerCounts.delete(container)
  }
}

/**
 * Global event delegator instance
 */
export const globalEventDelegator = new EventDelegator()
