# test-log.md — Persistent record of test runs

Newest at top. Append every run that's worth recording (full suite, post-CR, post-fix).

---

## Run 2026-05-05 19:55 SGT — Phase 3 polish (a11y, themes, error pages, TS 6)

**Environment**

| Item | Value |
|---|---|
| Node.js | v25.9.0 |
| OS | macOS Darwin 25.4.0 |
| Vitest | 3.2.4 |
| TypeScript | 6.0.3 |
| App version | commit `043bf6b` (`feat: per-kid theme picker`) |

**Command:** `npm test`

**Result:** ✅ all green — 6 files, 34 tests, 10.7s wall clock.

| File | Tests | Status |
|---|---|---|
| `tests/unit/passwords.test.ts` | 5 | ✓ |
| `tests/unit/svg.test.ts` | 6 | ✓ |
| `tests/integration/01_auth.test.ts` | 3 | ✓ |
| `tests/integration/02_upload.test.ts` | 7 | ✓ |
| `tests/integration/03_shares.test.ts` | 8 | ✓ |
| `tests/integration/04_admin.test.ts` | 5 | ✓ |

**Notes**

- Verified after each Phase 3 commit (dep bumps, error pages/backup/env, lightbox a11y, TS 6, theme picker). All ran clean.
- TS 6 strictness on side-effect imports surfaced one missing declaration; resolved by adding `src/types.d.ts` (`declare module "*.css";`).
- Adding the new `users.theme` column did not require any test changes — the column has a SQL default, and the schema migration path is exercised on every fresh `data.test.db`.

**No defects in the application code surfaced.**

---

## Run 2026-05-04 18:02 SGT — Phase 2 baseline (initial test infrastructure)

**Environment**

| Item | Value |
|---|---|
| Node.js | v25.9.0 |
| sqlite3 (CLI) | 3.51.0 |
| OS | macOS Darwin 25.4.0 |
| Vitest | 3.2.4 |
| App version | commit `9c0e9fc` + Phase 2 working tree |

**Command:** `npm test`

**Result:** ✅ all green — 6 files, 34 tests, 9.36s wall clock.

| File | Tests | Status |
|---|---|---|
| `tests/unit/passwords.test.ts` | 5 | ✓ |
| `tests/unit/svg.test.ts` | 6 | ✓ |
| `tests/integration/01_auth.test.ts` | 3 | ✓ |
| `tests/integration/02_upload.test.ts` | 7 | ✓ |
| `tests/integration/03_shares.test.ts` | 8 | ✓ |
| `tests/integration/04_admin.test.ts` | 5 | ✓ |

**Findings during initial green-up**

1. **First failure** — `01_auth.test.ts` assumed alva still had the seed pw, but Vitest's discovery order put `02_upload.test.ts` first which consumed the seed pw via `asLoggedInUser('alva')`. Fix: `01_auth` now admin-resets alva at the start of the test that exercises the must-change-pw flow, making it independent of file order.
2. **Second failure** — `02_upload`, `03_shares` failed when `04_admin` ran first, because `04_admin` resets alva to a one-shot generated pw that neither test pw nor seed pw matches. Fix: `asLoggedInUser()` helper now has a Path 3 fallback: if both test pw and seed pw fail, it bootstraps via admin reset and changes back to the test pw.
3. **Repeated runs are idempotent** — verified by running the suite twice in a row, both green.

**No defects in the application code surfaced.**

---
