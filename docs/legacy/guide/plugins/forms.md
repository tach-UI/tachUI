# @tachui/forms - Forms Plugin

The `@tachui/forms` plugin provides a comprehensive form solution for TachUI with SwiftUI-inspired APIs, advanced validation, state management, and accessibility features.

## Overview

- **Bundle Size**: ~51KB (35KB reduction for non-form apps)
- **Components**: 10+ form components with variants
- **Validation**: Built-in rules + custom validation support
- **State Management**: Reactive form state with field-level control
- **Accessibility**: WCAG compliant with ARIA support
- **TypeScript**: Full type safety and IntelliSense support

## Installation

```bash
npm install @tachui/forms
```

```typescript
import { globalTachUIInstance } from '@tachui/core'
import { FormsPlugin } from '@tachui/forms'

// Simple installation using global instance
await globalTachUIInstance.installPlugin(FormsPlugin)

// Or with your own instance
import { SimplifiedTachUIInstance } from '@tachui/core'
const instance = new SimplifiedTachUIInstance()
await instance.installPlugin(FormsPlugin)
```

## Plugin Registration

The Forms plugin registers the following components and services:

```typescript
// Components registered by Forms plugin
- TextField, PasswordField, EmailField, PhoneField, NumberField
- CreditCardField, SearchField, URLField, SSNField, PostalCodeField
- DateField, TimeField, TextArea, ColorField
- Select, MultiSelect, Checkbox, Radio, Switch
- Form, FormSection, SubmitButton

// Services registered by Forms plugin
- formsConfig: Configuration and theme settings
- createFormState: Form state management utilities
- validation: Built-in validation rules and formatters
```

## Form Component Usage

The simplified plugin API doesn't change how you use form components:
  numberFormat?: Intl.NumberFormatOptions
  
  // Accessibility
  announceErrors?: boolean
  errorSummaryId?: string
}
```

## Components

### Form

Container component that manages form state and validation:

```typescript
import { Form } from '@tachui/forms'

Form([
  TextField({ name: 'email', label: 'Email', type: 'email' }),
  TextField({ name: 'password', label: 'Password', type: 'password' }),
  Button({ type: 'submit' }, 'Sign In')
], {
  onSubmit: async (data, state) => {
    console.log('Form data:', data)
    console.log('Form state:', state)
    await submitLogin(data)
  },
  validation: {
    validateOn: 'blur',
    stopOnFirstError: false
  }
})
```

#### Form Props

```typescript
interface FormProps {
  onSubmit?: (data: FormData, state: FormState) => void | Promise<void>
  onChange?: (fieldName: string, value: any, fieldState: FieldState) => void
  validation?: {
    validateOn?: 'change' | 'blur' | 'submit'
    stopOnFirstError?: boolean
    debounceMs?: number
  }
  initialValues?: Record<string, any>
  resetOnSubmit?: boolean
  preserveValues?: boolean
}
```

### TextField

Versatile text input component with built-in validation:

```typescript
import { TextField, EmailField, PasswordField } from '@tachui/forms'

// Basic text field
TextField({
  name: 'username',
  label: 'Username',
  placeholder: 'Enter your username',
  required: true
})

// Email field with validation
EmailField({
  name: 'email',
  label: 'Email Address',
  validation: {
    rules: ['required', 'email'],
    validateOn: 'blur'
  }
})

// Password field with strength validation
PasswordField({
  name: 'password',
  label: 'Password',
  showStrengthIndicator: true,
  validation: {
    rules: ['required', 'minLength'],
    validateOn: 'change'
  }
})
```

#### TextField Variants

- `EmailField` - Email input with validation
- `PasswordField` - Password input with strength indicator
- `SearchField` - Search input with search styling
- `URLField` - URL input with URL validation
- `PhoneField` - Phone input with format validation
- `TextArea` - Multiline text input

### Checkbox & Switch

Boolean input components with custom styling:

```typescript
import { Checkbox, Switch, CheckboxGroup } from '@tachui/forms'

// Single checkbox
Checkbox({
  name: 'terms',
  label: 'I agree to the terms and conditions',
  required: true
})

// Switch component
Switch({
  name: 'notifications',
  label: 'Enable notifications',
  size: 'medium'
})

