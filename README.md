# Codemo Teams

Codemo Teams is a collaborative workspace and platform bridging the gap between design and engineering.

## Tech Stack at a Glance

* **Frontend:** Next.js, TailwindCSS
* **Backend:** Node.js
* **Database & Auth:** Supabase
* **Hosting:** Vercel (Frontend), Railway (Backend), Cloudflare (Edge/DNS)
* **Design/UI:** Poppins font, custom design tokens

## Repository Structure & Branch Model

This repository uses a strict three-branch model. We do not use `main` or `master`.

* `frontend` — Long-lived branch for the Next.js frontend application. Deploys to Vercel.
* `backend` — Long-lived branch for the Node.js backend. Deploys to Railway.
* `shared` — Long-lived branch for shared packages/libraries used by both frontend and backend.

## Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/uzairshahidgithub/Codemo-Website.git
cd Codemo-Website
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Environment File Setup
Copy the example environment files for both frontend and backend:
```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```
*(Contact the tech lead for non-secret credentials for local work).*

### 4. Run Development Server
```bash
pnpm dev
```

## How to Contribute

Please read our [Contributing Guide](docs/CONTRIBUTING.md) for details on our code of conduct, branching strategies, and the process for submitting pull requests.

## Documentation Index

| File | Description |
|------|-------------|
| [documentation.md](docs/documentation.md) | Living index and high-level project documentation. |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System topology and multi-database federation details. |
| [docs/REPOSITORY-RULES.md](docs/REPOSITORY-RULES.md) | Protected branches, commit conventions, and push rules. |
| [docs/BRANCHING.md](docs/BRANCHING.md) | Workflow diagrams and step-by-step instructions for branching. |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Vercel, Railway, and Cloudflare configuration and runbooks. |
| [docs/FRONTEND.md](docs/FRONTEND.md) | Next.js architecture, state management, and asset rules. |
| [docs/BACKEND.md](docs/BACKEND.md) | Node.js routing, validation, error handling, and encryption. |
| [docs/SUPABASE.md](docs/SUPABASE.md) | Project registry, RLS policies, and storage rules. |
| [docs/DATABASE-RULES.md](docs/DATABASE-RULES.md) | Query performance, transaction constraints, and backups. |
| [docs/API-RULES.md](docs/API-RULES.md) | RESTful conventions, rate limiting, and status codes. |
| [docs/SECURITY.md](docs/SECURITY.md) | Threat model, cryptography, and vulnerability management. |
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) | Environment variable registries and secret generation. |
| [docs/DESIGN-TOKENS.md](docs/DESIGN-TOKENS.md) | Colours, typography scale, and layout primitives. |
| [docs/TESTING.md](docs/TESTING.md) | Coverage thresholds, unit tests, and E2E specifications. |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | PR templates, code style, and issue filing process. |
| [docs/RUNBOOKS.md](docs/RUNBOOKS.md) | Operational procedures for incident response and recovery. |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Version history per branch using Keep a Changelog. |

## License

Copyright © Codemo Teams. All rights reserved.
