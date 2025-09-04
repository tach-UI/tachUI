// Test setup for @tachui/devtools
import { JSDOM } from 'jsdom'

// Mock DOM environment for tests
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
  resources: 'usable',
})

// Set up global DOM
global.window = dom.window as any
global.document = dom.window.document
global.navigator = dom.window.navigator
global.HTMLElement = dom.window.HTMLElement
global.HTMLDivElement = dom.window.HTMLDivElement
global.HTMLButtonElement = dom.window.HTMLButtonElement

// Mock import.meta.env for tests
global.import = {
  meta: {
    env: {
      DEV: true,
      PROD: false,
      NODE_ENV: 'development',
    },
  },
} as any

// Suppress expected test console outputs
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

// Filter out expected test error messages to reduce noise
console.error = (...args) => {
  const message = args.join(' ')

  // Suppress known test error messages
  const suppressedPatterns = [
    '[TEST ERROR]',
    'TachUI Error:',
    'Navigation path listener error:',
    'Coordinator with ID',
    'Unknown validation rule:',
    'Unknown built-in validation rule:',
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
  const suppressedPatterns = [
    'PositionModifier:',
    'ZIndexModifier:',
    'OffsetModifier:',
    'ScaleEffectModifier:',
    'FixedSizeModifier:',
  ]

  const shouldSuppress = suppressedPatterns.some(pattern =>
    message.includes(pattern)
  )

  if (!shouldSuppress) {
    originalConsoleWarn(...args)
  }
}

// Clean up after tests
afterAll(() => {
  // Restore original console methods
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
  dom.window.close()
})
