/**
 * Enhanced Error Reporting System - Phase 1C
 * 
 * Rich error message templates, contextual suggestions, fix examples,
 * and comprehensive developer guidance for validation errors.
 */

import type { RecoveryStrategy } from './enhanced-runtime'
import { EnhancedValidationError } from './enhanced-runtime'

/**
 * Error severity levels
 */
export type ValidationErrorSeverity = 'critical' | 'error' | 'warning' | 'info'

/**
 * Error category for classification
 */
export type ValidationErrorCategory = 
  | 'component-construction'
  | 'modifier-usage'
  | 'prop-validation'
  | 'lifecycle'
  | 'performance'
  | 'accessibility'
  | 'best-practices'

/**
 * Fix suggestion with automated repair capability
 */
export interface FixSuggestion {
  description: string
  code: string
  autoFix?: () => string
  difficulty: 'easy' | 'medium' | 'hard'
}

/**
 * Enhanced error context with rich metadata
 */
export interface EnhancedErrorContext {
  component: string
  package?: string
  property?: string
  
  // Error classification
  category: ValidationErrorCategory
  severity: ValidationErrorSeverity
  errorCode: string
  
  // Developer guidance
  suggestion: string
  documentation: string
  fixes: FixSuggestion[]
  
  // Examples
  examples: {
    wrong: string[]
    correct: string[]
  }
  
  // Recovery options
  recoveryStrategy: RecoveryStrategy
  fallbackValue?: any
  autoFix?: () => any
  
  // Context information
  location?: {
    file?: string
    line?: number
    column?: number
  }
  
  // Related errors
  relatedErrors?: string[]
  commonMistakes?: string[]
}

/**
 * Error message template for consistent formatting
 */
export interface ErrorMessageTemplate {
  title: string
  description: string
  impact: string
  
  // Developer guidance sections
  quickFix?: string
  detailedSolution?: string
  prevention?: string
  
  // Visual formatting
  emoji: string
  color: 'red' | 'yellow' | 'blue' | 'gray'
}

/**
 * Comprehensive error templates database
 */
