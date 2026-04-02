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
  context?: SSRContext
}

export interface SSRContext {
  links: string[]
  styles: string[]
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
