import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const THIS_FILE = fileURLToPath(import.meta.url)
const CORE_DIR = resolve(dirname(THIS_FILE), '../..')
const REPO_ROOT = resolve(CORE_DIR, '../..')

const packageJson = JSON.parse(
  readFileSync(join(CORE_DIR, 'package.json'), 'utf8'),
) as { exports: Record<string, unknown>; scripts: Record<string, string> }

const REMOVED_FILES = [
  'src/modifiers/type-generator.ts',
  'src/build-plugins/modifier-types.ts',
  'src/build-plugins/index.ts',
  'src/build-tools/typegen-runner.ts',
  'scripts/generate-types.ts',
  'scripts/generate-types-monorepo.ts',
  'scripts/lib/run-generator.ts',
  'tsconfig.typegen.json',
  'src/types/generated-modifiers.d.ts',
  'src/types/modifier-metadata.snapshot.json',
]

const REMOVED_SUBPATHS = [
  './modifiers/type-generator',
  './build-plugins',
  './build-tools',
  './build-plugins/modifier-types',
  './build-tools/modifier-types',
]

const REMOVED_IDENTIFIERS = [
  'generateModifierTypes',
  'createModifierMetadataSnapshot',
  'modifierTypesPlugin',
  'typegen-runner',
  'modifiers/type-generator',
]

function sourceFiles(dir: string): string[] {
  if (!existsSync(dir)) return []
  const files: string[] = []
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist') continue
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) {
      files.push(...sourceFiles(path))
    } else if (/\.(ts|tsx|js|mjs)$/.test(entry)) {
      files.push(path)
    }
  }
  return files
}

function testFiles(): string[] {
  const packagesDir = join(REPO_ROOT, 'packages')
  return readdirSync(packagesDir).flatMap((name) => {
    const packageDir = join(packagesDir, name)
    return [
      ...sourceFiles(join(packageDir, '__tests__')),
      ...sourceFiles(join(packageDir, 'tests')),
      ...sourceFiles(join(packageDir, 'src')).filter((file) =>
        /\.test(-d)?\.tsx?$/.test(file),
      ),
    ]
  })
}

describe('modifier type generator removal', () => {
  it('deletes every generator source, script, config and artifact', () => {
    const remaining = REMOVED_FILES.filter((file) =>
      existsSync(join(CORE_DIR, file)),
    )
    expect(remaining).toEqual([])
  })

  it('publishes none of the generator subpaths', () => {
    for (const subpath of REMOVED_SUBPATHS) {
      expect(packageJson.exports, subpath).not.toHaveProperty([subpath])
    }
  })

  it('fails to resolve the generator subpaths from the package', () => {
    // Self-reference resolves through the manifest's exports, as a consumer
    // importing the built package would.
    const script = `
      const results = {}
      for (const specifier of ${JSON.stringify(
        REMOVED_SUBPATHS.map((subpath) => `@tachui/core${subpath.slice(1)}`),
      )}) {
        try {
          import.meta.resolve(specifier)
          results[specifier] = 'resolved'
        } catch (error) {
          results[specifier] = error.code
        }
      }
      results.control = import.meta.resolve('@tachui/core/modifiers/registry')
        ? 'resolved'
        : 'missing'
      console.log(JSON.stringify(results))
    `
    const result = spawnSync(
      'node',
      ['--input-type=module', '--eval', script],
      { cwd: CORE_DIR, encoding: 'utf8' },
    )
    expect(result.stderr).toBe('')
    const results = JSON.parse(result.stdout) as Record<string, string>
    expect(results.control).toBe('resolved')
    for (const subpath of REMOVED_SUBPATHS) {
      expect(results[`@tachui/core${subpath.slice(1)}`], subpath).toBe(
        'ERR_PACKAGE_PATH_NOT_EXPORTED',
      )
    }
  })

  it('drops the generate-modifier-types scripts', () => {
    const generatorScripts = Object.keys(packageJson.scripts).filter((name) =>
      name.startsWith('generate-modifier-types'),
    )
    expect(generatorScripts).toEqual([])
  })

  it('builds no generator entries', () => {
    const viteConfig = readFileSync(join(CORE_DIR, 'vite.config.ts'), 'utf8')
    for (const entry of [
      'build-plugins/index',
      'build-plugins/modifier-types',
      'modifiers/type-generator',
    ]) {
      expect(viteConfig, entry).not.toContain(`'${entry}'`)
    }
  })

  it('leaves no references in core or CLI sources or in any tests', () => {
    const files = [
      ...sourceFiles(join(CORE_DIR, 'src')),
      ...sourceFiles(join(REPO_ROOT, 'packages/cli/src')),
      ...testFiles(),
    ].filter((file) => file !== THIS_FILE)

    const references = files.flatMap((file) => {
      const content = readFileSync(file, 'utf8')
      return REMOVED_IDENTIFIERS.filter((identifier) =>
        content.includes(identifier),
      ).map((identifier) => `${relative(REPO_ROOT, file)}: ${identifier}`)
    })
    expect(references).toEqual([])
  })

  it('removes the devtools metadata hydrator the generator invoked', () => {
    const references = sourceFiles(join(REPO_ROOT, 'packages'))
      .filter((file) => file !== THIS_FILE)
      .filter((file) =>
        readFileSync(file, 'utf8').includes('registerModifierMetadata'),
      )
      .map((file) => relative(REPO_ROOT, file))
    expect(references).toEqual([])
  })

  it('drops the registry dependency devtools only needed for the hydrator', () => {
    const devtoolsDir = join(REPO_ROOT, 'packages/devtools')
    const imports = sourceFiles(join(devtoolsDir, 'src'))
      .filter((file) => readFileSync(file, 'utf8').includes('@tachui/registry'))
      .map((file) => relative(REPO_ROOT, file))
    expect(imports).toEqual([])

    const devtoolsPackage = JSON.parse(
      readFileSync(join(devtoolsDir, 'package.json'), 'utf8'),
    ) as { dependencies?: Record<string, string> }
    expect(devtoolsPackage.dependencies ?? {}).not.toHaveProperty([
      '@tachui/registry',
    ])
  })
})
