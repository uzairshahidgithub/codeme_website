# Database Operation Rules

**Last Updated:** 2026-04-26

## Query Rules

* **Parameterisation:** Always use parameterised queries via the ORM. String concatenation for queries is strictly forbidden to prevent SQL injection.
* **Pagination:** Every list-returning query must have explicit pagination (offset/limit or cursor-based).
* **Limits:** The default limit is 20; the absolute maximum is 100.
* **Indexing:** Ensure columns used in `WHERE`, `ORDER BY`, or `JOIN` clauses are properly indexed.
* **N+1 Avoidance:** Avoid N+1 query patterns; heavily prefer batched fetches or composed queries.

## Transaction Rules

* Use transactions for any multi-step writes.
* Ensure the appropriate isolation level is set (Read Committed is acceptable for most standard operations).
* Keep transactions short. **Never** wait on external I/O (like network calls) inside a database transaction block.

## Migration Rules

* Migrations in production are forward-only.
* Test all migrations on a sanitised copy of production data before applying.
* Migrations that impose table locks must be scheduled during off-peak maintenance windows.
* Perform a backup verification immediately before executing destructive migrations.

## Backup Rules

* Supabase automated daily backups must be enabled on every active project.
* The free tier retains backups for 7 days.
* Perform a quarterly manual export to cold storage (e.g., S3 Glacier or equivalent).
* A backup restore drill must be performed semi-annually and its outcome documented.

## Data Classification

* **Public:** Marketing content, public profile data.
* **Internal:** Aggregated metrics, system operational logs.
* **Confidential:** User PII, email addresses, date of birth, gender.
* **Restricted:** Passwords (never stored in plaintext; only Argon2id hashes via Supabase Auth), payment information (processor tokens only, no PAN data).

## Retention Rules

* **Audit Log:** Retain for a minimum of 1 year.
* **User Data on Account Deletion:** Hard delete following a 30-day grace period (implemented via soft-delete).
* **Email Confirmation Codes:** Hard delete immediately upon expiry.
* **Session Tokens:** Hard delete immediately upon explicit logout or expiry.
