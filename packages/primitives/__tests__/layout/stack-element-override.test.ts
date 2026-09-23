/**
 * Layout stacks rendered with an interactive element override
 */

import { renderComponent } from '@tachui/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Text } from '../../src/display/Text'
import { HStack, VStack, ZStack } from '../../src/layout/Stack'

describe('layout stack interactive element override', () => {
  let host: HTMLElement
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    host = document.createElement('div')
    document.body.appendChild(host)
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    host.remove()
    vi.restoreAllMocks()
  })

  it('renders HStack as a button with layout styling and no warning', () => {
    const btn = HStack({
      element: 'button',
      children: [Text('x', {})],
      spacing: 0,
    }).build()
    renderComponent(btn as never, host)

    const button = host.querySelector('button')
    expect(button).not.toBeNull()
    expect(button?.classList.contains('tachui-hstack')).toBe(true)
    expect(button?.style.display).toBe('flex')
    expect(button?.textContent).toContain('x')
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('stays quiet across repeated construction and rendering', () => {
    for (let index = 0; index < 5; index++) {
      const btn = HStack({
        element: 'button',
        children: [Text(`item ${index}`, {})],
      }).build()
      renderComponent(btn as never, host)
    }

    expect(host.querySelectorAll('button')).toHaveLength(5)
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('renders VStack and ZStack as anchors without warning', () => {
    for (const Stack of [VStack, ZStack]) {
      const link = Stack({
        element: 'a',
        href: '/docs',
        children: [Text('docs', {})],
      } as never).build()
      renderComponent(link as never, host)
    }

    expect(host.querySelectorAll('a')).toHaveLength(2)
    expect(warnSpy).not.toHaveBeenCalled()
  })
})
