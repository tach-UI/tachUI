/**
 * Minimal Test Setup for Modifiers Package
 *
 * Provides only essential DOM mocks while using real core dependencies
 */

import { vi } from 'vitest'

// Enhanced HTMLElement mock that supports more real browser behavior
class MockHTMLElement {
  style: CSSStyleDeclaration
  tabIndex: number = -1
  classList: DOMTokenList
  tagName: string = 'DIV'

  // Event handling
  private eventListeners: Map<string, ((event: Event) => void)[]> = new Map()

  // DOM properties
  offsetWidth: number = 100
  offsetHeight: number = 100
  clientWidth: number = 100
  clientHeight: number = 100
  scrollWidth: number = 100
  scrollHeight: number = 100

  constructor() {
    // Create a proper CSSStyleDeclaration-like object
    this.style = new Proxy({} as any, {
      get: (target, prop) => target[prop] || '',
      set: (target, prop, value) => {
        target[prop] = value
        return true
      },
    }) as CSSStyleDeclaration

    // Add setProperty method to style
    this.style.setProperty = vi.fn((property: string, value: string) => {
      ;(this.style as any)[property] = value
    })

    this.style.getPropertyValue = vi.fn((property: string) => {
      return (this.style as any)[property] || ''
    })

    // Create classList mock
    const classes = new Set<string>()
    this.classList = {
      add: vi.fn((...tokens: string[]) =>
        tokens.forEach(token => classes.add(token))
      ),
      remove: vi.fn((...tokens: string[]) =>
        tokens.forEach(token => classes.delete(token))
      ),
      contains: vi.fn((token: string) => classes.has(token)),
      toggle: vi.fn((token: string) => {
        if (classes.has(token)) {
          classes.delete(token)
          return false
        } else {
          classes.add(token)
          return true
        }
      }),
      replace: vi.fn((oldToken: string, newToken: string) => {
        if (classes.has(oldToken)) {
          classes.delete(oldToken)
          classes.add(newToken)
          return true
        }
        return false
      }),
      value: '',
      length: 0,
      item: vi.fn(),
      forEach: vi.fn(),
      entries: vi.fn(),
      keys: vi.fn(),
      values: vi.fn(),
      [Symbol.iterator]: vi.fn(),
    } as any
  }

  // Enhanced event handling
  addEventListener = vi.fn((type: string, listener: (event: Event) => void) => {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, [])
    }
    this.eventListeners.get(type)!.push(listener)
  })

  removeEventListener = vi.fn(
    (type: string, listener: (event: Event) => void) => {
      const listeners = this.eventListeners.get(type)
      if (listeners) {
        const index = listeners.indexOf(listener)
        if (index > -1) {
          listeners.splice(index, 1)
        }
      }
    }
  )

  dispatchEvent = vi.fn((event: Event) => {
    const listeners = this.eventListeners.get(event.type)
    if (listeners) {
      listeners.forEach(listener => listener(event))
    }
    return true
  })

  // DOM methods
  setAttribute = vi.fn()
  getAttribute = vi.fn(() => null)
  removeAttribute = vi.fn()
  hasAttribute = vi.fn(() => false)
  focus = vi.fn()
  blur = vi.fn()
  click = vi.fn()
  appendChild = vi.fn()
  removeChild = vi.fn()

  getBoundingClientRect = vi.fn(() => ({
    left: 0,
    top: 0,
    right: 100,
    bottom: 100,
    width: 100,
    height: 100,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  }))

  // Add matches method for CSS selectors
  matches = vi.fn(() => false)

  // Add querySelector methods
  querySelector = vi.fn(() => null)
  querySelectorAll = vi.fn(() => [])
}

// Set up global HTMLElement
global.HTMLElement = MockHTMLElement as any

// Enhanced Document mock
const mockHead = new MockHTMLElement()
const mockBody = new MockHTMLElement()

global.document = {
  createElement: vi.fn((tagName: string) => {
    const element = new MockHTMLElement()
    element.tagName = tagName.toUpperCase()
    return element
  }),
  getElementById: vi.fn(() => null),
  querySelector: vi.fn(() => null),
  querySelectorAll: vi.fn(() => []),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  activeElement: null,
  body: mockBody,
  head: mockHead,
  createTextNode: vi.fn((text: string) => ({ textContent: text, nodeType: 3 })),
  createDocumentFragment: vi.fn(() => ({
    appendChild: vi.fn(),
    childNodes: [],
  })),
} as any

// Enhanced Window mock with proper timer handling
global.window = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  setTimeout: global.setTimeout,
  clearTimeout: global.clearTimeout,
  requestAnimationFrame: vi.fn((cb: (time: number) => void) => {
    const id = setTimeout(() => cb(Date.now()), 16)
    return id as any
  }),
  cancelAnimationFrame: vi.fn((id: number) => {
    clearTimeout(id)
  }),
  getComputedStyle: vi.fn(() => ({})),
  innerWidth: 1024,
  innerHeight: 768,
} as any

// CSS-related globals
global.CSSStyleSheet = class {
  insertRule = vi.fn()
  deleteRule = vi.fn()
  cssRules = []
} as any

// Mock performance API
global.performance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(() => []),
  getEntriesByType: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
} as any

// Setup test environment
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks()

  // Reset document state
  if (document.head) {
    ;(document.head as any).innerHTML = ''
  }
  if (document.body) {
    ;(document.body as any).innerHTML = ''
  }

  // Reset timers
  vi.clearAllTimers()
})
