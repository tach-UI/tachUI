import { withSSRAssetHeadCollector } from '@tachui/core'
import { serializeToHTML } from './serializer'
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

  let html = ''
  withSSRAssetHeadCollector(
    {
      addLink(tag: string) {
        if (!context.links.includes(tag)) {
          context.links.push(tag)
        }
      },
      addStyle(styleContent: string) {
        if (!context.styles.includes(styleContent)) {
          context.styles.push(styleContent)
        }
      },
      addMeta(tag: string) {
        if (!context.meta.includes(tag)) {
          context.meta.push(tag)
        }
      },
    },
    () => {
      html = serializeToHTML(input)
      return undefined
    }
  )

  if (options.includeDoctype) {
    return `<!doctype html>${html}`
  }
  return html
}
