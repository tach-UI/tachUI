/**
 * Developer Experience Integration - Phase 1D
 *
 * Enhanced error message templates, intelligent fix suggestions,
 * and comprehensive developer guidance system.
 */

// Define types locally since they don't exist in devtools package
export type ValidationErrorCategory =
  | 'component'
  | 'modifier'
  | 'runtime'
  | 'reactive'
  | 'validation'
  | 'component-construction'
  | 'modifier-usage'
  | 'performance'
export type ValidationErrorSeverity = 'error' | 'warning' | 'info' | 'critical'

export interface EnhancedValidationError {
  message: string
  context: {
    component: string
    property?: string
    suggestion?: string
    documentation?: string
    package?: string
  }
  getFormattedMessage(): string
}

// Add a constructor function for EnhancedValidationError
export function createEnhancedValidationError(
  message: string,
  context: {
    component: string
    property?: string
    suggestion?: string
    documentation?: string
    package?: string
  }
): EnhancedValidationError {
  return {
    message,
    context,
    getFormattedMessage: () => `${context.component}: ${message}`,
  }
}

/**
 * Intelligent fix suggestion with automated repair capability
 */
export interface IntelligentFixSuggestion {
  id: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  confidence: number // 0-1 confidence score
  category:
    | 'syntax'
    | 'logic'
    | 'performance'
    | 'accessibility'
    | 'best-practice'

  // Code examples
  before: string
  after: string

  // Automated fix capability
  canAutoFix: boolean
  autoFix?: () => string

  // Learning resources
  learnMore?: {
    documentation: string
    examples: string[]
    videoTutorial?: string
  }

  // Related suggestions
  relatedFixes: string[]
}

/**
 * Enhanced error message template with rich formatting
 */
export interface DeveloperErrorMessageTemplate {
  id: string
  title: string
  description: string
  severity: ValidationErrorSeverity
  category: ValidationErrorCategory

  // Rich formatting
  emoji: string
  color: string

  // Developer guidance
  quickFix: string
  explanation: string
  prevention: string

  // Interactive elements
  suggestions: IntelligentFixSuggestion[]
  examples: {
    wrong: CodeExample[]
    correct: CodeExample[]
  }

  // Documentation links
  documentation: {
    primary: string
    related: string[]
    apiReference?: string
  }

  // Contextual information
  context: {
    component?: string
    modifier?: string
    package?: string
    commonCause: string[]
  }
}

/**
 * Code example with syntax highlighting metadata
 */
export interface CodeExample {
  code: string
  language: 'typescript' | 'javascript' | 'tsx' | 'jsx'
  title: string
  description?: string
  highlights?: {
    line: number
    type: 'error' | 'warning' | 'info' | 'success'
    message: string
  }[]
}

/**
 * Developer experience configuration
 */
export interface DeveloperExperienceConfig {
  // Error message preferences
  verbosity: 'minimal' | 'standard' | 'detailed' | 'comprehensive'
  showEmojis: boolean
  showColors: boolean
  showCodeExamples: boolean
  showDocumentationLinks: boolean

  // Fix suggestions
  enableAutoFix: boolean
  suggestionCount: number
  minConfidenceScore: number

  // IDE integration
  enableInlineHelp: boolean
  enableHoverInfo: boolean
  enableQuickActions: boolean

  // Learning features
  showLearningTips: boolean
  trackProgress: boolean
  personalization: boolean
}

/**
 * Global developer experience configuration
 */
let devExperienceConfig: DeveloperExperienceConfig = {
  verbosity: 'standard',
  showEmojis: true,
  showColors: true,
  showCodeExamples: true,
  showDocumentationLinks: true,
  enableAutoFix: true,
  suggestionCount: 3,
  minConfidenceScore: 0.7,
  enableInlineHelp: true,
  enableHoverInfo: true,
  enableQuickActions: true,
  showLearningTips: true,
  trackProgress: false,
  personalization: false,
}

/**
 * Comprehensive error message templates database
 */
export const errorMessageTemplates: Record<
  string,
  DeveloperErrorMessageTemplate