// Checkbox group
CheckboxGroup({
  name: 'interests',
  label: 'Select your interests',
  options: [
    { value: 'tech', label: 'Technology' },
    { value: 'design', label: 'Design' },
    { value: 'business', label: 'Business' }
  ],
  direction: 'vertical'
})
```

### Radio & RadioGroup

Single-choice input components:

```typescript
import { Radio, RadioGroup } from '@tachui/forms'

// Radio group
RadioGroup({
  name: 'plan',
  label: 'Choose a plan',
  options: [
    { value: 'basic', label: 'Basic - $9/month' },
    { value: 'pro', label: 'Pro - $19/month' },
    { value: 'enterprise', label: 'Enterprise - $49/month' }
  ],
  required: true,
  direction: 'vertical'
})

// Individual radio
Radio({
  name: 'plan',
  value: 'basic',
  label: 'Basic Plan'
})
```

### Select

Dropdown selection component with search and multi-select:

```typescript
import { Select, MultiSelect, Combobox } from '@tachui/forms'

// Basic select
Select({
  name: 'country',
  label: 'Country',
  options: [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'mx', label: 'Mexico' }
  ],
  searchable: true
})

// Multi-select
MultiSelect({
  name: 'skills',
  label: 'Skills',
  options: skillOptions,
  multiple: true
})

// Combobox with async options
Combobox({
  name: 'city',
  label: 'City',
  searchable: true,
  loadOptions: async (query) => {
    const response = await fetch(`/api/cities?q=${query}`)
    return response.json()
  }
})
```

## Validation System

### Built-in Rules

```typescript
// Available validation rules
const rules = [
  'required',      // Field is required
  'email',         // Valid email format
  'url',          // Valid URL format
  'number',       // Valid number
  'integer',      // Valid integer
  'minLength',    // Minimum string length
  'maxLength',    // Maximum string length
  'min',          // Minimum numeric value
  'max',          // Maximum numeric value
  'pattern'       // Custom regex pattern
]
```

### Custom Validation

```typescript
import { registerValidationRule } from '@tachui/forms'

// Register custom validation rule
registerValidationRule({
  name: 'strongPassword',
  validate: (value: string) => {
    const hasUpper = /[A-Z]/.test(value)
    const hasLower = /[a-z]/.test(value)
    const hasNumber = /\d/.test(value)
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(value)
    
    return {
      valid: hasUpper && hasLower && hasNumber && hasSymbol,
      message: 'Password must contain uppercase, lowercase, number, and symbol'
    }
  }
})

// Use in component
TextField({
  name: 'password',
  type: 'password',
  validation: {
    rules: ['required', 'strongPassword'],
    validateOn: 'change'
  }
})
```

### Cross-Field Validation

```typescript
import { CrossFieldValidators } from '@tachui/forms'

Form([
  TextField({ name: 'password', type: 'password' }),
  TextField({ name: 'confirmPassword', type: 'password' })
], {
  validation: {
    crossField: [
      CrossFieldValidators.mustMatch('password', 'confirmPassword', 'Passwords must match')
    ]
  }
})
```

## State Management

### Form State

Access and control form state:

```typescript
import { createFormState } from '@tachui/forms'

const formManager = createFormState({
  username: '',
  email: '',
  terms: false
})

// Form state properties
formManager.state.valid        // Is form valid?
formManager.state.dirty        // Has form been modified?
formManager.state.touched      // Has form been interacted with?
formManager.state.submitting   // Is form being submitted?
formManager.state.errors       // Form-level errors

// Form methods
formManager.setValue('username', 'john')
formManager.validateForm()
formManager.resetForm()
formManager.getFieldState('email')
```

### Field State

Control individual field state:

```typescript
import { createField } from '@tachui/forms'

const field = createField('email', '', {
  rules: ['required', 'email'],
  validateOn: 'blur'
})

// Field properties
field.value()      // Current value
field.error()      // Validation error
field.valid()      // Is field valid?
field.dirty()      // Has field been modified?
field.touched()    // Has field been focused?
field.validating() // Is field being validated?

// Field methods
field.setValue('test@example.com')
field.validate()
field.reset()
field.onFocus()
field.onBlur()
```

### Multi-Step Forms

Handle complex multi-step forms:

```typescript
import { createMultiStepFormState } from '@tachui/forms'

