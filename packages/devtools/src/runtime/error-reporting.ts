/**
 * Error Reporting and Logging System (Phase 3.2.3)
 *
 * Advanced error reporting, logging, and analytics for TachUI.
 * Provides structured logging, error aggregation, and reporting pipelines.
 */

import { createSignal } from '@tachui/core'
import {
  type ErrorCategory,
  type ErrorSeverity,
  globalErrorManager,
  type TachUIError,
} from './error-boundary'

/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

/**
 * Log entry structure
 */
export interface LogEntry {
  id: string
  timestamp: number
  level: LogLevel
  message: string
  category?: string
  componentId?: string
  componentName?: string
  context?: Record<string, any>
  stack?: string
  userAgent?: string
  url?: string
  userId?: string
  sessionId?: string
  tags?: string[]
}

/**
 * Error aggregation data
 */
export interface ErrorAggregation {
  id: string
  message: string
  category: ErrorCategory
  severity: ErrorSeverity
  count: number
  firstSeen: number
  lastSeen: number
  affectedComponents: string[]
  samples: TachUIError[]
  fingerprint: string
}

/**
 * Logger interface
 */
export interface Logger {
  debug(message: string, context?: Record<string, any>): void
  info(message: string, context?: Record<string, any>): void
  warn(message: string, context?: Record<string, any>): void
  error(message: string, context?: Record<string, any>): void
  fatal(message: string, context?: Record<string, any>): void
  log(level: LogLevel, message: string, context?: Record<string, any>): void
}

/**
 * Report destination interface
 */
export interface ReportDestination {
  name: string
  send(data: LogEntry[] | ErrorAggregation[]): Promise<void>
  isEnabled(): boolean
}

/**
 * Reporting configuration
 */
export interface ReportingConfig {
  enabled: boolean
  logLevel: LogLevel
  batchSize: number
  batchTimeout: number
  aggregationWindow: number
  maxRetries: number
  destinations: ReportDestination[]
  enableContextCapture: boolean
  enableStackTrace: boolean
  enableUserTracking: boolean
  enableSessionTracking: boolean
  sensitiveKeys: string[]
  enableCompression: boolean
}

/**
 * Structured logger implementation
 */
export class StructuredLogger implements Logger {
  private entries: LogEntry[] = []
  private config: ReportingConfig
  private sessionId: string
  private userId?: string

  // Reactive state
  private entriesSignal: () => LogEntry[]
  private setEntries: (value: LogEntry[]) => void

  constructor(config: Partial<ReportingConfig> = {}) {
    this.config = {
      enabled: true,
      logLevel: 'info',
      batchSize: 50,
      batchTimeout: 30000, // 30 seconds
      aggregationWindow: 300000, // 5 minutes
      maxRetries: 3,
      destinations: [],
      enableContextCapture: true,
      enableStackTrace: true,
      enableUserTracking: false,
      enableSessionTracking: true,
      sensitiveKeys: ['password', 'token', 'apiKey', 'secret'],
      enableCompression: false,
      ...config,
    }

    // Initialize reactive state
    const [entriesSignal, setEntries] = createSignal<LogEntry[]>([])
    this.entriesSignal = entriesSignal
    this.setEntries = setEntries

    this.sessionId = this.generateSessionId()
    this.setupBatchProcessing()
  }