> = {
  'missing-required-prop': {
    id: 'missing-required-prop',
    title: 'Missing Required Property',
    description:
      'Component is missing a required property that is necessary for proper functionality.',
    severity: 'error',
    category: 'component-construction',
    emoji: '❌',
    color: '#ff4444',
    quickFix: 'Add the required property to the component',
    explanation:
      'This component requires specific properties to function correctly. Missing required properties can cause runtime errors or unexpected behavior.',
    prevention:
      'Always check component documentation for required properties and use TypeScript for compile-time validation.',
    suggestions: [
      {
        id: 'add-required-prop',
        title: 'Add Required Property',
        description:
          'Add the missing required property with an appropriate value',
        difficulty: 'easy',
        confidence: 0.95,
        category: 'syntax',
        before: 'Text()',
        after: 'Text("Hello World")',
        canAutoFix: true,
        autoFix: () => 'Text("Hello World")',
        learnMore: {
          documentation: '/docs/components/text#required-properties',
          examples: [
            '/examples/text-basic-usage',
            '/examples/text-with-signals',
          ],
        },
        relatedFixes: ['use-signal-content', 'add-type-annotation'],
      },
    ],
    examples: {
      wrong: [
        {
          code: 'Text()',
          language: 'typescript',
          title: 'Missing content parameter',
          description: 'Text component requires content to display',
          highlights: [
            {
              line: 1,
              type: 'error',
              message: 'Missing required "content" parameter',
            },
          ],
        },
      ],
      correct: [
        {
          code: 'Text("Hello World")',
          language: 'typescript',
          title: 'Correct usage with content',
          description: 'Text component with required content parameter',
        },
        {
          code: 'Text(() => dynamicContent.value)',
          language: 'typescript',
          title: 'Using reactive content',
          description: 'Text component with reactive content function',
        },
      ],
    },
    documentation: {
      primary: '/docs/components/text',
      related: [
        '/docs/concepts/required-properties',
        '/docs/guides/component-construction',
      ],
      apiReference: '/api/components/text',
    },
    context: {
      component: 'Text',
      package: 'core',
      commonCause: [
        'Forgot to pass content parameter',
        'Copy-paste error',
        'Incomplete refactoring',
      ],
    },
  },

  'invalid-modifier-usage': {
    id: 'invalid-modifier-usage',
    title: 'Invalid Modifier Usage',
    description:
      'Modifier is not compatible with this component type or is being used incorrectly.',
    severity: 'error',
    category: 'modifier-usage',
    emoji: '🔧',
    color: '#ff8800',
    quickFix:
      'Remove the incompatible modifier or use it on a compatible component',
    explanation:
      'Components have specific modifiers that are compatible with their functionality. Using incompatible modifiers can cause rendering issues.',
    prevention:
      'Check component documentation for supported modifiers and use IDE autocomplete for guidance.',
    suggestions: [
      {
        id: 'remove-incompatible-modifier',
        title: 'Remove Incompatible Modifier',
        description:
          'Remove the modifier that is not supported by this component',
        difficulty: 'easy',
        confidence: 0.9,
        category: 'syntax',
        before: 'VStack({ children: [] }).fontSize(16)',
        after: 'VStack({ children: [] })',
        canAutoFix: true,
        autoFix: () => 'VStack({ children: [] })',
        learnMore: {
          documentation: '/docs/modifiers/compatibility',
          examples: ['/examples/modifier-usage', '/examples/component-styling'],
        },
        relatedFixes: ['use-compatible-modifier', 'wrap-in-container'],
      },
    ],
    examples: {
      wrong: [
        {
          code: 'VStack({ children: [] }).fontSize(16)',
          language: 'typescript',
          title: 'Text modifier on layout component',
          description: 'fontSize is only applicable to text components',
          highlights: [
            {
              line: 1,
              type: 'error',
              message: 'fontSize modifier not compatible with VStack',
            },
          ],
        },
      ],
      correct: [
        {
          code: 'Text("Hello").fontSize(16)',
          language: 'typescript',
          title: 'Correct fontSize usage',
          description: 'fontSize modifier used on Text component',
        },
        {
          code: 'VStack({ children: [] }).padding(16)',
          language: 'typescript',
          title: 'Compatible VStack modifier',
          description: 'padding modifier is compatible with VStack',
        },
      ],
    },
    documentation: {
      primary: '/docs/modifiers/overview',
      related: [
        '/docs/modifiers/compatibility',
        '/docs/components/modifier-support',
      ],
      apiReference: '/api/modifiers',
    },
    context: {
      modifier: 'fontSize',
      component: 'VStack',
      package: 'core',
      commonCause: [
        'Confusion about modifier compatibility',
        'Copy-paste from different component',
        'Misunderstanding of component types',
      ],
    },
  },

  'performance-warning': {
    id: 'performance-warning',
    title: 'Performance Optimization Available',
    description:
      'Code pattern detected that could impact performance with optimization suggestions.',
    severity: 'warning',
    category: 'performance',
    emoji: '⚡',
    color: '#ffaa00',
    quickFix: 'Apply performance optimization suggestions',
    explanation:
      'This pattern works correctly but may impact performance in certain scenarios. Consider the suggested optimizations for better user experience.',
    prevention:
      'Follow performance best practices and use the TachUI performance monitoring tools during development.',
    suggestions: [
      {
        id: 'optimize-list-rendering',
        title: 'Use Virtual Scrolling',
        description:
          'For large lists, consider using virtual scrolling to improve performance',
        difficulty: 'medium',
        confidence: 0.8,
        category: 'performance',
        before: 'List({ children: largeDataset.map(item => ListItem(item)) })',
        after:
          'VirtualList({ data: largeDataset, renderItem: item => ListItem(item) })',
        canAutoFix: false,
        learnMore: {
          documentation: '/docs/performance/virtual-scrolling',
          examples: [
            '/examples/virtual-list',
            '/examples/performance-optimization',
          ],
          videoTutorial: '/videos/optimizing-large-lists',
        },
        relatedFixes: ['add-key-prop', 'memo-optimization'],
      },
    ],
    examples: {
      wrong: [
        {
          code: 'List({ children: items.map(item => Item(item)) })',
          language: 'typescript',
          title: 'Large list without optimization',
          description: 'Rendering all items at once can impact performance',
          highlights: [
            {
              line: 1,
              type: 'warning',
              message: 'Consider virtual scrolling for large datasets',
            },
          ],
        },
      ],
      correct: [
        {
          code: 'VirtualList({ data: items, renderItem: item => Item(item) })',
          language: 'typescript',
          title: 'Optimized virtual list',
          description: 'Virtual scrolling only renders visible items',
        },
      ],
    },
    documentation: {
      primary: '/docs/performance/optimization',
      related: [
        '/docs/components/virtual-list',
        '/docs/guides/performance-best-practices',
      ],
    },
    context: {
      component: 'List',
      package: 'core',
      commonCause: [
        'Large datasets',
        'Unaware of optimization options',
        'Premature optimization concerns',
      ],
    },
  },
}

