# Client Portal

A portal for freelancers to manage clients, share project updates, and send invoices. Clients can log in to see their projects and payment history.

## Tech Stack

- [Next.js](https://nextjs.org) (App Router) with TypeScript (strict mode)
- [Tailwind CSS](https://tailwindcss.com) v4
- [Zod](https://zod.dev) for environment validation
- ESLint (flat config) + Prettier

## Prerequisites

- Node.js 20 LTS or later
- npm 10 or later
- A PostgreSQL database (local or hosted) — used by later tasks

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Create your local environment file
cp .env.example .env
#    then fill in DATABASE_URL and AUTH_SECRET, e.g.:
#    openssl rand -base64 32   # -> paste as AUTH_SECRET

# 3. Start the dev server
npm run dev
```

Open http://localhost:3000 in your browser.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Secret for signing sessions/JWTs (min 32 chars) |
| `APP_URL` | Yes | Server-side base URL of the portal |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | No | Object storage for future file-sharing features |
| `NEXT_PUBLIC_APP_URL` | No | Browser-safe base URL (only `NEXT_PUBLIC_*` vars reach the client) |

Environment validation lives in `src/lib/env.ts` (server-only secrets) and
`src/lib/public-env.ts` (browser-safe values). Never import `src/lib/env.ts`
from a client component.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Type-check with `tsc --noEmit` |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check formatting without writing |
| `npm run db:generate` | Generate database migrations (Drizzle Kit) |
| `npm run db:migrate` | Apply migrations |
| `npm run db:push` | Push schema directly to the database |
| `npm run db:studio` | Open Drizzle Studio |

## Project Structure

```
src/
  app/        # App Router pages and layouts
  components/ # Shared UI components
  lib/        # Server-side libraries (env validation, future db/auth code)
  types/      # Shared TypeScript types
```

Server-only code (secrets, database access) stays in `src/lib` and must not be
imported by components marked with `"use client"`.

## Database (later tasks)

The `db:*` scripts are wired to Drizzle Kit via `drizzle.config.ts`. Schema files
will be added under `src/lib/db/` by subsequent tasks; keep `DATABASE_URL` set in
`.env` before running any of them.

## Roadmap

1. **Foundation** — app shell, env validation, tooling (this task)
2. Client accounts and login
3. Project updates and files
4. Invoices and payment status
