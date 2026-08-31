# Daisy - Project README

This document explains what Daisy is today, how the code is structured, how weekly matching works, and how to operate it safely.

## What This Project Is

Daisy is a Montreal student matching app:
- users onboard with profile + preferences + phone verification,
- receive one weekly match,
- choose interested/decline,
- unlock contact info only on mutual interest.

The project includes:
- the public web app (Next.js),
- server APIs (App Router route handlers),
- weekly matching generation scripts,
- weekly seeding + SMS scripts,
- admin and local operational scripts.

## Tech Stack

- Framework: Next.js 16 (App Router), React 19, TypeScript
- Auth: NextAuth v5 (credentials + JWT session)
- Database: PostgreSQL via Prisma
- SMS + OTP: Twilio (Verify + Messaging)
- File storage: Vercel Blob (profile photos)
- Styling: Tailwind CSS
- Password hashing: bcryptjs

Key files:
- `package.json`
- `prisma/schema.prisma`
- `src/lib/auth.ts`
- `src/lib/db.ts`

## High-Level Architecture

- Frontend pages live under `src/app/**/page.tsx`.
- APIs live under `src/app/api/**/route.ts`.
- Auth/session middleware is in `src/middleware.ts`.
- Weekly operational scripts live under `scripts/`.
- Proposed weekly pairs are generated into top-level `../matches.md` (outside `daisy/`).

## Main User Flows

### 1) Onboarding

Primary file: `src/app/onboarding/page.tsx`

Flow:
- account creation info,
- profile and preferences,
- review and join (`POST /api/signup`),
- auto sign-in,
- photo upload (`POST /api/upload`),
- phone verification (`POST /api/otp/send`, `POST /api/otp/verify`).

Important:
- onboarding completion is finalized only after OTP verification.

### 2) Login / Auth

- Login page: `src/app/login/page.tsx`
- NextAuth handler: `src/app/api/auth/[...nextauth]/route.ts`
- Auth config: `src/lib/auth.ts`
- Protected routes are enforced by `src/middleware.ts` (`/dashboard`, `/profile`, `/preferences`, `/verify-phone`).

### 3) Dashboard + Match Decisions

- Dashboard UI: `src/app/dashboard/page.tsx`
- Read latest active match: `GET /api/match`
- Submit decision: `POST /api/match/decision`

Behavior:
- only active states are shown (`PENDING`, `MUTUAL`),
- mutual unlocks contact + suggested spot,
- decline transitions match state appropriately.

### 4) Password Reset (SMS-Based)

- UI: `src/app/forgot-password/page.tsx`
- Legacy route redirect: `src/app/reset-password/page.tsx` -> `/forgot-password`
- Request code: `POST /api/auth/forgot-password`
- Verify code + set password: `POST /api/auth/reset-password`

This flow uses Twilio Verify on the user's verified phone, not email-link reset.

### 5) Account Deletion

- API: `DELETE /api/user/delete`
- Deletes user's match rows first, then the user.

## Database Model Overview

Schema: `prisma/schema.prisma`

Core models:
- `User`
  - profile, preferences, contact, verification, onboarding status, referral fields
- `Match`
  - `userAId` + `userBId`, decisions per side, overall status, `dropDate`
  - optional `suggestedSpotId`
- `MeetingSpot`
  - suggested location metadata
- `BroadcastDedupe`
  - dedupe key for cron SMS periods

Enums:
- `MatchDecision`: `PENDING`, `INTERESTED`, `DECLINED`
- `MatchStatus`: `PENDING`, `MUTUAL`, `EXPIRED`, `DECLINED`

## Weekly Matching Pipeline

### Step A: Generate draft matches

Script: `scripts/generate-matches-md.js`

What it does:
- pulls eligible users (`phoneVerified && onboardingComplete`),
- excludes accounts by explicit rules,
- blocks repeat pairs from historical match table,
- applies pin logic and greedy scoring,
- outputs proposed pairs to `../matches.md`,
- tags every proposed pair with a `Drop slot` of `WED`,
- **does not write Match rows to DB**.

