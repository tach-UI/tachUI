/**
 * TachUI Vite Plugin
 *
 * Custom Vite plugin that transforms SwiftUI-style syntax into reactive DOM code.
 * This is the core of Phase 2.1.1 - the plugin foundation for compile-time transformation.
 */

import type { Plugin, TransformResult } from 'vite'
import * as ts from 'typescript'
import { generateDOMCode } from './codegen'
import { parseSwiftUISyntax } from './parser'
import type { TachUIPluginOptions } from './types'

/**
 * Creates the TachUI Vite plugin for transforming SwiftUI syntax
 */
export function createTachUIPlugin(options: TachUIPluginOptions = {}): Plugin {
  const {
    include = ['.tsx', '.ts'],
    exclude = ['node_modules/**', '**/*.test.*', '**/*.bench.*'],
    dev = process.env.NODE_ENV === 'development',
    transform: transformOptions = {},
  } = options

  return {
    name: 'tachui-transform',
    enforce: 'pre', // Run before other plugins

    configResolved(config) {
      // Access the resolved Vite config
      if (dev && config.command === 'serve') {
        console.log('🚀 TachUI plugin loaded in development mode')
      }
    },

    buildStart() {
      // Plugin initialization
      this.addWatchFile('tachui.config.ts') // Watch for config changes
    },

    resolveId(id: string) {
      // Handle virtual modules if needed
      if (id === 'virtual:tachui-runtime') {
        return id
      }
      return null
    },

    load(id: string) {
      // Load virtual modules
      if (id === 'virtual:tachui-runtime') {
        return generateRuntimeCode()
      }
      return null
    },

    transform(code: string, id: string): TransformResult | null {
      // Only transform files that match our criteria
      if (!shouldTransform(id, include, exclude)) {
        return null
      }

      try {
        let transformedCode = code
        let hasTransformations = false

        // Phase 2: Analyze and optimize concatenation patterns first
        const concatenationPatterns = analyzeConcatenationPatterns(code, id)

        if (concatenationPatterns.length > 0) {
          // Phase 3: Generate comprehensive optimization report
          const optimizationReport = generateOptimizationReport(
            concatenationPatterns,
            id
          )

          // Enhanced development reporting
          reportOptimizationResults(optimizationReport, id, dev)

          // Transform concatenation patterns
          transformedCode = transformConcatenationPatterns(
            transformedCode,
            concatenationPatterns
          )
          hasTransformations = true

          // Store optimization data for potential CLI integration
          if (dev) {
            ;(global as any).__tachui_optimization_data =
              (global as any).__tachui_optimization_data || []
            ;(global as any).__tachui_optimization_data.push({
              filename: id,
              patterns: concatenationPatterns,
              report: optimizationReport,
              timestamp: Date.now(),
            })
          }
        }

        // Phase 1: Check if the file contains SwiftUI syntax for traditional compilation
        if (containsTachUISyntax(transformedCode)) {
          if (dev && concatenationPatterns.length === 0) {
            console.log(`🔄 Transforming SwiftUI syntax: ${id}`)
          }

          // Parse SwiftUI syntax into AST
          const ast = parseSwiftUISyntax(transformedCode, id)

          // Generate reactive DOM code from AST
          const swiftUITransformed = generateDOMCode(ast, {
            ...transformOptions,
            sourceFile: id,
            sourceMaps: transformOptions.sourceMaps ?? dev,
          })

          return {
            code: swiftUITransformed.code,
            map: swiftUITransformed.map,
          }
        }

        // Return concatenation-only transformations if we made any
        if (hasTransformations) {
          return {
            code: transformedCode,
            map: null, // TODO: Generate source maps for concatenation transformations
          }
        }

        return null
      } catch (error) {
        // Provide helpful error messages during development
        const message = error instanceof Error ? error.message : String(error)
        this.error(`TachUI transformation failed in ${id}: ${message}`)
        return null
      }
    },

    handleHotUpdate(ctx) {
      // Handle HMR for TachUI components
      if (ctx.file.endsWith('.tui.tsx') || ctx.file.endsWith('.tui.ts')) {
        // Mark for full reload if needed
        ctx.server.ws.send({
          type: 'full-reload',
        })
        return []
      }
    },
  }
}

/**
 * Phase 2: Component-Level Concatenation Analysis
 * Detects .build().concat() patterns in JavaScript/TypeScript code
 */
interface ConcatenationPattern {
  type: 'static' | 'dynamic'
  location: { start: number; end: number }
  leftComponent: string
  rightComponent: string
  optimizable: boolean
  accessibilityNeeds: 'minimal' | 'aria' | 'full'
}

/**
 * Analyzes JavaScript/TypeScript code for concatenation patterns using AST
 * Replaces regex-based approach with proper TypeScript AST analysis
 */
