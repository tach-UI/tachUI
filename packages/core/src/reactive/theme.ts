/**
 * Theme Management System for TachUI
 *
 * Provides reactive theme management with light/dark mode support, bridged to
 * the DOM so that stylesheet-driven theming and `Asset`-driven theming stay in
 * step.
 */

import { createSignal } from './signal'
import { createComputed, type Computed } from './computed'

export type Theme = 'light' | 'dark' | 'system'

/** A theme that names an actual appearance, as opposed to `'system'`. */
export type ResolvedTheme = 'light' | 'dark'

/**
 * The attribute tachUI reflects the theme to, and reads it back from.
 *
 * `data-theme` rather than a tachUI-specific spelling on purpose: it is the
 * convention CSS-side design systems already key off
 * (`:root[data-theme="dark"] { … }`), and matching it is what lets an existing
 * stylesheet and an existing pre-paint script work against tachUI without
 * either side being rewritten. That is the whole point of the bridge.
 */
export const THEME_ATTRIBUTE = 'data-theme'

function isResolvedTheme(value: unknown): value is ResolvedTheme {
  return value === 'light' || value === 'dark'
}

function themeRoot(): HTMLElement | undefined {
  if (typeof document === 'undefined') return undefined
  return document.documentElement ?? undefined
}

/**
 * The theme the DOM is currently asserting, or `undefined` if it asserts none.
 *
 * Read once at module load so a pre-paint script's choice is honoured from the
 * very first `getCurrentTheme()` — by the time this module evaluates, the
 * attribute is already on `<html>`, which is the only ordering that avoids a
 * flash of the wrong theme.
 */
function readThemeAttribute(): ResolvedTheme | undefined {
  const root = themeRoot()
  if (!root || typeof root.getAttribute !== 'function') return undefined

  const value = root.getAttribute(THEME_ATTRIBUTE)
  return isResolvedTheme(value) ? value : undefined
}

// The app's stated preference. `'system'` means "defer to the OS".
const [themePreference, setThemePreference] = createSignal<Theme>('light')

// What the DOM asserts, mirrored into a signal so that an external write is a
// reactive event and not just a silent divergence.
const [domTheme, setDomTheme] = createSignal<ResolvedTheme | undefined>(
  readThemeAttribute()
)

/**
 * Resolve the effective theme.
 *
 * Precedence, highest first:
 *
 * 1. **An explicit `data-theme` on `<html>`.** Whoever wrote it — a pre-paint
 *    script reading `localStorage`, a server rendering a logged-in user's
 *    saved choice, or `setTheme()` itself — has made a decision about *this
 *    document*, and it outranks anything inferred.
 * 2. **The stated preference**, when it names an appearance.
 * 3. **`prefers-color-scheme`**, when the preference is `'system'`.
 *
 * The DOM winning over the preference signal is what makes the bridge useful
 * rather than merely bidirectional: an app that already sets the attribute
 * pre-paint gets tachUI following along without calling a tachUI API at all.
 * `setTheme()` writes the attribute, so the two never disagree by accident —
 * only by deliberate external action, which is exactly the case rule 1 is for.
 */
function resolveTheme(preference: Theme, fromDOM?: ResolvedTheme): ResolvedTheme {
  if (fromDOM) return fromDOM
  if (preference !== 'system') return preference
  return detectSystemTheme()
}

// Function to get the current theme
export function getCurrentTheme(): ResolvedTheme {
  return resolveTheme(themePreference(), domTheme())
}

/**
 * Get the preference as stated, before resolution.
 *
 * `getCurrentTheme()` answers "what does this render as"; this answers "what
 * did the app ask for", which is the value a settings UI needs in order to show
 * `system` as selected rather than the light-or-dark it resolved to.
 */
export function getThemePreference(): Theme {
  return themePreference()
}

/**
 * Write the theme to `<html>`, or clear it.
 *
 * `'system'` removes the attribute rather than writing `data-theme="system"`,
 * because that is what the CSS pattern expects: the attribute is an *override*,
 * and its absence is what lets `@media (prefers-color-scheme: dark)` apply. A
 * literal `system` value would match no stylesheet rule anyone writes and would
 * pin the page to its light branch.
 */
function reflectThemeToDOM(theme: Theme): void {
  const root = themeRoot()
  if (!root || typeof root.setAttribute !== 'function') return

  if (theme === 'system') {
    root.removeAttribute?.(THEME_ATTRIBUTE)
  } else {
    root.setAttribute(THEME_ATTRIBUTE, theme)
  }
}

// Function to set the theme
export function setTheme(theme: Theme): void {
  setThemePreference(theme)

  // Kept in step directly rather than waiting for the observer below, which
  // delivers asynchronously: a `setTheme()` must be visible to the very next
  // `getCurrentTheme()`.
  setDomTheme(theme === 'system' ? undefined : theme)

  reflectThemeToDOM(theme)
}

let themeObserver: MutationObserver | undefined

/**
 * Follow external writes to `data-theme`.
 *
 * Without this the bridge is one-way: a stylesheet would follow tachUI, but an
 * app toggling the attribute itself — the pre-paint pattern, or any CSS-first
 * design system — would flip its custom properties while every `ColorAsset` on
 * the page kept resolving to the old theme. Pushing the attribute into a signal
 * makes a hand-written attribute a first-class theme change that already-
 * rendered nodes react to.
 *
 * Self-inflicted mutations are harmless: `setTheme` has already set `domTheme`
 * to the same value, and setting a signal to the value it holds notifies
 * nothing.
 *
 * Called once on import and safe to call again: idempotent while already
 * observing, and it re-syncs from the attribute when it is not. That makes it
 * the way back from `stopObservingThemeAttribute`, and the way in for a host
 * that imported this module before a document existed.
 */
export function startObservingThemeAttribute(): void {
  if (themeObserver) return

  const root = themeRoot()
  if (!root || typeof MutationObserver === 'undefined') return

  // Catch up on whatever the attribute says now. Anything written while we were
  // not watching produced no record, so without this a restart would observe
  // only the *next* change and stay wrong about the current one.
  setDomTheme(readThemeAttribute())

  themeObserver = new MutationObserver(() => {
    setDomTheme(readThemeAttribute())
  })

  themeObserver.observe(root, {
    attributes: true,
    attributeFilter: [THEME_ATTRIBUTE],
  })
}

/**
 * Stop following external writes to `data-theme`.
 *
 * Exported for tests and for hosts that tear down a tachUI instance without
 * tearing down the document; app code does not normally need it. Pair it with
 * `startObservingThemeAttribute` — stopping without a way back would leave the
 * next instance silently deaf to external writes, which is the divergence this
 * bridge exists to remove.
 */
export function stopObservingThemeAttribute(): void {
  themeObserver?.disconnect()
  themeObserver = undefined
}

startObservingThemeAttribute()

// Create a single shared computed theme signal
const themeComputed = createComputed(() =>
  resolveTheme(themePreference(), domTheme())
)

// Function to get the reactive theme signal for use in reactive effects
export function getThemeSignal(): Computed<ResolvedTheme> {
  return themeComputed
}

// Auto-detect system theme
export function detectSystemTheme(): ResolvedTheme {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }
  return 'light'
}
