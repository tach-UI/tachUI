/**
 * Build-Time Validation Types
 * 
 * Type definitions for the build-time validation system that integrates
 * with various build tools and provides TypeScript transformer capabilities.
 */

import type * as ts from 'typescript'

/**
 * Validation rule for build-time checking
 */
export interface BuildTimeValidationRule {
  name: string
  severity: 'error' | 'warning' | 'info'
  description: string
  validate(node: ts.Node, checker: ts.TypeChecker, context: ValidationContext): ValidationResult
  generateMessage?(error: BuildTimeValidationError): string
  suggestFix?(error: BuildTimeValidationError): CodeFix[]
}

/**
 * Context for validation operations
 */
export interface ValidationContext {
  sourceFile: ts.SourceFile
  program: ts.Program
  checker: ts.TypeChecker
  fileName: string
  options: ValidationOptions
}

/**
 * Validation result from a rule
 */
export interface ValidationResult {
  valid: boolean
  errors?: BuildTimeValidationError[]
  warnings?: BuildTimeValidationWarning[]
  suggestions?: CodeFix[]
}

/**
 * Build-time validation error details
 */
export interface BuildTimeValidationError {
  message: string
  code: string
  severity: 'error' | 'warning' | 'info'
  line: number
  column: number
  length: number
  category: string
  component?: string
  suggestion?: string
  documentationLink?: string
  fix?: CodeFix
}

/**
 * Build-time validation warning details
 */
export interface BuildTimeValidationWarning extends Omit<BuildTimeValidationError, 'severity'> {
  severity: 'warning'
}

/**
 * Code fix suggestion
 */
export interface CodeFix {
  description: string
  changes: TextChange[]
}

/**
 * Text change for code fixes
 */
export interface TextChange {
  span: {
    start: number
    length: number
  }
  newText: string
}

/**
 * Build tool detection and integration
 */
export interface BuildToolInfo {
  name: string
  version?: string
  configFile?: string
  detected: boolean
  supported: boolean
}

/**
 * Validation options for build-time checking
 */
export interface ValidationOptions {
  enabled: boolean
  strictMode: boolean
  errorLevel: 'error' | 'warn' | 'info'
  excludeFiles: string[]
  includeFiles?: string[]
  customRules: BuildTimeValidationRule[]
  buildTool?: string
  configFile?: string
}

/**
 * Plugin configuration for different build tools
 */
export interface PluginConfig {
  vite?: VitePluginOptions
  webpack?: WebpackPluginOptions
  nextjs?: NextJSPluginOptions
  typescript?: TypeScriptPluginOptions
}

/**
 * Vite plugin options
 */
export interface VitePluginOptions {
  include?: string[]
  exclude?: string[]
  enforce?: 'pre' | 'post'
  apply?: 'build' | 'serve' | ((config: any, env: any) => boolean)
}

/**
 * Webpack plugin options
 */
export interface WebpackPluginOptions {
  test?: RegExp
  include?: RegExp | string[]
  exclude?: RegExp | string[]
  options?: Record<string, any>
}

/**
 * Next.js plugin options
 */
export interface NextJSPluginOptions {
  webpack?: WebpackPluginOptions
  babel?: BabelPluginOptions
  swc?: SWCPluginOptions
}

/**
 * TypeScript plugin options
 */
export interface TypeScriptPluginOptions {
  transformers?: {
    before?: ts.TransformerFactory<ts.SourceFile>[]
    after?: ts.TransformerFactory<ts.SourceFile>[]
    afterDeclarations?: ts.TransformerFactory<ts.SourceFile>[]
  }
}

/**
 * Babel plugin options
 */
export interface BabelPluginOptions {
  include?: string[]
  exclude?: string[]
  presets?: any[]
  plugins?: any[]
}

/**
 * SWC plugin options
 */
export interface SWCPluginOptions {
  test?: RegExp
  options?: Record<string, any>
}

/**
 * Build integration result
 */
export interface BuildIntegrationResult {
  success: boolean
  buildTool: string
  message: string
  pluginRegistered: boolean
  configurationApplied: boolean
  errors?: string[]
}

/**
 * Validation statistics for reporting
 */
export interface ValidationStats {
  filesProcessed: number
  errorsFound: number
  warningsFound: number
  rulesApplied: number
  fixesApplied: number
  processingTime: number
}

/**
 * Component validation patterns
 */
export interface ComponentValidationPattern {
  componentName: string
  requiredProps: string[]
  optionalProps: string[]
  validModifiers: string[]
  invalidModifiers: string[]
  examples: {
    valid: string[]
    invalid: string[]
  }
}

/**
 * Modifier validation patterns
 */
export interface ModifierValidationPattern {
  modifierName: string
  validComponents: string[]
  parameterTypes: {
    [index: number]: string[]
  }
  noParameters?: boolean
  examples: {
    valid: string[]
    invalid: string[]
  }
}