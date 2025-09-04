/**
 * Enhanced Test Setup for Modifiers Package
 *
 * Provides improved mocks while preserving the isolated testing approach
 */

import { vi } from 'vitest'

// Enhanced HTMLElement mock with proper event handling and timers
class MockHTMLElement {
  style: Record<string, any> = {}
  tabIndex: number = -1
  classList: any
  tagName: string = 'DIV'

  // Event handling with proper event objects
  private eventListeners: Map<string, EventListenerOrEventListenerObject[]> =
    new Map()
  private timers: Set<number> = new Set()

  // DOM properties for layout calculations
  offsetWidth: number = 100
  offsetHeight: number = 100
  clientWidth: number = 100
  clientHeight: number = 100
  scrollWidth: number = 100
  scrollHeight: number = 100
  offsetLeft: number = 0
  offsetTop: number = 0

  constructor() {
    // Enhanced style object with setProperty support
    this.style = new Proxy(
      {},
      {
        get: (target: any, prop: string) => target[prop] || '',
        set: (target: any, prop: string, value: any) => {
          target[prop] = value
          return true
        },
      }
    )

    // Add proper setProperty method
    this.style.setProperty = vi.fn((property: string, value: string) => {
      this.style[property] = value
    })

    this.style.getPropertyValue = vi.fn((property: string) => {
      return this.style[property] || ''
    })

    this.style.removeProperty = vi.fn((property: string) => {
      const oldValue = this.style[property]
      delete this.style[property]
      return oldValue || ''
    })

    // Enhanced classList
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
    }
  }

  // Enhanced event handling that properly stores and calls listeners
  addEventListener = vi.fn(
    (
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ) => {
      if (!this.eventListeners.has(type)) {
        this.eventListeners.set(type, [])
      }
      this.eventListeners.get(type)!.push(listener)
    }
  )

  removeEventListener = vi.fn(
    (
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | EventListenerOptions
    ) => {
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
      listeners.forEach(listener => {
        if (typeof listener === 'function') {
          listener.call(this, event)
        } else if (listener.handleEvent) {
          listener.handleEvent.call(listener, event)
        }
      })
    }
    return true
  })

  // DOM methods with proper mocking
  setAttribute = vi.fn((name: string, value: string) => {
    ;(this as any)[name] = value
  })

  getAttribute = vi.fn((name: string) => {
    return (this as any)[name] || null
  })

  removeAttribute = vi.fn((name: string) => {
    delete (this as any)[name]
  })

  hasAttribute = vi.fn((name: string) => {
    return name in this
  })

  focus = vi.fn()
  blur = vi.fn()
  click = vi.fn()
  appendChild = vi.fn()
  removeChild = vi.fn()

  getBoundingClientRect = vi.fn(() => ({
    left: this.offsetLeft,
    top: this.offsetTop,
    right: this.offsetLeft + this.offsetWidth,
    bottom: this.offsetTop + this.offsetHeight,
    width: this.offsetWidth,
    height: this.offsetHeight,
    x: this.offsetLeft,
    y: this.offsetTop,
    toJSON: () => ({}),
  }))

  // CSS selector support
  matches = vi.fn((selector: string) => {
    // Simple implementation for common cases
    if (selector === ':focus') return false
    if (selector === ':hover') return false
    if (selector === ':active') return false
    if (selector === ':disabled') return this.hasAttribute('disabled')
    return false
  })

  querySelector = vi.fn(() => null)
  querySelectorAll = vi.fn(() => [])

  // Add contains method for DOM hierarchy
  contains = vi.fn(() => false)
}

// Set up global HTMLElement
global.HTMLElement = MockHTMLElement as any

// Enhanced Event constructor for proper event creation
global.Event = class MockEvent {
  type: string
  target: any
  currentTarget: any
  bubbles: boolean = false
  cancelable: boolean = false
  defaultPrevented: boolean = false
  composed: boolean = false
  isTrusted: boolean = false
  timeStamp: number = Date.now()

  constructor(type: string, eventInitDict?: EventInit) {
    this.type = type
    this.bubbles = eventInitDict?.bubbles || false
    this.cancelable = eventInitDict?.cancelable || false
    this.composed = eventInitDict?.composed || false
  }

  preventDefault() {
    this.defaultPrevented = true
  }

  stopPropagation() {}
  stopImmediatePropagation() {}
} as any

