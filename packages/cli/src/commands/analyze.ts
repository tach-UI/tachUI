/**
 * Tacho CLI - Analyze Command
 *
 * Code analysis and performance insights for TachUI applications
 */

import { readFileSync, statSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as ts from 'typescript'
import chalk from 'chalk'
import { Command } from 'commander'
import { glob } from 'glob'
import ora from 'ora'

// Import concatenation analysis from core compiler
// Note: In real implementation, these would be properly exported from @tachui/core/compiler
interface ConcatenationPattern {
  type: 'static' | 'dynamic'
  location: { start: number; end: number }
  leftComponent: string
  rightComponent: string
  optimizable: boolean
  accessibilityNeeds: 'minimal' | 'aria' | 'full'
}

interface ConcatenationAnalysis {
  totalPatterns: number
  optimizedPatterns: number
  staticPatterns: number
  dynamicPatterns: number
  bundleSavingsKB: number
  accessibilityBreakdown: {
    minimal: number
    aria: number
    full: number
  }
  recommendations: string[]
}

interface FileAnalysis {
  file: string
  lines: number
  size: number
  hasState: boolean
  hasModifiers: boolean
  hasLifecycle: boolean
  hasNavigation: boolean
  imports: string[]
  exports: string[]
  components: string[]
  stateUsage: string[]
  modifierUsage: string[]
  layoutUsage: string[]
  lifecycleUsage: string[]
  navigationUsage: string[]
  complexity: number
  concatenationPatterns: ConcatenationPattern[]
}

interface AnalysisResult {
  files: {
    total: number
    byType: Record<string, number>
    totalSize: number
    averageSize: number
  }
  components: {
    total: number
    withState: number
    withModifiers: number
    withLifecycle: number
    withNavigation: number
  }
  patterns: {
    stateUsage: string[]
    modifierUsage: string[]
    layoutUsage: string[]
    lifecycleUsage: string[]
    navigationUsage: string[]
  }
  concatenation: ConcatenationAnalysis
  performance: {
    largeComponents: Array<{ file: string; lines: number; size: number }>
    complexComponents: Array<{ file: string; complexity: number }>
    unusedImports: string[]
  }
  suggestions: string[]
}

/**
 * CLI-specific concatenation pattern analysis using TypeScript AST
 * Replaces regex-based approach with proper AST analysis
 */
function analyzeConcatenationPatterns(
  content: string,
  filename: string = 'temp.ts'
): ConcatenationPattern[] {
  const patterns: ConcatenationPattern[] = []

  try {
    // Parse the code into a TypeScript AST
    const sourceFile = ts.createSourceFile(
      filename,
      content,
      ts.ScriptTarget.Latest,
      true,
      filename.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    )

    // Walk the AST to find .concat() calls
    function visit(node: ts.Node): void {
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === 'concat'
      ) {
        // Check if this is a .build().concat() pattern
        const leftExpression = node.expression.expression
        if (
          ts.isCallExpression(leftExpression) &&
          ts.isPropertyAccessExpression(leftExpression.expression) &&
          leftExpression.expression.name.text === 'build'
        ) {
          // Extract left component (everything before .build())
          const componentChain = leftExpression.expression.expression
          const leftComponent = extractComponentExpression(
            componentChain,
            content
          )

          // Extract right component (first argument to .concat())
          const rightComponent =
            node.arguments.length > 0
              ? extractComponentExpression(node.arguments[0], content)
              : ''

          if (leftComponent && rightComponent) {
            // Get source location
            const start = node.getStart(sourceFile)
            const end = node.getEnd()

            // Simple static analysis
            const hasVariable =
              /\$\{[^}]+\}|[a-zA-Z_$][a-zA-Z0-9_$]*\[[^\]]*\]|entry\[/.test(
                leftComponent + rightComponent
              )
            const isStatic = !hasVariable

            // Accessibility analysis
            const hasInteractive = /\bButton\b|\bLink\b/i.test(
              leftComponent + rightComponent
            )
            const hasComplexLayout = /\bVStack\b|\bHStack\b|\bZStack\b/i.test(
              content
            )

            let accessibilityNeeds: 'minimal' | 'aria' | 'full'
            if (hasComplexLayout) {
              accessibilityNeeds = 'full'
            } else if (hasInteractive) {
              accessibilityNeeds = 'aria'
            } else {
              accessibilityNeeds = 'minimal'
            }

            patterns.push({
              type: isStatic ? 'static' : 'dynamic',
              location: { start, end },
              leftComponent: leftComponent.trim(),
              rightComponent: rightComponent.trim(),
              optimizable: isStatic,
              accessibilityNeeds,
            })
          }
        }
      }

      // Continue traversing child nodes
      ts.forEachChild(node, visit)
    }

    visit(sourceFile)
  } catch (error) {
    // If AST parsing fails, return empty patterns (graceful fallback)
    console.warn(`Failed to parse for concatenation analysis:`, error)
  }

  return patterns
}

