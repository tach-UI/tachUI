/**
 * Tests for the peer versions the connectrpc packed check installs.
 *
 * The floor run is what keeps the declared peer ranges honest, so the case
 * that matters is one where it would install something other than the lowest
 * version a range admits and pass without having tested the floor.
 */

import { describe, expect, it } from 'vitest'

import { checkPeerTree, peerSpecifiers } from '../smoke-connectrpc-packed.mjs'

const PEERS = {
  '@bufbuild/protobuf': '^2.2.0',
  '@connectrpc/connect': '^2.0.0',
}

describe('peerSpecifiers', () => {
  it('pins each peer to the lowest version its range admits', () => {
    expect(peerSpecifiers(PEERS, 'floor')).toEqual({
      '@bufbuild/protobuf': '2.2.0',
      '@connectrpc/connect': '2.0.0',
    })
  })

  it('pins the floor of a range with a lower bound other than a caret', () => {
    expect(peerSpecifiers({ peer: '>=2.3.1 <3' }, 'floor')).toEqual({ peer: '2.3.1' })
  })

  it('leaves the range to the installer for the latest run', () => {
    expect(peerSpecifiers(PEERS, 'latest')).toEqual(PEERS)
  })

  it('refuses a range with no floor rather than guessing one', () => {
    expect(() => peerSpecifiers({ peer: '>=3 <2' }, 'floor')).toThrow(
      'cannot derive a floor for peer@>=3 <2'
    )
  })
})

/** An `npm ls --all --json --long` node for one installed copy. */
function copy(path: string, version: string, dependencies?: Record<string, unknown>) {
  return { version, path, ...(dependencies ? { dependencies } : {}) }
}

const CONNECT = '@connectrpc/connect'
const APP = '/app/node_modules'

describe('checkPeerTree', () => {
  it('passes a single installed copy and returns its version', () => {
    const tree = { dependencies: { [CONNECT]: copy(`${APP}/${CONNECT}`, '2.2.0') } }
    expect(checkPeerTree(tree, CONNECT, '^2.0.0', '^2.0.0', 'latest')).toBe('2.2.0')
  })

  it('counts a deduped reference as the copy it points at', () => {
    const tree = {
      dependencies: {
        '@tachui/connectrpc': copy(`${APP}/@tachui/connectrpc`, '0.1.0', {
          [CONNECT]: copy(`${APP}/${CONNECT}`, '2.0.0'),
        }),
        [CONNECT]: copy(`${APP}/${CONNECT}`, '2.0.0'),
      },
    }
    expect(checkPeerTree(tree, CONNECT, '^2.0.0', '2.0.0', 'floor')).toBe('2.0.0')
  })

  it('rejects two copies of the same version at different paths', () => {
    const tree = {
      dependencies: {
        '@tachui/connectrpc': copy(`${APP}/@tachui/connectrpc`, '0.1.0', {
          [CONNECT]: copy(`${APP}/@tachui/connectrpc/node_modules/${CONNECT}`, '2.2.0'),
        }),
        [CONNECT]: copy(`${APP}/${CONNECT}`, '2.2.0'),
      },
    }
    expect(() => checkPeerTree(tree, CONNECT, '^2.0.0', '^2.0.0', 'latest')).toThrow(
      `expected one installed copy of ${CONNECT}`
    )
  })

  it('rejects a tree with no copy', () => {
    expect(() => checkPeerTree({}, CONNECT, '^2.0.0', '^2.0.0', 'latest')).toThrow(
      `expected one installed copy of ${CONNECT}, found: none`
    )
  })

  it('rejects a single copy outside the declared range', () => {
    const tree = { dependencies: { [CONNECT]: copy(`${APP}/${CONNECT}`, '1.9.0') } }
    expect(() => checkPeerTree(tree, CONNECT, '^2.0.0', '^2.0.0', 'latest')).toThrow(
      `${CONNECT}@1.9.0 is outside ^2.0.0`
    )
  })

  it('rejects a single copy above the floor on a floor run', () => {
    const tree = { dependencies: { [CONNECT]: copy(`${APP}/${CONNECT}`, '2.2.0') } }
    expect(() => checkPeerTree(tree, CONNECT, '^2.0.0', '2.0.0', 'floor')).toThrow(
      `expected ${CONNECT}@2.0.0 at the floor, installed 2.2.0`
    )
  })
})
