/**
 * Modifier Registry and Application System
 *
 * Manages registration, storage, and application of modifiers to components.
 * Provides a centralized system for custom modifier registration and application.
 */
import type { ComponentInstance, ComponentProps, DOMNode } from "../runtime/types";
import type { ModifiableComponent, Modifier, ModifierApplicationOptions, ModifierContext, ModifierFactory } from "./types";
import type { ModifierRegistry as CoreModifierRegistry } from "./types";
/**
 * Adapter to bridge between registry package and core package types
 */
declare class RegistryAdapter implements CoreModifierRegistry {
    register<TProps>(name: string, factory: ModifierFactory<TProps>): void;
    get<TProps>(name: string): ModifierFactory<TProps> | undefined;
    has(name: string): boolean;
    list(): string[];
    clear(): void;
    validateRegistry(): {
        totalModifiers: number;
        duplicateNames: string[];
        orphanedReferences: any[];
        instanceId: string;
        createdAt: number;
        instanceCount: number;
    };
}
/**
 * Global modifier registry instance using singleton pattern
 */
declare const registryAdapter: RegistryAdapter;
export { registryAdapter as globalModifierRegistry };
/**
 * Create a new modifier registry (returns singleton for consistency)
 */
export declare function createModifierRegistry(): CoreModifierRegistry;
/**
 * Apply modifiers to a DOM node
 */
export declare function applyModifiersToNode(node: DOMNode, modifiers: Modifier[], context?: Partial<ModifierContext>, options?: ModifierApplicationOptions): DOMNode;
/**
 * Create a modifiable component from a regular component
 */
export declare function createModifiableComponent<P extends ComponentProps>(component: ComponentInstance<P>, initialModifiers?: Modifier[]): ModifiableComponent<P>;
/**
 * Update modifiers on an existing modifiable component
 */
export declare function updateComponentModifiers<P extends ComponentProps>(component: ModifiableComponent<P>, newModifiers: Modifier[], _options?: ModifierApplicationOptions): void;
/**
 * Modifier application utilities
 */
export declare const modifierApplicationUtils: {
    /**
     * Check if a component has specific modifier types
     */
    hasModifierOfType(component: ModifiableComponent, type: string): boolean;
    /**
     * Get modifiers of a specific type from a component
     */
    getModifiersOfType(component: ModifiableComponent, type: string): Modifier[];
    /**
     * Remove modifiers of a specific type from a component
     */
    removeModifiersOfType(component: ModifiableComponent, type: string): void;
    /**
     * Replace modifiers of a specific type
     */
    replaceModifiersOfType(component: ModifiableComponent, type: string, newModifiers: Modifier[]): void;
    /**
     * Get the total number of modifiers on a component
     */
    getModifierCount(component: ModifiableComponent): number;
    /**
     * Check if two modifier arrays are equivalent
     */
    areModifiersEqual(modifiers1: Modifier[], modifiers2: Modifier[]): boolean;
};
//# sourceMappingURL=registry.d.ts.map