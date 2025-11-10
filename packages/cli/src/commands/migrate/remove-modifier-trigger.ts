import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import chalk from 'chalk'
import { Command } from 'commander'
import { glob } from 'glob'
import ora from 'ora'
import { transformRemoveModifierTrigger } from '../../migrations/remove-modifier-trigger.js'

interface RemoveModifierOptions {
  pattern: string
  dryRun: boolean
  check: boolean
  preview?: boolean
  ignore?: string[]
}

const DEFAULT_IGNORE = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/.tachui/**',
  '**/.turbo/**',
]

export function createRemoveModifierTriggerCommand(): Command {
  return new Command('remove-modifier-trigger')
    .description('Remove legacy `.modifier` chaining from TachUI components.')
    .option(
      '-p, --pattern <glob>',
      'Glob pattern for source files',
      'src/**/*.{ts,tsx,js,jsx}'
    )
    .option('--dry-run', 'Preview changes without writing files', false)
    .option('--preview', 'Alias for --dry-run', false)
    .option(
      '--check',
      'Exit with code 1 if any `.modifier` triggers are found (implies dry run)',
      false
    )
    .option('--ignore <patterns...>', 'Additional glob patterns to ignore', [])
    .action(async (options: RemoveModifierOptions) => {
      const spinner = ora('Searching for legacy modifier chains...').start()

      const cwd = process.cwd()
      const ignore = [...DEFAULT_IGNORE, ...(options.ignore ?? [])]
      const argv = process.argv.slice(2)
      const subcommandIndex = argv.indexOf('remove-modifier-trigger')
      const subcommandArgs =
        subcommandIndex === -1 ? [] : argv.slice(subcommandIndex + 1)
      const forwardedPreview =
        subcommandArgs.includes('--dry-run') || subcommandArgs.includes('--preview')
      const previewOnly = Boolean(
        options.dryRun ||
          options.preview ||
          options.check ||
          forwardedPreview
      )

      const files = await glob(options.pattern, {
        cwd,
        absolute: true,
        ignore,
        nodir: true,
      })

      if (files.length === 0) {
        spinner.stop()
        console.log(
          chalk.yellow(
            `No files matched the pattern ${chalk.cyan(options.pattern)}. Adjust the glob or run from the project root.`
          )
        )
        return
      }

      let updatedFiles = 0
      let totalOccurrences = 0
      const touched: Array<{ file: string; occurrences: number }> = []

      for (const file of files) {
        if (file.endsWith('.d.ts')) {
          continue
        }

        try {
          const original = await readFile(file, 'utf-8')
          const { code, modified, occurrences } = transformRemoveModifierTrigger(original, file)

          if (!modified || occurrences === 0) {
            continue
          }

          updatedFiles++
          totalOccurrences += occurrences
          touched.push({
            file: path.relative(cwd, file),
            occurrences,
          })

          if (!previewOnly) {
            await writeFile(file, code, 'utf-8')
          }
        } catch (error) {
          spinner.stop()
          console.error(chalk.red(`Failed to process ${file}`))
          console.error(error)
          throw error
        }
      }

      spinner.stop()

      if (updatedFiles === 0) {
        console.log(chalk.green('No legacy `.modifier` chaining found — nothing to do.'))
        return
      }

      if (previewOnly) {
        console.log(
          chalk.yellow(
            `Dry run: ${updatedFiles} file${updatedFiles === 1 ? '' : 's'} would be updated, removing ${totalOccurrences} legacy trigger${totalOccurrences === 1 ? '' : 's'}.`
          )
        )
      } else {
        console.log(
          chalk.green(
            `Updated ${updatedFiles} file${updatedFiles === 1 ? '' : 's'}, removed ${totalOccurrences} legacy modifier trigger${totalOccurrences === 1 ? '' : 's'}.`
          )
        )
      }

      const previewList = touched.slice(0, 10)
      if (previewList.length > 0) {
        console.log(chalk.gray('\nFiles touched:'))
        for (const entry of previewList) {
          console.log(`  • ${chalk.cyan(entry.file)} (${entry.occurrences} occurrence${entry.occurrences === 1 ? '' : 's'})`)
        }
        if (touched.length > previewList.length) {
          console.log(chalk.gray(`  ...and ${touched.length - previewList.length} more`))
        }
      }

      if (options.check && updatedFiles > 0) {
        process.exitCode = 1
      }
    })
}
