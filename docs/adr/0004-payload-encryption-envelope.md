# ADR-0004: Payload Encryption Envelope

**Status:** Accepted

## Context
While TLS 1.3 provides robust encryption in transit, relying solely on transport-level security leaves sensitive payloads (e.g., passwords, PII) vulnerable if SSL termination occurs before reaching the application layer (e.g., at a misconfigured proxy), or if traffic is intercepted by a malicious internal actor.

## Decision
We will implement an application-level Payload Encryption Envelope for sensitive endpoints (login, signup, password resets).
* The client will encrypt the JSON payload using AES-256-GCM before transmission.
* The symmetric key is securely delivered to the client upon initial session bootstrap via an X25519 key exchange.
* The backend decrypts the payload inside the Node.js application process, completely bypassing intermediate infrastructure.

## Consequences
* **Positive:** Ensures end-to-end secrecy even if TLS is compromised or terminated early.
* **Positive:** Prevents data exposure in access logs and edge network telemetry.
* **Negative:** Increases complexity on both the frontend (encryption before fetch) and backend (decryption middleware).
* **Negative:** Adds computational overhead, although negligible with `libsodium`.

## Alternatives Considered
* **Relying purely on TLS 1.3:** Rejected because it does not protect against internal network inspection post-Cloudflare termination, nor does it secure data in raw proxy logs.
