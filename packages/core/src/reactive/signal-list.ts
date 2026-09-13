/**
 * Fine-Grained Reactive Lists
 *
 * Provides high-performance list management by separating array structure
 * from item data. Each item gets its own signal, enabling surgical updates
 * without triggering full reconciliation.
 *
 * @example
 * ```typescript
 * // Create a signal list with a key function
 * const [items, list] = createSignalList(
 *   [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
 *   item => item.id
 * )
 *
 * // In your component, track only the IDs (array structure)
 * const ids = list.ids()
 *
 * // Render each row with its own reactive data
 * ids.map(id => {
 *   const getData = list.get(id)
 *   return h('div', null, () => getData().name)  // Reactive text
 * })
 *
 * // Update individual item - only that item re-renders
 * list.update(1, { id: 1, name: 'Alice Updated' })
 *
 * // Replace all items - still surgical updates
 * list.set([{ id: 1, name: 'Alice New' }, { id: 3, name: 'Charlie' }])
 * ```
 */

import { createSignal } from './signal'
import type { Signal } from './types'

export type SignalListKeyFn<T, K extends PropertyKey = PropertyKey> = (
  item: T
) => K

/** Options for a fine-grained reactive list. */
export interface SignalListOptions {
  /**
   * How many accessors handed out by `track` are kept alive after their row
   * leaves the list. Defaults to 256.
   *
   * `track` returns a stable accessor, which means the list has to hold the
   * row's signal after the row is gone — otherwise a consumer that is still
   * holding one would never hear about the row coming back. That store cannot
   * grow forever, so it is bounded and least-recently-used entries are dropped.
   *
   * The cost of the bound is precise: an accessor whose key is evicted keeps
   * reading `undefined` even if the row returns, because the row returns into a
   * new signal. Raise it for a list that churns through keys a consumer may ask
   * for again; lower it for one that never revisits a key.
   */
  trackedKeys?: number
}

export interface SignalListControls<T, K extends PropertyKey = PropertyKey> {
  /**
   * Get array of item keys/IDs. Track this in components to know which items exist.
   * When this changes, component re-renders with new list structure.
   *
   * Typed as the signal it actually is. It comes from `createSignal`, so it
   * carries the brand `isSignal` looks for and the `peek` that goes with it —
   * and consumers like `List` decide whether to subscribe at all on the
   * strength of that check. Declaring it as a bare accessor forced anyone
   * handing it on as a `Signal` to rebuild one, and a rebuilt accessor is not
   * branded.
   */
  ids: Signal<K[]>

  /**
   * Get reactive getter for a specific item by key.
   * Returns a function that reactively returns the current item data.
   *
   * Throws for a key the list does not hold. Use {@link SignalListControls.track}
   * when the key may be absent now, or may leave and come back.
   */
  get: (key: K) => () => T

  /**
   * A stable reactive accessor for a key, whether or not the list holds it.
   *
   * Differs from `get` in three ways that matter to a consumer rendering one
   * row. It never throws, reading `undefined` for a key that is not held. It
   * subscribes to *that key alone*, so a row is told when it arrives, changes,
   * or leaves, and is told nothing when the rest of the list changes around it.
   * And it is the same accessor across a key leaving and returning, so a row
   * dropped by a bound and re-fetched is not orphaned.
   *
   * The retained accessors are bounded — see {@link SignalListOptions.trackedKeys}.
   */
  track: (key: K) => () => T | undefined

  /**
   * Update a single item by key. Only triggers reactive updates for that item.
   */
  update: (key: K, item: T) => void

  /**
   * Replace entire list. Updates existing items surgically, adds new ones, removes old ones.
   */
  set: (items: T[]) => void

  /**
   * Clear all items.
   */
  clear: () => void

  /**
   * Remove a specific item by key.
   */
  remove: (key: K) => void

  /**
   * Reorder the list using an array of existing keys without touching item data.
   */
  reorder: (ids: K[]) => void

  /**
   * Get all current items as a plain array (non-reactive).
   */
  getAll: () => T[]
}

