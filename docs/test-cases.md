# test-cases.md — Structured test inventory

What every test in `tests/` covers, in the order it runs. Update when tests are added/changed.

_Last refreshed: 2026-05-04_

## Test architecture

| Aspect | Choice |
|---|---|
| Runner | Vitest 3 |
| Strategy | Real HTTP integration (Next dev server on port 3010 + `data.test.db`) plus pure unit tests for libs |
| Isolation | Global setup wipes `data.test.db` and `public/uploads/test_*`, re-seeds, captures generated passwords for the helper |
| Sequencing | `fileParallelism: false`; tests are also written to be order-independent via the self-healing `asLoggedInUser()` helper |

## Suite dependency order

1. **`tests/unit/passwords.test.ts`** — pure functions
2. **`tests/unit/svg.test.ts`** — pure functions
3. **`tests/integration/01_auth.test.ts`** — login + rate limit + force-pw-change
4. **`tests/integration/02_upload.test.ts`** — file types + auth
5. **`tests/integration/03_shares.test.ts`** — share lifecycle + public view
6. **`tests/integration/04_admin.test.ts`** — admin role gate + reset password

(Vitest does not strictly enforce file order; the helper recovers from any prior state via admin reset, so suites are independent.)

## Coverage

### Unit — `passwords.test.ts`

| # | Case | Asserts |
|---|---|---|
| 1 | `generateFriendlyPassword` format | matches `/^[a-z]+-[a-z]+-\d{3}$/` |
| 2 | `generateFriendlyPassword` variety | 20 calls produce >5 distinct values |
| 3 | `generateFriendlyPassword` length | ≥ 8 chars (matches API minimum) |
| 4 | `shareToken` format | 32 chars, URL-safe alphabet |
| 5 | `shareToken` uniqueness | 100 calls all distinct |

### Unit — `svg.test.ts`

| # | Case | Asserts |
|---|---|---|
| 1 | Benign SVG passes through | `<svg>` and `<circle>` retained |
| 2 | `<script>` stripped | no `<script` in output |
| 3 | `on*` event handlers stripped | no `onclick` etc. |
| 4 | Non-SVG input rejected | returns `null` |
| 5 | `<foreignObject>` and nested `<iframe>` stripped | XSS injection blocked |
| 6 | `javascript:` URIs in `<a href>` stripped | dangerous URI removed |

### Integration — `01_auth.test.ts`

| # | Case | Asserts |
|---|---|---|
| 1 | Wrong password | 401 |
| 2 | Force-pw-change flow | After admin-reset, `/` → 307 to `/change-password?forced=1`; after pw change, `/` → 307 to `/gallery/<id>` |
| 3 | Rate limit | 11th wrong attempt → 429; correct password also 429 while locked |

### Integration — `02_upload.test.ts`

| # | Case | Asserts |
|---|---|---|
| 1 | PNG accepted, re-encoded to JPEG | 200, `kind=image`, `fileUrl` ends `.jpg` |
| 2 | PDF accepted with thumbnail | 200, `kind=pdf`, `fileUrl` ends `.pdf`, `thumbUrl` ends `.jpg` |
| 3 | Malicious SVG sanitised | 200, stored SVG has no `<script>` |
| 4 | Unknown content type | 400 |
| 5 | Anonymous upload | 401 |
| 6 | Cross-kid upload (alva → alsa's gallery) | 403 |
| 7 | Admin upload | 403 (admins can't upload) |

### Integration — `03_shares.test.ts`

| # | Case | Asserts |
|---|---|---|
| 1 | Create with 7-day expiry | 32-char token, `expires_at` ≈ now + 7d (±60s) |
| 2 | Create permanent share | `expires_at: null` |
| 3 | Empty recipient label | 400 |
| 4 | Cross-kid share creation | 403 |
| 5 | Public view | 200 anonymous, HTML contains recipient label |
| 6 | Kid revokes own share | 200, public view → 404 |
| 7 | Admin revokes any share | 200, public view → 404 |
| 8 | Invalid token | 404 |

### Integration — `04_admin.test.ts`

| # | Case | Asserts |
|---|---|---|
| 1 | Kid → /admin | 307 redirect away from /admin |
| 2 | Anonymous → /admin | 307 redirect to /login |
| 3 | Admin → all 5 admin pages | 200 each |
| 4 | Kid hits reset-password endpoint | 401 or 403 |
| 5 | Admin reset returns fresh pw + forces change-pw flow | 200 + `password` field; old test pw → 401; new pw → 307 to `/change-password?forced=1` |

## Coverage gaps (candidates for future tests)

- Storage quota at the 500MB boundary (would need fixture data; expensive)
- Sub-gallery create/delete/cascade
- Gallery rename
- Avatar upload + replacement
- Multi-image lightbox interactions (UI test — requires Playwright/Cypress)
- View-tracking row written when public link is accessed
- Share `?g=<sub-id>` descendant authorisation
- Rate-limit decay after 10 minutes (clock-dependent — would need fake timers or a long-running test)
