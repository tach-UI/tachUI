/**
 * Global Test Setup
 *
 * Auto-imports @tachui/modifiers/preload/basic and @tachui/modifiers/preload/effects to make all modifiers
 * available via Proxy in all tests without requiring explicit imports.
 */

import '@tachui/modifiers/preload/basic'
import '@tachui/modifiers/preload/effects'

if (typeof Element !== 'undefined') {
  // clientWidth/clientHeight polyfills for jsdom (reads from inline style since jsdom has no layout engine)
  Object.defineProperty(Element.prototype, 'clientWidth', {
    configurable: true,
    get() {
      const width = (this as HTMLElement).style?.width
      if (width && width.endsWith('px')) return parseInt(width, 10)
      return 0
    },
  })

  Object.defineProperty(Element.prototype, 'clientHeight', {
    configurable: true,
    get() {
      const height = (this as HTMLElement).style?.height
      if (height && height.endsWith('px')) return parseInt(height, 10)
      return 0
    },
  })

  // setPointerCapture / releasePointerCapture polyfill for jsdom
  if (typeof Element.prototype.setPointerCapture === 'undefined') {
    Element.prototype.setPointerCapture = () => {}
  }
  if (typeof Element.prototype.releasePointerCapture === 'undefined') {
    Element.prototype.releasePointerCapture = () => {}
  }

  // Web Animations API polyfill for jsdom
  if (typeof Element.prototype.animate === 'undefined') {
    Element.prototype.animate = function (
      _keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
      options?: number | KeyframeAnimationOptions
    ): Animation {
      const duration = typeof options === 'number'
        ? options
        : (options?.duration as number) ?? 300

      const listeners: Map<string, Array<() => void>> = new Map()

      return {
        playState: 'running',
        effect: {
          getComputedTiming: () => ({ duration }),
        },
        cancel: () => {},
        play: () => {},
        pause: () => {},
        finish: () => {
          listeners.get('finish')?.forEach(cb => cb())
        },
        commitStyles: () => {},
        addEventListener: (event: string, callback: () => void, _opts?: unknown) => {
          if (!listeners.has(event)) listeners.set(event, [])
          listeners.get(event)!.push(callback)
        },
        removeEventListener: (event: string, callback: () => void) => {
          const eventListeners = listeners.get(event)
          if (eventListeners) {
            listeners.set(event, eventListeners.filter(cb => cb !== callback))
          }
        },
      } as unknown as Animation
    }
  }
}

// PointerEvent polyfill for jsdom (only in browser-like environments)
if (typeof MouseEvent !== 'undefined' && typeof PointerEvent === 'undefined') {
  // @ts-expect-error - Polyfill for jsdom environment
  global.PointerEvent = class PointerEvent extends MouseEvent {
    isPrimary: boolean
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params)
      this.isPrimary = params.isPrimary ?? true
    }
  }
}

// matchMedia polyfill for jsdom
if (typeof window !== 'undefined' && typeof window.matchMedia === 'undefined') {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  } as MediaQueryList)
}
