/**
 * Core's list of effect modifier names against the effects registration
 *
 * Core cannot import this package, so it keeps its own list of the modifiers
 * `@tachui/modifiers/preload/effects` registers, to name that import when one
 * is called before it has run. This keeps the list and the registrations the
 * same.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { globalModifierRegistry } from '@tachui/registry'
import { effectModifierNames } from '@tachui/core/modifiers/unregistered'
import { registerEffectModifiers } from '../../src/effects'

describe('effect modifier names in core', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('lists exactly the modifiers the effects preload registers', () => {
    const registered: string[] = []
    vi.spyOn(globalModifierRegistry, 'has').mockReturnValue(false)
    vi.spyOn(globalModifierRegistry, 'register').mockImplementation(name => {
      registered.push(name)
    })

    registerEffectModifiers()

    expect(registered.length).toBeGreaterThan(0)
    expect([...effectModifierNames].sort()).toEqual([...registered].sort())
  })
})
