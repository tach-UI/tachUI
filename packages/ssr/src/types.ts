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
}

export interface PrerenderRoute {
  path: string
  title?: string
  render: () => SSRNodeInput
}

export interface PrerenderOptions {
  outDir: string
  document?: (html: string, route: PrerenderRoute) => string
}

export interface PrerenderResult {
  routePath: string
  outputPath: string
  html: string
}
