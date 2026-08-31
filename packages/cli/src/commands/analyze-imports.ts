#!/usr/bin/env node

/**
 * TachUI CLI - Import Analysis Command
 *
 * Analyzes project imports and provides optimization recommendations
 */

import { Command } from 'commander'
import { ImportOptimizer } from '../import-optimizer.js'
import { ImportGuidanceSystem } from '@tachui/devtools'
import chalk from 'chalk'
import { existsSync } from 'fs'
import { join } from 'path'

const program = new Command()

interface AnalyzeOptions {
  project?: string
  output?: string
  interactive?: boolean
  fix?: boolean
  threshold?: number
}

program
  .name('tachui-analyze-imports')
  .description('Analyze and optimize TachUI imports for better bundle size')
  .version('1.0.0')

program
  .command('analyze')
  .description('Analyze imports in your TachUI project')
  .option('-p, --project <path>', 'Project root directory', process.cwd())
  .option('-o, --output <file>', 'Output report to file')
  .option('-i, --interactive', 'Interactive optimization mode', false)
  .option(
    '-f, --fix',
    'Preview the safe optimizations that would be applied (does not edit files yet)',
    false
  )
  .option('-t, --threshold <kb>', 'Bundle size threshold for warnings', '50')
  .action(async (options: AnalyzeOptions) => {
    await analyzeImports(options)
  })

program
  .command('guide')
  .description('Show import guidance for TachUI packages')
  .argument(
    '[package]',
    'Package to show guidance for (core, primitives, etc.)'
  )
  .action(async (packageName?: string) => {
    await showImportGuide(packageName)
  })

program
  .command('cheat-sheet')
  .description('Display TachUI import cheat sheet')
  .action(async () => {
    await showCheatSheet()
  })

async function analyzeImports(options: AnalyzeOptions) {
  const {
    project = process.cwd(),
    output,
    interactive,
    fix,
    threshold = 50,
  } = options

  console.log(chalk.blue('🔍 Analyzing TachUI imports...\n'))

  // Check if project has TachUI
  const packageJsonPath = join(project, 'package.json')
  if (!existsSync(packageJsonPath)) {
    console.error(chalk.red('❌ No package.json found in project directory'))
    process.exit(1)
  }

  try {
    const packageJson = JSON.parse(await import(packageJsonPath))
    const hasTachUI = Object.keys({
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    }).some(dep => dep.startsWith('@tachui/'))

    if (!hasTachUI) {
      console.log(
        chalk.yellow('⚠️  No TachUI dependencies found in this project')
      )
      return
    }

    const optimizer = new ImportOptimizer()
    const optimizations = await optimizer.analyzeProject(project)

    if (optimizations.length === 0) {
      console.log(chalk.green('✅ All imports are already optimal!'))
      return
    }

    // Generate report
    const report = optimizer.generateReport(optimizations)
    console.log(report)

    // Calculate total potential savings
    const totalSavings = optimizations.reduce(
      (sum, opt) => sum + parseInt(opt.savings.replace(/[^\d]/g, '')),
      0
    )

    if (totalSavings > threshold) {
      console.log(
        chalk.yellow(`\n⚠️  Bundle size could be reduced by ~${totalSavings}KB`)
      )
    }

    // Interactive mode
    if (interactive) {
      const inquirer = await import('inquirer')
      const { applyOptimizations } = await inquirer.default.prompt([
        {
          type: 'confirm',
          name: 'applyOptimizations',
          message: 'Show the safe optimizations that would be applied?',
          default: false,
        },
      ])

      if (applyOptimizations) {
        await previewAutomaticOptimizations(project, optimizations)
      }
    }

    // --fix: preview only; see previewAutomaticOptimizations
    if (fix) {
      await previewAutomaticOptimizations(project, optimizations)
    }

    // Output to file
    if (output) {
      const { writeFileSync } = await import('fs-extra')
      writeFileSync(output, report)
      console.log(chalk.green(`\n📄 Report saved to: ${output}`))
    }
  } catch (error) {
    console.error(chalk.red('❌ Error analyzing imports:'), error)
    process.exit(1)
  }
}

/**
 * Report the safe optimizations that would be applied.
 *
 * This does NOT edit files. It previously printed per-optimization success
 * ticks and "Applied N optimizations successfully!" while writing nothing,
 * so `--fix` reported a fix that had not happened (#226). Rewriting imports
 * needs real source transformation; until that exists the honest behaviour is
 * to show the work and say plainly that it is manual.
 */
async function previewAutomaticOptimizations(
  _projectPath: string,
  optimizations: any[]
) {
  const safeOptimizations = optimizations.filter(opt => opt.risk === 'low')

  if (safeOptimizations.length === 0) {
    console.log(chalk.yellow('\n⚠️  No safe automatic optimizations available'))
    return
  }

  console.log(
    chalk.blue(
      `\n🔧 ${safeOptimizations.length} safe optimization(s) available — apply these by hand:\n`
    )
  )

  for (const opt of safeOptimizations) {
    console.log(chalk.cyan(`   ${opt.from} → ${opt.to} (saves ${opt.savings})`))
  }

  console.log(
    chalk.yellow(
      '\n⚠️  No files were modified. Automatic rewriting is not implemented yet;\n' +
        '   the changes above are reported so you can make them yourself.'
    )
  )
}

async function showImportGuide(packageName?: string) {
  const guidance = new ImportGuidanceSystem()

  if (!packageName) {
    // Show all available guides
    console.log(chalk.blue('📚 TachUI Import Guides\n'))
    console.log('Available packages:')
    console.log('  • core - Core framework imports')
    console.log('  • primitives - UI component imports')
    console.log('  • bundle-optimization - Bundle size guidance')
    console.log('\nUsage: tachui analyze guide <package>')
    return
  }

  const guide = guidance.generatePackageGuide(packageName)
  console.log(guide)
}

async function showCheatSheet() {
  const guidance = new ImportGuidanceSystem()
  const cheatSheet = guidance.generateCheatSheet()
  console.log(cheatSheet)
}

// Export functions for programmatic use
export { analyzeImports, showImportGuide, showCheatSheet }

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse()
}
