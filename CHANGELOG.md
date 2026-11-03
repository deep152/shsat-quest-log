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
| 18 | Oct 23 | [Bonus lessons](versions/2026-10-23-v18-bonus-lessons.jsx) |
| 19 | Oct 23 | [Math + ELA lanes](versions/2026-10-23-v19-lanes.jsx) |
| 20 | Oct 24 | [ELA at home, tutor for what he missed](versions/2026-10-24-v20-ela-at-home.jsx) |
| 21 | Oct 24 | [Follows the tutor](versions/2026-10-24-v21-follows-the-tutor.jsx) |
| 22 | Oct 24 | [Progress reports](versions/2026-10-24-v22-progress-reports.jsx) |
| 23 | Oct 24 | [Topics and the 4-of-5 rule](versions/2026-10-24-v23-topics.jsx) |
| 24 | Oct 24 | [His steps + Notes tab](versions/2026-10-24-v24-steps-and-notes.jsx) |
| 25 | Oct 25 | [One Lessons tab](versions/2026-10-25-v25-lessons-tab.jsx) |
| 26 | Oct 25 | [Pick a lesson](versions/2026-10-25-v26-pick-a-lesson.jsx) |
| — | Oct 25 | Removed Lesson 4.7 |
| — | Nov 2 | Progress reports switched on |
| 27 | Nov 2 | [Tutorverse warm-ups (current)](versions/2026-11-02-v27-warm-ups.jsx) |
| — | Nov 2 | "Only if there's time" lessons |

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

### v18 · Oct 23 · Bonus lessons
- Once both lessons are done, a ⭐ BONUS card hands him one more lesson at a
  time, math first. Extras stay on the card, crossed off, with undo.
- The tutor check moved to right after homework.
- Took out the YouTube links.

**Why:** 2 lessons is the minimum, not the limit, and math has about twice as
many lessons left as ELA. His day goes home → homework → tutor at 4. And a
YouTube search on his phone is one tap from Shorts.

### v19 · Oct 23 · Math + ELA lanes
- The card became "Do 2 today" with a Math lane and an ELA lane. Finish a
  lesson and the next one in that subject shows up right there. Finished ones
  stay in the lane, crossed off, with undo.
- The goal is 2 a day with at least 1 math. ELA is every other day: if he did
  no ELA yesterday, 1 ELA is part of today's 2.
- Math starts at Ch 11, where his tutor started him. 10.4 Backsolving moved to
  just before Algebra, where it's used most.

**Why:** after one math lesson, the card sent him to ELA even when he was on a
roll. Most days should lean math, since it has about twice as many lessons
left, without ELA stopping. And his tutor started him at Chapter 11.

### v20 · Oct 24 · ELA at home, tutor for what he missed
- ELA lessons get the 👨‍🏫 Too hard button too, on the Today card and the Test
  List. The tutor list shows both subjects, math first.
- The How to tab now says to read ELA passages at home, mark the ones he got
  wrong, and bring just those to the tutor.

**Why:** most of the ELA section is reading passages about a page long, and
reading them during tutoring used up his tutor's time. Now the reading happens
at home and the tutor's 90 minutes go to the questions he actually missed.

### v21 · Oct 24 · Follows the tutor
- Math is in book order from Ch 11, the way his tutor teaches it. 🎯 tags still
  mark his weak spots.
- "Next" is now the lesson right after the furthest one he's worked on. If the
  tutor skips ahead or picks a different lesson, he checks it off and the app
  picks up right after it. Lessons he skipped stay on the list and come back
  at the end.

**Why:** his tutor started him at Chapter 11 and goes through the book in
order, so a weak-spots-first list kept pointing him at a lesson he'd already
passed. The tutor decides the order now, and the app keeps up.

### v22 · Oct 24 · Progress reports
- Every ✓ Done, 👨‍🏫 Too hard and undo sends a small update to a Google Sheet,
  and I get an email for each lesson he finishes or sends to the tutor.
