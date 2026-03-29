import type { Accessor } from '@tachui/core'
import { createEffect } from '@tachui/core'
import type {
  DocumentHeadConfig,
  DocumentHeadMetaTag,
  DocumentHeadValue,
  NavigationStackEntry,
} from './types'

type ResolvedMetaTag = {
  name?: string
  property?: string
  content?: string
  httpEquiv?: string
  charset?: string
}

type ResolvedDocumentHead = {
  title?: string
  titleTemplate?: string
  description?: string
  canonical?: string
  meta?: ResolvedMetaTag[]
  openGraph?: {
    title?: string
    description?: string
    url?: string
    image?: string
    type?: string
  }
}

type ReactiveEffect = {
  dispose: () => void
}

interface DocumentHeadMarkerProps {
  documentHead: DocumentHeadConfig
}

class DocumentHeadMarker {
  public readonly type = 'component' as const
  public readonly id = `document-head-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  public mounted = false
  public cleanup: (() => void)[] = []
  public props: DocumentHeadMarkerProps

  constructor(config: DocumentHeadConfig) {
    this.props = { documentHead: config }
    ;(this as any).__tachuiDocumentHead = config
  }

  render() {
    return []
  }
}

function resolveValue(value?: DocumentHeadValue): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'function') {
    return String((value as Accessor<string>)())
  }
  return String(value)
}

function resolveHead(config: DocumentHeadConfig): ResolvedDocumentHead {
  const openGraph = config.openGraph
  return {
    title: resolveValue(config.title),
    titleTemplate: resolveValue(config.titleTemplate),
    description: resolveValue(config.description),
    canonical: resolveValue(config.canonical),
    meta: resolveMetaTags(config.meta),
    openGraph: openGraph
      ? {
          title: resolveValue(openGraph.title),
          description: resolveValue(openGraph.description),
          url: resolveValue(openGraph.url),
          image: resolveValue(openGraph.image),
          type: resolveValue(openGraph.type),
        }
      : undefined,
  }
}

function resolveMetaTags(
  value?: DocumentHeadMetaTag[] | Accessor<DocumentHeadMetaTag[]>
): ResolvedMetaTag[] | undefined {
  if (value === undefined || value === null) return undefined

  const rawMeta = typeof value === 'function' ? value() : value
  if (!Array.isArray(rawMeta)) return undefined
  if (rawMeta.length === 0) return []

  const resolved = rawMeta
    .map((entry, index) => {
      const metaTag: ResolvedMetaTag = {
        name: resolveValue(entry.name),
        property: resolveValue(entry.property),
        content: resolveValue(entry.content),
        httpEquiv: resolveValue(entry.httpEquiv),
        charset: resolveValue(entry.charset),
      }

      const hasIdentifier =
        Boolean(metaTag.name) ||
        Boolean(metaTag.property) ||
        Boolean(metaTag.httpEquiv) ||
        Boolean(metaTag.charset)

      if (!hasIdentifier && process.env.NODE_ENV !== 'production') {
        console.warn(
          `DocumentHead meta entry at index ${index} is missing name/property/httpEquiv/charset and was ignored.`
        )
      }

      return hasIdentifier ? metaTag : undefined
    })
    .filter((entry): entry is ResolvedMetaTag => Boolean(entry))

  return resolved
}

function mergeHead(
  base: ResolvedDocumentHead,
  next: ResolvedDocumentHead
): ResolvedDocumentHead {
  const openGraph = {
    title: next.openGraph?.title ?? base.openGraph?.title,
    description: next.openGraph?.description ?? base.openGraph?.description,
    url: next.openGraph?.url ?? base.openGraph?.url,
    image: next.openGraph?.image ?? base.openGraph?.image,
    type: next.openGraph?.type ?? base.openGraph?.type,
  }

  const hasOpenGraphValues = Object.values(openGraph).some(
    value => value !== undefined
  )

  return {
    title: next.title ?? base.title,
    titleTemplate: next.titleTemplate ?? base.titleTemplate,
    description: next.description ?? base.description,
    canonical: next.canonical ?? base.canonical,
    meta: next.meta !== undefined ? next.meta : base.meta,
    openGraph: hasOpenGraphValues ? openGraph : undefined,
  }
}

function extractChildren(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  return value ? [value] : []
}

export function extractDocumentHeadFromComponent(
  component: unknown,
  seen: Set<unknown> = new Set()
): DocumentHeadConfig | undefined {
  if (!component || typeof component !== 'object') return undefined
  if (seen.has(component)) return undefined
  seen.add(component)

  const direct = (component as any).__tachuiDocumentHead as
    | DocumentHeadConfig
    | undefined
  if (direct) return direct

  const props = (component as any).props
  if (props?.documentHead) {
    return props.documentHead as DocumentHeadConfig
  }

  const maybeChildren = [
    ...(props ? extractChildren(props.children) : []),
    ...extractChildren((component as any).children),
  ]

  for (const child of maybeChildren) {
    const match = extractDocumentHeadFromComponent(child, seen)
    if (match) return match
  }

  return undefined
}

function getDocument(): Document | undefined {
  if (typeof document === 'undefined') return undefined
  return document
}

function upsertMetaAttribute(
  doc: Document,
  selector: string,
  attribute: 'name' | 'property',
  key: string,
  value?: string
) {
  let element = doc.head.querySelector(selector) as HTMLMetaElement | null

  if (!value) {
    if (element) element.remove()
    return
  }

  if (!element) {
    element = doc.createElement('meta')
    element.setAttribute(attribute, key)
    doc.head.appendChild(element)
  }

  element.setAttribute('content', value)
}

function upsertCanonical(doc: Document, href?: string) {
  const selector = 'link[rel="canonical"]'
  let element = doc.head.querySelector(selector) as HTMLLinkElement | null

  if (!href) {
    if (element) element.remove()
    return
  }

  if (!element) {
    element = doc.createElement('link')
    element.setAttribute('rel', 'canonical')
    doc.head.appendChild(element)
  }

  element.setAttribute('href', href)
}

const MANAGED_META_ATTRIBUTE = 'data-tachui-meta-managed'
const MANAGED_META_KEY_ATTRIBUTE = 'data-tachui-meta-key'

function getMetaTagKey(tag: ResolvedMetaTag): string | undefined {
  if (tag.charset) return `charset:${tag.charset}`
  if (tag.name) return `name:${tag.name}`
  if (tag.property) return `property:${tag.property}`
  if (tag.httpEquiv) return `httpEquiv:${tag.httpEquiv}`
  return undefined
}

function applyMetaTagAttributes(element: HTMLMetaElement, tag: ResolvedMetaTag): void {
  element.removeAttribute('charset')
  element.removeAttribute('name')
  element.removeAttribute('property')
  element.removeAttribute('http-equiv')

  if (tag.charset) {
    element.setAttribute('charset', tag.charset)
  }
  if (tag.name) {
    element.setAttribute('name', tag.name)
  }
  if (tag.property) {
    element.setAttribute('property', tag.property)
  }
  if (tag.httpEquiv) {
    element.setAttribute('http-equiv', tag.httpEquiv)
  }

  if (tag.content !== undefined) {
    element.setAttribute('content', tag.content)
  } else {
    element.removeAttribute('content')
  }
}

function syncManagedMetaTags(doc: Document, metaTags?: ResolvedMetaTag[]): void {
  const existingManaged = Array.from(
    doc.head.querySelectorAll(`meta[${MANAGED_META_ATTRIBUTE}="true"]`)
  ) as HTMLMetaElement[]
  const existingByKey = new Map<string, HTMLMetaElement>()

  for (const element of existingManaged) {
    const key = element.getAttribute(MANAGED_META_KEY_ATTRIBUTE)
    if (!key) {
      element.remove()
      continue
    }
    if (existingByKey.has(key)) {
      element.remove()
      continue
    }
    existingByKey.set(key, element)
  }

  if (!metaTags) {
    return
  }

  const nextKeys = new Set<string>()
  for (const tag of metaTags) {
    const key = getMetaTagKey(tag)
    if (!key) {
      continue
    }
    nextKeys.add(key)

    let element = existingByKey.get(key)
    if (!element) {
      element = doc.createElement('meta')
      element.setAttribute(MANAGED_META_ATTRIBUTE, 'true')
      element.setAttribute(MANAGED_META_KEY_ATTRIBUTE, key)
      doc.head.appendChild(element)
    }

    applyMetaTagAttributes(element, tag)
  }

  for (const [key, element] of existingByKey) {
    if (!nextKeys.has(key)) {
      element.remove()
    }
  }
}

class DocumentHeadRuntime {
  private staticTitle: string | undefined
  private navigationEffects = new Map<string, ReactiveEffect>()
  private navigationHeads = new Map<string, ResolvedDocumentHead>()
  private activeNavigationId: string | undefined
  private directEffect?: ReactiveEffect
  private directHead: ResolvedDocumentHead = {}

  applyStack(navigationId: string, stack: NavigationStackEntry[]): void {
    this.activeNavigationId = navigationId
    const existing = this.navigationEffects.get(navigationId)
    existing?.dispose()

    const effect = createEffect(() => {
      const merged = stack.reduce<ResolvedDocumentHead>((acc, entry) => {
        const entryHead =
          (entry.metadata?.documentHead as DocumentHeadConfig | undefined) ??
          extractDocumentHeadFromComponent(entry.component)

        if (!entryHead) return acc
        return mergeHead(acc, resolveHead(entryHead))
      }, {})

      this.navigationHeads.set(navigationId, merged)
      this.applyCurrent()
    })

    this.navigationEffects.set(navigationId, effect)
  }

  clearNavigation(navigationId: string): void {
    const effect = this.navigationEffects.get(navigationId)
    effect?.dispose()
    this.navigationEffects.delete(navigationId)
    this.navigationHeads.delete(navigationId)

    if (this.activeNavigationId === navigationId) {
      const lastActive = Array.from(this.navigationHeads.keys()).pop()
      this.activeNavigationId = lastActive
    }

    this.applyCurrent()
  }

  applyDirect(config: DocumentHeadConfig): void {
    this.directEffect?.dispose()
    this.directEffect = createEffect(() => {
      this.directHead = resolveHead(config)
      this.applyCurrent()
    })
  }

  private applyCurrent(): void {
    const activeHead = this.activeNavigationId
      ? this.navigationHeads.get(this.activeNavigationId)
      : undefined

    if (activeHead) {
      this.applyResolvedHead(activeHead)
      return
    }

    this.applyResolvedHead(this.directHead)
  }

  private applyResolvedHead(head: ResolvedDocumentHead): void {
    const doc = getDocument()
    if (!doc) return

    if (this.staticTitle === undefined) {
      this.staticTitle = doc.title
    }

    const title = head.title
    const template = head.titleTemplate
    if (title) {
      if (template && template.includes('%s')) {
        doc.title = template.replace('%s', title)
      } else if (template) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            'DocumentHead titleTemplate should contain "%s" placeholder, e.g. "%s — Acme".'
          )
        }
        doc.title = `${template} ${title}`.trim()
      } else {
        doc.title = title
      }
    } else {
      doc.title = this.staticTitle ?? ''
    }

    upsertMetaAttribute(
      doc,
      'meta[name="description"]',
      'name',
      'description',
      head.description
    )
    upsertCanonical(doc, head.canonical)
    upsertMetaAttribute(
      doc,
      'meta[property="og:title"]',
      'property',
      'og:title',
      head.openGraph?.title
    )
    upsertMetaAttribute(
      doc,
      'meta[property="og:description"]',
      'property',
      'og:description',
      head.openGraph?.description
    )
    upsertMetaAttribute(
      doc,
      'meta[property="og:url"]',
      'property',
      'og:url',
      head.openGraph?.url
    )
    upsertMetaAttribute(
      doc,
      'meta[property="og:image"]',
      'property',
      'og:image',
      head.openGraph?.image
    )
    upsertMetaAttribute(
      doc,
      'meta[property="og:type"]',
      'property',
      'og:type',
      head.openGraph?.type
    )
    syncManagedMetaTags(doc, head.meta)
  }

  resetForTests(): void {
    this.navigationEffects.forEach(effect => effect.dispose())
    this.navigationEffects.clear()
    this.navigationHeads.clear()
    this.activeNavigationId = undefined
    this.directEffect?.dispose()
    this.directEffect = undefined
    this.directHead = {}
    this.staticTitle = undefined
  }
}

const runtime = new DocumentHeadRuntime()

export function applyDocumentHeadForStack(
  navigationId: string,
  stack: NavigationStackEntry[]
): void {
  runtime.applyStack(navigationId, stack)
}

export function clearDocumentHeadForNavigation(navigationId: string): void {
  runtime.clearNavigation(navigationId)
}

export function useDocumentMeta(config: DocumentHeadConfig): void {
  runtime.applyDirect(config)
}

export function withDocumentHead<T extends object>(
  component: T,
  config: DocumentHeadConfig
): T {
  ;(component as any).__tachuiDocumentHead = config
  return component
}

export function DocumentHead(config: DocumentHeadConfig): any
export function DocumentHead<T extends object>(
  config: DocumentHeadConfig,
  content: T
): T
export function DocumentHead<T extends object>(
  config: DocumentHeadConfig,
  content?: T
): any {
  if (content) {
    return withDocumentHead(content, config)
  }
  return new DocumentHeadMarker(config) as any
}

export function __resetDocumentHeadRuntimeForTests(): void {
  runtime.resetForTests()
}
