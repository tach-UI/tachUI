/**
 * Frame Utility Functions
 *
 * Convenience functions for common frame operations using infinity
 * Provides SwiftUI-compatible patterns for responsive layouts
 */
import type { Modifier } from '../modifiers/types';
/**
 * Create a frame that fills maximum width
 * Equivalent to SwiftUI's .frame(maxWidth: .infinity)
 */
export declare function fillMaxWidth(): Modifier;
/**
 * Create a frame that fills maximum height
 * Equivalent to SwiftUI's .frame(maxHeight: .infinity)
 */
export declare function fillMaxHeight(): Modifier;
/**
 * Create a frame that fills both maximum width and height
 * Equivalent to SwiftUI's .frame(maxWidth: .infinity, maxHeight: .infinity)
 */
export declare function fillMaxSize(): Modifier;
/**
 * Create a frame that expands to fill available space
 * Sets both width and height to infinity with flex properties
 */
export declare function expand(): Modifier;
/**
 * Create a frame with specific width but infinite height
 * Useful for sidebars or navigation panels
 */
export declare function fixedWidthExpandHeight(width: number | string): Modifier;
/**
 * Create a frame with specific height but infinite width
 * Useful for headers, footers, or horizontal bars
 */
export declare function fixedHeightExpandWidth(height: number | string): Modifier;
/**
 * Create a frame with constrained maximum dimensions
 * Expands within the given constraints
 */
export declare function constrainedExpand(maxWidth?: number | string, maxHeight?: number | string): Modifier;
/**
 * Create a responsive frame that adapts to container
 * Useful for cards or content areas
 */
export declare function responsive(minWidth?: number | string, maxWidth?: number | string, minHeight?: number | string, maxHeight?: number | string): Modifier;
/**
 * Create a frame for flexible content
 * Grows to fill space but respects content size
 */
export declare function flexible(): Modifier;
/**
 * Create a frame for full viewport coverage
 * Useful for overlays, modals, or full-screen components
 */
export declare function fullScreen(): Modifier;
/**
 * Create a frame that takes remaining space in flex containers
 * Combines infinity with flex-grow for optimal space distribution
 */
export declare function remainingSpace(): Modifier;
/**
 * Create a frame for equal distribution in containers
 * Useful for button groups or tab layouts
 */
export declare function equalShare(): Modifier;
//# sourceMappingURL=frame-utils.d.ts.map