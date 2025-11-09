/**
 * Direct DOM Renderer (Phase 3.1.1)
 *
 * Efficient DOM manipulation without virtual DOM overhead.
 * Provides surgical DOM updates integrated with the reactive system.
 */

import { applyModifiersToNode } from '../modifiers/registry'
import { createEffect, createRoot, isComputed, isSignal, untrack } from '../reactive'
import type { ComponentInstance, DOMNode } from './types'
import { semanticRoleManager } from './semantic-role-manager'
import { globalEventDelegator } from './event-delegation'
// Debug functionality moved to @tachui/devtools package
// Create a simple mock for backward compatibility
const debugManager = {
  isEnabled: () => false,
  logComponent: (..._args: any[]) => {},
  addDebugAttributes: (..._args: any[]) => {},
}

/**
 * Direct DOM renderer for efficient DOM manipulation
 */
type RendererMetrics = {
  created: number
  adopted: number
  removed: number
  inserted: number
  moved: number
  cacheHits: number
  cacheMisses: number
  attributeWrites: number
  attributeRemovals: number
  textUpdates: number
  modifierApplications: number
}

export class DOMRenderer {
  private nodeMap = new WeakMap<DOMNode, Element | Text | Comment>()
  private cleanupMap = new WeakMap<Element | Text | Comment, (() => void)[]>()
  private renderedNodes = new Set<DOMNode>()
  // Map each element to its delegation container
  private elementToContainer = new WeakMap<Element, Element>()
  private metrics: RendererMetrics = {
    created: 0,
    adopted: 0,
    removed: 0,
    inserted: 0,
    moved: 0,
    cacheHits: 0,
    cacheMisses: 0,
    attributeWrites: 0,
    attributeRemovals: 0,
    textUpdates: 0,
    modifierApplications: 0,
  }

  /**
   * Render a DOM node to an actual DOM element
   */
  render(
    node: DOMNode | DOMNode[],
    container?: Element
  ): Element | Text | Comment | DocumentFragment {
    if (Array.isArray(node)) {
      return this.renderFragment(node, container)
    }

    return this.renderSingle(node, container)
  }

  /**
   * Check if a DOM node has been rendered and tracked.
   */
  hasNode(node: DOMNode): boolean {
    return this.nodeMap.has(node)
  }

  /**
   * Get the rendered DOM element associated with a node.
   */
  getRenderedNode(node: DOMNode): Element | Text | Comment | undefined {
    return this.nodeMap.get(node)
  }

  /**
   * Render a single DOM node
   */
  private renderSingle(
    node: DOMNode,
    container?: Element
  ): Element | Text | Comment {
    // Track rendered nodes for cleanup
    this.renderedNodes.add(node)

    let element: Element | Text | Comment

    switch (node.type) {
      case 'element':
        element = this.createOrUpdateElement(node, container)
        break
      case 'text':
        element = this.createOrUpdateTextNode(node)
        break
      case 'comment':
        element = this.createComment(node)
        this.metrics.created++
        break
      default:
        throw new Error(`Unknown node type: ${(node as any).type}`)
    }

    // Store reference
    this.nodeMap.set(node, element)
    node.element = element

    // Track delegation container for this element
    if (element instanceof Element && container) {
      this.elementToContainer.set(element, container)
    }

    // Apply modifiers if present (only for Element nodes, not Text/Comment)
    if (element instanceof Element) {
      let modifiers: any[] = []

      // Check for modifiers directly on the node
      if (
        'modifiers' in node &&
        Array.isArray((node as any).modifiers) &&
        (node as any).modifiers.length > 0
      ) {
        modifiers = (node as any).modifiers
      }

      // Check for modifiers in component metadata
      if (
        'componentMetadata' in node &&
        (node as any).componentMetadata?.modifiers &&
        Array.isArray((node as any).componentMetadata.modifiers) &&
        (node as any).componentMetadata.modifiers.length > 0
      ) {
        modifiers = (node as any).componentMetadata.modifiers
      }

      if (modifiers.length > 0) {
        this.applyModifiersToElement(element, modifiers, node)
      }
    }

    // Set up cleanup if provided
    if (node.dispose) {
      this.addCleanup(element, node.dispose)
    }

    // Append to container if provided
    if (container) {
      this.appendNode(container, element)
    }

    return element
  }

  /**
   * Render multiple nodes as a document fragment
   */
  private renderFragment(
    nodes: DOMNode[],
    container?: Element
  ): DocumentFragment {
    const fragment = document.createDocumentFragment()

    nodes.forEach(node => {
      const element = this.renderSingle(node)
      fragment.appendChild(element)
    })

    if (container) {
      container.appendChild(fragment)
      this.metrics.inserted += nodes.length
    }

    return fragment
  }

