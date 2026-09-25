/**
 * Deterministic query keys for Connect methods.
 *
 * A key is `['connect', transportName, serviceTypeName, methodName, request]`,
 * with an `'infinite'` segment after the method for an infinite query and any
 * `keyExtension` segments after the request. The request segment is the
 * method's input message written as Protobuf JSON and stably stringified:
 *
 * - **Normalized first.** A partial initializer and a generated message are
 *   both run through the input schema, so `{ pageSize: 50 }` and
 *   `create(Schema, { pageSize: 50 })` key alike.
 * - **Protobuf JSON, not the message.** `toJson` resolves int64, bytes, oneof,
 *   and enums through the schema, and a message never reaches
 *   `@tachui/query`'s hasher, which refuses class instances. Its options are
 *   pinned, so an omitted implicit zero and an explicit one render alike while
 *   an explicitly present optional zero stays distinct.
 * - **Stably stringified.** Object members are sorted at every depth, so
 *   neither field construction order nor map insertion order can split one
 *   request across two entries, and the result stays readable in devtools.
 *
 * Anything JSON cannot carry faithfully is refused rather than keyed: a
 * populated `google.protobuf.Any` or extension data (no registry is taken),
 * unknown fields preserved from a binary parse, which `toJson` would drop, and a
 * map or Struct key named `__proto__`, which the request copy would drop too.
 *
 * See ADR 0001: `docs/reference/adr/0001-data-and-communications-architecture.md`.
 */

import {
  clearField,
  clone,
  create,
  isFieldSet,
  isMessage,
  ScalarType,
  toJson,
} from '@bufbuild/protobuf'
import type {
  DescField,
  DescMessage,
  DescMethod,
  DescOneof,
  JsonValue,
  MessageInitShape,
  MessageShape,
} from '@bufbuild/protobuf'
import { isWrapperDesc } from '@bufbuild/protobuf/wkt'
import { isDevelopment } from '@tachui/query'

import { DEFAULT_TRANSPORT_NAME } from './defaults'
import { ConnectAdapterError } from './errors'
import { assertOptionsObject, assertValidName } from './transport'
import type {
  ConnectKeyOptions,
  ConnectQueryKey,
  ConnectQueryPrefixOptions,
  ConnectRequestOptions,
  ConnectTransportName,
} from './types'

/** The segment every Connect key starts with. */
const KEY_ROOT = 'connect'

/** Follows the method name in an infinite query's key, and only there. */
const INFINITE_SEGMENT = 'infinite'

/**
 * Pinned rather than left to protobuf-es defaults, so a change to a default
 * can never re-key every cached entry. camelCase names, enum names as strings,
 * and implicit zeros omitted.
 */
const JSON_WRITE_OPTIONS = {
  alwaysEmitImplicit: false,
  enumAsInteger: false,
  useProtoFieldName: false,
} as const

const ANY_TYPE_NAME = 'google.protobuf.Any'
const STRUCT_TYPE_NAME = 'google.protobuf.Struct'
const VALUE_TYPE_NAME = 'google.protobuf.Value'

/**
 * Assigning this name sets an object's prototype instead of adding an entry,
 * so the request copy and Protobuf JSON both lose a map entry by that name.
 */
const PROTO_KEY = '__proto__'

/** Protobuf bookkeeping on a message, never a field name. */
const TYPE_NAME_PROPERTY = '$typeName'
const UNKNOWN_PROPERTY = '$unknown'

/**
 * Options the key builder reads. The query options an adapter receives are
 * accepted as they are: `callOptions` rides along and is ignored, because
 * headers and context values never enter a key on their own.
 */
export type ConnectKeyBuildOptions = ConnectRequestOptions &
  ConnectKeyOptions & {
    /**
     * Present only for an infinite query: the request field carrying the
     * continuation token, as a dotted path of field names. The key omits it
     * and carries the `'infinite'` segment.
     */
    pageParamKey?: string
  }

/** A key and the request it was built from. */
export interface ConnectKeyedRequest<M extends DescMethod> {
  readonly key: ConnectQueryKey
  /**
   * The normalized request, sharing nothing with the caller's input. It is
   * what every attempt for this key — retries included — must send, so a later
   * change to the input can never attach its response to this key.
   */
  readonly request: MessageShape<M['input']>
}

function describeMethod(method: DescMethod): string {
  return `${method.parent.typeName}.${method.name}`
}

