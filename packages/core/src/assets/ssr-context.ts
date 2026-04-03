export interface SSRAssetHeadCollector {
  addLink: (tag: string) => void
  addStyle: (styleContent: string) => void
  addMeta: (tag: string) => void
}

const SSR_ASSET_HEAD_COLLECTOR_KEY = Symbol.for('tachui.ssr.assetHeadCollector')

type GlobalScopeWithCollector = typeof globalThis & {
  [SSR_ASSET_HEAD_COLLECTOR_KEY]?: SSRAssetHeadCollector
}

export function getSSRAssetHeadCollector(): SSRAssetHeadCollector | undefined {
  return (globalThis as GlobalScopeWithCollector)[SSR_ASSET_HEAD_COLLECTOR_KEY]
}

export function withSSRAssetHeadCollector<T>(
  collector: SSRAssetHeadCollector | undefined,
  callback: () => T
): T {
  // This binding is intentionally scoped to synchronous render execution.
  // It is not async-context-safe across overlapping asynchronous render flows.
  const scope = globalThis as GlobalScopeWithCollector
  const previous = scope[SSR_ASSET_HEAD_COLLECTOR_KEY]

  if (collector) {
    scope[SSR_ASSET_HEAD_COLLECTOR_KEY] = collector
  } else {
    delete scope[SSR_ASSET_HEAD_COLLECTOR_KEY]
  }

  try {
    return callback()
  } finally {
    if (previous) {
      scope[SSR_ASSET_HEAD_COLLECTOR_KEY] = previous
    } else {
      delete scope[SSR_ASSET_HEAD_COLLECTOR_KEY]
    }
  }
}
