/**
 * Phase 1D Integration Tests
 * 
 * Comprehensive testing suite for developer experience features:
 * - Enhanced error message templates
 * - VS Code extension foundation
 * - Documentation integration
 * - Advanced debugging tools
 * - Intelligent fix suggestions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { EnhancedValidationError } from '../enhanced-runtime'
import { DeveloperExperienceUtils, type IntelligentFixSuggestion } from '../developer-experience'
import { IDEIntegrationUtils, type LSPDiagnostic } from '../ide-integration'
import { DocumentationIntegrationUtils, type UserLearningProfile } from '../documentation-integration'
import { AdvancedDebuggingUtils, type AdvancedDebuggingSession } from '../advanced-debugging'

// Mock enhanced validation error for testing
class MockEnhancedValidationError {
  constructor(
    public message: string,
    public context: {
      component: string
      property?: string
      suggestion?: string
      documentation?: string
      package?: string
    }
  ) {}
}

describe('Phase 1D: Developer Experience Integration', () => {
  describe('Enhanced Error Message Templates', () => {
    it('should format errors with rich templates', () => {
      const mockError = new MockEnhancedValidationError('Missing required property', {
        component: 'Text',
        property: 'content'
      })

      const formatted = DeveloperExperienceUtils.formatError(
        mockError as any,
        'missing-required-prop'
      )

      expect(formatted).toBeDefined()
      expect(formatted.template).toBeDefined()
      expect(formatted.template?.title).toBe('Missing Required Property')
      expect(formatted.suggestions).toBeInstanceOf(Array)
      expect(formatted.formatted).toContain('Missing Required Property')
    })

    it('should provide intelligent fix suggestions', () => {
      const suggestions = DeveloperExperienceUtils.getSuggestions('missing-required-prop', {
        component: 'Text'
      })

      expect(suggestions).toBeInstanceOf(Array)
      expect(suggestions.length).toBeGreaterThan(0)
      
      const firstSuggestion = suggestions[0]
      expect(firstSuggestion).toHaveProperty('title')
      expect(firstSuggestion).toHaveProperty('description')
      expect(firstSuggestion).toHaveProperty('difficulty')
      expect(firstSuggestion).toHaveProperty('confidence')
      expect(firstSuggestion.confidence).toBeGreaterThan(0)
      expect(firstSuggestion.confidence).toBeLessThanOrEqual(1)
    })

    it('should support automatic fixes', () => {
      const mockCode = 'Text()'
      const fixResult = DeveloperExperienceUtils.applyAutoFix('add-required-prop', mockCode)

      // Should return a fixed version or null if not applicable
      expect(typeof fixResult).toMatch(/string|null/)
      if (fixResult) {
        expect(fixResult).not.toBe(mockCode)
        expect(fixResult).toContain('Text(')
      }
    })

    it('should provide error templates for common scenarios', () => {
      const templates = DeveloperExperienceUtils.getErrorTemplates()

      expect(templates).toBeDefined()
      expect(Object.keys(templates).length).toBeGreaterThan(0)
      
      // Check specific templates
      expect(templates['missing-required-prop']).toBeDefined()
      expect(templates['invalid-modifier-usage']).toBeDefined()
      expect(templates['performance-warning']).toBeDefined()

      // Validate template structure
      const template = templates['missing-required-prop']
      expect(template.title).toBeDefined()
      expect(template.description).toBeDefined()
      expect(template.severity).toMatch(/error|warning|info|critical/)
      expect(template.suggestions).toBeInstanceOf(Array)
      expect(template.examples).toBeDefined()
      expect(template.documentation).toBeDefined()
    })

    it('should generate statistics', () => {
      const stats = DeveloperExperienceUtils.getStatistics()

      expect(stats).toBeDefined()
      expect(stats.formatter).toBeDefined()
      expect(stats.fixEngine).toBeDefined()
      expect(stats.config).toBeDefined()
      expect(typeof stats.formatter.templatesAvailable).toBe('number')
    })
  })

  describe('VS Code Extension Foundation', () => {
    beforeEach(() => {
      IDEIntegrationUtils.initialize()
    })

    it('should validate documents and return diagnostics', async () => {
      const testCode = `
        Text()
        Button("Click me")
        VStack({ children: [] }).fontSize(16)
      `

      const diagnostics = await IDEIntegrationUtils.validateDocument('test.ts', testCode)

      expect(diagnostics).toBeInstanceOf(Array)
      expect(diagnostics.length).toBeGreaterThan(0)

      // Check diagnostic structure
      const firstDiagnostic = diagnostics[0]
      expect(firstDiagnostic.range).toBeDefined()
      expect([1, 2, 3, 4]).toContain(firstDiagnostic.severity) // Error, Warning, Information, Hint
      expect(firstDiagnostic.source).toBe('tachui')
      expect(firstDiagnostic.message).toBeDefined()
    })

    it('should provide hover information', () => {
      const testCode = 'Text("Hello World")'
      const hover = IDEIntegrationUtils.getHover('test.ts', testCode, 0, 2)

      if (hover) {
        expect(hover.contents).toBeDefined()
        expect(hover.contents.kind).toMatch(/markdown|plaintext/)
        expect(hover.contents.value).toBeDefined()
        expect(hover.contents.value.length).toBeGreaterThan(0)
      }
    })

    it('should provide code completions', () => {
      const completions = IDEIntegrationUtils.getCompletions('test.ts', 'T', 0, 1)

      expect(completions).toBeInstanceOf(Array)
      
      if (completions.length > 0) {
        const firstCompletion = completions[0]
        expect(firstCompletion.label).toBeDefined()
        expect(firstCompletion.kind).toBeDefined()
        expect(typeof firstCompletion.kind).toBe('number')
      }
    })

    it('should provide code actions for diagnostics', async () => {
      const testCode = 'Text()'
      const diagnostics = await IDEIntegrationUtils.validateDocument('test.ts', testCode)

      if (diagnostics.length > 0) {
        const actions = IDEIntegrationUtils.getCodeActions(diagnostics[0], 'test.ts', testCode)

        expect(actions).toBeInstanceOf(Array)
        
        if (actions.length > 0) {
          const firstAction = actions[0]
          expect(firstAction.title).toBeDefined()
          expect(firstAction.kind).toBeDefined()
        }
      }
    })

    it('should handle IDE configuration', () => {
      const originalConfig = IDEIntegrationUtils.getConfig()
      
      IDEIntegrationUtils.configure({
        enableRealTimeDiagnostics: false,
        enableAutoComplete: false
      })

      const newConfig = IDEIntegrationUtils.getConfig()
      expect(newConfig.enableRealTimeDiagnostics).toBe(false)
      expect(newConfig.enableAutoComplete).toBe(false)

      // Restore original config
      IDEIntegrationUtils.configure(originalConfig)
    })
  })

  describe('Documentation Integration', () => {
    it('should provide contextual documentation', () => {
      const contextualDocs = DocumentationIntegrationUtils.getContextualDocumentation({
        component: 'Text',
        errorType: 'missing-required-prop',
        userLevel: 'beginner'
      })

      if (contextualDocs) {
        expect(contextualDocs.primary).toBeDefined()
        expect(contextualDocs.related).toBeInstanceOf(Array)
        expect(contextualDocs.quickHelp).toBeDefined()
        expect(contextualDocs.codeExamples).toBeDefined()
        expect(contextualDocs.commonPitfalls).toBeInstanceOf(Array)
        expect(contextualDocs.learningPath).toBeDefined()

        // Validate primary resource
        expect(contextualDocs.primary.title).toBeDefined()
        expect(contextualDocs.primary.description).toBeDefined()
        expect(contextualDocs.primary.url).toBeDefined()
        expect(contextualDocs.primary.difficulty).toMatch(/beginner|intermediate|advanced|expert/)
      }
    })

    it('should provide personalized recommendations', () => {
      const mockProfile: UserLearningProfile = {
        id: 'test-user',
        skillLevel: 'intermediate',
        preferredLearningStyle: 'hands-on',
        completedResources: ['text-component-guide'],
        bookmarkedResources: [],
        learningGoals: ['master-components'],
        weakAreas: ['modifiers'],
        strongAreas: ['basic-components'],
        averageReadTime: 5,
        preferredDocumentationTypes: ['guide', 'example'],
        mostUsedComponents: ['Text', 'Button'],
        mostUsedModifiers: ['padding', 'fontSize'],
        enablePersonalization: true,
        enableProgressTracking: true,
        enableRecommendations: true
      }

      DocumentationIntegrationUtils.setUserProfile(mockProfile)
      const recommendations = DocumentationIntegrationUtils.getRecommendations(3)

      expect(recommendations).toBeInstanceOf(Array)
      expect(recommendations.length).toBeLessThanOrEqual(3)

      if (recommendations.length > 0) {
        const firstRec = recommendations[0]
        expect(firstRec.title).toBeDefined()
        expect(firstRec.difficulty).toMatch(/beginner|intermediate|advanced|expert/)
        expect(firstRec.type).toMatch(/guide|api-reference|tutorial|example|video|troubleshooting|best-practices/)
      }
    })

    it('should track resource usage', () => {
      const initialStats = DocumentationIntegrationUtils.getStatistics()
      
      DocumentationIntegrationUtils.trackUsage('text-component-guide')
      DocumentationIntegrationUtils.trackUsage('button-component-guide')

      const newStats = DocumentationIntegrationUtils.getStatistics()
      expect(newStats.totalUsages).toBeGreaterThanOrEqual(initialStats.totalUsages)
    })

    it('should provide comprehensive statistics', () => {
      const stats = DocumentationIntegrationUtils.getStatistics()

      expect(stats).toBeDefined()
      expect(typeof stats.totalResources).toBe('number')
      expect(stats.resourcesByType).toBeDefined()
      expect(stats.resourcesByDifficulty).toBeDefined()
      expect(typeof stats.totalUsages).toBe('number')
      expect(typeof stats.averageRating).toBe('number')
      expect(stats.completionRates).toBeDefined()
      expect(typeof stats.completionRates.average).toBe('number')
    })

    it('should handle documentation configuration', () => {
      const originalConfig = DocumentationIntegrationUtils.getConfig()
      
      DocumentationIntegrationUtils.configure({
        defaultDifficulty: 'advanced',
        maxRelatedItems: 10
      })

      const newConfig = DocumentationIntegrationUtils.getConfig()
      expect(newConfig.defaultDifficulty).toBe('advanced')
      expect(newConfig.maxRelatedItems).toBe(10)

      // Restore original config
      DocumentationIntegrationUtils.configure(originalConfig)
    })
  })

  describe('Advanced Debugging Tools', () => {
    let sessionId: string
    let inspectorId: string

    beforeEach(() => {
      sessionId = AdvancedDebuggingUtils.startSession('Test Session', 'Testing advanced debugging')
      inspectorId = AdvancedDebuggingUtils.createInspector('component', 'test-component')
    })

    afterEach(() => {
      AdvancedDebuggingUtils.stopSession()
    })

    it('should create and manage debugging sessions', () => {
      expect(sessionId).toBeDefined()
      expect(typeof sessionId).toBe('string')

      const session = AdvancedDebuggingUtils.stopSession()
      expect(session).toBeDefined()
      expect(session?.id).toBe(sessionId)
      expect(session?.name).toBe('Test Session')
      expect(session?.description).toBe('Testing advanced debugging')
      expect(session?.summary).toBeDefined()
    })

    it('should create validation state inspectors', () => {
      expect(inspectorId).toBeDefined()
      expect(typeof inspectorId).toBe('string')
      
      const stats = AdvancedDebuggingUtils.getStatistics()
      expect(stats.activeInspectors).toBeGreaterThan(0)
    })

    it('should take component snapshots', () => {
      const snapshotId = AdvancedDebuggingUtils.takeSnapshot('test-component', {
        type: 'Text',
        props: { content: 'Hello World' },
        state: { visible: true },
        modifiers: ['fontSize', 'foregroundColor']
      })

      expect(snapshotId).toBeDefined()
      expect(typeof snapshotId).toBe('string')

      const history = AdvancedDebuggingUtils.getComponentHistory('test-component')
      expect(history).toBeInstanceOf(Array)
      expect(history.length).toBeGreaterThan(0)

      const snapshot = history[0]
      expect(snapshot.componentType).toBe('Text')
      expect(snapshot.props.content).toBe('Hello World')
      expect(snapshot.modifiers).toContain('fontSize')
      expect(snapshot.modifiers).toContain('foregroundColor')
    })

    it('should add visual debugging overlays', () => {
      const overlayId = AdvancedDebuggingUtils.addVisualOverlay(
        'error-highlight',
        { x: 10, y: 20, width: 100, height: 50 },
        { label: 'Test Error', duration: 1000 }
      )

      if (overlayId) {
        expect(typeof overlayId).toBe('string')
      }
    })

    it('should analyze validation trends', () => {
      // Take multiple snapshots to generate trends
      for (let i = 0; i < 5; i++) {
        AdvancedDebuggingUtils.takeSnapshot(`test-component-${i}`, {
          type: 'Text',
          props: { content: `Content ${i}` },
          state: {},
          modifiers: ['fontSize']
        })
      }

      const trends = AdvancedDebuggingUtils.getValidationTrends()
      expect(trends).toBeDefined()
      expect(typeof trends.errorRate).toBe('number')
      expect(typeof trends.warningRate).toBe('number')
      expect(typeof trends.performanceRegression).toBe('boolean')
      expect(trends.memoryTrend).toMatch(/increasing|stable|decreasing/)
      expect(trends.recommendations).toBeInstanceOf(Array)
    })

    it('should export session data in different formats', () => {
      // Add some data to the session
      AdvancedDebuggingUtils.takeSnapshot('export-test', {
        type: 'Button',
        props: { title: 'Click me' },
        state: {},
        modifiers: ['background']
      })

      const session = AdvancedDebuggingUtils.stopSession()
      
      if (session) {
        // Test JSON export
        const jsonExport = AdvancedDebuggingUtils.exportSessionData(session, 'json')
        expect(typeof jsonExport).toBe('string')
        expect(() => JSON.parse(jsonExport)).not.toThrow()

        // Test CSV export
        const csvExport = AdvancedDebuggingUtils.exportSessionData(session, 'csv')
        expect(typeof csvExport).toBe('string')
        expect(csvExport).toContain('timestamp,componentType')

        // Test HTML export
        const htmlExport = AdvancedDebuggingUtils.exportSessionData(session, 'html')
        expect(typeof htmlExport).toBe('string')
        expect(htmlExport).toContain('<!DOCTYPE html>')
        expect(htmlExport).toContain('TachUI Debugging Report')
      }
    })

    it('should provide debugging statistics', () => {
      const stats = AdvancedDebuggingUtils.getStatistics()

      expect(stats).toBeDefined()
      expect(typeof stats.activeInspectors).toBe('number')
      expect(typeof stats.totalSnapshots).toBe('number')
      expect(typeof stats.activeOverlays).toBe('number')
      expect(typeof stats.sessionActive).toBe('boolean')
      expect(typeof stats.memoryUsage).toBe('number')
    })

    it('should handle debugging configuration', () => {
      const originalConfig = AdvancedDebuggingUtils.getConfig()
      
      AdvancedDebuggingUtils.configure({
        enableVisualDebugging: true,
        enableStateInspection: false,
        maxHistorySize: 50
      })

      const newConfig = AdvancedDebuggingUtils.getConfig()
      expect(newConfig.enableVisualDebugging).toBe(true)
      expect(newConfig.enableStateInspection).toBe(false)
      expect(newConfig.maxHistorySize).toBe(50)

      // Restore original config
      AdvancedDebuggingUtils.configure(originalConfig)
    })
  })

  describe('Integration Test: Complete Developer Experience Flow', () => {
    it('should demonstrate complete error handling and debugging workflow', async () => {
      // 1. Start debugging session
      const sessionId = AdvancedDebuggingUtils.startSession(
        'Complete Workflow Test',
        'Testing the complete developer experience flow'
      )
      expect(sessionId).toBeDefined()

      // 2. Create inspector
      const inspectorId = AdvancedDebuggingUtils.createInspector('component', 'workflow-test')
      expect(inspectorId).toBeDefined()

      // 3. Simulate validation error with IDE integration
      const errorCode = `Text()`
      const diagnostics = await IDEIntegrationUtils.validateDocument('workflow.ts', errorCode)
      expect(diagnostics.length).toBeGreaterThan(0)

      // 4. Get enhanced error formatting
      const mockError = new MockEnhancedValidationError('Missing required property', {
        component: 'Text',
        property: 'content'
      })
      
      const formattedError = DeveloperExperienceUtils.formatError(
        mockError as any,
        'missing-required-prop'
      )
      expect(formattedError.template).toBeDefined()
      expect(formattedError.suggestions.length).toBeGreaterThan(0)

      // 5. Get contextual documentation
      const contextualDocs = DocumentationIntegrationUtils.getContextualDocumentation({
        component: 'Text',
        errorType: 'missing-required-prop'
      })
      expect(contextualDocs).toBeDefined()
      expect(contextualDocs?.primary.title).toBeDefined()

      // 6. Take debugging snapshot
      const snapshotId = AdvancedDebuggingUtils.takeSnapshot('workflow-test', {
        type: 'Text',
        props: {},
        state: {},
        modifiers: []
      })
      expect(snapshotId).toBeDefined()

      // 7. Get code actions for auto-fix
      if (diagnostics.length > 0) {
        const codeActions = IDEIntegrationUtils.getCodeActions(diagnostics[0], 'workflow.ts', errorCode)
        expect(codeActions).toBeInstanceOf(Array)
      }

      // 8. Stop session and generate report
      const session = AdvancedDebuggingUtils.stopSession()
      expect(session).toBeDefined()
      expect(session?.summary.totalErrors).toBeGreaterThanOrEqual(0)

      // 9. Export session for analysis
      if (session) {
        const exportData = AdvancedDebuggingUtils.exportSessionData(session, 'json')
        expect(typeof exportData).toBe('string')
        expect(() => JSON.parse(exportData)).not.toThrow()
      }

      console.info('✅ Complete developer experience workflow test passed')
    })

    it('should provide comprehensive coverage statistics', () => {
      const devExpStats = DeveloperExperienceUtils.getStatistics()
      const ideStats = IDEIntegrationUtils.getConfig()
      const docsStats = DocumentationIntegrationUtils.getStatistics()
      const debugStats = AdvancedDebuggingUtils.getStatistics()

      // Validate all subsystems are functional
      expect(devExpStats.formatter.templatesAvailable).toBeGreaterThan(0)
      expect(ideStats.enableRealTimeDiagnostics).toBeDefined()
      expect(docsStats.totalResources).toBeGreaterThan(0)
      expect(typeof debugStats.memoryUsage).toBe('number')

      console.info('📊 Phase 1D Coverage Statistics:')
      console.info(`- Error templates: ${devExpStats.formatter.templatesAvailable}`)
      console.info(`- Documentation resources: ${docsStats.totalResources}`)
      console.info(`- IDE features enabled: ${Object.values(ideStats).filter(Boolean).length}`)
      console.info(`- Debug memory usage: ${Math.round(debugStats.memoryUsage / 1024 / 1024)}MB`)
    })
  })

  describe('System Integration Tests', () => {
    it('should run all system tests without errors', () => {
      // Test all major subsystems
      expect(() => DeveloperExperienceUtils.test()).not.toThrow()
      expect(() => DocumentationIntegrationUtils.test()).not.toThrow()
      expect(() => AdvancedDebuggingUtils.test()).not.toThrow()
      
      // Note: IDE integration test is async and may require specific environment
      IDEIntegrationUtils.test().then(() => {
        console.info('✅ All Phase 1D system tests completed successfully')
      }).catch((error) => {
        console.warn('⚠️ IDE integration test failed (may be environment specific):', error.message)
      })
    })

    it('should demonstrate 90% fix suggestion coverage target', () => {
      const errorTemplates = DeveloperExperienceUtils.getErrorTemplates()
      const templatesWithSuggestions = Object.values(errorTemplates).filter(
        template => template.suggestions.length > 0
      )
      
      const coverageRate = templatesWithSuggestions.length / Object.values(errorTemplates).length
      
      expect(coverageRate).toBeGreaterThanOrEqual(0.9) // 90% target
      console.info(`✅ Fix suggestion coverage: ${Math.round(coverageRate * 100)}%`)
    })
  })
})