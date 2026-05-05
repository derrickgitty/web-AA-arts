# todo.md — Alva & Alsa's Art Portal

Living state. Update at every commit. New sessions bootstrap from this.

Convention: `[x]` done · `[ ]` open · `[~]` in progress · `[!]` blocked

## Status (as of 2026-05-05)

Portal is feature-complete for the agreed scope plus a Phase 3 polish pass (a11y, theme picker, error pages, deps). Live at https://github.com/derrickgitty/web-AA-arts (`main`). No pending CRs from user.

## Done

- [x] Initial scaffold (Next.js 15 + SQLite + bcrypt + sharp + Tailwind pastel theme)
- [x] Login + sessions, kid-vs-admin role gating
- [x] Gallery CRUD: top-level per kid, sub-galleries, drag-drop image upload
- [x] Public share view with secret tokens
- [x] CR1: Avatar upload (header + gallery + explore)
- [x] CR2: Admin panel — `/admin/{users,logins,shares,audit}`
- [x] CR3: Multi-share-per-gallery with required recipient label, custom days or permanent expiry, kid+admin revoke, view tracking
- [x] CR4: PDF + SVG upload (DOMPurify-sanitised), folder picker, drag-drop
- [x] CR5: Download mitigations — right-click off, drag-save off, watermark, PDF toolbar hidden
- [x] CR6: Lightbox rotate + zoom (buttons + scroll wheel) + drag-to-pan
- [x] Force-password-change on first login / after admin reset
- [x] Login rate limiting (10 fails / username / 10 min)
- [x] Admin action audit log
- [x] 500MB per-kid storage quota with usage bar
- [x] Manus AI deployment prompt (handed to user 2026-05-04)
- [x] netty-01-webdev framework artifacts: CLAUDE.md, todo.md, COMPONENTS.md, LOC.md
- [x] Vitest test infrastructure + integration suite
- [x] Phase 3 polish (2026-05-05): TS 6, sharp 0.34, @types/node 25 bumps; pastel 404/error/global-error pages; `.env.example`; `scripts/backup.sh`; `public/robots.txt`; lightbox a11y (Esc/Tab trap, ARIA, focus restore); per-kid theme picker (pastel/berry/lavender/forest)

## Open

_None right now — waiting for next CR or feedback._

## Possible next steps (not committed)

- [ ] Documentation package (Skill 4): 4 technical + 4 business diagrams + UI screenshots
- [ ] Email/Slack notification when a share link is first viewed (currently only visible in admin panel)
- [ ] Admin export: download a kid's full portfolio as a ZIP
- [ ] Move from SQLite to Postgres + S3 if Manus AI hosting requires serverless

_Explicitly NOT planned: Docker / docker-compose / CI workflows / heavy infra — keeping this small per user direction (2026-05-05)._

## Notes for next session

- Check `docs/test-log.md` for the most recent test-suite results.
- If schema is changed, `data.db` must be deleted and `npm run seed` re-run (no migration tooling).
- If you change `src/lib/db.ts`, also update the schema table in CLAUDE.md.
