import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createSSRContext, renderToString } from './render-to-string'
import type {
  PrerenderOptions,
  PrerenderResult,
  PrerenderRoute,
  SSRContext,
} from './types'
import { escapeHTML } from './escape'

const UNSAFE_HEAD_ENTRY_PATTERN = /<\/(?:head|style)>|<script\b/i

function resolveOutputPath(outDir: string, routePath: string): string {
  if (routePath === '/' || routePath === '') {
    return path.join(outDir, 'index.html')
  }

  const clean = routePath.replace(/^\/+/, '').replace(/\/+$/, '')
  return path.join(outDir, clean, 'index.html')
}

function sanitizeHeadEntry(
  entry: string,
  routePath: string
): string | undefined {
  const trimmed = entry.trim()
  if (!trimmed) {
    return undefined
  }

  if (UNSAFE_HEAD_ENTRY_PATTERN.test(trimmed)) {
    console.warn(
      `[tachUI][prerender] Dropping unsafe head entry for route "${routePath}".`
    )
    return undefined
  }

  return trimmed
}

function buildHeadEntries(context: SSRContext, routePath: string): string[] {
  const entries: string[] = []

  for (const metaTag of context.meta) {
    const safeEntry = sanitizeHeadEntry(metaTag, routePath)
    if (safeEntry) {
      entries.push(safeEntry)
    }
  }

  for (const linkTag of context.links) {
    const safeEntry = sanitizeHeadEntry(linkTag, routePath)
    if (safeEntry) {
      entries.push(safeEntry)
    }
  }

  for (const styleBlock of context.styles) {
    const safeStyle = sanitizeHeadEntry(styleBlock, routePath)
    if (safeStyle) {
      entries.push(`<style>${safeStyle}</style>`)
    }
  }

  return entries
}

function defaultDocument(
  html: string,
  route: PrerenderRoute,
  context: SSRContext
): string {
  const title = escapeHTML(route.title ?? 'TachUI App')
  const headEntries = buildHeadEntries(context, route.path)

  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="UTF-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    `  <title>${title}</title>`,
    ...headEntries.map(entry => `  ${entry}`),
    '</head>',
    `<body><div id="app">${html}</div></body>`,
    '</html>',
  ].join('')
}

export async function prerender(
  routes: PrerenderRoute[],
  options: PrerenderOptions
): Promise<PrerenderResult[]> {
  if (!Array.isArray(routes) || routes.length === 0) {
    throw new Error('prerender requires at least one route definition.')
  }

  if (!options.outDir || options.outDir.trim().length === 0) {
    throw new Error('prerender requires a non-empty outDir.')
  }

  const results: PrerenderResult[] = []
  const renderDocument =
    options.document ??
    ((html: string, route: PrerenderRoute, context: SSRContext) =>
      defaultDocument(html, route, context))

  for (const route of routes) {
    try {
      const context = createSSRContext()
      const routeHtml = renderToString(route.render(), { context })
      const fullHtml = renderDocument(routeHtml, route, context)
      const outputPath = resolveOutputPath(options.outDir, route.path)

      await mkdir(path.dirname(outputPath), { recursive: true })
      await writeFile(outputPath, fullHtml, 'utf8')

      results.push({
        routePath: route.path,
        outputPath,
        html: fullHtml,
      })
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error)
      throw new Error(`prerender failed for route "${route.path}": ${details}`)
    }
  }

  return results
}
