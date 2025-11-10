# Validation API Reference

Complete API reference for TachUI's validation system.

## Core Validation Classes

### ValidationUtils

Main validation utilities for component and modifier validation.

```typescript
import { ValidationUtils } from '@tachui/core'

ValidationUtils.validateComponent(component: ComponentInstance): ValidationResult
ValidationUtils.validateModifier(modifier: string, component: ComponentInstance): ValidationResult
ValidationUtils.test(): void
ValidationUtils.getStats(): ValidationStats
```

### EnhancedValidationUtils

Enhanced validation with smart error recovery and performance optimization.

```typescript
import { EnhancedValidationUtils } from '@tachui/core'

// Configuration
EnhancedValidationUtils.configure(config: EnhancedValidationConfig): void
EnhancedValidationUtils.getConfig(): EnhancedValidationConfig

// Error recovery
EnhancedValidationUtils.executeWithRecovery<T>(
  operation: () => T,
  context: ValidationContext
): RecoveryResult<T>

// Performance monitoring
EnhancedValidationUtils.getPerformanceStats(): PerformanceStats
EnhancedValidationUtils.test(): void
```

#### EnhancedValidationConfig

```typescript
interface EnhancedValidationConfig {
  enabled: boolean
  recovery: {
    enableRecovery: boolean
    defaultStrategy: 'ignore' | 'fallback' | 'fix' | 'throw'
    maxRetries: number
    retryDelay: number
  }
  lifecycle: {
    validateOnMount: boolean
    validateOnUpdate: boolean
    validateOnUnmount: boolean
    detectMemoryLeaks: boolean
  }
  reporting: {
    enhancedMessages: boolean
    reportToConsole: boolean
    reportToExternal?: (error: ValidationError) => void
    logLevel: 'error' | 'warn' | 'info'
  }
}
```

## Developer Experience

### DeveloperExperienceUtils

Rich error templates and intelligent fix suggestions.

```typescript
import { DeveloperExperienceUtils } from '@tachui/core'

// Error formatting
DeveloperExperienceUtils.formatError(
  error: ValidationError,
  templateId: string
): FormattedErrorMessage

// Fix suggestions
DeveloperExperienceUtils.getSuggestions(
  errorType: string,
  context: any
): IntelligentFixSuggestion[]

// Auto-fix
DeveloperExperienceUtils.applyAutoFix(
  fixType: string,
  code: string
): string | null

// Error templates
DeveloperExperienceUtils.getErrorTemplates(): Record<string, ErrorMessageTemplate>
DeveloperExperienceUtils.addErrorTemplate(template: ErrorMessageTemplate): void

// Statistics
DeveloperExperienceUtils.getStatistics(): DeveloperExperienceStats
DeveloperExperienceUtils.test(): void
```

#### ErrorMessageTemplate

```typescript
interface ErrorMessageTemplate {
  id: string
  title: string
  description: string
  severity: 'error' | 'warning' | 'info' | 'critical'
  category: 'component' | 'modifier' | 'performance' | 'security'
  emoji: string
  quickFix: string
  suggestions: IntelligentFixSuggestion[]
  examples: {
    wrong: CodeExample[]
    correct: CodeExample[]
  }
  documentation: {
    primary: string
    related: string[]
  }
}
```

#### IntelligentFixSuggestion

```typescript
interface IntelligentFixSuggestion {
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  confidence: number // 0-1
  estimatedTime: number // minutes
  canAutoFix: boolean
  before: string
  after: string
  explanation: string
  learnMoreUrl?: string
}
```

### IDEIntegrationUtils

VS Code integration and Language Server Protocol implementation.

```typescript
import { IDEIntegrationUtils } from '@tachui/core'

// Initialization
IDEIntegrationUtils.initialize(): void

// Document validation
IDEIntegrationUtils.validateDocument(
  uri: string,
  text: string
): Promise<LSPDiagnostic[]>

// Code actions
IDEIntegrationUtils.getCodeActions(
  diagnostic: LSPDiagnostic,
  uri: string,
  text: string
): LSPCodeAction[]

// Hover information
IDEIntegrationUtils.getHover(
  uri: string,
  text: string,
  line: number,
  character: number
): LSPHover | null

// Completions
IDEIntegrationUtils.getCompletions(
  uri: string,
  text: string,
  line: number,
  character: number
): LSPCompletionItem[]

// Configuration
IDEIntegrationUtils.configure(config: Partial<IDEIntegrationConfig>): void
IDEIntegrationUtils.getConfig(): IDEIntegrationConfig

// Testing
IDEIntegrationUtils.test(): Promise<void>
```

