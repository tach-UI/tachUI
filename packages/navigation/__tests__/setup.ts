// Test setup for @tachui/navigation
import { beforeAll, afterAll } from 'vitest'

// PointerEvent polyfill for jsdom
if (typeof PointerEvent === 'undefined') {
  // @ts-expect-error - Polyfill for jsdom environment
  global.PointerEvent = class PointerEvent extends MouseEvent {
    isPrimary: boolean
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params)
      this.isPrimary = params.isPrimary ?? true
    }
  }
}

// setPointerCapture polyfill for jsdom
if (typeof Element.prototype.setPointerCapture === 'undefined') {
  Element.prototype.setPointerCapture = () => {
    // No-op in jsdom
  }
}

if (typeof Element.prototype.releasePointerCapture === 'undefined') {
  Element.prototype.releasePointerCapture = () => {
    // No-op in jsdom
  }
}

// clientWidth/clientHeight getters polyfill for jsdom
// JSDOM doesn't compute layout, so we need to read from style
// Fallback returns 0 to match jsdom's natural default behavior
Object.defineProperty(Element.prototype, 'clientWidth', {
  get() {
    const width = this.style.width
    if (width && width.endsWith('px')) {
      return parseInt(width, 10)
    }
    // Return 0 to match jsdom's natural default (not a global fallback)
    return 0
  },
})

Object.defineProperty(Element.prototype, 'clientHeight', {
  get() {
    const height = this.style.height
    if (height && height.endsWith('px')) {
      return parseInt(height, 10)
    }
    // Return 0 to match jsdom's natural default (not a global fallback)
    return 0
  },
})

// Suppress expected test console outputs
let originalConsoleError: typeof console.error
let originalConsoleWarn: typeof console.warn

beforeAll(() => {
  originalConsoleError = console.error
  originalConsoleWarn = console.warn

  // Filter out expected test error messages to reduce noise
  console.error = (...args) => {
    const message = args.join(' ')

    // Suppress known test error messages
    const suppressedPatterns = [
      '[TEST ERROR]',
      'Navigation path listener error:',
      'Coordinator with ID',
      'already exists',
    ]

    const shouldSuppress = suppressedPatterns.some(pattern =>
      message.includes(pattern)
    )

    if (!shouldSuppress) {
      originalConsoleError(...args)
    }
  }

  console.warn = (...args) => {
    const message = args.join(' ')

    // Suppress known test warning messages
    const suppressedPatterns = ['Navigation:', 'NavigationManager:']

    const shouldSuppress = suppressedPatterns.some(pattern =>
      message.includes(pattern)
    )

    if (!shouldSuppress) {
      originalConsoleWarn(...args)
    }
  }
})

// Clean up after tests
afterAll(() => {
  // Restore original console methods
  if (originalConsoleError) {
    console.error = originalConsoleError
  }
  if (originalConsoleWarn) {
    console.warn = originalConsoleWarn
  }
})
