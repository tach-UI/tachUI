/**
 * Tacho CLI - Comprehensive developer tooling for TachUI
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import chalk from 'chalk'
import { Command } from 'commander'
import { analyzeCommand } from './commands/analyze.js'
import { devCommand } from './commands/dev.js'
import { generateCommand } from './commands/generate.js'
// Import commands
import { initCommand } from './commands/init.js'
import { migrateCommand } from './commands/migrate.js'
import { optimizeCommand } from './commands/optimize.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Get package version
const packagePath = join(__dirname, '../package.json')
const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))

export async function main() {
  const program = new Command()

  program
    .name('tacho')
    .description('Comprehensive developer tooling for TachUI')
    .version(packageJson.version)

  // Welcome message
  console.log(
    chalk.cyan(`
╭─────────────────────────────────────╮
│  🚀 Tacho CLI v${packageJson.version}                │
│  TachUI Developer Tooling           │
╰─────────────────────────────────────╯
`)
  )

  // Register commands
  program.addCommand(initCommand)
  program.addCommand(devCommand)
  program.addCommand(generateCommand)
  program.addCommand(migrateCommand)
  program.addCommand(analyzeCommand)
  program.addCommand(optimizeCommand)

  // Global error handling
  program.exitOverride()

  try {
    await program.parseAsync()
  } catch (error) {
    console.error(chalk.red('Error:'), (error as Error).message)
    process.exit(1)
  }
}
