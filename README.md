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

## MCP server config (Nuxt)

This repo includes a root `.mcp.json` configured for Nuxt MCP using `nuxi mcp`:

```json
{
  "mcpServers": {
    "nuxt": {
      "command": "npx",
      "args": ["nuxi", "mcp"]
    }
  }
}
```

This lets MCP-compatible clients attach to Nuxt project context and tools from this workspace.

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

- `master`: main working branch; all day-to-day development lands here and merges trigger deployment.
- Feature branches: branch from `master`, then merge back into `master` via PR.
- Keep feature branches short-lived to minimize drift and merge conflicts.
- No long-lived `dev` branch; `master` is always the single source of truth.

### Recommended GitHub branch protections for `master`

Configure these under **Settings > Branches > Branch protection rules** for `master`:

| Setting | Value | Why |
|---------|-------|-----|
| Require a pull request before merging | On | Prevents direct pushes; all changes go through PR review. |
| Require approvals | 1 (or skip if solo) | Code review gate for team repos. Solo devs can set to 0. |
| Require status checks to pass | On | Gate merges on `test:unit` and `lint` passing in CI. |
| Require branches to be up to date | On | Ensures feature branches are rebased on latest `master` before merge. |
| Require linear history | On | Enforces rebase-merge or squash-merge, keeping history clean and preventing merge commits. |
| Allow force pushes | Off | Protects `master` from history rewrites. |
| Allow deletions | Off | Prevents accidental branch deletion. |

### Cleanup steps to migrate from `dev`

1. **Merge any open `dev` PRs**: Retarget them to `master` or close if stale.
2. **Change GitHub default branch**: Go to **Settings > General > Default branch** and switch from `dev` to `master`.
3. **Update Railway/Netlify deploy branch** (if applicable): Confirm deploy triggers point at `master`.
4. **Delete the remote `dev` branch**: `git push origin --delete dev` once all work is migrated.
5. **Clean up local branches**: `git branch -d dev` to remove the local tracking branch.
6. **Notify collaborators**: Let anyone with local clones know to `git fetch --prune` and base new work on `master`.
