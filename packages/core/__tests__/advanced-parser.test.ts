/**
 * Advanced SwiftUI Parser Tests
 */

import { describe, expect, it } from 'vitest'
import { parseAdvancedSwiftUISyntax } from '../src/compiler/advanced-parser'

describe('Advanced Parser - Basic Tests', () => {
  it('should parse simple Text component', () => {
    const code = 'Text("Hello")'
    const ast = parseAdvancedSwiftUISyntax(code, 'test.tsx')

    expect(ast).toHaveLength(1)
    expect(ast[0].type).toBe('Component')

    const component = ast[0] as any
    expect(component.name).toBe('Text')
    expect(component.children).toHaveLength(1)
    expect(component.children[0].value).toBe('Hello')
  })

  it('should handle empty input', () => {
    const ast = parseAdvancedSwiftUISyntax('', 'test.tsx')
    expect(ast).toHaveLength(0)
  })
})
