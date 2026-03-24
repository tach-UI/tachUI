/**
 * Tacho CLI - Init Command
 *
 * Initialize new TachUI projects from file-based templates.
 */

import { existsSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import chalk from 'chalk'
import { Command } from 'commander'
import ora from 'ora'
import prompts from 'prompts'
import { createProject } from '../scaffold/create-project.js'
import { resolveCoreVersionFromMap } from '../scaffold/core-version-map.js'
import { resolvePackageRoot } from '../scaffold/package-root.js'
import { getTemplateDefinition, listTemplateDefinitions } from '../scaffold/templates.js'
import { validateProjectName } from '../scaffold/validators.js'

type PackageManager = 'npm' | 'pnpm'

interface InitOptions {
  template?: string
  yes?: boolean
  tachuiVersion?: string
  packageManager?: PackageManager
  listTemplates?: boolean
}

function readCliVersion(packageRoot: string): string | null {
  const packageJsonPath = join(packageRoot, 'package.json')
  if (!existsSync(packageJsonPath)) {
    return null
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    return typeof packageJson.version === 'string' ? packageJson.version : null
  } catch {
    return null
  }
}

function isValidSemverLike(value: unknown): value is string {
  return typeof value === 'string' && /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(value)
}

async function resolveLatestPublishedCoreVersion(): Promise<string | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 2500)

  try {
    const response = await fetch('https://registry.npmjs.org/@tachui/core/latest', {
      signal: controller.signal,
    })
    if (!response.ok) {
      return null
    }

    const body = (await response.json()) as { version?: unknown }
    return isValidSemverLike(body.version) ? body.version : null
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

async function resolveDefaultTachuiVersion(cliVersion: string | null): Promise<string> {
  const registryVersion = await resolveLatestPublishedCoreVersion()
  if (registryVersion) {
    return registryVersion
  }

  return resolveCoreVersionFromMap(cliVersion)
}

function printTemplates(): void {
  console.log(chalk.cyan('\nAvailable templates:\n'))
  for (const template of listTemplateDefinitions()) {
    console.log(`${chalk.green(template.id)} - ${template.description}`)
  }
  console.log('')
}

function resolveInstallCommand(packageManager: PackageManager): string {
  return packageManager === 'pnpm' ? 'pnpm install' : 'npm install'
}

function resolveDevCommand(packageManager: PackageManager): string {
  return packageManager === 'pnpm' ? 'pnpm dev' : 'npm run dev'
}

function validateTargetToProjectName(target: string, cwd: string): string | null {
  const projectName = target === '.' ? basename(cwd) : basename(target)
  return validateProjectName(projectName)
}

export const initCommand = new Command('init')
  .description('Initialize a new TachUI project')
  .argument('[target]', 'Project directory name (use "." for current directory)')
  .option('-t, --template <template>', 'Project template (basic, advanced)', 'basic')
  .option('-y, --yes', 'Skip prompts and use provided options')
  .option('--tachui-version <version>', 'TachUI package version to scaffold')
  .option(
    '--package-manager <packageManager>',
    'Package manager for next-step instructions (npm, pnpm)',
    'npm'
  )
  .option('--list-templates', 'List available templates')
  .action(async (target?: string, options?: InitOptions) => {
    try {
      const packageRoot = resolvePackageRoot(import.meta.url)
      const templatesRoot = join(packageRoot, 'templates')
      const cliVersion = readCliVersion(packageRoot)

      if (options?.listTemplates) {
        printTemplates()
        return
      }

      const defaultVersion = await resolveDefaultTachuiVersion(cliVersion)

      let finalTarget = target
      let finalTemplateId = (options?.template || 'basic').toLowerCase()
      let finalTachuiVersion = options?.tachuiVersion || defaultVersion
      let finalPackageManager = options?.packageManager || 'npm'

      if (!options?.yes) {
        const responses = await prompts([
          {
            type: 'text',
            name: 'target',
            message: 'Project directory:',
            initial: finalTarget || 'my-tachui-app',
            validate: (value: string) => {
              const result = validateTargetToProjectName(value, process.cwd())
              return result ?? true
            },
          },
          {
            type: 'select',
            name: 'template',
            message: 'Choose a template:',
            choices: listTemplateDefinitions().map(template => ({
              title: template.name,
              description: template.description,
              value: template.id,
            })),
          },
          {
            type: 'text',
            name: 'tachuiVersion',
            message: 'TachUI version for generated dependencies:',
            initial: finalTachuiVersion,
            validate: (value: string) => (value.trim().length > 0 ? true : 'Version is required'),
          },
          {
            type: 'select',
            name: 'packageManager',
            message: 'Package manager:',
            choices: [
              { title: 'npm', value: 'npm' },
              { title: 'pnpm', value: 'pnpm' },
            ],
            initial: finalPackageManager === 'pnpm' ? 1 : 0,
          },
        ])

        if (!responses.target) {
          console.log(chalk.yellow('Operation cancelled'))
          return
        }

        if (!responses.template || !responses.tachuiVersion || !responses.packageManager) {
          console.log(chalk.yellow('Operation cancelled'))
          return
        }

        finalTarget = responses.target
        finalTemplateId = responses.template
        finalTachuiVersion = responses.tachuiVersion
        finalPackageManager = responses.packageManager
      } else if (!finalTarget) {
        console.error(chalk.red('Project target is required when using --yes'))
        process.exit(1)
      }

      if (!finalTarget) {
        console.error(chalk.red('Project target is required'))
        process.exit(1)
      }

      const template = getTemplateDefinition(finalTemplateId)
      if (!template) {
        const available = listTemplateDefinitions()
          .map(item => item.id)
          .join(', ')
        console.error(chalk.red(`Unknown template "${finalTemplateId}". Available templates: ${available}`))
        process.exit(1)
      }

      const packageManager: PackageManager = finalPackageManager === 'pnpm' ? 'pnpm' : 'npm'
      const spinner = ora('Creating TachUI project...').start()
      const result = createProject({
        cwd: process.cwd(),
        target: finalTarget,
        tachuiVersion: finalTachuiVersion,
        template,
        templatesRoot,
      })

      spinner.succeed('Project created successfully')

      const installCommand = resolveInstallCommand(packageManager)
      const devCommand = resolveDevCommand(packageManager)
      const cdLine = finalTarget === '.' ? null : `cd ${finalTarget}`

      console.log(`
${chalk.green('Project:')} ${chalk.cyan(result.projectName)}
${chalk.green('Location:')} ${result.projectPath}
${chalk.green('Template:')} ${template.name}
${chalk.green('TachUI version:')} ${finalTachuiVersion}
${chalk.green('Files created:')} ${result.createdFiles}

${chalk.yellow('Included features:')}
${template.features.map(feature => `  - ${feature}`).join('\n')}

${chalk.yellow('Next steps:')}
${cdLine ? `  ${cdLine}\n` : ''}  ${installCommand}
  ${devCommand}
`)
    } catch (error) {
      console.error(chalk.red('Error creating project:'), (error as Error).message)
      process.exit(1)
    }
  })
