# Landing page — working notes

Handoff for the landing-page redesign. Read this before touching
`src/components/landing/`, `Navbar.tsx`, `Button.tsx` or `globals.css`.

The brief was to match **ditto.ai** closely. Measurements below were taken off
their live DOM at a 1512px viewport, not estimated — if something looks like an
arbitrary number, it probably isn't.

---

## Landmines

Three things here will waste your afternoon if you don't know them.

**Turbopack does not hot-reload in this project.** Edits do not reach the
browser. Only a full restart does:

```bash
pkill -f "next dev"; rm -rf .next; npm run dev
```

Skipping `rm -rf .next` is not enough — the persistent cache serves stale
output. Half a day was lost diagnosing "bugs" that were just stale bundles.

**`cn()` is plain `clsx` with no `tailwind-merge`** (`src/lib/utils.ts`). Two
conflicting utilities both land in the class list and *the cascade decides* —
not the order you wrote them. So `<Button variant="primary" className="bg-ivory">`
silently keeps `bg-sage`. This is why colours and weights live on **variants**
in `Button.tsx` rather than being passed as `className`. Adding `tailwind-merge`
would fix the class properly and is worth doing.

**Verifying in a backgrounded tab gives false readings.** With
`document.visibilityState === "hidden"`, `requestAnimationFrame` never fires
and scroll-driven timelines report `currentTime: null`. Both make working
animations look broken. Also `window.scrollTo()` fires no scroll event here, so
the navbar's listener never runs — only a real wheel scroll exercises it, and
`scroll-behavior: smooth` swallows programmatic jumps unless you pass
`behavior: "instant"`.

---

## Structure

`src/app/page.tsx` composes four **chapters**. Each pins one photograph behind
its sections and blurs it as you scroll past (`ScrollBackdrop`).

| Chapter | Photo | Sections | z |
| --- | --- | --- | --- |
| 1 | `mcgill-campus.png` | Hero, HowItWorks | 40 |
| 2 | `group2-bg.jpg` (club) | WhyDaisy | 30 |
| 3 | `group4-bg.jpg` (aquarium) | TrustSafety, FAQ | 20 |
| 4 | `group3-bg-moon2-mobile.webp` (beach) | FinalCTA | 10 |

Campus appears once, to say who this is for; everything after shows people on
dates.

### Seams

Chapters do **not** use a divider element. Each cuts scalloped notches out of
its own bottom edge with a CSS mask, and the next is pulled up `-mt-[20px]`
underneath, so the bumps are made of the photograph below. A flat colour never
blends, because what it sits against is an image.

Two things this depends on:

- **Descending z-index.** Later siblings paint on top by default; without the
  z ladder the lower chapter covers the edge instead of showing through it.
- **`sweep-flag: 0` in the arc path.** Between two points on the same
  horizontal, sweep 1 takes the lower half of the ellipse, which falls outside
  the shape and renders a straight line.

### Scrims

Any scrim inside a chapter **must reach zero opacity at its edges**. The hero
and HowItWorks share one continuous photo, so a scrim ending at any visible
value draws a hard line across the chapter exactly where the hero's box ends.
That bug shipped once already.

---

## Measurements from the reference

Matched exactly unless noted:

| | Value |
| --- | --- |
| Display font | **Spencer** (`src/app/fonts/`, self-hosted via `next/font/local`) |
| Body font | `Helvetica, Arial, sans-serif` — the *system* stack, as the reference uses. No webfont, no licence needed. |
| Hero headline | `5.6vw` — **deliberately ~15% smaller** than their `6.55vw`, at the client's request |
| Subtitle | `1.31vw`, line-height 1.25 |
| Enrol card | 400px wide, radius 32, padding 16 |
| Enrol button | 48px tall, 16px/700, radius 28 |
| Nav pills | 40px tall, 14px/500, padding 0 16px |
| Glass | `blur(10px)` + `inset 0 0 8px rgba(255,255,255,0.15)` — **no border**; the rim is an inset glow |
| School marquee | 400px window, hard clip, 32px type |

`--nav-h` in `globals.css` is the single source for the bar height. Four rules
depend on it (bar, hero pull-up, hero padding, scrim). They drifted apart once
and left a 1px white seam above the hero.

---

## Animation

- `.reveal` / `.reveal-late` — scroll-driven, `animation-timeline: view()`.
  Ranges end in the `cover` phase on purpose; ending inside `entry` completes
  the fade while the element is still below the fold, where nobody sees it.
- `.enter` — hero entrance, gated on `[data-intro="done"]`. `IntroAnimation`
  renders the page *underneath* its overlay rather than replacing it, so an
  ungated load animation plays behind the splash and is over before it lifts.
  No hidden base state, so a JS failure degrades to a static page.

---

## Open items

**Untested — takes real money.** The reroll purchase flow has never run end to
end. Stripe account `Ciel` is live-mode only (no sandbox reachable), so the only
way to exercise checkout → webhook → credit → new match is a real $1.99 CAD
charge, refundable afterwards.

**Content and assets**

- Hero photo is **horizontally flipped** — the Redpath banner reads `REDPAEUN`.
  McGill students will notice.
- Hero PNG is **2.3 MB**. It's a CSS `background-image`, so Next's optimiser
  never touches it. ~250 KB as WebP with no visible change.
- `"Join 1000+ MTL students"` against **275 real accounts** (268 onboarded and
  verified). Client's call, flagged more than once.
- `group3-bg-moon2-mobile.webp` is 780px wide and named `mobile`; it's stretched
  across desktop.
- `public/howitworks/how_it_works_*.webp`, `number_*.webp` and
  `subtitle_how-it-works.png` are **third-party files**, not Daisy originals.
  Generated replacements sit beside them as `step-1..4.webp` — point `STEP_ART`
  at them to swap.

**Layout**

- Chapter 2 is 885px against chapter 1's 1888 — the club photo barely breathes.
- Nav links are unreachable from the top of a phone screen (no hamburger, by
  design). They're in the footer and in the HTML for crawlers.

**Untouched by the redesign:** dashboard, all 13 onboarding steps, profile,
preferences, auth pages. They still use the old cream design.

---

## Regenerating step artwork

```bash
node --env-file=.env scripts/generate-step-art.mjs      # all four, or pass 1-4
python3 scripts/trim-step-art.py                        # strips letterbox bars
python3 scripts/normalize-step-art.py                   # crops all to 2.6:1
```

`gemini-2.5-flash-image` ignores aspect-ratio direction and returns squares with
the banner letterboxed in white, hence the trim step. Image generation needs
billing enabled on the Google Cloud project — the free tier quota is 0.
