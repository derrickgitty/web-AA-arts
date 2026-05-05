# COMPONENTS.md — Dependency manifest

All npm packages used by the art portal, with the version range declared in `package.json` and the exact version locked in `package-lock.json`. Update after any `npm install`/upgrade.

_Last refreshed: 2026-05-05 (post Phase 3 — TS 6, sharp 0.34, theme picker, a11y, error pages)_

## Runtime dependencies

| Package | Range | Locked | Purpose |
|---|---|---|---|
| `next` | `^15.1.0` | `15.5.15` | App framework (App Router) |
| `react` | `^19.0.0` | `19.2.5` | UI runtime |
| `react-dom` | `^19.0.0` | `19.2.5` | DOM renderer |
| `better-sqlite3` | `^11.5.0` | `11.10.0` | Synchronous SQLite client (native, needs node-gyp + libvips for sibling sharp) |
| `bcryptjs` | `^2.4.3` | `2.4.3` | Password hashing (pure JS, no native compile) |
| `isomorphic-dompurify` | `^2.36.0` | `2.36.0` | SVG sanitisation on upload |
| `nanoid` | `^5.1.11` | `5.1.11` | Random IDs for sessions, files, share tokens |
| `sharp` | `^0.34.5` | `0.34.5` | Image processing (thumbnails, EXIF rotation, SVG rasterisation). Requires `libvips` |

## Dev dependencies

| Package | Range | Locked | Purpose |
|---|---|---|---|
| `typescript` | `^6.0.3` | `6.0.3` | Type checker. Stricter on side-effect imports — see `src/types.d.ts` for the `*.css` declaration |
| `tsx` | `^4.19.2` | `4.21.0` | TS runner used by `npm run seed` |
| `tailwindcss` | `^3.4.16` | `3.4.19` | Utility CSS |
| `postcss` | `^8.4.49` | `8.5.13` | Tailwind toolchain |
| `autoprefixer` | `^10.4.20` | `10.5.0` | Vendor-prefix CSS |
| `@types/node` | `^25.6.0` | `25.6.0` | Node type defs |
| `@types/react` | `^19.0.0` | `19.2.14` | React type defs |
| `@types/react-dom` | `^19.0.0` | `19.2.3` | React DOM type defs |
| `@types/bcryptjs` | `^2.4.6` | `2.4.6` | bcryptjs type defs |
| `@types/better-sqlite3` | `^7.6.12` | `7.6.13` | better-sqlite3 type defs |
| `vitest` | `^3.2.4` | `3.2.4` | Test runner (unit + integration) |

## System / runtime requirements

| Requirement | Reason |
|---|---|
| Node.js 20+ | Next.js 15 minimum; tsx and modern fetch |
| Persistent filesystem | `data.db` + `public/uploads/` survive restarts |
| HTTPS in production | Session cookies set `secure: true` when `NODE_ENV=production` |
| Build toolchain at install (Linux) | `better-sqlite3` and `sharp` compile native code; need `build-essential`, `python3`, `libvips-dev` |

## No dependencies on

- No external auth provider (no Auth0/Clerk/Firebase)
- No external DB (no Postgres/MySQL host)
- No object storage (no S3/GCS)
- No ORM (raw `better-sqlite3` prepared statements)
- No state library (Next server components + `useState`)
- No CSS-in-JS runtime (Tailwind only)
- No analytics / telemetry
- No Anthropic SDK / AI calls
