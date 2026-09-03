/**
 * Shared helpers for the flow-control render tests.
 */

import { flushSync, h } from '@tachui/core'
import type { ComponentInstance, DOMNode } from '@tachui/core'

/**
 * Let a change reach the DOM.
 *
 * `flushSync` drains the signal queue, but an update can cross more than one
 * scheduler hop before it lands: a signal wakes the renderer's binding, whose
 * own writes can queue further work. The macrotask turns give each hop a chance
 * to run, and a spare one keeps the tests off the edge of the number that
 * happens to be enough today.
 */
export async function settle(): Promise<void> {
  flushSync()
  for (let i = 0; i < 3; i += 1) {
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

/** A component rendering one `span` with the given text. */
export function leaf(label: string): ComponentInstance {
  return {
    type: 'component',
    id: `leaf-${label}`,
    props: {},
    children: [],
    cleanup: [],
    render: () => [h('span', {}, label)],
  }
}

/**
 * A parent that re-renders on its own signal and mounts `child` inline.
 *
 * The child is hoisted — created once, outside the render — so a repeat render
 * of the *same* component instance is what is under test, rather than inline
 * composition building a new one each pass.
 */
export function reRenderingParent(
  child: ComponentInstance,
  bump: () => number
): ComponentInstance {
  return {
    type: 'component',
    id: 'parent',
    props: {},
    children: [],
    cleanup: [],
    render: () => {
      const node = h('div', { class: `pass-${bump()}` })
      const rendered = child.render()
      node.children = (
        Array.isArray(rendered) ? rendered : [rendered]
      ) as DOMNode[]
      return node
    },
  }
}

/** Render a component's first node with a fresh renderer and return its element. */
export function mountFirstNode(
  component: ComponentInstance,
  renderer: { render: (node: DOMNode) => unknown }
): HTMLElement {
  const rendered = component.render()
  const [node] = (Array.isArray(rendered) ? rendered : [rendered]) as DOMNode[]
  return renderer.render(node!) as HTMLElement
}
