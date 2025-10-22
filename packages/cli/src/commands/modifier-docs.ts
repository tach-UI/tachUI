#!/usr/bin/env node

/**
 * TachUI CLI - Modifier Documentation Command
 *
 * Provides comprehensive documentation and insights for all modifiers across plugins
 */

import { Command } from 'commander'
import {
  modifierParameterRegistry,
  type ModifierSignature,
} from '@tachui/devtools'
import chalk from 'chalk'
import Table from 'cli-table3'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { readFile } from 'node:fs/promises'
import type { ModifierMetadataSnapshot } from '@tachui/core/modifiers/type-generator'

const program = new Command()
const require = createRequire(import.meta.url)

interface ModifierDocsOptions {
  category?: string
  plugin?: string
  search?: string
  output?: string
  format?: 'table' | 'markdown' | 'json'
}

interface ModifierConflictOptions {
  format?: 'table' | 'json'
}

program
  .name('tachui-modifier-docs')
  .description('Comprehensive documentation for TachUI modifiers')
  .version('1.0.0')

program
  .command('list')
  .description('List all available modifiers')
  .option(
    '-c, --category <category>',
    'Filter by category (layout, appearance, interaction, etc.)'
  )
  .option(
    '-p, --plugin <plugin>',
    'Filter by plugin (@tachui/core, @tachui/modifiers, etc.)'
  )
  .option('-s, --search <query>', 'Search modifiers by name or description')
  .option('-f, --format <format>', 'Output format', 'table')
  .action(async (options: ModifierDocsOptions) => {
    await listModifiers(options)
  })

program
  .command('show <modifierName>')
  .description('Show detailed information for a specific modifier')
  .option('-f, --format <format>', 'Output format', 'markdown')
  .action(async (modifierName: string, options: ModifierDocsOptions) => {
    await showModifierDetails(modifierName, options)
  })

program
  .command('generate')
  .description('Generate complete modifier documentation')
  .option('-o, --output <file>', 'Output file path', 'modifier-docs.md')
  .option('-f, --format <format>', 'Output format', 'markdown')
  .action(async (options: ModifierDocsOptions) => {
    await generateFullDocumentation(options)
  })

program
  .command('validate <modifierName>')
  .description('Validate modifier parameters')
  .argument('<parameters>', 'Parameters in JSON format')
  .action(async (modifierName: string, parameters: string) => {
    await validateModifierParameters(modifierName, parameters)
  })

program
  .command('cheat-sheet')
  .description('Display a quick reference cheat sheet')
  .action(async () => {
    await showCheatSheet()
  })

program
  .command('conflicts')
  .description('Show modifier registration conflicts from the latest type generation snapshot')
  .option('-f, --format <format>', 'Output format', 'table')
  .action(async (options: ModifierConflictOptions) => {
    await showModifierConflicts(options)
  })

async function listModifiers(options: ModifierDocsOptions) {
  let modifiers: ModifierSignature[] =
    modifierParameterRegistry.getAllModifiers()

  // Apply filters
  if (options.category) {
    modifiers = modifiers.filter(
      (m: ModifierSignature) => m.category === options.category
    )
  }

  if (options.plugin) {
    modifiers = modifiers.filter(
      (m: ModifierSignature) => m.plugin === options.plugin
    )
  }

  if (options.search) {
    modifiers = modifierParameterRegistry.searchModifiers(options.search)
  }

  if (modifiers.length === 0) {
    console.log(chalk.yellow('No modifiers found matching your criteria'))
    return
  }

  switch (options.format) {
    case 'json':
      console.log(JSON.stringify(modifiers, null, 2))
      break

    case 'markdown':
      console.log(generateMarkdownList(modifiers))
      break

    case 'table':
    default:
      displayModifiersTable(modifiers)
      break
  }
}

function displayModifiersTable(modifiers: any[]) {
  const table = new Table({
    head: [
      chalk.blue('Modifier'),
      chalk.blue('Plugin'),
      chalk.blue('Category'),
      chalk.blue('Parameters'),
      chalk.blue('Bundle Size'),
      chalk.blue('SwiftUI'),
    ],
    colWidths: [15, 20, 15, 25, 12, 20],
  })

  for (const modifier of modifiers) {
    const paramCount = modifier.parameters.length
    const paramText =
      paramCount === 0
        ? 'none'
        : paramCount === 1
          ? '1 param'
          : `${paramCount} params`

    table.push([
      chalk.cyan(modifier.name),
      modifier.plugin,
      modifier.category,
      paramText,
      modifier.bundleSize,
      modifier.swiftUIEquivalent || 'N/A',
    ])
  }

  console.log(table.toString())
  console.log(chalk.green(`\nFound ${modifiers.length} modifiers`))
}

