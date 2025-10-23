/**
 * Modifier Type Generation Utilities
 *
 * Consumes registry metadata to produce strongly typed modifier chaining
 * declarations and a metadata snapshot for tooling.
 */

import { globalModifierRegistry } from '@tachui/registry'
import type {
  ModifierMetadata,
  ModifierRegistry,
  PluginInfo,
  RegistryHealth,
} from '@tachui/registry'

const DEFAULT_INDENT = '  '
const IDENTIFIER_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/

/**
 * Options for generating modifier declarations.
 */
export interface GenerateModifierTypesOptions {
  /**
   * Registry instance to read metadata from.
   * Defaults to the global modifier registry.
   */
  registry?: ModifierRegistry
  /**
   * Indentation to use when emitting declarations.
   * @default '  '
   */
  indent?: string
  /**
   * When true, deprecated modifiers are still emitted (with @deprecated tag).
   * @default true
   */
  includeDeprecated?: boolean
}

/**
 * Snapshot entry for a single modifier.
 */
export interface ModifierSnapshotEntry {
  name: string
  nameKind: 'string' | 'symbol'
  symbolDescription?: string
  plugin: string
  priority: number
  signature: string
  category: string
  description?: string
  deprecated?: boolean
  deprecationMessage?: string
}

/**
 * Snapshot entry for a conflict group.
 */
export interface ModifierConflictSnapshot {
  name: string
  nameKind: 'string' | 'symbol'
  symbolDescription?: string
  entries: ModifierSnapshotEntry[]
}

/**
 * Structured metadata snapshot used by tooling/CLI.
 */
export interface ModifierMetadataSnapshot {
  generatedAt: string
  totalModifiers: number
  categories: Record<string, ModifierSnapshotEntry[]>
  plugins: PluginInfo[]
  conflicts: ModifierConflictSnapshot[]
  registryHealth: RegistryHealth
}

/**
 * Combined artifacts returned by {@link generateModifierArtifacts}.
 */
export interface GeneratedModifierArtifacts {
  declaration: string
  snapshot: ModifierMetadataSnapshot
}

/**
 * Generate the modifier declaration output alongside a structured metadata snapshot.
 */
export function generateModifierArtifacts(
  options: GenerateModifierTypesOptions = {},
): GeneratedModifierArtifacts {
  const registry = options.registry ?? globalModifierRegistry
  const indent = options.indent ?? DEFAULT_INDENT
  const includeDeprecated = options.includeDeprecated ?? true

  const metadata = registry.getAllMetadata()
  const plugins = registry.listPlugins ? registry.listPlugins() : []
  const conflicts = registry.getConflicts()
  const registryHealth = registry.validateRegistry()

  const filteredMetadata = includeDeprecated
    ? metadata
    : metadata.filter((entry) => !entry.deprecated)

  const categories = buildCategoryMap(filteredMetadata, plugins)
  const conflictSnapshots = buildConflictSnapshots(conflicts, plugins)

  const snapshot: ModifierMetadataSnapshot = {
    generatedAt: new Date().toISOString(),
    totalModifiers: filteredMetadata.length,
    categories,
    plugins,
    conflicts: conflictSnapshots,
    registryHealth,
  }

  const declaration = formatDeclaration(snapshot, {
    indent,
    includeDeprecated,
  })

  return { declaration, snapshot }
}

/**
 * Generate the TypeScript declaration content only.
 */
export function generateModifierTypes(
  options: GenerateModifierTypesOptions = {},
): string {
  return generateModifierArtifacts(options).declaration
}

/**
 * Build the metadata snapshot only (without emitting declarations).
 */
export function createModifierMetadataSnapshot(
  options: GenerateModifierTypesOptions = {},
): ModifierMetadataSnapshot {
  return generateModifierArtifacts(options).snapshot
}

/**
 * Group modifiers by category in a stable, sorted structure.
 */
