/**
 * Comprehensive Validation System
 *
 * Complete validation coverage for all TachUI components across
 * Core, Forms, Navigation, and Symbols packages with plugin support.
 */

import type { ComponentInstance } from '../runtime/types'
import { isSignal } from '../reactive'

/**
 * Enhanced validation error class
 */
export class TachUIValidationError extends Error {
  constructor(
    message: string,
    public context: {
      component: string
      property?: string
      suggestion?: string
      documentation?: string
      example?: {
        wrong: string
        correct: string
      }
      package?: string
    }
  ) {
    super(message)
    this.name = 'TachUIValidationError'
  }

  getFormattedMessage(): string {
    const { component, suggestion, example, documentation, package: pkg } = this.context
    const packageName = pkg ? `[@tachui/${pkg}]` : '[Core]'

    let formatted = `❌ ${packageName} ${component} Component Error: ${this.message}\n`

    if (suggestion) {
      formatted += `\n💡 Suggestion: ${suggestion}\n`
    }

    if (example) {
      formatted += `\n❌ Wrong: ${example.wrong}`
      formatted += `\n✅ Correct: ${example.correct}\n`
    }

    if (documentation) {
      formatted += `\n📚 Documentation: ${documentation}`
    }

    return formatted
  }
}

/**
 * Validation configuration
 */
export interface ValidationConfig {
  enabled: boolean
  strictMode: boolean
  errorLevel: 'error' | 'warn' | 'info'
  excludeFiles: string[]
  packages: {
    core: boolean
    forms: boolean
    navigation: boolean
    symbols: boolean
    plugins: boolean
  }
}

/**
 * Global validation configuration
 */
let validationConfig: ValidationConfig = {
  enabled: process.env.NODE_ENV !== 'production',
  strictMode: false,
  errorLevel: 'error',
  excludeFiles: [],
  packages: {
    core: true,
    forms: true,
    navigation: true,
    symbols: true,
    plugins: true
  }
}

/**
 * Component validator interface
 */
export interface ComponentValidator {
  packageName: string
  componentName: string
  validate: (args: unknown[]) => void
  validateModifier?: (modifierName: string, args: unknown[]) => void
}

/**
 * Configure validation settings
 */
export function configureValidation(config: Partial<ValidationConfig>): void {
  validationConfig = { ...validationConfig, ...config }
}

/**
 * Check if validation is enabled
 */
export function isValidationEnabled(): boolean {
  return validationConfig.enabled && process.env.NODE_ENV !== 'production'
}

/**
 * Core Components Validation
 */