function describeValue(value: unknown): string {
  if (value === null) {
    return 'null'
  }
  return Array.isArray(value) ? 'an array' : typeof value
}

function assertMethod(
  method: unknown,
  caller: string
): asserts method is DescMethod {
  const candidate = method as Partial<DescMethod> | null
  if (
    typeof method !== 'object' ||
    candidate === null ||
    candidate.kind !== 'rpc' ||
    typeof candidate.name !== 'string' ||
    candidate.parent?.kind !== 'service'
  ) {
    throw new ConnectAdapterError(
      `${caller} was given ${describeValue(method)}, not a method descriptor. Pass a generated method, for example UserService.method.listUsers.`
    )
  }
}

/** Only an omitted name means the default; anything else must be valid. */
function transportNameFrom(
  name: unknown,
  caller: string,
  action: string
): ConnectTransportName {
  if (name === undefined) {
    return DEFAULT_TRANSPORT_NAME
  }
  assertValidName(name, caller, action)
  return name
}

/**
 * The key prefix of every entry for `method` on one transport — `'default'`
 * unless `options.transport` names another — covering unary and infinite
 * entries for any request. Pass it to `QueryClient.invalidate` or a mutation's
 * `invalidates`.
 *
 * The transport name precedes the method in a key, so no prefix can reach two
 * transports' entries: invalidate each transport by name.
 */
export function connectQueryPrefix(
  method: DescMethod,
  options?: ConnectQueryPrefixOptions
): ConnectQueryKey {
  const caller = 'connectQueryPrefix()'
  assertOptionsObject(
    options,
    caller,
    'Pass { transport } to target a named transport, or omit the options to target the default transport.'
  )
  const transport = transportNameFrom(options?.transport, caller, 'target')
  assertMethod(method, caller)
  return [KEY_ROOT, transport, method.parent.typeName, method.name]
}

function memberNamed(
  desc: DescMessage,
  localName: string
): DescField | DescOneof | undefined {
  return desc.members.find(member => member.localName === localName)
}

/** A singular message field, as opposed to a list or map of messages. */
type DescMessageField = DescField & { fieldKind: 'message' }