function buildCategoryMap(
  metadata: ModifierMetadata[],
  _plugins: PluginInfo[],
): Record<string, ModifierSnapshotEntry[]> {
  const categories = new Map<string, ModifierSnapshotEntry[]>()

  for (const entry of metadata) {
    const { printableName, kind, symbolDescription } =
      normalizeModifierName(entry.name)

    const snapshotEntry: ModifierSnapshotEntry = {
      name: printableName,
      nameKind: kind,
      symbolDescription,
      plugin: entry.plugin,
      priority: entry.priority,
      signature: entry.signature,
      category: entry.category,
      description: entry.description,
      deprecated: entry.deprecated,
      deprecationMessage: entry.deprecationMessage,
    }

    const group = categories.get(entry.category) ?? []
    group.push(snapshotEntry)
    categories.set(entry.category, group)
  }

  const sortedCategoryNames = Array.from(categories.keys()).sort((a, b) =>
    a.localeCompare(b),
  )
  const result: Record<string, ModifierSnapshotEntry[]> = {}

  for (const category of sortedCategoryNames) {
    const entries = categories.get(category) ?? []
    entries.sort((a, b) => a.name.localeCompare(b.name))
    result[category] = entries
  }

  return result
}

/**
 * Build conflict snapshot data from the registry conflict map.
 */
function buildConflictSnapshots(
  conflicts: Map<string | symbol, ModifierMetadata[]>,
  _plugins: PluginInfo[],
): ModifierConflictSnapshot[] {
  const snapshots: ModifierConflictSnapshot[] = []
  for (const [name, entries] of conflicts.entries()) {
    const { printableName, kind, symbolDescription } =
      normalizeModifierName(name)

    snapshots.push({
      name: printableName,
      nameKind: kind,
      symbolDescription,
      entries: entries
        .map((entry) => ({
          name: printableName,
          nameKind: kind,
          symbolDescription,
          plugin: entry.plugin,
          priority: entry.priority,
          signature: entry.signature,
          category: entry.category,
          description: entry.description,
          deprecated: entry.deprecated,
          deprecationMessage: entry.deprecationMessage,
        }))
        .sort((a, b) => b.priority - a.priority),
    })
  }

  snapshots.sort((a, b) => a.name.localeCompare(b.name))
  return snapshots
}

/**
 * Convert metadata snapshot into a declaration file.
 */
function formatDeclaration(
  snapshot: ModifierMetadataSnapshot,
  options: { indent: string; includeDeprecated: boolean },
): string {
  const { indent } = options

  const lines: string[] = []
  lines.push('// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.')
  lines.push(`// Generated at: ${snapshot.generatedAt}`)
  if (snapshot.plugins.length > 0) {
    const pluginSummary = snapshot.plugins
      .map(
        (plugin) =>
          `${plugin.name}${plugin.version ? `@${plugin.version}` : ''}${
            plugin.verified ? ' (verified)' : ''
          }`,
      )
      .join(', ')
    lines.push(`// Plugins: ${pluginSummary}`)
  }
  lines.push('//')
  lines.push(
    '// Run `pnpm --filter @tachui/core generate-modifier-types` to regenerate.',
  )
  lines.push('')
  lines.push(
    "import type { ModifierBuilder, ModifiableComponent } from '../modifiers/types'",
  )
  lines.push(
    "import type { ComponentInstance, ComponentProps } from '../runtime/types'",
  )
  lines.push('')
  lines.push("declare module '@tachui/core/modifiers/types' {")

  const builderBlock = formatInterfaceBlock(
    'ModifierBuilder',
    snapshot.categories,
    indent,
    (signature) => transformSignature(signature, 'builder'),
  )
  const componentBlock = formatInterfaceBlock(
    'ModifiableComponent',
    snapshot.categories,
    indent,
    (signature) => transformSignature(signature, 'component'),
  )

  if (snapshot.totalModifiers === 0) {
    lines.push(`${indent}// No modifier metadata registered.`)
  } else {
    lines.push(builderBlock)
    lines.push('')
    lines.push(componentBlock)
  }

  lines.push('}')
  lines.push('')
  return lines.join('\n')
}

/**
 * Format the interface augmentation block for either ModifierBuilder or ModifiableComponent.
 */