// Enhanced PointerEvent for touch/pointer interaction testing
global.PointerEvent = class MockPointerEvent extends global.Event {
  clientX: number = 0
  clientY: number = 0
  pageX: number = 0
  pageY: number = 0
  pointerId: number = 1
  pointerType: string = 'mouse'
  pressure: number = 1
  button: number = 0
  buttons: number = 1

  constructor(type: string, eventInitDict?: any) {
    super(type, eventInitDict)
    if (eventInitDict) {
      this.clientX = eventInitDict.clientX || 0
      this.clientY = eventInitDict.clientY || 0
      this.pageX = eventInitDict.pageX || this.clientX
      this.pageY = eventInitDict.pageY || this.clientY
      this.pointerId = eventInitDict.pointerId || 1
      this.pointerType = eventInitDict.pointerType || 'mouse'
      this.pressure = eventInitDict.pressure || 1
      this.button = eventInitDict.button || 0
      this.buttons = eventInitDict.buttons || 1
    }
  }
} as any

// MouseEvent for fallback scenarios
global.MouseEvent = class MockMouseEvent extends global.Event {
  clientX: number = 0
  clientY: number = 0
  pageX: number = 0
  pageY: number = 0
  button: number = 0
  buttons: number = 1

  constructor(type: string, eventInitDict?: any) {
    super(type, eventInitDict)
    if (eventInitDict) {
      this.clientX = eventInitDict.clientX || 0
      this.clientY = eventInitDict.clientY || 0
      this.pageX = eventInitDict.pageX || this.clientX
      this.pageY = eventInitDict.pageY || this.clientY
      this.button = eventInitDict.button || 0
      this.buttons = eventInitDict.buttons || 1
    }
  }
} as any

// TouchEvent for mobile testing
global.TouchEvent = class MockTouchEvent extends global.Event {
  touches: Touch[] = []
  targetTouches: Touch[] = []
  changedTouches: Touch[] = []

  constructor(type: string, eventInitDict?: any) {
    super(type, eventInitDict)
    if (eventInitDict) {
      this.touches = eventInitDict.touches || []
      this.targetTouches = eventInitDict.targetTouches || []
      this.changedTouches = eventInitDict.changedTouches || []
    }
  }
} as any

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
  requestAnimationFrame: vi.fn((cb: FrameRequestCallback) => {
    const id = setTimeout(() => cb(Date.now()), 16)
    return id as any
  }),
  cancelAnimationFrame: vi.fn((id: number) => {
    clearTimeout(id)
  }),
  getComputedStyle: vi.fn(() => ({})),
  innerWidth: 1024,
  innerHeight: 768,
  // Add support for pointer events
  PointerEvent: global.PointerEvent,
  MouseEvent: global.MouseEvent,
  TouchEvent: global.TouchEvent,
  Event: global.Event,
} as any

// CSS-related globals with proper error handling
global.CSSStyleSheet = class MockCSSStyleSheet {
  cssRules: any[] = []

  insertRule = vi.fn((rule: string, index?: number) => {
    // Simulate potential stylesheet errors for testing error handling
    if (rule.includes('invalid-css-for-error-test')) {
      throw new Error('Invalid CSS rule')
    }
    const insertIndex = index !== undefined ? index : this.cssRules.length
    this.cssRules.splice(insertIndex, 0, { cssText: rule })
    return insertIndex
  })

  deleteRule = vi.fn((index: number) => {
    this.cssRules.splice(index, 1)
  })
} as any

// Enhanced performance API for benchmarking tests
global.performance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(() => []),
  getEntriesByType: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
  timeOrigin: Date.now() - 1000,
} as any

// Mock requestIdleCallback for performance tests
global.requestIdleCallback = vi.fn((callback: IdleRequestCallback) => {
  const id = setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => 50,
    } as IdleDeadline)
  }, 1)
  return id as any
})

// Test environment setup
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

  // Clear all timers to ensure clean test state
  vi.clearAllTimers()

  // Reset performance marks
  if (performance.clearMarks) {
    performance.clearMarks()
  }
  if (performance.clearMeasures) {
    performance.clearMeasures()
  }
})
