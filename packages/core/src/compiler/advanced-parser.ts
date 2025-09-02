/**
 * Advanced SwiftUI Syntax Parser (Phase 2.1.2)
 *
 * Enhanced parser with support for:
 * - Conditional rendering (@if, @else)
 * - List iteration (@forEach)
 * - State bindings ($variable)
 * - Property wrappers (@State, @Computed)
 * - Complex expressions and function calls
 * - Nested modifier chains
 */

import type {
  ASTNode,
  ComponentNode,
  Expression,
  LiteralExpression,
  ModifierNode,
} from './types'

// Extended AST node types for advanced features
export interface ConditionalNode extends ASTNode {
  type: 'Conditional'
  condition: Expression
  thenBody: ASTNode[]
  elseBody?: ASTNode[]
}

export interface ForEachNode extends ASTNode {
  type: 'ForEach'
  iterable: Expression
  itemIdentifier: string
  body: ASTNode[]
}

export interface StateBindingNode extends ASTNode {
  type: 'StateBinding'
  identifier: string
  initialValue?: Expression
}

export interface PropertyWrapperNode extends ASTNode {
  type: 'PropertyWrapper'
  wrapper: 'State' | 'Computed' | 'Effect'
  identifier: string
  initialValue?: Expression
}

/**
 * Enhanced SwiftUI syntax parser with advanced features
 */
export class AdvancedSwiftUIParser {
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
   * Parse advanced SwiftUI syntax into enhanced AST
   */
  parse(): ASTNode[] {
    const nodes: ASTNode[] = []

    while (!this.isAtEnd()) {
      this.skipWhitespace()

      if (this.isAtEnd()) break

      const node = this.parseAdvancedNode()
      if (node) {
        nodes.push(node)
      }
    }

    return nodes
  }

  /**
   * Parse advanced AST nodes including conditionals and loops
   */
  private parseAdvancedNode(): ASTNode | null {
    const start = this.currentPosition()

    // Save position to detect infinite loops
    const initialPosition = this.position

    // Check for conditional rendering
    if (this.match('if')) {
      return this.parseConditional(start)
    }

    // Check for forEach loops
    if (this.match('ForEach')) {
      return this.parseForEach(start)
    }

    // Check for property wrappers
    if (this.peek() === '@') {
      return this.parsePropertyWrapper(start)
    }

    // Check for state bindings
    if (this.peek() === '$') {
      return this.parseStateBinding(start)
    }

    // Standard component parsing
    if (this.isComponentStart()) {
      return this.parseEnhancedComponent(start)
    }

    // Skip unrecognized tokens - ensure we always advance
    if (this.position === initialPosition) {
      this.advance()
    }
    return null
  }

  /**
   * Parse conditional rendering (if/else)
   */
  private parseConditional(start: {
    line: number
    column: number
    offset: number
  }): ConditionalNode {
    // 'if' already consumed by match()
    this.skipWhitespace()

    const condition = this.parseComplexExpression()
    if (!condition) {
      throw new Error(`Expected condition after 'if' at line ${this.line}`)
    }

    this.skipWhitespace()

    // Parse then body
    const thenBody: ASTNode[] = []
    if (this.peek() === '{') {
      this.advance() // consume '{'
      this.skipWhitespace()

      while (!this.isAtEnd() && this.peek() !== '}') {
        const node = this.parseAdvancedNode()
        if (node) {
          thenBody.push(node)
        }
        this.skipWhitespace()
      }

      if (this.peek() === '}') {
        this.advance() // consume '}'
      }
    }

    // Parse optional else body
    let elseBody: ASTNode[] | undefined
    this.skipWhitespace()
    if (this.match('else')) {
      elseBody = []
      this.skipWhitespace()

      if (this.peek() === '{') {
        this.advance() // consume '{'
        this.skipWhitespace()

        while (!this.isAtEnd() && this.peek() !== '}') {
          const node = this.parseAdvancedNode()
          if (node) {
            elseBody.push(node)
          }
          this.skipWhitespace()
        }

        if (this.peek() === '}') {
          this.advance() // consume '}'
        }
      }
    }

    const result: ConditionalNode = {
      type: 'Conditional',
      condition,
      thenBody,
      loc: {
        start,
        end: this.currentPosition(),
        source: this.filename,
      },
    }

    if (elseBody !== undefined) {
      result.elseBody = elseBody
    }

    return result
  }

