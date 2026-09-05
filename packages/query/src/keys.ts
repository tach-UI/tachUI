/**
 * Structured query keys: canonical encoding, stable hashing, and the payload
 * codec (#278).
 *
 * Keys stay `readonly unknown[]` — the array is retained for prefix matching
 * and devtools — while a canonical encoding of it serves three jobs at once:
 *
 * - **Hash.** `JSON.stringify` of the encoding is the cache map key. The
 *   encoding sorts object properties, so property order cannot split one
 *   logical key across two entries.
 * - **Wire form.** The encoding is JSON-safe by construction and decodes back
 *   to an equal key, so a snapshot survives the SSR boundary exactly. Plain
 *   JSON keys encode to themselves, so the common payload is unchanged.
 * - **Validation.** Anything that cannot be canonicalized — a function, a
 *   symbol, a class instance with no `toJSON` — raises instead of silently
 *   producing a key that collides with its neighbours.
 *
 * What plain `JSON.stringify` gets wrong is handled with tagged wrappers:
 * `bigint` as `"123n"`, `Uint8Array` as base64, `Date` as ISO 8601, an
 * explicit `undefined` distinguished from an absent property, and `NaN`,
 * `Infinity`, and `-0` as tokens. Each wrapper is a distinct rendering, so
 * `new Date(t)` and its own ISO string no longer share an entry.
 */

import { QueryError } from './errors'
import type { QueryKey, QueryKeyHash } from './types'

/**
 * Property name reserved for the tagged wrappers below. A key containing it
 * would be indistinguishable from an encoded value — and would decode into
 * something the caller never wrote — so the shape is refused rather than
 * allowed to collide.
 */
const KEY_MARKER = '__tachuiQuery'

/** Wrapper payload property. Only carried by the tags that need one. */
const KEY_VALUE = 'value'

type KeyTag =
  | 'undefined'
  | 'NaN'
  | 'Infinity'
  | '-Infinity'
  | '-0'
  | 'bigint'
  | 'bytes'
  | 'date'

interface TaggedValue {
  readonly [KEY_MARKER]: KeyTag
  readonly [KEY_VALUE]?: string
}

/** Tags whose wrapper carries a payload; the rest stand alone. */
const VALUED_TAGS: ReadonlySet<string> = new Set(['bigint', 'bytes', 'date'])
const VALUELESS_TAGS: ReadonlySet<string> = new Set([
  'undefined',
  'NaN',
  'Infinity',
  '-Infinity',
  '-0',
])

function isKeyTag(name: unknown): name is KeyTag {
  return (
    typeof name === 'string' &&
    (VALUED_TAGS.has(name) || VALUELESS_TAGS.has(name))
  )
}

function tag(name: KeyTag, value?: string): TaggedValue {
  return value === undefined
    ? { [KEY_MARKER]: name }
    : { [KEY_MARKER]: name, [KEY_VALUE]: value }
}

/** Brand checks that hold across realms (structured clones, SSR payloads). */
function isDateValue(value: unknown): value is Date {
  return Object.prototype.toString.call(value) === '[object Date]'
}

/**
 * The %TypedArray%.prototype[@@toStringTag] getter, borrowed once. It reports
 * the [[TypedArrayName]] internal slot and returns undefined for anything
 * without one, so unlike `Object.prototype.toString` it cannot be spoofed —
 * neither by a plain object carrying `Symbol.toStringTag: 'Uint8Array'` (which
 * would otherwise be read through as array-like and hash as real bytes) nor by
 * a genuine Int8Array with that tag defined on it. It holds across realms, and
 * it has existed since ES2015, so a missing descriptor is a broken runtime
 * rather than a case to degrade quietly for.
 */
const typedArrayTag = Object.getOwnPropertyDescriptor(
  Object.getPrototypeOf(Uint8Array.prototype) as object,
  Symbol.toStringTag
)!.get as (this: unknown) => string | undefined

function isByteArray(value: unknown): value is Uint8Array {
  return typedArrayTag.call(value) === 'Uint8Array'
}

const BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/** Whole quartets, optionally closed by one padded quartet. */
const BASE64_PATTERN =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/

/**
 * Base64 without `btoa` or `Buffer`. Both exist in most runtimes but neither
 * exists in all of them, and a key hash that changes with the host is exactly
 * the instability this module is here to prevent.
 */
