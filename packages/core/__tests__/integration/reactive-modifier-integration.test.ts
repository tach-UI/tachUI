import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h } from '../../src/runtime'
import { applyModifiersToNode, setExternalModifierRegistry } from '../../src/modifiers'
import { ColorAsset } from '@tachui/core'
import { createRoot, createComputed, createSignal, flushSync, setTheme } from '@tachui/core/reactive'
import {
  globalModifierRegistry,
  resetGlobalRegistry,
  type ModifierRegistry,
} from '@tachui/registry'
import { registerBasicModifiers } from '@tachui/modifiers'
import { registerFormsModifiers } from '@tachui/forms'
import { registerGridModifiers } from '@tachui/grid'
import { registerViewportModifiers } from '@tachui/viewport'
import { registerResponsiveModifiers } from '@tachui/responsive'

type RegisteredFactory = (...args: unknown[]) => unknown
const mountedDisposers = new Set<() => void>()

async function waitForReactiveUpdate(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0))
}

function applyRegisteredModifiers(
  registry: ModifierRegistry,
  element: HTMLElement,
  modifierCalls: Array<{ name: string; args: unknown[] }>
): void {
  createRoot(dispose => {
    mountedDisposers.add(dispose)
    const node = h('div')
    node.element = element

    const modifiers = modifierCalls.map(({ name, args }) => {
      const factory = registry.get(name) as RegisteredFactory | undefined
      if (!factory) {
        throw new Error(`Missing modifier factory in global registry: ${name}`)
      }
      return factory(...args)
    })

    applyModifiersToNode(node, modifiers as any, {
      componentId: `reactive-integration-${Math.random().toString(36).slice(2)}`,
      element,
      phase: 'creation',
    })
  })
}

describe('cross-package reactive modifier integration', () => {
  beforeEach(() => {
    resetGlobalRegistry()
    registerBasicModifiers({ registry: globalModifierRegistry, force: true })
    registerFormsModifiers({ registry: globalModifierRegistry, force: true })
    registerGridModifiers({ registry: globalModifierRegistry, force: true })
    registerViewportModifiers({ registry: globalModifierRegistry, force: true })
    registerResponsiveModifiers({ registry: globalModifierRegistry, force: true })
    setExternalModifierRegistry(globalModifierRegistry)
    setTheme('light')
  })

  afterEach(() => {
    mountedDisposers.forEach(dispose => dispose())
    mountedDisposers.clear()
  })

  it('theme signal updates ColorAsset-based foreground/background modifiers across 10 components', async () => {
    const textColor = ColorAsset.init({
      name: 'textColor',
      default: '#111111',
      light: '#111111',
      dark: '#f5f5f5',
    })
    const surfaceColor = ColorAsset.init({
      name: 'surfaceColor',
      default: '#ffffff',
      light: '#ffffff',
      dark: '#121212',
    })

    const elements = Array.from({ length: 10 }, () => document.createElement('div'))
    elements.forEach(element => {
      applyRegisteredModifiers(globalModifierRegistry, element, [
        { name: 'foregroundColor', args: [textColor] },
        { name: 'backgroundColor', args: [surfaceColor] },
      ])
    })

    elements.forEach(element => {
      expect(element.style.color).toBe('rgb(17, 17, 17)')
      expect(element.style.backgroundColor).toBe('rgb(255, 255, 255)')
    })

    setTheme('dark')
    flushSync()
    await waitForReactiveUpdate()

    elements.forEach(element => {
      expect(element.style.color).toBe('rgb(245, 245, 245)')
      expect(element.style.backgroundColor).toBe('rgb(18, 18, 18)')
    })
  })

  it('form completion signal automatically gates navigation-item disabled state', async () => {
    const navItem = document.createElement('a')
    const [stepComplete, setStepComplete] = createSignal(false)
    const navDisabled = createComputed(() => !stepComplete())

    applyRegisteredModifiers(globalModifierRegistry, navItem, [
      { name: 'disabled', args: [navDisabled] },
    ])
    expect(navItem.getAttribute('disabled')).toBe('true')

    setStepComplete(true)
    flushSync()
    await waitForReactiveUpdate()
    expect(navItem.getAttribute('disabled')).toBeNull()
  })

  it('button click signal updates three modifiers across different components without re-apply', async () => {
    const button = document.createElement('button')
    const panel = document.createElement('div')
    const badge = document.createElement('span')
    const [active, setActive] = createSignal(false)

    applyRegisteredModifiers(globalModifierRegistry, panel, [
      { name: 'opacity', args: [createComputed(() => (active() ? 1 : 0.4))] },
      {
        name: 'backgroundColor',
        args: [createComputed(() => (active() ? '#1f2937' : '#e5e7eb'))],
      },
    ])
    applyRegisteredModifiers(globalModifierRegistry, badge, [
      {
        name: 'foregroundColor',
        args: [createComputed(() => (active() ? '#ffffff' : '#111827'))],
      },
    ])

    button.addEventListener('click', () => setActive(!active()))
    button.click()
    flushSync()
    await waitForReactiveUpdate()

    expect(panel.style.opacity).toBe('1')
    expect(panel.style.backgroundColor).toBe('rgb(31, 41, 55)')
    expect(badge.style.color).toBe('rgb(255, 255, 255)')
  })

  it('three-level computed chain updates once after batched source signal changes', async () => {
    const element = document.createElement('div')
    const [isAdmin, setIsAdmin] = createSignal(false)
    const [hasPermission, setHasPermission] = createSignal(false)
    const allowEdit = createComputed(() => isAdmin() && hasPermission())
    const elevatedOpacity = createComputed(() => (allowEdit() ? 1 : 0.5))
    const updateSpy = vi.fn()
    const trackedOpacity = createComputed(() => {
      const next = elevatedOpacity()
      updateSpy(next)
      return next
    })

    applyRegisteredModifiers(globalModifierRegistry, element, [
      { name: 'opacity', args: [trackedOpacity] },
    ])
    expect(element.style.opacity).toBe('0.5')
    const baselineCalls = updateSpy.mock.calls.length

    setIsAdmin(true)
    setHasPermission(true)
    flushSync()
    await waitForReactiveUpdate()

    expect(element.style.opacity).toBe('1')
    expect(updateSpy.mock.calls.length - baselineCalls).toBe(1)
  })

  it('concurrent and async signal updates propagate to shared subscribers without re-apply', async () => {
    const first = document.createElement('div')
    const second = document.createElement('div')
    const [value, setValue] = createSignal(0)
    const sharedWidth = createComputed(() => value() * 10)

    applyRegisteredModifiers(globalModifierRegistry, first, [
      { name: 'width', args: [sharedWidth] },
    ])
    applyRegisteredModifiers(globalModifierRegistry, second, [
      { name: 'width', args: [sharedWidth] },
    ])

    setValue(2)
    setValue(3)
    flushSync()
    await waitForReactiveUpdate()
    expect(first.style.width).toBe('30px')
    expect(second.style.width).toBe('30px')

    await new Promise<void>(resolve => {
      setTimeout(() => {
        setValue(5)
        flushSync()
        resolve()
      }, 0)
    })
    await waitForReactiveUpdate()

    expect(first.style.width).toBe('50px')
    expect(second.style.width).toBe('50px')
  })
})
