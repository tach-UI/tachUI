/**
 * Tacho CLI - Migrate Command
 *
 * Migration utilities for converting React/Vue components to TachUI
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import chalk from 'chalk'
import { Command } from 'commander'
import { glob } from 'glob'
import ora from 'ora'
import { createRemoveModifierTriggerCommand } from './migrate/remove-modifier-trigger.js'

interface MigrationRule {
  pattern: RegExp
  replacement: string | ((match: string, ...groups: string[]) => string)
  description: string
}

const reactToTachUIMigrations: MigrationRule[] = [
  // React imports
  {
    pattern: /import React.*from ['"]react['"];?\n?/g,
    replacement: '',
    description: 'Remove React imports',
  },
  {
    pattern: /import.*useState.*from ['"]react['"];?\n?/g,
    replacement: "import { State } from '@tachui/core/state'\n",
    description: 'Replace useState with State',
  },
  {
    pattern: /import.*useEffect.*from ['"]react['"];?\n?/g,
    replacement: '// Use .onAppear() or .task() instead of useEffect\n',
    description: 'Replace useEffect with lifecycle modifiers',
  },

  // State management
  {
    pattern: /const \[(\w+), set(\w+)\] = useState\((.*?)\)/g,
    replacement: (_match, stateName, _setterName, initialValue) =>
      `const ${stateName} = State(${initialValue})`,
    description: 'Convert useState to State',
  },
  {
    pattern: /set(\w+)\((.*?)\)/g,
    replacement: (_match, setterName, newValue) => {
      const stateName = setterName.charAt(0).toLowerCase() + setterName.slice(1)
      return `${stateName}.wrappedValue = ${newValue}`
    },
    description: 'Convert state setters to wrappedValue assignment',
  },

  // JSX to TachUI
  {
    pattern: /<div([^>]*)>/g,
    replacement: 'Layout.VStack({\n  children: [',
    description: 'Convert div to VStack',
  },
  {
    pattern: /<\/div>/g,
    replacement: '  ]\n})',
    description: 'Close VStack',
  },
  {
    pattern: /<button([^>]*?)onClick=\{([^}]+)\}([^>]*?)>([^<]+)<\/button>/g,
    replacement: (_match, _beforeOnClick, onClick, _afterOnClick, text) =>
      `Button({\n  title: '${text}',\n  onTap: ${onClick}\n})`,
    description: 'Convert button to Button component',
  },
  {
    pattern: /<input([^>]*?)value=\{([^}]+)\}([^>]*?)onChange=\{([^}]+)\}([^>]*?)\/>/g,
    replacement: (_match, _before, value, _middle, _onChange, _after) =>
      `TextField({\n  text: ${value}.projectedValue\n})`,
    description: 'Convert input to TextField',
  },

  // Component structure
  {
    pattern: /export default function (\w+)\(\)/g,
    replacement: 'export function $1()',
    description: 'Convert default export to named export',
  },
  {
    pattern: /return \(/g,
    replacement: 'return ',
    description: 'Remove JSX parentheses',
  },
  {
    pattern: /return <>/g,
    replacement: 'return Layout.VStack({\n  children: [',
    description: 'Convert React Fragment to VStack',
  },
  {
    pattern: /<\/>/g,
    replacement: '  ]\n})',
    description: 'Close Fragment VStack',
  },
]

const vueToTachUIMigrations: MigrationRule[] = [
  // Vue composition API
  {
    pattern: /import.*ref.*from ['"]vue['"];?\n?/g,
    replacement: "import { State } from '@tachui/core/state'\n",
    description: 'Replace Vue ref with State',
  },
  {
    pattern: /import.*reactive.*from ['"]vue['"];?\n?/g,
    replacement: "import { ObservableObjectBase, ObservedObject } from '@tachui/core/state'\n",
    description: 'Replace Vue reactive with ObservedObject',
  },
  {
    pattern: /const (\w+) = ref\((.*?)\)/g,
    replacement: 'const $1 = State($2)',
    description: 'Convert ref to State',
  },
  {
    pattern: /(\w+)\.value/g,
    replacement: '$1.wrappedValue',
    description: 'Convert .value to .wrappedValue',
  },

  // Vue template to TachUI
  {
    pattern: /<template>/g,
    replacement: '// Template converted to TachUI components\nreturn ',
    description: 'Convert template tag',
  },
  {
    pattern: /<\/template>/g,
    replacement: '',
    description: 'Remove template closing',
  },
  {
    pattern: /<div([^>]*)>/g,
    replacement: 'Layout.VStack({\n  children: [',
    description: 'Convert div to VStack',
  },
  {
    pattern: /<\/div>/g,
    replacement: '  ]\n})',
    description: 'Close VStack',
  },
]

function applyMigrations(
  content: string,
  migrations: MigrationRule[]
): { content: string; changes: string[] } {
  let migratedContent = content
  const changes: string[] = []

  for (const migration of migrations) {
    if (migration.pattern.test(migratedContent)) {
      migratedContent = migratedContent.replace(migration.pattern, migration.replacement as any)
      changes.push(migration.description)
    }
  }

  return { content: migratedContent, changes }
}

function analyzeFramework(content: string): 'react' | 'vue' | 'unknown' {
  if (
    content.includes('from "react"') ||
    content.includes("from 'react'") ||
    content.includes('useState') ||
    content.includes('useEffect')
  ) {
    return 'react'
  }
  if (
    content.includes('from "vue"') ||
    content.includes("from 'vue'") ||
    content.includes('<template>') ||
    content.includes('ref(')
  ) {
    return 'vue'
  }
  return 'unknown'
}

function generateMigrationReport(filePath: string, framework: string, changes: string[]): string {
  return `
# Migration Report: ${filePath}

**Source Framework**: ${framework}
**Target Framework**: TachUI

## Automated Changes Applied

${changes.map((change) => `- ${change}`).join('\n')}

## Manual Review Required

The following items may need manual attention:

1. **Complex State Logic**: Review state management patterns and consider using ObservedObject for complex objects
2. **Event Handlers**: Verify event handler conversions (onClick → onTap)
3. **Styling**: Add TachUI modifiers for styling (.backgroundColor(), etc.)
4. **Component Structure**: Ensure proper Layout container usage (VStack, HStack, ZStack)
5. **Imports**: Verify all TachUI imports are correct

## Next Steps

1. Add necessary TachUI imports
2. Test component functionality
3. Add modifiers for styling
4. Consider using Phase 6 features:
   - @State for reactive local state
   - @ObservedObject for complex objects
   - Lifecycle modifiers (onAppear, task)
   - Navigation components if needed

## TachUI Resources

- [Getting Started Guide](https://github.com/whoughton/TachUI/blob/main/docs/guide/getting-started-complete.md)
- [Phase 6 Features](https://github.com/whoughton/TachUI/blob/main/docs/api/phase-6-features.md)
- [Component Examples](https://github.com/whoughton/TachUI/tree/main/examples)
`
}

export const migrateCommand = new Command('migrate')
  .description('Migrate React/Vue components to TachUI')
  .option('-f, --framework <framework>', 'Source framework (react, vue, auto)', 'auto')
  .option('-i, --input <pattern>', 'Input file pattern', 'src/**/*.{js,jsx,ts,tsx,vue}')
  .option('-o, --output <directory>', 'Output directory', 'src/migrated')
  .option('--backup', 'Create backup of original files', true)
  .option('--report', 'Generate migration report', true)
  .option('--dry-run', 'Show what would be migrated without making changes', false)
  .action(async (options) => {
    try {
      console.log(
        chalk.cyan(`
╭─────────────────────────────────────╮
│  🔄 TachUI Migration Tool           │
│  Pattern-based React/Vue converter  │
╰─────────────────────────────────────╯
`)
      )

      const spinner = ora('Scanning for migration candidates...').start()

      // Find files to migrate
      const files = await glob(options.input, {
        cwd: process.cwd(),
        absolute: true,
      })

      if (files.length === 0) {
        spinner.fail('No files found matching pattern')
        console.log(chalk.yellow(`Pattern: ${options.input}`))
        console.log(chalk.gray('Try: --input "src/**/*.{js,jsx,ts,tsx}"'))
        return
      }

      spinner.text = `Found ${files.length} files to analyze...`

      let migratedCount = 0
      const migrationResults: Array<{
        file: string
        framework: string
        changes: string[]
        success: boolean
      }> = []

      for (const file of files) {
        try {
          const content = readFileSync(file, 'utf-8')
          const framework =
            options.framework === 'auto' ? analyzeFramework(content) : options.framework

          if (framework === 'unknown') {
            continue
          }

          const migrations = framework === 'react' ? reactToTachUIMigrations : vueToTachUIMigrations
          const { content: migratedContent, changes } = applyMigrations(content, migrations)

          if (changes.length === 0) {
            continue
          }

          migratedCount++
          migrationResults.push({
            file,
            framework,
            changes,
            success: true,
          })

          if (!options.dryRun) {
            // Create backup if requested
            if (options.backup) {
              writeFileSync(`${file}.backup`, content)
            }

            // Write migrated content
            const outputPath = file.replace(/src\//, `${options.output}/`)
            const outputDir = outputPath.substring(0, outputPath.lastIndexOf('/'))

            // Create output directory if needed
            const { mkdirSync } = await import('node:fs')
            if (!existsSync(outputDir)) {
              mkdirSync(outputDir, { recursive: true })
            }

            writeFileSync(outputPath, migratedContent)

            // Generate report if requested
            if (options.report) {
              const reportPath = outputPath.replace(
                /\.(js|jsx|ts|tsx|vue)$/,
                '.migration-report.md'
              )
              const report = generateMigrationReport(file, framework, changes)
              writeFileSync(reportPath, report)
            }
          }
        } catch (_error) {
          migrationResults.push({
            file,
            framework: 'unknown',
            changes: [],
            success: false,
          })
        }
      }

      spinner.succeed(`Migration analysis complete!`)

      // Show results
      console.log(`\n${chalk.green('📊 Migration Summary:')}`)
      console.log(`${chalk.gray('Total files scanned:')} ${files.length}`)
      console.log(`${chalk.gray('Files requiring migration:')} ${migratedCount}`)

      const reactFiles = migrationResults.filter((r) => r.framework === 'react').length
      const vueFiles = migrationResults.filter((r) => r.framework === 'vue').length

      if (reactFiles > 0) {
        console.log(`${chalk.gray('React components:')} ${reactFiles}`)
      }
      if (vueFiles > 0) {
        console.log(`${chalk.gray('Vue components:')} ${vueFiles}`)
      }

      if (options.dryRun) {
        console.log(`\n${chalk.yellow('🔍 Dry Run - No files were changed')}`)
        console.log(chalk.gray('Remove --dry-run flag to apply migrations'))
      } else {
        console.log(`\n${chalk.green('✅ Files migrated to:')} ${options.output}`)
        if (options.backup) {
          console.log(`${chalk.blue('💾 Backups created')} with .backup extension`)
        }
        if (options.report) {
          console.log(`${chalk.blue('📋 Reports generated')} with .migration-report.md extension`)
        }
      }

      // Show detailed results
      if (migrationResults.length > 0) {
        console.log(`\n${chalk.yellow('📝 Migration Details:')}`)

        migrationResults.forEach((result) => {
          const fileName = result.file.split('/').pop()
          console.log(`\n${chalk.cyan(fileName)} (${result.framework})`)

          if (result.changes.length > 0) {
            result.changes.forEach((change) => {
              console.log(`  ${chalk.gray('•')} ${change}`)
            })
          } else {
            console.log(`  ${chalk.gray('No changes needed')}`)
          }
        })
      }

      // Next steps
      console.log(`\n${chalk.yellow('🚀 Next Steps:')}`)
      console.log(chalk.gray('1. Review migrated components'))
      console.log(chalk.gray('2. Add TachUI modifiers for styling'))
      console.log(chalk.gray('3. Test component functionality'))
      console.log(chalk.gray('4. Consider Phase 6 features (@State, lifecycle modifiers)'))
      console.log(chalk.gray('5. Run: tacho dev'))

      console.log(`\n${chalk.green('Migration complete! 🎉')}`)
    } catch (error) {
      console.error(chalk.red('Migration error:'), (error as Error).message)

      console.log(chalk.yellow('\n🔍 Troubleshooting:'))
      console.log(chalk.gray('• Check file patterns and permissions'))
      console.log(chalk.gray('• Ensure source files are valid JavaScript/TypeScript'))
      console.log(chalk.gray('• Try with --dry-run first'))

      process.exit(1)
    }
  })
  .addCommand(createRemoveModifierTriggerCommand())
