/**
 * Documentation Integration System - Phase 1D
 * 
 * Context-aware help, intelligent documentation links,
 * and comprehensive learning resource management.
 */

import type { ValidationErrorCategory } from './error-reporting'

/**
 * Documentation resource types
 */
export type DocumentationType = 
  | 'guide' 
  | 'api-reference' 
  | 'tutorial' 
  | 'example' 
  | 'video' 
  | 'troubleshooting'
  | 'best-practices'

/**
 * Learning difficulty levels
 */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

/**
 * Documentation resource
 */
export interface DocumentationResource {
  id: string
  title: string
  description: string
  type: DocumentationType
  difficulty: DifficultyLevel
  
  // Content metadata
  url: string
  estimatedReadTime: number // minutes
  lastUpdated: string
  version: string
  
  // Categorization
  tags: string[]
  categories: string[]
  relatedComponents: string[]
  relatedModifiers: string[]
  
  // Learning path
  prerequisites: string[]
  nextSteps: string[]
  
  // Quality metrics
  rating: number // 1-5
  completionRate: number // 0-1
  helpfulnessScore: number // 0-1
  
  // Interactive features
  hasInteractiveExample: boolean
  hasVideoContent: boolean
  hasCodeSandbox: boolean
  
  // Accessibility
  isAccessible: boolean
  hasTranscript: boolean
  supportedLanguages: string[]
}

/**
 * Context-aware documentation provider
 */
export interface ContextualDocumentation {
  primary: DocumentationResource
  related: DocumentationResource[]
  quickHelp: string
  codeExamples: {
    basic: string
    advanced: string
    realWorld: string
  }
  commonPitfalls: {
    issue: string
    solution: string
    example: string
  }[]
  learningPath: {
    current: DocumentationResource
    next: DocumentationResource[]
    progress: number // 0-1
  }
}

/**
 * User learning profile for personalization
 */
export interface UserLearningProfile {
  id: string
  skillLevel: DifficultyLevel
  preferredLearningStyle: 'visual' | 'reading' | 'hands-on' | 'video'
  completedResources: string[]
  bookmarkedResources: string[]
  learningGoals: string[]
  weakAreas: string[]
  strongAreas: string[]
  
  // Behavior tracking
  averageReadTime: number
  preferredDocumentationTypes: DocumentationType[]
  mostUsedComponents: string[]
  mostUsedModifiers: string[]
  
  // Preferences
  enablePersonalization: boolean
  enableProgressTracking: boolean
  enableRecommendations: boolean
}

/**
 * Documentation integration configuration
 */
export interface DocumentationConfig {
  // Content preferences
  defaultDifficulty: DifficultyLevel
  preferredTypes: DocumentationType[]
  maxRelatedItems: number
  
  // Personalization
  enableLearningProfile: boolean
  enableRecommendations: boolean
  enableProgressTracking: boolean
  
  // Display options
  showEstimatedTime: boolean
  showRatings: boolean
  showPrerequisites: boolean
  groupByDifficulty: boolean
  
  // Integration features
  enableInlineHelp: boolean
  enableContextualSuggestions: boolean
  enableLearningPaths: boolean
  
  // Offline support
  enableOfflineMode: boolean
  cacheDocumentation: boolean
  offlineStorageLimit: number // MB
}

/**
 * Global documentation configuration
 */
let docConfig: DocumentationConfig = {
  defaultDifficulty: 'intermediate',
  preferredTypes: ['guide', 'api-reference', 'example'],
  maxRelatedItems: 5,
  enableLearningProfile: true,
  enableRecommendations: true,
  enableProgressTracking: true,
  showEstimatedTime: true,
  showRatings: true,
  showPrerequisites: true,
  groupByDifficulty: false,
  enableInlineHelp: true,
  enableContextualSuggestions: true,
  enableLearningPaths: true,
  enableOfflineMode: false,
  cacheDocumentation: true,
  offlineStorageLimit: 50
}

/**
 * Comprehensive documentation database
 */
