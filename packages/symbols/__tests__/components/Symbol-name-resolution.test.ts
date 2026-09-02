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

const tick = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Render and report the names the icon set was asked for.
 *
 * Waits for the calls to stop arriving rather than for a fixed window. Name
 * resolution has to ask Lucide what it holds before it can decide whether to
 * map a name, so the icon-set call now lands on the far side of a dynamic
 * import — a fixed 5ms race was enough until it wasn't, and failed only under
 * full-suite contention.
 */
async function namesReachingIconSet(
  name: string,
  props: Record<string, unknown> = {}
): Promise<string[]> {
  const spy = vi.spyOn(LucideIconSet.prototype, 'getIcon')
  spy.mockClear()
  const host = document.createElement('div')
  renderComponent(Symbol(name, props) as any, host)

  const deadline = Date.now() + 500
  let settled = 0
  let quietFor = 0
  while (Date.now() < deadline && quietFor < 25) {
    await tick(5)
    if (spy.mock.calls.length === settled) {
      quietFor += 5
    } else {
      settled = spy.mock.calls.length
      quietFor = 0
    }
  }

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

  /**
   * Seven SF keys are also real Lucide icons of the same name. Mapping them
   * unconditionally sent `Symbol('trash')` to `trash-2` — a different glyph from
   * the one the caller named, and a regression against the behaviour before the
   * table was consulted at all, when the raw name went straight through.
   *
   * The name as written now wins whenever Lucide has an icon of that name. The
   * check is exact membership rather than a spelling heuristic: dot-free is not
   * a usable signal, as the second test here shows.
   */
  describe('a name Lucide has of its own is not remapped', () => {
    const collisions: [sfName: string, mappedTo: string][] = [
      ['trash', 'trash-2'],
      ['house', 'home'],
      ['bolt', 'zap'],
      ['cross', 'plus'],
      ['ellipsis', 'more-horizontal'],
      ['forward', 'skip-forward'],
      ['speaker', 'volume-2'],
    ]

    test.each(collisions)(
      '%s reaches the icon set as itself, not %s',
      async (sfName, mappedTo) => {
        // The mapping entry exists and is what the old behaviour used.
        expect(getLucideForSFSymbol(sfName)).toBe(mappedTo)

        expect(await namesReachingIconSet(sfName)).toEqual([sfName])
      }
    )

    test('a dot-free SF name Lucide does not have is still mapped', async () => {
      // Why the check cannot key on spelling: these are dot-free too, and they
      // genuinely need the table.
      expect(await namesReachingIconSet('checkmark')).toEqual(['check'])
      expect(await namesReachingIconSet('magnifyingglass')).toEqual(['search'])
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
    test('a preload under an SF name serves a render of that name', async () => {
      await IconLoader.preloadIcons(['heart.fill'])

      // The cache keys on the name the caller asked for, so a preload and a
      // render of the same spelling share an entry and the icon set is never
      // asked twice.
      expect(IconLoader.isIconCached('heart.fill')).toBe(true)
      expect(await namesReachingIconSet('heart.fill')).toEqual([])
    })

    /**
     * Two spellings deliberately do *not* collapse into one entry any more.
     * They cannot: `trash` is a Lucide icon in its own right and an SF key that
     * maps to `trash-2`, so a shared entry would serve one caller the other's
     * glyph. Keying on the requested name is what keeps those distinct — and it
     * is also the only key available synchronously, since resolution now has to
     * ask Lucide what it holds.
     */
    test('a spelling that means a different icon keeps its own entry', async () => {
      await IconLoader.preloadIcons(['trash'])

      expect(IconLoader.isIconCached('trash')).toBe(true)
      expect(IconLoader.isIconCached('trash-2')).toBe(false)
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
      // The loader effect runs eagerly here, before any render.
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
      // Classes and styles go over as memos, so the renderer subscribes to them
      // rather than this component's `render()` reading them.
      expect(wrapper.props.className()).toContain('tachui-symbol')
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