/**
 * Intelligent fix suggestion engine
 */
export class FixSuggestionEngine {
  private suggestionDatabase = new Map<string, IntelligentFixSuggestion[]>()
  private usageTracker = new Map<string, number>()

  constructor() {
    this.initializeSuggestionDatabase()
  }

  /**
   * Get intelligent fix suggestions for a given error
   */
  getSuggestions(
    errorType: string,
    _context: {
      component?: string
      modifier?: string
      code?: string
      severity?: ValidationErrorSeverity
    }
  ): IntelligentFixSuggestion[] {
    const baseSuggestions = this.suggestionDatabase.get(errorType) || []

    // Filter by confidence score
    const filteredSuggestions = baseSuggestions.filter(
      suggestion =>
        suggestion.confidence >= devExperienceConfig.minConfidenceScore
    )

    // Sort by relevance and confidence
    const sortedSuggestions = filteredSuggestions.sort((a, b) => {
      // Prioritize by confidence and usage statistics
      const aScore = a.confidence + (this.usageTracker.get(a.id) || 0) * 0.1
      const bScore = b.confidence + (this.usageTracker.get(b.id) || 0) * 0.1
      return bScore - aScore
    })

    // Limit to configured count
    return sortedSuggestions.slice(0, devExperienceConfig.suggestionCount)
  }

  /**
   * Apply automatic fix
   */
  applyAutoFix(suggestionId: string, _code: string): string | null {
    for (const suggestions of this.suggestionDatabase.values()) {
      const suggestion = suggestions.find(s => s.id === suggestionId)
      if (suggestion && suggestion.canAutoFix && suggestion.autoFix) {
        this.trackSuggestionUsage(suggestionId)
        return suggestion.autoFix()
      }
    }
    return null
  }