function analyzeConcatenationPatterns(
  code: string,
  filename: string
): ConcatenationPattern[] {
  const patterns: ConcatenationPattern[] = []

  try {
    // Parse the code into a TypeScript AST
    const sourceFile = ts.createSourceFile(
      filename,
      code,
      ts.ScriptTarget.Latest,
      true,
      filename.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    )

    // Walk the AST to find .concat() calls
    function visit(node: ts.Node): void {
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === 'concat'
      ) {
        // Check if this is a .build().concat() pattern
        const leftExpression = node.expression.expression
        if (
          ts.isCallExpression(leftExpression) &&
          ts.isPropertyAccessExpression(leftExpression.expression) &&
          leftExpression.expression.name.text === 'build'
        ) {
          // The leftExpression.expression.expression contains the component call chain
          // We need to extract just the component without the variable assignment
          const componentChain = leftExpression.expression.expression
          const leftComponent = extractComponentExpression(componentChain, code)

          // Extract right component (first argument to .concat())
          const rightComponent =
            node.arguments.length > 0
              ? extractComponentExpression(node.arguments[0], code)
              : ''

          if (leftComponent && rightComponent) {
            // Get source location
            const start = node.getStart(sourceFile)
            const end = node.getEnd()

            // Determine if this is a static concatenation pattern
            const isStatic = isStaticConcatenation(
              leftComponent,
              rightComponent
            )

            // Analyze accessibility requirements
            const accessibilityNeeds = analyzeAccessibilityNeeds(
              leftComponent,
              rightComponent,
              code
            )

            patterns.push({
              type: isStatic ? 'static' : 'dynamic',
              location: { start, end },
              leftComponent: leftComponent.trim(),
              rightComponent: rightComponent.trim(),
              optimizable: isStatic,
              accessibilityNeeds,
            })
          }
        }
      }

      // Continue traversing child nodes
      ts.forEachChild(node, visit)
    }

    visit(sourceFile)
  } catch (error) {
    // If AST parsing fails, return empty patterns (graceful fallback)
    console.warn(
      `Failed to parse ${filename} for concatenation analysis:`,
      error
    )
  }

  return patterns
}

/**
 * Helper function to extract component expression text from AST node
 * Replaces regex-based string manipulation with AST-aware text extraction
 */
function extractComponentExpression(node: ts.Node, sourceCode: string): string {
  const start = node.getStart()
  const end = node.getEnd()
  return sourceCode.substring(start, end)
}

/**
 * Phase 3: Enhanced Developer Experience
 * Comprehensive reporting and analysis for concatenation optimizations
 */

interface OptimizationReport {
  totalPatterns: number
  optimizedPatterns: number
  runtimePatterns: number
  bundleImpact: BundleImpact
  accessibilityBreakdown: AccessibilityBreakdown
  recommendations: OptimizationRecommendation[]
}

interface BundleImpact {
  estimatedSavingsKB: number
  runtimeReduction: string
  selectedRuntimes: Set<string>
}

interface AccessibilityBreakdown {
  minimal: number
  aria: number
  full: number
}

interface OptimizationRecommendation {
  type: 'static' | 'accessibility' | 'performance'
  pattern: ConcatenationPattern
  suggestion: string
  impact: 'low' | 'medium' | 'high'
}

/**
 * Enhanced reporting system for concatenation optimizations
 */
function generateOptimizationReport(
  patterns: ConcatenationPattern[],
  _filename: string
): OptimizationReport {
  const optimizedPatterns = patterns.filter(p => p.optimizable)
  const runtimePatterns = patterns.filter(p => !p.optimizable)

  // Calculate bundle impact
  const selectedRuntimes = new Set<string>()
  patterns.forEach(pattern => {
    selectedRuntimes.add(`concatenation-${pattern.accessibilityNeeds}`)
  })

  // Estimate bundle size savings
  const baseConcatenationSize = 87.76 // KB - current runtime system size
  const optimizedSize = selectedRuntimes.size * 5 // Estimated 5KB per runtime
  const estimatedSavingsKB = Math.max(0, baseConcatenationSize - optimizedSize)

  // Accessibility breakdown
  const accessibilityBreakdown: AccessibilityBreakdown = {
    minimal: patterns.filter(p => p.accessibilityNeeds === 'minimal').length,
    aria: patterns.filter(p => p.accessibilityNeeds === 'aria').length,
    full: patterns.filter(p => p.accessibilityNeeds === 'full').length,
  }

  // Generate recommendations
  const recommendations = generateOptimizationRecommendations(patterns)

  return {
    totalPatterns: patterns.length,
    optimizedPatterns: optimizedPatterns.length,
    runtimePatterns: runtimePatterns.length,
    bundleImpact: {
      estimatedSavingsKB,
      runtimeReduction: `${Math.round((estimatedSavingsKB / baseConcatenationSize) * 100)}%`,
      selectedRuntimes,
    },
    accessibilityBreakdown,
    recommendations,
  }
}

