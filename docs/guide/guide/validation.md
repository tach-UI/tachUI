# Validation System

TachUI includes a comprehensive validation system that catches errors early, provides intelligent suggestions, and enhances your development experience. The system works at both build-time and runtime to ensure your components are used correctly.

## Overview

The validation system provides:

- **Real-time error detection** - Catch component and modifier errors as you type
- **Intelligent fix suggestions** - Get actionable suggestions to resolve issues quickly
- **IDE integration** - Rich IntelliSense, hover information, and quick fixes in VS Code
- **Build-time validation** - Prevent invalid code from reaching production
- **Smart error recovery** - Continue development even when errors occur
- **Performance optimization** - Zero overhead in production builds

## Quick Start

Validation is **automatically enabled** when you import tachUI components. No setup required!

```typescript
import { Text, Button, VStack } from '@tachui/core'

// ❌ This will show a validation error
Text() // Missing required content parameter

// ✅ This is valid
Text("Hello World")

// ❌ This will show a warning  
Button("Click me") // Missing action parameter (recommended)

// ✅ This is better
Button("Click me", () => console.log("Clicked!"))
```

## Development Modes

### Automatic Mode (Recommended)

Validation automatically adapts to your environment:

- **Development**: Full validation with helpful error messages
- **Production**: Zero overhead - validation is completely bypassed
- **Testing**: Strict validation to catch all issues

### Manual Configuration

For advanced use cases, you can configure validation manually:

```typescript
import { ValidationSetup } from '@tachui/core'

// Development mode with full features
ValidationSetup.development()

// Production mode with zero overhead
ValidationSetup.production()

// Testing mode with strict validation
ValidationSetup.testing()
```

## IDE Integration

### VS Code Setup

The validation system includes built-in VS Code integration:

1. **Real-time diagnostics** - Errors appear with red squiggles
2. **Hover information** - Detailed component and modifier documentation
3. **Auto-completion** - Smart suggestions based on context
4. **Quick fixes** - One-click error resolution

**Setup**: No additional setup required! The integration works automatically when you import tachUI.

### IntelliSense Features

- **Component completion** - Get suggestions for available components
- **Modifier completion** - Only shows modifiers compatible with your component
- **Parameter hints** - See required and optional parameters
- **Documentation on hover** - Instant access to component docs

```typescript
// Type "T" to see Text, Toggle, etc.
T|

// Hover over "Text" to see documentation
Text("Hello")

// Type ".p" after Text to see padding, position, etc.
Text("Hello").p|
```

## Error Types and Solutions

### Missing Required Parameters

**Error**: Component requires a parameter
```typescript
// ❌ Error
Text()

// ✅ Fix
Text("Hello World")
```

**Auto-fix available**: Click the lightbulb or use `Ctrl+.` (Cmd+. on Mac)

### Invalid Modifier Usage

**Error**: Modifier not compatible with component
```typescript
// ❌ Error: fontSize doesn't work on VStack
VStack({ children: [] }).fontSize(16)

// ✅ Fix: Apply fontSize to text components inside
VStack({ 
  children: [
    Text("Hello").fontSize(16)
  ] 
})
```

### Incorrect Modifier Parameters

**Error**: Modifier called with wrong parameters
```typescript
// ❌ Error: clipped() takes no parameters
Text("Hello").clipped(true)

// ✅ Fix: Remove the parameter
Text("Hello").clipped()
```

## Error Recovery

When validation errors occur, the system can automatically recover:

### Recovery Strategies

1. **Ignore** - Skip validation and continue
2. **Fallback** - Use safe default values
3. **Fix** - Automatically correct simple errors
4. **Throw** - Stop execution (testing mode)

### Example Recovery

```typescript
// If this has an error, the system might:
Text().fontSize(16)

// 1. Fallback: Text("") - provide empty content
// 2. Fix: Text("Text content") - suggest content
// 3. Ignore: Render anyway and log warning
```

## Debugging Tools

### Real-time Inspector

Monitor validation in real-time:

```typescript
import { ValidationDebugUtils } from '@tachui/core'

// Start a debugging session
const sessionId = ValidationDebugUtils.startSession()

// Take component snapshots
ValidationDebugUtils.takeSnapshot('my-component', {
  type: 'Text',
  props: { content: 'Hello' },
  modifiers: ['fontSize', 'padding']
})

// Get validation trends
const trends = ValidationDebugUtils.getValidationTrends()
console.log('Error rate:', trends.errorRate)
```

### Visual Debugging

Enable visual overlays to see validation issues:

```typescript
import { AdvancedDebuggingUtils } from '@tachui/core'

// Add visual error highlights
AdvancedDebuggingUtils.addVisualOverlay(
  'error-highlight',
  { x: 10, y: 20, width: 100, height: 50 },
  { label: 'Validation Error', duration: 3000 }
)
```

## Performance

### Development Performance

The validation system is optimized for minimal impact:

- **Target**: <5% overhead in development
- **Caching**: Intelligent result caching
- **Lazy validation**: Only validate when needed

### Production Performance

- **Zero overhead**: Validation is completely disabled in production builds
- **Tree shaking**: Validation code is removed from production bundles
- **No runtime cost**: Validation logic doesn't run in production

### Performance Monitoring