function toBase64(bytes: Uint8Array): string {
  let output = ''
  for (let index = 0; index < bytes.length; index += 3) {
    const chunk =
      (bytes[index]! << 16) |
      ((bytes[index + 1] ?? 0) << 8) |
      (bytes[index + 2] ?? 0)
    const remaining = bytes.length - index
    output +=
      BASE64_ALPHABET[(chunk >> 18) & 63]! +
      BASE64_ALPHABET[(chunk >> 12) & 63]! +
      (remaining > 1 ? BASE64_ALPHABET[(chunk >> 6) & 63]! : '=') +
      (remaining > 2 ? BASE64_ALPHABET[chunk & 63]! : '=')
  }
  return output
}

function fromBase64(text: string, path: string): Uint8Array {
  // Full shape, not just length and charset: `====`, `A===`, and `=ABC` all
  // satisfy those and would decode to arbitrary bytes, so a payload could
  // name a value in a form this encoder never emits.
  if (!BASE64_PATTERN.test(text)) {
    throw new QueryError(
      `Cannot decode query key: malformed base64 at ${path}.`
    )
  }
  // Padding placement is not enough: the bits a padded quartet does not use
  // must be zero, or one byte string has several spellings (AB== and AA==
  // both decode to [0]). Only the spelling this encoder emits is accepted.
  const padding = text.endsWith('==') ? 2 : text.endsWith('=') ? 1 : 0
  const unusedBits =
    padding === 1
      ? BASE64_ALPHABET.indexOf(text[text.length - 2]!) & 0b11
      : padding === 2
        ? BASE64_ALPHABET.indexOf(text[text.length - 3]!) & 0b1111
        : 0
  if (unusedBits !== 0) {
    throw new QueryError(
      `Cannot decode query key: malformed base64 at ${path}.`
    )
  }
  const bytes = new Uint8Array((text.length / 4) * 3 - padding)
  let offset = 0
  for (let index = 0; index < text.length; index += 4) {
    const chunk =
      (BASE64_ALPHABET.indexOf(text[index]!) << 18) |
      (BASE64_ALPHABET.indexOf(text[index + 1]!) << 12) |
      (Math.max(BASE64_ALPHABET.indexOf(text[index + 2]!), 0) << 6) |
      Math.max(BASE64_ALPHABET.indexOf(text[index + 3]!), 0)
    if (offset < bytes.length) bytes[offset++] = (chunk >> 16) & 255
    if (offset < bytes.length) bytes[offset++] = (chunk >> 8) & 255
    if (offset < bytes.length) bytes[offset++] = chunk & 255
  }
  return bytes
}

/**
 * Assigns an own property, including the one name a plain assignment cannot
 * create. `target.__proto__ = v` reaches Object.prototype's setter, which
 * changes the prototype (or does nothing at all for a primitive) and leaves no
 * own property behind — so a key carrying an own `__proto__` member would
 * encode exactly like one without it, and decoding would drop it again.
 */
function setOwnMember(
  target: Record<string, unknown>,
  member: string,
  value: unknown
): void {
  if (member === '__proto__') {
    Object.defineProperty(target, member, {
      value,
      enumerable: true,
      writable: true,
      configurable: true,
    })
    return
  }
  target[member] = value
}

/** Whether a property name is one of the indices an array renders. */
function isRenderedIndex(member: string, length: number): boolean {
  const index = Number(member)
  return (
    Number.isInteger(index) &&
    index >= 0 &&
    index < length &&
    String(index) === member
  )
}

/** Own symbol properties, enumerable or not: nothing renders them. */
function hasOwnSymbol(value: object): boolean {
  return Object.getOwnPropertySymbols(value).length > 0
}

/**
 * Own properties the encoding does not carry: symbols (enumerable or not),
 * non-enumerable string keys on an object, and non-index names on an array.
 * Siblings differing only by one would encode identically and serve each
 * other's data. An array's own `length` is structural, and array indices are
 * carried regardless of enumerability.
 */
export function hasUnrenderedOwnProps(value: object): boolean {
  if (hasOwnSymbol(value)) {
    return true
  }
  if (Array.isArray(value)) {
    return Object.getOwnPropertyNames(value).some(
      (member) => member !== 'length' && !isRenderedIndex(member, value.length)
    )
  }
  return Object.getOwnPropertyNames(value).some(
    (member) => !Object.prototype.propertyIsEnumerable.call(value, member)
  )
}

/**
 * Cycle guard. A shared (non-circular) reference revisits after its subtree is
 * done, so entries are removed on the way out; only a true revisit while still
 * inside throws.
 */
function enterStructure<T>(
  value: object,
  path: string,
  seen: Set<object>,
  visit: () => T
): T {
  if (seen.has(value)) {
    throw new QueryError(
      `Cannot hash query key: circular reference detected at ${path}.`
    )
  }
  seen.add(value)
  try {
    return visit()
  } finally {
    seen.delete(value)
  }
}

