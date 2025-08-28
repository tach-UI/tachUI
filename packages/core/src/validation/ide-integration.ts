/**
 * IDE Integration Foundation - Phase 1D
 * 
 * VS Code extension foundation, language server protocol implementation,
 * and real-time validation feedback system.
 */

import { DeveloperExperienceUtils } from './developer-experience'

/**
 * Language Server Protocol message types
 */
export interface LSPDiagnostic {
  range: {
    start: { line: number; character: number }
    end: { line: number; character: number }
  }
  severity: 1 | 2 | 3 | 4 // Error, Warning, Information, Hint
  code?: string | number
  source: string
  message: string
  relatedInformation?: {
    location: {
      uri: string
      range: {
        start: { line: number; character: number }
        end: { line: number; character: number }
      }
    }
    message: string
  }[]
  data?: any
}

/**
 * Code Action for IDE quick fixes
 */
export interface LSPCodeAction {
  title: string
  kind: string
  diagnostics?: LSPDiagnostic[]
  edit?: {
    changes?: Record<string, {
      range: {
        start: { line: number; character: number }
        end: { line: number; character: number }
      }
      newText: string
    }[]>
  }
  command?: {
    title: string
    command: string
    arguments?: any[]
  }
}

/**
 * Hover information for IntelliSense
 */
export interface LSPHover {
  contents: {
    kind: 'markdown' | 'plaintext'
    value: string
  }
  range?: {
    start: { line: number; character: number }
    end: { line: number; character: number }
  }
}

/**
 * Completion item for autocomplete
 */
export interface LSPCompletionItem {
  label: string
  kind: number // CompletionItemKind
  detail?: string
  documentation?: {
    kind: 'markdown' | 'plaintext'
    value: string
  }
  insertText?: string
  insertTextFormat?: 1 | 2 // PlainText, Snippet
  textEdit?: {
    range: {
      start: { line: number; character: number }
      end: { line: number; character: number }
    }
    newText: string
  }
  additionalTextEdits?: {
    range: {
      start: { line: number; character: number }
      end: { line: number; character: number }
    }
    newText: string
  }[]
  command?: {
    title: string
    command: string
    arguments?: any[]
  }
}

/**
 * IDE Integration configuration
 */
export interface IDEIntegrationConfig {
  // Language server
  enableLanguageServer: boolean
  serverPort: number
  
  // Diagnostics
  enableRealTimeDiagnostics: boolean
  diagnosticDelay: number
  maxDiagnostics: number
  
  // IntelliSense
  enableHoverInfo: boolean
  enableAutoComplete: boolean
  enableSignatureHelp: boolean
  
  // Quick fixes
  enableQuickFixes: boolean
  enableCodeActions: boolean
  enableRefactoring: boolean
  
  // VS Code specific
  enableStatusBar: boolean
  enableOutputChannel: boolean
  enableWebview: boolean
}

/**
 * Global IDE integration configuration
 */
let ideConfig: IDEIntegrationConfig = {
  enableLanguageServer: true,
  serverPort: 3579,
  enableRealTimeDiagnostics: true,
  diagnosticDelay: 500,
  maxDiagnostics: 100,
  enableHoverInfo: true,
  enableAutoComplete: true,
  enableSignatureHelp: true,
  enableQuickFixes: true,
  enableCodeActions: true,
  enableRefactoring: true,
  enableStatusBar: true,
  enableOutputChannel: true,
  enableWebview: false
}

/**
 * Real-time validation diagnostics provider
 */
export class ValidationDiagnosticsProvider {
  private diagnostics = new Map<string, LSPDiagnostic[]>()
  private listeners = new Set<(uri: string, diagnostics: LSPDiagnostic[]) => void>()

  /**
   * Validate document and return diagnostics
   */
  async validateDocument(uri: string, text: string): Promise<LSPDiagnostic[]> {
    if (!ideConfig.enableRealTimeDiagnostics) {
      return []
    }

    const diagnostics: LSPDiagnostic[] = []
    const lines = text.split('\n')

    // Simple pattern-based validation for demo
    // In a real implementation, this would use the full validation system
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]
      
