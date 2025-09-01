# @tachui/forms v2.0

Comprehensive form components and validation system for tachUI - unified package combining all form functionality.

## What's New in v2.0

- **Unified Package**: All 27 form components in one optimized package
- **20% Bundle Reduction**: From 488KB to ~390KB through build optimization
- **Tree Shaking**: Import only the components you need
- **Backwards Compatible**: Maintains all existing APIs

## Installation

```bash
pnpm add @tachui/forms
```

## Quick Start

```typescript
import { Form, TextField, DatePicker, validation } from '@tachui/forms'

// Or use granular imports for optimal bundle size
import { TextField } from '@tachui/forms/text-input'
import { DatePicker } from '@tachui/forms/date-picker'
import { required, email } from '@tachui/forms/validation'
```

## Components (27 total)

### Form Container (2 components)

- `Form` - Form state management and submission
- `FormSection` - Logical grouping of form fields

### Text Input (14 components)

- `TextField` - Basic text input
- `TextArea` - Multi-line text input
- `EmailField` - Email validation and formatting
- `PasswordField` - Password input with visibility toggle
- `SearchField` - Search input with clear button
- `URLField` - URL validation and formatting
- `PhoneField` - Phone number formatting and validation
- `NumberField` - Numeric input with validation
- `CreditCardField` - Credit card formatting and validation
- `SSNField` - Social Security Number formatting
- `PostalCodeField` - Postal/ZIP code validation
- `DateField` - Simple date text input
- `TimeField` - Time input and validation
- `ColorField` - Color picker input

### Selection (8 components)

- `Checkbox` - Single checkbox input
- `CheckboxGroup` - Multiple checkbox group
- `Switch` - Toggle switch input
- `Radio` - Single radio button
- `RadioGroup` - Radio button group
- `Select` - Single select dropdown
- `MultiSelect` - Multiple selection dropdown
- `Combobox` - Searchable select input

### Advanced (3 components)

- `DatePicker` - Rich calendar interface
- `Stepper` - Numeric increment/decrement
- `Slider` - Range input with marks

## Tree-Shaking Examples

```typescript
// Import entire package (390KB)
import { TextField, DatePicker, validation } from '@tachui/forms'

// Import specific categories (~180KB for text inputs)
import * as TextInputs from '@tachui/forms/text-input'
import * as Validation from '@tachui/forms/validation'

// Import individual components (~20-30KB each)
import { TextField } from '@tachui/forms/text-input'
import { required, email } from '@tachui/forms/validation'
```

## Migration from v1.x

### From @tachui/forms + @tachui/advanced-forms

```typescript
// Old approach (488KB total)
import { TextField, Form } from '@tachui/forms'
import { DatePicker, Stepper } from '@tachui/advanced-forms'

// New unified approach (390KB total)
import { TextField, Form, DatePicker, Stepper } from '@tachui/forms'

// Or with tree-shaking (as needed)
import { TextField, Form } from '@tachui/forms/text-input'
import { DatePicker } from '@tachui/forms/date-picker'
import { Stepper } from '@tachui/forms/advanced'
```

### Backwards Compatibility

All existing APIs remain unchanged. Migration is optional and can be done incrementally.

## Validation System

Comprehensive validation with 20+ built-in rules:

```typescript
import { validation } from '@tachui/forms'

const schema = validation.object({
  email: validation.string().email().required(),
  password: validation.string().min(8).required(),
  confirmPassword: validation.string().matches('password'),
  age: validation.number().min(18).max(120),
})
```

## Bundle Size Comparison

| Package        | v1.x (Split)   | v2.0 (Unified) | Savings   |
| -------------- | -------------- | -------------- | --------- |
| Text Inputs    | 149KB          | 120KB          | 19%       |
| Advanced Forms | 268KB          | 80KB           | 70%       |
| Date Picker    | Included above | 60KB           | Optimized |
| **Total**      | **488KB**      | **390KB**      | **20%**   |

## Documentation

- [Component API Reference](./docs/components.md)
- [Validation Guide](./docs/validation.md)
- [Migration Guide](./docs/migration.md)
- [Bundle Optimization](./docs/optimization.md)
