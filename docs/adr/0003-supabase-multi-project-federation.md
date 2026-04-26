# ADR-0003: Supabase Multi-Project Federation

**Status:** Accepted

## Context
Supabase offers a generous free tier (500MB DB, 50k MAU) per project. However, as Codemo Teams expands its feature set (Articles, Events, e-Learning), a single database will quickly exhaust these limits. Upgrading to the Pro tier immediately for pre-revenue or low-traffic features is not cost-effective.

## Decision
We will employ a multi-project database federation strategy:
* The primary identity and audit data will reside in `codemo-core`.
* Discrete feature verticals (e.g., `codemo-articles`, `codemo-events`) will be spun up as entirely separate Supabase projects on the free tier.
* Data integrity is maintained by referencing the `user_id` (UUID) from `codemo-core` in the feature databases.

## Consequences
* **Positive:** Drastically extends the runway before a paid tier is necessary.
* **Positive:** Provides hard data isolation between independent product features, reducing blast radius during incidents.
* **Negative:** Cross-project JOIN operations are impossible at the database level.
* **Negative:** The backend application layer must handle data aggregation, leading to multiple database client instantiations and potentially complex error handling.

## Alternatives Considered
* **Single monolithic database:** Rejected due to the likelihood of rapidly hitting free-tier size limits and the lack of isolation.
* **Pro-tier immediately:** Rejected for financial reasons prior to product-market fit.
