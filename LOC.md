# LOC.md — Lines of code snapshot

Refresh on commits that change source files.

_Last refreshed: 2026-05-04_

## By directory

| Path | Lines | Files | What |
|---|---|---|---|
| `src/app/api/**` | 561 | 11 | Route handlers (login, upload, shares, admin, etc.) |
| `src/app/**` (incl. api above) | 1,559 | 25 | All App Router pages + APIs |
| `src/components/**` | 728 | 13 | Client + server React components |
| `src/lib/**` | 235 | 3 | `db.ts`, `auth.ts`, `passwords.ts` |
| `scripts/**` | 60 | 1 | `seed.ts` |
| **Total source** | **2,582** | **41** | |

## By language

| Language | Lines | Files |
|---|---|---|
| TypeScript (.ts) | 856 | 15 |
| TSX (.tsx) | 1,726 | 27 |
| CSS | 41 | 1 |
| Markdown (root docs) | 282 | 4 (CLAUDE.md, todo.md, COMPONENTS.md, README.md) |
| Config (package.json, tsconfig, next, tailwind, postcss) | 93 | 5 |

## Notes

- Tests not yet counted — will be added once `tests/` lands.
- `package-lock.json` and `next-env.d.ts` excluded.
- `node_modules/` excluded.