  /**
   * Create a DOM element with props and children
   */
  private createOrUpdateElement(node: DOMNode, container?: Element): Element {
    if (!node.tag) {
      throw new Error('Element node must have a tag')
    }

    if (node.element && node.element instanceof Element) {
      const element = node.element
      // Update container mapping if container changed
      if (container) {
        this.elementToContainer.set(element, container)
      }
      this.updateProps(element, node, container)
      this.updateChildren(element, node)
      return element
    }

    const element = document.createElement(node.tag)
    this.metrics.created++

    // Track delegation container for this element
    if (container) {
      this.elementToContainer.set(element, container)
    }

    // Apply debug attributes if debug mode is enabled
    this.applyDebugAttributes(element, node)

    this.updateProps(element, node, container)
    this.updateChildren(element, node)

    return element
  }

  private updateProps(element: Element, node: DOMNode, container?: Element): void {
    const newProps = node.props || {}
    const previousProps = (node as any).__appliedProps || {}

    // Remove props that are no longer present
    Object.keys(previousProps).forEach(key => {
      if (!(key in newProps)) {
        if (key === 'key') return
        if (key === 'children') return
        if (key.startsWith('on')) {
          return
        }
        this.setElementProp(element, key, undefined)
      }
    })

    Object.entries(newProps).forEach(([key, value]) => {
      if (key === 'key' || key === 'children') return
      if (previousProps && previousProps[key] === value) {
        return
      }
      this.applyProp(element, key, value, container)
    })

    ;(node as any).__appliedProps = { ...newProps }

    if ('componentMetadata' in node && (node as any).componentMetadata) {
      const metadata = (node as any).componentMetadata
      if (metadata.overriddenTo && metadata.originalType) {
        if (node.tag) {
          try {
            semanticRoleManager.processElementNode(
              element as HTMLElement,
              node.tag,
              metadata,
              newProps?.['aria'] || undefined
            )
          } catch (error) {
            console.warn('[tachUI] Could not process semantic attributes:', error)
          }
        }
      }
    }
  }

  private updateChildren(element: Element, node: DOMNode): void {
    const previousChildren: DOMNode[] = (node as any).__renderedChildren || []
    const newChildren = node.children || []

    // Get delegation container for this element's children
    const delegationContainer = this.elementToContainer.get(element)

    const debugChildDiff =
      typeof process !== 'undefined' && process.env?.TACHUI_DEBUG_PHASE1B === '1'
    if (
      previousChildren.length === newChildren.length &&
      previousChildren.length > 0 &&
      previousChildren.every((child, index) => child === newChildren[index])
    ) {
      newChildren.forEach(child => {
        this.updateExistingNode(child)
      })
      ;(node as any).__renderedChildren = newChildren
      return
    }

    if (previousChildren.length === 0) {
      newChildren.forEach(child => {
        // Skip undefined/null children
        if (!child || child.type == null) return
        const childElement = this.renderSingle(child, delegationContainer)
        this.appendNode(element, childElement)
      })
      ;(node as any).__renderedChildren = newChildren
      return
    }

    const previousByKey = new Map<any, DOMNode>()
    const previousKeyless: DOMNode[] = []

    previousChildren.forEach(prevChild => {
      if (prevChild.key != null) {
        previousByKey.set(prevChild.key, prevChild)
      } else {
        previousKeyless.push(prevChild)
      }
    })

    const domNodes: (Element | Text | Comment | undefined)[] = Array.from({ length: newChildren.length })

    newChildren.forEach((child, index) => {
      let matched: DOMNode | undefined

      if (child.key != null) {
        matched = previousByKey.get(child.key)
        if (matched) {
          previousByKey.delete(child.key)
        }
      } else if (previousKeyless.length > 0) {
        matched = previousKeyless.shift()
      }

        if (matched) {
          this.adoptNode(matched, child)
        }

        // Ensure child is rendered using existing element when possible, pass delegation container
        const rendered = this.renderSingle(child, delegationContainer)
        domNodes[index] = rendered
    })

    if (debugChildDiff && node.tag) {
      const debugKeys = newChildren.map(child => child.key ?? null)
      const debugPrevKeys = previousChildren.map(child => child.key ?? null)
      const debugDom = domNodes.map(domNode =>
        domNode && 'getAttribute' in (domNode as any)
          ? (domNode as any).getAttribute('data-id')
          : null
      )
      console.log('[diff] state', {
        parent: node.tag,
        prev: debugPrevKeys,
        next: debugKeys,
        dom: debugDom,
      })
    }

    previousByKey.forEach(remaining => {
      this.removeNode(remaining)
    })
    previousKeyless.forEach(remaining => {
      this.removeNode(remaining)
    })

    const canReorder =
      typeof (element as any).insertBefore === 'function' &&
      typeof (element as any).appendChild === 'function'

    if (canReorder) {
      let nextSibling: Node | null = null
      for (let i = domNodes.length - 1; i >= 0; i--) {
        const domNode = domNodes[i]
        if (!domNode) continue
        this.insertNode(element, domNode, nextSibling)
        nextSibling = domNode
      }
    }

    ;(node as any).__renderedChildren = newChildren
  }

