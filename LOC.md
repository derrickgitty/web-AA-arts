# LOC.md — Lines of code snapshot

Refresh on commits that change source files.

_Last refreshed: 2026-05-05 (post Phase 3 — theme picker, a11y, error pages, TS 6)_

## By directory

| Path | Lines | Files | What |
|---|---|---|---|
| `src/app/api/**` | 567 | 12 | Route handlers (login, upload, shares, admin, theme, etc.) |
| `src/app/**` (incl. api above) | 1,683 | 29 | All App Router pages + APIs (includes `not-found.tsx`, `error.tsx`, `global-error.tsx`) |
| `src/components/**` | 862 | 13 | Client + server React components |
| `src/lib/**` | 269 | 4 | `db.ts`, `auth.ts`, `passwords.ts`, `svg.ts` |
| `scripts/**` | 87 | 2 | `seed.ts`, `backup.sh` |
| `tests/unit/**` | 80 | 2 | passwords, svg unit tests |
| `tests/integration/**` | 301 | 4 | auth, upload, shares, admin integration tests |
| `tests/helpers/**` | 209 | 2 | server spawn + cookie-jar fetch client |
| **Total source + tests** | **3,465** | **53** | |

## By language

| Language | Lines | Files |
|---|---|---|
| TypeScript (.ts) | ~1,580 | 21 (incl. `src/types.d.ts`) |
| TSX (.tsx) | 1,978 | 30 |
| CSS | 56 | 1 |
| Shell | 27 | 1 (`scripts/backup.sh`) |
| Markdown (root + docs) | ~700 | 7 (CLAUDE.md, todo.md, COMPONENTS.md, LOC.md, README.md, docs/architecture.md, docs/test-cases.md, docs/test-log.md) |
| Config (package.json, tsconfig, next, tailwind, postcss, vitest, .env.example) | ~120 | 7 |

## Notes

- `package-lock.json`, `next-env.d.ts`, and `node_modules/` excluded.
- 590 LOC across `tests/` covers 34 cases (5 unit + 29 integration).