```typescript
import { PerformanceOptimizationUtils } from '@tachui/core'

// Get performance stats
const stats = PerformanceOptimizationUtils.getStats()
console.log('Validation overhead:', stats.overhead)
console.log('Cache hit rate:', stats.cacheHitRate)
```

## Configuration

### Runtime Configuration

```typescript
import { EnhancedValidationUtils } from '@tachui/core'

EnhancedValidationUtils.configure({
  enabled: true,
  recovery: {
    enableRecovery: true,
    defaultStrategy: 'fallback', // 'ignore' | 'fallback' | 'fix' | 'throw'
    maxRetries: 3
  },
  lifecycle: {
    validateOnMount: true,
    validateOnUpdate: false,
    detectMemoryLeaks: true
  },
  reporting: {
    enhancedMessages: true,
    reportToConsole: true,
    logLevel: 'error' // 'error' | 'warn' | 'info'
  }
})
```

### IDE Configuration

```typescript
import { IDEIntegrationUtils } from '@tachui/core'

IDEIntegrationUtils.configure({
  enableRealTimeDiagnostics: true,
  enableAutoComplete: true,
  enableQuickFixes: true,
  diagnosticDelay: 500, // ms
  maxDiagnostics: 100
})
```

### Build-time Configuration

Create a `tachui.config.js` file (optional):

```javascript
export default {
  validation: {
    enabled: true,           // Enable/disable validation
    strictMode: false,       // Additional strict checks
    errorLevel: 'error',     // 'error' | 'warn' | 'info'
    excludeFiles: [],        // Files to exclude
    customRules: []          // Custom validation rules
  }
}
```

## Advanced Features

### Custom Error Templates

Create custom error messages:

```typescript
import { DeveloperExperienceUtils } from '@tachui/core'

const customTemplate = {
  id: 'my-custom-error',
  title: 'Custom Validation Error',
  description: 'This is a custom error message',
  severity: 'error',
  suggestions: [
    {
      title: 'Fix this issue',
      description: 'Here\'s how to fix it',
      confidence: 0.9,
      canAutoFix: true
    }
  ]
}

// Register custom template
DeveloperExperienceUtils.addErrorTemplate(customTemplate)
```

### Documentation Integration

Get contextual documentation:

```typescript
import { DocumentationIntegrationUtils } from '@tachui/core'

// Get documentation for an error
const docs = DocumentationIntegrationUtils.getContextualDocumentation({
  component: 'Text',
  errorType: 'missing-required-prop',
  userLevel: 'beginner'
})

console.log('Primary docs:', docs.primary)
console.log('Related resources:', docs.related)
console.log('Quick help:', docs.quickHelp)
```

### Session Export

Export debugging sessions for analysis:

```typescript
import { AdvancedDebuggingUtils } from '@tachui/core'

// Start session and capture data
const sessionId = AdvancedDebuggingUtils.startSession('Debug Session')
// ... do development work ...
const session = AdvancedDebuggingUtils.stopSession()

// Export in different formats
const jsonData = AdvancedDebuggingUtils.exportSessionData(session, 'json')
const csvData = AdvancedDebuggingUtils.exportSessionData(session, 'csv')
const htmlReport = AdvancedDebuggingUtils.exportSessionData(session, 'html')
```

## Troubleshooting

### Common Issues

**Q: Validation errors in valid code**
A: Check for typos in component or modifier names. Use IDE auto-completion to avoid errors.

**Q: Performance issues in development**
A: Validation overhead should be <5%. If higher, try reducing diagnostic frequency or disabling real-time validation.

**Q: Missing IDE features**
A: Ensure you're using a TypeScript project and tachUI is properly imported.

**Q: Validation not working**
A: Check that you're importing from `@tachui/core` and not in production mode.

### Debug Commands

```typescript
import { ValidationDevTools } from '@tachui/core'

// Test the validation system
ValidationDevTools.test()

// Get comprehensive stats
const stats = ValidationDevTools.getStats()
console.log(stats)

// Log all validation rules
ValidationDevTools.logValidationRules()
```

### Environment Variables

```bash
# Disable validation (not recommended)
TACHUI_VALIDATION=false npm run dev

# Force production mode
NODE_ENV=production npm run build

# Enable debug logging
TACHUI_DEBUG=true npm run dev
```

## Best Practices

### Development Workflow

1. **Let validation guide you** - Pay attention to validation errors and suggestions
2. **Use auto-fixes** - Click lightbulbs or use quick fixes for fast resolution
3. **Check hover documentation** - Get instant help without leaving your editor
4. **Review error patterns** - Use debugging tools to identify common mistakes

### Team Setup

1. **Share configuration** - Commit `tachui.config.js` for consistent team validation
2. **Use strict mode** - Enable in CI/CD to catch all issues
3. **Export debugging sessions** - Share complex debugging scenarios with team members
4. **Document custom rules** - If using custom validation rules, document them for the team

### Performance Tips

1. **Use caching** - Let the system cache validation results
2. **Limit diagnostics** - Don't set `maxDiagnostics` too high
3. **Exclude large files** - Use `excludeFiles` for generated or vendor code
4. **Monitor overhead** - Use performance tools to track validation impact

## API Reference

For detailed API documentation, see [Validation API Reference](../api/validation.md).

## Examples

For practical examples and use cases, see [Validation Examples](../examples/validation-examples.md).