function encodeValue(value: unknown, path: string, seen: Set<object>): unknown {
  if (value === undefined) {
    // Distinguished from an absent property and from null, so
    // ['user', undefined] and ['user', null] stay separate entries.
    return tag('undefined')
  }
  if (value === null) {
    return null
  }
  switch (typeof value) {
    case 'string':
    case 'boolean':
      return value
    case 'number':
      if (Number.isNaN(value)) {
        return tag('NaN')
      }
      if (value === Number.POSITIVE_INFINITY) {
        return tag('Infinity')
      }
      if (value === Number.NEGATIVE_INFINITY) {
        return tag('-Infinity')
      }
      // -0 renders as 0 in JSON, so the two would share an entry and serve
      // each other's data (notably with flipped reciprocals).
      if (Object.is(value, -0)) {
        return tag('-0')
      }
      return value
    case 'bigint':
      return tag('bigint', `${value}n`)
    case 'function':
      throw new QueryError(
        `Cannot hash query key: functions are not supported at ${path}.`
      )
    case 'symbol':
      throw new QueryError(
        `Cannot hash query key: symbols are not supported at ${path}.`
      )
    default:
      break
  }
  const target = value as object
  if (isByteArray(value)) {
    return tag('bytes', toBase64(value))
  }
  // A toJSON hook replaces the rendering, so the encoding follows it — but
  // every Date carries the stock Date.prototype.toJSON, and routing Dates
  // through it would render a bare ISO string that collides with the string
  // itself. Only an *overridden* hook wins; the stock one yields to the
  // tagged form below.
  const toJSON = (target as { toJSON?: unknown }).toJSON
  const hasOwnHook =
    typeof toJSON === 'function' && toJSON !== Date.prototype.toJSON
  if (isDateValue(value) && !hasOwnHook) {
    // Symbol.toStringTag makes the brand check spoofable, and the prototype
    // methods throw on an impostor. A spoof falls through to the ordinary
    // object path below, where its symbol key is rejected on its own terms.
    let time: number | undefined
    try {
      time = Date.prototype.getTime.call(value)
    } catch {
      time = undefined
    }
    if (time !== undefined) {
      if (Number.isNaN(time)) {
        // An invalid Date has no instant to canonicalize, and every invalid
        // Date would otherwise render alike regardless of how it was built.
        throw new QueryError(
          `Cannot hash query key: invalid Dates cannot be hashed at ${path}.`
        )
      }
      return tag('date', Date.prototype.toISOString.call(value))
    }
  }
  // Validated inside the parent's frame so a self-returning hook trips the
  // cycle guard instead of overflowing the stack.
  if (typeof toJSON === 'function') {
    let rendered: unknown
    try {
      rendered = toJSON.call(value)
    } catch (hookError) {
      throw new QueryError(`Cannot hash query key: toJSON threw at ${path}.`, {
        cause: hookError,
      })
    }
    return enterStructure(target, path, seen, () =>
      encodeValue(rendered, path, seen)
    )
  }
  if (Array.isArray(value)) {
    // Extra own properties are never carried, so an augmented array would
    // encode identically to its bare twin.
    if (hasUnrenderedOwnProps(target)) {
      throw new QueryError(
        `Cannot hash query key: arrays with non-index properties are not supported at ${path} (they are dropped from the hash, so distinct keys would collide).`
      )
    }
    // Index loop rather than map: holes read as undefined, which the tag
    // distinguishes instead of collapsing to null.
    return enterStructure(target, path, seen, () => {
      const encoded: unknown[] = []
      for (let index = 0; index < value.length; index += 1) {
        encoded.push(encodeValue(value[index], `${path}[${index}]`, seen))
      }
      return encoded
    })
  }
  // Checked before the property scan so the message names the real problem:
  // a Map or a URLSearchParams is a class instance, not an object that
  // happens to carry an internal symbol property.
  if (!isPlainObject(target)) {
    throw new QueryError(
      `Cannot hash query key: class instances without toJSON are not supported at ${path}.`
    )
  }
  if (hasOwnSymbol(target)) {
    throw new QueryError(
      `Cannot hash query key: symbol-keyed properties are not supported at ${path} (they are dropped from the hash, so distinct keys would collide).`
    )
  }
  if (hasUnrenderedOwnProps(target)) {
    throw new QueryError(
      `Cannot hash query key: non-enumerable properties are not supported at ${path} (they are dropped from the hash, so distinct keys would collide).`
    )
  }
  if (KEY_MARKER in (value as Record<string, unknown>)) {
    throw new QueryError(
      `Cannot hash query key: the property ${KEY_MARKER} is reserved for the canonical encoding at ${path}.`
    )
  }
  // Sorted, so property order cannot split one logical key across two entries.
  return enterStructure(target, path, seen, () => {
    const encoded: Record<string, unknown> = {}
    for (const member of Object.keys(value as object).sort()) {
      setOwnMember(
        encoded,
        member,
        encodeValue(
          (value as Record<string, unknown>)[member],
          `${path}.${member}`,
          seen
        )
      )
    }
    return encoded
  })
}

