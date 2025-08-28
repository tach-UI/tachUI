/**
 * Enhanced DOM Code Generator Tests
 */

import { describe, expect, it } from 'vitest'
import { parseAdvancedSwiftUISyntax } from '../src/compiler/advanced-parser'
import { generateEnhancedDOMCode } from '../src/compiler/enhanced-codegen'

describe('Enhanced Codegen - Basic Tests', () => {
  it('should generate enhanced Text component', () => {
    const code = 'Text("Hello")'
    const ast = parseAdvancedSwiftUISyntax(code, 'test.tsx')
    const result = generateEnhancedDOMCode(ast)

    expect(result.code).toContain('Enhanced Text component')
    expect(result.code).toContain('textElement1')
    expect(result.exports).toContain('mountComponent')
  })

  it('should handle property wrappers', () => {
    const code = '@State count = 0'
    const ast = parseAdvancedSwiftUISyntax(code, 'test.tsx')
    const result = generateEnhancedDOMCode(ast)

    expect(result.code).toContain('@State property wrapper')
    expect(result.dependencies).toContain('count')
  })

  it('should handle empty input', () => {
    const ast = parseAdvancedSwiftUISyntax('', 'test.tsx')
    const result = generateEnhancedDOMCode(ast)

    expect(result.code).toContain('import {')
    expect(result.exports).toContain('mountComponent')
  })
})
