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
  ConcatenationNode,
  PrecomputedContent,
  ConcatenatedSegment,
  AccessibilityStructure,
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

interface ConcatenationPattern {
  leftComponent: ComponentNode
  rightComponent: ComponentNode | ConcatenationNode
  originalNode: ASTNode
  optimizable: boolean
}

/**
 * Detect concatenation patterns in AST via pure AST walking
 */
function detectConcatenationPatterns(ast: ASTNode[]): ConcatenationPattern[] {
  const patterns: ConcatenationPattern[] = []

  function walkAST(node: ASTNode, visited = new Set<ASTNode>()) {
    // Prevent infinite recursion
    if (visited.has(node)) return
    visited.add(node)

    if (node.type === 'Component') {
      const component = node as ComponentNode

      // Check for .concat() modifier
      const concatModifier = component.modifiers.find(
        mod => mod.name === 'concat'
      )
      if (concatModifier && concatModifier.arguments.length > 0) {
        const rightArg = concatModifier.arguments[0]

        // Parse right-side component from argument
        if (
          rightArg.type === 'Identifier' ||
          rightArg.type === 'CallExpression'
        ) {
          const rightComponent = parseComponentFromExpression(rightArg)

          if (rightComponent) {
            patterns.push({
              leftComponent: stripConcatModifier(component),
              rightComponent: rightComponent,
              originalNode: node,
              optimizable: isStaticConcatenation(component, rightComponent),
            })
          }
        }
      }
    }

    // Recursively walk child nodes (with cycle detection)
    if ('children' in node && Array.isArray(node.children)) {
      node.children.forEach(child => walkAST(child, visited))
    }

    // Walk modifiers for nested components (with cycle detection)
    if ('modifiers' in node && Array.isArray(node.modifiers)) {
      node.modifiers.forEach(mod => {
        if (mod.arguments) {
          mod.arguments.forEach(arg => walkAST(arg, visited))
        }
      })
    }
  }

  ast.forEach(walkAST)
  return patterns
}

/**
 * Transform AST by replacing concatenation patterns with ConcatenationNodes
 */
function transformASTWithConcatenations(
  ast: ASTNode[],
  patterns: ConcatenationPattern[]
): ASTNode[] {
  const transformedAST: ASTNode[] = []
  const processedNodes = new Set<ASTNode>()

  for (const pattern of patterns) {
    if (!processedNodes.has(pattern.originalNode)) {
      const concatenationNode: ConcatenationNode = {
        type: 'Concatenation',
        left: pattern.leftComponent,
        right: pattern.rightComponent,
        optimizable: pattern.optimizable,
        staticContent: pattern.optimizable
          ? computeStaticContent(pattern.leftComponent, pattern.rightComponent)
          : undefined,
        loc: pattern.originalNode.loc,
      }

      transformedAST.push(concatenationNode)
      processedNodes.add(pattern.originalNode)
    }
  }

  // Add non-concatenation nodes from original AST
  ast.forEach(node => {
    if (!processedNodes.has(node)) {
      transformedAST.push(node)
    }
  })

  return transformedAST
}

/**
 * Remove .concat() modifier from component, returning clean component
 */
function stripConcatModifier(component: ComponentNode): ComponentNode {
  return {
    ...component,
    modifiers: component.modifiers.filter(mod => mod.name !== 'concat'),
  }
}

/**
 * Parse a component from an expression argument (simplified)
 */
function parseComponentFromExpression(expr: Expression): ComponentNode | null {
  // For now, return a placeholder - this would need more sophisticated parsing
  // In practice, this would parse expressions like Text("Hello") from arguments
  if (expr.type === 'Identifier') {
    const identifier = expr as any
    return {
      type: 'Component',
      name: identifier.name || 'Text',
      children: [],
      modifiers: [],
      loc: expr.loc,
    }
  }

  return null
}

/**
 * Determine if concatenation can be optimized (both components are static)
 */
function isStaticConcatenation(
  left: ComponentNode,
  right: ComponentNode | ConcatenationNode
): boolean {
  return (
    isComponentStatic(left) &&
    (right.type === 'Component' ? isComponentStatic(right) : right.optimizable)
  )
}

/**
 * Check if a component is static (only literal arguments and static modifiers)
 */
function isComponentStatic(component: ComponentNode): boolean {
  // Only Text/Link components with string literals are static
  if (component.name === 'Text' || component.name === 'Link') {
    // Check all arguments are literals
    const hasOnlyLiterals = component.children.every(
      child => child.type === 'Literal'
    )

    // Check all modifiers have literal arguments
    const hasOnlyStaticModifiers = component.modifiers.every(mod =>
      mod.arguments.every(arg => arg.type === 'Literal')
    )

    return hasOnlyLiterals && hasOnlyStaticModifiers
  }

  return false // All other components considered dynamic
}

/**
 * Compute static content for optimizable concatenations
 */
function computeStaticContent(
  left: ComponentNode,
  right: ComponentNode | ConcatenationNode
): PrecomputedContent {
  const segments: ConcatenatedSegment[] = []

  // Extract segments from left component
  segments.push(extractComponentSegment(left))

  // Extract segments from right component (may be nested concatenation)
  if (right.type === 'Concatenation') {
    segments.push(...(right.staticContent?.segments || []))
  } else {
    segments.push(extractComponentSegment(right))
  }

  return {
    segments,
    aria: computeAccessibilityStructure(segments),
    totalSegments: segments.length,
  }
}

/**
 * Extract a segment from a component
 */
function extractComponentSegment(
  component: ComponentNode
): ConcatenatedSegment {
  const firstChild = component.children[0]
  const content =
    firstChild && firstChild.type === 'Literal'
      ? ((firstChild as LiteralExpression).value as string)
      : ''

  return {
    componentType: component.name,
    content,
    styles: extractStyles(component.modifiers),
    accessibility: extractAccessibility(component),
  }
}

/**
 * Extract styles from component modifiers
 */
function extractStyles(modifiers: ModifierNode[]): Record<string, any> {
  const styles: Record<string, any> = {}

  modifiers.forEach(modifier => {
    switch (modifier.name) {
      case 'color':
      case 'foregroundColor':
        if (modifier.arguments[0] && modifier.arguments[0].type === 'Literal') {
          styles.color = (modifier.arguments[0] as LiteralExpression).value
        }
        break
      case 'background':
      case 'backgroundColor':
        if (modifier.arguments[0] && modifier.arguments[0].type === 'Literal') {
          styles.backgroundColor = (
            modifier.arguments[0] as LiteralExpression
          ).value
        }
        break
      case 'fontWeight':
        if (modifier.arguments[0] && modifier.arguments[0].type === 'Literal') {
          styles.fontWeight = (modifier.arguments[0] as LiteralExpression).value
        }
        break
    }
  })

  return styles
}

/**
 * Extract accessibility information from component
 */
function extractAccessibility(component: ComponentNode): Record<string, any> {
  return {
    label: component.name === 'Text' ? 'text' : component.name.toLowerCase(),
  }
}

/**
 * Compute accessibility structure for concatenated segments
 */
function computeAccessibilityStructure(
  segments: ConcatenatedSegment[]
): AccessibilityStructure {
  const hasInteractive = segments.some(
    segment =>
      segment.componentType === 'Button' || segment.componentType === 'Link'
  )

  const label = segments
    .map(segment => segment.content || segment.componentType)
    .filter(Boolean)
    .join(' ')

  return {
    label,
    role: hasInteractive ? 'group' : 'text',
  }
}
