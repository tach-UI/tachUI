// Main exports
export { Symbol } from './components/Symbol.js'

// SwiftUI Compatibility (Phase 3)
export {
  Image,
  SystemImage,
  isSystemNameSupported,
  getSystemNameInfo,
  getSFSymbolsForLucide,
  batchConvertSystemNames
} from './compatibility/swiftui-shim.js'

export type {
  ImageSystemNameProps,
  LabelProps,
  ConversionResult
} from './compatibility/swiftui-shim.js'

// SF Symbol Mapping (Phase 3)
export {
  SF_SYMBOLS_MAPPING,
  getLucideForSFSymbol,
  getSFSymbolsForLucide as getSFSymbolsForLucideIcon,
  isSFSymbolSupported,
  getAllSupportedSFSymbols,
  getSFSymbolMapping,
  getSFSymbolsByCategory,
  getAllSFSymbolCategories
} from './compatibility/sf-symbols-mapping.js'

export type { SFSymbolMapping } from './compatibility/sf-symbols-mapping.js'

// Variant Mapping (Phase 3)
export {
  VARIANT_MAPPING_TABLE,
  mapVariantToLucide,
  isVariantSupported,
  getSupportedVariants,
  getVariantCSSClasses,
  getVariantCSS,
  resolveVariantFromName,
  batchMapVariants
} from './compatibility/variant-mapping.js'

export type {
  VariantMappingStrategy,
  VariantMappingResult
} from './compatibility/variant-mapping.js'

// Category Mapping (Phase 3)
export {
  SymbolCategory,
  CATEGORY_METADATA,
  getSymbolsByCategory,
  getSymbolCategory,
  getAllSymbolCategories,
  searchSymbolsByCategory,
  getRecommendedSymbols,
  getRelatedCategories,
  generateSymbolCollection
} from './compatibility/category-mapping.js'

export type { CategoryMetadata } from './compatibility/category-mapping.js'

// Weight Translation (Phase 3)
export {
  WEIGHT_TO_CSS_FONT_WEIGHT,
  WEIGHT_TO_STROKE_WIDTH,
  WEIGHT_SUPPORT_MATRIX,
  getWeightStyles,
  isWeightSupported,
  getClosestSupportedWeight,
  generateWeightVariants,
  getContextualWeight,
  generateResponsiveWeights,
  generateWeightCSSVariables,
  generateWeightTransition,
  batchProcessWeights
} from './compatibility/weight-mapping.js'

export type {
  WeightVariant,
  ResponsiveWeights
} from './compatibility/weight-mapping.js'

// Migration Utilities (Phase 3)
export {
  analyzeSingleSymbolMigration,
  analyzeProjectMigration,
  generateMigrationCode,
  validateMigration
} from './compatibility/migration-utilities.js'

export type {
  SymbolMigrationResult,
  ProjectMigrationAnalysis,
  MigrationOptions,
  MigrationValidation
} from './compatibility/migration-utilities.js'

// Types
export type {
  SymbolProps,
  SymbolVariant,
  SymbolScale,
  SymbolWeight,
  SymbolRenderingMode,
  SymbolEffect,
  IconDefinition,
  IconMetadata,
  IconSet
} from './types.js'

// Icon sets
export { LucideIconSet, IconSetRegistry } from './icon-sets/index.js'

// Modifiers
export type { SymbolModifierBuilder } from './modifiers/index.js'

// Utilities
export { 
  SymbolAccessibility, 
  WCAGCompliance,
  IconLoader,
  OptimizedSVGRenderer,
  getIconBundleSize,
  optimizeSVG,
  minifySVG
} from './utils/index.js'

// Custom Icon Set Builder (Phase 2.7)
export {
  CustomIconSetBuilder,
  createIconSetFromJSON,
  createIconSetFromSprite,
  validateIcon,
  validateIconSet
} from './utils/custom-icon-set-builder.js'

export type { CustomIconConfig, IconSetConfig } from './utils/custom-icon-set-builder.js'

// Initialize default icon set
import { LucideIconSet } from './icon-sets/lucide.js'
import { IconSetRegistry } from './icon-sets/registry.js'

// Register the default Lucide icon set
IconSetRegistry.register(new LucideIconSet())

// Export component validation types for plugin registration (development only)
// Note: Validation exports are conditionally loaded to avoid production bundling

/**
 * Component validator interface for symbols package
 */
export interface ComponentValidator {
  packageName: string
  componentName: string
  validate: (args: unknown[]) => void
}

/**
 * Symbols validation error class (re-exported for convenience)
 * Only available in development builds
 */
export interface SymbolsValidationErrorInterface extends Error {
  context: {
    component: string
    property?: string
    suggestion?: string
    documentation?: string
    example?: {
      wrong: string
      correct: string
    }
  }
  getFormattedMessage(): string
}

// Development-only validation registration
if (process.env.NODE_ENV !== 'production') {
  // Dynamic export registration for development
  import('./validation').then(module => {
    if (typeof window !== 'undefined') {
      // Auto-register validators in development
      module.registerSymbolsValidators?.()
    }
  }).catch(() => {
    // Silently fail if validation module unavailable
  })
}