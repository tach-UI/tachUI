// Test setup for @tachui/navigation
import { beforeAll, afterAll } from 'vitest'

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
