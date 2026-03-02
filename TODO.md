# TODO

Use one block per task. Assign each block to exactly one agent.

## Task Template

### [TODO-XXX] Short task title
- Status: `todo` | `in_progress` | `blocked` | `done`
- Owner: `<agent/session name>`
- Branch: `feature/<short-name>`
- Priority: `P0` | `P1` | `P2`

#### Goal
- One sentence describing the user-visible outcome.

#### Scope
- Allowed files:
  - `components/...`
  - `composables/...`
  - `constants/...`
  - `types/...`
  - `utils/...`
  - `__tests__/...`
- Out of scope:
  - Unrelated refactors
  - Removing/weakening pilot disclaimers

#### Requirements
- Keep behavior explicit (no silent fallbacks).
- Preserve source transparency (METAR/ATIS/manual, declination assumptions).
- Add/update at least one relevant test for behavior changes.

#### Acceptance Criteria
- [ ] Requested behavior implemented.
- [ ] Tests updated for touched behavior.
- [ ] `npm run test:unit` passes.
- [ ] `npm run lint` passes.
- [ ] No unrelated files modified.

#### Notes for Agent Prompt
- Copy this task block into the agent prompt.
- Do not edit other task blocks.
- If blocked, set Status to `blocked` and add blocker details.

#### Handoff
- What changed:
- Files changed:
- Test results:
- Blockers/follow-ups:

---

### [TODO-002] Make web app installable as a PWA
- Status: `done`
- Owner: `codex`
- Branch: `feature/pwa-installable`
- Priority: `P1`

#### Goal
- Enable users to install the app as a PWA and launch it offline for basic app-shell navigation under `/A220Tools/` hosting.

#### Scope
- Allowed files:
  - `nuxt.config.ts`
  - `plugins/pwa.client.ts`
  - `package.json` / lockfile (if dependency added)
  - `public/*` (manifest, icons, static assets)
  - `components/*` (install prompt UI only)
  - `composables/*` (install prompt state handling only, if needed)
  - `__tests__/*`
  - `e2e/vue.spec.ts` (if installability checks/UI smoke updated)
- Out of scope:
  - Runtime caching of METAR/API responses
  - Changes to wind-calculation behavior
  - Removing or weakening pilot disclaimers/warnings
  - Broad UI refactors unrelated to installability

#### Requirements
- Add PWA manifest with valid install metadata and app icons.
- Ensure service worker + manifest paths work with `base: /A220Tools/`.
- Implement basic offline support for app shell/routes/static assets.
- Add an in-app install CTA (banner/button) with support detection and dismiss behavior.
- Use temporary placeholder 192x192 and 512x512 icons (documented as temporary).
- Preserve source transparency


# TODO Task Plan: METAR Freshness + Offline Manual-Only Behavior

## Summary
Add a new agent task to implement METAR recency visibility and enforce manual-entry-only operation when offline (for PWA use). The task should include an online freshness status, 5-minute auto-refresh while online, and explicit mode handling when connectivity changes.


### [TODO-003] Show METAR age and enforce manual mode offline
- Status: `done`
- Owner: `unassigned`
- Branch: `feature/metar-freshness-offline-manual`
- Priority: `P1`

#### Goal
- Show users how old the last successful METAR fetch is, and require manual wind input when offline so the app remains usable as a calculator in PWA/offline conditions.

#### Scope
- Allowed files:
  - `components/WindCheckerApp.vue`
  - `components/AirportInput.vue` (only if status display placement requires it)
  - `composables/useMetar.ts`
  - `types/wind.ts` (if new typed freshness/offline metadata is introduced)
  - `__tests__/WindCheckerApp.test.ts`
  - `__tests__/App.spec.ts` or related unit tests as needed
  - `e2e/vue.spec.ts` (if UI flow assertions need updates)
- Out of scope:
  - Changing wind calculation formulas
  - Relaxing pilot-facing disclaimers/warnings
  - PWA install plumbing (handled by separate task)

#### Requirements
- Track and expose timestamp of last successful METAR fetch.
- While online, display freshness using:
  - relative age: `Updated X min ago`
  - absolute local time: `(HH:MM local)` or equivalent explicit local timestamp
- Refresh freshness label every minute without requiring a new fetch.
- Auto-refresh METAR every 5 minutes while online after a successful fetch, using the current ICAO.
- Detect offline state (`navigator.onLine` + online/offline events) and enforce:
  - METAR mode cannot be used offline
  - app forces/stays in manual mode offline
  - clear status indication that offline mode requires manual input
- On reconnect, remain in manual mode until user explicitly exits manual mode and fetches again.
- Preserve explicit failure states (no silent fallbacks).

#### Acceptance Criteria
- [ ] Last successful METAR fetch time is stored and rendered in UI.
- [ ] Freshness text shows relative + absolute time when online.
- [ ] Freshness display updates every minute.
- [ ] Auto-refresh triggers every 5 minutes online for active ICAO.
- [ ] Going offline forces manual mode and blocks METAR-driven flow.
- [ ] Reconnect does not auto-switch out of manual mode.
- [ ] `npm run test:unit` passes.
- [ ] `npm run lint` passes.
- [ ] If flow copy/layout changes materially, update `e2e/vue.spec.ts` and run `npm run test:e2e -- e2e/vue.spec.ts` (or document blocker).

#### Implementation Notes
- Keep offline handling centralized in app-level state (likely `WindCheckerApp.vue`), with metar composable exposing freshness metadata.
- Ensure interval timers and online/offline event listeners are cleaned up on unmount.
- If auto-refresh fails, keep prior successful timestamp and show explicit fetch error state.

#### Test Plan
- Unit scenarios:
  - successful fetch sets `lastFetchedAt`
  - freshness formatter renders relative + absolute output
  - minute-tick updates freshness label
  - offline transition forces manual mode
  - reconnect keeps manual mode active
  - 5-minute auto-refresh runs only while online with valid ICAO
- Edge cases:
  - no successful fetch yet (freshness hidden or explicit “not yet fetched” state)
  - fetch error after prior success (stale timestamp retained + error shown)
  - offline at initial load

#### Handoff
- What changed:
- Files changed:
- Test results:
- Manual verification notes:
- Blockers/follow-ups:
```

## Important API / Interface / Type Changes
- `useMetar` likely needs additional exposed state:
  - `lastFetchedAt: number | null` (or `Date | null`)
  - optional helper for freshness display text
- App-level connectivity state needed in `WindCheckerApp.vue`:
  - `isOnline: boolean`
  - offline/online lifecycle listeners
- No backend/API contract changes expected.

## Test Cases and Scenarios
- Online, successful fetch: status shows “Updated X min ago (HH:MM local)”.
- Online for >5 minutes: same ICAO auto-refetch occurs.
- Offline transition during METAR mode: app forces manual mode and shows offline/manual-required status.
- Offline startup: METAR path unavailable; manual entry remains usable.
- Reconnect: app remains manual until user explicitly switches mode and refetches.

## Assumptions and Defaults Chosen
- Offline policy: strict manual-only enforcement.
- Freshness display: relative + absolute local timestamp.
- Auto-refresh cadence: 5 minutes.
- Reconnect behavior: remain in manual mode until user action.
- Scope remains advisory-only with existing disclaimers preserved.
