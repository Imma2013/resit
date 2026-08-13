# Contributing

Thanks for helping build Resit. The local `open-design`, `palmier-pro`, and
`postiz-app` repositories are references only; do not copy GPL or AGPL code
into Resit.

## Development

```bash
corepack pnpm install
corepack pnpm dev
corepack pnpm typecheck
corepack pnpm build
```

## Project layout

```text
app/            Next.js App Router pages and API routes
components/     React components and CSS modules
convex/         Convex schema, auth, and functions
lib/            Shared types and utilities
scripts/        Setup and environment helpers
```

## Commits

Use a concise lowercase category prefix and an imperative summary, matching
the repository style:

```text
[feat] Add Copilot editor mutations
[fix] Keep Firebase optional in demo mode
```

Do not include co-author trailers.

## Pull requests

- Fill out the PR template sections.
- Explain what users will see.
- Attach screenshots for UI changes.
- Run `pnpm typecheck` and `pnpm build` before opening the PR.
