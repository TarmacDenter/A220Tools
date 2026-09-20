# Server boundary

- Keep API routes thin. Put upstream access, caching, and transformations in `server/utils/`.
- Validate external data at the boundary with the schemas in `shared/schemas/`.
- Preserve HTTP error semantics when changing an endpoint.
