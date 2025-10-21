/**
 * VS Code Extension for TachUI Modifier IntelliSense
 *
 * Provides parameter hints, autocomplete, and documentation for all modifiers
 */

import * as vscode from 'vscode'
import {
  modifierParameterRegistry,
  type ModifierSignature,
} from '../modifier-parameter-system'

export class TachUIModifierProvider
  implements vscode.CompletionItemProvider, vscode.HoverProvider
{
  /**
   * Provide completion items for modifier methods
   */
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext
  ): vscode.ProviderResult<vscode.CompletionItem[]> {
    const linePrefix = document
      .lineAt(position)
      .text.substr(0, position.character)

    // Check if we're in a modifier chain context
    if (!linePrefix.includes('.') || !this.isInModifierContext(linePrefix)) {
      return []
    }

    const completionItems: vscode.CompletionItem[] = []
    const allModifiers = modifierParameterRegistry.getAllModifiers()

    for (const modifier of allModifiers) {
      const item = new vscode.CompletionItem(
        modifier.name,
        vscode.CompletionItemKind.Method
      )

      // Build the insertion text with parameter placeholders
      const params = modifier.parameters
      if (params.length === 0) {
        item.insertText = `${modifier.name}()`
      } else if (params.length === 1 && params[0].required) {
        // Simple single parameter
        item.insertText = new vscode.SnippetString(
          `${modifier.name}(\${1:${params[0].examples[0] || params[0].type}})`
        )
      } else {
        // Multiple parameters - use object syntax
        const paramSnippets = params
          .map((param, index) => {
            const example = param.examples[0] || 'value'
            return `${param.name}: \${${index + 1}:${example}}`
          })
          .join(', ')
        item.insertText = new vscode.SnippetString(
          `${modifier.name}({ ${paramSnippets} })`
        )
      }

      // Documentation
      const markdown = new vscode.MarkdownString()
      markdown.appendCodeblock(`${modifier.name}(parameters)`, 'typescript')
      markdown.appendMarkdown(`**${modifier.description}**\n\n`)
      markdown.appendMarkdown(`**Plugin**: \`${modifier.plugin}\`\n\n`)
      markdown.appendMarkdown(`**Bundle Size**: ${modifier.bundleSize}\n\n`)

      if (modifier.swiftUIEquivalent) {
        markdown.appendMarkdown(
          `**SwiftUI**: \`${modifier.swiftUIEquivalent}\`\n\n`
        )
      }

      markdown.appendMarkdown('**Parameters**:\n\n')
      for (const param of modifier.parameters) {
        const required = param.required ? ' *(required)*' : ' *(optional)*'
        markdown.appendMarkdown(
          `• \`${param.name}: ${param.type}\`${required}\n`
        )
        markdown.appendMarkdown(`  ${param.description}\n\n`)
      }

      markdown.appendMarkdown('**Example**:\n\n')
      markdown.appendCodeblock(
        `component.${modifier.usage.basic[0]}`,
        'typescript'
      )

      item.documentation = markdown
      item.detail = `${modifier.plugin} - ${modifier.bundleSize}`

      // Sort order: core modifiers first, then by name
      item.sortText = modifier.plugin.includes('core')
        ? `0_${modifier.name}`
        : `1_${modifier.name}`

      completionItems.push(item)
    }

    return completionItems
  }

  /**
   * Provide hover information for modifiers
   */
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    const wordRange = document.getWordRangeAtPosition(position)
    if (!wordRange) return

    const word = document.getText(wordRange)
    const modifier = modifierParameterRegistry.getModifier(word)

    if (!modifier) return

    const markdown = new vscode.MarkdownString()
    markdown.appendCodeblock(`${modifier.name}()`, 'typescript')
    markdown.appendMarkdown(`${modifier.description}\n\n`)

    // Parameter information
    if (modifier.parameters.length > 0) {
      markdown.appendMarkdown('**Parameters**:\n\n')
      for (const param of modifier.parameters) {
        const required = param.required ? '**required**' : '*optional*'
        const defaultVal =
          param.defaultValue !== undefined
            ? ` = ${JSON.stringify(param.defaultValue)}`
            : ''

        markdown.appendMarkdown(
          `• \`${param.name}: ${param.type}${defaultVal}\` (${required})\n`
        )
        markdown.appendMarkdown(`  ${param.description}\n\n`)
      }
    }

    // Usage examples
    markdown.appendMarkdown('**Usage**:\n\n')
    markdown.appendCodeblock(
      modifier.usage.basic.map(usage => `component.${usage}`).join('\n'),
      'typescript'
    )

    // Bundle and plugin info
    markdown.appendMarkdown(
      `\n**Plugin**: \`${modifier.plugin}\` • **Size**: ${modifier.bundleSize}`
    )

    if (modifier.swiftUIEquivalent) {
      markdown.appendMarkdown(
        ` • **SwiftUI**: \`${modifier.swiftUIEquivalent}\``
      )
    }

    return new vscode.Hover(markdown, wordRange)
  }

  private isInModifierContext(line: string): boolean {
    // Check for patterns like:
    // - component.method()
    // - VStack().method()
    // - Text().method1().method2()

    const patterns = [
      /\w+\(\)\.$/, // component().
      /\.\w*$/, // .method or incomplete .meth
      /\)\s*\.$/, // ) .
    ]

    return patterns.some(pattern => pattern.test(line))
  }
}

