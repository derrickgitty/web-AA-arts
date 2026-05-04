# CLAUDE.md — Project context for AI coding agents

This file is loaded automatically by Claude Code at session start. Keep it short and accurate so a new session can pick up cleanly.

## What this is

A pastel, age-appropriate web portal for two kids (Alva & Alsa, both 10–12) to upload art portfolios and share them via secret links. One human admin (the user) manages accounts. Built mid-2026; lives at https://github.com/derrickgitty/web-AA-arts.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) + TypeScript | Single repo for SSR + APIs |
| DB | SQLite via `better-sqlite3` | Zero ops, single file, fits 2-user scale |
| Storage | local filesystem in `public/uploads/` | No S3 dependency |
| Image processing | `sharp` | Thumbnails, EXIF rotation, SVG rasterisation |
| SVG sanitiser | `isomorphic-dompurify` | XSS-proof SVG uploads |
| Auth | session cookie + `bcryptjs` | No third-party auth |
| Styling | Tailwind 3 | Custom pastel palette in `tailwind.config.ts` |

**This stack deviates from the netty-01-webdev framework's prescribed stacks** (tRPC/Drizzle/MySQL or Express/mysql2) — chosen deliberately for single-host portability with Manus AI hosting.

## Directory map

```
src/
├── app/
│   ├── layout.tsx              # Global shell + Quicksand/Fredoka fonts
│   ├── page.tsx                # / — auth-gated redirect (admin → /admin, kid → own gallery)
│   ├── login/                  # Login form + force-pw-change Suspense split
│   ├── change-password/        # /change-password (forced on first login or admin reset)
│   ├── gallery/[id]/           # Owned (edit) or read-only depending on owner
│   ├── explore/                # Other kids' top-level galleries
│   ├── share/[token]/          # Public read-only view, supports ?g=<sub-id>
│   ├── admin/                  # Admin role only — layout guards
│   │   ├── page.tsx            # Dashboard tiles
│   │   ├── users/              # Reset password
│   │   ├── logins/             # Login event history
│   │   ├── shares/             # All shares + revoke
│   │   └── audit/              # Admin action log
│   └── api/                    # All Route Handlers (Next.js App Router)
│       ├── login/  logout/     # Sessions
│       ├── me/password/  me/avatar/  # Self-service
│       ├── galleries/[id]/{shares,route}.ts  # Sub-galleries + share collection
│       ├── shares/[id]/        # Revoke (kid or admin)
│       ├── upload/             # Image+PDF+SVG upload, sharp + DOMPurify
│       ├── artworks/[id]/      # Delete artwork
│       └── admin/users/[id]/reset-password/
├── components/                 # Mostly client components for interactivity
└── lib/
    ├── db.ts                   # SQLite init + types
    ├── auth.ts                 # Session create/destroy, getCurrentUser
    └── passwords.ts            # Friendly password generator + share token alphabet
scripts/seed.ts                 # One-time seed: creates admin + alva + alsa
public/uploads/                 # Gitignored; .gitkeep only
data.db                         # Gitignored; SQLite file
```

## DB schema (in `src/lib/db.ts`)

| Table | Purpose |
|---|---|
| `users` | id, username, password_hash, display_name, role (`kid`/`admin`), avatar_url, must_change_password, storage_bytes |
| `galleries` | id, user_id, name, parent_id (NULL = top-level) |
| `artworks` | id, gallery_id, title, kind (`image`/`pdf`), file_url, thumb_url, bytes |
| `sessions` | id, user_id, expires_at |
| `shares` | id, gallery_id, created_by_user_id, recipient_label, token, expires_at (NULL = permanent), revoked_at |
| `share_views` | id, share_id, viewed_at, viewer_ip, viewer_user_agent |
| `login_events` | id, user_id, username_attempted, success, ip, user_agent, created_at |
| `admin_actions` | id, admin_id, action_type, target_user_id, target_share_id, details, created_at |

`STORAGE_QUOTA_BYTES = 500 MB` exported from the same file.

## Auth model

- Session cookie `aa_session` — httpOnly, sameSite=lax, `secure` in production.
- Every API route calls `getCurrentUser()`; routes that mutate also check ownership.
- Kid can read all galleries (own + others) but only mutate their own.
- Admin sees admin pages only; not given a gallery.
- Share tokens are 32-char URL-safe random; one share = one token; sub-galleries inherit access via `?g=<sub-id>` and a tree-walk authorisation check (`isDescendant`).
- Rate limit: 10 failed logins / username / 10 min, recorded in `login_events`.
- `must_change_password=1` redirects to `/change-password?forced=1`.

## Dev commands

```bash
npm install
npm run seed      # creates admin/alva/alsa; PRINTS PASSWORDS ONCE — capture stdout
npm run dev       # http://localhost:3000
npm run build && npm start   # production
```

To wipe state: `rm data.db data.db-wal data.db-shm public/uploads/*` then re-seed.

## Conventions

- Server components do DB reads; mutations go through API Route Handlers.
- For URLs in dynamic routes, **always** `await params`/`searchParams` (Next 15 changed these to async).
- Tailwind palette uses `blush`/`lilac`/`mint`/`cream` — see `tailwind.config.ts`.
- Page components that use `useSearchParams()` must wrap the client part in `<Suspense>` (see `change-password/`).
- API routes return `NextResponse.json(...)` with 4xx/5xx codes; client UI surfaces `data.error` to the user.
- Don't put event handlers (`onContextMenu={...}`) on server-component JSX — use the `<NoDownloadGuard />` client wrapper instead.

## Production gotchas

- `NODE_ENV=production` flips cookies to `secure`. Without HTTPS the session vanishes silently → use HTTPS in prod.
- SQLite + uploads need persistent disk. **Not** serverless-compatible.
- `better-sqlite3` and `sharp` need build tools (`build-essential`, `python3`, `libvips-dev`) at install time on Linux.

## Known constraints

- Designed for ~2 users. Schema/UX assumes a small, trusted set of kids.
- SVG uploads are sanitised by DOMPurify (server-side); rasterised thumbnail is generated by sharp.
- "Disable download" is layered soft mitigations (right-click off, drag off, watermark, PDF toolbar hidden) — **not DRM**. Screenshots are always possible.
