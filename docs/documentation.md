# Project Documentation

**Last Updated:** 2026-04-26

## Project Overview

Codemo Teams is a collaborative ecosystem designed to unify the software development lifecycle. It provides an integrated suite of tools for project management, technical article publishing, and event coordination, aiming to streamline operations for developers and designers alike.

## System Map

Please refer to the detailed [ARCHITECTURE.md](docs/ARCHITECTURE.md) for the complete system topology, Edge networking, and database federation model.

## Branch Model Summary

We use a tri-branch model comprising `frontend`, `backend`, and `shared`. There is no `main` branch. See [BRANCHING.md](docs/BRANCHING.md) for workflows and propagation rules.

## Tech Stack Registry

* **Frontend:** Next.js 14+, TailwindCSS 3.4+, Zustand, TanStack Query, React Hook Form, Zod.
* **Backend:** Node.js 20+, Fastify, Prisma, Zod, libsodium (sodium-native).
* **Database:** Supabase (PostgreSQL 15+).
* **Infrastructure:** Vercel, Railway, Cloudflare.

## Asset Inventory

Every visual asset is sourced from `Codemo Assets/Codemo Website Elements 1.0`.

| Asset | Location Used |
|-------|---------------|
| Logo (Circular "eye" mark) | Navbar, Auth pages |

*(This table must be updated with every new asset introduced.)*

## Component Inventory

| Component | Props | Variants | States | Accessibility Notes |
|-----------|-------|----------|--------|---------------------|
| Button | `variant`, `size`, `isLoading` | `primary`, `secondary`, `ghost` | Hover, Focus, Disabled | Aria-labels required for icon-only variants |

*(This table must be updated with every new shared component.)*

## Layout Primitives

* **Navbar:** Fixed height, responsive width.
* **Sidebar:** Expandable/collapsible (desktop default: expanded).
* **Bot Dock:** Non-textual icon-based dock.
* **Profile Dropdown:** Standardised dimensions and positioning.

## Routing Map

| Route | Auth Guard | Layout Used |
|-------|------------|-------------|
| `/` | None | Public Layout |
| `/dashboard` | Required | App Layout (Sidebar + Navbar) |
| `/login` | Guest Only | Auth Layout |

*(This map must be updated when a route is added or changed.)*

## State Management

* **Zustand Stores:** Use for global client UI state.
* **Persistence Keys:** All localStorage keys must be prefixed with `codemo.<feature>.<key>`.
* **Session Storage:** Used strictly for in-flow drafts (e.g., signup multi-step forms).

## Feature Inventory

* **Built:** Authentication, User Profiles.
* **In Progress:** Dashboard layout, component library.
* **Planned:** Articles engine, Event coordination, Project boards.

## Outstanding Technical Debt

* None currently recorded. New debt must be documented here with a corresponding tracking issue.

## Documentation Pointers

* **[ARCHITECTURE.md](docs/ARCHITECTURE.md):** How do the pieces of the system communicate?
* **[REPOSITORY-RULES.md](docs/REPOSITORY-RULES.md):** What are the rules for pushing code?
* **[BRANCHING.md](docs/BRANCHING.md):** How do I start a feature or hotfix?
* **[DEPLOYMENT.md](docs/DEPLOYMENT.md):** How does code get to production?
* **[FRONTEND.md](docs/FRONTEND.md):** What are the frontend conventions?
* **[BACKEND.md](docs/BACKEND.md):** What are the backend API rules?
* **[SUPABASE.md](docs/SUPABASE.md):** How are databases isolated and queried?
* **[DATABASE-RULES.md](docs/DATABASE-RULES.md):** What are the query and transaction constraints?
* **[API-RULES.md](docs/API-RULES.md):** How should REST endpoints be designed?
* **[SECURITY.md](docs/SECURITY.md):** How do we handle authentication, cryptography, and vulnerabilities?
* **[ENVIRONMENT.md](docs/ENVIRONMENT.md):** What environment variables do I need?
* **[DESIGN-TOKENS.md](docs/DESIGN-TOKENS.md):** What are the exact colours and spacing rules?
* **[TESTING.md](docs/TESTING.md):** How do I write and run tests?
* **[CONTRIBUTING.md](docs/CONTRIBUTING.md):** How do I submit an issue or PR?
* **[RUNBOOKS.md](docs/RUNBOOKS.md):** What do I do when something goes wrong?
* **[CHANGELOG.md](docs/CHANGELOG.md):** What changed in the latest version?

## Update Rules

1. Any new component, route, store, asset or feature must be reflected in this file in the same commit it is introduced.
2. Any breaking change must be flagged with migration notes.
3. Documentation drift is a bug, not a chore.
