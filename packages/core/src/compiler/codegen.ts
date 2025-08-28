/**
 * DOM Code Generator
 *
 * Generates reactive DOM code from SwiftUI AST nodes.
 * This transforms the parsed AST into efficient JavaScript code that uses
 * TachUI's reactive system for fine-grained DOM updates.
 */

import type {
  ASTNode,
  ComponentNode,
  Expression,
  IdentifierExpression,
  LiteralExpression,
  ModifierNode,
  TransformOptions,
} from './types'

export interface CodegenResult {
  code: string
  map?: any // Source map
}

export interface CodegenOptions extends TransformOptions {
  sourceFile?: string
}

/**
 * Generate reactive DOM code from SwiftUI AST
 */
export function generateDOMCode(nodes: ASTNode[], options: CodegenOptions = {}): CodegenResult {
  const generator = new DOMCodeGenerator(options)
  return generator.generate(nodes)
}

/**
 * DOM code generator implementation
 */
class DOMCodeGenerator {
  private options: CodegenOptions
  private imports = new Set<string>()
  private variables: string[] = []
  private code: string[] = []
  private indentLevel = 0

  constructor(options: CodegenOptions) {
    this.options = options
  }

  /**
   * Generate complete code from AST nodes
   */
  generate(nodes: ASTNode[]): CodegenResult {
    this.reset()

    // Add necessary imports
    this.addImport('createSignal', '@tachui/core/reactive')
    this.addImport('createEffect', '@tachui/core/reactive')
    this.addImport('createComputed', '@tachui/core/reactive')

    // Generate code for each node
    nodes.forEach((node) => this.generateNode(node))

    // Combine everything
    const generatedCode = this.buildFinalCode()

    return {
      code: generatedCode,
      map: this.options.sourceMaps ? this.generateSourceMap() : undefined,
    }
  }

  /**
   * Generate code for a single AST node
   */
  private generateNode(node: ASTNode): void {
    switch (node.type) {
      case 'Component':
        this.generateComponent(node as ComponentNode)
        break
      default:
        // Handle other node types as needed
        break
    }
  }

  /**
   * Generate code for a component node
   */
  private generateComponent(node: ComponentNode): void {
    const componentName = node.name

    switch (componentName) {
      case 'VStack':
      case 'HStack':
      case 'ZStack':
        this.generateStackComponent(node)
        break
      case 'Text':
        this.generateTextComponent(node)
        break
      case 'Button':
        this.generateButtonComponent(node)
        break
      case 'List':
        this.generateListComponent(node)
        break
      default:
        this.generateGenericComponent(node)
        break
    }
  }

  /**
   * Generate code for stack components (VStack, HStack, ZStack)
   */
  private generateStackComponent(node: ComponentNode): void {
    const stackType = node.name.toLowerCase().replace('stack', '')
    const elementVar = this.createVariable('container')

    this.addLine(`// ${node.name} component`)
    this.addLine(`const ${elementVar} = document.createElement('div')`)
    this.addLine(
      `${elementVar}.className = 'tachui-${stackType} ${this.generateStackClasses(node.name)}'`
    )

    // Apply modifiers to generate styles
    const styles = this.generateModifierStyles(node.modifiers)
    if (styles.length > 0) {
      this.addLine(`Object.assign(${elementVar}.style, {`)
      this.indent()
      styles.forEach((style) => this.addLine(`${style},`))
      this.dedent()
      this.addLine(`})`)
    }

    // Generate children
    node.children.forEach((child) => {
      this.generateNode(child)
      const childVar = this.getLastVariable()
      if (childVar) {
        this.addLine(`${elementVar}.appendChild(${childVar})`)
      }
    })

    this.addEmptyLine()
  }

  /**
   * Generate code for Text component
   */
  private generateTextComponent(node: ComponentNode): void {
    const elementVar = this.createVariable('textElement')
    const textContent = this.getTextContent(node.children)

    this.addLine(`// Text component`)
    this.addLine(`const ${elementVar} = document.createElement('span')`)
    this.addLine(`${elementVar}.className = 'tachui-text'`)

    // Handle reactive text content
    if (this.isReactiveExpression(textContent)) {
      this.addLine(`createEffect(() => {`)
      this.indent()
      this.addLine(`${elementVar}.textContent = ${textContent}`)
      this.dedent()
      this.addLine(`})`)
    } else {
      this.addLine(`${elementVar}.textContent = ${textContent}`)
    }

    // Apply modifiers
    const styles = this.generateModifierStyles(node.modifiers)
    if (styles.length > 0) {
      this.addLine(`Object.assign(${elementVar}.style, {`)
      this.indent()
      styles.forEach((style) => this.addLine(`${style},`))
      this.dedent()
      this.addLine(`})`)
    }

    this.addEmptyLine()
  }

  /**
   * Generate code for Button component
   */
  private generateButtonComponent(node: ComponentNode): void {
    const elementVar = this.createVariable('buttonElement')
    const textContent = this.getTextContent(node.children)

    this.addLine(`// Button component`)
    this.addLine(`const ${elementVar} = document.createElement('button')`)
    this.addLine(`${elementVar}.className = 'tachui-button'`)
    this.addLine(`${elementVar}.textContent = ${textContent}`)

    // Apply modifiers (including onTapGesture)
    const styles = this.generateModifierStyles(node.modifiers)
    const handlers = this.generateEventHandlers(node.modifiers)

    if (styles.length > 0) {
      this.addLine(`Object.assign(${elementVar}.style, {`)
      this.indent()
      styles.forEach((style) => this.addLine(`${style},`))
      this.dedent()
      this.addLine(`})`)
    }

    handlers.forEach((handler) => this.addLine(handler))

    this.addEmptyLine()
  }

