import { beforeAll, beforeEach } from 'vitest'

// Set up jsdom environment for testing
beforeAll(() => {
  // Mock matchMedia for responsive tests
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  })

  // Mock ResizeObserver for container queries
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

beforeEach(() => {
  // Reset any global state before each test
  if (document.head) {
    document.head.innerHTML = ''
  }
  if (document.body) {
    document.body.innerHTML = ''
  }
})
