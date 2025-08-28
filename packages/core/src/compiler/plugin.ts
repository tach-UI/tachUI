/**
 * TachUI Vite Plugin
 *
 * Custom Vite plugin that transforms SwiftUI-style syntax into reactive DOM code.
 * This is the core of Phase 2.1.1 - the plugin foundation for compile-time transformation.
 */

import type { Plugin, TransformResult } from 'vite'
import { generateDOMCode } from './codegen'
import { parseSwiftUISyntax } from './parser'
import type { TachUIPluginOptions } from './types'

/**
 * Creates the TachUI Vite plugin for transforming SwiftUI syntax
 */
export function createTachUIPlugin(options: TachUIPluginOptions = {}): Plugin {
  const {
    include = ['.tsx', '.ts'],
    exclude = ['node_modules/**', '**/*.test.*', '**/*.bench.*'],
    dev = process.env.NODE_ENV === 'development',
    transform: transformOptions = {},
  } = options

  return {
    name: 'tachui-transform',
    enforce: 'pre', // Run before other plugins

    configResolved(config) {
      // Access the resolved Vite config
      if (dev && config.command === 'serve') {
        console.log('🚀 TachUI plugin loaded in development mode')
      }
    },

    buildStart() {
      // Plugin initialization
      this.addWatchFile('tachui.config.ts') // Watch for config changes
    },

    resolveId(id: string) {
      // Handle virtual modules if needed
      if (id === 'virtual:tachui-runtime') {
        return id
      }
      return null
    },

    load(id: string) {
      // Load virtual modules
      if (id === 'virtual:tachui-runtime') {
        return generateRuntimeCode()
      }
      return null
    },

    transform(code: string, id: string): TransformResult | null {
      // Only transform files that match our criteria
      if (!shouldTransform(id, include, exclude)) {
        return null
      }

      try {
        // Check if the file contains TachUI syntax
        if (!containsTachUISyntax(code)) {
          return null
        }

        if (dev) {
          console.log(`🔄 Transforming: ${id}`)
        }

        // Parse SwiftUI syntax into AST
        const ast = parseSwiftUISyntax(code, id)

        // Generate reactive DOM code from AST
        const transformedCode = generateDOMCode(ast, {
          ...transformOptions,
          sourceFile: id,
          sourceMaps: transformOptions.sourceMaps ?? dev,
        })

        return {
          code: transformedCode.code,
          map: transformedCode.map,
        }
      } catch (error) {
        // Provide helpful error messages during development
        const message = error instanceof Error ? error.message : String(error)
        this.error(`TachUI transformation failed in ${id}: ${message}`)
        return null
      }
    },

    handleHotUpdate(ctx) {
      // Handle HMR for TachUI components
      if (ctx.file.endsWith('.tui.tsx') || ctx.file.endsWith('.tui.ts')) {
        // Mark for full reload if needed
        ctx.server.ws.send({
          type: 'full-reload',
        })
        return []
      }
    },
  }
}

/**
 * Determines if a file should be transformed by the plugin
 */
function shouldTransform(id: string, include: string[], exclude: string[]): boolean {
  // Check if file extension is included
  const hasIncludedExtension = include.some((ext) => id.endsWith(ext))
  if (!hasIncludedExtension) {
    return false
  }

  // Check if file is excluded
  const isExcluded = exclude.some((pattern) => {
    // Simple glob pattern matching
    if (pattern.includes('**')) {
      const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'))
      return regex.test(id)
    }
    return id.includes(pattern)
  })

  return !isExcluded
}

/**
 * Quick check to see if code contains TachUI syntax patterns
 */
function containsTachUISyntax(code: string): boolean {
  // Look for SwiftUI-style component patterns
  const tachUIPatterns = [
    /\b(VStack|HStack|ZStack|List|Form)\s*\{/,
    /\b(Text|Button|Image|TextField|Toggle)\s*\(/,
    /\.(padding|background|foregroundColor|font|frame)\s*\(/,
    /\.onTapGesture\s*\(/,
  ]

  return tachUIPatterns.some((pattern) => pattern.test(code))
}

/**
 * Generates runtime code for virtual modules
 */
function generateRuntimeCode(): string {
  return `
// TachUI Runtime Module
// This provides runtime utilities for transformed components

import { createSignal, createEffect, createComputed } from '@tachui/core/reactive'

export { createSignal, createEffect, createComputed }

// Runtime helpers for component lifecycle
export function mountComponent(element, render) {
  const dispose = render()
  element._tachui_dispose = dispose
  return dispose
}

export function unmountComponent(element) {
  if (element._tachui_dispose) {
    element._tachui_dispose()
    delete element._tachui_dispose
  }
}

// Hot reload support
if (import.meta.hot) {
  import.meta.hot.accept()
  
  // Re-mount components on hot reload
  import.meta.hot.dispose(() => {
    document.querySelectorAll('[data-tachui-component]').forEach(unmountComponent)
  })
}
`
}