  /**
   * Generate code for List component
   */
  private generateListComponent(node: ComponentNode): void {
    const elementVar = this.createVariable('listElement')

    this.addLine(`// List component`)
    this.addLine(`const ${elementVar} = document.createElement('div')`)
    this.addLine(`${elementVar}.className = 'tachui-list'`)

    // Generate list items
    node.children.forEach((child) => {
      this.generateNode(child)
      const childVar = this.getLastVariable()
      if (childVar) {
        this.addLine(`${elementVar}.appendChild(${childVar})`)
      }
    })

    this.addEmptyLine()
  }

  /**
   * Generate code for generic/custom components
   */
  private generateGenericComponent(node: ComponentNode): void {
    const elementVar = this.createVariable('element')

    this.addLine(`// ${node.name} component`)
    this.addLine(`const ${elementVar} = document.createElement('div')`)
    this.addLine(`${elementVar}.className = 'tachui-${node.name.toLowerCase()}'`)

    // Apply modifiers
    const styles = this.generateModifierStyles(node.modifiers)
    if (styles.length > 0) {
      this.addLine(`Object.assign(${elementVar}.style, {`)
      this.indent()
      styles.forEach((style) => this.addLine(`${style},`))
      this.dedent()
      this.addLine(`})`)
    }

    this.addEmptyLine()
  }

  /**
   * Generate CSS classes for stack layouts
   */
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

  /**
   * Generate styles from modifiers
   */
  private generateModifierStyles(modifiers: ModifierNode[]): string[] {
    const styles: string[] = []

    modifiers.forEach((modifier) => {
      const style = this.convertModifierToStyle(modifier)
      if (style) {
        styles.push(style)
      }
    })

    return styles
  }

  /**
   * Generate event handlers from modifiers
   */
  private generateEventHandlers(modifiers: ModifierNode[]): string[] {
    const handlers: string[] = []

    modifiers.forEach((modifier) => {
      if (modifier.name === 'onTapGesture' && modifier.arguments.length > 0) {
        const handler = this.expressionToString(modifier.arguments[0])
        handlers.push(`${this.getLastVariable()}.addEventListener('click', ${handler})`)
      }
    })

    return handlers
  }

  /**
   * Convert modifier to CSS style property
   */
  private convertModifierToStyle(modifier: ModifierNode): string | null {
    const args = modifier.arguments

    switch (modifier.name) {
      case 'padding': {
        const padding = args.length > 0 ? this.expressionToString(args[0]) : '"8px"'
        return `padding: ${padding}`
      }

      case 'background':
        if (args.length > 0) {
          const color = this.expressionToString(args[0])
          return `backgroundColor: ${color}`
        }
        break

      case 'foregroundColor':
        if (args.length > 0) {
          const color = this.expressionToString(args[0])
          return `color: ${color}`
        }
        break

      case 'font':
        if (args.length > 0) {
          const size = this.expressionToString(args[0])
          return `fontSize: ${size}`
        }
        break

      case 'cornerRadius':
        if (args.length > 0) {
          const radius = this.expressionToString(args[0])
          return `borderRadius: ${radius}px`
        }
        break

      case 'opacity':
        if (args.length > 0) {
          const opacity = this.expressionToString(args[0])
          return `opacity: ${opacity}`
        }
        break

      case 'frame':
        if (args.length >= 2) {
          // Frame modifier would need special handling to generate multiple CSS properties
          // For now, skip it in the style conversion
          return null
        }
        break
    }

    return null
  }

  /**
   * Helper methods
   */
  private getTextContent(children: ASTNode[]): string {
    if (children.length === 0) return '""'

    const firstChild = children[0]
    if (firstChild.type === 'Literal') {
      const literal = firstChild as LiteralExpression
      return `"${literal.value}"`
    }

    return this.expressionToString(firstChild as Expression)
  }

  private expressionToString(expr: Expression): string {
    switch (expr.type) {
      case 'Literal': {
        const literal = expr as LiteralExpression
        return typeof literal.value === 'string' ? `"${literal.value}"` : String(literal.value)
      }
      case 'Identifier': {
        const identifier = expr as IdentifierExpression
        return identifier.name
      }
      default:
        return '""'
    }
  }

  private isReactiveExpression(expr: string): boolean {
    // Simple heuristic - check if it looks like a function call or variable access
    return expr.includes('()') || (!expr.startsWith('"') && !expr.match(/^\d+$/))
  }

  private createVariable(prefix: string): string {
    const varName = `${prefix}${this.variables.length + 1}`
    this.variables.push(varName)
    return varName
  }

  private getLastVariable(): string | null {
    return this.variables.length > 0 ? this.variables[this.variables.length - 1] : null
  }

  private addImport(name: string, from: string): void {
    this.imports.add(`import { ${name} } from '${from}'`)
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
    // Placeholder for source map generation
    // In a real implementation, this would generate proper source maps
    return null
  }

  private reset(): void {
    this.imports.clear()
    this.variables = []
    this.code = []
    this.indentLevel = 0
  }
}
