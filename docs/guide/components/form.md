# Form Components

TachUI provides two form components depending on your needs:

## BasicForm (Core) - Lightweight Forms

For simple forms with minimal bundle size, use BasicForm from Core:

```typescript
// Core BasicForm - lightweight, minimal features
import { BasicForm } from '@tachui/core'
```

### Basic Usage

```typescript
BasicForm([
  BasicInput({ name: 'email', type: 'email' }),
  BasicInput({ name: 'password', type: 'password' }),
  Button('Submit')
], {
  onSubmit: handleSubmit
})
```

## Form (Forms Plugin) - Full-Featured Forms

For advanced forms with validation, state management, and specialized inputs:

```typescript
// Forms Plugin Form - full features and validation
import { Form } from '@tachui/forms'
```

## Enhanced Forms Plugin Features

The `@tachui/forms` plugin provides additional Form features:

- Built-in validation system
- Form state management
- Error handling and display
- Multi-step forms
- Auto-save functionality

See the [Forms Plugin documentation](../plugins/forms.md#form) for complete details.

For core API documentation, see the TypeScript definitions in `@tachui/core`.