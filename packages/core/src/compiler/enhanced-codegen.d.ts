/**
 * Enhanced DOM Code Generator (Phase 2.2.1)
 *
 * Advanced code generation with:
 * - Conditional rendering to reactive effects
 * - List rendering with keyed updates
 * - State binding integration
 * - Property wrapper code generation
 * - Optimized reactive DOM updates
 */
import type { ASTNode, TransformOptions } from './types';
export interface EnhancedCodegenResult {
    code: string;
    map?: any;
    dependencies: string[];
    exports: string[];
}
export interface EnhancedCodegenOptions extends TransformOptions {
    sourceFile?: string;
    optimizeUpdates?: boolean;
    generateKeyedLists?: boolean;
}
/**
 * Enhanced DOM code generator with advanced reactive features
 */
export declare class EnhancedDOMCodeGenerator {
    private options;
    private imports;
    private variables;
    private code;
    private indentLevel;
    private dependencies;
    private exports;
    constructor(options: EnhancedCodegenOptions);
    /**
     * Generate enhanced reactive DOM code from AST
     */
    generate(nodes: ASTNode[]): EnhancedCodegenResult;
    /**
     * Generate code for enhanced AST nodes
     */
    private generateEnhancedNode;
    /**
     * Generate conditional rendering with reactive effects
     */
    private generateConditionalRendering;
    /**
     * Generate list rendering with keyed updates
     */
    private generateListRendering;
    /**
     * Generate content for list items
     */
    private generateListItemContent;
    /**
     * Generate property wrapper code
     */
    private generatePropertyWrapper;
    /**
     * Generate state binding code
     */
    private generateStateBinding;
    /**
     * Generate enhanced component with reactive features
     */
    private generateEnhancedComponent;
    /**
     * Generate enhanced stack component with reactive children
     */
    private generateEnhancedStackComponent;
    /**
     * Generate enhanced text component with reactive content
     */
    private generateEnhancedTextComponent;
    /**
     * Generate enhanced button component
     */
    private generateEnhancedButtonComponent;
    /**
     * Generate enhanced TextField component with two-way binding
     */
    private generateEnhancedTextFieldComponent;
    /**
     * Generate enhanced generic component
     */
    private generateEnhancedGenericComponent;
    /**
     * Generate enhanced modifiers with reactive updates
     */
    private generateEnhancedModifiers;
    /**
     * Generate component mount function
     */
    private generateMountFunction;
    /**
     * Helper methods
     */
    private expressionToCode;
    private getTextContent;
    private isReactiveExpression;
    private modifierHasReactiveContent;
    private convertModifierToStyle;
    private convertModifierToHandler;
    private generateStackClasses;
    private capitalize;
    private createVariable;
    private getLastVariable;
    private addImport;
    private addLine;
    private addEmptyLine;
    private indent;
    private dedent;
    private buildFinalCode;
    private generateSourceMap;
    private reset;
}
/**
 * Generate enhanced DOM code with advanced reactive features
 */
export declare function generateEnhancedDOMCode(nodes: ASTNode[], options?: EnhancedCodegenOptions): EnhancedCodegenResult;
//# sourceMappingURL=enhanced-codegen.d.ts.map