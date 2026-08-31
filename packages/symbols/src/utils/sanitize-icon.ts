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
 * In DOM-free environments (Node SSR), a strict allowlist rebuilder is used
 * instead — see `sanitizeIconBodyWithoutDom`.
 */
export function getSanitizedIconBody(definition: IconDefinition): string {
  let cached = sanitizedBodyCache.get(definition)
  if (cached === undefined) {
    if (typeof DOMParser === 'undefined' || typeof document === 'undefined') {
      cached = sanitizeIconBodyWithoutDom(definition.svg)
    } else {
      const wrapped = `<svg xmlns="${SVG_NAMESPACE}">${definition.svg}</svg>`
      const sanitizedWrapper = sanitizeSVG(wrapped)

      const container = document.createElement('div')
      container.innerHTML = sanitizedWrapper
      const svgRoot = container.querySelector('svg')
      cached = svgRoot ? svgRoot.innerHTML : ''
    }

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

// --- DOM-free fallback -----------------------------------------------------
// Mirrors the allowlist rules of packages/core/src/utils/sanitize-svg.ts
// (ALLOWED_TAGS / ALLOWED_ATTRIBUTES / STRIP_SUBTREE_TAGS / unsafe-protocol
// checks) — keep the two in sync.

const SSR_ALLOWED_TAGS = new Set([
  'svg',
  'g',
  'path',
  'circle',
  'rect',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'text',
  'tspan',
  'defs',
  'clippath',
  'mask',
  'symbol',
  'use',
  'lineargradient',
  'radialgradient',
  'stop',
])

const SSR_STRIP_SUBTREE_TAGS = new Set(['script', 'foreignobject', 'style'])

const SSR_ALLOWED_ATTRIBUTES = new Set([
  'viewbox',
  'd',
  'fill',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'width',
  'height',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'points',
  'transform',
  'opacity',
  'clip-path',
  'mask',
  'filter',
  'gradientunits',
  'gradienttransform',
  'offset',
  'stop-color',
  'stop-opacity',
  'id',
  'class',
  'preserveaspectratio',
  'href',
  'xlink:href',
  'xmlns:xlink',
])

// Open/close tag token: attributes must be whitespace-separated
// `name="value"` pairs whose values contain no quotes or angle brackets.
// Anything malformed does not match as a tag and degrades to inert text.
// Sticky ('y') tokenizer: tags must match exactly at the scan position — a
// malformed tag can never be skipped over, so markup following it cannot leak
// through as text (#218 review)
const SSR_TAG_TOKEN_RE =
  /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[a-zA-Z_:][a-zA-Z0-9:._-]*="[^"<>]*")*)\s*(\/?)>/y
const SSR_TEXT_TOKEN_RE = /[^<]+/y
const SSR_ATTRIBUTE_RE = /([a-zA-Z_:][a-zA-Z0-9:._-]*)="([^"<>]*)"/g

function hasUnsafeSSRProtocol(value: string): boolean {
  const normalized = value
    .toLowerCase()
    .replace(/[\u0000-\u0020]+/g, '')
  return normalized.includes('javascript:') || normalized.includes('data:')
}

function isSafeSSRFragmentHref(value: string): boolean {
  return /^#[A-Za-z_][\w:.-]*$/.test(value.trim())
}

