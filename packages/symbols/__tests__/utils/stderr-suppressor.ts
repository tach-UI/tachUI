/**
 * Comprehensive stderr suppression for tests
 * This utility provides multiple methods to suppress unwanted stderr output during testing
 */

class StderrSuppressionManager {
  private originalStderrWrite: typeof process.stderr.write
  private isActive = false
  
  constructor() {
    this.originalStderrWrite = process.stderr.write.bind(process.stderr)
  }

  /**
   * Start suppressing stderr output
   */
  suppress() {
    if (this.isActive) return

    this.isActive = true
    
    // Completely suppress stderr by redirecting to void
    process.stderr.write = ((chunk: any, encoding?: any, callback?: any) => {
      // Simply ignore all stderr output during tests
      if (typeof callback === 'function') {
        callback()
      }
      return true
    }) as any
  }

  /**
   * Restore original stderr behavior
   */
  restore() {
    if (!this.isActive) return
    
    process.stderr.write = this.originalStderrWrite
    this.isActive = false
  }

  /**
   * Temporarily suppress stderr for a function call
   */
  async withSuppression<T>(fn: () => T | Promise<T>): Promise<T> {
    this.suppress()
    try {
      return await fn()
    } finally {
      this.restore()
    }
  }
}

// Global instance
export const stderrSuppressor = new StderrSuppressionManager()

// Auto-start suppression for test environment
if (typeof global !== 'undefined' && global.process?.env?.NODE_ENV === 'test') {
  stderrSuppressor.suppress()
}

// Auto-start suppression for vitest environment
if (typeof globalThis !== 'undefined' && globalThis.process?.env?.VITEST) {
  stderrSuppressor.suppress()
}