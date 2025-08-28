/**
 * Enhanced DOM Code Generator (Phase 2.2.1)
 *
 * Advanced code generation with:
 * - Conditional rendering to reactive effects
 * - List rendering with keyed updates
 * - State binding integration
 * - Property wrapper code generation
 * - Optimized reactive DOM updates
 */

import type {
  ASTNode,
  ComponentNode,
  ConditionalNode,
  Expression,
  ForEachNode,
  LiteralExpression,
  ModifierNode,
  PropertyWrapperNode,
  StateBindingNode,
  TransformOptions,
} from './types'

export interface EnhancedCodegenResult {
  code: string
  map?: any
  dependencies: string[]
  exports: string[]
}

export interface EnhancedCodegenOptions extends TransformOptions {
  sourceFile?: string
  optimizeUpdates?: boolean
  generateKeyedLists?: boolean
}

/**
 * Enhanced DOM code generator with advanced reactive features
 */
export class EnhancedDOMCodeGenerator {
  private options: EnhancedCodegenOptions
  private imports = new Set<string>()
  private variables: string[] = []
  private code: string[] = []
  private indentLevel = 0
  private dependencies = new Set<string>()
  private exports = new Set<string>()

  constructor(options: EnhancedCodegenOptions) {
    this.options = options
  }

  /**
   * Generate enhanced reactive DOM code from AST
   */
  generate(nodes: ASTNode[]): EnhancedCodegenResult {
    this.reset()

    // Add enhanced reactive imports
    this.addImport(
      'createSignal, createEffect, createComputed, createRoot, batch',
      '@tachui/core/reactive'
    )

    // Generate code for each node with enhanced features
    nodes.forEach((node) => this.generateEnhancedNode(node))

    // Generate component mount function
    this.generateMountFunction()

    // Combine everything
    const generatedCode = this.buildFinalCode()

    return {
      code: generatedCode,
      map: this.options.sourceMaps ? this.generateSourceMap() : undefined,
      dependencies: Array.from(this.dependencies),
      exports: Array.from(this.exports),
    }
  }

  /**
   * Generate code for enhanced AST nodes
   */
  private generateEnhancedNode(node: ASTNode): void {
    switch (node.type) {
      case 'Component':
        this.generateEnhancedComponent(node as ComponentNode)
        break
      case 'Conditional':
        this.generateConditionalRendering(node as ConditionalNode)
        break
      case 'ForEach':
        this.generateListRendering(node as ForEachNode)
        break
      case 'PropertyWrapper':
        this.generatePropertyWrapper(node as PropertyWrapperNode)
        break
      case 'StateBinding':
        this.generateStateBinding(node as StateBindingNode)
        break
      default:
        // Handle other node types
        break
    }
  }

  /**
   * Generate conditional rendering with reactive effects
   */
  private generateConditionalRendering(node: ConditionalNode): void {
    const conditionVar = this.createVariable('condition')
    const containerVar = this.createVariable('conditionalContainer')

    this.addLine(`// Conditional rendering`)
    this.addLine(`const ${containerVar} = document.createElement('div')`)
    this.addLine(`${containerVar}.className = 'tachui-conditional'`)

    // Generate reactive condition tracking
    const condition = this.expressionToCode(node.condition)
    this.addLine(`const ${conditionVar} = createComputed(() => ${condition})`)

    // Generate reactive effect for conditional content
    this.addLine(`createEffect(() => {`)
    this.indent()
    this.addLine(`// Clear previous content`)
    this.addLine(`${containerVar}.innerHTML = ''`)
    this.addEmptyLine()

    this.addLine(`if (${conditionVar}()) {`)
    this.indent()
    this.addLine(`// Render then body`)
    node.thenBody.forEach((child) => {
      this.generateEnhancedNode(child)
      const childVar = this.getLastVariable()
      if (childVar) {
        this.addLine(`${containerVar}.appendChild(${childVar})`)
      }
    })
    this.dedent()

    if (node.elseBody && node.elseBody.length > 0) {
      this.addLine(`} else {`)
      this.indent()
      this.addLine(`// Render else body`)
      node.elseBody.forEach((child) => {
        this.generateEnhancedNode(child)
        const childVar = this.getLastVariable()
        if (childVar) {
          this.addLine(`${containerVar}.appendChild(${childVar})`)
        }
      })
      this.dedent()
    }

    this.addLine(`}`)
    this.dedent()
    this.addLine(`})`)
    this.addEmptyLine()
  }