/**
 * Signature help provider for modifier parameters
 */
export class TachUISignatureHelpProvider
  implements vscode.SignatureHelpProvider
{
  provideSignatureHelp(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.SignatureHelpContext
  ): vscode.ProviderResult<vscode.SignatureHelp> {
    const line = document.lineAt(position.line).text
    const beforeCursor = line.substring(0, position.character)

    // Find the modifier method being called
    const match = beforeCursor.match(/\.(\w+)\s*\(\s*([^)]*)$/)
    if (!match) return

    const modifierName = match[1]
    const modifier = modifierParameterRegistry.getModifier(modifierName)
    if (!modifier) return

    const signatureHelp = new vscode.SignatureHelp()
    const signature = new vscode.SignatureInformation(
      this.buildSignatureLabel(modifier),
      new vscode.MarkdownString(modifier.description)
    )

    // Add parameter information
    for (const param of modifier.parameters) {
      const paramInfo = new vscode.ParameterInformation(
        param.name,
        new vscode.MarkdownString(param.description)
      )
      signature.parameters.push(paramInfo)
    }

    signatureHelp.signatures = [signature]
    signatureHelp.activeSignature = 0

    // Determine active parameter based on cursor position
    const paramText = match[2]
    const commaCount = (paramText.match(/,/g) || []).length
    signatureHelp.activeParameter = Math.min(
      commaCount,
      modifier.parameters.length - 1
    )

    return signatureHelp
  }

  private buildSignatureLabel(modifier: ModifierSignature): string {
    if (modifier.parameters.length === 0) {
      return `${modifier.name}()`
    }

    const params = modifier.parameters
      .map(param => {
        const optional = param.required ? '' : '?'
        return `${param.name}${optional}: ${param.type}`
      })
      .join(', ')

    return `${modifier.name}({ ${params} })`
  }
}

/**
 * Code action provider for modifier optimization
 */
export class TachUICodeActionProvider implements vscode.CodeActionProvider {
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const actions: vscode.CodeAction[] = []
    const line = document.lineAt(range.start.line).text

