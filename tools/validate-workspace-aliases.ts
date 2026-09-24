#!/usr/bin/env tsx

/**
 * Workspace Alias Validator
 *
 * The shared vitest config is the single source of truth for `@tachui/*`
 * import aliases: most package configs are just
 * `mergeConfig(sharedConfig, ...)`, and a handful define their own aliases.
 * This script checks the two gaps that arrangement can develop:
 *
 * 1. Every workspace package imported by any test suite is covered by the
 *    shared config's aliases. A new package with tests but no shared alias
 *    breaks every consumer suite that imports it.
 * 2. Every package vitest config whose tests import other workspace packages
 *    either merges the shared config or defines its own aliases. A config
 *    doing neither resolves those imports against node_modules (stale dist
 *    output) instead of the workspace sources. Configs whose tests import
 *    nothing cross-package are exempt — there is nothing to misresolve.
 *
 * Genuinely missing aliases already fail loudly — the importing suite cannot
 * even collect — so this is an early, fast pointer at the fix, not a gate
 * that proves anything the test run does not.
 *
 * Usage:
 *   bunx tsx tools/validate-workspace-aliases.ts
 *   bunx tsx tools/validate-workspace-aliases.ts --fix  # add missing shared aliases
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { globSync } from 'glob'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const REPO_ROOT = resolve(__dirname, '..')
const SHARED_CONFIG = 'vitest.shared.config.ts'

export interface SharedAliasEntry {
  find: string
  replacementSource: string
}

/** Extract string `find` values from a resolve.alias array. Regex finds are skipped. */
export function extractStringFinds(configContent: string): string[] {
  const finds: string[] = []
  const findPattern = /find:\s*['"]([^'"]+)['"]/g
  let match: RegExpExecArray | null

  while ((match = findPattern.exec(configContent)) !== null) {
    finds.push(match[1])
  }

  return finds
}

/** A find covers a package when it names the package or a path under it. */
export function packageCoveredByFinds(packageName: string, finds: string[]): boolean {
  return finds.some(raw => {
    const find = raw.endsWith('/') ? raw.slice(0, -1) : raw
    return find === packageName || find.startsWith(`${packageName}/`)
  })
}

