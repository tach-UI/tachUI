/**
 * TachUI Layout Constants
 *
 * Provides SwiftUI-style constants for layout and sizing operations.
 * Enables familiar APIs like `.frame(maxWidth: infinity)` for responsive layouts.
 */
/**
 * Infinity constant representing unlimited space availability
 * Equivalent to SwiftUI's .infinity for frame dimensions
 */
export declare const infinity: unique symbol;
/**
 * Type definition for the infinity constant
 */
export type InfinityValue = typeof infinity;
/**
 * Dimension type that accepts numbers, strings, or infinity
 * Used throughout the modifier system for size-related properties
 */
export type Dimension = number | string | InfinityValue;
/**
 * Layout patterns namespace for common SwiftUI-style layouts
 */
export declare const Layout: {
    /**
     * Full-width button pattern - common in forms and action sheets
     */
    readonly fullWidthButton: {
        readonly maxWidth: typeof infinity;
    };
    /**
     * Sidebar layout pattern - fixed width with full height
     */
    readonly sidebar: (width?: number | string) => {
        width: string | number;
        maxHeight: symbol;
    };
    /**
     * Header/footer pattern - fixed height with full width
     */
    readonly header: (height?: number | string) => {
        height: string | number;
        maxWidth: symbol;
    };
    /**
     * Content area pattern - fills remaining space with constraints
     */
    readonly content: (maxWidth?: number | string) => {
        width: symbol;
        height: symbol;
        maxWidth: string | number | undefined;
    };
    /**
     * Card layout pattern - responsive with sensible constraints
     */
    readonly card: {
        readonly width: typeof infinity;
        readonly height: typeof infinity;
        readonly minWidth: 320;
        readonly maxWidth: 800;
        readonly minHeight: 200;
    };
    /**
     * Modal overlay pattern - full screen coverage
     */
    readonly overlay: {
        readonly width: "100vw";
        readonly height: "100vh";
    };
};
/**
 * Helper function to check if a value is the infinity constant
 */
export declare function isInfinity(value: any): value is InfinityValue;
/**
 * Convert a Dimension value to appropriate CSS value
 *
 * @param value - The dimension value to convert
 * @returns CSS-compatible string or undefined
 */
export declare function dimensionToCSS(value: Dimension | undefined): string | undefined;
/**
 * Convert infinity to flexbox properties for proper expansion
 * Used when width/height is set to infinity to ensure proper flex behavior
 */
export declare function infinityToFlexCSS(): Record<string, string>;
/**
 * Helper to determine if a frame constraint should expand to fill
 * Takes precedence of constraints into account
 */
export declare function shouldExpandForInfinity(options: {
    width?: Dimension;
    height?: Dimension;
    maxWidth?: Dimension;
    maxHeight?: Dimension;
    minWidth?: Dimension;
    minHeight?: Dimension;
}): {
    expandWidth: boolean;
    expandHeight: boolean;
    cssProps: Record<string, string>;
};
//# sourceMappingURL=layout.d.ts.map