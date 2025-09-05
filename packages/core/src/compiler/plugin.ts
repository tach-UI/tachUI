/**
 * TachUI Vite Plugin
 *
 * Custom Vite plugin that transforms SwiftUI-style syntax into reactive DOM code.
 * This is the core of Phase 2.1.1 - the plugin foundation for compile-time transformation.
 */

import type { Plugin, TransformResult } from 'vite'
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
          if (dev) {
            console.log(
              `🔗 Found ${concatenationPatterns.length} concatenation pattern(s) in: ${id}`
            )
            concatenationPatterns.forEach((pattern, index) => {
              console.log(
                `  Pattern ${index + 1}: ${pattern.type} (optimizable: ${pattern.optimizable}, accessibility: ${pattern.accessibilityNeeds})`
              )
            })
          }

          // Transform concatenation patterns
          transformedCode = transformConcatenationPatterns(
            transformedCode,
            concatenationPatterns
          )
          hasTransformations = true
        }

        // Phase 1: Check if the file contains SwiftUI syntax for traditional compilation
        if (containsTachUISyntax(transformedCode)) {
          if (dev) {
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
 * Analyzes JavaScript/TypeScript code for concatenation patterns
 */
function analyzeConcatenationPatterns(
  code: string,
  filename: string
): ConcatenationPattern[] {
  const patterns: ConcatenationPattern[] = []

  // Regex pattern to detect .build().concat( patterns
  // Matches: someComponent.build().concat(otherComponent.build())
  const concatRegex =
    /(?:^|\s|=\s*)([a-zA-Z_$][^.]*(?:\.[^.]*)*?)\.build\(\)\s*\.concat\(/gs

  let match: RegExpExecArray | null
  while ((match = concatRegex.exec(code)) !== null) {
    const [partialMatch, leftComponent] = match
    const start = match.index

    // Find the balanced right component after .concat(
    const afterConcat = match.index + partialMatch.length
    const rightComponent = extractBalancedContent(code, afterConcat)

    if (!rightComponent) continue // Skip if we can't parse the right component

    const fullMatch = partialMatch + rightComponent + ')'
    const end = start + fullMatch.length

    // Determine if this is a static concatenation pattern
    const isStatic = isStaticConcatenation(leftComponent, rightComponent)

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

  return patterns
}

/**
 * Helper function to extract balanced content within parentheses
 */
function extractBalancedContent(
  text: string,
  startIndex: number
): string | null {
  let depth = 0
  let i = startIndex
  let content = ''

  while (i < text.length) {
    const char = text[i]

    if (char === '(') {
      depth++
    } else if (char === ')') {
      if (depth === 0) {
        // Found the matching closing parenthesis
        return content
      }
      depth--
    }

    content += char
    i++
  }

  return null // Unbalanced parentheses
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