const multiStepForm = createMultiStepFormState({
  steps: ['personal', 'address', 'payment'],
  data: {
    personal: { name: '', email: '' },
    address: { street: '', city: '' },
    payment: { cardNumber: '', expiryDate: '' }
  }
})

// Navigation
multiStepForm.nextStep()
multiStepForm.previousStep()
multiStepForm.goToStep('address')

// Validation per step
multiStepForm.validateStep('personal')
multiStepForm.validateAllSteps()

// State
multiStepForm.currentStep()     // 'personal'
multiStepForm.canProceed()      // Can go to next step?
multiStepForm.progress()        // 0.33 (33% complete)
```

## Accessibility

### ARIA Support

All components include comprehensive ARIA attributes:

```typescript
TextField({
  name: 'email',
  label: 'Email Address',
  helperText: 'We will never share your email',
  error: 'Please enter a valid email',
  // Automatically generates:
  // aria-label="Email Address"
  // aria-describedby="email-helper email-error"
  // aria-invalid="true"
  // role="textbox"
})
```

### Screen Reader Announcements

```typescript
Form([...fields], {
  accessibility: {
    announceErrors: true,
    announceSuccess: true,
    errorSummaryId: 'form-errors'
  }
})
```

### Keyboard Navigation

- Tab navigation through form fields
- Space/Enter activation for checkboxes/radios  
- Arrow key navigation in radio groups
- Escape to close dropdowns

## Styling & Theming

### CSS Custom Properties

```css
:root {
  --tachui-form-gap: 1rem;
  --tachui-form-border-color: #d1d5db;
  --tachui-form-border-radius: 0.375rem;
  --tachui-form-focus-color: #3b82f6;
  --tachui-form-error-color: #ef4444;
  --tachui-form-success-color: #22c55e;
}
```

### Form Styles

```typescript
import { FormStyles } from '@tachui/forms'

// Predefined form styles
FormStyles.Automatic([...fields])  // Default styling
FormStyles.Grouped([...fields])    // Grouped with container
FormStyles.Inset([...fields])      // Inset styling  
FormStyles.Plain([...fields])      // Minimal styling
```

### Component Styling

```typescript
TextField({
  name: 'email',
  className: 'my-custom-field',
  style: {
    borderColor: 'blue',
    borderRadius: '8px'
  }
})
```

## Form Utilities

### Serialization

```typescript
import { FormUtils } from '@tachui/forms'

const formData = { name: 'John', email: 'john@example.com' }

// Convert to different formats
const formDataObj = FormUtils.serialize.toFormData(formData)
const urlParams = FormUtils.serialize.toURLSearchParams(formData)
const jsonString = FormUtils.serialize.toJSON(formData)
```

### Validation Presets

```typescript
import { ValidationPresets } from '@tachui/forms'

// Common validation patterns
ValidationPresets.email
ValidationPresets.phone
ValidationPresets.url
ValidationPresets.strongPassword
ValidationPresets.creditCard
ValidationPresets.postalCode
```

## Examples

### Complete Login Form

```typescript
import { Form, TextField, Checkbox, Button } from '@tachui/forms'

