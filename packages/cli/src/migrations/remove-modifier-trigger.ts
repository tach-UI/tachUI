import path from 'node:path'
import ts from 'typescript'

export interface ModifierRemovalResult {
  code: string
  modified: boolean
  occurrences: number
}

function getScriptKind(filePath: string): ts.ScriptKind {
  const ext = path.extname(filePath).toLowerCase()
  switch (ext) {
    case '.ts':
      return ts.ScriptKind.TS
    case '.tsx':
      return ts.ScriptKind.TSX
    case '.jsx':
      return ts.ScriptKind.JSX
    case '.cjs':
      return ts.ScriptKind.JS
    case '.mjs':
      return ts.ScriptKind.JS
    case '.cts':
      return ts.ScriptKind.TS
    case '.mts':
      return ts.ScriptKind.TS
    default:
      return ts.ScriptKind.JS
  }
}

function shouldStripModifier(
  node: ts.PropertyAccessExpression | ts.PropertyAccessChain
): boolean {
  if (!ts.isIdentifier(node.name) || node.name.text !== 'modifier') {
    return false
  }

  let parent: ts.Node | undefined = node.parent

  while (parent) {
    if (
      ts.isNonNullExpression(parent) ||
      ts.isParenthesizedExpression(parent) ||
      ts.isTypeAssertionExpression(parent) ||
      ts.isAsExpression(parent) ||
      ts.isSatisfiesExpression?.(parent)
    ) {
      parent = parent.parent
      continue
    }
    break
  }

  if (!parent) {
    return false
  }

  if (ts.isPropertyAccessExpression(parent) || ts.isPropertyAccessChain(parent)) {
    return parent.expression === node
  }

  return false
}

export function transformRemoveModifierTrigger(
  sourceText: string,
  filePath: string
): ModifierRemovalResult {
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(filePath)
  )

  let changes = 0

  const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    const visit: ts.Visitor = (node) => {
      if (ts.isPropertyAccessExpression(node)) {
        const visitedExpression = ts.visitNode(node.expression, visit) as ts.Expression
        if (shouldStripModifier(node)) {
          changes++
          return visitedExpression ?? node.expression
        }

        if (visitedExpression !== node.expression) {
          return context.factory.updatePropertyAccessExpression(
            node,
            visitedExpression,
            node.name
          )
        }
        return node
      }

      if (ts.isPropertyAccessChain(node)) {
        const visitedExpression = ts.visitNode(node.expression, visit) as ts.Expression
        if (shouldStripModifier(node)) {
          changes++
          return visitedExpression ?? node.expression
        }

        if (visitedExpression !== node.expression) {
          return context.factory.updatePropertyAccessChain(
            node,
            visitedExpression,
            node.questionDotToken,
            node.name
          )
        }

        return node
      }

      return ts.visitEachChild(node, visit, context)
    }

    return (node: ts.SourceFile) => ts.visitNode(node, visit) as ts.SourceFile
  }

  const result = ts.transform(sourceFile, [transformer])
  const transformed = result.transformed[0] as ts.SourceFile

  result.dispose()

  if (changes === 0) {
    return {
      code: sourceText,
      modified: false,
      occurrences: 0,
    }
  }

  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
  })

  const code = printer.printFile(transformed)

  return {
    code,
    modified: true,
    occurrences: changes,
  }
}
