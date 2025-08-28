import { bench, describe } from 'vitest'

describe('Quick Navigation Benchmarks', () => {
  // Essential performance checks for core functions
  bench('Basic function creation', () => {
    const fn = () => ({ type: 'NavigationStack', content: 'test' })
    fn()
  })

  bench('Object creation benchmark', () => {
    const obj = {
      type: 'NavigationLink',
      label: 'Test',
      destination: 'View',
    }
    return obj
  })

  bench('Array creation benchmark', () => {
    const tabs = [
      { id: 'tab1', title: 'Tab 1', content: 'Content 1' },
      { id: 'tab2', title: 'Tab 2', content: 'Content 2' },
    ]
    return tabs
  })

  bench('Simple computation', () => {
    let result = 0
    for (let i = 0; i < 100; i++) {
      result += i
    }
    return result
  })
})