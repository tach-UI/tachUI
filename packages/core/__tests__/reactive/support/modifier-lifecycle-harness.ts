/**
 * Shared harness for the modifier lifecycle suites.
 *
 * Mounting a modifier through the low-level path is how these tests get a
 * deterministic lifecycle to assert subscription counts against, and two suites
 * now need it: the ordinary lifecycle tests, and the memory-tier subscription
 * checks that live under `memory/` so the tier's globs reach them.
 */

import { registerBasicModifiers } from '@tachui/modifiers'
import type { ModifierRegistry } from '@tachui/registry'

import { applyModifiersToNode } from '../../../src/modifiers'
import { BaseModifier as CoreBaseModifier } from '../../../src/modifiers/base'
import type { ModifierContext } from '../../../src/modifiers/types'
import { createRoot } from '../../../src/reactive'
import { h } from '../../../src/runtime'
import type { DOMNode } from '../../../src/runtime/types'
import { createTestRegistry } from '../../../tools/testing/reactive-test-helpers'

export type ModifierCall = { name: string; args: any[] }

export type MountedNode = {
  element: HTMLElement
  dispose: () => void
}

export class CoreWidthModifier extends CoreBaseModifier<{ value: any }> {
  readonly type = 'coreWidth'
  readonly priority = 100

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    this.applyStyles(context.element, { width: this.properties.value })
    return undefined
  }
}

/**
 * Everything a suite mounts, so a single `afterEach` can take it all down.
 *
 * Module state, which vitest scopes per test file, so two suites importing this
 * do not share a set.
 */
const mountedNodes = new Set<MountedNode>()
let componentIdCounter = 0

/** A registry with the basic modifiers plus the test-only `coreWidth`. */
export function createLifecycleRegistry(): ModifierRegistry {
  document.body.innerHTML = ''
  componentIdCounter = 0
  const registry = createTestRegistry()
  registerBasicModifiers({ registry })
  registry.register(
    'coreWidth',
    (value: any) => new CoreWidthModifier({ value })
  )
  return registry
}

export function mountWithModifiers(
  registry: ModifierRegistry,
  element: HTMLElement,
  calls: ModifierCall[]
): MountedNode {
  let disposeRoot: () => void = () => {}

  createRoot(dispose => {
    disposeRoot = dispose
    const node = h('div')
    // Intentional low-level path for deterministic modifier lifecycle testing.
    node.element = element

    const modifiers = calls.map(call => {
      const factory = registry.get(call.name)
      if (!factory) {
        throw new Error(`Missing modifier factory: ${call.name}`)
      }
      return (factory as (...args: any[]) => any)(...call.args)
    })

    componentIdCounter += 1
    applyModifiersToNode(node, modifiers, {
      componentId: `modifier-lifecycle-test-${componentIdCounter}`,
      element,
      phase: 'creation',
    })
  })

  const mounted: MountedNode = {
    element,
    dispose: () => disposeRoot(),
  }
  mountedNodes.add(mounted)
  return mounted
}

export function unmountMountedNode(node: MountedNode): void {
  node.dispose()
  mountedNodes.delete(node)
}

/** Tears down whatever a test left mounted. */
export function unmountAll(): void {
  mountedNodes.forEach(node => {
    node.dispose()
  })
  mountedNodes.clear()
}
