/**
 * Optimized icon set for intro app - only bundles needed icons
 * Reduces bundle size from 620KB to ~5KB
 */

import type { IconSet, IconDefinition, SymbolVariant } from '@tachui/symbols'

const iconPaths: Record<string, string> = {
  'siren':
    '<path d="M7 18v-6a5 5 0 0 1 10 0v6"/><path d="M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z"/><path d="M21 12h1m-6.5-6.5.7-.7m11.3.7-.7-.7m-11.3 13 .7.7m11.3-.7-.7.7M4 12H3m3.5-6.5L6 5m0 14 .5-.5"/>',
  'brain-circuit':
    '<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M9 13a4.5 4.5 0 0 0 3-4"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M12 13h4"/><path d="M12 18h6a2 2 0 0 1 2 2v1"/><path d="M12 8h8"/>',
  'replace':
    '<path d="M14 4c0-1.1.9-2 2-2"/><path d="M20 2c1.1 0 2 .9 2 2"/><path d="M22 8c0 1.1-.9 2-2 2"/><path d="M16 10c-1.1 0-2-.9-2-2"/><path d="m3 7 3 3 3-3"/><path d="M6 10V5c0-1.7 1.3-3 3-3s3 1.3 3 3v5"/><path d="M9 20c-1.7 0-3-1.3-3-3v-5"/>',
  'plug-zap':
    '<path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-1.7-1.7a2.4 2.4 0 0 0-3.4 0Z"/><path d="M2 22 22 2"/><path d="m21 3-3 1 2 2Z"/><path d="M6 16.7 7.7 15l1.6 1.6c.2.2.4.5.4.9v1.9c0 .3-.2.6-.5.6h-1.9c-.3 0-.6-.2-.6-.5Z"/><path d="m13 7.8 4.7-4.4"/>',
  'swatch-book':
    '<path d="M11 17a4 4 0 0 1-8 0V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2Z"/><path d="M16.7 13H19a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H7"/><path d="M 7 17 L 5 17"/><path d="m17 9.7 4-4a2.1 2.1 0 0 0-2.8-2.8l-4 4"/>',
  'panels-top-left':
    '<rect width="18" height="7" x="3" y="3" rx="1"/><rect width="9" height="7" x="3" y="14" rx="1"/><rect width="5" height="7" x="16" y="14" rx="1"/>',
  'text-cursor-input':
    '<path d="M5 4h1a3 3 0 0 1 3 3 3 3 0 0 1 3-3h1"/><path d="M13 20h-1a3 3 0 0 1-3-3 3 3 0 0 1-3 3H5"/><path d="M5 16H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h1"/><path d="M13 8h7a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-7"/><path d="M9 7v10"/>',
  'book-type':
    '<path d="M16 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h2"/><path d="M20 8v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2"/><path d="m9 13 2 2 4-4"/><path d="M16 8h2a2 2 0 0 1 2 2v2"/><path d="M18 12h2"/>',
  'shield-check':
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
}

const createIconDefinition = (name: string, svg: string): IconDefinition => ({
  name,
  variant: 'none',
  weight: 'regular',
  svg,
  viewBox: '0 0 24 24',
})

export class IntroIconSet implements IconSet {
  name = 'intro'
  version = '1.0.0'
  icons: Record<string, IconDefinition> = Object.fromEntries(
    Object.entries(iconPaths).map(([name, svg]) => [name, createIconDefinition(name, svg)])
  )

  async getIcon(name: string, _variant: SymbolVariant = 'none'): Promise<IconDefinition | undefined> {
    return this.icons[name]
  }

  hasIcon(name: string): boolean {
    return name in this.icons
  }

  listIcons(): string[] {
    return Object.keys(this.icons)
  }

  getIconMetadata(): undefined {
    return undefined
  }

  supportsVariant(_name: string, variant: SymbolVariant): boolean {
    return variant === 'none'
  }

  supportsWeight(_name: string, _weight: any): boolean {
    return true
  }
}
