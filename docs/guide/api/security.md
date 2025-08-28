# Security API Reference

TachUI's security system provides comprehensive protection for plugin systems through feature flags and secure implementations.

## Core API

### SecurityFeatureFlags

Manages security feature configuration with runtime control.

```typescript
import { getSecurityFlags } from '@tachui/core/security'

const flags = getSecurityFlags()
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `isEnabled(feature)` | `feature: keyof SecurityFeatureFlagsConfig` | `boolean` | Check if feature is enabled |
| `enable(feature)` | `feature: keyof SecurityFeatureFlagsConfig` | `void` | Enable a security feature |
| `disable(feature)` | `feature: keyof SecurityFeatureFlagsConfig` | `void` | Disable a security feature |
| `setFlags(config)` | `config: Partial<SecurityFeatureFlagsConfig>` | `void` | Set multiple flags at once |
| `getFlags()` | none | `SecurityFeatureFlagsConfig` | Get current configuration |
| `reset()` | none | `void` | Reset to default configuration |

#### Feature Flags

```typescript
interface SecurityFeatureFlagsConfig {
  PLUGIN_CODE_SIGNING: boolean         // Require signed plugins
  WEBWORKER_SANDBOX: boolean           // Isolate plugins in WebWorkers
  STRICT_INPUT_SANITIZATION: boolean   // Enhanced input validation
  CSP_HEADERS: boolean                 // Content Security Policy
  CAPABILITY_PERMISSIONS: boolean      // Permission system
  SECURITY_DEV_MODE: boolean          // Development warnings
}
```

### SecurePluginManager

Drop-in replacement for TachUIPluginManager with security features.

```typescript
import { createSecurePluginManager } from '@tachui/core/security'

const manager = createSecurePluginManager(tachUIInstance)
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `install(plugin, options?)` | `plugin: TachUIPlugin \| SignedPlugin, options?: PluginOptions` | `Promise<void>` | Install plugin with security checks |
| `uninstall(pluginName)` | `pluginName: string` | `Promise<void>` | Uninstall plugin with cleanup |
| `hasCapability(pluginName, capability)` | `pluginName: string, capability: PluginCapability` | `boolean` | Check plugin capability |
| `updateSecurityConfig(config)` | `config: Partial<SecurityFeatureFlagsConfig>` | `void` | Update security configuration |
| `getSecurityStatus()` | none | `SecurityStatus` | Get security status report |

#### SecurityStatus Interface

```typescript
interface SecurityStatus {
  features: SecurityFeatureFlagsConfig     // Active feature flags
  signedPlugins: string[]                  // List of signed plugins
  sandboxedPlugins: string[]               // List of sandboxed plugins
  permissionedPlugins: string[]            // List of plugins with permissions
}
```

## Plugin Verification

### PluginVerifier

Handles cryptographic verification of plugin signatures.

```typescript
import { PluginVerifier } from '@tachui/core/security'

const verifier = new PluginVerifier()
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `verifyPlugin(signedPlugin)` | `signedPlugin: SignedPlugin` | `Promise<VerificationResult>` | Verify plugin signature |
| `addTrustedKey(keyId, publicKey)` | `keyId: string, publicKey: CryptoKey` | `Promise<void>` | Add trusted signing key |
| `revokeKey(keyId)` | `keyId: string` | `void` | Revoke compromised key |
| `isKeyTrusted(keyId)` | `keyId: string` | `boolean` | Check if key is trusted |

#### Interfaces

```typescript
interface SignedPlugin {
  plugin: TachUIPlugin
  signature: PluginSignature
  metadata: {
    checksum: string
    size: number
    dependencies: string[]
  }
}

interface PluginSignature {
  signature: string
  algorithm: 'RS256' | 'ES256' | 'none'
  timestamp: number
  issuer: string
  keyId: string
}

interface VerificationResult {
  valid: boolean
  errors: SecurityError[]
  warnings: SecurityWarning[]
  metadata: {
    signedBy: string
    signedAt: Date
    expiresAt?: Date
  }
}
```

## Permission System

### PermissionManager

Implements capability-based access control for plugins.

```typescript
import { PermissionManager, PluginCapability } from '@tachui/core/security'