/**
 * Generates optimization recommendations based on pattern analysis
 */
function generateOptimizationRecommendations(
  patterns: ConcatenationPattern[]
): OptimizationRecommendation[] {
  const recommendations: OptimizationRecommendation[] = []

  patterns.forEach(pattern => {
    // Static optimization recommendations
    if (!pattern.optimizable) {
      if (
        containsOnlyStringLiterals(
          pattern.leftComponent,
          pattern.rightComponent
        )
      ) {
        recommendations.push({
          type: 'static',
          pattern,
          suggestion:
            'Consider extracting variable interpolation to enable static concatenation',
          impact: 'medium',
        })
      }
    }

    // Accessibility optimization recommendations
    if (
      pattern.accessibilityNeeds === 'full' &&
      couldUseSimpleAccessibility(pattern)
    ) {
      recommendations.push({
        type: 'accessibility',
        pattern,
        suggestion:
          'This concatenation could use minimal ARIA - consider simplifying accessibility requirements',
        impact: 'low',
      })
    }

    // Performance recommendations
    if (pattern.type === 'dynamic' && hasHighFrequencyUsage(pattern)) {
      recommendations.push({
        type: 'performance',
        pattern,
        suggestion:
          'High-frequency dynamic concatenation - consider memoization or caching',
        impact: 'high',
      })
    }
  })

  return recommendations
}

/**
 * Enhanced console reporting with detailed analysis
 */
