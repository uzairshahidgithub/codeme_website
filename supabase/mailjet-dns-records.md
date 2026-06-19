# Mailjet DNS — stop emails landing in Gmail Spam
#
# Gmail flagged your reset email because:
#   1. SPF / DKIM / DMARC are missing or not verified for your sending domain
#   2. Supabase is still using the default plain "Reset Password" template (looks like phishing)
#   3. Your screenshot shows noreply@codemoteams.org — pick ONE domain and use it everywhere
#
# =============================================================================
# STEP 1 — Pick your sending domain (must match Supabase + Mailjet + DNS)
# =============================================================================
#
# Your test email came from: noreply@codemoteams.org
# Project env defaults to:   noreply@codemoteam.org
#
# These are DIFFERENT domains. Choose the one you verified in Mailjet and use
# it in ALL of these places:
#   • Mailjet → Account Settings → Senders & Domains
#   • Supabase → Auth → SMTP Settings → Sender email
#   • frontend/.env.local → MAILJET_FROM_EMAIL
#
# =============================================================================
# STEP 2 — Add domain in Mailjet and copy DNS records
# =============================================================================
#
# 1. Mailjet → Account Settings → Senders & Domains → Add domain
# 2. Enter your domain (e.g. codemoteams.org OR codemoteam.org)
# 3. Mailjet shows SPF + DKIM records — add them in Cloudflare DNS
#
# Typical Mailjet records (values differ per account — use Mailjet's copy):
#
# SPF (TXT on root @):
#   v=spf1 include:spf.mailjet.com ~all
#
# DKIM (TXT or CNAME — use exact host/value from Mailjet dashboard):
#   Host: mailjet._domainkey
#   Value: (long RSA key from Mailjet)
#
# DMARC (TXT on _dmarc):
#   v=DMARC1; p=none; rua=mailto:dmarc@YOURDOMAIN; adkim=s; aspf=s
#
# After adding records, click Refresh in Mailjet until SPF and DKIM show green OK.
# DNS can take up to 48 hours; usually 15–60 minutes on Cloudflare.
#
# =============================================================================
# STEP 3 — Supabase branded templates (fixes "dangerous message" warning)
# =============================================================================
#
# Supabase Dashboard → Authentication → Email Templates
#
# For each template, paste HTML from supabase/email-templates/ and set subject:
#
#   Confirm signup     → confirm-signup.html  → Subject: Confirm your Codemo account
#   Magic link         → magic-link.html      → Subject: Your Codemo sign-in code
#   Reset password     → recovery.html        → Subject: Reset your Codemo password
#   Change email       → email-change.html    → Subject: Confirm your new Codemo email
#
# =============================================================================
# STEP 4 — Supabase SMTP (Mailjet)
# =============================================================================
#
# Supabase → Project Settings → Auth → SMTP Settings
#
#   Host:         in-v3.mailjet.com
#   Port:         587
#   Username:     (Mailjet API Key / public key)
#   Password:     (Mailjet Secret Key)
#   Sender email:  noreply@YOUR-VERIFIED-DOMAIN
#   Sender name:   Codemo Teams
#
# =============================================================================
# STEP 5 — Verify with Mailjet + Gmail
# =============================================================================
#
# 1. Mailjet → Stats → check message was Delivered (not bounced)
# 2. Open email headers in Gmail → Show original → look for:
#      spf=pass  dkim=pass  dmarc=pass
# 3. If all pass but still in Spam: mark once as "Not spam" — new domains need reputation
#
# =============================================================================
# Optional (paid Mailjet): custom Return-Path for full SPF alignment
# =============================================================================
# CNAME: bnc3.yourdomain.com → bnc3.mailjet.com
# Then open Mailjet support ticket to activate.
