# Changelog

Every version of the app, what changed, and **why**. Most of the "why"s came
from watching my brother actually use it. Each version's full code is in
[`versions/`](versions/).

| # | Date | Version |
|---|---|---|
| 1 | Aug 10 | [First checklist](versions/2026-08-10-v01-first-checklist.jsx) |
| 2 | Aug 13 | [Notes + backup code](versions/2026-08-13-v02-notes-backup.jsx) |
| 3 | Early Sept | [School-night blocks + auto timer](versions/2026-09-13-v03-school-night-blocks.jsx) |
| 4 | Early Sept | [Tabs](versions/2026-09-13-v04-tabs.jsx) |
| 5 | Early Sept | [Timed vs. check-off items](versions/2026-09-13-v05-timed-vs-checkoff.jsx) |
| 6 | Sept 25 | [Comments + first GitHub upload](versions/2026-09-25-v06-first-github-upload.jsx) |
| 7 | Sept 27 | [Timer fix](versions/2026-09-27-v07-timer-fix.jsx) |
| 8 | Sept 28 | [One study timer](versions/2026-09-28-v08-one-study-timer.jsx) |
| 9 | Sept 28 | [Subjects](versions/2026-09-28-v09-subjects.jsx) |
| 10 | Sept 28 | [Separate boxes](versions/2026-09-28-v10-separate-boxes.jsx) |
| 11 | Oct 12 | [Book plan, day by day](versions/2026-10-12-v11-todo-by-day.jsx) |
| 12 | Oct 12 | [Weekly checklist](versions/2026-10-12-v12-weekly-checklist.jsx) |
| 13 | Oct 17 | [Dated plan + weak-spot tags](versions/2026-10-17-v13-dated-plan-tags.jsx) |
| 14 | Oct 17 | [Post-its tab + calendar](versions/2026-10-17-v14-postits-calendar.jsx) |
| 15 | Oct 17 | [Page numbers + Nov 8](versions/2026-10-17-v15-toc-nov8.jsx) |
| 16 | Oct 21 | [Test List](versions/2026-10-21-v16-test-list.jsx) |
| — | Oct 22 | Live site fix |
| 17 | Oct 22 | [Do these 2 today](versions/2026-10-22-v17-do-these-2.jsx) |
| 18 | Oct 23 | [Bonus lessons (current)](versions/2026-10-23-v18-bonus-lessons.jsx) |

---

### v1 · Aug 10 · First checklist
- Checklist for tutoring days (Tue/Wed/Thu/Sat), a Sunday wrap-up, free days Mon/Fri.
- XP bar, a "PS5 locked / unlocked" card, and a Days Cleared streak.

**Why:** his study plan lived in a text message and kept getting skipped. He
needed something to tap through and a clear payoff for finishing.

### v2 · Aug 13 · Notes + backup code
- A notes section for problems and questions that come up mid-study.
- A backup/transfer code so his streak survives updates.

**Why:** I was away for two weeks, so questions needed somewhere to go. And I
knew the app would change, so he shouldn't lose his streak every time it did.

### v3 · Early Sept · School-night blocks
- School nights became three study blocks with a timer that ran through
  Study → Check → Rework on its own. Weekends kept tutoring-day lists.

**Why:** school started. His own schedule (made with ChatGPT) was 3.5 hours in
five small chunks with no time for checking mistakes. This kept his hours but
made it three real blocks with the checking method built in.

### v4 · Early Sept · Tabs
- Today, Schedule, Sticky Notes (the method explained) and Calendar tabs.
- The streak now comes from a real list of completed days.

**Why:** "now it's just three boxes." He wouldn't understand what to do without
the bigger picture.

### v5 · Early Sept · Timed vs. check-off items
- Blue items have a timer, green items you just check off.
- Phone (60 min cap) and Kindle (no cap) split apart. Home and Dinner added.

**Why:** one shared phone + Kindle limit made no sense. Reading shouldn't be
capped. The day also needed its normal parts so it read like his actual day.

### v6 · Sept 25 · Comments + first GitHub upload
- Comments explaining *why* the code works the way it does, a README, and a
  standalone `index.html` so it runs on GitHub Pages.

### v7 · Sept 27 · Timer fix
- The timer no longer counts down. It saves real start / break / back / finish
  times and works out the totals from the clock.
- Weekends got full schedules, and every day ends by 10:30.
- The sticky-note method cut down to three steps.

