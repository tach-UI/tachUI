# Stepper

A SwiftUI-inspired stepper component for numeric input with increment and decrement controls. Provides bounded value adjustment with customizable step intervals and formatting.

## Overview

The `Stepper` component offers precise numeric control through dedicated +/- buttons, making it ideal for bounded value inputs like quantities, ratings, and settings. It follows SwiftUI patterns with comprehensive accessibility and responsive design.

## Basic Usage

```typescript
import { Stepper } from '@tachui/advanced-forms'
import { createSignal } from '@tachui/core'

function BasicExample() {
  const [quantity, setQuantity] = createSignal(1)

  return Stepper({
    title: "Quantity",
    value: quantity,
    minimumValue: 1,
    maximumValue: 10,
    onChange: (newValue) => {
      console.log("New quantity:", newValue)
    }
  }).build()
}
```

## API Reference

### StepperProps

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `Signal<number> \\| number` | **Required** | Current numeric value |
| `title` | `string` | `undefined` | Label text for the stepper |
| `minimumValue` | `number` | `-Infinity` | Minimum allowed value |
| `maximumValue` | `number` | `Infinity` | Maximum allowed value |
| `step` | `number` | `1` | Increment/decrement amount |
| `onIncrement` | `() => void` | `undefined` | Custom increment action |
| `onDecrement` | `() => void` | `undefined` | Custom decrement action |
| `onChange` | `(value: number) => void` | `undefined` | Value change callback |
| `onEditingChanged` | `(editing: boolean) => void` | `undefined` | Editing state callback |
| `disabled` | `boolean \\| Signal<boolean>` | `false` | Whether stepper is disabled |
| `allowsEmptyValue` | `boolean` | `false` | Allow empty/null values |
| `displayValueInLabel` | `boolean` | `true` | Show value in label text |
| `valueFormatter` | `(value: number) => string` | Default formatter | Custom value display format |
| `accessibilityLabel` | `string` | `undefined` | ARIA label for accessibility |
| `accessibilityHint` | `string` | `undefined` | ARIA description |
| `incrementAccessibilityLabel` | `string` | `"Increment"` | Increment button label |
| `decrementAccessibilityLabel` | `string` | `"Decrement"` | Decrement button label |

## Value Binding

### Signal Binding (Recommended)
Automatic two-way binding with reactive updates:

```typescript
function SignalBindingExample() {
  const [count, setCount] = createSignal(0)

  return VStack({
    children: [
      Text(`Current count: ${count()}`),
      
      Stepper({
        title: "Count",
        value: count, // Automatic binding
        minimumValue: 0,
        maximumValue: 100
      }).build()
    ]
  }).build()
}
```

### Custom Actions
Override default increment/decrement behavior:

```typescript
function CustomActionsExample() {
  const [value, setValue] = createSignal(50)

  return Stepper({
    title: "Custom Control",
    value,
    onIncrement: () => {
      setValue(prev => Math.min(prev + 10, 100))
      console.log("Custom increment by 10")
    },
    onDecrement: () => {
      setValue(prev => Math.max(prev - 10, 0))
      console.log("Custom decrement by 10")
    }
  }).build()
}
```

## Step Configuration

### Basic Step Intervals
Control increment/decrement amounts:

```typescript
// Integer steps
Stepper({
  title: "Quantity",
  value: quantity,
  step: 1 // Default
}).build()

// Larger steps  
Stepper({
  title: "Volume",
  value: volume,
  step: 10,
  minimumValue: 0,
  maximumValue: 100
}).build()

// Decimal steps
Stepper({
  title: "Rating",
  value: rating,
  step: 0.5,
  minimumValue: 0,
  maximumValue: 5
}).build()
```

### Dynamic Steps
Adjust step size based on current value:

```typescript
function DynamicStepExample() {
  const [price, setPrice] = createSignal(10.00)

  const dynamicStep = createComputed(() => {
    const current = price()
    if (current < 10) return 0.50      // Small increments for low values
    if (current < 100) return 1.00     // Medium increments
    return 5.00                        // Large increments for high values
  })

  return Stepper({
    title: "Smart Price",
    value: price,
    step: dynamicStep(),
    minimumValue: 0,
    valueFormatter: (val) => `$${val.toFixed(2)}`
  }).build()
}
```

## Value Formatting

