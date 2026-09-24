/**
 * Tests for the peer versions the connectrpc packed check installs.
 *
 * The floor run is what keeps the declared peer ranges honest, so the case
 * that matters is one where it would install something other than the lowest
 * version a range admits and pass without having tested the floor.
 */

import { describe, expect, it } from 'vitest'

import { peerSpecifiers } from '../smoke-connectrpc-packed.mjs'

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
