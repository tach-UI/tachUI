/**
 * Debug Tools Stub - Lightweight Production Version
 *
 * Minimal debug tools for production builds.
 * Full implementation moved to @tachui/devtools package.
 */

export type ValidationDebugEventType =
  | 'validation-start'
  | 'validation-end'
  | 'validation-error'
  | 'validation-recovery'
  | 'component-mount'
  | 'component-update'
  | 'component-unmount'
  | 'cache-hit'
  | 'cache-miss'
  | 'performance-warning'

export interface DebugEvent {
  id: string
  type: ValidationDebugEventType
  timestamp: number
  componentType?: string
  componentId?: string
  message: string
  data?: any
}

export interface DebugSession {
  id: string
  startTime: number
  endTime?: number
  validationEvents: DebugEvent[]
  components: any[]
  errors: any[]
  performance: any
}

/**
 * Lightweight debug tools stub for production
 */
class ValidationDebuggerStub {
  private static instance: ValidationDebuggerStub

  static getInstance(): ValidationDebuggerStub {
    if (!this.instance) {
      this.instance = new ValidationDebuggerStub()
    }
    return this.instance
  }

  startSession(_sessionId?: string): string {
    return 'stub-session'
  }

  endSession(): DebugSession | null {
    return null
  }

  logEvent(
    _type: ValidationDebugEventType,
    _message: string,
    _data?: any
  ): void {
    // No-op in production stub
  }

  registerComponent(_component: any, _type: string, _props: any): string {
    return 'stub-component-id'
  }

  updateComponent(_componentId: string, _phase: string, _data?: any): void {
    // No-op in production stub
  }

  recordValidationError(_error: any, _componentId?: string): void {
    // No-op in production stub
  }

  recordValidationRecovery(
    _originalError: string,
    _strategy: string,
    _componentId?: string
  ): void {
    // No-op in production stub
  }

  addEventListener(
    _type: ValidationDebugEventType,
    _listener: (event: DebugEvent) => void
  ): void {
    // No-op in production stub
  }

  removeEventListener(
    _type: ValidationDebugEventType,
    _listener: Function
  ): void {
    // No-op in production stub
  }

  getSession(_sessionId: string): DebugSession | undefined {
    return undefined
  }

  getCurrentSession(): DebugSession | null {
    return null
  }

  getAllSessions(): DebugSession[] {
    return []
  }

  searchEvents(_criteria: any): DebugEvent[] {
    return []
  }

  analyzeComponent(_componentId: string): any {
    return null
  }

  generatePerformanceReport(): string {
    return 'Debug functionality moved to @tachui/devtools package'
  }

  clearDebugData(): void {
    // No-op in production stub
  }

  exportDebugData(): string {
    return JSON.stringify({
      note: 'Debug functionality moved to @tachui/devtools package',
    })
  }

  importDebugData(_jsonData: string): void {
    // No-op in production stub
  }
}

export const validationDebugger = ValidationDebuggerStub.getInstance()

export const ValidationDebugUtils = {
  startSession: (_sessionId?: string) => 'stub-session',
  endSession: () => null,
  logEvent: (
    _type: ValidationDebugEventType,
    _message: string,
    _data?: any
  ) => {},
  registerComponent: (_component: any, _type: string, _props: any) =>
    'stub-component-id',
  recordError: (_error: any, _componentId?: string) => {},
  recordRecovery: (
    _originalError: string,
    _strategy: string,
    _componentId?: string
  ) => {},
  getPerformanceReport: () =>
    'Debug functionality moved to @tachui/devtools package',
  searchEvents: (_criteria: any) => [],
  export: () =>
    JSON.stringify({
      note: 'Debug functionality moved to @tachui/devtools package',
    }),
  import: (_data: string) => {},
  clear: () => {},
  test: () => {
    console.info(
      'ℹ️ Debug tools test - using stub. Full functionality available in @tachui/devtools'
    )
  },
}
