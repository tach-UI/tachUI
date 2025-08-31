/**
 * Backwards compatibility layer for flow control components
 *
 * This file provides re-exports from @tachui/flow-control to maintain
 * compatibility during the restructuring process.
 */

// TODO: Once @tachui/flow-control is built and published, these will be real imports
// For now, we'll re-export from the existing local files

export { Show, When, Unless, type ShowProps } from './components/Show'

// ForEach exports from List.ts
export {
  ForEach,
  ForEachComponent,
  For,
  type ForEachProps,
  type ForProps,
} from './components/List'

// This file will eventually look like:
// export * from '@tachui/flow-control'