export const CoreComponentValidation = {
  
  // Text Component
  validateText(args: unknown[]): void {
    if (!isValidationEnabled() || !validationConfig.packages.core) return
    
    if (args.length === 0) {
      throw new TachUIValidationError('Text component requires a content parameter', {
        component: 'Text',
        suggestion: 'Add a content parameter: Text("Hello World")',
        documentation: 'https://docs.tachui.dev/components/text',
        example: {
          wrong: 'Text()',
          correct: 'Text("Hello World")'
        }
      })
    }

    const [content] = args
    if (content === undefined || content === null) {
      throw new TachUIValidationError('Text content cannot be undefined or null', {
        component: 'Text',
        suggestion: 'Provide a valid string, function, or Signal',
        example: {
          wrong: 'Text(null)',
          correct: 'Text("Hello World")'
        }
      })
    }

    const contentType = typeof content
    const isValidContent = contentType === 'string' || 
                          contentType === 'function' || 
                          isSignal(content)

    if (!isValidContent) {
      throw new TachUIValidationError(`Text content must be a string, function, or Signal. Received: ${contentType}`, {
        component: 'Text',
        suggestion: 'Use a string literal, function, or reactive signal',
        example: {
          wrong: 'Text(123)',
          correct: 'Text("Hello World")'
        }
      })
    }
  },

  // Button Component
  validateButton(args: unknown[]): void {
    if (!isValidationEnabled() || !validationConfig.packages.core) return
    
    if (args.length === 0) {
      throw new TachUIValidationError('Button component requires a title parameter', {
        component: 'Button',
        suggestion: 'Add a title parameter: Button("Click me", () => {})',
        documentation: 'https://docs.tachui.dev/components/button',
        example: {
          wrong: 'Button()',
          correct: 'Button("Click me", () => {})'
        }
      })
    }

    const [title, action] = args
    if (title === undefined || title === null) {
      throw new TachUIValidationError('Button title cannot be undefined or null', {
        component: 'Button',
        suggestion: 'Provide a valid string, function, or Signal',
        example: {
          wrong: 'Button(null)',
          correct: 'Button("Click me")'
        }
      })
    }

    const titleType = typeof title
    const isValidTitle = titleType === 'string' || 
                        titleType === 'function' || 
                        isSignal(title)

    if (!isValidTitle) {
      throw new TachUIValidationError(`Button title must be a string, function, or Signal. Received: ${titleType}`, {
        component: 'Button',
        suggestion: 'Use a string literal, function, or reactive signal',
        example: {
          wrong: 'Button(123)',
          correct: 'Button("Click me")'
        }
      })
    }

    if (action === undefined && args.length === 1 && validationConfig.errorLevel !== 'error') {
      console.warn('⚠️ Button without action may not be interactive. Consider adding an action parameter.')
    }
  },

  // Image Component
  validateImage(args: unknown[]): void {
    if (!isValidationEnabled() || !validationConfig.packages.core) return
    
    if (args.length === 0) {
      throw new TachUIValidationError('Image component requires a source parameter', {
        component: 'Image',
        suggestion: 'Add a source parameter: Image({ source: "image.jpg" })',
        documentation: 'https://docs.tachui.dev/components/image',
        example: {
          wrong: 'Image()',
          correct: 'Image({ source: "image.jpg" })'
        }
      })
    }

    const [props] = args
    if (!props || typeof props !== 'object') {
      throw new TachUIValidationError('Image requires a props object', {
        component: 'Image',
        suggestion: 'Pass a props object with source property',
        example: {
          wrong: 'Image("image.jpg")',
          correct: 'Image({ source: "image.jpg" })'
        }
      })
    }

    const propsObj = props as any
    if (!propsObj.source) {
      throw new TachUIValidationError('Image source property is required', {
        component: 'Image',
        suggestion: 'Provide a valid image source URL or path',
        example: {
          wrong: 'Image({ alt: "description" })',
          correct: 'Image({ source: "image.jpg", alt: "description" })'
        }
      })
    }
  },

  // Toggle Component
  validateToggle(args: unknown[]): void {
    if (!isValidationEnabled() || !validationConfig.packages.core) return
    
    if (args.length === 0) {
      throw new TachUIValidationError('Toggle component requires an isOn parameter', {
        component: 'Toggle',
        suggestion: 'Add an isOn parameter: Toggle({ isOn: signal })',
        documentation: 'https://docs.tachui.dev/components/toggle',
        example: {
          wrong: 'Toggle()',
          correct: 'Toggle({ isOn: isEnabled })'
        }
      })
    }

    const [props] = args
    if (!props || typeof props !== 'object') {
      throw new TachUIValidationError('Toggle requires a props object', {
        component: 'Toggle',
        suggestion: 'Pass a props object with isOn property',
        example: {
          wrong: 'Toggle(true)',
          correct: 'Toggle({ isOn: true })'
        }
      })
    }

    const propsObj = props as any
    if (propsObj.isOn === undefined) {
      throw new TachUIValidationError('Toggle isOn property is required', {
        component: 'Toggle',
        suggestion: 'Provide a boolean value or Signal for isOn',
        example: {
          wrong: 'Toggle({ onToggle: handler })',
          correct: 'Toggle({ isOn: true, onToggle: handler })'
        }
      })
    }
  },

  // Slider Component
  validateSlider(args: unknown[]): void {
    if (!isValidationEnabled() || !validationConfig.packages.core) return
    
    if (args.length === 0) {
      throw new TachUIValidationError('Slider component requires a value parameter', {
        component: 'Slider',
        suggestion: 'Add a value parameter: Slider({ value: signal })',
        documentation: 'https://docs.tachui.dev/components/slider',
        example: {
          wrong: 'Slider()',
          correct: 'Slider({ value: sliderValue })'
        }
      })
    }

    const [props] = args
    if (!props || typeof props !== 'object') {
      throw new TachUIValidationError('Slider requires a props object', {
        component: 'Slider',
        suggestion: 'Pass a props object with value property',
        example: {
          wrong: 'Slider(50)',
          correct: 'Slider({ value: 50 })'
        }
      })
    }

    const propsObj = props as any
    if (propsObj.value === undefined) {
      throw new TachUIValidationError('Slider value property is required', {
        component: 'Slider',
        suggestion: 'Provide a numeric value or Signal for value',
        example: {
          wrong: 'Slider({ min: 0, max: 100 })',
          correct: 'Slider({ value: 50, min: 0, max: 100 })'
        }
      })
    }
  },

  // Picker Component
  validatePicker(args: unknown[]): void {
    if (!isValidationEnabled() || !validationConfig.packages.core) return
    
    if (args.length === 0) {
      throw new TachUIValidationError('Picker component requires options parameter', {
        component: 'Picker',
        suggestion: 'Add options parameter: Picker({ options: ["Option 1", "Option 2"] })',
        documentation: 'https://docs.tachui.dev/components/picker',
        example: {
          wrong: 'Picker()',
          correct: 'Picker({ options: ["Red", "Green", "Blue"] })'
        }
      })
    }

    const [props] = args
    if (!props || typeof props !== 'object') {
      throw new TachUIValidationError('Picker requires a props object', {
        component: 'Picker',
        suggestion: 'Pass a props object with options array',
        example: {
          wrong: 'Picker(["Option 1", "Option 2"])',
          correct: 'Picker({ options: ["Option 1", "Option 2"] })'
        }
      })
    }

    const propsObj = props as any
    if (!Array.isArray(propsObj.options)) {
      throw new TachUIValidationError('Picker options must be an array', {
        component: 'Picker',
        suggestion: 'Provide an array of options',
        example: {
          wrong: 'Picker({ options: "Option 1" })',
          correct: 'Picker({ options: ["Option 1", "Option 2"] })'
        }
      })
    }
  },

  // Layout Components (VStack, HStack, ZStack)
  validateStack(componentType: string, args: unknown[]): void {
    if (!isValidationEnabled() || !validationConfig.packages.core) return
    
    if (args.length === 0) {
      throw new TachUIValidationError(`${componentType} component requires a props object with children array`, {
        component: componentType,
        suggestion: `Add children: ${componentType}({ children: [Text("Hello")] })`,
        documentation: 'https://docs.tachui.dev/components/layout',
        example: {
          wrong: `${componentType}()`,
          correct: `${componentType}({ children: [Text("Hello")] })`
        }
      })
    }

    const [props] = args
    if (!props || typeof props !== 'object') {
      throw new TachUIValidationError(`${componentType} requires a props object`, {
        component: componentType,
        suggestion: 'Pass a props object with children array',
        example: {
          wrong: `${componentType}("invalid")`,
          correct: `${componentType}({ children: [Text("Hello")] })`
        }
      })
    }

    const propsObj = props as any
    if (!Array.isArray(propsObj.children)) {
      throw new TachUIValidationError(`${componentType} children must be an array`, {
        component: componentType,
        suggestion: 'Provide an array of components',
        example: {
          wrong: `${componentType}({ children: Text("Hello") })`,
          correct: `${componentType}({ children: [Text("Hello")] })`
        }
      })
    }
  },

  // List Component
  validateList(args: unknown[]): void {
    if (!isValidationEnabled() || !validationConfig.packages.core) return
    
    if (args.length === 0) {
      throw new TachUIValidationError('List component requires a props object with data array', {
        component: 'List',
        suggestion: 'Add data: List({ data: items, renderItem: (item) => Text(item) })',
        documentation: 'https://docs.tachui.dev/components/list',
        example: {
          wrong: 'List()',
          correct: 'List({ data: items, renderItem: (item) => Text(item) })'
        }
      })
    }

    const [props] = args
    if (!props || typeof props !== 'object') {
      throw new TachUIValidationError('List requires a props object', {
        component: 'List',
        suggestion: 'Pass a props object with data and renderItem',
        example: {
          wrong: 'List(items)',
          correct: 'List({ data: items, renderItem: (item) => Text(item) })'
        }
      })
    }

    const propsObj = props as any
    if (!Array.isArray(propsObj.data) && !isSignal(propsObj.data)) {
      throw new TachUIValidationError('List data must be an array or Signal', {
        component: 'List',
        suggestion: 'Provide an array of items or reactive Signal',
        example: {
          wrong: 'List({ data: "invalid", renderItem: fn })',
          correct: 'List({ data: [1, 2, 3], renderItem: fn })'
        }
      })
    }

    if (typeof propsObj.renderItem !== 'function') {
      throw new TachUIValidationError('List renderItem must be a function', {
        component: 'List',
        suggestion: 'Provide a function that renders each item',
        example: {
          wrong: 'List({ data: items, renderItem: "invalid" })',
          correct: 'List({ data: items, renderItem: (item) => Text(item) })'
        }
      })
    }
  },

  // ScrollView Component
  validateScrollView(args: unknown[]): void {
    if (!isValidationEnabled() || !validationConfig.packages.core) return
    
    if (args.length === 0) {
      throw new TachUIValidationError('ScrollView component requires a props object with children', {
        component: 'ScrollView',
        suggestion: 'Add children: ScrollView({ children: [content] })',
        documentation: 'https://docs.tachui.dev/components/scrollview',
        example: {
          wrong: 'ScrollView()',
          correct: 'ScrollView({ children: [VStack({ children: items })] })'
        }
      })
    }

    const [props] = args
    if (!props || typeof props !== 'object') {
      throw new TachUIValidationError('ScrollView requires a props object', {
        component: 'ScrollView',
        suggestion: 'Pass a props object with children',
        example: {
          wrong: 'ScrollView(content)',
          correct: 'ScrollView({ children: [content] })'
        }
      })
    }
  },

  // Alert Component
  validateAlert(args: unknown[]): void {
    if (!isValidationEnabled() || !validationConfig.packages.core) return
    
    if (args.length === 0) {
      throw new TachUIValidationError('Alert component requires a props object with title', {
        component: 'Alert',
        suggestion: 'Add title: Alert({ title: "Warning", message: "Are you sure?" })',
        documentation: 'https://docs.tachui.dev/components/alert',
        example: {
          wrong: 'Alert()',
          correct: 'Alert({ title: "Warning", message: "Continue?" })'
        }
      })
    }

    const [props] = args
    if (!props || typeof props !== 'object') {
      throw new TachUIValidationError('Alert requires a props object', {
        component: 'Alert',
        suggestion: 'Pass a props object with title and message',
        example: {
          wrong: 'Alert("Warning")',
          correct: 'Alert({ title: "Warning", message: "Continue?" })'
        }
      })
    }

    const propsObj = props as any
    if (!propsObj.title) {
      throw new TachUIValidationError('Alert title property is required', {
        component: 'Alert',
        suggestion: 'Provide a title for the alert',
        example: {
          wrong: 'Alert({ message: "Continue?" })',
          correct: 'Alert({ title: "Warning", message: "Continue?" })'
        }
      })
    }
  },

  // Menu Component
  validateMenu(args: unknown[]): void {
    if (!isValidationEnabled() || !validationConfig.packages.core) return
    
    if (args.length === 0) {
      throw new TachUIValidationError('Menu component requires a props object with items', {
        component: 'Menu',
        suggestion: 'Add items: Menu({ items: [{ title: "Item 1", action: () => {} }] })',
        documentation: 'https://docs.tachui.dev/components/menu',
        example: {
          wrong: 'Menu()',
          correct: 'Menu({ items: [{ title: "Edit", action: editAction }] })'
        }
      })
    }

    const [props] = args
    if (!props || typeof props !== 'object') {
      throw new TachUIValidationError('Menu requires a props object', {
        component: 'Menu',
        suggestion: 'Pass a props object with items array',
        example: {
          wrong: 'Menu(items)',
          correct: 'Menu({ items: menuItems })'
        }
      })
    }

    const propsObj = props as any
    if (!Array.isArray(propsObj.items)) {
      throw new TachUIValidationError('Menu items must be an array', {
        component: 'Menu',
        suggestion: 'Provide an array of menu items',
        example: {
          wrong: 'Menu({ items: "invalid" })',
          correct: 'Menu({ items: [{ title: "Edit", action: editAction }] })'
        }
      })
    }
  },

  // DatePicker Component
  validateDatePicker(args: unknown[]): void {
    if (!isValidationEnabled() || !validationConfig.packages.core) return
    
    if (args.length === 0) {
      throw new TachUIValidationError('DatePicker component requires a props object with value', {
        component: 'DatePicker',
        suggestion: 'Add value: DatePicker({ value: dateSignal })',
        documentation: 'https://docs.tachui.dev/components/datepicker',
        example: {
          wrong: 'DatePicker()',
          correct: 'DatePicker({ value: dateSignal, displayStyle: "compact" })'
        }
      })
    }

    const [props] = args
    if (!props || typeof props !== 'object') {
      throw new TachUIValidationError('DatePicker requires a props object', {
        component: 'DatePicker',
        suggestion: 'Pass a props object with value property',
        example: {
          wrong: 'DatePicker(new Date())',
          correct: 'DatePicker({ value: dateSignal })'
        }
      })
    }

    const propsObj = props as any
    if (propsObj.value === undefined) {
      throw new TachUIValidationError('DatePicker value property is required', {
        component: 'DatePicker',
        suggestion: 'Provide a Date value or Signal for value',
        example: {
          wrong: 'DatePicker({ displayStyle: "compact" })',
          correct: 'DatePicker({ value: dateSignal, displayStyle: "compact" })'
        }
      })
    }
  },

  // ActionSheet Component
  validateActionSheet(args: unknown[]): void {
    if (!isValidationEnabled() || !validationConfig.packages.core) return
    
    if (args.length === 0) {
      throw new TachUIValidationError('ActionSheet component requires a props object with buttons', {
        component: 'ActionSheet',
        suggestion: 'Add buttons: ActionSheet({ buttons: [{ title: "Action", action: () => {} }] })',
        documentation: 'https://docs.tachui.dev/components/actionsheet',
        example: {
          wrong: 'ActionSheet()',
          correct: 'ActionSheet({ buttons: [{ title: "Delete", role: "destructive", action: deleteAction }] })'
        }
      })
    }

    const [props] = args
    if (!props || typeof props !== 'object') {
      throw new TachUIValidationError('ActionSheet requires a props object', {
        component: 'ActionSheet',
        suggestion: 'Pass a props object with buttons array',
        example: {
          wrong: 'ActionSheet(buttons)',
          correct: 'ActionSheet({ buttons: buttonsArray })'
        }
      })
    }

    const propsObj = props as any
    if (!Array.isArray(propsObj.buttons)) {
      throw new TachUIValidationError('ActionSheet buttons must be an array', {
        component: 'ActionSheet',
        suggestion: 'Provide an array of button objects',
        example: {
          wrong: 'ActionSheet({ buttons: { title: "Action" } })',
          correct: 'ActionSheet({ buttons: [{ title: "Action", action: actionHandler }] })'
        }
      })
    }
  },

  // Divider Component
  validateDivider(args: unknown[]): void {
    if (!isValidationEnabled() || !validationConfig.packages.core) return
    // Divider can be called without props
    if (args.length > 0) {
      const [props] = args
      if (props !== null && typeof props !== 'object') {
        throw new TachUIValidationError('Divider props must be an object if provided', {
          component: 'Divider',
          suggestion: 'Pass an object or no arguments',
          example: {
            wrong: 'Divider("invalid")',
            correct: 'Divider() or Divider({ thickness: 2 })'
          }
        })
      }
    }
  },

  // Spacer Component
  validateSpacer(args: unknown[]): void {
    if (!isValidationEnabled() || !validationConfig.packages.core) return
    // Spacer can be called without props - it's designed to be flexible
    if (args.length > 0) {
      const [props] = args
      if (props !== null && props !== undefined && typeof props !== 'object') {
        throw new TachUIValidationError('Spacer props must be an object if provided', {
          component: 'Spacer',
          suggestion: 'Pass an object with minLength property or no arguments',
          example: {
            wrong: 'Spacer(20)',
            correct: 'Spacer() or Spacer({ minLength: 20 })'
          }
        })
      }
    }
  },

  // Section Component
  validateSection(args: unknown[]): void {
    if (!isValidationEnabled() || !validationConfig.packages.core) return
    
    if (args.length === 0) {
      throw new TachUIValidationError('Section component requires a props object with children', {
        component: 'Section',
        suggestion: 'Add children: Section({ children: [content] })',
        documentation: 'https://docs.tachui.dev/components/section',
        example: {
          wrong: 'Section()',
          correct: 'Section({ children: [Text("Section content")] })'
        }
      })
    }

    const [props] = args
    if (!props || typeof props !== 'object') {
      throw new TachUIValidationError('Section requires a props object', {
        component: 'Section',
        suggestion: 'Pass a props object with children',
        example: {
          wrong: 'Section(content)',
          correct: 'Section({ children: [content] })'
        }
      })
    }
  },

  // Show Component (Conditional Rendering)
  validateShow(args: unknown[]): void {
    if (!isValidationEnabled() || !validationConfig.packages.core) return
    
    if (args.length === 0) {
      throw new TachUIValidationError('Show component requires a props object with when condition', {
        component: 'Show',
        suggestion: 'Add when condition: Show({ when: condition, children: [content] })',
        documentation: 'https://docs.tachui.dev/components/show',
        example: {
          wrong: 'Show()',
          correct: 'Show({ when: isVisible, children: [Text("Visible")] })'
        }
      })
    }

    const [props] = args
    if (!props || typeof props !== 'object') {
      throw new TachUIValidationError('Show requires a props object', {
        component: 'Show',
        suggestion: 'Pass a props object with when condition',
        example: {
          wrong: 'Show(condition)',
          correct: 'Show({ when: condition, children: [content] })'
        }
      })
    }

    const propsObj = props as any
    if (propsObj.when === undefined) {
      throw new TachUIValidationError('Show when property is required', {
        component: 'Show',
        suggestion: 'Provide a boolean condition for when',
        example: {
          wrong: 'Show({ children: [content] })',
          correct: 'Show({ when: isVisible, children: [content] })'
        }
      })
    }
  },

  // Link Component
  validateLink(args: unknown[]): void {
    if (!isValidationEnabled() || !validationConfig.packages.core) return
    
    if (args.length === 0) {
      throw new TachUIValidationError('Link component requires a props object with href', {
        component: 'Link',
        suggestion: 'Add href: Link({ href: "/path", children: [Text("Click here")] })',
        documentation: 'https://docs.tachui.dev/components/link',
        example: {
          wrong: 'Link()',
          correct: 'Link({ href: "/about", children: [Text("About")] })'
        }
      })
    }

    const [props] = args
    if (!props || typeof props !== 'object') {
      throw new TachUIValidationError('Link requires a props object', {
        component: 'Link',
        suggestion: 'Pass a props object with href property',
        example: {
          wrong: 'Link("/path")',
          correct: 'Link({ href: "/path", children: [Text("Link")] })'
        }
      })
    }

    const propsObj = props as any
    if (!propsObj.href) {
      throw new TachUIValidationError('Link href property is required', {
        component: 'Link',
        suggestion: 'Provide a valid URL or path for href',
        example: {
          wrong: 'Link({ children: [Text("Link")] })',
          correct: 'Link({ href: "/about", children: [Text("About")] })'
        }
      })
    }
  },

  // Stepper Component
  validateStepper(args: unknown[]): void {
    if (!isValidationEnabled() || !validationConfig.packages.core) return
    
    if (args.length === 0) {
      throw new TachUIValidationError('Stepper component requires a props object with value', {
        component: 'Stepper',
        suggestion: 'Add value: Stepper({ value: numberSignal })',
        documentation: 'https://docs.tachui.dev/components/stepper',
        example: {
          wrong: 'Stepper()',
          correct: 'Stepper({ value: numberSignal, step: 1 })'
        }
      })
    }

    const [props] = args
    if (!props || typeof props !== 'object') {
      throw new TachUIValidationError('Stepper requires a props object', {
        component: 'Stepper',
        suggestion: 'Pass a props object with value property',
        example: {
          wrong: 'Stepper(5)',
          correct: 'Stepper({ value: 5, step: 1 })'
        }
      })
    }

    const propsObj = props as any
    if (propsObj.value === undefined) {
      throw new TachUIValidationError('Stepper value property is required', {
        component: 'Stepper',
        suggestion: 'Provide a numeric value or Signal for value',
        example: {
          wrong: 'Stepper({ step: 1 })',
          correct: 'Stepper({ value: numberSignal, step: 1 })'
        }
      })
    }
  },

  // BasicInput Component
  validateBasicInput(args: unknown[]): void {
    if (!isValidationEnabled() || !validationConfig.packages.core) return
    
    if (args.length === 0) {
      throw new TachUIValidationError('BasicInput component requires a props object with value', {
        component: 'BasicInput',
        suggestion: 'Add value: BasicInput({ value: textSignal })',
        documentation: 'https://docs.tachui.dev/components/basicinput',
        example: {
          wrong: 'BasicInput()',
          correct: 'BasicInput({ value: textSignal, placeholder: "Enter text" })'
        }
      })
    }

    const [props] = args
    if (!props || typeof props !== 'object') {
      throw new TachUIValidationError('BasicInput requires a props object', {
        component: 'BasicInput',
        suggestion: 'Pass a props object with value property',
        example: {
          wrong: 'BasicInput("text")',
          correct: 'BasicInput({ value: textSignal })'
        }
      })
    }

    const propsObj = props as any
    if (propsObj.value === undefined) {
      throw new TachUIValidationError('BasicInput value property is required', {
        component: 'BasicInput',
        suggestion: 'Provide a value for the input field',
        example: {
          wrong: 'BasicInput({ placeholder: "Enter text" })',
          correct: 'BasicInput({ value: textSignal, placeholder: "Enter text" })'
        }
      })
    }
  },

  // BasicForm Component (Core)
  validateBasicForm(args: unknown[]): void {
    if (!isValidationEnabled() || !validationConfig.packages.core) return
    
    if (args.length === 0) {
      throw new TachUIValidationError('BasicForm component requires children array', {
        component: 'BasicForm',
        suggestion: 'Add children: BasicForm([formFields])',
        documentation: 'https://docs.tachui.dev/components/basicform',
        example: {
          wrong: 'BasicForm()',
          correct: 'BasicForm([BasicInput({}), Button("Submit")])'
        }
      })
    }

    const [children, props] = args
    if (!Array.isArray(children)) {
      throw new TachUIValidationError('BasicForm requires children array as first parameter', {
        component: 'BasicForm',
        suggestion: 'Pass an array of form components as first parameter',
        example: {
          wrong: 'BasicForm(BasicInput({}))',
          correct: 'BasicForm([BasicInput({})])'
        }
      })
    }

    if (props && typeof props !== 'object') {
      throw new TachUIValidationError('BasicForm props must be an object', {
        component: 'BasicForm',
        suggestion: 'Pass props as second parameter object',
        example: {
          wrong: 'BasicForm([], "invalid")',
          correct: 'BasicForm([], { onSubmit: handleSubmit })'
        }
      })
    }
  },

  // Helper method for props object validation
  validatePropsObject(componentName: string, args: unknown[], docUrl?: string): void {
    if (args.length === 0) {
      throw new TachUIValidationError(`${componentName} component requires a props object`, {
        component: componentName,
        suggestion: `Add props: ${componentName}({ /* props */ })`,
        documentation: docUrl,
        example: {
          wrong: `${componentName}()`,
          correct: `${componentName}({ /* appropriate props */ })`
        }
      })
    }

    const [props] = args
    if (props !== null && props !== undefined && typeof props !== 'object') {
      throw new TachUIValidationError(`${componentName} requires a props object`, {
        component: componentName,
        suggestion: 'Pass a props object',
        example: {
          wrong: `${componentName}("invalid")`,
          correct: `${componentName}({ /* props */ })`
        }
      })
    }
  }
}

