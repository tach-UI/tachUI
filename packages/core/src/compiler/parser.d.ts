/**
 * SwiftUI Syntax Parser
 *
 * Parses SwiftUI-style syntax into an Abstract Syntax Tree (AST)
 * for transformation into reactive DOM code.
 */
import type { ASTNode } from './types';
/**
 * Parse SwiftUI syntax code into an AST with concatenation optimization
 */
export declare function parseSwiftUISyntax(code: string, filename: string): ASTNode[];
//# sourceMappingURL=parser.d.ts.map