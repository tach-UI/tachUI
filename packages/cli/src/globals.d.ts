/**
 * Global type definitions for TachUI CLI
 */

declare global {
  // Development flag for debug builds
  var __DEV__: boolean
}

declare module '@tachui/devtools' {
  export interface ModifierParameterEntry {
    name: string
    plugin: string
    category: string
    description?: string
    parameters: unknown[]
    usage: {
      basic: string[]
      advanced?: string[]
    }
    relatedModifiers?: string[]
    bundleSize?: string
    swiftUIEquivalent?: string
    [key: string]: unknown
  }

  export type ModifierSignature = ModifierParameterEntry

  export interface ImportGuidanceSystemLike {
    generatePackageGuide(packageName: string): string
    generateCheatSheet(): string
  }

  export class ImportGuidanceSystem implements ImportGuidanceSystemLike {
    generatePackageGuide(packageName: string): string
    generateCheatSheet(): string
  }

  export const modifierParameterRegistry: {
    getAllModifiers(): ModifierParameterEntry[]
    searchModifiers(query: string): ModifierParameterEntry[]
    getModifier(name: string): ModifierParameterEntry | undefined
    generateDocumentation(): string
    validateParameters(
      modifierName: string,
      parameters: unknown
    ): { valid: boolean; errors: string[] }
  }
}

declare module '@tachui/core/modifiers/type-generator' {
  export interface ModifierMetadataSnapshotEntry {
    plugin: string
    priority: number
    category: string
  }

  export interface ModifierMetadataSnapshotConflict {
    name: string
    entries: ModifierMetadataSnapshotEntry[]
  }

  export interface ModifierMetadataSnapshot {
    generatedAt: string
    totalModifiers: number
    conflicts: ModifierMetadataSnapshotConflict[]
  }
}

// This file needs to export something to be treated as a module
export {}