/**
 * Helper function to extract component expression text from AST node
 */
function extractComponentExpression(node: ts.Node, sourceCode: string): string {
  const start = node.getStart()
  const end = node.getEnd()
  return sourceCode.substring(start, end)
}

/**
 * Generate comprehensive concatenation analysis for CLI reporting
 */
function generateConcatenationAnalysis(
  allPatterns: ConcatenationPattern[]
): ConcatenationAnalysis {
  const staticPatterns = allPatterns.filter(p => p.type === 'static').length
  const dynamicPatterns = allPatterns.filter(p => p.type === 'dynamic').length
  const optimizedPatterns = allPatterns.filter(p => p.optimizable).length

  // Calculate bundle savings
  const baseConcatenationSize = 87.76 // KB
  const selectedRuntimes = new Set(allPatterns.map(p => p.accessibilityNeeds))
  const optimizedSize = selectedRuntimes.size * 5 // 5KB per runtime
  const bundleSavingsKB = Math.max(0, baseConcatenationSize - optimizedSize)

  // Accessibility breakdown
  const accessibilityBreakdown = {
    minimal: allPatterns.filter(p => p.accessibilityNeeds === 'minimal').length,
    aria: allPatterns.filter(p => p.accessibilityNeeds === 'aria').length,
    full: allPatterns.filter(p => p.accessibilityNeeds === 'full').length,
  }

  // Generate recommendations
  const recommendations: string[] = []

  if (dynamicPatterns > staticPatterns) {
    recommendations.push(
      'Consider extracting variables from concatenation patterns to enable static optimization'
    )
  }

  if (
    accessibilityBreakdown.full >
    accessibilityBreakdown.minimal + accessibilityBreakdown.aria
  ) {
    recommendations.push(
      'Many concatenations require full accessibility - consider simplifying component structures'
    )
  }

  if (allPatterns.length > 10 && optimizedPatterns / allPatterns.length < 0.5) {
    recommendations.push(
      'Low optimization rate - review concatenation patterns for static optimization opportunities'
    )
  }

  if (bundleSavingsKB > 50) {
    recommendations.push(
      `High bundle savings potential: ${bundleSavingsKB.toFixed(1)}KB - implement concatenation optimization`
    )
  }

  return {
    totalPatterns: allPatterns.length,
    optimizedPatterns,
    staticPatterns,
    dynamicPatterns,
    bundleSavingsKB,
    accessibilityBreakdown,
    recommendations,
  }
}

