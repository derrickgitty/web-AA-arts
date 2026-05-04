# Alva & Alsa's Art Portal 🎨

A cosy, pastel web portal where Alva and Alsa can upload their art and share it with friends and family via a secret link. Login-gated, admin-issued accounts.

## Stack

- **Next.js 15** (App Router) + **TypeScript** + **Tailwind**
- **SQLite** (via `better-sqlite3`) — single `data.db` file, no external services
- **Local file storage** in `public/uploads/` with `sharp` for thumbnails
- **Session cookies** + **bcrypt** for password hashing

## Setup

```bash
npm install
npm run seed     # creates Alva & Alsa accounts; PRINTS PASSWORDS ONCE
npm run dev      # http://localhost:3000
```

The seed prints randomly-generated passwords (e.g. `kitty-rose-471`). **Copy them somewhere safe — they're hashed in the DB and you won't see them again.** To reset, delete `data.db` and re-run `npm run seed`.

## How it works

- `/login` — username + password
- `/` — redirects to your main gallery
- `/gallery/:id` — view & manage a gallery (own = upload/delete/share, other's = read-only)
- `/explore` — see the other kid's galleries
- `/share/:token` — public, read-only view (no login required)

Each kid gets one top-level gallery on seed. Inside, they can create sub-galleries (e.g. "Watercolours", "Sketches") and upload artworks. Sub-galleries have their own share tokens.

## Authorisation

Enforced server-side on every request:
- Logged-in users can read all galleries but only mutate their own.
- Share tokens give read-only access to one gallery + its sub-galleries (each sub has its own token).
- Tokens are 32 random URL-safe chars (un-guessable). Re-rolling a token invalidates the old link.

## Production

```bash
npm run build
npm start
```

Persistent disk required (SQLite + `public/uploads/`). Not suitable for ephemeral serverless hosts.