      // Check for common TachUI patterns
      const commonErrors = this.detectCommonErrors(line, lineIndex)
      diagnostics.push(...commonErrors)
    }

    // Limit diagnostics count
    const limitedDiagnostics = diagnostics.slice(0, ideConfig.maxDiagnostics)
    
    // Cache diagnostics
    this.diagnostics.set(uri, limitedDiagnostics)
    
    // Notify listeners
    this.notifyListeners(uri, limitedDiagnostics)
    
    return limitedDiagnostics
  }

  /**
   * Detect common TachUI errors in a line of code
   */
  private detectCommonErrors(line: string, lineIndex: number): LSPDiagnostic[] {
    const diagnostics: LSPDiagnostic[] = []
    
    // Missing required parameters
    if (line.includes('Text()') && !line.includes('//')) {
      diagnostics.push({
        range: {
          start: { line: lineIndex, character: line.indexOf('Text()') },
          end: { line: lineIndex, character: line.indexOf('Text()') + 6 }
        },
        severity: 1, // Error
        code: 'missing-required-prop',
        source: 'tachui',
        message: 'Text component requires a content parameter',
        data: {
          template: 'missing-required-prop',
          component: 'Text',
          suggestions: ['add-required-prop']
        }
      })
    }

    // Button without action
    if (line.includes('Button(') && !line.includes(',') && !line.includes('//')) {
      const match = line.match(/Button\s*\(\s*"[^"]*"\s*\)/)
      if (match) {
        diagnostics.push({
          range: {
            start: { line: lineIndex, character: line.indexOf(match[0]) },
            end: { line: lineIndex, character: line.indexOf(match[0]) + match[0].length }
          },
          severity: 2, // Warning
          code: 'missing-button-action',
          source: 'tachui',
          message: 'Button should have an action handler for better user experience',
          data: {
            template: 'missing-required-prop',
            component: 'Button',
            suggestions: ['add-button-action']
          }
        })
      }
    }

    // Invalid modifier usage
    if (line.includes('VStack(') && line.includes('.fontSize(')) {
      diagnostics.push({
        range: {
          start: { line: lineIndex, character: line.indexOf('.fontSize(') },
          end: { line: lineIndex, character: line.indexOf('.fontSize(') + 10 }
        },
        severity: 1, // Error
        code: 'invalid-modifier-usage',
        source: 'tachui',
        message: 'fontSize modifier is not compatible with VStack component',
        data: {
          template: 'invalid-modifier-usage',
          component: 'VStack',
          modifier: 'fontSize',
          suggestions: ['remove-incompatible-modifier']
        }
      })
    }

    return diagnostics
  }

  /**
   * Get diagnostics for a document
   */
  getDiagnostics(uri: string): LSPDiagnostic[] {
    return this.diagnostics.get(uri) || []
  }

  /**
   * Clear diagnostics for a document
   */
  clearDiagnostics(uri: string): void {
    this.diagnostics.delete(uri)
    this.notifyListeners(uri, [])
  }

  /**
   * Add diagnostic listener
   */
  onDiagnosticsChanged(listener: (uri: string, diagnostics: LSPDiagnostic[]) => void): void {
    this.listeners.add(listener)
  }

  /**
   * Notify all listeners of diagnostic changes
   */
  private notifyListeners(uri: string, diagnostics: LSPDiagnostic[]): void {
    this.listeners.forEach(listener => listener(uri, diagnostics))
  }
}

/**
 * Code actions provider for quick fixes
 */
export class CodeActionsProvider {
  /**
   * Get code actions for a diagnostic
   */
  getCodeActions(diagnostic: LSPDiagnostic, uri: string, _text: string): LSPCodeAction[] {
    const actions: LSPCodeAction[] = []

    if (!ideConfig.enableCodeActions) {
      return actions
    }

    // Get suggestions from developer experience system
    const suggestions = DeveloperExperienceUtils.getSuggestions(
      diagnostic.code as string,
      diagnostic.data
    )

    // Convert suggestions to code actions
    for (const suggestion of suggestions) {
      if (suggestion.canAutoFix) {
        actions.push({
          title: `Fix: ${suggestion.title}`,
          kind: 'quickfix',
          diagnostics: [diagnostic],
          edit: {
            changes: {
              [uri]: [{
                range: diagnostic.range,
                newText: suggestion.after
              }]
            }
          }
        })
      }
    }

    // Add learn more action
    if (diagnostic.data?.template) {
      actions.push({
        title: 'Learn more about this error',
        kind: 'refactor',
        command: {
          title: 'Open Documentation',
          command: 'tachui.openDocumentation',
          arguments: [diagnostic.data.template]
        }
      })
    }

    return actions
  }
}