const manager = new PermissionManager()
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `requestPermissions(pluginName, capabilities)` | `pluginName: string, capabilities: PluginCapability[]` | `Promise<PermissionResult>` | Request permissions for plugin |
| `hasPermission(pluginName, capability)` | `pluginName: string, capability: PluginCapability` | `boolean` | Check if plugin has capability |
| `grantPermission(pluginName, capability)` | `pluginName: string, capability: PluginCapability` | `void` | Grant additional permission |
| `revokePermission(pluginName, capability)` | `pluginName: string, capability: PluginCapability` | `void` | Revoke specific permission |
| `revokePermissions(pluginName)` | `pluginName: string` | `void` | Revoke all permissions |
| `getPermissions(pluginName)` | `pluginName: string` | `PluginCapability[]` | Get plugin permissions |
| `getStatistics()` | none | `PermissionStatistics` | Get permission statistics |

#### Plugin Capabilities

```typescript
enum PluginCapability {
  // Component capabilities
  REGISTER_COMPONENTS = 'component.register',
  MODIFY_DOM = 'dom.modify',
  ACCESS_STYLES = 'styles.access',
  
  // Data capabilities  
  ACCESS_LOCAL_STORAGE = 'storage.local',
  ACCESS_SESSION_STORAGE = 'storage.session',
  MAKE_HTTP_REQUESTS = 'network.http',
  
  // System capabilities
  ACCESS_CLIPBOARD = 'system.clipboard',
  ACCESS_NOTIFICATIONS = 'system.notifications',
  ACCESS_GEOLOCATION = 'system.location',
  
  // Plugin capabilities
  LOAD_OTHER_PLUGINS = 'plugin.load',
  ACCESS_PLUGIN_REGISTRY = 'plugin.registry'
}
```

#### Interfaces

```typescript
interface PermissionResult {
  granted: PluginCapability[]
  denied: PluginCapability[]
}

interface PluginPermissions {
  required: PluginCapability[]
  optional: PluginCapability[]
  denied: PluginCapability[]
}

interface PermissionStatistics {
  totalPlugins: number
  totalPermissions: number
  averagePermissionsPerPlugin: number
  mostUsedCapabilities: PluginCapability[]
}
```

## Input Sanitization

### InputSanitizer

Provides comprehensive input validation and XSS protection.

```typescript
import { InputSanitizer } from '@tachui/core/security'
```

#### Static Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `sanitizeHTML(input)` | `input: string` | `string` | Sanitize HTML content |
| `sanitizeString(input)` | `input: string` | `string` | Basic string sanitization |
| `sanitizeURL(input)` | `input: string` | `string` | Validate and sanitize URL |
| `sanitizeNumber(input, schema?)` | `input: any, schema?: NumberSchema` | `number` | Validate number input |
| `sanitizeComponentProps(props, schema)` | `props: T, schema: ComponentPropSchema` | `SanitizedProps<T>` | Sanitize component props |
| `getStatistics()` | none | `SanitizationStatistics` | Get sanitization statistics |

#### Interfaces

```typescript
interface ComponentPropSchema {
  [key: string]: {
    type: 'string' | 'html' | 'url' | 'number' | 'boolean' | 'object'
    required?: boolean
    maxLength?: number
    min?: number
    max?: number
    pattern?: RegExp
    allowedValues?: any[]
  }
}

interface SanitizationStatistics {
  htmlSanitizationsCount: number
  urlSanitizationsCount: number
  stringSanitizationsCount: number
  hasDOMPurify: boolean
}
```

## Plugin Sandboxing

### PluginSandbox

Provides isolated execution environment for plugins using WebWorkers.

```typescript
import { PluginSandbox } from '@tachui/core/security'

const sandbox = new PluginSandbox(pluginName)
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `loadPlugin(signedPlugin)` | `signedPlugin: SignedPlugin` | `Promise<void>` | Load plugin in sandbox |
| `callPluginMethod(method, args)` | `method: string, args: any[]` | `Promise<any>` | Execute plugin method |
| `destroy()` | none | `void` | Terminate sandbox |
| `isUsingWebWorker()` | none | `boolean` | Check if using WebWorker |
| `getStatistics()` | none | `SandboxStatistics` | Get sandbox statistics |

#### SandboxManager

Manages multiple plugin sandboxes.

```typescript
import { SandboxManager } from '@tachui/core/security'

