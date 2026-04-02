import type { ComponentInstance, DOMNode } from '@tachui/core'
import { isComputed, isSignal, untrack } from '@tachui/core/reactive'
import type { ModifierBuilderLike, SSRNodeInput } from './types'
import { escapeAttribute, escapeHTML } from './escape'

const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
])

function isComponentInstance(value: unknown): value is ComponentInstance {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as any).type === 'component' &&
    typeof (value as any).render === 'function'
  )
}

function isDOMNode(value: unknown): value is DOMNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    ((value as any).type === 'element' ||
      (value as any).type === 'text' ||
      (value as any).type === 'comment')
  )
}

function isModifierBuilder(value: unknown): value is ModifierBuilderLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as any).build === 'function'
  )
}

const PROP_TO_ATTR: Record<string, string> = {
  className: 'class',
  htmlFor: 'for',
  tabIndex: 'tabindex',
  colSpan: 'colspan',
  rowSpan: 'rowspan',
  autoPlay: 'autoplay',
  autoComplete: 'autocomplete',
  crossOrigin: 'crossorigin',
  readOnly: 'readonly',
  maxLength: 'maxlength',
  noValidate: 'novalidate',
  encType: 'enctype',
}

const BOOLEAN_HTML_ATTRS = new Set([
  'allowfullscreen',
  'async',
  'autofocus',
  'autoplay',
  'checked',
  'controls',
  'default',
  'defer',
  'disabled',
  'formnovalidate',
  'hidden',
  'inert',
  'ismap',
  'itemscope',
  'loop',
  'multiple',
  'muted',
  'nomodule',
  'novalidate',
  'open',
  'playsinline',
  'readonly',
  'required',
  'reversed',
  'selected',
])

function resolveReactiveValue(value: unknown): unknown {
  if (isSignal(value) || isComputed(value)) {
    return untrack(() => (value as () => unknown)())
  }

  return value
}

function normalizeClassName(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map(entry => normalizeClassName(resolveReactiveValue(entry)))
      .filter(Boolean)
      .join(' ')
      .trim()
  }

  if (typeof value === 'object' && value !== null) {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, include]) => Boolean(resolveReactiveValue(include)))
      .map(([className]) => className)
      .join(' ')
      .trim()
  }

  if (value == null) return ''
  return String(value).trim()
}

function normalizeStyle(value: unknown): string {
  const resolved = resolveReactiveValue(value)

  if (typeof resolved === 'string') {
    return resolved.trim()
  }

  if (typeof resolved !== 'object' || resolved === null) {
    return ''
  }

  const styleEntries = Object.entries(resolved as Record<string, unknown>)
    .map(([property, propertyValue]) => {
      const reactiveValue = resolveReactiveValue(propertyValue)
      if (reactiveValue == null || reactiveValue === false) {
        return ''
      }

      const cssProperty = property.startsWith('--')
        ? property
        : property.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)
      return `${cssProperty}:${String(reactiveValue)}`
    })
    .filter(Boolean)

  return styleEntries.join(';')
}

function serializeAttributes(node: DOMNode): string {
  const props = node.props ?? {}
  const attributes: string[] = []

  for (const [rawKey, rawValue] of Object.entries(props)) {
    if (
      rawKey === 'children' ||
      rawKey === 'key' ||
      rawKey === 'ref' ||
      rawKey === 'componentMetadata'
    ) {
      continue
    }

    if (rawKey.startsWith('on') && typeof rawValue === 'function') {
      continue
    }

    const key = PROP_TO_ATTR[rawKey] ?? rawKey
    const resolvedValue = resolveReactiveValue(rawValue)

    if (key === 'class') {
      const classValue = normalizeClassName(resolvedValue)
      if (classValue) {
        attributes.push(`class="${escapeAttribute(classValue)}"`)
      }
      continue
    }

    if (key === 'style') {
      const styleValue = normalizeStyle(resolvedValue)
      if (styleValue) {
        attributes.push(`style="${escapeAttribute(styleValue)}"`)
      }
      continue
    }

    if (resolvedValue == null || resolvedValue === false) {
      continue
    }

    if (typeof resolvedValue === 'function') {
      continue
    }

    if (resolvedValue === true) {
      if (key.startsWith('aria-') || !BOOLEAN_HTML_ATTRS.has(key)) {
        attributes.push(`${key}="true"`)
      } else {
        attributes.push(key)
      }
      continue
    }

    attributes.push(`${key}="${escapeAttribute(String(resolvedValue))}"`)
  }

  const componentId = (node as any).componentId
  if (
    componentId != null &&
    !Object.prototype.hasOwnProperty.call(props, 'data-component-id')
  ) {
    attributes.push(`data-component-id="${escapeAttribute(String(componentId))}"`)
  }

  return attributes.length > 0 ? ` ${attributes.join(' ')}` : ''
}

function serializeNode(node: DOMNode): string {
  if (node.type === 'text') {
    if (typeof node.reactiveContent === 'function') {
      const resolvedText = untrack(() => node.reactiveContent!())
      return escapeHTML(String(resolvedText))
    }
    return escapeHTML(String(node.text ?? ''))
  }

  if (node.type === 'comment') {
    const safeComment = String(node.text ?? '').replace(/-->/g, '--\\u003E')
    return `<!--${safeComment}-->`
  }

  const tag = node.tag ?? 'div'
  const attributes = serializeAttributes(node)
  const openingTag = `<${tag}${attributes}>`

  if (VOID_ELEMENTS.has(tag)) {
    return openingTag
  }

  const children = (node.children ?? [])
    .map((child: DOMNode) => serializeNode(child))
    .join('')
  return `${openingTag}${children}</${tag}>`
}

export function serializeToHTML(input: SSRNodeInput): string {
  if (input == null || input === false || input === true) {
    return ''
  }

  if (Array.isArray(input)) {
    return input.map(entry => serializeToHTML(entry)).join('')
  }

  if (isComponentInstance(input)) {
    return serializeToHTML(input.render() as SSRNodeInput)
  }

  if (isModifierBuilder(input)) {
    const built = (input as ModifierBuilderLike).build()
    if (built === input) {
      throw new TypeError(
        'Unsupported TachUI SSR input. Modifier build() returned itself and cannot be serialized.'
      )
    }
    return serializeToHTML(built)
  }

  if (isDOMNode(input)) {
    return serializeNode(input)
  }

  if (typeof input === 'string' || typeof input === 'number') {
    return escapeHTML(String(input))
  }

  throw new TypeError('Unsupported TachUI SSR input. Expected component, DOM node, or primitive text.')
}