  /**
   * Generate list rendering with keyed updates
   */
  private generateListRendering(node: ForEachNode): void {
    const listVar = this.createVariable('listContainer')
    const itemsVar = this.createVariable('items')
    const renderedItemsVar = this.createVariable('renderedItems')

    this.addLine(`// List rendering with keyed updates`)
    this.addLine(`const ${listVar} = document.createElement('div')`)
    this.addLine(`${listVar}.className = 'tachui-list'`)

    // Track rendered items for efficient updates
    this.addLine(`let ${renderedItemsVar} = new Map()`)

    // Generate reactive list tracking
    const iterable = this.expressionToCode(node.iterable)
    this.addLine(`const ${itemsVar} = createComputed(() => ${iterable})`)

    // Generate efficient list update effect
    this.addLine(`createEffect(() => {`)
    this.indent()
    this.addLine(`const currentItems = ${itemsVar}()`)
    this.addLine(`const newRenderedItems = new Map()`)
    this.addEmptyLine()

    this.addLine(`// Update existing items and create new ones`)
    this.addLine(`currentItems.forEach((${node.itemIdentifier}, index) => {`)
    this.indent()

    if (this.options.generateKeyedLists) {
      this.addLine(`const key = ${node.itemIdentifier}.id || index`)
      this.addLine(`let itemElement = ${renderedItemsVar}.get(key)`)
      this.addEmptyLine()
      this.addLine(`if (!itemElement) {`)
      this.indent()
      this.addLine(`// Create new item element`)
      this.generateListItemContent(node)
      const itemVar = this.getLastVariable()
      this.addLine(`itemElement = ${itemVar}`)
      this.dedent()
      this.addLine(`}`)
      this.addEmptyLine()
      this.addLine(`newRenderedItems.set(key, itemElement)`)
      this.addLine(`${listVar}.appendChild(itemElement)`)
    } else {
      this.addLine(`// Simple list item generation`)
      this.generateListItemContent(node)
      const itemVar = this.getLastVariable()
      this.addLine(`${listVar}.appendChild(${itemVar})`)
    }

    this.dedent()
    this.addLine(`})`)
    this.addEmptyLine()

    if (this.options.generateKeyedLists) {
      this.addLine(`// Remove items that are no longer in the list`)
      this.addLine(`${renderedItemsVar}.forEach((element, key) => {`)
      this.indent()
      this.addLine(`if (!newRenderedItems.has(key)) {`)
      this.indent()
      this.addLine(`element.remove()`)
      this.dedent()
      this.addLine(`}`)
      this.dedent()
      this.addLine(`})`)
      this.addEmptyLine()
      this.addLine(`${renderedItemsVar} = newRenderedItems`)
    }

    this.dedent()
    this.addLine(`})`)
    this.addEmptyLine()
  }

  /**
   * Generate content for list items
   */
  private generateListItemContent(node: ForEachNode): void {
    this.addLine(`// List item content`)
    node.body.forEach((child) => {
      this.generateEnhancedNode(child)
    })
  }

  /**
   * Generate property wrapper code
   */
  private generatePropertyWrapper(node: PropertyWrapperNode): void {
    const { wrapper, identifier, initialValue } = node

    this.addLine(`// @${wrapper} property wrapper`)

    switch (wrapper) {
      case 'State': {
        const initial = initialValue ? this.expressionToCode(initialValue) : 'undefined'
        this.addLine(
          `const [${identifier}, set${this.capitalize(identifier)}] = createSignal(${initial})`
        )
        this.dependencies.add(identifier)
        break
      }

      case 'Computed':
        if (initialValue) {
          const computation = this.expressionToCode(initialValue)
          this.addLine(`const ${identifier} = createComputed(() => ${computation})`)
          this.dependencies.add(identifier)
        }
        break

      case 'Effect':
        if (initialValue) {
          const effect = this.expressionToCode(initialValue)
          this.addLine(`const ${identifier} = createEffect(() => ${effect})`)
        }
        break
    }

    this.addEmptyLine()
  }

