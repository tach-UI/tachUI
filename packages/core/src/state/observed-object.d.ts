/**
 * @ObservedObject Property Wrapper Implementation
 *
 * Implements SwiftUI's @ObservedObject property wrapper for observing external objects
 * that conform to the ObservableObject protocol. Automatically triggers component
 * re-renders when the observed object changes.
 */
import type { Signal } from '../reactive/types';
import type { ObservableObject, ObservableObjectOptions, ObservedObject, ObservedObjectFactory } from './types';
/**
 * Base class for objects that can be observed
 * Provides the foundation for SwiftUI's ObservableObject protocol
 */
export declare class ObservableObjectBase implements ObservableObject {
    private _objectWillChange;
    private _notifyCount;
    constructor();
    get objectWillChange(): Signal<void>;
    /**
     * Notify observers that the object has changed
     * Call this method whenever properties of the object change
     */
    notifyChange(): void;
    /**
     * Get the current notification count (for debugging)
     */
    get notificationCount(): number;
}
/**
 * @ObservedObject property wrapper factory
 *
 * Creates an @ObservedObject property wrapper for observing external objects.
 * The observed object must implement the ObservableObject interface.
 *
 * @param object - The observable object to observe
 * @param options - Configuration options for the observed object wrapper
 * @returns An ObservedObject property wrapper
 *
 * @example
 * ```typescript
 * class UserData extends ObservableObjectBase {
 *   private _name = 'Unknown'
 *   private _age = 0
 *
 *   get name() { return this._name }
 *   set name(value: string) {
 *     this._name = value
 *     this.notifyChange()
 *   }
 *
 *   get age() { return this._age }
 *   set age(value: number) {
 *     this._age = value
 *     this.notifyChange()
 *   }
 * }
 *
 * class UserProfile {
 *   @ObservedObject(userData)
 *   private user: UserData
 *
 *   render() {
 *     return Text(`${this.user.name}, age ${this.user.age}`)
 *   }
 * }
 * ```
 */
declare const ObservedObjectFactory: ObservedObjectFactory;
/**
 * Create an observable object with automatic change notification
 *
 * @param target - The target object to make observable
 * @param options - Configuration options
 * @returns An observable version of the target object
 *
 * @example
 * ```typescript
 * const observableData = makeObservable({
 *   count: 0,
 *   name: 'Test'
 * })
 *
 * // Changes to properties will automatically trigger notifications
 * observableData.count = 10 // Triggers objectWillChange
 * ```
 */
export declare function makeObservable<T extends Record<string, any>>(target: T, options?: ObservableObjectOptions): T & ObservableObject;
/**
 * Create an observable class decorator
 *
 * @param options - Configuration options
 * @returns A class decorator that makes the class observable
 *
 * @example
 * ```typescript
 * @observable()
 * class TodoItem {
 *   text: string = ''
 *   completed: boolean = false
 *
 *   toggle() {
 *     this.completed = !this.completed
 *     // Change notification happens automatically
 *   }
 * }
 * ```
 */
export declare function observable(options?: ObservableObjectOptions): <T extends new (...args: any[]) => any>(constructor: T) => any;
/**
 * Type guard for ObservableObject
 */
export declare function isObservableObject(value: any): value is ObservableObject;
/**
 * Type guard for ObservedObject property wrapper
 */
export declare function isObservedObject<T extends ObservableObject>(value: any): value is ObservedObject<T>;
/**
 * Utility to create a simple observable store
 */
export declare function createObservableStore<T extends Record<string, any>>(initialState: T, options?: ObservableObjectOptions): T & ObservableObject;
/**
 * Export the ObservedObject factory function
 */
export declare const ObservedObjectWrapper: ObservedObjectFactory;
//# sourceMappingURL=observed-object.d.ts.map
