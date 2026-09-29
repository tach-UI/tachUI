// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Signatures derived from backdropRegistrations in packages/modifiers/src/preload/backdrop.ts
// by packages/core/scripts/derive-modifier-signatures.ts.
// Run `bun run --filter @tachui/core derive-modifier-signatures` to regenerate.

export const backdropModifierSignatures: Readonly<Record<string, string>> = {
  backdropFilter: '(value: BackdropFilterConfig | string, fallbackColor?: ColorValue): this',
  glassmorphism: '(intensity?: GlassmorphismIntensity, customFallback?: ColorValue): this',
  customGlassmorphism: '(blur: number, saturate?: number, brightness?: number, fallbackColor?: ColorValue): this',
}

export const backdropModifierCategories: Readonly<Record<string, 'layout' | 'appearance' | 'interaction' | 'animation' | 'accessibility' | 'custom'>> = {
  backdropFilter: 'appearance',
  glassmorphism: 'appearance',
  customGlassmorphism: 'appearance',
}
