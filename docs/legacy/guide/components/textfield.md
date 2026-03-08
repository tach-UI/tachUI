# TextField Component

> **⚠️ MIGRATION NOTICE**: The TextField component has moved from `@tachui/core` to `@tachui/forms` with significant enhancements. The core version is deprecated and will be removed in a future release.
>
> **👉 [View Migration Guide](../guide/textfield-migration.md)**

The TextField component provides text input with validation, formatting, and SwiftUI-inspired styling.

## Quick Start

```typescript
// ✅ Recommended: Enhanced TextField from forms plugin
import { TextField, EmailField, PhoneField } from '@tachui/forms'

// ❌ Deprecated: Core TextField (will be removed)
import { TextField } from '@tachui/core'
```

## Basic Usage

```typescript
TextField({
  name: 'username',
  label: 'Username',
  placeholder: 'Enter username',
  validation: { rules: ['required', 'minLength'] }
})
```

## Enhanced Features

The `@tachui/forms` TextField includes all core features plus:

### ✨ **Specialized Field Components**
```typescript
EmailField({ name: 'email' })           // Built-in email validation
PhoneField({ name: 'phone' })           // Automatic formatting
CreditCardField({ name: 'card' })       // Luhn validation
PasswordField({ 
  name: 'password', 
  strongValidation: true 
})
```

### 🎯 **Advanced Validation**
- 20+ built-in validators (email, phone, credit card, etc.)
- Custom validation rules
- Cross-field validation
- Async validation support
- Debounced validation

### 🎨 **Formatters & Parsers**
- Phone number formatting: `(555) 123-4567`
- Credit card formatting: `1234 5678 9012 3456`
- Currency formatting: `$1,234.56`
- Custom formatters and parsers

### ⚡ **Reactive Props**
```typescript
const [text, setText] = createSignal('')

TextField({
  name: 'reactive',
  text: text,                           // Signal-based reactive prop
  placeholderSignal: () => `${text().length} characters`
})
```

### 📱 **Mobile & Accessibility**
- Smart keyboard types (`numeric`, `email`, `phone`)
- Return key hints (`done`, `next`, `search`)
- Screen reader support
- Auto-capitalization control
- Enhanced focus management

## Migration from Core

**Before (Core):**
```typescript
import { TextField, TextFieldValidators } from '@tachui/core'

TextField('', 'Email', {
  type: 'email',
  validator: TextFieldValidators.email,
  onTextChange: (value) => handleChange(value)
})
```

**After (Forms):**
```typescript
import { EmailField } from '@tachui/forms'

EmailField({
  name: 'email',
  placeholder: 'Email',
  validation: { rules: ['required', 'email'] },
  onChange: (name, value, field) => handleChange(value)
})
```

## Complete API Documentation

For comprehensive API documentation including all props, validation rules, formatters, and examples:

- **[Forms Plugin Documentation](../plugins/forms.md#textfield)** - Complete TextField API
- **[Migration Guide](../guide/textfield-migration.md)** - Step-by-step migration
- **[Validation System](../plugins/forms.md#validation)** - All validation rules and usage
- **[Form Integration](../plugins/forms.md#forms)** - Using TextField within forms

## Examples

See working examples in:
- **Forms Plugin Examples** - Coming soon in forms package
- **TextField Variants Demo** - Available in examples directory
- **Form Validation Demo** - Check examples for live demonstrations