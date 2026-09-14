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
   * Throws for a key the list does not hold, and the accessor it returns is
   * only meaningful while the key stays held: the row's cell is emptied when it
   * leaves, so an accessor kept across a removal reads `undefined` under a
   * `() => T` contract. Use {@link SignalListControls.track} for a key that may
   * be absent now, or may leave and come back — it says so in its type.
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
/** Retained accessors for departed rows, when the caller names no bound. */
const DEFAULT_TRACKED_KEYS = 256

export function createSignalList<T, K extends PropertyKey = PropertyKey>(
  initialItems: T[],
  keyFn: SignalListKeyFn<T, K>,
  options: SignalListOptions = {}
): [() => T[], SignalListControls<T, K>] {
  // Map of key -> [getter, setter] for each item's signal. A cell outlives its
  // row only when someone tracked the key; see `tracked`.
  const itemSignals = new Map<
    K,
    [() => T | undefined, (value: T | undefined) => void]
  >()

  /**
   * Keys `track` has handed an accessor for, in least-recently-used order.
   *
   * A Map iterates in insertion order, so deleting and re-inserting a key on
   * every `track` call makes the front the least recently *asked for* — which
   * is what a consumer's holding of an accessor actually follows. Ordering by
   * when a row happened to be removed would evict the key someone is still
   * rendering in favour of one nobody has mentioned since.
   */
  const tracked = new Map<K, true>()
  const trackedKeys = options.trackedKeys ?? DEFAULT_TRACKED_KEYS
  /** Keys the list currently holds a row for. */
  const present = new Set<K>(initialItems.map(keyFn))

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

  if (
    options.trackedKeys !== undefined &&
    (!Number.isInteger(options.trackedKeys) || options.trackedKeys < 0)
  ) {
    throw new Error(
      `SignalList: trackedKeys must be a non-negative integer, received ${String(options.trackedKeys)}`
    )
  }

  /**
   * How many tracked keys the list no longer holds — the eviction candidates.
   *
   * Kept as a running count rather than recomputed, because `evictTracked` ran
   * on every release and its scan was the whole tracked map each time: tearing
   * down an n-row list cost O(n^2), and a long feed's `dispose()` blocked the
   * main thread for it. Every mutation of `tracked` or `present` maintains it,
   * which is why both sets are only ever written through the four helpers
   * below.
   */
  let departed = 0

  /** Marks a tracked key as most recently asked for. */
  const touch = (key: K): void => {
    if (!tracked.has(key) && !present.has(key)) {
      departed += 1
    }
    tracked.delete(key)
    tracked.set(key, true)
  }

  /** Records a key as tracked without disturbing recency. */
  const trackPresent = (key: K): void => {
    if (!tracked.has(key)) {
      // Present, so tracked-but-departed does not apply and the count stands.
      tracked.set(key, true)
    }
  }

  /** Marks a key as held by the list. */
  const addPresent = (key: K): void => {
    if (present.has(key)) {
      return
    }
    present.add(key)
    if (tracked.has(key)) {
      departed -= 1
    }
  }

  /** Marks a key as no longer held by the list. */
  const removePresent = (key: K): void => {
    if (!present.delete(key)) {
      return
    }
    if (tracked.has(key)) {
      departed += 1
    }
  }

  /**
   * Drops the least recently asked-for departed keys until the bound is met.
   *
   * Only keys the list no longer holds are candidates: a row that is present is
   * live data, and its cell is the list's own, not a retained accessor.
   */
  const evictTracked = (): void => {
    if (departed <= trackedKeys) {
      // The common case, and the one that used to cost a full scan anyway.
      return
    }
    // Iterated live rather than through a copy: deleting the key the iterator
    // is sitting on is defined for a Map, and the copy was another O(n) per
    // call. `tracked` is in least-recently-asked-for order, so the candidates
    // are at the front and the walk stops as soon as the bound is met.
    for (const key of tracked.keys()) {
      if (departed <= trackedKeys) {
        return
      }
      if (present.has(key)) {
        continue
      }
      tracked.delete(key)
      itemSignals.delete(key)
      departed -= 1
    }
  }


  /**
   * Lets go of a key's row, keeping the cell alive if anyone tracked it.
   *
   * Writing `undefined` rather than deleting is what makes a tracked accessor
   * both stable and reactive: the holder is told the row left, and is still
   * subscribed if it comes back.
   */
  const release = (key: K): void => {
    if (!tracked.has(key)) {
      // Nobody asked for this key, so nothing is holding an accessor to it and
      // the cell has no reason to outlive the row.
      itemSignals.delete(key)
      return
    }
    itemSignals.get(key)?.[1](undefined)
    evictTracked()
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
    if (!signal || !present.has(key)) {
      throw new Error(`SignalList: Item with key "${String(key)}" not found`)
    }
    return signal[0] as () => T
  }

  const track = (key: K): (() => T | undefined) => {
    const cell = cellFor(key)
    if (present.has(key)) {
      // Held rows are never eviction candidates, so their recency does not
      // matter and there is nothing to reorder. Recorded once, so a later
      // removal knows to keep the cell — and repeated reads of a row that is
      // on screen, which is the hot path a render takes, mutate nothing.
      trackPresent(key)
      return cell[0]
    }
    // A key asked for before its row exists, or after it left, is retained —
    // and is subject to the bound.
    touch(key)
    evictTracked()
    return cell[0]
  }

  // Update a single item
  const update = (key: K, item: T): void => {
    const known = present.has(key)
    addPresent(key)
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
      addPresent(key)
      cellFor(key)[1](item)
    })

    // Remove items that no longer exist
    currentKeys.forEach((key: K) => {
      if (!newKeySet.has(key)) {
        removePresent(key)
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
      removePresent(key)
      release(key)
    }
    setIds([])
  }

  // Remove a specific item
  const remove = (key: K): void => {
    removePresent(key)
    release(key)
    // Use peek() to avoid tracking
    const currentIds = peekIds()
    setIds(currentIds.filter((k: K) => k !== key))
  }

  const reorder = (newIds: K[]): void => {
    // Ensure all provided ids exist before reordering
    // A permutation, both ways. Checking only that every given id exists let a
    // short list through, which dropped the omitted keys from `ids` while their
    // rows stayed in the list — present, addressable, and unrenderable.
    const allExist = newIds.every(id => present.has(id))
    if (!allExist || newIds.length !== present.size) {
      throw new Error(
        '[SignalList.reorder] Cannot reorder: ids must be a permutation of the keys the list holds'
      )
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
