/**
 * Circle: public type surface
 *
 * These assertions resolve against `packages/*​/dist/*.d.ts`, not `src`, so
 * they check what an installed consumer gets, through the published subpath.
 * See `tsconfig.typecheck-tests.json`. Run `bun run build` before `bun run
 * test:types`.
 *
 * The anti-vacuity assertions matter more than usual here. A shape's public
 * type is an intersection of the component class with the modifier surface,
 * and an intersection can collapse to `never` without anything failing to
 * compile inside the package — only a consumer sees it. A private field whose
 * name collides with a public modifier method is enough to do it. `not.
 * toBeNever` and `not.toBeAny` are what make the rest of this file mean
 * anything.
 */

import { describe, expectTypeOf, it } from 'vitest'
import { Circle } from '@tachui/primitives/shapes'

describe('Circle public type surface', () => {
  it('is a usable instance type, not never or any', () => {
    expectTypeOf(Circle()).not.toBeNever()
    expectTypeOf(Circle()).not.toBeAny()
  })

  it('exposes the shape methods', () => {
    expectTypeOf(Circle().fill).not.toBeNever()
    expectTypeOf(Circle().stroke).not.toBeNever()
    expectTypeOf(Circle().strokeBorder).not.toBeNever()
    expectTypeOf(Circle().inset).not.toBeNever()
    expectTypeOf(Circle().trim).not.toBeNever()
    expectTypeOf(Circle().strokeStyle).not.toBeNever()
    expectTypeOf(Circle().clipPath).not.toBeNever()
  })

  it('takes a trim and a stroke style through the chain', () => {
    expectTypeOf(Circle().trim(0, 0.75).stroke('red', 4)).not.toBeNever()
    expectTypeOf(
      Circle().strokeStyle({ lineWidth: 4, lineCap: 'round' }).stroke('red')
    ).not.toBeNever()
    expectTypeOf(
      Circle().strokeStyle({ dash: [6, 3], dashPhase: 2 })
    ).not.toBeNever()
  })

  it('chains shape methods and modifiers in both orders', () => {
    expectTypeOf(Circle().fill('red')).not.toBeNever()
    expectTypeOf(Circle().inset(1).stroke('red', 2)).not.toBeNever()
    expectTypeOf(Circle().frame({ width: 40, height: 40 })).not.toBeNever()
  })

  it('returns a string from clipPath', () => {
    expectTypeOf(Circle().clipPath()).toBeString()
  })
})
