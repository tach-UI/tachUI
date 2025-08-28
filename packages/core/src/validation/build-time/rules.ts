/**
 * Validation Rules Engine
 * 
 * Comprehensive patterns and rules for validating TachUI components
 * and modifiers at build time.
 */

import type {
  ComponentValidationPattern,
  ModifierValidationPattern,
  BuildTimeValidationRule,
  ValidationContext,
  ValidationResult
} from './types'
import * as ts from 'typescript'

/**
 * Component validation patterns
 */
export const componentPatterns: Record<string, ComponentValidationPattern> = {
  Text: {
    componentName: 'Text',
    requiredProps: ['content'],
    optionalProps: [],
    validModifiers: [
      'font', 'fontSize', 'fontWeight', 'textAlign', 'lineHeight', 'letterSpacing',
      'foregroundColor', 'background', 'padding', 'margin', 'border', 'shadow',
      'opacity', 'clipped', 'frame', 'position', 'zIndex'
    ],
    invalidModifiers: ['disabled', 'onTap'],
    examples: {
      valid: [
        'Text("Hello World")',
        'Text(() => "Dynamic text")',
        'Text(signal)',
        'Text("Hello").fontSize(16).foregroundColor("blue")'
      ],
      invalid: [
        'Text()',
        'Text(null)',
        'Text(123)',
        'Text("Hello").disabled(true)'
      ]
    }
  },

  Button: {
    componentName: 'Button',
    requiredProps: ['title'],
    optionalProps: ['action'],
    validModifiers: [
      'foregroundColor', 'background', 'padding', 'margin', 'border', 'shadow',
      'opacity', 'clipped', 'frame', 'position', 'zIndex', 'disabled', 'onTap',
      'cursor', 'font', 'fontSize', 'fontWeight'
    ],
    invalidModifiers: ['textAlign', 'lineHeight'],
    examples: {
      valid: [
        'Button("Click me")',
        'Button("Submit", handleSubmit)',
        'Button("Save").background("blue").foregroundColor("white")',
        'Button("Delete").disabled(isLoading)'
      ],
      invalid: [
        'Button()',
        'Button(null)',
        'Button(123)',
        'Button("Click").textAlign("center")'
      ]
    }
  },

  VStack: {
    componentName: 'VStack',
    requiredProps: ['children'],
    optionalProps: ['spacing', 'alignment'],
    validModifiers: [
      'background', 'padding', 'margin', 'border', 'shadow', 'opacity',
      'clipped', 'frame', 'position', 'zIndex', 'spacing', 'alignment'
    ],
    invalidModifiers: ['font', 'fontSize', 'disabled'],
    examples: {
      valid: [
        'VStack({ children: [Text("Hello")] })',
        'VStack({ children: components, spacing: 16 })',
        'VStack({ children: items }).padding(20)'
      ],
      invalid: [
        'VStack()',
        'VStack("invalid")',
        'VStack({ children: Text("Hello") })',
        'VStack({ children: [] }).fontSize(16)'
      ]
    }
  },

  HStack: {
    componentName: 'HStack',
    requiredProps: ['children'],
    optionalProps: ['spacing', 'alignment'],
    validModifiers: [
      'background', 'padding', 'margin', 'border', 'shadow', 'opacity',
      'clipped', 'frame', 'position', 'zIndex', 'spacing', 'alignment'
    ],
    invalidModifiers: ['font', 'fontSize', 'disabled'],
    examples: {
      valid: [
        'HStack({ children: [Text("Hello"), Button("Click")] })',
        'HStack({ children: components, spacing: 8 })',
        'HStack({ children: items }).alignment("center")'
      ],
      invalid: [
        'HStack()',
        'HStack({ children: "invalid" })',
        'HStack({ children: [] }).disabled(true)'
      ]
    }
  },

  ZStack: {
    componentName: 'ZStack',
    requiredProps: ['children'],
    optionalProps: ['alignment'],
    validModifiers: [
      'background', 'padding', 'margin', 'border', 'shadow', 'opacity',
      'clipped', 'frame', 'position', 'zIndex', 'alignment'
    ],
    invalidModifiers: ['font', 'fontSize', 'disabled', 'spacing'],
    examples: {
      valid: [
        'ZStack({ children: [Background(), Text("Overlay")] })',
        'ZStack({ children: layers, alignment: "topLeading" })',
        'ZStack({ children: items }).clipped()'
      ],
      invalid: [
        'ZStack()',
        'ZStack({ children: null })',
        'ZStack({ children: items }).spacing(10)'
      ]
    }
  },

  Image: {
    componentName: 'Image',
    requiredProps: ['source'],
    optionalProps: ['contentMode', 'alt'],
    validModifiers: [
      'frame', 'clipped', 'aspectRatio', 'opacity', 'border', 'shadow',
      'position', 'zIndex', 'onTap', 'cursor'
    ],
    invalidModifiers: ['font', 'fontSize', 'textAlign', 'disabled'],
    examples: {
      valid: [
        'Image({ source: "image.jpg" })',
        'Image({ source: imageUrl, alt: "Description" })',
        'Image({ source: "photo.png" }).frame({ width: 200, height: 150 })'
      ],
      invalid: [
        'Image()',
        'Image({ source: null })',
        'Image({ source: "image.jpg" }).fontSize(16)'
      ]
    }
  },

  Toggle: {
    componentName: 'Toggle',
    requiredProps: ['isOn'],
    optionalProps: ['onToggle'],
    validModifiers: [
      'disabled', 'onTap', 'foregroundColor', 'background', 'padding',
      'margin', 'frame', 'position', 'zIndex', 'opacity'
    ],
    invalidModifiers: ['font', 'fontSize', 'textAlign'],
    examples: {
      valid: [
        'Toggle({ isOn: isEnabled })',
        'Toggle({ isOn: state, onToggle: handleToggle })',
        'Toggle({ isOn: signal }).disabled(isLoading)'
      ],
      invalid: [
        'Toggle()',
        'Toggle({ isOn: null })',
        'Toggle({ isOn: state }).fontSize(16)'
      ]
    }
  }
}

