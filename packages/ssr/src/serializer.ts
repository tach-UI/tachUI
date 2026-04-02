import type { ComponentInstance, DOMNode } from '@tachui/core'
import { applyModifiersToNode } from '@tachui/core'
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

type SSRStyleObject = Record<string, string>

interface SSRStyleTarget {
  setProperty: (name: string, value: string, priority?: string) => void
}

interface SSRVirtualElement {
  style: SSRStyleTarget
  classList: {
    add: (..._tokens: string[]) => void
    remove: (..._tokens: string[]) => void
    contains: (_token: string) => boolean
  }
  setAttribute: (_name: string, _value: string) => void
  removeAttribute: (_name: string) => void
  getAttribute: (_name: string) => string | null
  hasAttribute: (_name: string) => boolean
  addEventListener: (
    _type: string,
    _listener: unknown
  ) => void
  removeEventListener: (
    _type: string,
    _listener: unknown
  ) => void
}

function collectStyleObject(styleInput: unknown): SSRStyleObject {
  const styleObject: SSRStyleObject = {}
  const resolvedStyle = resolveReactiveValue(styleInput)

  if (typeof resolvedStyle === 'string') {
    for (const declaration of resolvedStyle.split(';')) {
      const trimmedDeclaration = declaration.trim()
      if (!trimmedDeclaration) continue
      const separatorIndex = trimmedDeclaration.indexOf(':')
      if (separatorIndex < 1) continue
      const propertyName = trimmedDeclaration.slice(0, separatorIndex).trim()
      const value = trimmedDeclaration.slice(separatorIndex + 1).trim()
      if (propertyName && value) {
        styleObject[propertyName] = value
      }
    }
    return styleObject
  }

  if (typeof resolvedStyle !== 'object' || resolvedStyle === null) {
    return styleObject
  }

  for (const [property, propertyValue] of Object.entries(
    resolvedStyle as Record<string, unknown>
  )) {
    const reactiveValue = resolveReactiveValue(propertyValue)
    if (reactiveValue == null || reactiveValue === false) continue
    const cssProperty = property.startsWith('--')
      ? property
      : property.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)
    styleObject[cssProperty] = String(reactiveValue)
  }

  return styleObject
}

function createSSRVirtualElement(initialStyle: unknown): {
  element: SSRVirtualElement
  getStyles: () => SSRStyleObject
} {
  const styleState = collectStyleObject(initialStyle)
  const styleTargetBase: SSRStyleTarget & Record<string, unknown> = {
    setProperty(name: string, value: string, priority?: string) {
      const suffix = priority === 'important' ? ' !important' : ''
      styleState[name] = `${value}${suffix}`
    },
  }
  const styleTarget = new Proxy(styleTargetBase, {
    set(target, property, value) {
      if (typeof property === 'string' && property !== 'setProperty') {
        styleState[property] = String(value)
      }
      ;(target as Record<string, unknown>)[property as string] = value
      return true
    },
  }) as SSRStyleTarget

  const element: SSRVirtualElement = {
    style: styleTarget,
    classList: {
      add() {},
      remove() {},
      contains() {
        return false
      },
    },
    setAttribute() {},
    removeAttribute() {},
    getAttribute() {
      return null
    },
    hasAttribute() {
      return false
    },
    addEventListener() {},
    removeEventListener() {},
  }

  return {
    element,
    getStyles: () => ({ ...styleState }),
  }
}

function getNodeModifiers(node: DOMNode): unknown[] {
  const directModifiers =
    'modifiers' in (node as any) && Array.isArray((node as any).modifiers)
      ? (node as any).modifiers
      : []

  const metadataModifiers =
    'componentMetadata' in (node as any) &&
    Array.isArray((node as any).componentMetadata?.modifiers)
      ? (node as any).componentMetadata.modifiers
      : []

  // Match runtime precedence: use component metadata modifiers when present.
  return metadataModifiers.length > 0 ? metadataModifiers : directModifiers
}

function applyNodeModifiersForSSR(node: DOMNode): DOMNode {
  if (node.type !== 'element') {
    return node
  }

  const modifiers = getNodeModifiers(node)
  if (modifiers.length === 0) {
    return node
  }

  const virtualElement = createSSRVirtualElement(node.props?.style)
  const nodeForSSR = {
    ...node,
    props: { ...node.props },
  } as DOMNode

  const nodeWithAppliedModifiers = applyModifiersToNode(
    nodeForSSR,
    modifiers as any[],
    {
      componentId: (node as any).componentId || 'unknown',
      phase: 'creation',
      element: virtualElement.element as unknown as Element,
      componentInstance:
        (node as any).componentInstance ||
        (node as any).componentMetadata?.componentInstance ||
        (node as any)._originalComponent ||
        node,
    },
    {
      batch: true,
      suppressEffects: true,
    }
  )

  return {
    ...nodeWithAppliedModifiers,
    props: {
      ...nodeWithAppliedModifiers.props,
      style: {
        ...collectStyleObject(nodeWithAppliedModifiers.props?.style),
        ...virtualElement.getStyles(),
      },
    },
  }
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

  const preparedNode = applyNodeModifiersForSSR(node)
  const tag = preparedNode.tag ?? 'div'
  const attributes = serializeAttributes(preparedNode)
  const openingTag = `<${tag}${attributes}>`

  if (VOID_ELEMENTS.has(tag)) {
    return openingTag
  }

  const children = (preparedNode.children ?? [])
    .map((child: DOMNode) => serializeNode(child))
    .join('')
  return `${openingTag}${children}</${tag}>`
}

function serializeToHTMLInternal(
  input: SSRNodeInput,
  activeBuilders: Set<object>
): string {
  if (input == null || input === false || input === true) {
    return ''
  }

  if (Array.isArray(input)) {
    return input.map(entry => serializeToHTMLInternal(entry, activeBuilders)).join('')
  }

  if (isComponentInstance(input)) {
    return serializeToHTMLInternal(input.render() as SSRNodeInput, activeBuilders)
  }

  if (isModifierBuilder(input)) {
    const builder = input as ModifierBuilderLike
    if (activeBuilders.has(builder as object)) {
      throw new TypeError(
        'Unsupported TachUI SSR input. Detected cyclic builder input and cannot be serialized.'
      )
    }

    activeBuilders.add(builder as object)
    try {
      const built = builder.build()
      if (built === input) {
        throw new TypeError(
          'Unsupported TachUI SSR input. Modifier build() returned itself and cannot be serialized.'
        )
      }
      return serializeToHTMLInternal(built, activeBuilders)
    } finally {
      activeBuilders.delete(builder as object)
    }
  }

  if (isDOMNode(input)) {
    return serializeNode(input)
  }

  if (typeof input === 'string' || typeof input === 'number') {
    return escapeHTML(String(input))
  }

  throw new TypeError('Unsupported TachUI SSR input. Expected component, DOM node, or primitive text.')
}

export function serializeToHTML(input: SSRNodeInput): string {
  return serializeToHTMLInternal(input, new Set())
}
