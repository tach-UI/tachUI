/**
 * Utility to suppress expected error output during testing
 * This prevents confusing stderr messages for intentional error cases
 */

type ErrorSuppressionOptions = {
  suppressConsole?: boolean
  suppressStderr?: boolean
  patterns?: RegExp[]
}

const defaultPatterns = [
  /Failed to load icon/,
  /Cannot find package 'lucide\/dist\/esm\/icons\//,
  /ERR_MODULE_NOT_FOUND/,
  /Icon set .* not registered/,
  /Icon .* not found/,
  /does not exist/,
  /SF Symbol .* has no Lucide equivalent/,
  /Using fallback/,
  /Icon set error for/,
  /LucideIconSet\.loadIconInternal/,
  /heart-\d+/,
  /definitely-does-not-exist/,
  /non-existent/,
  /error-icon/,
  /undefined.*has no Lucide equivalent/,
  /VitestExecutor\._fetchModule/,
  /processTicksAndRejections/,
  /directRequest/,
  /cachedRequest/,
  /dependencyRequest/,
  /loadAndTransform/,
  /at Object\.\<anonymous\>/,
  /at VitestExecutor/,
  /at processTicksAndRejections/
]

/**
 * Wraps an async function call and suppresses expected error output
 * Usage: await suppressErrors(() => iconLoader.loadIcon('non-existent'))
 */
export async function suppressErrors<T>(
  fn: () => Promise<T> | T,
  options: ErrorSuppressionOptions = {}
): Promise<T> {
  const { 
    suppressConsole = true, 
    suppressStderr = true,
    patterns = defaultPatterns 
  } = options

  // Store original methods
  const originalConsoleError = console.error
  const originalConsoleWarn = console.warn
  const originalStderrWrite = process.stderr.write

  // Create suppression functions
  const shouldSuppress = (message: string) => {
    return patterns.some(pattern => pattern.test(message))
  }

  try {
    // Suppress console methods
    if (suppressConsole) {
      console.error = (...args) => {
        const message = args.join(' ')
        if (!shouldSuppress(message)) {
          originalConsoleError.apply(console, args)
        }
      }
      
      console.warn = (...args) => {
        const message = args.join(' ')
        if (!shouldSuppress(message)) {
          originalConsoleWarn.apply(console, args)
        }
      }
    }

    // Suppress stderr output
    if (suppressStderr) {
      process.stderr.write = ((chunk: any, encoding?: any, callback?: any) => {
        const message = chunk.toString()
        if (!shouldSuppress(message)) {
          return originalStderrWrite.call(process.stderr, chunk, encoding, callback)
        }
        // Return true to indicate success for suppressed messages
        if (typeof callback === 'function') {
          callback()
        }
        return true
      }) as any
    }

    // Execute the function
    return await fn()

  } finally {
    // Always restore original methods
    console.error = originalConsoleError
    console.warn = originalConsoleWarn
    process.stderr.write = originalStderrWrite
  }
}

/**
 * Test helper that wraps a test function with error suppression
 * Usage: it('should handle errors', suppressErrorsInTest(async () => { ... }))
 */
export function suppressErrorsInTest<T>(
  testFn: () => Promise<T> | T,
  options?: ErrorSuppressionOptions
) {
  return async () => {
    return await suppressErrors(testFn, options)
  }
}