function generateMarkdownList(modifiers: any[]): string {
  let markdown = `# TachUI Modifiers\n\n`

  const groupedByCategory = modifiers.reduce((acc, mod) => {
    if (!acc[mod.category]) acc[mod.category] = []
    acc[mod.category].push(mod)
    return acc
  }, {} as any)

  for (const [category, mods] of Object.entries(groupedByCategory)) {
    markdown += `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`

    for (const mod of mods as any[]) {
      markdown += `- **${mod.name}** (${mod.plugin}) - ${mod.description}\n`
    }
    markdown += '\n'
  }

  return markdown
}

async function showModifierDetails(
  modifierName: string,
  options: ModifierDocsOptions
) {
  const modifier = modifierParameterRegistry.getModifier(modifierName)

  if (!modifier) {
    console.error(chalk.red(`❌ Modifier '${modifierName}' not found`))
    console.log(
      chalk.yellow(
        '💡 Use `tachui modifier-docs list` to see available modifiers'
      )
    )
    return
  }

  switch (options.format) {
    case 'json':
      console.log(JSON.stringify(modifier, null, 2))
      break

    case 'markdown':
    default:
      displayModifierDetails(modifier)
      break
  }
}

function displayModifierDetails(modifier: any) {
  console.log(chalk.blue.bold(`\n.${modifier.name}()\n`))
  console.log(modifier.description)
  console.log('')

  // Metadata
  console.log(chalk.gray('Plugin:'), modifier.plugin)
  console.log(chalk.gray('Category:'), modifier.category)
  console.log(chalk.gray('Bundle Size:'), modifier.bundleSize)
  if (modifier.swiftUIEquivalent) {
    console.log(chalk.gray('SwiftUI:'), modifier.swiftUIEquivalent)
  }
  console.log('')

  // Parameters
  if (modifier.parameters.length > 0) {
    console.log(chalk.yellow.bold('Parameters:\n'))

    for (const param of modifier.parameters) {
      const required = param.required
        ? chalk.red('required')
        : chalk.gray('optional')
      const defaultVal =
        param.defaultValue !== undefined
          ? chalk.gray(` (default: ${JSON.stringify(param.defaultValue)})`)
          : ''

      console.log(
        `${chalk.cyan(param.name)}: ${chalk.green(param.type)} ${required}${defaultVal}`
      )
      console.log(`  ${param.description}`)

      if (param.examples?.length > 0) {
        console.log(`  ${chalk.gray('Examples:')} ${param.examples.join(', ')}`)
      }

      if (param.validation) {
        const validation = param.validation
        const validationRules = []
        if (validation.min !== undefined)
          validationRules.push(`min: ${validation.min}`)
        if (validation.max !== undefined)
          validationRules.push(`max: ${validation.max}`)
        if (validation.enum)
          validationRules.push(`values: ${validation.enum.join('|')}`)
        if (validation.pattern)
          validationRules.push(`pattern: ${validation.pattern}`)

        if (validationRules.length > 0) {
          console.log(
            `  ${chalk.gray('Validation:')} ${validationRules.join(', ')}`
          )
        }
      }
      console.log('')
    }
  } else {
    console.log(chalk.gray('No parameters required\n'))
  }

  // Usage examples
  console.log(chalk.yellow.bold('Usage Examples:\n'))

  console.log(chalk.gray('Basic:'))
  for (const example of modifier.usage.basic) {
    console.log(`  ${chalk.cyan(`component.${example}`)}`)
  }

  if (modifier.usage.advanced?.length > 0) {
    console.log('')
    console.log(chalk.gray('Advanced:'))
    for (const example of modifier.usage.advanced) {
      console.log(`  ${chalk.cyan(`component.${example}`)}`)
    }
  }

  // Related modifiers
  if (modifier.relatedModifiers?.length > 0) {
    console.log('')
    console.log(chalk.yellow.bold('Related Modifiers:'))
    console.log(
      modifier.relatedModifiers.map((m: string) => chalk.cyan(m)).join(', ')
    )
  }
}

async function generateFullDocumentation(options: ModifierDocsOptions) {
  console.log(
    chalk.blue('🔄 Generating comprehensive modifier documentation...')
  )

  const documentation = modifierParameterRegistry.generateDocumentation()

  if (options.output) {
    const { writeFileSync } = await import('fs-extra')
    writeFileSync(options.output, documentation)
    console.log(chalk.green(`✅ Documentation saved to: ${options.output}`))
  } else {
    console.log(documentation)
  }
}

async function validateModifierParameters(
  modifierName: string,
  parametersJson: string
) {
  try {
    const parameters = JSON.parse(parametersJson)
    const validation = modifierParameterRegistry.validateParameters(
      modifierName,
      parameters
    )

    if (validation.valid) {
      console.log(chalk.green(`✅ Parameters for '${modifierName}' are valid`))
    } else {
      console.log(chalk.red(`❌ Validation failed for '${modifierName}':`))
      for (const error of validation.errors) {
        console.log(chalk.red(`  • ${error}`))
      }
    }
  } catch (error) {
    console.error(chalk.red('❌ Invalid JSON parameters:', error))
  }
}

