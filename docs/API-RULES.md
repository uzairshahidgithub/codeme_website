# API Design Rules

**Last Updated:** 2026-04-26

## URL Structure

* **Base URL:** `https://api.codemoteams.com`
* **Versioning:** Endpoints must include the version prefix: `/api/v1/...`
* **Naming:** Use plural resource names strictly (e.g., `/users`, `/articles`).
* **Nesting:** Nested resources are permitted up to two levels maximum (e.g., `/users/:id/achievements`). Beyond that, use query parameters on the primary resource.
* **Filtering & Pagination:** Pass as query strings: `?status=active&limit=20`.

## Request Rules

* **Content-Type:** All requests with bodies must use `Content-Type: application/json`.
* **Authentication:** Prefer session cookies. For programmatic access, use `Authorization: Bearer <token>`.
* **CSRF Protection:** State-changing requests (POST, PATCH, DELETE) require the `X-CSRF-Token` header.
* **Replay Protection:** Include a request nonce in `X-Request-Nonce` and a timestamp in `X-Request-Timestamp`.
* **Encryption:** Payload envelopes on sensitive endpoints (e.g., auth, password resets) must be encrypted before transmission.

## Response Rules

* **Envelope:** All responses must be wrapped in a consistent envelope: `{ data, error, meta }`.
* **Errors:** If an error occurs, the `error` object must include `code`, `message`, and optional `field` and `details`.
* **Pagination Meta:** Paginated responses must include metadata in the `meta` object: `{ total, limit, offset, hasMore }` (or cursor equivalents).
* **Caching:** Include `ETag` headers for highly cacheable resources.
* **Signing:** Responses for auth-state and identity endpoints must be signed using Ed25519 to verify provenance.

## Rate Limiting

* **Anonymous Requests:** 60 requests per minute per IP.
* **Authenticated Requests:** 600 requests per minute per user.
* **Auth Endpoints:** 5 requests per 15 minutes per IP and per account.
* **Headers Returned:** Include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` on all rate-limited endpoints.
* **Exceeding Limits:** Return `429 Too Many Requests` with a `Retry-After` header.

## Status Code Conventions

* `200 OK`: Successful read or update.
* `201 Created`: Successful resource creation.
* `204 No Content`: Successful deletion (no body returned).
* `400 Bad Request`: Malformed syntax or invalid request structure.
* `401 Unauthorised`: Missing, expired, or invalid authentication.
* `403 Forbidden`: Authenticated, but lacking required permissions.
* `404 Not Found`: The requested resource does not exist.
* `409 Conflict`: Resource state conflict (e.g., duplicate unique key).
* `422 Unprocessable Entity`: Semantic validation failure (e.g., Zod schema rejection).
* `429 Too Many Requests`: Rate limit exceeded.
* `500 Internal Server Error`: Unhandled server exception.

## Idempotency

* `POST` requests that create resources should accept an `Idempotency-Key` header.
* The server caches the response for 24 hours keyed by the idempotency token.
* Replayed requests with the same key will return the cached response without executing duplicate side effects.

## Deprecation Policy

* Endpoints marked for deprecation must be announced at least 90 days prior to complete removal.
* A `Deprecation` boolean header must be included on responses from deprecated endpoints.
* A `Sunset` header must indicate the exact scheduled removal date.
* Every deprecation and removal event must be documented in the CHANGELOG.