export const ErrorTemplates: Record<string, ErrorMessageTemplate> = {
  // Component Construction Errors
  'COMPONENT_MISSING_REQUIRED_PARAM': {
    title: 'Missing Required Parameter',
    description: 'The {component} component requires a {parameter} parameter to function correctly.',
    impact: 'Component will not render or may throw runtime errors.',
    quickFix: 'Add the missing {parameter} parameter.',
    detailedSolution: 'Check the component documentation for required parameters and their expected types.',
    prevention: 'Use TypeScript for compile-time validation of required parameters.',
    emoji: '❌',
    color: 'red'
  },

  'COMPONENT_INVALID_PARAM_TYPE': {
    title: 'Invalid Parameter Type',
    description: 'The {component} component received {received} but expected {expected}.',
    impact: 'May cause unexpected behavior or runtime errors.',
    quickFix: 'Convert the value to the expected type: {expected}.',
    detailedSolution: 'Ensure all parameters match the expected types. Use type guards or validation.',
    prevention: 'Enable strict TypeScript checking and use proper type annotations.',
    emoji: '🔄',
    color: 'yellow'
  },

  'COMPONENT_NULL_UNDEFINED_PARAM': {
    title: 'Null or Undefined Parameter',
    description: 'The {component} component received null or undefined for {parameter}.',
    impact: 'Component may not render correctly or throw errors.',
    quickFix: 'Provide a valid value or use conditional rendering.',
    detailedSolution: 'Check for null/undefined values before passing to components.',
    prevention: 'Use optional chaining (?.) and nullish coalescing (??) operators.',
    emoji: '⚠️',
    color: 'yellow'
  },

  // Modifier Usage Errors
  'MODIFIER_NOT_EXISTS': {
    title: 'Unknown Modifier',
    description: 'The modifier .{modifier}() does not exist in the tachUI framework.',
    impact: 'Build errors or silent failures in modifier chains.',
    quickFix: 'Check the spelling or use a valid modifier name.',
    detailedSolution: 'Refer to the modifier documentation for available options.',
    prevention: 'Use IDE autocompletion and enable TypeScript strict mode.',
    emoji: '🔍',
    color: 'red'
  },

  'MODIFIER_INVALID_COMPONENT': {
    title: 'Invalid Modifier Usage',
    description: 'The modifier .{modifier}() is not valid for {component} components.',
    impact: 'Modifier will be ignored or cause styling issues.',
    quickFix: 'Use this modifier only on compatible components: {validComponents}.',
    detailedSolution: 'Each modifier has specific component compatibility. Check documentation.',
    prevention: 'Learn modifier-component compatibility rules.',
    emoji: '🚫',
    color: 'yellow'
  },

  'MODIFIER_WRONG_PARAMS': {
    title: 'Incorrect Modifier Parameters',
    description: 'The modifier .{modifier}() received incorrect parameters.',
    impact: 'Modifier may not work as expected or throw errors.',
    quickFix: 'Use the correct parameter format: {correctFormat}.',
    detailedSolution: 'Check modifier documentation for parameter requirements.',
    prevention: 'Use TypeScript for parameter validation.',
    emoji: '📝',
    color: 'yellow'
  },

  // Prop Validation Errors
  'PROP_MISSING_REQUIRED': {
    title: 'Missing Required Property',
    description: 'The {component} component is missing the required {property} property.',
    impact: 'Component may not function correctly without this property.',
    quickFix: 'Add the {property} property to the component props.',
    detailedSolution: 'Required properties are essential for component functionality.',
    prevention: 'Use TypeScript interfaces to enforce required properties.',
    emoji: '📋',
    color: 'red'
  },

  'PROP_INVALID_TYPE': {
    title: 'Invalid Property Type',
    description: 'Property {property} expected {expected} but received {received}.',
    impact: 'May cause type errors or unexpected component behavior.',
    quickFix: 'Convert the value to {expected} type.',
    detailedSolution: 'Ensure all props match their expected types.',
    prevention: 'Use proper TypeScript typing for props.',
    emoji: '🔧',
    color: 'yellow'
  },

  // Lifecycle Errors
  'LIFECYCLE_INVALID_STATE': {
    title: 'Invalid Component State',
    description: 'Component {component} is in an invalid state during {phase}.',
    impact: 'May cause rendering issues or memory leaks.',
    quickFix: 'Ensure proper component lifecycle management.',
    detailedSolution: 'Review component mounting, updating, and unmounting logic.',
    prevention: 'Follow React/component lifecycle best practices.',
    emoji: '🔄',
    color: 'yellow'
  },

  // Performance Errors
  'PERFORMANCE_EXPENSIVE_RENDER': {
    title: 'Expensive Render Operation',
    description: 'Component {component} is performing expensive operations during render.',
    impact: 'May cause UI lag and poor user experience.',
    quickFix: 'Move expensive operations to useEffect or useMemo.',
    detailedSolution: 'Optimize component rendering by avoiding heavy computations.',
    prevention: 'Use performance profiling tools and React DevTools.',
    emoji: '⚡',
    color: 'blue'
  },

  // Best Practices
  'BEST_PRACTICE_DEPRECATED': {
    title: 'Deprecated Usage',
    description: 'Using deprecated {feature} which will be removed in future versions.',
    impact: 'Code may break in future framework updates.',
    quickFix: 'Replace with the recommended alternative: {alternative}.',
    detailedSolution: 'Check migration guide for updated patterns.',
    prevention: 'Stay updated with framework changelog and migration guides.',
    emoji: '⚠️',
    color: 'blue'
  }
}

/**
 * Error code generator for consistent error identification
 */
export class ErrorCodeGenerator {
  private static categories = {
    'component-construction': 'CC',
    'modifier-usage': 'MU',
    'prop-validation': 'PV',
    'lifecycle': 'LC',
    'performance': 'PF',
    'accessibility': 'AC',
    'best-practices': 'BP'
  }

  static generate(category: ValidationErrorCategory, component: string, specific?: string): string {
    const categoryCode = this.categories[category]
    const componentCode = component.substring(0, 3).toUpperCase()
    const specificCode = specific ? specific.substring(0, 3).toUpperCase() : '001'
    const timestamp = Date.now().toString(36).substring(-3).toUpperCase()
    
    return `TACH-${categoryCode}-${componentCode}-${specificCode}-${timestamp}`
  }
}

/**
 * Enhanced error reporter with rich formatting
 */
export class EnhancedErrorReporter {
  private static instance: EnhancedErrorReporter
  private errorHistory: EnhancedValidationError[] = []
  private maxHistorySize = 100

  static getInstance(): EnhancedErrorReporter {
    if (!this.instance) {
      this.instance = new EnhancedErrorReporter()
    }
    return this.instance
  }

  /**
   * Create enhanced validation error with rich context
   */
  createError(
    message: string,
    context: Partial<EnhancedErrorContext>
  ): EnhancedValidationError {
    const errorCode = ErrorCodeGenerator.generate(
      context.category || 'component-construction',
      context.component || 'Unknown',
      context.property
    )

    const enhancedContext: EnhancedErrorContext = {
      component: 'Unknown',
      category: 'component-construction',
      severity: 'error',
      errorCode,
      suggestion: 'Please check the component documentation.',
      documentation: 'https://docs.tachui.dev/',
      fixes: [],
      examples: { wrong: [], correct: [] },
      recoveryStrategy: 'throw',
      ...context
    }

    const error = new EnhancedValidationError(message, enhancedContext)
    this.recordError(error)
    return error
  }