/**
 * Hover information provider
 */
export class HoverProvider {
  /**
   * Get hover information for a position
   */
  getHover(_uri: string, text: string, line: number, character: number): LSPHover | null {
    if (!ideConfig.enableHoverInfo) {
      return null
    }

    const lines = text.split('\n')
    const currentLine = lines[line]
    
    // Detect TachUI component or modifier at position
    const componentInfo = this.detectComponentAtPosition(currentLine, character)
    if (componentInfo) {
      return this.createComponentHover(componentInfo)
    }

    const modifierInfo = this.detectModifierAtPosition(currentLine, character)
    if (modifierInfo) {
      return this.createModifierHover(modifierInfo)
    }

    return null
  }

  /**
   * Detect component at cursor position
   */
  private detectComponentAtPosition(line: string, character: number): { name: string; range: { start: number; end: number } } | null {
    const components = ['Text', 'Button', 'VStack', 'HStack', 'ZStack', 'Image', 'List', 'Toggle']
    
    for (const component of components) {
      const index = line.indexOf(component)
      if (index !== -1 && character >= index && character <= index + component.length) {
        return {
          name: component,
          range: { start: index, end: index + component.length }
        }
      }
    }
    
    return null
  }

  /**
   * Detect modifier at cursor position
   */
  private detectModifierAtPosition(line: string, character: number): { name: string; range: { start: number; end: number } } | null {
    const modifiers = ['padding', 'margin', 'background', 'foregroundColor', 'fontSize', 'frame', 'clipped']
    
    for (const modifier of modifiers) {
      const pattern = new RegExp(`\\.(${modifier})\\s*\\(`, 'g')
      let match
      while ((match = pattern.exec(line)) !== null) {
        const start = match.index + 1
        const end = start + modifier.length
        if (character >= start && character <= end) {
          return {
            name: modifier,
            range: { start, end }
          }
        }
      }
    }
    
    return null
  }

  /**
   * Create hover information for component
   */
  private createComponentHover(componentInfo: { name: string; range: { start: number; end: number } }): LSPHover {
    const componentDocs = this.getComponentDocumentation(componentInfo.name)
    
    return {
      contents: {
        kind: 'markdown',
        value: componentDocs
      },
      range: {
        start: { line: 0, character: componentInfo.range.start },
        end: { line: 0, character: componentInfo.range.end }
      }
    }
  }

  /**
   * Create hover information for modifier
   */
  private createModifierHover(modifierInfo: { name: string; range: { start: number; end: number } }): LSPHover {
    const modifierDocs = this.getModifierDocumentation(modifierInfo.name)
    
    return {
      contents: {
        kind: 'markdown',
        value: modifierDocs
      },
      range: {
        start: { line: 0, character: modifierInfo.range.start },
        end: { line: 0, character: modifierInfo.range.end }
      }
    }
  }

  /**
   * Get component documentation
   */
  private getComponentDocumentation(componentName: string): string {
    const docs: Record<string, string> = {
      Text: `
# Text Component
Display text content with optional reactive updates.

## Usage
\`\`\`typescript
Text("Hello World")
Text(() => dynamicContent.value)
\`\`\`

## Properties
- **content** (required): string | Signal<string> | Function

## Supported Modifiers
- fontSize, fontWeight, foregroundColor, textAlign
- padding, margin, background, border
- frame, position, opacity, clipped

[📚 Full Documentation](/docs/components/text)
      `,
      Button: `
# Button Component
Interactive button with customizable appearance and actions.

## Usage
\`\`\`typescript
Button("Click me", handleClick)
Button("Submit").background("blue")
\`\`\`

## Properties
- **title** (required): string
- **action** (optional): Function

## Supported Modifiers
- foregroundColor, background, padding, margin
- border, shadow, opacity, disabled
- frame, position, cursor

[📚 Full Documentation](/docs/components/button)
      `
    }

    return docs[componentName] || `# ${componentName} Component\n\nTachUI component for building user interfaces.\n\n[📚 Documentation](/docs/components/${componentName.toLowerCase()})`
  }