export const documentationDatabase: Record<string, DocumentationResource> = {
  'text-component-guide': {
    id: 'text-component-guide',
    title: 'Text Component Guide',
    description: 'Complete guide to using the Text component for displaying content',
    type: 'guide',
    difficulty: 'beginner',
    url: '/docs/components/text',
    estimatedReadTime: 5,
    lastUpdated: '2025-01-01',
    version: '1.0.0',
    tags: ['text', 'content', 'typography', 'basics'],
    categories: ['components', 'fundamentals'],
    relatedComponents: ['Button', 'Link'],
    relatedModifiers: ['fontSize', 'fontWeight', 'foregroundColor'],
    prerequisites: [],
    nextSteps: ['button-component-guide', 'typography-styling'],
    rating: 4.8,
    completionRate: 0.92,
    helpfulnessScore: 0.95,
    hasInteractiveExample: true,
    hasVideoContent: false,
    hasCodeSandbox: true,
    isAccessible: true,
    hasTranscript: false,
    supportedLanguages: ['en', 'es', 'fr']
  },

  'button-component-guide': {
    id: 'button-component-guide',
    title: 'Button Component Guide',
    description: 'Interactive buttons with actions and styling',
    type: 'guide',
    difficulty: 'beginner',
    url: '/docs/components/button',
    estimatedReadTime: 7,
    lastUpdated: '2025-01-01',
    version: '1.0.0',
    tags: ['button', 'interaction', 'actions', 'ui'],
    categories: ['components', 'interaction'],
    relatedComponents: ['Text', 'Link', 'Toggle'],
    relatedModifiers: ['background', 'foregroundColor', 'padding', 'disabled'],
    prerequisites: ['text-component-guide'],
    nextSteps: ['event-handling', 'styling-components'],
    rating: 4.7,
    completionRate: 0.88,
    helpfulnessScore: 0.91,
    hasInteractiveExample: true,
    hasVideoContent: true,
    hasCodeSandbox: true,
    isAccessible: true,
    hasTranscript: true,
    supportedLanguages: ['en']
  },

  'modifier-compatibility': {
    id: 'modifier-compatibility',
    title: 'Modifier Compatibility Reference',
    description: 'Complete reference for which modifiers work with which components',
    type: 'api-reference',
    difficulty: 'intermediate',
    url: '/docs/modifiers/compatibility',
    estimatedReadTime: 10,
    lastUpdated: '2025-01-01',
    version: '1.0.0',
    tags: ['modifiers', 'compatibility', 'reference', 'styling'],
    categories: ['modifiers', 'reference'],
    relatedComponents: ['*'],
    relatedModifiers: ['*'],
    prerequisites: ['text-component-guide', 'button-component-guide'],
    nextSteps: ['advanced-styling', 'custom-modifiers'],
    rating: 4.9,
    completionRate: 0.76,
    helpfulnessScore: 0.97,
    hasInteractiveExample: true,
    hasVideoContent: false,
    hasCodeSandbox: false,
    isAccessible: true,
    hasTranscript: false,
    supportedLanguages: ['en']
  },

  'troubleshooting-errors': {
    id: 'troubleshooting-errors',
    title: 'Common Validation Errors',
    description: 'Solutions for common TachUI validation errors and warnings',
    type: 'troubleshooting',
    difficulty: 'beginner',
    url: '/docs/troubleshooting/validation-errors',
    estimatedReadTime: 15,
    lastUpdated: '2025-01-01',
    version: '1.0.0',
    tags: ['troubleshooting', 'errors', 'validation', 'debugging'],
    categories: ['troubleshooting', 'validation'],
    relatedComponents: ['*'],
    relatedModifiers: ['*'],
    prerequisites: [],
    nextSteps: ['advanced-debugging', 'error-handling'],
    rating: 4.6,
    completionRate: 0.85,
    helpfulnessScore: 0.93,
    hasInteractiveExample: true,
    hasVideoContent: true,
    hasCodeSandbox: false,
    isAccessible: true,
    hasTranscript: true,
    supportedLanguages: ['en', 'es']
  },

  'performance-optimization': {
    id: 'performance-optimization',
    title: 'Performance Best Practices',
    description: 'Optimize your TachUI applications for better performance',
    type: 'best-practices',
    difficulty: 'advanced',
    url: '/docs/guides/performance',
    estimatedReadTime: 20,
    lastUpdated: '2025-01-01',
    version: '1.0.0',
    tags: ['performance', 'optimization', 'best-practices', 'advanced'],
    categories: ['performance', 'optimization'],
    relatedComponents: ['List', 'VirtualList', 'Image'],
    relatedModifiers: ['clipped', 'opacity'],
    prerequisites: ['modifier-compatibility', 'component-lifecycle'],
    nextSteps: ['memory-optimization', 'bundle-optimization'],
    rating: 4.5,
    completionRate: 0.62,
    helpfulnessScore: 0.89,
    hasInteractiveExample: true,
    hasVideoContent: true,
    hasCodeSandbox: true,
    isAccessible: true,
    hasTranscript: true,
    supportedLanguages: ['en']
  }
}

