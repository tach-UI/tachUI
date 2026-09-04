/**
 * What importing the theme module does to the document, before any app code
 * touches it.
 *
 * These need a *fresh* module instance, because the interesting behaviour all
 * happens at initialisation and every other suite imports the module long
 * before its first assertion. `vi.resetModules()` plus a dynamic import gives
 * one; each test tears its instance's observers down again so it cannot go on
 * reacting to a document later tests share.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const THEME_ATTRIBUTE = 'data-theme'

type ThemeModule = typeof import('../../src/reactive/theme')

async function importFreshThemeModule(): Promise<ThemeModule> {
  vi.resetModules()
  return import('../../src/reactive/theme')
}

const loaded: ThemeModule[] = []

async function loadIsolated(): Promise<ThemeModule> {
  const mod = await importFreshThemeModule()
  loaded.push(mod)
  return mod
}

beforeEach(() => {
  document.documentElement.removeAttribute(THEME_ATTRIBUTE)
  document.documentElement.style.colorScheme = ''
})

afterEach(() => {
  for (const mod of loaded.splice(0)) mod.stopObservingThemeAttribute()
  document.documentElement.removeAttribute(THEME_ATTRIBUTE)
  document.documentElement.style.colorScheme = ''
})

describe('importing the theme module', () => {
  it('writes no color-scheme when nothing has engaged the theme', async () => {
    const theme = await loadIsolated()

    // The regression this guards: initialisation used to reflect the untouched
    // `'light'` default, so merely importing `@tachui/core` planted an inline
    // `color-scheme: light` that outranks an app's own `:root` declaration and
    // lights up its native controls under a dark UI. `configureTheme()` cannot
    // undo it in time, since it necessarily runs after the import.
    expect(document.documentElement.style.colorScheme).toBe('')
    expect(theme.getCurrentTheme()).toBe('light')
  })

  it('does not disturb a color-scheme the app declared itself', async () => {
    document.documentElement.style.colorScheme = 'dark'

    await loadIsolated()

    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('imports cleanly with a pre-paint attribute already set', async () => {
    document.documentElement.setAttribute(THEME_ATTRIBUTE, 'dark')

    // Reading that attribute during initialisation engages the theme source.
    // With the flag it assigns declared below its own use, this import threw
    // `ReferenceError: Cannot access 'themeSourceEngaged' before
    // initialization` — and only on this path, the one the whole pre-paint
    // recipe depends on.
    const theme = await loadIsolated()

    expect(theme.getCurrentTheme()).toBe('dark')
  })

  it('reflects color-scheme for a pre-paint attribute', async () => {
    document.documentElement.setAttribute(THEME_ATTRIBUTE, 'dark')

    await loadIsolated()

    // An attribute already on `<html>` is a decision someone made about this
    // document, so matching it is wanted rather than presumptuous.
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('starts reflecting from the first setTheme', async () => {
    const theme = await loadIsolated()
    expect(document.documentElement.style.colorScheme).toBe('')

    theme.setTheme('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('starts reflecting when an attribute appears later', async () => {
    const theme = await loadIsolated()
    expect(document.documentElement.style.colorScheme).toBe('')

    document.documentElement.setAttribute(THEME_ATTRIBUTE, 'dark')
    await new Promise<void>(resolve => setTimeout(resolve, 0))

    expect(theme.getCurrentTheme()).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('can be engaged explicitly without setting a theme', async () => {
    const theme = await loadIsolated()
    expect(document.documentElement.style.colorScheme).toBe('')

    theme.configureTheme({ reflectColorScheme: true })

    // Opting in is itself a decision, so it takes effect immediately rather
    // than waiting for a theme change that may never come.
    expect(document.documentElement.style.colorScheme).toBe('light')
  })
})
