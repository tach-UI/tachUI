/**
 * TypeScript definitions for the TachUI compiler system
 */
export interface TachUIPluginOptions {
  /**
   * File extensions to transform (default: ['.tsx', '.ts'])
   */
  include?: string[]
  /**
   * File patterns to exclude from transformation
   */
  exclude?: string[]
  /**
   * Enable development mode optimizations
   */
  dev?: boolean
  /**
   * Custom transformer options
   */
  transform?: TransformOptions
}
export interface TransformOptions {
  /**
   * Enable tree-shaking optimizations
   */
  treeShaking?: boolean
  /**
   * Enable compile-time constant folding
   */
  constantFolding?: boolean
  /**
   * Generate source maps
   */
  sourceMaps?: boolean
  /**
   * Target output format
   */
  target?: 'es2020' | 'es2022' | 'esnext'
}
/**
 * AST Node types for SwiftUI syntax parsing
 */
export interface ASTNode {
  type: string
  loc?: SourceLocation
}
export interface SourceLocation {
  start: Position
  end: Position
  source?: string
}
export interface Position {
  line: number
  column: number
  offset: number
}
/**
 * SwiftUI Component AST Nodes
 */
export interface ComponentNode extends ASTNode {
  type: 'Component'
  name: string
  children: ASTNode[]
  modifiers: ModifierNode[]
}
export interface ModifierNode extends ASTNode {
  type: 'Modifier'
  name: string
  arguments: Expression[]
}
export interface Expression extends ASTNode {
  type:
    | 'Literal'
    | 'Identifier'
    | 'CallExpression'
    | 'ArrowFunction'
    | 'MemberExpression'
    | 'ArrayExpression'
}
/**
 * Advanced AST Node Types (Phase 2.1.2)
 */
export interface ConditionalNode extends ASTNode {
  type: 'Conditional'
  condition: Expression
  thenBody: ASTNode[]
  elseBody?: ASTNode[] | undefined
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
  initialValue?: Expression | undefined
}
export interface CallExpressionNode extends Expression {
  type: 'CallExpression'
  callee: Expression
  arguments: Expression[]
}
export interface MemberExpressionNode extends Expression {
  type: 'MemberExpression'
  object: string
  property: string
}
export interface ArrayExpressionNode extends Expression {
  type: 'ArrayExpression'
  elements: Expression[]
}
export interface LiteralExpression extends Expression {
  type: 'Literal'
  value: string | number | boolean
  raw: string
}
export interface IdentifierExpression extends Expression {
  type: 'Identifier'
  name: string
}
/**
 * Layout component types
 */
export type LayoutComponent = 'VStack' | 'HStack' | 'ZStack' | 'List' | 'Form'
/**
 * UI component types
 */
export type UIComponent = 'Text' | 'Button' | 'Image' | 'TextField' | 'Toggle'
/**
 * Modifier types
 */
export interface ModifierMapping {
  padding: (value?: number | string) => string
  background: (color: string) => string
  foregroundColor: (color: string) => string
  font: (size: string | number) => string
  border: (width: number, color: string) => string
  cornerRadius: (radius: number) => string
  shadow: (
    radius: number,
    offset?: {
      x: number
      y: number
    }
  ) => string
  opacity: (value: number) => string
  frame: (width?: number, height?: number) => string
  onTapGesture: (handler: () => void) => void
}
//# sourceMappingURL=types.d.ts.map
