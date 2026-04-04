import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createSSRContext, renderToString } from '@tachui/ssr'
import type { SSRContext } from '@tachui/ssr'
import type {
  FragmentPrerenderOptions,
  FragmentPrerenderResult,
  FragmentPrerenderRoute,
  FragmentRuntimeManifest,
  SerializedFragment,
} from './types'

const UNSAFE_HEAD_ENTRY_PATTERN = /<\/(?:head|style)>|<script\b/i

function escapeHTML(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function resolveOutputPath(outDir: string, routePath: string): string {
  if (routePath === '/' || routePath === '') {
    return path.join(outDir, 'index.html')
  }

  const clean = routePath.replace(/^\/+/, '').replace(/\/+$/, '')
  return path.join(outDir, clean, 'index.html')
}

function sanitizeHeadEntry(entry: string, routePath: string): string | undefined {
  const trimmed = entry.trim()
  if (!trimmed) {
    return undefined
  }

  if (UNSAFE_HEAD_ENTRY_PATTERN.test(trimmed)) {
    console.warn(
      `[tachUI/fragments] Dropping unsafe head entry for route "${routePath}".`
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
  route: FragmentPrerenderRoute,
  context: SSRContext,
  _fragmentManifest: FragmentRuntimeManifest,
  runtimeTags: string[]
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
    ...runtimeTags.map(tag => `  ${tag}`),
    '</head>',
    `<body><div id="app">${html}</div></body>`,
    '</html>',
  ].join('')
}

function buildRuntimeTags(
  interactive: boolean,
  manifest: FragmentRuntimeManifest,
  runtimeScriptSrc: string
): string[] {
  const fragmentCount = Object.keys(manifest).length
  if (!interactive || fragmentCount === 0) {
    return []
  }

  return [
    `<script id="tachui-fragment-manifest" type="application/json">${JSON.stringify(manifest)}</script>`,
    `<script type="module" src="${runtimeScriptSrc}" defer></script>`,
  ]
}

function buildManifest(fragments: SerializedFragment[]): FragmentRuntimeManifest {
  const manifest: FragmentRuntimeManifest = {}
  for (const fragment of fragments) {
    if (!fragment.componentId) continue
    manifest[fragment.componentId] = fragment.componentName
  }
  return manifest
}

export async function prerender(
  routes: FragmentPrerenderRoute[],
  options: FragmentPrerenderOptions
): Promise<FragmentPrerenderResult[]> {
  if (!Array.isArray(routes) || routes.length === 0) {
    throw new Error('prerender requires at least one route definition.')
  }

  if (!options.outDir || options.outDir.trim().length === 0) {
    throw new Error('prerender requires a non-empty outDir.')
  }

  const interactive = options.interactive ?? true
  const runtimeScriptSrc = options.runtimeScriptSrc ?? '/tachui-fragments-runtime.js'
  const renderDocument = options.document ?? defaultDocument

  const results: FragmentPrerenderResult[] = []

  for (const route of routes) {
    try {
      const context = createSSRContext() as SSRContext & {
        fragmentSerialization?: {
          interactive?: boolean
          onFragment?: (fragment: SerializedFragment) => void
        }
      }

      const serializedFragments: SerializedFragment[] = []
      context.fragmentSerialization = {
        interactive,
        onFragment(fragment) {
          serializedFragments.push(fragment)
        },
      }

      const routeHtml = renderToString(route.render(), {
        context,
        interactive,
      })
      const fragmentManifest = buildManifest(serializedFragments)
      const runtimeTags = buildRuntimeTags(interactive, fragmentManifest, runtimeScriptSrc)
      const fullHtml = renderDocument(routeHtml, route, context, fragmentManifest, runtimeTags)
      const outputPath = resolveOutputPath(options.outDir, route.path)

      await mkdir(path.dirname(outputPath), { recursive: true })
      await writeFile(outputPath, fullHtml, 'utf8')

      results.push({
        routePath: route.path,
        outputPath,
        html: fullHtml,
        fragmentManifest,
      })
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error)
      throw new Error(`prerender failed for route "${route.path}": ${details}`)
    }
  }

  return results
}
