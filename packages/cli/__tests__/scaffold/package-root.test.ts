import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { resolvePackageRoot } from '../../src/scaffold/package-root'

describe('resolvePackageRoot', () => {
  it('prefers @tachui/cli package root over similarly-shaped ancestors', async () => {
    const workspace = await mkdtemp(path.join(tmpdir(), 'tachui-package-root-'))
    const decoyRoot = path.join(workspace, 'decoy')
    const cliRoot = path.join(decoyRoot, 'packages', 'cli')
    const distRoot = path.join(cliRoot, 'dist', 'commands')

    await mkdir(path.join(decoyRoot, 'templates'), { recursive: true })
    await writeFile(
      path.join(decoyRoot, 'package.json'),
      JSON.stringify({ name: 'not-the-cli' }),
      'utf8'
    )

    await mkdir(path.join(cliRoot, 'templates'), { recursive: true })
    await writeFile(
      path.join(cliRoot, 'package.json'),
      JSON.stringify({ name: '@tachui/cli' }),
      'utf8'
    )
    await mkdir(distRoot, { recursive: true })
    await writeFile(path.join(distRoot, 'index.js'), '', 'utf8')

    const moduleUrl = pathToFileURL(path.join(distRoot, 'index.js')).href
    expect(resolvePackageRoot(moduleUrl)).toBe(cliRoot)

    await rm(workspace, { recursive: true, force: true })
  })

  it('throws when no valid package root is found', async () => {
    const workspace = await mkdtemp(path.join(tmpdir(), 'tachui-package-root-missing-'))
    const distDir = path.join(workspace, 'dist')
    await mkdir(distDir, { recursive: true })
    await writeFile(path.join(distDir, 'index.js'), '', 'utf8')

    const moduleUrl = pathToFileURL(path.join(distDir, 'index.js')).href
    expect(() => resolvePackageRoot(moduleUrl)).toThrow(
      'Unable to resolve @tachui/cli package root for template loading'
    )

    await rm(workspace, { recursive: true, force: true })
  })
})