function analyzeFile(filePath: string, content: string): FileAnalysis {
  const lines = content.split('\n')
  const analysis = {
    file: filePath,
    lines: lines.length,
    size: Buffer.byteLength(content, 'utf8'),
    hasState: false,
    hasModifiers: false,
    hasLifecycle: false,
    hasNavigation: false,
    imports: [] as string[],
    exports: [] as string[],
    components: [] as string[],
    stateUsage: [] as string[],
    modifierUsage: [] as string[],
    layoutUsage: [] as string[],
    lifecycleUsage: [] as string[],
    navigationUsage: [] as string[],
    complexity: 0,
    concatenationPatterns: [] as ConcatenationPattern[],
  }

  // Analyze imports
  const importMatches =
    content.match(/import.*from ['"]@tachui\/core['"]/g) || []
  analysis.imports = importMatches

  // Analyze state usage
  if (
    content.includes('State(') ||
    content.includes('ObservedObject(') ||
    content.includes('EnvironmentObject(')
  ) {
    analysis.hasState = true

    const stateMatches = content.match(/const \w+ = State\([^)]*\)/g) || []
    analysis.stateUsage.push(...stateMatches)
  }

  // Analyze modifier usage
  if (content.includes('.modifier')) {
    analysis.hasModifiers = true

    const modifierChains = content.match(/\.modifier[\s\S]*?\.build\(\)/g) || []
    analysis.modifierUsage = modifierChains.map(chain =>
      chain
        .split('.')
        .filter(
          part =>
            part.trim() &&
            !part.includes('modifier') &&
            !part.includes('build()')
        )
        .join('.')
    )
  }

  // Analyze layout usage
  const layoutMatches = content.match(/Layout\.(VStack|HStack|ZStack)/g) || []
  analysis.layoutUsage = [...new Set(layoutMatches)]

  if (layoutMatches.length > 0) {
    analysis.complexity += layoutMatches.length
  }

  // Analyze lifecycle usage
  const lifecycleModifiers = ['onAppear', 'onDisappear', 'task', 'refreshable']
  lifecycleModifiers.forEach(modifier => {
    if (content.includes(`.${modifier}(`)) {
      analysis.hasLifecycle = true
      analysis.lifecycleUsage.push(modifier)
    }
  })

  // Analyze navigation usage
  const navigationComponents = [
    'NavigationView',
    'NavigationLink',
    'TabView',
    'useNavigation',
  ]
  navigationComponents.forEach(component => {
    if (content.includes(component)) {
      analysis.hasNavigation = true
      analysis.navigationUsage.push(component)
    }
  })

  // Find component definitions
  const componentMatches = content.match(/export function (\w+)\(/g) || []
  analysis.components = componentMatches.map(match =>
    match.replace('export function ', '').replace('(', '')
  )

  // Calculate complexity score
  analysis.complexity += (content.match(/if\s*\(/g) || []).length * 2
  analysis.complexity += (content.match(/for\s*\(/g) || []).length * 2
  analysis.complexity += (content.match(/while\s*\(/g) || []).length * 2
  analysis.complexity += (content.match(/switch\s*\(/g) || []).length * 3
  analysis.complexity += (content.match(/\.map\(/g) || []).length
  analysis.complexity += (content.match(/\.filter\(/g) || []).length
  analysis.complexity += analysis.modifierUsage.length * 0.5

  // Analyze concatenation patterns
  analysis.concatenationPatterns = analyzeConcatenationPatterns(
    content,
    filePath
  )

  return analysis
}

function generateSuggestions(results: AnalysisResult): string[] {
  const suggestions: string[] = []

  // State management suggestions
  if (results.components.withState < results.components.total * 0.3) {
    suggestions.push('Consider using @State for more reactive components')
  }

  // Modifier usage suggestions
  if (results.components.withModifiers < results.components.total * 0.7) {
    suggestions.push(
      'Use TachUI modifiers for consistent styling (.padding(), .foregroundColor())'
    )
  }

  // Lifecycle suggestions
  if (results.components.withLifecycle < results.components.total * 0.2) {
    suggestions.push(
      'Consider using lifecycle modifiers (onAppear, task) for better component behavior'
    )
  }

  // Performance suggestions
  if (results.performance.largeComponents.length > 0) {
    suggestions.push(
      `Break down large components (${results.performance.largeComponents.length} components >200 lines)`
    )
  }

  if (results.performance.complexComponents.length > 0) {
    suggestions.push(
      `Simplify complex components (${results.performance.complexComponents.length} components with high complexity)`
    )
  }

  // Pattern suggestions
  const hasNavigation = results.patterns.navigationUsage.length > 0
  if (!hasNavigation && results.components.total > 3) {
    suggestions.push(
      'Consider adding navigation (NavigationView, TabView) for better user experience'
    )
  }

  // Layout suggestions
  const layoutTypes = new Set(
    results.patterns.layoutUsage.map(usage => usage.split('.')[1])
  )
  if (layoutTypes.size === 1 && layoutTypes.has('VStack')) {
    suggestions.push('Consider using HStack or ZStack for more dynamic layouts')
  }

  return suggestions
}

export const analyzeCommand = new Command('analyze')
  .description('Analyze TachUI codebase for patterns and performance')
  .option(
    '-p, --pattern <pattern>',
    'File pattern to analyze',
    'src/**/*.{js,jsx,ts,tsx}'
  )
  .option('-o, --output <file>', 'Output report to file')
  .option('--performance', 'Include performance analysis', true)
  .option('--suggestions', 'Include improvement suggestions', true)
  .option('--detailed', 'Show detailed component analysis', false)
  .option(
    '--concatenation',
    'Focus on concatenation optimization analysis',
    false
  )
  .action(async options => {
    try {
      console.log(
        chalk.cyan(`
╭─────────────────────────────────────╮
│  📊 TachUI Code Analyzer            │
│  Pattern analysis & metrics         │
╰─────────────────────────────────────╯
`)
      )

      const spinner = ora('Analyzing codebase...').start()

      // Find files to analyze
      const files = await glob(options.pattern, {
        cwd: process.cwd(),
        absolute: true,
      })

      if (files.length === 0) {
        spinner.fail('No files found matching pattern')
        console.log(chalk.yellow(`Pattern: ${options.pattern}`))
        return
      }

      const fileAnalyses: FileAnalysis[] = []
      const results: AnalysisResult = {
        files: {
          total: 0,
          byType: {},
          totalSize: 0,
          averageSize: 0,
        },
        components: {
          total: 0,
          withState: 0,
          withModifiers: 0,
          withLifecycle: 0,
          withNavigation: 0,
        },
        patterns: {
          stateUsage: [],
          modifierUsage: [],
          layoutUsage: [],
          lifecycleUsage: [],
          navigationUsage: [],
        },
        concatenation: {
          totalPatterns: 0,
          optimizedPatterns: 0,
          staticPatterns: 0,
          dynamicPatterns: 0,
          bundleSavingsKB: 0,
          accessibilityBreakdown: {
            minimal: 0,
            aria: 0,
            full: 0,
          },
          recommendations: [],
        },
        performance: {
          largeComponents: [],
          complexComponents: [],
          unusedImports: [],
        },
        suggestions: [],
      }

      // Analyze each file
      for (const file of files) {
        try {
          const content = readFileSync(file, 'utf-8')
          const stats = statSync(file)
          const ext = file.split('.').pop() || 'unknown'

          const analysis = analyzeFile(file, content)
          fileAnalyses.push(analysis)

          // Update file stats
          results.files.total++
          results.files.byType[ext] = (results.files.byType[ext] || 0) + 1
          results.files.totalSize += stats.size

          // Update component stats
          results.components.total += analysis.components.length
          if (analysis.hasState) results.components.withState++
          if (analysis.hasModifiers) results.components.withModifiers++
          if (analysis.hasLifecycle) results.components.withLifecycle++
          if (analysis.hasNavigation) results.components.withNavigation++

          // Collect patterns
          results.patterns.stateUsage.push(...analysis.stateUsage)
          results.patterns.modifierUsage.push(...analysis.modifierUsage)
          results.patterns.layoutUsage.push(...analysis.layoutUsage)
          results.patterns.lifecycleUsage.push(...analysis.lifecycleUsage)
          results.patterns.navigationUsage.push(...analysis.navigationUsage)

          // Performance analysis
          if (analysis.lines > 200) {
            results.performance.largeComponents.push({
              file: file.split('/').pop() || file,
              lines: analysis.lines,
              size: analysis.size,
            })
          }

          if (analysis.complexity > 20) {
            results.performance.complexComponents.push({
              file: file.split('/').pop() || file,
              complexity: analysis.complexity,
            })
          }
        } catch (_error) {
          // Skip files that can't be read
        }
      }

      results.files.averageSize = results.files.totalSize / results.files.total

      // Generate concatenation analysis
      const allConcatenationPatterns = fileAnalyses.flatMap(
        f => f.concatenationPatterns
      )
      results.concatenation = generateConcatenationAnalysis(
        allConcatenationPatterns
      )

      // Generate suggestions
      if (options.suggestions) {
        results.suggestions = generateSuggestions(results)
      }

      spinner.succeed('Code analysis complete!')

      // Display results
      console.log(`\n${chalk.green('📊 Analysis Results')}`)
      console.log(chalk.gray('─'.repeat(40)))

      // File statistics
      console.log(`\n${chalk.yellow('📁 File Statistics:')}`)
      console.log(`${chalk.gray('Total files:')} ${results.files.total}`)
      console.log(
        `${chalk.gray('Total size:')} ${(results.files.totalSize / 1024).toFixed(1)} KB`
      )
      console.log(
        `${chalk.gray('Average size:')} ${(results.files.averageSize / 1024).toFixed(1)} KB`
      )

      console.log(`\n${chalk.gray('File types:')}`)
      Object.entries(results.files.byType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`)
      })

      // Component statistics
      console.log(`\n${chalk.yellow('🧩 Component Statistics:')}`)
      console.log(
        `${chalk.gray('Total components:')} ${results.components.total}`
      )
      console.log(
        `${chalk.gray('With @State:')} ${results.components.withState} (${((results.components.withState / results.files.total) * 100).toFixed(1)}%)`
      )
      console.log(
        `${chalk.gray('With modifiers:')} ${results.components.withModifiers} (${((results.components.withModifiers / results.files.total) * 100).toFixed(1)}%)`
      )
      console.log(
        `${chalk.gray('With lifecycle:')} ${results.components.withLifecycle} (${((results.components.withLifecycle / results.files.total) * 100).toFixed(1)}%)`
      )
      console.log(
        `${chalk.gray('With navigation:')} ${results.components.withNavigation} (${((results.components.withNavigation / results.files.total) * 100).toFixed(1)}%)`
      )

      // Pattern usage
      console.log(`\n${chalk.yellow('🎨 Pattern Usage:')}`)

      const topModifiers = [
        ...new Set(results.patterns.modifierUsage.flat()),
      ].slice(0, 5)
      if (topModifiers.length > 0) {
        console.log(
          `${chalk.gray('Top modifiers:')} ${topModifiers.join(', ')}`
        )
      }

      const layoutTypes = [...new Set(results.patterns.layoutUsage)]
      if (layoutTypes.length > 0) {
        console.log(`${chalk.gray('Layout types:')} ${layoutTypes.join(', ')}`)
      }

      const lifecycleTypes = [...new Set(results.patterns.lifecycleUsage)]
      if (lifecycleTypes.length > 0) {
        console.log(
          `${chalk.gray('Lifecycle modifiers:')} ${lifecycleTypes.join(', ')}`
        )
      }

      // Concatenation Analysis (Enhanced when --concatenation flag is used)
      if (results.concatenation.totalPatterns > 0) {
        console.log(`\n${chalk.yellow('🔗 Concatenation Analysis:')}`)
        console.log(
          `${chalk.gray('Total patterns:')} ${results.concatenation.totalPatterns}`
        )
        console.log(
          `${chalk.gray('✅ Static/Optimizable:')} ${results.concatenation.optimizedPatterns} (${Math.round((results.concatenation.optimizedPatterns / results.concatenation.totalPatterns) * 100)}%)`
        )
        console.log(
          `${chalk.gray('🔄 Dynamic/Runtime:')} ${results.concatenation.dynamicPatterns}`
        )
        console.log(
          `${chalk.gray('💾 Bundle savings:')} ${results.concatenation.bundleSavingsKB.toFixed(1)}KB`
        )

        const { accessibilityBreakdown } = results.concatenation
        console.log(
          `${chalk.gray('♿ Accessibility breakdown:')} Minimal: ${accessibilityBreakdown.minimal}, ARIA: ${accessibilityBreakdown.aria}, Full: ${accessibilityBreakdown.full}`
        )

        if (results.concatenation.recommendations.length > 0) {
          console.log(`${chalk.gray('💡 Recommendations:')}`)
          const maxRecs = options.concatenation
            ? results.concatenation.recommendations.length
            : 3
          results.concatenation.recommendations
            .slice(0, maxRecs)
            .forEach((rec, index) => {
              console.log(`  ${index + 1}. ${rec}`)
            })
        }

        // Enhanced concatenation analysis when --concatenation flag is used
        if (options.concatenation && allConcatenationPatterns.length > 0) {
          console.log(`\n${chalk.cyan('📋 Detailed Concatenation Report:')}`)

          // Group patterns by file for detailed analysis
          const patternsByFile = new Map<string, ConcatenationPattern[]>()
          fileAnalyses.forEach(analysis => {
            if (analysis.concatenationPatterns.length > 0) {
              const shortFilename =
                analysis.file.split('/').pop() || analysis.file
              patternsByFile.set(shortFilename, analysis.concatenationPatterns)
            }
          })

          patternsByFile.forEach((patterns, filename) => {
            console.log(`\n${chalk.green(filename)}:`)
            patterns.forEach((pattern, index) => {
              const optimizationIcon = pattern.optimizable ? '✅' : '🔄'
              const accessibilityColor =
                pattern.accessibilityNeeds === 'minimal'
                  ? chalk.green
                  : pattern.accessibilityNeeds === 'aria'
                    ? chalk.yellow
                    : chalk.red
              console.log(
                `  ${optimizationIcon} Pattern ${index + 1}: ${pattern.type} (${accessibilityColor(pattern.accessibilityNeeds)})`
              )
              console.log(
                `     Left: ${pattern.leftComponent.substring(0, 50)}${pattern.leftComponent.length > 50 ? '...' : ''}`
              )
              console.log(
                `     Right: ${pattern.rightComponent.substring(0, 50)}${pattern.rightComponent.length > 50 ? '...' : ''}`
              )
            })
          })

          // Optimization opportunities
          const optimizablePatterns = allConcatenationPatterns.filter(
            p => !p.optimizable
          )
          if (optimizablePatterns.length > 0) {
            console.log(`\n${chalk.yellow('🚀 Optimization Opportunities:')}`)
            optimizablePatterns.slice(0, 5).forEach((pattern, index) => {
              console.log(
                `  ${index + 1}. Convert dynamic pattern to static in ${pattern.leftComponent}`
              )
            })
          }

          console.log(`\n${chalk.cyan('💾 Bundle Impact Projection:')}`)
          console.log(`  Current concatenation system: 87.76KB`)
          console.log(
            `  Optimized system: ${(87.76 - results.concatenation.bundleSavingsKB).toFixed(1)}KB`
          )
          console.log(
            `  ${chalk.green(`Savings: ${results.concatenation.bundleSavingsKB.toFixed(1)}KB (${Math.round((results.concatenation.bundleSavingsKB / 87.76) * 100)}%)`)}`
          )
        }
      } else if (options.concatenation) {
        console.log(`\n${chalk.yellow('🔗 Concatenation Analysis:')}`)
        console.log(
          chalk.gray('No concatenation patterns found in analyzed files')
        )
        console.log(
          chalk.gray(
            '💡 Concatenation optimization is available when you use .build().concat() patterns'
          )
        )
      }

      // Performance insights
      if (options.performance) {
        console.log(`\n${chalk.yellow('⚡ Performance Insights:')}`)

        if (results.performance.largeComponents.length > 0) {
          console.log(
            `${chalk.red('Large components:')} ${results.performance.largeComponents.length}`
          )
          results.performance.largeComponents.slice(0, 3).forEach(comp => {
            console.log(`  ${comp.file}: ${comp.lines} lines`)
          })
        }

        if (results.performance.complexComponents.length > 0) {
          console.log(
            `${chalk.red('Complex components:')} ${results.performance.complexComponents.length}`
          )
          results.performance.complexComponents.slice(0, 3).forEach(comp => {
            console.log(`  ${comp.file}: complexity ${comp.complexity}`)
          })
        }

        if (
          results.performance.largeComponents.length === 0 &&
          results.performance.complexComponents.length === 0
        ) {
          console.log(chalk.green('✅ No performance issues detected'))
        }
      }

      // Suggestions
      if (options.suggestions && results.suggestions.length > 0) {
        console.log(`\n${chalk.yellow('💡 Improvement Suggestions:')}`)
        results.suggestions.forEach((suggestion, index) => {
          console.log(`${chalk.gray(`${index + 1}.`)} ${suggestion}`)
        })
      }

      // Detailed analysis
      if (options.detailed && fileAnalyses.length > 0) {
        console.log(`\n${chalk.yellow('🔍 Detailed Component Analysis:')}`)

        fileAnalyses
          .filter(analysis => analysis.components.length > 0)
          .slice(0, 5)
          .forEach(analysis => {
            const fileName = analysis.file.split('/').pop()
            console.log(`\n${chalk.cyan(fileName)}:`)
            console.log(`  Components: ${analysis.components.join(', ')}`)
            console.log(`  Lines: ${analysis.lines}`)
            console.log(`  Complexity: ${analysis.complexity}`)
            if (analysis.stateUsage.length > 0) {
              console.log(
                `  State usage: ${analysis.stateUsage.length} instances`
              )
            }
            if (analysis.modifierUsage.length > 0) {
              console.log(`  Modifier chains: ${analysis.modifierUsage.length}`)
            }
          })
      }

      // TachUI health score
      const stateScore =
        (results.components.withState / results.files.total) * 25
      const modifierScore =
        (results.components.withModifiers / results.files.total) * 25
      const lifecycleScore =
        (results.components.withLifecycle / results.files.total) * 25
      const performanceScore = Math.max(
        0,
        25 -
          (results.performance.largeComponents.length +
            results.performance.complexComponents.length) *
            5
      )

      const healthScore = Math.round(
        stateScore + modifierScore + lifecycleScore + performanceScore
      )

      console.log(
        `\n${chalk.yellow('🏥 TachUI Health Score:')} ${healthScore}/100`
      )

      let healthColor = chalk.red
      if (healthScore >= 80) healthColor = chalk.green
      else if (healthScore >= 60) healthColor = chalk.yellow

      console.log(
        healthColor(
          `${'█'.repeat(Math.floor(healthScore / 5))}${'░'.repeat(20 - Math.floor(healthScore / 5))}`
        )
      )

      // Save report if requested
      if (options.output) {
        const report = JSON.stringify(results, null, 2)
        writeFileSync(resolve(options.output), report)
        console.log(`\n${chalk.green('📄 Report saved to:')} ${options.output}`)
      }

      console.log(`\n${chalk.green('Analysis complete! 🎉')}`)
    } catch (error) {
      console.error(chalk.red('Analysis error:'), (error as Error).message)
      process.exit(1)
    }
  })
