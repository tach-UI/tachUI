/**
 * Reactive Signal Integration for TachUI Gradients
 *
 * Enables dynamic gradients that update based on reactive signals,
 * allowing for animated and data-driven gradient effects.
 */
interface Signal<T> {
    readonly value: T;
    subscribe(callback: () => void): () => void;
}
import type { Asset } from '../assets/types';
import { Asset as AssetClass } from '../assets/Asset';
import type { GradientDefinition, LinearGradientOptions, RadialGradientOptions, AngularGradientOptions, StateGradientOptions, StatefulBackgroundValue } from './types';
import { StateGradientAsset } from './state-gradient-asset';
/**
 * Reactive gradient options supporting signal-based values
 */
export interface ReactiveLinearGradientOptions {
    colors: (string | Asset | Signal<string>)[];
    stops?: (number | Signal<number>)[];
    startPoint: LinearGradientOptions['startPoint'] | Signal<LinearGradientOptions['startPoint']>;
    endPoint: LinearGradientOptions['endPoint'] | Signal<LinearGradientOptions['endPoint']>;
    angle?: number | Signal<number>;
}
export interface ReactiveRadialGradientOptions {
    colors: (string | Asset | Signal<string>)[];
    stops?: (number | Signal<number>)[];
    center: RadialGradientOptions['center'] | Signal<RadialGradientOptions['center']>;
    startRadius: number | Signal<number>;
    endRadius: number | Signal<number>;
    shape?: RadialGradientOptions['shape'] | Signal<RadialGradientOptions['shape']>;
}
export interface ReactiveAngularGradientOptions {
    colors: (string | Asset | Signal<string>)[];
    stops?: (number | Signal<number>)[];
    center: AngularGradientOptions['center'] | Signal<AngularGradientOptions['center']>;
    startAngle: number | Signal<number>;
    endAngle: number | Signal<number>;
}
/**
 * Reactive gradient definition
 */
export interface ReactiveGradientDefinition {
    type: GradientDefinition['type'];
    options: ReactiveLinearGradientOptions | ReactiveRadialGradientOptions | ReactiveAngularGradientOptions;
    __reactive: true;
}
/**
 * Reactive gradient asset that updates when signals change
 */
export declare class ReactiveGradientAsset extends AssetClass<string> {
    private reactiveDefinition;
    private currentGradient;
    private subscriptions;
    private updateCallback?;
    constructor(name: string, reactiveDefinition: ReactiveGradientDefinition, updateCallback?: () => void);
    /**
     * Resolve current gradient to CSS
     */
    resolve(): string;
    /**
     * Get current static gradient (resolved from signals)
     */
    getCurrentGradient(): GradientDefinition;
    /**
     * Update the reactive definition and re-subscribe to signals
     */
    updateDefinition(newDefinition: ReactiveGradientDefinition): void;
    /**
     * Clean up signal subscriptions
     */
    cleanup(): void;
    private resolveStaticGradient;
    private resolveLinearOptions;
    private resolveRadialOptions;
    private resolveAngularOptions;
    private resolveValue;
    private isSignal;
    private setupSignalSubscriptions;
    private subscribeToSignalsInOptions;
    private handleSignalChange;
    private notifyUpdate;
    private gradientToCSS;
}
/**
 * Reactive state gradient asset with signal support
 */
export declare class ReactiveStateGradientAsset extends StateGradientAsset {
    private reactiveStateGradients;
    private updateCallback?;
    private reactiveSubscriptions;
    constructor(name: string, reactiveStateGradients: {
        default: StatefulBackgroundValue | Signal<StatefulBackgroundValue>;
        hover?: StatefulBackgroundValue | Signal<StatefulBackgroundValue>;
        active?: StatefulBackgroundValue | Signal<StatefulBackgroundValue>;
        focus?: StatefulBackgroundValue | Signal<StatefulBackgroundValue>;
        disabled?: StatefulBackgroundValue | Signal<StatefulBackgroundValue>;
        animation?: StateGradientOptions['animation'];
    }, updateCallback?: (() => void) | undefined);
    /**
     * Update reactive state configuration
     */
    updateReactiveState(newState: ReactiveStateGradientAsset['reactiveStateGradients']): void;
    /**
     * Clean up signal subscriptions
     */
    cleanupStateSubscriptions(): void;
    private static resolveStateOptions;
    private static resolveValue;
    private static isSignal;
    private setupStateSignalSubscriptions;
    private handleStateSignalChange;
    private notifyStateUpdate;
}
/**
 * Factory functions for creating reactive gradients
 */
export declare const ReactiveGradients: {
    /**
     * Create a reactive linear gradient
     */
    readonly linear: (options: ReactiveLinearGradientOptions, updateCallback?: () => void) => ReactiveGradientAsset;
    /**
     * Create a reactive radial gradient
     */
    readonly radial: (options: ReactiveRadialGradientOptions, updateCallback?: () => void) => ReactiveGradientAsset;
    /**
     * Create a reactive angular gradient
     */
    readonly angular: (options: ReactiveAngularGradientOptions, updateCallback?: () => void) => ReactiveGradientAsset;
    /**
     * Create a reactive state gradient
     */
    readonly state: (name: string, options: ReactiveStateGradientAsset["reactiveStateGradients"], updateCallback?: () => void) => ReactiveStateGradientAsset;
};
/**
 * Utility functions for working with reactive gradients
 */
export declare const ReactiveGradientUtils: {
    /**
     * Create an animated gradient that cycles through colors
     */
    readonly createAnimatedGradient: (colors: string[], _duration?: number) => ReactiveGradientAsset;
    /**
     * Create a progress gradient that fills based on a signal
     */
    readonly createProgressGradient: (progressSignal: Signal<number>, color?: string) => ReactiveGradientAsset;
    /**
     * Create a data-driven gradient that reflects numeric values
     */
    readonly createDataGradient: (_valueSignal: Signal<number>, _minValue: number, _maxValue: number, colorScale?: string[]) => ReactiveGradientAsset;
};
/**
 * Enhanced background modifier support for reactive gradients
 */
export declare const ReactiveBackgroundUtils: {
    /**
     * Check if a background value is reactive
     */
    readonly isReactiveBackground: (value: unknown) => value is ReactiveGradientAsset | ReactiveStateGradientAsset;
    /**
     * Create a reactive background from a signal
     */
    readonly fromSignal: (backgroundSignal: Signal<StatefulBackgroundValue>) => ReactiveStateGradientAsset;
};
//# sourceMappingURL=reactive.d.ts.map
