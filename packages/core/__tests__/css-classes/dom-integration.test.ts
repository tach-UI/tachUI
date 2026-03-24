import { describe, it, expect } from 'vitest'
import { createSignal } from '../../src/reactive'
import { DOMCSSClassApplicator } from '../../src/css-classes/dom-integration'

describe('DOMCSSClassApplicator', () => {
  it('applies and disposes reactive class updates', async () => {
    const applicator = new DOMCSSClassApplicator()
    const element = { className: '' } as unknown as Element
    const [className, setClassName] = createSignal('initial')

    const dispose = applicator.applyReactiveCSSClasses(element, className)

    expect(element.className).toBe('initial')

    setClassName('updated')
    await new Promise(resolve => queueMicrotask(resolve))
    expect(element.className).toBe('updated')

    dispose()
    setClassName('after-dispose')
    await new Promise(resolve => queueMicrotask(resolve))
    expect(element.className).toBe('updated')
  })
})