  /**
   * Generate state binding code
   */
  private generateStateBinding(node: StateBindingNode): void {
    // State bindings are typically handled in component context
    // This generates a reference to the binding
    this.addLine(`// State binding: $${node.identifier}`)
    this.addLine(`const ${node.identifier}Binding = {`)
    this.indent()
    this.addLine(`get: () => ${node.identifier}(),`)
    this.addLine(`set: set${this.capitalize(node.identifier)}`)
    this.dedent()
    this.addLine(`}`)
    this.addEmptyLine()
  }

  /**
   * Generate enhanced component with reactive features
   */
  private generateEnhancedComponent(node: ComponentNode): void {
    const componentName = node.name

    switch (componentName) {
      case 'VStack':
      case 'HStack':
      case 'ZStack':
        this.generateEnhancedStackComponent(node)
        break
      case 'Text':
        this.generateEnhancedTextComponent(node)
        break
      case 'Button':
        this.generateEnhancedButtonComponent(node)
        break
      case 'TextField':
        this.generateEnhancedTextFieldComponent(node)
        break
      default:
        this.generateEnhancedGenericComponent(node)
        break
    }
  }

  /**
   * Generate enhanced stack component with reactive children
   */
  private generateEnhancedStackComponent(node: ComponentNode): void {
    const stackType = node.name.toLowerCase().replace('stack', '')
    const elementVar = this.createVariable('container')

    this.addLine(`// Enhanced ${node.name} component`)
    this.addLine(`const ${elementVar} = document.createElement('div')`)
    this.addLine(
      `${elementVar}.className = 'tachui-${stackType} ${this.generateStackClasses(node.name)}'`
    )

    // Generate reactive children
    this.addLine(`// Reactive children management`)
    node.children.forEach((child) => {
      this.generateEnhancedNode(child)
      const childVar = this.getLastVariable()
      if (childVar) {
        this.addLine(`${elementVar}.appendChild(${childVar})`)
      }
    })

    // Apply enhanced modifiers
    this.generateEnhancedModifiers(node.modifiers, elementVar)
    this.addEmptyLine()
  }

  /**
   * Generate enhanced text component with reactive content
   */
  private generateEnhancedTextComponent(node: ComponentNode): void {
    const elementVar = this.createVariable('textElement')
    const textContent = this.getTextContent(node.children)

    this.addLine(`// Enhanced Text component`)
    this.addLine(`const ${elementVar} = document.createElement('span')`)
    this.addLine(`${elementVar}.className = 'tachui-text'`)

    // Handle reactive text content
    if (this.isReactiveExpression(textContent)) {
      this.addLine(`createEffect(() => {`)
      this.indent()
      this.addLine(`${elementVar}.textContent = String(${textContent})`)
      this.dedent()
      this.addLine(`})`)
    } else {
      this.addLine(`${elementVar}.textContent = ${textContent}`)
    }

    // Apply enhanced modifiers
    this.generateEnhancedModifiers(node.modifiers, elementVar)
    this.addEmptyLine()
  }

  /**
   * Generate enhanced button component
   */
  private generateEnhancedButtonComponent(node: ComponentNode): void {
    const elementVar = this.createVariable('buttonElement')
    const textContent = this.getTextContent(node.children)

    this.addLine(`// Enhanced Button component`)
    this.addLine(`const ${elementVar} = document.createElement('button')`)
    this.addLine(`${elementVar}.className = 'tachui-button'`)

    // Handle reactive button text
    if (this.isReactiveExpression(textContent)) {
      this.addLine(`createEffect(() => {`)
      this.indent()
      this.addLine(`${elementVar}.textContent = String(${textContent})`)
      this.dedent()
      this.addLine(`})`)
    } else {
      this.addLine(`${elementVar}.textContent = ${textContent}`)
    }

    // Apply enhanced modifiers
    this.generateEnhancedModifiers(node.modifiers, elementVar)
    this.addEmptyLine()
  }

