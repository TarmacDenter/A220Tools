# A220Tools agent guide

- Read [domain terminology](CONTEXT.md) before changing operational behavior.
- Read relevant [architecture decisions](docs/adr/) before changing their area.
- Use [the runbook](docs/runbook.md) for commands and verification.
- Use [agent configuration](docs/agents/) for issue tracking, triage labels, and domain-doc rules.

Local guides in `app/`, `server/`, `shared/`, and `test/` define their boundaries.

## Agent skills

### Issue tracker

Issues and specs live in this repo's GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Uses the five default labels plus `in-progress` for committed, unmerged work. See `docs/agents/triage-labels.md`.

### Domain docs

Uses the single-context layout. See `docs/agents/domain.md`.
