# Deployment Guide

**Last Updated:** 2026-04-26

## Frontend Deployment via Vercel

* **Platform:** Vercel
* **Production Branch Override:** `frontend` (not `main`)
* **Root Directory:** `frontend`
* **Build Command:** `pnpm build`
* **Install Command:** `pnpm install`
* **Output Directory:** `.next`

### Custom Domain & SSL
* **Domain:** Registered via Namecheap.
* **DNS:** Delegated to Cloudflare.
* **SSL Configuration:** Cloudflare Full Strict mode is required.

### Environment Variable Registry
Variables are configured in the Vercel dashboard per environment:
* **Production:** Mapped to the `frontend` branch.
* **Preview:** Mapped to all PR branches targeting `frontend`.
* **Development:** Pulled locally via `vercel env pull`.

### Limits & Rollbacks
* **Free Tier Limits:** 100GB bandwidth, 100GB-hours edge functions. Upgrade triggers are documented in Architecture.
* **Rollback Procedure:** Use the instant rollback button in the Vercel deployments dashboard to revert to a previous build without waiting for a new deployment.

## Backend Deployment via Railway

* **Platform:** Railway
* **Watch Branch:** `backend`
* **Watch Paths:** `backend/**`, `shared/**`, `package.json`, `pnpm-lock.yaml`
* **Build Configuration:** Nixpacks

### Custom Domain & Configuration
* **Custom Domain:** `api.codemoteams.com`
* **Healthcheck Configuration:** Configured to ping `/api/v1/health`.
* **Restart Policy:** Always restart on failure.

### Limits & Rollbacks
* **Hobby Plan Capacity:** $5 included credit. Billing alerts trigger at $4 usage.
* **Rollback Procedure:** Redeploy the previous commit from the Railway deployments list.

## Cloudflare Configuration

### DNS Records
* Apex `A` or `CNAME` pointing to Vercel.
* `www` `CNAME` pointing to Vercel.
* `api` `CNAME` pointing to Railway.

### SSL/TLS Settings
* **Mode:** Full Strict
* **Minimum TLS Version:** TLS 1.2
* **TLS 1.3:** Enabled

### Rules & Security
* **Page Rules:**
  1. Cache static assets.
  2. Bypass cache for `api.codemoteams.com/*`.
* **WAF Rules:** Block known malicious patterns; challenge non-residential IPs on `/api/v1/auth/*`.
* **Rate Limiting:** 1 free rule applied to authentication endpoints.
* **Security Level:** Medium with Bot Fight Mode and Browser Integrity Check enabled.

## Procedures

### First-Time Deploy Checklist
1. Connect GitHub repository to Vercel and Railway.
2. Configure branch overrides and root directories.
3. Populate all required environment variables.
4. Trigger manual builds.
5. Verify custom domains and Cloudflare proxy status.

### Routine Deploy Procedure
Routine deployments happen automatically upon merging to the `frontend` or `backend` branches.

### Emergency Rollback Procedure
1. Identify the failing service (Frontend/Vercel or Backend/Railway).
2. Execute the platform-specific rollback procedure outlined above.
3. Notify the team in the designated communication channel.
4. Open an issue detailing the outage.

### Domain Renewal Calendar
Namecheap annual reminder: Set calendar alerts 30 days prior to domain expiration.
