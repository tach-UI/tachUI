/**
 * TypeScript Transformer for Build-Time Validation
 *
 * Analyzes TypeScript AST to validate TachUI component usage
 * at compile time and provide detailed error messages.
 */

/**
 * NOTE: This module should only be imported in development/build environments.
 * TypeScript is a devDependency and should never be bundled in production.
 */

// Dynamic TypeScript import - only loaded during build-time
function getTypeScript() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('TypeScript transformer should not be used in production')
  }

  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    throw new Error('TypeScript transformer cannot run in browser environment')
  }

  try {
    return require('typescript')
  } catch (_error) {
    throw new Error(
      'TypeScript is required for build-time validation. Install with: npm install -D typescript'
    )
  }
}

import type {
  BuildTimeValidationRule,
  ValidationContext,
  ValidationResult,
  BuildTimeValidationError,
  ComponentValidationPattern,
  ModifierValidationPattern,
} from './types'
import { componentPatterns, modifierPatterns } from './rules'

/**
 * Main TypeScript transformer factory
 */
export function createTachUITransformer(
  program: any, // ts.Program when TypeScript is available
  options: { strict?: boolean } = {}
): any {
  // ts.TransformerFactory<ts.SourceFile> when TypeScript is available
  const ts = getTypeScript()

  return (context: any) => {
    return (sourceFile: any): any => {
      const checker = program.getTypeChecker()
      const validationContext: ValidationContext = {
        sourceFile,
        program,
        checker,
        fileName: sourceFile.fileName,
        options: {
          enabled: true,
          strictMode: options.strict || false,
          errorLevel: 'error',
          excludeFiles: [],
          includeFiles: [],
          customRules: [],
          configFile: '',
        },
      }

      const diagnostics: any[] = []

      function visit(node: any): any {
        // Check for TachUI component calls
        if (ts.isCallExpression(node)) {
          validateComponentCall(node, validationContext, diagnostics)
        }

        // Check for TachUI modifier chains
        if (ts.isPropertyAccessExpression(node)) {
          validateModifierAccess(node, validationContext, diagnostics)
        }

        return ts.visitEachChild(node, visit, context)
      }

      const result = ts.visitNode(sourceFile, visit) as any

      // Report diagnostics
      if (diagnostics.length > 0) {
        reportDiagnostics(diagnostics, sourceFile.fileName)
      }

      return result
    }
  }
}

/**
 * Validate TachUI component call expressions
 */
function validateComponentCall(
  node: any,
  context: ValidationContext,
  diagnostics: any[]
): void {
  const { checker, sourceFile } = context

  // Get the function being called
  const signature = checker.getResolvedSignature(node)
  if (!signature || !signature.declaration) return

  const symbolName = getSymbolName(node.expression, checker)
  if (!symbolName) return

  // Check if this is a TachUI component
  const componentPattern = componentPatterns[symbolName]
  if (!componentPattern) return

  const errors = validateComponent(node, componentPattern, context)

  for (const error of errors) {
    diagnostics.push(createDiagnostic(error, sourceFile))
  }
}

/**
 * Validate TachUI modifier property access
 */
function validateModifierAccess(
  node: any,
  context: ValidationContext,
  diagnostics: any[]
): void {
  const { checker, sourceFile } = context

  const modifierName = node.name.text
  const modifierPattern = modifierPatterns[modifierName]

  if (!modifierPattern) return

  // Get the component type this modifier is being applied to
  const componentType = getComponentTypeFromExpression(node.expression, checker)
  if (!componentType) return

  const errors = validateModifier(node, modifierPattern, componentType, context)

  for (const error of errors) {
    diagnostics.push(createDiagnostic(error, sourceFile))
  }
}

/**
 * Validate a component against its pattern
 */
function validateComponent(
  node: any,
  pattern: ComponentValidationPattern,
  context: ValidationContext
): BuildTimeValidationError[] {
  const ts = getTypeScript()
  const errors: BuildTimeValidationError[] = []
  const { sourceFile } = context

  // Check argument count
  const args = node.arguments
  const requiredCount = pattern.requiredProps.length

  if (args.length < requiredCount) {
    const pos = getPosition(node, sourceFile)
    errors.push({
      message: `${pattern.componentName} requires ${requiredCount} arguments, got ${args.length}`,
      code: 'TACH_MISSING_ARGS',
      severity: 'error',
      line: pos.line,
      column: pos.column,
      length: node.getText().length,
      category: 'component',
      component: pattern.componentName,
      suggestion: `Add missing required properties: ${pattern.requiredProps.slice(args.length).join(', ')}`,
      documentationLink: `https://docs.tachui.dev/components/${pattern.componentName.toLowerCase()}`,
    })
  }

  // Validate argument types (basic validation)
  for (let i = 0; i < args.length && i < pattern.requiredProps.length; i++) {
    const arg = args[i]
    const propName = pattern.requiredProps[i]

    // Check for null/undefined
    if (ts.isLiteralExpression(arg) && arg.text === 'null') {
      const pos = getPosition(arg, sourceFile)
      errors.push({
        message: `${propName} cannot be null`,
        code: 'TACH_NULL_PROP',
        severity: 'error',
        line: pos.line,
        column: pos.column,
        length: arg.getText().length,
        category: 'component',
        component: pattern.componentName,
        suggestion: `Provide a valid value for ${propName}`,
      })
    }
  }

  return errors
}

