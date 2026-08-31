/**
 * Icon SVG sanitization helpers (#218)
 *
 * Icon definitions are not guaranteed trusted: icon sets are pluggable and
 * `IconSet.getIcon()` can return definitions from any source, including
 * fetched content. Every icon body therefore goes through the framework's
 * allowlist sanitizer (`sanitizeSVG` from `@tachui/core`) before it reaches
 * an `innerHTML` sink, and interpolated attribute values are validated or
 * escaped.
 *
 * Sanitized bodies are memoized per definition object (WeakMap), so repeated
 * renders cost nothing after the first pass.
 */

import { sanitizeSVG } from '@tachui/core'
import type { IconDefinition } from '../types.js'

const sanitizedBodyCache = new WeakMap<IconDefinition, string>()

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
const SAFE_VIEWBOX_RE = /^[\d\s.,-]+$/
const DEFAULT_VIEWBOX = '0 0 24 24'

/**
 * Return the allowlist-sanitized inner markup for an icon definition.
 * The result is memoized on the definition object identity.
 *
 * `sanitizeSVG` expects a rooted `<svg>` document (icon bodies are inner
 * fragments designed to sit inside a wrapper `<svg>`), so the fragment is
 * wrapped before sanitizing and the sanitized inner markup extracted after.
 */
export function getSanitizedIconBody(definition: IconDefinition): string {
  let cached = sanitizedBodyCache.get(definition)
  if (cached === undefined) {
    const wrapped = `<svg xmlns="${SVG_NAMESPACE}">${definition.svg}</svg>`
    const sanitizedWrapper = sanitizeSVG(wrapped)

    const container = document.createElement('div')
    container.innerHTML = sanitizedWrapper
    const svgRoot = container.querySelector('svg')
    cached = svgRoot ? svgRoot.innerHTML : ''

    sanitizedBodyCache.set(definition, cached)
  }
  return cached
}

/**
 * Return a safe `viewBox` for interpolation into markup: definitions from
 * pluggable sets may carry crafted values, so anything outside the numeric
 * charset falls back to the standard Lucide viewBox.
 */
export function getSafeViewBox(definition: IconDefinition): string {
  const raw = definition.viewBox || DEFAULT_VIEWBOX
  return SAFE_VIEWBOX_RE.test(raw) ? raw : DEFAULT_VIEWBOX
}

/**
 * Escape a value for interpolation inside a double-quoted HTML attribute.
 */
export function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
