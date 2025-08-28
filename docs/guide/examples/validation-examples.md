# Validation Examples

Practical examples showing how to use TachUI's validation system effectively.

## Basic Component Validation

### Missing Required Parameters

```typescript
import { Text, Button, VStack } from '@tachui/core'

// ❌ Common errors that validation catches
Text()                    // Missing content parameter
Button()                  // Missing title parameter  
VStack()                  // Missing children parameter

// ✅ Correct usage
Text("Hello World")
Button("Click me", () => alert("Clicked!"))
VStack({ children: [
  Text("Item 1"),
  Text("Item 2")
] })
```

**Validation Output:**
```
❌ Missing Required Parameter
The Text component requires a content parameter.
💡 Suggestion: Add the missing content parameter to fix this error.

Example:
❌ Text()
✅ Text("Hello World")

📚 Documentation: https://docs.tachui.dev/components/text
```

### Incorrect Parameter Types

```typescript
// ❌ Wrong parameter types
Text(123)                 // content should be string or Signal
Button(true, "not-function") // title should be string, action should be function
VStack("not-object")      // children should be object with children array

// ✅ Correct types
Text("Hello")             // string content
Text(() => signal.value)  // function that returns string
Button("Submit", handleSubmit) // string title, function action
VStack({ children: [...] }) // object with children array
```

## Modifier Validation

### Invalid Modifier Usage

```typescript
import { Text, VStack, Button } from '@tachui/core'

// ❌ Modifiers not compatible with component
VStack({ children: [] })
  .fontSize(16)           // fontSize only works with text components
  .textAlign("center")    // textAlign only works with text components

Button("Click me")
  .src("image.jpg")       // src only works with Image components
  .placeholder("text")    // placeholder only works with input components

// ✅ Correct modifier usage
Text("Hello World")
  .fontSize(16)           // fontSize works with Text
  .textAlign("center")    // textAlign works with Text

VStack({ children: [] })
  .padding(16)            // padding works with all components
  .background("blue")     // background works with all components

Button("Click me")
  .padding(12)            // padding works with Button
  .background("green")    // background works with Button
```

**Validation Output:**
```
❌ Invalid Modifier Usage
The modifier .fontSize() does not exist or is not valid for VStack.
💡 Suggestion: Use .fontSize() on text components like Text or Button instead.

Compatible modifiers for VStack:
• Layout: padding, margin, frame, position
• Visual: background, border, shadow, opacity
• Interactive: onTap, gesture

📚 Documentation: https://docs.tachui.dev/modifiers/fontSize
```

### Incorrect Modifier Parameters

```typescript
// ❌ Wrong modifier parameters
Text("Hello")
  .clipped(true)          // clipped() takes no parameters
  .padding()              // padding() requires a parameter
  .fontSize("large")      // fontSize() expects number or valid CSS unit

// ✅ Correct modifier parameters
Text("Hello")
  .clipped()              // no parameters
  .padding(16)            // number parameter
  .fontSize(16)           // number parameter
```

## Advanced Error Recovery

### Automatic Error Recovery

```typescript
import { EnhancedValidationUtils } from '@tachui/core'

// Configure recovery strategies
EnhancedValidationUtils.configure({
  recovery: {
    enableRecovery: true,
    defaultStrategy: 'fallback'
  }
})

// Example: Component with potential errors
function MyComponent() {
  // If this fails, validation will apply recovery
  return EnhancedValidationUtils.executeWithRecovery(() => {
    // This might have errors
    return Text().fontSize(16).padding(8)
  }, {
    component: 'MyComponent',
    operation: 'render'
  })
}
```

**Recovery Strategies:**

1. **Fallback Strategy** - Provide safe defaults:
```typescript
// Error: Text() missing content
// Recovery: Text("") - empty content as fallback
```

2. **Fix Strategy** - Automatically correct simple errors:
```typescript
// Error: Text().fontSize("large") - invalid fontSize
// Recovery: Text().fontSize(16) - use default size
```

