/**
 * Real DOM Integration Testing Utilities
 * 
 * Provides utilities for testing TachUI components with real DOM manipulation
 * instead of extensive mocking. This ensures tests catch real integration issues.
 */

import { afterEach, beforeEach } from 'vitest'
import type { ComponentInstance } from '@tachui/core'

export interface RealDOMTestConfig {
  rootSelector?: string
  cleanupAfterEach?: boolean
  enableResourceTracking?: boolean
}

export class RealDOMTestEnvironment {
  private rootElement: HTMLElement | null = null
  private createdElements: Set<HTMLElement> = new Set()
  private eventListeners: Array<{
    element: HTMLElement | Document | Window
    event: string
    handler: EventListener
    options?: boolean | AddEventListenerOptions
  }> = []
  private timeouts: Set<NodeJS.Timeout> = new Set()
  private intervals: Set<NodeJS.Timeout> = new Set()
  private animationFrames: Set<number> = new Set()

  constructor(private config: RealDOMTestConfig = {}) {
    this.config = {
      rootSelector: '#test-root',
      cleanupAfterEach: true,
      enableResourceTracking: true,
      ...config
    }
  }

  /**
   * Set up test environment with real DOM elements
   */
  setup(): void {
    // Create test root if it doesn't exist
    if (!document.querySelector(this.config.rootSelector!)) {
      const root = document.createElement('div')
      root.id = this.config.rootSelector!.replace('#', '')
      document.body.appendChild(root)
      this.createdElements.add(root)
    }
    
    this.rootElement = document.querySelector(this.config.rootSelector!)

    // Patch setTimeout/setInterval to track them for cleanup
    if (this.config.enableResourceTracking) {
      this.patchTimerAPIs()
      this.patchAnimationFrame()
      this.patchEventListeners()
    }
  }

  /**
   * Clean up all created DOM elements and resources
   */
  cleanup(): void {
    // Clean up DOM elements
    this.createdElements.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element)
      }
    })
    this.createdElements.clear()

    // Clear root element content
    if (this.rootElement) {
      this.rootElement.innerHTML = ''
    }

    // Clean up event listeners
    this.eventListeners.forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options)
    })
    this.eventListeners.length = 0

    // Clean up timers
    this.timeouts.forEach(timeout => clearTimeout(timeout))
    this.timeouts.clear()
    
    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals.clear()

    // Clean up animation frames
    this.animationFrames.forEach(frame => cancelAnimationFrame(frame))
    this.animationFrames.clear()

    // Restore original APIs
    this.restoreAPIs()
  }

  /**
   * Get the test root element
   */
  getRoot(): HTMLElement {
    if (!this.rootElement) {
      throw new Error('Test environment not set up. Call setup() first.')
    }
    return this.rootElement
  }

  /**
   * Create and track a DOM element
   */
  createElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    attributes?: Record<string, string>
  ): HTMLElementTagNameMap[K] {
    const element = document.createElement(tagName)
    
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value)
      })
    }

    this.createdElements.add(element)
    return element
  }

  /**
   * Wait for next DOM update cycle
   */
  async nextTick(): Promise<void> {
    return new Promise(resolve => {
      // Use both setTimeout and requestAnimationFrame to ensure
      // we wait for both JavaScript execution and DOM updates
      requestAnimationFrame(() => {
        setTimeout(resolve, 0)
      })
    })
  }

  /**
   * Wait for condition to be true with timeout
   */
  async waitFor(
    condition: () => boolean,
    options: { timeout?: number; interval?: number } = {}
  ): Promise<void> {
    const { timeout = 5000, interval = 10 } = options
    const startTime = Date.now()

    return new Promise((resolve, reject) => {
      const check = () => {
        if (condition()) {
          resolve()
          return
        }

        if (Date.now() - startTime > timeout) {
          reject(new Error(`Condition not met within ${timeout}ms`))
          return
        }

        setTimeout(check, interval)
      }

      check()
    })
  }

  /**
   * Get resource usage statistics
   */
  getResourceStats(): {
    elementCount: number
    eventListenerCount: number
    timeoutCount: number
    intervalCount: number
    animationFrameCount: number
  } {
    return {
      elementCount: this.createdElements.size,
      eventListenerCount: this.eventListeners.length,
      timeoutCount: this.timeouts.size,
      intervalCount: this.intervals.size,
      animationFrameCount: this.animationFrames.size
    }
  }

  private originalSetTimeout = global.setTimeout
  private originalSetInterval = global.setInterval
  private originalRequestAnimationFrame = global.requestAnimationFrame
  private originalAddEventListener = EventTarget.prototype.addEventListener

  private patchTimerAPIs(): void {
    // Track setTimeout calls
    global.setTimeout = ((callback: Function, delay?: number, ...args: any[]) => {
      const timeout = this.originalSetTimeout(() => {
        this.timeouts.delete(timeout)
        callback(...args)
      }, delay)
      this.timeouts.add(timeout)
      return timeout
    }) as any

    // Track setInterval calls
    global.setInterval = ((callback: Function, delay?: number, ...args: any[]) => {
      const interval = this.originalSetInterval(() => {
        callback(...args)
      }, delay)
      this.intervals.add(interval)
      return interval
    }) as any
  }

  private patchAnimationFrame(): void {
    global.requestAnimationFrame = (callback: FrameRequestCallback) => {
      const frame = this.originalRequestAnimationFrame((time) => {
        this.animationFrames.delete(frame)
        callback(time)
      })
      this.animationFrames.add(frame)
      return frame
    }
  }

  private patchEventListeners(): void {
    const self = this
    
    EventTarget.prototype.addEventListener = function(
      type: string,
      listener: EventListener,
      options?: boolean | AddEventListenerOptions
    ) {
      // Track the event listener for cleanup
      self.eventListeners.push({
        element: this as any,
        event: type,
        handler: listener,
        options
      })
      
      // Call original method
      return self.originalAddEventListener.call(this, type, listener, options)
    }
  }

  private restoreAPIs(): void {
    global.setTimeout = this.originalSetTimeout
    global.setInterval = this.originalSetInterval
    global.requestAnimationFrame = this.originalRequestAnimationFrame
    EventTarget.prototype.addEventListener = this.originalAddEventListener
  }
}

