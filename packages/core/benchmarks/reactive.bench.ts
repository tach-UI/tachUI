/**
 * Reactive system benchmarks
 *
 * Performance tests to ensure TachUI reactive system performs
 * within 10% of SolidJS benchmarks as specified in Phase 1 success criteria.
 */

import { bench, describe } from 'vitest'
import {
  batch,
  createComputed,
  createEffect,
  createRoot,
  createSignal,
  flushSync,
} from '../src/reactive'

describe('Signal Performance', () => {
  bench('create 1000 signals', () => {
    for (let i = 0; i < 1000; i++) {
      createSignal(i)
    }
  })

  bench('read signal 1000 times', () => {
    const [count] = createSignal(42)
    for (let i = 0; i < 1000; i++) {
      count()
    }
  })

  bench('update signal 1000 times', () => {
    const [_count, setCount] = createSignal(0)
    for (let i = 0; i < 1000; i++) {
      setCount(i)
    }
  })

  bench('batch 1000 updates', () => {
    const [_count, setCount] = createSignal(0)

    batch(() => {
      for (let i = 0; i < 1000; i++) {
        setCount(i)
      }
    })
  })
})

describe('Computed Performance', () => {
  bench('create 1000 computed values', () => {
    const [source] = createSignal(1)

    for (let i = 0; i < 1000; i++) {
      createComputed(() => source() * i)
    }
  })

  bench('read computed value 1000 times', () => {
    const [source] = createSignal(1)
    const computed = createComputed(() => source() * 2)

    for (let i = 0; i < 1000; i++) {
      computed()
    }
  })

  bench('chain 100 computed values', () => {
    const [source] = createSignal(1)
    let current = createComputed(() => source())

    for (let i = 0; i < 100; i++) {
      const prev = current
      current = createComputed(() => prev() + 1)
    }

    current() // Force evaluation
  })
})

describe('Effect Performance', () => {
  bench('create 1000 effects', () => {
    const [source] = createSignal(1)

    createRoot(() => {
      for (let i = 0; i < 1000; i++) {
        createEffect(() => {
          source() // Track dependency
        })
      }
    })
  })

  bench('trigger 1000 effects', () => {
    const [source, setSource] = createSignal(1)
    let _counter = 0

    createRoot(() => {
      for (let i = 0; i < 1000; i++) {
        createEffect(() => {
          source()
          _counter++
        })
      }
    })

    setSource(2) // Trigger all effects
    flushSync()
  })
})

describe('Memory Performance', () => {
  bench('create and dispose 1000 reactive contexts', () => {
    for (let i = 0; i < 1000; i++) {
      createRoot((dispose) => {
        const [count, _setCount] = createSignal(i)
        createComputed(() => count() * 2)
        createEffect(() => count())
        dispose()
      })
    }
  })

  bench('diamond dependency pattern', () => {
    createRoot(() => {
      const [source, setSource] = createSignal(1)

      // Create diamond pattern: source -> a,b -> result
      const a = createComputed(() => source() * 2)
      const b = createComputed(() => source() * 3)
      const result = createComputed(() => a() + b())

      // Trigger updates
      for (let i = 0; i < 100; i++) {
        setSource(i)
        result() // Force evaluation
      }
    })
  })
})

describe('Complex Scenarios', () => {
  bench('reactive application simulation', () => {
    createRoot(() => {
      // Simulate a complex reactive application
      const [users, setUsers] = createSignal([
        { id: 1, name: 'John', active: true },
        { id: 2, name: 'Jane', active: false },
        { id: 3, name: 'Bob', active: true },
      ])

      const [filter, setFilter] = createSignal('all')

      const filteredUsers = createComputed(() => {
        const userList = users()
        const filterValue = filter()

        if (filterValue === 'active') {
          return userList.filter((u) => u.active)
        }
        if (filterValue === 'inactive') {
          return userList.filter((u) => !u.active)
        }
        return userList
      })

      const userCount = createComputed(() => filteredUsers().length)
      const firstUser = createComputed(() => filteredUsers()[0]?.name ?? 'None')

      // Simulate user interactions
      for (let i = 0; i < 100; i++) {
        if (i % 3 === 0) {
          setFilter(['all', 'active', 'inactive'][i % 3])
        }
        if (i % 5 === 0) {
          setUsers((prev) => [
            ...prev,
            { id: prev.length + 1, name: `User${i}`, active: i % 2 === 0 },
          ])
        }

        // Force evaluation
        userCount()
        firstUser()
      }
    })
  })
})
