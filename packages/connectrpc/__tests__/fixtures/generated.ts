/**
 * The fixture schema typed the way `protoc-gen-es` output types it.
 *
 * Generated code declares each message's shape and brands its descriptor with
 * `GenMessage`, and brands the service with `GenService`, so a method carries
 * its request and response types to every call site. The descriptors here are
 * the registry's own objects from `schema.ts` under those declarations: the
 * runtime is exactly what generated code would hold, and an adapter's inferred
 * types are what an application would see.
 *
 * Only the fields these suites read or write are declared on the list request;
 * the rest stay unset.
 */

import type { Message } from '@bufbuild/protobuf'
import type { GenMessage, GenService } from '@bufbuild/protobuf/codegenv2'

import * as schema from './schema'

export type GetUserRequest = Message<'acme.users.v1.GetUserRequest'> & {
  id: bigint
}

export type User = Message<'acme.users.v1.GetUserResponse'> & {
  name: string
}

export type UpdateUserRequest = Message<'acme.users.v1.UpdateUserRequest'> & {
  id: bigint
  name: string
}

export type ListUsersRequest = Message<'acme.users.v1.ListUsersRequest'> & {
  pageSize: number
  pageToken: string
  minId: bigint
  fingerprint: Uint8Array
  selector:
    | { case: 'email'; value: string }
    | { case: 'userId'; value: bigint }
    | { case: undefined; value?: undefined }
  quotas: { [key: string]: bigint }
}

export type ListUsersResponse = Message<'acme.users.v1.ListUsersResponse'> & {
  names: string[]
  nextPageToken: string
}

export const GetUserRequestSchema =
  schema.GetUserRequestSchema as GenMessage<GetUserRequest>
export const UserSchema = schema.GetUserResponseSchema as GenMessage<User>
export const UpdateUserRequestSchema =
  schema.UpdateUserRequestSchema as GenMessage<UpdateUserRequest>
export const ListUsersRequestSchema =
  schema.ListUsersRequestSchema as GenMessage<ListUsersRequest>
export const ListUsersResponseSchema =
  schema.ListUsersResponseSchema as GenMessage<ListUsersResponse>

export const UserService = schema.UserService as GenService<{
  listUsers: {
    methodKind: 'unary'
    input: typeof ListUsersRequestSchema
    output: typeof ListUsersResponseSchema
  }
  getUser: {
    methodKind: 'unary'
    input: typeof GetUserRequestSchema
    output: typeof UserSchema
  }
  watchUsers: {
    methodKind: 'server_streaming'
    input: typeof ListUsersRequestSchema
    output: typeof UserSchema
  }
  updateUser: {
    methodKind: 'unary'
    input: typeof UpdateUserRequestSchema
    output: typeof UserSchema
  }
}>
