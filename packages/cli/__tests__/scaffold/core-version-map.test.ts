import { describe, expect, it } from 'vitest'
import { resolveCoreVersionFromMap } from '../../src/scaffold/core-version-map'

describe('core version compatibility map', () => {
  it('returns mapped core version for known cli versions', () => {
    expect(resolveCoreVersionFromMap('0.8.8-alpha')).toBe('0.8.8-alpha')
  })

  it('falls back to default core version for unknown cli versions', () => {
    expect(resolveCoreVersionFromMap('9.9.9-alpha')).toBe('0.8.8-alpha')
    expect(resolveCoreVersionFromMap(null)).toBe('0.8.8-alpha')
  })
})

