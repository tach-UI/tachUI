import { beforeEach, describe, expect, it } from 'vitest'
import { HStack, Text, VStack } from '../../src'
import { Image } from '../../src/display/Image'
import { ImageAsset, mountComponentTree, setTheme } from '@tachui/core'

async function flushReactiveUpdates(): Promise<void> {
  await new Promise<void>(resolve => queueMicrotask(resolve))
  await new Promise<void>(resolve => setTimeout(resolve, 0))
}

describe('Image Component - multi-image asset association', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    setTheme('light')
  })

  it('keeps distinct image sources for sibling ImageAsset components', async () => {
    const themedLogo = ImageAsset.init({
      name: 'themedLogo',
      default: '/logo-light.svg',
      light: '/logo-light.svg',
      dark: '/logo-dark.svg',
    })

    const staticLogo = ImageAsset.init({
      name: 'staticLogo',
      default: '/logo-static.svg',
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

    await flushReactiveUpdates()

    const themed = container.querySelector('img[alt="Themed Logo"]')
    const staticImg = container.querySelector('img[alt="Static Logo"]')
    expect(themed).not.toBeNull()
    expect(staticImg).not.toBeNull()
    expect(themed!.getAttribute('data-component-id')).toBeTruthy()
    expect(staticImg!.getAttribute('data-component-id')).toBeTruthy()
    expect(themed!.getAttribute('data-component-id')).not.toBe(
      staticImg!.getAttribute('data-component-id')
    )
    expect(themed!.getAttribute('src')).toContain('/logo-light.svg')
    expect(staticImg!.getAttribute('src')).toContain('/logo-static.svg')

    cleanup()
  })

  it('updates only themed image src when theme changes with sibling images present', async () => {
    const themedLogo = ImageAsset.init({
      name: 'themedLogo',
      default: '/logo-light.svg',
      light: '/logo-light.svg',
      dark: '/logo-dark.svg',
    })

    const staticLogo = ImageAsset.init({
      name: 'staticLogo',
      default: '/logo-static.svg',
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

    await flushReactiveUpdates()

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
    await flushReactiveUpdates()

    expect(themed!.getAttribute('src')).toContain('/logo-dark.svg')
    expect(staticImg!.getAttribute('src')).toContain('/logo-static.svg')
 
    cleanup()
  })

  it('updates a themed image inside stack/text layout', async () => {
    const themedLogo = ImageAsset.init({
      name: 'stackThemedLogo',
      default: '/stack-logo-light.svg',
      light: '/stack-logo-light.svg',
      dark: '/stack-logo-dark.svg',
    })

    const root = VStack({
      children: [
        Text('Header'),
        HStack({
          children: [
            Image(themedLogo, { alt: 'Stack Themed Logo' }).scaledToFit().frame(24, 24),
            Text('Middle'),
          ],
          spacing: 6,
          alignment: 'center',
        }),
        Text('Footer'),
      ],
      spacing: 10,
      alignment: 'leading',
    })

    const container = document.createElement('div')
    document.body.appendChild(container)
    const cleanup = mountComponentTree(root as any, container)

    await flushReactiveUpdates()

    const themed = container.querySelector('img[alt="Stack Themed Logo"]')
    expect(themed).not.toBeNull()
    expect(themed!.getAttribute('data-component-id')).toBeTruthy()
    expect(container.textContent).toContain('Header')
    expect(container.textContent).toContain('Middle')
    expect(container.textContent).toContain('Footer')
    expect(themed!.getAttribute('src')).toContain('/stack-logo-light.svg')

    setTheme('dark')
    await flushReactiveUpdates()

    expect(themed!.getAttribute('src')).toContain('/stack-logo-dark.svg')

    cleanup()
  })
})
