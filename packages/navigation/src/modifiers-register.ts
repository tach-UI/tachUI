/**
 * Explicit side-effectful entrypoint for navigation modifier registration.
 *
 * Import this when you need ModifierBuilder chain methods like
 * `.navigationTitle(...)` to be patched globally without importing root.
 */
// eslint-disable-next-line import/no-unassigned-import
import './navigation-modifiers-registry'

export * from './modifiers'
