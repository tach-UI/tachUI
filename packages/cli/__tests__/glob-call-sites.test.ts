/**
 * Glob call-site match tests
 *
 * Each case runs the default pattern and ignore list of one `glob()` call in
 * the CLI, read from the command itself, and pins the files it matches in a
 * fixture tree. The expected sets were
 * recorded from the previous glob major, so a dependency bump that changes
 * which files a command picks up (brace expansion, ignore handling, dotfiles,
 * directories, absolute output) fails here instead of in a user's project.
 */

import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type { Command } from 'commander'
import { glob } from 'glob'
import { analyzeCommand } from '../src/commands/analyze'
import { migrateCommand } from '../src/commands/migrate'
import {
  createRemoveModifierTriggerCommand,
  DEFAULT_IGNORE as REMOVE_TRIGGER_IGNORE,
} from '../src/commands/migrate/remove-modifier-trigger'
import { optimizeCommand } from '../src/commands/optimize'
import { ImportOptimizer } from '../src/import-optimizer'

const FIXTURE_FILES = [
  'src/a.ts',
  'src/b.tsx',
  'src/c.js',
  'src/d.jsx',
  'src/e.vue',
  'src/types.d.ts',
  'src/nested/deep/f.ts',
  'src/.hidden/g.ts',
  'src/.dotfile.ts',
  'src/readme.md',
  'src/node_modules/pkg/index.js',
  'src/dist/out.js',
  'src/build/x.ts',
  'src/.next/y.ts',
  // A directory whose name matches the source-file patterns.
  'src/dir.ts/inner.ts',
  'node_modules/pkg/index.ts',
  'dist/bundle.js',
  'root.ts',
  'lib/util.js',
  'lib/skip.d.ts',
]

const REMOVE_TRIGGER_PATTERN = defaultPattern(
  createRemoveModifierTriggerCommand(),
  '--pattern'
)

// Default patterns of analyze/optimize match the same files.
const SOURCE_PATTERN_MATCHES = [
  'src/a.ts',
  'src/b.tsx',
  'src/build/x.ts',
  'src/c.js',
  'src/d.jsx',
  'src/dir.ts',
  'src/dir.ts/inner.ts',
  'src/dist/out.js',
  'src/nested/deep/f.ts',
  'src/node_modules/pkg/index.js',
  'src/types.d.ts',
]

let root: string

function defaultPattern(command: Command, flag: string): string {
  const option = command.options.find(candidate => candidate.long === flag)
  if (typeof option?.defaultValue !== 'string') {
    throw new Error(`${command.name()} has no string default for ${flag}`)
  }
  return option.defaultValue
}

function relativeSorted(matches: string[]): string[] {
  return matches
    .map(match => (path.isAbsolute(match) ? path.relative(root, match) : match))
    .map(match => match.split(path.sep).join('/'))
    .sort()
}

beforeAll(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'tachui-cli-glob-'))
  for (const file of FIXTURE_FILES) {
    const filePath = path.join(root, file)
    await mkdir(path.dirname(filePath), { recursive: true })
    await writeFile(filePath, '')
  }
})

afterAll(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('glob dependency', () => {
  it('resolves the 13.x major for the CLI', async () => {
    const require = createRequire(import.meta.url)
    const entry = require.resolve('glob')
    const manifestPath = path.join(
      entry.slice(0, entry.lastIndexOf(`${path.sep}glob${path.sep}`)),
      'glob',
      'package.json'
    )
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))

    expect(manifest.name).toBe('glob')
    expect(Number.parseInt(manifest.version, 10)).toBe(13)
  })
})

describe('glob call sites', () => {
  it('import-optimizer: matches sources outside root node_modules/dist, skipping .d.ts', async () => {
    const matches = await glob('**/*.{ts,tsx,js,jsx}', {
      cwd: root,
      ignore: ['node_modules/**', 'dist/**', '**/*.d.ts'],
    })

    expect(matches.every(match => !path.isAbsolute(match))).toBe(true)
    expect(relativeSorted(matches)).toEqual([
      'lib/util.js',
      'root.ts',
      'src/a.ts',
      'src/b.tsx',
      'src/build/x.ts',
      'src/c.js',
      'src/d.jsx',
      'src/dir.ts',
      'src/dir.ts/inner.ts',
      'src/dist/out.js',
      'src/nested/deep/f.ts',
      'src/node_modules/pkg/index.js',
    ])
  })

  it('import-optimizer: analyzeProject visits every matched file', async () => {
    const optimizer = new ImportOptimizer()
    const analyzeFile = vi
      .spyOn(optimizer, 'analyzeFile')
      .mockImplementation(file => ({ file, imports: [] }))

    await optimizer.analyzeProject(root)

    const visited = analyzeFile.mock.calls.map(([file]) =>
      path.relative(root, file).split(path.sep).join('/')
    )
    expect(visited.sort()).toEqual([
      'lib/util.js',
      'root.ts',
      'src/a.ts',
      'src/b.tsx',
      'src/build/x.ts',
      'src/c.js',
      'src/d.jsx',
      'src/dir.ts',
      'src/dir.ts/inner.ts',
      'src/dist/out.js',
      'src/nested/deep/f.ts',
      'src/node_modules/pkg/index.js',
    ])
  })

  it.each([
    ['analyze', analyzeCommand],
    ['optimize', optimizeCommand],
  ])(
    '%s: default pattern returns absolute paths for the same files',
    async (_name, command) => {
      const matches = await glob(defaultPattern(command, '--pattern'), {
        cwd: root,
        absolute: true,
      })

      expect(matches.every(match => path.isAbsolute(match))).toBe(true)
      expect(relativeSorted(matches)).toEqual(SOURCE_PATTERN_MATCHES)
    }
  )

  it('migrate: default input pattern also picks up .vue files', async () => {
    const matches = await glob(defaultPattern(migrateCommand, '--input'), {
      cwd: root,
      absolute: true,
    })

    expect(matches.every(match => path.isAbsolute(match))).toBe(true)
    expect(relativeSorted(matches)).toEqual(
      [...SOURCE_PATTERN_MATCHES, 'src/e.vue'].sort()
    )
  })

  it('remove-modifier-trigger: default ignores and nodir drop build output and directories', async () => {
    const matches = await glob(REMOVE_TRIGGER_PATTERN, {
      cwd: root,
      absolute: true,
      ignore: REMOVE_TRIGGER_IGNORE,
      nodir: true,
    })

    expect(matches.every(match => path.isAbsolute(match))).toBe(true)
    expect(relativeSorted(matches)).toEqual([
      'src/a.ts',
      'src/b.tsx',
      'src/c.js',
      'src/d.jsx',
      'src/dir.ts/inner.ts',
      'src/nested/deep/f.ts',
      'src/types.d.ts',
    ])
  })

  it('remove-modifier-trigger: a user --ignore pattern removes its matches', async () => {
    const matches = await glob(REMOVE_TRIGGER_PATTERN, {
      cwd: root,
      absolute: true,
      ignore: [...REMOVE_TRIGGER_IGNORE, 'src/nested/**'],
      nodir: true,
    })

    expect(relativeSorted(matches)).toEqual([
      'src/a.ts',
      'src/b.tsx',
      'src/c.js',
      'src/d.jsx',
      'src/dir.ts/inner.ts',
      'src/types.d.ts',
    ])
  })

  it('never matches dotfiles or files under dot directories', async () => {
    const matches = await glob('**/*.{ts,tsx,js,jsx}', { cwd: root })

    expect(relativeSorted(matches).filter(match => /(^|\/)\./.test(match))).toEqual([])
  })
})
