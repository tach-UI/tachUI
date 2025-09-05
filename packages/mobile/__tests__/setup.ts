/**
 * Test Setup for Mobile Patterns Package
 *
 * Configures test environment for mobile-patterns components with full TachUI runtime
 */

import { beforeAll, afterAll, vi } from 'vitest'
import {
  mountComponentTree,
  unmountComponent,
  createSignal,
  createEffect,
} from '@tachui/core'
import { useLifecycle, AnimationManager, FocusManager } from '@tachui/core'

// Mock DOM APIs
const mockElement = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  setAttribute: vi.fn(),
  getAttribute: vi.fn(),
  focus: vi.fn(),
  blur: vi.fn(),
  click: vi.fn(),
  style: {
    setProperty: vi.fn(),
    removeProperty: vi.fn(),
  },
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn(),
    toggle: vi.fn(),
  },
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(() => []),
  appendChild: vi.fn(),
  removeChild: vi.fn(),
  insertBefore: vi.fn(),
  textContent: '',
  innerHTML: '',
  getBoundingClientRect: vi.fn(() => ({
    top: 0,
    left: 0,
    width: 100,
    height: 100,
    right: 100,
    bottom: 100,
  })),
  dispatchEvent: vi.fn(),
  contains: vi.fn(),
  parentElement: null,
  children: [],
  firstChild: null,
  lastChild: null,
  nextSibling: null,
  previousSibling: null,
  ownerDocument: null,
}

// Mock window APIs
const mockWindow = {
  innerWidth: 1024,
  innerHeight: 768,
  setTimeout: vi.fn(fn => {
    fn()
    return 1
  }),
  clearTimeout: vi.fn(),
  requestAnimationFrame: vi.fn(fn => {
    fn()
    return 1
  }),
  cancelAnimationFrame: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  getComputedStyle: vi.fn(() => ({
    getPropertyValue: vi.fn(),
    setProperty: vi.fn(),
  })),
}

// Mock document APIs
const mockDocument = {
  createElement: vi.fn(() => ({ ...mockElement })),
  createTextNode: vi.fn(() => ({ ...mockElement })),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(event => {
    // Mock successful event dispatch
    return true
  }),
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(() => []),
  getElementById: vi.fn(),
  getElementsByClassName: vi.fn(() => []),
  getElementsByTagName: vi.fn(() => []),
  body: { ...mockElement },
  head: { ...mockElement },
  documentElement: { ...mockElement },
  activeElement: { ...mockElement },
  hasFocus: vi.fn(() => true),
  createEvent: vi.fn(() => ({
    initEvent: vi.fn(),
  })),
}

