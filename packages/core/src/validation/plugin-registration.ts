/**
 * Plugin Validation Registration System
 *
 * Allows packages to register their own component validators with Core,
 * maintaining proper architectural separation and plugin independence.
 */

// ComponentValidator type moved to primitives package - creating local interface
interface ComponentValidator {
  validate?: (args: unknown[]) => void
  [key: string]: any
}

/**
 * Plugin validation registry
 */
const pluginValidators = new Map<string, ComponentValidator>()
const packageValidators = new Map<string, Set<string>>()

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
export function registerComponentValidator(
  validator: ComponentValidator
): void {
  const key = `${validator.packageName}:${validator.componentName}`
  pluginValidators.set(key, validator)

  // Track validators by package
  if (!packageValidators.has(validator.packageName)) {
    packageValidators.set(validator.packageName, new Set())
  }
  packageValidators.get(validator.packageName)!.add(validator.componentName)

  // if (process.env.NODE_ENV !== 'production') {
  //   console.info(`🔍 Registered validator: ${key}`)
  // }
}

/**
 * Unregister component validator
 */
export function unregisterComponentValidator(
  packageName: string,
  componentName: string
): void {
  const key = `${packageName}:${componentName}`
  pluginValidators.delete(key)

  const packageSet = packageValidators.get(packageName)
  if (packageSet) {
    packageSet.delete(componentName)
    if (packageSet.size === 0) {
      packageValidators.delete(packageName)
    }
  }

  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.NODE_ENV !== 'test'
  ) {
    console.info(`🔍 Unregistered validator: ${key}`)
  }
}

/**
 * Get component validator for validation
 */
export function getComponentValidator(
  packageName: string,
  componentName: string
): ComponentValidator | undefined {
  const key = `${packageName}:${componentName}`
  return pluginValidators.get(key)
}

/**
 * Register multiple validators from a plugin package
 */
export function registerPluginValidation(config: PluginValidationConfig): void {
  const { packageName, components } = config

  for (const component of components) {
    const validator: ComponentValidator = {
      packageName,
      componentName: component.name,
      validate:
        component.validate || createDefaultValidator(packageName, component),
    }

    registerComponentValidator(validator)
  }

  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.NODE_ENV !== 'test'
  ) {
    console.info(
      `🔍 Registered ${components.length} validators for package: ${packageName}`
    )
  }
}

/**
 * Create default validator based on component definition
 */
function createDefaultValidator(
  packageName: string,
  component: ComponentValidationDefinition
) {
  return (args: unknown[]) => {
    // Create local validation error since TachUIValidationError moved to primitives
    class TachUIValidationError extends Error {
      constructor(
        message: string,
        public context: any
      ) {
        super(message)
        this.name = 'TachUIValidationError'
      }
    }

    if (component.requiredProps?.length && args.length === 0) {
      throw new TachUIValidationError(
        `${component.name} component requires props`,
        {
          component: component.name,
          package: packageName,
          suggestion: `Add required props: ${component.requiredProps.join(', ')}`,
          documentation: component.documentation,
        }
      )
    }

    if (args.length > 0) {
      const [props] = args
      if (!props || typeof props !== 'object') {
        throw new TachUIValidationError(
          `${component.name} requires a props object`,
          {
            component: component.name,
            package: packageName,
            suggestion: 'Pass a props object',
            documentation: component.documentation,
          }
        )
      }

      // Check required props
      if (component.requiredProps) {
        const propsObj = props as any
        for (const requiredProp of component.requiredProps) {
          if (propsObj[requiredProp] === undefined) {
            throw new TachUIValidationError(
              `${component.name} ${requiredProp} property is required`,
              {
                component: component.name,
                package: packageName,
                suggestion: `Provide a value for ${requiredProp}`,
                documentation: component.documentation,
              }
            )
          }
        }
      }
    }
  }
}

/**
 * Get validation statistics
 */
export function getValidationStats(): {
  totalValidators: number
  packages: Array<{ name: string; componentCount: number }>
} {
  const packages = Array.from(packageValidators.entries()).map(
    ([name, components]) => ({
      name,
      componentCount: components.size,
    })
  )

  return {
    totalValidators: pluginValidators.size,
    packages,
  }
}

/**
 * Validate a component using registered validators
 */
export function validateComponent(
  packageName: string,
  componentName: string,
  args: unknown[]
): void {
  const validator = getComponentValidator(packageName, componentName)
  if (validator && validator.validate) {
    validator.validate(args)
  }
}

/**
 * Check if a component has validation registered
 */
export function hasValidator(
  packageName: string,
  componentName: string
): boolean {
  return pluginValidators.has(`${packageName}:${componentName}`)
}

/**
 * Get all registered packages
 */
export function getRegisteredPackages(): string[] {
  return Array.from(packageValidators.keys())
}

/**
 * Get all components for a package
 */
export function getPackageComponents(packageName: string): string[] {
  const components = packageValidators.get(packageName)
  return components ? Array.from(components) : []
}

/**
 * Clear all validators (for testing/cleanup)
 */
export function clearAllValidators(): void {
  pluginValidators.clear()
  packageValidators.clear()

  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.NODE_ENV !== 'test'
  ) {
    console.info('🔍 Cleared all plugin validators')
  }
}

/**
 * Plugin helper for easier registration
 */
export const PluginValidationHelper = {
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
  ): void {
    registerPluginValidation({
      packageName,
      components: components.map(comp => ({
        name: comp.name,
        requiredProps: comp.requiredProps,
        optionalProps: comp.optionalProps,
      })),
    })
  },

  /**
   * Create a custom validator
   */
  createValidator(
    packageName: string,
    componentName: string,
    validate: (args: unknown[]) => void
  ): ComponentValidator {
    return {
      packageName,
      componentName,
      validate,
    }
  },
}