/**
 * Validate a modifier against its pattern
 */
function validateModifier(
  node: any,
  pattern: ModifierValidationPattern,
  componentType: string,
  context: ValidationContext
): BuildTimeValidationError[] {
  const errors: BuildTimeValidationError[] = []
  const { sourceFile } = context

  // Check if modifier is valid for this component type
  if (
    !pattern.validComponents.includes(componentType) &&
    !pattern.validComponents.includes('*')
  ) {
    const pos = getPosition(node, sourceFile)
    errors.push({
      message: `${pattern.modifierName} modifier is not valid for ${componentType} components`,
      code: 'TACH_INVALID_MODIFIER',
      severity: 'error',
      line: pos.line,
      column: pos.column,
      length: node.name.getText().length,
      category: 'modifier',
      component: componentType,
      suggestion: `Use ${pattern.modifierName} with: ${pattern.validComponents.join(', ')}`,
      documentationLink: `https://docs.tachui.dev/modifiers/${pattern.modifierName}`,
    })
  }

  return errors
}

/**
 * Get symbol name from expression
 */
function getSymbolName(expression: any, checker: any): string | null {
  const ts = getTypeScript()

  if (ts.isIdentifier(expression)) {
    return expression.text
  }

  if (ts.isPropertyAccessExpression(expression)) {
    return expression.name.text
  }

  const symbol = checker.getSymbolAtLocation(expression)
  return symbol?.name || null
}

/**
 * Get component type from modifier expression
 */
function getComponentTypeFromExpression(
  expression: any,
  checker: any
): string | null {
  // This is a simplified implementation
  // In practice, we'd need to trace back through the modifier chain
  // to find the original component constructor

  const type = checker.getTypeAtLocation(expression)
  const typeString = checker.typeToString(type)

  // Look for TachUI component types
  const componentMatch = typeString.match(/(\w+)Instance/)
  return componentMatch ? componentMatch[1] : null
}

/**
 * Get line and column position from node
 */
function getPosition(
  node: any,
  sourceFile: any
): { line: number; column: number } {
  const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart())
  return {
    line: pos.line + 1, // 1-based line numbers
    column: pos.character + 1, // 1-based column numbers
  }
}

/**
 * Create TypeScript diagnostic from validation error
 */
function createDiagnostic(
  error: BuildTimeValidationError,
  sourceFile: any
): any {
  const ts = getTypeScript()
  const start = sourceFile.getPositionOfLineAndCharacter(
    error.line - 1,
    error.column - 1
  )

  return {
    file: sourceFile,
    start,
    length: error.length,
    messageText: error.message,
    category: ts.DiagnosticCategory.Error,
    code: error.code as any,
    source: 'tachui',
  }
}

/**
 * Report diagnostics to console in development
 */
function reportDiagnostics(diagnostics: any[], fileName: string): void {
  if (process.env.NODE_ENV === 'production') return

  const ts = getTypeScript()

  console.group(`🔍 TachUI Validation Issues in ${fileName}`)

  for (const diagnostic of diagnostics) {
    const message = ts.flattenDiagnosticMessageText(
      diagnostic.messageText,
      '\n'
    )
    const position =
      diagnostic.file && diagnostic.start !== undefined
        ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
        : { line: 0, character: 0 }

    console.error(
      `❌ Line ${position.line + 1}, Column ${position.character + 1}: ${message}`
    )
  }

  console.groupEnd()
}

/**
 * Create custom validation rule
 */
export function createValidationRule(
  name: string,
  validate: (
    node: any,
    checker: any,
    context: ValidationContext
  ) => ValidationResult
): BuildTimeValidationRule {
  return {
    name,
    severity: 'error',
    description: `Custom validation rule: ${name}`,
    validate,
    generateMessage: error => error.message,
    suggestFix: () => [],
  }
}

/**
 * Validation rule runner
 */
export function runValidationRules(
  rules: BuildTimeValidationRule[],
  node: any,
  context: ValidationContext
): ValidationResult {
  const allErrors: BuildTimeValidationError[] = []
  const allWarnings: BuildTimeValidationError[] = []

  for (const rule of rules) {
    const result = rule.validate(node, context.checker, context)

    if (result.errors) {
      allErrors.push(...result.errors)
    }

    if (result.warnings) {
      // Convert ValidationWarning to BuildTimeValidationError for consistency
      const warningErrors = result.warnings.map(w => ({
        ...w,
        severity: 'warning' as const,
      }))
      allWarnings.push(...warningErrors)
    }
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings as any[], // Type assertion for compatibility
  }
}
