import { describe, expect, it } from 'vitest'
import { classifyPush } from '../pre-push.mjs'

const ZERO = '0'.repeat(40)

describe('classifyPush', () => {
  it('skips a single branch deletion', () => {
    const result = classifyPush(`(delete) ${ZERO} refs/heads/old abc123`)

    expect(result.skip).toBe(true)
    expect(result.deleted).toEqual(['refs/heads/old'])
  })

  it('skips a push deleting several branches at once', () => {
    const result = classifyPush(
      [
        `(delete) ${ZERO} refs/heads/a 111`,
        `(delete) ${ZERO} refs/heads/b 222`,
      ].join('\n')
    )

    expect(result.skip).toBe(true)
    expect(result.deleted).toEqual(['refs/heads/a', 'refs/heads/b'])
  })

  it('runs checks for a normal push', () => {
    const result = classifyPush(
      'refs/heads/main abc123 refs/heads/main def456'
    )

    expect(result.skip).toBe(false)
  })

  // A push that both deletes and adds commits must still be verified — the
  // deletions are irrelevant next to the commits riding along.
  it('runs checks when a deletion is mixed with a real update', () => {
    const result = classifyPush(
      [
        `(delete) ${ZERO} refs/heads/a 111`,
        'refs/heads/main abc123 refs/heads/main def456',
      ].join('\n')
    )

    expect(result.skip).toBe(false)
  })

  it('runs checks when stdin is empty', () => {
    expect(classifyPush('').skip).toBe(false)
    expect(classifyPush('   \n  \n').skip).toBe(false)
  })

  it('runs checks when a line cannot be parsed', () => {
    expect(classifyPush('nonsense').skip).toBe(false)
    expect(classifyPush('two fields').skip).toBe(false)
  })

  it('runs checks for null or undefined input rather than throwing', () => {
    expect(classifyPush(undefined as unknown as string).skip).toBe(false)
    expect(classifyPush(null as unknown as string).skip).toBe(false)
  })

  it('handles sha-256 length zero shas', () => {
    const result = classifyPush(`(delete) ${'0'.repeat(64)} refs/heads/old abc`)

    expect(result.skip).toBe(true)
  })

  it('does not treat a sha merely starting with zeros as a deletion', () => {
    const result = classifyPush(
      `refs/heads/x 0000000000000000000000000000000000000abc refs/heads/x def`
    )

    expect(result.skip).toBe(false)
  })

  it('tolerates a trailing newline from git', () => {
    expect(classifyPush(`(delete) ${ZERO} refs/heads/old abc\n`).skip).toBe(true)
  })
})