/**
 * Modifier validation patterns
 */
export const modifierPatterns: Record<string, ModifierValidationPattern> = {
  font: {
    modifierName: 'font',
    validComponents: ['Text', 'Button'],
    parameterTypes: {
      0: ['string', 'FontAsset']
    },
    examples: {
      valid: [
        'Text("Hello").font("Arial")',
        'Text("Title").font(Assets.fonts.headline)',
        'Button("Save").font("system")'
      ],
      invalid: [
        'VStack({}).font("Arial")',
        'Image({}).font("system")',
        'Text("Hello").font(123)'
      ]
    }
  },

  fontSize: {
    modifierName: 'fontSize',
    validComponents: ['Text', 'Button'],
    parameterTypes: {
      0: ['number', 'string']
    },
    examples: {
      valid: [
        'Text("Hello").fontSize(16)',
        'Text("Title").fontSize("1.2rem")',
        'Button("Save").fontSize(14)'
      ],
      invalid: [
        'VStack({}).fontSize(16)',
        'Image({}).fontSize(14)',
        'Text("Hello").fontSize(null)'
      ]
    }
  },

  foregroundColor: {
    modifierName: 'foregroundColor',
    validComponents: ['*'], // Valid for all components
    parameterTypes: {
      0: ['string', 'ColorAsset']
    },
    examples: {
      valid: [
        'Text("Hello").foregroundColor("blue")',
        'Text("Error").foregroundColor("#ff0000")',
        'Button("Save").foregroundColor(Assets.colors.primary)'
      ],
      invalid: [
        'Text("Hello").foregroundColor(123)',
        'Button("Save").foregroundColor(null)'
      ]
    }
  },

  background: {
    modifierName: 'background',
    validComponents: ['*'],
    parameterTypes: {
      0: ['string', 'ColorAsset', 'GradientAsset']
    },
    examples: {
      valid: [
        'VStack({}).background("white")',
        'Button("Save").background("#007AFF")',
        'Text("Hello").background(gradient)'
      ],
      invalid: [
        'VStack({}).background(123)',
        'Button("Save").background(null)'
      ]
    }
  },

  padding: {
    modifierName: 'padding',
    validComponents: ['*'],
    parameterTypes: {
      0: ['number', 'string', 'object']
    },
    examples: {
      valid: [
        'VStack({}).padding(16)',
        'Text("Hello").padding("1rem")',
        'Button("Save").padding({ top: 8, horizontal: 12 })'
      ],
      invalid: [
        'VStack({}).padding(null)',
        'Text("Hello").padding("invalid")'
      ]
    }
  },

  margin: {
    modifierName: 'margin',
    validComponents: ['*'],
    parameterTypes: {
      0: ['number', 'string', 'object']
    },
    examples: {
      valid: [
        'VStack({}).margin(16)',
        'Text("Hello").margin("1rem")',
        'Button("Save").margin({ bottom: 20 })'
      ],
      invalid: [
        'VStack({}).margin(null)',
        'Text("Hello").margin(true)'
      ]
    }
  },

  frame: {
    modifierName: 'frame',
    validComponents: ['*'],
    parameterTypes: {
      0: ['object']
    },
    examples: {
      valid: [
        'VStack({}).frame({ width: 200, height: 100 })',
        'Text("Hello").frame({ minWidth: 100 })',
        'Button("Save").frame({ maxHeight: 44 })'
      ],
      invalid: [
        'VStack({}).frame(null)',
        'Text("Hello").frame("200px")',
        'Button("Save").frame(123)'
      ]
    }
  },

  disabled: {
    modifierName: 'disabled',
    validComponents: ['Button', 'Toggle', 'TextField', 'Slider', 'Picker'],
    parameterTypes: {
      0: ['boolean']
    },
    examples: {
      valid: [
        'Button("Save").disabled(true)',
        'Toggle({}).disabled(isLoading)',
        'TextField({}).disabled(false)'
      ],
      invalid: [
        'Text("Hello").disabled(true)',
        'VStack({}).disabled(false)',
        'Button("Save").disabled("true")'
      ]
    }
  },

  onTap: {
    modifierName: 'onTap',
    validComponents: ['*'],
    parameterTypes: {
      0: ['function']
    },
    examples: {
      valid: [
        'Text("Hello").onTap(handleTap)',
        'VStack({}).onTap(() => {})',
        'Image({}).onTap(showDetails)'
      ],
      invalid: [
        'Text("Hello").onTap("handleTap")',
        'VStack({}).onTap(null)',
        'Image({}).onTap(123)'
      ]
    }
  },

  clipped: {
    modifierName: 'clipped',
    validComponents: ['*'],
    parameterTypes: {},
    noParameters: true,
    examples: {
      valid: [
        'VStack({}).clipped()',
        'Text("Long text").clipped()',
        'Image({}).clipped()'
      ],
      invalid: [
        'VStack({}).clipped(true)',
        'Text("Hello").clipped("overflow")',
        'Image({}).clipped(null)'
      ]
    }
  },

  opacity: {
    modifierName: 'opacity',
    validComponents: ['*'],
    parameterTypes: {
      0: ['number']
    },
    examples: {
      valid: [
        'VStack({}).opacity(0.5)',
        'Text("Hello").opacity(0.8)',
        'Button("Save").opacity(1.0)'
      ],
      invalid: [
        'VStack({}).opacity("0.5")',
        'Text("Hello").opacity(null)',
        'Button("Save").opacity(2.0)' // Should be 0-1
      ]
    }
  }
}

