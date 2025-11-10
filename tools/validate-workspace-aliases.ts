#!/usr/bin/env tsx

/**
 * Workspace Alias Validator
 *
 * This script validates that all workspace packages have proper aliases configured
 * in vitest.config.ts files. Missing aliases can cause test import failures.
 *
 * Usage:
 *   pnpm tsx tools/validate-workspace-aliases.ts
 *   pnpm tsx tools/validate-workspace-aliases.ts --fix  # Auto-add missing aliases
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { globSync } from 'glob'
import * as yaml from 'yaml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const REPO_ROOT = resolve(__dirname, '..')
const WORKSPACE_FILE = resolve(REPO_ROOT, 'pnpm-workspace.yaml')

interface PackageInfo {
  name: string
  path: string
  srcPath: string
}

interface VitestConfig {
  path: string
  content: string
  aliases: Map<string, string>
  hasResolveAlias: boolean
}

/** Get all workspace packages from pnpm-workspace.yaml */
function getWorkspacePackages(): PackageInfo[] {
  const workspaceContent = readFileSync(WORKSPACE_FILE, 'utf-8')
  const workspace = yaml.parse(workspaceContent)
  const patterns = workspace.packages || []

  const packages: PackageInfo[] = []

  for (const pattern of patterns) {
    const paths = globSync(pattern, { cwd: REPO_ROOT })

    for (const pkgPath of paths) {
      const fullPath = resolve(REPO_ROOT, pkgPath)
      const packageJsonPath = resolve(fullPath, 'package.json')

      if (existsSync(packageJsonPath)) {
        const pkgJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
        const name = pkgJson.name

        if (name && name.startsWith('@tachui/')) {
          // Determine src path (prefer src/, fallback to dist/)
          const srcPath = existsSync(resolve(fullPath, 'src'))
            ? resolve(fullPath, 'src')
            : resolve(fullPath, 'dist')

          packages.push({
            name,
            path: pkgPath,
            srcPath: srcPath.replace(REPO_ROOT + '/', '')
          })
        }
      }
    }
  }

  return packages.sort((a, b) => a.name.localeCompare(b.name))
}

