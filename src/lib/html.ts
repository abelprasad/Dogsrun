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

// L-3: strip CR/LF from values interpolated into email subjects.
// Not exploitable via Resend's JSON API, but defense in depth.
export function sanitizeSubject(value: unknown): string {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').trim()
}
