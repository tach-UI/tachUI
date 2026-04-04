import type { FragmentConfig } from './types'

const fragmentConfig: Required<FragmentConfig> = {
  onHydrationError(error, context) {
    console.error('[tachui/fragments] hydration error:', error, context)
  },
}

export function configureFragments(options: FragmentConfig): void {
  if (options.onHydrationError) {
    fragmentConfig.onHydrationError = options.onHydrationError
  }
}

export function getFragmentConfig(): Required<FragmentConfig> {
  return fragmentConfig
}