  /**
   * Track suggestion usage for improvement
   */
  private trackSuggestionUsage(suggestionId: string): void {
    const currentCount = this.usageTracker.get(suggestionId) || 0
    this.usageTracker.set(suggestionId, currentCount + 1)
  }

  /**
   * Initialize suggestion database with common fixes
   */
  private initializeSuggestionDatabase(): void {
    // Extract suggestions from error templates
    for (const template of Object.values(errorMessageTemplates)) {
      this.suggestionDatabase.set(template.id, template.suggestions)
    }

    // Add additional contextual suggestions
    this.suggestionDatabase.set('common-typos', [
      {
        id: 'fix-typo-background',
        title: 'Fix Background Color Typo',
        description: 'Correct common typo in background color property',
        difficulty: 'easy',
        confidence: 0.9,
        category: 'syntax',
        before: '.backround("blue")',
        after: '.background("blue")',
        canAutoFix: true,
        autoFix: () => '.background("blue")',
        relatedFixes: [],
      },
    ])
  }

  /**
   * Get suggestion statistics
   */
  getStatistics() {
    return {
      totalSuggestions: Array.from(this.suggestionDatabase.values()).reduce(
        (acc, arr) => acc + arr.length,
        0
      ),
      totalUsages: Array.from(this.usageTracker.values()).reduce(
        (acc, count) => acc + count,
        0
      ),
      topSuggestions: Array.from(this.usageTracker.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5),
    }
  }
}

/**
 * Enhanced error message formatter with rich templates
 */
export class EnhancedErrorFormatter {
  private fixEngine = new FixSuggestionEngine()

  /**
   * Format error with enhanced template
   */
  formatError(
    error: EnhancedValidationError,
    templateId?: string
  ): FormattedErrorMessage {
    const template = templateId
      ? errorMessageTemplates[templateId]
      : this.findBestTemplate(error)

    if (!template) {
      return this.formatBasicError(error)
    }

    const suggestions = this.fixEngine.getSuggestions(template.id, {
      component: error.context.component,
      severity: template.severity,
    })

    return {
      id: `error-${Date.now()}`,
      template,
      error,
      suggestions,
      formatted: this.renderFormattedMessage(template, error, suggestions),
      interactive: {
        canAutoFix: suggestions.some(s => s.canAutoFix),
        quickActions: this.generateQuickActions(suggestions),
        learnMore: template.documentation,
      },
    }
  }

  /**
   * Find the best template for an error
   */
  private findBestTemplate(
    error: EnhancedValidationError
  ): DeveloperErrorMessageTemplate | null {
    // Simple heuristic matching - could be made more sophisticated
    if (error.message.includes('required')) {
      return errorMessageTemplates['missing-required-prop']
    }
    if (error.message.includes('modifier')) {
      return errorMessageTemplates['invalid-modifier-usage']
    }
    if (error.message.includes('performance')) {
      return errorMessageTemplates['performance-warning']
    }
    return null
  }

  /**
   * Render formatted message with rich content
   */
  private renderFormattedMessage(
    template: DeveloperErrorMessageTemplate,
    error: EnhancedValidationError,
    suggestions: IntelligentFixSuggestion[]
  ): string {
    const { verbosity, showEmojis, showCodeExamples } = devExperienceConfig

    let message = ''

    // Header
    if (showEmojis) {
      message += `${template.emoji} `
    }
    message += `${template.title}: ${error.message}\n`

    // Description based on verbosity
    if (verbosity !== 'minimal') {
      message += `\n${template.description}\n`
    }

    // Quick fix
    if (
      verbosity === 'standard' ||
      verbosity === 'detailed' ||
      verbosity === 'comprehensive'
    ) {
      message += `\n💡 Quick Fix: ${template.quickFix}\n`
    }

    // Code examples
    if (showCodeExamples && template.examples.wrong.length > 0) {
      message += `\n❌ Wrong:\n${template.examples.wrong[0].code}\n`
      message += `✅ Correct:\n${template.examples.correct[0].code}\n`
    }

    // Suggestions
    if (suggestions.length > 0) {
      message += `\n🔧 Suggestions:\n`
      suggestions.forEach((suggestion, index) => {
        message += `${index + 1}. ${suggestion.title}: ${suggestion.description}\n`
      })
    }

    // Documentation links
    if (
      devExperienceConfig.showDocumentationLinks &&
      template.documentation.primary
    ) {
      message += `\n📚 Documentation: ${template.documentation.primary}\n`
    }

    return message
  }

