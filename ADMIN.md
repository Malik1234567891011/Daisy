# Daisy Admin Reference

Quick commands for managing the database and users. Run all commands from the `daisy/` directory.

---

## Query all users

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const users = await p.user.findMany({
    select: {
      id: true, email: true, firstName: true, school: true, major: true, age: true,
      gender: true, genderPreference: true, phoneNumber: true, phoneVerified: true,
      photoUrl: true, intentions: true, vibe: true, interests: true,
      referralCode: true, referredBy: true, onboardingComplete: true, createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  if (users.length === 0) { console.log('No users in the database.'); }
  else { users.forEach((u, i) => { console.log('--- User ' + (i+1) + ' ---'); Object.entries(u).forEach(([k, v]) => { console.log('  ' + k + ': ' + JSON.stringify(v)); }); console.log(); }); }
  console.log('Total: ' + users.length + ' users');
  await p.\$disconnect();
})();
"
```

## Count users

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const count = await p.user.count();
  console.log('Total users: ' + count);
  await p.\$disconnect();
})();
"
```

## Delete all users (wipe DB)

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  await p.match.deleteMany();
  await p.user.deleteMany();
  console.log('All users and matches deleted.');
  await p.\$disconnect();
})();
"
```

## Delete a specific user by email

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const deleted = await p.user.delete({ where: { email: 'someone@example.com' } });
  console.log('Deleted: ' + deleted.email);
  await p.\$disconnect();
})();
"
```

## Query all matches

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const matches = await p.match.findMany({ include: { userA: { select: { firstName: true, email: true } }, userB: { select: { firstName: true, email: true } } }, orderBy: { createdAt: 'desc' } });
  if (matches.length === 0) { console.log('No matches yet.'); }
  else { matches.forEach((m, i) => { console.log('--- Match ' + (i+1) + ' ---'); console.log('  ' + m.userA.firstName + ' (' + m.userA.email + ') <-> ' + m.userB.firstName + ' (' + m.userB.email + ')'); console.log('  Status: ' + m.status + ' | A: ' + m.userADecision + ' | B: ' + m.userBDecision); console.log(); }); }
  await p.\$disconnect();
})();
"
```

## Open Prisma Studio (visual DB browser)

```bash
npx prisma studio
```

Opens at http://localhost:5555

---

## Admin dashboard

```bash
node scripts/dashboard.js
```

Serves stats, charts, and user/match tables at http://localhost:3456.

## Environment

- **Database**: Supabase Postgres, project `cwbetqwqwqedmhnyumld` (migrated off
  Neon 2026-08-30). `DATABASE_URL` is the transaction pooler (6543,
  `?pgbouncer=true`); `DIRECT_URL` is the session pooler (5432) and is what
  Prisma uses for migrations.
- **ORM**: Prisma v6
- **Blob storage**: Vercel Blob (photos)
- **Payments**: Stripe account `Ciel`. Pay-per-reroll, $1.99 CAD one-time — no
  subscriptions.

> The local `.env` points at **production**. `scripts/wipe-db.js` and the
> delete-all snippets above act on 275 real users. There is no staging database.
