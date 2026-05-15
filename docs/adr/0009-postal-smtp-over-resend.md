# ADR-0009: Self-hosted Postal SMTP over Resend

**Status:** Accepted
**Date:** 2026-05-08
**Supersedes (partial):** ADR-0008 (which named Resend as the email provider; that choice is replaced here while every other decision in 0008 stands)

## Context

ADR-0008 collapsed the stack to Vercel + Supabase + Cloudflare and called Resend in as the transactional email provider, both for Supabase Auth's confirmation/recovery/magic-link emails and for app-level sends through the `send-email` Edge Function.

Resend has a free tier of 3 000 emails/month and a sender restriction (one verified domain per project on free, no team/org features). That ceiling is acceptable for early MVP, but two things shifted the calculation:

1. **Idle compute we already pay £0/month for.** Oracle Cloud Always-Free includes a forever-free `VM.Standard.A1.Flex` Ampere ARM VM (4 OCPU, 24 GB RAM, 50 GB block storage). It is materially under-utilised; running a Postal SMTP server uses a fraction of one core.
2. **Long-term cost and lock-in.** Once the product passes Resend's 3 000/month threshold, every subsequent email is metered. Postal on the OCI Always-Free VM caps cost at zero indefinitely and retains full deliverability control (own DKIM key, own IP reputation, own rate limits).

We considered three options:

* **Stay on Resend.** Cleanest operationally; explicit per-email cost beyond the free tier.
* **Resend + AWS SES failover.** Cheaper than Resend at scale but introduces SES domain verification, more env vars, and dual-provider state.
* **Self-hosted Postal on OCI.** Zero recurring cost. One VM to operate. Full DKIM/SPF/DMARC control.

## Decision

We adopt self-hosted **Postal v3** running in Docker Compose on a single Oracle Cloud Always-Free VM. The Edge Function `send-email` relays via authenticated SMTP submission on port 587 STARTTLS. Supabase Auth's own emails (signup confirmation, password recovery, magic link, email change) are pointed at the same SMTP relay through Auth → SMTP Settings.

The repo gains a top-level `smtp/` workspace containing `docker-compose.yml`, `postal.yml`, `.env.example`, DNS record catalogue, and an end-to-end setup guide.

The Edge Function uses [`denomailer`](https://deno.land/x/denomailer) for the SMTP client. No nodemailer (we are on Deno).

DNS, mail subdomain (`mail.codemoteam.org`), admin UI subdomain (`postal.codemoteam.org`), and PTR record on the VM are documented in `smtp/dns-records.md`.

## Consequences

### Positive
* Total monthly email cost: £0, regardless of volume (up to ~10 k/day on the Always-Free shape).
* Full control of DKIM key, sending IP, and reputation. We pick our own IP warm-up cadence.
* No sender quota, no domain restriction, no per-org pricing tier to hit.
* Postal's admin UI gives per-message tracing, retry, and bounce inspection — strictly better operational visibility than Resend's dashboard for debugging deliverability issues.
* One fewer external SaaS dependency in the security model.

### Negative
* We now operate a server. The previous architecture had no servers we operated; everything was managed. Operational tax: certbot renewals, MariaDB backups, OCI VM monitoring, occasional Postal upgrades.
* IP reputation must be earned. A brand-new OCI public IP has no history, so the first weeks may see lower inbox placement until DKIM/SPF/DMARC + rDNS combine with consistent send volume.
* If the OCI Always-Free programme is withdrawn, we have to migrate. Risk is non-zero but historically Oracle has only added to the Always-Free tier, never reduced it.
* DKIM key rotation is now manual (Postal admin UI + Cloudflare DNS update). Resend handled this transparently.
* Edge Functions on Supabase reach the SMTP relay over the public internet. Connection latency adds ~50-150 ms per send relative to Resend's edge-pooled HTTP API. Acceptable for transactional sends that are fire-and-forget.

### Reversibility
The decision is reversible at low cost. Reverting to Resend:
1. Swap `denomailer` SMTPClient for the Resend HTTPS API in `supabase/functions/send-email/index.ts`.
2. Replace `SMTP_HOST/PORT/USER/PASS` secrets with `RESEND_API_KEY`.
3. Update Supabase Auth → SMTP Settings to Resend's credentials.
4. Delete the OCI VM and the `smtp/` workspace.

No data migration is needed — Postal is purely transit, audit logs live in Supabase.
