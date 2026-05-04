# LOC.md — Lines of code snapshot

Refresh on commits that change source files.

_Last refreshed: 2026-05-04 (post Phase 2 — tests added)_

## By directory

| Path | Lines | Files | What |
|---|---|---|---|
| `src/app/api/**` | 561 | 11 | Route handlers (login, upload, shares, admin, etc.) |
| `src/app/**` (incl. api above) | 1,559 | 25 | All App Router pages + APIs |
| `src/components/**` | 728 | 13 | Client + server React components |
| `src/lib/**` | 246 | 4 | `db.ts`, `auth.ts`, `passwords.ts`, `svg.ts` |
| `scripts/**` | 60 | 1 | `seed.ts` |
| `tests/unit/**` | 80 | 2 | passwords, svg unit tests |
| `tests/integration/**` | 301 | 4 | auth, upload, shares, admin integration tests |
| `tests/helpers/**` | 209 | 2 | server spawn + cookie-jar fetch client |
| **Total source + tests** | **3,184** | **51** | |

## By language

| Language | Lines | Files |
|---|---|---|
| TypeScript (.ts) | 1,446 | 21 |
| TSX (.tsx) | 1,726 | 27 |
| CSS | 41 | 1 |
| Markdown (root + docs) | ~600 | 6 (CLAUDE.md, todo.md, COMPONENTS.md, LOC.md, README.md, docs/test-cases.md, docs/test-log.md) |
| Config (package.json, tsconfig, next, tailwind, postcss, vitest) | ~110 | 6 |

## Notes

- `package-lock.json`, `next-env.d.ts`, and `node_modules/` excluded.
- 590 LOC across `tests/` covers 34 cases (5 unit + 29 integration).
