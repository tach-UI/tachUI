/**
 * Test Setup for Modifiers Package
 *
 * Provides mocks and setup for testing modifiers without full core dependencies
 */

import { vi } from 'vitest'

// Mock HTMLElement and DOM APIs for test environment
global.HTMLElement = class MockHTMLElement {
  style: Record<string, string> = {}

  constructor() {
    return new Proxy(this, {
      set(target, prop, value) {
        if (prop === 'style' || typeof prop === 'string') {
          ;(target as any)[prop] = value
        }
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

// Setup test environment
beforeAll(() => {
  // Set NODE_ENV to test to suppress console warnings
  process.env.NODE_ENV = 'test'

  // Mock any other globals that might be needed
})
