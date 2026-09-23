/**
 * Explicit side-effectful entrypoint for navigation modifier registration.
 *
 * Import this when you need ModifierBuilder chain methods like
 * `.navigationTitle(...)` to be patched globally without importing root.
 */
import { installNavigationModifierMethods } from './navigation-modifiers-registry'

installNavigationModifierMethods()

export * from './modifiers'
