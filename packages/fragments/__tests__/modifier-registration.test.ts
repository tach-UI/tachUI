import { beforeEach, describe, expect, it, vi } from 'vitest'
import { registerModifierWithMetadata } from '@tachui/core/modifiers'
import {
  InteractiveModifier,
  registerFragmentModifiers,
  SnapshotModifier,
} from '../src/modifiers'

vi.mock('@tachui/core/modifiers', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tachui/core/modifiers')>()),
  registerModifierWithMetadata: vi.fn(),
}))

const register = vi.mocked(registerModifierWithMetadata)

describe('fragment modifier registration', () => {
  beforeEach(() => {
    register.mockClear()
  })

  it('registers interactive and snapshot with metadata and derived signatures', () => {
    registerFragmentModifiers()

    expect(register).toHaveBeenCalledTimes(2)
    const [interactiveCall, snapshotCall] = register.mock.calls

    expect(interactiveCall[0]).toBe('interactive')
    expect(interactiveCall[2]).toMatchObject({
      category: 'interaction',
      signature: '(): this',
    })
    expect(interactiveCall[4]).toMatchObject({
      name: '@tachui/fragments',
      verified: true,
    })

    expect(snapshotCall[0]).toBe('snapshot')
    expect(snapshotCall[2]).toMatchObject({
      category: 'interaction',
      signature: '(properties: FragmentSnapshotHandlers): this',
    })
    expect(snapshotCall[4]).toMatchObject({ name: '@tachui/fragments' })
  })

  it('registers factories that build the fragment modifiers', () => {
    registerFragmentModifiers()
    const [interactiveCall, snapshotCall] = register.mock.calls
    const handlers = { get: () => ({}), restore: () => {} }

    expect((interactiveCall[1] as () => unknown)()).toBeInstanceOf(
      InteractiveModifier,
    )
    expect((snapshotCall[1] as (props: unknown) => unknown)(handlers)).toBeInstanceOf(
      SnapshotModifier,
    )
  })
})
