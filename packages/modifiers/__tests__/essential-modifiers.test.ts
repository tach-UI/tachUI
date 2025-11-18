import { describe, it, expect } from 'vitest'
import { ESSENTIAL_MODIFIERS } from '../src/essential-manifest'
import { basicModifierRegistrations } from '../src/basic'

describe('Essential modifier guardrails', () => {
  it('registers all essential modifiers exactly once', () => {
    const registrationMap = new Map<string, number>()
    basicModifierRegistrations.forEach(([name]) => {
      registrationMap.set(name, (registrationMap.get(name) ?? 0) + 1)
    })

    ESSENTIAL_MODIFIERS.forEach(name => {
      expect(registrationMap.has(name)).toBe(true)
      expect(registrationMap.get(name)).toBe(1)
    })
  })
})
