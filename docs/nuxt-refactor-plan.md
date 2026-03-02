# Nuxt package-structure refactor plan

## Goal

Complete the migration from legacy Vite SPA layout to idiomatic Nuxt 3 structure, then remove obsolete pre-Nuxt code safely.

## Current mixed-state (what exists now)

The repository currently runs via Nuxt scripts, but still contains legacy SPA-era files under `src/` (`src/main.ts`, `src/router/index.ts`, `src/App.vue`) and tests/import paths tied to those locations.

## Target state

- Nuxt-native filesystem conventions for app entry, routing, composables, components, and tests.
- No duplicate app bootstrapping path.
- Tooling aligned to Nuxt + Nitro + Vitest + Playwright with clean CI-friendly commands.
- Clear separation between code that Nuxt auto-imports and regular utility modules.

---

## 1) Move (or rename) into Nuxt-native locations

### 1.1 App shell and route entry

- Keep `app.vue` as the only root app shell.
- Replace the current `pages/index.vue` wrapper (`import App from '@/App.vue'`) by moving the page content from `src/App.vue` directly into `pages/index.vue`.
- Then remove the now-redundant `src/App.vue`.

### 1.2 Composables

- Move reusable composables from `src/composables/*` to top-level `composables/*`.
- Update imports to rely on Nuxt auto-import where possible (`useXxx` without manual import), or explicit imports from `~/composables` for clarity in shared utilities/tests.

### 1.3 Shared runtime types/constants/utils

- Move:
  - `src/constants/*` -> `constants/*`
  - `src/types/*` -> `types/*`
  - `src/utils/*` -> `utils/*` (or `lib/*` if preferred)
- Add path aliases in `nuxt.config.ts` (if needed) for stable imports (`~/constants`, `~/types`, etc.).

### 1.4 Components

- Move `src/components/*` -> `components/*`.
- Keep any UI subfolders (`ui/`) intact.
- Use Nuxt component auto-registration conventions (PascalCase file names, predictable nesting).

### 1.5 Unit tests

- Move `src/__tests__/*` -> `test/unit/*` (or `tests/unit/*`) to avoid tying tests to legacy `src/` layout.
- Update test imports to new module paths/aliases.

---

## 2) Remove legacy pre-Nuxt code

Once equivalent Nuxt-path code is confirmed working:

- Delete legacy SPA bootstrap:
  - `src/main.ts`
  - `src/router/index.ts`
  - any router-specific setup no longer referenced by Nuxt pages.
- Delete Vite SPA entry artifacts if unused:
  - `index.html` (Nuxt serves its own app shell; keep only if explicitly needed by external tooling).
- Remove stale Vite-only configuration/dependencies if no longer used by tests:
  - `@vitejs/plugin-vue`
  - direct `vite` dependency (if not required outside Nuxt internals).

> Guardrail: remove only after `npm run build`, `npm run test:unit`, `npm run lint`, and smoke e2e all pass.

---

## 3) Add/upgrade tooling for a clean Nuxt workflow

### 3.1 Nuxt-aware test config

- Migrate Vitest config to Nuxt-centric setup (`@nuxt/test-utils` where SSR/runtime context is needed).
- Keep fast pure unit tests in jsdom; add Nuxt runtime tests only where composables/pages rely on Nuxt context.
- Ensure a single canonical test root (`test/unit`), with clear include/exclude patterns.

### 3.2 Linting and type tooling

- Ensure ESLint uses Nuxt + Vue + TS presets consistently (including `eslint-plugin-vue` rules matching `<script setup>` style).
- Keep `nuxt typecheck` as the primary type command.
- Add optional `npm run test:unit:ci` (non-watch) for CI predictability.

### 3.3 Developer automation

- Add `postinstall: nuxi prepare` to guarantee `.nuxt` types are generated in fresh environments.
- Add/confirm `.gitignore` entries for `.nuxt`, `.output`, coverage, and Playwright artifacts.
- Optionally add `npm run validate` that chains lint + typecheck + unit tests.

### 3.4 CI/deploy hygiene

- Ensure CI uses Node version compatible with package `engines`.
- Keep SSR deployment entrypoint (`node .output/server/index.mjs`) and health checks aligned with Nitro output.
- Ensure e2e base URL matches Nuxt dev/preview ports used in CI.

---

## 4) Migration sequence (low-risk order)

1. **Prepare branch + safety net**
   - Snapshot current behavior with existing tests.
2. **Move files without behavior changes**
   - Components/composables/constants/types/utils first.
3. **Update imports + aliases**
   - Keep app compiling after each move batch.
4. **Inline legacy `src/App.vue` into `pages/index.vue`**
   - Verify no UI/logic regression.
5. **Delete legacy bootstrap (`src/main.ts`, router, etc.)**
6. **Clean dependencies/config**
   - Remove now-unused Vite SPA-only pieces.
7. **Run full validation**
   - `npm run lint`
   - `npm run type-check`
   - `npm run test:unit`
   - targeted e2e smoke.

---

## 5) Definition of completion for this refactor

- No runtime imports from removed legacy SPA entry files.
- No business logic left under `src/` solely due to old Vite conventions.
- Nuxt auto-import and filesystem routing handle app wiring.
- Tooling commands are deterministic locally and in CI.
- README + runbook updated to describe the new structure and commands.

---

## 6) Open item from requested Nuxt guide

The plan above is based on standard Nuxt 3 conventions. The referenced guide URL (`https://nuxt.com/llms-full.txt`) should be reviewed once accessible, then this plan can be adjusted to match any Nuxt-specific recommendations not captured here.
