# ADR-0001: Dual-Branch Monorepo Strategy (Tri-Branch)

**Status:** Accepted

## Context
Codemo Teams requires a monorepo structure to share types and configurations between the frontend and backend. Traditional `main`/`develop` branching models create deployment bottlenecks when the frontend and backend need to scale or release independently using different hosting providers (Vercel and Railway).

## Decision
We will eliminate the `main`, `master`, and `develop` branches. Instead, we adopt a three-branch model:
* `frontend`: The production branch for the Next.js application, watched by Vercel.
* `backend`: The production branch for the Node.js application, watched by Railway.
* `shared`: The source of truth for shared code.

Changes to `shared` must be explicitly propagated to `frontend` and `backend` via separate chore PRs after merge.

## Consequences
* **Positive:** Frontend and backend can deploy completely independently without blocking each other.
* **Positive:** Reduced risk of deploying backend changes accidentally when only pushing a frontend hotfix.
* **Negative:** Changes to `shared` require three PRs total (one for shared, two for propagation), increasing overhead.
* **Neutral:** Semantic versioning must be handled independently per branch.

## Alternatives Considered
* **Standard Monorepo with `main`:** Rejected because it forces monolithic deployments or requires complex CI logic to conditionally trigger deployments based on path changes, which is brittle.
* **Multi-repo:** Rejected because sharing TypeScript types and configurations becomes cumbersome (requires publishing private npm packages).
