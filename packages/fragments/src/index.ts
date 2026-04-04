import { interactive, registerFragmentModifiers, snapshot } from './modifiers'

export { Interactive } from './interactive-component'
export { __resetFragmentConfigForTests, configureFragments } from './config'
export { interactive, registerFragmentModifiers, snapshot }
export { prerender } from './prerender'

registerFragmentModifiers()

export type {
  FragmentConfig,
  FragmentErrorContext,
  FragmentPrerenderOptions,
  FragmentPrerenderResult,
  FragmentPrerenderRoute,
  FragmentRuntimeManifest,
  FragmentSnapshotHandlers,
  InteractiveProps,
  SerializedFragment,
} from './types'
