import { tenant as backendTenant } from '../config/tenant.config.js'

export interface PlaceholderTemplateData {
  headline: string
  body: string
  ctaText: string
  ctaUrl: string
  agentName: string
  agentSignature: string
  /** Optional override; defaults to tenant.brand.siteName */
  preheader?: string
  /** Optional one-click unsubscribe target; W3 wires the real flow */
  unsubscribeUrl?: string
}

/**
 * Brand-neutral placeholder template used by W3's eventual notification
 * flows. Reads tenant brand colors so the look-and-feel matches the rest of
 * the site without re-declaring color tokens.
 *
 * NOTE: Hardcoded brand colors here mirror the gold/navy palette in
 * src/configs/tenant.config.ts (visualIdentity.colors). Backend doesn't
 * currently consume the frontend visualIdentity object; if/when a shared
 * theme exists, replace these.
 */
const BRAND_PRIMARY = '#b19a55' // gold accent
const BRAND_TEXT = '#1a1a1a'
const BRAND_HEADER_BG = '#0F1621'
const BRAND_BORDER = '#d9d9d9'

export function placeholderTemplate(
  data: PlaceholderTemplateData
): { html: string; text: string } {
  const { brand, contact } = backendTenant
  const preheader = data.preheader || brand.siteName
  const unsubscribeUrl =
    data.unsubscribeUrl || `${brand.siteUrl}/account/notifications`

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(data.headline)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND_TEXT}">
    <span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0">${escapeHtml(preheader)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5">
      <tr>
        <td align="center" style="padding:24px 12px">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid ${BRAND_BORDER};border-radius:8px;overflow:hidden">
            <tr>
              <td style="background:${BRAND_HEADER_BG};padding:20px 24px;text-align:left">
                <span style="color:#ffffff;font-size:18px;font-weight:600;letter-spacing:0.3px">${escapeHtml(brand.teamName)}</span>
                <span style="color:#9b9b9b;font-size:13px;margin-left:10px">${escapeHtml(brand.domainDisplay)}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 24px 16px 24px">
                <h1 style="margin:0 0 16px 0;font-size:22px;line-height:1.3;color:${BRAND_TEXT}">${escapeHtml(data.headline)}</h1>
                <div style="font-size:15px;line-height:1.55;color:${BRAND_TEXT}">${data.body}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 24px 32px 24px">
                <a href="${escapeAttr(data.ctaUrl)}" style="display:inline-block;background:${BRAND_PRIMARY};color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:6px;font-size:15px;font-weight:600">${escapeHtml(data.ctaText)}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 24px 24px;border-top:1px solid ${BRAND_BORDER}">
                <p style="margin:16px 0 4px 0;font-size:14px;color:${BRAND_TEXT}"><strong>${escapeHtml(data.agentName)}</strong></p>
                <div style="font-size:13px;color:#666;line-height:1.5">${data.agentSignature}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;background:#fafafa;font-size:12px;color:#888;text-align:center">
                You're receiving this email from ${escapeHtml(contact.notificationsEmail)}.
                <br />
                <a href="${escapeAttr(unsubscribeUrl)}" style="color:#888;text-decoration:underline">Manage notifications</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  const text = [
    data.headline,
    '',
    stripHtml(data.body),
    '',
    `${data.ctaText}: ${data.ctaUrl}`,
    '',
    '—',
    data.agentName,
    stripHtml(data.agentSignature),
    '',
    `Manage notifications: ${unsubscribeUrl}`,
  ].join('\n')

  return { html, text }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
function escapeAttr(s: string): string {
  return escapeHtml(s)
}
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+\n/g, '\n')
    .trim()
}
