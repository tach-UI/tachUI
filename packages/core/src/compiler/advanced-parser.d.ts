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
import type { ASTNode, Expression } from './types'
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
export declare class AdvancedSwiftUIParser {
  private code
  private filename
  private position
  private line
  private column
  constructor(code: string, filename: string)
  /**
   * Parse advanced SwiftUI syntax into enhanced AST
   */
  parse(): ASTNode[]
  /**
   * Parse advanced AST nodes including conditionals and loops
   */
  private parseAdvancedNode
  /**
   * Parse conditional rendering (if/else)
   */
  private parseConditional
  /**
   * Parse ForEach loops for list rendering
   */
  private parseForEach
  /**
   * Parse property wrappers (@State, @Computed, etc.)
   */
  private parsePropertyWrapper
  /**
   * Parse state bindings ($variable)
   */
  private parseStateBinding
  /**
   * Parse enhanced components with complex modifier chains
   */
  private parseEnhancedComponent
  /**
   * Parse advanced modifiers with complex expressions
   */
  private parseAdvancedModifier
  /**
   * Parse complex expressions including function calls, property access, etc.
   */
  private parseComplexExpression
  /**
   * Parse function calls with arguments
   */
  private parseFunctionCall
  /**
   * Parse property access (obj.prop)
   */
  private parsePropertyAccess
  /**
   * Parse array literals [1, 2, 3]
   */
  private parseArrayLiteral
  private parseStringLiteral
  private parseNumberLiteral
  private parseIdentifier
  private isComponentStart
  private match
  private skipWhitespace
  private peek
  private advance
  private isAtEnd
  private isWhitespace
  private isAlpha
  private isDigit
  private isAlphaNumeric
  private currentPosition
}
/**
 * Enhanced parsing function using the advanced parser
 */
export declare function parseAdvancedSwiftUISyntax(
  code: string,
  filename: string
): ASTNode[]
//# sourceMappingURL=advanced-parser.d.ts.map