function formatInterfaceBlock(
  interfaceName: 'ModifierBuilder' | 'ModifiableComponent',
  categories: Record<string, ModifierSnapshotEntry[]>,
  indent: string,
  transform: (signature: string) => string,
): string {
  const lines: string[] = []
  lines.push(
    `${indent}interface ${interfaceName}<T extends ${
      interfaceName === 'ModifierBuilder'
        ? 'ComponentInstance = ComponentInstance'
        : 'ComponentProps = ComponentProps'
    }> {`,
  )

  const sortedCategories = Object.keys(categories)
  if (sortedCategories.length === 0) {
    lines.push(`${indent}${indent}// No modifiers available.`)
  } else {
    for (const category of sortedCategories) {
      lines.push(
        `${indent}${indent}// ${capitalize(category)} modifiers (${categories[category].length})`,
      )
      for (const entry of categories[category]) {
        const propertyName = getPropertyName(entry)
        if (!propertyName) {
          lines.push(
            `${indent}${indent}// Skipped ${entry.name} – cannot express symbol-based modifier in declarations.`,
          )
          continue
        }

        const doc = buildJSDoc(entry, indent.repeat(2))
        if (doc) {
          lines.push(doc)
        }
        lines.push(
          `${indent}${indent}${propertyName}${transform(entry.signature)}`,
        )
      }
      lines.push('') // blank line between categories
    }
    // Remove extra blank line at end
    if (lines[lines.length - 1] === '') {
      lines.pop()
    }
  }

  lines.push(`${indent}}`)
  return lines.join('\n')
}

/**
 * Transform a metadata signature into the appropriate declaration variant.
 */
function transformSignature(
  signature: string,
  target: 'component' | 'builder',
): string {
  const trimmed = signature.trim().replace(/;$/, '')
  const normalized = trimmed.startsWith('(')
    ? trimmed
    : trimmed.startsWith(':')
      ? `(): ${trimmed.slice(1).trim()}`
      : `(${trimmed})`

  const replaced =
    target === 'builder'
      ? normalized.replace(/\bthis\b/g, 'ModifierBuilder<T>')
      : normalized.replace(/\bModifierBuilder<T>\b/g, 'this')

  return replaced.endsWith(';') ? replaced : `${replaced};`
}

/**
 * Create a doc comment for a modifier entry if metadata is available.
 */
function buildJSDoc(entry: ModifierSnapshotEntry, indent: string): string {
  const lines: string[] = []
  if (!entry.description && !entry.deprecated && !entry.deprecationMessage) {
    return ''
  }

  lines.push(`${indent}/**`)
  if (entry.description) {
    lines.push(`${indent} * ${entry.description}`)
  }
  lines.push(
    `${indent} * @plugin ${entry.plugin} (priority ${entry.priority})`,
  )
  if (entry.deprecated) {
    const message =
      entry.deprecationMessage?.trim().length ?? 0
        ? entry.deprecationMessage
        : 'Deprecated modifier'
    lines.push(`${indent} * @deprecated ${message}`)
  }
  lines.push(`${indent} */`)
  return lines.join('\n')
}

/**
 * Determine the property name emitted in the declaration file.
 */
function getPropertyName(entry: ModifierSnapshotEntry): string | null {
  if (entry.nameKind === 'symbol') {
    return null
  }

  if (IDENTIFIER_PATTERN.test(entry.name)) {
    return entry.name
  }

  const escaped = entry.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  return `'${escaped}'`
}

/**
 * Produce a readable name for symbols and strings.
 */
function normalizeModifierName(name: string | symbol): {
  printableName: string
  kind: 'string' | 'symbol'
  symbolDescription?: string
} {
  if (typeof name === 'string') {
    return {
      printableName: name,
      kind: 'string',
    }
  }

  const description = name.description ?? ''
  return {
    printableName: description ? `Symbol(${description})` : 'Symbol(?)',
    kind: 'symbol',
    symbolDescription: description || undefined,
  }
}

function capitalize(value: string): string {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}
