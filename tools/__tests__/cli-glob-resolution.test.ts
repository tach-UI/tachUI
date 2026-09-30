import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repoRoot = resolve(__dirname, '../..')
const lockText = readFileSync(resolve(repoRoot, 'bun.lock'), 'utf8')
const cliManifest = JSON.parse(
  readFileSync(resolve(repoRoot, 'packages/cli/package.json'), 'utf8')
)

// Maps each bun.lock package key ("glob", "@tachui/cli/glob", ...) to the
// "name@version" it resolves to.
function lockedResolutions(lock: string): Map<string, string> {
  const resolutions = new Map<string, string>()
  for (const match of lock.matchAll(/^\s{4}"([^"]+)": \["([^"]+)"/gm)) {
    resolutions.set(match[1], match[2])
  }
  return resolutions
}

function majorOf(resolution: string): number {
  return Number.parseInt(resolution.slice(resolution.lastIndexOf('@') + 1), 10)
}

// bun resolves a workspace dependency to its nested "<workspace>/<dep>" entry
// when one exists, and to the hoisted "<dep>" entry otherwise.
function workspaceResolution(
  resolutions: Map<string, string>,
  workspace: string,
  dependency: string
): string | undefined {
  return resolutions.get(`${workspace}/${dependency}`) ?? resolutions.get(dependency)
}

// Maps each bun.lock package key to the names of its runtime dependencies.
function lockedDependencies(lock: string): Map<string, string[]> {
  const dependencies = new Map<string, string[]>()
  for (const match of lock.matchAll(/^\s{4}"([^"]+)": (\[.*\]),?$/gm)) {
    const meta = JSON.parse(match[2])[2] ?? {}
    dependencies.set(match[1], [
      ...Object.keys(meta.dependencies ?? {}),
      ...Object.keys(meta.optionalDependencies ?? {}),
    ])
  }
  return dependencies
}

// Every package key in the closure of a workspace's runtime glob. Walks each
// entry's declared dependencies the way the runtime resolves them: the nearest
// nested "<parent>/<dep>" key first, falling back outward to the hoisted
// "<dep>" key, so hoisted transitive dependencies are included too.
function globClosureKeys(lock: string, workspace: string): string[] {
  const resolutions = lockedResolutions(lock)
  const dependencies = lockedDependencies(lock)
  const closure = new Set<string>()
  const pending: string[][] = [[workspace, 'glob']]

  while (pending.length > 0) {
    const packagePath = pending.pop() as string[]
    const key = packagePath.join('/')
    if (closure.has(key) || !resolutions.has(key)) continue
    closure.add(key)

    for (const dependency of dependencies.get(key) ?? []) {
      for (let depth = packagePath.length; depth >= 0; depth--) {
        const candidate = [...packagePath.slice(0, depth), dependency]
        if (resolutions.has(candidate.join('/'))) {
          pending.push(candidate)
          break
        }
      }
    }
  }

  return [...closure].sort()
}

describe('@tachui/cli glob resolution', () => {
  const resolutions = lockedResolutions(lockText)

  it('declares glob on the ^13 caret range', () => {
    expect(cliManifest.dependencies.glob).toBe('^13.0.0')
  })

  it('advertises only the Node lines glob 13 supports (20 and 22+, not 21)', () => {
    expect(cliManifest.engines.node).toBe('^20.0.0 || >=22.0.0')
  })

  it('resolves the CLI runtime glob to 13.x', () => {
    const resolution = workspaceResolution(resolutions, '@tachui/cli', 'glob')

    expect(resolution).toBeDefined()
    expect(majorOf(resolution as string)).toBe(13)
  })

  it('leaves no glob@10 in the CLI glob closure', () => {
    const closure = globClosureKeys(lockText, '@tachui/cli').map(key =>
      resolutions.get(key)
    )

    expect(closure.length).toBeGreaterThan(0)
    expect(closure.filter(resolution => resolution?.startsWith('glob@10.'))).toEqual([])
  })

  it('reaches brace-expansion only on a 5.x release through the CLI glob chain', () => {
    const braceExpansion = globClosureKeys(lockText, '@tachui/cli')
      .map(key => resolutions.get(key) as string)
      .filter(resolution => resolution.startsWith('brace-expansion@'))

    expect(braceExpansion.length).toBeGreaterThan(0)
    for (const resolution of braceExpansion) {
      expect(majorOf(resolution), resolution).toBe(5)
    }
  })

  it('includes the hoisted minipass serving the CLI glob in the closure', () => {
    const closure = globClosureKeys(lockText, '@tachui/cli')

    expect(closure).toContain('minipass')
    expect(majorOf(resolutions.get('minipass') as string)).toBe(7)
  })

  it('reads a workspace-nested resolution before the hoisted one', () => {
    const lock = [
      '    "glob": ["glob@10.5.0", "", { "dependencies": { "minimatch": "^9.0.4", "jackspeak": "^3.1.2" } }, "sha512-a"],',
      '    "jackspeak": ["jackspeak@3.4.3", "", {}, "sha512-j"],',
      '    "minimatch": ["minimatch@9.0.5", "", {}, "sha512-m"],',
      '    "minipass": ["minipass@7.1.3", "", {}, "sha512-p"],',
      '    "@tachui/cli/glob": ["glob@13.0.6", "", { "dependencies": { "minimatch": "^10.2.2", "minipass": "^7.1.3" } }, "sha512-b"],',
      '    "@tachui/cli/glob/minimatch": ["minimatch@10.2.6", "", { "dependencies": { "brace-expansion": "^5.0.8" } }, "sha512-c"],',
      '    "@tachui/cli/glob/minimatch/brace-expansion": ["brace-expansion@5.0.12", "", {}, "sha512-d"],',
    ].join('\n')
    const resolutions = lockedResolutions(lock)

    expect(workspaceResolution(resolutions, '@tachui/cli', 'glob')).toBe('glob@13.0.6')
    expect(workspaceResolution(resolutions, '@tachui/core', 'glob')).toBe('glob@10.5.0')
    expect(globClosureKeys(lock, '@tachui/cli')).toEqual([
      '@tachui/cli/glob',
      '@tachui/cli/glob/minimatch',
      '@tachui/cli/glob/minimatch/brace-expansion',
      'minipass',
    ])
  })
})
