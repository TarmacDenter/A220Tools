# CLAUDE.md

## Stack

- Nuxt 3 (Vue 3 + TypeScript), SSR enabled
- Node `^20.19.0 || >=22.12.0`, npm 10.9
- Deploy target: Railway

## Commands

```bash
npm run dev            # Dev server at http://localhost:3000
npm run build          # Production build (includes type-check)
npm run test:unit      # Vitest unit tests
npm run test:e2e       # Playwright e2e tests
npm run lint           # oxlint + eslint with auto-fix
npm run type-check     # vue-tsc only
```

## Project structure

```
pages/index.vue               # Single-page entry
components/WindCheckerApp.vue # Main app component
composables/                  # Business logic (wind calcs, METAR, airport info)
constants/                    # Operational limits
server/api/                   # Backend routes
types/                        # Shared TypeScript interfaces
__tests__/                    # Vitest unit tests
e2e/                          # Playwright specs
```

## Before committing

```bash
npm run test:unit
npm run lint
```

## Branching

- `master` is the single integration branch — no long-lived `dev`.
- Short-lived feature branches off `master`; merge via PR.

## Safety

- Pilot-facing advisory tool — never remove or weaken disclaimers.
- Prefer explicit errors over silent fallbacks.
- Preserve data source transparency (METAR vs ATIS vs manual).