### Built-in Formatting
Numbers are automatically formatted with appropriate decimal places:

```typescript
Stepper({
  title: "Default Formatting",
  value: value // Displays integers as "5", decimals as "3.14"
}).build()
```

### Custom Formatters
Create specialized display formats:

```typescript
// Percentage formatter
Stepper({
  title: "Progress",
  value: progress,
  minimumValue: 0,
  maximumValue: 100,
  valueFormatter: (val) => `${val}%`
}).build()

// Currency formatter
Stepper({
  title: "Price",
  value: price,
  step: 0.01,
  valueFormatter: (val) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(val)
}).build()

// Rating formatter
Stepper({
  title: "Rating",
  value: rating,
  step: 0.5,
  minimumValue: 0,
  maximumValue: 5,
  valueFormatter: (val) => `${val}/5 ⭐`
}).build()
```

## Bounds and Validation

### Range Constraints
Prevent out-of-bounds values automatically:

```typescript
function BoundsExample() {
  const [age, setAge] = createSignal(25)

  return Stepper({
    title: "Age",
    value: age,
    minimumValue: 0,   // Cannot be negative
    maximumValue: 120, // Reasonable upper limit
    onChange: (newAge) => {
      console.log(`Age updated to: ${newAge}`)
      // Value is automatically constrained to [0, 120]
    }
  }).build()
}
```

### Button State Management
Buttons automatically disable when bounds are reached:

```typescript
function BoundaryStatesExample() {
  const [volume, setVolume] = createSignal(50)

  return VStack({
    children: [
      Text(`Volume: ${volume()}/100`),
      
      Stepper({
        value: volume,
        minimumValue: 0,
        maximumValue: 100,
        step: 10
      }).build(),
      
      // Buttons will automatically disable at bounds:
      // - Decrement disabled when volume = 0
      // - Increment disabled when volume = 100
    ]
  }).build()
}
```

## StepperUtils

Pre-configured Stepper setups for common use cases:

### Quantity Stepper
For shopping carts and item quantities:

```typescript
import { StepperUtils } from '@tachui/advanced-forms'

function QuantityExample() {
  const [quantity, setQuantity] = createSignal(1)

  return Stepper({
    ...StepperUtils.quantity(quantity, (newQuantity) => {
      console.log(`Quantity changed to: ${newQuantity}`)
      setQuantity(newQuantity)
    })
  }).build()
  
  // Pre-configured: range 1-99, step 1, "Quantity" title
}
```

### Age Input
For user profiles and forms:

```typescript
function AgeExample() {
  const [age, setAge] = createSignal(18)

  return Stepper({
    ...StepperUtils.age(age, (newAge) => {
      updateProfile({ age: newAge })
    })
  }).build()
  
  // Pre-configured: range 0-120, step 1, "Age" title
}
```

### Percentage Control
For progress bars and settings:

```typescript
function PercentageExample() {
  const [completion, setCompletion] = createSignal(75)

  return Stepper({
    ...StepperUtils.percentage(completion, (percent) => {
      updateProgress(percent)
    })
  }).build()
  
  // Pre-configured: range 0-100%, step 1, "75%" formatting
}
```

### Rating Input
For reviews and feedback:

```typescript
function RatingExample() {
  const [rating, setRating] = createSignal(4.0)

  return Stepper({
    ...StepperUtils.rating(rating, 5, 0.5, (newRating) => {
      submitRating(newRating)
    })
  }).build()
  
  // Pre-configured: range 0-5, step 0.5, "4.0/5" formatting
}
```

### Price Input
For e-commerce and financial apps:

```typescript
function PriceExample() {
  const [price, setPrice] = createSignal(19.99)

  return Stepper({
    ...StepperUtils.price(price, '$', 0.01, 999.99, (newPrice) => {
      updateProductPrice(newPrice)
    })
  }).build()
  
  // Pre-configured: range $0.00-$999.99, step $0.01, "$19.99" formatting
}
```

### Font Size Control
For typography and accessibility settings:

```typescript
function FontSizeExample() {
  const [fontSize, setFontSize] = createSignal(16)

  return Stepper({
    ...StepperUtils.fontSize(fontSize, (newSize) => {
      updateTextSize(newSize)
    })
  }).build()
  
  // Pre-configured: range 8-72pt, step 1, "16pt" formatting
}
```

