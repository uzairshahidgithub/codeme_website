import { ServerClient } from 'postmark'

const client = new ServerClient(process.env.POSTMARK_API_KEY!)

const FROM = process.env.POSTMARK_FROM_EMAIL ?? 'noreply@codemo.app'

function verificationEmailHtml(code: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Verify your Codemo account</title>
</head>
<body style="background:#000;color:#fff;font-family:sans-serif;margin:0;padding:40px 20px;">
  <div style="max-width:480px;margin:0 auto;background:#1A1A1A;border-radius:24px;padding:40px;">
    <div style="margin-bottom:32px;display:flex;align-items:center;gap:12px;">
      <span style="font-size:24px;font-weight:800;">Codemo</span>
    </div>
    <h1 style="font-size:24px;font-weight:600;margin-bottom:12px;">Verify your email</h1>
    <p style="color:#B8B8B8;margin-bottom:32px;">Enter the code below to complete your Codemo registration. It expires in 10 minutes.</p>
    <div style="background:#2A2A2A;border-radius:16px;padding:24px;text-align:center;letter-spacing:8px;font-size:36px;font-weight:700;color:#2D7FF9;">
      ${code}
    </div>
    <p style="color:#9E9E9E;font-size:13px;margin-top:32px;">If you did not create a Codemo account, you can safely ignore this email.</p>
  </div>
</body>
</html>`
}

export async function sendVerificationEmail(
  to: string,
  code: string,
): Promise<void> {
  await client.sendEmail({
    From: FROM,
    To: to,
    Subject: `${code} is your Codemo verification code`,
    HtmlBody: verificationEmailHtml(code),
    TextBody: `Your Codemo verification code is: ${code}\n\nThis code expires in 10 minutes. If you did not request this, ignore this email.`,
    MessageStream: 'outbound',
  })
}
