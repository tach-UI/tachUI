# Security System

TachUI provides a comprehensive security system with feature flags that allows gradual rollout of security features while maintaining backward compatibility.

## Overview

The security system protects against common vulnerabilities in plugin systems:

- **Code Injection** - Arbitrary JavaScript execution through plugins
- **XSS Attacks** - Cross-site scripting through user input
- **Unsafe Service Registry** - Unrestricted function execution
- **DOM Pollution** - Malicious component rendering
- **Missing Input Sanitization** - Form and user data vulnerabilities

## Feature Flags

All security features are controlled by feature flags, allowing you to enable them gradually:

| Feature Flag | Default | Purpose |
|-------------|---------|---------|
| `PLUGIN_CODE_SIGNING` | **OFF** | Require cryptographically signed plugins |
| `WEBWORKER_SANDBOX` | **OFF** | Isolate plugin execution in WebWorkers |
| `STRICT_INPUT_SANITIZATION` | **ON** | Enhanced input validation and XSS protection |
| `CSP_HEADERS` | **OFF** | Apply Content Security Policy headers |
| `CAPABILITY_PERMISSIONS` | **OFF** | Capability-based permission system |
| `SECURITY_DEV_MODE` | **ON** | Show security warnings during development |

## Quick Start

### Basic Security (Recommended Starting Point)

```typescript
import { enableBasicSecurity } from '@tachui/core/security'

// Enable basic security features
enableBasicSecurity()
```

This enables:
- Input sanitization for XSS protection
- Development mode warnings
- Minimal performance impact

### Environment Configuration

Set environment variables to configure security:

```bash
# Enable individual features
export TACHUI_PLUGIN_CODE_SIGNING=true
export TACHUI_WEBWORKER_SANDBOX=true
export TACHUI_STRICT_INPUT_SANITIZATION=true

# Or use presets
export TACHUI_SECURITY_PRESET=basic      # Basic security
export TACHUI_SECURITY_PRESET=strict     # All features enabled
export TACHUI_SECURITY_PRESET=legacy     # All features disabled (default)
export TACHUI_SECURITY_PRESET=development # Development configuration
```

### Runtime Configuration

```typescript
import { getSecurityFlags } from '@tachui/core/security'

// Enable individual features
const flags = getSecurityFlags()
flags.enable('WEBWORKER_SANDBOX')
flags.enable('PLUGIN_CODE_SIGNING')

// Set multiple flags at once
flags.setFlags({
  PLUGIN_CODE_SIGNING: true,
  WEBWORKER_SANDBOX: true,
  CAPABILITY_PERMISSIONS: true
})

// Check if feature is enabled
if (flags.isEnabled('WEBWORKER_SANDBOX')) {
  console.log('WebWorker sandbox is active')
}
```

## Migration Strategy

### Version 1.1: Development & Testing

Start with minimal security to test compatibility:

```typescript
import { getSecurityFlags } from '@tachui/core/security'

getSecurityFlags().setFlags({
  STRICT_INPUT_SANITIZATION: true,  // Basic XSS protection
  SECURITY_DEV_MODE: true,          // See warnings
  // All other features disabled for compatibility testing
})
```

### Version 1.2: Gradual Rollout

Enable features incrementally to test performance and compatibility:

```typescript
// Week 1: Enable WebWorker sandboxing
getSecurityFlags().enable('WEBWORKER_SANDBOX')

// Week 2: Enable code signing requirement
getSecurityFlags().enable('PLUGIN_CODE_SIGNING')

// Week 3: Enable permission system
getSecurityFlags().enable('CAPABILITY_PERMISSIONS')

// Week 4: Enable CSP headers
getSecurityFlags().enable('CSP_HEADERS')
```

### Version 1.3: Production

Enable all security features for maximum protection:

```typescript
import { enableStrictSecurity } from '@tachui/core/security'

// Enable all security features
enableStrictSecurity()
```

## Using Secure Plugin Manager

Replace the standard plugin manager with the secure version:

```typescript
import { createSecurePluginManager } from '@tachui/core/security'

// Create secure plugin manager
const secureManager = createSecurePluginManager(tachUIInstance)

// Install plugins (security checks applied based on feature flags)
await secureManager.install(myPlugin)

// Check security status
const status = secureManager.getSecurityStatus()
console.log('Active security features:', status.features)
console.log('Sandboxed plugins:', status.sandboxedPlugins)
```

## Performance Impact

Different security configurations have varying performance impacts:

| Configuration | Plugin Load Time | Runtime Overhead | Security Level |
|--------------|------------------|------------------|----------------|
| **Legacy** (all disabled) | Baseline | None | ⚠️ Low |
| **Basic** (input sanitization) | +2-5ms | Minimal | ✓ Basic |
| **+ Code Signing** | +50ms | None | ✓✓ Medium |
| **+ WebWorker Sandbox** | +60-70ms | ~10ms per call | ✓✓✓ High |
| **Strict** (all enabled) | +70-80ms | ~15ms per call | ✓✓✓✓ Maximum |

