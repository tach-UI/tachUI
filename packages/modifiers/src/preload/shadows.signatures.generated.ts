// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Signatures derived from shadowRegistrations in packages/modifiers/src/preload/shadows.ts
// by packages/core/scripts/derive-modifier-signatures.ts.
// Run `bun run --filter @tachui/core derive-modifier-signatures` to regenerate.

export const shadowModifierSignatures: Readonly<Record<string, string>> = {
  shadows: '(configs: ShadowConfig[]): this',
  shadowPreset: '(preset: ShadowPreset): this',
  shadow: '(config: ShadowConfig | ShadowConfig[] | string): this',
  textShadow: '(config: ReactiveTextShadowConfig | ReactiveTextShadowConfig[] | string): this',
  dropShadow: '(config: DropShadowConfig | DropShadowConfig[] | string): this',
  insetShadow: '(config: Omit<ShadowConfig, \'inset\'>): this',
  elevationShadow: '(level: number): this',
  glowEffect: '(color: string, intensity?: number): this',
  neonEffect: '(color: string, intensity?: number): this',
  neumorphism: '(_backgroundColor: string, dark?: boolean): this',
  neumorphismPressed: '(_backgroundColor: string, dark?: boolean): this',
  layeredShadow: '(layers?: number, opacityMultiplier?: number): this',
  textShadowSubtle: '(color?: string): this',
  textShadowStrong: '(color?: string): this',
  textOutline: '(color: string, thickness?: number): this',
  textEmbossed: '(lightColor?: string, darkColor?: string): this',
  textEngraved: '(darkColor?: string, lightColor?: string): this',
  swiftUIShadow: '(config?: { color?: string; radius?: number; x?: number; y?: number; }): this',
  reactiveShadow: '(condition: Signal<boolean>, trueShadow: ShadowConfig, falseShadow?: ShadowConfig): this',
  animatedShadow: '(_duration?: number): this',
}

export const shadowModifierCategories: Readonly<Record<string, 'layout' | 'appearance' | 'interaction' | 'animation' | 'accessibility' | 'custom'>> = {
  shadows: 'appearance',
  shadowPreset: 'appearance',
  shadow: 'appearance',
  textShadow: 'appearance',
  dropShadow: 'appearance',
  insetShadow: 'appearance',
  elevationShadow: 'appearance',
  glowEffect: 'appearance',
  neonEffect: 'appearance',
  neumorphism: 'appearance',
  neumorphismPressed: 'appearance',
  layeredShadow: 'appearance',
  textShadowSubtle: 'appearance',
  textShadowStrong: 'appearance',
  textOutline: 'appearance',
  textEmbossed: 'appearance',
  textEngraved: 'appearance',
  swiftUIShadow: 'appearance',
  reactiveShadow: 'appearance',
  animatedShadow: 'appearance',
}
