/**
 * Protobuf descriptors for the key tests, built from descriptor protos rather
 * than generated code: the package has no codegen step, and a registry built
 * from `FileDescriptorProto` yields the same `DescMessage`, `DescMethod`, and
 * `DescExtension` objects `protoc-gen-es` output carries.
 *
 * `users.proto` is proto3 and covers every field shape the canonical request
 * has to handle — int64, bytes, oneof, maps, enums, nested, repeated, and
 * recursive messages, `google.protobuf.Any`, and a proto3 `optional` — and the
 * well-known types protobuf-es does not hold as messages: wrappers, which a
 * singular field outside a oneof holds as the bare scalar, and
 * `google.protobuf.Struct`, which a field holds as a JSON object. `legacy.proto`
 * is proto2, for explicit presence and extensions.
 */

import { create, createFileRegistry } from '@bufbuild/protobuf'
import type {
  DescExtension,
  DescMessage,
  DescMethod,
  DescService,
} from '@bufbuild/protobuf'
import {
  DescriptorProto_ExtensionRangeSchema,
  FieldDescriptorProto_Label,
  FieldDescriptorProto_Type,
  FileDescriptorProtoSchema,
  file_google_protobuf_any,
  file_google_protobuf_struct,
  file_google_protobuf_wrappers,
} from '@bufbuild/protobuf/wkt'

// Named as protoc spells them; protobuf-es drops the prefixes.
const {
  INT32: TYPE_INT32,
  INT64: TYPE_INT64,
  STRING: TYPE_STRING,
  BYTES: TYPE_BYTES,
  MESSAGE: TYPE_MESSAGE,
  ENUM: TYPE_ENUM,
} = FieldDescriptorProto_Type
const { OPTIONAL: LABEL_OPTIONAL, REPEATED: LABEL_REPEATED } =
  FieldDescriptorProto_Label

interface FieldSpec {
  name: string
  number: number
  type: FieldDescriptorProto_Type
  typeName?: string
  repeated?: boolean
  oneofIndex?: number
  proto3Optional?: boolean
}

function field(spec: FieldSpec) {
  return {
    name: spec.name,
    // protoc always fills this in, and the registry takes it as given.
    jsonName: spec.name.replace(/_([a-z0-9])/g, (_match, next: string) =>
      next.toUpperCase()
    ),
    number: spec.number,
    type: spec.type,
    typeName: spec.typeName,
    label: spec.repeated ? LABEL_REPEATED : LABEL_OPTIONAL,
    oneofIndex: spec.oneofIndex,
    proto3Optional: spec.proto3Optional,
  }
}

/** A map field's synthetic entry message, as protoc emits it. */
function mapEntry(
  name: string,
  value: FieldDescriptorProto_Type,
  valueTypeName?: string
) {
  return {
    name,
    options: { mapEntry: true },
    field: [
      field({ name: 'key', number: 1, type: TYPE_STRING }),
      field({ name: 'value', number: 2, type: value, typeName: valueTypeName }),
    ],
  }
}

const REQUEST = '.acme.users.v1.ListUsersRequest'

