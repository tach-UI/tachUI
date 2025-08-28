/**
 * Test setup for TachUI Symbols
 */

import { vi, beforeEach } from 'vitest'
import { IconSetRegistry } from '../src/icon-sets/registry'
import { LucideIconSet } from '../src/icon-sets/lucide'
import { stderrSuppressor } from './utils/stderr-suppressor'

// Suppress expected error messages during testing
const originalConsoleError = console.error
const originalConsoleWarn = console.warn
const originalStderrWrite = process.stderr.write

// List of expected error patterns that should be suppressed
const expectedErrorPatterns = [
  /Failed to load icon/,
  /Cannot find package 'lucide\/dist\/esm\/icons\//,
  /ERR_MODULE_NOT_FOUND/,
  /Icon set .* not registered/,
  /Icon .* not found/,
  /does not exist/,
  /SF Symbol .* has no Lucide equivalent/,
  /Using fallback/,
  /Icon set error for/,
  /LucideIconSet\.loadIconInternal/,
  /heart-\d+/,
  /definitely-does-not-exist/,
  /non-existent/,
  /error-icon/,
  /undefined.*has no Lucide equivalent/,
  /VitestExecutor\._fetchModule/,
  /processTicksAndRejections/,
  /directRequest/,
  /cachedRequest/,
  /dependencyRequest/,
  /loadAndTransform/,
  /at VitestExecutor/,
  /at async/,
  /at Object\.<anonymous>/,
  /at Module\./,
  /file:\/\/\/.*node_modules/,
  /at runTest/,
  /at runWithTimeout/,
  /stderr \|/,
  /packages\/symbols\/.*\.test\.ts/,
  /Error:/,
  /TypeError:/,
  /cause\]/,
  /\{$/,
  /code: 'ERR_MODULE_NOT_FOUND'/,
  /\[cause\]: Error: Failed to load url/
]

// Override console.error and console.warn to filter out expected test errors
console.error = (...args) => {
  const message = args.join(' ')
  const isExpectedError = expectedErrorPatterns.some(pattern => pattern.test(message))
  
  if (!isExpectedError) {
    originalConsoleError.apply(console, args)
  }
}

console.warn = (...args) => {
  const message = args.join(' ')
  const isExpectedError = expectedErrorPatterns.some(pattern => pattern.test(message))
  
  if (!isExpectedError) {
    originalConsoleWarn.apply(console, args)
  }
}

// Override stderr to suppress expected error patterns and test-related output
process.stderr.write = ((chunk: any, encoding?: any, callback?: any) => {
  const message = chunk.toString()
  
  // More aggressive suppression - check for any test-related patterns
  const shouldSuppress = 
    // Direct stderr markers
    message.includes('stderr |') ||
    // File path patterns
    message.includes('packages/symbols/__tests__') ||
    message.includes('/__tests__/') ||
    // Error patterns
    message.includes('Failed to load icon') ||
    message.includes('Cannot find package') ||
    message.includes('ERR_MODULE_NOT_FOUND') ||
    message.includes('Icon set error') ||
    message.includes('SF Symbol') ||
    message.includes('has no Lucide equivalent') ||
    message.includes('Using fallback') ||
    message.includes('LucideIconSet.loadIconInternal') ||
    // Stack trace patterns
    message.includes('at VitestExecutor') ||
    message.includes('at processTicksAndRejections') ||
    message.includes('at async') ||
    message.includes('file:///') ||
    message.includes('node_modules') ||
    // Check against all patterns
    expectedErrorPatterns.some(pattern => pattern.test(message))
  
  if (!shouldSuppress) {
    return originalStderrWrite.call(process.stderr, chunk, encoding, callback)
  }
  
  // Return true to indicate success for suppressed messages
  if (typeof callback === 'function') {
    callback()
  }
  return true
}) as any

// Activate comprehensive stderr suppression
stderrSuppressor.suppress()

// Restore console methods on cleanup (for debugging if needed)
beforeEach(() => {
  // Keep the suppressed console for testing
})

// Optional: Add method to restore original console for debugging
globalThis.restoreConsole = () => {
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
  process.stderr.write = originalStderrWrite
  stderrSuppressor.restore()
}

// Register Lucide icon set for integration tests by default
// Individual test files can override this by clearing and registering their own
const lucideIconSet = new LucideIconSet()
IconSetRegistry.register(lucideIconSet)
IconSetRegistry.setDefault('lucide')

// Mock DOM globals for tests
global.document = {
  createElement: vi.fn((tag: string) => {
    const style = {}
    const element = {
      id: '',
      className: '',
      style: new Proxy(style, {
        set(target, property, value) {
          target[property] = value
          return true
        },
        get(target, property) {
          return target[property]
        }
      }),
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      innerHTML: '',
      textContent: '',
    }
    
    // Mock cssText property
    Object.defineProperty(element.style, 'cssText', {
      set(value) {
        // Clear existing styles
        Object.keys(element.style).forEach(key => {
          if (key !== 'cssText' && typeof element.style[key] !== 'function') {
            delete element.style[key]
          }
        })
        
        const rules = value.split(';').filter(rule => rule.trim())
        rules.forEach(rule => {
          const colonIndex = rule.indexOf(':')
          if (colonIndex === -1) return
          
          const property = rule.slice(0, colonIndex).trim()
          const val = rule.slice(colonIndex + 1).trim()
          
          if (property && val) {
            // Convert kebab-case CSS properties to camelCase
            const camelProperty = property.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())
            element.style[camelProperty] = val
          }
        })
      },
      get() {
        return Object.entries(element.style)
          .filter(([key]) => key !== 'cssText' && typeof element.style[key] !== 'function')
          .map(([key, value]) => `${key}: ${value}`)
          .join('; ')
      }
    })
    
    return element
  }),
  getElementById: vi.fn(),
  body: {
    appendChild: vi.fn(),
    insertBefore: vi.fn(),
    firstChild: null,
  },
  head: {
    appendChild: vi.fn(),
  },
  readyState: 'complete',
  addEventListener: vi.fn(),
} as any