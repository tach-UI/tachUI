/**
 * Regression coverage for #303 — the SF Symbol → Lucide mapping was never
 * consulted on the render path.
 *
 * `Symbol()` is documented to take SF Symbol names (`heart.fill`,
 * `chevron.right`, `person.circle` — the package README uses them throughout),
 * but the raw name went straight to the icon set, which PascalCases it and
 * looks it up in Lucide. Dots are not word separators there, so `chevron.right`
 * became `Chevron.right`, missed `ChevronRight`, and drew the error glyph.
 * Only SF Symbols spelled identically in Lucide — `calendar`, `clock`,
 * `pencil`, `plus` — ever rendered, which is what masked it.
 *
 * These assert at the loader boundary: what name `Symbol` hands to
 * `IconLoader`, and whether the icon set can actually draw it. The package had
 * no coverage of the render path at all, which is how this shipped.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderComponent } from '@tachui/core'
import { Symbol } from '../../src/components/Symbol.js'
import { IconLoader } from '../../src/utils/icon-loader.js'
import { IconSetRegistry } from '../../src/icon-sets/registry.js'
import { LucideIconSet } from '../../src/icon-sets/lucide.js'
import {
  getAllSupportedSFSymbols,
  getLucideForSFSymbol,
  isSFSymbolSupported,
} from '../../src/compatibility/sf-symbols-mapping.js'

/** Render and let the load effect issue its call. */
async function namesPassedToLoader(
  name: string,
  props: Record<string, unknown> = {}
): Promise<string[]> {
  const spy = vi.spyOn(IconLoader, 'loadIcon')
  spy.mockClear()
  const host = document.createElement('div')
  renderComponent(Symbol(name, props) as any, host)
  await new Promise(resolve => setTimeout(resolve, 5))
  const calls = spy.mock.calls.map(call => call[0] as string)
  spy.mockRestore()
  return calls
}