/**
 * Built-in validation rules
 */
export const builtInRules: BuildTimeValidationRule[] = [
  {
    name: 'component-required-args',
    severity: 'error',
    description: 'Validate that components have required arguments',
    validate: (_node, _checker, _context) => {
      // Implementation handled in transformer
      return { valid: true }
    }
  },
  
  {
    name: 'modifier-component-compatibility',
    severity: 'error',
    description: 'Validate that modifiers are compatible with components',
    validate: (_node, _checker, _context) => {
      // Implementation handled in transformer
      return { valid: true }
    }
  },
  
  {
    name: 'parameter-type-validation',
    severity: 'warning',
    description: 'Validate parameter types for components and modifiers',
    validate: (_node, _checker, _context) => {
      // Implementation handled in transformer
      return { valid: true }
    }
  },
  
  {
    name: 'deprecated-usage',
    severity: 'warning',
    description: 'Warn about deprecated component or modifier usage',
    validate: (_node, _checker, _context) => {
      // Check for deprecated patterns
      return { valid: true }
    }
  }
]

/**
 * Validation rule categories
 */
export const ruleCategories = {
  components: [
    'component-required-args',
    'component-parameter-types',
    'component-prop-validation'
  ],
  modifiers: [
    'modifier-component-compatibility',
    'modifier-parameter-types',
    'modifier-chain-validation'
  ],
  performance: [
    'unnecessary-rerenders',
    'large-component-trees',
    'expensive-computations'
  ],
  accessibility: [
    'missing-alt-text',
    'insufficient-contrast',
    'keyboard-navigation'
  ],
  'best-practices': [
    'deprecated-usage',
    'anti-patterns',
    'code-style'
  ]
}

