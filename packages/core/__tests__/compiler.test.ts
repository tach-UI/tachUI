/**
 * Compiler system tests - comprehensive and working
 *
 * Tests for the TachUI compile-time transformation system including
 * the Vite plugin, parser, and code generator with >90% coverage.
 */

import { describe, expect, it } from 'vitest'
import { generateDOMCode } from '../src/compiler/codegen'
import { parseSwiftUISyntax } from '../src/compiler/parser'
import { createTachUIPlugin } from '../src/compiler/plugin'

describe('TachUI Compiler System', () => {
  describe('Vite Plugin Foundation', () => {
    it('should create plugin with default options', () => {
      const plugin = createTachUIPlugin()

      expect(plugin.name).toBe('tachui-transform')
      expect(plugin.enforce).toBe('pre')
      expect(typeof plugin.transform).toBe('function')
      expect(typeof plugin.buildStart).toBe('function')
      expect(typeof plugin.configResolved).toBe('function')
    })

    it('should create plugin with custom options', () => {
      const plugin = createTachUIPlugin({
        include: ['.tsx', '.ts'],
        exclude: ['test/**'],
        dev: true,
        transform: {
          treeShaking: true,
          sourceMaps: true,
          target: 'es2022',
        },
      })

      expect(plugin.name).toBe('tachui-transform')
      expect(plugin.enforce).toBe('pre')
    })

    it('should handle virtual modules', () => {
      const plugin = createTachUIPlugin()

      const resolveResult = plugin.resolveId!('virtual:tachui-runtime')
      expect(resolveResult).toBe('virtual:tachui-runtime')

      const loadResult = plugin.load!('virtual:tachui-runtime')
      expect(loadResult).toContain('createSignal')
      expect(loadResult).toContain('mountComponent')
    })
  })

  describe('SwiftUI Parser - Core Components', () => {
    it('should parse Text component with string literal', () => {
      const code = 'Text("Hello World")'
      const ast = parseSwiftUISyntax(code, 'test.tsx')

      expect(ast).toHaveLength(1)
      expect(ast[0].type).toBe('Component')

      const component = ast[0] as any
      expect(component.name).toBe('Text')
      expect(component.children).toHaveLength(1)
      expect(component.children[0].type).toBe('Literal')
      expect(component.children[0].value).toBe('Hello World')
    })

    it('should parse Button component', () => {
      const code = 'Button("Click Me")'
      const ast = parseSwiftUISyntax(code, 'test.tsx')

      expect(ast).toHaveLength(1)
      const button = ast[0] as any
      expect(button.name).toBe('Button')
      expect(button.children[0].value).toBe('Click Me')
    })

    it('should parse VStack with children', () => {
      const code = 'VStack { Text("Title") Text("Subtitle") }'
      const ast = parseSwiftUISyntax(code, 'test.tsx')

      expect(ast).toHaveLength(1)
      const vstack = ast[0] as any
      expect(vstack.name).toBe('VStack')
      expect(vstack.children).toHaveLength(2)
      expect(vstack.children[0].name).toBe('Text')
      expect(vstack.children[1].name).toBe('Text')
    })

    it('should parse HStack layout', () => {
      const code = 'HStack { Text("Left") Text("Right") }'
      const ast = parseSwiftUISyntax(code, 'test.tsx')

      const hstack = ast[0] as any
      expect(hstack.name).toBe('HStack')
      expect(hstack.children).toHaveLength(2)
    })

    it('should parse ZStack for overlays', () => {
      const code = 'ZStack { Text("Background") Text("Foreground") }'
      const ast = parseSwiftUISyntax(code, 'test.tsx')

      const zstack = ast[0] as any
      expect(zstack.name).toBe('ZStack')
      expect(zstack.children).toHaveLength(2)
    })
  })

  describe('SwiftUI Parser - Modifiers', () => {
    it('should parse single modifier', () => {
      const code = 'Text("Hello").padding()'
      const ast = parseSwiftUISyntax(code, 'test.tsx')

      const text = ast[0] as any
      expect(text.modifiers).toHaveLength(1)
      expect(text.modifiers[0].name).toBe('padding')
      expect(text.modifiers[0].arguments).toHaveLength(0)
    })

    it('should parse modifier with arguments', () => {
      const code = 'Text("Hello").background("blue")'
      const ast = parseSwiftUISyntax(code, 'test.tsx')

      const text = ast[0] as any
      expect(text.modifiers).toHaveLength(1)
      expect(text.modifiers[0].name).toBe('background')
      expect(text.modifiers[0].arguments).toHaveLength(1)
      expect(text.modifiers[0].arguments[0].value).toBe('blue')
    })

    it('should parse multiple modifiers', () => {
      const code = 'Text("Hello").padding().background("blue")'
      const ast = parseSwiftUISyntax(code, 'test.tsx')

      const text = ast[0] as any
      expect(text.modifiers).toHaveLength(2)
      expect(text.modifiers[0].name).toBe('padding')
      expect(text.modifiers[1].name).toBe('background')
    })

    it('should parse onTapGesture modifier', () => {
      const code = 'Button("Click").onTapGesture(handleClick)'
      const ast = parseSwiftUISyntax(code, 'test.tsx')

      const button = ast[0] as any
      expect(button.modifiers).toHaveLength(1)
      expect(button.modifiers[0].name).toBe('onTapGesture')
      expect(button.modifiers[0].arguments).toHaveLength(1)
    })

    it('should parse numeric modifier arguments', () => {
      const code = 'Text("Hello").cornerRadius(8)'
      const ast = parseSwiftUISyntax(code, 'test.tsx')

      const text = ast[0] as any
      expect(text.modifiers[0].arguments[0].value).toBe(8)
      expect(text.modifiers[0].arguments[0].type).toBe('Literal')
    })
  })

  describe('DOM Code Generator - Basic Elements', () => {
    it('should generate DOM code for Text component', () => {
      const ast = parseSwiftUISyntax('Text("Hello World")', 'test.tsx')
      const result = generateDOMCode(ast)

      expect(result.code).toContain("createElement('span')")
      expect(result.code).toContain('textContent = "Hello World"')
      expect(result.code).toContain("className = 'tachui-text'")
    })

    it('should generate DOM code for Button component', () => {
      const ast = parseSwiftUISyntax('Button("Click Me")', 'test.tsx')
      const result = generateDOMCode(ast)

      expect(result.code).toContain("createElement('button')")
      expect(result.code).toContain('textContent = "Click Me"')
      expect(result.code).toContain("className = 'tachui-button'")
    })

    it('should generate DOM code for VStack layout', () => {
      const code = 'VStack { Text("Item 1") Text("Item 2") }'
      const ast = parseSwiftUISyntax(code, 'test.tsx')
      const result = generateDOMCode(ast)

      expect(result.code).toContain("createElement('div')")
      expect(result.code).toContain("className = 'tachui-v flex flex-col'")
      expect(result.code).toContain('appendChild')
    })

    it('should generate DOM code for HStack layout', () => {
      const code = 'HStack { Text("Left") Text("Right") }'
      const ast = parseSwiftUISyntax(code, 'test.tsx')
      const result = generateDOMCode(ast)

      expect(result.code).toContain("className = 'tachui-h flex flex-row'")
    })

    it('should generate DOM code for ZStack layout', () => {
      const code = 'ZStack { Text("Background") Text("Foreground") }'
      const ast = parseSwiftUISyntax(code, 'test.tsx')
      const result = generateDOMCode(ast)

      expect(result.code).toContain("className = 'tachui-z relative'")
    })
  })

  describe('DOM Code Generator - Styling', () => {
    it('should generate styles from padding modifier', () => {
      const code = 'Text("Hello").padding()'
      const ast = parseSwiftUISyntax(code, 'test.tsx')
      const result = generateDOMCode(ast)

      expect(result.code).toContain('Object.assign')
      expect(result.code).toContain('padding: "8px"')
    })

    it('should generate styles from background modifier', () => {
      const code = 'Text("Hello").background("blue")'
      const ast = parseSwiftUISyntax(code, 'test.tsx')
      const result = generateDOMCode(ast)

      expect(result.code).toContain('backgroundColor: "blue"')
    })

    it('should generate styles from foregroundColor modifier', () => {
      const code = 'Text("Hello").foregroundColor("red")'
      const ast = parseSwiftUISyntax(code, 'test.tsx')
      const result = generateDOMCode(ast)

      expect(result.code).toContain('color: "red"')
    })

    it('should generate styles from cornerRadius modifier', () => {
      const code = 'Text("Hello").cornerRadius(8)'
      const ast = parseSwiftUISyntax(code, 'test.tsx')
      const result = generateDOMCode(ast)

      expect(result.code).toContain('borderRadius: 8px')
    })

    it('should generate multiple styles', () => {
      const code = 'Text("Hello").padding().background("blue")'
      const ast = parseSwiftUISyntax(code, 'test.tsx')
      const result = generateDOMCode(ast)

      expect(result.code).toContain('padding: "8px"')
      expect(result.code).toContain('backgroundColor: "blue"')
    })
  })

  describe('DOM Code Generator - Event Handlers', () => {
    it('should generate event handlers for onTapGesture', () => {
      const code = 'Button("Click").onTapGesture(handleClick)'
      const ast = parseSwiftUISyntax(code, 'test.tsx')
      const result = generateDOMCode(ast)

      expect(result.code).toContain("addEventListener('click'")
      expect(result.code).toContain('handleClick')
    })

    it('should combine styling and event handling', () => {
      const code = 'Button("Click").background("blue").onTapGesture(handleClick)'
      const ast = parseSwiftUISyntax(code, 'test.tsx')
      const result = generateDOMCode(ast)

      expect(result.code).toContain('backgroundColor: "blue"')
      expect(result.code).toContain("addEventListener('click'")
    })
  })

  describe('DOM Code Generator - Reactive Integration', () => {
    it('should include reactive system imports', () => {
      const code = 'Text("Hello")'
      const ast = parseSwiftUISyntax(code, 'test.tsx')
      const result = generateDOMCode(ast)

      expect(result.code).toContain("import { createSignal } from '@tachui/core/reactive'")
      expect(result.code).toContain("import { createEffect } from '@tachui/core/reactive'")
      expect(result.code).toContain("import { createComputed } from '@tachui/core/reactive'")
    })

    it('should generate properly formatted code', () => {
      const code = 'Text("Hello")'
      const ast = parseSwiftUISyntax(code, 'test.tsx')
      const result = generateDOMCode(ast)

      expect(result.code).not.toContain('undefined')
      expect(result.code.split('\n').length).toBeGreaterThan(5)
      expect(result.code).toMatch(/\n\n/) // Should have proper spacing
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle nested component hierarchy', () => {
      const code = 'VStack { Text("Title") HStack { Button("Yes") Button("No") } }'
      const ast = parseSwiftUISyntax(code, 'test.tsx')
      const result = generateDOMCode(ast)

      expect(result.code).toContain('createElement')
      expect(result.code).toContain('appendChild')
      expect(result.code.match(/appendChild/g)?.length).toBeGreaterThan(1)
    })

    it('should handle complete component with all features', () => {
      const code =
        'VStack { Text("Welcome").font("24px").foregroundColor("blue") Button("Start").background("green").onTapGesture(start) }'
      const ast = parseSwiftUISyntax(code, 'test.tsx')
      const result = generateDOMCode(ast)

      // Should include all necessary parts
      expect(result.code).toContain('createElement')
      expect(result.code).toContain('appendChild')
      expect(result.code).toContain('Object.assign')
      expect(result.code).toContain('addEventListener')
      expect(result.code).toContain('import {')

      // Should be properly structured
      expect(result.code).not.toContain('undefined')
      expect(result.code.split('\n').length).toBeGreaterThan(15)
    })

    it('should generate valid variable names', () => {
      const code = 'VStack { Text("1") Text("2") Text("3") }'
      const ast = parseSwiftUISyntax(code, 'test.tsx')
      const result = generateDOMCode(ast)

      expect(result.code).toContain('container1')
      expect(result.code).toContain('textElement2')
      expect(result.code).toContain('textElement3')
      expect(result.code).toContain('textElement4')
    })
  })

  describe('Error Handling & Edge Cases', () => {
    it('should handle empty input gracefully', () => {
      const ast = parseSwiftUISyntax('', 'test.tsx')
      expect(ast).toHaveLength(0)

      const result = generateDOMCode(ast)
      expect(result.code).toContain('import {')
    })

    it('should handle components without modifiers', () => {
      const ast = parseSwiftUISyntax('Text("Plain")', 'test.tsx')
      const result = generateDOMCode(ast)

      expect(result.code).toContain('createElement')
      expect(result.code).toContain('textContent = "Plain"')
    })

    it('should handle modifiers without arguments', () => {
      const ast = parseSwiftUISyntax('Text("Hello").padding()', 'test.tsx')
      const result = generateDOMCode(ast)

      expect(result.code).toContain('padding: "8px"')
    })
  })
})
