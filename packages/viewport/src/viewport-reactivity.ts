import { createSignal } from '@tachui/core'
import type { Accessor } from '@tachui/core'
import { getOwner, onCleanup } from '@tachui/core/reactive'

function getViewportWidth(): number {
  if (typeof window === 'undefined') return 0
  return window.innerWidth
}

function getViewportHeight(): number {
  if (typeof window === 'undefined') return 0
  return window.innerHeight
}

export interface ViewportSignals {
  width: Accessor<number>
  height: Accessor<number>
  /**
   * Must be called when no longer needed unless invoked within a reactive owner.
   * When called inside a reactive root/effect, cleanup is automatically registered.
   */
  dispose: () => void
}

let sharedWidth: Accessor<number> | undefined
let sharedHeight: Accessor<number> | undefined
let setSharedWidth: ((value: number) => number) | undefined
let setSharedHeight: ((value: number) => number) | undefined
let subscriberCount = 0
let resizeListenerAttached = false

function updateSharedViewportSize(): void {
  if (typeof window === 'undefined') return
  setSharedWidth?.(window.innerWidth)
  setSharedHeight?.(window.innerHeight)
}

function ensureSharedSignals(): void {
  if (sharedWidth && sharedHeight) return
  const [width, setWidth] = createSignal(getViewportWidth())
  const [height, setHeight] = createSignal(getViewportHeight())
  sharedWidth = width
  sharedHeight = height
  setSharedWidth = setWidth
  setSharedHeight = setHeight
}

function attachResizeListenerIfNeeded(): void {
  if (typeof window === 'undefined' || resizeListenerAttached) return
  window.addEventListener('resize', updateSharedViewportSize)
  resizeListenerAttached = true
}

function detachResizeListenerIfUnused(): void {
  if (typeof window === 'undefined') return
  if (!resizeListenerAttached || subscriberCount > 0) return
  window.removeEventListener('resize', updateSharedViewportSize)
  resizeListenerAttached = false
}

export function useViewport(): ViewportSignals {
  ensureSharedSignals()
  subscriberCount += 1

  if (typeof window === 'undefined') {
    return {
      width: sharedWidth!,
      height: sharedHeight!,
      dispose: () => {},
    }
  }

  attachResizeListenerIfNeeded()
  let disposed = false

  const dispose = (): void => {
    if (disposed) return
    disposed = true
    subscriberCount = Math.max(0, subscriberCount - 1)
    detachResizeListenerIfUnused()
  }

  if (getOwner()) {
    onCleanup(dispose)
  }

  return {
    width: sharedWidth!,
    height: sharedHeight!,
    dispose,
  }
}

export function __resetViewportReactivityForTests(): void {
  subscriberCount = 0
  if (resizeListenerAttached && typeof window !== 'undefined') {
    window.removeEventListener('resize', updateSharedViewportSize)
  }
  resizeListenerAttached = false
  sharedWidth = undefined
  sharedHeight = undefined
  setSharedWidth = undefined
  setSharedHeight = undefined
}