### Step B: Seed + broadcast

Script: `scripts/seed-week-matches-and-broadcast.js`

Dry run:
```bash
node scripts/seed-week-matches-and-broadcast.js
```

Live run:
```bash
DAISY_BROADCAST_CONFIRM=yes node scripts/seed-week-matches-and-broadcast.js --seed --sms
```

Safety behavior (current implementation):
- expires prior-week active matches before seeding (`PENDING`/`MUTUAL` -> `EXPIRED`),
- blocks historical duplicate pairs at seed time,
- aborts on duplicate-history unless explicitly overridden,
- assigns `dropDate` per pair from `Drop slot` (`WED`, `FRI`, `SUN`),
- sends SMS only for matches due now (`dropDate <= now`) and only to users with `phoneVerified`, `phoneNumber`, `smsConsent`.

This script parses pair details from `../matches.md` and then creates DB rows.

## Matching Rules (Current)

Implemented in `scripts/generate-matches-md.js`:

- Hard compatibility filters:
  - bilateral gender preference compatibility,
  - age range compatibility,
  - school/ethnicity preference checks (base pass),
  - no cross photo/no-photo bucket.
- Repeat prevention:
  - any pair that has existed historically is blocked.
- Exclusions:
  - explicit blocked names (`Dawson`, `Kamil`, `Vincent`, `Malik`),
  - org-like emails (`confessions`, `@office.`),
  - suspect domains unless explicitly whitelisted.
- Prioritization:
  - users who never had a match are prioritized in edge ordering.
- Fallback:
  - an extra relaxed pass exists to reduce unmatched users while preserving no-repeat and core compatibility.
- Cadence:
  - Everyone gets one curated Wednesday drop.
  - Extra matches are bought one at a time via paid rerolls, not by tier.

## Cron and Broadcast

- Vercel cron schedule defined in `vercel.json`.
- Cron API route: `src/app/api/cron/wednesday-broadcast/route.ts`
- SMS send logic: `src/lib/wednesdayBroadcastSms.ts`
- Dedupe: `BroadcastDedupe` table by period key.

## Admin and Ops Endpoints

- Admin match route: `src/app/api/admin/match/route.ts`
- Admin notify route: `src/app/api/admin/notify/route.ts`
- Requires `x-admin-key` matching `ADMIN_API_KEY`.

Useful scripts:
- `scripts/dashboard.js` - local operational dashboard (port 3456)
- `scripts/check-users.js` - quick user check script
- `scripts/reset-match-between.js` - reset/create pair between two users
- `scripts/broadcast-daisy-wednesday.js` - broadcast utility
- `scripts/send-match-sms-one.js` - one-off SMS
- `scripts/wipe-db.js` - destructive reset script (matches/users/blob cleanup)

## Local Development

Install:
```bash
npm install
```

Run app:
```bash
npm run dev
```

Build:
```bash
npm run build
```

Start production build:
```bash
npm run start
```

Lint:
```bash
npm run lint
```

## Environment Variables (Categories)

Database:
- `DATABASE_URL`
- `DIRECT_URL`

Auth/session:
- `AUTH_SECRET`
- `AUTH_URL` / `NEXTAUTH_URL` / `VERCEL_URL` (base URL helpers)

Twilio:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `TWILIO_VERIFY_SERVICE_SID`

Stripe billing (pay-per-reroll, $1.99 CAD one-time):
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_REROLL_PRICE_ID` (optional — a real Price for cleaner reporting; if
  unset, checkout builds the line item inline from `REROLL_PRICE_CENTS`)

Broadcast/cron:
- `CRON_SECRET`
- `BROADCAST_SITE_URL`
- `NEXT_PUBLIC_URL`
- `BROADCAST_SUPPORT_EMAIL`
- `BROADCAST_BODY`
- `BROADCAST_REQUIRE_RECENT_DROP`
- `DAISY_BROADCAST_CONFIRM` (script safety)

Admin:
- `ADMIN_API_KEY`

Other:
- `NEXT_PUBLIC_GA_ID`
- `BLOB_READ_WRITE_TOKEN` (for blob cleanup script)

## Current Operational Notes

- `matches.md` is the review layer before DB writes.
- Seeding and SMS can be run together in one command.
- Weekly reset logic is now built into seeding to avoid users being stuck on previous week active matches.
- Duplicate pair protection exists in both generation and seeding layers.
- Paid rerolls: `POST /api/reroll/checkout` opens a $1.99 CAD Stripe Checkout in `payment` mode; `POST /api/reroll` spends the resulting credit, closes the current match as `REROLLED`, and opens a new one via `src/lib/matching.ts`.
- Stripe webhook endpoint is `POST /api/stripe/webhook` and is required to grant reroll credits. It must be subscribed to `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
- A paid reroll always becomes a credit first, so a payment is never lost if the match pool is momentarily empty.