function isSafeSSRURLReference(value: string): boolean {
  return /^url\((["']?)(#[A-Za-z_][\w:.-]*)\1\)$/.test(value.trim())
}

function sanitizeSSRAttribute(name: string, value: string): string | null {
  const normalizedName = name.toLowerCase()

  if (!SSR_ALLOWED_ATTRIBUTES.has(normalizedName)) return null
  if (normalizedName.startsWith('on')) return null
  if (hasUnsafeSSRProtocol(value)) return null

  if (normalizedName === 'href' || normalizedName === 'xlink:href') {
    return isSafeSSRFragmentHref(value) ? value.trim() : null
  }

  if (value.includes('url(')) {
    return isSafeSSRURLReference(value) ? value.trim() : null
  }

  return value
}

/**
 * Re-validate and rebuild an attribute source string (`name="value"` pairs).
 * Returns null when the source is not a contiguous sequence of well-formed
 * double-quoted attributes — malformed input drops the whole element.
 */
function rebuildSSRAttributeString(attributeSource: string): string | null {
  if (attributeSource.trim() === '') return ''

  const source = attributeSource.replace(/^\s+/, '')
  const rebuilt: string[] = []
  let position = 0

  for (const match of source.matchAll(SSR_ATTRIBUTE_RE)) {
    // Attributes are whitespace-separated — only whitespace may appear
    // between consecutive matches; anything else is malformed
    if (source.slice(position, match.index).trim() !== '') return null
    position = match.index + match[0].length

    const safeValue = sanitizeSSRAttribute(match[1], match[2])
    // Unsafe attributes are dropped individually (mirroring core's
    // per-attribute filtering); only structural malformedness drops the
    // whole element
    if (safeValue !== null) {
      rebuilt.push(`${match[1]}="${safeValue}"`)
    }
  }

  if (position !== source.length) return null

  return rebuilt.join(' ')
}

/**
 * DOM-free allowlist sanitizer used in Node SSR, where `DOMParser`/`document`
 * are unavailable and the DOM-based `sanitizeSVG` cannot run. Rebuilds the
 * fragment token-by-token, emitting only allowed elements with allowlisted,
 * safely-quoted attributes; strip-subtree elements (script/style/
 * foreignObject) and malformed markup are dropped. Well-formed markup made of
 * allowed elements round-trips unchanged.
 */
function sanitizeIconBodyWithoutDom(markup: string): string {
  if (typeof markup !== 'string' || markup.trim() === '') return ''

  const stripped = markup
    .replace(/<\?[\s\S]*?\?>/g, '')
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    .replace(/<!ENTITY[\s\S]*?>/gi, '')

  const emitted: string[] = []
  // One shared tag stack for emitted opens, unknown-tag opens (children are
  // still processed), and strip-subtree opens — closes must match the top.
  // Only entries flagged `emitted` produce a closing tag.
  const openTags: Array<{ tag: string; emitted: boolean }> = []
  let stripDepth = 0

  let position = 0
  while (position < stripped.length) {
    SSR_TAG_TOKEN_RE.lastIndex = position
    const tagMatch = SSR_TAG_TOKEN_RE.exec(stripped)

    if (!tagMatch) {
      // No valid tag at this position: plain text or malformed markup. Text
      // is consumed (and emitted outside strip subtrees); a '<' that cannot
      // tokenize fails closed — everything from it onward is dropped.
      SSR_TEXT_TOKEN_RE.lastIndex = position
      const textMatch = SSR_TEXT_TOKEN_RE.exec(stripped)
      if (!textMatch) break
      if (stripDepth === 0) {
        emitted.push(textMatch[0])
      }
      position = SSR_TEXT_TOKEN_RE.lastIndex
      continue
    }

    position = SSR_TAG_TOKEN_RE.lastIndex
    const [, closeSlash, tagName, attributeSource = '', selfSlash] = tagMatch
    const lowerTag = tagName.toLowerCase()

    if (closeSlash) {
      const top = openTags[openTags.length - 1]
      if (top && top.tag === lowerTag) {
        openTags.pop()
        if (stripDepth > 0) {
          if (SSR_STRIP_SUBTREE_TAGS.has(lowerTag)) stripDepth--
        } else if (top.emitted) {
          emitted.push(`</${lowerTag}>`)
        }
      }
      continue
    }

    if (SSR_STRIP_SUBTREE_TAGS.has(lowerTag)) {
      if (!selfSlash) {
        stripDepth++
        openTags.push({ tag: lowerTag, emitted: false })
      }
      continue
    }

    if (stripDepth > 0) continue

    if (!SSR_ALLOWED_TAGS.has(lowerTag)) {
      // Unknown tag: skip it, keep processing children (mirrors core)
      if (!selfSlash) openTags.push({ tag: lowerTag, emitted: false })
      continue
    }

    const rebuiltAttributes = rebuildSSRAttributeString(attributeSource)
    if (rebuiltAttributes === null) continue // malformed — drop the element

    if (selfSlash) {
      emitted.push(`<${lowerTag}${rebuiltAttributes ? ` ${rebuiltAttributes}` : ''}/>`)
    } else {
      emitted.push(`<${lowerTag}${rebuiltAttributes ? ` ${rebuiltAttributes}` : ''}>`)
      openTags.push({ tag: lowerTag, emitted: true })
    }
  }

  return emitted.join('')
}
