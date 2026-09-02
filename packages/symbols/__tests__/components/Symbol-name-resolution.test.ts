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
 * These assert at the icon set boundary: what name a render ultimately asks
 * the icon set for, and whether the icon set can actually draw it. That is the
 * guarantee regardless of which layer performs the mapping — resolution lives
 * in `IconLoader`, so that every entry point keys on the same name. The package
 * had no coverage of the render path at all, which is how this shipped.
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

/** Render and report the names the icon set was asked for. */
async function namesReachingIconSet(
  name: string,
  props: Record<string, unknown> = {}
): Promise<string[]> {
  const spy = vi.spyOn(LucideIconSet.prototype, 'getIcon')
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
    // The loader caches by resolved name, and a cache hit never reaches the
    // icon set — which is what these spy on.
    IconLoader.clearCache()
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
      expect(await namesReachingIconSet(sfName)).toContain(lucideName)
    })
  })

  describe('names that are not SF Symbols pass through untouched', () => {
    test('an icon-set-native name is not rewritten', async () => {
      // `chevron-right` is the only spelling that worked before the mapping was
      // wired up, so anyone using the component today is likely passing these.
      expect(getLucideForSFSymbol('chevron-right')).toBeUndefined()
      expect(await namesReachingIconSet('chevron-right')).toEqual(['chevron-right'])
    })

    test('an unmapped name is not rewritten', async () => {
      expect(isSFSymbolSupported('checkmark.circle.fill')).toBe(false)
      expect(await namesReachingIconSet('checkmark.circle.fill')).toEqual([
        'checkmark.circle.fill',
      ])
    })

    test('a name identical in both is unaffected', async () => {
      expect(await namesReachingIconSet('plus')).toEqual(['plus'])
    })
  })

  describe('fallback', () => {
    test('resolves the fallback name too', async () => {
      // The fallback is a symbol name like any other. It was the only reason
      // the component was usable before this fix, so it must keep working —
      // and it has to resolve, or an SF Symbol fallback fails the same way.
      const names = await namesReachingIconSet('definitely.not.a.symbol', {
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
      // The icon is built during render() and handed to the renderer as an
      // owned node, rather than patched in from an effect afterwards. An effect
      // created during render() cannot paint on its first run — `element` is
      // assigned after render() returns — and `updateChildren` overwrote
      // whatever it managed to write later, so every symbol stayed on the
      // spinner no matter what it resolved to (#303).
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

  /**
   * `IconLoader` is exported from the package root and the compatibility guide
   * documents preloading with SF Symbol spellings. Resolving in `Symbol()`
   * alone left every entry point keyed differently, so a documented preload
   * warmed a key the render never asked for.
   */
  describe('every IconLoader entry point keys on the same name', () => {
    test('a preload under an SF name serves the render, and vice versa', async () => {
      await IconLoader.preloadIcons(['heart.fill'])

      // Both spellings name one cache entry, not two.
      expect(IconLoader.isIconCached('heart.fill')).toBe(true)
      expect(IconLoader.isIconCached('heart')).toBe(true)
      expect(IconLoader.getCachedIcon('heart.fill')).toBe(
        IconLoader.getCachedIcon('heart')
      )

      // The preload actually serves the render: the icon set is never asked.
      expect(await namesReachingIconSet('heart.fill')).toEqual([])
    })

    test('the preload loads the resolved name, not the SF spelling', async () => {
      const spy = vi.spyOn(LucideIconSet.prototype, 'getIcon')
      await IconLoader.preloadIcons(['bell.fill'])

      // `bell.fill` is not a name any icon set has; asking for it would be a
      // guaranteed miss plus a wasted load.
      expect(spy.mock.calls.map(call => call[0])).toEqual(['bell'])
      spy.mockRestore()
    })
  })

  /**
   * `@tachui/ssr` calls `render()` in Node, where there is no DOM to build the
   * icon into. Building it during `render()` — rather than patching it in from
   * an effect, as this did before — made that a throw instead of an empty
   * wrapper. The icon is drawn when the component hydrates.
   */
  describe('rendering without a DOM', () => {
    // A real Node process has neither of these. Removing only `document` and
    // leaving jsdom's `Element` in place is what let a `wrapper instanceof
    // Element` guard past this suite while throwing a ReferenceError under
    // @tachui/ssr.
    const DOM_GLOBALS = ['document', 'Element'] as const

    function withoutDom<T>(body: () => T): T {
      const saved = DOM_GLOBALS.map(key => [
        key,
        Object.getOwnPropertyDescriptor(globalThis, key),
      ] as const)

      for (const key of DOM_GLOBALS) {
        // @ts-expect-error - removing a global for the duration of the call
        delete globalThis[key]
      }

      try {
        return body()
      } finally {
        for (const [key, descriptor] of saved) {
          if (descriptor) Object.defineProperty(globalThis, key, descriptor)
        }
      }
    }

    test('constructing a Symbol does not reference a DOM global', () => {
      // The repaint effect runs eagerly here, before any render.
      expect(() => withoutDom(() => Symbol('heart.fill'))).not.toThrow()
    })

    test('render() does not require a document', () => {
      const node = withoutDom(() => (Symbol('heart.fill') as any).render())

      const wrapper = Array.isArray(node) ? node[0] : node
      expect(wrapper.tag).toBe('span')
      // No owned child: an owned node describes its subtree through its
      // element, so emitting one without an element would serialize as an
      // empty tag rather than nothing.
      expect(wrapper.children).toEqual([])
    })

    test('the wrapper still carries its classes and accessibility props', () => {
      const node = withoutDom(() => (Symbol('heart.fill') as any).render())

      const wrapper = Array.isArray(node) ? node[0] : node
      expect(wrapper.props.className).toContain('tachui-symbol')
      expect(wrapper.props['aria-hidden'] ?? wrapper.props.role).toBeDefined()
    })
  })

  /**
   * The mapping table maps SF Symbol names onto *Lucide's* names. Applying it
   * to any other backend makes that backend's own icons unreachable: a custom
   * set holding an icon literally named `heart.fill` would only ever be asked
   * for `heart`. The registry documents alternate and custom sets.
   */
  describe('the mapping table applies only to the Lucide backend', () => {
    class CustomIconSet {
      name = 'custom'
      version = '1.0.0'
      icons = {}
      asked: string[] = []

      async getIcon(name: string) {
        this.asked.push(name)
        return {
          name,
          variant: 'none' as const,
          weight: 'regular' as const,
          svg: '<path d="M0 0"/>',
          viewBox: '0 0 24 24',
        }
      }

      hasIcon() { return true }
      listIcons() { return [] }
      getIconMetadata() { return undefined }
      supportsVariant() { return true }
      supportsWeight() { return true }
    }

    test('a named custom set is asked for the name as written', async () => {
      const custom = new CustomIconSet()
      IconSetRegistry.register(custom as any)

      await IconLoader.loadIcon('heart.fill', 'none', 'custom')

      // Not `heart` — that icon may not exist in this set at all.
      expect(custom.asked).toEqual(['heart.fill'])
    })

    test('a custom set installed as the default is too', async () => {
      const custom = new CustomIconSet()
      IconSetRegistry.register(custom as any)
      IconSetRegistry.setDefault('custom')

      await IconLoader.loadIcon('heart.fill')

      expect(custom.asked).toEqual(['heart.fill'])
    })

    test('Lucide still resolves once the default moves back', async () => {
      const custom = new CustomIconSet()
      IconSetRegistry.register(custom as any)
      IconSetRegistry.setDefault('custom')
      IconSetRegistry.setDefault('lucide')

      const spy = vi.spyOn(LucideIconSet.prototype, 'getIcon')
      await IconLoader.loadIcon('heart.fill')

      expect(spy.mock.calls.map(call => call[0])).toEqual(['heart'])
      expect(custom.asked).toEqual([])
      spy.mockRestore()
    })
  })
})
