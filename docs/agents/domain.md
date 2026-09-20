# Domain docs

How engineering skills consume this repo's domain documentation.

## Before exploring

- Read root `CONTEXT.md`.
- Read ADRs in `docs/adr/` that affect the work.
- If either location is absent, proceed without reporting its absence.

## Layout

This is a single-context repository:

```text
/
├── CONTEXT.md
├── docs/adr/
└── src/
```

## Vocabulary and decisions

Use terms defined in `CONTEXT.md` in issues, proposals, code, and tests. When work conflicts with an ADR, state the conflict explicitly instead of silently overriding it.
