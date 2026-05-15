# Cloudflare DNS Records for Postal SMTP

All records are added under the `codemoteam.org` zone in **Cloudflare → DNS → Records**.

> **Critical:** every record below must be **DNS-only (grey cloud)**. Cloudflare's HTTP proxy (orange cloud) does not handle SMTP traffic and will silently drop email. The web UI record may be proxied if you want Cloudflare's TLS edge — but the simplest setup keeps it grey too and lets nginx + Certbot terminate TLS on the VM.

## Records

Replace `<ORACLE_VM_PUBLIC_IP>` with the static public IPv4 from your Oracle Cloud Always-Free instance, and `<DKIM_KEY>` with the public key emitted by Postal during first-boot setup (`postal default-dkim-record` inside the `postal-runner` container).

| Type | Name | Value | Priority | Proxy | TTL |
|---|---|---|---|---|---|
| A | `mail` | `<ORACLE_VM_PUBLIC_IP>` | — | DNS-only | Auto |
| A | `postal` | `<ORACLE_VM_PUBLIC_IP>` | — | DNS-only | Auto |
| MX | `@` | `mail.codemoteam.org` | `10` | n/a | Auto |
| TXT | `@` | `v=spf1 ip4:<ORACLE_VM_PUBLIC_IP> ~all` | — | n/a | Auto |
| TXT | `postal._domainkey` | `<DKIM_KEY>` | — | n/a | Auto |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@codemoteam.org` | — | n/a | Auto |
| TXT | `_resend` | _(remove if previously set for Resend)_ | — | — | — |

### Optional but recommended

| Type | Name | Value | Notes |
|---|---|---|---|
| CAA | `@` | `0 issue "letsencrypt.org"` | Restricts cert issuance to Let's Encrypt |
| TXT | `mail` | `v=spf1 a -all` | Tightens SPF on the mail subdomain itself |

## PTR (rDNS) record

PTR records cannot be added in Cloudflare — they live with whoever owns the IP block.

* **Oracle Cloud:** open a support request at the OCI console → "Compute → Instances → \[your VM\] → Edit DNS → Reverse DNS Hostname" and set it to `mail.codemoteam.org`.
* Without a matching PTR, Gmail and Microsoft 365 will mark Postal sends as spam or reject them outright.

## Verification

After all records propagate (Cloudflare is usually <60s):

```bash
# MX
dig +short MX codemoteam.org
# Expected: 10 mail.codemoteam.org.

# SPF
dig +short TXT codemoteam.org | grep spf1

# DKIM (replace selector if you renamed it)
dig +short TXT postal._domainkey.codemoteam.org

# DMARC
dig +short TXT _dmarc.codemoteam.org

# PTR (run from anywhere)
dig +short -x <ORACLE_VM_PUBLIC_IP>
# Expected: mail.codemoteam.org.
```

For end-to-end deliverability scoring, send a test email to `check-auth@verifier.port25.com` from the Postal admin UI. The reply will report SPF, DKIM, DMARC and reverse DNS results.
