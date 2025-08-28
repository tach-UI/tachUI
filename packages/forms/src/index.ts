/**
 * TachUI Forms Plugin - Simplified Implementation
 *
 * Complete form solution for TachUI with validation, state management,
 * and SwiftUI-inspired component APIs. Reduces bundle size by ~35KB
 * for applications that don't need form functionality.
 */

import type { TachUIPlugin, TachUIInstance } from '@tachui/core/plugins'
import type { Component } from '@tachui/core/runtime/types'

// Import all form components
import {
  Checkbox,
  CheckboxGroup,
  ColorField,
  Combobox,
  CreditCardField,
  DateField,
  EmailField,
  Form,
  FormSection,
  MultiSelect,
  NumberField,
  PasswordField,
  PhoneField,
  PostalCodeField,
  Radio,
  RadioGroup,
  SearchField,
  Select,
  SSNField,
  Switch,
  TextArea,
  TextField,
  TimeField,
  URLField,
} from './components'
// Import state management
import { createField, createFormState, createMultiStepFormState } from './state'
// Import TextField utilities
import { TextFieldFormatters, TextFieldParsers } from './utils/formatters'
import { TextFieldValidators } from './utils/validators'
// Import validation system
import {
  CrossFieldValidators,
  defaultMessageFormatter,
  getValidationRules,
  registerFormsValidators,
  ValidationPresets,
} from './validation'

/**
 * TachUI Forms Plugin Implementation - Simplified
 */
const FormsPlugin: TachUIPlugin = {
  name: '@tachui/forms',
  version: '0.1.0',

  async install(instance: TachUIInstance) {
    // Helper to register form components with proper typing
    const registerFormComponent = (name: string, component: any, options: { category: string; tags: string[] }) => {
      instance.registerComponent(name, component as Component, options)
    }

    // Register all form components
    registerFormComponent('Form', Form, {
      category: 'forms',
      tags: ['form', 'container', 'validation'],
    })

    registerFormComponent('FormSection', FormSection, {
      category: 'forms',
      tags: ['form', 'section', 'fieldset'],
    })

    // Input components
    registerFormComponent('TextField', TextField, {
      category: 'forms',
      tags: ['input', 'text', 'validation'],
    })

    registerFormComponent('EmailField', EmailField, {
      category: 'forms',
      tags: ['input', 'email', 'validation'],
    })

    registerFormComponent('PasswordField', PasswordField, {
      category: 'forms',
      tags: ['input', 'password', 'validation'],
    })

    registerFormComponent('SearchField', SearchField, {
      category: 'forms',
      tags: ['input', 'search'],
    })

    registerFormComponent('URLField', URLField, {
      category: 'forms',
      tags: ['input', 'url', 'validation'],
    })

    registerFormComponent('PhoneField', PhoneField, {
      category: 'forms',
      tags: ['input', 'phone', 'validation'],
    })

    registerFormComponent('NumberField', NumberField, {
      category: 'forms',
      tags: ['input', 'number', 'numeric', 'validation'],
    })

    registerFormComponent('CreditCardField', CreditCardField, {
      category: 'forms',
      tags: ['input', 'credit-card', 'payment', 'validation'],
    })

    registerFormComponent('SSNField', SSNField, {
      category: 'forms',
      tags: ['input', 'ssn', 'social-security', 'validation'],
    })

    registerFormComponent('PostalCodeField', PostalCodeField, {
      category: 'forms',
      tags: ['input', 'postal-code', 'zip', 'validation'],
    })

    registerFormComponent('TextArea', TextArea, {
      category: 'forms',
      tags: ['input', 'textarea', 'multiline'],
    })

    registerFormComponent('DateField', DateField, {
      category: 'forms',
      tags: ['input', 'date', 'calendar', 'validation'],
    })

    registerFormComponent('TimeField', TimeField, {
      category: 'forms',
      tags: ['input', 'time', 'clock', 'validation'],
    })

    registerFormComponent('ColorField', ColorField, {
      category: 'forms',
      tags: ['input', 'color', 'picker'],
    })

    registerFormComponent('Checkbox', Checkbox, {
      category: 'forms',
      tags: ['input', 'checkbox', 'boolean'],
    })

    registerFormComponent('Switch', Switch, {
      category: 'forms',
      tags: ['input', 'switch', 'toggle', 'boolean'],
    })

    registerFormComponent('CheckboxGroup', CheckboxGroup, {
      category: 'forms',
      tags: ['input', 'checkbox', 'group', 'multiple'],
    })

    registerFormComponent('Radio', Radio, {
      category: 'forms',
      tags: ['input', 'radio', 'choice'],
    })

    registerFormComponent('RadioGroup', RadioGroup, {
      category: 'forms',
      tags: ['input', 'radio', 'group', 'choice'],
    })

    registerFormComponent('Select', Select, {
      category: 'forms',
      tags: ['input', 'select', 'dropdown', 'choice'],
    })

    registerFormComponent('MultiSelect', MultiSelect, {
      category: 'forms',
      tags: ['input', 'select', 'multiple', 'choice'],
    })

    registerFormComponent('Combobox', Combobox, {
      category: 'forms',
      tags: ['input', 'combobox', 'search', 'choice'],
    })

    // Register essential services using simplified API
    instance.registerService('formsConfig', {
      theme: 'default',
      validation: {},
      accessibility: {}
    })
    
    instance.registerService('validationMessageFormatter', defaultMessageFormatter)
    
    // Make form utilities available through services
    instance.registerService('createFormState', createFormState)
    instance.registerService('createField', createField)
    instance.registerService('createMultiStepFormState', createMultiStepFormState)
    instance.registerService('ValidationPresets', ValidationPresets)
    instance.registerService('CrossFieldValidators', CrossFieldValidators)
    instance.registerService('TextFieldFormatters', TextFieldFormatters)
    instance.registerService('TextFieldParsers', TextFieldParsers)
    instance.registerService('TextFieldValidators', TextFieldValidators)

    // Register Forms component validators with Core validation system
    await registerFormsValidators()

    console.log('📝 TachUI Forms plugin installed successfully')
    console.log('   • 24 form components (including enhanced TextField variants)')
    console.log(`   • ${getValidationRules().length} validation rules`)
    console.log('   • TextField formatters and validators included')
  },

  async uninstall() {
    console.log('📝 TachUI Forms plugin uninstalled')
  },
}

// Export the plugin as default
export default FormsPlugin

// Export all form functionality for direct usage
export * from './components'
export * from './state'
export * from './types'
// Export enhanced TextField utilities
export { TextFieldFormatters, TextFieldParsers } from './utils/formatters'
export { TextFieldValidators } from './utils/validators'
export * from './validation'

// Convenience function to install the plugin
export const installFormsPlugin = async (instance: TachUIInstance) => {
  return FormsPlugin.install(instance)
}
