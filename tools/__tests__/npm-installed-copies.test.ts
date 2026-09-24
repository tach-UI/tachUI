/**
 * Tests for the installed-copy count both packed-install checks share.
 *
 * The case that matters is two copies of one version: counting versions sees
 * one, and the application then holds two module instances of the package.
 */

import { describe, expect, it } from 'vitest'

import { collectInstalledPaths } from '../npm-installed-copies.mjs'

describe('collectInstalledPaths', () => {
  it('maps each install path to its version, however deep', () => {
    const tree = {
      dependencies: {
        a: {
          version: '1.0.0',
          path: '/app/node_modules/a',
          dependencies: {
            pkg: { version: '2.0.0', path: '/app/node_modules/a/node_modules/pkg' },
          },
        },
        pkg: { version: '2.0.0', path: '/app/node_modules/pkg' },
      },
    }
    expect(collectInstalledPaths(tree, 'pkg')).toEqual(
      new Map([
        ['/app/node_modules/a/node_modules/pkg', '2.0.0'],
        ['/app/node_modules/pkg', '2.0.0'],
      ])
    )
  })

  it('counts a deduped reference once', () => {
    const tree = {
      dependencies: {
        a: {
          version: '1.0.0',
          path: '/app/node_modules/a',
          dependencies: { pkg: { version: '2.0.0', path: '/app/node_modules/pkg' } },
        },
        pkg: { version: '2.0.0', path: '/app/node_modules/pkg' },
      },
    }
    expect(collectInstalledPaths(tree, 'pkg').size).toBe(1)
  })

  it('ignores nodes without a path, as a tree listed without --long has', () => {
    const tree = { dependencies: { pkg: { version: '2.0.0' } } }
    expect(collectInstalledPaths(tree, 'pkg').size).toBe(0)
  })

  it('tolerates an empty or malformed tree', () => {
    expect(collectInstalledPaths({}, 'pkg').size).toBe(0)
    expect(collectInstalledPaths(null, 'pkg').size).toBe(0)
    expect(collectInstalledPaths({ dependencies: { pkg: null } }, 'pkg').size).toBe(0)
  })
})
