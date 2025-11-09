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
