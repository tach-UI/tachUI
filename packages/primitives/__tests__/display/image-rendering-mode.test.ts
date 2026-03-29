import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Image, __resetImageTemplateCacheForTests } from '../../src/display/Image'
import { ImageAsset, mountComponentTree, setTheme } from '@tachui/core'

async function flushReactiveUpdates(): Promise<void> {
  await new Promise<void>(resolve => queueMicrotask(resolve))
  await new Promise<void>(resolve => setTimeout(resolve, 0))
}

describe('Image renderingMode', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    __resetImageTemplateCacheForTests()
    setTheme('light')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('keeps original mode behavior as img by default', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const image = Image('/assets/logo.svg', { alt: 'Logo' })
    const cleanup = mountComponentTree(image as any, container)

    const img = container.querySelector('img.tachui-image')
    expect(img).not.toBeNull()
    expect(img?.getAttribute('src')).toBe('/assets/logo.svg')
    expect(img?.getAttribute('alt')).toBe('Logo')

    cleanup()
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
    const cleanup = mountComponentTree(image as any, container)
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

    cleanup()
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
    const cleanup = mountComponentTree(image as any, container)
    await flushReactiveUpdates()

    const templateContainer = container.querySelector('span.tachui-image-template')
    expect(templateContainer?.getAttribute('aria-hidden')).toBe('true')
    expect(templateContainer?.hasAttribute('aria-label')).toBe(false)

    cleanup()
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
    const cleanup = mountComponentTree(image as any, container)
    await flushReactiveUpdates()

    expect(onError).toHaveBeenCalledTimes(1)
    cleanup()
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
    const cleanup = mountComponentTree(image as any, container)
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

    cleanup()
  })
})