## Interactive Features

### Long Press Support
Hold buttons for continuous increment/decrement:

```typescript
function LongPressExample() {
  const [value, setValue] = createSignal(50)

  return Stepper({
    title: "Hold to adjust quickly",
    value,
    step: 1,
    onEditingChanged: (isEditing) => {
      if (isEditing) {
        console.log("Started long press - continuous adjustment")
      } else {
        console.log("Ended long press")
      }
    }
  }).build()
  
  // Users can:
  // - Tap for single increment/decrement
  // - Hold for continuous adjustment
}
```

### Keyboard Navigation
Full keyboard accessibility:

```typescript
function KeyboardExample() {
  const [value, setValue] = createSignal(25)

  return Stepper({
    title: "Keyboard accessible",
    value,
    accessibilityHint: "Use Tab to navigate, Enter or Space to activate buttons"
  }).build()
  
  // Keyboard support:
  // - Tab/Shift+Tab: Navigate between buttons
  // - Enter/Space: Activate focused button  
  // - Mouse/touch: Click/tap buttons
}
```

## Form Integration

### Shopping Cart Example
Real-world usage in product listings:

```typescript
function ShoppingCartItem({ product }) {
  const [quantity, setQuantity] = createSignal(product.quantity)

  const updateCartQuantity = (newQuantity: number) => {
    setQuantity(newQuantity)
    updateCart(product.id, newQuantity)
  }

  return HStack({
    children: [
      Image({ src: product.image }).build(),
      
      VStack({
        children: [
          Text(product.name),
          Text(`$${product.price.toFixed(2)}`),
        ]
      }).build(),
      
      Spacer().build(),
      
      Stepper({
        ...StepperUtils.quantity(quantity, updateCartQuantity)
      }).build(),
      
      Text(`Total: $${(product.price * quantity()).toFixed(2)}`)
    ]
  }).build()
}
```

### Settings Panel
Configuration interface example:

```typescript
function SettingsPanel() {
  const [fontSize, setFontSize] = createSignal(16)
  const [volume, setVolume] = createSignal(75)
  const [brightness, setBrightness] = createSignal(50)

  return VStack({
    children: [
      Text("Display Settings")
        .modifier
        .fontSize(20)
        .fontWeight('bold')
        .build(),
      
      Stepper({
        ...StepperUtils.fontSize(fontSize, setFontSize)
      }).build(),
      
      Stepper({
        title: "Volume",
        value: volume,
        minimumValue: 0,
        maximumValue: 100,
        step: 5,
        valueFormatter: (val) => `${val}%`,
        onChange: setVolume
      }).build(),
      
      Stepper({
        title: "Brightness", 
        value: brightness,
        minimumValue: 10,
        maximumValue: 100,
        step: 10,
        valueFormatter: (val) => `${val}%`,
        onChange: setBrightness
      }).build()
    ]
  })
  .modifier
  .gap(16)
  .padding(20)
  .build()
}
```

## Accessibility

### ARIA Labels and Descriptions
Provide clear accessibility information:

```typescript
Stepper({
  title: "Product Rating",
  value: rating,
  accessibilityLabel: "Product rating out of 5 stars",
  accessibilityHint: "Use increment and decrement buttons to adjust rating",
  incrementAccessibilityLabel: "Increase rating",
  decrementAccessibilityLabel: "Decrease rating"
}).build()
```

### Screen Reader Support
Steppers announce:
- Current value changes
- When buttons become enabled/disabled
- Descriptive labels for all interactions
- Value formatting (e.g., "75 percent" for 75%)

### Keyboard Navigation
- **Tab/Shift+Tab**: Move focus between stepper buttons
- **Enter/Space**: Activate focused button
- **Mouse/Touch**: Direct button interaction
- **Long Press**: Continuous value adjustment

## Styling with Modifiers

Customize appearance with the TachUI modifier system:

```typescript
Stepper({
  title: "Styled Stepper",
  value: value
})
.modifier
.padding(16)
.backgroundColor('#F8F9FA')
.border('2px solid #007AFF')
.cornerRadius(12)
.shadow({ x: 0, y: 2, radius: 8, color: 'rgba(0,0,0,0.1)' })
.build()
```

## Custom Theming

Create custom Stepper themes:

