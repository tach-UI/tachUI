/**
 * Canonical query keys (#278): stable hashing across all supported types,
 * order-insensitive object keys, development errors for input that cannot be
 * canonicalized, and prefix matching over the structured form.
 */

import { describe, expect, it } from 'vitest'

import {
  canonicalizeQueryKey,
  decodeQueryKey,
  encodeQueryKey,
  hashKeySegments,
  hashQueryKey,
  isKeyPrefixMatch,
} from '../src/keys'
import { QueryError } from '../src/errors'

const instant = '2024-01-01T00:00:00.000Z'

/** A key survives the wire when its encoding does, and decodes back equal. */
function roundTrip(key: readonly unknown[]): readonly unknown[] {
  const wire = JSON.parse(JSON.stringify(encodeQueryKey(key)))
  return decodeQueryKey(wire)
}

describe('stable hashing', () => {
  it('produces identical hashes for equivalent inputs of every supported type', () => {
    const build = () => [
      'user',
      42,
      true,
      null,
      undefined,
      10n,
      -10n,
      new Date(instant),
      new Uint8Array([1, 2, 3]),
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      -0,
      { nested: [1, { deep: undefined }] },
    ]

    // Different objects, different Date and Uint8Array instances, same key.
    expect(hashQueryKey(build())).toBe(hashQueryKey(build()))
  })

  it('keeps an own __proto__ member distinct from its absence', () => {
    // A plain `acc[member] = value` reaches Object.prototype's setter for
    // this one name and creates no own property, so the two would encode
    // alike and share a cache entry.
    const withProto = JSON.parse('{"__proto__":1}') as Record<string, unknown>
    const other = JSON.parse('{"__proto__":2}') as Record<string, unknown>

    expect(Object.keys(withProto)).toEqual(['__proto__'])
    expect(hashQueryKey([withProto])).not.toBe(hashQueryKey([{}]))
    expect(hashQueryKey([withProto])).not.toBe(hashQueryKey([other]))
    expect(hashQueryKey([withProto])).toBe(
      hashQueryKey([JSON.parse('{"__proto__":1}')])
    )

    // ... and it survives the wire rather than being dropped on the way back.
    const revived = roundTrip([withProto])[0] as Record<string, unknown>
    expect(Object.keys(revived)).toEqual(['__proto__'])
    expect(revived['__proto__']).toBe(1)
    expect(Object.getPrototypeOf(revived)).toBe(Object.prototype)
  })

  it('is insensitive to object property order', () => {
    expect(hashQueryKey([{ a: 1, b: 2, c: 3 }])).toBe(
      hashQueryKey([{ c: 3, b: 2, a: 1 }])
    )
    // Nested, and through an array member.
    expect(hashQueryKey([{ outer: { x: 1, y: 2 } }, [{ p: 1, q: 2 }]])).toBe(
      hashQueryKey([{ outer: { y: 2, x: 1 } }, [{ q: 2, p: 1 }]])
    )
  })

  it('separates values plain JSON would collapse together', () => {
    const distinct = [
      [undefined],
      [null],
      [{}],
      [new Date(instant)],
      [instant],
      [10n],
      ['10n'],
      [10],
      [new Uint8Array([1, 2, 3])],
      [[1, 2, 3]],
      [Number.NaN],
      [Number.POSITIVE_INFINITY],
      [Number.NEGATIVE_INFINITY],
      [-0],
      [0],
      [{ id: undefined }],
    ]
    const hashes = distinct.map((key) => hashQueryKey(key))

    expect(new Set(hashes).size).toBe(distinct.length)
  })

  it('renders each type the way the issue specifies', () => {
    expect(encodeQueryKey([10n])).toEqual([{ __tachuiQuery: 'bigint', value: '10n' }])
    expect(encodeQueryKey([new Date(instant)])).toEqual([
      { __tachuiQuery: 'date', value: instant },
    ])
    expect(encodeQueryKey([new Uint8Array([255, 0, 16])])).toEqual([
      { __tachuiQuery: 'bytes', value: '/wAQ' },
    ])
    expect(encodeQueryKey([undefined])).toEqual([{ __tachuiQuery: 'undefined' }])
    expect(encodeQueryKey([Number.NaN])).toEqual([{ __tachuiQuery: 'NaN' }])
    expect(encodeQueryKey([Number.POSITIVE_INFINITY])).toEqual([
      { __tachuiQuery: 'Infinity' },
    ])
    expect(encodeQueryKey([-0])).toEqual([{ __tachuiQuery: '-0' }])
  })

  it('leaves a plain JSON key encoded as itself', () => {
    const plain = ['users', 1, 'detail', { page: 2, sort: 'asc' }]

    expect(encodeQueryKey(plain)).toEqual(plain)
    expect(hashQueryKey(plain)).toBe(JSON.stringify(plain))
  })
})

