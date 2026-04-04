import type { ComponentInstance, DOMNode, FragmentMarker } from '@tachui/core/runtime/types'
import type { PrerenderRoute as SSRPrerenderRoute, SSRContext } from '@tachui/ssr'

export interface FragmentSnapshotHandlers {
  get: () => Record<string, unknown>
  restore?: (snapshot: Record<string, unknown>) => void
}

export interface FragmentErrorContext {
  phase: 'resolve' | 'restore' | 'hydrate'
  componentId?: string
  componentName?: string
}

export interface FragmentConfig {
  onHydrationError?: (error: Error, context: FragmentErrorContext) => void
}

export interface FragmentRegistration {
  name: string
  component: () => ComponentInstance
}

export interface FragmentRuntimeManifest {
  [componentId: string]: string
}

export type SerializedFragment = FragmentMarker

export interface FragmentPrerenderRoute extends SSRPrerenderRoute {}

export interface FragmentPrerenderOptions {
  outDir: string
  interactive?: boolean
  runtimeScriptSrc?: string
  document?: (
    html: string,
    route: FragmentPrerenderRoute,
    context: SSRContext,
    fragmentManifest: FragmentRuntimeManifest,
    runtimeTags: string[]
  ) => string
}

export interface FragmentPrerenderResult {
  routePath: string
  outputPath: string
  html: string
  fragmentManifest: FragmentRuntimeManifest
}

export interface InteractiveProps {
  children?: DOMNode | DOMNode[]
  componentName?: string
}
