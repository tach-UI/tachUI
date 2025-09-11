/**
 * Runtime Modifier Parameter Validation & Development Helpers
 *
 * Provides development-time validation, warnings, and helpful error messages for modifier usage
 */

import { modifierParameterRegistry } from './modifier-parameter-system'

interface ValidationError {
  modifier: string
  parameter?: string
  message: string
  suggestion?: string
  severity: 'error' | 'warning' | 'info'
  type?: string
}

interface UsageStats {
  modifier: string
  usageCount: number
  bundleContribution: string
  alternatives?: string[]
}

export class RuntimeModifierValidator {
  private usageStats = new Map<string, number>()
  private validationErrors: ValidationError[] = []
  private isDevMode =
    typeof process !== 'undefined' && process.env.NODE_ENV === 'development'

  /**
   * Validate modifier parameters when modifier is applied
   */
  validateModifier(
    modifierName: string,
    parameters: any,
    componentName?: string
  ): ValidationError[] {
    if (!this.isDevMode) return []

    const errors: ValidationError[] = []
    const modifier = modifierParameterRegistry.getModifier(modifierName)

    if (!modifier) {
      errors.push({
        modifier: modifierName,
        message: `Unknown modifier '${modifierName}'`,
        suggestion: this.findSimilarModifier(modifierName),
        severity: 'error',
      })
      return errors
    }

    // Track usage statistics
    this.trackUsage(modifierName)

    // Validate parameters
    const validation = modifierParameterRegistry.validateParameters(
      modifierName,
      parameters
    )

    for (const error of validation.errors) {
      errors.push({
        modifier: modifierName,
        message: error,
        severity: 'error',
      })
    }

    // Check for performance concerns
    const performanceWarnings = this.checkPerformanceConcerns(
      modifier,
      parameters
    )
    errors.push(...performanceWarnings)

    // Check for better alternatives
    const alternatives = this.suggestAlternatives(modifier, parameters)
    errors.push(...alternatives)

    // Log errors in development
    if (errors.length > 0) {
      this.logValidationErrors(errors, componentName)
    }

    this.validationErrors.push(...errors)
    return errors
  }

  private findSimilarModifier(modifierName: string): string | undefined {
    const allModifiers = modifierParameterRegistry.getAllModifiers()
    const similarModifiers = allModifiers
      .map(m => ({
        name: m.name,
        similarity: this.calculateSimilarity(modifierName, m.name),
      }))
      .filter(m => m.similarity > 0.6)
      .sort((a, b) => b.similarity - a.similarity)

    return similarModifiers.length > 0
      ? `Did you mean '${similarModifiers[0].name}'?`
      : undefined
  }

  private calculateSimilarity(a: string, b: string): number {
    const longer = a.length > b.length ? a : b
    const shorter = a.length > b.length ? b : a
    const editDistance = this.levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = []

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    return matrix[str2.length][str1.length]
  }

  private checkPerformanceConcerns(
    modifier: any,
    _parameters: any
  ): ValidationError[] {
    const warnings: ValidationError[] = []

    // Check for expensive modifiers that should be cached
    const expensiveModifiers = ['filter', 'backdrop', 'complex-transform']
    if (expensiveModifiers.includes(modifier.type)) {
      warnings.push({
        modifier: modifier.name,
        type: 'performance',
        severity: 'warning',
        message: `Modifier '${modifier.type}' can be expensive. Consider caching if used frequently.`,
        suggestion: `Use computed properties or memoization for '${modifier.type}' with dynamic values.`,
      })
    }

    return warnings
  }

  private parseBundleSize(bundleSize: string): number {
    const match = bundleSize.match(/(\d+)/)
    return match ? parseInt(match[1]) : 0
  }

  private suggestAlternatives(
    modifier: any,
    _parameters: any
  ): ValidationError[] {
    const suggestions: ValidationError[] = []

    // Suggest more modern alternatives
    const alternatives: Record<string, string> = {
      flexDirection:
        'Use VStack() or HStack() instead of flexDirection modifier',
      position:
        'Consider using .frame() or layout containers instead of absolute positioning',
      float:
        'Use modern layout techniques like flexbox or grid instead of float',
    }

    if (alternatives[modifier.type]) {
      suggestions.push({
        modifier: modifier.name,
        type: 'suggestion',
        severity: 'info',
        message: `Consider modern alternative to '${modifier.type}'`,
        suggestion: alternatives[modifier.type],
      })
    }

    return suggestions
  }

  private trackUsage(modifierName: string) {
    const count = this.usageStats.get(modifierName) || 0
    this.usageStats.set(modifierName, count + 1)
  }

  private logValidationErrors(
    errors: ValidationError[],
    componentName?: string
  ) {
    const component = componentName ? `in ${componentName}` : ''

    for (const error of errors) {
      const prefix =
        error.severity === 'error'
          ? '❌'
          : error.severity === 'warning'
            ? '⚠️'
            : '💡'

      console.group(
        `${prefix} TachUI Modifier ${error.severity.toUpperCase()} ${component}`
      )
      console.log(error.message)
      if (error.suggestion) {
        console.log(`💡 Suggestion: ${error.suggestion}`)
      }
      console.groupEnd()
    }
  }