describe('payload codec', () => {
  it('round-trips every supported type through JSON', () => {
    const key = [
      'u',
      undefined,
      null,
      10n,
      -10n,
      new Date(instant),
      new Uint8Array([0, 127, 255]),
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      -0,
      { nested: { when: new Date(instant), missing: undefined } },
    ]
    const revived = roundTrip(key)

    expect(hashQueryKey(revived)).toBe(hashQueryKey(key))
    expect(revived[5]).toBeInstanceOf(Date)
    expect((revived[5] as Date).toISOString()).toBe(instant)
    expect(revived[6]).toBeInstanceOf(Uint8Array)
    expect(Array.from(revived[6] as Uint8Array)).toEqual([0, 127, 255])
    expect(revived[3]).toBe(10n)
    expect(Object.is(revived[10], -0)).toBe(true)
    expect(revived[7]).toBeNaN()
  })

  it('round-trips byte arrays of every padding length', () => {
    for (let length = 0; length <= 8; length += 1) {
      const bytes = new Uint8Array(
        Array.from({ length }, (_unused, index) => (index * 37) % 256)
      )
      const revived = roundTrip([bytes])[0] as Uint8Array

      expect(Array.from(revived)).toEqual(Array.from(bytes))
    }
  })

  it('canonicalizes into a decoupled key with hooks resolved', () => {
    const source: unknown[] = ['u', { id: 1 }, new Date(instant)]
    const canonical = canonicalizeQueryKey(source)

    expect(hashQueryKey(canonical)).toBe(hashQueryKey(source))
    // Mutating the caller's array cannot reach the canonical copy.
    ;(source[1] as { id: number }).id = 2
    source.push('extra')
    expect(canonical).toEqual(['u', { id: 1 }, new Date(instant)])
  })

  it('rejects payloads that are not the canonical encoding', () => {
    expect(() => decodeQueryKey('not-an-array')).toThrowError(/expected an array/)
    expect(() => decodeQueryKey([{ __tachuiQuery: 'nope' }])).toThrowError(
      /unknown tag/
    )
    expect(() => decodeQueryKey([{ __tachuiQuery: 'bigint', value: 'x' }])).toThrowError(
      /malformed bigint/
    )
    expect(() => decodeQueryKey([{ __tachuiQuery: 'date', value: 'x' }])).toThrowError(
      /malformed date/
    )
    expect(() => decodeQueryKey([{ __tachuiQuery: 'bytes', value: '!!' }])).toThrowError(
      /malformed base64/
    )
    expect(() => decodeQueryKey([{ __tachuiQuery: 'bytes', value: 7 }])).toThrowError(
      /malformed bytes/
    )
    expect(() => decodeQueryKey([{ __tachuiQuery: 'date', value: 7 }])).toThrowError(
      /malformed date/
    )
  })

  it('rejects base64 that this encoder would never emit', () => {
    // Length and charset alone accept these, and they would decode to
    // arbitrary bytes — a value named in a form the encoder never produces.
    for (const malformed of ['====', 'AB=C', 'A===', '=ABC', 'A', '=']) {
      expect(
        () => decodeQueryKey([{ __tachuiQuery: 'bytes', value: malformed }]),
        malformed
      ).toThrowError(/malformed base64/)
    }
    for (const valid of ['', '/w==', '/wA=', '/wAQ', '/wAQ/w==']) {
      expect(
        () => decodeQueryKey([{ __tachuiQuery: 'bytes', value: valid }]),
        valid
      ).not.toThrow()
    }
  })

  it('rejects tagged wrappers carrying anything extra', () => {
    expect(() =>
      decodeQueryKey([{ __tachuiQuery: 'undefined', extra: 1 }])
    ).toThrowError(/malformed undefined wrapper/)
    expect(() =>
      decodeQueryKey([{ __tachuiQuery: 'undefined', value: 'x' }])
    ).toThrowError(/malformed undefined wrapper/)
    expect(() =>
      decodeQueryKey([
        { __tachuiQuery: 'date', value: instant, extra: 1 },
      ])
    ).toThrowError(/malformed date wrapper/)
    // A valued tag with no value is equally not the canonical encoding.
    expect(() => decodeQueryKey([{ __tachuiQuery: 'date' }])).toThrowError(
      /malformed date wrapper/
    )
  })

  it('accepts a payload handed over in process rather than through JSON', () => {
    // An SSR framework can pass the object straight across, so raw Dates,
    // byte arrays, bigints, and undefined decode as themselves.
    const revived = decodeQueryKey([
      'u',
      new Date(instant),
      new Uint8Array([1, 2]),
      10n,
      undefined,
    ])

    expect(hashQueryKey(revived)).toBe(
      hashQueryKey(['u', new Date(instant), new Uint8Array([1, 2]), 10n, undefined])
    )
    // ... while a value no key may hold is still refused.
    expect(() => decodeQueryKey([() => 'id'])).toThrowError(/functions/)
  })
})

