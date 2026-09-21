/**
 * Link Component Tests
 */

import { afterEach, describe, expect, it } from 'vitest'
import { createSignal, renderComponent } from '@tachui/core'
import { Link } from '../../src/controls/Link'

describe('Link', () => {
  const mounted: Array<() => void> = []

  function mount(component: unknown) {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const dispose = renderComponent(component as never, host)
    mounted.push(() => {
      dispose()
      host.remove()
    })
    return host
  }

  const flush = () => new Promise(resolve => setTimeout(resolve, 0))

  afterEach(() => {
    while (mounted.length > 0) mounted.pop()!()
  })

  it('merges the css prop into the rendered anchor', () => {
    const host = mount(Link({ destination: 'x.html', text: 'hi', css: 'ms-probe' }))

    const anchor = host.querySelector('a')!
    expect(anchor.classList.contains('ms-probe')).toBe(true)
    expect(anchor.classList.contains('tachui-link')).toBe(true)
  })

  it('carries the base class on its own', () => {
    const host = mount(Link({ destination: 'x.html', text: 'hi' }))

    expect(host.querySelector('a')!.className).toBe('tachui-link')
  })

  it('takes an array of classes', () => {
    const host = mount(
      Link({ destination: 'x.html', text: 'hi', css: ['one', 'two'] })
    )

    const anchor = host.querySelector('a')!
    expect(anchor.classList.contains('one')).toBe(true)
    expect(anchor.classList.contains('two')).toBe(true)
  })

  it('follows a reactive css prop', async () => {
    const [state, setState] = createSignal('is-idle')
    const host = mount(
      Link({ destination: 'x.html', text: 'hi', css: state })
    )

    expect(host.querySelector('a')!.classList.contains('is-idle')).toBe(true)

    setState('is-active')
    await flush()

    const anchor = host.querySelector('a')!
    expect(anchor.classList.contains('is-active')).toBe(true)
    expect(anchor.classList.contains('is-idle')).toBe(false)
    // The base class is not something a caller's state can wash away.
    expect(anchor.classList.contains('tachui-link')).toBe(true)
  })

  it('still renders the attributes it always did', () => {
    const host = mount(
      Link({ destination: 'x.html', text: 'hi', css: 'ms-probe', target: '_blank' })
    )

    const anchor = host.querySelector('a')!
    expect(anchor.getAttribute('href')).toBe('x.html')
    expect(anchor.getAttribute('target')).toBe('_blank')
    expect(anchor.getAttribute('data-component')).toBe('enhanced-link')
  })
})