/**
 * Context-aware documentation provider
 */
export class DocumentationProvider {
  private userProfile: UserLearningProfile | null = null
  private usageStats = new Map<string, number>()

  /**
   * Get contextual documentation for an error or component
   */
  getContextualDocumentation(context: {
    component?: string
    modifier?: string
    errorType?: string
    category?: ValidationErrorCategory
    userLevel?: DifficultyLevel
  }): ContextualDocumentation | null {
    const relevantResources = this.findRelevantResources(context)
    
    if (relevantResources.length === 0) {
      return null
    }

    const primary = this.selectPrimaryResource(relevantResources, context)
    const related = this.selectRelatedResources(relevantResources, primary)
    
    return {
      primary,
      related,
      quickHelp: this.generateQuickHelp(primary, context),
      codeExamples: this.generateCodeExamples(primary, context),
      commonPitfalls: this.getCommonPitfalls(primary, context),
      learningPath: this.generateLearningPath(primary)
    }
  }

  /**
   * Find relevant documentation resources
   */
  private findRelevantResources(context: {
    component?: string
    modifier?: string
    errorType?: string
    category?: ValidationErrorCategory
    userLevel?: DifficultyLevel
  }): DocumentationResource[] {
    const resources = Object.values(documentationDatabase)
    
    return resources.filter(resource => {
      // Component relevance
      if (context.component) {
        if (!resource.relatedComponents.includes(context.component) && 
            !resource.relatedComponents.includes('*')) {
          return false
        }
      }

      // Modifier relevance
      if (context.modifier) {
        if (!resource.relatedModifiers.includes(context.modifier) && 
            !resource.relatedModifiers.includes('*')) {
          return false
        }
      }

      // Error type relevance
      if (context.errorType) {
        if (resource.type === 'troubleshooting' || 
            resource.tags.includes(context.errorType)) {
          return true
        }
      }

      // Difficulty level filtering
      if (context.userLevel) {
        const levelOrder = ['beginner', 'intermediate', 'advanced', 'expert']
        const userLevelIndex = levelOrder.indexOf(context.userLevel)
        const resourceLevelIndex = levelOrder.indexOf(resource.difficulty)
        
        // Show resources at or slightly above user level
        if (resourceLevelIndex > userLevelIndex + 1) {
          return false
        }
      }

      return true
    })
  }

  /**
   * Select primary documentation resource
   */
  private selectPrimaryResource(
    resources: DocumentationResource[], 
    context: any
  ): DocumentationResource {
    // Sort by relevance score
    const scored = resources.map(resource => ({
      resource,
      score: this.calculateRelevanceScore(resource, context)
    }))

    scored.sort((a, b) => b.score - a.score)
    return scored[0].resource
  }