```typescript
import { StepperStyles } from '@tachui/advanced-forms'

const customTheme = StepperStyles.createTheme({
  colors: {
    ...StepperStyles.theme.colors,
    buttonText: '#FF6B6B',
    buttonBackground: '#FFF5F5',
    focusRing: '#FF6B6B'
  },
  spacing: {
    ...StepperStyles.theme.spacing,
    buttonSize: 36,
    gap: 12
  },
  typography: {
    ...StepperStyles.theme.typography,
    buttonSize: 20,
    buttonWeight: '700'
  }
})

// Apply custom theme in your app
```

## Best Practices

### 1. Choose Appropriate Ranges
Set reasonable bounds for user context:

```typescript
// Good - Reasonable bounds for context
Stepper({
  title: "Age",
  value: age,
  minimumValue: 0,
  maximumValue: 120 // Realistic human age limit
})

// Good - Product quantity limits
Stepper({
  title: "Quantity", 
  value: quantity,
  minimumValue: 1,
  maximumValue: 99 // Prevent excessive orders
})

// Avoid - Unbounded ranges for UI elements
Stepper({
  title: "Unlimited", // Can cause performance issues
  value: value
  // No bounds - user could create unusably large/small values
})
```

### 2. Use Appropriate Step Sizes
Match step size to value context:

```typescript
// Good - Context-appropriate steps
Stepper({
  title: "Volume",
  value: volume,
  step: 5, // 5% increments feel natural
  minimumValue: 0,
  maximumValue: 100
})

Stepper({
  title: "Price",
  value: price,
  step: 0.01, // Penny precision for currency
  valueFormatter: (val) => `$${val.toFixed(2)}`
})

// Avoid - Inappropriate step sizes
Stepper({
  title: "Rating",
  value: rating,
  step: 0.01, // Too precise for ratings
  minimumValue: 0,
  maximumValue: 5
})
```

### 3. Provide Clear Value Formatting
Help users understand what values represent:

```typescript
// Good - Clear, descriptive formatting
Stepper({
  title: "Font Size",
  value: fontSize,
  valueFormatter: (val) => `${val}pt`
})

Stepper({
  title: "Discount",
  value: discount,
  valueFormatter: (val) => `${val}% off`
})

// Avoid - Ambiguous raw numbers
Stepper({
  title: "Setting", // What does the number mean?
  value: setting,
  // No formatter - user sees raw number without context
})
```

### 4. Consider Mobile Usability
Ensure buttons are touch-friendly:

```typescript
// Stepper automatically provides:
// - 32px minimum button size (touch-friendly)
// - Long press for continuous adjustment
// - Proper spacing between buttons
// - Touch action optimization

// For smaller interfaces, consider alternatives:
TextField({
  title: "Precise Value",
  value: preciseValue,
  type: "number"
}) // Better for precise numeric entry
```

### 5. Handle Edge Cases
Provide sensible defaults and error handling:

```typescript
function RobustStepper() {
  const [value, setValue] = createSignal(10)

  return Stepper({
    title: "Robust Example",
    value,
    minimumValue: 0,
    maximumValue: 100,
    step: 1,
    onChange: (newValue) => {
      // Validate and handle the change
      if (isNaN(newValue)) {
        console.warn("Invalid value received")
        return
      }
      
      setValue(newValue)
      saveUserPreference('setting', newValue)
    },
    // Provide fallback formatting
    valueFormatter: (val) => {
      try {
        return val.toFixed(0)
      } catch {
        return "0" // Fallback for invalid values
      }
    }
  }).build()
}
```

## Performance Considerations

- Stepper components are optimized for smooth interactions
- Long press uses efficient interval timing (100ms updates)
- Value changes are debounced during continuous adjustment
- Reactive updates only re-render necessary elements

## Browser Support

Stepper uses modern web standards with graceful degradation:
- **Button elements**: Full accessibility support (all browsers)
- **Touch events**: iOS Safari 3+, Android 2.1+
- **Long press**: Custom implementation works on all modern browsers
- **ARIA attributes**: IE11+ for full screen reader support

---

## Related Components

- [**TextField**](./textfield.md) - Direct numeric input for precise values
- [**Slider**](./slider.md) - Continuous value adjustment with visual feedback
- [**Toggle**](./toggle.md) - Boolean input controls with similar interaction patterns