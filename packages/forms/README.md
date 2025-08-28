# @tachui/forms

> Advanced form components and validation system for tachUI framework

[![npm version](https://img.shields.io/npm/v/@tachui/forms.svg)](https://www.npmjs.com/package/@tachui/forms)
[![License: MPL-2.0](https://img.shields.io/badge/License-MPL--2.0-blue.svg)](https://opensource.org/licenses/MPL-2.0)

## Overview

The tachUI forms package provides advanced form components, validation utilities, and form state management that extends the core tachUI framework with powerful form-building capabilities.

## Features

- 🎯 **Advanced Form Components** - TextField, Select, Checkbox, Radio, and more
- ✅ **Built-in Validation** - Schema-based validation with real-time feedback
- 🔄 **Reactive Form State** - Automatic state management and synchronization
- 🎨 **SwiftUI-style API** - Familiar component patterns and modifiers
- 📱 **Mobile-friendly** - Touch-optimized inputs and interactions
- 🔧 **TypeScript-first** - Complete type safety for forms and validation

## Installation

```bash
npm install @tachui/core @tachui/forms
# or
pnpm add @tachui/core @tachui/forms
```

## Quick Start

```typescript
import { VStack, Button } from '@tachui/core'
import { Form, TextField, Select, createFormState } from '@tachui/forms'

// Create form state
const formState = createFormState(
  {
    name: '',
    email: '',
    country: 'US',
  },
  {
    name: { required: true, minLength: 2 },
    email: { required: true, email: true },
    country: { required: true },
  }
)

const contactForm = Form({
  state: formState,
  children: [
    VStack({
      children: [
        TextField('Name', formState.binding('name'))
          .modifier.placeholder('Enter your name')
          .build(),

        TextField('Email', formState.binding('email'))
          .modifier.placeholder('Enter your email')
          .keyboardType('email')
          .build(),

        Select(
          'Country',
          [
            { value: 'US', label: 'United States' },
            { value: 'CA', label: 'Canada' },
            { value: 'UK', label: 'United Kingdom' },
          ],
          formState.binding('country')
        ).build(),

        Button('Submit', () => {
          if (formState.validate()) {
            console.log('Form data:', formState.values())
          }
        })
          .modifier.disabled(() => !formState.isValid())
          .build(),
      ],
      spacing: 16,
    }).build(),
  ],
}).build()
```

## Components

### TextField

Advanced text input with validation and formatting:

```typescript
import { TextField } from '@tachui/forms'

TextField('Password', passwordBinding)
  .modifier.placeholder('Enter password')
  .secureTextEntry(true)
  .minLength(8)
  .validation(value => (value.length >= 8 ? null : 'Password too short'))
  .build()
```

### Select & Picker

Dropdown selections with search and multi-select:

```typescript
import { Select, Picker } from '@tachui/forms'

Select('Category', categories, selectedCategory)
  .modifier.searchable(true)
  .placeholder('Choose category')
  .build()

Picker('Colors', colors, selectedColors)
  .modifier.multiSelect(true)
  .displayStyle('compact')
  .build()
```

### Checkbox & Radio

Selection controls with grouping:

```typescript
import { Checkbox, RadioGroup } from '@tachui/forms'

Checkbox('Accept Terms', acceptedBinding).modifier.required(true).build()

RadioGroup('Size', sizeOptions, selectedSize)
  .modifier.layout('horizontal')
  .build()
```

## Form State Management

### Creating Form State

```typescript
import { createFormState } from '@tachui/forms'

const userForm = createFormState(
  {
    firstName: '',
    lastName: '',
    age: 0,
    preferences: [],
  },
  {
    // Validation rules
    firstName: {
      required: true,
      minLength: 2,
      pattern: /^[A-Za-z]+$/,
    },
    lastName: {
      required: true,
      minLength: 2,
    },
    age: {
      required: true,
      min: 18,
      max: 120,
    },
  }
)
```

### Form Bindings

```typescript
// Two-way data binding
const nameBinding = userForm.binding('firstName')

// Custom validation
const emailBinding = userForm.binding('email', {
  validator: value => {
    if (!value.includes('@')) return 'Invalid email'
    return null
  },
  debounce: 300,
})
```

### Form Validation

```typescript
// Validate entire form
const isValid = userForm.validate()

// Check specific field
const hasErrors = userForm.hasErrors('firstName')

// Get validation errors
const errors = userForm.getErrors()

// Real-time validation status
createEffect(() => {
  if (userForm.isValid()) {
    console.log('Form is valid!')
  }
})
```

## Advanced Features

### Custom Validation

```typescript
import { createValidator } from '@tachui/forms'

const passwordValidator = createValidator({
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: true,
})

TextField('Password', passwordBinding)
  .modifier.validator(passwordValidator)
  .build()
```

### Form Schemas

```typescript
import { createFormSchema } from '@tachui/forms'

const registrationSchema = createFormSchema({
  username: {
    type: 'string',
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_]+$/,
  },
  email: {
    type: 'email',
    required: true,
  },
  birthDate: {
    type: 'date',
    required: true,
    maxDate: new Date(),
  },
})

const form = createFormState({}, registrationSchema)
```

### Conditional Fields

```typescript
const surveyForm = createFormState({
  hasExperience: false,
  yearsExperience: 0,
})

// Show years field only if has experience
Show(
  () => surveyForm.values().hasExperience,
  () =>
    TextField('Years of Experience', surveyForm.binding('yearsExperience'))
      .modifier.keyboardType('numeric')
      .build()
).build()
```

## Styling and Theming

Forms inherit tachUI's modifier system:

```typescript
TextField('Email', emailBinding)
  .modifier.padding(16)
  .backgroundColor('#f8f9fa')
  .cornerRadius(8)
  .border({ width: 1, color: '#dee2e6' })
  .focusBorderColor('#007AFF')
  .errorBorderColor('#dc3545')
  .build()
```

## Accessibility

Built-in accessibility features:

- **ARIA labels** and descriptions
- **Keyboard navigation** support
- **Screen reader** compatibility
- **Focus management** and indicators
- **Error announcements** for validation

## Examples

Check out complete examples:

- **[Contact Form](https://github.com/tach-UI/tachUI/tree/main/apps/examples/forms/contact)**
- **[Registration Form](https://github.com/tach-UI/tachUI/tree/main/apps/examples/forms/registration)**
- **[Survey Builder](https://github.com/tach-UI/tachUI/tree/main/apps/examples/forms/survey)**

## API Reference

- **[TextField API](https://github.com/tach-UI/tachUI/blob/main/docs/api/forms/src/classes/TextField.md)**
- **[Form State API](https://github.com/tach-UI/tachUI/blob/main/docs/api/forms/src/functions/createFormState.md)**
- **[Validation API](https://github.com/tach-UI/tachUI/blob/main/docs/api/forms/src/functions/createValidator.md)**

## Requirements

- **@tachui/core** ^0.7.0-alpha1 or later
- **TypeScript** 5.0+ (recommended)

## Contributing

See the main [Contributing Guide](https://github.com/tach-UI/tachUI/blob/main/CONTRIBUTING.md) for information on contributing to tachUI forms.

## License

Mozilla Public License 2.0 - see [LICENSE](https://github.com/tach-UI/tachUI/blob/main/LICENSE) for details.