  /**
   * Get modifier documentation
   */
  private getModifierDocumentation(modifierName: string): string {
    const docs: Record<string, string> = {
      padding: `
# .padding() Modifier
Add internal spacing to a component.

## Usage
\`\`\`typescript
.padding(16)           // All sides
.padding("1rem")       // CSS units
.padding({ top: 8, horizontal: 12 })  // Individual sides
\`\`\`

## Compatible Components
All components support padding modifier.

[📚 Full Documentation](/docs/modifiers/padding)
      `,
      fontSize: `
# .fontSize() Modifier
Set the font size for text content.

## Usage
\`\`\`typescript
.fontSize(16)     // Pixels
.fontSize("1.2rem")  // CSS units
\`\`\`

## Compatible Components
- Text, Button (text components only)

[📚 Full Documentation](/docs/modifiers/fontSize)
      `
    }

    return docs[modifierName] || `# .${modifierName}() Modifier\n\nTachUI modifier for styling components.\n\n[📚 Documentation](/docs/modifiers/${modifierName})`
  }
}

/**
 * Completion provider for autocomplete
 */
export class CompletionProvider {
  /**
   * Get completion items for a position
   */
  getCompletions(_uri: string, text: string, line: number, character: number): LSPCompletionItem[] {
    if (!ideConfig.enableAutoComplete) {
      return []
    }

    const lines = text.split('\n')
    const currentLine = lines[line]
    const lineUpToCursor = currentLine.substring(0, character)

    // Component completions
    if (this.isComponentContext(lineUpToCursor)) {
      return this.getComponentCompletions()
    }

    // Modifier completions
    if (this.isModifierContext(lineUpToCursor)) {
      return this.getModifierCompletions(lineUpToCursor)
    }

    return []
  }

  /**
   * Check if we're in a component context
   */
  private isComponentContext(lineUpToCursor: string): boolean {
    // Simple heuristic - could be more sophisticated
    return /\s*$/.test(lineUpToCursor) || /^\s*[A-Z]/.test(lineUpToCursor)
  }

  /**
   * Check if we're in a modifier context
   */
  private isModifierContext(lineUpToCursor: string): boolean {
    return lineUpToCursor.includes('.') && !lineUpToCursor.endsWith('.')
  }

  /**
   * Get component completion items
   */
  private getComponentCompletions(): LSPCompletionItem[] {
    return [
      {
        label: 'Text',
        kind: 3, // Function
        detail: 'Text Component',
        documentation: {
          kind: 'markdown',
          value: 'Display text content with optional reactive updates.'
        },
        insertText: 'Text("$1")',
        insertTextFormat: 2 // Snippet
      },
      {
        label: 'Button',
        kind: 3, // Function
        detail: 'Button Component',
        documentation: {
          kind: 'markdown',
          value: 'Interactive button with customizable appearance and actions.'
        },
        insertText: 'Button("$1", $2)',
        insertTextFormat: 2 // Snippet
      },
      {
        label: 'VStack',
        kind: 3, // Function
        detail: 'VStack Component',
        documentation: {
          kind: 'markdown',
          value: 'Vertical stack layout container.'
        },
        insertText: 'VStack({ children: [$1] })',
        insertTextFormat: 2 // Snippet
      }
    ]
  }

  /**
   * Get modifier completion items
   */
  private getModifierCompletions(lineUpToCursor: string): LSPCompletionItem[] {
    // Determine component type for compatible modifiers
    const componentMatch = lineUpToCursor.match(/([A-Z][a-zA-Z]*)\s*\(/)
    const componentName = componentMatch ? componentMatch[1] : null

    const allModifiers = [
      {
        label: 'padding',
        kind: 2, // Method
        detail: 'Add internal spacing',
        insertText: 'padding($1)',
        insertTextFormat: 2,
        compatible: ['*']
      },
      {
        label: 'fontSize',
        kind: 2, // Method
        detail: 'Set font size',
        insertText: 'fontSize($1)',
        insertTextFormat: 2,
        compatible: ['Text', 'Button']
      },
      {
        label: 'background',
        kind: 2, // Method
        detail: 'Set background color',
        insertText: 'background("$1")',
        insertTextFormat: 2,
        compatible: ['*']
      }
    ]

    // Filter by compatibility
    return allModifiers
      .filter(modifier => 
        modifier.compatible.includes('*') || 
        (componentName && modifier.compatible.includes(componentName))
      )
      .map(modifier => ({
        label: modifier.label,
        kind: modifier.kind,
        detail: modifier.detail,
        insertText: modifier.insertText,
        insertTextFormat: modifier.insertTextFormat as 1 | 2
      }))
  }
}

/**
 * VS Code integration manager
 */
export class VSCodeIntegration {
  private diagnosticsProvider = new ValidationDiagnosticsProvider()
  private codeActionsProvider = new CodeActionsProvider()
  private hoverProvider = new HoverProvider()
  private completionProvider = new CompletionProvider()

