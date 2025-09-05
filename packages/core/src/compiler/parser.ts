/**
 * SwiftUI Syntax Parser
 *
 * Parses SwiftUI-style syntax into an Abstract Syntax Tree (AST)
 * for transformation into reactive DOM code.
 */

import type {
  ASTNode,
  ComponentNode,
  Expression,
  LiteralExpression,
  ModifierNode,
} from './types'

/**
 * Parse SwiftUI syntax code into an AST with concatenation optimization
 */
export function parseSwiftUISyntax(code: string, filename: string): ASTNode[] {
  const parser = new SwiftUIParser(code, filename)
  const rawAST = parser.parse() // Existing parser (unchanged)

  // For now, return raw AST - concatenation optimization will be implemented
  // at the component build level rather than syntax parsing level
  return rawAST
}

/**
 * SwiftUI syntax parser implementation
 */
class SwiftUIParser {
  private code: string
  private filename: string
  private position: number = 0
  private line: number = 1
  private column: number = 1

  constructor(code: string, filename: string) {
    this.code = code
    this.filename = filename
  }

  /**
   * Main parsing entry point
   */
  parse(): ASTNode[] {
    const nodes: ASTNode[] = []

    // Skip whitespace and find TachUI components
    while (!this.isAtEnd()) {
      this.skipWhitespace()

      if (this.isAtEnd()) break

      const node = this.parseNode()
      if (node) {
        nodes.push(node)
      }
    }

    return nodes
  }

  /**
   * Parse a single AST node
   */
  private parseNode(): ASTNode | null {
    const start = this.currentPosition()

    // Try to parse a component
    if (this.isComponentStart()) {
      const component = this.parseComponent(start)
      // TEMPORARILY DISABLED: Check for concatenation after parsing component
      // return this.parseConcatenation(component)
      return component
    }

    // Skip non-TachUI code
    this.advance()
    return null
  }

  /**
   * Parse a SwiftUI component (VStack, Text, Button, etc.)
   */
  private parseComponent(start: {
    line: number
    column: number
    offset: number
  }): ComponentNode {
    const name = this.parseIdentifier()

    if (!name) {
      throw new Error(`Expected component name at line ${this.line}`)
    }

    this.skipWhitespace()

    const children: ASTNode[] = []
    const modifiers: ModifierNode[] = []

    // Parse component body if it has one (VStack { ... })
    if (this.peek() === '{') {
      this.advance() // consume '{'
      this.skipWhitespace()

      while (!this.isAtEnd() && this.peek() !== '}') {
        this.skipWhitespace()
        const child = this.parseNode()
        if (child) {
          children.push(child)
        }
      }

      if (this.peek() === '}') {
        this.advance() // consume '}'
      }
    }

    // Parse component arguments if it has them (Text("Hello"))
    else if (this.peek() === '(') {
      this.advance() // consume '('
      this.skipWhitespace()

      const arg = this.parseExpression()
      if (arg) {
        children.push(arg)
      }

      this.skipWhitespace()
      if (this.peek() === ')') {
        this.advance() // consume ')'
      }
    }

    // Parse modifiers (.padding(), .background(), etc.)
    this.skipWhitespace()
    while (this.peek() === '.') {
      const modifier = this.parseModifier()
      if (modifier) {
        modifiers.push(modifier)
      }
      this.skipWhitespace()
    }

    const end = this.currentPosition()

    return {
      type: 'Component',
      name,
      children,
      modifiers,
      loc: {
        start,
        end,
        source: this.filename,
      },
    }
  }

  // Concatenation optimization methods moved to post-processing functions

  /**
   * Parse a modifier (.padding(), .background(), etc.)
   */
  private parseModifier(): ModifierNode | null {
    if (this.peek() !== '.') return null

    const start = this.currentPosition()
    this.advance() // consume '.'

    const name = this.parseIdentifier()
    if (!name) return null

    const args: Expression[] = []

    // Parse modifier arguments
    if (this.peek() === '(') {
      this.advance() // consume '('
      this.skipWhitespace()

      while (!this.isAtEnd() && this.peek() !== ')') {
        const arg = this.parseExpression()
        if (arg) {
          args.push(arg)
        }

        this.skipWhitespace()
        if (this.peek() === ',') {
          this.advance() // consume ','
          this.skipWhitespace()
        }
      }

      if (this.peek() === ')') {
        this.advance() // consume ')'
      }
    }

    const end = this.currentPosition()

    return {
      type: 'Modifier',
      name,
      arguments: args,
      loc: {
        start,
        end,
        source: this.filename,
      },
    }
  }

