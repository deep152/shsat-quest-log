# Guri's SHSAT Quest Log

A daily checklist app I built for my younger brother (8th grade) to help him
stick to a study schedule for the SHSAT (NYC's specialized high school
admissions exam) while our parent was traveling and couldn't check in on him
every day in person.

It's a single-page React app that changes what it shows based on the day of
the week, tracks how long he actually studies, lays out everything left to
cover before the test, and remembers his progress across days.

## Why this exists

He goes to a Saturday/Sunday tutoring program and has a self-study routine on
school nights. The original plan lived in a text message. It kept getting
skipped because there was no accountability and no clear payoff for doing the
work. This app turns the plan into something he can open, follow, and get a
small reward from (his PS5 unlocks once the day's list is done) — without a
parent nagging him about it.

## What it does

- **Different checklist for different days**: school nights Mon–Fri, and
  tutoring-day lists on Sat/Sun with the right class time for each
- **One box per kind of work, in the order of his day**: school homework, the
  Kaplan prep book (Math and ELA), and the tutoring center's weekly homework,
  with a questions-done counter and an "on pace / behind" line so it doesn't
  pile up on the last day
- **Study timers that keep counting with the screen off**: they save real
  start / break / stop times and work out the totals from the clock, so
  locking the phone or closing the app never loses time
- **A Test List** of every lesson left before the test, with page numbers,
  ordered so his weakest topics (taken from his practice-test results) come
  first, plus an "I know it" button for skipping topics he's already solid on
- **A calendar** showing each day's study time and lessons finished,
  color-coded, and tapping a day shows what got done
- **A phone-time cap**, and his PS5 "unlocks" once the day's work is done
- **A Post-its tab** that explains his study method step by step
- **Notes and a backup/restore code**, so questions don't get forgotten and
  his history can move to a new version of the app

## Tech stack

- React (functional components + hooks — `useState`, `useEffect`)
- JSX
- Plain JS objects for styling (no CSS framework)
- The browser's localStorage for saving (single user, so no backend needed)
- Hosted on GitHub Pages as one `index.html`: React and Babel are loaded from
  a CDN and the JSX is compiled in the browser. The CDN versions are pinned,
  because an unpinned link once auto-upgraded to Babel 8 and broke the page.
  For a bigger app I'd use a real build step (like Vite) instead.

## How it's built

Everything lives in one file (`guri-daily-checklist.jsx`). That's intentional
for a project this size. One component tree with state lifted to the top and passed down as props, no routing, no Context, no state library. It's meant to be simple enough to read start to finish.

The schedule itself is just data — an array of task objects — so changing
what a day looks like means editing that array, not touching any rendering
code.

## How it was built

I designed the structure, the study-method logic (my brother's tutoring
program's own method, adapted into app form), and every iteration of what the
app needed to do. Claude was used to help implement it, reviewing, adjusting, cleaning code throughout. This was also my first real React project outside of
coursework.

## Status

Actively used by one person (my brother) as of Fall 2026. Not intended as a
general purpose product — it's specific to his schedule and his tutoring 
program's method.