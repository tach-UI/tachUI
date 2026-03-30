import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { renderToString } from './render-to-string'
import type { PrerenderOptions, PrerenderResult, PrerenderRoute } from './types'

function resolveOutputPath(outDir: string, routePath: string): string {
  if (routePath === '/' || routePath === '') {
    return path.join(outDir, 'index.html')
  }

  const clean = routePath.replace(/^\/+/, '').replace(/\/+$/, '')
  return path.join(outDir, clean, 'index.html')
}

function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function defaultDocument(html: string, route: PrerenderRoute): string {
  const title = escapeHTML(route.title ?? 'TachUI App')
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="UTF-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    `  <title>${title}</title>`,
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
    options.document ?? ((html: string, route: PrerenderRoute) => defaultDocument(html, route))

  for (const route of routes) {
    try {
      const routeHtml = renderToString(route.render())
      const fullHtml = renderDocument(routeHtml, route)
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
