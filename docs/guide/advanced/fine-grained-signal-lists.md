# Fine-Grained Lists with `createSignalList`

`createSignalList` gives each row in a large collection its own signal so you can mutate data surgically without forcing a component re-render. Track the array structure once, update items individually, and let TachUI reuse the existing DOM nodes.

## API Reference

```ts
import { createSignalList } from '@tachui/core/reactive'

function createSignalList<T, K extends PropertyKey = PropertyKey>(
  initialItems: T[],
  keyFn: (item: T) => K
): [
  // reactive getter that returns all items (tracks every signal)
  () => T[],
  {
    ids: () => K[]
    get: (key: K) => () => T
    update: (key: K, item: T) => void
    set: (items: T[]) => void
    remove: (key: K) => void
    clear: () => void
    getAll: () => T[] // snapshot, does NOT track reactivity
  }
]
```

`K` is inferred from the key function, so string IDs stay typed as strings, numeric IDs stay numeric, and `ids()` returns a `K[]` instead of `any[]`.

## Quick Start

```ts
type Row = { id: number; label: string }

const initialRows: Row[] = [
  { id: 1, label: 'Alpha' },
  { id: 2, label: 'Bravo' },
]

const [, rowList] = createSignalList(initialRows, row => row.id)
```

Inside a component you only need to track the list structure:

```ts
const Table = createComponent(() => {
  const ids = rowList.ids() // reruns ONLY when ids array changes

  return h(
    'tbody',
    { key: 'rows' },
    ...ids.map(id => {
      const getRow = rowList.get(id)
      return h(
        'tr',
        { key: id },
        h('td', null, () => getRow().label) // reactive text
      )
    })
  )
})
```

## Mutation Patterns

```ts
// Update one row (only that row's signal notifies)
rowList.update(1, { id: 1, label: 'Alpha ✨' })

// Replace multiple rows without changing structure
const next = rowList.getAll().map(row =>
  row.id === 2 ? { ...row, label: 'Bravo ✅' } : row
)
rowList.set(next) // ids are identical, component does not rerender

// Swap rows or remove rows by working with real snapshots
const reordered = rowList.getAll()
reordered.reverse()
rowList.set(reordered) // ids changed, component rerenders once

// Remove / clear
rowList.remove(2)
rowList.clear()
```

Use `rowList.getAll()` for non-reactive work (sorting, filtering, cloning). It peeks at the underlying signals so no effects are registered. If you do want a fully reactive getter you can read the first item returned by `createSignalList`:

```ts
const [getAllReactive] = createSignalList(initialRows, row => row.id)
createEffect(() => {
  // Re-runs when ANY row changes
  console.log(getAllReactive())
})
```

## Performance Guardrails

- Track **structure** once via `ids()`. This keeps components from re-rendering when only row data changes.
- Use `update()` for single-row edits and `set()` when you need to mutate several rows or reorder.
- `getAll()` and `rowList.get(id)` both leverage `.peek()` internally so you can read data without accidentally subscribing.
- Pair `createSignalList` with the renderer metrics helpers (`resetRendererMetrics` / `getRendererMetrics`) in tests to ensure swaps continue to report only two DOM moves. See `packages/core/__tests__/runtime/signal-list-integration.test.ts` for an example.

## TypeScript Tips

- `createSignalList` infers the key type automatically. When a key is numeric, `rowList.ids()` is `number[]` and `rowList.get` only accepts `number`.
- String or union keys are preserved as-is:

```ts
type Pane = { id: `pane-${number}`; title: string }
const [, panes] = createSignalList<Pane>([], pane => pane.id)
// panes.ids(): Array<`pane-${number}`>
// panes.get('pane-3') is type-safe
```

- If you need the controls without the reactive getter, call `createSignalListControls`, which shares the same generics and type inference as `createSignalList`.