  private updateExistingNode(node: DOMNode): void {
    if (node.type === 'element' && node.element instanceof Element) {
      // Get the delegation container for this element
      const container = this.elementToContainer.get(node.element)
      this.updateProps(node.element, node, container)
      this.updateChildren(node.element, node)
    } else if (node.type === 'text' && node.element instanceof Text) {
      // Update text content if it changed
      if (node.element.textContent !== node.text) {
        node.element.textContent = node.text || ''
        this.recordTextUpdate()
      }
    }
  }

  /**
   * Apply debug attributes to DOM element if debug mode is enabled
   */
  private applyDebugAttributes(element: Element, node: DOMNode): void {
    if (!debugManager.isEnabled()) {
      return
    }

    // Extract component type and debug label from various sources
    let componentType = node.tag || 'element'
    let debugLabel: string | undefined

    // Check component metadata for more specific type and debug label
    if ('componentMetadata' in node && (node as any).componentMetadata) {
      const metadata = (node as any).componentMetadata
      if (metadata.type) {
        componentType = metadata.type
      }
    }

    // Check props for debug label
    if (node.props && 'data-tachui-label' in node.props) {
      debugLabel = node.props['data-tachui-label']
    }

    // Check direct debug label in props
    if (node.props && 'debugLabel' in node.props) {
      debugLabel = node.props.debugLabel
    }

    // Apply debug attributes using the debug manager
    debugManager.addDebugAttributes(
      element as HTMLElement,
      componentType,
      debugLabel
    )
  }

  /**
   * Create or update a text node
   */
  private createOrUpdateTextNode(node: DOMNode): Text {
    // Check if we can reuse existing text node
    if (node.element && node.element instanceof Text) {
      const textElement = node.element

      // Update text content in place if it changed
      if (textElement.textContent !== node.text) {
        textElement.textContent = node.text || ''
        this.recordTextUpdate()
      }

      // Handle reactive content update
      if (node.reactiveContent && !node.dispose) {
        const content = node.reactiveContent
        const effect = createEffect(() => {
          try {
            const newText = content()
            node.text = String(newText)

            // Check if parent element has AsHTML flag
            const parentElement = textElement.parentElement
            if (parentElement && (parentElement as any).__tachui_asHTML) {
              return
            }

            textElement.textContent = node.text
            this.recordTextUpdate()
          } catch (error) {
            console.error('createOrUpdateTextNode() reactive effect error:', error)
          }
        })

        node.dispose = () => {
          effect.dispose()
        }
      }

      return textElement
    }

    // Create new text node if none exists
    return this.createTextNode(node)
  }

  /**
   * Create a text node
   */
  private createTextNode(node: DOMNode): Text {
    const textElement = document.createTextNode(node.text || '')
    this.metrics.created++
    this.recordTextUpdate()

    // Set up reactivity if this is a reactive text node
    if (node.reactiveContent) {
      const content = node.reactiveContent

      // Create reactive effect now that we have the DOM element
      const effect = createEffect(() => {
        try {
          const newText = content()
          node.text = String(newText)

          // Check if parent element has AsHTML flag
          const parentElement = textElement.parentElement
          if (parentElement && (parentElement as any).__tachui_asHTML) {
            // Skip updating text content when AsHTML is active
            return
          }

          textElement.textContent = node.text
          this.recordTextUpdate()
        } catch (error) {
          console.error('createTextNode() reactive effect error:', error)
        }
      })

      // Store cleanup function on the node
      node.dispose = () => {
        effect.dispose()
      }
    }

    return textElement
  }

  /**
   * Create a comment node
   */
  private createComment(node: DOMNode): Comment {
    this.metrics.created++
    return document.createComment(node.text || '')
  }

  /**
   * Apply props to a DOM element with reactive updates
   */
  private applyProps(element: Element, props: Record<string, any>): void {
    Object.entries(props).forEach(([key, value]) => {
      this.applyProp(element, key, value)
    })
  }

