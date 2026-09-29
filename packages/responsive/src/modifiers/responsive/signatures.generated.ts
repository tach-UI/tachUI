// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Signatures derived from responsiveRegistrations in packages/responsive/src/modifiers/responsive/index.ts
// by packages/core/scripts/derive-modifier-signatures.ts.
// Run `bun run --filter @tachui/core generate-modifier-types` to regenerate.

export const responsiveModifierSignatures: Readonly<Record<string, string>> = {
  responsive: '(config: ResponsiveStyleConfig): this',
  mediaQuery: '(query: string, styles: Record<string, any>): this',
  responsiveProperty: '(property: string, value: ResponsiveValue<unknown>): this',
  responsiveLayout: '(config: { direction?: ResponsiveValue<\'row\' | \'column\' | \'row-reverse\' | \'column-reverse\'>; wrap?: ResponsiveValue<\'nowrap\' | \'wrap\' | \'wrap-reverse\'>; justify?: ResponsiveValue<\'flex-start\' | \'flex-end\' | \'center\' | \'space-between\' | \'space-around\' | \'space-evenly\'>; align?: ResponsiveValue<\'flex-start\' | \'flex-end\' | \'center\' | \'stretch\' | \'baseline\'>; gap?: ResponsiveValue<number | string>; }): this',
}
