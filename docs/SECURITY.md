# Security Standards

**Last Updated:** 2026-04-26

## Threat Model Summary

We employ STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) per feature during the design phase. Specific threat model documents are stored alongside feature specifications.

## Authentication

* **Password Management:** Supabase Auth handles password hashing using Argon2id (server-managed). Passwords are never seen by our backend logs or database tables outside the managed auth schema.
* **Session Lifetime:** Access tokens expire in 15 minutes. Refresh tokens expire in 7 days, operating on a sliding expiration window.
* **Token Rotation:** Refresh token rotation is mandatory, with strict reuse detection to mitigate token theft.
* **MFA:** Multi-Factor Authentication via TOTP (RFC 6238) and WebAuthn is fully supported and recommended for privileged accounts.
* **Lockout Policy:** Accounts are locked after 5 failed authentication attempts, followed by an exponential backoff period.

## Authorisation

* **Primary Mechanism:** Row-Level Security (RLS) at the Supabase layer.
* **Backend Verification:** The Node.js backend double-checks claims via JWT verification before processing complex logic.
* **Role Hierarchy:** Roles consist of `anon`, `authenticated`, `member`, `moderator`, and `admin`.

## Cryptography

* **Transport:** TLS 1.3 is the required minimum standard.
* **Algorithms:**
  * Symmetric Encryption: AES-256-GCM.
  * Signing: Ed25519.
  * Key Exchange: X25519.
* **Implementation:** Exclusively use `libsodium` implementations (`sodium-native`). Custom cryptographic implementations are strictly forbidden.
* **Key Rotation Calendar:** Symmetric keys rotate every 90 days; asymmetric keypairs rotate annually.

## Headers

* **HSTS:** Preload configured.
* **X-Frame-Options:** `DENY`.
* **X-Content-Type-Options:** `nosniff`.
* **Referrer-Policy:** `strict-origin-when-cross-origin`.
* **Permissions-Policy:** Explicitly disable camera, microphone, and geolocation unless specifically required by a documented feature.
* **Content-Security-Policy (CSP):** Strict CSP enforced using nonce-based `script-src`.

## Secrets Management

* **Storage:** Secrets are exclusively stored in Vercel and Railway environment variable stores.
* **Local Development:** Never use production `.env` files locally.
* **VCS:** Secrets must **never** be committed to Git.
* **Rotation:** Procedures for secret rotation are documented in the internal Runbooks.

## Incident Response

* **On Suspected Breach:**
  1. Invalidate all active sessions.
  2. Rotate all cryptographic keys.
  3. Audit access logs to determine scope.
  4. Notify affected users within 72 hours per applicable data protection regulations (e.g., GDPR).
* **Leadership:** An Incident Commander must be designated immediately upon breach detection.
* **Postmortem:** A blameless postmortem must be published internally within 7 days of incident resolution.
* **Action Items:** All remediation tasks must be tracked to closure via the issue tracker.

## Vulnerability Management

* **Scanning:** Dependabot is enabled on all branches. Snyk/Trivy scans run as required CI checks on every PR.
* **Patching SLA:**
  * **Critical CVEs:** Patched within 48 hours.
  * **High CVEs:** Patched within 7 days.
  * **Medium/Low CVEs:** Patched in the next scheduled release cycle.