## Security Features

### Plugin Code Signing

Requires plugins to be cryptographically signed before installation:

```typescript
// Only signed plugins can be installed when enabled
getSecurityFlags().enable('PLUGIN_CODE_SIGNING')

// Unsigned plugins will be rejected
await secureManager.install(unsignedPlugin) // Throws error

// Signed plugins install normally
await secureManager.install(signedPlugin) // Success
```

### WebWorker Sandbox

Isolates plugin execution in separate WebWorker threads:

```typescript
getSecurityFlags().enable('WEBWORKER_SANDBOX')

// Plugins execute in isolated WebWorker environment
// - No direct access to main thread globals
// - Limited API surface for security
// - Automatic cleanup on uninstall
```

### Input Sanitization

Protects against XSS attacks through comprehensive input validation:

```typescript
getSecurityFlags().enable('STRICT_INPUT_SANITIZATION')

// Automatically sanitizes:
// - HTML content (removes dangerous tags/attributes)
// - URLs (blocks javascript:, data: protocols)  
// - Component props (validates types and formats)
// - Form inputs (comprehensive validation)
```

### Capability Permissions

Implements capability-based access control:

```typescript
getSecurityFlags().enable('CAPABILITY_PERMISSIONS')

// Plugins must declare required capabilities
const plugin = {
  name: 'my-plugin',
  requiredCapabilities: [
    'component.register',
    'storage.local',
    'network.http'
  ],
  install(instance) {
    // Plugin can only use declared capabilities
  }
}
```

### Content Security Policy

Applies strict CSP headers for enhanced security:

```typescript
getSecurityFlags().enable('CSP_HEADERS')

// Automatically applies CSP headers:
// - Restricts script sources
// - Blocks inline JavaScript (with exceptions for framework)
// - Prevents code injection
// - Configurable for development vs production
```

## Browser Console Testing

During development, you can test security configurations in the browser console:

```javascript
// Available in browser dev tools
window.__TACHUI_SECURITY__.enable('WEBWORKER_SANDBOX')
window.__TACHUI_SECURITY__.disable('PLUGIN_CODE_SIGNING')
window.__TACHUI_SECURITY__.getFlags()

// Use convenience functions
window.__TACHUI_SECURITY__.enableBasic()
window.__TACHUI_SECURITY__.enableStrict()
window.__TACHUI_SECURITY__.disableAll()
```

## Troubleshooting

### Plugin Won't Load

```typescript
// Check if code signing is blocking it
if (getSecurityFlags().isEnabled('PLUGIN_CODE_SIGNING')) {
  console.log('Plugin must be signed. Temporarily disable for testing:')
  getSecurityFlags().disable('PLUGIN_CODE_SIGNING')
}
```

### Performance Issues

```typescript
// Disable WebWorker sandbox for performance testing
getSecurityFlags().disable('WEBWORKER_SANDBOX')
```

### CSP Violations

```typescript
// Temporarily disable CSP to identify issues
getSecurityFlags().disable('CSP_HEADERS')
```

## Best Practices

### 1. Start with Basic Security

Begin with input sanitization and development warnings:

```typescript
enableBasicSecurity()
```

### 2. Test Each Feature Individually

Enable features one at a time to isolate issues:

```typescript
// Test WebWorker impact
getSecurityFlags().enable('WEBWORKER_SANDBOX')
// Test for a week, measure performance

// Then add code signing
getSecurityFlags().enable('PLUGIN_CODE_SIGNING')
// Test compatibility with existing plugins
```

### 3. Use Development Mode

Keep development warnings enabled during testing:

```typescript
getSecurityFlags().setFlags({
  SECURITY_DEV_MODE: true,
  // ... other features
})
```

### 4. Monitor Performance

Track the impact of each security feature:

```typescript
const status = secureManager.getSecurityStatus()
console.log('Security overhead:', {
  features: Object.entries(status.features).filter(([,enabled]) => enabled),
  pluginCount: status.sandboxedPlugins.length
})
```

### 5. Plan for Production

Design your rollout strategy:

```typescript
// Development: Warnings only
if (process.env.NODE_ENV === 'development') {
  enableBasicSecurity()
}

// Staging: Gradual features
if (process.env.NODE_ENV === 'staging') {
  getSecurityFlags().setFlags({
    STRICT_INPUT_SANITIZATION: true,
    WEBWORKER_SANDBOX: true,
    SECURITY_DEV_MODE: true
  })
}

// Production: Full security
if (process.env.NODE_ENV === 'production') {
  enableStrictSecurity()
}
```

## See Also

- **[Plugin Architecture](/plugins)** - Understanding TachUI's plugin system
- **[Plugin System](/plugin-architecture)** - Plugin architecture and optimization details
- **[Security API Reference](/api/security)** - Complete security API documentation