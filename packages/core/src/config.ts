export interface CoreFeatureFlags {
  proxyModifiers: boolean
}

const defaultFlags: CoreFeatureFlags = {
  proxyModifiers: true,
}

let featureFlags: CoreFeatureFlags = { ...defaultFlags }

export function configureCore(options: Partial<CoreFeatureFlags>): void {
  featureFlags = {
    ...featureFlags,
    ...options,
  }
}

export function getCoreFeatureFlags(): CoreFeatureFlags {
  return { ...featureFlags }
}

export function isProxyEnabled(): boolean {
  return featureFlags.proxyModifiers === true
}
