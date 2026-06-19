const BRAND = {
  bg: '#0a0a0a',
  card: '#1a1a1a',
  text: '#f5f5f5',
  muted: '#9e9e9e',
  accent: '#2D7FF9',
}

function shell(title: string, body: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:${BRAND.bg};font-family:Helvetica,Arial,sans-serif;color:${BRAND.text};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.bg};padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:${BRAND.card};border-radius:16px;overflow:hidden;">
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 16px 0;font-size:22px;color:#ffffff;">${title}</h1>
          ${body}
        </td></tr>
      </table>
      <p style="font-size:12px;color:#6e6e6e;margin-top:24px;">Codemo Teams &middot; codemoteam.org</p>
    </td></tr>
  </table>
</body></html>`
}

export function adminAccessGrantedEmail(firstName: string): { subject: string; html: string } {
  return {
    subject: 'Your Codemo admin access is active',
    html: shell(
      'Admin access granted',
      `<p style="margin:0 0 16px 0;line-height:1.6;color:#d9d9d9;">
        Hi ${escapeHtml(firstName)}, your account now has admin access to the Codemo Teams panel.
      </p>
      <p style="margin:0 0 24px 0;">
        <a href="https://codemoteam.org/admin/auth" style="display:inline-block;padding:14px 28px;background:${BRAND.accent};color:#ffffff;border-radius:999px;text-decoration:none;font-weight:600;">
          Open admin panel
        </a>
      </p>
      <p style="margin:0;font-size:13px;color:${BRAND.muted};">If you did not expect this change, contact support immediately.</p>`,
    ),
  }
}

export function welcomeEmail(firstName: string): { subject: string; html: string } {
  return {
    subject: 'Welcome to Codemo Teams',
    html: shell(
      `Welcome, ${escapeHtml(firstName)}`,
      `<p style="margin:0 0 24px 0;line-height:1.6;color:#d9d9d9;">
        Your Codemo account is ready. Explore events, courses, and connect with the community.
      </p>
      <p style="margin:0;">
        <a href="https://codemoteam.org" style="display:inline-block;padding:14px 28px;background:${BRAND.accent};color:#ffffff;border-radius:999px;text-decoration:none;font-weight:600;">
          Go to Codemo
        </a>
      </p>`,
    ),
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!
  ))
}
