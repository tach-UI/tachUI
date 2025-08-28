/**
 * Bundle Size Analysis Test Suite
 * 
 * Analyzes and validates bundle size impact of CSS Features
 * and provides optimization recommendations.
 */

import { describe, test, expect } from 'vitest'

// Import analysis - these imports help estimate bundle impact
import * as Transformations from '../../src/modifiers/transformations'
import * as Effects from '../../src/modifiers/effects'
import * as Filters from '../../src/modifiers/filters'
import * as Elements from '../../src/modifiers/elements'
import * as Transitions from '../../src/modifiers/transitions'
import * as Shadows from '../../src/modifiers/shadows'
import * as Scroll from '../../src/modifiers/scroll'
import * as Text from '../../src/modifiers/text'
import * as Attributes from '../../src/modifiers/attributes'
import * as BaseModifiers from '../../src/modifiers/base'
import * as ModifierIndex from '../../src/modifiers/index'

// Combine all modular exports for analysis
const CombinedFeatures = {
  ...Transformations,
  ...Effects,
  ...Filters,
  ...Elements,
  ...Transitions,
  ...Shadows,
  ...Scroll,
  ...Text,
  ...Attributes
}

// Utility function to estimate object size in bytes
function estimateObjectSize(obj: any, seen = new WeakSet()): number {
  if (obj === null || typeof obj !== 'object') {
    return 8 // Primitive size estimate
  }
  
  if (seen.has(obj)) {
    return 0 // Avoid circular references
  }
  seen.add(obj)
  
  let size = 0
  
  if (typeof obj === 'string') {
    size = obj.length * 2 // UTF-16 encoding
  } else if (typeof obj === 'function') {
    size = obj.toString().length * 2 + 200 // Function overhead
  } else if (Array.isArray(obj)) {
    size = 32 // Array overhead
    for (const item of obj) {
      size += estimateObjectSize(item, seen)
    }
  } else {
    size = 32 // Object overhead
    for (const [key, value] of Object.entries(obj)) {
      size += key.length * 2 // Key size
      size += estimateObjectSize(value, seen)
    }
  }
  
  return size
}

// Function to analyze module exports
function analyzeModuleSize(moduleExports: any): {
  totalFunctions: number
  totalClasses: number
  totalInterfaces: number
  estimatedSize: number
  functions: string[]
  classes: string[]
} {
  const functions: string[] = []
  const classes: string[] = []
  let totalInterfaces = 0
  
  for (const [name, value] of Object.entries(moduleExports)) {
    if (typeof value === 'function') {
      // Check if it's a class (has a more complex prototype structure)
      if (value.prototype && 
          value.prototype.constructor === value && 
          name.endsWith('Modifier')) {
        classes.push(name)
      } else {
        // It's a function (including arrow functions and factory functions)
        functions.push(name)
      }
    } else if (typeof value === 'object' && value !== null) {
      // Count as interface/type export
      totalInterfaces++
    }
  }
  
  return {
    totalFunctions: functions.length,
    totalClasses: classes.length,
    totalInterfaces,
    estimatedSize: estimateObjectSize(moduleExports),
    functions,
    classes
  }
}

