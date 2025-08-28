/**
 * Tacho CLI - Optimize Command
 *
 * Performance optimization tools for TachUI applications
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import chalk from 'chalk'
import { Command } from 'commander'
import { glob } from 'glob'
import ora from 'ora'
import prompts from 'prompts'

interface OptimizationRule {
  name: string
  description: string
  pattern: RegExp
  replacement: string | ((match: string, ...groups: string[]) => string)
  impact: 'high' | 'medium' | 'low'
  category: 'performance' | 'bundle' | 'memory' | 'readability'
}

const optimizationRules: OptimizationRule[] = [
  // Performance optimizations
  {
    name: 'Memoize expensive computations',
    description: 'Wrap expensive calculations in computed values',
    pattern: /const (\w+) = (\w+)\.map\([^)]+\)\.filter\([^)]+\)/g,
    replacement: (_match, varName, arrayName) =>
      `const ${varName} = createMemo(() => ${arrayName}.map(...).filter(...))`,
    impact: 'high',
    category: 'performance',
  },
  {
    name: 'Optimize modifier chains',
    description: 'Combine similar modifiers to reduce DOM operations',
    pattern: /\.padding\((\d+)\)\s*\.padding\((\d+)\)/g,
    replacement: '.padding($2)',
    impact: 'medium',
    category: 'performance',
  },
  {
    name: 'Remove unused imports',
    description: 'Clean up unused TachUI imports',
    pattern: /import\s+{[^}]*(\w+)[^}]*}\s+from\s+['"]@tachui\/core['"]/g,
    replacement: (match, ..._args) => {
      // This would need more sophisticated analysis
      return match // Placeholder for now
    },
    impact: 'low',
    category: 'bundle',
  },
  {
    name: 'Optimize Layout nesting',
    description: 'Flatten unnecessary Layout.VStack nesting',
    pattern: /Layout\.VStack\(\{\s*children:\s*\[\s*Layout\.VStack\(\{/g,
    replacement: 'Layout.VStack({',
    impact: 'medium',
    category: 'performance',
  },
  {
    name: 'Use projectedValue for bindings',
    description: 'Optimize state binding patterns',
    pattern:
      /createBinding\(\s*\(\) => (\w+)\.wrappedValue,\s*\(value\) => \1\.wrappedValue = value\s*\)/g,
    replacement: '$1.projectedValue',
    impact: 'high',
    category: 'performance',
  },
  {
    name: 'Consolidate color modifiers',
    description: 'Combine foregroundColor and backgroundColor',
    pattern: /\.foregroundColor\(['"]([^'"]+)['"]\)\s*\.backgroundColor\(['"]([^'"]+)['"]\)/g,
    replacement: '.colors("$1", "$2")',
    impact: 'low',
    category: 'readability',
  },
  {
    name: 'Extract inline functions',
    description: 'Move inline functions to avoid recreating on each render',
    pattern: /onTap:\s*\(\) => \{[^}]{50,}\}/g,
    replacement: (_match) => {
      return `onTap: handle${Math.random().toString(36).substr(2, 9)}`
    },
    impact: 'high',
    category: 'performance',
  },
]

interface OptimizationResult {
  file: string
  optimizations: Array<{
    rule: string
    count: number
    impact: string
    category: string
  }>
  before: {
    size: number
    lines: number
  }
  after: {
    size: number
    lines: number
  }
  saved: {
    bytes: number
    lines: number
  }
}

function applyOptimizations(
  content: string,
  rules: OptimizationRule[]
): {
  content: string
  applied: Array<{ rule: OptimizationRule; count: number }>
} {
  let optimizedContent = content
  const applied: Array<{ rule: OptimizationRule; count: number }> = []

  for (const rule of rules) {
    const matches = optimizedContent.match(rule.pattern) || []
    if (matches.length > 0) {
      optimizedContent = optimizedContent.replace(rule.pattern, rule.replacement as any)
      applied.push({ rule, count: matches.length })
    }
  }

  return { content: optimizedContent, applied }
}

function generateOptimizationReport(results: OptimizationResult[]): string {
  const totalFiles = results.length
  const totalOptimizations = results.reduce((sum, r) => sum + r.optimizations.length, 0)
  const totalBytesSaved = results.reduce((sum, r) => sum + r.saved.bytes, 0)
  const totalLinesSaved = results.reduce((sum, r) => sum + r.saved.lines, 0)

  const categoryStats = results.reduce(
    (stats, result) => {
      result.optimizations.forEach((opt) => {
        stats[opt.category] = (stats[opt.category] || 0) + opt.count
      })
      return stats
    },
    {} as Record<string, number>
  )

  const impactStats = results.reduce(
    (stats, result) => {
      result.optimizations.forEach((opt) => {
        stats[opt.impact] = (stats[opt.impact] || 0) + opt.count
      })
      return stats
    },
    {} as Record<string, number>
  )

  return `# TachUI Optimization Report

## Summary

- **Files Optimized**: ${totalFiles}
- **Total Optimizations**: ${totalOptimizations}
- **Bytes Saved**: ${totalBytesSaved.toLocaleString()} bytes (${(totalBytesSaved / 1024).toFixed(1)} KB)
- **Lines Reduced**: ${totalLinesSaved}

## Optimization Categories

${Object.entries(categoryStats)
  .map(([category, count]) => `- **${category}**: ${count} optimizations`)
  .join('\n')}

## Impact Distribution

${Object.entries(impactStats)
  .map(([impact, count]) => `- **${impact} impact**: ${count} optimizations`)
  .join('\n')}

## File Details

${results
  .map(
    (result) => `
### ${result.file}

**Size Reduction**: ${result.saved.bytes} bytes (${((result.saved.bytes / result.before.size) * 100).toFixed(1)}%)
**Lines Reduced**: ${result.saved.lines}

**Optimizations Applied**:
${result.optimizations
  .map((opt) => `- ${opt.rule} (${opt.count}x) - ${opt.impact} impact`)
  .join('\n')}
`
  )
  .join('\n')}

## Recommendations

1. **High Impact Optimizations**: Focus on performance and memory improvements
2. **Bundle Size**: Remove unused imports and consolidate components  
3. **Code Quality**: Apply readability improvements for maintainability
4. **Regular Optimization**: Run optimization checks before releases

## Next Steps

1. Review optimized code for correctness
2. Run tests to ensure functionality is preserved
3. Measure performance improvements with benchmarks
4. Consider automating optimizations in your build process
`
}

export const optimizeCommand = new Command('optimize')
  .description('Optimize TachUI codebase for performance and bundle size')
  .option('-p, --pattern <pattern>', 'File pattern to optimize', 'src/**/*.{js,jsx,ts,tsx}')
  .option('-o, --output <directory>', 'Output directory for optimized files')
  .option(
    '-c, --category <category>',
    'Focus on specific category (performance,bundle,memory,readability)',
    'all'
  )
  .option('-i, --impact <impact>', 'Minimum impact level (high,medium,low)', 'medium')
  .option('--backup', 'Create backup of original files', true)
  .option('--report', 'Generate optimization report', true)
  .option('--dry-run', 'Show optimizations without applying them', false)
  .option('--interactive', 'Prompt for each optimization', false)
  .action(async (options) => {
    try {
      console.log(
        chalk.cyan(`
╭─────────────────────────────────────╮
│  ⚡ TachUI Performance Optimizer    │
│  Rule-based code improvements       │
╰─────────────────────────────────────╯
`)
      )

      const spinner = ora('Scanning for optimization opportunities...').start()

      // Find files to optimize
      const files = await glob(options.pattern, {
        cwd: process.cwd(),
        absolute: true,
      })

      if (files.length === 0) {
        spinner.fail('No files found matching pattern')
        console.log(chalk.yellow(`Pattern: ${options.pattern}`))
        return
      }

      // Filter rules by category and impact
      let rulesToApply = optimizationRules

      if (options.category !== 'all') {
        rulesToApply = rulesToApply.filter((rule) => rule.category === options.category)
      }

      const impactOrder = { high: 3, medium: 2, low: 1 }
      const minImpact = impactOrder[options.impact as keyof typeof impactOrder] || 2
      rulesToApply = rulesToApply.filter((rule) => impactOrder[rule.impact] >= minImpact)

      if (rulesToApply.length === 0) {
        spinner.fail('No optimization rules match the criteria')
        return
      }

      spinner.text = `Found ${files.length} files, applying ${rulesToApply.length} optimization rules...`

      const results: OptimizationResult[] = []
      let totalOptimizations = 0

      for (const file of files) {
        try {
          const originalContent = readFileSync(file, 'utf-8')
          const originalSize = Buffer.byteLength(originalContent, 'utf8')
          const originalLines = originalContent.split('\n').length

          const { content: optimizedContent, applied } = applyOptimizations(
            originalContent,
            rulesToApply
          )

          // Interactive mode - prompt for each optimization
          if (options.interactive && applied.length > 0) {
            const fileName = file.split('/').pop()
            console.log(`\n${chalk.cyan(`Optimizations found in ${fileName}:`)}`)

            for (const { rule, count } of applied) {
              console.log(`${chalk.yellow('•')} ${rule.name} (${count}x) - ${rule.impact} impact`)
              console.log(`  ${chalk.gray(rule.description)}`)
            }

            const confirm = await prompts({
              type: 'confirm',
              name: 'apply',
              message: `Apply ${applied.length} optimizations to ${fileName}?`,
              initial: true,
            })

            if (!confirm.apply) {
              continue
            }
          }

          if (applied.length === 0) {
            continue
          }

          const optimizedSize = Buffer.byteLength(optimizedContent, 'utf8')
          const optimizedLines = optimizedContent.split('\n').length

          const result: OptimizationResult = {
            file: file.split('/').pop() || file,
            optimizations: applied.map(({ rule, count }) => ({
              rule: rule.name,
              count,
              impact: rule.impact,
              category: rule.category,
            })),
            before: {
              size: originalSize,
              lines: originalLines,
            },
            after: {
              size: optimizedSize,
              lines: optimizedLines,
            },
            saved: {
              bytes: originalSize - optimizedSize,
              lines: originalLines - optimizedLines,
            },
          }

          results.push(result)
          totalOptimizations += applied.length

          if (!options.dryRun) {
            // Create backup if requested
            if (options.backup) {
              writeFileSync(`${file}.backup`, originalContent)
            }

            // Write optimized content
            const outputPath = options.output ? file.replace(/src\//, `${options.output}/`) : file

            writeFileSync(outputPath, optimizedContent)
          }
        } catch (error) {
          console.warn(
            chalk.yellow(`Warning: Could not optimize ${file}`),
            (error as Error).message
          )
        }
      }

      spinner.succeed(`Optimization scan complete!`)

      if (results.length === 0) {
        console.log(
          chalk.green('✅ No optimizations needed - your code is already well optimized!')
        )
        return
      }

      // Show results summary
      console.log(`\n${chalk.green('📊 Optimization Summary:')}`)
      console.log(`${chalk.gray('Files optimized:')} ${results.length}`)
      console.log(`${chalk.gray('Total optimizations:')} ${totalOptimizations}`)

      const totalBytesSaved = results.reduce((sum, r) => sum + r.saved.bytes, 0)
      const totalLinesSaved = results.reduce((sum, r) => sum + r.saved.lines, 0)

      console.log(
        `${chalk.gray('Bytes saved:')} ${totalBytesSaved.toLocaleString()} (${(totalBytesSaved / 1024).toFixed(1)} KB)`
      )
      console.log(`${chalk.gray('Lines reduced:')} ${totalLinesSaved}`)

      // Show category breakdown
      const categoryStats = results.reduce(
        (stats, result) => {
          result.optimizations.forEach((opt) => {
            stats[opt.category] = (stats[opt.category] || 0) + opt.count
          })
          return stats
        },
        {} as Record<string, number>
      )

      if (Object.keys(categoryStats).length > 0) {
        console.log(`\n${chalk.yellow('📈 Optimization Categories:')}`)
        Object.entries(categoryStats).forEach(([category, count]) => {
          console.log(`${chalk.gray(`${category}:`)} ${count} optimizations`)
        })
      }

      // Show impact breakdown
      const impactStats = results.reduce(
        (stats, result) => {
          result.optimizations.forEach((opt) => {
            stats[opt.impact] = (stats[opt.impact] || 0) + opt.count
          })
          return stats
        },
        {} as Record<string, number>
      )

      console.log(`\n${chalk.yellow('💥 Impact Distribution:')}`)
      Object.entries(impactStats).forEach(([impact, count]) => {
        const color =
          impact === 'high' ? chalk.red : impact === 'medium' ? chalk.yellow : chalk.green
        console.log(`${color(`${impact} impact:`)} ${count} optimizations`)
      })

      // Show top optimized files
      const topFiles = results.sort((a, b) => b.saved.bytes - a.saved.bytes).slice(0, 5)

      if (topFiles.length > 0) {
        console.log(`\n${chalk.yellow('🏆 Top Optimized Files:')}`)
        topFiles.forEach((result, index) => {
          const savedKB = (result.saved.bytes / 1024).toFixed(1)
          const percentage = ((result.saved.bytes / result.before.size) * 100).toFixed(1)
          console.log(`${index + 1}. ${result.file}: ${savedKB} KB saved (${percentage}%)`)
        })
      }

      if (options.dryRun) {
        console.log(`\n${chalk.yellow('🔍 Dry Run Complete')}`)
        console.log(chalk.gray('Remove --dry-run flag to apply optimizations'))
      } else {
        console.log(`\n${chalk.green('✅ Optimizations Applied!')}`)
        if (options.backup) {
          console.log(chalk.blue('💾 Backups created with .backup extension'))
        }
      }

      // Generate and save report
      if (options.report && !options.dryRun) {
        const reportPath = resolve('tachui-optimization-report.md')
        const report = generateOptimizationReport(results)
        writeFileSync(reportPath, report)
        console.log(`\n${chalk.blue('📋 Optimization report saved:')} ${reportPath}`)
      }

      // Performance tips
      console.log(`\n${chalk.yellow('💡 Performance Tips:')}`)
      console.log(chalk.gray('• Run optimization before production builds'))
      console.log(chalk.gray('• Monitor bundle size with build tools'))
      console.log(chalk.gray('• Use tacho analyze to identify performance issues'))
      console.log(chalk.gray('• Consider code splitting for large applications'))

      // Next steps
      console.log(`\n${chalk.yellow('🚀 Next Steps:')}`)
      console.log(chalk.gray('1. Test optimized code thoroughly'))
      console.log(chalk.gray('2. Run benchmarks to measure improvements'))
      console.log(chalk.gray('3. Set up automated optimization in CI/CD'))
      console.log(chalk.gray('4. Monitor production performance'))

      console.log(`\n${chalk.green('Optimization complete! ⚡')}`)
    } catch (error) {
      console.error(chalk.red('Optimization error:'), (error as Error).message)

      console.log(chalk.yellow('\n🔍 Troubleshooting:'))
      console.log(chalk.gray('• Check file patterns and permissions'))
      console.log(chalk.gray('• Ensure source files are valid TachUI code'))
      console.log(chalk.gray('• Try with --dry-run first'))
      console.log(chalk.gray('• Use --interactive for selective optimization'))

      process.exit(1)
    }
  })
