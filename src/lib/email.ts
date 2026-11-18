import { SITE_URL } from '@/lib/constants'

interface BrandedEmailOptions {
  eyebrow?: string
  title: string
  titleSize?: number
  bodyHtml: string
  footerNote?: string
}

/** Dark-green DOGSRUN email chrome. `title`, `bodyHtml` and `footerNote` must already be escaped. */
export function brandedEmail({ eyebrow = 'DOGSRUN', title, titleSize = 28, bodyHtml, footerNote }: BrandedEmailOptions) {
  return `
    <div style="background-color:#f5f0e8;padding:40px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background-color:#fff9ef;border:1px solid rgba(19,36,29,0.1);">
        <div style="background-color:#13241d;padding:32px 40px;text-align:center;">
          <p style="color:rgba(244,185,66,0.7);font-size:11px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;margin:0 0 8px 0;">${eyebrow}</p>
          <h1 style="color:#c08a3e;font-size:${titleSize}px;font-weight:900;letter-spacing:-0.025em;margin:0;">${title}</h1>
        </div>
        <div style="padding:40px;">
          ${bodyHtml}
        </div>
        <div style="background-color:#13241d;padding:20px 40px;text-align:center;">
          <p style="color:rgba(244,185,66,0.5);font-size:11px;letter-spacing:0.1em;margin:0 0 4px 0;text-transform:uppercase;">Loyalty Repaid</p>
          <p style="color:rgba(245,240,232,0.4);font-size:11px;margin:0;">${footerNote ? `${footerNote} &nbsp;|&nbsp;\n            ` : ''}&copy; ${new Date().getFullYear()} DOGSRUN &nbsp;|&nbsp;<a href="${SITE_URL}" style="color:rgba(244,185,66,0.6);text-decoration:none;">dogsrun.org</a></p>
        </div>
      </div>
    </div>
  `
}

export function emailButton(href: string, label: string) {
  return `<a href="${href}" style="background-color:#13241d;color:#c08a3e;padding:14px 32px;text-decoration:none;display:inline-block;font-weight:700;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;">${label}</a>`
}

/** One label/value row for a `<table>` inside `brandedEmail`. `valueHtml` must already be escaped. */
export function emailDetailRow(label: string, valueHtml: string, { bold = false, last = false, labelWidth = false } = {}) {
  return `
                <tr${last ? '' : ' style="border-bottom:1px solid rgba(19,36,29,0.08);"'}>
                  <td style="padding:10px 0;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#5d6a64;${labelWidth ? 'width:120px;' : ''}">${label}</td>
                  <td style="padding:10px 0;font-size:15px;${bold ? 'font-weight:700;' : ''}color:#13241d;">${valueHtml}</td>
                </tr>`
}