const manager = new SandboxManager()
```

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `createSandbox(pluginName)` | `pluginName: string` | `PluginSandbox` | Create new sandbox |
| `getSandbox(pluginName)` | `pluginName: string` | `PluginSandbox \| undefined` | Get existing sandbox |
| `destroySandbox(pluginName)` | `pluginName: string` | `void` | Destroy specific sandbox |
| `destroyAll()` | none | `void` | Destroy all sandboxes |
| `getAllStatistics()` | none | `SandboxStatistics[]` | Get all sandbox statistics |

## Content Security Policy

### CSPManager

Manages Content Security Policy headers and configuration.

```typescript
import { CSPManager } from '@tachui/core/security'
```

#### Static Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `generateCSP(additionalRules?)` | `additionalRules?: Partial<CSPDirectives>` | `string` | Generate CSP header string |
| `applyCSP(customCSP?)` | `customCSP?: string` | `void` | Apply CSP to document |
| `addPluginSource(domain)` | `domain: string` | `void` | Add trusted plugin source |
| `configureForDevelopment()` | none | `void` | Configure for development |
| `configureForProduction()` | none | `void` | Configure for production |
| `isSupported()` | none | `boolean` | Check CSP support |
| `enableViolationReporting(reportUri)` | `reportUri: string` | `void` | Enable violation reporting |

#### CSPDirectives Interface

```typescript
interface CSPDirectives {
  'default-src': string[]
  'script-src': string[]
  'style-src': string[]
  'img-src': string[]
  'font-src': string[]
  'connect-src': string[]
  'frame-src': string[]
  'object-src': string[]
  'base-uri': string[]
  'form-action': string[]
  'frame-ancestors': string[]
  'plugin-types': string[]
  'require-sri-for': string[]
  'upgrade-insecure-requests': boolean
  'block-all-mixed-content': boolean
}
```

## Convenience Functions

### Quick Configuration

```typescript
import { 
  enableBasicSecurity,
  enableStrictSecurity,
  disableAllSecurity 
} from '@tachui/core/security'

// Enable basic security (input sanitization + dev warnings)
enableBasicSecurity()

// Enable all security features
enableStrictSecurity()

// Disable all security features (legacy mode)
disableAllSecurity()
```

### Feature Testing

```typescript
import { 
  isFeatureEnabled,
  testSecurityConfiguration 
} from '@tachui/core/security'

// Check if feature is enabled
if (isFeatureEnabled('WEBWORKER_SANDBOX')) {
  console.log('Sandbox is active')
}

// Test configuration
testSecurityConfiguration({
  PLUGIN_CODE_SIGNING: true,
  WEBWORKER_SANDBOX: true
})
```

### Mock Utilities

```typescript
import { createMockSignedPlugin } from '@tachui/core/security'

// Create mock signed plugin for testing
const signedPlugin = createMockSignedPlugin(unsignedPlugin)
```

## Error Types

### SecurityError

Represents security-related errors.

```typescript
class SecurityError extends Error {
  constructor(message: string, code?: string)
  code?: string
}
```

### SecurityWarning

Represents security warnings.

```typescript
class SecurityWarning {
  constructor(message: string, code?: string)
  message: string
  code?: string
}
```

## Type Guards

### Plugin Type Checking

```typescript
import { isSignedPlugin } from '@tachui/core/security'

// Check if plugin is signed
if (isSignedPlugin(plugin)) {
  // TypeScript knows this is SignedPlugin
  console.log('Signature:', plugin.signature)
} else {
  // TypeScript knows this is TachUIPlugin
  console.log('Unsigned plugin:', plugin.name)
}
```

## Browser Console API

When running in development mode, these functions are available in the browser console:

```typescript
// Available as window.__TACHUI_SECURITY__
interface ConsoleSecurityAPI {
  enable(feature: keyof SecurityFeatureFlagsConfig): void
  disable(feature: keyof SecurityFeatureFlagsConfig): void
  getFlags(): SecurityFeatureFlagsConfig
  enableBasic(): void
  enableStrict(): void
  disableAll(): void
}
```

## Environment Variables

Configure security through environment variables:

```bash
# Individual features
TACHUI_PLUGIN_CODE_SIGNING=true|false
TACHUI_WEBWORKER_SANDBOX=true|false
TACHUI_STRICT_INPUT_SANITIZATION=true|false
TACHUI_CSP_HEADERS=true|false
TACHUI_CAPABILITY_PERMISSIONS=true|false
TACHUI_SECURITY_DEV_MODE=true|false

# Presets
TACHUI_SECURITY_PRESET=legacy|basic|strict|development
```