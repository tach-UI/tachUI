/**
 * The request field an infinite query's continuation token travels in.
 *
 * `pageParamKey` names it as a dotted path of field names, resolved against the
 * method's input schema once, when the query is created. The path may pass
 * only through singular message fields, and must end at a singular scalar or
 * enum field — `optional` ones included — or at a wrapper, which protobuf-es
 * holds as its bare scalar. A message, repeated, map, or oneof field has no
 * single value a token could be.
 *
 * The first page's token is read from the request the key was built from, and
 * every page's request is that request with its token written in. The token
 * itself stays opaque to `@tachui/query`.
 */

import { clone, isFieldSet, ScalarType } from '@bufbuild/protobuf'
import type { DescField, DescMessage, MessageShape } from '@bufbuild/protobuf'

import { ConnectAdapterError } from './errors'
import {
  describeValue,
  holdsStructAsJson,
  holdsWrapperAsScalar,
  isObjectValue,
  memberNamed,
} from './keys'
import type { DescMessageField } from './keys'

/**
 * `FeatureSet_FieldPresence.IMPLICIT`: a field whose unset value is its
 * default. Written out rather than imported, so reading one number does not
 * pull the descriptor schema's enum into every bundle.
 */
const IMPLICIT_PRESENCE = 2

/** A resolved `pageParamKey`. */
export interface PageParamPath {
  /** The dotted path, as given. */
  readonly key: string
  /** The message fields the path passes through, outermost first. */
  readonly parents: readonly DescMessageField[]
  /** The field that holds the token. */
  readonly leaf: DescField
}

/**
 * The scalar a token field holds: the field's own, or a wrapper's. `undefined`
 * for an enum.
 */
function scalarField(leaf: DescField): DescField | undefined {
  if (leaf.fieldKind === 'message') {
    return leaf.message.fields[0]
  }
  return leaf.fieldKind === 'scalar' ? leaf : undefined
}

/** Names the value a token field holds, for a diagnostic. */
function describeKind(leaf: DescField): string {
  if (leaf.fieldKind === 'enum') {
    return `a ${leaf.enum.typeName} enum`
  }
  const field = scalarField(leaf)
  const scalar = field?.fieldKind === 'scalar' ? field.scalar : undefined
  return `a ${ScalarType[scalar ?? ScalarType.STRING].toLowerCase()}`
}

/** Whether `value` is what the token field holds, as protobuf-es holds it. */
function holdsValue(leaf: DescField, value: unknown): boolean {
  if (leaf.fieldKind === 'enum') {
    return typeof value === 'number' && Number.isInteger(value)
  }
  const field = scalarField(leaf)
  if (field?.fieldKind !== 'scalar') {
    return false
  }
  switch (field.scalar) {
    case ScalarType.STRING:
      return typeof value === 'string'
    case ScalarType.BOOL:
      return typeof value === 'boolean'
    case ScalarType.BYTES:
      return value instanceof Uint8Array
    case ScalarType.INT64:
    case ScalarType.UINT64:
    case ScalarType.SINT64:
    case ScalarType.FIXED64:
    case ScalarType.SFIXED64:
      return field.longAsString
        ? typeof value === 'string'
        : typeof value === 'bigint'
    default:
      return typeof value === 'number'
  }
}

/**
 * Resolves `pageParamKey` against the input schema, refusing a path that names
 * no field, passes through anything but a singular message field, or ends
 * anywhere but a singular scalar or enum field.
 */