#### LSPDiagnostic

```typescript
interface LSPDiagnostic {
  range: {
    start: { line: number; character: number }
    end: { line: number; character: number }
  }
  severity: 1 | 2 | 3 | 4 // Error, Warning, Information, Hint
  code?: string | number
  source: string
  message: string
  relatedInformation?: {
    location: {
      uri: string
      range: {
        start: { line: number; character: number }
        end: { line: number; character: number }
      }
    }
    message: string
  }[]
  data?: any
}
```

### DocumentationIntegrationUtils

Context-aware documentation and personalized learning.

```typescript
import { DocumentationIntegrationUtils } from '@tachui/core'

// Contextual documentation
DocumentationIntegrationUtils.getContextualDocumentation(
  context: DocumentationContext
): ContextualDocumentation | null

// User profile management
DocumentationIntegrationUtils.setUserProfile(profile: UserLearningProfile): void
DocumentationIntegrationUtils.getUserProfile(): UserLearningProfile | null

// Recommendations
DocumentationIntegrationUtils.getRecommendations(
  maxItems?: number
): DocumentationResource[]

// Usage tracking
DocumentationIntegrationUtils.trackUsage(resourceId: string): void

// Configuration
DocumentationIntegrationUtils.configure(
  config: Partial<DocumentationIntegrationConfig>
): void
DocumentationIntegrationUtils.getConfig(): DocumentationIntegrationConfig

// Statistics
DocumentationIntegrationUtils.getStatistics(): DocumentationIntegrationStats
DocumentationIntegrationUtils.test(): void
```

#### UserLearningProfile

```typescript
interface UserLearningProfile {
  id: string
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  preferredLearningStyle: 'visual' | 'hands-on' | 'reading' | 'video'
  completedResources: string[]
  bookmarkedResources: string[]
  learningGoals: string[]
  weakAreas: string[]
  strongAreas: string[]
  averageReadTime: number
  preferredDocumentationTypes: DocumentationType[]
  mostUsedComponents: string[]
  mostUsedModifiers: string[]
  enablePersonalization: boolean
  enableProgressTracking: boolean
  enableRecommendations: boolean
}
```

## Debugging and Performance

### ValidationDebugUtils

Real-time validation debugging and session management.

```typescript
import { ValidationDebugUtils } from '@tachui/core'

// Session management
ValidationDebugUtils.startSession(
  name?: string,
  description?: string
): string
ValidationDebugUtils.stopSession(): ValidationDebugSession | null
ValidationDebugUtils.getActiveSession(): ValidationDebugSession | null

// Event tracking
ValidationDebugUtils.trackValidationEvent(event: ValidationEvent): void
ValidationDebugUtils.getValidationHistory(): ValidationEvent[]

// Performance monitoring
ValidationDebugUtils.measureValidation<T>(
  operation: () => T,
  label: string
): T
ValidationDebugUtils.getRealTimeStats(): ValidationDebugStats

// Configuration
ValidationDebugUtils.configure(config: Partial<ValidationDebugConfig>): void
ValidationDebugUtils.getConfig(): ValidationDebugConfig

// Testing
ValidationDebugUtils.test(): void
```

### AdvancedDebuggingUtils

Visual debugging, state inspection, and trend analysis.