    // Suggest parameter validation fixes
    const modifierMatch = line.match(/\.(\\w+)\\s*\\(([^)]*)\\)/)
    if (modifierMatch) {
      const modifierName = modifierMatch[1]
      const paramsText = modifierMatch[2]

      const modifier = modifierParameterRegistry.getModifier(modifierName)
      if (modifier) {
        try {
          // Parse simple parameter formats
          const params = this.parseParameters(paramsText)
          const validation = modifierParameterRegistry.validateParameters(
            modifierName,
            params
          )

          if (!validation.valid) {
            for (const error of validation.errors) {
              const action = new vscode.CodeAction(
                `Fix: ${error}`,
                vscode.CodeActionKind.QuickFix
              )
              action.diagnostics = [...context.diagnostics]
              actions.push(action)
            }
          }
        } catch (_e) {
          // Ignore parsing errors
        }
      }
    }

    return actions
  }

  private parseParameters(paramsText: string): any {
    // Simple parameter parsing - would need more sophisticated parsing in real implementation
    try {
      // Handle object-style parameters: { prop: value }
      if (paramsText.trim().startsWith('{')) {
        // eslint-disable-next-line no-eval
        return eval(`(${paramsText})`) // Unsafe but for demo purposes
      }
      // Handle simple single parameter
      return { value: paramsText.trim() }
    } catch {
      return {}
    }
  }
}

/**
 * Register all providers
 */
export function activate(context: vscode.ExtensionContext) {
  const modifierProvider = new TachUIModifierProvider()
  const signatureProvider = new TachUISignatureHelpProvider()
  const codeActionProvider = new TachUICodeActionProvider()

  // Register completion provider
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      ['typescript', 'typescriptreact'],
      modifierProvider,
      '.' // Trigger on dot
    )
  )

  // Register hover provider
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      ['typescript', 'typescriptreact'],
      modifierProvider
    )
  )

  // Register signature help provider
  context.subscriptions.push(
    vscode.languages.registerSignatureHelpProvider(
      ['typescript', 'typescriptreact'],
      signatureProvider,
      '(',
      ',' // Trigger on opening parenthesis and comma
    )
  )

  // Register code action provider
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      ['typescript', 'typescriptreact'],
      codeActionProvider
    )
  )

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('tachui.showModifierReference', () => {
      const panel = vscode.window.createWebviewPanel(
        'tachUIModifierReference',
        'TachUI Modifier Reference',
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      )

      panel.webview.html = generateModifierReferenceHTML()
    })
  )
}

function generateModifierReferenceHTML(): string {
  const allModifiers = modifierParameterRegistry.getAllModifiers()
  const categories = [...new Set(allModifiers.map(m => m.category))]

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', sans-serif; margin: 20px; line-height: 1.6; }
        .category { margin-bottom: 30px; }
        .modifier { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .modifier-name { font-family: 'Courier New', monospace; font-weight: bold; color: #0066cc; }
        .parameter { margin-left: 20px; margin-bottom: 8px; }
        .parameter-name { font-family: 'Courier New', monospace; font-weight: bold; }
        .example { background: #f5f5f5; padding: 10px; border-radius: 3px; font-family: 'Courier New', monospace; }
      </style>
    </head>
    <body>
      <h1>TachUI Modifier Reference</h1>
  `

  for (const category of categories.sort()) {
    html += `<div class="category"><h2>${category.charAt(0).toUpperCase() + category.slice(1)}</h2>`

    const categoryModifiers = allModifiers
      .filter(m => m.category === category)
      .sort((a, b) => a.name.localeCompare(b.name))

    for (const modifier of categoryModifiers) {
      html += `
        <div class="modifier">
          <div class="modifier-name">.${modifier.name}()</div>
          <p>${modifier.description}</p>
          <p><strong>Plugin:</strong> ${modifier.plugin} • <strong>Size:</strong> ${modifier.bundleSize}</p>
          
          <h4>Parameters:</h4>
      `

      for (const param of modifier.parameters) {
        const required = param.required ? '(required)' : '(optional)'
        html += `
          <div class="parameter">
            <span class="parameter-name">${param.name}:</span> ${param.type} ${required}<br>
            ${param.description}
          </div>
        `
      }

      html += `
          <h4>Example:</h4>
          <div class="example">component.${modifier.usage.basic[0]}</div>
        </div>
      `
    }

    html += '</div>'
  }

  html += '</body></html>'
  return html
}