describe('development errors', () => {
  it('raises rather than producing an unstable key', () => {
    const cases: Array<[readonly unknown[], RegExp]> = [
      [[() => 'id'], /functions are not supported/],
      [[Symbol('id')], /symbols are not supported/],
      [[new Set(['a'])], /class instances without toJSON/],
      [[new Map()], /class instances without toJSON/],
      [[new URLSearchParams()], /class instances without toJSON/],
      [[new Date(Number.NaN)], /invalid Dates/],
      [[Object.assign(['x'], { tag: 1 })], /non-index properties/],
      [[{ [Symbol('s')]: 1 }], /symbol-keyed properties/],
      [[Object.defineProperty({ id: 1 }, 'hidden', { value: 2 })], /non-enumerable/],
      [[{ __tachuiQuery: 'undefined' }], /reserved/],
    ]

    for (const [key, message] of cases) {
      expect(() => hashQueryKey(key), String(message)).toThrowError(message)
      expect(() => hashQueryKey(key)).toThrowError(QueryError)
    }
  })

  it('reports the path to the offending segment', () => {
    expect(() => hashQueryKey(['a', { nested: [1, new Set()] }])).toThrowError(
      /key\[1\]\.nested\[1\]/
    )
  })

  it('detects circularity without overflowing', () => {
    const circular: unknown[] = ['u']
    circular.push(circular)
    expect(() => hashQueryKey(circular)).toThrowError(/circular/)

    const selfRendering: { toJSON: () => unknown } = {
      toJSON: () => selfRendering,
    }
    expect(() => hashQueryKey([selfRendering])).toThrowError(/circular/)
  })

  it('accepts a shared reference used twice', () => {
    const shared = { id: 1 }
    expect(() => hashQueryKey(['u', shared, shared])).not.toThrow()
  })
})

describe('prefix matching', () => {
  it('matches on array prefixes over the structured form', () => {
    const key = ['users', new Date(instant), 10n, { page: 1 }]
    const segments = hashKeySegments(key)

    for (let length = 0; length <= key.length; length += 1) {
      // A fresh Date and bigint of equal value must still match by value.
      const prefix = [
        'users',
        new Date(instant),
        10n,
        { page: 1 },
      ].slice(0, length)
      expect(isKeyPrefixMatch(hashKeySegments(prefix), segments)).toBe(true)
    }
    expect(isKeyPrefixMatch(hashKeySegments(['orders']), segments)).toBe(false)
    // Longer than the key cannot match.
    expect(
      isKeyPrefixMatch(hashKeySegments([...key, 'extra']), segments)
    ).toBe(false)
    // The ISO string is a different segment from the Date it renders as.
    expect(
      isKeyPrefixMatch(hashKeySegments(['users', instant]), segments)
    ).toBe(false)
  })

  it('reads segments through a hook on the key array itself', () => {
    const hooked = Object.assign(['raw'], { toJSON: () => ['wire', 1] })

    expect(hashKeySegments(hooked)).toEqual(hashKeySegments(['wire', 1]))
  })
})
