# Environment Variable Registry

**Last Updated:** 2026-04-26

## Frontend Environment Variables

| Variable Name | Scope | Required | Default | Description |
|---------------|-------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | All | Yes | `http://localhost:3000` | Base URL for the backend API. Exposed to client. |
| `NEXT_PUBLIC_SUPABASE_URL` | All | Yes | - | Public URL for the core Supabase project. Exposed to client. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Yes | - | Public anon key for Supabase. Exposed to client. |
| `FRONTEND_ENCRYPTION_KEY` | Prod/Prev | Yes | - | Symmetric key for payload encryption envelope. Server-only. |

*Note: Any variable prefixed with `NEXT_PUBLIC_` is shipped to the client bundle. Do not put secrets in these variables.*

## Backend Environment Variables

| Variable Name | Required | Default | Description |
|---------------|----------|---------|-------------|
| `NODE_ENV` | Yes | `development` | Operating environment (`development`, `production`, `test`). |
| `PORT` | Yes | `8080` | Port for the Fastify server. |
| `SUPABASE_URL_CORE` | Yes | - | URL for the `codemo-core` database project. |
| `SUPABASE_SERVICE_KEY_CORE`| Yes | - | Service role key for `codemo-core` (Bypasses RLS). |
| `JWT_SECRET` | Yes | - | Secret used for verifying authentication tokens. |
| `CSRF_SECRET` | Yes | - | Secret for generating and validating CSRF tokens. |
| `ENCRYPTION_KEY_SYMMETRIC` | Yes | - | AES-256-GCM key for encrypting sensitive payloads. |
| `ED25519_PRIVATE_KEY` | Yes | - | Private key for response signing. |

## Local Development Setup

1. **Clone & Install:**
   ```bash
   git clone https://github.com/uzairshahidgithub/Codemo-Website.git
   cd Codemo-Website
   pnpm install
   ```

2. **Acquire Non-Secret Credentials:**
   Copy `.env.example` to `.env.local` (Frontend) and `.env` (Backend). Coordinate with the tech lead for current non-secret values required for local development.

3. **Local Supabase Instance:**
   To run Supabase locally (requires Docker):
   ```bash
   npx supabase start
   ```
   *This outputs local API URLs and anon/service keys to map into your local `.env` files.*

4. **Run Servers:**
   Use `pnpm dev` from the repository root to start both frontend and backend concurrently.

## Secret Generation Procedures

When provisioning a new environment or rotating keys, use the following commands to generate cryptographically secure values.

**JWT Signing Secret & CSRF Secret:**
```bash
openssl rand -hex 32
```

**Ed25519 Keypair (for payload signing):**
Requires the `libsodium` CLI or a Node.js script using `sodium-native`:
```javascript
const sodium = require('sodium-native');
const publicKey = Buffer.alloc(sodium.crypto_sign_PUBLICKEYBYTES);
const secretKey = Buffer.alloc(sodium.crypto_sign_SECRETKEYBYTES);
sodium.crypto_sign_keypair(publicKey, secretKey);
console.log('Public:', publicKey.toString('hex'));
console.log('Secret:', secretKey.toString('hex'));
```

**X25519 Keypair (for payload encryption exchange):**
```javascript
const sodium = require('sodium-native');
const publicKey = Buffer.alloc(sodium.crypto_box_PUBLICKEYBYTES);
const secretKey = Buffer.alloc(sodium.crypto_box_SECRETKEYBYTES);
sodium.crypto_box_keypair(publicKey, secretKey);
console.log('Public:', publicKey.toString('hex'));
console.log('Secret:', secretKey.toString('hex'));
```
