<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Daisy

Working on the landing page, `Navbar`, `Button` or `globals.css`? Read
`LANDING.md` first — it carries the reference measurements and three
environment landmines that otherwise cost hours.

The short version:

- **Turbopack does not hot-reload here.** Edits don't reach the browser.
  Restart with `pkill -f "next dev"; rm -rf .next; npm run dev` — without the
  `rm -rf`, the persistent cache keeps serving stale output.
- **`cn()` is plain `clsx`, no `tailwind-merge`.** Conflicting utilities both
  land in the class list and the cascade picks the winner, so a `className`
  override on a `Button` is a coin flip. Put variations on variants instead.
- **`.env` points at production.** No staging database; `scripts/wipe-db.js`
  and the delete snippets in `ADMIN.md` act on real users.
