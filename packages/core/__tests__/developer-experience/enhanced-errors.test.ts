/**
 * Enhanced Error System Tests
 *
 * Tests for the improved error messages and developer experience features.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DeveloperErrorFactory,
  DeveloperWarnings,
  devMode,
  TypeValidation,
} from '../../src/developer-experience/enhanced-errors'

describe('Enhanced Error System', () => {
  beforeEach(() => {
    // Clear warning cache
    DeveloperWarnings.clearWarnings()

    // Mock console methods
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'group').mockImplementation(() => {})
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  describe('DeveloperErrorFactory', () => {
    it('should create modifier validation error with helpful context', () => {
      const error = DeveloperErrorFactory.modifierValidationError(
        'padding',
        'conflicting properties'
      )

      expect(error.code).toBe('MODIFIER_VALIDATION_ERROR')
      expect(error.category).toBe('modifier')
      expect(error.severity).toBe('error')
      expect(error.message).toContain('padding')
      expect(error.message).toContain('conflicting properties')
      expect(error.suggestion).toContain('.padding(number) for all sides')
      expect(error.documentation).toContain('docs.tachui.dev')
      expect(error.examples).toBeInstanceOf(Array)
      expect(error.examples!.length).toBeGreaterThan(0)
    })

    it('should create component validation error with type information', () => {
      const error = DeveloperErrorFactory.componentValidationError(
        'Button',
        'onPress',
        'function',
        'not a function'
      )

      expect(error.code).toBe('COMPONENT_VALIDATION_ERROR')
      expect(error.category).toBe('component')
      expect(error.component).toBe('Button')
      expect(error.message).toContain('Button.onPress')
      expect(error.message).toContain('expected function')
      expect(error.suggestion).toContain('function')
    })

    it('should create reactive system error with operation context', () => {
      const error = DeveloperErrorFactory.reactiveSystemError(
        'createSignal',
        'invalid initial value',
        'in Button component'
      )

      expect(error.code).toBe('REACTIVE_SYSTEM_ERROR')
      expect(error.category).toBe('reactive')
      expect(error.message).toContain('createSignal')
      expect(error.message).toContain('Button component')
      expect(error.examples).toContain('const [count, setCount] = createSignal(0)')
    })

    it('should create runtime error with severity', () => {
      const error = DeveloperErrorFactory.runtimeError('render', 'DOM element not found', 'Text')

      expect(error.code).toBe('RUNTIME_ERROR')
      expect(error.category).toBe('runtime')
      expect(error.severity).toBe('fatal')
      expect(error.component).toBe('Text')
    })
  })

  describe('DeveloperWarnings', () => {
    it('should warn about deprecated API usage', () => {
      DeveloperWarnings.deprecation('.oldMethod()', '.newMethod()', 'Button', 'v2.0')

      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Deprecation Warning'))
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('oldMethod'))
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('newMethod'))
    })

    it('should warn about performance issues', () => {
      DeveloperWarnings.performance(
        'Multiple render cycles detected',
        'Use memoization to avoid unnecessary re-renders',
        'List'
      )

      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Performance Warning'))
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('memoization'))
    })

    it('should warn about accessibility issues', () => {
      DeveloperWarnings.accessibility(
        'Missing alt text for image',
        'Add alt prop or aria-label for screen readers',
        'Image'
      )

      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Accessibility Warning'))
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('alt text'))
    })

    it('should not show duplicate warnings', () => {
      const warning = () => DeveloperWarnings.deprecation('.old()', '.new()')

      warning()
      warning()
      warning()

      expect(console.warn).toHaveBeenCalledTimes(1)
    })

    it('should clear warning cache', () => {
      DeveloperWarnings.deprecation('.old()', '.new()')
      expect(console.warn).toHaveBeenCalledTimes(1)

      DeveloperWarnings.clearWarnings()

      DeveloperWarnings.deprecation('.old()', '.new()')
      expect(console.warn).toHaveBeenCalledTimes(2)
    })
  })

  describe('TypeValidation', () => {
    it('should validate component props successfully', () => {
      const props = {
        title: 'Hello',
        count: 42,
        enabled: true,
        handler: () => {},
      }

      const schema = {
        title: { type: 'string', required: true },
        count: { type: 'number' },
        enabled: { type: 'boolean' },
        handler: { type: 'function' },
      }

      expect(() => {
        TypeValidation.validateComponentProps('TestComponent', props, schema)
      }).not.toThrow()
    })

    it('should throw on missing required props', () => {
      const props = { count: 42 }
      const schema = {
        title: { type: 'string', required: true },
        count: { type: 'number' },
      }

      expect(() => {
        TypeValidation.validateComponentProps('TestComponent', props, schema)
      }).toThrow()
    })

    it('should throw on wrong prop types', () => {
      const props = { title: 123 }
      const schema = {
        title: { type: 'string', required: true },
      }

      expect(() => {
        TypeValidation.validateComponentProps('TestComponent', props, schema)
      }).toThrow()
    })

    it('should validate union types', () => {
      const props = { value: 'text' }
      const schema = {
        value: { type: 'string | number' },
      }

      expect(() => {
        TypeValidation.validateComponentProps('TestComponent', props, schema)
      }).not.toThrow()

      props.value = 42 as any
      expect(() => {
        TypeValidation.validateComponentProps('TestComponent', props, schema)
      }).not.toThrow()
    })

    it('should use custom validator with custom message', () => {
      const props = { email: 'invalid-email' }
      const schema = {
        email: {
          type: 'string',
          validator: (value: string) => value.includes('@'),
          message: 'Email must contain @ symbol',
        },
      }

      expect(() => {
        TypeValidation.validateComponentProps('TestComponent', props, schema)
      }).toThrow()
    })

    it('should validate modifier combinations', () => {
      const modifiers = [
        { type: 'padding', properties: {} },
        { type: 'padding', properties: {} },
      ]

      TypeValidation.validateModifierCombination(modifiers as any)

      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Performance Warning'))
    })
  })

  describe('devMode utilities', () => {
    it('should enable enhanced errors in development', () => {
      const originalError = console.error

      devMode.enableEnhancedErrors()

      expect(console.error).not.toBe(originalError)
    })

    it('should log component tree with proper indentation', () => {
      const mockComponent = {
        type: 'VStack',
        modifiers: [{ type: 'padding' }, { type: 'backgroundColor' }],
        props: {
          children: [
            {
              type: 'Text',
              modifiers: [],
              props: { children: 'Hello' },
            },
            {
              type: 'Button',
              modifiers: [{ type: 'onTap' }],
              props: { children: 'Click me' },
            },
          ],
        },
      }

      devMode.logComponentTree(mockComponent as any)

      expect(console.log).toHaveBeenCalledWith('VStack (2 modifiers)')
      expect(console.log).toHaveBeenCalledWith('  Text')
      expect(console.log).toHaveBeenCalledWith('  Button (1 modifiers)')
    })
  })

  describe('Type helpers', () => {
    it('should validate string type', () => {
      expect(TypeValidation.validateType('hello', 'string')).toBe(true)
      expect(TypeValidation.validateType(123, 'string')).toBe(false)
    })

    it('should validate number type', () => {
      expect(TypeValidation.validateType(123, 'number')).toBe(true)
      expect(TypeValidation.validateType(NaN, 'number')).toBe(false)
      expect(TypeValidation.validateType('123', 'number')).toBe(false)
    })

    it('should validate array type', () => {
      expect(TypeValidation.validateType([1, 2, 3], 'array')).toBe(true)
      expect(TypeValidation.validateType('not array', 'array')).toBe(false)
    })

    it('should validate function type', () => {
      expect(TypeValidation.validateType(() => {}, 'function')).toBe(true)
      expect(TypeValidation.validateType('not function', 'function')).toBe(false)
    })

    it('should validate union types', () => {
      expect(TypeValidation.validateType('hello', 'string | number')).toBe(true)
      expect(TypeValidation.validateType(123, 'string | number')).toBe(true)
      expect(TypeValidation.validateType(true, 'string | number')).toBe(false)
    })
  })
})