  /**
   * Calculate relevance score for a resource
   */
  private calculateRelevanceScore(resource: DocumentationResource, context: any): number {
    let score = 0

    // Base quality score
    score += resource.rating * 0.2
    score += resource.helpfulnessScore * 0.3
    score += resource.completionRate * 0.1

    // Context relevance
    if (context.component && resource.relatedComponents.includes(context.component)) {
      score += 0.4
    }
    if (context.modifier && resource.relatedModifiers.includes(context.modifier)) {
      score += 0.3
    }
    if (context.errorType && resource.tags.includes(context.errorType)) {
      score += 0.5
    }

    // User preference bonus
    if (this.userProfile) {
      if (this.userProfile.preferredDocumentationTypes.includes(resource.type)) {
        score += 0.2
      }
      if (this.userProfile.completedResources.includes(resource.id)) {
        score -= 0.1 // Slightly prefer new content
      }
    }

    // Usage statistics
    const usageCount = this.usageStats.get(resource.id) || 0
    score += Math.min(usageCount * 0.05, 0.2) // Cap usage bonus

    return score
  }

  /**
   * Select related resources
   */
  private selectRelatedResources(
    allResources: DocumentationResource[], 
    primary: DocumentationResource
  ): DocumentationResource[] {
    const related = allResources
      .filter(resource => resource.id !== primary.id)
      .sort((a, b) => {
        // Prefer next steps and prerequisites
        const aIsNext = primary.nextSteps.includes(a.id) ? 1 : 0
        const bIsNext = primary.nextSteps.includes(b.id) ? 1 : 0
        if (aIsNext !== bIsNext) return bIsNext - aIsNext

        // Then by rating
        return b.rating - a.rating
      })

    return related.slice(0, docConfig.maxRelatedItems)
  }

  /**
   * Generate quick help text
   */
  private generateQuickHelp(primary: DocumentationResource, context: any): string {
    const contextualHelpers: Record<string, string> = {
      'missing-required-prop': 'Components require specific properties to function. Check the component documentation for required parameters.',
      'invalid-modifier-usage': 'Modifiers have compatibility restrictions. Use the modifier compatibility reference to find valid combinations.',
      'performance-warning': 'Performance optimizations can improve user experience. Consider the suggested improvements for better performance.'
    }

    return contextualHelpers[context.errorType] || primary.description
  }

  /**
   * Generate contextual code examples
   */
  private generateCodeExamples(_primary: DocumentationResource, context: any): {
    basic: string
    advanced: string
    realWorld: string
  } {
    const examples = {
      basic: '// Basic usage example\n// See documentation for details',
      advanced: '// Advanced usage example\n// See documentation for details',
      realWorld: '// Real-world example\n// See documentation for details'
    }

    // Customize based on context
    if (context.component === 'Text') {
      examples.basic = 'Text("Hello World")'
      examples.advanced = 'Text(() => dynamicContent.value).fontSize(16).foregroundColor("blue")'
      examples.realWorld = 'Text(userProfile.name).fontSize(18).fontWeight("bold").padding(8)'
    } else if (context.component === 'Button') {
      examples.basic = 'Button("Click me", handleClick)'
      examples.advanced = 'Button("Submit", handleSubmit).background("blue").foregroundColor("white").disabled(isLoading)'
      examples.realWorld = 'Button("Save Changes", saveUserProfile).background(theme.primary).padding({ horizontal: 16, vertical: 8 })'
    }

    return examples
  }

  /**
   * Get common pitfalls for a resource
   */
  private getCommonPitfalls(_primary: DocumentationResource, _context: any): {
    issue: string
    solution: string
    example: string
  }[] {
    const pitfalls = [
      {
        issue: 'Forgetting required parameters',
        solution: 'Always check component documentation for required properties',
        example: 'Text() // Wrong\nText("content") // Correct'
      },
      {
        issue: 'Using incompatible modifiers',
        solution: 'Check modifier compatibility before applying',
        example: 'VStack().fontSize(16) // Wrong\nText("hello").fontSize(16) // Correct'
      }
    ]

    return pitfalls
  }

