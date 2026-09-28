/**
 * Both base entries re-export core's classes
 *
 * `src/base.ts` (published as `@tachui/modifiers/base`) and `src/basic/base.ts`
 * (re-exported from the package root) used to hold their own copies of
 * `BaseModifier`, `AnimationModifier`, `LifecycleModifier`, `LayoutModifier`
 * and `AppearanceModifier`. They now hold no class logic at all: the first four
 * come from `@tachui/core/modifiers/base`; `AppearanceModifier` is one subclass
 * of core's that adds the shadow and clip branches; and the interaction class,
 * which still differs from core's, sits in its own file per entry.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import * as core from '@tachui/core/modifiers/base'
import * as subpath from '../src/base'
import * as basic from '../src/basic/base'
import * as root from '../src/index'
import { AppearanceModifier } from '../src/appearance-modifier'
import { TransitionModifier, transition } from '../src/basic/animation'

const entries = [
  ['@tachui/modifiers/base', subpath],
  ['basic/base', basic],
  ['@tachui/modifiers', root],
] as const

describe.each(entries)('%s', (_name, entry) => {
  it('exports core BaseModifier, AnimationModifier, LifecycleModifier and LayoutModifier', () => {
    expect(entry.BaseModifier).toBe(core.BaseModifier)
    expect(entry.AnimationModifier).toBe(core.AnimationModifier)
    expect(entry.LifecycleModifier).toBe(core.LifecycleModifier)
    expect(entry.LayoutModifier).toBe(core.LayoutModifier)
  })

  it('exports the one AppearanceModifier, a subclass of core', () => {
    expect(entry.AppearanceModifier).toBe(AppearanceModifier)
    expect(entry.AppearanceModifier).not.toBe(core.AppearanceModifier)
    expect(new entry.AppearanceModifier({})).toBeInstanceOf(
      core.AppearanceModifier
    )
  })

  it('builds interaction on core BaseModifier', () => {
    expect(new entry.InteractionModifier({})).toBeInstanceOf(core.BaseModifier)
  })
})

describe('base entry files', () => {
  it.each(['../src/base.ts', '../src/basic/base.ts'])(
    '%s holds re-exports only',
    file => {
      const source = readFileSync(resolve(__dirname, file), 'utf8')
      const code = source.replace(/\/\*[\s\S]*?\*\//g, '').trim()

      expect(code).not.toMatch(/\bclass\b|\bfunction\b|\bconst\b|\blet\b/)
      for (const statement of code.split(/\n(?=export)/)) {
        expect(statement).toMatch(/^export \{[^}]*\} from '[^']+'$/)
      }
    }
  )
})

describe('TransitionModifier', () => {
  it('extends core AnimationModifier with the transition type', () => {
    const modifier = transition('opacity', 200)

    expect(modifier).toBeInstanceOf(TransitionModifier)
    expect(modifier).toBeInstanceOf(core.AnimationModifier)
    expect(modifier.type).toBe('transition')
  })

  it('applies its transition through core', () => {
    const element = document.createElement('div')
    transition({ property: 'opacity', duration: 150, easing: 'ease-in' }).apply(
      {} as any,
      { componentId: 'test', element, phase: 'creation' }
    )

    expect(element.style.transition).toBe('opacity 150ms ease-in 0ms')
  })
})
