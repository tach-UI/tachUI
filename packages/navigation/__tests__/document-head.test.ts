import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSignal } from '@tachui/core'
import { createRoot, flushSync } from '@tachui/core/reactive'
import { HTML } from '@tachui/primitives'
import { NavigationStack } from '../src/navigation-stack'
import {
  __resetDocumentHeadRuntimeForTests,
  DocumentHead,
  extractDocumentHeadFromComponent,
  useDocumentMeta,
  withDocumentHead,
} from '../src/document-head'

describe('Document head metadata', () => {
  const disposers = new Set<() => void>()

  async function flushReactiveUpdates(): Promise<void> {
    flushSync()
    await Promise.resolve()
  }

  function applyDirectMeta(config: Parameters<typeof useDocumentMeta>[0]): void {
    const dispose = createRoot(dispose => {
      useDocumentMeta(config)
      return dispose
    })
    disposers.add(dispose)
    flushSync()
  }

  beforeEach(() => {
    __resetDocumentHeadRuntimeForTests()
    document.title = 'Base Title'
    document.head
      .querySelectorAll(
        'meta[name="description"], link[rel="canonical"], meta[property^="og:"], meta[data-tachui-meta-managed="true"]'
      )
      .forEach(node => node.remove())
  })

  afterEach(() => {
    disposers.forEach(dispose => dispose())
    disposers.clear()
  })

  it('cascades metadata from root to active stack entry', () => {
    const root = withDocumentHead(
      HTML.div({ children: 'Home' }).build(),
      {
        title: 'Home',
        titleTemplate: '%s — Acme',
        description: 'Default description',
      }
    )

    const stack = NavigationStack(root) as any
    const context = stack.navigationContext

    const detail = withDocumentHead(
      HTML.div({ children: 'Detail' }).build(),
      {
        title: 'Widget Pro',
        canonical: '/products/widget-pro',
      }
    )

    context.push(detail, '/products/widget-pro', 'Widget Pro')

    expect(document.title).toBe('Widget Pro — Acme')
    expect(
      document.head
        .querySelector('meta[name="description"]')
        ?.getAttribute('content')
    ).toBe('Default description')
    expect(
      document.head
        .querySelector('link[rel="canonical"]')
        ?.getAttribute('href')
    ).toBe('/products/widget-pro')

    context.pop()

    expect(document.title).toBe('Home — Acme')
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull()
  })

  it('supports attaching metadata with DocumentHead helper', () => {
    const component = HTML.div({ children: 'Page' }).build()
    const headedComponent = DocumentHead(
      { title: 'Page title', description: 'Page description' },
      component
    )

    const extracted = extractDocumentHeadFromComponent(headedComponent)

    expect(extracted?.title).toBe('Page title')
    expect(extracted?.description).toBe('Page description')
  })

  it('keeps previous stack head active when newest stack is cleared', () => {
    const stackOneRoot = withDocumentHead(HTML.div({ children: 'One' }).build(), {
      title: 'Stack One',
      titleTemplate: '%s — One',
    })
    const stackOne = NavigationStack(stackOneRoot) as any

    expect(document.title).toBe('Stack One — One')

    const stackTwoRoot = withDocumentHead(HTML.div({ children: 'Two' }).build(), {
      title: 'Stack Two',
      titleTemplate: '%s — Two',
    })
    const stackTwo = NavigationStack(stackTwoRoot) as any

    expect(document.title).toBe('Stack Two — Two')

    stackTwo._navigationCleanup?.()
    expect(document.title).toBe('Stack One — One')

    stackOne._navigationCleanup?.()
    expect(document.title).toBe('Base Title')
  })

  it('applies useDocumentMeta reactively', async () => {
    const [title, setTitle] = createSignal('Alpha')

    applyDirectMeta({
      title,
      description: 'Reactive description',
    })

    expect(document.title).toBe('Alpha')
    expect(
      document.head
        .querySelector('meta[name="description"]')
        ?.getAttribute('content')
    ).toBe('Reactive description')

    setTitle('Beta')
    await flushReactiveUpdates()
    expect(document.title).toBe('Beta')
  })

  it('restores static title when direct metadata has no title', () => {
    applyDirectMeta({
      title: 'Temporary',
      description: 'Temporary description',
    })
    expect(document.title).toBe('Temporary')

    applyDirectMeta({
      description: 'Persistent description',
    })

    expect(document.title).toBe('Base Title')
    expect(
      document.head
        .querySelector('meta[name="description"]')
        ?.getAttribute('content')
    ).toBe('Persistent description')
  })

  it('warns when titleTemplate does not include placeholder', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    applyDirectMeta({
      title: 'Docs',
      titleTemplate: 'Acme',
    })

    expect(warnSpy).toHaveBeenCalledOnce()
    expect(warnSpy.mock.calls[0]?.[0]).toContain(
      'titleTemplate should contain "%s"'
    )
    warnSpy.mockRestore()
  })

  it('adds and removes dynamic meta tags from signal arrays', async () => {
    const [meta, setMeta] = createSignal([
      { name: 'robots', content: 'index,follow' },
    ])

    applyDirectMeta({ meta })
    await flushReactiveUpdates()

    expect(
      document.head
        .querySelector('meta[name="robots"]')
        ?.getAttribute('content')
    ).toBe('index,follow')

    setMeta([
      { name: 'robots', content: 'index,follow' },
      { property: 'theme-color', content: '#111111' },
    ])
    await flushReactiveUpdates()

    expect(
      document.head
        .querySelector('meta[property="theme-color"]')
        ?.getAttribute('content')
    ).toBe('#111111')

    setMeta([{ property: 'theme-color', content: '#222222' }])
    await flushReactiveUpdates()

    expect(document.head.querySelector('meta[name="robots"]')).toBeNull()
    expect(
      document.head
        .querySelector('meta[property="theme-color"]')
        ?.getAttribute('content')
    ).toBe('#222222')
  })

  it('replaces managed meta array without leaving orphaned tags', async () => {
    const [meta, setMeta] = createSignal([
      { name: 'robots', content: 'index,follow' },
      { property: 'theme-color', content: '#111111' },
    ])

    applyDirectMeta({ meta })
    await flushReactiveUpdates()

    setMeta([
      { name: 'description', content: 'fresh description' },
      { httpEquiv: 'x-ua-compatible', content: 'ie=edge' },
    ])
    await flushReactiveUpdates()

    const managed = Array.from(
      document.head.querySelectorAll('meta[data-tachui-meta-managed="true"]')
    )
    expect(managed).toHaveLength(2)
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull()
    expect(document.head.querySelector('meta[property="theme-color"]')).toBeNull()
    expect(
      document.head
        .querySelector('meta[name="description"]')
        ?.getAttribute('content')
    ).toBe('fresh description')
    expect(
      document.head
        .querySelector('meta[http-equiv="x-ua-compatible"]')
        ?.getAttribute('content')
    ).toBe('ie=edge')
  })

  it('updates title and meta in the same reactive cycle', async () => {
    const [title, setTitle] = createSignal('Alpha')
    const [meta, setMeta] = createSignal([
      { name: 'robots', content: 'index,follow' },
    ])

    applyDirectMeta({
      title,
      meta,
    })
    await flushReactiveUpdates()

    setTitle('Beta')
    setMeta([{ name: 'robots', content: 'noindex,nofollow' }])
    await flushReactiveUpdates()

    expect(document.title).toBe('Beta')
    expect(
      document.head
        .querySelector('meta[name="robots"]')
        ?.getAttribute('content')
    ).toBe('noindex,nofollow')
  })

  it('supports reactive meta field accessors in array entries', async () => {
    const [description, setDescription] = createSignal('description-a')
    const [themeColor, setThemeColor] = createSignal('#111111')
    const meta = [
      { name: 'description', content: description },
      { property: 'theme-color', content: themeColor },
    ]

    applyDirectMeta({ meta })
    await flushReactiveUpdates()

    expect(
      document.head
        .querySelector('meta[name="description"]')
        ?.getAttribute('content')
    ).toBe('description-a')
    expect(
      document.head
        .querySelector('meta[property="theme-color"]')
        ?.getAttribute('content')
    ).toBe('#111111')

    setDescription('description-b')
    setThemeColor('#222222')
    await flushReactiveUpdates()

    expect(
      document.head
        .querySelector('meta[name="description"]')
        ?.getAttribute('content')
    ).toBe('description-b')
    expect(
      document.head
        .querySelector('meta[property="theme-color"]')
        ?.getAttribute('content')
    ).toBe('#222222')
  })

  it('clears managed meta tags when setMeta([]) is applied', async () => {
    const [meta, setMeta] = createSignal([
      { name: 'robots', content: 'index,follow' },
      { property: 'theme-color', content: '#111111' },
    ])

    applyDirectMeta({ meta })
    await flushReactiveUpdates()
    expect(
      document.head.querySelectorAll('meta[data-tachui-meta-managed="true"]')
    ).toHaveLength(2)

    setMeta([])
    await flushReactiveUpdates()

    expect(
      document.head.querySelectorAll('meta[data-tachui-meta-managed="true"]')
    ).toHaveLength(0)
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull()
    expect(document.head.querySelector('meta[property="theme-color"]')).toBeNull()
  })

  it('warns when a meta entry has no identifier fields', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    applyDirectMeta({
      meta: [{ content: 'missing-key' } as any],
    })
    await flushReactiveUpdates()

    expect(warnSpy).toHaveBeenCalled()
    expect(warnSpy.mock.calls[0]?.[0]).toContain('missing name/property/httpEquiv/charset')
    warnSpy.mockRestore()
  })
})
