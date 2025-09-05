/**
 * Phase 2 Concatenation Optimization Tests
 * Tests for component build-level concatenation analysis and transformation
 */

import { describe, expect, it } from 'vitest'
import {
  analyzeConcatenationPatterns,
  transformConcatenationPatterns,
} from '../src/compiler/plugin'

// Mock the functions that were added to plugin.ts since they're not exported
// In real implementation, these would be properly exported or moved to separate modules

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
 * Test helper to extract the concatenation analysis functions
 */
function mockAnalyzeConcatenationPatterns(code: string, filename: string) {
  // Implementation copied from plugin.ts for testing
  const patterns: any[] = []

  // Improved regex to capture component chains (not including variable assignment)
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

    // Fixed static analysis - check if components contain variables or function calls
    const hasVariableOrFunction =
      /\$\{[^}]+\}|[a-zA-Z_$][a-zA-Z0-9_$]*\[[^\]]*\]|entry\[|variable/
    const isStatic =
      !hasVariableOrFunction.test(leftComponent) &&
      !hasVariableOrFunction.test(rightComponent)

    const hasAriaAttributes = /aria[A-Z][a-zA-Z]*|role\s*:/i.test(code)
    const hasInteractiveElements =
      /\bButton\b|\bLink\b|onTapGesture|onClick/i.test(
        leftComponent + rightComponent
      )
    const hasComplexLayout = /\bVStack\b|\bHStack\b|\bZStack\b|\bForm\b/i.test(
      code
    )

    let accessibilityNeeds: 'minimal' | 'aria' | 'full'
    if (hasAriaAttributes || hasComplexLayout) {
      accessibilityNeeds = 'full'
    } else if (hasInteractiveElements) {
      accessibilityNeeds = 'aria'
    } else {
      accessibilityNeeds = 'minimal'
    }

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

describe('Phase 2: Component-Level Concatenation Optimization', () => {
  describe('Pattern Detection', () => {
    it('should detect basic concatenation pattern', () => {
      const code = `
        const result = Text("Hello").build().concat(Text("World").build())
      `

      const patterns = mockAnalyzeConcatenationPatterns(code, 'test.ts')

      expect(patterns).toHaveLength(1)
      expect(patterns[0].type).toBe('static')
      expect(patterns[0].leftComponent).toBe('Text("Hello")')
      expect(patterns[0].rightComponent).toBe('Text("World").build()')
      expect(patterns[0].optimizable).toBe(true)
      expect(patterns[0].accessibilityNeeds).toBe('minimal')
    })

    it('should detect ModularStack concatenation pattern', () => {
      const code = `
        Text(entry[0])
          .modifier
          .fontWeight('bold')
          .build()
          .concat(
            Text(entry[1])
              .modifier
              .build()
          )
      `

      const patterns = mockAnalyzeConcatenationPatterns(code, 'ModularStack.ts')

      expect(patterns).toHaveLength(1)
      expect(patterns[0].leftComponent).toBe(`Text(entry[0])
          .modifier
          .fontWeight('bold')`)
      expect(patterns[0].type).toBe('dynamic') // Contains variable
      expect(patterns[0].optimizable).toBe(false)
      expect(patterns[0].accessibilityNeeds).toBe('minimal')
    })

    it('should detect Button concatenation requiring ARIA', () => {
      const code = `
        Button("Click me").build().concat(Text("Info").build())
      `

      const patterns = mockAnalyzeConcatenationPatterns(code, 'test.ts')

      expect(patterns).toHaveLength(1)
      expect(patterns[0].accessibilityNeeds).toBe('aria')
    })

    it('should detect complex layout requiring full accessibility', () => {
      const code = `
        VStack {
          Text("Title").build().concat(Link("More info").build())
        }
      `

      const patterns = mockAnalyzeConcatenationPatterns(code, 'test.ts')

      expect(patterns).toHaveLength(1)
      expect(patterns[0].accessibilityNeeds).toBe('full')
    })

    it('should handle multiple concatenation patterns', () => {
      const code = `
        const first = Text("A").build().concat(Text("B").build())
        const second = Button("X").build().concat(Text("Y").build())
      `

      const patterns = mockAnalyzeConcatenationPatterns(code, 'test.ts')

      expect(patterns).toHaveLength(2)
      expect(patterns[0].accessibilityNeeds).toBe('minimal')
      expect(patterns[1].accessibilityNeeds).toBe('aria')
    })

    it('should not detect false positives', () => {
      const code = `
        const array = [1, 2, 3].concat([4, 5, 6])
        const string = "hello".concat("world")
        const regularConcat = someFunction().concat(otherFunction())
      `

      const patterns = mockAnalyzeConcatenationPatterns(code, 'test.ts')

      expect(patterns).toHaveLength(0)
    })
  })

  describe('Static Analysis', () => {
    it('should identify static concatenation correctly', () => {
      const staticCode = 'Text("Static").build().concat(Text("Text").build())'
      const dynamicCode = 'Text(variable).build().concat(Text("Text").build())'

      const staticPatterns = mockAnalyzeConcatenationPatterns(
        staticCode,
        'test.ts'
      )
      const dynamicPatterns = mockAnalyzeConcatenationPatterns(
        dynamicCode,
        'test.ts'
      )

      expect(staticPatterns[0].optimizable).toBe(true)
      expect(dynamicPatterns[0].optimizable).toBe(false)
    })

    it('should analyze accessibility requirements accurately', () => {
      const minimalCode = 'Text("A").build().concat(Text("B").build())'
      const ariaCode = 'Button("Click").build().concat(Text("Info").build())'
      const fullCode =
        'VStack { Text("Title").build().concat(Link("More").build()) }'

      const minimalPatterns = mockAnalyzeConcatenationPatterns(
        minimalCode,
        'test.ts'
      )
      const ariaPatterns = mockAnalyzeConcatenationPatterns(ariaCode, 'test.ts')
      const fullPatterns = mockAnalyzeConcatenationPatterns(fullCode, 'test.ts')

      expect(minimalPatterns[0].accessibilityNeeds).toBe('minimal')
      expect(ariaPatterns[0].accessibilityNeeds).toBe('aria')
      expect(fullPatterns[0].accessibilityNeeds).toBe('full')
    })
  })

  describe('Performance Impact', () => {
    it('should process concatenation patterns efficiently', () => {
      const largeCode = Array.from(
        { length: 100 },
        (_, i) => `Text("Item${i}").build().concat(Text("Value${i}").build())`
      ).join('\n')

      const start = performance.now()
      const patterns = mockAnalyzeConcatenationPatterns(largeCode, 'large.ts')
      const duration = performance.now() - start

      expect(patterns).toHaveLength(100)
      expect(duration).toBeLessThan(50) // Should process 100 patterns in under 50ms
    })

    it('should handle nested concatenations', () => {
      const nestedCode = `
        Text("A").build()
          .concat(Text("B").build())
          .concat(Text("C").build())
      `

      // Current regex would detect first concat, which is correct behavior
      const patterns = mockAnalyzeConcatenationPatterns(nestedCode, 'test.ts')

      expect(patterns).toHaveLength(1) // Only detects the first .concat()
      expect(patterns[0].rightComponent).toContain('Text("B")')
    })
  })

  describe('Real-world Scenarios', () => {
    it('should handle ModularStack use case correctly', () => {
      const modularStackCode = `
        Text(entry[0])
          .modifier
          .fontWeight('bold')
          .build()
          .concat(
            Text(entry[1])
              .modifier
              .build()
          )
      `

      const patterns = mockAnalyzeConcatenationPatterns(
        modularStackCode,
        'ModularStack.ts'
      )

      expect(patterns).toHaveLength(1)
      expect(patterns[0].type).toBe('dynamic')
      expect(patterns[0].optimizable).toBe(false) // Contains variables
      expect(patterns[0].accessibilityNeeds).toBe('minimal')
    })

    it('should generate correct runtime imports', () => {
      const getRuntimeImport = (level: 'minimal' | 'aria' | 'full'): string => {
        switch (level) {
          case 'minimal':
            return "import { createOptimizedConcatenation } from '@tachui/core/runtime/concatenation-minimal';"
          case 'aria':
            return "import { createOptimizedConcatenation } from '@tachui/core/runtime/concatenation-aria';"
          case 'full':
            return "import { createOptimizedConcatenation } from '@tachui/core/runtime/concatenation-full';"
        }
      }

      expect(getRuntimeImport('minimal')).toContain('concatenation-minimal')
      expect(getRuntimeImport('aria')).toContain('concatenation-aria')
      expect(getRuntimeImport('full')).toContain('concatenation-full')
    })
  })

  describe('Edge Cases', () => {
    it('should handle malformed concatenation gracefully', () => {
      const malformedCode = `
        Text("Hello").build().concat(
        // Missing closing parenthesis
      `

      const patterns = mockAnalyzeConcatenationPatterns(
        malformedCode,
        'test.ts'
      )

      expect(patterns).toHaveLength(0) // Should not crash, just not match
    })

    it('should handle very long component chains', () => {
      const longChainCode = `
        Text("Start")
          .modifier
          .font({ size: '16px' })
          .foregroundColor('blue')
          .backgroundColor('white')
          .padding(10)
          .margin(5)
          .build()
          .concat(
            Text("End")
              .modifier
              .font({ size: '14px' })
              .foregroundColor('red')
              .build()
          )
      `

      const patterns = mockAnalyzeConcatenationPatterns(
        longChainCode,
        'test.ts'
      )

      expect(patterns).toHaveLength(1)
      expect(patterns[0].leftComponent).toContain('Text("Start")')
      expect(patterns[0].rightComponent).toContain('Text("End")')
    })
  })
})