  /**
   * Format error message with rich context
   */
  formatError(error: EnhancedValidationError): string {
    const context = error.context as any as EnhancedErrorContext
    const template = this.getTemplate(context.errorCode || 'UNKNOWN')
    
    let formatted = `${template.emoji} ${template.title}\n`
    formatted += `📍 Error Code: ${context.errorCode}\n`
    formatted += `🏷️  Category: ${context.category} | Severity: ${context.severity}\n\n`
    
    // Description with context substitution
    formatted += `📋 Description:\n${this.substituteVariables(template.description, context)}\n\n`
    
    // Impact
    formatted += `⚠️  Impact:\n${template.impact}\n\n`
    
    // Quick fix
    if (template.quickFix) {
      formatted += `🔧 Quick Fix:\n${this.substituteVariables(template.quickFix, context)}\n\n`
    }
    
    // Examples
    if (context.examples.wrong.length > 0) {
      formatted += `❌ Wrong:\n${context.examples.wrong.map(ex => `   ${ex}`).join('\n')}\n\n`
    }
    
    if (context.examples.correct.length > 0) {
      formatted += `✅ Correct:\n${context.examples.correct.map(ex => `   ${ex}`).join('\n')}\n\n`
    }
    
    // Fix suggestions
    if (context.fixes.length > 0) {
      formatted += `🔨 Available Fixes:\n`
      context.fixes.forEach((fix, index) => {
        formatted += `   ${index + 1}. ${fix.description} (${fix.difficulty})\n`
        formatted += `      ${fix.code}\n`
      })
      formatted += '\n'
    }
    
    // Documentation
    formatted += `📚 Documentation: ${context.documentation}\n`
    
    // Related information
    if (context.commonMistakes && context.commonMistakes.length > 0) {
      formatted += `💡 Common Mistakes:\n${context.commonMistakes.map(m => `   • ${m}`).join('\n')}\n`
    }
    
    // Recovery information
    formatted += `🛡️  Recovery: ${this.getRecoveryDescription(context.recoveryStrategy)}\n`
    
    return formatted
  }

  /**
   * Get error template by code or fallback to default
   */
  private getTemplate(errorCode: string): ErrorMessageTemplate {
    // Extract template key from error code
    const parts = errorCode.split('-')
    if (parts.length >= 2) {
      const category = parts[1]
      const templateKeys = Object.keys(ErrorTemplates)
      const matchingTemplate = templateKeys.find(key => {
        if (category === 'CC') return key.startsWith('COMPONENT_')
        if (category === 'MU') return key.startsWith('MODIFIER_')
        if (category === 'PV') return key.startsWith('PROP_')
        if (category === 'LC') return key.startsWith('LIFECYCLE_')
        if (category === 'PF') return key.startsWith('PERFORMANCE_')
        if (category === 'BP') return key.startsWith('BEST_PRACTICE_')
        return false
      })
      
      if (matchingTemplate) {
        return ErrorTemplates[matchingTemplate]
      }
    }
    
    // Fallback to generic template
    return {
      title: 'Validation Error',
      description: 'A validation error occurred.',
      impact: 'May affect component functionality.',
      emoji: '❌',
      color: 'red'
    }
  }

  /**
   * Substitute variables in template strings
   */
  private substituteVariables(template: string, context: EnhancedErrorContext): string {
    return template
      .replace(/\{component\}/g, context.component)
      .replace(/\{package\}/g, context.package || 'Core')
      .replace(/\{property\}/g, context.property || 'property')
      .replace(/\{parameter\}/g, context.property || 'parameter')
      .replace(/\{modifier\}/g, context.property || 'modifier')
  }

  /**
   * Get recovery strategy description
   */
  private getRecoveryDescription(strategy: RecoveryStrategy): string {
    switch (strategy) {
      case 'ignore': return 'Error will be ignored and execution continues'
      case 'fallback': return 'Fallback value will be used'
      case 'fix': return 'Automatic fix will be applied if available'
      case 'throw': return 'Error will be thrown and must be handled'
      default: return 'No recovery strategy specified'
    }
  }

