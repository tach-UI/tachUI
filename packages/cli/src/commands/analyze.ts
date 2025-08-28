/**
 * Tacho CLI - Analyze Command
 *
 * Code analysis and performance insights for TachUI applications
 */

import { readFileSync, statSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import chalk from 'chalk'
import { Command } from 'commander'
import { glob } from 'glob'
import ora from 'ora'

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
  performance: {
    largeComponents: Array<{ file: string; lines: number; size: number }>
    complexComponents: Array<{ file: string; complexity: number }>
    unusedImports: string[]
  }
  suggestions: string[]
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
  }

  // Analyze imports
  const importMatches = content.match(/import.*from ['"]@tachui\/core['"]/g) || []
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
    analysis.modifierUsage = modifierChains.map((chain) =>
      chain
        .split('.')
        .filter((part) => part.trim() && !part.includes('modifier') && !part.includes('build()'))
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
  lifecycleModifiers.forEach((modifier) => {
    if (content.includes(`.${modifier}(`)) {
      analysis.hasLifecycle = true
      analysis.lifecycleUsage.push(modifier)
    }
  })

  // Analyze navigation usage
  const navigationComponents = ['NavigationView', 'NavigationLink', 'TabView', 'useNavigation']
  navigationComponents.forEach((component) => {
    if (content.includes(component)) {
      analysis.hasNavigation = true
      analysis.navigationUsage.push(component)
    }
  })

  // Find component definitions
  const componentMatches = content.match(/export function (\w+)\(/g) || []
  analysis.components = componentMatches.map((match) =>
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
      'Use TachUI modifiers for consistent styling (.modifier.padding(), .foregroundColor())'
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
  const layoutTypes = new Set(results.patterns.layoutUsage.map((usage) => usage.split('.')[1]))
  if (layoutTypes.size === 1 && layoutTypes.has('VStack')) {
    suggestions.push('Consider using HStack or ZStack for more dynamic layouts')
  }

  return suggestions
}

export const analyzeCommand = new Command('analyze')
  .description('Analyze TachUI codebase for patterns and performance')
  .option('-p, --pattern <pattern>', 'File pattern to analyze', 'src/**/*.{js,jsx,ts,tsx}')
  .option('-o, --output <file>', 'Output report to file')
  .option('--performance', 'Include performance analysis', true)
  .option('--suggestions', 'Include improvement suggestions', true)
  .option('--detailed', 'Show detailed component analysis', false)
  .action(async (options) => {
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
      console.log(`${chalk.gray('Total size:')} ${(results.files.totalSize / 1024).toFixed(1)} KB`)
      console.log(
        `${chalk.gray('Average size:')} ${(results.files.averageSize / 1024).toFixed(1)} KB`
      )

      console.log(`\n${chalk.gray('File types:')}`)
      Object.entries(results.files.byType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`)
      })

      // Component statistics
      console.log(`\n${chalk.yellow('🧩 Component Statistics:')}`)
      console.log(`${chalk.gray('Total components:')} ${results.components.total}`)
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

      const topModifiers = [...new Set(results.patterns.modifierUsage.flat())].slice(0, 5)
      if (topModifiers.length > 0) {
        console.log(`${chalk.gray('Top modifiers:')} ${topModifiers.join(', ')}`)
      }

      const layoutTypes = [...new Set(results.patterns.layoutUsage)]
      if (layoutTypes.length > 0) {
        console.log(`${chalk.gray('Layout types:')} ${layoutTypes.join(', ')}`)
      }

      const lifecycleTypes = [...new Set(results.patterns.lifecycleUsage)]
      if (lifecycleTypes.length > 0) {
        console.log(`${chalk.gray('Lifecycle modifiers:')} ${lifecycleTypes.join(', ')}`)
      }

      // Performance insights
      if (options.performance) {
        console.log(`\n${chalk.yellow('⚡ Performance Insights:')}`)

        if (results.performance.largeComponents.length > 0) {
          console.log(
            `${chalk.red('Large components:')} ${results.performance.largeComponents.length}`
          )
          results.performance.largeComponents.slice(0, 3).forEach((comp) => {
            console.log(`  ${comp.file}: ${comp.lines} lines`)
          })
        }

        if (results.performance.complexComponents.length > 0) {
          console.log(
            `${chalk.red('Complex components:')} ${results.performance.complexComponents.length}`
          )
          results.performance.complexComponents.slice(0, 3).forEach((comp) => {
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
          .filter((analysis) => analysis.components.length > 0)
          .slice(0, 5)
          .forEach((analysis) => {
            const fileName = analysis.file.split('/').pop()
            console.log(`\n${chalk.cyan(fileName)}:`)
            console.log(`  Components: ${analysis.components.join(', ')}`)
            console.log(`  Lines: ${analysis.lines}`)
            console.log(`  Complexity: ${analysis.complexity}`)
            if (analysis.stateUsage.length > 0) {
              console.log(`  State usage: ${analysis.stateUsage.length} instances`)
            }
            if (analysis.modifierUsage.length > 0) {
              console.log(`  Modifier chains: ${analysis.modifierUsage.length}`)
            }
          })
      }

      // TachUI health score
      const stateScore = (results.components.withState / results.files.total) * 25
      const modifierScore = (results.components.withModifiers / results.files.total) * 25
      const lifecycleScore = (results.components.withLifecycle / results.files.total) * 25
      const performanceScore = Math.max(
        0,
        25 -
          (results.performance.largeComponents.length +
            results.performance.complexComponents.length) *
            5
      )

      const healthScore = Math.round(stateScore + modifierScore + lifecycleScore + performanceScore)

      console.log(`\n${chalk.yellow('🏥 TachUI Health Score:')} ${healthScore}/100`)

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
