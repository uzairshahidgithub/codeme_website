# Backend Architecture & Standards

**Last Updated:** 2026-04-26

## Stack

* Node.js 20+ with TypeScript strict mode.
* Fastify framework (Chosen for performance and plugin ecosystem; see pending ADR).
* Prisma ORM for typed Supabase access.
* Zod for validation at every boundary.
* libsodium for cryptography (via sodium-native bindings).

## Directory Structure

```text
backend/
├── src/
│   ├── routes/      # Route handlers grouped by feature
│   ├── middleware/  # Auth, CSRF, rate limit, encryption envelope
│   ├── services/    # Core business logic
│   ├── crypto/      # Key management, encryption, signing utilities
│   ├── db/          # Supabase clients per project
│   └── index.ts     # Server entry point
├── migrations/      # Prisma/SQL migrations
└── package.json
```

## Endpoint Conventions

* **Architecture:** Strictly RESTful resource paths.
* **Versioning:** Path prefix must be `/api/v1/`.
* **Naming:** Plural resource nouns (e.g., `/users`, `/articles`).
* **Operations:** HTTP verbs dictate the action:
  * `GET` (list or read single)
  * `POST` (create)
  * `PATCH` (update)
  * `DELETE` (remove)
* **Status Codes:** Standard RFC 7231 mapping (200, 201, 204, 400, 401, 403, 404, 409, 422, 429, 500).
* **Response Envelope:** Every response must be wrapped as `{ data, error, meta }`.

## Validation Rules

* Every request body is validated with a corresponding Zod schema.
* Every query parameter is validated.
* Every path parameter is validated.
* Validation failures immediately return `422 Unprocessable Entity` containing field-level error details.

## Logging

* Structured JSON logs via Pino.
* **FORBIDDEN:** Never log secrets, PII, session tokens, or passwords.
* Propagate a Request ID end-to-end for trace matching.
* Emit specific audit log entries for highly privileged actions.

## Error Handling

* Implement a central error-handling middleware.
* Distinguish clearly between operational errors (e.g., rate limit, bad request) and programmer errors (unhandled exceptions).
* User-facing messages must remain generic to avoid leaking system internals. Detailed technical information is logged internally.
* Stack traces must **never** be returned to the client in production.
