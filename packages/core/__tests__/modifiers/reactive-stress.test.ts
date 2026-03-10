import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerBasicModifiers } from '@tachui/modifiers'
import type { ModifierRegistry } from '@tachui/registry'
import { h } from '../../src/runtime'
import type { DOMNode } from '../../src/runtime/types'
import { applyModifiersToNode } from '../../src/modifiers'
import { BaseModifier, bindReactiveStyle } from '../../src/modifiers/base'
import type { ModifierContext } from '../../src/modifiers/types'
import { batch, createRoot, createSignal, flushSync } from '../../src/reactive'
import {
  createModifierApplySpy,
  createTestRegistry,
  getSubscriberCount,
} from '../../tools/testing/reactive-test-helpers'

type ModifierCall = {
  name: string
  args: any[]
}

type StressStyleProps = {
  accessor: () => any
  cssProperty: string
  updaterId: string
  defaultValue?: any
  coerce?: (value: any) => any
  throwWhen?: (value: any) => boolean
  orderToken?: string
  orderLog?: string[]
  spy?: ReturnType<typeof createModifierApplySpy>
}

class StressStyleModifier extends BaseModifier<StressStyleProps> {
  readonly type = 'stress-style'
  readonly priority = 100

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!(context.element instanceof HTMLElement)) {
      return undefined
    }

    bindReactiveStyle({
      element: context.element,
      accessor: this.properties.accessor,
      // Intentional for tests: explicit IDs let assertions target specific updater behavior.
      updaterId: this.properties.updaterId,
      updater: rawValue => {
        this.properties.spy?.track(this.properties.updaterId, rawValue)

        if (this.properties.orderLog && this.properties.orderToken) {
          this.properties.orderLog.push(this.properties.orderToken)
        }

        if (this.properties.throwWhen?.(rawValue)) {
          throw new Error(`stress modifier throw: ${this.properties.updaterId}`)
        }

        if (rawValue === null) {
          context.element.style.removeProperty(this.properties.cssProperty)
          return
        }

        let nextValue = rawValue
        if (nextValue === undefined && this.properties.defaultValue !== undefined) {
          nextValue = this.properties.defaultValue
        }
        if (this.properties.coerce) {
          nextValue = this.properties.coerce(nextValue)
        }

        context.element.style.setProperty(
          this.properties.cssProperty,
          String(nextValue)
        )
      },
    })

    return undefined
  }
}

const mountedDisposers = new Set<() => void>()
let componentIdCounter = 0

function mountWithModifiers(
  registry: ModifierRegistry,
  element: HTMLElement,
  modifierCalls: ModifierCall[]
): void {
  let disposeRoot: () => void = () => {}

  createRoot(dispose => {
    disposeRoot = dispose
    const node = h('div')
    node.element = element

    const modifiers = modifierCalls.map(({ name, args }) => {
      const factory = registry.get(name)
      if (!factory) {
        throw new Error(`Missing modifier factory in stress test registry: ${name}`)
      }
      return (factory as (...factoryArgs: any[]) => any)(...args)
    })

    componentIdCounter += 1
    applyModifiersToNode(node, modifiers, {
      componentId: `reactive-stress-test-${componentIdCounter}`,
      element,
      phase: 'creation',
    })
  })

  mountedDisposers.add(disposeRoot)
}

