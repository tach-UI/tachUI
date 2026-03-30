import { describe, expect, it } from 'vitest'
import { isPeerDependencyVersionCompatible } from '../check-packed-internal-deps.mjs'

describe('isPeerDependencyVersionCompatible', () => {
  it('accepts exact peer version pin', () => {
    expect(isPeerDependencyVersionCompatible('0.8.13', '0.8.13')).toEqual({
      valid: true,
    })
  })

  it('accepts caret and tilde ranges when they include expected version', () => {
    expect(isPeerDependencyVersionCompatible('^0.8.13', '0.8.13')).toEqual({
      valid: true,
    })
    expect(isPeerDependencyVersionCompatible('~0.8.13', '0.8.13')).toEqual({
      valid: true,
    })
  })

  it('accepts broad ranges when they include expected version (Option B policy)', () => {
    expect(isPeerDependencyVersionCompatible('>=0.8.0', '0.8.13')).toEqual({
      valid: true,
    })
  })

  it('rejects ranges that do not include expected version', () => {
    expect(isPeerDependencyVersionCompatible('^0.9.0', '0.8.13')).toEqual({
      valid: false,
      reason:
        'peer range "^0.9.0" does not include expected version "0.8.13"',
    })
  })

  it('accepts explicit wildcard and latest peer declarations', () => {
    expect(isPeerDependencyVersionCompatible('*', '0.8.13')).toEqual({
      valid: true,
    })
    expect(isPeerDependencyVersionCompatible('latest', '0.8.13')).toEqual({
      valid: true,
    })
  })

  it('rejects malformed ranges', () => {
    expect(isPeerDependencyVersionCompatible('foo', '0.8.13')).toEqual({
      valid: false,
      reason: 'invalid peer semver range "foo"',
    })
  })

  it('accepts prerelease compatibility when range includes prerelease', () => {
    expect(
      isPeerDependencyVersionCompatible('^0.8.13-alpha.0', '0.8.13-alpha.1')
    ).toEqual({
      valid: true,
    })
  })
})