/**
 * Global DOM test utilities
 */
export const domTestUtils = {
  /**
   * Render a TachUI component to the DOM
   */
  async renderToDOM(component: ComponentInstance, selector: string = '#test-root'): Promise<void> {
    const root = document.querySelector(selector)
    if (!root) {
      throw new Error(`Root element ${selector} not found`)
    }

    // For now, we'll implement a basic renderer
    // This will be enhanced once we integrate with the actual TachUI renderer
    root.innerHTML = ''
    
    if (component && typeof component.render === 'function') {
      const rendered = component.render()
      if (Array.isArray(rendered)) {
        rendered.forEach(node => {
          if (node && typeof node === 'object' && 'tag' in node) {
            const element = this.createElementFromNode(node)
            root.appendChild(element)
          }
        })
      }
    }
  },

  /**
   * Create HTML element from TachUI node
   */
  createElementFromNode(node: any): HTMLElement {
    const element = document.createElement(node.tag || 'div')
    
    if (node.props) {
      Object.entries(node.props).forEach(([key, value]) => {
        if (key === 'class') {
          element.className = value as string
        } else if (key === 'style' && typeof value === 'object') {
          Object.assign(element.style, value)
        } else if (typeof value === 'string' || typeof value === 'number') {
          element.setAttribute(key, String(value))
        }
      })
    }

    if (node.children) {
      node.children.forEach((child: any) => {
        if (typeof child === 'string') {
          element.appendChild(document.createTextNode(child))
        } else if (child && typeof child === 'object') {
          element.appendChild(this.createElementFromNode(child))
        }
      })
    }

    return element
  },

  /**
   * Fire DOM events on elements
   */
  fireEvent: {
    click(element: HTMLElement): void {
      const event = new MouseEvent('click', { bubbles: true, cancelable: true })
      element.dispatchEvent(event)
    },

    input(element: HTMLInputElement, options: { target: { value: string } }): void {
      element.value = options.target.value
      const event = new Event('input', { bubbles: true })
      element.dispatchEvent(event)
    },

    change(element: HTMLElement, options: { target: { value: string } }): void {
      if (element instanceof HTMLInputElement) {
        element.value = options.target.value
      }
      const event = new Event('change', { bubbles: true })
      element.dispatchEvent(event)
    },

    keydown(element: HTMLElement, options: { key: string }): void {
      const event = new KeyboardEvent('keydown', { 
        key: options.key, 
        bubbles: true, 
        cancelable: true 
      })
      element.dispatchEvent(event)
    },

    focus(element: HTMLElement): void {
      element.focus()
      const event = new FocusEvent('focus', { bubbles: true })
      element.dispatchEvent(event)
    },

    blur(element: HTMLElement): void {
      element.blur()
      const event = new FocusEvent('blur', { bubbles: true })
      element.dispatchEvent(event)
    }
  },

  /**
   * Query utilities with better error messages
   */
  query: {
    get(selector: string, root: Document | HTMLElement = document): HTMLElement {
      const element = root.querySelector(selector) as HTMLElement
      if (!element) {
        throw new Error(`Element not found: ${selector}`)
      }
      return element
    },

    getAll(selector: string, root: Document | HTMLElement = document): HTMLElement[] {
      return Array.from(root.querySelectorAll(selector)) as HTMLElement[]
    },

    waitFor(
      selector: string, 
      root: Document | HTMLElement = document,
      timeout: number = 5000
    ): Promise<HTMLElement> {
      return new Promise((resolve, reject) => {
        const startTime = Date.now()
        
        const check = () => {
          const element = root.querySelector(selector) as HTMLElement
          if (element) {
            resolve(element)
            return
          }

          if (Date.now() - startTime > timeout) {
            reject(new Error(`Element not found within ${timeout}ms: ${selector}`))
            return
          }

          setTimeout(check, 10)
        }

        check()
      })
    }
  }
}

/**
 * Auto-setup for test suites that want real DOM integration
 */
export function setupRealDOMTesting(config?: RealDOMTestConfig): RealDOMTestEnvironment {
  const env = new RealDOMTestEnvironment(config)

  beforeEach(() => {
    env.setup()
  })

  if (config?.cleanupAfterEach !== false) {
    afterEach(() => {
      env.cleanup()
    })
  }

  return env
}

/**
 * Jest/Vitest matchers for DOM testing
 */
export const domMatchers = {
  toContainText(element: HTMLElement, text: string): boolean {
    return element.textContent?.includes(text) ?? false
  },

  toHaveAttribute(element: HTMLElement, attr: string, value?: string): boolean {
    if (value === undefined) {
      return element.hasAttribute(attr)
    }
    return element.getAttribute(attr) === value
  },

  toBeVisible(element: HTMLElement): boolean {
    return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length)
  },

  toHaveClass(element: HTMLElement, className: string): boolean {
    return element.classList.contains(className)
  }
}

// Extend expect with custom matchers
declare global {
  namespace Vi {
    interface AsymmetricMatchersContaining {
      toContainText(text: string): boolean
      toHaveAttribute(attr: string, value?: string): boolean
      toBeVisible(): boolean
      toHaveClass(className: string): boolean
    }
  }
}