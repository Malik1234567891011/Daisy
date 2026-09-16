# Daisy — operations handoff

Written 2026-09-16. Things that are true about the running system and cost real
time to rediscover. Read alongside `README.md` (what the product is), `AGENTS.md`
and `LANDING.md` (front-end landmines).

---

## 1. Which database is production

**Production is Supabase.** The project ref is in Vercel's `DATABASE_URL`, which
is marked *Sensitive* and cannot be read back from the dashboard or CLI.

**`.env` and `.env.local` on the laptop still point at an old Neon copy.** It has
a different, stale user list. Anything run locally without an explicit
`DATABASE_URL` talks to the wrong database.

This already caused one outage: a schema change was applied to Neon, code that
depended on it was deployed, and every sign-in threw for ~20 hours. Before
touching production data, run:

```bash
DATABASE_URL='<supabase url>' node scripts/preflight-db.js
```

It prints the host, whether the expected columns exist, and a row-count
fingerprint, using raw `information_schema` queries rather than the Prisma model
— a model query throws in exactly the situation the check exists to detect.

Scripts that load `.env` must fill gaps only (`if (m && !process.env[k])`), never
overwrite. `seed-test-accounts.js` used to clobber an exported `DATABASE_URL`;
that is fixed, but check any new script.

**Deploy order is always: schema first, then code.** Never the reverse.

---

## 2. Environment variables that are missing in production

| Variable | Effect of it being absent |
|---|---|
| `CRON_SECRET` | **Both** Wednesday crons (22:00 and 22:30 UTC) return 401 and do nothing. Weekly drops do not send on their own. Matches must be seeded and broadcast by hand. |
| `ADMIN_API_KEY` | `/admin` is unusable — the gate fails closed, so `/admin` redirects to `/admin/login` and no key works. Not a security hole; the area is simply shut. |

Both are single env vars plus a redeploy.

---

## 3. Matching

### Weekly drop (the main path — human reviewed)

1. `scripts/generate-matches-md.js` → writes proposed pairs to `../matches.md`.
   **Writes no database rows.** This is the review layer.
2. Read `matches.md`, edit if needed.
3. `scripts/seed-week-matches-and-broadcast.js` → creates `Match` rows and sends SMS.

Hard rules in the generator: bilateral gender preference, bilateral age range,
school/major/ethnicity preferences, never repeat a historical pair, test accounts
excluded. It buckets users into **photo** and **no-photo** and never crosses
them, so photo-less members can only ever match each other.

### Reroll (automated, paid)

`src/lib/matching.ts`. A reroll costs **$1.99 CAD, one-time**, Stripe Checkout in
`payment` mode. One purchase = one credit = one replacement match.

`getRerollTarget` decides eligibility from the most recent match whose `dropDate`
has passed:

| State | Rerollable? |
|---|---|
| No match | no |
| `PENDING` | **no** — answer the person in front of you first |
| `MUTUAL` | **no** — that one worked |
| `DECLINED` or `REROLLED`, within 7 days | **yes** |

`findRerollCandidate` excludes: yourself, anyone in a live `PENDING`/`MUTUAL`
match, anyone you have ever been paired with, and the opposite population
(test vs real). It requires `onboardingComplete` and `phoneVerified`.

> **Known gap:** it does **not** require a photo. Someone can pay and be rerolled
> into a photo-less profile, which contradicts the "no photo, no match" rule the
> weekly generator enforces.

Because the candidate pool excludes anyone already in a live match, **members who
go unmatched in a given week are automatically the reroll pool.** No extra work
is needed to prioritise them.

Credits are granted idempotently on `RerollPurchase.stripeSessionId`, so a
replayed webhook cannot double-grant.

---

## 4. SMS

Three separate paths:

- `src/lib/wednesdayBroadcastSms.ts` — the weekly broadcast. Recipients are
  derived **from the drop itself**, not the whole user base. It used to text
  everyone whenever any match existed in the last 48h; one stray row could
  notify the entire list.
- `src/lib/sms.ts` — transactional (new match, mutual match). All sends go
  through `sendSmsToUser`, which checks consent in one place.
- `scripts/broadcast-daisy-wednesday.js` — ad-hoc blast. Dry run by default;
  needs `--send` and `DAISY_BROADCAST_CONFIRM=yes`. Supports `{{NAME}}`,
  `{{DASHBOARD}}`, `{{URL}}`, `{{EMAIL}}`.

**Encoding:** any emoji, curly apostrophe or em dash forces the whole message
into UCS-2, dropping the segment size from 160 characters to 70 and roughly
quadrupling the bill. The Wednesday body has a comment saying so. The dry run
prints the segment count.

**Numbers:** `src/lib/phone.ts` is the single normaliser. A bare ten-digit entry
gets `+1`; only an explicit `+` is treated as a caller-supplied country code; a
`+` followed by ten digits in NANP shape is repaired rather than forwarded.

> Three separate copies of a broken `+${digits}` normaliser have been found and
> removed (`StepPhone`, `StepOTP`, `auth.ts`). The failure is silent and cruel:
> the code sends fine, then verification fails, so the member holds a valid code
> they cannot use. If OTP breaks again, grep for `replace(/\D/g, "")` rather than
> the function name.

US numbers currently fail with error **30034** — A2P 10DLC is not registered.
Canadian numbers are unaffected. Some countries also need Geo Permissions
enabling in the Twilio console (error 21408).

---

## 5. The relaunch giveaway

`src/lib/raffle.ts` holds every fact about it, so the landing page, dashboard and
`/giveaway` rules page cannot drift apart. `isOpen()` hides every surface at once
when it closes; `enabled: false` kills it immediately.

One completed signup = one entry. Every 5 **qualifying** referrals = one more.
Qualifying means verified number **and** photo **and** onboarding complete — the
same bar used before showing anyone to a match.

> **Open problem:** referral attribution appears to be broken. 137+ signups since
> the relaunch blast, **zero** with `referredBy` set. Untraced as of writing.
> Suspect the `?ref=CODE` parameter being dropped across the twelve onboarding
> steps, or the hero's email box rewriting the URL to `?email=...`.

---

## 6. Dates and the weekly rhythm

Drop is **Wednesday 6pm Toronto** (22:00 UTC, 21:00 in winter).

`(3 - now.getDay() + 7) % 7 || 7` was wrong in three files: on a Wednesday the
offset is legitimately `0`, and `0` is falsy, so drop day counted down to the
*following* week. `tests/drop-countdown.test.ts` fails if it reappears.

---

## 7. Test accounts

`isTestAccount` is a real column, enforced server-side in the reroll query and
rules, the weekly generator, and every SMS path. Reviewer accounts and real
students can never see each other.

`scripts/seed-test-accounts.js` is idempotent and prints the target host before
writing. Accounts created through ordinary signup for testing are **not** test
accounts — they land in the live matching pool and must be deleted by hand.

---

## 8. Running things safely

- `npm test` — 55 tests, no database needed.
- `npx tsc --noEmit` and `npm run build` before every deploy.
- Lint has a standing ~41 pre-existing problems; compare against that baseline
  rather than expecting zero.
- `scripts/dashboard.js` (local ops view, port 3456) and `/admin` both read
  production. The local one needs `DATABASE_URL` exported or it shows Neon.
