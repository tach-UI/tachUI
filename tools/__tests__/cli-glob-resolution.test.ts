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

// Every package key in the closure of a workspace's runtime glob.
function globClosureKeys(resolutions: Map<string, string>, workspace: string): string[] {
  const nestedPrefix = `${workspace}/glob`
  return [...resolutions.keys()].filter(
    key => key === nestedPrefix || key.startsWith(`${nestedPrefix}/`)
  )
}

describe('@tachui/cli glob resolution', () => {
  const resolutions = lockedResolutions(lockText)

  it('declares glob on the ^13 caret range', () => {
    expect(cliManifest.dependencies.glob).toBe('^13.0.0')
  })

  it('resolves the CLI runtime glob to 13.x', () => {
    const resolution = workspaceResolution(resolutions, '@tachui/cli', 'glob')

    expect(resolution).toBeDefined()
    expect(majorOf(resolution as string)).toBe(13)
  })

  it('leaves no glob@10 in the CLI glob closure', () => {
    const closure = globClosureKeys(resolutions, '@tachui/cli').map(key =>
      resolutions.get(key)
    )

    expect(closure.length).toBeGreaterThan(0)
    expect(closure.filter(resolution => resolution?.startsWith('glob@10.'))).toEqual([])
  })

  it('reaches brace-expansion only on a 5.x release through the CLI glob chain', () => {
    const braceExpansion = globClosureKeys(resolutions, '@tachui/cli')
      .filter(key => key.endsWith('/brace-expansion'))
      .map(key => resolutions.get(key) as string)

    expect(braceExpansion.length).toBeGreaterThan(0)
    for (const resolution of braceExpansion) {
      expect(majorOf(resolution), resolution).toBe(5)
    }
  })

  it('reads a workspace-nested resolution before the hoisted one', () => {
    const resolutions = lockedResolutions(
      [
        '    "glob": ["glob@10.5.0", "", {}, "sha512-a"],',
        '    "@tachui/cli/glob": ["glob@13.0.6", "", {}, "sha512-b"],',
        '    "@tachui/cli/glob/minimatch": ["minimatch@10.2.6", "", {}, "sha512-c"],',
      ].join('\n')
    )

    expect(workspaceResolution(resolutions, '@tachui/cli', 'glob')).toBe('glob@13.0.6')
    expect(workspaceResolution(resolutions, '@tachui/core', 'glob')).toBe('glob@10.5.0')
    expect(globClosureKeys(resolutions, '@tachui/cli')).toEqual([
      '@tachui/cli/glob',
      '@tachui/cli/glob/minimatch',
    ])
  })
})
