/**
 * Registration with metadata for the lists in this package.
 *
 * Every list registers through `registerModifierWithMetadata`, so the type
 * generator sees each modifier's metadata. The signatures and categories come
 * from the generated table beside each list, derived from the registered
 * factories by `packages/core/scripts/derive-modifier-signatures.ts`.
 * Registration itself is unchanged: a name already in the registry keeps its
 * factory.
 */

import { globalModifierRegistry } from '@tachui/registry'
import type {
  ModifierMetadata,
  ModifierRegistry,
  PluginInfo,
} from '@tachui/registry'
import { registerModifierWithMetadata } from '@tachui/core/modifiers'
import type { ModifierRegistrationList } from '@tachui/types/modifiers'
import { TACHUI_PACKAGE_VERSION } from './version'

export const MODIFIERS_PLUGIN_INFO: PluginInfo = {
  name: '@tachui/modifiers',
  version: TACHUI_PACKAGE_VERSION,
  author: 'tachUI Team',
  verified: true,
}

/** Metadata priority for this package's modifiers. */
export const MODIFIERS_METADATA_PRIORITY = 120

/** Hand-written metadata for one modifier; its signature is always derived. */
export type ModifierMetadataOverride = Omit<
  ModifierMetadata,
  'name' | 'plugin' | 'signature'
>

export interface DerivedModifierMetadata {
  signatures: Readonly<Record<string, string>>
  categories: Readonly<Record<string, ModifierMetadata['category']>>
}

export function registerModifierList(
  registrations: ModifierRegistrationList,
  derived: DerivedModifierMetadata,
  options: {
    registry?: ModifierRegistry
    overrides?: Readonly<Record<string, ModifierMetadataOverride>>
  } = {},
): void {
  const registry = options.registry ?? globalModifierRegistry

  for (const [name, factory] of registrations) {
    const metadata = options.overrides?.[name] ?? {
      category: derived.categories[name],
      priority: MODIFIERS_METADATA_PRIORITY,
    }
    registerModifierWithMetadata(
      name,
      factory,
      { ...metadata, signature: derived.signatures[name] },
      registry,
      MODIFIERS_PLUGIN_INFO,
    )
  }
}