  /**
   * Debug level logging
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context)
  }

  /**
   * Info level logging
   */
  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context)
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context)
  }

  /**
   * Error level logging
   */
  error(message: string, context?: Record<string, any>): void {
    this.log('error', message, context)
  }

  /**
   * Fatal level logging
   */
  fatal(message: string, context?: Record<string, any>): void {
    this.log('fatal', message, context)
  }

  /**
   * Generic logging method
   */
  log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (!this.config.enabled || !this.shouldLog(level)) {
      return
    }

    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      level,
      message,
      context: this.sanitizeContext(context),
      userAgent:
        typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userId: this.userId,
      sessionId: this.sessionId,
      stack: this.config.enableStackTrace ? new Error().stack : undefined,
    }

    this.addEntry(entry)

    // Console logging in development
    if (typeof console !== 'undefined') {
      const consoleLevel = level === 'fatal' ? 'error' : level
      const consoleFn = (console as any)[consoleLevel] || console.log
      consoleFn(`[${level.toUpperCase()}] ${message}`, context || '')
    }
  }

  /**
   * Check if should log at given level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal']
    const currentLevelIndex = levels.indexOf(this.config.logLevel)
    const requestedLevelIndex = levels.indexOf(level)

    return requestedLevelIndex >= currentLevelIndex
  }

  /**
   * Add log entry
   */
  private addEntry(entry: LogEntry): void {
    this.entries.push(entry)
    this.setEntries([...this.entries])

    // Limit entries array size
    if (this.entries.length > 1000) {
      this.entries = this.entries.slice(-500)
      this.setEntries([...this.entries])
    }
  }

  /**
   * Sanitize context to remove sensitive data
   */
  private sanitizeContext(
    context?: Record<string, any>
  ): Record<string, any> | undefined {
    if (!context || !this.config.enableContextCapture) return undefined

    const sanitized = { ...context }

    for (const key of this.config.sensitiveKeys) {
      if (key in sanitized) {
        sanitized[key] = '[REDACTED]'
      }
    }

    return sanitized
  }

  /**
   * Setup batch processing
   */
  private setupBatchProcessing(): void {
    setInterval(() => {
      this.flushBatch()
    }, this.config.batchTimeout)
  }

  /**
   * Flush current batch of log entries
   */
  private async flushBatch(): Promise<void> {
    if (this.entries.length === 0) return

    const batch = this.entries.splice(0, this.config.batchSize)

    for (const destination of this.config.destinations) {
      if (destination.isEnabled()) {
        try {
          await this.sendWithRetry(destination, batch)
        } catch (error) {
          console.error(`Failed to send logs to ${destination.name}:`, error)
        }
      }
    }
  }

  /**
   * Send data with retry logic
   */
  private async sendWithRetry(
    destination: ReportDestination,
    data: LogEntry[]
  ): Promise<void> {
    let lastError: Error

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        await destination.send(data)
        return
      } catch (error) {
        lastError = error as Error

        if (attempt < this.config.maxRetries) {
          await this.sleep(2 ** attempt * 1000) // Exponential backoff
        }
      }
    }

    throw lastError!
  }

  /**
   * Sleep for specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string): void {
    if (this.config.enableUserTracking) {
      this.userId = userId
    }
  }

  /**
   * Get log entries
   */
  getEntries(): LogEntry[] {
    return [...this.entries]
  }

  /**
   * Get entries signal
   */
  getEntriesSignal(): () => LogEntry[] {
    return this.entriesSignal
  }

  /**
   * Add destination
   */
  addDestination(destination: ReportDestination): void {
    this.config.destinations.push(destination)
  }

  /**
   * Remove destination
   */
  removeDestination(name: string): void {
    this.config.destinations = this.config.destinations.filter(
      d => d.name !== name
    )
  }

  /**
   * Clear all log entries
   */
  clear(): void {
    this.entries.length = 0
    this.setEntries([])
  }
}

/**
 * Error aggregator
 */
export class ErrorAggregator {
  private aggregations = new Map<string, ErrorAggregation>()
  private config: ReportingConfig

  // Reactive state
  private aggregationsSignal: () => ErrorAggregation[]
  private setAggregations: (value: ErrorAggregation[]) => void

  constructor(config: Partial<ReportingConfig> = {}) {
    this.config = {
      enabled: true,
      logLevel: 'error',
      batchSize: 10,
      batchTimeout: 60000, // 1 minute
      aggregationWindow: 300000, // 5 minutes
      maxRetries: 3,
      destinations: [],
      enableContextCapture: true,
      enableStackTrace: true,
      enableUserTracking: false,
      enableSessionTracking: true,
      sensitiveKeys: [],
      enableCompression: true,
      ...config,
    }

    // Initialize reactive state
    const [aggregationsSignal, setAggregations] = createSignal<
      ErrorAggregation[]
    >([])
    this.aggregationsSignal = aggregationsSignal
    this.setAggregations = setAggregations

    this.setupCleanup()
  }

  /**
   * Aggregate error
   */
  aggregateError(error: TachUIError): void {
    const fingerprint = this.generateFingerprint(error)
    const existing = this.aggregations.get(fingerprint)

    if (existing) {
      existing.count++
      existing.lastSeen = error.timestamp
      existing.samples.push(error)

      // Keep only recent samples
      if (existing.samples.length > 5) {
        existing.samples = existing.samples.slice(-5)
      }

      if (
        error.componentId &&
        !existing.affectedComponents.includes(error.componentId)
      ) {
        existing.affectedComponents.push(error.componentId)
      }
    } else {
      const aggregation: ErrorAggregation = {
        id: fingerprint,
        message: error.message,
        category: error.category,
        severity: error.severity,
        count: 1,
        firstSeen: error.timestamp,
        lastSeen: error.timestamp,
        affectedComponents: error.componentId ? [error.componentId] : [],
        samples: [error],
        fingerprint,
      }

      this.aggregations.set(fingerprint, aggregation)
    }

    this.setAggregations(Array.from(this.aggregations.values()))
  }