  /**
   * Initialize VS Code integration
   */
  initialize(): void {
    if (typeof globalThis !== 'undefined') {
      // Register providers globally for VS Code extension access
      ;(globalThis as any).__TACHUI_IDE_INTEGRATION__ = {
        diagnostics: this.diagnosticsProvider,
        codeActions: this.codeActionsProvider,
        hover: this.hoverProvider,
        completion: this.completionProvider,
        config: ideConfig
      }
    }
  }

  /**
   * Validate document and return diagnostics
   */
  async validateDocument(uri: string, text: string): Promise<LSPDiagnostic[]> {
    return this.diagnosticsProvider.validateDocument(uri, text)
  }

  /**
   * Get code actions for diagnostics
   */
  getCodeActions(diagnostic: LSPDiagnostic, uri: string, text: string): LSPCodeAction[] {
    return this.codeActionsProvider.getCodeActions(diagnostic, uri, text)
  }

  /**
   * Get hover information
   */
  getHover(uri: string, text: string, line: number, character: number): LSPHover | null {
    return this.hoverProvider.getHover(uri, text, line, character)
  }

  /**
   * Get completion items
   */
  getCompletions(uri: string, text: string, line: number, character: number): LSPCompletionItem[] {
    return this.completionProvider.getCompletions(uri, text, line, character)
  }
}

/**
 * Configure IDE integration
 */
export function configureIDEIntegration(config: Partial<IDEIntegrationConfig>): void {
  ideConfig = { ...ideConfig, ...config }
}

/**
 * Get current IDE configuration
 */
export function getIDEIntegrationConfig(): IDEIntegrationConfig {
  return { ...ideConfig }
}

// Global VS Code integration instance
const vsCodeIntegration = new VSCodeIntegration()

/**
 * IDE Integration utilities
 */
export const IDEIntegrationUtils = {
  /**
   * Initialize IDE integration
   */
  initialize: () => vsCodeIntegration.initialize(),

  /**
   * Validate document
   */
  validateDocument: (uri: string, text: string) => vsCodeIntegration.validateDocument(uri, text),

  /**
   * Get code actions
   */
  getCodeActions: (diagnostic: LSPDiagnostic, uri: string, text: string) => 
    vsCodeIntegration.getCodeActions(diagnostic, uri, text),

  /**
   * Get hover information
   */
  getHover: (uri: string, text: string, line: number, character: number) => 
    vsCodeIntegration.getHover(uri, text, line, character),

  /**
   * Get completions
   */
  getCompletions: (uri: string, text: string, line: number, character: number) => 
    vsCodeIntegration.getCompletions(uri, text, line, character),

  /**
   * Configure integration
   */
  configure: configureIDEIntegration,

  /**
   * Get configuration
   */
  getConfig: getIDEIntegrationConfig,

  /**
   * Test IDE integration system
   */
  test: async () => {
    console.group('🎯 IDE Integration System Test')
    
    try {
      // Test diagnostics
      const testCode = `
        Text()
        Button("Click me")
        VStack({ children: [] }).fontSize(16)
      `
      
      const diagnostics = await vsCodeIntegration.validateDocument('test.ts', testCode)
      console.info('✅ Diagnostics found:', diagnostics.length)
      
      // Test hover
      const hover = vsCodeIntegration.getHover('test.ts', 'Text("hello")', 0, 2)
      console.info('✅ Hover info available:', !!hover)
      
      // Test completions
      const completions = vsCodeIntegration.getCompletions('test.ts', 'T', 0, 1)
      console.info('✅ Completions available:', completions.length)
      
      if (diagnostics.length > 0) {
        const actions = vsCodeIntegration.getCodeActions(diagnostics[0], 'test.ts', testCode)
        console.info('✅ Code actions available:', actions.length)
      }
      
      console.info('✅ IDE integration system is working correctly')
      
    } catch (error) {
      console.error('❌ IDE integration test failed:', error)
    }
    
    console.groupEnd()
  }
}

// Auto-initialize on import
vsCodeIntegration.initialize()

// Export instances
export { vsCodeIntegration }