// Set up global test environment with TachUI runtime
beforeAll(() => {
  // Set up real DOM environment for testing
  Object.defineProperty(global, 'window', {
    value: {
      ...mockWindow,
      // Add any window-specific properties needed for TachUI
      requestAnimationFrame: vi.fn(fn => setTimeout(fn, 16)),
      cancelAnimationFrame: vi.fn(),
      getComputedStyle: vi.fn(() => ({
        getPropertyValue: vi.fn(),
      })),
    },
    writable: true,
  })

  // Set up real document with DOM capabilities
  Object.defineProperty(global, 'document', {
    value: {
      ...mockDocument,
      // Add DOM methods that TachUI uses
      createElement: vi.fn((tagName: string) => {
        const element = { ...mockElement }
        element.tagName = tagName.toUpperCase()
        element.nodeName = tagName.toUpperCase()
        return element
      }),
      createTextNode: vi.fn((text: string) => ({
        ...mockElement,
        textContent: text,
        nodeType: 3, // TEXT_NODE
      })),
      dispatchEvent: vi.fn(event => {
        // Mock successful event dispatch with proper return value
        return true
      }),
      querySelector: vi.fn(),
      querySelectorAll: vi.fn(() => []),
      body: { ...mockElement },
      head: { ...mockElement },
      documentElement: { ...mockElement },
    },
    writable: true,
  })

  // Set up HTMLElement constructor
  Object.defineProperty(global, 'HTMLElement', {
    value: class MockHTMLElement {
      constructor() {
        return { ...mockElement }
      }
    },
    writable: true,
  })

  // Set up Event constructors
  Object.defineProperty(global, 'Event', {
    value: class MockEvent {
      constructor(type: string) {
        return {
          type,
          target: { ...mockElement },
          currentTarget: { ...mockElement },
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          stopImmediatePropagation: vi.fn(),
        }
      }
    },
    writable: true,
  })

  // Set up specific event constructors
  Object.defineProperty(global, 'KeyboardEvent', {
    value: class MockKeyboardEvent {
      constructor(type: string, options: any = {}) {
        return {
          type,
          key: options.key || '',
          code: options.code || '',
          ctrlKey: options.ctrlKey || false,
          shiftKey: options.shiftKey || false,
          altKey: options.altKey || false,
          metaKey: options.metaKey || false,
          target: { ...mockElement },
          currentTarget: { ...mockElement },
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
        }
      }
    },
    writable: true,
  })

  Object.defineProperty(global, 'MouseEvent', {
    value: class MockMouseEvent {
      constructor(type: string, options: any = {}) {
        return {
          type,
          clientX: options.clientX || 0,
          clientY: options.clientY || 0,
          target: { ...mockElement },
          currentTarget: { ...mockElement },
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
        }
      }
    },
    writable: true,
  })

  Object.defineProperty(global, 'TouchEvent', {
    value: class MockTouchEvent {
      constructor(type: string, options: any = {}) {
        return {
          type,
          touches: options.touches || [],
          changedTouches: options.changedTouches || [],
          target: { ...mockElement },
          currentTarget: { ...mockElement },
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
        }
      }
    },
    writable: true,
  })

  // Mock console methods to reduce noise in tests
  const originalConsole = global.console
  global.console = {
    ...originalConsole,
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
  }
})

afterAll(() => {
  // Restore original console
  vi.restoreAllMocks()
})

// Test utilities for TachUI runtime testing
export const createTestContainer = () => {
  const container = document.createElement('div')
  container.id = 'test-container'
  document.body.appendChild(container)
  return container
}

export const cleanupTestContainer = (container: HTMLElement) => {
  if (container && container.parentNode) {
    container.parentNode.removeChild(container)
  }
}

export const mountTestComponent = async (
  component: any,
  container: HTMLElement
) => {
  try {
    // Use TachUI's mountComponentTree for proper component mounting
    mountComponentTree(component, container, true)
    return container
  } catch (error) {
    console.error('Failed to mount test component:', error)
    throw error
  }
}

export const unmountTestComponent = async (container: HTMLElement) => {
  try {
    // Use TachUI's unmount for proper cleanup
    await unmountComponent(container)
  } catch (error) {
    console.error('Failed to unmount test component:', error)
    throw error
  }
}

export const createTestSignal = <T>(initialValue: T) => {
  return createSignal(initialValue)
}

export const waitForEffects = () =>
  new Promise(resolve => setTimeout(resolve, 0))

export const simulateEvent = (
  element: any,
  eventType: string,
  options: any = {}
) => {
  const event = new (global as any)[eventType](eventType, options)
  element.dispatchEvent(event)
  return event
}

export const findButtonInComponent = (
  container: HTMLElement,
  buttonText: string
) => {
  const buttons = container.querySelectorAll('button')
  return Array.from(buttons).find(button =>
    button.textContent?.includes(buttonText)
  )
}

export const clickButton = (button: HTMLElement) => {
  const clickEvent = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
  })
  button.dispatchEvent(clickEvent)
}

// Test utilities
export const createMockElement = (tagName: string = 'div') => ({
  ...mockElement,
  tagName: tagName.toUpperCase(),
  nodeType: 1,
  nodeName: tagName.toUpperCase(),
})

export const createMockEvent = (type: string, options: any = {}) => {
  return new (global as any)[
    type === 'keydown' ? 'KeyboardEvent' : 'MouseEvent'
  ](type, options)
}

export const waitForNextTick = () =>
  new Promise(resolve => setTimeout(resolve, 0))

export const mockSignal = <T>(initialValue: T) => {
  let value = initialValue
  const signal = () => value
  signal[1] = (newValue: T) => {
    value = newValue
  }
  return signal as [() => T, (value: T) => void]
}