const usersFile = create(FileDescriptorProtoSchema, {
  name: 'acme/users/v1/users.proto',
  package: 'acme.users.v1',
  syntax: 'proto3',
  dependency: [
    'google/protobuf/any.proto',
    'google/protobuf/struct.proto',
    'google/protobuf/wrappers.proto',
  ],
  enumType: [
    {
      name: 'Role',
      value: [
        { name: 'ROLE_UNSPECIFIED', number: 0 },
        { name: 'ROLE_ADMIN', number: 1 },
        { name: 'ROLE_MEMBER', number: 2 },
      ],
    },
  ],
  messageType: [
    {
      name: 'Filter',
      field: [
        field({ name: 'name', number: 1, type: TYPE_STRING }),
        field({
          name: 'labels',
          number: 2,
          type: TYPE_MESSAGE,
          typeName: '.acme.users.v1.Filter.LabelsEntry',
          repeated: true,
        }),
        // Recursive, as real schemas often are.
        field({
          name: 'parent',
          number: 3,
          type: TYPE_MESSAGE,
          typeName: '.acme.users.v1.Filter',
        }),
      ],
      nestedType: [mapEntry('LabelsEntry', TYPE_STRING)],
    },
    {
      name: 'Query',
      field: [
        field({ name: 'cursor', number: 1, type: TYPE_STRING }),
        field({
          name: 'filter',
          number: 2,
          type: TYPE_MESSAGE,
          typeName: '.acme.users.v1.Filter',
        }),
      ],
    },
    {
      name: 'ListUsersRequest',
      field: [
        field({ name: 'page_size', number: 1, type: TYPE_INT32 }),
        field({ name: 'page_token', number: 2, type: TYPE_STRING }),
        field({ name: 'min_id', number: 3, type: TYPE_INT64 }),
        field({ name: 'fingerprint', number: 4, type: TYPE_BYTES }),
        field({ name: 'email', number: 5, type: TYPE_STRING, oneofIndex: 0 }),
        field({ name: 'user_id', number: 6, type: TYPE_INT64, oneofIndex: 0 }),
        field({
          name: 'by_filter',
          number: 7,
          type: TYPE_MESSAGE,
          typeName: '.acme.users.v1.Filter',
          oneofIndex: 0,
        }),
        field({
          name: 'quotas',
          number: 8,
          type: TYPE_MESSAGE,
          typeName: `${REQUEST}.QuotasEntry`,
          repeated: true,
        }),
        field({
          name: 'role',
          number: 9,
          type: TYPE_ENUM,
          typeName: '.acme.users.v1.Role',
        }),
        field({
          name: 'max_age',
          number: 10,
          type: TYPE_INT32,
          oneofIndex: 1,
          proto3Optional: true,
        }),
        field({
          name: 'filter',
          number: 11,
          type: TYPE_MESSAGE,
          typeName: '.acme.users.v1.Filter',
        }),
        field({
          name: 'filters',
          number: 12,
          type: TYPE_MESSAGE,
          typeName: '.acme.users.v1.Filter',
          repeated: true,
        }),
        field({
          name: 'named_filters',
          number: 13,
          type: TYPE_MESSAGE,
          typeName: `${REQUEST}.NamedFiltersEntry`,
          repeated: true,
        }),
        field({
          name: 'attachment',
          number: 14,
          type: TYPE_MESSAGE,
          typeName: '.google.protobuf.Any',
        }),
        field({
          name: 'attachments',
          number: 15,
          type: TYPE_MESSAGE,
          typeName: '.google.protobuf.Any',
          repeated: true,
        }),
        field({
          name: 'attachments_by_name',
          number: 16,
          type: TYPE_MESSAGE,
          typeName: `${REQUEST}.AttachmentsByNameEntry`,
          repeated: true,
        }),
        field({
          name: 'query',
          number: 17,
          type: TYPE_MESSAGE,
          typeName: '.acme.users.v1.Query',
        }),
        field({ name: 'ids', number: 18, type: TYPE_INT64, repeated: true }),
        field({
          name: 'nickname',
          number: 19,
          type: TYPE_MESSAGE,
          typeName: '.google.protobuf.StringValue',
        }),
        field({
          name: 'since_id',
          number: 20,
          type: TYPE_MESSAGE,
          typeName: '.google.protobuf.Int64Value',
        }),
        // A wrapper in a oneof stays a message.
        field({
          name: 'by_nickname',
          number: 21,
          type: TYPE_MESSAGE,
          typeName: '.google.protobuf.StringValue',
          oneofIndex: 0,
        }),
        field({
          name: 'metadata',
          number: 22,
          type: TYPE_MESSAGE,
          typeName: '.google.protobuf.Struct',
        }),
        field({
          name: 'metadata_list',
          number: 23,
          type: TYPE_MESSAGE,
          typeName: '.google.protobuf.Struct',
          repeated: true,
        }),
        field({
          name: 'metadata_by_name',
          number: 24,
          type: TYPE_MESSAGE,
          typeName: `${REQUEST}.MetadataByNameEntry`,
          repeated: true,
        }),
        field({
          name: 'by_metadata',
          number: 25,
          type: TYPE_MESSAGE,
          typeName: '.google.protobuf.Struct',
          oneofIndex: 0,
        }),
      ],
      oneofDecl: [{ name: 'selector' }, { name: '_max_age' }],
      nestedType: [
        mapEntry('QuotasEntry', TYPE_INT64),
        mapEntry('NamedFiltersEntry', TYPE_MESSAGE, '.acme.users.v1.Filter'),
        mapEntry('AttachmentsByNameEntry', TYPE_MESSAGE, '.google.protobuf.Any'),
        mapEntry('MetadataByNameEntry', TYPE_MESSAGE, '.google.protobuf.Struct'),
      ],
    },
    {
      name: 'ListUsersResponse',
      field: [
        field({ name: 'names', number: 1, type: TYPE_STRING, repeated: true }),
        field({ name: 'next_page_token', number: 2, type: TYPE_STRING }),
      ],
    },
    {
      name: 'GetUserRequest',
      field: [field({ name: 'id', number: 1, type: TYPE_INT64 })],
    },
    {
      name: 'GetUserResponse',
      field: [field({ name: 'name', number: 1, type: TYPE_STRING })],
    },
  ],
  service: [
    {
      name: 'UserService',
      method: [
        {
          name: 'ListUsers',
          inputType: REQUEST,
          outputType: '.acme.users.v1.ListUsersResponse',
        },
        {
          name: 'GetUser',
          inputType: '.acme.users.v1.GetUserRequest',
          outputType: '.acme.users.v1.GetUserResponse',
        },
      ],
    },
  ],
})

