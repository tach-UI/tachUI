import type { SSRContext } from './types'

const UNSAFE_HEAD_ENTRY_PATTERN = /<\/(?:head|style)>|<script\b/i

export function sanitizeHeadEntry(
  entry: string,
  routePath: string,
  warningPrefix = '[tachUI][prerender]'
): string | undefined {
  const trimmed = entry.trim()
  if (!trimmed) {
    return undefined
  }

  if (UNSAFE_HEAD_ENTRY_PATTERN.test(trimmed)) {
    console.warn(
      `${warningPrefix} Dropping unsafe head entry for route "${routePath}".`
    )
    return undefined
  }

  return trimmed
}

export function buildHeadEntries(
  context: SSRContext,
  routePath: string,
  warningPrefix?: string
): string[] {
  const entries: string[] = []

  for (const metaTag of context.meta) {
    const safeEntry = sanitizeHeadEntry(metaTag, routePath, warningPrefix)
    if (safeEntry) {
      entries.push(safeEntry)
    }
  }

  for (const linkTag of context.links) {
    const safeEntry = sanitizeHeadEntry(linkTag, routePath, warningPrefix)
    if (safeEntry) {
      entries.push(safeEntry)
    }
  }

  for (const styleBlock of context.styles) {
    const safeStyle = sanitizeHeadEntry(styleBlock, routePath, warningPrefix)
    if (safeStyle) {
      entries.push(`<style>${safeStyle}</style>`)
    }
  }

  return entries
}