3. **Ignore Strategy** - Skip validation and continue:
```typescript
// Error: VStack().fontSize(16) - invalid modifier
// Recovery: VStack() - remove invalid modifier
```

## IDE Integration Examples

### Real-time Validation in VS Code

When typing in VS Code, you'll see:

```typescript
// Type this code in VS Code to see validation in action
import { Text, Button, VStack } from '@tachui/core'

function App() {
  return VStack({ children: [
    Text(),           // ← Red squiggle: "Missing content parameter"
    Button("Save"),   // ← Yellow squiggle: "Missing action parameter (recommended)"
    Text("Hello")
      .fontSize(16)   // ← Green: Valid
      .textShadow()   // ← Red squiggle: "textShadow modifier does not exist"
  ] })
}
```

### Quick Fixes

Position your cursor on an error and press `Ctrl+.` (Cmd+. on Mac):

```typescript
Text() // ← Cursor here, press Ctrl+.
```

**Available Quick Fixes:**
- ✅ Fix: Add content parameter → `Text("Text content")`
- ✅ Fix: Add dynamic content → `Text(() => signal.value)`  
- 📚 Learn more about Text component

### Auto-completion

Type to see intelligent suggestions:

```typescript
// Type "T" to see all components starting with T
T|  // ← Shows: Text, Toggle, TabView

// Type "Text(" to see parameter hints
Text(|  // ← Shows: content: string | Signal<string> | Function

// Type "Text('Hello')." to see available modifiers
Text("Hello").|  // ← Shows: fontSize, padding, background, etc.
```

### Hover Documentation

Hover over any component or modifier to see documentation:

```typescript
Text("Hello")     // ← Hover shows Text component docs
  .fontSize(16)   // ← Hover shows fontSize modifier docs
  .padding(8)     // ← Hover shows padding modifier docs
```

## Debugging Examples

### Real-time Debugging Session

```typescript
import { ValidationDebugUtils, AdvancedDebuggingUtils } from '@tachui/core'

// Start a debugging session
const sessionId = ValidationDebugUtils.startSession('Feature Development')
console.log('Debug session started:', sessionId)

function MyApp() {
  // Take a snapshot before rendering
  AdvancedDebuggingUtils.takeSnapshot('app-component', {
    type: 'VStack',
    props: { children: [] },
    state: { loading: false },
    modifiers: ['padding', 'background']
  })

  return VStack({ children: [
    Text("Welcome")
      .fontSize(24)     // ← This will be tracked
      .padding(16),     // ← This will be tracked
    
    Button("Get Started", handleClick)
      .background("blue") // ← This will be tracked
  ] })
}

// Later, stop the session and get insights
const session = ValidationDebugUtils.stopSession()
console.log('Validation errors:', session.summary.totalErrors)
console.log('Performance impact:', session.summary.averageValidationTime)
```

### Visual Debugging Overlays

```typescript
import { AdvancedDebuggingUtils } from '@tachui/core'

// Add visual highlighting for validation errors
function ComponentWithError() {
  // This component has validation issues
  const component = VStack({ children: [] }).fontSize(16) // Invalid modifier
  
  // Add visual overlay to highlight the error
  AdvancedDebuggingUtils.addVisualOverlay(
    'error-highlight',
    { x: 0, y: 0, width: 200, height: 100 },
    { 
      label: 'Invalid fontSize on VStack', 
      duration: 5000,
      color: 'red'
    }
  )
  
  return component
}
```

### Performance Monitoring

```typescript
import { PerformanceOptimizationUtils } from '@tachui/core'

// Monitor validation performance
function ExpensiveComponent() {
  return PerformanceOptimizationUtils.measureValidation(() => {
    // Complex component with many children
    return VStack({ children: [
      ...Array.from({ length: 100 }, (_, i) => 
        Text(`Item ${i}`)
          .fontSize(14)
          .padding(4)
          .margin(2)
      )
    ] })
  }, 'expensive-component-render')
}

// Check performance stats
const stats = PerformanceOptimizationUtils.getStats()
console.log('Validation overhead:', stats.overhead + '%')
console.log('Average execution time:', stats.averageExecutionTime + 'ms')
```

