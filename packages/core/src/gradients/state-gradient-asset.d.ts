import { Asset } from '../assets/Asset';
import type { StateGradientOptions, GradientAnimationOptions } from './types';
/**
 * State-aware gradient asset that manages different gradients for interaction states
 *
 * Provides hover, active, focus, and disabled state support with smooth transitions.
 */
export declare class StateGradientAsset extends Asset<string> {
    private stateGradients;
    private currentState;
    private animationOptions;
    private resolvedGradientCache;
    private isTransitioning;
    constructor(name: string, stateGradients: StateGradientOptions);
    /**
     * Set the current interaction state
     */
    setState(state: keyof StateGradientOptions): void;
    /**
     * Get the current state
     */
    getState(): keyof StateGradientOptions;
    /**
     * Resolve the current gradient to CSS
     */
    resolve(): string;
    /**
     * Get gradient for a specific state without changing current state
     */
    getStateGradient(state: keyof StateGradientOptions): string;
    /**
     * Get animation CSS properties for transitions
     */
    getAnimationCSS(): string;
    /**
     * Get all available states
     */
    getAvailableStates(): (keyof StateGradientOptions)[];
    /**
     * Check if a state is available
     */
    hasState(state: keyof StateGradientOptions): boolean;
    /**
     * Update animation options
     */
    setAnimation(options: Partial<GradientAnimationOptions>): void;
    private resolveGradientValue;
    private isAsset;
    private isGradientDefinition;
    /**
     * Pre-resolve all gradients to improve runtime performance
     */
    private preResolveGradients;
    /**
     * Clear the gradient cache (useful when gradients change dynamically)
     */
    clearCache(): void;
    /**
     * Force update animation options and clear cache if needed
     */
    updateStateGradients(newGradients: StateGradientOptions): void;
}
/**
 * Create a state-based gradient asset
 */
export declare function StateGradient(name: string, gradients: StateGradientOptions): StateGradientAsset;
//# sourceMappingURL=state-gradient-asset.d.ts.map