  /**
   * Generate error fingerprint for grouping
   */
  private generateFingerprint(error: TachUIError): string {
    // Create a consistent hash based on error characteristics
    const components = [
      error.category,
      error.message.replace(/\d+/g, 'N'), // Replace numbers with N
      error.componentName || 'unknown',
    ]

    return components.join('|')
  }

  /**
   * Setup cleanup of old aggregations
   */
  private setupCleanup(): void {
    setInterval(() => {
      this.cleanupOldAggregations()
    }, this.config.aggregationWindow)
  }

  /**
   * Cleanup old aggregations
   */
  private cleanupOldAggregations(): void {
    const cutoff = Date.now() - this.config.aggregationWindow

    for (const [fingerprint, aggregation] of this.aggregations) {
      if (aggregation.lastSeen < cutoff) {
        this.aggregations.delete(fingerprint)
      }
    }

    this.setAggregations(Array.from(this.aggregations.values()))
  }

  /**
   * Get aggregations
   */
  getAggregations(): ErrorAggregation[] {
    return Array.from(this.aggregations.values())
  }

  /**
   * Get aggregations signal
   */
  getAggregationsSignal(): () => ErrorAggregation[] {
    return this.aggregationsSignal
  }

  /**
   * Get top errors by count
   */
  getTopErrors(limit: number = 10): ErrorAggregation[] {
    return Array.from(this.aggregations.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  /**
   * Clear aggregations
   */
  clear(): void {
    this.aggregations.clear()
    this.setAggregations([])
  }
}

/**
 * Built-in report destinations
 */
export const reportDestinations = {
  /**
   * Console destination
   */
  console: {
    name: 'console',
    async send(data: LogEntry[] | ErrorAggregation[]): Promise<void> {
      console.group('TachUI Report')
      data.forEach(entry => {
        if ('level' in entry) {
          console.log(`[${entry.level}] ${entry.message}`, entry.context || '')
        } else {
          console.log(`Error: ${entry.message} (${entry.count} times)`)
        }
      })
      console.groupEnd()
    },
    isEnabled(): boolean {
      return typeof console !== 'undefined'
    },
  } as ReportDestination,

  /**
   * Local storage destination
   */
  localStorage: {
    name: 'localStorage',
    async send(data: LogEntry[] | ErrorAggregation[]): Promise<void> {
      try {
        const key =
          'level' in data[0] ? 'tachui_logs' : 'tachui_error_aggregations'
        const existing = JSON.parse(localStorage.getItem(key) || '[]')
        const combined = [...existing, ...data]

        // Keep only last 100 entries
        if (combined.length > 100) {
          combined.splice(0, combined.length - 100)
        }

        localStorage.setItem(key, JSON.stringify(combined))
      } catch (error) {
        console.error('Failed to save to localStorage:', error)
      }
    },
    isEnabled(): boolean {
      return typeof localStorage !== 'undefined'
    },
  } as ReportDestination,

  /**
   * Create HTTP destination
   */
  createHttpDestination(endpoint: string, apiKey?: string): ReportDestination {
    return {
      name: 'http',
      async send(data: LogEntry[] | ErrorAggregation[]): Promise<void> {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        }

        if (apiKey) {
          headers.Authorization = `Bearer ${apiKey}`
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            type: 'level' in data[0] ? 'logs' : 'error_aggregations',
            data,
            timestamp: Date.now(),
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      },
      isEnabled(): boolean {
        return typeof fetch !== 'undefined'
      },
    }
  },

  /**
   * Create webhook destination
   */
  createWebhookDestination(
    webhookUrl: string,
    options: {
      format?: 'slack' | 'discord' | 'teams' | 'generic'
      onlyErrors?: boolean
    } = {}
  ): ReportDestination {
    const formatForSlack = (data: (LogEntry | ErrorAggregation)[]): any => {
      const blocks = data.slice(0, 5).map(entry => {
        if ('level' in entry) {
          return {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${entry.level.toUpperCase()}*: ${entry.message}`,
            },
          }
        } else {
          return {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Error*: ${entry.message} (${entry.count} occurrences)`,
            },
          }
        }
      })

      return { blocks }
    }

    const formatForDiscord = (data: (LogEntry | ErrorAggregation)[]): any => {
      const description = data
        .slice(0, 5)
        .map(entry => {
          if ('level' in entry) {
            return `**${entry.level.toUpperCase()}**: ${entry.message}`
          } else {
            return `**Error**: ${entry.message} (${entry.count} times)`
          }
        })
        .join('\n')

      return {
        embeds: [
          {
            title: 'TachUI Report',
            description,
            color: 0xff0000,
          },
        ],
      }
    }

    return {
      name: 'webhook',
      async send(data: LogEntry[] | ErrorAggregation[]): Promise<void> {
        const filteredData = options.onlyErrors
          ? data.filter(
              entry =>
                ('level' in entry &&
                  ['error', 'fatal'].includes(entry.level)) ||
                'count' in entry
            )
          : data

        if (filteredData.length === 0) return

        let payload: any

        switch (options.format) {
          case 'slack':
            payload = formatForSlack(filteredData)
            break
          case 'discord':
            payload = formatForDiscord(filteredData)
            break
          default:
            payload = { data: filteredData }
        }

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error(`Webhook failed: ${response.status}`)
        }
      },
      isEnabled(): boolean {
        return typeof fetch !== 'undefined'
      },
    }
  },
}