describe('Symbol name resolution (#303)', () => {
  beforeEach(() => {
    IconSetRegistry.clear()
    IconSetRegistry.register(new LucideIconSet())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('SF Symbol names reach the icon set as Lucide names', () => {
    // Every SF Symbol the reporter measured as claimed-supported but rendering
    // the error glyph. All 19 went through as their raw name before the fix.
    const reported: Array<[string, string]> = [
      ['archivebox', 'archive'],
      ['bell.fill', 'bell'],
      ['car.fill', 'car'],
      ['checkmark', 'check'],
      ['chevron.down', 'chevron-down'],
      ['chevron.left', 'chevron-left'],
      ['chevron.right', 'chevron-right'],
      ['chevron.up', 'chevron-up'],
      ['house.fill', 'home'],
      ['magnifyingglass', 'search'],
      ['map.fill', 'map'],
      ['mappin', 'map-pin'],
      ['person', 'user'],
      ['star.fill', 'star'],
      ['xmark', 'x'],
    ]

    test.each(reported)('resolves %s to %s', async (sfName, lucideName) => {
      // Guard against the table drifting under the test.
      expect(getLucideForSFSymbol(sfName)).toBe(lucideName)
      expect(await namesPassedToLoader(sfName)).toContain(lucideName)
    })
  })

  describe('names that are not SF Symbols pass through untouched', () => {
    test('an icon-set-native name is not rewritten', async () => {
      // `chevron-right` is the only spelling that worked before the mapping was
      // wired up, so anyone using the component today is likely passing these.
      expect(getLucideForSFSymbol('chevron-right')).toBeUndefined()
      expect(await namesPassedToLoader('chevron-right')).toEqual(['chevron-right'])
    })

    test('an unmapped name is not rewritten', async () => {
      expect(isSFSymbolSupported('checkmark.circle.fill')).toBe(false)
      expect(await namesPassedToLoader('checkmark.circle.fill')).toEqual([
        'checkmark.circle.fill',
      ])
    })

    test('a name identical in both is unaffected', async () => {
      expect(await namesPassedToLoader('plus')).toEqual(['plus'])
    })
  })

  describe('fallback', () => {
    test('resolves the fallback name too', async () => {
      // The fallback is a symbol name like any other. It was the only reason
      // the component was usable before this fix, so it must keep working —
      // and it has to resolve, or an SF Symbol fallback fails the same way.
      const names = await namesPassedToLoader('definitely.not.a.symbol', {
        fallback: 'car.fill',
      })

      expect(names[0]).toBe('definitely.not.a.symbol')
      expect(names).toContain('car')
    })
  })

  describe('the reported sweep, end to end', () => {
    // The reporter's own methodology: render each symbol and check for the
    // `tachui-symbol--error` class. 23 of their 34 symbols were reported
    // supported; only 4 rendered. The error class is set from the `error`
    // signal, which is only populated when the icon genuinely fails to load,
    // so it is a faithful proxy for "did this resolve to a real icon".
    const render = async (name: string) => {
      const host = document.createElement('div')
      renderComponent(Symbol(name) as any, host)
      await new Promise(resolve => setTimeout(resolve, 10))
      return {
        drewGlyph: !!host.querySelector('svg'),
        error: !!host.firstElementChild?.classList.contains(
          'tachui-symbol--error'
        ),
      }
    }

    // Every symbol the reporter measured as claimed-supported.
    const claimedSupported = [
      'archivebox', 'bell.fill', 'car.fill', 'checkmark', 'chevron.down',
      'chevron.left', 'chevron.right', 'chevron.up', 'house.fill',
      'magnifyingglass', 'map.fill', 'mappin', 'mappin.circle',
      'mappin.circle.fill', 'person', 'person.circle', 'person.circle.fill',
      'star.fill', 'xmark', 'calendar', 'clock', 'pencil', 'plus',
    ]

    test('every symbol reported as supported draws a glyph', async () => {
      const failed: string[] = []
      for (const name of claimedSupported) {
        expect(isSFSymbolSupported(name)).toBe(true)
        const { drewGlyph, error } = await render(name)
        if (!drewGlyph || error) failed.push(name)
      }

      // 19 of these 23 drew the error glyph before the fix.
      expect(failed).toEqual([])
    })

    test('a name with no mapping still reports an error', async () => {
      // The guarantee is that `isSFSymbolSupported` and what renders agree —
      // not that every name renders. An unmapped name must still fail loudly.
      expect(isSFSymbolSupported('totally.bogus.name')).toBe(false)
      expect((await render('totally.bogus.name')).error).toBe(true)
    })

    test('the symbol leaves the loading spinner', async () => {
      // The paint is driven from a microtask as well as from the effect,
      // because an effect created during render() can never paint on its first
      // run — `element` is assigned after render() returns — and the root it
      // lives in is torn down whenever the renderer's effect re-runs. Without
      // that, every symbol stayed on the spinner no matter what it resolved to.
      const host = document.createElement('div')
      renderComponent(Symbol('chevron.right') as any, host)
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(host.firstElementChild?.innerHTML).not.toBe('⟳')
      expect(host.querySelector('svg')).not.toBeNull()
    })
  })

  describe('isSFSymbolSupported agrees with what can be drawn', () => {
    test('every mapped SF Symbol resolves to a loadable icon', async () => {
      // The second half of #303: a name reported as supported must actually
      // render. That holds only if every mapping target exists in the icon set.
      const iconSet = new LucideIconSet()
      const all = getAllSupportedSFSymbols()
      expect(all.length).toBeGreaterThan(100)

      const undrawable: string[] = []
      for (const sfName of all) {
        const lucideName = getLucideForSFSymbol(sfName)
        if (!lucideName) {
          undrawable.push(`${sfName} (no mapping)`)
          continue
        }
        const icon = await iconSet.getIcon(lucideName)
        if (!icon?.svg) undrawable.push(`${sfName} -> ${lucideName}`)
      }

      expect(undrawable).toEqual([])
    })
  })
})