/**
 * Rule severity levels
 */
export const severityLevels = {
  error: ['component-required-args', 'modifier-component-compatibility'],
  warning: ['parameter-type-validation', 'deprecated-usage'],
  info: ['best-practices', 'performance-suggestions']
}

/**
 * Create custom validation rule
 */
export function createCustomRule(
  name: string,
  category: string,
  severity: 'error' | 'warning' | 'info',
  description: string,
  validate: (node: ts.Node, checker: ts.TypeChecker, context: ValidationContext) => ValidationResult
): BuildTimeValidationRule {
  return {
    name,
    severity,
    description,
    validate,
    generateMessage: (error) => `${category}: ${error.message}`,
    suggestFix: () => []
  }
}

/**
 * Rule registry for managing custom rules
 */
export class ValidationRuleRegistry {
  private rules: Map<string, BuildTimeValidationRule> = new Map()
  
  constructor() {
    // Register built-in rules
    for (const rule of builtInRules) {
      this.rules.set(rule.name, rule)
    }
  }
  
  register(rule: BuildTimeValidationRule): void {
    this.rules.set(rule.name, rule)
  }
  
  unregister(name: string): void {
    this.rules.delete(name)
  }
  
  getRule(name: string): BuildTimeValidationRule | undefined {
    return this.rules.get(name)
  }
  
  getAllRules(): BuildTimeValidationRule[] {
    return Array.from(this.rules.values())
  }
  
  getRulesByCategory(category: string): BuildTimeValidationRule[] {
    const categoryRules = ruleCategories[category as keyof typeof ruleCategories] || []
    return categoryRules.map(name => this.rules.get(name)).filter(Boolean) as BuildTimeValidationRule[]
  }
  
  getRulesBySeverity(severity: 'error' | 'warning' | 'info'): BuildTimeValidationRule[] {
    const severityRules = severityLevels[severity] || []
    return severityRules.map(name => this.rules.get(name)).filter(Boolean) as BuildTimeValidationRule[]
  }
}

/**
 * Global rule registry instance
 */
export const globalRuleRegistry = new ValidationRuleRegistry()

/**
 * Helper functions for rule creation
 */
export const RuleHelpers = {
  /**
   * Create a rule that validates component arguments
   */
  createComponentRule(
    componentName: string,
    validator: (args: ts.NodeArray<ts.Expression>) => ValidationResult
  ): BuildTimeValidationRule {
    return createCustomRule(
      `${componentName.toLowerCase()}-validation`,
      'components',
      'error',
      `Validate ${componentName} component usage`,
      (node, checker, _context) => {
        if (ts.isCallExpression(node)) {
          const symbolName = getSymbolName(node.expression, checker)
          if (symbolName === componentName) {
            return validator(node.arguments)
          }
        }
        return { valid: true }
      }
    )
  },
  
  /**
   * Create a rule that validates modifier usage
   */
  createModifierRule(
    modifierName: string,
    validator: (expression: ts.PropertyAccessExpression) => ValidationResult
  ): BuildTimeValidationRule {
    return createCustomRule(
      `${modifierName}-validation`,
      'modifiers',
      'warning',
      `Validate ${modifierName} modifier usage`,
      (node, _checker, _context) => {
        if (ts.isPropertyAccessExpression(node) && node.name.text === modifierName) {
          return validator(node)
        }
        return { valid: true }
      }
    )
  }
}

/**
 * Helper function to get symbol name (shared with transformer)
 */
function getSymbolName(expression: ts.Expression, checker: ts.TypeChecker): string | null {
  if (ts.isIdentifier(expression)) {
    return expression.text
  }
  
  if (ts.isPropertyAccessExpression(expression)) {
    return expression.name.text
  }

  const symbol = checker.getSymbolAtLocation(expression)
  return symbol?.name || null
}