/** True when the config merges the shared config. */
export function mergesSharedConfig(configContent: string): boolean {
  return /mergeConfig\s*\(\s*sharedConfig\b/.test(configContent)
}

/** True when the config defines a resolve.alias section of its own. */
export function definesOwnAliases(configContent: string): boolean {
  return /alias\s*:/.test(configContent)
}

/** Extract base `@tachui/*` package names imported by a source file. */
export function extractTachuiImports(fileContent: string): string[] {
  const imports = new Set<string>()
  const importPattern = /from\s+['"](@tachui\/[\w-]+)(?:\/.*)?['"]/g
  let match: RegExpExecArray | null

  while ((match = importPattern.exec(fileContent)) !== null) {
    imports.add(match[1])
  }

  return [...imports]
}

interface CharPosition {
  index: number
}

/** Advance past a quoted string starting at the quote character. */
function skipString(content: string, state: CharPosition): void {
  const quote = content[state.index]
  state.index += 1

  while (state.index < content.length) {
    const current = content[state.index]
    if (current === '\\') {
      state.index += 2
      continue
    }
    state.index += 1
    if (current === quote) return
  }
}

/** Advance past a // or block comment starting at the opening slash. */
function skipComment(content: string, state: CharPosition): void {
  if (content[state.index + 1] === '/') {
    const end = content.indexOf('\n', state.index)
    state.index = end === -1 ? content.length : end + 1
    return
  }

  const end = content.indexOf('*/', state.index + 2)
  state.index = end === -1 ? content.length : end + 2
}

/**
 * Locate the `alias: [ ... ]` array and return the entry indentation plus the
 * index of the closing bracket. Strings and comments are skipped so brackets
 * inside them do not confuse the scan.
 */
function locateAliasArray(content: string): { entryIndent: string; closeIndex: number } | null {
  const state: CharPosition = { index: 0 }
  const opener = /alias:\s*\[/y
  let arrayStart = -1

  while (state.index < content.length) {
    const current = content[state.index]

    if (current === "'" || current === '"' || current === '`') {
      skipString(content, state)
      continue
    }

    if (current === '/' && (content[state.index + 1] === '/' || content[state.index + 1] === '*')) {
      skipComment(content, state)
      continue
    }

    const preceding = state.index === 0 ? '' : content[state.index - 1]
    opener.lastIndex = state.index
    const openMatch = opener.exec(content)
    if (openMatch && !/[\w$]/.test(preceding)) {
      arrayStart = state.index + openMatch[0].length - 1
      break
    }

    state.index += 1
  }

  if (arrayStart === -1) return null

  state.index = arrayStart
  let depth = 0

  while (state.index < content.length) {
    const current = content[state.index]

    if (current === "'" || current === '"' || current === '`') {
      skipString(content, state)
      continue
    }

    if (current === '/' && (content[state.index + 1] === '/' || content[state.index + 1] === '*')) {
      skipComment(content, state)
      continue
    }

    if (current === '[') depth += 1
    if (current === ']') {
      depth -= 1
      if (depth === 0) {
        const lineStart = content.lastIndexOf('\n', state.index) + 1
        const closeIndent = content.slice(lineStart, state.index).match(/^\s*/)?.[0] ?? ''
        return { entryIndent: `${closeIndent}  `, closeIndex: state.index }
      }
    }

    state.index += 1
  }

  return null
}

/**
 * Insert alias entries at the end of the shared config's alias array,
 * matching the existing entry style and indentation.
 */
export function insertSharedAliases(content: string, entries: SharedAliasEntry[]): string {
  const located = locateAliasArray(content)
  if (!located) {
    throw new Error('no resolve.alias array found in shared config')
  }

  const { entryIndent, closeIndex } = located
  const propIndent = `${entryIndent}  `
  const rendered = entries
    .map(
      entry =>
        `${entryIndent}{\n` +
        `${propIndent}find: '${entry.find}',\n` +
        `${propIndent}replacement: ${entry.replacementSource},\n` +
        `${entryIndent}},`
    )
    .join('\n')

  const before = content.slice(0, closeIndex).trimEnd()
  const after = content.slice(closeIndex)
  const closeIndent = entryIndent.slice(0, -2)
  return `${before}\n${rendered}\n${closeIndent}${after}`
}

/** Short workspace dir (e.g. `packages/query`) for a package name, if it has sources. */
function resolvePackageDir(packageName: string): string | null {
  const dirName = packageName.replace('@tachui/', '')
  const candidate = resolve(REPO_ROOT, 'packages', dirName)
  if (!existsSync(resolve(candidate, 'package.json'))) return null
  if (!existsSync(resolve(candidate, 'src'))) return null
  return `packages/${dirName}`
}

/** `@tachui/*` packages imported by test files, grouped by package dir. */
function collectTestImportsByPackage(): Map<string, Set<string>> {
  const byPackage = new Map<string, Set<string>>()
  const testFiles = globSync('packages/*/{__tests__,test,tests}/**/*.{ts,tsx,js,jsx}', {
    cwd: REPO_ROOT,
  })

  for (const testFile of testFiles) {
    const packageDir = testFile.split('/').slice(0, 2).join('/')
    const content = readFileSync(resolve(REPO_ROOT, testFile), 'utf-8')
    const imports = byPackage.get(packageDir) ?? new Set<string>()
    for (const imported of extractTachuiImports(content)) {
      imports.add(imported)
    }
    byPackage.set(packageDir, imports)
  }

  return byPackage
}

/** Main validation logic */
function main() {
  const args = process.argv.slice(2)
  const shouldFix = args.includes('--fix')

  console.log('Validating workspace aliases...\n')

  const sharedPath = resolve(REPO_ROOT, SHARED_CONFIG)
  if (!existsSync(sharedPath)) {
    console.error(`Shared config not found: ${SHARED_CONFIG}`)
    process.exit(1)
  }

  const sharedContent = readFileSync(sharedPath, 'utf-8')
  const finds = extractStringFinds(sharedContent)
  console.log(`Shared config declares ${finds.length} alias finds.`)

  let failures = 0

  // Check 1: every test-imported package is covered by the shared config.
  const importsByPackage = collectTestImportsByPackage()
  const imported = [...new Set([...importsByPackage.values()].flatMap(set => [...set]))].toSorted()
  const uncovered = imported.filter(name => !packageCoveredByFinds(name, finds))

  if (uncovered.length > 0) {
    failures += uncovered.length
    console.log(`\nTest suites import ${uncovered.length} package(s) the shared config does not cover:`)
    for (const name of uncovered) {
      console.log(`  - ${name}`)
    }

    if (shouldFix) {
      const entries: SharedAliasEntry[] = []
      for (const name of uncovered) {
        const dir = resolvePackageDir(name)
        if (!dir) {
          console.log(`  Cannot fix ${name}: no packages/<name>/src found; add it by hand.`)
          continue
        }
        entries.push({
          find: name,
          replacementSource: `path.resolve(__dirname, '${dir}/src')`,
        })
      }

      if (entries.length > 0) {
        try {
          writeFileSync(sharedPath, insertSharedAliases(sharedContent, entries), 'utf-8')
          console.log(`Added ${entries.length} alias(es) to ${SHARED_CONFIG}.`)
          failures -= entries.length
        } catch (error) {
          console.log(`Cannot fix: ${(error as Error).message}`)
        }
      }
    }
  } else {
    console.log(`All ${imported.length} test-imported packages are covered by the shared config.`)
  }

  // Check 2: configs with cross-package test imports merge shared or define aliases.
  const packageConfigs = globSync('packages/*/vitest.config.{ts,js}', { cwd: REPO_ROOT })
  const orphaned: string[] = []

  for (const configPath of packageConfigs) {
    const packageDir = configPath.split('/').slice(0, 2).join('/')
    if ((importsByPackage.get(packageDir) ?? new Set()).size === 0) continue
    const content = readFileSync(resolve(REPO_ROOT, configPath), 'utf-8')
    if (!mergesSharedConfig(content) && !definesOwnAliases(content)) {
      orphaned.push(configPath)
    }
  }

  if (orphaned.length > 0) {
    failures += orphaned.length
    console.log(`\n${orphaned.length} config(s) with cross-package test imports have no aliases:`)
    for (const configPath of orphaned) {
      console.log(`  - ${configPath}`)
    }
    console.log('Add mergeConfig(sharedConfig, ...) or a local resolve.alias section by hand.')
  } else {
    console.log(
      `All ${packageConfigs.length} package configs with cross-package test imports resolve via aliases.`
    )
  }

  if (failures > 0) {
    console.log(`\n${failures} problem(s) found.${shouldFix ? '' : ' Run with --fix to add missing shared aliases.'}`)
    process.exit(1)
  }

  console.log('\nAll workspace aliases check out.')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
