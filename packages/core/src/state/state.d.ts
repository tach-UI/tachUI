/**
 * @State Property Wrapper Implementation
 *
 * Implements SwiftUI's @State property wrapper for local component state management.
 * Provides reactive state with automatic component re-rendering on changes.
 */
import type { Accessor, Setter } from '../reactive/types';
import type * as Types from './types';
import type { Binding, StateFactory } from './types';
/**
 * Create a binding from getter and setter functions
 */
declare function createBinding<T>(get: Accessor<T>, set: Setter<T>, options?: {
    name?: string;
}): Binding<T>;
/**
 * @State property wrapper factory
 *
 * Creates a @State property wrapper for local component state.
 *
 * @param initialValue - The initial value for the state
 * @param options - Configuration options for the state wrapper
 * @returns A State property wrapper
 *
 * @example
 * ```typescript
 * class MyComponent {
 *   @State(0)
 *   private count: number
 *
 *   @State('Hello')
 *   private message: string
 *
 *   render() {
 *     return Text(`${this.message}: ${this.count}`)
 *       .modifier
 *       .onTap(() => this.count++)
 *       .build()
 *   }
 * }
 * ```
 */
export declare const State: StateFactory;
/**
 * Create a binding from external getter/setter functions
 *
 * @param get - Function to get current value
 * @param set - Function to set new value
 * @param options - Configuration options
 * @returns A Binding property wrapper
 *
 * @example
 * ```typescript
 * const binding = createBinding(
 *   () => externalValue,
 *   (value) => { externalValue = value },
 *   { name: 'externalBinding' }
 * )
 * ```
 */
export declare const createStateBinding: typeof createBinding;
/**
 * Export binding factory for external use
 */
export { createBinding };
/**
 * Type guard for State property wrappers
 */
export declare function isState<T>(value: any): value is Types.State<T>;
/**
 * Type guard for Binding property wrappers
 */
export declare function isBinding<T>(value: any): value is Binding<T>;
/**
 * Utility to extract the raw value from State or Binding
 */
export declare function unwrapValue<T>(wrapper: Types.State<T> | Binding<T> | T): T;
//# sourceMappingURL=state.d.ts.map