# CLAUDE.md

Rules for working in this repo, for me and for any AI coding assistant. Each
rule exists because something broke once.

## What this is

A study tracker for one person, my brother, prepping for the SHSAT. He uses it
on his phone every day, so **never break his saved progress**.

## Files

- `guri-daily-checklist.jsx`: the app. One React component file. This is the source of truth.
- `index.html`: what GitHub Pages serves. It's the `.jsx` pasted into a page (see below).
- `versions/`: old versions, kept for history. Never edit them.
- `CHANGELOG.md`: every change gets an entry with **what** changed and **why**.

## Rules

1. **Never rename ids or storage keys.** Task ids (`m4`, `e1`, …) and storage
   keys (`guri-day:*`, `guri-study:*`, `guri-kaplanweek:2026-10-12`,
   `guri-completed-dates`, `guri-notes`, `guri-khansq:*`) are how his progress
   is saved. Renaming one silently wipes his history. New things get new ids.
2. **Old saved data has to keep working.** Example: checks used to be saved as
   `true` and are now saved as a date. Both still count as done. A lesson can
   also be `tutor:<date>` (sent to his math tutor, not done yet) or
   `know:<date>` (an old "I know it" skip, counts as done).
3. **Keep it one file.** React hooks only, inline style objects, no new
   libraries, no build step.
4. **Timers never count down.** Save timestamps and work the time out from
   `Date.now()`. Phones pause timers when the screen locks.
5. **Keep `index.html` in sync** after every change to the `.jsx`: paste the
   `.jsx` into the `<script type="text/babel">` block, minus the `import` line
   and the `export default`. Keep the `localStorage` shim above it.
6. **CDN versions stay pinned:** React 18.3.1, Babel standalone 7.26.4. Never
   use a link without a version. That's how the site went blank on Oct 22.
7. **Test before pushing.** Serve `index.html` locally, open it at phone width
   (390px), and check that: it renders, checking an item survives a reload,
   every tab opens, and the console shows no errors.
8. **Write for a 13-year-old.** Short labels, no jargon. Code comments explain *why*, not what.

## Updating the plan

The lesson list is the `KAPLAN_PLAN` array. To change it, edit the array, keep
existing ids, and give anything new a new id. Page numbers come from the book's
table of contents.