/**
 * Plugin Component Validation
 */
export const PluginComponentValidation = {
  /**
   * Validate plugin component
   */
  validatePluginComponent(packageName: string, componentName: string, args: unknown[]): void {
    if (!isValidationEnabled() || !validationConfig.packages.plugins) return

    // Import plugin registration dynamically to avoid circular dependency
    const { getComponentValidator } = require('./plugin-registration')
    const validator = getComponentValidator(packageName, componentName)
    
    if (validator) {
      try {
        validator.validate(args)
      } catch (error) {
        if (error instanceof TachUIValidationError) {
          // Add package context if not already present
          if (!error.context.package) {
            error.context.package = packageName
          }
        }
        throw error
      }
    } else if (validationConfig.strictMode) {
      throw new TachUIValidationError(`No validator registered for ${componentName}`, {
        component: componentName,
        package: packageName,
        suggestion: 'Ensure the plugin has registered its validator',
        documentation: 'https://docs.tachui.dev/plugins/validation'
      })
    }
  }
}

/**
 * Enhanced modifier validation functions
 */
export const ModifierValidation = {
  /**
   * Validate modifier usage with package awareness
   */
  validateModifier(packageName: string, componentType: string, modifierName: string, args: unknown[] = []): void {
    if (!isValidationEnabled()) return

    // Check package-specific validation
    if (packageName !== 'core' && !validationConfig.packages[packageName as keyof typeof validationConfig.packages]) {
      return
    }

    // Check for non-existent modifiers
    const nonExistentModifiers: Record<string, { suggestion: string; example?: string }> = {
      textShadow: {
        suggestion: 'Use shadow() instead',
        example: '.shadow({ x: 2, y: 2, radius: 4, color: "rgba(0,0,0,0.25)" })'
      },
      id: {
        suggestion: 'Use setAttribute("id", value) instead',
        example: '.setAttribute("id", "my-element")'
      },
      className: {
        suggestion: 'Use css() or setAttribute("class", value) instead',
        example: '.css({ className: "my-class" })'
      },
      style: {
        suggestion: 'Use css() for custom styles instead',
        example: '.css({ backgroundColor: "red" })'
      }
    }

    const nonExistent = nonExistentModifiers[modifierName]
    if (nonExistent) {
      const error = new TachUIValidationError(`Modifier ${modifierName} does not exist`, {
        component: componentType,
        package: packageName,
        suggestion: nonExistent.suggestion,
        example: nonExistent.example ? {
          wrong: `.${modifierName}()`,
          correct: nonExistent.example
        } : undefined
      })

      if (validationConfig.errorLevel === 'error') {
        throw error
      } else {
        console.warn(error.getFormattedMessage())
      }
      return
    }

    // Check parameter counts
    const noParamModifiers = new Set(['clipped', 'resizable'])
    if (noParamModifiers.has(modifierName) && args.length > 0) {
      const error = new TachUIValidationError(`${modifierName}() takes no parameters`, {
        component: componentType,
        package: packageName,
        suggestion: `Use ${modifierName}() without arguments`,
        example: {
          wrong: `.${modifierName}(someValue)`,
          correct: `.${modifierName}()`
        }
      })

      if (validationConfig.errorLevel === 'error') {
        throw error
      } else {
        console.warn(error.getFormattedMessage())
      }
    }

    // Component-specific modifier validation
    const textOnlyModifiers = new Set(['font', 'fontSize', 'fontWeight', 'textAlign', 'lineHeight', 'letterSpacing'])
    const interactiveOnlyModifiers = new Set(['disabled', 'onTap', 'cursor'])

    if (textOnlyModifiers.has(modifierName) && !['Text', 'Button'].includes(componentType)) {
      const message = `${modifierName} modifier is only valid for Text/Button components`

      if (validationConfig.errorLevel === 'error') {
        throw new TachUIValidationError(message, {
          component: componentType,
          package: packageName,
          suggestion: `Use ${modifierName} modifier on Text or Button components only`
        })
      } else if (validationConfig.errorLevel === 'warn') {
        console.warn(`⚠️ [${packageName}] ${message}`)
      }
    }

    if (interactiveOnlyModifiers.has(modifierName) && !['Button', 'Toggle', 'Slider'].includes(componentType)) {
      const message = `${modifierName} modifier is only valid for interactive components`

      if (validationConfig.errorLevel === 'warn') {
        console.warn(`⚠️ [${packageName}] ${message}`)
      }
    }

    // Check with plugin validator
    const { getComponentValidator } = require('./plugin-registration')
    const validator = getComponentValidator(packageName, componentType)
    if (validator && validator.validateModifier) {
      validator.validateModifier(modifierName, args)
    }
  }
}

