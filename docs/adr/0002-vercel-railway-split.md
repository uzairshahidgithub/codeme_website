# ADR-0002: Vercel & Railway Deployment Split

**Status:** Accepted

## Context
Our application consists of a Next.js frontend (App Router) and a Node.js API backend. Hosting both on a single platform forces compromises. Next.js functions best on Vercel due to proprietary edge network optimisations, whereas a stateful Node.js backend requires predictable memory scaling and long-lived connections, which serverless environments handle poorly.

## Decision
We will split our deployments:
* **Frontend:** Hosted on Vercel, deploying automatically from the `frontend` branch.
* **Backend:** Hosted on Railway, deploying automatically from the `backend` branch using Nixpacks.

## Consequences
* **Positive:** The frontend benefits from Vercel's global CDN, edge caching, and Image Optimization.
* **Positive:** The backend avoids Vercel's serverless execution timeouts and connection limits, maintaining persistent DB connections via Railway.
* **Negative:** Introduces complexity in CI/CD and requires CORS configuration for `api.codemoteams.com`.
* **Negative:** Two separate dashboards to monitor for deployment health.

## Alternatives Considered
* **Host both on Vercel:** Rejected because the Node.js backend would be forced into serverless functions, causing cold starts and connection pool exhaustion against Supabase.
* **Host both on Railway:** Rejected because Next.js loses Vercel-specific edge caching and Image Optimization features when run in a standalone Docker container.