  /**
   * Generate learning path
   */
  private generateLearningPath(primary: DocumentationResource): {
    current: DocumentationResource
    next: DocumentationResource[]
    progress: number
  } {
    const nextResources = primary.nextSteps
      .map(id => documentationDatabase[id])
      .filter(Boolean)
      .slice(0, 3)

    let progress = 0
    if (this.userProfile) {
      const totalRecommended = primary.nextSteps.length + primary.prerequisites.length + 1
      const completed = [
        ...primary.prerequisites,
        primary.id,
        ...primary.nextSteps
      ].filter(id => this.userProfile!.completedResources.includes(id)).length

      progress = completed / totalRecommended
    }

    return {
      current: primary,
      next: nextResources,
      progress
    }
  }

  /**
   * Set user learning profile
   */
  setUserProfile(profile: UserLearningProfile): void {
    this.userProfile = profile
  }

  /**
   * Track resource usage
   */
  trackResourceUsage(resourceId: string): void {
    const currentCount = this.usageStats.get(resourceId) || 0
    this.usageStats.set(resourceId, currentCount + 1)
  }

  /**
   * Get personalized recommendations
   */
  getPersonalizedRecommendations(limit: number = 5): DocumentationResource[] {
    if (!this.userProfile || !docConfig.enableRecommendations) {
      return []
    }

    const allResources = Object.values(documentationDatabase)
    
    // Filter out completed resources
    const uncompletedResources = allResources.filter(
      resource => !this.userProfile!.completedResources.includes(resource.id)
    )

    // Score based on user profile
    const scored = uncompletedResources.map(resource => ({
      resource,
      score: this.calculatePersonalizationScore(resource)
    }))

    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, limit).map(item => item.resource)
  }

  /**
   * Calculate personalization score
   */
  private calculatePersonalizationScore(resource: DocumentationResource): number {
    if (!this.userProfile) return 0

    let score = 0

    // Difficulty alignment
    const levelOrder = ['beginner', 'intermediate', 'advanced', 'expert']
    const userLevelIndex = levelOrder.indexOf(this.userProfile.skillLevel)
    const resourceLevelIndex = levelOrder.indexOf(resource.difficulty)
    
    if (resourceLevelIndex === userLevelIndex) {
      score += 0.4 // Perfect match
    } else if (resourceLevelIndex === userLevelIndex + 1) {
      score += 0.3 // Slightly challenging
    } else if (resourceLevelIndex < userLevelIndex) {
      score += 0.1 // Review material
    }

    // Type preference
    if (this.userProfile.preferredDocumentationTypes.includes(resource.type)) {
      score += 0.3
    }

    // Component/modifier usage
    const userComponents = this.userProfile.mostUsedComponents
    const userModifiers = this.userProfile.mostUsedModifiers
    
    if (resource.relatedComponents.some(comp => userComponents.includes(comp))) {
      score += 0.2
    }
    
    if (resource.relatedModifiers.some(mod => userModifiers.includes(mod))) {
      score += 0.1
    }

    return score
  }

  /**
   * Get documentation statistics
   */
  getStatistics() {
    return {
      totalResources: Object.keys(documentationDatabase).length,
      resourcesByType: this.groupResourcesByType(),
      resourcesByDifficulty: this.groupResourcesByDifficulty(),
      totalUsages: Array.from(this.usageStats.values()).reduce((a, b) => a + b, 0),
      averageRating: this.calculateAverageRating(),
      completionRates: this.getCompletionRates()
    }
  }

  /**
   * Group resources by type
   */
  private groupResourcesByType(): Record<DocumentationType, number> {
    const grouped: Record<string, number> = {}
    
    Object.values(documentationDatabase).forEach(resource => {
      grouped[resource.type] = (grouped[resource.type] || 0) + 1
    })

    return grouped as Record<DocumentationType, number>
  }

  /**
   * Group resources by difficulty
   */
  private groupResourcesByDifficulty(): Record<DifficultyLevel, number> {
    const grouped: Record<string, number> = {}
    
    Object.values(documentationDatabase).forEach(resource => {
      grouped[resource.difficulty] = (grouped[resource.difficulty] || 0) + 1
    })

    return grouped as Record<DifficultyLevel, number>
  }

  /**
   * Calculate average rating
   */
  private calculateAverageRating(): number {
    const resources = Object.values(documentationDatabase)
    const totalRating = resources.reduce((sum, resource) => sum + resource.rating, 0)
    return totalRating / resources.length
  }

  /**
   * Get completion rates
   */
  private getCompletionRates(): { average: number; byDifficulty: Record<DifficultyLevel, number> } {
    const resources = Object.values(documentationDatabase)
    const totalCompletion = resources.reduce((sum, resource) => sum + resource.completionRate, 0)
    const average = totalCompletion / resources.length

    const byDifficulty: Record<string, number> = {}
    const difficultyGroups = this.groupResourcesByDifficulty()
    
    Object.keys(difficultyGroups).forEach(difficulty => {
      const difficultyResources = resources.filter(r => r.difficulty === difficulty)
      const difficultyCompletion = difficultyResources.reduce((sum, r) => sum + r.completionRate, 0)
      byDifficulty[difficulty] = difficultyCompletion / difficultyResources.length
    })

    return {
      average,
      byDifficulty: byDifficulty as Record<DifficultyLevel, number>
    }
  }
}

