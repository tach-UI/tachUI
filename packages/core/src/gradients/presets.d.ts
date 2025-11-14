/**
 * Gradient Presets for TachUI
 *
 * Common gradient patterns and presets for quick development.
 * Includes popular design system gradients and utility patterns.
 */
import type { GradientDefinition, StateGradientOptions, LinearGradientOptions } from './types';
/**
 * Common color schemes for gradients
 */
export declare const GradientColors: {
    readonly ios: {
        readonly blue: readonly ["#007AFF", "#0051D2"];
        readonly green: readonly ["#30D158", "#248A3D"];
        readonly orange: readonly ["#FF9500", "#CC7700"];
        readonly red: readonly ["#FF3B30", "#CC2E26"];
        readonly purple: readonly ["#AF52DE", "#8C42B8"];
        readonly pink: readonly ["#FF2D92", "#CC2475"];
        readonly teal: readonly ["#5AC8FA", "#48A3C8"];
        readonly indigo: readonly ["#5856D6", "#4644AB"];
    };
    readonly material: {
        readonly blue: readonly ["#2196F3", "#1976D2"];
        readonly green: readonly ["#4CAF50", "#388E3C"];
        readonly orange: readonly ["#FF9800", "#F57C00"];
        readonly red: readonly ["#F44336", "#D32F2F"];
        readonly purple: readonly ["#9C27B0", "#7B1FA2"];
        readonly pink: readonly ["#E91E63", "#C2185B"];
        readonly teal: readonly ["#009688", "#00695C"];
        readonly indigo: readonly ["#3F51B5", "#303F9F"];
    };
    readonly modern: {
        readonly ocean: readonly ["#667eea", "#764ba2"];
        readonly sunset: readonly ["#ff7e5f", "#feb47b"];
        readonly forest: readonly ["#134e5e", "#71b280"];
        readonly lavender: readonly ["#a8edea", "#fed6e3"];
        readonly fire: readonly ["#ff416c", "#ff4b2b"];
        readonly aurora: readonly ["#4facfe", "#00f2fe"];
        readonly cosmic: readonly ["#c471ed", "#f64f59"];
        readonly emerald: readonly ["#11998e", "#38ef7d"];
    };
    readonly neutral: {
        readonly lightGray: readonly ["#f8f9fa", "#e9ecef"];
        readonly darkGray: readonly ["#495057", "#212529"];
        readonly warmGray: readonly ["#f5f5f4", "#e7e5e4"];
        readonly coolGray: readonly ["#f1f5f9", "#e2e8f0"];
        readonly slate: readonly ["#f8fafc", "#f1f5f9"];
        readonly stone: readonly ["#fafaf9", "#f5f5f4"];
    };
};
/**
 * Predefined linear gradient presets
 */
export declare const LinearGradientPresets: {
    readonly vertical: (colors: [string, string]) => GradientDefinition;
    readonly horizontal: (colors: [string, string]) => GradientDefinition;
    readonly diagonal: (colors: [string, string]) => GradientDefinition;
    readonly diagonalReverse: (colors: [string, string]) => GradientDefinition;
    readonly iosBlue: () => GradientDefinition;
    readonly materialBlue: () => GradientDefinition;
    readonly ocean: () => GradientDefinition;
    readonly sunset: () => GradientDefinition;
    readonly aurora: () => GradientDefinition;
    readonly rainbow: () => GradientDefinition;
    readonly prism: () => GradientDefinition;
    readonly cardLight: () => GradientDefinition;
    readonly cardDark: () => GradientDefinition;
    readonly glass: () => GradientDefinition;
    readonly frosted: () => GradientDefinition;
};
/**
 * Predefined radial gradient presets
 */
export declare const RadialGradientPresets: {
    readonly spotlight: (colors: [string, string]) => GradientDefinition;
    readonly vignette: (colors: [string, string]) => GradientDefinition;
    readonly buttonGlow: () => GradientDefinition;
    readonly halo: () => GradientDefinition;
};
/**
 * Predefined angular/conic gradient presets
 */
export declare const AngularGradientPresets: {
    readonly rainbow: () => GradientDefinition;
    readonly loading: () => GradientDefinition;
    readonly progress: () => GradientDefinition;
};
/**
 * Interactive gradient presets with state support
 */
export declare const InteractiveGradientPresets: {
    readonly primaryButton: () => StateGradientOptions;
    readonly secondaryButton: () => StateGradientOptions;
    readonly dangerButton: () => StateGradientOptions;
    readonly successButton: () => StateGradientOptions;
    readonly hoverCard: () => StateGradientOptions;
    readonly focusInput: () => StateGradientOptions;
};
/**
 * Theme-aware gradient utilities
 */
export declare const ThemeGradients: {
    /**
     * Create a theme-responsive gradient that switches between light and dark variants
     */
    readonly createThemeGradient: (lightGradient: GradientDefinition, _darkGradient: GradientDefinition) => GradientDefinition;
    /**
     * Auto-generate dark mode variant of a gradient
     */
    readonly createDarkVariant: (gradient: GradientDefinition) => GradientDefinition;
};
/**
 * Gradient composition utilities
 */
export declare const GradientUtils: {
    /**
     * Reverse the colors in a gradient
     */
    readonly reverse: (gradient: GradientDefinition) => GradientDefinition;
    /**
     * Rotate a linear gradient by swapping start and end points
     */
    readonly rotate: (gradient: LinearGradientOptions) => LinearGradientOptions;
    /**
     * Add transparency to gradient colors
     */
    readonly withOpacity: (gradient: GradientDefinition, _opacity: number) => GradientDefinition;
    /**
     * Blend two gradients together
     */
    readonly blend: (gradient1: GradientDefinition, _gradient2: GradientDefinition, _ratio?: number) => GradientDefinition;
};
/**
 * Export commonly used presets as default exports
 */
export declare const CommonGradients: {
    readonly primaryButton: () => StateGradientOptions;
    readonly secondaryButton: () => StateGradientOptions;
    readonly dangerButton: () => StateGradientOptions;
    readonly successButton: () => StateGradientOptions;
    readonly hoverCard: () => StateGradientOptions;
    readonly focusInput: () => StateGradientOptions;
    readonly rainbow: () => GradientDefinition;
    readonly loading: () => GradientDefinition;
    readonly progress: () => GradientDefinition;
    readonly spotlight: (colors: [string, string]) => GradientDefinition;
    readonly vignette: (colors: [string, string]) => GradientDefinition;
    readonly buttonGlow: () => GradientDefinition;
    readonly halo: () => GradientDefinition;
    readonly vertical: (colors: [string, string]) => GradientDefinition;
    readonly horizontal: (colors: [string, string]) => GradientDefinition;
    readonly diagonal: (colors: [string, string]) => GradientDefinition;
    readonly diagonalReverse: (colors: [string, string]) => GradientDefinition;
    readonly iosBlue: () => GradientDefinition;
    readonly materialBlue: () => GradientDefinition;
    readonly ocean: () => GradientDefinition;
    readonly sunset: () => GradientDefinition;
    readonly aurora: () => GradientDefinition;
    readonly prism: () => GradientDefinition;
    readonly cardLight: () => GradientDefinition;
    readonly cardDark: () => GradientDefinition;
    readonly glass: () => GradientDefinition;
    readonly frosted: () => GradientDefinition;
};
//# sourceMappingURL=presets.d.ts.map