  /**
   * Record error in history for analytics
   */
  private recordError(error: EnhancedValidationError): void {
    this.errorHistory.push(error)
    
    // Maintain history size limit
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift()
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const categoryCounts = new Map<ValidationErrorCategory, number>()
    const severityCounts = new Map<ValidationErrorSeverity, number>()
    const componentCounts = new Map<string, number>()
    
    this.errorHistory.forEach(error => {
      const context = error.context as EnhancedErrorContext
      
      categoryCounts.set(context.category, (categoryCounts.get(context.category) || 0) + 1)
      severityCounts.set(context.severity, (severityCounts.get(context.severity) || 0) + 1)
      componentCounts.set(context.component, (componentCounts.get(context.component) || 0) + 1)
    })
    
    return {
      totalErrors: this.errorHistory.length,
      categories: Object.fromEntries(categoryCounts),
      severities: Object.fromEntries(severityCounts),
      components: Object.fromEntries(componentCounts),
      recentErrors: this.errorHistory.slice(-10).map(e => ({
        code: (e.context as EnhancedErrorContext).errorCode,
        component: e.context.component,
        message: e.message,
        timestamp: Date.now()
      }))
    }
  }

  /**
   * Clear error history
   */
  clearHistory(): void {
    this.errorHistory = []
  }

  /**
   * Export error report for debugging
   */
  exportErrorReport(): string {
    const stats = this.getErrorStats()
    const report = {
      timestamp: new Date().toISOString(),
      framework: 'tachUI',
      version: '1.0.0', // Would be dynamic in real implementation
      stats,
      errors: this.errorHistory.map(error => ({
        code: (error.context as EnhancedErrorContext).errorCode,
        message: error.message,
        context: error.context,
        stack: error.stack
      }))
    }
    
    return JSON.stringify(report, null, 2)
  }
}

/**
 * Error suggestion engine for intelligent fixes
 */
export class ErrorSuggestionEngine {
  /**
   * Generate fix suggestions for common component errors
   */
  static generateComponentFixSuggestions(
    component: string,
    error: string,
    _args: unknown[]
  ): FixSuggestion[] {
    const suggestions: FixSuggestion[] = []
    
    // Missing parameter fixes
    if (error.includes('requires') && error.includes('parameter')) {
      suggestions.push({
        description: `Add the missing parameter to ${component}`,
        code: this.generateParameterFix(component, _args),
        difficulty: 'easy',
        autoFix: () => this.generateParameterFix(component, _args)
      })
    }
    
    // Type mismatch fixes
    if (error.includes('type') && error.includes('expected')) {
      suggestions.push({
        description: 'Convert value to expected type',
        code: this.generateTypeFix(component, _args),
        difficulty: 'medium'
      })
    }
    
    // Null/undefined fixes
    if (error.includes('null') || error.includes('undefined')) {
      suggestions.push({
        description: 'Add null check and default value',
        code: this.generateNullCheckFix(component, _args),
        difficulty: 'easy'
      })
    }
    
    return suggestions
  }

  /**
   * Generate fix for missing parameters
   */
  private static generateParameterFix(component: string, _args: unknown[]): string {
    const componentDefaults: Record<string, string> = {
      'Text': 'Text("Hello World")',
      'Button': 'Button("Click me", () => {})',
      'Image': 'Image({ source: "image.jpg" })',
      'Toggle': 'Toggle({ isOn: false })',
      'VStack': 'VStack({ children: [] })',
      'HStack': 'HStack({ children: [] })'
    }
    
    return componentDefaults[component] || `${component}({ /* add required props */ })`
  }

  /**
   * Generate fix for type mismatches
   */
  private static generateTypeFix(component: string, args: unknown[]): string {
    if (args.length > 0) {
      const firstArg = args[0]
      if (typeof firstArg === 'number') {
        return `${component}(String(${firstArg})) // Convert number to string`
      }
      if (typeof firstArg === 'object') {
        return `${component}(JSON.stringify(${JSON.stringify(firstArg)})) // Serialize object`
      }
    }
    return `${component}(/* provide correct type */)`
  }

  /**
   * Generate fix for null/undefined values
   */
  private static generateNullCheckFix(component: string, _args: unknown[]): string {
    return `${component}(value || "default") // Provide fallback for null/undefined`
  }
}

// Export singleton instance
export const errorReporter = EnhancedErrorReporter.getInstance()

// Export utilities
export const ErrorReportingUtils = {
  createError: (message: string, context: Partial<EnhancedErrorContext>) => 
    errorReporter.createError(message, context),
  
  formatError: (error: EnhancedValidationError) => 
    errorReporter.formatError(error),
  
  getStats: () => 
    errorReporter.getErrorStats(),
  
  exportReport: () => 
    errorReporter.exportErrorReport(),
  
  generateSuggestions: ErrorSuggestionEngine.generateComponentFixSuggestions
}