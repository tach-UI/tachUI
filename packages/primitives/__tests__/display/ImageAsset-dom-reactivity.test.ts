import { beforeEach, describe, expect, it } from 'vitest'
import { Image } from '../../src/display/Image'
import { ImageAsset, mountComponentTree, setTheme } from '@tachui/core'

async function flushReactiveUpdates(): Promise<void> {
  await new Promise<void>(resolve => queueMicrotask(resolve))
  await new Promise<void>(resolve => setTimeout(resolve, 0))
}

describe('Image Component - ImageAsset DOM reactivity', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    setTheme('light')
  })

  it('updates rendered img src when theme changes', async () => {
    const imageAsset = ImageAsset.init({
      default: '/logo-light.png',
      light: '/logo-light.png',
      dark: '/logo-dark.png',
      name: 'testLogo',
    })

    const container = document.createElement('div')
    document.body.appendChild(container)

    const image = Image(imageAsset, { alt: 'Reactive logo' })
    const cleanup = mountComponentTree(image as any, container)

    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img!.getAttribute('src')).toContain('/logo-light.png')

    setTheme('dark')
    await flushReactiveUpdates()
    expect(img!.getAttribute('src')).toContain('/logo-dark.png')

    cleanup()
  })
})
