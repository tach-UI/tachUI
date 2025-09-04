/**
 * Test Setup for Modifiers Package
 *
 * Provides mocks and setup for testing modifiers without full core dependencies
 */

import { vi } from 'vitest'

// Mock HTMLElement and DOM APIs for test environment
global.HTMLElement = class MockHTMLElement {
  style: Record<string, string> = {}
  tabIndex: number = -1
  classList: any = {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn(() => false),
    toggle: vi.fn(),
  }

  // Mock DOM methods
  setAttribute = vi.fn()
  getAttribute = vi.fn(() => null)
  removeAttribute = vi.fn()
  hasAttribute = vi.fn(() => false)
  addEventListener = vi.fn()
  removeEventListener = vi.fn()
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
  }))

  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        if (prop in target) {
          return (target as any)[prop]
        }
        return undefined
      },
      set(target, prop, value) {
        ;(target as any)[prop] = value
        return true
      },
    })
  }
} as any

// Mock BaseModifier for testing
export class MockBaseModifier<T = any> {
  readonly properties: T
  readonly type: string = 'mock'
  readonly priority: number = 50

  constructor(properties: T) {
    this.properties = properties
  }

  applyStyles(element: any, styles: Record<string, any>) {
    if (element?.style) {
      Object.assign(element.style, styles)
    }
  }

  apply(node: any, context: any): any {
    return undefined
  }

  toCSSValue(value: number | string): string {
    if (typeof value === 'number') {
      return `${value}px`
    }
    return String(value)
  }
}

// Mock Document and global DOM APIs
global.document = {
  createElement: vi.fn(() => new (global.HTMLElement as any)()),
  getElementById: vi.fn(() => null),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  activeElement: null,
  body: new (global.HTMLElement as any)(),
  head: {
    appendChild: vi.fn(),
    insertBefore: vi.fn(),
    innerHTML: '',
  } as any,
} as any

// Store original timers to avoid recursion
const originalSetTimeout = global.setTimeout
const originalClearTimeout = global.clearTimeout

// Mock global timers
global.setTimeout = vi.fn((fn, delay) => {
  return originalSetTimeout(fn, delay) as any
})
global.clearTimeout = vi.fn(id => {
  originalClearTimeout(id as any)
})

// Mock requestAnimationFrame with proper timing
global.requestAnimationFrame = vi.fn(cb => {
  const id = originalSetTimeout(() => cb(Date.now()), 16)
  return id as any
})

// Mock window object
global.window = {
  setTimeout: global.setTimeout,
  clearTimeout: global.clearTimeout,
  requestAnimationFrame: global.requestAnimationFrame,
} as any

// Setup test environment
beforeAll(() => {
  // Set NODE_ENV to test to suppress console warnings
  process.env.NODE_ENV = 'test'
})

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks()

  // Reset document state
  if (document.head) {
    document.head.innerHTML = ''
  }
  if (document.body) {
    document.body.innerHTML = ''
  }
})
