// Global test setup for Vitest - Enhanced for Real Integration Testing
import { vi, expect } from 'vitest'
import { domMatchers } from './real-dom-integration'

// Set NODE_ENV to test to mute console outputs during testing
process.env.NODE_ENV = 'test'

// Real DOM Testing Enhancement: Minimize mocking for real integration tests
// Only mock APIs that are truly not available in jsdom or are external services

// Mock only truly unavailable APIs in jsdom
global.ResizeObserver = global.ResizeObserver || vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

global.IntersectionObserver = global.IntersectionObserver || vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Enhanced Performance API - keep real implementation when possible
global.performance = global.performance || {
  now: () => Date.now(),
  mark: vi.fn(),
  measure: vi.fn(),
  // Add memory monitoring for memory leak tests
  memory: global.performance?.memory || {
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0
  }
}

// WeakRef/FinalizationRegistry polyfill for older Node versions
if (typeof WeakRef === 'undefined') {
  global.WeakRef = class WeakRefPolyfill<T> {
    constructor(private target: T) {}
    deref(): T | undefined {
      return this.target
    }
  } as any
}

if (typeof FinalizationRegistry === 'undefined') {
  global.FinalizationRegistry = class FinalizationRegistryPolyfill {
    constructor(private cleanup: (heldValue: any) => void) {}
    register(_target: object, _heldValue: any, _unregisterToken?: object): void {}
    unregister(_unregisterToken: object): boolean {
      return true
    }
  } as any
}

// Memory leak testing: Enable garbage collection in tests if available
if (typeof global.gc === 'function') {
  // GC is available, good for memory testing
} else {
  // Provide a no-op gc function to prevent errors
  global.gc = () => {}
}

// Navigator API enhancement for real browser API testing
global.navigator = global.navigator || {
  userAgent: 'test-agent',
  vibrate: vi.fn(),
  geolocation: {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn()
  },
  mediaDevices: {
    getUserMedia: vi.fn()
  }
} as any

// Extend expect with custom DOM matchers
expect.extend(domMatchers)

// Set up better error reporting for integration tests
const originalConsoleError = console.error
console.error = (...args) => {
  // In test environment, make console.error more visible
  if (process.env.NODE_ENV === 'test') {
    originalConsoleError('[TEST ERROR]', ...args)
  } else {
    originalConsoleError(...args)
  }
}

// Global cleanup tracking for better test isolation
const originalSetTimeout = global.setTimeout
const originalSetInterval = global.setInterval
const pendingTimeouts = new Set<NodeJS.Timeout>()
const pendingIntervals = new Set<NodeJS.Timeout>()

global.setTimeout = ((...args) => {
  const timeout = originalSetTimeout(...args)
  pendingTimeouts.add(timeout)
  return timeout
}) as any

global.setInterval = ((...args) => {
  const interval = originalSetInterval(...args)
  pendingIntervals.add(interval)
  return interval
}) as any

// Enhanced clearTimeout/clearInterval to track cleanup
const originalClearTimeout = global.clearTimeout
const originalClearInterval = global.clearInterval

global.clearTimeout = (timeout) => {
  pendingTimeouts.delete(timeout)
  return originalClearTimeout(timeout)
}

global.clearInterval = (interval) => {
  pendingIntervals.delete(interval)
  return originalClearInterval(interval)
}

// Export cleanup utility for test isolation
export function cleanupPendingTimers() {
  pendingTimeouts.forEach(timeout => clearTimeout(timeout))
  pendingIntervals.forEach(interval => clearInterval(interval))
  pendingTimeouts.clear()
  pendingIntervals.clear()
}
