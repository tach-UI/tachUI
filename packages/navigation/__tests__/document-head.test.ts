import { beforeEach, describe, expect, it } from 'vitest'
import { HTML } from '@tachui/primitives'
import { NavigationStack } from '../src/navigation-stack'
import {
  DocumentHead,
  extractDocumentHeadFromComponent,
  withDocumentHead,
} from '../src/document-head'

describe('Document head metadata', () => {
  beforeEach(() => {
    document.title = 'Base Title'
    document.head
      .querySelectorAll('meta[name="description"], link[rel="canonical"]')
      .forEach(node => node.remove())
  })

  it('cascades metadata from root to active stack entry', () => {
    const root = withDocumentHead(
      HTML.div({ children: 'Home' }).build(),
      {
        title: 'Home',
        titleTemplate: '%s — Acme',
        description: 'Default description',
      }
    )

    const stack = NavigationStack(root) as any
    const context = stack.navigationContext

    const detail = withDocumentHead(
      HTML.div({ children: 'Detail' }).build(),
      {
        title: 'Widget Pro',
        canonical: '/products/widget-pro',
      }
    )

    context.push(detail, '/products/widget-pro', 'Widget Pro')

    expect(document.title).toBe('Widget Pro — Acme')
    expect(
      document.head
        .querySelector('meta[name="description"]')
        ?.getAttribute('content')
    ).toBe('Default description')
    expect(
      document.head
        .querySelector('link[rel="canonical"]')
        ?.getAttribute('href')
    ).toBe('/products/widget-pro')

    context.pop()

    expect(document.title).toBe('Home — Acme')
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull()
  })

  it('supports attaching metadata with DocumentHead helper', () => {
    const component = HTML.div({ children: 'Page' }).build()
    const headedComponent = DocumentHead(
      { title: 'Page title', description: 'Page description' },
      component
    )

    const extracted = extractDocumentHeadFromComponent(headedComponent)

    expect(extracted?.title).toBe('Page title')
    expect(extracted?.description).toBe('Page description')
  })
})

