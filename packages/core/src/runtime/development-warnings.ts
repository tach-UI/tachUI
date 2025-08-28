/**
 * Development Warning System - Tag Override Safety
 * 
 * Provides helpful console warnings during development when components
 * use tag overrides, particularly for potentially problematic combinations.
 */

export class DevelopmentWarnings {
  private static warningsShown = new Set<string>()

  /**
   * Warn about element tag overrides in development
   */
  static warnElementOverride(
    componentType: string, 
    originalTag: string, 
    overrideTag: string
  ): void {
    if (process.env.NODE_ENV === 'production') return

    const warningKey = `${componentType}-${originalTag}-${overrideTag}`
    if (this.warningsShown.has(warningKey)) return

    this.warningsShown.add(warningKey)
    
    console.warn(
      `[tachUI] ${componentType} (${originalTag}) overridden to <${overrideTag}>. ` +
      `Ensure this maintains expected behavior and accessibility.`
    )
  }

  /**
   * Error for invalid HTML tags
   */
  static errorInvalidTag(tag: string, componentType: string): void {
    if (process.env.NODE_ENV === 'production') return

    console.error(
      `[tachUI] Invalid HTML tag '${tag}' specified for ${componentType}. ` +
      `Using tag as-is - ensure this is intentional.`
    )
  }

  /**
   * Info message for semantic role application
   */
  static infoSemanticRole(tag: string, role: string): void {
    if (process.env.NODE_ENV !== 'development') return

    console.info(`[tachUI] Applied semantic role '${role}' to <${tag}> element`)
  }

  /**
   * Warn about potentially problematic tag combinations
   */
  static warnProblematicCombination(
    componentType: string, 
    tag: string, 
    issue: string,
    severity: 'warning' | 'info' = 'warning'
  ): void {
    if (process.env.NODE_ENV === 'production') return

    const warningKey = `${componentType}-${tag}-${issue}`
    if (this.warningsShown.has(warningKey)) return

    this.warningsShown.add(warningKey)
    
    const logFunction = severity === 'warning' ? console.warn : console.info
    logFunction(`[tachUI] ${componentType}: ${issue}`)
  }

  /**
   * Warn about accessibility concerns
   */
  static warnAccessibility(
    componentType: string,
    tag: string,
    accessibilityIssue: string
  ): void {
    if (process.env.NODE_ENV === 'production') return

    const warningKey = `a11y-${componentType}-${tag}-${accessibilityIssue}`
    if (this.warningsShown.has(warningKey)) return

    this.warningsShown.add(warningKey)
    
    console.warn(
      `[tachUI A11y] ${componentType} with <${tag}>: ${accessibilityIssue}. ` +
      `Consider using appropriate ARIA attributes or different semantic structure.`
    )
  }

  /**
   * Clear all shown warnings (useful for testing)
   */
  static clearWarnings(): void {
    this.warningsShown.clear()
  }

  /**
   * Check if a warning has been shown
   */
  static hasWarningBeenShown(warningKey: string): boolean {
    return this.warningsShown.has(warningKey)
  }

  /**
   * Get count of unique warnings shown
   */
  static getWarningCount(): number {
    return this.warningsShown.size
  }
}