  /**
   * Generate enhanced TextField component with two-way binding
   */
  private generateEnhancedTextFieldComponent(node: ComponentNode): void {
    const elementVar = this.createVariable('textFieldElement')
    const placeholder = node.children.length > 0 ? this.getTextContent([node.children[0]]) : '""'

    this.addLine(`// Enhanced TextField component`)
    this.addLine(`const ${elementVar} = document.createElement('input')`)
    this.addLine(`${elementVar}.type = 'text'`)
    this.addLine(`${elementVar}.className = 'tachui-textfield'`)
    this.addLine(`${elementVar}.placeholder = ${placeholder}`)

    // Handle state binding for two-way data binding
    const binding = node.children.find((child) => child.type === 'StateBinding') as StateBindingNode
    if (binding) {
      this.addLine(`// Two-way data binding`)
      this.addLine(`createEffect(() => {`)
      this.indent()
      this.addLine(`${elementVar}.value = String(${binding.identifier}() || '')`)
      this.dedent()
      this.addLine(`})`)

      this.addLine(`${elementVar}.addEventListener('input', (e) => {`)
      this.indent()
      this.addLine(`set${this.capitalize(binding.identifier)}(e.target.value)`)
      this.dedent()
      this.addLine(`})`)
    }

    // Apply modifiers
    this.generateEnhancedModifiers(node.modifiers, elementVar)
    this.addEmptyLine()
  }

  /**
   * Generate enhanced generic component
   */
  private generateEnhancedGenericComponent(node: ComponentNode): void {
    const elementVar = this.createVariable('element')

    this.addLine(`// Enhanced ${node.name} component`)
    this.addLine(`const ${elementVar} = document.createElement('div')`)
    this.addLine(`${elementVar}.className = 'tachui-${node.name.toLowerCase()}'`)

    // Generate children
    node.children.forEach((child) => {
      this.generateEnhancedNode(child)
      const childVar = this.getLastVariable()
      if (childVar) {
        this.addLine(`${elementVar}.appendChild(${childVar})`)
      }
    })

    // Apply modifiers
    this.generateEnhancedModifiers(node.modifiers, elementVar)
    this.addEmptyLine()
  }

  /**
   * Generate enhanced modifiers with reactive updates
   */
  private generateEnhancedModifiers(modifiers: ModifierNode[], elementVar: string): void {
    if (modifiers.length === 0) return

    const styles: string[] = []
    const reactiveStyles: string[] = []
    const handlers: string[] = []

    modifiers.forEach((modifier) => {
      const style = this.convertModifierToStyle(modifier)
      if (style) {
        if (this.modifierHasReactiveContent(modifier)) {
          reactiveStyles.push(style)
        } else {
          styles.push(style)
        }
      }

      const handler = this.convertModifierToHandler(modifier, elementVar)
      if (handler) {
        handlers.push(handler)
      }
    })

    // Apply static styles
    if (styles.length > 0) {
      this.addLine(`Object.assign(${elementVar}.style, {`)
      this.indent()
      styles.forEach((style) => this.addLine(`${style},`))
      this.dedent()
      this.addLine(`})`)
    }

    // Apply reactive styles
    if (reactiveStyles.length > 0) {
      this.addLine(`createEffect(() => {`)
      this.indent()
      this.addLine(`Object.assign(${elementVar}.style, {`)
      this.indent()
      reactiveStyles.forEach((style) => this.addLine(`${style},`))
      this.dedent()
      this.addLine(`})`)
      this.dedent()
      this.addLine(`})`)
    }

    // Apply event handlers
    handlers.forEach((handler) => this.addLine(handler))
  }

  /**
   * Generate component mount function
   */
  private generateMountFunction(): void {
    this.addLine(`// Component mount function`)
    this.addLine(`export function mountComponent(container) {`)
    this.indent()
    this.addLine(`return createRoot(() => {`)
    this.indent()

    if (this.variables.length > 0) {
      const rootElement = this.variables[this.variables.length - 1]
      this.addLine(`container.appendChild(${rootElement})`)
      this.addLine(`return () => container.removeChild(${rootElement})`)
    }

    this.dedent()
    this.addLine(`})`)
    this.dedent()
    this.addLine(`}`)

    this.exports.add('mountComponent')
  }

  /**
   * Helper methods
   */
  private expressionToCode(expr: Expression): string {
    switch (expr.type) {
      case 'Literal': {
        const literal = expr as LiteralExpression
        return typeof literal.value === 'string' ? `"${literal.value}"` : String(literal.value)
      }
      case 'Identifier':
        return (expr as any).name
      case 'CallExpression': {
        const call = expr as any
        const args = call.arguments.map((arg: Expression) => this.expressionToCode(arg)).join(', ')
        return `${this.expressionToCode(call.callee)}(${args})`
      }
      case 'MemberExpression': {
        const member = expr as any
        return `${member.object}.${member.property}`
      }
      case 'ArrayExpression': {
        const array = expr as any
        const elements = array.elements
          .map((el: Expression) => this.expressionToCode(el))
          .join(', ')
        return `[${elements}]`
      }
      default:
        return '""'
    }
  }