/**
 * Global logger instance
 */
export const globalLogger = new StructuredLogger({
  logLevel: 'info',
  destinations: [reportDestinations.console],
})

/**
 * Global error aggregator
 */
export const globalErrorAggregator = new ErrorAggregator()

/**
 * Setup error reporting integration
 */
export function setupErrorReporting(
  config: Partial<ReportingConfig> = {}
): void {
  // Configure logger by creating a new instance with merged config
  // Note: This assumes globalLogger has a way to get current config or we need to refactor
  // For now, we'll skip the config merge since there's no public API for it

  // TODO: Implement config usage once StructuredLogger has a public configure method
  void config // Silence unused parameter warning

  // Setup error aggregation
  globalErrorManager.addHandler((error: TachUIError) => {
    globalErrorAggregator.aggregateError(error)
    globalLogger.error(error.message, {
      category: error.category,
      severity: error.severity,
      componentId: error.componentId,
      componentName: error.componentName,
      context: error.context,
    })
  })
}

/**
 * Reporting utilities
 */
export const reportingUtils = {
  /**
   * Setup development reporting
   */
  setupDevelopment(): void {
    setupErrorReporting({
      logLevel: 'debug',
      enableStackTrace: true,
      enableContextCapture: true,
      destinations: [
        reportDestinations.console,
        reportDestinations.localStorage,
      ],
    })
  },

  /**
   * Setup production reporting
   */
  setupProduction(config: {
    endpoint?: string
    apiKey?: string
    webhookUrl?: string
    logLevel?: LogLevel
  }): void {
    const destinations: ReportDestination[] = []

    if (config.endpoint) {
      destinations.push(
        reportDestinations.createHttpDestination(config.endpoint, config.apiKey)
      )
    }

    if (config.webhookUrl) {
      destinations.push(
        reportDestinations.createWebhookDestination(config.webhookUrl, {
          format: 'slack',
          onlyErrors: true,
        })
      )
    }

    setupErrorReporting({
      logLevel: config.logLevel || 'warn',
      enableStackTrace: false,
      enableContextCapture: false,
      destinations,
    })
  },

  /**
   * Create custom logger
   */
  createLogger(name: string, config?: Partial<ReportingConfig>): Logger {
    const logger = new StructuredLogger(config)

    // Wrap methods to include logger name
    const originalLog = logger.log.bind(logger)
    logger.log = (
      level: LogLevel,
      message: string,
      context?: Record<string, any>
    ) => {
      originalLog(level, `[${name}] ${message}`, context)
    }

    return logger
  },

  /**
   * Get error report
   */
  getErrorReport(): {
    logs: LogEntry[]
    aggregations: ErrorAggregation[]
    statistics: any
  } {
    return {
      logs: globalLogger.getEntries(),
      aggregations: globalErrorAggregator.getAggregations(),
      statistics: globalErrorManager.getStatistics(),
    }
  },
}
