/**
 * Vite Plugin for TachUI Import Optimization
 *
 * Automatically optimizes imports during build for better bundle size
 */

import type { Plugin } from 'vite'
import * as ts from 'typescript'
import MagicString from 'magic-string'

interface TachUIImportOptimizerOptions {
  /**
   * Enable automatic import optimization
   * @default true
   */
  autoOptimize?: boolean

  /**
   * Show bundle size warnings
   * @default true
   */
  showWarnings?: boolean

  /**
   * Target bundle size goals (in KB)
   */
  bundleTargets?: {
    minimal: number // 15KB
    standard: number // 45KB
    full: number // 100KB
  }

  /**
   * Import transformation rules
   */
  transforms?: Record<string, string | ((namedImports: string[]) => string)>
}

const DEFAULT_TRANSFORMS = {
  '@tachui/core': (namedImports: string[]) => {
    const reactiveImports = [
      'createSignal',
      'createEffect',
      'createComputed',
      'onCleanup',
    ]
    const runtimeImports = [
      'withComponentContext',
      'createComponentContext',
      'ComponentInstance',
    ]
    const assetImports = ['Assets', 'registerAsset', 'createColorAsset']

    if (namedImports.every(imp => reactiveImports.includes(imp))) {
      return '@tachui/core/reactive'
    }
    if (namedImports.every(imp => runtimeImports.includes(imp))) {
      return '@tachui/core/runtime'
    }
    if (namedImports.every(imp => assetImports.includes(imp))) {
      return '@tachui/core/assets'
    }
    return '@tachui/core'
  },

  '@tachui/primitives': (namedImports: string[]) => {
    const layoutImports = ['VStack', 'HStack', 'Spacer']
    const displayImports = ['Text', 'Image', 'ScrollView']
    const controlImports = ['Button', 'TextField', 'Toggle']

    if (namedImports.every(imp => layoutImports.includes(imp))) {
      return '@tachui/primitives/layout'
    }
    if (namedImports.every(imp => displayImports.includes(imp))) {
      return '@tachui/primitives/display'
    }
    if (namedImports.every(imp => controlImports.includes(imp))) {
      return '@tachui/primitives/controls'
    }
    return '@tachui/primitives'
  },
}

export function tachUIImportOptimizer(
  options: TachUIImportOptimizerOptions = {}
): Plugin {
  const {
    autoOptimize = true,
    showWarnings = true,
    bundleTargets = { minimal: 15, standard: 45, full: 100 },
    transforms = DEFAULT_TRANSFORMS,
  } = options

  let bundleSize = 0
  const importStats = new Map<string, number>()

  return {
    name: 'tachui-import-optimizer',
    transform(code, id) {
      if (
        !autoOptimize ||
        !id.includes('tachui') ||
        id.includes('node_modules')
      ) {
        return null
      }

      if (!/\.(ts|tsx|js|jsx)$/.test(id)) {
        return null
      }

      const sourceFile = ts.createSourceFile(
        id,
        code,
        ts.ScriptTarget.Latest,
        true
      )

      const magicString = new MagicString(code)
      let hasChanges = false

      const transformImport = (node: ts.ImportDeclaration) => {
        if (!ts.isStringLiteral(node.moduleSpecifier)) return

        const source = node.moduleSpecifier.text
        const transform = (
          transforms as Record<
            string,
            string | ((namedImports: string[]) => string)
          >
        )[source]

        if (!transform) return

        // Extract named imports
        const namedImports: string[] = []
        if (
          node.importClause?.namedBindings &&
          ts.isNamedImports(node.importClause.namedBindings)
        ) {
          for (const element of node.importClause.namedBindings.elements) {
            namedImports.push(element.name.text)
          }
        }

        let newSource: string
        if (typeof transform === 'function') {
          newSource = transform(namedImports)
        } else {
          newSource = transform
        }

        if (newSource !== source) {
          // Replace the import source
          const start = node.moduleSpecifier.getStart(sourceFile)
          const end = node.moduleSpecifier.getEnd()
          magicString.overwrite(start, end, `'${newSource}'`)
          hasChanges = true

          // Track optimization
          const oldSize = getBundleSize(source)
          const newSize = getBundleSize(newSource)
          const savings = oldSize - newSize

          if (showWarnings && savings > 0) {
            console.log(
              `📦 TachUI: Optimized ${source} → ${newSource} (saves ~${savings}KB)`
            )
          }

          bundleSize += newSize
          importStats.set(
            newSource,
            (importStats.get(newSource) || 0) + newSize
          )
        } else {
          bundleSize += getBundleSize(source)
          importStats.set(
            source,
            (importStats.get(source) || 0) + getBundleSize(source)
          )
        }
      }

      const visit = (node: ts.Node) => {
        if (ts.isImportDeclaration(node)) {
          transformImport(node)
        }
        ts.forEachChild(node, visit)
      }

      visit(sourceFile)

      if (hasChanges) {
        return {
          code: magicString.toString(),
          map: magicString.generateMap({ hires: true }),
        }
      }

      return null
    },

    buildEnd() {
      if (showWarnings) {
        reportBundleAnalysis()
      }
    },
  }

  function getBundleSize(importPath: string): number {
    // Bundle size estimates based on package analysis
    const sizeMap: Record<string, number> = {
      '@tachui/core': 45,
      '@tachui/core/reactive': 12,
      '@tachui/core/runtime': 8,
      '@tachui/core/assets': 6,
      '@tachui/core/minimal': 15,
      '@tachui/primitives': 35,
      '@tachui/primitives/layout': 8,
      '@tachui/primitives/display': 12,
      '@tachui/primitives/controls': 15,
      '@tachui/modifiers': 25,
      '@tachui/effects': 25,
      '@tachui/flow-control': 8,
      '@tachui/forms': 20,
      '@tachui/navigation': 18,
      '@tachui/mobile': 22,
    }
    return sizeMap[importPath] || 0
  }

  function reportBundleAnalysis() {
    console.log('\n📊 TachUI Bundle Analysis')
    console.log('========================')
    console.log(`Total estimated size: ~${bundleSize}KB`)

    if (bundleSize <= bundleTargets.minimal) {
      console.log('✅ Minimal bundle target achieved!')
    } else if (bundleSize <= bundleTargets.standard) {
      console.log('✅ Standard bundle target achieved!')
    } else if (bundleSize <= bundleTargets.full) {
      console.log('⚠️  Large bundle - consider optimizing imports')
    } else {
      console.log('🚨 Very large bundle - review import strategy')
    }

    console.log('\nPackage breakdown:')
    for (const [pkg, size] of importStats.entries()) {
      console.log(`  ${pkg}: ~${size}KB`)
    }

    // Suggest optimizations for large bundles
    if (bundleSize > bundleTargets.standard) {
      console.log('\n💡 Optimization suggestions:')

      if (
        importStats.has('@tachui/core') &&
        !importStats.has('@tachui/core/reactive')
      ) {
        console.log(
          '  - Use @tachui/core/reactive instead of @tachui/core for reactive functions'
        )
      }

      if (
        importStats.has('@tachui/primitives') &&
        importStats.get('@tachui/primitives')! > 15
      ) {
        console.log(
          '  - Use specific @tachui/primitives/* imports for better tree-shaking'
        )
      }

      if (importStats.has('@tachui/effects')) {
        console.log('  - Only import @tachui/effects if you need animations')
      }
    }
  }
}