  /**
   * Apply a single prop to an element
   */
  private applyProp(element: Element, key: string, value: any, container?: Element): void {
    // Handle special props
    if (key === 'className' || key === 'class') {
      this.applyClassName(element, value)
      return
    }

    if (key === 'style') {
      this.applyStyle(element, value)
      return
    }

    if (key.startsWith('on') && typeof value === 'function') {
      this.applyEventListener(element, key, value, container)
      return
    }

    // Handle reactive values (signals and computed)
    if (isSignal(value) || isComputed(value)) {
      // Create reactive effect to update DOM when signal changes
      const effect = createEffect(() => {
        const currentValue = value()
        this.setElementProp(element, key, currentValue)
      })

      // Add cleanup for the effect
      this.addCleanup(element, () => {
        effect.dispose()
      })
      return
    }

    // Handle regular props
    this.setElementProp(element, key, value)
  }

  /**
   * Set a property on an element
   */
  private setElementProp(element: Element, key: string, value: any): void {
    if (value == null) {
      if (element.hasAttribute(key)) {
        element.removeAttribute(key)
        this.recordAttributeRemoval()
      }
      return
    }

    // Use properties instead of attributes for form elements (faster)
    const htmlElement = element as any
    if (
      (key === 'value' || key === 'checked' || key === 'disabled') &&
      key in htmlElement
    ) {
      if (htmlElement[key] !== value) {
        htmlElement[key] = value
        this.recordAttributeWrite()
      }
      return
    }

    // Handle boolean attributes
    if (typeof value === 'boolean') {
      if (value) {
        if (!element.hasAttribute(key)) {
          element.setAttribute(key, '')
          this.recordAttributeWrite()
        }
      } else {
        if (element.hasAttribute(key)) {
          element.removeAttribute(key)
          this.recordAttributeRemoval()
        } else {
          element.removeAttribute(key)
        }
      }
      return
    }

    // Handle regular attributes - only set if changed
    const currentValue = element.getAttribute(key)
    const stringValue = String(value)
    if (currentValue !== stringValue) {
      element.setAttribute(key, stringValue)
      this.recordAttributeWrite()
    }
  }

  /**
   * Apply className with reactive updates
   */
  private applyClassName(element: Element, value: any): void {
    if (isSignal(value) || isComputed(value)) {
      // Reactive className
      const effect = createEffect(() => {
        const currentValue = value()
        const newClassName = this.normalizeClassName(currentValue)
        if (element.className !== newClassName) {
          element.className = newClassName
          this.recordAttributeWrite()
        }
      })

      // Add cleanup
      this.addCleanup(element, () => {
        effect.dispose()
      })
    } else {
      const newClassName = this.normalizeClassName(value)
      if (element.className !== newClassName) {
        element.className = newClassName
        this.recordAttributeWrite()
      }
    }
  }

  /**
   * Normalize className value
   */
  private normalizeClassName(value: any): string {
    if (Array.isArray(value)) {
      return value.filter(Boolean).join(' ')
    }

    if (typeof value === 'object' && value !== null) {
      return Object.entries(value)
        .filter(([, condition]) => Boolean(condition))
        .map(([className]) => className)
        .join(' ')
    }

    return String(value || '')
  }

  /**
   * Apply styles with reactive updates
   */
  private applyStyle(element: Element, value: any): void {
    const htmlElement = element as HTMLElement

    if (isSignal(value) || isComputed(value)) {
      // Reactive styles
      const effect = createEffect(() => {
        const currentValue = value()
        this.setElementStyles(htmlElement, currentValue)
      })

      // Add cleanup
      this.addCleanup(element, () => {
        effect.dispose()
      })
    } else {
      this.setElementStyles(htmlElement, value)
    }
  }

