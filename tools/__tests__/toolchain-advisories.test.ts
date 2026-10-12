import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repoRoot = resolve(__dirname, '../..')
const lockText = readFileSync(resolve(repoRoot, 'bun.lock'), 'utf8')

// First patched release per major line, taken from the GitHub advisories that
// `bun audit` reported as high severity against the dev/build toolchain. A
// resolution below its line's floor means a vulnerable copy came back.
const patchedFloors: Record<string, Record<number, string>> = {
  vite: { 7: '7.3.5', 8: '8.0.16' },
  'brace-expansion': { 1: '1.1.18', 2: '2.1.4', 5: '5.0.9' },
  'js-yaml': { 3: '3.15.2', 4: '4.3.2' },
  nanoid: { 3: '3.3.16' },
  postcss: { 8: '8.5.23' },
  'fast-uri': { 3: '3.1.7' },
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

// Dependency names of every resolution of a package. A bun.lock package entry
// sits on one line as `"key": ["name@version", "", { "dependencies": ... }, "sha"],`.
function lockedDependencies(lock: string, packageName: string): string[] {
  const pattern = new RegExp(`^\\s*"[^"]+": (\\["${escapeRegExp(packageName)}@.*\\]),$`, 'gm')
  const names = new Set<string>()
  for (const match of lock.matchAll(pattern)) {
    const [, , metadata] = JSON.parse(match[1]) as [
      string,
      string,
      { dependencies?: object; optionalDependencies?: object },
    ]
    for (const name of [
      ...Object.keys(metadata.dependencies ?? {}),
      ...Object.keys(metadata.optionalDependencies ?? {}),
    ]) {
      names.add(name)
    }
  }
  return [...names].sort()
}

function versionParts(version: string): number[] {
  return version
    .split('-')[0]
    .split('.')
    .map(part => Number.parseInt(part, 10))
}

// A prerelease sorts below its release, so 8.5.23-alpha.1 is below a floor of
// 8.5.23 even though its numeric parts match.
function isBelow(version: string, floor: string): boolean {
  const actual = versionParts(version)
  const minimum = versionParts(floor)
  for (let index = 0; index < 3; index++) {
    if (actual[index] !== minimum[index]) {
      return actual[index] < minimum[index]
    }
  }
  return version.includes('-')
}

function unpatchedVersions(lock: string, packageName: string): string[] {
  const floors = patchedFloors[packageName]
  return lockedVersions(lock, packageName).filter(version => {
    const floor = floors[versionParts(version)[0]]
    return floor === undefined || isBelow(version, floor)
  })
}

describe('lockfile toolchain advisories', () => {
  it('resolves only vite 7.x or later', () => {
    const versions = lockedVersions(lockText, 'vite')

    expect(versions.length).toBeGreaterThan(0)
    for (const version of versions) {
      expect(versionParts(version)[0], `vite@${version}`).toBeGreaterThanOrEqual(7)
    }
  })

  it('resolves the docs site to the vitepress 2.x line', () => {
    const docsManifest = JSON.parse(
      readFileSync(resolve(repoRoot, 'docs/guide/package.json'), 'utf8')
    )

    expect(docsManifest.dependencies.vitepress).toMatch(/^\D*2\./)
    expect(lockedVersions(lockText, 'vitepress').map(v => versionParts(v)[0])).toEqual([2])
  })

  it.each(Object.keys(patchedFloors))(
    'resolves no %s release below its patched floor',
    packageName => {
      expect(lockedVersions(lockText, packageName).length).toBeGreaterThan(0)
      expect(unpatchedVersions(lockText, packageName)).toEqual([])
    }
  )

  it('flags a vulnerable resolution, including one on an unknown major line', () => {
    const lock = [
      '"vite": ["vite@5.4.21", "", {}, "sha512-a"],',
      '"vitepress/vite": ["vite@7.3.4", "", {}, "sha512-b"],',
      '"other/vite": ["vite@8.3.1", "", {}, "sha512-c"],',
      '"postcss": ["postcss@8.5.22", "", { "dependencies": { "nanoid": "^3.3.11" } }, "sha512-d"],',
    ].join('\n')

    expect(unpatchedVersions(lock, 'vite')).toEqual(['5.4.21', '7.3.4'])
    expect(unpatchedVersions(lock, 'postcss')).toEqual(['8.5.22'])
    // A dependency range is not a resolution.
    expect(lockedVersions(lock, 'nanoid')).toEqual([])
  })

  it('declares jsdom ^30 and @types/jsdom ^30 in every manifest that uses them', () => {
    const manifestPaths = [
      'package.json',
      ...readdirSync(resolve(repoRoot, 'packages')).map(dir => `packages/${dir}/package.json`),
    ].filter(path => existsSync(resolve(repoRoot, path)))
    const declared: Record<string, string> = {}
    for (const path of manifestPaths) {
      const manifest = JSON.parse(readFileSync(resolve(repoRoot, path), 'utf8'))
      for (const name of ['jsdom', '@types/jsdom']) {
        const range = manifest.dependencies?.[name] ?? manifest.devDependencies?.[name]
        if (range !== undefined) declared[`${path} ${name}`] = range
      }
    }

    expect(declared['package.json jsdom']).toBeDefined()
    expect(declared['packages/core/package.json @types/jsdom']).toBeDefined()
    for (const [where, range] of Object.entries(declared)) {
      expect(range, where).toMatch(/^\^30(\.|$)/)
    }
  })

  it('resolves jsdom and @types/jsdom only on the 30.x line', () => {
    expect(lockedVersions(lockText, 'jsdom').map(v => versionParts(v)[0])).toEqual([30])
    expect(lockedVersions(lockText, '@types/jsdom').map(v => versionParts(v)[0])).toEqual([
      30,
    ])
  })

  it('resolves no ws through jsdom', () => {
    const dependencies = lockedDependencies(lockText, 'jsdom')

    expect(dependencies).toContain('parse5')
    expect(dependencies).not.toContain('ws')
  })

  it('reads a ws dependency off a jsdom 23 entry', () => {
    const lock = [
      '    "jsdom": ["jsdom@23.2.0", "", { "dependencies": { "parse5": "^7.1.2", "ws": "^8.16.0" }, "peerDependencies": { "canvas": "^2.11.2" } }, "sha512-a"],',
      '    "other": ["other@1.0.0", "", { "dependencies": { "jsdom": "^23.2.0" } }, "sha512-b"],',
    ].join('\n')

    expect(lockedDependencies(lock, 'jsdom')).toEqual(['parse5', 'ws'])
    expect(lockedVersions(lock, 'jsdom')).toEqual(['23.2.0'])
  })

  it('reads a ws optional dependency off a jsdom entry', () => {
    const lock =
      '    "jsdom": ["jsdom@23.2.0", "", { "dependencies": { "parse5": "^7.1.2" }, "optionalDependencies": { "ws": "^8.16.0" } }, "sha512-a"],'

    expect(lockedDependencies(lock, 'jsdom')).toEqual(['parse5', 'ws'])
  })

  it('declares the root Node engines range that jsdom requires', () => {
    const rootManifest = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8'))
    const jsdomManifest = JSON.parse(
      readFileSync(resolve(repoRoot, 'node_modules/jsdom/package.json'), 'utf8')
    )

    expect(jsdomManifest.engines.node).toBeDefined()
    expect(rootManifest.engines.node).toBe(jsdomManifest.engines.node)
  })

  it('flags a prerelease of a patched floor version', () => {
    const lock = [
      '"postcss": ["postcss@8.5.23-alpha.1", "", {}, "sha512-a"],',
      '"other/postcss": ["postcss@8.5.24-beta.0", "", {}, "sha512-b"],',
      '"patched/postcss": ["postcss@8.5.23", "", {}, "sha512-c"],',
    ].join('\n')

    expect(unpatchedVersions(lock, 'postcss')).toEqual(['8.5.23-alpha.1'])
  })
})
