/**
 * The worked example from the shapes design: a verification ring drawn as a
 * stroked, inset Circle in an overlay, the composition the DSAvatar port
 * needs (#302).
 *
 * jsdom does no layout, so the ResizeObserver is stubbed and reports the
 * host's size the way the browser would once the overlay layer has sized the
 * shape to the host bounds.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushSync } from '@tachui/core'
import { renderComponent } from '@tachui/core/runtime'
import { Text } from '../../src'
import { Circle } from '../../src/shapes'
import {
  installResizeObserverStub,
  resizeAll,
  uninstallResizeObserverStub,
} from '../shapes/resize-observer-stub'

async function flushReactiveUpdates(): Promise<void> {
  flushSync()
  await new Promise<void>(resolve => queueMicrotask(resolve))
}

describe('a stroked, inset Circle in an overlay', () => {
  beforeEach(() => {
    installResizeObserverStub()
  })

  afterEach(() => {
    uninstallResizeObserverStub()
  })

  it('draws the verification ring inside the avatar edge', async () => {
    const dimension = 40
    const verificationTint = 'rgb(0, 122, 255)'

    const avatar = Text('WH')
      .frame({ width: dimension, height: dimension })
      .clipShape('circle')
      .overlay(Circle().inset(1).stroke(verificationTint, 2))

    const container = document.createElement('div')
    renderComponent(avatar as any, container)

    const host = container.querySelector('.tachui-text') as HTMLElement
    expect(host).not.toBeNull()
    expect(host.style.width).toBe('40px')
    expect(host.style.clipPath).not.toBe('')

    // The overlay is a layer over the host, and the shape fills it.
    const layer = host.querySelector(
      '[style*="position: absolute"]'
    ) as HTMLElement
    expect(layer).not.toBeNull()
    const shape = layer.querySelector('.tachui-shape-circle') as HTMLElement
    expect(shape).not.toBeNull()
    expect(shape.style.width).toBe('100%')
    expect(shape.style.height).toBe('100%')

    const path = shape.querySelector('path') as SVGPathElement
    expect(path.getAttribute('stroke')).toBe(verificationTint)
    expect(path.getAttribute('stroke-width')).toBe('2')
    expect(path.getAttribute('fill')).toBe('none')

    // Once the layer has sized the shape to the host, the ring is 1px inside
    // the 40px edge: radius 19, centered, with the 2px stroke spanning
    // radius 18 to 20 and nothing clipped by the frame.
    resizeAll(dimension, dimension)
    await flushReactiveUpdates()

    expect(path.getAttribute('d')).toBe(
      'M 39 20 A 19 19 0 1 1 1 20 A 19 19 0 1 1 39 20 Z'
    )
  })
})
