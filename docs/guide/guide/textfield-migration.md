# TextField Migration Guide

## Overview

The TextField component has been migrated from `@tachui/core` to `@tachui/forms` with significant enhancements while maintaining full backward compatibility. This migration provides better form integration, advanced validation, formatting capabilities, and specialized field variants.

## Quick Migration

### Basic Import Change

**Before:**
```typescript
import { TextField } from '@tachui/core'
```

**After:**
```typescript
import { TextField } from '@tachui/forms'
```

### Example Migration

**Before (Core):**
```typescript
import { TextField, TextFieldValidators } from '@tachui/core'

const MyForm = () => {
  return TextField('', 'Enter email', {
    type: 'email',
    validator: TextFieldValidators.email,
    onTextChange: (value) => console.log(value)
  })
}
```

**After (Forms):**
```typescript
import { EmailField } from '@tachui/forms'

const MyForm = () => {
  return EmailField({
    name: 'email',
    placeholder: 'Enter email',
    validation: { rules: ['required', 'email'] },
    onChange: (name, value) => console.log(value)
  })
}
```

## Enhanced Features

### 1. Specialized Field Components

Instead of using TextField with different types, use specialized components:

```typescript
import { 
  EmailField, 
  PasswordField, 
  PhoneField, 
  CreditCardField,
  DateField 
} from '@tachui/forms'

// Email with built-in validation
EmailField({ name: 'email' })

// Phone with formatting
PhoneField({ name: 'phone' })

// Credit card with Luhn validation
CreditCardField({ name: 'card' })
```

### 2. Advanced Formatters & Parsers

```typescript
import { TextField, TextFieldFormatters } from '@tachui/forms'

TextField({
  name: 'currency',
  formatter: TextFieldFormatters.currency,
  parser: TextFieldParsers.currency
})
```

### 3. Enhanced Validation System

```typescript
TextField({
  name: 'password',
  validation: {
    rules: ['required', 'strongPassword'],
    validateOn: 'change',
    debounce: 300
  }
})
```

### 4. Signal-Based Reactive Props

```typescript
import { createSignal } from '@tachui/core'
const [text, setText] = createSignal('')

TextField({
  name: 'reactive',
  text: text, // Reactive prop
  placeholderSignal: () => `Characters: ${text().length}`
})
```

## API Changes

### Props Mapping

| Core TextField | Forms TextField | Notes |
|----------------|-----------------|-------|
| `text` | `value` or `text` | Both supported |
| `onTextChange` | `onChange` | Signature changed |
| `validator` | `validation` | Enhanced validation system |
| `isEnabled` | `disabled` | Inverted logic |

### Event Handler Changes

**Before:**
```typescript
TextField('', '', {
  onTextChange: (value: string) => void
})
```

**After:**
```typescript
TextField({
  onChange: (name: string, value: string, field: Field) => void
})
```

### Validation Changes

**Before:**
```typescript
TextField('', '', {
  validator: TextFieldValidators.email
})
```

**After:**
```typescript
TextField({
  validation: { 
    rules: ['email'],
    validateOn: 'blur'
  }
})
```

## New Capabilities

### 1. Form Integration

```typescript
import { Form, TextField } from '@tachui/forms'

Form({
  onSubmit: (data) => console.log(data),
  children: [
    TextField({ name: 'username' }),
    TextField({ name: 'email', type: 'email' })
  ]
})
```

### 2. Multi-Step Forms

```typescript
import { createMultiStepFormState } from '@tachui/forms'

const form = createMultiStepFormState({
  steps: ['personal', 'contact', 'preferences'],
  fields: {
    personal: ['firstName', 'lastName'],
    contact: ['email', 'phone']
  }
})
```

### 3. Cross-Field Validation

```typescript
TextField({
  name: 'confirmPassword',
  validation: {
    rules: [(value, formData) => 
      value === formData.password || 'Passwords must match'
    ]
  }
})
```

## Breaking Changes

### 1. Function Signature Changes

- Constructor function signature changed
- Event handlers receive additional parameters
- Validation API completely redesigned

### 2. Import Paths

- All TextField utilities moved to `@tachui/forms`
- Types need to be imported from forms package

### 3. CSS Class Names

- Class names updated for better consistency
- New data attributes for styling hooks

## Migration Strategy

### Version 1.1: Install Forms Plugin

```bash
npm install @tachui/forms
```

### Version 1.2: Update Imports

Use find-and-replace to update import statements:

```bash
# Find all TextField imports
grep -r "import.*TextField.*@tachui/core" src/

# Replace with forms imports
sed -i 's/@tachui\/core/@tachui\/forms/g' src/**/*.ts
```

### Version 1.3: Update Component Usage

1. Replace TextField constructors with object props
2. Update event handlers to new signature
3. Migrate validation logic to new system

### Version 1.4: Leverage New Features

1. Replace TextField variants with specialized components
2. Add form integration where beneficial
3. Implement advanced validation rules

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure `@tachui/forms` is installed and imported
2. **Type Errors**: Update type imports to forms package
3. **Validation Not Working**: Check validation rule names and syntax
4. **Events Not Firing**: Update event handler signatures

### Migration Checklist

- [ ] Update all TextField imports
- [ ] Install @tachui/forms package
- [ ] Update event handler signatures
- [ ] Migrate validation logic
- [ ] Test form submission
- [ ] Update CSS/styling if needed
- [ ] Replace with specialized components where appropriate

## Support

For migration assistance:
- Check the [TextField documentation](../components/textfield.md)
- Review **Forms plugin examples** - Available in examples directory
- File issues in the TachUI repository

## Timeline

- **Current**: Core TextField deprecated with warnings
- **Next Release**: Core TextField marked for removal
- **Future Release**: Core TextField completely removed

Migrate as soon as possible to avoid disruption.