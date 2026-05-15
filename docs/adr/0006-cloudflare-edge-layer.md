# ADR-0006: Cloudflare Edge Layer

**Status:** Accepted

## Context
Deploying directly to Vercel and Railway exposes origin IPs and places the burden of malicious traffic filtering entirely on application-level middleware. This consumes compute resources and bandwidth, potentially exhausting free-tier limits or inflating costs.

## Decision
We will position Cloudflare as the strict edge proxy for all incoming traffic to `codemoteam.org` and its subdomains.
* All DNS records must be proxied (Orange Cloud).
* Cloudflare will handle SSL/TLS termination, WAF (Web Application Firewall) execution, and DDoS mitigation.
* Basic rate limiting (e.g., protecting `/api/v1/auth`) will be enforced at the Cloudflare edge before reaching Railway.

## Consequences
* **Positive:** Drastically reduces junk traffic hitting the application origin, saving compute resources.
* **Positive:** Provides enterprise-grade DDoS protection and a global CDN cache for static assets.
* **Negative:** Troubleshooting networking issues requires correlating logs across three platforms (Cloudflare, Vercel, Railway).
* **Negative:** Strict TLS requirements (Full Strict) necessitate maintaining valid origin certificates on both hosting providers.

## Alternatives Considered
* **Vercel Edge Network only:** Rejected because Vercel cannot effectively proxy or protect the Railway backend API without acting as an expensive pass-through, and their built-in WAF is a paid feature.
* **AWS CloudFront / Route53:** Rejected due to steeper learning curve, unpredictable pricing, and lack of a robust free tier comparable to Cloudflare's.