  /**
   * Parse ForEach loops for list rendering
   */
  private parseForEach(start: {
    line: number
    column: number
    offset: number
  }): ForEachNode {
    // 'ForEach' already consumed by match()
    this.skipWhitespace()

    if (this.peek() !== '(') {
      throw new Error(`Expected '(' after ForEach at line ${this.line}`)
    }
    this.advance() // consume '('
    this.skipWhitespace()

    // Parse iterable expression
    const iterable = this.parseComplexExpression()
    if (!iterable) {
      throw new Error(
        `Expected iterable expression in ForEach at line ${this.line}`
      )
    }

    this.skipWhitespace()
    if (this.peek() === ',') {
      this.advance() // consume ','
      this.skipWhitespace()
    }

    // Parse item identifier (id: \.self or id: \.id)
    if (this.match('id:')) {
      this.skipWhitespace()
      // Skip id specification for now
      this.parseComplexExpression()
    }

    this.skipWhitespace()
    if (this.peek() === ')') {
      this.advance() // consume ')'
    }

    this.skipWhitespace()

    // Parse closure parameter
    let itemIdentifier = 'item'
    if (this.peek() === '{') {
      this.advance() // consume '{'
      this.skipWhitespace()

      // Look for closure parameter (item in { item in ... })
      const savedPos = this.position
      const identifier = this.parseIdentifier()
      if (identifier && this.match('in')) {
        itemIdentifier = identifier
      } else {
        // Restore position if not a closure parameter
        this.position = savedPos
      }
    }

    // Parse body
    const body: ASTNode[] = []
    while (!this.isAtEnd() && this.peek() !== '}') {
      const node = this.parseAdvancedNode()
      if (node) {
        body.push(node)
      }
      this.skipWhitespace()
    }

    if (this.peek() === '}') {
      this.advance() // consume '}'
    }

    return {
      type: 'ForEach',
      iterable,
      itemIdentifier,
      body,
      loc: {
        start,
        end: this.currentPosition(),
        source: this.filename,
      },
    }
  }

  /**
   * Parse property wrappers (@State, @Computed, etc.)
   */
  private parsePropertyWrapper(start: {
    line: number
    column: number
    offset: number
  }): PropertyWrapperNode {
    this.advance() // consume '@'

    const wrapperName = this.parseIdentifier()
    if (
      !wrapperName ||
      !['State', 'Computed', 'Effect'].includes(wrapperName)
    ) {
      throw new Error(
        `Unknown property wrapper @${wrapperName} at line ${this.line}`
      )
    }

    this.skipWhitespace()

    // Parse variable declaration
    const identifier = this.parseIdentifier()
    if (!identifier) {
      throw new Error(
        `Expected identifier after @${wrapperName} at line ${this.line}`
      )
    }

    // Parse optional initial value
    let initialValue: Expression | undefined
    this.skipWhitespace()
    if (this.peek() === '=') {
      this.advance() // consume '='
      this.skipWhitespace()
      const expr = this.parseComplexExpression()
      if (expr) {
        initialValue = expr
      }
    }

    const result: PropertyWrapperNode = {
      type: 'PropertyWrapper',
      wrapper: wrapperName as 'State' | 'Computed' | 'Effect',
      identifier,
      loc: {
        start,
        end: this.currentPosition(),
        source: this.filename,
      },
    }

    if (initialValue !== undefined) {
      result.initialValue = initialValue
    }

    return result
  }

  /**
   * Parse state bindings ($variable)
   */
  private parseStateBinding(start: {
    line: number
    column: number
    offset: number
  }): StateBindingNode {
    this.advance() // consume '$'

    const identifier = this.parseIdentifier()
    if (!identifier) {
      throw new Error(`Expected identifier after '$' at line ${this.line}`)
    }

    return {
      type: 'StateBinding',
      identifier,
      loc: {
        start,
        end: this.currentPosition(),
        source: this.filename,
      },
    }
  }

