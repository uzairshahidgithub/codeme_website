# Operational Runbooks

**Last Updated:** 2026-04-26

## 1. Frontend Deploy Stuck or Failed

* **Symptom:** Vercel deployment hangs or fails during the build phase.
* **Diagnostic Steps:**
  1. Inspect the Vercel deployment logs for `next build` errors.
  2. Check for missing environment variables in the Vercel dashboard.
  3. Verify the `pnpm-lock.yaml` is in sync with `package.json`.
* **Resolution Steps:**
  1. If it's a code issue, revert the PR or push a hotfix.
  2. If it's a transient Vercel issue, retry the deployment without build cache.
* **Escalation Contacts:** Frontend Tech Lead, DevOps Lead.
* **Postmortem:** [Postmortem Template](#)

## 2. Backend Deploy Stuck or Failed

* **Symptom:** Railway deployment fails or the service constantly restarts.
* **Diagnostic Steps:**
  1. Check Railway deploy logs for Nixpacks build failures.
  2. Check application logs for startup crashes (e.g., missing DB connection).
  3. Verify the healthcheck endpoint (`/api/v1/health`) locally.
* **Resolution Steps:**
  1. Redeploy the last known good commit via the Railway dashboard (Rollback).
  2. Ensure all required `SUPABASE_` URLs and keys are set correctly.
* **Escalation Contacts:** Backend Tech Lead, DevOps Lead.
* **Postmortem:** [Postmortem Template](#)

## 3. Supabase Project at Quota Threshold

* **Symptom:** Warning email or dashboard alert indicating >80% utilisation of a free-tier resource.
* **Diagnostic Steps:**
  1. Review the Supabase dashboard to identify the specific constraint (Database Size, Egress, MAU).
  2. Identify the culprit project (e.g., `codemo-articles`).
* **Resolution Steps:**
  1. If the usage is anomalous (e.g., a scraping bot), implement stricter Cloudflare WAF rules.
  2. If the usage is legitimate, prepare the documented migration path to the Pro tier for that specific project.
* **Escalation Contacts:** Tech Lead.
* **Postmortem:** [Postmortem Template](#)

## 4. Cloudflare DNS Propagation Issue

* **Symptom:** Custom domain does not resolve, or SSL handshake fails.
* **Diagnostic Steps:**
  1. Use `dig` or `nslookup` to verify the apex and `www` records.
  2. Ensure Cloudflare proxy status (orange cloud) is correctly toggled.
* **Resolution Steps:**
  1. Correct DNS entries based on Vercel/Railway target requirements.
  2. Purge the Cloudflare cache if necessary.
* **Escalation Contacts:** DevOps Lead.
* **Postmortem:** [Postmortem Template](#)

## 5. SSL Certificate Renewal Failure

* **Symptom:** Cloudflare reports Edge certificate issuance failure.
* **Diagnostic Steps:**
  1. Check the Edge Certificates tab in Cloudflare.
  2. Ensure Namecheap DNS points exclusively to Cloudflare nameservers.
* **Resolution Steps:**
  1. Disable and re-enable Universal SSL.
  2. If using advanced certificates, ensure DCV (Domain Control Validation) records are present.
* **Escalation Contacts:** DevOps Lead.
* **Postmortem:** [Postmortem Template](#)

## 6. Suspected Security Breach

* **Symptom:** Anomalous admin activity, reported vulnerability, or data exfiltration.
* **Diagnostic Steps:**
  1. Review Supabase audit logs (`codemo-core`).
  2. Review Cloudflare access and WAF logs.
* **Resolution Steps:**
  1. Immediately invalidate all active sessions via Supabase.
  2. Rotate all JWT secrets and symmetric encryption keys.
  3. Patch the vulnerability.
  4. Notify affected users within 72 hours.
* **Escalation Contacts:** Security Lead, Incident Commander.
* **Postmortem:** [Postmortem Template](#)

## 7. Database Performance Degradation

* **Symptom:** High API latency or timeout errors from the backend.
* **Diagnostic Steps:**
  1. Check Railway logs for slow query warnings.
  2. Use the Supabase query performance analyser to identify missing indexes.
* **Resolution Steps:**
  1. Add necessary indexes via a new migration.
  2. Implement caching for read-heavy, slow-changing endpoints.
* **Escalation Contacts:** Backend Tech Lead.
* **Postmortem:** [Postmortem Template](#)

## 8. Email Delivery Failure

* **Symptom:** Users cannot receive confirmation or password reset emails.
* **Diagnostic Steps:**
  1. Check the Supabase Auth email logs.
  2. Check the Postal admin UI (`postal.codemoteam.org` → Server → Messages) for queued, bounced, or held messages.
* **Resolution Steps:**
  1. Verify domain DKIM, SPF, and DMARC records in Cloudflare.
  2. Rotate SMTP credentials if suspected compromised.
* **Escalation Contacts:** DevOps Lead.
* **Postmortem:** [Postmortem Template](#)

## 9. Rate Limit Storm from a Single IP

* **Symptom:** Cloudflare alerts or backend rate-limit middleware triggering continuously.
* **Diagnostic Steps:**
  1. Identify the offending IP in Cloudflare analytics or backend logs.
* **Resolution Steps:**
  1. Block the IP or ASN permanently in the Cloudflare WAF.
  2. If the attack is distributed, enable "I'm Under Attack" mode temporarily.
* **Escalation Contacts:** DevOps Lead.
* **Postmortem:** [Postmortem Template](#)

## 10. Domain Renewal Reminder

* **Symptom:** Scheduled calendar alert 30 days prior to expiration.
* **Diagnostic Steps:**
  1. Check Namecheap dashboard for expiration date of `codemoteam.org`.
* **Resolution Steps:**
  1. Ensure the corporate credit card on file is valid.
  2. Process renewal manually if auto-renew is disabled or fails.
* **Escalation Contacts:** Operations.
* **Postmortem:** N/A
