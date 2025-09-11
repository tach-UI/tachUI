/**
 * Auto-sensing Build-Time Import Optimizer
 *
 * Analyzes usage patterns and suggests optimal import paths for bundle size
 */

import * as ts from 'typescript'
import { readFileSync, writeFileSync } from 'fs'
import { glob } from 'glob'

interface ImportAnalysis {
  file: string
  imports: {
    specifier: string
    source: string
    suggestedSource?: string
    bundleImpact: 'minimal' | 'moderate' | 'significant'
    reasoning: string
  }[]
}

interface ImportOptimization {
  from: string
  to: string
  savings: string
  risk: 'low' | 'medium' | 'high'
}

export class ImportOptimizer {
  private packageMap = new Map<
    string,
    {
      path: string
      exports: string[]
      bundleSize: number
    }
  >()

  constructor() {
    this.buildPackageMap()
  }

  private buildPackageMap() {
    // Map tachUI packages and their optimal import paths
    this.packageMap.set('@tachui/core', {
      path: '@tachui/core',
      exports: ['createSignal', 'createEffect', 'createComputed'],
      bundleSize: 45, // KB
    })

    this.packageMap.set('@tachui/core/reactive', {
      path: '@tachui/core/reactive',
      exports: ['createSignal', 'createEffect', 'createComputed', 'onCleanup'],
      bundleSize: 12, // KB
    })

    this.packageMap.set('@tachui/primitives', {
      path: '@tachui/primitives',
      exports: ['VStack', 'HStack', 'Text', 'Button'],
      bundleSize: 35, // KB
    })

    this.packageMap.set('@tachui/primitives/layout', {
      path: '@tachui/primitives/layout',
      exports: ['VStack', 'HStack', 'Spacer'],
      bundleSize: 8, // KB
    })

    this.packageMap.set('@tachui/primitives/display', {
      path: '@tachui/primitives/display',
      exports: ['Text', 'Image', 'ScrollView'],
      bundleSize: 12, // KB
    })

    this.packageMap.set('@tachui/primitives/controls', {
      path: '@tachui/primitives/controls',
      exports: ['Button', 'TextField', 'Toggle'],
      bundleSize: 15, // KB
    })
  }

  /**
   * Analyze imports in a TypeScript/JavaScript file
   */
  analyzeFile(filePath: string): ImportAnalysis {
    const sourceCode = readFileSync(filePath, 'utf-8')
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    )

    const imports: ImportAnalysis['imports'] = []

    const visit = (node: ts.Node) => {
      if (
        ts.isImportDeclaration(node) &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        const source = node.moduleSpecifier.text

        if (source.startsWith('@tachui/')) {
          const namedImports = this.extractNamedImports(node)
          const optimization = this.findOptimalImport(source, namedImports)

          imports.push({
            specifier: namedImports.join(', '),
            source,
            suggestedSource: optimization.to,
            bundleImpact: this.calculateBundleImpact(source, optimization.to),
            reasoning: optimization.reasoning,
          })
        }
      }

      ts.forEachChild(node, visit)
    }

    visit(sourceFile)