export function resolvePageParamPath(
  schema: DescMessage,
  pageParamKey: unknown,
  caller: string
): PageParamPath {
  const invalid = (detail: string): ConnectAdapterError =>
    new ConnectAdapterError(`${caller} cannot use pageParamKey ${detail}`)
  if (typeof pageParamKey !== 'string' || pageParamKey === '') {
    throw invalid(
      `${typeof pageParamKey === 'string' ? 'an empty string' : describeValue(pageParamKey)}: it must name the request field that carries the continuation token, for example 'pageToken' or 'query.cursor'.`
    )
  }
  const quoted = JSON.stringify(pageParamKey)
  const segments = pageParamKey.split('.')
  const last = segments.pop()!
  const parents: DescMessageField[] = []
  let desc = schema
  for (const segment of segments) {
    const member = memberNamed(desc, segment)
    if (
      member?.kind !== 'field' ||
      member.fieldKind !== 'message' ||
      holdsWrapperAsScalar(member) ||
      holdsStructAsJson(member, member.message)
    ) {
      throw invalid(
        `${quoted}: it passes through ${JSON.stringify(segment)}, which is not a singular message field of ${desc.typeName}.`
      )
    }
    parents.push(member)
    desc = member.message
  }
  const leaf = memberNamed(desc, last)
  if (leaf === undefined) {
    throw invalid(
      `${quoted}: it names no field of ${desc.typeName} (${JSON.stringify(last)}). Field names are the camelCase names from generated code.`
    )
  }
  const unusable = (what: string): ConnectAdapterError =>
    invalid(
      `${quoted}: it names ${what} of ${desc.typeName}, which cannot hold a continuation token. Name a singular scalar or enum field.`
    )
  if (leaf.kind === 'oneof') {
    throw unusable('a oneof')
  }
  switch (leaf.fieldKind) {
    case 'list':
      throw unusable('a repeated field')
    case 'map':
      throw unusable('a map field')
    case 'message':
      if (!holdsWrapperAsScalar(leaf)) {
        throw unusable('a message field')
      }
      break
    default:
      break
  }
  return { key: pageParamKey, parents, leaf }
}

/**
 * The first page's token: the one in the request the key was built from.
 *
 * An implicit-presence field the input left out reads as its default, as the
 * request sends it. What the request cannot say is refused before anything is
 * sent: a token given as `null`, a message on the path left unset, or an
 * `optional` token field left unset, where the default is not what was asked
 * for.
 *
 * `init` is the value the input function returned, read only to tell `null`
 * from an omission; normalization drops both.
 */
export function initialPageParam(
  path: PageParamPath,
  request: MessageShape<DescMessage>,
  init: unknown,
  caller: string
): unknown {
  const invalid = (detail: string): ConnectAdapterError =>
    new ConnectAdapterError(
      `${caller} has no first page to ask for: ${detail}`
    )
  let holder = request as unknown as Record<string, unknown>
  let given = init
  const walked: string[] = []
  for (const parent of path.parents) {
    walked.push(parent.localName)
    const next = holder[parent.localName]
    given = isObjectValue(given) ? given[parent.localName] : undefined
    if (!isObjectValue(next)) {
      throw invalid(
        `the input leaves ${walked.join('.')} ${given === null ? 'null' : 'unset'}, so ${JSON.stringify(path.key)} has no message to read the token from. Set ${walked.join('.')}, even to an empty message, to ask for the first page.`
      )
    }
    holder = next
  }
  const { leaf } = path
  if (isObjectValue(given) && given[leaf.localName] === null) {
    throw invalid(
      `the input gives ${JSON.stringify(path.key)} as null. Omit it, or give the token the first page is asked for.`
    )
  }
  if (
    leaf.presence !== IMPLICIT_PRESENCE &&
    !isFieldSet(holder as MessageShape<DescMessage>, leaf)
  ) {
    throw invalid(
      `the input leaves ${JSON.stringify(path.key)} unset, and the field tracks presence, so its default is not a token anyone asked for. Give the token the first page is asked for.`
    )
  }
  return holder[leaf.localName]
}

/**
 * The request for one page: a copy of `request` made through the input schema,
 * with `pageParam` written at the path and nothing else changed. A token that
 * is not what the field holds is refused here, before it is sent, rather than
 * failing the call as though the server had.
 */
export function withPageParam<I extends DescMessage>(
  schema: I,
  path: PageParamPath,
  request: MessageShape<I>,
  pageParam: unknown,
  caller: string
): MessageShape<I> {
  if (!holdsValue(path.leaf, pageParam)) {
    throw new ConnectAdapterError(
      `${caller} was handed ${describeValue(pageParam)} as the token for ${JSON.stringify(path.key)}, which holds ${describeKind(path.leaf)}. Return the field's own type from getNextPageParam, or undefined or null when there is no next page.`
    )
  }
  const page = clone(schema, request)
  let holder = page as unknown as Record<string, unknown>
  for (const parent of path.parents) {
    const next = holder[parent.localName]
    if (!isObjectValue(next)) {
      throw new ConnectAdapterError(
        `${caller} cannot write the token for ${JSON.stringify(path.key)}: the request leaves ${parent.localName} unset.`
      )
    }
    holder = next
  }
  holder[path.leaf.localName] = pageParam
  return page
}
