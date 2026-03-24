const CORE_VERSION_FALLBACKS: Record<string, string> = {
  '0.8.8-alpha': '0.8.8-alpha',
  '0.8.7-alpha': '0.8.7-alpha',
  '0.8.6-alpha': '0.8.6-alpha',
}

const DEFAULT_CORE_VERSION = '0.8.8-alpha'

export function resolveCoreVersionFromMap(cliVersion: string | null): string {
  if (!cliVersion) {
    return DEFAULT_CORE_VERSION
  }
  return CORE_VERSION_FALLBACKS[cliVersion] ?? DEFAULT_CORE_VERSION
}

