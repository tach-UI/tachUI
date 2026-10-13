import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repoRoot = resolve(__dirname, '../..')
const lockText = readFileSync(resolve(repoRoot, 'bun.lock'), 'utf8')

function readManifest(path: string): Record<string, any> {
  return JSON.parse(readFileSync(resolve(repoRoot, path), 'utf8'))
}

function readText(path: string): string {
  return readFileSync(resolve(repoRoot, path), 'utf8')
}

// Every manifest that may declare a dependency range: the root, the docs
// site, and all workspace packages.
function manifestPaths(): string[] {
  const candidates = [
    'package.json',
    'docs/guide/package.json',
    ...readdirSync(resolve(repoRoot, 'packages')).map(dir => `packages/${dir}/package.json`),
  ]
  return candidates.filter(path => existsSync(resolve(repoRoot, path)))
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Resolved versions only: a bun.lock package entry opens its array with
// "name@version", while dependency ranges are written as "name": "range".
function lockedVersions(lock: string, packageName: string): string[] {
  const pattern = new RegExp(`\\[\\s*"${escapeRegExp(packageName)}@([^"]+)"`, 'g')
  const versions = new Set<string>()
  for (const match of lock.matchAll(pattern)) {
    versions.add(match[1])
  }
  return [...versions].sort()
}

// The root plus the 21 workspace packages that declare a TypeScript
// devDependency.
const typescriptDevDependents = [
  'package.json',
  'packages/cli/package.json',
  'packages/connectrpc/package.json',
  'packages/core/package.json',
  'packages/data/package.json',
  'packages/devtools/package.json',
  'packages/eslint-plugin-tachui/package.json',
  'packages/flow-control/package.json',
  'packages/forms/package.json',
  'packages/fragments/package.json',
  'packages/grid/package.json',
  'packages/mobile/package.json',
  'packages/modifiers/package.json',
  'packages/navigation/package.json',
  'packages/primitives/package.json',
  'packages/query/package.json',
  'packages/registry/package.json',
  'packages/responsive/package.json',
  'packages/ssr/package.json',
  'packages/symbols/package.json',
  'packages/types/package.json',
  'packages/viewport/package.json',
]

// The 8 packages whose published peer range floors the compiler version.
const typescriptPeerDependents = [
  'packages/core/package.json',
  'packages/data/package.json',
  'packages/flow-control/package.json',
  'packages/grid/package.json',
  'packages/modifiers/package.json',
  'packages/primitives/package.json',
  'packages/responsive/package.json',
  'packages/viewport/package.json',
]

describe('compiler line: TypeScript 7', () => {
  it('declares typescript ^7.0.2 in the root and all 21 workspace manifests', () => {
    expect(typescriptDevDependents).toHaveLength(22)
    for (const path of typescriptDevDependents) {
      const manifest = readManifest(path)
      const range =
        manifest.dependencies?.typescript ?? manifest.devDependencies?.typescript

      expect(range, path).toBe('^7.0.2')
    }
  })

  it('keeps typescript a runtime dependency only of the CLI', () => {
    const runtime = typescriptDevDependents.filter(
      path => readManifest(path).dependencies?.typescript !== undefined
    )

    expect(runtime).toEqual(['packages/cli/package.json'])
  })

  it('declares no other typescript dependency range anywhere', () => {
    const declaring = manifestPaths().filter(path => {
      const manifest = readManifest(path)
      return (
        manifest.dependencies?.typescript !== undefined ||
        manifest.devDependencies?.typescript !== undefined
      )
    })

    expect(declaring.sort()).toEqual([...typescriptDevDependents].sort())
  })

  it('raises the 8 published typescript peer floors to >=7.0.0', () => {
    for (const path of typescriptPeerDependents) {
      expect(readManifest(path).peerDependencies?.typescript, path).toBe('>=7.0.0')
    }
  })

  it('declares no other typescript peer range anywhere', () => {
    const declaring = manifestPaths().filter(
      path => readManifest(path).peerDependencies?.typescript !== undefined
    )

    expect(declaring.sort()).toEqual([...typescriptPeerDependents].sort())
  })

  it('leaves every typescript peerDependenciesMeta block as optional true', () => {
    const metaBlock = [
      '  "peerDependenciesMeta": {',
      '    "typescript": {',
      '      "optional": true',
      '    }',
      '  }',
    ].join('\n')

    for (const path of typescriptPeerDependents) {
      const manifest = readManifest(path)

      expect(manifest.peerDependenciesMeta, path).toEqual({
        typescript: { optional: true },
      })
      expect(readText(path).includes(metaBlock), path).toBe(true)
    }
  })

  it('declares peerDependenciesMeta only in the 8 peer-floor manifests', () => {
    const declaring = manifestPaths().filter(
      path => readManifest(path).peerDependenciesMeta !== undefined
    )

    expect(declaring.sort()).toEqual([...typescriptPeerDependents].sort())
  })

  it('resolves typescript to a single 7.0.x release everywhere', () => {
    expect(lockedVersions(lockText, 'typescript')).toEqual(['7.0.2'])
  })

  it('leaves no typescript 5 resolution in the lockfile', () => {
    expect(lockText.includes('typescript@5')).toBe(false)
  })
})

describe('release pipeline: changesets v3', () => {
  const rootManifest = readManifest('package.json')

  it('declares the v3 CLI and v1 changelog ranges in the root', () => {
    expect(rootManifest.devDependencies['@changesets/cli']).toBe('^3.0.3')
    expect(rootManifest.devDependencies['@changesets/changelog-github']).toBe('^1.0.1')
  })

  it('resolves the v3 line once each in the lockfile', () => {
    expect(lockedVersions(lockText, '@changesets/cli')).toEqual(['3.0.3'])
    expect(lockedVersions(lockText, '@changesets/changelog-github')).toEqual(['1.0.1'])
    expect(lockedVersions(lockText, '@changesets/config')).toEqual(['4.0.1'])
  })

  it('leaves no v2-line changesets resolution in the lockfile', () => {
    expect(lockText.includes('@changesets/cli@2')).toBe(false)
    expect(lockText.includes('@changesets/changelog-github@0')).toBe(false)
    expect(lockText.includes('@changesets/config@3')).toBe(false)
  })
})

describe('release configuration preserved under v3', () => {
  const config = JSON.parse(readText('.changeset/config.json'))

  it('points the config schema at @changesets/config 4', () => {
    expect(config.$schema).toBe('https://unpkg.com/@changesets/config@4.0.0/schema.json')
  })

  it('keeps the fixed 19-package group', () => {
    expect(config.fixed).toEqual([
      [
        '@tachui/cli',
        '@tachui/core',
        '@tachui/data',
        '@tachui/devtools',
        '@tachui/eslint-plugin',
        '@tachui/flow-control',
        '@tachui/forms',
        '@tachui/fragments',
        '@tachui/grid',
        '@tachui/mobile',
        '@tachui/modifiers',
        '@tachui/navigation',
        '@tachui/primitives',
        '@tachui/registry',
        '@tachui/responsive',
        '@tachui/ssr',
        '@tachui/symbols',
        '@tachui/types',
        '@tachui/viewport',
      ],
    ])
  })

  it('keeps the release-policy keys', () => {
    expect(config.access).toBe('public')
    expect(config.linked).toEqual([])
    expect(config.privatePackages).toEqual({ version: true, tag: false })
    expect(config.baseBranch).toBe('main')
    expect(config.updateInternalDependencies).toBe('patch')
    expect(config.ignore).toEqual(['@tachui/docs'])
  })

  it('keeps the changelog on the repo-pinned github generator', () => {
    expect(config.changelog).toEqual([
      '@changesets/changelog-github',
      { repo: 'tach-UI/tachUI' },
    ])
  })
})

// Walks a root `bun run` chain the way the release workflow executes it:
// `bun run <script>` links recurse, `node <file>` and `./tools/<file>` links
// must exist, `changeset <subcommand>` needs the installed CLI bin, and
// `bun install` is a builtin. Returns the leaf links in order.
function resolveChain(
  entry: string,
  scripts: Record<string, string>,
  seen: string[] = []
): string[] {
  if (seen.includes(entry)) {
    throw new Error(`release script cycle: ${[...seen, entry].join(' -> ')}`)
  }
  const command = scripts[entry]
  if (command === undefined) {
    throw new Error(`release script not found: ${entry}`)
  }
  const leaves: string[] = []
  for (const link of command.split('&&').map(part => part.trim())) {
    const nested = /^bun run (\S+)$/.exec(link)
    if (nested !== null) {
      leaves.push(...resolveChain(nested[1], scripts, [...seen, entry]))
      continue
    }
    const nodeScript = /^node (\S+)$/.exec(link)
    if (nodeScript !== null) {
      if (!existsSync(resolve(repoRoot, nodeScript[1]))) {
        throw new Error(`release script file missing: ${nodeScript[1]}`)
      }
      leaves.push(link)
      continue
    }
    if (link.startsWith('./tools/')) {
      if (!existsSync(resolve(repoRoot, link))) {
        throw new Error(`release script file missing: ${link}`)
      }
      leaves.push(link)
      continue
    }
    if (link.startsWith('changeset ')) {
      if (!existsSync(resolve(repoRoot, 'node_modules/.bin/changeset'))) {
        throw new Error('changeset bin not installed')
      }
      leaves.push(link)
      continue
    }
    if (link === 'bun install') {
      leaves.push(link)
      continue
    }
    throw new Error(`unresolvable release link: ${link}`)
  }
  return leaves
}

describe('release workflow on action v2', () => {
  const workflow = readText('.github/workflows/release.yml')
  const scripts = readManifest('package.json').scripts as Record<string, string>

  it('uses the v3-compatible action major', () => {
    expect(workflow.includes('changesets/action@v2')).toBe(true)
    expect(workflow.includes('changesets/action@v1')).toBe(false)
  })

  it('passes the v2 input names', () => {
    for (const line of [
      'version-script: bun run release:version',
      'publish-script: bun run release:publish',
      "pr-title: 'chore(release): version packages'",
      "commit-message: 'chore(release): version packages'",
      'github-token: ${{ secrets.GITHUB_TOKEN }}',
    ]) {
      expect(workflow.includes(line), line).toBe(true)
    }
  })

  it('passes no v1 input names', () => {
    for (const key of ['version', 'publish', 'title', 'commit']) {
      const keyPattern = new RegExp(`^\\s+${key}:`, 'm')
      expect(workflow.match(keyPattern), key).toBeNull()
    }
  })

  it('reintroduces no NODE_AUTH_TOKEN fallback', () => {
    expect(workflow.match(/^\s*NODE_AUTH_TOKEN\s*:/m)).toBeNull()
  })

  it('resolves the release:version chain', () => {
    expect(resolveChain('release:version', scripts)).toEqual([
      'changeset version',
      'node ./tools/rewrite-workspace-deps.mjs',
      'bun install',
    ])
  })

  it('resolves the release:publish chain', () => {
    expect(resolveChain('release:publish', scripts)).toEqual([
      'node ./tools/check-version-line.mjs',
      'node ./tools/check-packed-internal-deps.mjs',
      'node ./tools/check-published-internal-deps.mjs',
      'node ./tools/check-dep-protocols.mjs',
      './tools/smoke-cli-init-packed.sh',
      'changeset publish',
    ])
  })

  it('reports a missing link instead of resolving it', () => {
    expect(() =>
      resolveChain('release:publish', { ...scripts, 'release:smoke': './tools/missing.sh' })
    ).toThrow('release script file missing: ./tools/missing.sh')
    expect(() => resolveChain('release:nope', scripts)).toThrow(
      'release script not found: release:nope'
    )
  })
})
