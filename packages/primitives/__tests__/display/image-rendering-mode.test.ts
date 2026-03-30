import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Image, __resetImageTemplateCacheForTests } from '../../src/display/Image'
import { HStack } from '../../src/layout/Stack'
import { ImageAsset, createSignal, mountComponentTree, setTheme } from '@tachui/core'

async function flushReactiveUpdates(): Promise<void> {
  await new Promise<void>(resolve => queueMicrotask(resolve))
  await new Promise<void>(resolve => setTimeout(resolve, 0))
}

describe('Image renderingMode', () => {
  const cleanups: Array<() => void> = []

  beforeEach(() => {
    document.body.innerHTML = ''
    setTheme('light')
  })

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.()
    }
    __resetImageTemplateCacheForTests()
    vi.restoreAllMocks()
  })

  function mountImage(image: unknown, container: HTMLElement): void {
    const cleanup = mountComponentTree(image as any, container)
    cleanups.push(cleanup)
  }

  it('keeps original mode behavior as img by default', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const image = Image('/assets/logo.svg', { alt: 'Logo' })
    mountImage(image, container)

    const img = container.querySelector('img.tachui-image')
    expect(img).not.toBeNull()
    expect(img?.getAttribute('src')).toBe('/assets/logo.svg')
    expect(img?.getAttribute('alt')).toBe('Logo')
  })

  it('renders inline svg in template mode and strips unsafe markup', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () =>
        '<svg viewBox="0 0 10 10"><script>alert(1)</script><path d="M0 0L10 10" fill="currentColor"/></svg>',
    } as Response)

    const container = document.createElement('div')
    document.body.appendChild(container)

    const image = Image('/assets/logo.svg', {
      alt: 'Logo',
      renderingMode: 'template',
    }).foregroundColor('rgb(89, 217, 219)')
    mountImage(image, container)
    await flushReactiveUpdates()

    const templateContainer = container.querySelector('span.tachui-image-template')
    expect(templateContainer).not.toBeNull()
    expect(templateContainer?.getAttribute('role')).toBe('img')
    expect(templateContainer?.getAttribute('aria-label')).toBe('Logo')
    expect(templateContainer?.getAttribute('style') ?? '').toContain('color: rgb(89, 217, 219)')
    expect(templateContainer?.innerHTML.toLowerCase()).toContain('<svg')
    expect(templateContainer?.innerHTML.toLowerCase()).not.toContain('<script')

    const svg = templateContainer?.querySelector('svg')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
    expect(svg?.getAttribute('focusable')).toBe('false')
  })

  it('uses decorative semantics in template mode', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => '<svg viewBox="0 0 10 10"><path d="M0 0L10 10"/></svg>',
    } as Response)

    const container = document.createElement('div')
    document.body.appendChild(container)

    const image = Image('/assets/logo.svg', {
      alt: '',
      renderingMode: 'template',
    })
    mountImage(image, container)
    await flushReactiveUpdates()

    const templateContainer = container.querySelector('span.tachui-image-template')
    expect(templateContainer?.getAttribute('aria-hidden')).toBe('true')
    expect(templateContainer?.hasAttribute('aria-label')).toBe(false)
  })

  it('fires onError when template fetch fails', async () => {
    const onError = vi.fn()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => '',
    } as Response)

    const container = document.createElement('div')
    document.body.appendChild(container)

    const image = Image('/assets/logo.svg', {
      alt: 'Logo',
      renderingMode: 'template',
      onError,
    })
    mountImage(image, container)
    await flushReactiveUpdates()

    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('ignores stale fetch results when theme source changes', async () => {
    let resolveLight: ((value: Response) => void) | null = null
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(
      (input: RequestInfo | URL) =>
        new Promise<Response>(resolve => {
          const url = String(input)
          if (url.includes('light.svg')) {
            resolveLight = resolve
            return
          }
          resolve({
            ok: true,
            text: async () =>
              '<svg viewBox="0 0 10 10"><path d="M0 0L10 10" id="dark"/></svg>',
          } as Response)
        })
    )

    const asset = ImageAsset.init({
      name: 'themedLogo',
      default: '/assets/light.svg',
      light: '/assets/light.svg',
      dark: '/assets/dark.svg',
    })

    const container = document.createElement('div')
    document.body.appendChild(container)

    const image = Image(asset, {
      alt: 'Themed logo',
      renderingMode: 'template',
    })
    mountImage(image, container)
    await flushReactiveUpdates()

    setTheme('dark')
    await flushReactiveUpdates()

    resolveLight?.({
      ok: true,
      text: async () =>
        '<svg viewBox="0 0 10 10"><path d="M0 0L10 10" id="light"/></svg>',
    } as Response)
    await flushReactiveUpdates()

    const markup = container.querySelector('span.tachui-image-template')?.innerHTML ?? ''
    expect(markup).toContain('id="dark"')
    expect(markup).not.toContain('id="light"')
    expect(fetchSpy).toHaveBeenCalled()
  })

  it('fires onLoadStart before fetch and onLoad after successful injection', async () => {
    const callOrder: string[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      callOrder.push('fetch')
      return {
        ok: true,
        text: async () => '<svg viewBox="0 0 10 10"><path d="M0 0L10 10"/></svg>',
      } as Response
    })

    const onLoadStart = vi.fn(() => callOrder.push('start'))
    const onLoad = vi.fn(() => callOrder.push('load'))

    const container = document.createElement('div')
    document.body.appendChild(container)

    mountImage(
      Image('/assets/logo.svg', {
        alt: 'Logo',
        renderingMode: 'template',
        onLoadStart,
        onLoad,
      }),
      container
    )

    await flushReactiveUpdates()

    expect(onLoadStart).toHaveBeenCalledTimes(1)
    expect(onLoad).toHaveBeenCalledTimes(1)
    expect(callOrder.indexOf('start')).toBeLessThan(callOrder.indexOf('fetch'))
    expect(callOrder.indexOf('fetch')).toBeLessThan(callOrder.indexOf('load'))
  })

  it('updates aria-label when alt signal changes in template mode', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => '<svg viewBox="0 0 10 10"><path d="M0 0L10 10"/></svg>',
    } as Response)

    const [alt, setAlt] = createSignal('Initial alt')
    const container = document.createElement('div')
    document.body.appendChild(container)

    mountImage(
      Image('/assets/logo.svg', {
        alt,
        renderingMode: 'template',
      }),
      container
    )
    await flushReactiveUpdates()

    const templateContainer = container.querySelector('span.tachui-image-template')
    expect(templateContainer?.getAttribute('aria-label')).toBe('Initial alt')

    setAlt('Updated alt')
    await flushReactiveUpdates()
    expect(templateContainer?.getAttribute('aria-label')).toBe('Updated alt')
  })

  it('uses customSanitizer when provided', async () => {
    const rawMarkup = '<svg viewBox="0 0 10 10"><path d="M0 0L10 10"/></svg>'
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => rawMarkup,
    } as Response)

    const customSanitizer = vi.fn((_markup: string) => {
      return '<svg viewBox="0 0 1 1"><path id="custom" d="M0 0L1 1"/></svg>'
    })

    const container = document.createElement('div')
    document.body.appendChild(container)

    mountImage(
      Image('/assets/logo.svg', {
        alt: 'Logo',
        renderingMode: 'template',
        customSanitizer,
      }),
      container
    )
    await flushReactiveUpdates()

    expect(customSanitizer).toHaveBeenCalledWith(rawMarkup)
    expect(container.querySelector('span.tachui-image-template')?.innerHTML).toContain(
      'id="custom"'
    )
  })

  it('warns in development for unsupported template props', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => '<svg viewBox="0 0 10 10"><path d="M0 0L10 10"/></svg>',
    } as Response)

    const container = document.createElement('div')
    document.body.appendChild(container)

    mountImage(
      Image('/assets/logo.svg', {
        alt: 'Logo',
        renderingMode: 'template',
        loadingStrategy: 'eager',
        decoding: 'sync',
        fetchPriority: 'high',
        crossOrigin: 'anonymous',
      }),
      container
    )
    await flushReactiveUpdates()

    expect(warnSpy).toHaveBeenCalled()
    expect(warnSpy.mock.calls[0]?.[0]).toContain(
      'Image(template): unsupported props ignored:'
    )
  })

  it('keeps sibling original and template images isolated in HStack', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => '<svg viewBox="0 0 10 10"><path d="M0 0L10 10"/></svg>',
    } as Response)

    const logoMark = ImageAsset.init({
      name: 'logoMark',
      default: '/sample/assets/pelly2-386.png',
      light: '/sample/assets/pelly2-386.png',
      dark: '/sample/assets/pelly2-386.png',
    })
    const logoText = ImageAsset.init({
      name: 'logoText',
      default: '/sample/assets/waypod-base.svg',
      light: '/sample/assets/waypod-base.svg',
      dark: '/sample/assets/waypod-base.svg',
    })

    const container = document.createElement('div')
    document.body.appendChild(container)

    mountImage(
      HStack({
        children: [
          Image(logoMark, { alt: 'Pelly' }).scaledToFit().frame(44, 44),
          Image(logoText, { alt: 'Waypod', renderingMode: 'template' })
            .foregroundColor('rgb(89, 217, 219)')
            .frame(84, 24),
        ],
        spacing: 16,
        alignment: 'center',
      }),
      container
    )
    await flushReactiveUpdates()

    const img = container.querySelector('img.tachui-image')
    const template = container.querySelector('span.tachui-image-template')

    expect(img).not.toBeNull()
    expect(template).not.toBeNull()
    expect(img?.getAttribute('src')).toBe('/sample/assets/pelly2-386.png')
    expect(img?.getAttribute('alt')).toBe('Pelly')
    expect(template?.getAttribute('aria-label')).toBe('Waypod')
    expect(template?.innerHTML.toLowerCase()).toContain('<svg')
  })
})
