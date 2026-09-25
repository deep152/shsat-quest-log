# Guri's SHSAT Quest Log

A daily checklist app I built for my younger brother (8th grade) to help him
stick to a study schedule for the SHSAT (NYC's specialized high school
admissions exam) while our parent was traveling and couldn't check in on him
every day in person.

It's a single-page React app that changes what it shows based on the day of
the week, runs a countdown timer through a multi-step study method, and
remembers his progress across days.

## Why this exists

He goes to a Saturday/Sunday tutoring program and has a self-study routine on
school nights. The original plan lived in a text message. It kept getting
skipped because there was no accountability and no clear payoff for doing the
work. This app turns the plan into something he can open, follow, and get a
small reward from (his PS5 unlocks once the day's list is done) — without a
parent nagging him about it.

## What it does

- **Different checklist for different days** — school-night study blocks
  Mon–Fri, Khan's tutoring day quests on Sat/Sun (with the correct class time
  for each)
- **A built-in countdown timer** that auto-advances through study phases
  (e.g. 60 min closed-book practice → 20 min self-check → 20 min redo before
  looking at the answer) and checks the task off automatically when it
  finishes
- **Progress that survives closing the app** — checkmarks, notes, and history
  are all saved and reloaded automatically
- **A calendar view** of every day he's actually cleared, built from real date
  math, not a library
- **A notes section** for logging problems/questions that come up mid-study,
  so nothing gets forgotten while a parent is away
- **A backup/restore code** so his whole history can be carried over if the
  app is ever rebuilt into a new version

## Tech stack

- React (functional components + hooks — `useState`, `useEffect`)
- JSX
- Plain JS objects for styling (no CSS framework)
- A simple key-value storage API for persistence 

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
program's method.x