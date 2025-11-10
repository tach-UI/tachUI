# Button Component

The Button component provides interactive action triggers with SwiftUI-inspired styling and behavior, complete with type safety and modifier support.

## Overview

The Button component is part of TachUI's core component library, providing consistent interactive elements for user actions with full TypeScript support.

```typescript
import { Button, createSignal } from '@tachui/core'

// Type-safe button handler
const handleClick = (): void => {
  console.log('Button clicked!')
}

Button('Click me', handleClick)
```

## TypeScript Interface

```typescript
interface ButtonProps {
  children: string | (() => string) | ComponentChild[]
  action?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger' | 'outline'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
}

// Button creation function
function Button(
  text: string, 
  action?: () => void, 
  options?: Partial<ButtonProps>
): ButtonComponent
```

## Basic Usage

```typescript
import { Button, createSignal, VStack } from '@tachui/core'

interface CounterComponentProps {
  initialValue?: number
}

function CounterComponent(props: CounterComponentProps = {}): VStack {
  const [count, setCount]: [Accessor<number>, SignalSetter<number>] = 
    createSignal(props.initialValue ?? 0)

  const handleIncrement = (): void => {
    setCount(prev => prev + 1)
  }

  const handleDecrement = (): void => {
    setCount(prev => Math.max(0, prev - 1))
  }

  const handleReset = (): void => {
    setCount(0)
  }

  return VStack({
    children: [
      Text(() => `Count: ${count()}`),
      
      Button('Increment', handleIncrement)
        .modifier
        .backgroundColor('#007AFF')
        .foregroundColor('#FFFFFF')
        .build(),
        
      Button('Decrement', handleDecrement)
        .modifier
        .backgroundColor('#FF3B30')
        .foregroundColor('#FFFFFF')
        .disabled(count() === 0)
        .build(),
        
      Button('Reset', handleReset)
        .modifier
        .variant('outline')
        .build()
    ],
    spacing: 12
  })
}
```

## CSS Framework Integration

The Button component supports CSS classes from external frameworks like Tailwind CSS and Bootstrap:

```typescript
// Tailwind CSS integration
Button('Tailwind Button', handleClick, {
  css: 'bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded shadow-lg transition-colors'
})

// Bootstrap integration
Button('Bootstrap Button', handleClick, {
  css: 'btn btn-primary btn-lg'
})

// Reactive CSS classes
const [isLoading, setLoading] = createSignal(false)

Button('Dynamic Button', () => {
  setLoading(true)
  // ... async operation
  setLoading(false)
}, {
  css: () => isLoading() 
    ? 'btn btn-primary loading opacity-50 cursor-not-allowed'
    : 'btn btn-primary hover:bg-blue-600 transition-colors'
})

// Combined with TachUI modifiers
Button('Hybrid Styling', handleClick, {
  css: 'external-framework-classes'
})
.modifier
.padding(12)
.cornerRadius(8)
.build()
```

See the [CSS Classes API Reference](/api/css-classes) for complete documentation.

## Advanced Usage

### Form Submission

```typescript
interface FormData {
  email: string
  password: string
}

interface LoginFormProps {
  onSubmit: (data: FormData) => Promise<void>
  onCancel?: () => void
}

function LoginForm(props: LoginFormProps): VStack {
  const [formData, setFormData]: [Accessor<FormData>, SignalSetter<FormData>] = 
    createSignal({ email: '', password: '' })
  const [isSubmitting, setIsSubmitting]: [Accessor<boolean>, SignalSetter<boolean>] = 
    createSignal(false)
  const [errors, setErrors]: [Accessor<string[]>, SignalSetter<string[]>] = 
    createSignal([])

  const validateForm = (): boolean => {
    const data = formData()
    const newErrors: string[] = []
    
    if (!data.email.includes('@')) {
      newErrors.push('Invalid email address')
    }
    if (data.password.length < 6) {
      newErrors.push('Password must be at least 6 characters')
    }
    
    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async (): Promise<void> => {
    if (!validateForm()) return
    
    setIsSubmitting(true)
    try {
      await props.onSubmit(formData())
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Submission failed'])
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = (): void => {
    props.onCancel?.()
  }

  return VStack({
    children: [
      // Form fields would go here...
      
      HStack({
        children: [
          Button('Cancel', handleCancel)
            .modifier
            .variant('outline')
            .disabled(isSubmitting())
            .build(),
            
          Button(
            () => isSubmitting() ? 'Submitting...' : 'Login',
            handleSubmit
          )
            .modifier
            .variant('primary')
            .disabled(isSubmitting() || errors().length > 0)
            .loading(isSubmitting())
            .build()
        ],
        spacing: 12
      })
    ],
    spacing: 16
  })
}
```

