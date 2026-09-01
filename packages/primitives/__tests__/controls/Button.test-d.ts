/**
 * Button: public type surface (#266)
 *
 * `Button` accepts props as its second argument as well as the older
 * `(title, action, props)` form. Overload sets are easy to break by accident —
 * adding a signature can make a previously-rejected call resolve, and
 * declaration emit can widen or reorder what a consumer actually sees.
 *
 * These assertions resolve against `packages/*​/dist/*.d.ts`, not `src`, so
 * they check what an installed consumer gets. See
 * `tsconfig.typecheck-tests.json`. Run `bun run build` before `bun run
 * test:types` locally; CI builds first.
 *
 * Promoted from throwaway `tsc` scratch files written while #266 was being
 * verified.
 */

import { assertType, describe, expectTypeOf, it } from 'vitest'
import { Button, ButtonStyles } from '@tachui/primitives/controls/Button'

describe('Button call forms', () => {
  it('accepts the title-only form', () => {
    assertType(Button('a'))
  })

  it('accepts the legacy (title, action) and (title, action, props) forms', () => {
    assertType(Button('a', () => {}))
    assertType(Button('a', () => {}, { css: 'x' }))
  })

  it('accepts an explicit undefined action with props', () => {
    // The shape codemods and conditional call sites produce.
    assertType(Button('a', undefined, { css: 'x' }))
  })

  it('accepts the props-second form added by #266', () => {
    assertType(Button('a', { css: 'x', action: () => {} }))
  })

  it('accepts an action whose type is a union with undefined', () => {
    // A variable, not a literal: overload resolution has no contextual type to
    // narrow with, so this only resolves if the action overload admits
    // `undefined` rather than relying on the argument being omitted.
    const maybe: (() => void) | undefined = undefined
    assertType(Button('a', maybe, { css: 'x' }))
  })

  it('accepts a props object passed as a variable', () => {
    // Non-literal, so no excess-property checking and no fresh-object
    // inference. This distinguishes "the overload matches" from "the literal
    // happened to be assignable".
    const props: { css?: string } = { css: 'z' }
    assertType(Button('a', props))
  })

  it('rejects passing both a props object and a third argument', () => {
    // The action overload requires a function second, and the props overload
    // takes no third parameter, so there is no signature for this call. It
    // matters because the runtime would have to silently drop one of them.
    // @ts-expect-error - no overload accepts (string, props, props)
    Button('a', { css: 'x' }, { css: 'y' })
  })

  it('still satisfies the pre-#266 three-argument signature', () => {
    // Back-compat guard: a consumer holding `Button` in a variable of the old
    // shape must keep compiling. Adding an overload can break assignability
    // even when every direct call still resolves.
    type PreChangeButton = (
      title: string,
      action?: () => void,
      props?: { css?: string }
    ) => unknown

    expectTypeOf(Button).toExtend<PreChangeButton>()
  })
})

describe('ButtonStyles call forms', () => {
  it('accepts the same forms as Button', () => {
    assertType(ButtonStyles.Filled('a', () => {}, { css: 'x' }))
    assertType(ButtonStyles.Filled('a', { css: 'x' }))
    assertType(ButtonStyles.Filled('a', undefined, { css: 'y' }))
  })

  it('FOOT-GUN: accepts a props object AND a third argument, then drops one', () => {
    // Unlike `Button`, the `ButtonStyles.*` helpers are single non-overloaded
    // signatures — `(title, actionOrProps?, props?)` — so this call compiles.
    // It should not. At runtime the implementation branches on
    // `typeof actionOrProps === 'function'`; with an object second it takes
    // the else branch and forwards only `actionOrProps`, discarding the third
    // argument entirely.
    //
    // Verified: `ButtonStyles.Filled('a', { css: 'x' }, { disabled: true })`
    // yields props `{ css: 'x', variant: 'filled' }` — `disabled` is gone,
    // silently, with no type error.
    //
    // Pinned as current behaviour, NOT endorsed. Fixing it means giving these
    // helpers the same overload treatment `Button` already has, at which point
    // this assertion should flip to `@ts-expect-error`.
    assertType(ButtonStyles.Filled('a', { css: 'x' }, { disabled: true }))
    assertType(ButtonStyles.Destructive('a', { css: 'x' }, { disabled: true }))
  })
})