const LoginForm = () => {
  return Form([
    TextField({
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      validation: {
        rules: ['required', 'email'],
        validateOn: 'blur'
      }
    }),
    
    TextField({
      name: 'password', 
      label: 'Password',
      type: 'password',
      required: true,
      validation: {
        rules: ['required', 'minLength'],
        validateOn: 'change'
      }
    }),
    
    Checkbox({
      name: 'remember',
      label: 'Remember me'
    }),
    
    Button({
      type: 'submit',
      variant: 'primary'
    }, 'Sign In')
    
  ], {
    onSubmit: async (data, state) => {
      if (state.valid) {
        await login(data.email, data.password, data.remember)
      }
    },
    validation: {
      validateOn: 'blur',
      showValidationSummary: true
    }
  })
}
```

### Registration Form with Validation

```typescript
const RegistrationForm = () => {
  return Form([
    TextField({
      name: 'firstName',
      label: 'First Name',
      required: true
    }),
    
    TextField({
      name: 'lastName', 
      label: 'Last Name',
      required: true
    }),
    
    EmailField({
      name: 'email',
      label: 'Email Address',
      required: true
    }),
    
    PasswordField({
      name: 'password',
      label: 'Password', 
      showStrengthIndicator: true,
      validation: {
        rules: ['required', 'strongPassword']
      }
    }),
    
    TextField({
      name: 'confirmPassword',
      label: 'Confirm Password',
      type: 'password',
      required: true
    }),
    
    CheckboxGroup({
      name: 'interests',
      label: 'Interests (optional)',
      options: [
        { value: 'tech', label: 'Technology' },
        { value: 'design', label: 'Design' },
        { value: 'business', label: 'Business' }
      ]
    }),
    
    Checkbox({
      name: 'terms',
      label: 'I agree to the Terms of Service',
      required: true
    }),
    
    Button({ type: 'submit' }, 'Create Account')
    
  ], {
    validation: {
      validateOn: 'blur',
      crossField: [
        CrossFieldValidators.mustMatch('password', 'confirmPassword')
      ]
    },
    onSubmit: async (data) => {
      await createAccount(data)
    }
  })
}
```

### Dynamic Form with Conditional Fields

```typescript
import { createSignal, createEffect } from '@tachui/core'

const DynamicForm = () => {
  const [accountType, setAccountType] = createSignal('personal')
  const [showBusiness, setShowBusiness] = createSignal(false)
  
  createEffect(() => {
    setShowBusiness(accountType() === 'business')
  })
  
  const baseFields = [
    RadioGroup({
      name: 'accountType',
      label: 'Account Type',
      options: [
        { value: 'personal', label: 'Personal' },
        { value: 'business', label: 'Business' }
      ],
      onChange: (_, value) => setAccountType(value)
    }),
    
    TextField({
      name: 'name',
      label: 'Full Name',
      required: true
    })
  ]
  
  const businessFields = showBusiness() ? [
    TextField({
      name: 'companyName',
      label: 'Company Name',
      required: true
    }),
    
    TextField({
      name: 'taxId',
      label: 'Tax ID',
      validation: {
        rules: ['required', 'pattern'],
        pattern: /^\d{2}-\d{7}$/
      }
    })
  ] : []
  
  return Form([
    ...baseFields,
    ...businessFields,
    Button({ type: 'submit' }, 'Submit')
  ])
}
```

## Best Practices

### Form Structure
- Use semantic HTML structure with proper labels
- Group related fields with FormSection
- Provide clear error messages and help text
- Include form validation summary for accessibility

### Performance
- Use debounced validation for real-time feedback
- Implement field-level validation to avoid full form re-validation
- Lazy load form options for large datasets
- Use controlled components only when necessary

### User Experience  
- Validate on blur for immediate feedback
- Show validation summary for complex forms
- Provide clear success/error states
- Support keyboard navigation throughout

### Accessibility
- Always provide labels for form fields
- Use proper ARIA attributes
- Announce validation errors to screen readers
- Ensure sufficient color contrast for error states

## Migration Guide

### From React Hook Form

```typescript
// React Hook Form
const { register, handleSubmit, formState: { errors } } = useForm()

// TachUI Forms
const form = createFormState(initialValues)
```

### From Formik

```typescript  
// Formik
<Formik initialValues={...} validationSchema={...} onSubmit={...}>
  {({ values, errors, touched, handleChange, handleBlur }) => (
    <Form>...</Form>
  )}
</Formik>

// TachUI Forms  
Form([...fields], {
  initialValues: ...,
  validation: ...,
  onSubmit: ...
})
```

## Troubleshooting

### Common Issues

1. **Validation not triggering**
   - Check `validateOn` setting
   - Ensure validation rules are properly registered

2. **Form state not updating**  
   - Verify field names are unique
   - Check if form context is being passed to fields

3. **TypeScript errors**
   - Ensure proper import of types from '@tachui/forms'
   - Check that validation rules match expected types

### Debug Mode

```typescript
await installPlugin(FormsPlugin, {
  dev: {
    debug: true  // Enables detailed logging
  }
})
```

## Contributing

The forms plugin is part of the TachUI monorepo. See the main repository for development setup and guidelines.

## API Reference

For complete API documentation, see the TypeScript definitions in the `@tachui/forms` package. All components and utilities are fully typed with comprehensive IntelliSense support.