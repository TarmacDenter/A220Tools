# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Type-check + build for production
npm run preview      # Preview production build
npm run type-check   # Run vue-tsc type checking only

npm run test:unit    # Run Vitest unit tests
npm run test:e2e     # Run Playwright E2E tests (starts dev/preview server automatically)

npm run lint         # Run all linters (oxlint + eslint) with auto-fix
```

To run a single unit test file:
```bash
npx vitest run src/__tests__/App.spec.ts
```

## Architecture

This is a Vue 3 + TypeScript SPA built with Vite. The project is in early/template state with no feature routes or business logic yet.

**Entry flow**: `index.html` → `src/main.ts` → `src/App.vue`

**Key locations**:
- `src/router/index.ts` — Vue Router (web history mode, routes array is currently empty)
- `src/__tests__/` — Vitest unit tests using `@vue/test-utils` + jsdom
- `e2e/` — Playwright tests (Chromium, Firefox, WebKit)

**Path alias**: `@/` resolves to `./src/`

## Tooling Notes

- **Linting**: Two linters run in series — oxlint first, then ESLint. Both run with `--fix`.
- **TypeScript**: Three separate tsconfig files (`app`, `node`, `vitest`) referenced from root `tsconfig.json`.
- **Node requirement**: `^20.19.0 || >=22.12.0`
- **E2E tests**: On CI, Playwright uses `http://localhost:4173` (preview server); locally uses `http://localhost:5173` (dev server).