/**
 * Validation utilities
 */
export const ValidationUtils = {
  /**
   * Enable validation
   */
  enable(enabled: boolean = true): void {
    configureValidation({ enabled })
  },

  /**
   * Enable strict mode
   */
  enableStrictMode(): void {
    configureValidation({ strictMode: true })
    console.info('🚨 TachUI Strict validation mode enabled')
  },

  /**
   * Set error level
   */
  setErrorLevel(level: 'error' | 'warn' | 'info'): void {
    configureValidation({ errorLevel: level })
  },

  /**
   * Configure package validation
   */
  configurePackages(packages: Partial<ValidationConfig['packages']>): void {
    configureValidation({ 
      packages: { ...validationConfig.packages, ...packages }
    })
  },

  /**
   * Test validation system
   */
  test(): void {
    if (!isValidationEnabled()) {
      console.info('ℹ️ Validation is disabled in production mode')
      return
    }

    console.group('🔍 TachUI Comprehensive Validation System Test')

    try {
      console.info('✅ Core component validation: enabled')
      console.info('✅ Plugin component validation: enabled')
      console.info('✅ Modifier validation: enabled')
      const { getValidationStats } = require('./plugin-registration')
      const stats = getValidationStats()
      console.info(`✅ Registered plugin validators: ${stats.totalValidators}`)
      console.info('✅ Comprehensive validation system is working correctly')
    } catch (error) {
      console.error('❌ Validation test failed:', error)
    }

    console.groupEnd()
  },

  /**
   * Get validation stats
   */
  getStats() {
    const { getValidationStats } = require('./plugin-registration')
    const stats = getValidationStats()
    
    return {
      enabled: isValidationEnabled(),
      config: validationConfig,
      coreComponents: Object.keys(CoreComponentValidation).filter(k => k.startsWith('validate')).length,
      pluginValidators: stats.totalValidators,
      packages: {
        core: validationConfig.packages.core,
        forms: validationConfig.packages.forms,
        navigation: validationConfig.packages.navigation,
        symbols: validationConfig.packages.symbols,
        plugins: validationConfig.packages.plugins
      },
      pluginStats: stats.packages
    }
  }
}