  /**
   * Generate usage report for development insights
   */
  generateUsageReport(): {
    summary: UsageStats[]
    totalBundleSize: string
    recommendations: string[]
  } {
    const summary: UsageStats[] = []
    let totalBundleSize = 0

    for (const [modifierName, count] of this.usageStats.entries()) {
      const modifier = modifierParameterRegistry.getModifier(modifierName)
      if (modifier) {
        const bundleSize = this.parseBundleSize(modifier.bundleSize)
        totalBundleSize += bundleSize * count

        summary.push({
          modifier: modifierName,
          usageCount: count,
          bundleContribution: `${bundleSize * count}KB`,
          alternatives: modifier.relatedModifiers,
        })
      }
    }

    summary.sort(
      (a, b) =>
        this.parseBundleSize(b.bundleContribution) -
        this.parseBundleSize(a.bundleContribution)
    )

    const recommendations = this.generateRecommendations(summary)

    return {
      summary,
      totalBundleSize: `${totalBundleSize}KB`,
      recommendations,
    }
  }

  private generateRecommendations(summary: UsageStats[]): string[] {
    const recommendations: string[] = []

    // Check for heavy usage patterns
    const heavyModifiers = summary.filter(
      s => this.parseBundleSize(s.bundleContribution) > 20
    )
    if (heavyModifiers.length > 0) {
      recommendations.push(
        `Consider optimizing heavy modifiers: ${heavyModifiers.map(m => m.modifier).join(', ')}`
      )
    }

    // Check for redundant usage
    const paddingUsage = summary.find(s => s.modifier === 'padding')
    const marginUsage = summary.find(s => s.modifier === 'margin')
    if (paddingUsage && marginUsage) {
      recommendations.push(
        'Consider combining padding/margin usage with spacing utilities'
      )
    }

    // Check for responsive overuse
    const responsiveUsage = summary.find(s => s.modifier === 'responsive')
    if (responsiveUsage && responsiveUsage.usageCount > 10) {
      recommendations.push(
        'Consider using CSS media queries instead of responsive modifiers'
      )
    }

    return recommendations
  }

  /**
   * Clear validation errors and usage stats
   */
  reset() {
    this.validationErrors = []
    this.usageStats.clear()
  }

  /**
   * Get all validation errors
   */
  getValidationErrors(): ValidationError[] {
    return [...this.validationErrors]
  }

  /**
   * Display development dashboard
   */
  showDevelopmentDashboard() {
    if (!this.isDevMode) return

    const report = this.generateUsageReport()

    console.group('🎯 TachUI Development Dashboard')
    console.log(`Total Bundle Size: ${report.totalBundleSize}`)
    console.log(`Modifiers Used: ${report.summary.length}`)
    console.log(
      `Validation Errors: ${this.validationErrors.filter(e => e.severity === 'error').length}`
    )

    if (report.summary.length > 0) {
      console.group('📊 Usage Summary')
      console.table(report.summary.slice(0, 5)) // Top 5
      console.groupEnd()
    }

    if (report.recommendations.length > 0) {
      console.group('💡 Recommendations')
      for (const rec of report.recommendations) {
        console.log(`• ${rec}`)
      }
      console.groupEnd()
    }

    console.groupEnd()
  }
}

// Global instance for development
export const runtimeValidator = new RuntimeModifierValidator()

/**
 * Development helper: log modifier parameters
 */
export function logModifierUsage(
  modifierName: string,
  parameters: any,
  componentName?: string
) {
  if (
    typeof process !== 'undefined' &&
    process.env.NODE_ENV === 'development'
  ) {
    console.log(
      `🔧 ${modifierName}(${JSON.stringify(parameters)}) ${componentName ? `in ${componentName}` : ''}`
    )
  }
}

/**
 * Development helper: validate and provide hints
 */
export function validateAndHint(
  modifierName: string,
  parameters: any,
  componentName?: string
) {
  const errors = runtimeValidator.validateModifier(
    modifierName,
    parameters,
    componentName
  )

  if (errors.length === 0) {
    const hints = modifierParameterRegistry.generateParameterHints(modifierName)
    if (
      hints.length > 0 &&
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      console.group(`💡 ${modifierName} Parameter Hints`)
      for (const hint of hints) {
        console.log(hint)
      }
      console.groupEnd()
    }
  }

  return errors
}

/**
 * Auto-setup development helpers (call once in development)
 */
export function setupDevelopmentHelpers() {
  if (
    typeof process !== 'undefined' &&
    process.env.NODE_ENV === 'development'
  ) {
    // Show dashboard periodically
    setInterval(() => {
      if (runtimeValidator.getValidationErrors().length > 0) {
        runtimeValidator.showDevelopmentDashboard()
        runtimeValidator.reset()
      }
    }, 30000) // Every 30 seconds

    console.log('🛠️ TachUI Development Helpers Enabled')
  }
}
