# AGENTS.md

Guidance for coding agents working in this repository.

## Mission

Ship safe, testable improvements to the A220 wind-check tool with minimal regression risk and clear operational transparency.

## Product and safety constraints

- This tool is advisory only, not an official operational system.
- Do not remove or weaken pilot-facing disclaimers/warnings without explicit user instruction.
- Preserve source transparency (METAR/ATIS/manual mode, declination source, assumptions).
- Prefer explicit failure states over silent fallbacks.

## Stack and scope

- Frontend: Vue 3 + TypeScript + Vite.
- Tests: Vitest (unit), Playwright (e2e).
- Lint: oxlint + eslint.
- Work primarily under `src/`, `src/composables/`, `src/components/`, `src/__tests__/`, and `e2e/`.

## Execution policy

- Make the smallest complete change that solves the task.
- Do not refactor unrelated code while implementing a focused request.
- Keep behavior changes and formatting-only changes in separate commits when possible.
- Never use destructive git commands unless explicitly requested.

## Code quality rules

- Prefer typed, composable logic in `src/composables/` for business calculations.
- Keep components presentation-focused; move reusable logic out of templates.
- Avoid hidden magic constants; use `src/constants/` for operational limits.
- Preserve existing naming and data model conventions in `src/types/`.
- Add brief comments only when logic is non-obvious.

## Testing requirements

- For behavioral changes, add or update at least one test.
- Unit tests:
  - Run targeted test(s) first.
  - Add edge-case coverage for parsing/calculation branches when touched.
- E2E tests:
  - Update smoke checks when UI copy/critical layout changes.
  - If e2e cannot run due to missing browsers, note the exact blocker and required command.

## Required checks before handoff

Run what is relevant to touched files:

```sh
npm run test:unit
npm run lint
```

When e2e-impacting UI flows are touched:

```sh
npx playwright install   # first-time only
npm run test:e2e -- e2e/vue.spec.ts
```

If a check cannot be run, state that explicitly in the handoff.

## Definition of done

A task is done only when all are true:

- Requested behavior is implemented.
- Relevant tests are updated and passing (or blockers clearly documented).
- No unrelated files are modified.
- README/docs are updated when user-facing behavior or workflow changed materially.
- Handoff includes:
  - what changed
  - where it changed
  - test results
  - known follow-ups/blockers

## Commit guidance

Use focused commit messages:

- `ui: add persistent pilot disclaimer banner`
- `test: update e2e smoke assertion for app heading`
- `docs: rewrite README for project-specific workflow`

Avoid `wip`, `misc`, `fix stuff`.

## Agent workflow checklist

1. Inspect affected files and current behavior.
2. Confirm assumptions from code before asking user questions.
3. Implement minimal complete fix.
4. Run targeted validation.
5. Summarize concrete outcomes and blockers.
