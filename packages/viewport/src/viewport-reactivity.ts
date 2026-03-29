import { createSignal } from '@tachui/core'
import type { Accessor } from '@tachui/core'

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
  dispose: () => void
}

export function useViewport(): ViewportSignals {
  const [width, setWidth] = createSignal(getViewportWidth())
  const [height, setHeight] = createSignal(getViewportHeight())

  if (typeof window === 'undefined') {
    return {
      width,
      height,
      dispose: () => {},
    }
  }

  const updateViewportSize = (): void => {
    setWidth(window.innerWidth)
    setHeight(window.innerHeight)
  }

  window.addEventListener('resize', updateViewportSize)

  return {
    width,
    height,
    dispose: () => {
      window.removeEventListener('resize', updateViewportSize)
    },
  }
}
