/**
 * Modifier subscription counts under repetition.
 *
 * Split out of `modifier-lifecycle.test.ts` so the memory tier's globs reach
 * them. They were the only two cases in that file gated on
 * `FORCE_MEMORY_TESTS`, and the tier had to name that file by path to find
 * them — a path nothing would notice going stale, which is the rot the tier was
 * repaired to end. A directory the globs already match needs no such list.
 *
 * The gate stays: these mount a hundred components and drive a thousand
 * updates, which is the memory tier's business rather than every run's.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { ModifierRegistry } from '@tachui/registry'

import { createSignal, flushSync } from '../../../src/reactive'
import { getSubscriberCount } from '../../../tools/testing/reactive-test-helpers'
import {
  createLifecycleRegistry,
  mountWithModifiers,
  unmountAll,
  unmountMountedNode,
} from '../support/modifier-lifecycle-harness'

const memoryIt = process.env.FORCE_MEMORY_TESTS === 'true' ? it : it.skip

describe('modifier subscriptions under repetition', () => {
  let registry: ModifierRegistry

  beforeEach(() => {
    registry = createLifecycleRegistry()
  })

  afterEach(() => {
    unmountAll()
  })

  memoryIt('100 components created then removed return to baseline subscriptions', () => {
    const [color] = createSignal('#123456')
    const baseline = getSubscriberCount(color)
    const mounts = Array.from({ length: 100 }, () =>
      mountWithModifiers(registry, document.createElement('div'), [
        { name: 'foregroundColor', args: [color] },
      ])
    )

    expect(getSubscriberCount(color)).toBe(baseline + 100)

    mounts.forEach(mounted => {
      unmountMountedNode(mounted)
    })

    expect(getSubscriberCount(color)).toBe(baseline)
  })

  memoryIt('1000 updates on removed component keep subscription count at baseline', () => {
    const [size, setSize] = createSignal(10)
    const baseline = getSubscriberCount(size)
    const mounted = mountWithModifiers(registry, document.createElement('div'), [
      { name: 'fontSize', args: [size] },
    ])

    unmountMountedNode(mounted)

    for (let i = 0; i < 1000; i += 1) {
      setSize(10 + i)
    }
    flushSync()

    expect(getSubscriberCount(size)).toBe(baseline)
  })
})
