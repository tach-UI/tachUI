import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { intersects, minVersion } from 'semver'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

interface PinnedRange {
  source: string
  range: string
}

interface Manifest {
  name?: string
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

/** Every starter template's TypeScript range, from its scaffolded manifest. */
function templateRanges(): PinnedRange[] {
  const dir = join(ROOT, 'packages/cli/templates')
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const manifest = JSON.parse(
        readFileSync(join(dir, entry.name, 'package.json.template'), 'utf8')
      ) as Manifest
      return {
        source: `template ${entry.name}`,
        range: manifest.devDependencies?.typescript as string | undefined,
      }
    })
}

/** Every starter template's Vite range, from its scaffolded manifest. */
function templateViteRanges(): { source: string; range: string | undefined }[] {
  const dir = join(ROOT, 'packages/cli/templates')
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const manifest = JSON.parse(
        readFileSync(join(dir, entry.name, 'package.json.template'), 'utf8')
      ) as Manifest
      return {
        source: `template ${entry.name}`,
        range: manifest.devDependencies?.vite,
      }
    })
}

/** The workspace toolchain's Vite range, from the root manifest. */
function workspaceViteRange(): string {
  const manifest = JSON.parse(
    readFileSync(join(ROOT, 'package.json'), 'utf8')
  ) as Manifest
  const range = manifest.devDependencies?.vite
  if (typeof range !== 'string') {
    throw new Error('root package.json pins no devDependencies.vite')
  }
  return range
}

/** Every published TypeScript peer range in the workspace. */
function peerRanges(): PinnedRange[] {
  const dir = join(ROOT, 'packages')
  const out: PinnedRange[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    let manifest: Manifest
    try {
      manifest = JSON.parse(
        readFileSync(join(dir, entry.name, 'package.json'), 'utf8')
      ) as Manifest
    } catch {
      continue
    }
    const range = manifest.peerDependencies?.typescript
    if (typeof range === 'string') {
      out.push({ source: manifest.name ?? entry.name, range })
    }
  }
  return out
}

describe('starter template TypeScript range', () => {
  it('is pinned by every template', () => {
    const templates = templateRanges()
    expect(templates.length).toBeGreaterThan(0)
    for (const template of templates) {
      expect(
        typeof template.range,
        `${template.source} pins devDependencies.typescript`
      ).toBe('string')
    }
  })

  it('is collected from every publishing package peer', () => {
    // Guards a vacuous pass if the peer declarations move.
    expect(peerRanges().length).toBeGreaterThan(0)
  })

  it('intersects every published typescript peer range', () => {
    // A fresh `tachui init` app installs its template TypeScript next to the
    // published peer floor. Disjoint ranges fail resolution (npm ERESOLVE),
    // which is what blocked the 0.12.0 publish in the release smoke test.
    const failures: string[] = []
    for (const template of templateRanges()) {
      for (const peer of peerRanges()) {
        if (!intersects(template.range, peer.range)) {
          failures.push(
            `${template.source} (${template.range}) vs ${peer.source} (${peer.range})`
          )
        }
      }
    }
    expect(failures).toEqual([])
  })
})

describe('starter template Vite range', () => {
  it('tracks the workspace toolchain major', () => {
    // The smoke test builds the scaffolded app, so the template toolchain
    // stays on the major the workspace verifies. Deliberate divergence
    // updates this test.
    const workspace = workspaceViteRange()
    const failures: string[] = []
    for (const template of templateViteRanges()) {
      if (typeof template.range !== 'string') {
        failures.push(`${template.source} pins no devDependencies.vite`)
        continue
      }
      if (minVersion(template.range)?.major !== minVersion(workspace)?.major) {
        failures.push(
          `${template.source} (${template.range}) vs workspace (${workspace})`
        )
      }
    }
    expect(failures).toEqual([])
  })
})