  /**
   * Parse enhanced components with complex modifier chains
   */
  private parseEnhancedComponent(start: {
    line: number
    column: number
    offset: number
  }): ComponentNode {
    const name = this.parseIdentifier()!
    this.skipWhitespace()

    const children: ASTNode[] = []
    const modifiers: ModifierNode[] = []

    // Parse component content (arguments or body)
    if (this.peek() === '(') {
      // Component with arguments
      this.advance() // consume '('
      this.skipWhitespace()

      while (!this.isAtEnd() && this.peek() !== ')') {
        const arg = this.parseComplexExpression()
        if (arg) {
          children.push(arg)
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
    } else if (this.peek() === '{') {
      // Component with body
      this.advance() // consume '{'
      this.skipWhitespace()

      while (!this.isAtEnd() && this.peek() !== '}') {
        const child = this.parseAdvancedNode()
        if (child) {
          children.push(child)
        }
        this.skipWhitespace()
      }

      if (this.peek() === '}') {
        this.advance() // consume '}'
      }
    }

    // Parse complex modifier chains
    this.skipWhitespace()
    while (this.peek() === '.') {
      const modifier = this.parseAdvancedModifier()
      if (modifier) {
        modifiers.push(modifier)
      }
      this.skipWhitespace()
    }

    return {
      type: 'Component',
      name,
      children,
      modifiers,
      loc: {
        start,
        end: this.currentPosition(),
        source: this.filename,
      },
    }
  }

  /**
   * Parse advanced modifiers with complex expressions
   */
  private parseAdvancedModifier(): ModifierNode | null {
    if (this.peek() !== '.') return null

    const start = this.currentPosition()
    this.advance() // consume '.'

    const name = this.parseIdentifier()
    if (!name) return null

    const args: Expression[] = []

    // Parse modifier arguments with complex expressions
    if (this.peek() === '(') {
      this.advance() // consume '('
      this.skipWhitespace()

      while (!this.isAtEnd() && this.peek() !== ')') {
        const arg = this.parseComplexExpression()
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

    return {
      type: 'Modifier',
      name,
      arguments: args,
      loc: {
        start,
        end: this.currentPosition(),
        source: this.filename,
      },
    }
  }

  /**
   * Parse complex expressions including function calls, property access, etc.
   */
  private parseComplexExpression(): Expression | null {
    this.skipWhitespace()
    const start = this.currentPosition()

    // String literals
    if (this.peek() === '"' || this.peek() === "'") {
      return this.parseStringLiteral(start)
    }

    // Number literals
    if (this.isDigit(this.peek())) {
      return this.parseNumberLiteral(start)
    }

    // Boolean and null literals
    if (this.match('true') || this.match('false') || this.match('null')) {
      const value = this.code.slice(start.offset, this.position)
      return {
        type: 'Literal',
        value: value === 'true' ? true : value === 'false' ? false : null,
        raw: value,
        loc: {
          start,
          end: this.currentPosition(),
          source: this.filename,
        },
      } as LiteralExpression
    }

    // Function calls and identifiers
    const identifier = this.parseIdentifier()
    if (identifier) {
      this.skipWhitespace()

      // Check for function call
      if (this.peek() === '(') {
        return this.parseFunctionCall(identifier, start)
      }

      // Check for property access
      if (this.peek() === '.') {
        return this.parsePropertyAccess(identifier, start)
      }

      // Simple identifier
      return {
        type: 'Identifier',
        name: identifier,
        loc: {
          start,
          end: this.currentPosition(),
          source: this.filename,
        },
      } as Expression
    }

    // Array literals
    if (this.peek() === '[') {
      return this.parseArrayLiteral(start)
    }

    return null
  }

  /**
   * Parse function calls with arguments
   */
  private parseFunctionCall(
    name: string,
    start: { line: number; column: number; offset: number }
  ): Expression {
    this.advance() // consume '('
    this.skipWhitespace()

    const args: Expression[] = []

    while (!this.isAtEnd() && this.peek() !== ')') {
      const arg = this.parseComplexExpression()
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

    return {
      type: 'CallExpression',
      callee: { type: 'Identifier', name },
      arguments: args,
      loc: {
        start,
        end: this.currentPosition(),
        source: this.filename,
      },
    } as Expression
  }

  /**
   * Parse property access (obj.prop)
   */
  private parsePropertyAccess(
    object: string,
    start: { line: number; column: number; offset: number }
  ): Expression {
    let current = object

    while (this.peek() === '.') {
      this.advance() // consume '.'
      const property = this.parseIdentifier()
      if (property) {
        current = `${current}.${property}`
      }
    }

    return {
      type: 'MemberExpression',
      object: object,
      property: current.split('.').slice(1).join('.'),
      loc: {
        start,
        end: this.currentPosition(),
        source: this.filename,
      },
    } as Expression
  }

  /**
   * Parse array literals [1, 2, 3]
   */
  private parseArrayLiteral(start: {
    line: number
    column: number
    offset: number
  }): Expression {
    this.advance() // consume '['
    this.skipWhitespace()

    const elements: Expression[] = []

    while (!this.isAtEnd() && this.peek() !== ']') {
      const element = this.parseComplexExpression()
      if (element) {
        elements.push(element)
      }

      this.skipWhitespace()
      if (this.peek() === ',') {
        this.advance() // consume ','
        this.skipWhitespace()
      }
    }

    if (this.peek() === ']') {
      this.advance() // consume ']'
    }

    return {
      type: 'ArrayExpression',
      elements,
      loc: {
        start,
        end: this.currentPosition(),
        source: this.filename,
      },
    } as Expression
  }

  // Helper methods (reuse from basic parser with enhancements)
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

    return {
      type: 'Literal',
      value,
      raw: this.code.slice(start.offset, this.position),
      loc: {
        start,
        end: this.currentPosition(),
        source: this.filename,
      },
    }
  }

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

  // Utility methods
  private isComponentStart(): boolean {
    const savedPos = this.position
    const savedLine = this.line
    const savedColumn = this.column

    const identifier = this.parseIdentifier()

    // Always restore position
    this.position = savedPos
    this.line = savedLine
    this.column = savedColumn

    const components = [
      'VStack',
      'HStack',
      'ZStack',
      'List',
      'Form',
      'NavigationStack',
      'Text',
      'Button',
      'Image',
      'TextField',
      'Toggle',
      'Slider',
      // ScrollView moved to @tachui/mobile
      'LazyVStack',
      'LazyHStack',
    ]

    return identifier ? components.includes(identifier) : false
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

  private peek(): string {
    return this.isAtEnd() ? '\0' : this.code[this.position]
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

/**
 * Enhanced parsing function using the advanced parser
 */
export function parseAdvancedSwiftUISyntax(
  code: string,
  filename: string
): ASTNode[] {
  const parser = new AdvancedSwiftUIParser(code, filename)
  return parser.parse()
}