    return { file: filePath, imports }
  }

  /**
   * Analyze entire project and suggest optimizations
   */
  async analyzeProject(projectRoot: string): Promise<ImportOptimization[]> {
    const files = await glob('**/*.{ts,tsx,js,jsx}', {
      cwd: projectRoot,
      ignore: ['node_modules/**', 'dist/**', '**/*.d.ts'],
    })

    const optimizations: ImportOptimization[] = []

    for (const file of files) {
      const analysis = this.analyzeFile(`${projectRoot}/${file}`)

      for (const imp of analysis.imports) {
        if (imp.suggestedSource && imp.suggestedSource !== imp.source) {
          optimizations.push({
            from: imp.source,
            to: imp.suggestedSource,
            savings: this.calculateSavings(imp.source, imp.suggestedSource),
            risk: this.assessRisk(imp.source, imp.suggestedSource),
          })
        }
      }
    }

    return this.dedupeOptimizations(optimizations)
  }

  private extractNamedImports(node: ts.ImportDeclaration): string[] {
    const imports: string[] = []

    if (node.importClause?.namedBindings) {
      if (ts.isNamedImports(node.importClause.namedBindings)) {
        for (const element of node.importClause.namedBindings.elements) {
          imports.push(element.name.text)
        }
      }
    }

    return imports
  }

  private findOptimalImport(
    source: string,
    namedImports: string[]
  ): {
    to: string
    reasoning: string
  } {
    // Check if imports can be optimized to more specific packages
    const layoutImports = ['VStack', 'HStack', 'Spacer']
    const displayImports = ['Text', 'Image', 'ScrollView']
    const controlImports = ['Button', 'TextField', 'Toggle']
    const reactiveImports = [
      'createSignal',
      'createEffect',
      'createComputed',
      'onCleanup',
    ]

    if (source === '@tachui/core') {
      if (namedImports.every(imp => reactiveImports.includes(imp))) {
        return {
          to: '@tachui/core/reactive',
          reasoning: `Only reactive imports detected, can reduce bundle by ~33KB`,
        }
      }
    }

    if (source === '@tachui/primitives') {
      if (namedImports.every(imp => layoutImports.includes(imp))) {
        return {
          to: '@tachui/primitives/layout',
          reasoning: `Only layout components used, saves ~27KB by avoiding display/controls`,
        }
      }
      if (namedImports.every(imp => displayImports.includes(imp))) {
        return {
          to: '@tachui/primitives/display',
          reasoning: `Only display components used, saves ~23KB by avoiding layout/controls`,
        }
      }
      if (namedImports.every(imp => controlImports.includes(imp))) {
        return {
          to: '@tachui/primitives/controls',
          reasoning: `Only control components used, saves ~20KB by avoiding layout/display`,
        }
      }
    }

    return { to: source, reasoning: 'Already optimal' }
  }

  private calculateBundleImpact(
    current: string,
    suggested: string
  ): 'minimal' | 'moderate' | 'significant' {
    const currentSize = this.packageMap.get(current)?.bundleSize || 0
    const suggestedSize = this.packageMap.get(suggested)?.bundleSize || 0
    const savings = currentSize - suggestedSize

    if (savings > 20) return 'significant'
    if (savings > 10) return 'moderate'
    return 'minimal'
  }

  private calculateSavings(from: string, to: string): string {
    const fromSize = this.packageMap.get(from)?.bundleSize || 0
    const toSize = this.packageMap.get(to)?.bundleSize || 0
    return `~${fromSize - toSize}KB`
  }

  private assessRisk(from: string, to: string): 'low' | 'medium' | 'high' {
    // Risk assessment based on import specificity
    if (from.includes('/') && !to.includes('/')) return 'high'
    if (!from.includes('/') && to.includes('/')) return 'low'
    return 'medium'
  }

  private dedupeOptimizations(
    optimizations: ImportOptimization[]
  ): ImportOptimization[] {
    const seen = new Set<string>()
    return optimizations.filter(opt => {
      const key = `${opt.from}->${opt.to}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  /**
   * Generate import optimization report
   */
  generateReport(optimizations: ImportOptimization[]): string {
    let report = `# TachUI Import Optimization Report\n\n`

    const significantSavings = optimizations.filter(
      opt => parseInt(opt.savings.replace(/[^\d]/g, '')) > 20
    )

    const moderateSavings = optimizations.filter(
      opt =>
        parseInt(opt.savings.replace(/[^\d]/g, '')) > 10 &&
        parseInt(opt.savings.replace(/[^\d]/g, '')) <= 20
    )

    if (significantSavings.length > 0) {
      report += `## 🚀 High Impact Optimizations (${significantSavings.length})\n\n`
      for (const opt of significantSavings) {
        report += `- \`${opt.from}\` → \`${opt.to}\` (saves ${opt.savings})\n`
      }
      report += `\n`
    }

    if (moderateSavings.length > 0) {
      report += `## 📈 Moderate Impact Optimizations (${moderateSavings.length})\n\n`
      for (const opt of moderateSavings) {
        report += `- \`${opt.from}\` → \`${opt.to}\` (saves ${opt.savings})\n`
      }
      report += `\n`
    }

    const totalSavings = optimizations.reduce(
      (sum, opt) => sum + parseInt(opt.savings.replace(/[^\d]/g, '')),
      0
    )

    report += `## 📊 Summary\n\n`
    report += `- **Total Potential Savings**: ~${totalSavings}KB\n`
    report += `- **Optimizations Found**: ${optimizations.length}\n`
    report += `- **Low Risk Changes**: ${optimizations.filter(o => o.risk === 'low').length}\n`

    return report
  }
}

/**
 * CLI command for running import optimization
 */
export async function runImportOptimizer(projectRoot: string = process.cwd()) {
  const optimizer = new ImportOptimizer()
  console.log('🔍 Analyzing TachUI imports...')

  const optimizations = await optimizer.analyzeProject(projectRoot)
  const report = optimizer.generateReport(optimizations)

  console.log(report)

  // Save report to file
  writeFileSync(`${projectRoot}/tachui-import-report.md`, report)
  console.log(`\n📄 Report saved to: tachui-import-report.md`)
}
