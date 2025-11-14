/**
 * @EnvironmentObject Property Wrapper Implementation
 *
 * Implements SwiftUI's @EnvironmentObject property wrapper for dependency injection.
 * Provides reactive environment objects with automatic component re-rendering on changes.
 */
import { createEnvironmentKey, type EnvironmentKey } from '../runtime/component-context';
import type { ComponentContext } from '../runtime/types';
/**
 * Environment object wrapper interface
 */
export interface EnvironmentObject<T> {
    readonly wrappedValue: T;
    readonly projectedValue: EnvironmentObject<T>;
    readonly key: EnvironmentKey<T>;
    readonly componentContext: ComponentContext;
}
/**
 * Observable environment object that can notify subscribers of changes
 */
export declare class ObservableEnvironmentObject<T extends object> {
    private _signal;
    private _setter;
    _subscribers: Set<() => void>;
    constructor(initialValue: T);
    get value(): T;
    set value(newValue: T);
    /**
     * Update a property of the environment object
     */
    updateProperty<K extends keyof T>(key: K, value: T[K]): void;
    /**
     * Subscribe to changes
     */
    subscribe(callback: () => void): () => void;
    private notifySubscribers;
    /**
     * Create a reactive effect that runs when this object changes
     */
    onChange(effect: (value: T) => void): () => void;
}
/**
 * @EnvironmentObject property wrapper factory
 *
 * Creates an @EnvironmentObject property wrapper for dependency injection.
 *
 * @param key - The environment key to look up
 * @returns An EnvironmentObject property wrapper
 *
 * @example
 * ```typescript
 * // Define environment key
 * const UserServiceKey = createEnvironmentKey<UserService>('UserService')
 *
 * class MyComponent {
 *   @EnvironmentObject(UserServiceKey)
 *   private userService: UserService
 *
 *   render() {
 *     const user = this.userService.getCurrentUser()
 *     return Text(`Hello, ${user.name}!`)
 *   }
 * }
 * ```
 */
export declare function EnvironmentObject<T>(key: EnvironmentKey<T>): EnvironmentObject<T>;
/**
 * Provide an environment object to child components
 *
 * @param key - The environment key
 * @param value - The value to provide
 *
 * @example
 * ```typescript
 * const userService = new UserService()
 * provideEnvironmentObject(UserServiceKey, userService)
 * ```
 */
export declare function provideEnvironmentObject<T>(key: EnvironmentKey<T>, value: T): void;
/**
 * Create an observable environment object
 *
 * @param key - The environment key
 * @param initialValue - The initial value
 * @returns An observable environment object
 *
 * @example
 * ```typescript
 * const ThemeKey = createEnvironmentKey<Theme>('Theme')
 * const theme = createObservableEnvironmentObject(ThemeKey, { mode: 'light' })
 * provideEnvironmentObject(ThemeKey, theme)
 * ```
 */
export declare function createObservableEnvironmentObject<T extends object>(_key: EnvironmentKey<ObservableEnvironmentObject<T>>, initialValue: T): ObservableEnvironmentObject<T>;
/**
 * Create and provide an environment object in one step
 *
 * @param key - The environment key
 * @param value - The value to provide
 * @returns The provided value for chaining
 */
export declare function createEnvironmentObject<T>(key: EnvironmentKey<T>, value: T): T;
/**
 * Type guard for EnvironmentObject property wrappers
 */
export declare function isEnvironmentObject<T>(value: any): value is EnvironmentObject<T>;
/**
 * Environment object utilities
 */
export declare const EnvironmentObjectUtils: {
    /**
     * Check if an environment object is available
     */
    isAvailable<T>(key: EnvironmentKey<T>): boolean;
    /**
     * Get environment object value without creating a dependency
     */
    peek<T>(key: EnvironmentKey<T>): T | undefined;
    /**
     * Create a derived environment object
     */
    derived<T, U>(sourceKey: EnvironmentKey<T>, targetKey: EnvironmentKey<U>, transform: (value: T) => U): void;
    /**
     * Create a scoped environment context
     */
    scoped(setup: () => void, cleanup?: () => void): () => void;
};
/**
 * Common environment keys for built-in services
 */
export declare const CommonEnvironmentKeys: {
    /**
     * Application theme
     */
    Theme: EnvironmentKey<{
        mode: "light" | "dark";
        primaryColor: string;
        secondaryColor: string;
    }>;
    /**
     * Localization service
     */
    Localization: EnvironmentKey<{
        locale: string;
        t: (key: string, params?: Record<string, any>) => string;
    }>;
    /**
     * Navigation service
     */
    Navigation: EnvironmentKey<{
        navigate: (path: string) => void;
        goBack: () => void;
        getCurrentRoute: () => string;
    }>;
    /**
     * Application configuration
     */
    Config: EnvironmentKey<{
        apiUrl: string;
        version: string;
        environment: "development" | "staging" | "production";
    }>;
    /**
     * User authentication
     */
    Auth: EnvironmentKey<{
        isAuthenticated: boolean;
        user?: {
            id: string;
            name: string;
            email: string;
        };
        login: (credentials: any) => Promise<void>;
        logout: () => Promise<void>;
    }>;
};
export { createEnvironmentKey };
//# sourceMappingURL=environment.d.ts.map