/**
 * Plain-or-protoless check that holds across realms: a plain object has at
 * most one link above it (its realm's object prototype, or nothing).
 */
export function isPlainObject(value: object): boolean {
  const prototype: unknown = Object.getPrototypeOf(value)
  return (
    prototype === Object.prototype ||
    prototype === null ||
    Object.getPrototypeOf(prototype) === null
  )
}

function decodeTagged(value: TaggedValue, path: string): unknown {
  const name: unknown = value[KEY_MARKER]
  if (!isKeyTag(name)) {
    throw new QueryError(
      `Cannot decode query key: unknown tag ${JSON.stringify(name)} at ${path}.`
    )
  }
  // The encoder emits the marker and, for the tags that carry one, a value —
  // nothing else. Accepting a surplus property would silently drop data the
  // payload claimed to carry.
  const valued = VALUED_TAGS.has(name)
  const members = Object.keys(value)
  if (
    members.length !== (valued ? 2 : 1) ||
    members.some((member) => member !== KEY_MARKER && member !== KEY_VALUE) ||
    (valued && !members.includes(KEY_VALUE))
  ) {
    throw new QueryError(
      `Cannot decode query key: malformed ${name} wrapper at ${path}.`
    )
  }
  const payload = value[KEY_VALUE]
  switch (name) {
    case 'undefined':
      return undefined
    case 'NaN':
      return Number.NaN
    case 'Infinity':
      return Number.POSITIVE_INFINITY
    case '-Infinity':
      return Number.NEGATIVE_INFINITY
    case '-0':
      return -0
    case 'bigint':
      if (typeof payload !== 'string' || !/^-?\d+n$/.test(payload)) {
        throw new QueryError(
          `Cannot decode query key: malformed bigint at ${path}.`
        )
      }
      return BigInt(payload.slice(0, -1))
    case 'bytes':
      if (typeof payload !== 'string') {
        throw new QueryError(
          `Cannot decode query key: malformed bytes at ${path}.`
        )
      }
      return fromBase64(payload, path)
    case 'date': {
      if (typeof payload !== 'string') {
        throw new QueryError(
          `Cannot decode query key: malformed date at ${path}.`
        )
      }
      const revived = new Date(payload)
      if (Number.isNaN(revived.getTime())) {
        throw new QueryError(
          `Cannot decode query key: malformed date at ${path}.`
        )
      }
      return revived
    }
  }
}

function decodeValue(value: unknown, path: string): unknown {
  if (value === null) {
    return null
  }
  switch (typeof value) {
    case 'string':
    case 'boolean':
    case 'number':
      return value
    case 'object':
      break
    default:
      // A JSON payload holds none of these, but a payload handed over
      // in-process rather than through a socket can: `undefined` and
      // `bigint` are canonical values in their own right. Encoding then
      // decoding normalizes them, and rejects a function or symbol with the
      // encoder's message rather than a vaguer one.
      return decodeValue(encodeValue(value, path, new Set()), path)
  }
  if (Array.isArray(value)) {
    // A raw array — one handed over in process rather than through JSON —
    // can carry properties the encoding never renders. Mapping over it would
    // quietly drop them and store the data under a key the caller never
    // named, while a direct fetch with the same key raises.
    if (hasUnrenderedOwnProps(value)) {
      throw new QueryError(
        `Cannot decode query key: arrays with non-index properties are not supported at ${path} (they are dropped from the hash, so distinct keys would collide).`
      )
    }
    return value.map((member, index) => decodeValue(member, `${path}[${index}]`))
  }
  if (!isPlainObject(value as object)) {
    // Likewise for a Date, a Uint8Array, or a toJSON carrier arriving raw.
    return decodeValue(encodeValue(value, path, new Set()), path)
  }
  // Same reasoning as the array branch: Object.keys would silently drop a
  // symbol or non-enumerable member that the encoder refuses outright. Run
  // ahead of the tag branch so a tag-shaped object is held to it too — its
  // own surplus check reads only enumerable string keys, so a hidden extra
  // would otherwise ride through and be dropped.
  if (hasOwnSymbol(value as object)) {
    throw new QueryError(
      `Cannot decode query key: symbol-keyed properties are not supported at ${path} (they are dropped from the hash, so distinct keys would collide).`
    )
  }
  if (hasUnrenderedOwnProps(value as object)) {
    throw new QueryError(
      `Cannot decode query key: non-enumerable properties are not supported at ${path} (they are dropped from the hash, so distinct keys would collide).`
    )
  }
  if (KEY_MARKER in (value as Record<string, unknown>)) {
    return decodeTagged(value as TaggedValue, path)
  }
  const decoded: Record<string, unknown> = {}
  for (const member of Object.keys(value as object)) {
    setOwnMember(
      decoded,
      member,
      decodeValue(
        (value as Record<string, unknown>)[member],
        `${path}.${member}`
      )
    )
  }
  return decoded
}

