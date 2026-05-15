# ADR-0007: Domain Registration vs DNS Hosting Separation

**Status:** Accepted

## Context
Domain registration and DNS hosting are fundamentally different concerns. Bundling them with a single provider can create vendor lock-in and complicate infrastructure migrations.

## Decision
We will strictly separate the domain registrar from the DNS provider:
* **Registrar:** Namecheap will be used exclusively for registering and renewing the `codemoteam.org` domain.
* **DNS Provider:** Cloudflare will act as the sole authoritative nameserver and DNS manager.
* Namecheap's configuration will be limited entirely to pointing custom nameservers to Cloudflare.

## Consequences
* **Positive:** We leverage Cloudflare's superior DNS resolution speed, propagation times, and edge security features.
* **Positive:** We retain Namecheap's cost-effective registration pricing.
* **Positive:** Infrastructure migrations (changing Vercel or Railway targets) require no interaction with the registrar.
* **Negative:** Requires monitoring two separate accounts for billing and renewal notifications.

## Alternatives Considered
* **Registering directly with Cloudflare:** Rejected as Cloudflare Registrar does not support all TLDs we may require in the future, and initial registration was already completed via Namecheap.
* **Using Namecheap BasicDNS:** Rejected because it lacks advanced proxy capabilities, WAF, and the raw performance of Cloudflare's edge network.