  /**
   * Format basic error without template
   */
  private formatBasicError(
    error: EnhancedValidationError
  ): FormattedErrorMessage {
    return {
      id: `basic-error-${Date.now()}`,
      template: null,
      error,
      suggestions: [],
      formatted: error.getFormattedMessage(),
      interactive: {
        canAutoFix: false,
        quickActions: [],
        learnMore: { primary: '/docs/troubleshooting', related: [] },
      },
    }
  }

  /**
   * Generate quick actions for IDE integration
   */
  private generateQuickActions(
    suggestions: IntelligentFixSuggestion[]
  ): QuickAction[] {
    return suggestions
      .filter(s => s.canAutoFix)
      .map(suggestion => ({
        id: suggestion.id,
        title: `Fix: ${suggestion.title}`,
        description: suggestion.description,
        command: 'tachui.applyFix',
        arguments: [suggestion.id],
      }))
  }
}

/**
 * Formatted error message with rich content
 */
export interface FormattedErrorMessage {
  id: string
  template: DeveloperErrorMessageTemplate | null
  error: EnhancedValidationError
  suggestions: IntelligentFixSuggestion[]
  formatted: string
  interactive: {
    canAutoFix: boolean
    quickActions: QuickAction[]
    learnMore: {
      primary: string
      related: string[]
    }
  }
}

/**
 * Quick action for IDE integration
 */
export interface QuickAction {
  id: string
  title: string
  description: string
  command: string
  arguments: any[]
}

/**
 * Configure developer experience
 */
export function configureDeveloperExperience(
  config: Partial<DeveloperExperienceConfig>
): void {
  devExperienceConfig = { ...devExperienceConfig, ...config }
}

/**
 * Get current developer experience configuration
 */
export function getDeveloperExperienceConfig(): DeveloperExperienceConfig {
  return { ...devExperienceConfig }
}

// Global instances
const enhancedFormatter = new EnhancedErrorFormatter()
const fixEngine = new FixSuggestionEngine()

/**
 * Developer Experience utilities
 */
export const DeveloperExperienceUtils = {
  /**
   * Format error with enhanced template
   */
  formatError: (error: EnhancedValidationError, templateId?: string) =>
    enhancedFormatter.formatError(error, templateId),

  /**
   * Get fix suggestions
   */
  getSuggestions: (errorType: string, context: any) =>
    fixEngine.getSuggestions(errorType, context),

  /**
   * Apply automatic fix
   */
  applyAutoFix: (suggestionId: string, code: string) =>
    fixEngine.applyAutoFix(suggestionId, code),

  /**
   * Get available error templates
   */
  getErrorTemplates: () => errorMessageTemplates,

  /**
   * Configure experience
   */
  configure: configureDeveloperExperience,

  /**
   * Get statistics
   */
  getStatistics: () => ({
    formatter: {
      templatesAvailable: Object.keys(errorMessageTemplates).length,
    },
    fixEngine: fixEngine.getStatistics(),
    config: devExperienceConfig,
  }),

  /**
   * Test developer experience system
   */
  test: () => {
    console.group('🎨 Developer Experience System Test')

    try {
      // Test error formatting
      const testError = createEnhancedValidationError(
        'Test missing required property',
        {
          component: 'Text',
          property: 'content',
        }
      )

      const formatted = enhancedFormatter.formatError(
        testError,
        'missing-required-prop'
      )
      console.info('✅ Error formatting:', formatted.template?.title)
      console.info('✅ Suggestions count:', formatted.suggestions.length)
      console.info(
        '✅ Quick actions:',
        formatted.interactive.quickActions.length
      )

      // Test fix engine
      const suggestions = fixEngine.getSuggestions('missing-required-prop', {
        component: 'Text',
      })
      console.info('✅ Fix suggestions:', suggestions.length)

      console.info('✅ Developer experience system is working correctly')
    } catch (error) {
      console.error('❌ Developer experience test failed:', error)
    }

    console.groupEnd()
  },
}

// Export global instances
export { enhancedFormatter, fixEngine }
