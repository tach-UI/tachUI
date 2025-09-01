/**
 * NavigationPath Implementation
 *
 * Implements SwiftUI's NavigationPath for type-safe programmatic navigation
 * with support for appending, removing, and managing navigation destinations.
 */

import type { NavigationPath as INavigationPath } from './types'

/**
 * NavigationPath implementation for programmatic navigation
 *
 * Provides a type-safe way to manage navigation stack programmatically,
 * matching SwiftUI's NavigationPath API.
 *
 * @example
 * ```typescript
 * const path = new NavigationPath()
 * path.append('user-123')
 * path.append('settings')
 * path.removeLast() // Back to user-123
 * ```
 */
export class NavigationPath implements INavigationPath {
  private _segments: string[] = []
  private _listeners: Set<(path: NavigationPath) => void> = new Set()

  constructor(initialSegments: string[] = []) {
    this._segments = [...initialSegments]
  }

  /**
   * Get the current path segments
   */
  get segments(): readonly string[] {
    return [...this._segments]
  }

  /**
   * Get the number of segments in the path
   */
  get count(): number {
    return this._segments.length
  }

  /**
   * Check if the path is empty
   */
  get isEmpty(): boolean {
    return this._segments.length === 0
  }

  /**
   * Append a segment to the navigation path
   * @param segment - The segment to append
   */
  append(segment: string): void {
    this._segments.push(segment)
    this._notifyListeners()
  }

  /**
   * Append multiple segments to the navigation path
   * @param segments - The segments to append
   */
  appendAll(segments: string[]): void {
    this._segments.push(...segments)
    this._notifyListeners()
  }

  /**
   * Remove the last segment from the path
   * @param count - Number of segments to remove (default: 1)
   */
  removeLast(count: number = 1): void {
    const actualCount = Math.min(count, this._segments.length)
    if (actualCount > 0) {
      this._segments.splice(-actualCount, actualCount)
      this._notifyListeners()
    }
  }

  /**
   * Remove all segments, clearing the path
   */
  clear(): void {
    if (this._segments.length > 0) {
      this._segments = []
      this._notifyListeners()
    }
  }

  /**
   * Check if the path contains a specific segment
   * @param segment - The segment to check for
   */
  contains(segment: string): boolean {
    return this._segments.includes(segment)
  }

  /**
   * Get the segment at a specific index
   * @param index - The index of the segment
   */
  at(index: number): string | undefined {
    return this._segments[index]
  }

  /**
   * Get the last segment in the path
   */
  get last(): string | undefined {
    return this._segments[this._segments.length - 1]
  }

  /**
   * Replace all segments with new ones
   * @param segments - The new segments
   */
  replaceAll(segments: string[]): void {
    this._segments = [...segments]
    this._notifyListeners()
  }

  /**
   * Convert the path to a URL-like string
   */
  toString(): string {
    return this._segments.join('/')
  }

  /**
   * Create a NavigationPath from a URL-like string
   * @param pathString - The path string (e.g., "/user/123/settings")
   */
  static fromString(pathString: string): NavigationPath {
    const segments = pathString.split('/').filter(segment => segment.length > 0)
    return new NavigationPath(segments)
  }

  /**
   * Subscribe to path changes
   * @param listener - Function to call when path changes
   * @returns Unsubscribe function
   */
  onChange(listener: (path: NavigationPath) => void): () => void {
    this._listeners.add(listener)
    return () => {
      this._listeners.delete(listener)
    }
  }

  /**
   * Create a copy of this NavigationPath
   */
  copy(): NavigationPath {
    return new NavigationPath(this._segments)
  }

  /**
   * Check if this path equals another path
   * @param other - The other path to compare
   */
  equals(other: NavigationPath): boolean {
    if (this._segments.length !== other._segments.length) {
      return false
    }
    return this._segments.every(
      (segment, index) => segment === other._segments[index]
    )
  }

  /**
   * Notify all listeners of path changes
   */
  private _notifyListeners(): void {
    this._listeners.forEach(listener => listener(this))
  }
}

/**
 * Type-safe navigation path element for storing heterogeneous data
 */
export class NavigationPathElement<T = any> {
  constructor(
    public readonly type: string,
    public readonly value: T
  ) {}

  /**
   * Check if this element matches a specific type
   */
  is<U>(type: string): this is NavigationPathElement<U> {
    return this.type === type
  }
}

/**
 * Enhanced NavigationPath with type-safe elements
 */
export class TypedNavigationPath {
  private _elements: NavigationPathElement[] = []
  private _listeners: Set<(path: TypedNavigationPath) => void> = new Set()

  /**
   * Get the number of elements in the path
   */
  get count(): number {
    return this._elements.length
  }

  /**
   * Check if the path is empty
   */
  get isEmpty(): boolean {
    return this._elements.length === 0
  }

  /**
   * Append a typed element to the path
   * @param type - The type identifier
   * @param value - The value to store
   */
  append<T>(type: string, value: T): void {
    this._elements.push(new NavigationPathElement(type, value))
    this._notifyListeners()
  }

  /**
   * Remove the last element(s) from the path
   * @param count - Number of elements to remove (default: 1)
   */
  removeLast(count: number = 1): void {
    const actualCount = Math.min(count, this._elements.length)
    if (actualCount > 0) {
      this._elements.splice(-actualCount, actualCount)
      this._notifyListeners()
    }
  }

  /**
   * Clear all elements from the path
   */
  clear(): void {
    if (this._elements.length > 0) {
      this._elements = []
      this._notifyListeners()
    }
  }

  /**
   * Get the last element of a specific type
   * @param type - The type to search for
   */
  lastOfType<T>(type: string): T | undefined {
    for (let i = this._elements.length - 1; i >= 0; i--) {
      const element = this._elements[i]
      if (element.type === type) {
        return element.value as T
      }
    }
    return undefined
  }

  /**
   * Get all elements of a specific type
   * @param type - The type to filter by
   */
  allOfType<T>(type: string): T[] {
    return this._elements
      .filter(element => element.type === type)
      .map(element => element.value as T)
  }

  /**
   * Subscribe to path changes
   * @param listener - Function to call when path changes
   * @returns Unsubscribe function
   */
  onChange(listener: (path: TypedNavigationPath) => void): () => void {
    this._listeners.add(listener)
    return () => {
      this._listeners.delete(listener)
    }
  }

  /**
   * Notify all listeners of path changes
   */
  private _notifyListeners(): void {
    this._listeners.forEach(listener => listener(this))
  }
}

/**
 * Create a new NavigationPath instance
 */
export function createNavigationPath(
  initialSegments?: string[]
): NavigationPath {
  return new NavigationPath(initialSegments)
}

/**
 * Create a new TypedNavigationPath instance
 */
export function createTypedNavigationPath(): TypedNavigationPath {
  return new TypedNavigationPath()
}