function isObjectValue(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasContent(value: unknown): boolean {
  return (
    value !== undefined &&
    value !== null &&
    (value as { length?: unknown }).length !== 0
  )
}

/**
 * Whether protobuf-es holds this message field as its wrapper's bare scalar,
 * as it does for a singular wrapper outside a oneof.
 */
function holdsWrapperAsScalar(field: DescMessageField): boolean {
  return field.oneof === undefined && isWrapperDesc(field.message)
}

/**
 * Whether protobuf-es holds this field's `google.protobuf.Struct` values as
 * JSON objects, as it does everywhere but inside `google.protobuf.Value`.
 */
function holdsStructAsJson(field: DescField, desc: DescMessage): boolean {
  return (
    desc.typeName === STRUCT_TYPE_NAME &&
    field.parent.typeName !== VALUE_TYPE_NAME
  )
}

function isExtensionNumber(desc: DescMessage, fieldNumber: number): boolean {
  return desc.proto.extensionRange.some(
    range => fieldNumber >= range.start && fieldNumber < range.end
  )
}

/**
 * Walks an initializer against its schema before anything is created from it.
 *
 * What would make the key disagree with the request is refused everywhere; an
 * unknown property only in development, since normalization drops it from the
 * key and the request alike, so there it is a typo rather than a wrong entry.
 */
class RequestChecker {
  private readonly open = new Set<object>()

  constructor(
    private readonly method: string,
    private readonly development: boolean
  ) {}

  private fail(message: string): never {
    throw new ConnectAdapterError(
      `Cannot build a query key for ${this.method}: ${message}`
    )
  }

  /** A development-only diagnostic; production follows normalization. */
  private warnOnly(message: string): void {
    if (this.development) {
      this.fail(message)
    }
  }

  message(desc: DescMessage, value: unknown, path: string): void {
    // Refused everywhere: normalization has no message to make of it.
    if (!isObjectValue(value)) {
      this.fail(
        `${path} is ${describeValue(value)}, but ${desc.typeName} is a message. Pass an initializer object or a message created with create().`
      )
    }
    if (this.open.has(value)) {
      this.fail(`${path} refers back to an object that contains it.`)
    }
    this.open.add(value)
    try {
      this.bookkeeping(desc, value, path)
      for (const name of Object.keys(value)) {
        if (name === TYPE_NAME_PROPERTY || name === UNKNOWN_PROPERTY) {
          continue
        }
        const member = memberNamed(desc, name)
        if (member === undefined) {
          this.warnOnly(
            `${path}.${name} is not a field of ${desc.typeName}. Field names are the camelCase names from generated code; a misspelled field would otherwise be dropped from the request without a word.`
          )
          continue
        }
        const memberValue = value[name]
        if (memberValue === undefined || memberValue === null) {
          continue
        }
        if (member.kind === 'oneof') {
          this.oneof(member, memberValue, `${path}.${name}`)
        } else {
          this.field(member, memberValue, `${path}.${name}`)
        }
      }
    } finally {
      this.open.delete(value)
    }
  }

  private bookkeeping(
    desc: DescMessage,
    value: Record<string, unknown>,
    path: string
  ): void {
    const typeName = value[TYPE_NAME_PROPERTY]
    if (typeName !== undefined && typeName !== desc.typeName) {
      this.fail(
        `${path} is a ${String(typeName)} message where ${desc.typeName} is expected. Pass a ${desc.typeName} or a plain initializer; converting one message type into another by matching field names would key a request nobody wrote.`
      )
    }
    const unknown = value[UNKNOWN_PROPERTY]
    if (
      unknown !== undefined &&
      !(Array.isArray(unknown) && unknown.length === 0)
    ) {
      const fields = Array.isArray(unknown)
        ? (unknown as { no?: unknown }[])
        : []
      const extension = fields.find(
        field =>
          typeof field?.no === 'number' && isExtensionNumber(desc, field.no)
      )
      if (extension !== undefined) {
        this.fail(
          `${path} carries extension data (field number ${String(extension.no)} of ${desc.typeName}). Writing extensions to Protobuf JSON needs a registry, and registries are not yet supported, so the request cannot be keyed. Clear the extension before passing the request.`
        )
      }
      const numbers = fields.map(field => String(field?.no)).join(', ')
      this.fail(
        `${path} carries unknown fields${numbers === '' ? '' : ` (field numbers ${numbers})`}, preserved from a binary parse. Protobuf JSON drops them, so requests differing only there would share one key. Build a fresh request from the fields you mean to send.`
      )
    }
    if (
      desc.typeName === ANY_TYPE_NAME &&
      (hasContent(value.typeUrl) || hasContent(value.value))
    ) {
      this.fail(
        `${path} holds a populated google.protobuf.Any${typeof value.typeUrl === 'string' && value.typeUrl !== '' ? ` (${value.typeUrl})` : ''}. Writing an Any to Protobuf JSON needs a registry, and registries are not yet supported, so the request cannot be keyed. Leave the field unset.`
      )
    }
  }

  private field(field: DescField, value: unknown, path: string): void {
    switch (field.fieldKind) {
      case 'message':
        // protobuf-es holds a singular wrapper outside a oneof as its bare
        // scalar, which normalization checks as it would any scalar.
        if (holdsWrapperAsScalar(field)) {
          return
        }
        this.messageValue(field, field.message, value, path)
        return
      case 'list':
        if (field.listKind === 'message' && Array.isArray(value)) {
          value.forEach((element: unknown, index) => {
            if (element !== undefined && element !== null) {
              this.messageValue(
                field,
                field.message,
                element,
                `${path}[${index}]`
              )
            }
          })
        }
        return
      case 'map':
        if (!isObjectValue(value)) {
          return
        }
        this.mapKeys(value, path)
        if (field.mapKind === 'message') {
          for (const entry of Object.keys(value)) {
            const element = value[entry]
            if (element !== undefined && element !== null) {
              this.messageValue(
                field,
                field.message,
                element,
                `${path}[${JSON.stringify(entry)}]`
              )
            }
          }
        }
        return
      default:
        return
    }
  }

  /** A value of a message-typed field, walked as protobuf-es holds it. */
  private messageValue(
    field: DescField,
    desc: DescMessage,
    value: unknown,
    path: string
  ): void {
    if (holdsStructAsJson(field, desc)) {
      this.struct(value, path)
    } else {
      this.message(desc, value, path)
    }
  }

  /**
   * A Struct held as a JSON object. Its keys are the caller's, not field
   * names, so only what a copy would lose is refused — and a message at any
   * depth, whose bookkeeping would otherwise be keyed and sent as the caller's
   * data, past the Any and unknown-field checks a message field gets.
   */
  private struct(value: unknown, path: string): void {
    if (!isObjectValue(value)) {
      this.fail(
        `${path} is ${describeValue(value)}, but ${STRUCT_TYPE_NAME} is a JSON object. Pass a plain object.`
      )
    }
    this.json(value, path)
  }

  private json(value: unknown, path: string): void {
    if (typeof value !== 'object' || value === null) {
      return
    }
    if (this.open.has(value)) {
      this.fail(`${path} refers back to an object that contains it.`)
    }
    this.open.add(value)
    try {
      if (Array.isArray(value)) {
        value.forEach((element: unknown, index) => {
          this.json(element, `${path}[${index}]`)
        })
        return
      }
      // protobuf-es takes any object with a string $typeName for a message.
      if (isMessage(value)) {
        this.fail(
          `${path} is a ${value.$typeName} message, but a ${STRUCT_TYPE_NAME} position takes a plain JSON object. Pass the plain JSON the message describes, for example { name: 'Ada' }.`
        )
      }
      const members = value as Record<string, unknown>
      this.mapKeys(members, path)
      for (const name of Object.keys(members)) {
        this.json(members[name], `${path}[${JSON.stringify(name)}]`)
      }
    } finally {
      this.open.delete(value)
    }
  }

  /** Refused everywhere: the key and the request would both lose the entry. */
  private mapKeys(value: Record<string, unknown>, path: string): void {
    if (Object.hasOwn(value, PROTO_KEY)) {
      this.fail(
        `${path}[${JSON.stringify(PROTO_KEY)}] cannot be keyed. Copying the request sets an object's prototype for that name instead of adding an entry, so both the key and the request sent would drop it and match a request without it. Use another key.`
      )
    }
  }

  private oneof(oneof: DescOneof, value: unknown, path: string): void {
    if (!isObjectValue(value)) {
      this.warnOnly(
        `${path} is ${describeValue(value)}, but ${oneof.localName} is a oneof. Pass { case, value }.`
      )
      return
    }
    for (const name of Object.keys(value)) {
      if (name !== 'case' && name !== 'value') {
        this.warnOnly(
          `${path}.${name} is not part of a oneof. Pass { case, value }.`
        )
      }
    }
    const selected = value.case
    if (selected === undefined || selected === null) {
      return
    }
    const field = oneof.fields.find(member => member.localName === selected)
    if (field === undefined) {
      this.warnOnly(
        `${path}.case is ${JSON.stringify(selected)}, which is not a field of the oneof ${oneof.localName}.`
      )
      return
    }
    const selectedValue = value.value
    if (
      field.fieldKind === 'message' &&
      selectedValue !== undefined &&
      selectedValue !== null
    ) {
      this.messageValue(field, field.message, selectedValue, `${path}.value`)
    }
  }
}

/**
 * Removes the page param from a copy of the request, so every page of one
 * list keys alike. The path is resolved against the schema even where the
 * request leaves it unset, so a misspelled `pageParamKey` fails on the first
 * page rather than keying each token separately. A path may pass only through
 * fields protobuf-es holds as messages, not a wrapper's bare scalar or a
 * Struct's JSON object.
 *
 * A parent message the path passes through is dropped from the copy once
 * nothing is left in it, so a parent absent, present but empty, or holding
 * only the token keys alike.
 */
function omitPageParam(
  schema: DescMessage,
  request: Record<string, unknown>,
  pageParamKey: unknown,
  method: string
): void {
  const invalid = (detail: string): ConnectAdapterError =>
    new ConnectAdapterError(
      `Cannot build a query key for ${method}: pageParamKey ${detail}`
    )
  if (typeof pageParamKey !== 'string' || pageParamKey === '') {
    throw invalid(
      `must be a request field name, not ${typeof pageParamKey === 'string' ? 'an empty string' : describeValue(pageParamKey)}.`
    )
  }
  const segments = pageParamKey.split('.')
  const last = segments.pop()!
  let desc = schema
  let target: Record<string, unknown> | undefined = request
  const parents: {
    holder: Record<string, unknown>
    field: DescMessageField
  }[] = []
  for (const segment of segments) {
    const member = memberNamed(desc, segment)
    if (
      member?.kind !== 'field' ||
      member.fieldKind !== 'message' ||
      holdsWrapperAsScalar(member) ||
      holdsStructAsJson(member, member.message)
    ) {
      throw invalid(
        `${JSON.stringify(pageParamKey)} passes through ${JSON.stringify(segment)}, which is not a singular message field of ${desc.typeName}.`
      )
    }
    desc = member.message
    const next: unknown = target?.[segment]
    if (target !== undefined && isObjectValue(next)) {
      parents.push({ holder: target, field: member })
    }
    target = isObjectValue(next) ? next : undefined
  }
  const member = memberNamed(desc, last)
  if (member === undefined) {
    throw invalid(
      `${JSON.stringify(pageParamKey)} names no field of ${desc.typeName} (${JSON.stringify(last)}).`
    )
  }
  if (target !== undefined) {
    if (member.kind === 'oneof') {
      target[last] = { case: undefined }
    } else {
      clearField(target as MessageShape<DescMessage>, member)
    }
  }
  for (let index = parents.length - 1; index >= 0; index--) {
    const { holder, field } = parents[index]
    const parent = holder[field.localName] as MessageShape<DescMessage>
    if (field.message.fields.some(child => isFieldSet(parent, child))) {
      return
    }
    clearField(holder as MessageShape<DescMessage>, field)
  }
}

/**
 * A -0 where the wire encodes it as 0. Only float and double carry the sign;
 * `scalar` is undefined for an enum.
 */
function unsignedZero(value: unknown, scalar: ScalarType | undefined): unknown {
  return Object.is(value, -0) &&
    scalar !== ScalarType.FLOAT &&
    scalar !== ScalarType.DOUBLE
    ? 0
    : value
}

/** One value at a field's position, with integer -0s made 0 in place. */
function normalizedFieldValue(field: DescField, value: unknown): unknown {
  switch (field.fieldKind) {
    case 'message':
      if (holdsWrapperAsScalar(field)) {
        const [wrapped] = field.message.fields
        return unsignedZero(value, wrapped?.scalar)
      }
      normalizeMessageValue(field, field.message, value)
      return value
    case 'list':
      if (Array.isArray(value)) {
        for (let index = 0; index < value.length; index++) {
          if (field.listKind === 'message') {
            normalizeMessageValue(field, field.message, value[index])
          } else {
            value[index] = unsignedZero(value[index], field.scalar)
          }
        }
      }
      return value
    case 'map':
      if (isObjectValue(value)) {
        for (const entry of Object.keys(value)) {
          if (field.mapKind === 'message') {
            normalizeMessageValue(field, field.message, value[entry])
          } else {
            value[entry] = unsignedZero(value[entry], field.scalar)
          }
        }
      }
      return value
    default:
      return unsignedZero(value, field.scalar)
  }
}

/** A Struct's JSON numbers are doubles, so they keep their sign. */
function normalizeMessageValue(
  field: DescField,
  desc: DescMessage,
  value: unknown
): void {
  if (!holdsStructAsJson(field, desc) && isObjectValue(value)) {
    normalizeIntegerZeros(desc, value)
  }
}

/**
 * Makes every -0 at an integer or enum position of the keyed copy 0, since
 * the wire encodes the two alike there, while a float, double, or Struct -0
 * keeps its own key. Only own members are written, so a proto2 default on the
 * prototype never becomes present.
 */
function normalizeIntegerZeros(
  desc: DescMessage,
  message: Record<string, unknown>
): void {
  for (const member of desc.members) {
    let holder: Record<string, unknown> = message
    let field: DescField | undefined
    let slot = member.localName
    if (member.kind === 'oneof') {
      const selected = message[member.localName]
      if (!isObjectValue(selected)) {
        continue
      }
      holder = selected
      field = member.fields.find(candidate => candidate.localName === selected.case)
      slot = 'value'
    } else {
      field = member
    }
    if (field === undefined || !Object.hasOwn(holder, slot)) {
      continue
    }
    const value = holder[slot]
    const normalized = normalizedFieldValue(field, value)
    if (!Object.is(normalized, value)) {
      holder[slot] = normalized
    }
  }
}

/**
 * Canonical JSON text: object members sorted at every depth, arrays in order.
 * Sorting by UTF-16 code unit, as `Array.prototype.sort` does, is the same in
 * every engine.
 */
function stableStringify(value: JsonValue): string {
  // JSON.stringify writes -0 as 0, but a float, double, or Struct -0 differs
  // from 0 on the binary wire. Integer positions are made 0 before this.
  if (Object.is(value, -0)) {
    return '-0'
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }
  if (value !== null && typeof value === 'object') {
    const members = Object.keys(value)
      .sort()
      .filter(member => value[member] !== undefined)
      .map(
        member =>
          `${JSON.stringify(member)}:${stableStringify(value[member] as JsonValue)}`
      )
    return `{${members.join(',')}}`
  }
  return JSON.stringify(value)
}

/**
 * Builds the key for one call of `method` and the request that call sends.
 *
 * `input` is evaluated exactly once, and both results come from that one
 * value: the key is written from the normalized request, and the request
 * returned is a copy of it that shares nothing with what `input` returned. An
 * adapter builds once per execution and sends `request` on every attempt.
 *
 * Internal to the package: the adapters share it, and applications name
 * entries with {@link connectQueryPrefix}.
 */
export function buildConnectKey<M extends DescMethod>(
  method: M,
  input: () => MessageInitShape<M['input']>,
  options?: ConnectKeyBuildOptions
): ConnectKeyedRequest<M> {
  assertMethod(method, 'A Connect query key')
  const described = describeMethod(method)
  assertOptionsObject(
    options,
    `The query options for ${described}`,
    'Pass an options object, or omit it.'
  )
  const transport = transportNameFrom(
    options?.transport,
    `The query for ${described}`,
    'use'
  )
  if (typeof input !== 'function') {
    throw new ConnectAdapterError(
      `Cannot build a query key for ${described}: its input is ${describeValue(input)}, not a function returning the request.`
    )
  }

  let init: unknown
  try {
    init = input()
  } catch (error) {
    throw new ConnectAdapterError(
      `Cannot build a query key for ${described}: its input function threw, so there is no request to key.`,
      { cause: error }
    )
  }
  const schema = method.input
  if (!isObjectValue(init)) {
    throw new ConnectAdapterError(
      `Cannot build a query key for ${described}: its input function returned ${describeValue(init)}. Return a ${schema.typeName} initializer object or message.`
    )
  }
  // A Promise has no own fields, so it would key and send as an empty request.
  if (typeof init.then === 'function') {
    throw new ConnectAdapterError(
      `Cannot build a query key for ${described}: its input function returned a Promise. The input function must return the request, not a Promise: load what the request depends on first, and return the request itself.`
    )
  }
  let request: MessageShape<M['input']>
  let json: JsonValue
  try {
    new RequestChecker(described, isDevelopment()).message(
      schema,
      init,
      'request'
    )
    // `create` hands a message of this type back as it is, so the copy is what
    // detaches the request from the caller's object.
    request = clone(
      schema,
      create(schema, init as MessageInitShape<M['input']>)
    ) as MessageShape<M['input']>
    // The key is written from a second copy, so the request keeps what the
    // caller wrote where only the key is normalized.
    const keyed = clone(schema, request) as MessageShape<DescMessage>
    if (options?.pageParamKey !== undefined) {
      omitPageParam(schema, keyed, options.pageParamKey, described)
    }
    normalizeIntegerZeros(schema, keyed)
    json = toJson(schema, keyed, JSON_WRITE_OPTIONS)
  } catch (error) {
    if (error instanceof ConnectAdapterError) {
      throw error
    }
    throw new ConnectAdapterError(
      `Cannot build a query key for ${described}: the request is not a valid ${schema.typeName} (${error instanceof Error ? error.message : String(error)}).`,
      { cause: error }
    )
  }

  const key: unknown[] = [
    KEY_ROOT,
    transport,
    method.parent.typeName,
    method.name,
  ]
  if (options?.pageParamKey !== undefined) {
    key.push(INFINITE_SEGMENT)
  }
  key.push(stableStringify(json))

  const keyExtension = options?.keyExtension
  if (keyExtension !== undefined) {
    if (typeof keyExtension !== 'function') {
      throw new ConnectAdapterError(
        `Cannot build a query key for ${described}: keyExtension is ${describeValue(keyExtension)}, not a function returning key segments.`
      )
    }
    let extension: unknown
    try {
      extension = keyExtension()
    } catch (error) {
      throw new ConnectAdapterError(
        `Cannot build a query key for ${described}: its keyExtension threw.`,
        { cause: error }
      )
    }
    if (!Array.isArray(extension)) {
      throw new ConnectAdapterError(
        `Cannot build a query key for ${described}: keyExtension returned ${describeValue(extension)}. Return an array of key segments.`
      )
    }
    key.push(...extension)
  }

  return { key: key as unknown as ConnectQueryKey, request }
}