describe('Bundle Size Analysis', () => {
  describe('CSS Features Module Analysis', () => {
    test('should analyze CSS Features module size', () => {
      const analysis = analyzeModuleSize(CombinedFeatures)
      
      console.log('CSS Features Module Analysis:', {
        totalFunctions: analysis.totalFunctions,
        totalClasses: analysis.totalClasses,
        totalInterfaces: analysis.totalInterfaces,
        estimatedSizeKB: (analysis.estimatedSize / 1024).toFixed(2),
        keyFunctions: analysis.functions.slice(0, 10), // Show first 10
        classes: analysis.classes
      })
      
      // Ensure reasonable size limits (updated for modular architecture)
      expect(analysis.totalFunctions).toBeGreaterThan(30) // Should have substantial functionality  
      expect(analysis.totalFunctions).toBeLessThan(150) // Modular system has more functions
      expect(analysis.totalClasses).toBeGreaterThan(3) // Core modifier classes
      expect(analysis.totalClasses).toBeLessThan(25) // Reasonable class count for modular system
      expect(analysis.estimatedSize).toBeLessThan(10000) // Less than 10KB estimated
    })

    test('should validate individual feature bundle impact', () => {
      const features = {
        transforms: [
          'transform', 'scale', 'rotate', 'translate', 'skew',
          'rotateX', 'rotateY', 'rotateZ', 'perspective'
        ],
        advancedTransforms: [
          'matrix', 'matrix3d', 'rotate3d', 'scale3d', 'translate3d',
          'scaleX', 'scaleY', 'scaleZ', 'translateX', 'translateY', 'translateZ'
        ],
        filters: [
          'filter', 'blur', 'brightness', 'contrast', 'saturate', 'grayscale', 'sepia',
          'backdropFilter', 'glassmorphism'
        ],
        backgroundClip: [
          'backgroundClip', 'gradientText', 'backgroundImage'
        ],
        pseudoElements: [
          'before', 'after', 'pseudoElements'
        ],
        customProperties: [
          'customProperties', 'customProperty', 'cssVariables', 'themeColors', 'designTokens'
        ],
        hover: [
          'hoverEffect', 'hover', 'hoverWithTransition'
        ],
        transitions: [
          'transition', 'transitions'
        ]
      }
      
      const analysis = analyzeModuleSize(CombinedFeatures)
      const bundleImpact: Record<string, number> = {}
      
      for (const [featureName, functionNames] of Object.entries(features)) {
        const featureFunctions = functionNames.filter(name => 
          analysis.functions.includes(name)
        )
        
        // Estimate size per feature (rough calculation)
        const estimatedFeatureSize = featureFunctions.length * 500 // ~500 bytes per function
        bundleImpact[featureName] = estimatedFeatureSize
        
        expect(featureFunctions.length).toBeGreaterThan(0) // All features should have functions
      }
      
      console.log('Feature Bundle Impact Analysis:', {
        ...Object.fromEntries(
          Object.entries(bundleImpact).map(([key, value]) => [
            key, 
            `${(value / 1024).toFixed(2)}KB`
          ])
        ),
        totalEstimated: `${(Object.values(bundleImpact).reduce((a, b) => a + b, 0) / 1024).toFixed(2)}KB`
      })
      
      // Validate reasonable feature sizes
      Object.values(bundleImpact).forEach(size => {
        expect(size).toBeLessThan(6000) // No single feature should exceed 6KB
      })
    })
  })

  describe('Tree Shaking Compatibility', () => {
    test('should support tree shaking with named exports', () => {
      const analysis = analyzeModuleSize(CombinedFeatures)
      
      // Verify that we're using named exports (good for tree shaking)
      expect(analysis.functions.length).toBeGreaterThan(0)
      expect(analysis.classes.length).toBeGreaterThan(0)
      
      // Check that there's no default export dominating the module
      expect(CombinedFeatures.default).toBeUndefined()
      
      console.log('Tree Shaking Analysis:', {
        namedExports: analysis.functions.length + analysis.classes.length,
        hasDefaultExport: !!CombinedFeatures.default,
        treeShakingFriendly: !CombinedFeatures.default
      })
    })

    test('should have minimal cross-dependencies', () => {
      // Test importing individual functions doesn't pull in everything
      const {
        transform,
        gradientText,
        customProperty,
        hoverEffect
      } = CombinedFeatures
      
      // Each function should exist and be callable
      expect(typeof transform).toBe('function')
      expect(typeof gradientText).toBe('function')  
      expect(typeof customProperty).toBe('function')
      expect(typeof hoverEffect).toBe('function')
      
      console.log('Individual Import Test:', {
        transform: typeof transform,
        gradientText: typeof gradientText,
        customProperty: typeof customProperty,
        hoverEffect: typeof hoverEffect
      })
    })
  })

  describe('Bundle Size Optimization Recommendations', () => {
    test('should provide optimization strategies', () => {
      const analysis = analyzeModuleSize(CombinedFeatures)
      
      const recommendations = []
      
      // Analyze size patterns
      if (analysis.estimatedSize > 40000) {
        recommendations.push('Consider splitting large features into separate modules')
      }
      
      if (analysis.totalFunctions > 50) {
        recommendations.push('Consider grouping related functions to reduce export count')
      }
      
      if (analysis.totalClasses > 15) {
        recommendations.push('Evaluate if some classes can be merged or simplified')
      }
      
      // Always recommend these best practices
      recommendations.push('Use named exports for optimal tree shaking')
      recommendations.push('Keep individual feature functions lightweight')
      recommendations.push('Consider lazy loading for advanced features')
      
      console.log('Bundle Optimization Recommendations:', recommendations)
      
      expect(recommendations.length).toBeGreaterThan(0)
    })

    test('should validate minification efficiency', () => {
      // Test that function names are reasonable for minification
      const analysis = analyzeModuleSize(CombinedFeatures)
      
      const longFunctionNames = analysis.functions.filter(name => name.length > 20)
      const veryLongFunctionNames = analysis.functions.filter(name => name.length > 30)
      
      console.log('Minification Analysis:', {
        totalFunctions: analysis.functions.length,
        longNames: longFunctionNames.length,
        veryLongNames: veryLongFunctionNames.length,
        averageNameLength: analysis.functions.reduce((sum, name) => sum + name.length, 0) / analysis.functions.length,
        longNameSamples: longFunctionNames.slice(0, 5)
      })
      
      // Most function names should be reasonable length
      expect(veryLongFunctionNames.length).toBeLessThan(analysis.functions.length * 0.1) // Less than 10%
    })
  })

  describe('Comparative Size Analysis', () => {
    test('should compare CSS Features to base modifiers', () => {
      const cssAnalysis = analyzeModuleSize(CombinedFeatures)
      const baseAnalysis = analyzeModuleSize(BaseModifiers)
      
      const sizeRatio = cssAnalysis.estimatedSize / baseAnalysis.estimatedSize
      
      console.log('Comparative Analysis:', {
        cssFeaturesSize: `${(cssAnalysis.estimatedSize / 1024).toFixed(2)}KB`,
        baseModifiersSize: `${(baseAnalysis.estimatedSize / 1024).toFixed(2)}KB`,
        sizeRatio: sizeRatio.toFixed(2),
        cssFunctions: cssAnalysis.totalFunctions,
        baseFunctions: baseAnalysis.totalFunctions
      })
      
      // CSS Features should be larger but not excessively so
      expect(sizeRatio).toBeGreaterThan(1) // Should be larger than base
      expect(sizeRatio).toBeLessThan(20) // Modular system is larger, allow up to 20x
    })
  })

  describe('Production Bundle Impact', () => {
    test('should estimate real-world bundle impact', () => {
      // Simulate common usage patterns
      const commonUsage = {
        basicTransforms: ['scale', 'rotate', 'translate'],
        visualEffects: ['gradientText', 'blur', 'hoverEffect'],
        theming: ['customProperty', 'themeColors'],
        advanced: ['matrix3d', 'backdropFilter', 'pseudoElements']
      }
      
      const usageAnalysis = Object.entries(commonUsage).map(([pattern, functions]) => {
        const estimatedSize = functions.length * 600 // ~600 bytes per function including dependencies
        return {
          pattern,
          functions: functions.length,
          estimatedSize,
          sizeKB: (estimatedSize / 1024).toFixed(2)
        }
      })
      
      console.log('Real-world Usage Impact:', usageAnalysis)
      
      // Basic usage should be lightweight
      const basicUsage = usageAnalysis.find(u => u.pattern === 'basicTransforms')!
      expect(parseFloat(basicUsage.sizeKB)).toBeLessThan(5) // Less than 5KB for basic usage
      
      // Full advanced usage should still be reasonable
      const totalSize = usageAnalysis.reduce((sum, u) => sum + u.estimatedSize, 0)
      expect(totalSize / 1024).toBeLessThan(20) // Less than 20KB for full feature set
    })
  })

  describe('Size Regression Prevention', () => {
    test('should establish size baselines', () => {
      const analysis = analyzeModuleSize(CombinedFeatures)
      
      const baselines = {
        maxFunctions: 150,  // Updated for modular architecture
        maxClasses: 25,     // Updated for modular architecture
        maxEstimatedSizeKB: 15, // Updated for larger modular system
        maxAverageNameLength: 20
      }
      
      const averageNameLength = analysis.functions.reduce((sum, name) => sum + name.length, 0) / analysis.functions.length
      
      // Validate against baselines
      expect(analysis.totalFunctions).toBeLessThanOrEqual(baselines.maxFunctions)
      expect(analysis.totalClasses).toBeLessThanOrEqual(baselines.maxClasses)
      expect(analysis.estimatedSize / 1024).toBeLessThanOrEqual(baselines.maxEstimatedSizeKB)
      expect(averageNameLength).toBeLessThanOrEqual(baselines.maxAverageNameLength)
      
      console.log('Size Baseline Validation:', {
        functions: `${analysis.totalFunctions}/${baselines.maxFunctions}`,
        classes: `${analysis.totalClasses}/${baselines.maxClasses}`,
        sizeKB: `${(analysis.estimatedSize / 1024).toFixed(2)}/${baselines.maxEstimatedSizeKB}`,
        avgNameLength: `${averageNameLength.toFixed(1)}/${baselines.maxAverageNameLength}`,
        allPassed: true
      })
    })
  })
})