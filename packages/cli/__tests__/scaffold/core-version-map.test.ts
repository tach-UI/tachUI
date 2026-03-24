import { describe, expect, it } from 'vitest'
import { resolveCoreVersionFromMap } from '../../src/scaffold/core-version-map'

describe('core version compatibility map', () => {
  it('returns mapped core version for known cli versions', () => {
    expect(resolveCoreVersionFromMap('0.8.8-alpha')).toBe('0.8.8-alpha')
    expect(resolveCoreVersionFromMap('0.8.9-alpha')).toBe('0.8.8-alpha')
    expect(resolveCoreVersionFromMap('0.8.6-alpha')).toBe('0.8.6-alpha')
  })

  it('supports stable semver in mapped ranges', () => {
    expect(resolveCoreVersionFromMap('0.8.8')).toBe('0.8.8-alpha')
  })

  it('returns null for unknown or invalid versions', () => {
    expect(resolveCoreVersionFromMap('9.9.9-alpha')).toBeNull()
    expect(resolveCoreVersionFromMap(null)).toBeNull()
    expect(resolveCoreVersionFromMap('not-a-version')).toBeNull()
  })
})
