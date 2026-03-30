export function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function escapeAttribute(text: string): string {
  return escapeHTML(text).replace(/"/g, '&quot;')
}