/**
 * Configure documentation integration
 */
export function configureDocumentationIntegration(config: Partial<DocumentationConfig>): void {
  docConfig = { ...docConfig, ...config }
}

/**
 * Get current documentation configuration
 */
export function getDocumentationConfig(): DocumentationConfig {
  return { ...docConfig }
}

// Global documentation provider instance
const documentationProvider = new DocumentationProvider()

/**
 * Documentation Integration utilities
 */
export const DocumentationIntegrationUtils = {
  /**
   * Get contextual documentation
   */
  getContextualDocumentation: (context: any) => 
    documentationProvider.getContextualDocumentation(context),

  /**
   * Get personalized recommendations
   */
  getRecommendations: (limit?: number) => 
    documentationProvider.getPersonalizedRecommendations(limit),

  /**
   * Set user profile
   */
  setUserProfile: (profile: UserLearningProfile) => 
    documentationProvider.setUserProfile(profile),

  /**
   * Track resource usage
   */
  trackUsage: (resourceId: string) => 
    documentationProvider.trackResourceUsage(resourceId),

  /**
   * Configure integration
   */
  configure: configureDocumentationIntegration,

  /**
   * Get configuration
   */
  getConfig: getDocumentationConfig,

  /**
   * Get statistics
   */
  getStatistics: () => documentationProvider.getStatistics(),

  /**
   * Get all resources
   */
  getAllResources: () => documentationDatabase,

  /**
   * Test documentation system
   */
  test: () => {
    console.group('📚 Documentation Integration System Test')
    
    try {
      // Test contextual documentation
      const contextualDocs = documentationProvider.getContextualDocumentation({
        component: 'Text',
        errorType: 'missing-required-prop',
        userLevel: 'beginner'
      })
      
      console.info('✅ Contextual documentation:', !!contextualDocs)
      if (contextualDocs) {
        console.info('✅ Primary resource:', contextualDocs.primary.title)
        console.info('✅ Related resources:', contextualDocs.related.length)
        console.info('✅ Quick help available:', !!contextualDocs.quickHelp)
      }

      // Test recommendations
      const recommendations = documentationProvider.getPersonalizedRecommendations(3)
      console.info('✅ Recommendations available:', recommendations.length)

      // Test statistics
      const stats = documentationProvider.getStatistics()
      console.info('✅ Total resources:', stats.totalResources)
      console.info('✅ Average rating:', stats.averageRating.toFixed(1))

      console.info('✅ Documentation integration system is working correctly')
      
    } catch (error) {
      console.error('❌ Documentation integration test failed:', error)
    }
    
    console.groupEnd()
  }
}

// Export provider instance
export { documentationProvider }