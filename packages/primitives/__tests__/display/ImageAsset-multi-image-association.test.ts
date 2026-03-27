import { beforeEach, describe, expect, it } from 'vitest'
import { HStack } from '../../src'
import { Image } from '../../src/display/Image'
import { ImageAsset, mountComponentTree, setTheme } from '@tachui/core'

describe('Image Component - multi-image asset association', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    setTheme('light')
  })

  it('keeps distinct image sources for sibling ImageAsset components', async () => {
    const themedLogo = ImageAsset.init({
      name: 'themedLogo',
      default: '/sample/assets/waypod-colorized.svg',
      light: '/sample/assets/waypod-colorized.svg',
      dark: '/sample/assets/waypod-colorized-inverted.svg',
    })

    const staticLogo = ImageAsset.init({
      name: 'staticLogo',
      default: '/sample/assets/waypod-base.svg',
    })

    const root = HStack({
      children: [
        Image(themedLogo, { alt: 'Themed Logo' }).scaledToFit().frame(36, 36),
        Image(staticLogo, { alt: 'Static Logo' }).scaledToFit().height(24),
      ],
      spacing: 8,
      alignment: 'center',
    })

    const container = document.createElement('div')
    document.body.appendChild(container)
    const cleanup = mountComponentTree(root as any, container)

    await new Promise(resolve => queueMicrotask(resolve))

    const themed = container.querySelector('img[alt="Themed Logo"]')
    const staticImg = container.querySelector('img[alt="Static Logo"]')
    expect(themed).not.toBeNull()
    expect(staticImg).not.toBeNull()
    expect(themed!.getAttribute('data-component-id')).toBeTruthy()
    expect(staticImg!.getAttribute('data-component-id')).toBeTruthy()
    expect(themed!.getAttribute('data-component-id')).not.toBe(
      staticImg!.getAttribute('data-component-id')
    )
    expect(themed!.getAttribute('src')).toContain('/sample/assets/waypod-colorized.svg')
    expect(staticImg!.getAttribute('src')).toContain('/sample/assets/waypod-base.svg')

    cleanup()
  })

  it('updates only themed image src when theme changes with sibling images present', async () => {
    const themedLogo = ImageAsset.init({
      name: 'themedLogo',
      default: '/sample/assets/waypod-colorized.svg',
      light: '/sample/assets/waypod-colorized.svg',
      dark: '/sample/assets/waypod-colorized-inverted.svg',
    })

    const staticLogo = ImageAsset.init({
      name: 'staticLogo',
      default: '/sample/assets/waypod-base.svg',
    })

    const root = HStack({
      children: [
        Image(themedLogo, { alt: 'Themed Logo' }).scaledToFit().frame(36, 36),
        Image(staticLogo, { alt: 'Static Logo' }).scaledToFit().height(24),
      ],
      spacing: 8,
      alignment: 'center',
    })

    const container = document.createElement('div')
    document.body.appendChild(container)
    const cleanup = mountComponentTree(root as any, container)

    await new Promise(resolve => queueMicrotask(resolve))

    const themed = container.querySelector('img[alt="Themed Logo"]')
    const staticImg = container.querySelector('img[alt="Static Logo"]')
    expect(themed).not.toBeNull()
    expect(staticImg).not.toBeNull()
    expect(themed!.getAttribute('data-component-id')).toBeTruthy()
    expect(staticImg!.getAttribute('data-component-id')).toBeTruthy()
    expect(themed!.getAttribute('data-component-id')).not.toBe(
      staticImg!.getAttribute('data-component-id')
    )

    setTheme('dark')
    await new Promise(resolve => queueMicrotask(resolve))

    expect(themed!.getAttribute('src')).toContain(
      '/sample/assets/waypod-colorized-inverted.svg'
    )
    expect(staticImg!.getAttribute('src')).toContain('/sample/assets/waypod-base.svg')

    cleanup()
  })
})
