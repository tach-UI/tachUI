import type { ComponentInstance, DOMNode } from '@tachui/core'

export interface ModifierBuilderLike {
  build: () => SSRNodeInput
}

export type SSRNodeInput =
  | ComponentInstance
  | DOMNode
  | ModifierBuilderLike
  | string
  | number
  | boolean
  | null
  | undefined
  | SSRNodeInput[]

export interface RenderToStringOptions {
  includeDoctype?: boolean
  /**
   * Optional context used to collect `<head>` contributions from asset resolution.
   */
  context?: SSRContext
}

export interface SSRContext {
  /**
   * Complete `<link ...>` tag strings to be inserted into `<head>`.
   */
  links: string[]
  /**
   * Complete CSS blocks/rules (for example `@font-face` or `:root{...}`), not declarations.
   * Entries are wrapped in `<style>` by the default prerender document.
   */
  styles: string[]
  /**
   * Complete `<meta ...>` tag strings to be inserted into `<head>`.
   */
  meta: string[]
}

export interface PrerenderRoute {
  path: string
  title?: string
  render: () => SSRNodeInput
}

export interface PrerenderOptions {
  outDir: string
  document?: (html: string, route: PrerenderRoute, context: SSRContext) => string
}

export interface PrerenderResult {
  routePath: string
  outputPath: string
  html: string
}