function reportOptimizationResults(
  report: OptimizationReport,
  filename: string,
  dev: boolean
): void {
  if (!dev || report.totalPatterns === 0) return

  const shortFilename = filename.split('/').pop() || filename

  console.log(`\n🔗 TachUI Concatenation Analysis - ${shortFilename}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

  // Pattern summary
  console.log(`📊 Pattern Summary:`)
  console.log(`   Total patterns: ${report.totalPatterns}`)
  console.log(`   ✅ Optimized: ${report.optimizedPatterns} (static)`)
  console.log(`   🔄 Runtime: ${report.runtimePatterns} (dynamic)`)

  // Bundle impact
  console.log(`\n📦 Bundle Impact:`)
  console.log(
    `   Estimated savings: ${report.bundleImpact.estimatedSavingsKB.toFixed(1)}KB`
  )
  console.log(`   Runtime reduction: ${report.bundleImpact.runtimeReduction}`)
  console.log(
    `   Selected runtimes: ${Array.from(report.bundleImpact.selectedRuntimes).join(', ')}`
  )

  // Accessibility breakdown
  console.log(`\n♿ Accessibility Breakdown:`)
  console.log(`   Minimal: ${report.accessibilityBreakdown.minimal}`)
  console.log(`   ARIA: ${report.accessibilityBreakdown.aria}`)
  console.log(`   Full: ${report.accessibilityBreakdown.full}`)

  // Recommendations
  if (report.recommendations.length > 0) {
    console.log(`\n💡 Optimization Recommendations:`)
    report.recommendations.forEach(rec => {
      const impactIcon =
        rec.impact === 'high' ? '🔴' : rec.impact === 'medium' ? '🟡' : '🔵'
      console.log(`   ${impactIcon} ${rec.suggestion}`)
    })
  }

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
}

// Helper functions for recommendations
function containsOnlyStringLiterals(left: string, right: string): boolean {
  const stringLiteralPattern = /Text\s*\(\s*["'][^"']*["']\s*\)/
  return stringLiteralPattern.test(left) || stringLiteralPattern.test(right)
}

function couldUseSimpleAccessibility(pattern: ConcatenationPattern): boolean {
  return (
    !pattern.leftComponent.includes('Button') &&
    !pattern.rightComponent.includes('Button') &&
    !pattern.leftComponent.includes('Link') &&
    !pattern.rightComponent.includes('Link')
  )
}

function hasHighFrequencyUsage(pattern: ConcatenationPattern): boolean {
  // Heuristic: if pattern is in a loop-like structure
  return (
    pattern.leftComponent.includes('entry[') ||
    pattern.rightComponent.includes('entry[') ||
    pattern.leftComponent.includes('.map') ||
    pattern.rightComponent.includes('.map')
  )
}

/**
 * Determines if concatenation involves only static components
 */
function isStaticConcatenation(left: string, right: string): boolean {
  // Check if both components are static (no variable interpolation or function calls)
  const hasVariableInterpolation = /\$\{[^}]+\}|[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/

  return (
    !hasVariableInterpolation.test(left) &&
    !hasVariableInterpolation.test(right)
  )
}

/**
 * Analyzes what level of accessibility support is needed
 */
function analyzeAccessibilityNeeds(
  left: string,
  right: string,
  context: string
): 'minimal' | 'aria' | 'full' {
  // Look for accessibility indicators in the component calls
  const hasAriaAttributes = /aria[A-Z][a-zA-Z]*|role\s*:/i.test(context)
  const hasInteractiveElements = /Button|Link|onTapGesture|onClick/i.test(
    left + right
  )
  const hasComplexLayout = /VStack|HStack|ZStack|Form/i.test(context)

  if (hasAriaAttributes || hasComplexLayout) {
    return 'full'
  } else if (hasInteractiveElements) {
    return 'aria'
  } else {
    return 'minimal'
  }
}

/**
 * Transforms concatenation patterns into optimized implementations
 */
function transformConcatenationPatterns(
  code: string,
  patterns: ConcatenationPattern[]
): string {
  let transformedCode = code

  // Process patterns in reverse order to maintain correct positions
  for (const pattern of patterns.reverse()) {
    if (pattern.optimizable) {
      // Replace with optimized static concatenation
      const optimizedCode = generateOptimizedConcatenation(pattern)
      transformedCode =
        transformedCode.slice(0, pattern.location.start) +
        optimizedCode +
        transformedCode.slice(pattern.location.end)
    }
  }

  return transformedCode
}

/**
 * Generates optimized concatenation code that eliminates runtime overhead
 */
function generateOptimizedConcatenation(pattern: ConcatenationPattern): string {
  const { leftComponent, rightComponent, accessibilityNeeds } = pattern

  // Import the appropriate runtime based on accessibility needs
  const runtimeImport = getRuntimeImportForAccessibility(accessibilityNeeds)

  // Generate optimized concatenation that creates a single component
  // instead of using the runtime ConcatenatedComponent system
  return `(() => {
    ${runtimeImport}
    const leftEl = ${leftComponent}.build();
    const rightEl = ${rightComponent}.build();
    return createOptimizedConcatenation(leftEl, rightEl, '${accessibilityNeeds}');
  })()`
}

/**
 * Returns the appropriate runtime import based on accessibility needs
 */
function getRuntimeImportForAccessibility(
  level: 'minimal' | 'aria' | 'full'
): string {
  switch (level) {
    case 'minimal':
      return "import { createOptimizedConcatenation } from '@tachui/core/runtime/concatenation-minimal';"
    case 'aria':
      return "import { createOptimizedConcatenation } from '@tachui/core/runtime/concatenation-aria';"
    case 'full':
      return "import { createOptimizedConcatenation } from '@tachui/core/runtime/concatenation-full';"
  }
}

/**
 * Determines if a file should be transformed by the plugin
 */
function shouldTransform(
  id: string,
  include: string[],
  exclude: string[]
): boolean {
  // Check if file extension is included
  const hasIncludedExtension = include.some(ext => id.endsWith(ext))
  if (!hasIncludedExtension) {
    return false
  }

  // Check if file is excluded
  const isExcluded = exclude.some(pattern => {
    // Simple glob pattern matching
    if (pattern.includes('**')) {
      const regex = new RegExp(
        pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')
      )
      return regex.test(id)
    }
    return id.includes(pattern)
  })

  return !isExcluded
}

/**
 * Quick check to see if code contains TachUI syntax patterns
 */
function containsTachUISyntax(code: string): boolean {
  // Look for SwiftUI-style component patterns
  const tachUIPatterns = [
    /\b(VStack|HStack|ZStack|List|Form)\s*\{/,
    /\b(Text|Button|Image|TextField|Toggle)\s*\(/,
    /\.(padding|background|foregroundColor|font|frame)\s*\(/,
    /\.onTapGesture\s*\(/,
  ]

  return tachUIPatterns.some(pattern => pattern.test(code))
}

/**
 * Generates runtime code for virtual modules
 */
function generateRuntimeCode(): string {
  return `
// TachUI Runtime Module
// This provides runtime utilities for transformed components

import { createSignal, createEffect, createComputed } from '@tachui/core/reactive'

export { createSignal, createEffect, createComputed }

// Runtime helpers for component lifecycle
export function mountComponent(element, render) {
  const dispose = render()
  element._tachui_dispose = dispose
  return dispose
}

export function unmountComponent(element) {
  if (element._tachui_dispose) {
    element._tachui_dispose()
    delete element._tachui_dispose
  }
}

// Hot reload support
if (import.meta.hot) {
  import.meta.hot.accept()
  
  // Re-mount components on hot reload
  import.meta.hot.dispose(() => {
    document.querySelectorAll('[data-tachui-component]').forEach(unmountComponent)
  })
}
`
}
