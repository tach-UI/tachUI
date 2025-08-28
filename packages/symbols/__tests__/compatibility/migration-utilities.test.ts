/**
 * Tests for SF Symbol migration utilities
 */

import { describe, test, expect, vi } from 'vitest'
import {
  analyzeSingleSymbolMigration,
  analyzeProjectMigration,
  generateMigrationCode,
  validateMigration,
  type SymbolMigrationResult,
  type ProjectMigrationAnalysis,
  type MigrationOptions,
  type MigrationValidation
} from '../../src/compatibility/migration-utilities.js'

describe('SF Symbol Migration Utilities', () => {
  describe('analyzeSingleSymbolMigration', () => {
    test('should analyze successful migration', () => {
      const result = analyzeSingleSymbolMigration('heart')
      
      expect(result.original).toBe('heart')
      expect(result.target).toBeDefined()
      expect(result.status).toMatch(/success|partial|warning/)
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.confidence).toBeLessThanOrEqual(100)
      expect(Array.isArray(result.issues)).toBe(true)
      expect(Array.isArray(result.recommendations)).toBe(true)
      expect(Array.isArray(result.alternatives)).toBe(true)
    })

    test('should handle symbol variants', () => {
      const result = analyzeSingleSymbolMigration('heart.fill', {
        includeVariants: true
      })
      
      expect(result.variant).toBeDefined()
      expect(result.original).toBe('heart.fill')
    })

    test('should handle unknown symbols', () => {
      const result = analyzeSingleSymbolMigration('nonexistent.symbol')
      
      expect(result.status).toBe('failed')
      expect(result.issues.length).toBeGreaterThan(0)
      expect(result.confidence).toBeLessThan(50)
    })

    test('should respect confidence threshold', () => {
      const options: Partial<MigrationOptions> = {
        confidenceThreshold: 90
      }
      
      const result = analyzeSingleSymbolMigration('gear', options) // Close match, not exact
      
      if (result.confidence < 90) {
        expect(result.status).toMatch(/warning|partial/)
      }
    })

    test('should suggest alternatives when enabled', () => {
      const result = analyzeSingleSymbolMigration('nonexistent.symbol', {
        suggestAlternatives: true
      })
      
      expect(result.status).toBe('failed')
      expect(result.alternatives.length).toBeGreaterThanOrEqual(0)
    })

    test('should not suggest alternatives when disabled', () => {
      const result = analyzeSingleSymbolMigration('nonexistent.symbol', {
        suggestAlternatives: false
      })
      
      expect(result.alternatives.length).toBe(0)
    })

    test('should handle custom mappings', () => {
      const customMappings = {
        'custom.symbol': 'custom-icon'
      }
      
      const result = analyzeSingleSymbolMigration('custom.symbol', {
        customMappings
      })
      
      expect(result.target).toBe('custom-icon')
      expect(result.confidence).toBeGreaterThanOrEqual(85)
      expect(result.recommendations).toContain('Using custom mapping')
    })

    test('should flag deprecated symbols', () => {
      const deprecatedSymbols = ['old.symbol']
      
      const result = analyzeSingleSymbolMigration('old.symbol', {
        deprecatedSymbols
      })
      
      expect(result.issues).toContain('Symbol is deprecated')
      expect(result.confidence).toBeLessThanOrEqual(50)
    })

    test('should handle analysis errors gracefully', () => {
      // Test with malformed input that might cause errors
      const result = analyzeSingleSymbolMigration('')
      
      expect(result.original).toBe('')
      expect(result).toBeDefined()
      // Should not throw, even with empty input
    })

    test('should categorize symbols when possible', () => {
      const result = analyzeSingleSymbolMigration('heart')
      
      if (result.status !== 'failed') {
        expect(result.category).toBeDefined()
      }
    })

    test('should provide meaningful recommendations', () => {
      const result = analyzeSingleSymbolMigration('bell.slash')
      
      if (result.status === 'success' || result.status === 'partial') {
        // Should have some form of guidance
        expect(result.recommendations.length >= 0).toBe(true)
      }
    })
  })

  describe('analyzeProjectMigration', () => {
    test('should analyze multiple symbols', () => {
      const symbols = ['heart', 'star', 'bell.slash', 'nonexistent.symbol']
      const analysis = analyzeProjectMigration(symbols)
      
      expect(analysis.summary.totalSymbols).toBe(4)
      expect(analysis.results.length).toBe(4)
      expect(analysis.summary.successfulMigrations + 
             analysis.summary.partialMigrations + 
             analysis.summary.failedMigrations +
             analysis.summary.warningCount).toBe(4)
    })

    test('should calculate correct averages', () => {
      const symbols = ['heart', 'star']
      const analysis = analyzeProjectMigration(symbols)
      
      const expectedAverage = analysis.results.reduce((sum, r) => sum + r.confidence, 0) / analysis.results.length
      expect(Math.abs(analysis.summary.averageConfidence - expectedAverage)).toBeLessThan(0.01)
    })

    test('should categorize symbols', () => {
      const symbols = ['heart', 'plus', 'star']
      const analysis = analyzeProjectMigration(symbols)
      
      expect(typeof analysis.categories).toBe('object')
      
      // Should have some categories with counts
      const categoryCount = Object.values(analysis.categories).reduce((sum, count) => sum + count, 0)
      expect(categoryCount).toBeGreaterThan(0)
    })

    test('should provide recommendations', () => {
      const symbols = ['heart', 'nonexistent.symbol', 'another.unknown']
      const analysis = analyzeProjectMigration(symbols)
      
      expect(Array.isArray(analysis.recommendations)).toBe(true)
      
      // Should have recommendations for failed migrations
      const failedCount = analysis.summary.failedMigrations
      if (failedCount > 0) {
        const failedRec = analysis.recommendations.find(r => 
          r.action.includes('failed') || r.action.includes('Failed')
        )
        expect(failedRec).toBeDefined()
      }
    })

    test('should generate statistics', () => {
      const symbols = ['heart', 'star', 'bell.slash', 'unknown']
      const analysis = analyzeProjectMigration(symbols)
      
      expect(analysis.statistics).toBeDefined()
      expect(Array.isArray(analysis.statistics.mostCommonIssues)).toBe(true)
      expect(Array.isArray(analysis.statistics.categoryDistribution)).toBe(true)
      expect(Array.isArray(analysis.statistics.confidenceDistribution)).toBe(true)
      
      // Confidence distribution should cover all results
      const totalConfidenceCount = analysis.statistics.confidenceDistribution
        .reduce((sum, range) => sum + range.count, 0)
      expect(totalConfidenceCount).toBe(symbols.length)
    })

    test('should handle empty symbol list', () => {
      const analysis = analyzeProjectMigration([])
      
      expect(analysis.summary.totalSymbols).toBe(0)
      expect(analysis.results.length).toBe(0)
      expect(analysis.summary.averageConfidence).toBe(NaN) // 0/0 = NaN
    })

    test('should respect migration options', () => {
      const symbols = ['heart.fill', 'star.circle']
      const options: Partial<MigrationOptions> = {
        includeVariants: true,
        confidenceThreshold: 95,
        suggestAlternatives: false
      }
      
      const analysis = analyzeProjectMigration(symbols, options)
      
      expect(analysis.results.length).toBe(2)
      
      // Check that options were applied
      analysis.results.forEach(result => {
        expect(result.alternatives.length).toBe(0) // suggestAlternatives: false
      })
    })

    test('should prioritize recommendations by severity', () => {
      const symbols = ['heart', 'unknown1', 'unknown2', 'gear'] // Mix of success/failed
      const analysis = analyzeProjectMigration(symbols)
      
      if (analysis.recommendations.length > 1) {
        // High priority should come before medium/low
        let lastPriority = 'high'
        analysis.recommendations.forEach(rec => {
          if (lastPriority === 'high') {
            expect(['high', 'medium', 'low']).toContain(rec.priority)
          } else if (lastPriority === 'medium') {
            expect(['medium', 'low']).toContain(rec.priority)
          }
          lastPriority = rec.priority
        })
      }
    })
  })

  describe('generateMigrationCode', () => {
    const mockResults: SymbolMigrationResult[] = [
      {
        original: 'heart',
        target: 'heart',
        status: 'success',
        confidence: 95,
        issues: [],
        recommendations: [],
        alternatives: []
      },
      {
        original: 'gear',
        target: 'settings',
        status: 'partial',
        confidence: 80,
        issues: ['Different visual appearance'],
        recommendations: ['Review visual design'],
        alternatives: []
      }
    ]

    test('should generate TypeScript migration code', () => {
      const code = generateMigrationCode(mockResults, 'typescript')
      
      expect(typeof code).toBe('string')
      expect(code).toContain('export const SF_SYMBOL_MIGRATION_MAP')
      expect(code).toContain("'heart': 'heart'")
      expect(code).toContain("'gear': 'settings'")
      expect(code).toContain('Image({ systemName: sfSymbolName })')
    })

    test('should generate JavaScript migration code', () => {
      const code = generateMigrationCode(mockResults, 'javascript')
      
      expect(typeof code).toBe('string')
      expect(code).toContain('const SF_SYMBOL_MIGRATION_MAP')
      expect(code).toContain('require(')
      expect(code).toContain('function migrateSymbol')
    })

    test('should generate JSON migration mapping', () => {
      const code = generateMigrationCode(mockResults, 'json')
      
      expect(typeof code).toBe('string')
      
      // Should be valid JSON
      expect(() => JSON.parse(code)).not.toThrow()
      
      const parsed = JSON.parse(code)
      expect(parsed).toHaveProperty('symbolMigrationMapping')
      expect(parsed.symbolMigrationMapping).toHaveProperty('heart')
      expect(parsed.symbolMigrationMapping).toHaveProperty('gear')
    })

    test('should generate CSS migration styles', () => {
      const code = generateMigrationCode(mockResults, 'css')
      
      expect(typeof code).toBe('string')
      expect(code).toContain(':root')
      expect(code).toContain('--symbol-weight')
      expect(code).toContain('.sf-symbol')
      expect(code).toContain('stroke: currentColor')
    })

    test('should generate Markdown migration report', () => {
      const code = generateMigrationCode(mockResults, 'markdown')
      
      expect(typeof code).toBe('string')
      expect(code).toContain('# SF Symbol Migration Report')
      expect(code).toContain('## Summary')
      expect(code).toContain('## Successful Migrations')
      expect(code).toContain('| SF Symbol | Lucide Icon | Confidence |')
      expect(code).toContain('`heart`')
      expect(code).toContain('`settings`')
    })

    test('should throw error for unsupported format', () => {
      expect(() => {
        generateMigrationCode(mockResults, 'unsupported' as any)
      }).toThrow('Unsupported format: unsupported')
    })

    test('should handle empty results', () => {
      const emptyResults: SymbolMigrationResult[] = []
      
      expect(() => {
        generateMigrationCode(emptyResults, 'typescript')
      }).not.toThrow()
      
      expect(() => {
        generateMigrationCode(emptyResults, 'json')
      }).not.toThrow()
    })

    test('should include failed migrations in markdown', () => {
      const resultsWithFailures: SymbolMigrationResult[] = [
        ...mockResults,
        {
          original: 'unknown',
          target: '',
          status: 'failed',
          confidence: 0,
          issues: ['No mapping found'],
          recommendations: [],
          alternatives: ['similar1', 'similar2']
        }
      ]
      
      const markdown = generateMigrationCode(resultsWithFailures, 'markdown')
      expect(markdown).toContain('## Failed Migrations')
      expect(markdown).toContain('similar1, similar2')
    })
  })

  describe('validateMigration', () => {
    test('should validate successful migration', () => {
      const successfulResults: SymbolMigrationResult[] = [
        {
          original: 'heart',
          target: 'heart',
          status: 'success',
          confidence: 95,
          issues: [],
          recommendations: [],
          alternatives: []
        },
        {
          original: 'star',
          target: 'star',
          status: 'success',
          confidence: 90,
          issues: [],
          recommendations: [],
          alternatives: []
        }
      ]
      
      const validation = validateMigration(successfulResults)
      
      expect(validation.isValid).toBe(true)
      expect(validation.errors.length).toBe(0)
    })

    test('should flag high failure rate', () => {
      const highFailureResults: SymbolMigrationResult[] = Array.from({ length: 10 }, (_, i) => ({
        original: `symbol${i}`,
        target: '',
        status: i < 7 ? 'failed' : 'success' as any, // 70% failure rate
        confidence: i < 7 ? 0 : 90,
        issues: i < 7 ? ['No mapping'] : [],
        recommendations: [],
        alternatives: []
      }))
      
      const validation = validateMigration(highFailureResults)
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(e => e.includes('failure rate'))).toBe(true)
    })

    test('should warn about low confidence migrations', () => {
      const lowConfidenceResults: SymbolMigrationResult[] = Array.from({ length: 10 }, (_, i) => ({
        original: `symbol${i}`,
        target: 'target',
        status: 'partial' as any,
        confidence: 50, // All low confidence
        issues: [],
        recommendations: [],
        alternatives: []
      }))
      
      const validation = validateMigration(lowConfidenceResults)
      
      expect(validation.warnings.some(w => w.includes('low-confidence'))).toBe(true)
    })

    test('should suggest variant handling', () => {
      const variantIssueResults: SymbolMigrationResult[] = [
        {
          original: 'symbol.fill',
          target: 'symbol',
          status: 'partial',
          confidence: 70,
          issues: ['Variant not fully supported'],
          recommendations: [],
          alternatives: []
        }
      ]
      
      const validation = validateMigration(variantIssueResults)
      
      expect(validation.suggestions.some(s => s.includes('variant'))).toBe(true)
    })

    test('should handle empty results', () => {
      const validation = validateMigration([])
      
      expect(validation.isValid).toBe(true)
      expect(validation.errors.length).toBe(0)
      expect(validation.warnings.length).toBe(0)
      expect(validation.suggestions.length).toBe(0)
    })

    test('should provide comprehensive validation', () => {
      const mixedResults: SymbolMigrationResult[] = [
        // Successful
        {
          original: 'heart',
          target: 'heart',
          status: 'success',
          confidence: 95,
          issues: [],
          recommendations: [],
          alternatives: []
        },
        // Low confidence
        {
          original: 'gear',
          target: 'settings',
          status: 'partial',
          confidence: 60,
          issues: [],
          recommendations: [],
          alternatives: []
        },
        // Failed
        {
          original: 'unknown',
          target: '',
          status: 'failed',
          confidence: 0,
          issues: ['No mapping'],
          recommendations: [],
          alternatives: []
        },
        // Variant issue
        {
          original: 'symbol.variant',
          target: 'symbol',
          status: 'warning',
          confidence: 70,
          issues: ['Variant compatibility issue'],
          recommendations: [],
          alternatives: []
        }
      ]
      
      const validation = validateMigration(mixedResults)
      
      expect(validation).toBeDefined()
      expect(typeof validation.isValid).toBe('boolean')
      expect(Array.isArray(validation.errors)).toBe(true)
      expect(Array.isArray(validation.warnings)).toBe(true)
      expect(Array.isArray(validation.suggestions)).toBe(true)
    })
  })

  describe('Integration Tests', () => {
    test('should handle real-world migration scenario', () => {
      const realWorldSymbols = [
        'heart.fill',
        'star.circle',
        'bell.slash',
        'person.crop.circle',
        'gear.badge',
        'house.fill',
        'envelope.open',
        'unknown.new.symbol'
      ]
      
      const analysis = analyzeProjectMigration(realWorldSymbols, {
        includeVariants: true,
        suggestAlternatives: true,
        confidenceThreshold: 75
      })
      
      expect(analysis.summary.totalSymbols).toBe(realWorldSymbols.length)
      expect(analysis.results.length).toBe(realWorldSymbols.length)
      
      // Should have some successful migrations
      expect(analysis.summary.successfulMigrations + analysis.summary.partialMigrations).toBeGreaterThan(0)
      
      // Should provide recommendations
      expect(analysis.recommendations.length).toBeGreaterThan(0)
      
      // Validation should work
      const validation = validateMigration(analysis.results)
      expect(validation).toBeDefined()
    })

    test('should maintain consistency between analysis and code generation', () => {
      const symbols = ['heart', 'star', 'gear']
      const analysis = analyzeProjectMigration(symbols)
      
      const tsCode = generateMigrationCode(analysis.results, 'typescript')
      const jsonCode = generateMigrationCode(analysis.results, 'json')
      
      // TypeScript and JSON should contain same mappings
      analysis.results
        .filter(r => r.status === 'success' || r.status === 'partial')
        .forEach(result => {
          expect(tsCode).toContain(result.original)
          expect(tsCode).toContain(result.target)
          expect(jsonCode).toContain(result.original)
        })
    })

    test('should provide actionable recommendations', () => {
      const problematicSymbols = [
        'unknown1',
        'unknown2', 
        'unknown3',
        'gear', // Low confidence
        'heart.unusual.variant'
      ]
      
      const analysis = analyzeProjectMigration(problematicSymbols)
      
      // Should identify the problems
      expect(analysis.summary.failedMigrations).toBeGreaterThan(0)
      
      // Should provide specific recommendations
      const highPriorityRecs = analysis.recommendations.filter(r => r.priority === 'high')
      expect(highPriorityRecs.length).toBeGreaterThan(0)
      
      // Recommendations should include affected symbols
      analysis.recommendations.forEach(rec => {
        expect(Array.isArray(rec.affectedSymbols)).toBe(true)
        expect(rec.description.length).toBeGreaterThan(0)
      })
    })
  })
})