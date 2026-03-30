/**
 * NavigationPath Implementation
 *
 * Implements SwiftUI's NavigationPath for type-safe programmatic navigation
 * with support for appending, removing, and managing navigation destinations.
 */

import type { NavigationPath as INavigationPath } from './types'

export interface NavigationPathTypedSegment {
  type: string
  [key: string]: unknown
}

export type NavigationPathSegment = string | NavigationPathTypedSegment

function isTypedSegment(value: unknown): value is NavigationPathTypedSegment {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof (value as { type?: unknown }).type === 'string'
  )
}

function deepCloneValue<T>(value: T): T {
  if (typeof value !== 'object' || value === null) {
    return value
  }

  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }

  return JSON.parse(JSON.stringify(value)) as T
}

function cloneSegment(segment: NavigationPathSegment): NavigationPathSegment {
  if (typeof segment === 'string') {
    return segment
  }

  return deepCloneValue(segment)
}

function segmentToKey(segment: NavigationPathSegment): string {
  return typeof segment === 'string' ? segment : segment.type
}

function segmentsEqual(
  left: NavigationPathSegment,
  right: NavigationPathSegment
): boolean {
  if (typeof left === 'string' && typeof right === 'string') {
    return left === right
  }
  if (typeof left === 'string' || typeof right === 'string') {
    return false
  }

  return JSON.stringify(left) === JSON.stringify(right)
}

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
  private _segments: NavigationPathSegment[] = []
  private _listeners: Set<(path: NavigationPath) => void> = new Set()
  private _beforeChangeListeners?: Set<
      (change: {
      oldSegments: string[]
      newSegments: string[]
      operation: string
    }) => boolean
  >
  private _notifying: boolean = false
  private _segmentsCorruptedForTests = false

  constructor(initialSegments: NavigationPathSegment[] = []) {
    this._segments = initialSegments.map(cloneSegment)
  }

  /**
   * Get the current path segments
   */
  get segments(): readonly string[] {
    if (this._segmentsCorruptedForTests || !Array.isArray(this._segments)) {
      return []
    }
    return this._segments.map(segmentToKey)
  }

  /**
   * Get raw path entries (strings and typed segments)
   */
  get entries(): readonly NavigationPathSegment[] {
    if (this._segmentsCorruptedForTests || !Array.isArray(this._segments)) {
      return []
    }

    return this._segments.map(cloneSegment)
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
  append(segment: NavigationPathSegment): void {
    const normalizedSegment = cloneSegment(segment)

    // Call before change listeners
    if (this._beforeChangeListeners) {
      const oldSegments = this._segments.map(segmentToKey)
      const newSegments = [...oldSegments, segmentToKey(normalizedSegment)]

      for (const listener of this._beforeChangeListeners) {
        const shouldProceed = listener({
          oldSegments,
          newSegments,
          operation: 'append',
        })
        if (shouldProceed === false) {
          return // Prevent the change
        }
      }
    }

    this._segments.push(normalizedSegment)
    this._notifyListeners()
  }

  /**
   * Append multiple segments to the navigation path
   * @param segments - The segments to append
   */
  appendAll(segments: NavigationPathSegment[]): void {
    const normalizedSegments = segments.map(cloneSegment)
    if (normalizedSegments.length === 0) {
      return
    }

    if (this._beforeChangeListeners) {
      const oldSegments = this._segments.map(segmentToKey)
      const newSegments = [
        ...oldSegments,
        ...normalizedSegments.map(segmentToKey),
      ]

      for (const listener of this._beforeChangeListeners) {
        const shouldProceed = listener({
          oldSegments,
          newSegments,
          operation: 'appendAll',
        })
        if (shouldProceed === false) {
          return
        }
      }
    }

    this._segments.push(...normalizedSegments)
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
   *
   * For typed entries, lookup is based on the `type` tag.
   */
  contains(segment: string): boolean {
    return this._segments.some(current => segmentToKey(current) === segment)
  }

  /**
   * Get the segment at a specific index
   * @param index - The index of the segment
   *
   * For typed entries, this returns the `type` tag. Use `entryAt` for full payload.
   */
  at(index: number): string | undefined {
    const segment = this._segments[index]
    return segment ? segmentToKey(segment) : undefined
  }

  /**
   * Get the raw segment entry (typed or string) at index
   */
  entryAt(index: number): NavigationPathSegment | undefined {
    const segment = this._segments[index]
    return segment ? cloneSegment(segment) : undefined
  }

  /**
   * Get the last segment in the path
   */
  get last(): string | undefined {
    const segment = this._segments[this._segments.length - 1]
    return segment ? segmentToKey(segment) : undefined
  }

  /**
   * Get the first segment in the path
   */
  get first(): string | undefined {
    const segment = this._segments[0]
    return segment ? segmentToKey(segment) : undefined
  }

  /**
   * Get the first segment (alias for compatibility)
   */
  firstSegment(): string | undefined {
    return this.first
  }

  /**
   * Find index of a segment
   */
  findIndex(predicate: (segment: string, index: number) => boolean): number {
    return this._segments
      .map(segmentToKey)
      .findIndex((segment, index) => predicate(segment, index))
  }

  /**
   * Find index of a segment by value
   */
  indexOf(segment: string): number {
    return this._segments.map(segmentToKey).indexOf(segment)
  }

  /**
   * Replace all segments with new ones
   * @param segments - The new segments
   */
  replaceAll(segments: NavigationPathSegment[]): void {
    this._segments = segments.map(cloneSegment)
    this._notifyListeners()
  }

  /**
   * Replace a segment at a specific index
   * @param index - The index to replace
   * @param segment - The new segment
   */
  replace(index: number, segment: NavigationPathSegment): void {
    if (index >= 0 && index < this._segments.length) {
      this._segments[index] = cloneSegment(segment)
      this._notifyListeners()
    }
  }

  /**
   * Create a subpath from start to end index
   * @param start - Start index (inclusive)
   * @param end - End index (exclusive)
   */
  subpath(start: number, end?: number): NavigationPath {
    const actualStart = Math.max(0, start)
    const actualEnd =
      end !== undefined
        ? Math.min(this._segments.length, end)
        : this._segments.length

    if (actualStart >= actualEnd) {
      return new NavigationPath([])
    }

    return new NavigationPath(this._segments.slice(actualStart, actualEnd))
  }

  /**
   * Create a reversed copy of the path
   */
  reversed(): NavigationPath {
    return new NavigationPath([...this._segments].reverse())
  }

  /**
   * Calculate similarity with another path (0-1 ratio)
   */
  similarity(other: NavigationPath): number {
    const maxLength = Math.max(this._segments.length, other._segments.length)
    if (maxLength === 0) return 1

    let matchingSegments = 0
    const minLength = Math.min(this._segments.length, other._segments.length)

    for (let i = 0; i < minLength; i++) {
      if (segmentsEqual(this._segments[i], other._segments[i])) {
        matchingSegments++
      }
    }

    return matchingSegments / maxLength
  }

  /**
   * Convert the path to a URL-like string
   */
  toString(): string {
    return this._segments.map(segmentToKey).join('/')
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
    return this._segments.every((segment, index) =>
      segmentsEqual(segment, other._segments[index])
    )
  }

  /**
   * Iterate over segments
   */
  forEach(callback: (segment: string, index: number) => void): void {
    this._segments.map(segmentToKey).forEach(callback)
  }

  /**
   * Map over segments
   */
  map<T>(callback: (segment: string, index: number) => T): T[] {
    return this._segments.map(segmentToKey).map(callback)
  }

  /**
   * Filter segments
   */
  filter(predicate: (segment: string, index: number) => boolean): string[] {
    return this._segments.map(segmentToKey).filter(predicate)
  }

  /**
   * Find a segment
   */
  find(
    predicate: (segment: string, index: number) => boolean
  ): string | undefined {
    return this._segments.map(segmentToKey).find(predicate)
  }

  /**
   * Check if path is valid
   */
  isValid(): boolean {
    return !this._segmentsCorruptedForTests && Array.isArray(this._segments)
  }

  /**
   * Get validation errors
   */
  validationErrors(): string[] {
    const errors: string[] = []
    if (this._segmentsCorruptedForTests || !Array.isArray(this._segments)) {
      errors.push('Segments must be an array')
    }
    return errors
  }

  /**
   * Test-only hook for corruption-path validation scenarios.
   */
  __setSegmentsCorruptedForTests(corrupted: boolean): void {
    this._segmentsCorruptedForTests = corrupted
  }

  /**
   * Subscribe to before change events
   */
  onBeforeChange(
    listener: (change: {
      oldSegments: string[]
      newSegments: string[]
      operation: string
    }) => boolean
  ): void {
    // For now, store as a simple listener - this would need more sophisticated implementation
    this._beforeChangeListeners = this._beforeChangeListeners || new Set()
    this._beforeChangeListeners.add(listener)
  }

  /**
   * Join with another path
   */
  join(other: NavigationPath): NavigationPath {
    return new NavigationPath([...this._segments, ...other._segments])
  }

  /**
   * Get relative path from base path
   */
  relativeTo(basePath: NavigationPath): NavigationPath {
    if (this._segments.length < basePath._segments.length) {
      return new NavigationPath([])
    }

    // Check if this path starts with the base path
    const isBaseMatch = basePath._segments.every(
      (segment, index) => segmentsEqual(this._segments[index], segment)
    )

    if (!isBaseMatch) {
      return new NavigationPath(this._segments)
    }

    return new NavigationPath(this._segments.slice(basePath._segments.length))
  }

  /**
   * Find common prefix with another path
   */
  findCommonPrefix(other: NavigationPath): NavigationPath {
    const commonSegments: NavigationPathSegment[] = []
    const minLength = Math.min(this._segments.length, other._segments.length)

    for (let i = 0; i < minLength; i++) {
      if (segmentsEqual(this._segments[i], other._segments[i])) {
        commonSegments.push(cloneSegment(this._segments[i]))
      } else {
        break
      }
    }

    return new NavigationPath(commonSegments)
  }

  /**
   * Calculate diff with another path
   */
  diff(other: NavigationPath): { added: string[]; removed: string[] } {
    const sourceSegments = this._segments.map(segmentToKey)
    const targetSegments = other._segments.map(segmentToKey)
    const added = targetSegments.filter(
      segment => !sourceSegments.includes(segment)
    )
    const removed = sourceSegments.filter(
      segment => !targetSegments.includes(segment)
    )
    return { added, removed }
  }

  /**
   * Get normalized path (remove empty segments)
   */
  normalized(): NavigationPath {
    return new NavigationPath(
      this._segments.filter(segment => segmentToKey(segment).length > 0)
    )
  }

  /**
   * Get encoded path
   */
  encoded(): NavigationPath {
    return new NavigationPath(
      this._segments.map(segment => encodeURIComponent(segmentToKey(segment)))
    )
  }

  /**
   * Get decoded path
   */
  decoded(): NavigationPath {
    return new NavigationPath(
      this._segments.map(segment => {
        const segmentValue = segmentToKey(segment)
        try {
          return decodeURIComponent(segmentValue)
        } catch {
          return segmentValue
        }
      })
    )
  }

  /**
   * Convert to router path format
   */
  toRouterPath(): string {
    return '/' + this._segments.map(segmentToKey).join('/')
  }

  /**
   * Convert to context path format
   */
  toContextPath(): NavigationPath {
    return this.copy()
  }

  /**
   * Get path metadata
   */
  getMetadata(): {
    depth: number
    hasDynamicSegments: boolean
    complexity: number
  } {
    return {
      depth: this._segments.length,
      hasDynamicSegments: this._segments.some(segment =>
        segmentToKey(segment).includes(':')
      ),
      complexity:
        this._segments.length +
        this._segments.filter(s => segmentToKey(s).includes(':')).length,
    }
  }

  /**
   * Bookmark this path
   */
  bookmark(id: string): void {
    if (!(globalThis as any).__navigationBookmarks) {
      ;(globalThis as any).__navigationBookmarks = {}
    }
    ;(globalThis as any).__navigationBookmarks[id] = this._segments.map(
      cloneSegment
    )
  }

  /**
   * Encode the full path entries into JSON.
   */
  encode(): string {
    return JSON.stringify(this._segments)
  }

  /**
   * Restore a NavigationPath from JSON payload.
   */
  static decode(payload: string): NavigationPath {
    try {
      const decoded = JSON.parse(payload) as unknown
      if (!Array.isArray(decoded)) {
        return new NavigationPath([])
      }

      const segments: NavigationPathSegment[] = []
      decoded.forEach(entry => {
        if (typeof entry === 'string') {
          segments.push(entry)
          return
        }
        if (isTypedSegment(entry)) {
          segments.push({ ...entry })
        }
      })

      return new NavigationPath(segments)
    } catch {
      return new NavigationPath([])
    }
  }

  /**
   * Notify all listeners of path changes
   */
  private _notifyListeners(): void {
    // Prevent infinite recursion
    if (this._notifying) {
      return
    }

    this._notifying = true
    try {
      this._listeners.forEach(listener => {
        try {
          listener(this)
        } catch (error) {
          console.error('Navigation path listener error:', error)
        }
      })
    } finally {
      this._notifying = false
    }
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
   * Get segments as strings for compatibility
   */
  get segments(): string[] {
    return this._elements.map(el => el.value as string)
  }

  /**
   * Check if path is valid
   */
  isValid(): boolean {
    return Array.isArray(this._elements)
  }

  /**
   * Get validation errors
   */
  validationErrors(): string[] {
    return []
  }

  /**
   * Get element at index (compatibility method)
   */
  at(index: number): string | undefined {
    const element = this._elements[index]
    return element ? (element.value as string) : undefined
  }

  /**
   * Get last element (compatibility method)
   */
  last(): string | undefined {
    const lastElement = this._elements[this._elements.length - 1]
    return lastElement ? (lastElement.value as string) : undefined
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
    this._listeners.forEach(listener => {
      try {
        listener(this)
      } catch (error) {
        console.error('TypedNavigationPath listener error:', error)
      }
    })
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

// Add static methods to function
createNavigationPath.fromString = (pathString: string) => {
  if (!pathString) return new NavigationPath([])
  const segments = pathString.split('/').filter(s => s.length > 0)
  return new NavigationPath(segments)
}

createNavigationPath.fromRouterPath = (routerPath: string) => {
  const segments = routerPath.split('/').filter(s => s.length > 0)
  return new NavigationPath(segments)
}

createNavigationPath.fromContextPath = (contextPath: string[]) => {
  return new NavigationPath(contextPath)
}

createNavigationPath.fromBookmark = (bookmarkId: string) => {
  const stored = (globalThis as any).__navigationBookmarks?.[bookmarkId]
  return stored ? new NavigationPath(stored) : new NavigationPath([])
}

/**
 * Create a new TypedNavigationPath instance
 */
export function createTypedNavigationPath(
  initialSegments?: string[]
): TypedNavigationPath {
  const path = new TypedNavigationPath()
  if (initialSegments) {
    initialSegments.forEach((segment, _index) => {
      path.append('string', segment)
    })
  }
  return path
}
