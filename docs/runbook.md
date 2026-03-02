# Runbook

Operational runbook for local development, testing, and troubleshooting in `A220Tools`.

## Purpose

Use this document to execute common workflows quickly and consistently, especially when working as an automated agent.

## Prerequisites

- Node.js version compatible with `package.json` engines:
  - `^20.19.0` or `>=22.12.0`
- `npm` installed
- Repository dependencies installed:

```sh
npm install
```

## Daily workflow

1. Pull latest branch state.
2. Install dependencies if lockfile changed.
3. Run targeted tests while developing.
4. Run repo checks before handoff/commit.

## Common commands

### Start development server

```sh
npm run dev
```

Default URL is typically `http://localhost:3000`.

### Build production bundle

```sh
npm run build
```

This runs the Nuxt production build.

### Preview production build

```sh
npm run preview
```

### Unit tests

Run all unit tests:

```sh
npm run test:unit
```

Run a specific test file:

```sh
npm run test:unit -- __tests__/App.spec.ts
```

### End-to-end tests

Install Playwright browsers once per machine/user:

```sh
npx playwright install
```

Run all e2e tests:

```sh
npm run test:e2e
```

Run a specific e2e file:

```sh
npm run test:e2e -- e2e/vue.spec.ts
```

Run only Chromium:

```sh
npm run test:e2e -- --project=chromium
```

### Lint

```sh
npm run lint
```

This runs both `oxlint` and `eslint` with auto-fix enabled.

## Pre-handoff / pre-PR checks

Run at minimum:

```sh
npm run test:unit
npm run lint
```

If UI behavior changed, also run:

```sh
npm run test:e2e -- e2e/vue.spec.ts
```

## Troubleshooting

### Playwright fails with "Executable doesn't exist"

Symptom:
- Errors referencing missing browser binaries under `~/.cache/ms-playwright/...`

Fix:

```sh
npx playwright install
```

Then re-run `npm run test:e2e`.

### Playwright cannot start web server

Symptom:
- `Process from config.webServer was not able to start`

Checks:
1. Confirm no conflicting process on expected port (`3000` locally and on CI).
2. Confirm `npm run dev` (or `npm run preview` on CI) starts cleanly.
3. In sandboxed environments, port binding may be restricted; run with appropriate permissions.

### API/data fetch errors in app UI

Symptom:
- METAR/airport panels show fetch failures.

Checks:
1. Verify network availability in runtime environment.
2. Validate ICAO input format.
3. Use manual mode to continue verification flow when remote data is unavailable.

## Safety-critical behavior checks

After touching wind logic, confirm:

1. TRUE-to-magnetic conversion still reflects declination source.
2. ATIS (MAG) mode still applies no declination correction.
3. Zero-declination fallback warning still appears when airport declination is unavailable.
4. Pilot disclaimer remains visible on initial page load.

## Deployment notes

- GitHub Pages deployment is defined in `.github/workflows/deploy.yml`.
- Deployment publishes `dist/` to `gh-pages`.
- Ensure build succeeds locally before expecting CI deploy success.
