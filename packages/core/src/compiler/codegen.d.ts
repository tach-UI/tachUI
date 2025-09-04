/**
 * DOM Code Generator
 *
 * Generates reactive DOM code from SwiftUI AST nodes.
 * This transforms the parsed AST into efficient JavaScript code that uses
 * TachUI's reactive system for fine-grained DOM updates.
 */
import type { ASTNode, TransformOptions } from './types'
export interface CodegenResult {
  code: string
  map?: any
}
export interface CodegenOptions extends TransformOptions {
  sourceFile?: string
}
/**
 * Generate reactive DOM code from SwiftUI AST
 */
export declare function generateDOMCode(
  nodes: ASTNode[],
  options?: CodegenOptions
): CodegenResult
//# sourceMappingURL=codegen.d.ts.map
