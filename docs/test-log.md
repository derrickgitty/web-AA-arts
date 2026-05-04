# test-log.md — Persistent record of test runs

Newest at top. Append every run that's worth recording (full suite, post-CR, post-fix).

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
