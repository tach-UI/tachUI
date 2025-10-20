declare module '@tachui/devtools/debug' {
  export interface DebugManager {
    isEnabled(): boolean
  }

  export function enableDebug(options?: Record<string, unknown>): void

  export const debugManager: DebugManager
}