- The Sheet has a summary tab (lessons left, today's lessons and Kaplan time,
  what's next, the tutor list), the full lesson list, Kaplan minutes per day,
  and a log of every tap.
- A quiet update (no email) also goes out when he opens or leaves the app.
  Updates made while he's offline wait and go out the next time.
- The Sheet's script is in [`progress-sheet/Code.gs`](progress-sheet/Code.gs).

**Why:** checking on his progress meant asking him. Now it comes to me as he
works, and nothing changes for him.

### v23 · Oct 24 · Topics and the 4-of-5 rule
- Every lesson shows its topic from the book, like "Fractions & Decimals" or
  "Organization & Topic Development", on the Today card and the Test List.
- The Today card shows what to type into YouTube if he's stuck, as plain
  text rather than a link.
- "Easy" now has a number: at least 4 out of 5 right without guessing means
  ✓ Done; fewer means 👨‍🏫 Too hard. The How to tab says the same.
- The ELA list notes that 4.2, 4.4 and 4.5 were done before Oct 12.

**Why:** "Lesson 4.6" and "Skip the reading" didn't tell him what the lesson
was about, and "easy?" was a judgment call he couldn't make. The jump from
4.3 to 4.6 also looked like lessons were missing.

### v24 · Oct 24 · His steps + Notes tab
- Every lesson card lists the steps I gave him, in plain words. Math: go
  through the lesson, do the Perform set, circle wrong ones and ask the tutor.
  ELA: read the lesson till he gets it, do the topic test at the end,
  highlight wrong ones and ask the tutor.
- The buttons are now **✓ All right** and **👨‍🏫 Ask tutor**. After Ask
  tutor, a box asks what was hard ("#3, #7").
- A **Notes** tab replaces How to. What he writes shows up there as a to-do
  for the tutor ("Guri said this is hard: …") until it's checked off. His
  other notes moved there from the bottom of the page.
- His notes go to the progress Sheet and email me too.
- Took out the YouTube search words and the 4-of-5 rule from v23.
- Added Lesson 4.7, which he's on now.

**Why:** the YouTube results weren't useful, and the rule was mine, not his
method. What helps is knowing exactly which questions he missed, so the tutor
can start there.

### v25 · Oct 25 · One Lessons tab
- The Test List and the Notes tab became one **Lessons** tab. Each lesson's
  notes sit right under it, each with **✓ gone over** for after the tutor
  covers it.
- Any lesson can get a note ("+ note"), not only ones sent to the tutor, so he
  can flag a single question.
- Notes the tutor went over fold into a "Gone over" list. Other notes are at
  the bottom of the tab.
- Three tabs now: Today, Lessons, Calendar.

**Why:** he jumps around the book with his tutor, so everything about a lesson
should be in one place instead of split across two tabs.

### v26 · Oct 25 · Pick a lesson
- ‹ › arrows on each Today card let him switch to a different open lesson
  before he starts it, with "↺ back to next" to undo. Once he taps ✓ or Ask
  tutor on it, the card picks up right after it.
- The header says GURIE, the way he spells it. The line at the bottom just
  says "lock in."

**Why:** the card only showed the next lesson in the book, but some days the
tutor plans a different one. Switching used to mean going to the Lessons tab.

### Oct 25 · Removed Lesson 4.7
- Took out the "Lesson 4.7" row added in v24. The book's Chapter 4 ends at 4.6.
  He was on the topic test at the end of 4.6, not a separate lesson.

### Nov 2 · Progress reports switched on
- The Google Sheet's script is deployed, and the app now sends its updates to
  it (v22). Checked end to end: an update from the page filled in the Sheet.

### v27 · Nov 2 · Tutorverse warm-ups (current)
- A 15-minute warm-up before Kaplan from a second book (The Tutorverse): short
  drills on what his practice tests kept missing, like modifiers, subject-verb
  agreement, fractions and percents. Then its full practice test and mixed
  review sets for the last week.
- It shows on the Today card under the two lessons and in its own Warm-up
  tab, with three plain steps and a link to the book's answer explanations
  online. Same ✓, Ask tutor and notes as lessons.

**Why:** grammar rules and arithmetic are short, rule-based questions he
missed on every practice test, so they're the fastest points to gain with
16 days left.

### Nov 2 · "Only if there's time" lessons
- Kaplan 15.1, 15.2, Chapter 16, 18.1 and 18.2 moved to an "Only if there's
  time" group at the bottom of each list. They don't count toward lessons
  left, and "next" only reaches them once the core lessons are done. 8.1 and
  8.2 are now just their practice questions.

**Why:** with 16 days left he can't do everything. Charts and data tables never
came up on his practice tests, and the Tutorverse mixed sets and full practice
test cover what Chapter 16 and the reviews would.
- Update: Chapter 16, 18.1 and 18.2 moved to their own "Last week: mixed
  review" group, since mixed practice is the right thing for the final days.
  Only 15.1 and 15.2 stay under "Only if there's time."

### Nov 2 · No more post-its; tutor time counts
- The daily "Checked my answers" check now says wrong ones get circled or
  highlighted and go in the app. Sunday's "Post-its still left" became "Went
  over my notes" (same check, so the PS5 rule doesn't change).
- The tutor check says to run the Math timer there: tutor time counts toward
  his 2 hours, since he does a lesson at home and another with the tutor.

### Nov 2 · Only his phone reports, plus a demo link
- Opening the app in a fresh browser sent its empty progress and overwrote
  the Sheet. Now only a device with lesson checks from before Nov 2 (his
  phone) sends updates, and his phone resends everything once to fix it.
- `?demo` at the end of the link opens a copy with sample progress. It saves
  separately, never touches his data, and never sends anything.

### Nov 2 · Demo Sheet
- The `?demo` link can report to its own demo Sheet, using
  `progress-sheet/Code-demo.gs` (same script, different Sheet, never emails).
  It stays off until that script is deployed. The README's link now opens the
  demo.