```typescript
import { AdvancedDebuggingUtils } from '@tachui/core'

// Session management
AdvancedDebuggingUtils.startSession(
  name: string,
  description?: string
): string
AdvancedDebuggingUtils.stopSession(): AdvancedDebuggingSession | null

// State inspection
AdvancedDebuggingUtils.createInspector(
  type: 'component' | 'modifier' | 'performance',
  targetId: string
): string

AdvancedDebuggingUtils.takeSnapshot(
  componentId: string,
  data: ComponentSnapshotData
): string

AdvancedDebuggingUtils.getComponentHistory(
  componentId: string
): ComponentStateSnapshot[]

// Visual debugging
AdvancedDebuggingUtils.addVisualOverlay(
  type: 'error-highlight' | 'warning-badge' | 'info-tooltip',
  position: { x: number; y: number; width: number; height: number },
  options: { label?: string; duration?: number; color?: string }
): string | null

AdvancedDebuggingUtils.removeVisualOverlay(overlayId: string): boolean

// Trend analysis
AdvancedDebuggingUtils.getValidationTrends(): ValidationTrendAnalysis

// Export
AdvancedDebuggingUtils.exportSessionData(
  session: AdvancedDebuggingSession,
  format: 'json' | 'csv' | 'html'
): string

// Configuration
AdvancedDebuggingUtils.configure(
  config: Partial<AdvancedDebuggingConfig>
): void
AdvancedDebuggingUtils.getConfig(): AdvancedDebuggingConfig

// Statistics
AdvancedDebuggingUtils.getStatistics(): AdvancedDebuggingStats
AdvancedDebuggingUtils.test(): void
```

#### ComponentStateSnapshot

```typescript
interface ComponentStateSnapshot {
  id: string
  componentType: string
  timestamp: number
  props: Record<string, any>
  validationErrors: FormattedErrorMessage[]
  renderTime: number
  memoryUsage: number
  domNode?: {
    tagName: string
    className: string
    computedStyles: Record<string, string>
  }
}
```

### PerformanceOptimizationUtils

Performance monitoring and optimization.

```typescript
import { PerformanceOptimizationUtils } from '@tachui/core'

// Configuration
PerformanceOptimizationUtils.configure(
  config: Partial<PerformanceOptimizationConfig>
): void
PerformanceOptimizationUtils.getConfig(): PerformanceOptimizationConfig

// Cache management
PerformanceOptimizationUtils.clearCache(): void
PerformanceOptimizationUtils.getCacheStats(): CacheStats

// Performance monitoring
PerformanceOptimizationUtils.getStats(): PerformanceStats
PerformanceOptimizationUtils.getOverheadAnalysis(): OverheadAnalysis

// Testing
PerformanceOptimizationUtils.test(): void
```

## Setup and Configuration

### ValidationSetup

Quick setup utilities for different environments.

```typescript
import { ValidationSetup } from '@tachui/core'

// Environment-specific setup
ValidationSetup.development(): { sessionId?: string; fallback?: boolean }
ValidationSetup.production(): { optimized?: boolean; fallback?: boolean }
ValidationSetup.testing(): { testMode?: boolean; fallback?: boolean }
```

### ValidationDevTools

Development tools and system testing.

```typescript
import { ValidationDevTools } from '@tachui/core'

// System information
ValidationDevTools.logValidationRules(): void
ValidationDevTools.test(): void
ValidationDevTools.getStats(): ComprehensiveValidationStats
```

## Error Types

### ValidationResult

```typescript
interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  suggestions?: string[]
}
```

### ValidationError

```typescript
interface ValidationError {
  type: string
  message: string
  component?: string
  property?: string
  modifier?: string
  suggestion?: string
  documentation?: string
  severity: 'error' | 'warning' | 'info'
  recoverable: boolean
}
```

### RecoveryResult

```typescript
interface RecoveryResult<T> {
  success: boolean
  result?: T
  strategy: 'ignore' | 'fallback' | 'fix' | 'throw'
  recoveryApplied: boolean
  error?: Error
  attempts: number
}
```

## Configuration Interfaces

### IDEIntegrationConfig

```typescript
interface IDEIntegrationConfig {
  enableLanguageServer: boolean
  serverPort: number
  enableRealTimeDiagnostics: boolean
  diagnosticDelay: number
  maxDiagnostics: number
  enableHoverInfo: boolean
  enableAutoComplete: boolean
  enableSignatureHelp: boolean
  enableQuickFixes: boolean
  enableCodeActions: boolean
  enableRefactoring: boolean
  enableStatusBar: boolean
  enableOutputChannel: boolean
  enableWebview: boolean
}
```

### DocumentationIntegrationConfig