async function showCheatSheet() {
  console.log(chalk.blue.bold('\n🚀 TachUI Modifier Quick Reference\n'))

  const categories = [
    {
      name: 'Layout',
      modifiers: ['padding', 'frame', 'fixedSize', 'aspectRatio'],
      color: 'cyan',
    },
    {
      name: 'Appearance',
      modifiers: ['backgroundColor', 'shadow', 'cornerRadius', 'opacity'],
      color: 'magenta',
    },
    {
      name: 'Interaction',
      modifiers: ['hover', 'onTap', 'disabled', 'gesture'],
      color: 'yellow',
    },
    {
      name: 'Animation',
      modifiers: ['transition', 'scale', 'rotate', 'animation'],
      color: 'green',
    },
    {
      name: 'Responsive',
      modifiers: ['responsive', 'breakpoint'],
      color: 'blue',
    },
  ]

  for (const category of categories) {
    console.log(chalk.bold(`${category.name} Modifiers:`))

    for (const modifierName of category.modifiers) {
      const modifier = modifierParameterRegistry.getModifier(modifierName)
      if (modifier) {
        const example = modifier.usage.basic[0] || `${modifierName}()`
        console.log(
          `  ${chalk.cyan(`.${modifierName}()`)} - ${modifier.description}`
        )
        console.log(`    ${chalk.gray(`component.${example}`)}`)
      }
    }
    console.log('')
  }

  console.log(chalk.yellow.bold('💡 Pro Tips:'))
  console.log(
    '  • Chain modifiers: .padding(16).backgroundColor("#f0f0f0").cornerRadius(8)'
  )
  console.log(
    '  • Use responsive: .responsive({ sm: padding(8), lg: padding(24) })'
  )
  console.log(
    '  • Import specifically: import { padding } from "@tachui/modifiers/layout"'
  )
  console.log('  • Check bundle sizes with: tachui modifier-docs list')
  console.log('')
}

async function showModifierConflicts(
  options: ModifierConflictOptions,
): Promise<void> {
  const snapshot = await loadModifierSnapshot()

  if (!snapshot) {
    console.error(
      chalk.red(
        '❌ No modifier metadata snapshot found. Run `pnpm --filter @tachui/core generate-modifier-types` first.',
      ),
    )
    return
  }

  if (options.format === 'json') {
    console.log(JSON.stringify(snapshot.conflicts, null, 2))
    return
  }

  if (snapshot.conflicts.length === 0) {
    console.log(chalk.green('✅ No modifier conflicts detected.'))
    console.log(
      chalk.gray(
        `Total modifiers analysed: ${snapshot.totalModifiers} (generated ${snapshot.generatedAt})`,
      ),
    )
    return
  }

  const table = new Table({
    head: [
      chalk.blue('Modifier'),
      chalk.blue('Plugins'),
      chalk.blue('Categories'),
    ],
    colWidths: [20, 35, 20],
    wordWrap: true,
  })

  for (const conflict of snapshot.conflicts) {
    const plugins = conflict.entries
      .map((entry) => `${entry.plugin} (priority ${entry.priority})`)
      .join('\n')
    const categories = Array.from(
      new Set(conflict.entries.map((entry) => entry.category)),
    ).join(', ')

    table.push([
      chalk.cyan(conflict.name),
      plugins,
      categories || 'n/a',
    ])
  }

  console.log(
    chalk.yellow(
      `⚠️  Detected ${snapshot.conflicts.length} modifier conflict${
        snapshot.conflicts.length === 1 ? '' : 's'
      }. Review the plugins involved below:\n`,
    ),
  )
  console.log(table.toString())
  console.log(
    chalk.gray(
      `Snapshot generated at ${snapshot.generatedAt}. Re-run the generator after resolving conflicts.`,
    ),
  )
}

async function loadModifierSnapshot(): Promise<ModifierMetadataSnapshot | null> {
  try {
    const pkgPath = require.resolve('@tachui/core/package.json')
    const coreDir = dirname(pkgPath)
    const candidates = [
      join(coreDir, 'dist/types/modifier-metadata.snapshot.json'),
      join(coreDir, 'src/types/modifier-metadata.snapshot.json'),
    ]

    for (const path of candidates) {
      try {
        const data = await readFile(path, 'utf8')
        return JSON.parse(data) as ModifierMetadataSnapshot
      } catch (error: any) {
        if (error?.code !== 'ENOENT') {
          throw error
        }
      }
    }
  } catch {
    return null
  }

  return null
}

// Export functions for programmatic use
export {
  listModifiers,
  showModifierDetails,
  generateFullDocumentation,
  validateModifierParameters,
  showCheatSheet,
  showModifierConflicts,
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse()
}