/** Parse vitest config to extract aliases */
function parseVitestConfig(configPath: string): VitestConfig | null {
  if (!existsSync(configPath)) {
    return null
  }

  const content = readFileSync(configPath, 'utf-8')
  const aliases = new Map<string, string>()

  // Check if config has resolve.alias section
  const hasResolveAlias = /resolve:\s*{[\s\S]*?alias:\s*{/.test(content)

  // Extract existing aliases using regex
  const aliasPattern = /'(@tachui\/[\w-]+)':\s*resolve\(__dirname,\s*'([^']+)'\)/g
  let match

  while ((match = aliasPattern.exec(content)) !== null) {
    aliases.set(match[1], match[2])
  }

  return {
    path: configPath,
    content,
    aliases,
    hasResolveAlias
  }
}

/** Check if a package needs to alias dependencies (has tests that might import other packages) */
function shouldValidateAliases(packagePath: string): boolean {
  const testDirs = ['__tests__', 'test', 'tests']

  for (const testDir of testDirs) {
    const testPath = resolve(REPO_ROOT, packagePath, testDir)
    if (existsSync(testPath)) {
      return true
    }
  }

  return false
}

/** Get actual imports from test files */
function getActualImports(packagePath: string): Set<string> {
  const imports = new Set<string>()
  const testDirs = ['__tests__', 'test', 'tests']

  for (const testDir of testDirs) {
    const testPath = resolve(REPO_ROOT, packagePath, testDir)
    if (!existsSync(testPath)) continue

    // Find all test files
    const testFiles = globSync(`${testDir}/**/*.{ts,tsx,js,jsx}`, {
      cwd: resolve(REPO_ROOT, packagePath)
    })

    for (const testFile of testFiles) {
      const fullPath = resolve(REPO_ROOT, packagePath, testFile)
      const content = readFileSync(fullPath, 'utf-8')

      // Extract @tachui imports
      const importPattern = /from\s+['"](@tachui\/[\w-]+)(?:\/.*)?['"]/g
      let match

      while ((match = importPattern.exec(content)) !== null) {
        imports.add(match[1])
      }
    }
  }

  return imports
}

/** Validate a single vitest config */
function validateConfig(
  config: VitestConfig,
  allPackages: PackageInfo[],
  packagePath: string,
  actualImports?: Set<string>
): { missing: PackageInfo[], extra: string[] } {
  const missing: PackageInfo[] = []
  const extra: string[] = []

  // If we have actual imports, only check those
  const packagesToCheck = actualImports
    ? allPackages.filter(pkg => actualImports.has(pkg.name))
    : allPackages

  // Calculate relative path from this package to other packages
  const packageDir = dirname(config.path)
  const relativeToPackages = resolve(packageDir, '../')

  // Check each workspace package
  for (const pkg of packagesToCheck) {
    // Skip self-reference
    const packageName = packagePath.split('/').pop()
    if (pkg.path.includes(packageName!)) {
      continue
    }

    // Skip demo apps unless specifically imported
    if (pkg.name.includes('-app') && !actualImports?.has(pkg.name)) {
      continue
    }

    // Calculate expected alias path
    const pkgDir = pkg.path.split('/').pop()
    const expectedPath = `../${pkgDir}/src`

    // Check if alias exists
    const existingAlias = config.aliases.get(pkg.name)

    if (!existingAlias) {
      missing.push(pkg)
    } else if (existingAlias !== expectedPath && !existingAlias.includes(pkgDir!)) {
      // Alias exists but might be pointing to wrong location
      console.warn(`  ⚠️  ${pkg.name}: points to '${existingAlias}' instead of '${expectedPath}'`)
    }
  }

  // Check for extra aliases (not in workspace)
  const workspaceNames = new Set(allPackages.map(p => p.name))
  for (const [aliasName] of config.aliases) {
    if (!workspaceNames.has(aliasName)) {
      extra.push(aliasName)
    }
  }

  return { missing, extra }
}

/** Generate alias code for missing packages */
function generateAliasCode(packages: PackageInfo[], currentPackagePath: string): string {
  const lines: string[] = []

  for (const pkg of packages) {
    const pkgName = pkg.path.split('/').pop()
    lines.push(`      '${pkg.name}': resolve(__dirname, '../${pkgName}/src'),`)
  }

  return lines.join('\n')
}

/** Auto-fix a vitest config by adding missing aliases */
function autoFixConfig(config: VitestConfig, missing: PackageInfo[]): string {
  let { content } = config

  if (!config.hasResolveAlias) {
    console.error(`  ❌ Cannot auto-fix: config doesn't have resolve.alias section`)
    return content
  }

  // Find the alias object
  const aliasMatch = content.match(/(resolve:\s*{[\s\S]*?alias:\s*{)([\s\S]*?)(}\s*,?\s*})/m)

  if (!aliasMatch) {
    console.error(`  ❌ Cannot auto-fix: could not parse alias section`)
    return content
  }

  const [fullMatch, before, existingAliases, after] = aliasMatch

  // Generate new alias entries
  const newAliases = generateAliasCode(missing, config.path)

  // Insert new aliases before the closing brace
  const updatedAliases = existingAliases.trimEnd() + '\n' + newAliases + '\n    '

  // Replace in content
  content = content.replace(fullMatch, before + updatedAliases + after)

  return content
}

/** Main validation logic */
function main() {
  const args = process.argv.slice(2)
  const shouldFix = args.includes('--fix')
  const verbose = args.includes('--verbose')

  console.log('🔍 Validating workspace aliases in vitest configs...\n')

  // Get all workspace packages
  const allPackages = getWorkspacePackages()
  console.log(`Found ${allPackages.length} workspace packages:\n`)

  if (verbose) {
    allPackages.forEach(pkg => {
      console.log(`  - ${pkg.name.padEnd(30)} (${pkg.srcPath})`)
    })
    console.log()
  }

  // Find all vitest configs
  const vitestConfigs = globSync('packages/*/vitest.config.{ts,js}', { cwd: REPO_ROOT })
  console.log(`Checking ${vitestConfigs.length} vitest configs...\n`)

  let totalMissing = 0
  let totalFixed = 0
  let hasErrors = false

  // Validate each config
  for (const configPath of vitestConfigs) {
    const fullConfigPath = resolve(REPO_ROOT, configPath)
    const packagePath = configPath.replace('/vitest.config.ts', '').replace('/vitest.config.js', '')

    // Skip packages without tests
    if (!shouldValidateAliases(packagePath)) {
      if (verbose) {
        console.log(`⏭️  ${packagePath} (no tests, skipping)`)
      }
      continue
    }

    const config = parseVitestConfig(fullConfigPath)

    if (!config) {
      console.log(`⏭️  ${packagePath} (no config found)`)
      continue
    }

    // Get actual imports from test files
    const actualImports = getActualImports(packagePath)

    const { missing, extra } = validateConfig(config, allPackages, packagePath, actualImports)

    if (missing.length === 0 && extra.length === 0) {
      console.log(`✅ ${packagePath} (${config.aliases.size} aliases configured)`)
      continue
    }

    console.log(`\n❌ ${packagePath}`)

    if (missing.length > 0) {
      console.log(`   Missing ${missing.length} aliases:`)
      missing.forEach(pkg => {
        console.log(`      - ${pkg.name}`)
      })
      totalMissing += missing.length

      // Auto-fix if requested
      if (shouldFix) {
        console.log(`   🔧 Auto-fixing...`)
        const fixedContent = autoFixConfig(config, missing)

        if (fixedContent !== config.content) {
          writeFileSync(config.path, fixedContent, 'utf-8')
          console.log(`   ✅ Added ${missing.length} missing aliases`)
          totalFixed += missing.length
        }
      }
    }

    if (extra.length > 0 && verbose) {
      console.log(`   Extra aliases (not in workspace):`)
      extra.forEach(name => {
        console.log(`      - ${name}`)
      })
    }

    hasErrors = true
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`)
  console.log(`Summary:`)
  console.log(`  Total missing aliases: ${totalMissing}`)

  if (shouldFix) {
    console.log(`  Aliases fixed: ${totalFixed}`)
  }

  if (hasErrors && !shouldFix) {
    console.log(`\n💡 Run with --fix to automatically add missing aliases`)
    process.exit(1)
  } else if (hasErrors && shouldFix && totalFixed < totalMissing) {
    console.log(`\n⚠️  Some configs could not be auto-fixed. Please fix manually.`)
    process.exit(1)
  } else if (!hasErrors) {
    console.log(`\n✅ All vitest configs have proper workspace aliases!`)
    process.exit(0)
  } else {
    console.log(`\n✅ All missing aliases have been fixed!`)
    process.exit(0)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