```typescript
interface DocumentationIntegrationConfig {
  enableContextualHelp: boolean
  enablePersonalization: boolean
  enableRecommendations: boolean
  maxRelatedItems: number
  defaultDifficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  cacheTimeout: number
  enableUsageTracking: boolean
}
```

### AdvancedDebuggingConfig

```typescript
interface AdvancedDebuggingConfig {
  enableVisualDebugging: boolean
  enableStateInspection: boolean
  enableTrendAnalysis: boolean
  maxHistorySize: number
  snapshotInterval: number
  enableSessionExport: boolean
  overlayTimeout: number
}
```

## Statistics Interfaces

### ValidationStats

```typescript
interface ValidationStats {
  totalValidations: number
  successfulValidations: number
  errorCount: number
  warningCount: number
  averageValidationTime: number
  cacheHitRate: number
  mostCommonErrors: Array<{ type: string; count: number }>
}
```

### PerformanceStats

```typescript
interface PerformanceStats {
  overhead: number // percentage
  averageExecutionTime: number // milliseconds
  cacheHitRate: number // percentage
  memoryUsage: number // bytes
  optimizationsApplied: number
  targetOverhead: number
}
```

### ValidationTrendAnalysis

```typescript
interface ValidationTrendAnalysis {
  errorRate: number
  warningRate: number
  performanceRegression: boolean
  memoryTrend: 'increasing' | 'stable' | 'decreasing'
  recommendations: string[]
  timeRange: {
    start: number
    end: number
  }
}
```

## Constants

### Error Codes

```typescript
const VALIDATION_ERROR_CODES = {
  MISSING_REQUIRED_PROP: 'missing-required-prop',
  INVALID_MODIFIER_USAGE: 'invalid-modifier-usage',
  INCORRECT_PARAMETER_TYPE: 'incorrect-parameter-type',
  DEPRECATED_USAGE: 'deprecated-usage',
  PERFORMANCE_WARNING: 'performance-warning',
  SECURITY_WARNING: 'security-warning',
  COMPATIBILITY_WARNING: 'compatibility-warning'
} as const
```

### Recovery Strategies

```typescript
const RECOVERY_STRATEGIES = {
  IGNORE: 'ignore',
  FALLBACK: 'fallback', 
  FIX: 'fix',
  THROW: 'throw'
} as const
```

### Validation Phases

```typescript
const VALIDATION_PHASES = {
  BUILD_TIME: 'build-time',
  MOUNT: 'mount',
  UPDATE: 'update',
  UNMOUNT: 'unmount'
} as const
```

## Examples

### Basic Usage

```typescript
import { ValidationUtils, EnhancedValidationUtils } from '@tachui/core'

// Simple validation
const result = ValidationUtils.validateComponent(myComponent)
if (!result.valid) {
  console.error('Validation failed:', result.errors)
}

// Enhanced validation with recovery
const recoveryResult = EnhancedValidationUtils.executeWithRecovery(
  () => myRiskyOperation(),
  { component: 'MyComponent', operation: 'render' }
)
```

### IDE Integration

```typescript
import { IDEIntegrationUtils } from '@tachui/core'

// Initialize IDE integration
IDEIntegrationUtils.initialize()

// Get diagnostics for a file
const diagnostics = await IDEIntegrationUtils.validateDocument(
  'file://myfile.ts',
  'Text()'
)

// Get code actions for the first diagnostic
if (diagnostics.length > 0) {
  const actions = IDEIntegrationUtils.getCodeActions(
    diagnostics[0],
    'file://myfile.ts',
    'Text()'
  )
}
```

### Debugging Session

```typescript
import { AdvancedDebuggingUtils } from '@tachui/core'

// Start debugging session
const sessionId = AdvancedDebuggingUtils.startSession('Feature Development')

// Take snapshots during development
AdvancedDebuggingUtils.takeSnapshot('my-component', {
  type: 'Text',
  props: { content: 'Hello' },
  state: {},
  modifiers: ['fontSize', 'padding']
})

// Stop session and export
const session = AdvancedDebuggingUtils.stopSession()
if (session) {
  const report = AdvancedDebuggingUtils.exportSessionData(session, 'html')
  console.log('Debug report:', report)
}
```