  private getTextContent(children: ASTNode[]): string {
    if (children.length === 0) return '""'
    const firstChild = children[0]
    if (
      firstChild.type === 'Literal' ||
      firstChild.type === 'Identifier' ||
      firstChild.type === 'CallExpression' ||
      firstChild.type === 'MemberExpression' ||
      firstChild.type === 'ArrayExpression'
    ) {
      return this.expressionToCode(firstChild as Expression)
    }
    return '""'
  }

  private isReactiveExpression(expr: string): boolean {
    return (
      expr.includes('()') || expr.includes('get') || (!expr.startsWith('"') && !expr.match(/^\d+$/))
    )
  }

  private modifierHasReactiveContent(modifier: ModifierNode): boolean {
    return modifier.arguments.some((arg) => {
      const code = this.expressionToCode(arg)
      return this.isReactiveExpression(code)
    })
  }

  private convertModifierToStyle(modifier: ModifierNode): string | null {
    const args = modifier.arguments

    switch (modifier.name) {
      case 'padding': {
        const padding = args.length > 0 ? this.expressionToCode(args[0]) : '"8px"'
        return `padding: ${padding}`
      }
      case 'background':
        if (args.length > 0) {
          return `backgroundColor: ${this.expressionToCode(args[0])}`
        }
        break
      case 'foregroundColor':
        if (args.length > 0) {
          return `color: ${this.expressionToCode(args[0])}`
        }
        break
      case 'font':
        if (args.length > 0) {
          return `fontSize: ${this.expressionToCode(args[0])}`
        }
        break
      case 'cornerRadius':
        if (args.length > 0) {
          return `borderRadius: ${this.expressionToCode(args[0])}px`
        }
        break
      case 'opacity':
        if (args.length > 0) {
          return `opacity: ${this.expressionToCode(args[0])}`
        }
        break
    }

    return null
  }

  private convertModifierToHandler(modifier: ModifierNode, elementVar: string): string | null {
    if (modifier.name === 'onTapGesture' && modifier.arguments.length > 0) {
      const handler = this.expressionToCode(modifier.arguments[0])
      return `${elementVar}.addEventListener('click', ${handler})`
    }
    return null
  }

  private generateStackClasses(stackType: string): string {
    switch (stackType) {
      case 'VStack':
        return 'flex flex-col'
      case 'HStack':
        return 'flex flex-row'
      case 'ZStack':
        return 'relative'
      default:
        return 'flex'
    }
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  private createVariable(prefix: string): string {
    const varName = `${prefix}${this.variables.length + 1}`
    this.variables.push(varName)
    return varName
  }

  private getLastVariable(): string | null {
    return this.variables.length > 0 ? this.variables[this.variables.length - 1] : null
  }

  private addImport(importStatement: string, from: string): void {
    this.imports.add(`import { ${importStatement} } from '${from}'`)
  }

  private addLine(line: string): void {
    const indent = '  '.repeat(this.indentLevel)
    this.code.push(indent + line)
  }

  private addEmptyLine(): void {
    this.code.push('')
  }

  private indent(): void {
    this.indentLevel++
  }

  private dedent(): void {
    this.indentLevel = Math.max(0, this.indentLevel - 1)
  }

  private buildFinalCode(): string {
    const imports = Array.from(this.imports).join('\n')
    const body = this.code.join('\n')
    return `${imports}\n\n${body}`
  }

  private generateSourceMap(): any {
    return null // Placeholder for source map generation
  }

  private reset(): void {
    this.imports.clear()
    this.variables = []
    this.code = []
    this.indentLevel = 0
    this.dependencies.clear()
    this.exports.clear()
  }
}

/**
 * Generate enhanced DOM code with advanced reactive features
 */
export function generateEnhancedDOMCode(
  nodes: ASTNode[],
  options: EnhancedCodegenOptions = {}
): EnhancedCodegenResult {
  const generator = new EnhancedDOMCodeGenerator(options)
  return generator.generate(nodes)
}
