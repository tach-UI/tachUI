import { withSSRAssetHeadCollector } from '@tachui/core'
import { serializeToHTMLWithContext } from './serializer'
import type {
  RenderToStringOptions,
  SSRContext,
  SSRNodeInput,
} from './types'

export function createSSRContext(): SSRContext {
  return {
    links: [],
    styles: [],
    meta: [],
  }
}

export function renderToString(
  input: SSRNodeInput,
  options: RenderToStringOptions = {}
): string {
  const context = options.context ?? createSSRContext()
  const seenLinks = new Set(context.links)
  const seenStyles = new Set(context.styles)
  const seenMeta = new Set(context.meta)

  let html = ''
  withSSRAssetHeadCollector(
    {
      addLink(tag: string) {
        if (!seenLinks.has(tag)) {
          seenLinks.add(tag)
          context.links.push(tag)
        }
      },
      addStyle(styleContent: string) {
        if (!seenStyles.has(styleContent)) {
          seenStyles.add(styleContent)
          context.styles.push(styleContent)
        }
      },
      addMeta(tag: string) {
        if (!seenMeta.has(tag)) {
          seenMeta.add(tag)
          context.meta.push(tag)
        }
      },
    },
    () => {
      html = serializeToHTMLWithContext(input, context)
      return undefined
    }
  )

  if (options.includeDoctype) {
    return `<!doctype html>${html}`
  }
  return html
}