## Error Recovery Examples

### Component-Level Recovery

```typescript
import { EnhancedValidationUtils } from '@tachui/core'

function SafeText({ content, fallback = "Default text" }) {
  return EnhancedValidationUtils.executeWithRecovery(() => {
    // Try to create Text with provided content
    return Text(content).fontSize(16)
  }, {
    component: 'SafeText',
    operation: 'render',
    fallback: () => Text(fallback)
  })
}

// Usage
SafeText({ content: null })        // ← Uses fallback: "Default text"
SafeText({ content: undefined })   // ← Uses fallback: "Default text"  
SafeText({ content: "Hello" })     // ← Works normally: "Hello"
```

### Form Validation with Recovery

```typescript
import { TextField, Button, VStack } from '@tachui/core'
import { EnhancedValidationUtils } from '@tachui/core'

function LoginForm() {
  const [email, setEmail] = createSignal("")
  const [password, setPassword] = createSignal("")
  
  return EnhancedValidationUtils.executeWithRecovery(() => {
    return VStack({ children: [
      TextField({
        value: email,
        onInput: setEmail,
        placeholder: "Email"
      }).validateEmail(),  // ← Custom validator might fail
      
      TextField({
        value: password,
        onInput: setPassword,
        placeholder: "Password",
        type: "password"
      }).minLength(8),     // ← Custom validator might fail
      
      Button("Login", handleLogin)
        .disabled(email() === "" || password() === "")
    ] })
  }, {
    component: 'LoginForm',
    operation: 'render',
    strategy: 'fallback'
  })
}
```

## Custom Error Templates

### Creating Custom Templates

```typescript
import { DeveloperExperienceUtils } from '@tachui/core'

// Create a custom error template
const customTemplate = {
  id: 'custom-accessibility-warning',
  title: 'Accessibility Warning',
  description: 'Component may not be accessible to screen readers',
  severity: 'warning' as const,
  category: 'accessibility' as const,
  emoji: '♿',
  quickFix: 'Add accessibility attributes',
  suggestions: [
    {
      title: 'Add aria-label',
      description: 'Provide a descriptive label for screen readers',
      difficulty: 'beginner' as const,
      confidence: 0.9,
      estimatedTime: 2,
      canAutoFix: true,
      before: 'Button("🔍")',
      after: 'Button("🔍").ariaLabel("Search")',
      explanation: 'Screen readers need text descriptions for icon buttons',
      learnMoreUrl: 'https://docs.tachui.dev/accessibility'
    }
  ],
  examples: {
    wrong: [
      { code: 'Button("🔍")', description: 'Icon button without label' },
      { code: 'Image("/photo.jpg")', description: 'Image without alt text' }
    ],
    correct: [
      { code: 'Button("🔍").ariaLabel("Search")', description: 'Icon button with label' },
      { code: 'Image("/photo.jpg").alt("Profile photo")', description: 'Image with alt text' }
    ]
  },
  documentation: {
    primary: 'https://docs.tachui.dev/accessibility',
    related: [
      'https://docs.tachui.dev/components/button#accessibility',
      'https://docs.tachui.dev/modifiers/aria-label'
    ]
  }
}

// Register the template
DeveloperExperienceUtils.addErrorTemplate(customTemplate)
```

### Using Custom Templates

```typescript
// Now when this error occurs, your custom template will be used
function IconButton() {
  return Button("🔍") // ← Will show custom accessibility warning
}
```

## Testing with Validation

### Unit Tests with Strict Validation