/**
 * The canonical, JSON-safe encoding of a key. This is what the payload
 * carries: it round-trips through `JSON.stringify`/`JSON.parse` and decodes
 * back to an equal key, and it is identical to the key itself whenever the key
 * is already plain JSON.
 */
export function encodeQueryKey(key: QueryKey): readonly unknown[] {
  const encoded = encodeValue(key, 'key', new Set())
  if (!Array.isArray(encoded)) {
    // Reachable only through a toJSON hook on the key array itself. Such a
    // key has no addressable segments, so no prefix could ever name it and
    // the payload could not round-trip as a key — an unstable key rather
    // than a usable one.
    throw new QueryError(
      'Cannot hash query key: a key must be an array (a toJSON hook on the key itself may have rendered one thing into another).'
    )
  }
  return encoded
}

/**
 * Rebuilds a key from {@link encodeQueryKey} output. Payloads cross a trust
 * boundary, so every tag and its payload are validated rather than assumed.
 */
export function decodeQueryKey(encoded: unknown, path = 'key'): QueryKey {
  const decoded = decodeValue(encoded, path)
  if (!Array.isArray(decoded)) {
    throw new QueryError(
      `Cannot decode query key: expected an array at ${path}.`
    )
  }
  return decoded
}

/**
 * A structured key equal to `key` but sharing no references with it, with
 * every `toJSON` hook already resolved. Used to store a key on an entry: the
 * caller's array can be mutated afterwards without desyncing the entry from
 * its hash.
 */
export function canonicalizeQueryKey(key: QueryKey): QueryKey {
  return decodeQueryKey(encodeQueryKey(key))
}

/**
 * The hash of an already-encoded key. Callers that need the encoding, the
 * hash, and the segment hashes together take them from one pass rather than
 * encoding three times — which also means a `toJSON` hook is invoked once per
 * insert, so a non-deterministic one cannot produce an entry whose key, hash,
 * and segments disagree with each other.
 */
export function hashEncodedKey(encoded: readonly unknown[]): QueryKeyHash {
  return JSON.stringify(encoded)
}

/** The per-segment hashes of an already-encoded key. */
export function hashEncodedSegments(
  encoded: readonly unknown[]
): QueryKeyHash[] {
  return encoded.map((segment) => JSON.stringify(segment))
}

/**
 * The deterministic hash used as the cache map key. Equal keys always produce
 * it; property order, `Date` identity, and `bigint` width never change it.
 */
export function hashQueryKey(key: QueryKey): QueryKeyHash {
  return hashEncodedKey(encodeQueryKey(key))
}

/**
 * Per-segment hashes, taken from the encoded array so a `toJSON` hook on the
 * key array itself is resolved first — the raw elements are not what the entry
 * is keyed by.
 */
export function hashKeySegments(key: QueryKey): QueryKeyHash[] {
  return hashEncodedSegments(encodeQueryKey(key))
}

/**
 * Prefix match over hashed segments. Comparing hashes rather than values keeps
 * `Date`, `Uint8Array`, and object segments reachable by value — the same
 * entries `fetchQuery` would serve.
 */
export function isKeyPrefixMatch(
  prefixHashes: readonly QueryKeyHash[],
  segmentHashes: readonly QueryKeyHash[]
): boolean {
  if (prefixHashes.length > segmentHashes.length) {
    return false
  }
  for (let index = 0; index < prefixHashes.length; index += 1) {
    if (prefixHashes[index] !== segmentHashes[index]) {
      return false
    }
  }
  return true
}
