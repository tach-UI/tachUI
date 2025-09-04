/**
 * Plugin Validation Registration System
 *
 * Allows packages to register their own component validators with Core,
 * maintaining proper architectural separation and plugin independence.
 */
interface ComponentValidator {
  validate?: (args: unknown[]) => void
  [key: string]: any
}
/**
 * Plugin validation interface for external packages
 */
export interface PluginValidationConfig {
  packageName: string
  components: ComponentValidationDefinition[]
}
/**
 * Component validation definition for registration
 */
export interface ComponentValidationDefinition {
  name: string
  requiredProps?: string[]
  optionalProps?: string[]
  validate?: (args: unknown[]) => void
  documentation?: string
}
/**
 * Register component validator from a plugin package
 */
export declare function registerComponentValidator(
  validator: ComponentValidator
): void
/**
 * Unregister component validator
 */
export declare function unregisterComponentValidator(
  packageName: string,
  componentName: string
): void
/**
 * Get component validator for validation
 */
export declare function getComponentValidator(
  packageName: string,
  componentName: string
): ComponentValidator | undefined
/**
 * Register multiple validators from a plugin package
 */
export declare function registerPluginValidation(
  config: PluginValidationConfig
): void
/**
 * Get validation statistics
 */
export declare function getValidationStats(): {
  totalValidators: number
  packages: Array<{
    name: string
    componentCount: number
  }>
}
/**
 * Validate a component using registered validators
 */
export declare function validateComponent(
  packageName: string,
  componentName: string,
  args: unknown[]
): void
/**
 * Check if a component has validation registered
 */
export declare function hasValidator(
  packageName: string,
  componentName: string
): boolean
/**
 * Get all registered packages
 */
export declare function getRegisteredPackages(): string[]
/**
 * Get all components for a package
 */
export declare function getPackageComponents(packageName: string): string[]
/**
 * Clear all validators (for testing/cleanup)
 */
export declare function clearAllValidators(): void
/**
 * Plugin helper for easier registration
 */
export declare const PluginValidationHelper: {
  /**
   * Register a simple plugin with basic validation
   */
  registerPlugin(
    packageName: string,
    components: Array<{
      name: string
      requiredProps?: string[]
      optionalProps?: string[]
    }>
  ): void
  /**
   * Create a custom validator
   */
  createValidator(
    packageName: string,
    componentName: string,
    validate: (args: unknown[]) => void
  ): ComponentValidator
}

//# sourceMappingURL=plugin-registration.d.ts.map
