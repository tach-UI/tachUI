/**
 * Forms Plugin Integration Tests - Simplified Plugin System
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import FormsPlugin, { installFormsPlugin } from '../src/index'

// Mock the simplified plugin system
const mockInstance = {
  registerComponent: vi.fn(),
  registerService: vi.fn(),
  components: new Map(),
  services: new Map(),
}

// Mock console.log to capture plugin installation messages
const originalLog = console.log
beforeEach(() => {
  vi.clearAllMocks()
  console.log = vi.fn()
})

afterEach(() => {
  console.log = originalLog
})

describe('Forms Plugin', () => {
  describe('Plugin Definition', () => {
    it('has correct plugin metadata', () => {
      expect(FormsPlugin.name).toBe('@tachui/forms')
      expect(FormsPlugin.version).toBe('0.1.0')
      expect(FormsPlugin.install).toBeTypeOf('function')
      expect(FormsPlugin.uninstall).toBeTypeOf('function')
    })

    it('follows simplified plugin interface', () => {
      // Simplified plugin should not have complex metadata
      expect(FormsPlugin.description).toBeUndefined()
      expect(FormsPlugin.author).toBeUndefined()
      expect(FormsPlugin.configSchema).toBeUndefined()
      expect(FormsPlugin.minCoreVersion).toBeUndefined()
    })
  })

  describe('Plugin Installation', () => {
    it('installs plugin and registers all form components', async () => {
      await FormsPlugin.install(mockInstance as any)

      // Should register all form components (24 components)
      expect(mockInstance.registerComponent).toHaveBeenCalledTimes(24)

      // Check some key components were registered
      expect(mockInstance.registerComponent).toHaveBeenCalledWith(
        'Form',
        expect.any(Function),
        expect.objectContaining({
          category: 'forms',
          tags: ['form', 'container', 'validation'],
        })
      )

      expect(mockInstance.registerComponent).toHaveBeenCalledWith(
        'TextField',
        expect.any(Function),
        expect.objectContaining({
          category: 'forms',
          tags: ['input', 'text', 'validation'],
        })
      )

      expect(mockInstance.registerComponent).toHaveBeenCalledWith(
        'Select',
        expect.any(Function),
        expect.objectContaining({
          category: 'forms',
          tags: ['input', 'select', 'dropdown', 'choice'],
        })
      )
    })

    it('registers form services using simplified API', async () => {
      await FormsPlugin.install(mockInstance as any)

      // Should register services using simplified registerService method
      expect(mockInstance.registerService).toHaveBeenCalledWith(
        'formsConfig',
        expect.objectContaining({
          theme: 'default',
          validation: {},
          accessibility: {}
        })
      )

      expect(mockInstance.registerService).toHaveBeenCalledWith(
        'validationMessageFormatter',
        expect.anything()
      )

      expect(mockInstance.registerService).toHaveBeenCalledWith(
        'createFormState',
        expect.any(Function)
      )

      expect(mockInstance.registerService).toHaveBeenCalledWith(
        'createField',
        expect.any(Function)
      )

      expect(mockInstance.registerService).toHaveBeenCalledWith(
        'ValidationPresets',
        expect.any(Object)
      )

      expect(mockInstance.registerService).toHaveBeenCalledWith(
        'TextFieldFormatters',
        expect.any(Object)
      )

      expect(mockInstance.registerService).toHaveBeenCalledWith(
        'TextFieldValidators',
        expect.any(Object)
      )
      
      // Check that we registered the correct number of services
      expect(mockInstance.registerService).toHaveBeenCalledTimes(10)
    })

    it('logs installation success message', async () => {
      await FormsPlugin.install(mockInstance as any)

      expect(console.log).toHaveBeenCalledWith('📝 TachUI Forms plugin installed successfully')
      expect(console.log).toHaveBeenCalledWith(
        '   • 24 form components (including enhanced TextField variants)'
      )
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('validation rules'))
      expect(console.log).toHaveBeenCalledWith('   • TextField formatters and validators included')
    })
  })

  describe('Plugin Uninstallation', () => {
    it('logs uninstallation message', async () => {
      if (FormsPlugin.uninstall) {
        await FormsPlugin.uninstall()
        expect(console.log).toHaveBeenCalledWith('📝 TachUI Forms plugin uninstalled')
      }
    })
  })

  describe('Component Registration Details', () => {
    it('registers form container components', async () => {
      await FormsPlugin.install(mockInstance as any)

      expect(mockInstance.registerComponent).toHaveBeenCalledWith(
        'Form',
        expect.any(Function),
        expect.objectContaining({ category: 'forms', tags: ['form', 'container', 'validation'] })
      )

      expect(mockInstance.registerComponent).toHaveBeenCalledWith(
        'FormSection',
        expect.any(Function),
        expect.objectContaining({ category: 'forms', tags: ['form', 'section', 'fieldset'] })
      )
    })

    it('registers text input components', async () => {
      await FormsPlugin.install(mockInstance as any)

      const textComponents = [
        'TextField',
        'EmailField', 
        'PasswordField',
        'SearchField',
        'URLField',
        'PhoneField',
        'TextArea',
      ]

      textComponents.forEach((componentName) => {
        expect(mockInstance.registerComponent).toHaveBeenCalledWith(
          componentName,
          expect.any(Function),
          expect.objectContaining({ category: 'forms' })
        )
      })
    })

    it('registers choice input components', async () => {
      await FormsPlugin.install(mockInstance as any)

      const choiceComponents = [
        { name: 'Checkbox', tags: ['input', 'checkbox', 'boolean'] },
        { name: 'Switch', tags: ['input', 'switch', 'toggle', 'boolean'] },
        { name: 'Radio', tags: ['input', 'radio', 'choice'] },
        { name: 'Select', tags: ['input', 'select', 'dropdown', 'choice'] },
      ]

      choiceComponents.forEach(({ name, tags }) => {
        expect(mockInstance.registerComponent).toHaveBeenCalledWith(
          name,
          expect.any(Function),
          expect.objectContaining({
            category: 'forms',
            tags: expect.arrayContaining(tags),
          })
        )
      })
    })

    it('registers specialized input components', async () => {
      await FormsPlugin.install(mockInstance as any)

      const specializedComponents = [
        { name: 'NumberField', tags: ['input', 'number', 'numeric', 'validation'] },
        { name: 'CreditCardField', tags: ['input', 'credit-card', 'payment', 'validation'] },
        { name: 'SSNField', tags: ['input', 'ssn', 'social-security', 'validation'] },
        { name: 'PostalCodeField', tags: ['input', 'postal-code', 'zip', 'validation'] },
        { name: 'DateField', tags: ['input', 'date', 'calendar', 'validation'] },
        { name: 'TimeField', tags: ['input', 'time', 'clock', 'validation'] },
        { name: 'ColorField', tags: ['input', 'color', 'picker'] },
      ]

      specializedComponents.forEach(({ name, tags }) => {
        expect(mockInstance.registerComponent).toHaveBeenCalledWith(
          name,
          expect.any(Function),
          expect.objectContaining({
            category: 'forms',
            tags: expect.arrayContaining(tags),
          })
        )
      })
    })

    it('registers group components', async () => {
      await FormsPlugin.install(mockInstance as any)

      expect(mockInstance.registerComponent).toHaveBeenCalledWith(
        'CheckboxGroup',
        expect.any(Function),
        expect.objectContaining({
          category: 'forms',
          tags: ['input', 'checkbox', 'group', 'multiple'],
        })
      )

      expect(mockInstance.registerComponent).toHaveBeenCalledWith(
        'RadioGroup',
        expect.any(Function),
        expect.objectContaining({
          category: 'forms',
          tags: ['input', 'radio', 'group', 'choice'],
        })
      )

      expect(mockInstance.registerComponent).toHaveBeenCalledWith(
        'MultiSelect',
        expect.any(Function),
        expect.objectContaining({
          category: 'forms',
          tags: ['input', 'select', 'multiple', 'choice'],
        })
      )

      expect(mockInstance.registerComponent).toHaveBeenCalledWith(
        'Combobox',
        expect.any(Function),
        expect.objectContaining({
          category: 'forms',
          tags: ['input', 'combobox', 'search', 'choice'],
        })
      )
    })
  })

  describe('Service Registration', () => {
    it('registers essential form services', async () => {
      await FormsPlugin.install(mockInstance as any)

      const expectedServices = [
        'formsConfig',
        'validationMessageFormatter',
        'createFormState',
        'createField',
        'createMultiStepFormState',
        'ValidationPresets',
        'CrossFieldValidators',
        'TextFieldFormatters',
        'TextFieldParsers',
        'TextFieldValidators'
      ]

      expectedServices.forEach((serviceName) => {
        expect(mockInstance.registerService).toHaveBeenCalledWith(
          serviceName,
          expect.anything()
        )
      })
    })

    it('registers forms config service with default values', async () => {
      await FormsPlugin.install(mockInstance as any)

      expect(mockInstance.registerService).toHaveBeenCalledWith(
        'formsConfig',
        expect.objectContaining({
          theme: 'default',
          validation: {},
          accessibility: {}
        })
      )
    })
  })

  describe('Convenience Functions', () => {
    it('provides installFormsPlugin convenience function', async () => {
      // The convenience function should work the same as plugin.install
      await expect(installFormsPlugin(mockInstance as any)).resolves.not.toThrow()
      
      // Should register components and services
      expect(mockInstance.registerComponent).toHaveBeenCalled()
      expect(mockInstance.registerService).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('handles installation errors gracefully', async () => {
      const failingInstance = {
        registerComponent: vi.fn(() => {
          throw new Error('Registration failed')
        }),
        registerService: vi.fn(),
        components: new Map(),
        services: new Map(),
      }

      await expect(FormsPlugin.install(failingInstance as any)).rejects.toThrow(
        'Registration failed'
      )
    })

    it('handles service registration errors gracefully', async () => {
      const failingInstance = {
        registerComponent: vi.fn(),
        registerService: vi.fn(() => {
          throw new Error('Service registration failed')  
        }),
        components: new Map(),
        services: new Map(),
      }

      await expect(FormsPlugin.install(failingInstance as any)).rejects.toThrow(
        'Service registration failed'
      )
    })
  })

  describe('Simplified Plugin Architecture', () => {
    it('does not use deprecated complex plugin features', async () => {
      await FormsPlugin.install(mockInstance as any)

      // Should not call deprecated methods that don't exist in simplified system
      expect(mockInstance).not.toHaveProperty('registerUtility')
      expect(mockInstance).not.toHaveProperty('registerThemeProvider')
      expect(mockInstance).not.toHaveProperty('configSchema')
    })

    it('uses only simplified plugin interface', () => {
      // Plugin should only have simplified interface properties
      const pluginKeys = Object.keys(FormsPlugin)
      expect(pluginKeys).toEqual(['name', 'version', 'install', 'uninstall'])
    })
  })
})