/**
 * Create a fine-grained reactive list where each item has its own signal.
 *
 * This enables surgical updates to individual items without triggering
 * full component re-renders or reconciliation. The component tracks only
 * the array of IDs (structure), while each item's data is tracked independently.
 *
 * **Performance Benefits**:
 * - Updating 1 item in 1,000: 175x faster (no reconciliation)
 * - Replacing all 1,000 items: 242x faster (surgical signal updates)
 *
 * **When to use**:
 * - Large lists (100+ items) with frequent updates
 * - Updates to individual items (e.g., editing one row)
 * - Batch updates to item properties (e.g., marking all as read)
 *
 * **When NOT to use**:
 * - Small lists (<20 items) - overhead not worth it
 * - Lists that are fully replaced frequently - use regular createSignal
 * - Lists where you never update individual items
 *
 * @param initialItems - Initial array of items
 * @param keyFn - Function to extract unique key from each item (e.g., item => item.id)
 * @returns Tuple of [ids signal, list controls]
 */
export function createSignalList<T, K extends PropertyKey = PropertyKey>(
  initialItems: T[],
  keyFn: SignalListKeyFn<T, K>,
  options: SignalListOptions = {}
): [() => T[], SignalListControls<T, K>] {
  // Map of key -> [getter, setter] for each item's signal. A cell outlives its
  // row only when someone tracked the key; see `tombstones`.
  const itemSignals = new Map<
    K,
    [() => T | undefined, (value: T | undefined) => void]
  >()

  /**
   * Keys that are tracked but no longer held, in least-recently-used order.
   *
   * A Map iterates in insertion order, so re-inserting a key moves it to the
   * end and the front is always the least recently touched.
   */
  const tombstones = new Map<K, true>()
  /** Keys the list currently holds a row for. */
  const present = new Set<K>(initialItems.map(keyFn))
  const trackedKeys = options.trackedKeys ?? 256

  /** Marks a tracked-but-absent key as most recently used. */
  const touch = (key: K): void => {
    if (tombstones.delete(key)) {
      tombstones.set(key, true)
    }
  }

  /** Drops the least recently used tombstones until the bound is met. */
  const evictTombstones = (): void => {
    while (tombstones.size > trackedKeys) {
      const oldest = tombstones.keys().next()
      if (oldest.done === true) {
        return
      }
      tombstones.delete(oldest.value)
      itemSignals.delete(oldest.value)
    }
  }

  /** The cell for a key, created empty if there is none. */
  const cellFor = (
    key: K
  ): [() => T | undefined, (value: T | undefined) => void] => {
    const existing = itemSignals.get(key)
    if (existing !== undefined) {
      return existing
    }
    const made = createSignal<T | undefined>(undefined)
    itemSignals.set(key, made)
    return made
  }

  /** Keys anyone has ever tracked, so removal knows whether to keep the cell. */
  const trackedEver = new Set<K>()

  /**
   * Lets go of a key's row, keeping the cell alive if anyone tracked it.
   *
   * Writing `undefined` rather than deleting is what makes a tracked accessor
   * both stable and reactive: the holder is told the row left, and is still
   * subscribed if it comes back.
   */
  const release = (key: K): void => {
    if (!tombstones.has(key) && !trackedEver.has(key)) {
      itemSignals.delete(key)
      return
    }
    itemSignals.get(key)?.[1](undefined)
    tombstones.delete(key)
    tombstones.set(key, true)
    evictTombstones()
  }

  // Signal for the array of keys (tracks list structure)
  // Use a custom setter that checks array equality before updating
  const [_getIds, _setIds] = createSignal<K[]>(initialItems.map(keyFn))

  // Expose getIds without the custom wrapper for external use.
  //
  // Named as the signal it is. `createSignal` attaches the brand and `peek` to
  // its accessor at runtime but declares only `() => T`, so both are invisible
  // here; widening that declaration is a core-wide change and belongs on its
  // own rather than inside a consumer's.
  const getIds = _getIds as Signal<K[]>

  // Type assertion to access peek() method
  const peekIds = () => (_getIds as any).peek()

  const setIds = (newIds: K[]) => {
    // Use peek() to avoid tracking the signal during comparison
    const currentIds = peekIds()
    // Only update if arrays are actually different
    if (!arraysEqual(currentIds, newIds)) {
      _setIds(newIds)
    }
  }

  // Helper to check if two arrays have the same elements in the same order
  const arraysEqual = (a: K[], b: K[]): boolean => {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false
    }
    return true
  }

  // Initialize signals for all items
  initialItems.forEach(item => {
    cellFor(keyFn(item))[1](item)
  })

  // Get reactive getter for a specific item
  const get = (key: K): (() => T) => {
    const signal = itemSignals.get(key)
    if (!signal || tombstones.has(key)) {
      throw new Error(`SignalList: Item with key "${String(key)}" not found`)
    }
    return signal[0] as () => T
  }

  const track = (key: K): (() => T | undefined) => {
    trackedEver.add(key)
    const cell = cellFor(key)
    if (!present.has(key)) {
      // A key asked for before its row exists is a tombstone from the start:
      // it has to be held, and it has to be subject to the same bound.
      tombstones.set(key, true)
      evictTombstones()
    }
    touch(key)
    return cell[0]
  }

  // Update a single item
  const update = (key: K, item: T): void => {
    const known = present.has(key)
    tombstones.delete(key)
    present.add(key)
    cellFor(key)[1](item)
    if (!known) {
      // Add to IDs array - use peek() to avoid tracking
      const currentIds = peekIds()
      setIds([...currentIds, key])
    }
  }

  // Replace entire list
  const set = (items: T[]): void => {
    const newKeys = items.map(keyFn)
    const newKeySet = new Set(newKeys)
    // Use peek() to avoid tracking the signal
    const currentKeys = peekIds()

    // Update existing items and create new ones
    items.forEach(item => {
      const key = keyFn(item)
      tombstones.delete(key)
      present.add(key)
      cellFor(key)[1](item)
    })

    // Remove items that no longer exist
    currentKeys.forEach((key: K) => {
      if (!newKeySet.has(key)) {
        present.delete(key)
        release(key)
      }
    })

    // Order is part of the structure, so the new keys go through as they came.
    // `setIds` compares element by element and writes only on a real
    // difference. Deciding here whether the change "counted" treated the same
    // keys in a new order as no change at all, which left `ids` - the thing a
    // component renders from - describing the previous order while every row
    // held current data.
    setIds(newKeys)
  }

  const readItemValue = (key: K, shouldTrack: boolean): T | null => {
    const signal = present.has(key) ? itemSignals.get(key) : undefined
    if (!signal) return null
    const getter = signal[0] as (() => T) & { peek?: () => T }
    if (!getter) return null
    if (shouldTrack) {
      return getter()
    }
    if (typeof getter.peek === 'function') {
      return getter.peek()
    }
    return getter()
  }

  // Clear all items
  const clear = (): void => {
    for (const key of [...present]) {
      present.delete(key)
      release(key)
    }
    setIds([])
  }

  // Remove a specific item
  const remove = (key: K): void => {
    present.delete(key)
    release(key)
    // Use peek() to avoid tracking
    const currentIds = peekIds()
    setIds(currentIds.filter((k: K) => k !== key))
  }

  const reorder = (newIds: K[]): void => {
    // Ensure all provided ids exist before reordering
    const allExist = newIds.every(id => present.has(id))
    if (!allExist) {
      throw new Error('[SignalList.reorder] Cannot reorder with unknown ids')
    }
    setIds([...newIds])
  }

  // Get all current items as plain array (non-reactive)
  const getAll = (): T[] => {
    // Use peek() to avoid tracking the IDs signal
    const ids = peekIds()
    return ids
      .map((key: K) => readItemValue(key, false))
      .filter((item: T | null): item is T => item !== null)
  }

  // Convenience getter that returns all items (but tracks all signals)
  const getAllReactive = (): T[] => {
    // This will track all item signals, causing re-render on any change
    // Generally not recommended - defeats the purpose of fine-grained reactivity
    const ids = getIds()
    return ids
      .map((key: K) => readItemValue(key, true))
      .filter((item: T | null): item is T => item !== null)
  }

  return [
    getAllReactive,
    {
      ids: getIds,
      get,
      track,
      update,
      set,
      clear,
      remove,
      reorder,
      getAll,
    }
  ]
}

/**
 * Helper to create list controls without the reactive getter.
 * Useful when you always want to track structure, never all items.
 */
export function createSignalListControls<T, K extends PropertyKey = PropertyKey>(
  initialItems: T[],
  keyFn: SignalListKeyFn<T, K>,
  options: SignalListOptions = {}
): SignalListControls<T, K> {
  const [, controls] = createSignalList<T, K>(initialItems, keyFn, options)
  return controls
}
