import { serializeToHTML } from './serializer'
import type { RenderToStringOptions, SSRNodeInput } from './types'

export function renderToString(
  input: SSRNodeInput,
  options: RenderToStringOptions = {}
): string {
  const html = serializeToHTML(input)
  if (options.includeDoctype) {
    return `<!doctype html>${html}`
  }
  return html
}
