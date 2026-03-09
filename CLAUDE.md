# CLAUDE.md

Project-specific instructions for Claude Code sessions.

See AGENTS.md for full coding guidelines, architecture, and testing requirements.

## Quick reference

- **Stack**: Nuxt 3 (Vue 3 + TypeScript), SSR enabled
- **Node**: `^20.19.0 || >=22.12.0`
- **Package manager**: npm 10.9
- **Deploy target**: Railway (SSR)

## Key commands

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
pages/index.vue              # Single-page entry
components/WindCheckerApp.vue # Main app component
composables/                 # Business logic (wind calcs, METAR, airport info)
constants/                   # Operational limits (wind limits, timing)
server/api/                  # Backend: /api/metar/[icao], /api/airport/[icao]
types/                       # Shared TypeScript interfaces
__tests__/                   # Vitest unit tests
e2e/                         # Playwright browser tests
```

## Before committing

Always run relevant checks:

```bash
npm run test:unit
npm run lint
```

## Branching

- `master` is the single integration branch — no long-lived `dev`.
- Use short-lived feature branches off `master`; merge via PR.

## Safety reminders

- This is a pilot-facing advisory tool. Never remove or weaken disclaimers.
- Prefer explicit errors over silent fallbacks.
- Preserve data source transparency (METAR vs ATIS vs manual).
