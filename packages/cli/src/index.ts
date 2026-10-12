/**
 * Tacho CLI - Comprehensive developer tooling for TachUI
 */

import { readFileSync, existsSync } from 'node:fs'
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
const packageJson = (() => {
  const candidates = [
    join(__dirname, '../package.json'),
    join(__dirname, '../../package.json'),
    join(__dirname, '../../../package.json'),
  ]

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return JSON.parse(readFileSync(candidate, 'utf-8'))
    }
  }

  return { version: '0.0.0' }
})()

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
    // `from: 'node'` (argv[0] node, argv[1] script) as Commander 11 assumed.
    // Since 13 it detects `node -e` and reads user arguments from argv[1].
    await program.parseAsync(process.argv, { from: 'node' })
  } catch (error) {
    console.error(chalk.red('Error:'), (error as Error).message)
    process.exit(1)
  }
}
