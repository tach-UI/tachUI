import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  isValidSemverLike,
  readCliVersion,
  resolveDefaultTachuiVersion,
} from '../../src/commands/init'

describe('init version resolution helpers', () => {
  it('accepts prerelease and build metadata versions', () => {
    expect(isValidSemverLike('1.0.0-beta.1+build.42')).toBe(true)
    expect(isValidSemverLike('0.8.8-alpha')).toBe(true)
    expect(isValidSemverLike('latest')).toBe(false)
    expect(isValidSemverLike('not-a-version')).toBe(false)
  })

  it('reads CLI version from package.json when available', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'tachui-cli-version-'))
    await writeFile(
      path.join(root, 'package.json'),
      JSON.stringify({ name: '@tachui/cli', version: '0.8.8-alpha' }),
      'utf8'
    )

    expect(readCliVersion(root)).toBe('0.8.8-alpha')
    await rm(root, { recursive: true, force: true })
  })

  it('returns null for missing or malformed package.json', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'tachui-cli-version-missing-'))
    expect(readCliVersion(root)).toBeNull()

    await mkdir(path.join(root, 'malformed'), { recursive: true })
    await writeFile(path.join(root, 'malformed/package.json'), '{bad-json', 'utf8')
    expect(readCliVersion(path.join(root, 'malformed'))).toBeNull()

    await rm(root, { recursive: true, force: true })
  })

  it('prefers registry default and falls back to compatibility map', async () => {
    const registryResolved = await resolveDefaultTachuiVersion('0.8.8-alpha', async () => '0.9.1')
    expect(registryResolved).toEqual({ version: '0.9.1', source: 'registry' })

    const mapResolved = await resolveDefaultTachuiVersion('0.8.8-alpha', async () => null)
    expect(mapResolved).toEqual({ version: '0.8.8-alpha', source: 'compatibility-map' })
  })

  it('throws when neither registry nor map can resolve a version', async () => {
    await expect(resolveDefaultTachuiVersion('9.9.9-alpha', async () => null)).rejects.toThrow(
      'Unable to determine a default @tachui/core version'
    )
  })
})
