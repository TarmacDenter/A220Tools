# A220Tools

A lightweight cockpit helper for checking A220 engine-start tailwind exposure across headings from live METAR or manual wind inputs.

## Safety disclaimer

This is not an official Airbus or airline application. Always verify all wind/performance information against approved operational sources (ATIS/AWOS, METAR, and company procedures).

## What it does

- Fetches live METAR by ICAO and parses wind conditions.
- Retrieves airport magnetic declination and converts TRUE winds to MAGNETIC.
- Computes safe/unsafe heading sectors against the A220 engine-start tailwind limit.
- Supports manual entry modes for ATIS (MAG) and METAR/AeroData (TRUE).
- Shows assumptions and source transparency so pilots can cross-check quickly.
- Locates the nearest airport via browser geolocation and auto-populates the ICAO input.
- Supports PWA install flow with an in-app install prompt and basic offline app-shell availability.

## Tech stack

- Nuxt 3 (Vue 3 + TypeScript, SSR enabled)
- Vitest + Vue Test Utils
- Playwright

## Quick start

```sh
npm install
npm run dev
```

Open the local URL shown by Nuxt (normally `http://localhost:3000`).

## Scripts

- `npm run dev`: Start the Nuxt development server.
- `npm run build`: Build the SSR app with Nitro output.
- `npm run preview`: Serve the production Nuxt build locally.
- `npm run type-check`: Run Nuxt type-checking.
- `npm run test:unit`: Run Vitest unit tests.
- `npm run test:e2e`: Run Playwright end-to-end tests.
- `npm run lint`: Run lint auto-fixes (`oxlint` + `eslint`).

## Testing notes

Install Playwright browsers once before first e2e run:

```sh
npx playwright install
```

Useful e2e variants:

```sh
npm run test:e2e -- --project=chromium
npm run test:e2e -- e2e/vue.spec.ts
npm run test:e2e -- --debug
```

## Project structure

- `components/`: UI components (main app, input panels, readouts, tables).
- `composables/`: Data fetch and wind calculation logic.
- `constants/`: Operational limits and constants.
- `types/`: Shared TypeScript models.
- `__tests__/`: Unit tests.
- `e2e/`: Playwright specs.

## Deployment (Vercel)

This project deploys to Vercel as a Nuxt 3 SSR application. Nitro auto-detects the Vercel environment and uses the Vercel preset at build time.

### Required environment variables

| Variable | Source | Purpose |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` | Upstash integration | Hit-tracking storage |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash integration | Hit-tracking storage auth |
| `CRON_SECRET` | Set manually | Guards `/api/internal/prune-hits` |
| `NUXT_PUBLIC_APP_BASE_URL` | Set manually (optional) | Custom domain base URL |

### Deploy steps

1. Import the repository into Vercel and let it auto-detect the Nuxt framework.
2. Add the **Upstash Redis** integration from the Vercel Marketplace — this automatically binds `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
3. Set `CRON_SECRET` to a random secret string in your Vercel project environment variables (Production + Preview).
4. Deploy from `master`. The `vercel.json` cron entry schedules `/api/internal/prune-hits` every 30 minutes automatically.

### Cron job

`vercel.json` registers a cron that calls `POST /api/internal/prune-hits` every 30 minutes. Vercel sends `Authorization: Bearer <CRON_SECRET>` with each invocation; the endpoint rejects all other callers with HTTP 401.

## Branch strategy

- `master`: main working branch; all day-to-day development lands here and merges trigger deployment.
- Feature branches: branch from `master`, then merge back into `master` via PR.
- Keep feature branches short-lived to minimize drift and merge conflicts.
- No long-lived `dev` branch; `master` is always the single source of truth.