function waitForUpdate(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

describe('reactive modifier stress', () => {
  let registry: ModifierRegistry

  beforeEach(() => {
    document.body.innerHTML = ''
    componentIdCounter = 0
    registry = createTestRegistry()
    registerBasicModifiers({ registry })
    registry.register('stressStyle', (props: StressStyleProps) => {
      return new StressStyleModifier(props)
    })
  })

  afterEach(() => {
    mountedDisposers.forEach(dispose => dispose())
    mountedDisposers.clear()
    vi.restoreAllMocks()
  })

  describe('Volume', () => {
    it('100 components with one signal modifier all update under 500ms', async () => {
      const [size, setSize] = createSignal(10)
      const elements = Array.from({ length: 100 }, () => document.createElement('div'))

      elements.forEach(element => {
        mountWithModifiers(registry, element, [{ name: 'width', args: [size] }])
      })

      // Measure update path only for consistent comparison across volume tests.
      const start = performance.now()
      setSize(22)
      flushSync()
      await waitForUpdate()
      const duration = performance.now() - start

      elements.forEach(element => {
        expect(element.style.width).toBe('22px')
      })
      expect(duration).toBeLessThan(500)
    })

    it('one component with 20 reactive modifiers updates all properties under 500ms', async () => {
      const signals = Array.from({ length: 20 }, (_, index) => createSignal(index))
      const element = document.createElement('div')

      const calls: ModifierCall[] = signals.map(([accessor], index) => ({
        name: 'stressStyle',
        args: [
          {
            accessor,
            cssProperty: `--stress-${index}`,
            updaterId: `stress-20-${index}`,
          } satisfies StressStyleProps,
        ],
      }))

      mountWithModifiers(registry, element, calls)
      // Measure update path only for consistent comparison across volume tests.
      const start = performance.now()
      signals.forEach(([, setter], index) => {
        setter(index + 100)
      })
      flushSync()
      await waitForUpdate()
      const duration = performance.now() - start

      for (let index = 0; index < 20; index += 1) {
        expect(element.style.getPropertyValue(`--stress-${index}`)).toBe(
          String(index + 100)
        )
      }
      expect(duration).toBeLessThan(500)
    })

    it('one signal shared across 200 components updates all in one batch under 500ms', async () => {
      const [shared, setShared] = createSignal(1)
      const elements = Array.from({ length: 200 }, () => document.createElement('div'))

      elements.forEach(element => {
        mountWithModifiers(registry, element, [{ name: 'opacity', args: [shared] }])
      })

      // Measure update path only for consistent comparison across volume tests.
      const start = performance.now()
      batch(() => {
        setShared(0.4)
        setShared(0.75)
      })
      flushSync()
      await waitForUpdate()
      const duration = performance.now() - start

      elements.forEach(element => {
        expect(element.style.opacity).toBe('0.75')
      })
      expect(duration).toBeLessThan(500)
    })
  })

  describe('Rapid updates', () => {
    it('1000 synchronous updates converge to final DOM state', async () => {
      const [count, setCount] = createSignal(0)
      const element = document.createElement('div')
      mountWithModifiers(registry, element, [{ name: 'width', args: [count] }])

      for (let i = 1; i <= 1000; i += 1) {
        setCount(i)
      }
      flushSync()
      await waitForUpdate()

      expect(element.style.width).toBe('1000px')
    })

    it('1000 updates batched into 10 groups trigger 10 DOM mutations (not 1000)', async () => {
      const [count, setCount] = createSignal(0)
      const element = document.createElement('div')
      mountWithModifiers(registry, element, [{ name: 'width', args: [count] }])

      let mutationCount = 0
      const observer = new MutationObserver(records => {
        mutationCount += records.length
      })
      observer.observe(element, { attributes: true, attributeFilter: ['style'] })

      for (let group = 0; group < 10; group += 1) {
        batch(() => {
          for (let step = 1; step <= 100; step += 1) {
            setCount(group * 100 + step)
          }
        })
        flushSync()
        await waitForUpdate()
      }

      observer.disconnect()
      expect(element.style.width).toBe('1000px')
      expect(mutationCount).toBe(10)
    })

    it('two signals alternating 500 updates each remain uncorrupted', async () => {
      const [width, setWidth] = createSignal(0)
      const [height, setHeight] = createSignal(0)
      const element = document.createElement('div')

      mountWithModifiers(registry, element, [
        { name: 'width', args: [width] },
        { name: 'height', args: [height] },
      ])

      for (let i = 1; i <= 500; i += 1) {
        setWidth(i)
        setHeight(i * 2)
      }
      flushSync()
      await waitForUpdate()

      expect(element.style.width).toBe('500px')
      expect(element.style.height).toBe('1000px')
    })
  })

  describe('Modifier chain stability', () => {
    it('10-modifier chain updates only the targeted modifier per signal change', async () => {
      const signals = Array.from({ length: 10 }, (_, index) => createSignal(index))
      const element = document.createElement('div')

      mountWithModifiers(
        registry,
        element,
        signals.map(([accessor], index) => ({
          name: 'stressStyle',
          args: [
            {
              accessor,
              cssProperty: `--chain-${index}`,
              updaterId: `chain-${index}`,
            } satisfies StressStyleProps,
          ],
        }))
      )

      const baseline = Array.from({ length: 10 }, (_, index) =>
        element.style.getPropertyValue(`--chain-${index}`)
      )

      signals[4]?.[1](444)
      flushSync()
      await waitForUpdate()

      for (let index = 0; index < 10; index += 1) {
        const value = element.style.getPropertyValue(`--chain-${index}`)
        if (index === 4) {
          expect(value).toBe('444')
        } else {
          expect(value).toBe(baseline[index])
        }
      }
    })

    it('modifier chain re-evaluates in stable registration order', async () => {
      const [tick, setTick] = createSignal(0)
      const orderLog: string[] = []
      const orderSpy = createModifierApplySpy('order-chain')
      const tokens = Array.from({ length: 10 }, (_, index) => `m${index + 1}`)
      const element = document.createElement('div')

      mountWithModifiers(
        registry,
        element,
        tokens.map(token => ({
          name: 'stressStyle',
          args: [
            {
              accessor: tick,
              cssProperty: '--order',
              updaterId: `order-${token}`,
              orderToken: token,
              orderLog,
              spy: orderSpy,
              coerce: (value: number) => `${token}:${value}`,
            } satisfies StressStyleProps,
          ],
        }))
      )

      orderLog.length = 0
      orderSpy.reset()
      setTick(1)
      flushSync()
      await waitForUpdate()

      // Map preserves insertion order; this verifies we keep registration order stable.
      expect(orderLog).toEqual(tokens)
      expect(element.style.getPropertyValue('--order')).toBe('m10:1')
      expect(orderSpy.callCount).toBe(10)
    })
  })

  describe('Error resilience', () => {
    it('handles null signal values without throwing', async () => {
      const [value, setValue] = createSignal<number | null>(12)
      const element = document.createElement('div')

      mountWithModifiers(registry, element, [
        {
          name: 'stressStyle',
          args: [
            {
              accessor: value,
              cssProperty: '--nullable',
              updaterId: 'nullable',
            } satisfies StressStyleProps,
          ],
        },
      ])

      expect(() => {
        setValue(null)
        flushSync()
      }).not.toThrow()
      await waitForUpdate()
      expect(element.style.getPropertyValue('--nullable')).toBe('')
    })

    it('falls back to default value for undefined signal values', async () => {
      const [value, setValue] = createSignal<number | undefined>(3)
      const element = document.createElement('div')

      mountWithModifiers(registry, element, [
        {
          name: 'stressStyle',
          args: [
            {
              accessor: value,
              cssProperty: '--fallback',
              updaterId: 'fallback',
              defaultValue: 99,
            } satisfies StressStyleProps,
          ],
        },
      ])

      setValue(undefined)
      flushSync()
      await waitForUpdate()
      expect(element.style.getPropertyValue('--fallback')).toBe('99')
    })

    it('coerces wrong-type values cleanly', async () => {
      const [value, setValue] = createSignal<number | string>(10)
      const element = document.createElement('div')

      mountWithModifiers(registry, element, [
        {
          name: 'stressStyle',
          args: [
            {
              accessor: value,
              cssProperty: '--coerced',
              updaterId: 'coerced',
              coerce: (raw: number | string) => {
                const parsed =
                  typeof raw === 'number' ? raw : Number.parseFloat(raw)
                return Number.isFinite(parsed) ? parsed : 0
              },
            } satisfies StressStyleProps,
          ],
        },
      ])

      setValue('15.5')
      flushSync()
      await waitForUpdate()
      expect(element.style.getPropertyValue('--coerced')).toBe('15.5')

      setValue('bad-input')
      flushSync()
      await waitForUpdate()
      expect(element.style.getPropertyValue('--coerced')).toBe('0')
    })

    it('catches failing updater errors and keeps other modifiers updating', async () => {
      const [value, setValue] = createSignal('safe')
      const safeElement = document.createElement('div')
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mountWithModifiers(registry, safeElement, [
        {
          name: 'stressStyle',
          args: [
            {
              accessor: value,
              cssProperty: '--throwing',
              updaterId: 'throwing',
              throwWhen: (current: string) => current === 'boom',
            } satisfies StressStyleProps,
          ],
        },
        {
          name: 'stressStyle',
          args: [
            {
              accessor: value,
              cssProperty: '--safe',
              updaterId: 'safe',
            } satisfies StressStyleProps,
          ],
        },
      ])

      const baselineSubscribers = getSubscriberCount(value)

      expect(() => {
        setValue('boom')
        flushSync()
      }).not.toThrow()
      await waitForUpdate()
      expect(safeElement.style.getPropertyValue('--safe')).toBe('boom')
      expect(safeElement.style.getPropertyValue('--throwing')).toBe('safe')
      expect(errorSpy).toHaveBeenCalled()

      setValue('recovered')
      flushSync()
      await waitForUpdate()
      expect(safeElement.style.getPropertyValue('--safe')).toBe('recovered')
      expect(safeElement.style.getPropertyValue('--throwing')).toBe('recovered')
      expect(getSubscriberCount(value)).toBe(baselineSubscribers)
      errorSpy.mockRestore()
    })

    it('isolates mount-time updater throws and keeps sibling updaters active', async () => {
      const [value, setValue] = createSignal('boom')
      const element = document.createElement('div')
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        mountWithModifiers(registry, element, [
          {
            name: 'stressStyle',
            args: [
              {
                accessor: value,
                cssProperty: '--throwing-on-mount',
                updaterId: 'throwing-on-mount',
                throwWhen: (current: string) => current === 'boom',
              } satisfies StressStyleProps,
            ],
          },
          {
            name: 'stressStyle',
            args: [
              {
                accessor: value,
                cssProperty: '--safe-on-mount',
                updaterId: 'safe-on-mount',
              } satisfies StressStyleProps,
            ],
          },
        ])
      }).not.toThrow()

      expect(element.style.getPropertyValue('--safe-on-mount')).toBe('boom')
      expect(errorSpy).toHaveBeenCalled()

      setValue('recovered')
      flushSync()
      await waitForUpdate()
      expect(element.style.getPropertyValue('--safe-on-mount')).toBe('recovered')
      expect(element.style.getPropertyValue('--throwing-on-mount')).toBe('recovered')
      errorSpy.mockRestore()
    })
  })
})
