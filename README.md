# Alva & Alsa's Art Portal 🎨

A cosy, pastel web portal where Alva and Alsa can upload their art and share it with friends and family via secret links — managed by an admin.

## Stack

- **Next.js 15** (App Router) + **TypeScript** + **Tailwind**
- **SQLite** (`better-sqlite3`) — single `data.db` file, no external services
- **Local file storage** in `public/uploads/` with **sharp** for image processing
- **Sessions + bcrypt** for auth; **DOMPurify** for SVG sanitisation

## Setup

```bash
npm install
npm run seed     # creates admin + Alva + Alsa; PRINTS PASSWORDS ONCE
npm run dev      # http://localhost:3000
```

The seed prints randomly-generated passwords (e.g. `kitty-rose-471`). **Copy them somewhere safe — they're hashed in the DB and you won't see them again.** All accounts are flagged `must_change_password`, so each user picks their own password on first login.

Optional env vars are documented in `.env.example` (the defaults work for local dev — no copy required).

To reset everything: delete `data.db` and re-run `npm run seed`.

## Roles & routes

| Role | Lands on | Can do |
| --- | --- | --- |
| `admin` | `/admin` | Manage users, view login + audit history, revoke any share |
| `kid` | `/gallery/:id` | Upload to own gallery, create sub-galleries, share, view others |
| (none) | `/login` | Sign in |
| (none) | `/share/:token` | View one shared gallery + descendants, read-only, no download |

## Features

### For kids
- One main gallery + unlimited sub-galleries
- Upload **images** (JPG / PNG / WebP / GIF / HEIC / **SVG**) and **PDFs**
- Drag-and-drop, file picker, **folder picker**
- Personal avatar
- Lightbox with **rotate, zoom (buttons + scroll wheel), drag-to-pan**
- Multiple share links per gallery, each with a **recipient label** + **custom expiry** (or permanent)
- Revoke own shares
- 500MB storage quota with usage bar
- Per-kid theme picker (pastel / berry / lavender / forest)
- Lightbox is keyboard-accessible (Esc closes, Tab is trapped, focus restores on close)

### For admin
- Reset any user's password (generates new pw, ends their sessions, forces them to change on next login)
- View login history (success + failed attempts, IP, user-agent)
- See every share link, who it's for, expiry, view count, last viewed
- Revoke any share
- Audit log of all admin actions

### Security & safety
- Server-side authorisation on every mutation
- **Rate limiting** — 10 failed logins per username per 10 min triggers a temporary lockout
- **Forced password change** on first login (and after admin reset)
- Session cookies are `httpOnly`, `sameSite=lax`, `secure` in production
- **SVG sanitisation** strips `<script>`, `on*` handlers, etc.
- **Download mitigations**: right-click disabled, drag-save blocked, watermark on shared/non-owner views, PDFs embedded with toolbar hidden
  - ⚠️ Browsers can't truly prevent screenshots — these are layered soft mitigations

## Tests

```bash
npm test          # one-shot
npm run test:watch
```

Vitest 3 — 5 unit tests (password generator, SVG sanitiser) plus 29 integration tests that spawn a real Next dev server on port 3010 against an isolated `data.test.db`. Coverage details in `docs/test-cases.md`; latest run summary in `docs/test-log.md`.

## Production

```bash
npm run build
npm start
```

Persistent disk required (SQLite + `public/uploads/`). Not suitable for ephemeral serverless hosts.

Backups:

```bash
./scripts/backup.sh                 # writes ./backups/aa-arts-<stamp>.tar.gz
./scripts/backup.sh /mnt/backups    # or pass a target dir
```

The script runs a SQLite WAL checkpoint before tarring `data.db` + `public/uploads/`. Wire it into cron or run by hand.

`public/robots.txt` blocks all crawlers — share links are deliberately unguessable but should never be indexed.
