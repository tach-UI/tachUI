import { readdirSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import type { TemplateDefinition } from './templates.js'
import { validateProjectName } from './validators.js'

const TEMPLATE_EXT = '.template'

export interface CreateProjectOptions {
  cwd: string
  target: string
  tachuiVersion: string
  template: TemplateDefinition
  templatesRoot: string
}

export interface CreateProjectResult {
  projectName: string
  projectPath: string
  createdFiles: number
}

function collectTemplateFiles(root: string): string[] {
  const output: string[] = []
  const entries = readdirSync(root, { withFileTypes: true })

  for (const entry of entries) {
    const entryPath = join(root, entry.name)

    if (entry.isDirectory()) {
      output.push(...collectTemplateFiles(entryPath))
      continue
    }

    if (entry.isFile()) {
      output.push(entryPath)
    }
  }

  return output
}

function toOutputPath(absoluteTemplatePath: string, templateRoot: string): string {
  const relativePath = absoluteTemplatePath.slice(templateRoot.length + 1)
  if (relativePath.endsWith(TEMPLATE_EXT)) {
    return relativePath.slice(0, -TEMPLATE_EXT.length)
  }
  return relativePath
}

function resolveTargetPath(cwd: string, target: string): string {
  if (target === '.') {
    return cwd
  }
  return resolve(cwd, target)
}

function ensureTargetIsWritable(targetPath: string, target: string): void {
  if (!existsSync(targetPath)) {
    mkdirSync(targetPath, { recursive: true })
    return
  }

  const entries = readdirSync(targetPath)
  if (entries.length > 0) {
    if (target === '.') {
      throw new Error('Current directory is not empty. Use an empty directory for "init ."')
    }
    throw new Error(`Directory "${target}" already exists and is not empty`)
  }
}

function resolveProjectName(targetPath: string): string {
  return basename(targetPath)
}

export function createProject(options: CreateProjectOptions): CreateProjectResult {
  const targetPath = resolveTargetPath(options.cwd, options.target)
  const projectName = resolveProjectName(targetPath)

  const nameValidation = validateProjectName(projectName)
  if (nameValidation) {
    throw new Error(nameValidation)
  }

  ensureTargetIsWritable(targetPath, options.target)

  const templateRoot = join(options.templatesRoot, options.template.directoryName)
  if (!existsSync(templateRoot)) {
    throw new Error(`Template "${options.template.id}" is missing from templates directory`)
  }

  const templateFiles = collectTemplateFiles(templateRoot)
  const replacements: Record<string, string> = {
    '{{PROJECT_NAME}}': projectName,
    '{{TACHUI_VERSION}}': options.tachuiVersion,
  }

  let createdFiles = 0

  for (const templateFile of templateFiles) {
    const outputRelativePath = toOutputPath(templateFile, templateRoot)
    const outputPath = join(targetPath, outputRelativePath)
    mkdirSync(dirname(outputPath), { recursive: true })

    let content = readFileSync(templateFile, 'utf-8')
    for (const [token, replacement] of Object.entries(replacements)) {
      content = content.replaceAll(token, replacement)
    }

    writeFileSync(outputPath, content, 'utf-8')
    createdFiles += 1
  }

  return {
    projectName,
    projectPath: targetPath,
    createdFiles,
  }
}
