/**
 * Tests for the theme <-> DOM bridge (#304)
 *
 * Theme state used to live only in a signal: `setTheme()` wrote no attribute and
 * nothing read one, so `ColorAsset` theming and stylesheet theming were two
 * systems that could not stay in sync. These cover both directions and the
 * precedence between them.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ColorAsset } from '../../src/assets/ColorAsset'
import { createEffect, createRoot } from '../../src/reactive'
import {
  detectSystemTheme,
  getCurrentTheme,
  getThemePreference,
  getThemeSignal,
  setTheme,
  startObservingThemeAttribute,
  stopObservingThemeAttribute,
  THEME_ATTRIBUTE,
} from '../../src/reactive/theme'

/** Let the MutationObserver deliver; it is a microtask, not a task. */
const flushMutations = () => new Promise<void>(resolve => setTimeout(resolve, 0))

function setSystemPrefersDark(prefersDark: boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('prefers-color-scheme: dark') && prefersDark,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
}

describe('theme DOM bridge', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute(THEME_ATTRIBUTE)
    setTheme('light')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.documentElement.removeAttribute(THEME_ATTRIBUTE)
    setTheme('light')
  })

  describe('reflect: setTheme writes the DOM', () => {
    it('writes the theme to the documented attribute', () => {
      setTheme('dark')

      expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe('dark')

      setTheme('light')
      expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe(
        'light'
      )
    })

    it('names the attribute data-theme', () => {
      // Pinned deliberately: the whole value of the bridge is that a stylesheet
      // written against the common convention keys off it unmodified.
      expect(THEME_ATTRIBUTE).toBe('data-theme')
    })

    it('removes the attribute for system rather than writing "system"', () => {
      setTheme('dark')
      setTheme('system')

      // An attribute of `system` matches no rule any stylesheet writes, and
      // would suppress the `prefers-color-scheme` media query that is supposed
      // to take over.
      expect(document.documentElement.hasAttribute(THEME_ATTRIBUTE)).toBe(false)
    })

    it('flips a stylesheet keyed off the attribute', () => {
      const style = document.createElement('style')
      style.textContent = `
        :root { --token: rgb(1, 1, 1); }
        :root[data-theme="dark"] { --token: rgb(2, 2, 2); }
      `
      document.head.appendChild(style)

      try {
        const read = () =>
          getComputedStyle(document.documentElement)
            .getPropertyValue('--token')
            .trim()

        setTheme('light')
        expect(read()).toBe('rgb(1, 1, 1)')

        setTheme('dark')
        expect(read()).toBe('rgb(2, 2, 2)')
      } finally {
        style.remove()
      }
    })
  })

  describe('observe: the DOM drives the theme', () => {
    it('honours an attribute already present at read time', async () => {
      document.documentElement.setAttribute(THEME_ATTRIBUTE, 'dark')
      await flushMutations()

      expect(getCurrentTheme()).toBe('dark')
    })

    it('flips ColorAsset resolution when the attribute is written by hand', async () => {
      const asset = ColorAsset.init({
        name: 'primary',
        default: '#ffffff',
        light: '#ffffff',
        dark: '#000000',
      })

      expect(asset.resolve()).toBe('#ffffff')

      document.documentElement.setAttribute(THEME_ATTRIBUTE, 'dark')
      await flushMutations()

      // The round trip the issue asks for: no more half-themed UI when an app
      // drives CSS custom properties and tachUI assets from one attribute.
      expect(asset.resolve()).toBe('#000000')
    })

    it('notifies already-rendered reactive consumers', async () => {
      const seen: string[] = []

      const dispose = createRoot(disposer => {
        createEffect(() => {
          seen.push(getThemeSignal()())
        })
        return disposer
      })

      try {
        expect(seen).toEqual(['light'])

        document.documentElement.setAttribute(THEME_ATTRIBUTE, 'dark')
        await flushMutations()

        // Asserted as an outcome rather than an exact call sequence: effects
        // are batched and may settle in more than one pass, which is the
        // scheduler's business and not this bridge's contract.
        expect(seen).toContain('dark')
        expect(seen.at(-1)).toBe('dark')
      } finally {
        dispose()
      }
    })

    it('falls back to the preference when the attribute is removed', async () => {
      setTheme('light')
      document.documentElement.setAttribute(THEME_ATTRIBUTE, 'dark')
      await flushMutations()
      expect(getCurrentTheme()).toBe('dark')

      document.documentElement.removeAttribute(THEME_ATTRIBUTE)
      await flushMutations()

      expect(getCurrentTheme()).toBe('light')
    })

    it('ignores an unparseable attribute value', async () => {
      setTheme('light')
      document.documentElement.setAttribute(THEME_ATTRIBUTE, 'midnight')
      await flushMutations()

      expect(getCurrentTheme()).toBe('light')
    })
  })

  describe('precedence', () => {
    it('puts an explicit attribute above the stated preference', async () => {
      setTheme('light')
      document.documentElement.setAttribute(THEME_ATTRIBUTE, 'dark')
      await flushMutations()

      expect(getCurrentTheme()).toBe('dark')
      // The preference is not overwritten by the DOM — only outranked, so a
      // settings UI still shows what the user chose.
      expect(getThemePreference()).toBe('light')
    })

    it('puts an explicit attribute above prefers-color-scheme', async () => {
      setSystemPrefersDark(true)
      setTheme('system')
      expect(getCurrentTheme()).toBe('dark')

      document.documentElement.setAttribute(THEME_ATTRIBUTE, 'light')
      await flushMutations()

      expect(getCurrentTheme()).toBe('light')
    })

    it('puts the stated preference above prefers-color-scheme', () => {
      setSystemPrefersDark(true)

      setTheme('light')
      expect(detectSystemTheme()).toBe('dark')
      expect(getCurrentTheme()).toBe('light')
    })

    it('consults prefers-color-scheme only for system', () => {
      setSystemPrefersDark(true)
      setTheme('system')
      expect(getCurrentTheme()).toBe('dark')

      setSystemPrefersDark(false)
      setTheme('system')
      expect(getCurrentTheme()).toBe('light')
    })

    it('makes setTheme visible to the very next read', () => {
      // The observer is asynchronous, so `setTheme` updates the signal itself
      // rather than waiting to hear about its own write.
      setTheme('dark')
      expect(getCurrentTheme()).toBe('dark')

      setTheme('light')
      expect(getCurrentTheme()).toBe('light')
    })

    it('lets setTheme take back control after an external write', async () => {
      document.documentElement.setAttribute(THEME_ATTRIBUTE, 'dark')
      await flushMutations()
      expect(getCurrentTheme()).toBe('dark')

      setTheme('light')

      expect(getCurrentTheme()).toBe('light')
      expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe(
        'light'
      )
    })
  })

  describe('the documented pre-paint recipe', () => {
    it('follows the OS for a system choice, with no attribute written', async () => {
      // The `'system'` branch of the documented boot snippet: nothing saved, so
      // no attribute was written pre-paint, and the app calls setTheme('system').
      // The suite's own `beforeEach` calls `setTheme('light')`, which writes the
      // attribute, so clear it to model a genuinely fresh boot.
      setSystemPrefersDark(true)
      document.documentElement.removeAttribute(THEME_ATTRIBUTE)
      await flushMutations()

      setTheme('system')

      const asset = ColorAsset.init({
        name: 'primary',
        default: '#ffffff',
        light: '#ffffff',
        dark: '#000000',
      })

      // Without this call the preference would still be its `'light'` default
      // and the asset would resolve light while the stylesheet's media query
      // went dark — the half-themed state the recipe exists to avoid.
      expect(getCurrentTheme()).toBe('dark')
      expect(asset.resolve()).toBe('#000000')

      // Still no attribute, so `prefers-color-scheme` keeps driving the CSS.
      expect(document.documentElement.hasAttribute(THEME_ATTRIBUTE)).toBe(false)
    })

    it('honours an explicit saved choice with no setTheme call', async () => {
      // The other branch: the pre-paint script wrote the attribute, and the app
      // deliberately does not call setTheme.
      setSystemPrefersDark(true)
      document.documentElement.setAttribute(THEME_ATTRIBUTE, 'light')
      await flushMutations()

      const asset = ColorAsset.init({
        name: 'primary',
        default: '#ffffff',
        light: '#ffffff',
        dark: '#000000',
      })

      expect(getCurrentTheme()).toBe('light')
      expect(asset.resolve()).toBe('#ffffff')
    })
  })

  describe('start/stop observing', () => {
    afterEach(() => {
      // Never leave the suite deaf for the tests that follow.
      startObservingThemeAttribute()
    })

    it('ignores external writes while stopped, and picks them up again', async () => {
      setTheme('light')
      stopObservingThemeAttribute()

      document.documentElement.setAttribute(THEME_ATTRIBUTE, 'dark')
      await flushMutations()
      expect(getCurrentTheme()).toBe('light')

      startObservingThemeAttribute()

      // Restarting re-syncs from the attribute rather than waiting for the
      // next mutation: the write above produced no record to catch up on.
      expect(getCurrentTheme()).toBe('dark')

      document.documentElement.setAttribute(THEME_ATTRIBUTE, 'light')
      await flushMutations()
      expect(getCurrentTheme()).toBe('light')
    })

    it('is idempotent, so a second start does not construct a second observer', () => {
      // Asserted on construction rather than on the resulting theme: a leaked
      // second observer would set `domTheme` to the same value the first one
      // did, and signal equality collapses that to a single notification, so
      // an outcome-based test here would pass with the guard removed.
      const RealMutationObserver = globalThis.MutationObserver
      const construct = vi.fn(function (
        this: unknown,
        callback: MutationCallback
      ) {
        return new RealMutationObserver(callback)
      })

      stopObservingThemeAttribute()
      vi.stubGlobal('MutationObserver', construct)

      try {
        startObservingThemeAttribute()
        startObservingThemeAttribute()

        expect(construct).toHaveBeenCalledTimes(1)
      } finally {
        vi.unstubAllGlobals()
        // Leave a real observer behind for whatever runs next.
        stopObservingThemeAttribute()
        startObservingThemeAttribute()
      }
    })
  })

  describe('without a document', () => {
    it('reflects and resolves without throwing', () => {
      // SSR: `setTheme` has nothing to write to and `getCurrentTheme` has
      // nothing to read, so both must fall back to the preference signal
      // rather than reaching for `document`.
      vi.stubGlobal('document', undefined)

      try {
        expect(() => setTheme('dark')).not.toThrow()
        expect(getCurrentTheme()).toBe('dark')

        expect(() => setTheme('light')).not.toThrow()
        expect(getCurrentTheme()).toBe('light')
      } finally {
        vi.unstubAllGlobals()
      }
    })
  })

  describe('getThemePreference', () => {
    it('reports the preference as stated, unresolved', () => {
      setSystemPrefersDark(true)

      setTheme('system')
      expect(getThemePreference()).toBe('system')
      expect(getCurrentTheme()).toBe('dark')

      setTheme('dark')
      expect(getThemePreference()).toBe('dark')
    })
  })
})