### Async Operations

```typescript
interface AsyncButtonProps {
  onAction: () => Promise<void>
  successMessage?: string
  errorHandler?: (error: Error) => void
}

function AsyncButton(props: AsyncButtonProps): Button {
  const [isLoading, setIsLoading]: [Accessor<boolean>, SignalSetter<boolean>] = 
    createSignal(false)
  const [lastResult, setLastResult]: [Accessor<'success' | 'error' | null>, SignalSetter<'success' | 'error' | null>] = 
    createSignal(null)

  const handleAction = async (): Promise<void> => {
    setIsLoading(true)
    setLastResult(null)
    
    try {
      await props.onAction()
      setLastResult('success')
      
      // Show success message briefly
      setTimeout(() => setLastResult(null), 2000)
    } catch (error) {
      setLastResult('error')
      props.errorHandler?.(error as Error)
    } finally {
      setIsLoading(false)
    }
  }

  const getButtonText = (): string => {
    if (isLoading()) return 'Processing...'
    if (lastResult() === 'success') return props.successMessage ?? 'Success!'
    if (lastResult() === 'error') return 'Try Again'
    return 'Submit'
  }

  const getVariant = (): 'primary' | 'danger' => {
    return lastResult() === 'error' ? 'danger' : 'primary'
  }

  return Button(getButtonText, handleAction)
    .modifier
    .variant(getVariant())
    .disabled(isLoading())
    .loading(isLoading())
    .build()
}
```

## Styling with Modifiers

```typescript
// Primary button
Button('Save', handleSave)
  .modifier
  .backgroundColor('#007AFF')
  .foregroundColor('#FFFFFF')
  .cornerRadius(8)
  .padding(12, 24)
  .build()

// Danger button
Button('Delete', handleDelete)
  .modifier
  .backgroundColor('#FF3B30')
  .foregroundColor('#FFFFFF')
  .fontWeight('bold')
  .build()

// Outline button
Button('Cancel', handleCancel)
  .modifier
  .border(1, '#007AFF')
  .foregroundColor('#007AFF')
  .backgroundColor('transparent')
  .build()

// Disabled state
Button('Unavailable', undefined)
  .modifier
  .disabled(true)
  .opacity(0.6)
  .build()
```

## Accessibility

```typescript
// Accessible button with proper ARIA attributes
Button('Submit Form', handleSubmit)
  .modifier
  .accessibilityLabel('Submit the contact form')
  .accessibilityHint('Double-tap to submit your information')
  .accessibilityRole('button')
  .build()

// Button with loading state
Button(
  () => isLoading() ? 'Submitting...' : 'Submit',
  handleSubmit
)
  .modifier
  .accessibilityLabel(() => isLoading() ? 'Submitting form, please wait' : 'Submit form')
  .disabled(isLoading())
  .build()
```

## Best Practices

### 1. Use Type-Safe Handlers

```typescript
// ✅ Good - Explicit typing
const handleClick = (): void => {
  console.log('Button clicked')
}

// ✅ Good - Async handling
const handleAsyncAction = async (): Promise<void> => {
  await performAsyncOperation()
}

// ❌ Avoid - Untyped handlers
const handleClick = () => {
  // TypeScript can't infer the return type
}
```

### 2. Handle Loading States

```typescript
// ✅ Good - Show loading state
Button(
  () => isLoading() ? 'Saving...' : 'Save',
  handleSave
)
  .modifier
  .disabled(isLoading())
  .build()

// ❌ Avoid - No loading feedback
Button('Save', handleSave) // User doesn't know if action is in progress
```

### 3. Provide Visual Feedback

```typescript
// ✅ Good - Clear visual hierarchy
Button('Primary Action', handlePrimary)
  .modifier
  .variant('primary')
  .build()

Button('Secondary Action', handleSecondary)
  .modifier
  .variant('outline')
  .build()
```

## Related Components

- [BasicInput](/components/basicinput) - Text input for forms
- [Toggle](/components/toggle) - Boolean selection
- [Slider](/components/slider) - Numeric input
- [Form](/components/form) - Form container