**Why:** the timer froze whenever his phone screen turned off. Phones pause
background timers. The auto-switching phases also confused him, and the
nightly "ghost review" was too much.

### v8 · Sept 28 · One study timer
- The whole day became: one study timer, one phone timer (2.5 hr max, aim
  under 2), and a few checkboxes. The time log moved to the bottom.
- A "chill lil kid, lock in" warning if he spams the buttons.

**Why:** 7–9 boxes, each with its own tracker, was too much for him to manage.
He was also tapping Break / Back over and over.

### v9 · Sept 28 · Subjects
- Buttons for what he's studying: Math, ELA, School HW, Khan's HW.
- Break / Back are back, and the green context items returned.
- A weekly Math vs ELA total, with a nudge when Math falls behind.

**Why:** the simple version lost too much context. He started Math late, so it
kept getting pushed behind ELA.

### v10 · Sept 28 · Separate boxes
- One box per kind of work, in the order of his day: School → Kaplan → Khan's HW.
- A Khan's HW counter (questions done out of 30) with an "on pace / behind" line.

**Why:** separate boxes are easier to follow. Khan's HW was getting crammed the
night before it was due.

### v11 · Oct 12 · Book plan, day by day
- A To Do tab saying exactly which Kaplan lesson to do each day, with leftovers
  carrying over.

**Why:** he was putting in time but didn't know what to work on in the book.

### v12 · Oct 12 · Weekly checklist
- This week's lessons as a checklist inside the Kaplan box, with page numbers
  and a NEXT marker. He continues where he left off the next day.

**Why:** a list he works down at his own pace fit better than assigned days.
(Replaced v11 the same day.)

### v13 · Oct 17 · Dated plan + weak-spot tags
- The whole book through test day, each lesson with a "by" date.
- 🎯 / 💪 tags based on his practice-test results: weak spots vs. topics he's good at.
- A DO NEXT box and an "on track / behind" line.

**Why:** he'd finished 3 of 12 items that week. He needed a deadline for each
lesson and to know where his points were.

### v14 · Oct 17 · Post-its tab + calendar
- A Post-its tab with the full study method, step by step.
- A calendar showing each day's study time and lessons done.
- Check-offs now save the date. A checked lesson stays visible.
- YouTube search links for each lesson's topic.

**Why:** he didn't get the post-it method. I wanted to see whether his hours
were turning into finished lessons. And one mis-tap made a lesson disappear.

### v15 · Oct 17 · Page numbers + Nov 8
- Page numbers for every lesson from the book's table of contents.
- Test date set to Nov 8.
- New first step: look at the topics. Easy → try the practice set. Hard → do the lesson.

**Why:** the table of contents came in, and "always do the practice set first"
didn't match how he actually works.

### v16 · Oct 21 · Test List
- One list of everything left for the test, weak spots first, no dates.
- An "I know it" button for topics he's already solid on.
- "37 left · 18 days to the test · about 2 a day" instead of "behind."

**Why:** he was 9 items behind. The dates had turned into a discouraging number,
and a tutor can help decide what he already knows.

### Oct 22 · Live site fix
- The GitHub Pages site had gone blank. The page loaded Babel without a version
  number, and that link had moved to Babel 8, which turns JSX into `import`
  statements a plain page can't run. React and Babel are now pinned to exact versions.

### v17 · Oct 22 · Do these 2 today
- A big "Do these 2 today" card at the top of the Today tab: one Math lesson and
  one ELA lesson, each with a big ✓ Done button. They stay on the card all day.
- A 👨‍🏫 Too hard button on math. It puts the lesson on a "For your tutor" list
  instead of skipping it. It replaced the "I know it" button.
- School days have a "Tutor 4:00–5:30" check.
- Test date moved to Nov 18. The pace line says when he'll finish at 2 a day.
- Cut the Schedule tab and the DO NEXT list. Post-its became a short
  four-step How to tab.

**Why:** too many words and too many tabs. He needed one clear thing to do each
day. He also started with a math tutor 5 days a week, so hard math now has
somewhere to go. And his test is Nov 18, not Nov 8.

### v18 · Oct 23 · Bonus lessons (current)
- Once both lessons are done, a ⭐ BONUS card hands him one more lesson at a
  time, math first. Extras stay on the card, crossed off, with undo.
- The tutor check moved to right after homework.
- Took out the YouTube links.

**Why:** 2 lessons is the minimum, not the limit, and math has about twice as
many lessons left as ELA. His day goes home → homework → tutor at 4. And a
YouTube search on his phone is one tap from Shorts.
