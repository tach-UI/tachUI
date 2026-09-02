/**
 * A symbol's load must not invalidate the component it sits in.
 *
 * `renderChildrenArray` calls a child's `render()` inline, inside the enclosing
 * component's render effect. Reading `isLoading`/`error`/`iconDefinition` there
 * subscribes that effect, so every icon that resolved re-rendered the whole
 * surrounding subtree — once per symbol on the screen, each one re-running its
 * siblings' renders too.
 *
 * `Symbol` therefore owns a root, reads its state inside it, and patches its
 * own mounted element. `render()` is untracked.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import { renderComponent, h } from '@tachui/core'
import { Symbol } from '../../src/components/Symbol.js'
import { IconLoader } from '../../src/utils/icon-loader.js'
import { IconSetRegistry } from '../../src/icon-sets/registry.js'
import { LucideIconSet } from '../../src/icon-sets/lucide.js'

/** Render `count` symbols inside one component, counting its renders. */
async function enclosingRenders(count: number): Promise<number> {
  const renders = vi.fn()
  const host = document.createElement('div')
  const names = ['chevron.right', 'star.fill', 'bell.fill', 'car.fill'].slice(0, count)

  const wrapper: any = {
    type: 'component',
    id: 'wrapper',
    props: {},
    children: [],
    cleanup: [],
    render: () => {
      renders()
      if (renders.mock.calls.length > 25) {
        throw new Error('enclosing component is re-rendering without settling')
      }
      const node = h('div', null) as any
      node.children = names.flatMap(name => (Symbol(name) as any).render())
      return node
    },
  }

  renderComponent(wrapper, host)
  await new Promise(resolve => setTimeout(resolve, 60))
  return renders.mock.calls.length
}

describe('a symbol load does not re-render its parent', () => {
  beforeEach(() => {
    IconSetRegistry.clear()
    IconSetRegistry.register(new LucideIconSet())
    IconLoader.clearCache()
  })

  test('one symbol', async () => {
    expect(await enclosingRenders(1)).toBe(1)
  })

  test('four symbols — the count does not scale with them', async () => {
    // The regression was one enclosing render per resolved icon.
    expect(await enclosingRenders(4)).toBe(1)
  })

  test('the icons still paint', async () => {
    const host = document.createElement('div')
    renderComponent(Symbol('chevron.right') as any, host)
    await new Promise(resolve => setTimeout(resolve, 60))

    expect(host.querySelector('svg')).not.toBeNull()
    expect(host.querySelector('.tachui-symbol__spinner')).toBeNull()
  })
})
