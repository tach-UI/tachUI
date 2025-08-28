/**
 * Tests for SF Symbol category mapping system
 */

import { describe, test, expect } from 'vitest'
import {
  SymbolCategory,
  CATEGORY_METADATA,
  getSymbolsByCategory,
  getSymbolCategory,
  getAllSymbolCategories,
  searchSymbolsByCategory,
  getRecommendedSymbols,
  getRelatedCategories,
  generateSymbolCollection
} from '../../src/compatibility/category-mapping.js'

describe('SF Symbol Category Mapping', () => {
  describe('SymbolCategory Enum', () => {
    test('should include all major category types', () => {
      const expectedCategories = [
        'system', 'interface', 'navigation', 'media', 'playback', 'camera',
        'communication', 'social', 'messaging', 'people', 'identity', 'accessibility',
        'documents', 'files', 'storage', 'time', 'calendar', 'scheduling',
        'location', 'maps', 'transportation', 'travel', 'weather', 'environment',
        'nature', 'health', 'fitness', 'wellness', 'shopping', 'commerce',
        'finance', 'technology', 'devices', 'connectivity', 'education',
        'learning', 'science', 'entertainment', 'games', 'sports', 'business',
        'productivity', 'tools'
      ]
      
      expectedCategories.forEach(category => {
        expect(Object.values(SymbolCategory)).toContain(category)
      })
    })

    test('should have consistent naming convention', () => {
      Object.values(SymbolCategory).forEach(category => {
        expect(category).toMatch(/^[a-z]+$/)
        expect(category.length).toBeGreaterThan(2)
      })
    })
  })

  describe('CATEGORY_METADATA', () => {
    test('should have metadata for all categories', () => {
      Object.values(SymbolCategory).forEach(category => {
        expect(CATEGORY_METADATA).toHaveProperty(category)
        
        const metadata = CATEGORY_METADATA[category]
        expect(metadata.name).toBe(category)
        expect(metadata.displayName).toBeDefined()
        expect(metadata.description).toBeDefined()
        expect(Array.isArray(metadata.keywords)).toBe(true)
        expect(Array.isArray(metadata.commonUseCases)).toBe(true)
        expect(Array.isArray(metadata.relatedCategories)).toBe(true)
      })
    })

    test('should have meaningful descriptions', () => {
      Object.values(CATEGORY_METADATA).forEach(metadata => {
        expect(metadata.description.length).toBeGreaterThan(10)
        expect(metadata.displayName.length).toBeGreaterThan(0)
        expect(metadata.keywords.length).toBeGreaterThan(0)
        expect(metadata.commonUseCases.length).toBeGreaterThan(0)
      })
    })

    test('should have valid related categories', () => {
      Object.values(CATEGORY_METADATA).forEach(metadata => {
        metadata.relatedCategories.forEach(relatedCat => {
          expect(Object.values(SymbolCategory)).toContain(relatedCat)
        })
      })
    })

    test('should have appropriate keywords for each category', () => {
      // Test specific category keywords
      expect(CATEGORY_METADATA[SymbolCategory.SYSTEM].keywords).toContain('ui')
      expect(CATEGORY_METADATA[SymbolCategory.COMMUNICATION].keywords).toContain('communication')
      expect(CATEGORY_METADATA[SymbolCategory.MEDIA].keywords).toContain('media')
      expect(CATEGORY_METADATA[SymbolCategory.HEALTH].keywords).toContain('health')
    })
  })

  describe('getSymbolsByCategory', () => {
    test('should return symbols for valid categories', () => {
      const systemSymbols = getSymbolsByCategory(SymbolCategory.SYSTEM)
      expect(Array.isArray(systemSymbols)).toBe(true)
      
      // Check that returned symbols have the correct category
      systemSymbols.forEach(symbol => {
        expect(symbol.category).toBe('system')
      })
    })

    test('should return empty array for categories with no symbols', () => {
      // Note: Some categories might not have symbols in our test mapping
      const results = getSymbolsByCategory(SymbolCategory.SCIENCE)
      expect(Array.isArray(results)).toBe(true)
    })

    test('should handle includeSecondary parameter', () => {
      const primaryOnly = getSymbolsByCategory(SymbolCategory.NAVIGATION, false)
      const withSecondary = getSymbolsByCategory(SymbolCategory.NAVIGATION, true)
      
      expect(Array.isArray(primaryOnly)).toBe(true)
      expect(Array.isArray(withSecondary)).toBe(true)
      // Secondary categories aren't implemented yet, so they should be equal
      expect(withSecondary.length).toBe(primaryOnly.length)
    })
  })

  describe('getSymbolCategory', () => {
    test('should return correct category for known symbols', () => {
      // Test symbols that we know exist in our mapping
      const heartCategory = getSymbolCategory('heart')
      expect(heartCategory).toBeDefined()
      
      const gearCategory = getSymbolCategory('gear')
      expect(gearCategory).toBeDefined()
    })

    test('should handle symbol aliases', () => {
      // Test with an alias
      const heartFillCategory = getSymbolCategory('heart.fill')
      expect(heartFillCategory).toBeDefined()
    })

    test('should return undefined for unknown symbols', () => {
      const unknownCategory = getSymbolCategory('nonexistent.symbol')
      expect(unknownCategory).toBeUndefined()
    })

    test('should return valid SymbolCategory enum values', () => {
      const knownSymbols = ['heart', 'star', 'gear', 'house']
      
      knownSymbols.forEach(symbol => {
        const category = getSymbolCategory(symbol)
        if (category) {
          expect(Object.values(SymbolCategory)).toContain(category)
        }
      })
    })
  })

  describe('getAllSymbolCategories', () => {
    test('should return array of category information', () => {
      const categories = getAllSymbolCategories()
      
      expect(Array.isArray(categories)).toBe(true)
      
      categories.forEach(categoryInfo => {
        expect(categoryInfo).toHaveProperty('category')
        expect(categoryInfo).toHaveProperty('name')
        expect(categoryInfo).toHaveProperty('displayName')
        expect(categoryInfo).toHaveProperty('count')
        expect(categoryInfo).toHaveProperty('symbols')
        
        expect(Object.values(SymbolCategory)).toContain(categoryInfo.category)
        expect(categoryInfo.count).toBeGreaterThanOrEqual(0)
        expect(Array.isArray(categoryInfo.symbols)).toBe(true)
        expect(categoryInfo.symbols.length).toBe(categoryInfo.count)
      })
    })

    test('should only include categories with symbols', () => {
      const categories = getAllSymbolCategories()
      
      categories.forEach(categoryInfo => {
        expect(categoryInfo.count).toBeGreaterThan(0)
      })
    })

    test('should have consistent naming', () => {
      const categories = getAllSymbolCategories()
      
      categories.forEach(categoryInfo => {
        expect(categoryInfo.name).toBe(categoryInfo.category)
        expect(categoryInfo.displayName.length).toBeGreaterThan(0)
      })
    })
  })

  describe('searchSymbolsByCategory', () => {
    test('should return relevant results for search queries', () => {
      const results = searchSymbolsByCategory('heart')
      
      expect(Array.isArray(results)).toBe(true)
      
      results.forEach(result => {
        expect(result).toHaveProperty('symbol')
        expect(result).toHaveProperty('category')
        expect(result).toHaveProperty('relevanceScore')
        
        expect(result.relevanceScore).toBeGreaterThan(0)
        expect(Object.values(SymbolCategory)).toContain(result.category)
      })
    })

    test('should sort results by relevance score', () => {
      const results = searchSymbolsByCategory('system')
      
      if (results.length > 1) {
        for (let i = 1; i < results.length; i++) {
          expect(results[i - 1].relevanceScore).toBeGreaterThanOrEqual(results[i].relevanceScore)
        }
      }
    })

    test('should handle category filtering', () => {
      const categories = [SymbolCategory.SYSTEM, SymbolCategory.NAVIGATION]
      const results = searchSymbolsByCategory('icon', categories)
      
      results.forEach(result => {
        expect(categories).toContain(result.category)
      })
    })

    test('should handle multiple search terms', () => {
      const results = searchSymbolsByCategory('heart love')
      expect(Array.isArray(results)).toBe(true)
    })

    test('should return empty array for no matches', () => {
      const results = searchSymbolsByCategory('veryrareandunlikelysearchterm')
      expect(results).toEqual([])
    })

    test('should be case insensitive', () => {
      const lowerResults = searchSymbolsByCategory('heart')
      const upperResults = searchSymbolsByCategory('HEART')
      const mixedResults = searchSymbolsByCategory('Heart')
      
      // Should return similar results regardless of case
      expect(lowerResults.length).toBe(upperResults.length)
      expect(lowerResults.length).toBe(mixedResults.length)
    })
  })

  describe('getRecommendedSymbols', () => {
    test('should return recommended symbols for a category', () => {
      const recommendations = getRecommendedSymbols(SymbolCategory.SYSTEM)
      
      expect(Array.isArray(recommendations)).toBe(true)
      expect(recommendations.length).toBeLessThanOrEqual(10) // Default limit
      
      recommendations.forEach(symbol => {
        expect(symbol.category).toBe('system')
      })
    })

    test('should respect custom limit', () => {
      const limit = 5
      const recommendations = getRecommendedSymbols(SymbolCategory.SYSTEM, undefined, limit)
      
      expect(recommendations.length).toBeLessThanOrEqual(limit)
    })

    test('should handle context-based filtering', () => {
      const contextRecommendations = getRecommendedSymbols(
        SymbolCategory.SYSTEM,
        'button interface',
        5
      )
      
      expect(Array.isArray(contextRecommendations)).toBe(true)
      expect(contextRecommendations.length).toBeLessThanOrEqual(5)
    })

    test('should prioritize high-quality matches', () => {
      const recommendations = getRecommendedSymbols(SymbolCategory.SYSTEM)
      
      // Should prefer exact and close matches
      recommendations.forEach(symbol => {
        expect(['exact', 'close', 'approximate']).toContain(symbol.matchQuality)
      })
    })
  })

  describe('getRelatedCategories', () => {
    test('should return related categories with relationship info', () => {
      const related = getRelatedCategories(SymbolCategory.SYSTEM)
      
      expect(Array.isArray(related)).toBe(true)
      
      related.forEach(relation => {
        expect(relation).toHaveProperty('category')
        expect(relation).toHaveProperty('relationship')
        expect(relation).toHaveProperty('reason')
        
        expect(Object.values(SymbolCategory)).toContain(relation.category)
        expect(['strong', 'moderate', 'weak']).toContain(relation.relationship)
        expect(typeof relation.reason).toBe('string')
        expect(relation.reason.length).toBeGreaterThan(0)
      })
    })

    test('should return categories defined in metadata', () => {
      const systemMetadata = CATEGORY_METADATA[SymbolCategory.SYSTEM]
      const related = getRelatedCategories(SymbolCategory.SYSTEM)
      
      expect(related.length).toBe(systemMetadata.relatedCategories.length)
      
      related.forEach(relation => {
        expect(systemMetadata.relatedCategories).toContain(relation.category)
      })
    })

    test('should assign appropriate relationship strengths', () => {
      const related = getRelatedCategories(SymbolCategory.SYSTEM)
      
      // Should have at least one relationship
      expect(related.length).toBeGreaterThan(0)
      
      // Relationship reasons should make sense
      related.forEach(relation => {
        if (relation.relationship === 'strong') {
          expect(relation.reason).toMatch(/overlap|shared/i)
        }
      })
    })
  })

  describe('generateSymbolCollection', () => {
    test('should generate organized symbol collection', () => {
      const categories = [SymbolCategory.SYSTEM, SymbolCategory.NAVIGATION]
      const collection = generateSymbolCollection(categories)
      
      expect(typeof collection).toBe('object')
      
      // Check that we get collections for requested categories
      categories.forEach(category => {
        const metadata = CATEGORY_METADATA[category]
        const symbols = collection[metadata.displayName]
        
        if (symbols) {
          expect(Array.isArray(symbols)).toBe(true)
          expect(symbols.length).toBeLessThanOrEqual(20) // Default max per category
        }
      })
    })

    test('should respect maxPerCategory parameter', () => {
      const maxPerCategory = 5
      const collection = generateSymbolCollection([SymbolCategory.SYSTEM], maxPerCategory)
      
      Object.values(collection).forEach(symbols => {
        expect(symbols.length).toBeLessThanOrEqual(maxPerCategory)
      })
    })

    test('should prioritize high-quality symbols', () => {
      const collection = generateSymbolCollection([SymbolCategory.SYSTEM])
      
      Object.values(collection).forEach(symbols => {
        // Check that symbols are sorted by quality (exact > close > approximate)
        for (let i = 1; i < symbols.length; i++) {
          const prevQuality = symbols[i - 1].matchQuality
          const currQuality = symbols[i].matchQuality
          
          const qualityScore = (quality: string) => 
            quality === 'exact' ? 2 : quality === 'close' ? 1 : 0
          
          expect(qualityScore(prevQuality)).toBeGreaterThanOrEqual(qualityScore(currQuality))
        }
      })
    })

    test('should handle empty categories gracefully', () => {
      // Test with a category that might not have symbols
      const collection = generateSymbolCollection([SymbolCategory.SCIENCE])
      
      expect(typeof collection).toBe('object')
      // Should not throw error even if category has no symbols
    })
  })

  describe('Integration Tests', () => {
    test('should maintain consistency across functions', () => {
      // Get all categories
      const allCategories = getAllSymbolCategories()
      
      allCategories.forEach(categoryInfo => {
        // Get symbols for this category
        const symbols = getSymbolsByCategory(categoryInfo.category)
        
        // Count should match
        expect(symbols.length).toBe(categoryInfo.count)
        
        // Symbol list should match
        const symbolNames = symbols.map(s => s.sfSymbol).sort()
        const infoSymbolNames = categoryInfo.symbols.sort()
        expect(symbolNames).toEqual(infoSymbolNames)
      })
    })

    test('should handle real-world category queries', () => {
      const commonQueries = [
        'navigation',
        'media',
        'system',
        'communication',
        'health'
      ]
      
      commonQueries.forEach(query => {
        const searchResults = searchSymbolsByCategory(query)
        expect(Array.isArray(searchResults)).toBe(true)
        
        if (searchResults.length > 0) {
          expect(searchResults[0].relevanceScore).toBeGreaterThan(0)
        }
      })
    })

    test('should provide coherent category relationships', () => {
      // Test that related categories make sense
      const systemRelated = getRelatedCategories(SymbolCategory.SYSTEM)
      const systemRelatedCategories = systemRelated.map(r => r.category)
      
      // System should be related to interface and navigation
      expect(systemRelatedCategories).toContain(SymbolCategory.INTERFACE)
      expect(systemRelatedCategories).toContain(SymbolCategory.NAVIGATION)
    })
  })
})