/**
 * TachUI Compiler Module
 *
 * Entry point for the compile-time transformation system that converts
 * SwiftUI-style syntax into reactive DOM updates.
 */
export { parseAdvancedSwiftUISyntax } from './advanced-parser';
export { generateDOMCode } from './codegen';
export type { EnhancedCodegenOptions, EnhancedCodegenResult } from './enhanced-codegen';
export { generateEnhancedDOMCode } from './enhanced-codegen';
export { parseSwiftUISyntax } from './parser';
export { createTachUIPlugin } from './plugin';
export type { ArrayExpressionNode, CallExpressionNode, ConditionalNode, ForEachNode, MemberExpressionNode, PropertyWrapperNode, StateBindingNode, TachUIPluginOptions, TransformOptions, } from './types';
//# sourceMappingURL=index.d.ts.map