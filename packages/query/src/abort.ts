/**
 * Abort plumbing shared by the primitives that hand a signal to caller code.
 *
 * A `run` or an `open` is *asked* to respect its signal and nothing can make
 * it. Everything here exists so that a source which ignores the signal costs
 * the caller nothing worse than a result nobody reads.
 */

/**
 * Settles as `work` does, or rejects the moment the signal aborts — whichever
 * happens first.
 *
 * Awaiting caller code outright means a cancellation is only as good as that
 * code's cooperation: one that never settles leaves the caller holding an
 * aborted controller and a promise pending for good. Racing the two ends the
 * wait whatever the source does, and leaves the source to finish into a result
 * nobody holds, which is the most anyone can do about work already started.
 */
export function raceAbort<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) {
    // Abandoned before anything waited on it. The work is abandoned but still
    // real, and a rejection nobody has attached a handler to is an unhandled
    // rejection: a warning at best, a killed process or a failed test run at
    // worst. Observed and dropped, the same as the outcome of any call that no
    // longer has anywhere to go.
    work.catch(() => undefined)
    return Promise.reject(signal.reason)
  }
  return new Promise<T>((resolve, reject) => {
    function onAbort(): void {
      reject(signal.reason)
    }
    signal.addEventListener('abort', onAbort, { once: true })
    // Both handlers are attached here, so a rejection that loses the race is
    // still handled and never surfaces as an unhandled rejection.
    work.then(
      (value) => {
        signal.removeEventListener('abort', onAbort)
        resolve(value)
      },
      (error) => {
        signal.removeEventListener('abort', onAbort)
        reject(error)
      }
    )
  })
}