## Analytics

This section tracks the core business metrics and gives a quick way to refresh them.

### Core Metrics To Watch Weekly

- **Total users** (top-of-funnel account creation)
- **Verified + onboarded users** (eligible matching pool)
- **Matches seeded this drop**
- **Reply rate** (responded / total people in this drop)
- **Interest rate** (interested / responded)
- **Mutual count**
- **Waiting one side** (one interested, one still pending)

### Current Snapshot (as of 2026-04-29, latest drop)

- Total users: **284**
- Phone verified: **267**
- Onboarding complete: **267**
- Latest dropDate: **2026-04-29T21:57:22.500Z**
- Matches in latest drop: **100**
- Replied: **107 / 200** (**54%**)
- Interested: **44**
- Declined: **63**
- Pending decisions: **93**
- Mutuals: **8**
- Waiting one side: **18**
- Interest rate (of responders): **41%**

### How To Refresh These Numbers

Run this from `daisy/`:

```bash
node -e "const fs=require('fs'); const path=require('path'); ['.env','.env.local'].forEach(f=>{const p=path.resolve(__dirname,f); if(!fs.existsSync(p)) return; fs.readFileSync(p,'utf8').split('\n').forEach(line=>{const m=line.match(/^\s*([A-Z_][A-Z0-9_]*)=[\"']?(.+?)[\"']?\s*$/); if(m && !process.env[m[1]]) process.env[m[1]]=m[2];});}); const {PrismaClient}=require('@prisma/client'); const prisma=new PrismaClient(); (async()=>{ const totalUsers=await prisma.user.count(); const verified=await prisma.user.count({where:{phoneVerified:true}}); const onboarded=await prisma.user.count({where:{onboardingComplete:true}}); const latest=await prisma.match.findFirst({orderBy:{dropDate:'desc'},select:{dropDate:true}}); let week={matches:0,replied:0,totalPeople:0,interested:0,declined:0,pending:0,mutual:0,waiting:0,replyRate:0,interestRate:0}; if(latest){ const rows=await prisma.match.findMany({where:{dropDate:latest.dropDate},select:{status:true,userADecision:true,userBDecision:true}}); let i=0,d=0,p=0; for(const r of rows){ for(const x of [r.userADecision,r.userBDecision]){ if(x==='INTERESTED') i++; else if(x==='DECLINED') d++; else p++; }} const replied=i+d; const totalPeople=rows.length*2; const mutual=rows.filter(r=>r.status==='MUTUAL').length; const waiting=rows.filter(r=>(r.userADecision==='INTERESTED'&&r.userBDecision==='PENDING')||(r.userBDecision==='INTERESTED'&&r.userADecision==='PENDING')).length; week={matches:rows.length,replied,totalPeople,interested:i,declined:d,pending:p,mutual,waiting,replyRate:totalPeople?Math.round(replied/totalPeople*100):0,interestRate:replied?Math.round(i/replied*100):0,dropDate:latest.dropDate.toISOString()}; } console.log(JSON.stringify({totalUsers,verified,onboarded,week},null,2)); await prisma.$disconnect(); })();"
```

## Suggested Next README Sections (optional)

If wanted, we can add:
- architecture diagrams,
- endpoint request/response examples,
- recovery runbook for drop failures,
- test plan/checklist for weekly release day.
