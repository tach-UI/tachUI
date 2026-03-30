import { describe, it, expect } from 'vitest'
import { mountComponentTree } from '@tachui/core'
import { Text, VStack } from '@tachui/primitives'
import { NavigationStack } from '../src/navigation-stack'
import { NavigationView } from '../src/navigation-view'

describe('Navigation Root Rendering Regression', () => {
  const mountAndReadText = (component: unknown): { text: string; cleanup: () => void; container: HTMLDivElement } => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const cleanup = mountComponentTree(component as never, container)
    return { text: container.textContent ?? '', cleanup, container }
  }

  it('renders unbuilt VStack root in NavigationStack without object stringification', () => {
    const root = VStack({
      children: [Text('Hello Stack Root').build()],
      spacing: 0,
      alignment: 'leading',
    })

    const { text, cleanup, container } = mountAndReadText(
      NavigationStack(root, {
        navigationBarHidden: true,
        navigationTitle: 'Stack',
      })
    )

    expect(text).toContain('Hello Stack Root')
    expect(text).not.toContain('[object Object]')

    cleanup()
    container.remove()
  })

  it('renders chained modifiable root in NavigationStack', () => {
    const root = VStack({
      children: [Text('Chained Stack Root').build()],
      spacing: 0,
      alignment: 'leading',
    })
      .padding(12)
      .backgroundColor('#f8f8f8')

    const { text, cleanup, container } = mountAndReadText(
      NavigationStack(root, {
        navigationBarHidden: true,
      })
    )

    expect(text).toContain('Chained Stack Root')
    expect(text).not.toContain('[object Object]')

    cleanup()
    container.remove()
  })

  it('renders built root in NavigationStack', () => {
    const root = VStack({
      children: [Text('Built Stack Root').build()],
      spacing: 0,
      alignment: 'leading',
    }).build()

    const { text, cleanup, container } = mountAndReadText(
      NavigationStack(root, {
        navigationBarHidden: true,
      })
    )

    expect(text).toContain('Built Stack Root')
    expect(text).not.toContain('[object Object]')

    cleanup()
    container.remove()
  })

  it('maintains root normalization parity for NavigationView', () => {
    const root = VStack({
      children: [Text('Hello View Root').build()],
      spacing: 0,
      alignment: 'leading',
    })

    const { text, cleanup, container } = mountAndReadText(
      NavigationView(root, {
        navigationBarHidden: true,
        navigationTitle: 'View',
      })
    )

    expect(text).toContain('Hello View Root')
    expect(text).not.toContain('[object Object]')

    cleanup()
    container.remove()
  })

  it('renders function destination root in NavigationStack', () => {
    const { text, cleanup, container } = mountAndReadText(
      NavigationStack(
        () =>
          VStack({
            children: [Text('Function Stack Root').build()],
            spacing: 0,
            alignment: 'leading',
          }).build(),
        {
          navigationBarHidden: true,
        }
      )
    )

    expect(text).toContain('Function Stack Root')
    expect(text).not.toContain('[object Object]')

    cleanup()
    container.remove()
  })
})