  /**
   * Set styles on an element
   */
  private setElementStyles(element: HTMLElement, styles: any): void {
    if (typeof styles === 'string') {
      if (element.style.cssText !== styles) {
        element.style.cssText = styles
        this.recordAttributeWrite()
      }
      return
    }

    if (typeof styles === 'object' && styles !== null) {
      // Get previous style object for comparison
      const prevStyles = (element as any).__appliedStyles || {}

      // Remove properties that are no longer present
      Object.keys(prevStyles).forEach(property => {
        if (!(property in styles)) {
          element.style.removeProperty(property.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`))
          this.recordAttributeRemoval()
        }
      })

      Object.entries(styles).forEach(([property, value]) => {
        if (isSignal(value) || isComputed(value)) {
          // Individual style property is reactive
          const effect = createEffect(() => {
            const currentValue = value()
            const kebabProperty = property.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)
            if (currentValue == null) {
              element.style.removeProperty(kebabProperty)
              this.recordAttributeRemoval()
            } else {
              const stringValue = String(currentValue)
              const currentStyleValue = element.style.getPropertyValue(kebabProperty)
              if (currentStyleValue !== stringValue) {
                element.style.setProperty(kebabProperty, stringValue)
                this.recordAttributeWrite()
              }
            }
          })

          // Add cleanup
          this.addCleanup(element, () => {
            effect.dispose()
          })
        } else {
          // Static style property - only set if changed
          const kebabProperty = property.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)
          if (value == null) {
            if (element.style.getPropertyValue(kebabProperty)) {
              element.style.removeProperty(kebabProperty)
              this.recordAttributeRemoval()
            }
          } else {
            const stringValue = String(value)
            const currentStyleValue = element.style.getPropertyValue(kebabProperty)
            if (currentStyleValue !== stringValue) {
              element.style.setProperty(kebabProperty, stringValue)
              this.recordAttributeWrite()
            }
          }
        }
      })

      // Track applied styles for next render
      ;(element as any).__appliedStyles = { ...styles }
    }
  }

  /**
   * Apply event listener (with delegation if possible)
   */
  private applyEventListener(
    element: Element,
    eventName: string,
    handler: Function,
    container?: Element
  ): void {
    let eventType = eventName.slice(2).toLowerCase() // Remove 'on' prefix

    // Map focus/blur to focusin/focusout for delegation (they bubble)
    if (eventType === 'focus') {
      eventType = 'focusin'
    } else if (eventType === 'blur') {
      eventType = 'focusout'
    }

    // Get container from parameter or lookup
    const delegationContainer = container || this.elementToContainer.get(element)

    // Use delegation if we have a container and event type supports it
    if (delegationContainer && globalEventDelegator.shouldDelegate(eventType)) {
      const cleanup = globalEventDelegator.register(
        delegationContainer,
        element,
        eventType,
        handler as (event: Event) => void
      )

      this.addCleanup(element, cleanup)
      return
    }

    // Fallback to direct attachment for non-delegatable events
    const listener = (e: Event) => {
      try {
        handler(e)
      } catch (error) {
        console.error(`Event handler error for ${eventName}:`, error)
      }
    }

    // Use passive listeners for scroll-related events
    const options: AddEventListenerOptions | undefined = globalEventDelegator.shouldBePassive(eventType)
      ? { passive: true }
      : undefined

    element.addEventListener(eventType, listener, options)

    // Add cleanup
    this.addCleanup(element, () => {
      element.removeEventListener(eventType, listener, options)
    })
  }

  /**
   * Add cleanup function for an element
   */
  private addCleanup(
    element: Element | Text | Comment,
    cleanup: () => void
  ): void {
    const existing = this.cleanupMap.get(element) || []
    existing.push(cleanup)
    this.cleanupMap.set(element, existing)
  }

  /**
   * Update an existing DOM node
   */
  updateNode(node: DOMNode, newProps?: Record<string, any>): void {
    const element = this.nodeMap.get(node)
    if (!element || typeof (element as any).setAttribute !== 'function') {
      return
    }

    if (newProps) {
      // Directly apply new props without batching to ensure immediate update
      this.applyProps(element as Element, newProps)
    }
  }

  /**
   * Remove a DOM node and run cleanup
   */
  removeNode(node: DOMNode): void {
    this.cleanupNode(node, true)
  }

  /**
   * Cleanup a node (and its descendants) and optionally remove from DOM.
   */
  private cleanupNode(node: DOMNode, removeFromDom: boolean): void {
    const element = this.nodeMap.get(node)

    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        this.cleanupNode(child, false)
      })
    }

    if (!element) {
      if (node.element !== undefined) {
        node.element = undefined
      }
      this.renderedNodes.delete(node)
      this.nodeMap.delete(node)
      return
    }

    // Run cleanup functions
    const cleanupFunctions = this.cleanupMap.get(element)
    if (cleanupFunctions) {
      cleanupFunctions.forEach(cleanup => {
        try {
          cleanup()
        } catch (error) {
          console.error('Cleanup error:', error)
        }
      })
      this.cleanupMap.delete(element)
    }

    // Remove from DOM
    if (removeFromDom && element.parentNode) {
      element.parentNode.removeChild(element)
    }

    // Clean up references
    this.nodeMap.delete(node)
    if (node.element !== undefined) {
      node.element = undefined
    }

    this.renderedNodes.delete(node)
    this.metrics.removed++
  }

  /**
   * Create reactive text content
   */
  createReactiveText(textAccessor: () => string): Text {
    const textNode = document.createTextNode('')

    createEffect(() => {
      textNode.textContent = textAccessor()
    })

    return textNode
  }

  /**
   * Create reactive element with dynamic props
   */
  createReactiveElement(
    tag: string,
    propsAccessor: () => Record<string, any>,
    children?: DOMNode[]
  ): Element {
    const element = document.createElement(tag)

    // Apply reactive props
    createEffect(() => {
      const props = propsAccessor()
      this.applyProps(element, props)
    })

    // Add children
    if (children) {
      children.forEach(child => {
        const childElement = this.renderSingle(child)
        element.appendChild(childElement)
      })
    }

    return element
  }

  /**
   * Apply modifiers to a DOM element
   */
  private applyModifiersToElement(
    element: Element,
    modifiers: any[],
    node: any
  ): void {
    try {
      if (modifiers.length > 0) {
        this.recordModifierApplications(modifiers.length)
      }
      // Extract component instance from node if available
      const componentInstance =
        node.componentInstance ||
        (node.componentMetadata && node.componentMetadata.componentInstance) ||
        (node._originalComponent) || // Use original component if available
        node



      // Apply modifiers with batching enabled for better performance
      applyModifiersToNode(
        node,
        modifiers,
        {
          element: element,
          componentId: (node as any).componentId || 'unknown',
          phase: 'creation',
          componentInstance: componentInstance, // Pass the component instance
        },
        {
          batch: true, // Enable batched modifier application
        }
      )
    } catch (error) {
      console.error('Failed to apply modifiers to element:', error)
    }
  }

  /**
   * Adopt an existing DOM mapping from one node to another.
   */
  adoptNode(oldNode: DOMNode, newNode: DOMNode): void {
    const element = this.nodeMap.get(oldNode)
    if (!element) return

    this.nodeMap.set(newNode, element)
    this.nodeMap.delete(oldNode)
    this.renderedNodes.delete(oldNode)
    this.renderedNodes.add(newNode)

    newNode.element = element
    if (oldNode.dispose) {
      newNode.dispose = oldNode.dispose
    }

    if ((oldNode as any).__renderedChildren) {
      (newNode as any).__renderedChildren = (oldNode as any).__renderedChildren
    }

    if ((oldNode as any).__appliedProps) {
      (newNode as any).__appliedProps = (oldNode as any).__appliedProps
    }

    this.metrics.adopted++
  }

  /**
   * Cleanup all tracked elements
   */
  cleanup(): void {
    // Call dispose on all rendered nodes
    for (const node of this.renderedNodes) {
      if (node.dispose && typeof node.dispose === 'function') {
        try {
          node.dispose()
        } catch (error) {
          console.error('Cleanup error:', error)
        }
      }
    }

    // Clear all tracking
    this.renderedNodes.clear()
    this.nodeMap = new WeakMap()
    this.cleanupMap = new WeakMap()
    this.resetMetrics()
  }

  resetMetrics(): void {
    this.metrics = {
      created: 0,
      adopted: 0,
      removed: 0,
      inserted: 0,
      moved: 0,
      cacheHits: 0,
      cacheMisses: 0,
      attributeWrites: 0,
      attributeRemovals: 0,
      textUpdates: 0,
      modifierApplications: 0,
    }
  }

  getMetrics(): RendererMetrics {
    return { ...this.metrics }
  }

  recordCacheHit(): void {
    this.metrics.cacheHits++
  }

  recordCacheMiss(): void {
    this.metrics.cacheMisses++
  }

  insertNode(container: Element, node: Element | Text | Comment, nextSibling: Node | null): void {
    const debugChildDiff =
      typeof process !== 'undefined' && process.env?.TACHUI_DEBUG_PHASE1B === '1'
    if (node.parentNode !== container) {
      if (debugChildDiff) {
        console.log('[diff] insertNode append', {
          tag: 'tagName' in (node as any) ? (node as any).tagName : 'text',
          before:
            nextSibling && 'getAttribute' in (nextSibling as any)
              ? (nextSibling as any).getAttribute('data-id')
              : null,
        })
      }
      container.insertBefore(node, nextSibling)
      this.metrics.inserted++
    } else if (node.nextSibling !== nextSibling) {
      if (debugChildDiff) {
        console.log('[diff] insertNode move', {
          tag: 'tagName' in (node as any) ? (node as any).tagName : 'text',
          before:
            nextSibling && 'getAttribute' in (nextSibling as any)
              ? (nextSibling as any).getAttribute('data-id')
              : null,
        })
      }
      container.insertBefore(node, nextSibling)
      this.metrics.moved++
    }
  }

  appendNode(container: Element, node: Element | Text | Comment): void {
    if (node.parentNode !== container) {
      container.appendChild(node)
      this.metrics.inserted++
    }
  }

  private recordAttributeWrite(): void {
    this.metrics.attributeWrites++
  }

  private recordAttributeRemoval(): void {
    this.metrics.attributeRemovals++
  }

  private recordTextUpdate(): void {
    this.metrics.textUpdates++
  }

  private recordModifierApplications(count: number): void {
    this.metrics.modifierApplications += count
  }
}

/**
 * Global renderer instance
 */
const globalRenderer = new DOMRenderer()

export type RendererMetricsSnapshot = RendererMetrics

export function resetRendererMetrics(): void {
  globalRenderer.resetMetrics()
}

export function getRendererMetrics(): RendererMetricsSnapshot {
  return globalRenderer.getMetrics()
}

/**
 * Render a component instance to DOM
 */
export function renderComponent(
  instance: ComponentInstance,
  container: Element
): () => void {
  return createRoot(() => {
    let currentNodes: DOMNode[] = []
    // Key-based element cache for structural node reuse across renders
    const keyToNodeCache = new Map<unknown, DOMNode>()

    // Helper to recursively populate node.element from cache
    const populateFromCache = (node: DOMNode): void => {
      if (node.key != null) {
        const cached = keyToNodeCache.get(node.key)
        if (cached && cached.type === node.type && cached.tag === node.tag && cached.element) {
          // Transfer the DOM element reference to the new node
          node.element = cached.element
          // Also transfer internal state for reconciliation
          if ((cached as any).__appliedProps) {
            (node as any).__appliedProps = (cached as any).__appliedProps
          }
          if ((cached as any).__renderedChildren) {
            (node as any).__renderedChildren = (cached as any).__renderedChildren
          }
          globalRenderer.recordCacheHit()
        } else {
          globalRenderer.recordCacheMiss()
        }
      }
      // Recursively process children
      if (node.children) {
        node.children.forEach(populateFromCache)
      }
    }

    // Create reactive effect for component re-rendering
    const effect = createEffect(() => {
      const renderResult = instance.render()
      const nodes = Array.isArray(renderResult) ? renderResult : [renderResult]

      // Pre-populate node.element from key cache BEFORE reconciliation
      // This allows createOrUpdateElement() to see existing DOM elements and reuse them
      nodes.forEach(populateFromCache)

      const removalSet = new Set(currentNodes)
      const adoptedByIndex = new Set<DOMNode>()
      const adoptedOldNodes = new Set<DOMNode>()
      const minLength = Math.min(currentNodes.length, nodes.length)

      for (let i = 0; i < minLength; i++) {
        const oldNode = currentNodes[i]
        const newNode = nodes[i]
        if (
          oldNode &&
          newNode &&
          oldNode.type === newNode.type &&
          oldNode.tag === newNode.tag &&
          (oldNode.key === newNode.key || (oldNode.key == null && newNode.key == null))
        ) {
          globalRenderer.adoptNode(oldNode, newNode)
          adoptedByIndex.add(newNode)
          adoptedOldNodes.add(oldNode)
          removalSet.delete(oldNode)
        }
      }

      // Update key cache with current nodes
      currentNodes.forEach(node => {
        if (node.key != null) {
          keyToNodeCache.set(node.key, node)
        }
      })

      const currentKeyMap = new Map<unknown, DOMNode>()
      currentNodes.forEach(node => {
        if (node.key != null && !adoptedOldNodes.has(node)) {
          currentKeyMap.set(node.key, node)
        }
      })

      const domNodes = nodes.map(node => {
        if (adoptedByIndex.has(node)) {
          // Update the adopted node to reconcile children - pass container for delegation
          globalRenderer.render(node, container)
          return globalRenderer.getRenderedNode(node)
        }

        // Check key cache first for structural node reuse
        if (node.key != null) {
          const cached = keyToNodeCache.get(node.key)
          if (cached && cached.type === node.type && cached.tag === node.tag) {
            // Cache hit - reuse existing DOM element
            globalRenderer.recordCacheHit()
            removalSet.delete(cached)
            currentKeyMap.delete(node.key)
            keyToNodeCache.set(node.key, node) // Update cache with new node
            globalRenderer.adoptNode(cached, node)
            // Update the node to reconcile children - pass container for delegation
            globalRenderer.render(node, container)
            return globalRenderer.getRenderedNode(node)
          } else {
            globalRenderer.recordCacheMiss()
          }
        }

        if (node.key != null) {
          const existing = currentKeyMap.get(node.key)
          if (existing) {
            currentKeyMap.delete(node.key)
            removalSet.delete(existing)
            globalRenderer.adoptNode(existing, node)
            keyToNodeCache.set(node.key, node) // Cache for next render
            // Update the node to reconcile children - pass container for delegation
            globalRenderer.render(node, container)
            return globalRenderer.getRenderedNode(node)
          }
        }

        if (node.key != null) {
          // Attempt to reuse a node that was removed earlier but matches by key.
          for (const candidate of removalSet) {
            if (candidate.key === node.key) {
              removalSet.delete(candidate)
              globalRenderer.adoptNode(candidate, node)
              // Update the node to reconcile children - pass container for delegation
              globalRenderer.render(node, container)
              break
            }
          }
        }

        if (!globalRenderer.hasNode(node)) {
          for (const candidate of removalSet) {
            if (
              candidate.type === node.type &&
              candidate.tag === node.tag &&
              candidate.key == null &&
              node.key == null
            ) {
              removalSet.delete(candidate)
              globalRenderer.adoptNode(candidate, node)
              // Update the node to reconcile children - pass container for delegation
              globalRenderer.render(node, container)
              break
            }
          }
        }

        if (!globalRenderer.hasNode(node)) {
          // Render with container for delegation
          globalRenderer.render(node, container)
          // Cache newly rendered node by key for future renders
          if (node.key != null) {
            keyToNodeCache.set(node.key, node)
          }
        }
        return globalRenderer.getRenderedNode(node)
      })

      removalSet.forEach(node => {
        globalRenderer.removeNode(node)
        // Remove from key cache when node is removed
        if (node.key != null) {
          keyToNodeCache.delete(node.key)
        }
      })

      const canReorder =
        typeof (container as any).insertBefore === 'function' &&
        typeof (container as any).appendChild === 'function'

      if (canReorder) {
        let nextSibling: Node | null = null
        for (let i = domNodes.length - 1; i >= 0; i--) {
          const domNode = domNodes[i]
          if (!domNode) continue
          globalRenderer.insertNode(container, domNode, nextSibling)
          nextSibling = domNode
        }
      } else {
        domNodes.forEach(domNode => {
          if (domNode && domNode.parentNode !== container) {
            globalRenderer.appendNode(container, domNode)
          }
        })
      }

      // Update key cache with all rendered nodes for next render
      const updateCache = (node: DOMNode): void => {
        if (node.key != null && node.element) {
          keyToNodeCache.set(node.key, node)
        }
        if (node.children) {
          node.children.forEach(updateCache)
        }
      }
      nodes.forEach(updateCache)

      currentNodes = nodes
    })

    // Return cleanup function
    return () => {
      effect.dispose()
      currentNodes.forEach(node => {
        globalRenderer.removeNode(node)
      })
      // Clear key cache on component unmount
      keyToNodeCache.clear()
      // Cleanup event delegation for this container
      globalEventDelegator.cleanupContainer(container)
    }
  })
}

/**
 * Create a DOM node helper
 */
export function h(
  tag: string,
  props?: Record<string, any> | null,
  ...children: (DOMNode | string | number)[]
): DOMNode {
  // Normalize children
  const normalizedChildren: DOMNode[] = children
    .flat()
    .filter(child => child != null)
    .map(child => {
      if (typeof child === 'string' || typeof child === 'number') {
        return { type: 'text', text: String(child) } as DOMNode
      }
      return child as DOMNode
    })

  const node: DOMNode = {
    type: 'element',
    tag,
    props: props || {},
    children: normalizedChildren,
    key: props?.key ?? undefined,
  }

  // Extract componentMetadata from props and store it on the node
  if (props && 'componentMetadata' in props) {
    ;(node as any).componentMetadata = props.componentMetadata
  }

  return node
}

/**
 * Create a text node helper
 */
export function text(content: string | (() => string)): DOMNode {
  if (
    isSignal(content) ||
    isComputed(content) ||
    typeof content === 'function'
  ) {
    // Reactive text content
    const textNode: DOMNode = {
      type: 'text',
      text: '',
      reactiveContent: content, // Store the reactive content function
    }

    // Store the initial value immediately to establish tracking
    // Use untrack to prevent subscribing parent computation during initialization
    const initialText = untrack(() => content())
    textNode.text = String(initialText)

    // Create reactive effect for updating text content
    const effect = createEffect(() => {
      const newText = content()
      textNode.text = String(newText)

      // Update DOM element if it exists
      if (textNode.element && 'textContent' in textNode.element) {
        textNode.element.textContent = String(newText)
      }
    })

    textNode.dispose = effect.dispose.bind(effect)

    return textNode
  }

  return {
    type: 'text',
    text: content,
  }
}
