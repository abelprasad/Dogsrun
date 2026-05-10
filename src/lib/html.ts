export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

export function escapeHtmlOrDash(value: unknown): string {
  const escaped = escapeHtml(value).trim()
  return escaped || '&mdash;'
}