```typescript
import { describe, it, expect } from 'vitest'
import { ValidationSetup, Text, Button } from '@tachui/core'

describe('Component Tests', () => {
  beforeEach(() => {
    // Enable strict validation for testing
    ValidationSetup.testing()
  })

  it('should validate Text component correctly', () => {
    // ✅ This should work
    expect(() => Text("Hello World")).not.toThrow()
    
    // ❌ This should throw in testing mode
    expect(() => Text()).toThrow('Missing required content parameter')
  })

  it('should validate modifier usage', () => {
    // ✅ This should work
    expect(() => Text("Hello").fontSize(16)).not.toThrow()
    
    // ❌ This should throw in testing mode
    expect(() => 
      VStack({ children: [] }).fontSize(16)
    ).toThrow('fontSize modifier is not compatible with VStack')
  })
})
```

### Integration Tests with Recovery

```typescript
import { EnhancedValidationUtils } from '@tachui/core'

describe('Error Recovery Tests', () => {
  it('should recover from validation errors gracefully', () => {
    EnhancedValidationUtils.configure({
      recovery: { enableRecovery: true, defaultStrategy: 'fallback' }
    })

    const result = EnhancedValidationUtils.executeWithRecovery(() => {
      // This has validation errors but should recover
      return Text().fontSize(16)
    }, { component: 'TestComponent' })

    expect(result.success).toBe(true)
    expect(result.recoveryApplied).toBe(true)
    expect(result.strategy).toBe('fallback')
  })
})
```

## Production Optimization

### Zero-Overhead Production Build

```typescript
// In production, validation is completely bypassed
import { ValidationSetup } from '@tachui/core'

if (process.env.NODE_ENV === 'production') {
  // Automatically enables zero-overhead mode
  ValidationSetup.production()
  
  // All validation code is tree-shaken out
  // No runtime performance impact
}

// Your components work exactly the same
function App() {
  return Text("Hello World")  // No validation overhead in production
    .fontSize(16)              // No validation overhead in production
    .padding(8)                // No validation overhead in production
}
```

### Build-time Validation Only

```typescript
// tachui.config.js
export default {
  validation: {
    // Catch errors at build time, skip runtime validation
    enabled: true,           // Build-time validation
    runtime: false,          // No runtime validation
    errorLevel: 'error'      // Fail build on validation errors
  }
}
```

## Advanced Configuration

### Team Configuration

```typescript
// tachui.config.js - Shared team configuration
export default {
  validation: {
    enabled: true,
    strictMode: true,        // Enable additional strict checks
    errorLevel: 'error',     // Fail builds on validation errors
    
    // Custom rules for team standards
    customRules: [
      {
        name: 'consistent-button-sizing',
        validate: (component) => {
          if (component.type === 'Button') {
            // Enforce team button sizing standards
            return validateTeamButtonStandards(component)
          }
        }
      }
    ],
    
    // Exclude generated files
    excludeFiles: [
      'src/**/*.generated.ts',
      'node_modules/**/*'
    ]
  }
}
```

### Environment-Specific Configuration

```typescript
import { EnhancedValidationUtils, IDEIntegrationUtils } from '@tachui/core'

// Development environment
if (process.env.NODE_ENV === 'development') {
  EnhancedValidationUtils.configure({
    enabled: true,
    recovery: { enableRecovery: true, defaultStrategy: 'fallback' },
    reporting: { enhancedMessages: true, reportToConsole: true }
  })
  
  IDEIntegrationUtils.configure({
    enableRealTimeDiagnostics: true,
    diagnosticDelay: 300,
    maxDiagnostics: 50
  })
}

// Testing environment  
if (process.env.NODE_ENV === 'test') {
  EnhancedValidationUtils.configure({
    enabled: true,
    recovery: { enableRecovery: false, defaultStrategy: 'throw' },
    reporting: { enhancedMessages: true, reportToConsole: false }
  })
}

// Production environment
if (process.env.NODE_ENV === 'production') {
  // Validation is automatically disabled
  // Zero runtime overhead
}
```

This comprehensive set of examples shows how to effectively use TachUI's validation system in real-world scenarios, from basic component validation to advanced debugging and performance optimization.