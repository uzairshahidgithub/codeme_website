# Repository Rules

**Last Updated:** 2026-04-26

## Branch Model

We do not use `main`, `master`, or `develop` branches (See ADR-0001).

Our workflow revolves around three protected, long-lived branches:
1. `frontend` — Independently deployable to Vercel.
2. `backend` — Independently deployable to Railway.
3. `shared` — The source of truth for shared utilities and types.

## Push Rules

* Direct pushes to `frontend`, `backend`, or `shared` are strictly forbidden.
* All changes must flow through Pull Requests (PRs).
* Force pushes are disabled on all protected branches.
* Branch deletion is disabled on all protected branches.
* **Approvals Required:** 1 approval for `frontend` and `backend` PRs; 2 approvals for `shared` PRs.
* **Status Checks:** Corresponding CI pipelines must pass.
* Branches must be up to date with their target branch before merging.

## Branch Naming

Branches must follow the format: `<type>/<scope>/<short-description>`

* **Feature:** `feat/fe/sidebar-collapse` (Scope: `fe`, `be`, or `shared`)
* **Bugfix:** `fix/be/auth-token-expiry`
* **Hotfix:** `hotfix/shared/type-mismatch`
* **Chore:** `chore/fe/update-dependencies`
* **Documentation:** `docs/arch/update-deployment`

## Commit Conventions

We strictly adhere to Conventional Commits.

* `feat(fe): add sidebar collapse animation`
* `fix(be): handle expired confirmation codes`
* `chore(shared): bump zod to 3.23`
* `docs(arch): update deployment runbook`

**Rules:**
1. Scope is mandatory.
2. Type is mandatory, lowercase, no trailing period.
3. Commit body must wrap at 72 columns.
4. Breaking changes must be flagged with a `BREAKING CHANGE:` footer.

## Pull Request Rules

* Title format: `<type>(<scope>): <description>` (Matching the commit convention).
* The PR template must be fully completed.
* CODEOWNERS approval is required for protected paths.
* A linked issue or ticket reference must be provided where applicable.
* **UI Changes:** Screenshots are mandatory.
* **Logic Changes:** Test evidence is mandatory.
* **Documentation:** Updates are required in the same PR if applicable.

## Tag Conventions

Semantic-release handles automated tagging on merge. Manual tagging is prohibited.

* Frontend tags: `fe-v<major>.<minor>.<patch>`
* Backend tags: `be-v<major>.<minor>.<patch>`
* Shared tags: `shared-v<major>.<minor>.<patch>`

## CODEOWNERS Coverage

The `.github/CODEOWNERS` file documents path ownership:
* Frontend leads own `/frontend/` and `/docs/FRONTEND.md`.
* Backend leads own `/backend/` and `/docs/BACKEND.md`.
* Security and DevOps leads own infrastructure configs and `/docs/SECURITY.md`.
* Changes to the `shared` package require sign-off from both frontend and backend leads.

## Forbidden Patterns

* **NEVER** commit secrets, `.env` files, private keys, tokens, or certificates.
* **NEVER** commit `node_modules`, build artefacts, or IDE configs.
* **NEVER** disable linting, type checks, or tests merely to pass CI.
* **NEVER** bypass branch protection rules.
* **NEVER** merge a PR with failing CI checks.
* **NEVER** include refactoring outside the PR's designated scope without explicit flagging.
