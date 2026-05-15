# Repository Rules

**Last Updated:** 2026-05-07

## Branch Model

We do not use `main`, `master`, or `develop` (See ADR-0001).

The repository has two protected, long-lived branches:

1. `frontend` — Next.js application. Independently deployable to Vercel.
2. `supabase` — Supabase migrations, Edge Functions, config. Deployed via the Supabase CLI.

The legacy `backend` and `shared` branches were removed when the Node.js API was retired (See ADR-0008).

## Push Rules

* Direct pushes to `frontend` or `supabase` are forbidden.
* All changes flow through Pull Requests.
* Force pushes are disabled on protected branches.
* Branch deletion is disabled on protected branches.
* **Approvals required:** 1 approval for `frontend`; 2 approvals for `supabase` (DB and function changes carry production risk).
* **Status checks:** the corresponding CI pipeline must pass.
* Branches must be up to date with their target branch before merging.

## Branch Naming

Format: `<type>/<scope>/<short-description>`

* **Feature:** `feat/fe/sidebar-collapse` (Scope: `fe` or `supa`)
* **Bugfix:** `fix/supa/rls-profile-update`
* **Hotfix:** `hotfix/fe/auth-callback-cookie`
* **Chore:** `chore/repo/update-dependencies`
* **Documentation:** `docs/arch/update-deployment`

## Commit Conventions

Strict Conventional Commits. Scope is mandatory.

* `feat(fe): add settings drawer`
* `fix(supa): tighten profiles RLS update policy`
* `chore(repo): bump @supabase/ssr to 0.5`
* `docs(arch): update deployment runbook`

Rules:
1. Type is mandatory, lowercase, no trailing period.
2. Scope is mandatory: `fe`, `supa`, `repo`, `arch`.
3. Commit body wraps at 72 columns.
4. Breaking changes flagged with `BREAKING CHANGE:` footer.

## Pull Request Rules

* Title format: `<type>(<scope>): <description>`.
* PR template fully completed.
* CODEOWNERS approval required for protected paths.
* **UI changes:** screenshots mandatory.
* **Logic changes:** test evidence mandatory.
* **Migration changes:** dry-run output mandatory.
* **Documentation:** updates required in the same PR if applicable.

## Tag Conventions

Semantic-release handles tagging on merge. Manual tagging prohibited.

* Frontend tags: `fe-v<major>.<minor>.<patch>`
* Supabase tags: `supa-v<major>.<minor>.<patch>`

## CODEOWNERS Coverage

* Frontend leads own `/frontend/` and `/docs/FRONTEND.md`.
* Database/platform leads own `/supabase/` and `/docs/SUPABASE.md`.
* Security leads own `/docs/SECURITY.md` and infrastructure configs.

## Forbidden Patterns

* **NEVER** commit secrets, `.env` files, private keys, tokens, or service role keys.
* **NEVER** commit `node_modules`, build artefacts, or IDE configs.
* **NEVER** disable linting, type checks, or tests merely to pass CI.
* **NEVER** edit a merged migration; create a forward migration instead.
* **NEVER** bypass branch protection or merge a PR with failing CI.
