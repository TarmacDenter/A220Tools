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

- `src/components/`: UI components (main app, input panels, readouts, tables).
- `src/composables/`: Data fetch and wind calculation logic.
- `src/constants/`: Operational limits and constants.
- `src/types/`: Shared TypeScript models.
- `src/__tests__/`: Unit tests.
- `e2e/`: Playwright specs.

## Deployment (Railway)

This project is configured for Nuxt SSR deployment to Railway using configuration-as-code. Railway uses `railway.toml` for deploy orchestration, `.nvmrc` to declare the Node version, and `package.json`'s `packageManager` field to pin npm.

### Railway runtime details

- Build command: `npm run build`
- Runtime command: `node .output/server/index.mjs`
- Health check path: `/`

### Deploy steps

1. Create a new Railway project and link this repository.
2. Ensure Railway is set to use the repo-root `railway.toml` and the service builder is not overridden in the UI.
3. Deploy from `master` (or your selected release branch).
4. For custom domains, set `NUXT_PUBLIC_APP_BASE_URL` as needed.

Nuxt/Nitro generates the production server bundle in `.output/` during `npm run build`, which Railway starts via the configured start command.

## Branch strategy

- `dev`: default integration branch for day-to-day work.
- `master`: release branch; merges here trigger deployment.
- Feature branches: branch from `dev`, then merge back into `dev`.
- Promote to production by merging `dev` into `master` only when ready to deploy.
- Do not merge `master` back into `dev`; keep merges one-way (`dev` -> `master`) to avoid bi-directional history.