const legacyFile = create(FileDescriptorProtoSchema, {
  name: 'acme/legacy/v1/legacy.proto',
  package: 'acme.legacy.v1',
  syntax: 'proto2',
  messageType: [
    {
      name: 'LegacyRequest',
      field: [
        field({ name: 'limit', number: 1, type: TYPE_INT32 }),
        field({ name: 'label', number: 2, type: TYPE_STRING }),
      ],
      extensionRange: [
        create(DescriptorProto_ExtensionRangeSchema, { start: 100, end: 200 }),
      ],
    },
    { name: 'LegacyResponse' },
  ],
  extension: [
    {
      ...field({ name: 'trace_tag', number: 100, type: TYPE_STRING }),
      extendee: '.acme.legacy.v1.LegacyRequest',
    },
  ],
  service: [
    {
      name: 'LegacyService',
      method: [
        {
          name: 'Lookup',
          inputType: '.acme.legacy.v1.LegacyRequest',
          outputType: '.acme.legacy.v1.LegacyResponse',
        },
      ],
    },
  ],
})

const wellKnownFiles = new Map([
  ['google/protobuf/any.proto', file_google_protobuf_any],
  ['google/protobuf/struct.proto', file_google_protobuf_struct],
  ['google/protobuf/wrappers.proto', file_google_protobuf_wrappers],
])

const registry = createFileRegistry(
  createFileRegistry(usersFile, (name) => wellKnownFiles.get(name)),
  createFileRegistry(legacyFile, () => undefined)
)

function service(typeName: string): DescService {
  const desc = registry.getService(typeName)
  if (desc === undefined) {
    throw new Error(`fixture service ${typeName} is missing`)
  }
  return desc
}

function message(typeName: string): DescMessage {
  const desc = registry.getMessage(typeName)
  if (desc === undefined) {
    throw new Error(`fixture message ${typeName} is missing`)
  }
  return desc
}

export const UserService = service('acme.users.v1.UserService')
export const LegacyService = service('acme.legacy.v1.LegacyService')

export const ListUsers: DescMethod = UserService.method.listUsers!
export const GetUser: DescMethod = UserService.method.getUser!
export const Lookup: DescMethod = LegacyService.method.lookup!

export const ListUsersRequestSchema = message('acme.users.v1.ListUsersRequest')
export const FilterSchema = message('acme.users.v1.Filter')
export const QuerySchema = message('acme.users.v1.Query')
export const GetUserRequestSchema = message('acme.users.v1.GetUserRequest')
export const LegacyRequestSchema = message('acme.legacy.v1.LegacyRequest')

export const traceTag = registry.getExtension(
  'acme.legacy.v1.trace_tag'
) as DescExtension
