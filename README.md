# Guri's SHSAT Quest Log

**[Live app](https://deep152.github.io/shsat-quest-log/)** · [Changelog](CHANGELOG.md) · [All versions](versions/)

A daily study tracker I built for my younger brother (8th grade) while he
preps for the SHSAT, NYC's specialized high school admissions exam. It started
as a checklist so he could stick to his schedule while I was away, and it went
through 17 versions based on how he actually used it.

## Why this exists

He goes to a weekend tutoring program and studies on his own on school nights.
The original plan lived in a text message and kept getting skipped: nothing
reminded him, nobody was checking, and finishing didn't get him anything. The
app turns the plan into something he opens, follows, and gets a small reward
from (his PS5 "unlocks" once the day's work is done), without anyone having to
nag him.

## What it does

- **"Do these 2 today"** at the top of the home screen: one Math lesson and
  one ELA lesson in big type, each with a big ✓ Done button.
- **A different list for each kind of day:** school nights Mon–Fri, and
  tutoring days on Sat/Sun with the right class time for each.
- **One box per kind of work, in the order of his day:** school homework, the
  prep book (Math and ELA), and the tutoring center's weekly homework. The
  homework box has a questions-done counter and an "on pace / behind" line, so
  it doesn't pile up the night before.
- **Study timers that keep counting with the screen off.** They save real
  start / break / stop times, so locking the phone or closing the app never
  loses time.
- **A Test List** of every lesson left before the test, with page numbers.
  His weakest topics come first, based on his practice-test results. If a math
  lesson is too hard, one tap puts it on a list for his math tutor instead of
  skipping it.
- **A calendar** showing each day's study time and lessons finished,
  color-coded. Tap a day to see what got done.
- **A phone-time cap** (2.5 hours max, aim for under 2).
- **A How to tab** with his study method in four short steps.
- **Notes and a backup code,** so questions don't get forgotten and his
  history can move to a new version of the app.

## The hard part: figuring out what he actually needed

The hardest part of this project wasn't the code. It was the requirements.
I'd build what seemed right, he'd use it for a few days, and something wouldn't
work for him. So I'd change it, bit by bit, until each version worked a little
better than the last. Some examples:

- **Too much, then too little.** One version had 7–9 boxes, each with its own
  timer, and it was too much for him to keep up with. So I cut it down to one study timer and a few
  checkboxes, and then it was too bare: it lost the context of what each part of
  his day was for. The version that stuck was in between, with one box per kind of
  work (school homework, prep book, tutoring homework) in the order he actually
  does them.
- **Hours aren't the same as progress.** At first the app only tracked time. But
  three hours with the book open doesn't mean three hours of work. So the
  calendar now shows study time *and* lessons finished for each day, side by
  side.
- **A number can motivate or discourage.** I gave every lesson a due date so he'd
  know if he was on track. When he fell behind, the app said "9 behind," and
  that just made it worse. The current version has one list, weak spots first,
  and says "37 left · 2 a day = done by Nov 9" instead. Same information, but
  something he can actually start on.
- **Too many words, too many tabs.** By v16 the home screen had a lot of text and
  five tabs, and he still had to work out what to do. What he needed was one
  thing: today's two lessons, in big type, at the top. v17 does that, and cuts a
  tab and most of the instructions.
- **His method, not a textbook one.** The first study method in the app was
  strict (always try the practice questions first, review mistakes once a
  week on Sunday). It didn't match how he works. Now he looks at a lesson's topics first and decides, and he
  reviews his mistakes at the end of each session instead of waiting a week.
- **Rules have to make sense to a 13-year-old.** One shared limit for phone *and*
  reading made no sense to him, so reading got no limit at all. And since he's
  13, he'd tap Break and Back over and over just to tap them, so the app
  tells him "chill lil kid, lock in."
- **Homework that piles up.** His tutoring homework is due every Saturday. A
  questions-done counter with an "on pace" line spreads it across the week
  instead of all landing on Friday night.

The [changelog](CHANGELOG.md) has every version and the reason behind each change.

## Bugs I ran into

A few of the actual bugs, not all of them:

- **The timer froze when his phone locked.** The first timer counted down one
  second at a time. That works on a laptop, but phones pause background timers,
  so he'd come back and it had barely moved. It showed up as soon as he used it
  on his phone. The fix
  was a rewrite: save the time each session started and stopped, and work out
  the total from the clock.
- **The live site went blank.** The page loaded the Babel compiler from a link
  with no version number. When Babel 8 came out, the link quietly switched to
  it, and Babel 8 turns JSX into `import` statements a plain web page can't run.
  The browser console showed "Cannot use import statement outside a module,"
  which pointed straight at it. The fix was pinning exact versions.
- **A mis-tap made a finished lesson disappear.** Checked items were hidden to
  keep the list short, so an accidental tap made one vanish with no way to get
  it back. Now checked items stay visible, crossed out, and tapping again undoes it.
- **A forgotten Stop button counted forever.** If he never hit Stop on a past
  day, the weekly totals treated that session as still running and kept adding
  time. Past days now end at the last thing he tapped.
- **New features couldn't erase old progress.** When check-offs started saving
  the date instead of just "done," everything he had already checked still had
  to count, so the app accepts both the old and the new format.

## Design decisions

- **One file, no build step.** The whole app is one React component file. It's
  small enough to read top to bottom, and it can be hosted for free on GitHub
  Pages as a single page.
- **The browser's storage instead of a backend.** It has one user on one
  phone, so a server and a database would be overkill. Saved data lives in
  `localStorage`.
- **The plan is data, not code.** The lessons are a plain array of objects.
  Changing his plan means editing a list, not touching any components.
- **Stable ids and storage keys.** Task ids and storage keys stay the same
  between versions, so an update keeps his saved progress.

## How it was built

I designed what the app needed to do, the study-method logic and every change
between versions, and I tested each one with my brother. Claude helped write
the code, and I reviewed, tested and adjusted it throughout. The rules I keep
for working on it are in [CLAUDE.md](CLAUDE.md). This was also my first real
React project outside of coursework.

## Tech stack

- React (function components and hooks: `useState`, `useEffect`)
- JSX
- Plain JavaScript objects for styling (no CSS framework)
- `localStorage` for saving
- GitHub Pages hosting: React and Babel load from a CDN at pinned versions and
  the JSX is compiled in the browser. For a bigger app I'd use a real build
  step (like Vite) instead.

## Status

Used every day by one person, my brother, through his test in November 2026.
It's built around his schedule and his tutoring program's method, not as a
general-purpose product.
