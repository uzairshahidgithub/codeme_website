# Codemo Postal SMTP

Self-hosted transactional email for Codemo Teams, running [Postal v3](https://github.com/postalserver/postal) on a free Oracle Cloud VM. Supabase Auth and the `send-email` Edge Function both relay through this server. Replaces Resend.

## Why

* Free forever (Oracle Always-Free Ampere VM + ~£8/year domain).
* No per-email cap, no per-month sending quota.
* Full control over deliverability — own DKIM key, own IP, own reputation.
* See [ADR-0009](../docs/adr/0009-postal-smtp-over-resend.md) for the full rationale.

## Files

| File | Purpose |
|---|---|
| `docker-compose.yml` | Postal + MariaDB + Redis stack. Runs on the VM. |
| `postal.yml` | Postal main config (mounted into every Postal container). |
| `Dockerfile` | Optional override image. Unused by default. |
| `.env.example` | Per-VM secrets. Copy to `.env` on the VM. |
| `dns-records.md` | Cloudflare DNS records (MX, SPF, DKIM, DMARC, A, PTR note). |
| `setup-guide.md` | Step-by-step Oracle Cloud + Docker + Postal + Certbot. |

## Quick start

The full procedure is in [`setup-guide.md`](setup-guide.md). Summary:

1. Provision the Oracle Cloud Always-Free VM, set rDNS, open SMTP/HTTPS firewall ports.
2. Add the DNS records from `dns-records.md` to Cloudflare.
3. Issue Let's Encrypt certs with Certbot.
4. Clone this folder onto the VM, fill `.env`, `docker compose up -d`.
5. Create admin user, provision the `codemoteam.org` mail domain in the Postal UI, generate SMTP credentials.
6. Paste those credentials into:
   * `supabase/functions/.env` → `SMTP_HOST/PORT/USER/PASS`
   * Supabase Dashboard → Auth → SMTP Settings

## Hostnames

* **`mail.codemoteam.org`** — SMTP server (ports 25 / 587 / 465).
* **`postal.codemoteam.org`** — admin web UI (HTTPS, behind nginx + Certbot).
* Sender: `noreply@codemoteam.org`.

## Operational interfaces

* `docker compose logs -f postal-smtp` — live SMTP traffic.
* `docker compose run --rm postal-runner postal console` — Rails console for diagnostics.
* `https://postal.codemoteam.org` — message browser, deliverability stats, retry queue.
