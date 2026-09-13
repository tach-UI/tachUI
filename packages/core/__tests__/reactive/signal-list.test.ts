import { describe, it, expect } from 'vitest'
import { createSignalList, createEffect, flushSync } from '../../src/reactive'

type Item = { id: number; label: string }

const makeItems = (): Item[] => [
  { id: 1, label: 'Alpha' },
  { id: 2, label: 'Bravo' },
]

describe('createSignalList', () => {
  it('updates only the targeted item signal', () => {
    const [, list] = createSignalList(makeItems(), item => item.id)

    const firstHistory: string[] = []
    const secondHistory: string[] = []

    const firstEffect = createEffect(() => {
      const current = list.get(1)()
      firstHistory.push(current.label)
    })
    const secondEffect = createEffect(() => {
      const current = list.get(2)()
      secondHistory.push(current.label)
    })

    flushSync()
    expect(firstHistory).toEqual(['Alpha'])
    expect(secondHistory).toEqual(['Bravo'])

    list.update(1, { id: 1, label: 'Alpha*' })
    flushSync()

    expect(firstHistory).toEqual(['Alpha', 'Alpha*'])
    expect(secondHistory).toEqual(['Bravo'])

    firstEffect.dispose()
    secondEffect.dispose()
  })

  it('does not track getAll() calls by default', () => {
    const [, list] = createSignalList(makeItems(), item => item.id)

    let runCount = 0
    const effect = createEffect(() => {
      list.getAll()
      runCount++
    })

    flushSync()
    expect(runCount).toBe(1)

    list.update(2, { id: 2, label: 'Bravo*' })
    flushSync()

    expect(runCount).toBe(1)
    effect.dispose()
  })

  it('only updates structural signal when IDs change', () => {
    const [, list] = createSignalList(makeItems(), item => item.id)

    let structureRuns = 0
    const effect = createEffect(() => {
      list.ids()
      structureRuns++
    })

    flushSync()
    expect(structureRuns).toBe(1)

    list.set([
      { id: 1, label: 'Alpha updated' },
      { id: 2, label: 'Bravo updated' },
    ])
    flushSync()

    expect(structureRuns).toBe(1)

    list.set([
      { id: 2, label: 'Bravo updated' },
      { id: 3, label: 'Charlie' },
    ])
    flushSync()

    expect(structureRuns).toBe(2)
    effect.dispose()
  })
})

describe('track', () => {
  it('subscribes to one key without hearing about the rest', () => {
    const [, list] = createSignalList(makeItems(), item => item.id)
    let runs = 0
    const effect = createEffect(() => {
      list.track(1)()
      runs++
    })
    flushSync()
    expect(runs).toBe(1)

    list.update(2, { id: 2, label: 'Bravo edited' })
    list.set([
      ...list.getAll(),
      { id: 9, label: 'Added' },
    ])
    flushSync()
    // Another row changed and the membership grew; neither is this row's news.
    expect(runs).toBe(1)

    list.update(1, { id: 1, label: 'Alpha edited' })
    flushSync()
    expect(runs).toBe(2)
    effect.dispose()
  })

  it('answers for a key that does not exist yet, and reports its arrival', () => {
    const [, list] = createSignalList<{ id: number; label: string }, number>(
      [],
      item => item.id
    )
    const seen: (string | undefined)[] = []
    const effect = createEffect(() => {
      seen.push(list.track(7)()?.label)
    })
    flushSync()
    expect(seen).toEqual([undefined])

    list.update(7, { id: 7, label: 'arrived' })
    flushSync()
    expect(seen).toEqual([undefined, 'arrived'])
    effect.dispose()
  })

  it('hands back the same accessor across a key leaving and returning', () => {
    const [, list] = createSignalList(makeItems(), item => item.id)
    const row = list.track(2)
    expect(row()?.label).toBe('Bravo')

    list.remove(2)
    // Told it left, rather than throwing or going silent.
    expect(row()).toBeUndefined()

    list.update(2, { id: 2, label: 'Bravo returned' })
    // The same accessor, still live: a row dropped by a bound and re-fetched
    // does not orphan whatever was rendering it.
    expect(row()?.label).toBe('Bravo returned')
  })

  it('bounds how many departed keys it keeps, dropping the oldest', () => {
    const [, list] = createSignalList<{ id: number; label: string }, number>(
      [],
      item => item.id,
      { trackedKeys: 2 }
    )
    const first = list.track(1)
    const second = list.track(2)
    const third = list.track(3)

    // Three keys asked for, none of them held, and room for two: the first is
    // dropped.
    list.update(2, { id: 2, label: 'two' })
    list.update(3, { id: 3, label: 'three' })
    expect(second()?.label).toBe('two')
    expect(third()?.label).toBe('three')

    // This is the bound's cost, and it is precise: key 1's cell is gone, so the
    // row returns into a new signal and the accessor handed out earlier never
    // hears about it.
    list.update(1, { id: 1, label: 'one' })
    expect(first()).toBeUndefined()
    expect(list.track(1)()?.label).toBe('one')
  })

  it('keeps the most recently asked-for key over an older one', () => {
    const [, list] = createSignalList<{ id: number; label: string }, number>(
      [],
      item => item.id,
      { trackedKeys: 2 }
    )
    const first = list.track(1)
    list.track(2)
    // Asking again moves it back to the front of the queue.
    list.track(1)
    list.track(3)

    // Key 2 was the least recently asked for, so it went rather than key 1.
    list.update(1, { id: 1, label: 'one' })
    expect(first()?.label).toBe('one')
  })

  it('does not retain a key nobody tracked', () => {
    const [, list] = createSignalList(makeItems(), item => item.id)
    const before = list.getAll().length
    list.remove(1)
    expect(list.getAll()).toHaveLength(before - 1)
    // `get` still refuses a key the list does not hold.
    expect(() => list.get(1)).toThrow('not found')
  })
})
