/**
 * TachUI Modifier Parameter Insight System
 *
 * Provides comprehensive parameter documentation and validation for all modifiers
 * across all TachUI plugins
 */

export interface ModifierParameter {
  name: string
  type: string
  required: boolean
  description: string
  defaultValue?: any
  examples: string[]
  validation?: {
    min?: number
    max?: number
    pattern?: RegExp
    enum?: string[]
  }
  category: 'layout' | 'appearance' | 'interaction' | 'animation' | 'responsive'
  plugin: string
  swiftUIEquivalent?: string
}

export interface ModifierSignature {
  name: string
  plugin: string
  category: string
  description: string
  parameters: ModifierParameter[]
  usage: {
    basic: string[]
    advanced: string[]
  }
  relatedModifiers?: string[]
  swiftUIEquivalent?: string
  bundleSize: string
}

export class ModifierParameterRegistry {
  private modifiers = new Map<string, ModifierSignature>()

  constructor() {
    this.registerCoreModifiers()
    this.registerPrimitivesModifiers()
    this.registerEffectsModifiers()
    this.registerResponsiveModifiers()
    this.registerModifiersPackage()
  }

  private registerCoreModifiers() {
    this.register({
      name: 'padding',
      plugin: '@tachui/core',
      category: 'layout',
      description: 'Adds padding inside the element boundaries',
      parameters: [
        {
          name: 'value',
          type: 'string | number | EdgeInsets',
          required: true,
          description: 'Padding value - can be uniform or per-edge',
          examples: [
            "'16px'",
            '24',
            '{ top: 16, bottom: 16, leading: 8, trailing: 8 }',
          ],
          validation: {
            pattern: /^(\d+(\.\d+)?(px|em|rem|%)?|\{.*\})$/,
          },
          category: 'layout',
          plugin: '@tachui/core',
          swiftUIEquivalent: '.padding()',
        },
      ],
      usage: {
        basic: [".padding('16px')", '.padding(20)'],
        advanced: [
          '.padding({ top: 16, bottom: 16, leading: 8, trailing: 8 })',
          ".padding('1em 2em')",
        ],
      },
      relatedModifiers: ['margin'],
      swiftUIEquivalent: '.padding()',
      bundleSize: '<1KB',
    })

    this.register({
      name: 'backgroundColor',
      plugin: '@tachui/core',
      category: 'appearance',
      description: 'Sets the background color of the element',
      parameters: [
        {
          name: 'color',
          type: 'string | ColorAsset | LinearGradient',
          required: true,
          description: 'Background color value',
          examples: [
            "'#FF6B6B'",
            "'rgba(255, 107, 107, 0.8)'",
            'Assets.colors.primary',
            "LinearGradient(['#FF6B6B', '#4ECDC4'])",
          ],
          validation: {
            pattern: /^(#[0-9A-Fa-f]{3,8}|rgba?\(.*\)|hsla?\(.*\)|[a-zA-Z]+)$/,
          },
          category: 'appearance',
          plugin: '@tachui/core',
          swiftUIEquivalent: '.background()',
        },
      ],
      usage: {
        basic: [".backgroundColor('#FF6B6B')", ".backgroundColor('red')"],
        advanced: [
          '.backgroundColor(Assets.colors.primary)',
          ".backgroundColor(LinearGradient(['#FF6B6B', '#4ECDC4']))",
        ],
      },
      relatedModifiers: ['foregroundColor', 'background'],
      swiftUIEquivalent: '.background()',
      bundleSize: '<1KB',
    })

    this.register({
      name: 'fixedSize',
      plugin: '@tachui/modifiers',
      category: 'layout',
      description:
        'Prevents element from growing beyond intrinsic content size',
      parameters: [
        {
          name: 'horizontal',
          type: 'boolean',
          required: false,
          description: 'Fix width to content size',
          defaultValue: true,
          examples: ['true', 'false'],
          category: 'layout',
          plugin: '@tachui/modifiers',
          swiftUIEquivalent: '.fixedSize(horizontal:)',
        },
        {
          name: 'vertical',
          type: 'boolean',
          required: false,
          description: 'Fix height to content size',
          defaultValue: true,
          examples: ['true', 'false'],
          category: 'layout',
          plugin: '@tachui/modifiers',
          swiftUIEquivalent: '.fixedSize(vertical:)',
        },
      ],
      usage: {
        basic: [
          '.fixedSize()',
          '.fixedSize({ horizontal: true, vertical: false })',
        ],
        advanced: ['.fixedSize({ horizontal: true }).frame({ minWidth: 100 })'],
      },
      swiftUIEquivalent: '.fixedSize(horizontal:vertical:)',
      bundleSize: '<1KB',
    })
  }

  private registerPrimitivesModifiers() {
    this.register({
      name: 'frame',
      plugin: '@tachui/primitives',
      category: 'layout',
      description: 'Sets the frame size and alignment of the element',
      parameters: [
        {
          name: 'width',
          type: 'number | string | undefined',
          required: false,
          description: 'Fixed width of the element',
          examples: ['200', "'100%'", 'undefined'],
          category: 'layout',
          plugin: '@tachui/primitives',
        },
        {
          name: 'height',
          type: 'number | string | undefined',
          required: false,
          description: 'Fixed height of the element',
          examples: ['100', "'50vh'", 'undefined'],
          category: 'layout',
          plugin: '@tachui/primitives',
        },
        {
          name: 'minWidth',
          type: 'number | string | undefined',
          required: false,
          description: 'Minimum width constraint',
          examples: ['50', "'10em'"],
          category: 'layout',
          plugin: '@tachui/primitives',
        },
        {
          name: 'maxWidth',
          type: 'number | string | undefined',
          required: false,
          description: 'Maximum width constraint',
          examples: ['500', "'80vw'"],
          category: 'layout',
          plugin: '@tachui/primitives',
        },
        {
          name: 'alignment',
          type: 'Alignment',
          required: false,
          description: 'How to align the element within its frame',
          examples: ["'center'", "'topLeading'", "'bottomTrailing'"],
          validation: {
            enum: [
              'center',
              'leading',
              'trailing',
              'top',
              'bottom',
              'topLeading',
              'topTrailing',
              'bottomLeading',
              'bottomTrailing',
            ],
          },
          category: 'layout',
          plugin: '@tachui/primitives',
        },
      ],
      usage: {
        basic: [
          '.frame({ width: 200, height: 100 })',
          '.frame({ minWidth: 50, maxWidth: 300 })',
        ],
        advanced: [
          ".frame({ width: 200, height: 100, alignment: 'center' })",
          ".frame({ minWidth: 100, maxHeight: 200 }).backgroundColor('#f0f0f0')",
        ],
      },
      relatedModifiers: ['fixedSize', 'layoutPriority'],
      swiftUIEquivalent: '.frame(width:height:alignment:)',
      bundleSize: '2KB',
    })
  }

  private registerEffectsModifiers() {
    this.register({
      name: 'shadow',
      plugin: '@tachui/effects',
      category: 'appearance',
      description: 'Adds a drop shadow to the element',
      parameters: [
        {
          name: 'color',
          type: 'string',
          required: false,
          description: 'Shadow color',
          defaultValue: "'rgba(0, 0, 0, 0.3)'",
          examples: ["'rgba(0, 0, 0, 0.5)'", "'#333'"],
          category: 'appearance',
          plugin: '@tachui/effects',
        },
        {
          name: 'radius',
          type: 'number',
          required: false,
          description: 'Blur radius of the shadow',
          defaultValue: 3,
          examples: ['5', '10', '0'],
          validation: { min: 0, max: 50 },
          category: 'appearance',
          plugin: '@tachui/effects',
        },
        {
          name: 'x',
          type: 'number',
          required: false,
          description: 'Horizontal offset',
          defaultValue: 0,
          examples: ['2', '-2', '0'],
          category: 'appearance',
          plugin: '@tachui/effects',
        },
        {
          name: 'y',
          type: 'number',
          required: false,
          description: 'Vertical offset',
          defaultValue: 2,
          examples: ['4', '-4', '0'],
          category: 'appearance',
          plugin: '@tachui/effects',
        },
      ],
      usage: {
        basic: ['.shadow()', '.shadow({ radius: 10 })'],
        advanced: [
          ".shadow({ color: 'rgba(255, 0, 0, 0.5)', radius: 8, x: 2, y: 4 })",
          '.shadow({ radius: 20, y: 10 }).opacity(0.9)',
        ],
      },
      relatedModifiers: ['blur', 'opacity'],
      swiftUIEquivalent: '.shadow(color:radius:x:y:)',
      bundleSize: '3KB',
    })

    this.register({
      name: 'hover',
      plugin: '@tachui/effects',
      category: 'interaction',
      description: 'Applies styles on hover state',
      parameters: [
        {
          name: 'modifiers',
          type: 'ModifierChain',
          required: true,
          description: 'Modifiers to apply on hover',
          examples: [
            "backgroundColor('#FF6B6B')",
            'scale(1.1).shadow({ radius: 10 })',
          ],
          category: 'interaction',
          plugin: '@tachui/effects',
        },
      ],
      usage: {
        basic: [".hover(backgroundColor('#FF6B6B'))", '.hover(scale(1.05))'],
        advanced: [
          ".hover(backgroundColor('#FF6B6B').scale(1.1).shadow({ radius: 8 }))",
          ".hover(transform({ scale: 1.1, rotate: '5deg' }))",
        ],
      },
      relatedModifiers: ['active', 'focus', 'disabled'],
      bundleSize: '2KB',
    })
  }

  private registerResponsiveModifiers() {
    this.register({
      name: 'responsive',
      plugin: '@tachui/responsive',
      category: 'responsive',
      description: 'Applies different modifiers at different breakpoints',
      parameters: [
        {
          name: 'breakpoints',
          type: 'ResponsiveBreakpoints',
          required: true,
          description: 'Modifier configurations for different screen sizes',
          examples: [
            '{ sm: padding(8), md: padding(16), lg: padding(24) }',
            '{ mobile: fontSize(14), tablet: fontSize(16), desktop: fontSize(18) }',
          ],
          category: 'responsive',
          plugin: '@tachui/responsive',
        },
      ],
      usage: {
        basic: [
          '.responsive({ sm: padding(8), md: padding(16), lg: padding(24) })',
          '.responsive({ mobile: fontSize(14), desktop: fontSize(18) })',
        ],
        advanced: [
          '.responsive({ sm: padding(8).fontSize(14), md: padding(16).fontSize(16), lg: padding(24).fontSize(18) })',
        ],
      },
      relatedModifiers: ['breakpoint'],
      bundleSize: '4KB',
    })
  }

  private registerModifiersPackage() {
    // This would register all the advanced modifiers from @tachui/modifiers
    // Including layout, animation, interaction modifiers
  }

  register(signature: ModifierSignature) {
    this.modifiers.set(signature.name, signature)
  }

  getModifier(name: string): ModifierSignature | undefined {
    return this.modifiers.get(name)
  }

  getAllModifiers(): ModifierSignature[] {
    return Array.from(this.modifiers.values())
  }

  getModifiersByPlugin(plugin: string): ModifierSignature[] {
    return this.getAllModifiers().filter(mod => mod.plugin === plugin)
  }

  getModifiersByCategory(category: string): ModifierSignature[] {
    return this.getAllModifiers().filter(mod => mod.category === category)
  }

  searchModifiers(query: string): ModifierSignature[] {
    const normalizedQuery = query.toLowerCase()
    return this.getAllModifiers().filter(
      mod =>
        mod.name.toLowerCase().includes(normalizedQuery) ||
        mod.description.toLowerCase().includes(normalizedQuery) ||
        mod.parameters.some(
          param =>
            param.name.toLowerCase().includes(normalizedQuery) ||
            param.description.toLowerCase().includes(normalizedQuery)
        )
    )
  }

  /**
   * Generate parameter hints for IDE integration
   */
  generateParameterHints(modifierName: string): string[] {
    const modifier = this.getModifier(modifierName)
    if (!modifier) return []

    return modifier.parameters.map(param => {
      const type = param.type
      const required = param.required ? '' : '?'
      const defaultVal =
        param.defaultValue !== undefined
          ? ` = ${JSON.stringify(param.defaultValue)}`
          : ''
      return `${param.name}${required}: ${type}${defaultVal} // ${param.description}`
    })
  }

  /**
   * Validate modifier parameters at runtime (dev mode)
   */
  validateParameters(
    modifierName: string,
    params: any
  ): { valid: boolean; errors: string[] } {
    const modifier = this.getModifier(modifierName)
    if (!modifier)
      return { valid: false, errors: [`Unknown modifier: ${modifierName}`] }

    const errors: string[] = []

    for (const param of modifier.parameters) {
      const value = params[param.name]

      // Check required parameters
      if (param.required && (value === undefined || value === null)) {
        errors.push(`Parameter '${param.name}' is required`)
        continue
      }

      if (value !== undefined && param.validation) {
        const validation = param.validation

        // Pattern validation
        if (
          validation.pattern &&
          typeof value === 'string' &&
          !validation.pattern.test(value)
        ) {
          errors.push(
            `Parameter '${param.name}' does not match expected pattern`
          )
        }

        // Enum validation
        if (validation.enum && !validation.enum.includes(value)) {
          errors.push(
            `Parameter '${param.name}' must be one of: ${validation.enum.join(', ')}`
          )
        }

        // Range validation
        if (typeof value === 'number') {
          if (validation.min !== undefined && value < validation.min) {
            errors.push(
              `Parameter '${param.name}' must be >= ${validation.min}`
            )
          }
          if (validation.max !== undefined && value > validation.max) {
            errors.push(
              `Parameter '${param.name}' must be <= ${validation.max}`
            )
          }
        }
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Generate comprehensive documentation for all modifiers
   */
  generateDocumentation(): string {
    let docs = '# TachUI Modifier Reference\n\n'

    const categories = [...new Set(this.getAllModifiers().map(m => m.category))]

    for (const category of categories.sort()) {
      docs += `## ${category.charAt(0).toUpperCase() + category.slice(1)} Modifiers\n\n`

      const categoryModifiers = this.getModifiersByCategory(category).sort(
        (a, b) => a.name.localeCompare(b.name)
      )

      for (const modifier of categoryModifiers) {
        docs += `### \`.${modifier.name}()\`\n\n`
        docs += `**Plugin**: \`${modifier.plugin}\`  \n`
        docs += `**Bundle Size**: ${modifier.bundleSize}  \n\n`
        docs += `${modifier.description}\n\n`

        if (modifier.swiftUIEquivalent) {
          docs += `**SwiftUI Equivalent**: \`${modifier.swiftUIEquivalent}\`\n\n`
        }

        docs += `**Parameters**:\n\n`
        for (const param of modifier.parameters) {
          const required = param.required ? '**(required)**' : '*(optional)*'
          const defaultVal =
            param.defaultValue !== undefined
              ? ` - Default: \`${JSON.stringify(param.defaultValue)}\``
              : ''
          docs += `- \`${param.name}: ${param.type}\` ${required}${defaultVal}  \n`
          docs += `  ${param.description}\n\n`
        }

        docs += `**Usage**:\n\n`
        docs += `\`\`\`typescript\n`
        docs += modifier.usage.basic
          .map(usage => `component.${usage}`)
          .join('\n')
        docs += `\n\`\`\`\n\n`

        if (modifier.usage.advanced.length > 0) {
          docs += `**Advanced Usage**:\n\n`
          docs += `\`\`\`typescript\n`
          docs += modifier.usage.advanced
            .map(usage => `component.${usage}`)
            .join('\n')
          docs += `\n\`\`\`\n\n`
        }

        docs += '---\n\n'
      }
    }

    return docs
  }
}

// Global instance for use across the framework
export const modifierParameterRegistry = new ModifierParameterRegistry()
