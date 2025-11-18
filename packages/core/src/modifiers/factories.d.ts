/**
 * Modifier Factory Functions
 *
 * Factory functions for creating custom modifiers, combining modifiers,
 * and building advanced modifier behaviors. These are the building blocks
 * for creating your own modifier implementations.
 */
import type { Signal } from '../reactive/types';
import type { DOMNode, ComponentInstance } from '../runtime/types';
import type { Modifier, ModifierContext, ModifierFactory } from './types';
/**
 * Helper functions for working with modifiers
 */
export declare const modifierHelpers: {
    /**
     * Check if a value is a reactive signal
     */
    isReactive<T>(value: T | Signal<T>): value is Signal<T>;
    /**
     * Resolve a potentially reactive value
     */
    resolveValue<T>(value: T | Signal<T>): T;
    /**
     * Create a reactive effect for a value
     */
    createReactiveEffect<T>(value: T | Signal<T>, onChange: (newValue: T) => void): (() => void) | null;
    /**
     * Merge modifier properties
     */
    mergeProperties<T extends Record<string, any>>(base: T, override: Partial<T>): T;
    /**
     * Convert a CSS property name to camelCase
     */
    toCamelCase(cssProperty: string): string;
    /**
     * Convert a camelCase property to CSS kebab-case
     */
    toKebabCase(camelProperty: string): string;
    /**
     * Normalize a CSS value
     */
    normalizeCSSValue(value: any): string;
};
/**
 * Create a custom modifier
 */
export declare function createCustomModifier<TProps extends Record<string, any>>(type: string, priority: number, applyFn: (node: DOMNode, context: ModifierContext, props: TProps) => DOMNode | undefined): ModifierFactory<TProps>;
/**
 * Create a simple style modifier (convenience wrapper)
 */
export declare function createStyleModifier<TProps extends Record<string, any>>(type: string, styles: (props: TProps) => Record<string, any>, priority?: number): ModifierFactory<TProps>;
/**
 * Create a preset modifier (no props, just applies fixed styles)
 */
export declare function createPresetModifier(type: string, styles: Record<string, any>, priority?: number): () => Modifier;
/**
 * Create a component variant (wrapped component with preset modifiers)
 */
export declare function createComponentVariant<T extends ComponentInstance>(baseComponent: T, ..._modifiers: Modifier[]): T;
/**
 * Combine multiple modifiers into a single modifier
 */
export declare function combineModifiers(modifiers: Modifier[], type?: string, priority?: number): Modifier;
/**
 * Create a conditional modifier that only applies if a condition is met
 */
export declare function conditionalModifier(condition: boolean | Signal<boolean>, modifier: Modifier): Modifier;
/**
 * Create a modifier that applies different styles based on state
 */
export declare function stateModifier<T extends string>(stateSignal: Signal<T>, stateModifiers: Record<T, Modifier[]>): Modifier;
/**
 * Create a responsive modifier that applies different modifiers based on screen size
 */
export declare function responsiveModifier(breakpoints: Record<string, Modifier[]>, defaultModifiers?: Modifier[]): Modifier;
/**
 * Create a modifier that applies CSS classes
 */
export declare function classModifier(classes: string | string[] | Signal<string | string[]>): Modifier;
/**
 * Create a modifier that applies inline styles
 */
export declare function styleModifier(styles: Record<string, string | number> | Signal<Record<string, string | number>>): Modifier;
/**
 * Utility to create a modifier that adds event listeners
 */
export declare function eventModifier(events: Record<string, EventListener>): Modifier;
//# sourceMappingURL=factories.d.ts.map