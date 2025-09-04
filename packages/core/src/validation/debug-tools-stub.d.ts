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
declare class ValidationDebuggerStub {
  private static instance
  static getInstance(): ValidationDebuggerStub
  startSession(_sessionId?: string): string
  endSession(): DebugSession | null
  logEvent(_type: ValidationDebugEventType, _message: string, _data?: any): void
  registerComponent(_component: any, _type: string, _props: any): string
  updateComponent(_componentId: string, _phase: string, _data?: any): void
  recordValidationError(_error: any, _componentId?: string): void
  recordValidationRecovery(
    _originalError: string,
    _strategy: string,
    _componentId?: string
  ): void
  addEventListener(
    _type: ValidationDebugEventType,
    _listener: (event: DebugEvent) => void
  ): void
  removeEventListener(
    _type: ValidationDebugEventType,
    _listener: Function
  ): void
  getSession(_sessionId: string): DebugSession | undefined
  getCurrentSession(): DebugSession | null
  getAllSessions(): DebugSession[]
  searchEvents(_criteria: any): DebugEvent[]
  analyzeComponent(_componentId: string): any
  generatePerformanceReport(): string
  clearDebugData(): void
  exportDebugData(): string
  importDebugData(_jsonData: string): void
}
export declare const validationDebugger: ValidationDebuggerStub
export declare const ValidationDebugUtils: {
  startSession: (_sessionId?: string) => string
  endSession: () => null
  logEvent: (
    _type: ValidationDebugEventType,
    _message: string,
    _data?: any
  ) => void
  registerComponent: (_component: any, _type: string, _props: any) => string
  recordError: (_error: any, _componentId?: string) => void
  recordRecovery: (
    _originalError: string,
    _strategy: string,
    _componentId?: string
  ) => void
  getPerformanceReport: () => string
  searchEvents: (_criteria: any) => never[]
  export: () => string
  import: (_data: string) => void
  clear: () => void
  test: () => void
}

//# sourceMappingURL=debug-tools-stub.d.ts.map