  /**
   * Parse an expression (literal, identifier, function call)
   */
  private parseExpression(): Expression | null {
    this.skipWhitespace()

    const start = this.currentPosition()

    // String literal
    if (this.peek() === '"' || this.peek() === "'") {
      return this.parseStringLiteral(start)
    }

    // Number literal
    if (this.isDigit(this.peek())) {
      return this.parseNumberLiteral(start)
    }

    // Boolean literals
    if (this.match('true') || this.match('false')) {
      const value = this.code.slice(start.offset, this.position)
      return {
        type: 'Literal',
        value: value === 'true',
        raw: value,
        loc: {
          start,
          end: this.currentPosition(),
          source: this.filename,
        },
      } as LiteralExpression
    }

    // Identifier or function call
    const identifier = this.parseIdentifier()
    if (identifier) {
      const end = this.currentPosition()
      return {
        type: 'Identifier',
        name: identifier,
        loc: {
          start,
          end,
          source: this.filename,
        },
      } as Expression
    }

    return null
  }

  /**
   * Parse a string literal
   */
  private parseStringLiteral(start: {
    line: number
    column: number
    offset: number
  }): LiteralExpression {
    const quote = this.peek()
    this.advance() // consume opening quote

    let value = ''

    while (!this.isAtEnd() && this.peek() !== quote) {
      if (this.peek() === '\\') {
        this.advance() // consume backslash
        // Handle escape sequences
        const escaped = this.peek()
        switch (escaped) {
          case 'n':
            value += '\n'
            break
          case 't':
            value += '\t'
            break
          case 'r':
            value += '\r'
            break
          case '\\':
            value += '\\'
            break
          case '"':
            value += '"'
            break
          case "'":
            value += "'"
            break
          default:
            value += escaped
            break
        }
        this.advance()
      } else {
        value += this.peek()
        this.advance()
      }
    }

    if (this.peek() === quote) {
      this.advance() // consume closing quote
    }

    const raw = this.code.slice(start.offset, this.position)

    return {
      type: 'Literal',
      value,
      raw,
      loc: {
        start,
        end: this.currentPosition(),
        source: this.filename,
      },
    }
  }

  /**
   * Parse a number literal
   */
  private parseNumberLiteral(start: {
    line: number
    column: number
    offset: number
  }): LiteralExpression {
    let numStr = ''

    while (
      !this.isAtEnd() &&
      (this.isDigit(this.peek()) || this.peek() === '.')
    ) {
      numStr += this.peek()
      this.advance()
    }

    const value = numStr.includes('.')
      ? parseFloat(numStr)
      : parseInt(numStr, 10)

    return {
      type: 'Literal',
      value,
      raw: numStr,
      loc: {
        start,
        end: this.currentPosition(),
        source: this.filename,
      },
    }
  }

  /**
   * Parse an identifier (component name, variable name, etc.)
   */
  private parseIdentifier(): string | null {
    if (!this.isAlpha(this.peek()) && this.peek() !== '_') {
      return null
    }

    let identifier = ''

    while (
      !this.isAtEnd() &&
      (this.isAlphaNumeric(this.peek()) || this.peek() === '_')
    ) {
      identifier += this.peek()
      this.advance()
    }

    return identifier
  }

  /**
   * Helper methods
   */
  private isComponentStart(): boolean {
    const savedPos = this.position
    const savedLine = this.line
    const savedColumn = this.column

    const identifier = this.parseIdentifier()
    const isComponent = identifier && this.isValidComponentName(identifier)

    // Restore position
    this.position = savedPos
    this.line = savedLine
    this.column = savedColumn

    return !!isComponent
  }

  private isValidComponentName(name: string): boolean {
    const components = [
      'VStack',
      'HStack',
      'ZStack',
      'List',
      'Form',
      'Text',
      'Button',
      'Image',
      'TextField',
      'Toggle',
    ]
    return components.includes(name)
  }

  private skipWhitespace(): void {
    while (!this.isAtEnd() && this.isWhitespace(this.peek())) {
      if (this.peek() === '\n') {
        this.line++
        this.column = 1
      } else {
        this.column++
      }
      this.position++
    }
  }

  private match(expected: string): boolean {
    if (
      this.code.slice(this.position, this.position + expected.length) ===
      expected
    ) {
      this.position += expected.length
      this.column += expected.length
      return true
    }
    return false
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0'
    return this.code[this.position]
  }

  private advance(): string {
    const char = this.peek()
    if (!this.isAtEnd()) {
      this.position++
      if (char === '\n') {
        this.line++
        this.column = 1
      } else {
        this.column++
      }
    }
    return char
  }

  private isAtEnd(): boolean {
    return this.position >= this.code.length
  }

  private isWhitespace(char: string): boolean {
    return /\s/.test(char)
  }

  private isAlpha(char: string): boolean {
    return /[a-zA-Z]/.test(char)
  }

  private isDigit(char: string): boolean {
    return /[0-9]/.test(char)
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char)
  }

  private currentPosition() {
    return {
      line: this.line,
      column: this.column,
      offset: this.position,
    }
  }
}

// ======================================================================
// Concatenation Optimization - AST Post-Processing
// ======================================================================

// NOTE: Concatenation pattern detection and AST transformations are now handled
// by TypeScript AST analysis in plugin.ts for better accuracy and maintainability.
// All concatenation-related functions have been moved to plugin.ts.
