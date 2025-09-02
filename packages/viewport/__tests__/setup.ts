/**
 * Test setup for @tachui/viewport
 */

// Mock DOM APIs that might not be available in test environment
global.ResizeObserver = class ResizeObserver {
  constructor(callback: ResizeObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock screen API
Object.defineProperty(window, 'screen', {
  value: {
    width: 1920,
    height: 1080,
    availWidth: 1920,
    availHeight: 1040,
  },
  writable: true,
})

// Mock window.open for popup tests
const mockWindow = {
  close: vi.fn(),
  focus: vi.fn(),
  blur: vi.fn(),
  postMessage: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}

global.window.open = vi.fn().mockReturnValue(mockWindow)
