import { existsSync, readFileSync } from 'node:fs'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  comparableDeclaration,
  comparableSnapshot,
  DEFAULT_HYDRATORS,
  verifyOutputs,
} from '../../src/build-tools/typegen-runner'
import type { GeneratedModifierArtifacts } from '../../src/modifiers/type-generator'

const BUILD_TOOLS_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../src/build-tools',
)
const TYPES_DIR = resolve(BUILD_TOOLS_DIR, '../types')

function artifacts(
  overrides: { generatedAt?: string; version?: string; signature?: string } = {},
): GeneratedModifierArtifacts {
  const generatedAt = overrides.generatedAt ?? '2026-01-01T00:00:00.000Z'
  const version = overrides.version ?? '1.0.0'
  const signature = overrides.signature ?? '(value: number): this'
  return {
    declaration: [
      '// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.',
      `// Generated at: ${generatedAt}`,
      `// Plugins: @tachui/modifiers@${version} (verified)`,
      `  sample${signature.replace(/\bthis\b/, 'ModifierBuilder<T>')};`,
      '',
    ].join('\n'),
    snapshot: {
      generatedAt,
      totalModifiers: 1,
      categories: {
        layout: [
          {
            name: 'sample',
            nameKind: 'string',
            plugin: '@tachui/modifiers',
            priority: 120,
            signature,
            category: 'layout',
          },
        ],
      },
      plugins: [
        { name: '@tachui/modifiers', version, author: 'tachUI Team', verified: true },
      ],
      conflicts: [],
      registryHealth: {
        totalModifiers: 1,
        duplicateNames: [],
        orphanedReferences: [],
        instanceId: `id-${generatedAt}`,
        createdAt: Date.parse(generatedAt),
        instanceCount: 3,
      },
    },
  }
}

async function writeOutputs(
  generated: GeneratedModifierArtifacts,
): Promise<{ declarationFile: string; snapshotFile: string }> {
  const dir = await mkdtemp(join(tmpdir(), 'tachui-typegen-'))
  const declarationFile = join(dir, 'generated-modifiers.d.ts')
  const snapshotFile = join(dir, 'modifier-metadata.snapshot.json')
  await writeFile(declarationFile, generated.declaration)
  await writeFile(snapshotFile, JSON.stringify(generated.snapshot, null, 2))
  return { declarationFile, snapshotFile }
}

describe('default hydrators', () => {
  it('point at modules that exist in the repository', () => {
    for (const hydrator of DEFAULT_HYDRATORS) {
      const target = resolve(BUILD_TOOLS_DIR, hydrator.relativePath)
      const [packageRoot, distPath] = target.split('/dist/')

      // A dist bundle only exists once its package is built; before that, the
      // package's sources are the most that can be checked.
      if (distPath !== undefined && !existsSync(target)) {
        expect(existsSync(join(packageRoot!, 'src')), hydrator.name).toBe(true)
        continue
      }

      expect(existsSync(target), hydrator.name).toBe(true)
    }
  })

  it('hydrate @tachui/modifiers before the packages that import it', () => {
    expect(DEFAULT_HYDRATORS[0]?.name).toBe('@tachui/modifiers')
  })

  it('cover every first-party package that registers modifiers', () => {
    expect(DEFAULT_HYDRATORS.map((hydrator) => hydrator.name)).toEqual([
      '@tachui/modifiers',
      '@tachui/modifiers/preload/effects',
      '@tachui/responsive',
      '@tachui/grid',
      '@tachui/viewport',
      '@tachui/mobile',
      '@tachui/forms',
      '@tachui/fragments',
    ])
  })
})

describe('comparable artifacts', () => {
  it('ignore generation time, registry identity and plugin versions', () => {
    const first = artifacts()
    const second = artifacts({
      generatedAt: '2026-06-01T12:00:00.000Z',
      version: '2.0.0',
    })

    expect(comparableDeclaration(second.declaration)).toBe(
      comparableDeclaration(first.declaration),
    )
    expect(comparableSnapshot(second.snapshot)).toEqual(
      comparableSnapshot(first.snapshot),
    )
  })

  it('still see a changed signature', () => {
    const first = artifacts()
    const changed = artifacts({ signature: '(value: string): this' })

    expect(comparableDeclaration(changed.declaration)).not.toBe(
      comparableDeclaration(first.declaration),
    )
    expect(comparableSnapshot(changed.snapshot)).not.toEqual(
      comparableSnapshot(first.snapshot),
    )
  })
})

describe('verifyOutputs', () => {
  afterEach(() => {
    process.exitCode = undefined
    vi.restoreAllMocks()
  })

  it('passes committed artifacts that differ only in volatile fields', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const paths = await writeOutputs(artifacts())

    await verifyOutputs(
      artifacts({ generatedAt: '2027-01-01T00:00:00.000Z', version: '9.9.9' }),
      paths.declarationFile,
      paths.snapshotFile,
    )

    expect(process.exitCode).toBeUndefined()
    expect(log).toHaveBeenCalledWith('✅ Modifier type declarations are up to date.')
  })

  it('fails committed artifacts with a stale signature', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const paths = await writeOutputs(artifacts())

    await verifyOutputs(
      artifacts({ signature: '(value: string): this' }),
      paths.declarationFile,
      paths.snapshotFile,
    )

    expect(process.exitCode).toBe(1)
    expect(error).toHaveBeenCalledTimes(2)
  })

  it('fails when the artifacts are missing or unreadable', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const paths = await writeOutputs(artifacts())
    await writeFile(paths.snapshotFile, '{ not json')

    await verifyOutputs(
      artifacts(),
      join(dirname(paths.declarationFile), 'missing.d.ts'),
      paths.snapshotFile,
    )

    expect(process.exitCode).toBe(1)
  })
})

describe('committed modifier artifacts', () => {
  it('declare the registered modifiers instead of the empty placeholder', () => {
    const declaration = readFileSync(
      join(TYPES_DIR, 'generated-modifiers.d.ts'),
      'utf8',
    )
    const snapshot = JSON.parse(
      readFileSync(join(TYPES_DIR, 'modifier-metadata.snapshot.json'), 'utf8'),
    )

    expect(declaration).not.toContain('No modifier metadata registered')
    expect(snapshot.totalModifiers).toBeGreaterThan(0)
    expect(declaration).toMatch(/^ {4}overlay\(content: OverlayContent, /m)
    expect(declaration).toMatch(/^ {4}padding\(optionsOrAll: /m)
    expect(declaration).toMatch(/^ {4}clipShape\(shape: ClipShapeName \| Shape/m)
  })

  it('parse as TypeScript without syntax errors', () => {
    // Neither core TypeScript program compiles this file, so parse it here.
    const declarationPath = join(TYPES_DIR, 'generated-modifiers.d.ts')
    const program = ts.createProgram([declarationPath], {
      noLib: true,
      noResolve: true,
      types: [],
    })
    const diagnostics = program.getSyntacticDiagnostics(
      program.getSourceFile(declarationPath),
    )

    expect(
      diagnostics.map(diagnostic =>
        ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
      ),
    ).toEqual([])
  })
})
