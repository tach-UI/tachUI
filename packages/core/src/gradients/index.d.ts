import type { GradientDefinition, LinearGradientOptions, RadialGradientOptions, AngularGradientOptions, RepeatingLinearGradientOptions, RepeatingRadialGradientOptions, ConicGradientOptions, EllipticalGradientOptions } from './types';
export declare function LinearGradient(options: LinearGradientOptions): GradientDefinition;
export declare function RadialGradient(options: RadialGradientOptions): GradientDefinition;
export declare function AngularGradient(options: AngularGradientOptions): GradientDefinition;
export declare function ConicGradient(options: ConicGradientOptions): GradientDefinition;
export declare function RepeatingLinearGradient(options: RepeatingLinearGradientOptions): GradientDefinition;
export declare function RepeatingRadialGradient(options: RepeatingRadialGradientOptions): GradientDefinition;
export declare function EllipticalGradient(options: EllipticalGradientOptions): GradientDefinition;
export * from './types';
export * from './gradient-asset';
export * from './css-generator';
export * from './state-gradient-asset';
export { LinearGradientPresets, InteractiveGradientPresets, ThemeGradients, GradientUtils as GradientPresetUtils } from './presets';
export * from './validation';
export * from './reactive';
export { GradientUtils as GradientUtilities, ColorUtils as ColorUtilities, GradientAnalysis, StateGradientUtils } from './utils';
export * from './examples';
export * from './performance';
//# sourceMappingURL=index.d.ts.map