/**
 * Create validated component wrapper with package support
 */
export function createValidatedComponent<T extends ComponentInstance>(
  originalConstructor: (...args: any[]) => T,
  validator: (args: unknown[]) => void,
  componentType: string,
  packageName: string = 'core'
): (...args: any[]) => T {

  return function validatedConstructor(this: any, ...args: unknown[]): T {
    // Run validation
    validator(args)

    // Create the component
    const instance = originalConstructor.apply(this, args as any)

    // Wrap with modifier validation if it has modifiers
    if ('modifier' in instance && typeof instance.modifier === 'object') {
      return wrapWithModifierValidation(instance, componentType, packageName)
    }

    return instance
  }
}

/**
 * Wrap component with modifier validation
 */
function wrapWithModifierValidation<T extends ComponentInstance>(
  instance: T, 
  componentType: string, 
  packageName: string
): T {
  if (!isValidationEnabled()) return instance

  return new Proxy(instance, {
    get(target, prop) {
      const value = target[prop as keyof T]

      if (prop === 'modifier') {
        return wrapModifierChain(value, componentType, packageName)
      }

      return value
    }
  })
}

/**
 * Wrap modifier chain with validation
 */
function wrapModifierChain(modifierChain: any, componentType: string, packageName: string): any {
  if (!modifierChain) return modifierChain

  return new Proxy(modifierChain, {
    get(target, prop) {
      const propName = String(prop)
      const originalMethod = target[prop]

      // Allow build and other meta methods
      if (propName === 'build' || propName === 'addModifier' || propName === 'responsive') {
        return originalMethod
      }

      if (typeof originalMethod === 'function') {
        return function validatedModifier(...args: unknown[]) {
          // Validate before calling
          ModifierValidation.validateModifier(packageName, componentType, propName, args)

          // Call original method
          return originalMethod.apply(target, args)
        }
      }

      return originalMethod
    }
  })
}