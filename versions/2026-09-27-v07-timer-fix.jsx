// Guri's SHSAT Quest Log
// A daily checklist app I built for my younger brother while he preps for the SHSAT.
// It swaps out what it shows based on the day of the week (school days vs. Khan's
// tutoring days), tracks his study sessions with real start/break/finish times,
// and remembers his progress across days using a simple key-value store.
//
// Built with React (hooks only, no class components). Styled with plain JS style
// objects instead of a CSS file, since that's what runs cleanly as a single file.

import { useState, useEffect } from "react";

// ---- schedule data -------------------------------------------------
// I keep the actual schedule as plain data (arrays of objects) instead of hard-coding
// it into the JSX. That way the rendering code below just loops over whichever list
// applies to today - adding a new task later just means adding one object here, not
// touching any component.
// Each task is either:
//   - a "session" task: has a Start / Break / Finish tracker that logs real times
//     (goal = minutes to aim for, cap = a hard limit, used for phone time)
//   - a plain check-off task: no session field, he just taps the box when it happens
const WEEKDAY_TASKS = [
  { id: "home", time: "—", title: "Home from school", desc: "Snack, relax, decompress. No set length.", xp: 5 },
  { id: "block1", time: "~90 min", title: "Study Block 1", desc: "Kaplan pages. Check your answers every couple pages, post-it the ones you miss.", xp: 25, session: { kind: "goal", minutes: 90 } },
  { id: "phone", time: "60 min max", title: "Phone", desc: "Capped at an hour.", xp: 10, session: { kind: "cap", minutes: 60 } },
  { id: "kindle", time: "1hr+", title: "Kindle", desc: "At least an hour. More is great, no cap on this one.", xp: 10 },
  { id: "block2", time: "~90 min", title: "Study Block 2", desc: "Same as Block 1, keep going where you left off.", xp: 25, session: { kind: "goal", minutes: 90 } },
  { id: "dinner", time: "30–60 min", title: "Dinner", desc: "Whenever it's ready.", xp: 5 },
  { id: "block3", time: "~45 min", title: "Study Block 3 (after dinner)", desc: "Shorter one. Finish the section you're on. Done by 10:30.", xp: 20, session: { kind: "goal", minutes: 45 } },
];

const KHANS_SAT_TASKS = [
  { id: "nophone", time: "morning", title: "No phone before Khan's", desc: "Kindle in the morning is fine. Walk in with a fresh brain.", xp: 10 },
  { id: "class", time: "10:00–1:30", title: "Khan's class", desc: "Lock in for the full session.", xp: 20 },
  { id: "homeeat", time: "—", title: "Home, eat, relax", desc: "No set length.", xp: 5 },
  { id: "block1", time: "~90 min", title: "Study Block 1", desc: "Kaplan pages. Check every couple pages, post-it the misses.", xp: 25, session: { kind: "goal", minutes: 90 } },
  { id: "phone", time: "60 min max", title: "Phone", desc: "Capped at an hour.", xp: 5, session: { kind: "cap", minutes: 60 } },
  { id: "kindle", time: "1hr+", title: "Kindle", desc: "At least an hour, no cap.", xp: 10 },
  { id: "block2", time: "~90 min", title: "Study Block 2", desc: "Keep going where you left off.", xp: 20, session: { kind: "goal", minutes: 90 } },
  { id: "dinner", time: "30–60 min", title: "Dinner", desc: "Whenever it's ready. Rest of the night is free, done by 10:30.", xp: 5 },
];

// Sunday: different class time, and it's the one day for the weekly post-it redo.
const KHANS_SUN_TASKS = [
  { id: "nophone", time: "morning", title: "No phone before Khan's", desc: "Kindle in the morning is fine. Walk in with a fresh brain.", xp: 10 },
  { id: "class", time: "11:00–2:00", title: "Khan's class", desc: "Lock in for the full session.", xp: 15 },
  { id: "homeeat", time: "—", title: "Home, eat, relax", desc: "No set length.", xp: 5 },
  { id: "block1", time: "~90 min", title: "Study Block 1", desc: "Kaplan pages. Check every couple pages, post-it the misses.", xp: 20, session: { kind: "goal", minutes: 90 } },
  { id: "phone", time: "60 min max", title: "Phone", desc: "Capped at an hour.", xp: 5, session: { kind: "cap", minutes: 60 } },
  { id: "kindle", time: "1hr+", title: "Kindle", desc: "At least an hour, no cap.", xp: 10 },
  { id: "block2", time: "~60 min", title: "Study Block 2", desc: "Keep going where you left off.", xp: 15, session: { kind: "goal", minutes: 60 } },
  { id: "postit", time: "~30 min", title: "Post-it Redo (weekly)", desc: "Flip to every page with a post-it and try it again. Got it? Rip it out. Missed it? It stays.", xp: 15, session: { kind: "goal", minutes: 30 } },
  { id: "dinner", time: "30–60 min", title: "Dinner", desc: "Rest of the night is free, done by 10:30.", xp: 5 },
];

// getDay() returns 0-6 for Sunday-Saturday, so this object is basically a lookup
// table: "if today is day X, use task list Y". Avoids a long if/else chain.
const DAY_TYPES = { 0: "khans_sun", 1: "weekday", 2: "weekday", 3: "weekday", 4: "weekday", 5: "weekday", 6: "khans_sat" };
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

function getTasks(dayType) {
  if (dayType === "weekday") return WEEKDAY_TASKS;
  if (dayType === "khans_sat") return KHANS_SAT_TASKS;
  return KHANS_SUN_TASKS;
}
// Turns a Date into "2026-09-15" so it can be used as a storage key. I build this
// by hand instead of using .toISOString() because that converts to UTC first,
// which can roll the date over to the wrong day depending on the time and timezone.
function dateKeyFor(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ---- root component --------------------------------------------------
export default function GuriQuestLog() {
  // All the shared state lives here and gets passed down as props. The app is
  // small enough that I didn't need Context or a state library - just one
  // component owning everything and handing pieces to its children.
  const [tab, setTab] = useState("today");
  const [checked, setChecked] = useState({});           // today's checkboxes, e.g. { block1: true }
  const [completedDates, setCompletedDates] = useState([]); // every "YYYY-MM-DD" he's fully cleared
  const [loaded, setLoaded] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [restoreInput, setRestoreInput] = useState("");
  const [restoreMsg, setRestoreMsg] = useState("");
  const [notes, setNotes] = useState([]);
  const [noteInput, setNoteInput] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  const now = new Date();
  const dayType = DAY_TYPES[now.getDay()];
  const dayName = DAY_NAMES[now.getDay()];
  const dateKey = dateKeyFor(now);
  const tasks = getTasks(dayType);
  const monthName = now.toLocaleString("en-US", { month: "long" }).toUpperCase();
  const sectionLabel = dayType === "weekday" ? "AFTER-SCHOOL QUESTS" : "KHAN'S DAY";
  const daysCleared = completedDates.length;

  // Runs once when the component first mounts, and again whenever dateKey changes
  // (i.e. it becomes a new day). That's how today's checkboxes reset automatically
  // without me writing any "is it a new day" logic myself - React just re-runs this
  // whenever the value in the dependency array is different from last time.
  useEffect(() => {
    (async () => {
      try { const r = await window.storage.get(`guri-day:${dateKey}`); if (r?.value) setChecked(JSON.parse(r.value)); } catch (e) {}
      try { const c = await window.storage.get("guri-completed-dates"); if (c?.value) setCompletedDates(JSON.parse(c.value)); } catch (e) {}
      try { const n = await window.storage.get("guri-notes"); if (n?.value) setNotes(JSON.parse(n.value)); } catch (e) {}
      setLoaded(true);
    })();
  }, [dateKey]);

  const doneCount = tasks.filter((t) => checked[t.id]).length;
  const totalXP = tasks.reduce((a, t) => a + t.xp, 0);
  const earnedXP = tasks.reduce((a, t) => a + (checked[t.id] ? t.xp : 0), 0);
  const pct = Math.round((earnedXP / totalXP) * 100);
  const allDone = doneCount === tasks.length;

  async function saveNotes(next) {
    setNotes(next);
    try { await window.storage.set("guri-notes", JSON.stringify(next)); } catch (e) {}
  }
  function addNote() {
    const text = noteInput.trim();
    if (!text) return;
    const d = new Date();
    const stamp = `${DAY_NAMES[d.getDay()].slice(0, 3)} ${d.getMonth() + 1}/${d.getDate()}`;
    saveNotes([{ id: Date.now(), stamp, text }, ...notes]);
    setNoteInput("");
  }
  function deleteNote(id) { saveNotes(notes.filter((n) => n.id !== id)); }

  // Flips one quest's checked state and saves it. The { ...checked, [id]: ... }
  // part matters more than it looks - React decides whether to redraw by checking
  // if it got a *different* object, not by looking inside the old one. So I always
  // build a brand new object here instead of doing checked[id] = true directly.
  async function toggle(id) {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    try { await window.storage.set(`guri-day:${dateKey}`, JSON.stringify(next)); } catch (e) {}

    // Check if this toggle just finished (or un-finished) the whole day, and keep
    // the completedDates list in sync so the calendar tab and the streak count
    // never disagree with each other.
    const nowAllDone = tasks.every((t) => next[t.id]);
    const wasAllDone = tasks.every((t) => checked[t.id]);
    if (nowAllDone && !wasAllDone && !completedDates.includes(dateKey)) {
      const nextDates = [...completedDates, dateKey];
      setCompletedDates(nextDates);
      setJustUnlocked(true);
      try { await window.storage.set("guri-completed-dates", JSON.stringify(nextDates)); } catch (e) {}
      setTimeout(() => setJustUnlocked(false), 2400);
    } else if (!nowAllDone && wasAllDone && completedDates.includes(dateKey)) {
      const nextDates = completedDates.filter((d) => d !== dateKey);
      setCompletedDates(nextDates);
      try { await window.storage.set("guri-completed-dates", JSON.stringify(nextDates)); } catch (e) {}
    }
  }
  // Lets the timer finish a quest on its own without double-toggling something
  // he already checked off manually.
  function completeViaTimer(id) { if (!checked[id]) toggle(id); }

  async function restoreFromCode() {
    try {
      const data = JSON.parse(atob(restoreInput.trim()));
      if (data.g !== "guri" || !Array.isArray(data.d)) throw new Error("bad code");
      setCompletedDates(data.d);
      await window.storage.set("guri-completed-dates", JSON.stringify(data.d));
      setRestoreMsg(`✓ Restored — ${data.d.length} days cleared`);
      setRestoreInput("");
    } catch (e) {
      setRestoreMsg("✕ That code isn't right — check for typos");
    }
  }

  if (!loaded) {
    return (
      <div style={S.shell}>
        <style>{FONTS}</style>
        <div style={{ ...S.mono, color: "#7A8598", padding: 40, textAlign: "center" }}>loading quest log…</div>
      </div>
    );
  }

  return (
    <div style={S.shell}>
      <style>{FONTS}</style>
      <Header dayName={dayName} daysCleared={daysCleared} monthName={monthName} />
      <TabBar tab={tab} setTab={setTab} />

      {tab === "today" && (
        <TodayTab
          {...{ sectionLabel, pct, earnedXP, totalXP, tasks, checked, toggle, completeViaTimer, allDone, doneCount, justUnlocked, daysCleared, dateKey }}
        />
      )}
      {tab === "schedule" && <ScheduleTab />}
      {tab === "guide" && <GuideTab />}
      {tab === "calendar" && <CalendarTab completedDates={completedDates} todayKey={dateKey} />}

      <NotesPanel {...{ notes, noteInput, setNoteInput, showNotes, setShowNotes, addNote, deleteNote }} />
      <BackupPanel {...{ completedDates, showBackup, setShowBackup, restoreInput, setRestoreInput, restoreMsg, restoreFromCode }} />
      <Footer />
    </div>
  );
}

// ---- tab bar -----------------------------------------------------
function TabBar({ tab, setTab }) {
  const tabs = [
    { id: "today", label: "Today" },
    { id: "schedule", label: "Schedule" },
    { id: "guide", label: "Sticky Notes" },
    { id: "calendar", label: "Calendar" },
  ];
  return (
    <div style={S.tabBar}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          style={{ ...S.tabBtn, color: tab === t.id ? "#0B0E14" : "#8A94A8", background: tab === t.id ? "#6FA8FF" : "transparent" }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// Picks the colors for one quest card. Tasks with a session tracker get blue, tasks that
// are just "check it off when it happens" get green. Pulling
// this out of the .map() below instead of writing it all inline keeps that loop
// readable - it's just five lines of color math, not the whole point of the loop.
function getQuestColors(hasTimer, isChecked) {
  const accent = hasTimer ? "#2E6FF2" : "#3DDC97";
  const accentLight = hasTimer ? "#6FA8FF" : "#6FE3B4";
  const accentSoft = hasTimer ? "rgba(46,111,242,0.08)" : "rgba(61,220,151,0.08)";
  const uncheckedBorder = hasTimer ? "#1E2530" : "#17261F";
  const uncheckedBg = hasTimer ? "#12161F" : "#0F1713";
  return {
    border: isChecked ? accent : uncheckedBorder,
    background: isChecked ? accentSoft : uncheckedBg,
    checkboxBorder: isChecked ? accent : (hasTimer ? "#3A4356" : "#2A4A3E"),
    text: isChecked ? accentLight : null, // null means "use the normal unchecked text color"
  };
}

// ---- TODAY tab -----------------------------------------------------
function TodayTab({ sectionLabel, pct, earnedXP, totalXP, tasks, checked, toggle, completeViaTimer, allDone, doneCount, justUnlocked, daysCleared, dateKey }) {
  return (
    <>
      <div style={S.xpWrap}>
        <div style={S.xpLabelRow}>
          <span style={{ ...S.mono, fontSize: 11, color: "#7A8598", letterSpacing: 1.5 }}>{sectionLabel}</span>
          <span style={{ ...S.mono, fontSize: 11, color: pct === 100 ? "#F2C14E" : "#6FA8FF", letterSpacing: 1 }}>{earnedXP} / {totalXP} XP</span>
        </div>
        <div style={S.xpTrack}>
          <div style={{ ...S.xpFill, width: `${pct}%`, background: pct === 100 ? "linear-gradient(90deg,#F2C14E,#FFDD87)" : "linear-gradient(90deg,#2E6FF2,#6FA8FF)" }} />
        </div>
      </div>

      <div style={{ padding: "0 16px 10px", display: "flex", gap: 14 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: 3, background: "#2E6FF2", display: "inline-block" }} />
          <span style={{ ...S.mono, fontSize: 9.5, color: "#7A8598" }}>has a tracker</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: 3, background: "#3DDC97", display: "inline-block" }} />
          <span style={{ ...S.mono, fontSize: 9.5, color: "#7A8598" }}>just check it off</span>
        </span>
        <span style={{ ...S.mono, fontSize: 9.5, color: "#7A8598", marginLeft: "auto" }}>🌙 done by 10:30</span>
      </div>
      <div style={{ padding: "0 16px" }}>
        {tasks.map((t) => {
          const on = !!checked[t.id];
          const isFixed = !t.session;
          const colors = getQuestColors(!!t.session, on);
          return (
            <div key={t.id} style={{ ...S.quest, borderColor: colors.border, background: colors.background }}>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => toggle(t.id)} aria-label={on ? "Mark incomplete" : "Mark complete"}
                  style={{ ...S.checkbox, borderColor: colors.checkboxBorder, background: on ? colors.checkboxBorder : "transparent", cursor: "pointer" }}>
                  {on && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span>}
                </button>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ ...S.display, fontSize: 15, color: colors.text || "#E8ECF4", textDecorationLine: on ? "line-through" : "none", textDecorationColor: "#3A4356" }}>{t.title}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
                      {isFixed && <span style={{ ...S.mono, fontSize: 8, color: "#3DDC97", letterSpacing: 0.5, border: "1px solid #2A4A3E", borderRadius: 4, padding: "1px 4px" }}>JUST CHECK</span>}
                      <span style={{ ...S.mono, fontSize: 10, color: "#556075" }}>{t.time}</span>
                    </span>
                  </div>
                  <p style={{ ...S.body, fontSize: 12.5, color: on ? "#556075" : "#8A94A8", margin: "5px 0 0", lineHeight: 1.5 }}>{t.desc}</p>
                </div>
                <span style={{ ...S.mono, fontSize: 10, color: colors.text || "#556075", alignSelf: "flex-start", marginTop: 2 }}>+{t.xp}</span>
              </div>
              {/* Session tracker. The key includes the date so every day starts fresh,
                  and yesterday's log is still saved under yesterday's key. */}
              {t.session && (
                <SessionTracker
                  storageKey={`guri-session:${dateKey}:${t.id}`}
                  kind={t.session.kind}
                  minutes={t.session.minutes}
                  checked={on}
                  onFinish={() => completeViaTimer(t.id)}
                />
              )}
            </div>
          );
        })}
      </div>

      <div style={{ ...S.lockCard, borderColor: allDone ? "#F2C14E" : "#1E2530", background: allDone ? "rgba(242,193,78,0.07)" : "#0F131B" }}>
        <div style={S.psRow}>{["△", "○", "✕", "□"].map((s, i) => (<span key={i} style={{ ...S.psSym, color: allDone ? "#F2C14E" : "#3A4356", transition: "color 0.5s", transitionDelay: `${i * 0.1}s` }}>{s}</span>))}</div>
        <div style={{ ...S.display, fontSize: 22, letterSpacing: 2, marginTop: 10, color: allDone ? "#F2C14E" : "#556075" }}>{allDone ? "PS5 UNLOCKED" : "PS5 LOCKED"}</div>
        <p style={{ ...S.body, fontSize: 12.5, color: allDone ? "#C9B27A" : "#556075", margin: "6px 0 0" }}>
          {allDone ? "Done for the day. It's yours — guilt-free. Nobody says a word." : "It's still locked..."}
        </p>
      </div>

      {justUnlocked && (
        <div style={S.toast}><span style={{ ...S.display, fontSize: 14, letterSpacing: 1.5, color: "#0B0E14" }}>🏆 DAY CLEARED — {daysCleared} TOTAL</span></div>
      )}
    </>
  );
}

// ---- SCHEDULE tab (read-only, big-picture view) --------------------
function ScheduleTab() {
  const Row = ({ n, title, sub }) => (
    <div style={S.schedRow}>
      <div style={S.schedNum}>{n}</div>
      <div>
        <div style={{ ...S.display, fontSize: 14, color: "#E8ECF4" }}>{title}</div>
        {sub && <div style={{ ...S.body, fontSize: 12, color: "#8A94A8", marginTop: 2, lineHeight: 1.5 }}>{sub}</div>}
      </div>
    </div>
  );
  return (
    <div style={{ padding: "4px 16px 4px" }}>
      <SectionLabel text="MON – FRI (AFTER SCHOOL)" />
      <Row n="1" title="Home from school" sub="Snack, chill, decompress." />
      <Row n="2" title="Study Block 1 — ~90 min" />
      <Row n="3" title="Phone — 60 min max" />
      <Row n="4" title="Kindle — 1hr+" />
      <Row n="5" title="Study Block 2 — ~90 min" />
      <Row n="6" title="Dinner — 30–60 min" />
      <Row n="7" title="Study Block 3 — ~45 min" sub="Shorter one after dinner." />
      <Row n="8" title="Done by 10:30" sub="Kindle in bed is fine, then lights out." />

      <div style={{ height: 18 }} />
      <SectionLabel text="SATURDAY" />
      <Row n="1" title="No phone before class" sub="Kindle in the morning is fine." />
      <Row n="2" title="Khan's — 10:00–1:30" />
      <Row n="3" title="Home, eat, relax" />
      <Row n="4" title="Study Block 1 — ~90 min" />
      <Row n="5" title="Phone — 60 min max" />
      <Row n="6" title="Kindle — 1hr+" />
      <Row n="7" title="Study Block 2 — ~90 min" />
      <Row n="8" title="Dinner, then free until 10:30" />

      <div style={{ height: 18 }} />
      <SectionLabel text="SUNDAY" />
      <Row n="1" title="No phone before class" sub="Kindle in the morning is fine." />
      <Row n="2" title="Khan's — 11:00–2:00" />
      <Row n="3" title="Home, eat, relax" />
      <Row n="4" title="Study Block 1 — ~90 min" />
      <Row n="5" title="Phone — 60 min max" />
      <Row n="6" title="Kindle — 1hr+" />
      <Row n="7" title="Study Block 2 — ~60 min" />
      <Row n="8" title="Post-it Redo — ~30 min" sub="Once a week. Every post-it page, try it again." />
      <Row n="9" title="Dinner, then free until 10:30" />

      <div style={{ ...S.restRule, margin: "20px 0 4px" }}>
        <span style={{ ...S.mono, color: "#F2C14E", fontSize: 12, letterSpacing: 1 }}>⚠ THE DEAL</span>
        <p style={{ ...S.body, color: "#C9D2E0", margin: "6px 0 0", fontSize: 13, lineHeight: 1.55 }}>
          Work before games, every day. Clear the whole day's quests and the PS5 might be yours again.
        </p>
      </div>
    </div>
  );
}

// ---- STICKY NOTES guide tab -----------------------------------------
// Kept this short on purpose. The first version had 5 steps and a nightly review,
// and it was too much to remember mid-study. This is the version he actually does.
function GuideTab() {
  const Step = ({ n, title, desc, tip }) => (
    <div style={S.guideCard}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div style={S.guideNum}>{n}</div>
        <div style={{ flex: 1 }}>
          <div style={{ ...S.display, fontSize: 15, color: "#E8ECF4" }}>{title}</div>
          <p style={{ ...S.body, fontSize: 13, color: "#B8C2D4", margin: "6px 0 0", lineHeight: 1.6 }}>{desc}</p>
          {tip && <div style={S.guideTip}>{tip}</div>}
        </div>
      </div>
    </div>
  );
  return (
    <div style={{ padding: "4px 16px 4px" }}>
      <p style={{ ...S.body, fontSize: 13, color: "#8A94A8", lineHeight: 1.6, margin: "4px 0 16px" }}>
        How to check your Kaplan work. Three steps, that's it.
      </p>
      <Step n="1" title="Do a couple pages" desc="Answer key closed while you work. Finish 2–3 pages before you check anything." tip="Don't check after every single question. On the real test you can't go back and change answers, so practice committing to one and moving on." />
      <Step n="2" title="Check right away" desc="Flip to the answer key. Got one wrong? Read the explanation until you actually get WHY, not just what the right letter is." />
      <Step n="3" title="Post-it it" desc="Stick a post-it on the question you missed. Write one line on it: what you messed up. Like 'forgot the negative sign' or 'didn't reread the question.'" />
      <Step n="★" title="Sunday: Post-it Redo" desc="Once a week, go through every page with a post-it and try the question again. Got it? Rip the post-it out, it's fixed. Missed it again? It stays for next Sunday." />
    </div>
  );
}

// ---- CALENDAR tab -----------------------------------------------------
function CalendarTab({ completedDates, todayKey }) {
  const [offset, setOffset] = useState(0); // how many months forward/back from today
  const base = new Date();
  const viewDate = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthLabel = viewDate.toLocaleString("en-US", { month: "long", year: "numeric" });
  const firstWeekday = new Date(year, month, 1).getDay(); // which weekday the 1st falls on, so I know how many blank cells to pad the grid with
  // Little date trick: "day 0" of next month rolls back to the last day of THIS month.
  // That's the easiest way in plain JS to find out how many days a month has.
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null); // blank cells before day 1
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const completedSet = new Set(completedDates);
  const keyFor = (d) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const monthClearedCount = cells.filter((d) => d && completedSet.has(keyFor(d))).length;

  return (
    <div style={{ padding: "4px 16px 4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <button onClick={() => setOffset((o) => o - 1)} style={S.navBtn}>‹</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ ...S.display, fontSize: 16, color: "#E8ECF4" }}>{monthLabel}</div>
          <div style={{ ...S.mono, fontSize: 10, color: "#7A8598", marginTop: 2 }}>{monthClearedCount} day{monthClearedCount === 1 ? "" : "s"} cleared</div>
        </div>
        <button onClick={() => setOffset((o) => o + 1)} style={S.navBtn}>›</button>
      </div>

      <div style={S.calGrid}>
        {DAY_SHORT.map((d, i) => (<div key={i} style={S.calDow}>{d}</div>))}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const k = keyFor(d);
          const isToday = k === todayKey;
          const isDone = completedSet.has(k);
          return (
            <div key={i} style={{ ...S.calCell, borderColor: isToday ? "#6FA8FF" : "transparent", background: isDone ? "rgba(242,193,78,0.12)" : "transparent" }}>
              <span style={{ ...S.mono, fontSize: 11, color: isDone ? "#F2C14E" : isToday ? "#6FA8FF" : "#8A94A8" }}>{d}</span>
              {isDone && <span style={{ fontSize: 9, color: "#F2C14E", marginTop: 1 }}>✓</span>}
            </div>
          );
        })}
      </div>

      <p style={{ ...S.body, fontSize: 11.5, color: "#556075", textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
        Gold = full day cleared. Blue outline = today.
      </p>
    </div>
  );
}

function SectionLabel({ text }) {
  return <div style={{ ...S.mono, fontSize: 10, letterSpacing: 2, color: "#556075", margin: "2px 0 10px" }}>{text}</div>;
}

// ---- session tracker -------------------------------------------------
// Replaced the old countdown timer. That one ran on setTimeout, which phones pause
// when the screen turns off, so it would freeze or lose time. This version never
// "counts" anything. It just saves timestamps (when he started, took a break, came
// back, finished) and figures out the elapsed time from the clock whenever it draws.
// So the screen can lock, the app can close, and the numbers are still right
// when he comes back.
function SessionTracker({ storageKey, kind, minutes, checked, onFinish }) {
  const [log, setLog] = useState([]); // e.g. [{ type: "start", at: 1726... }, { type: "break", at: ... }]
  const [now, setNow] = useState(Date.now());
  const [loaded, setLoaded] = useState(false);

  // load this session's saved log (if any) when the tracker first shows up
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(storageKey);
        if (r?.value) setLog(JSON.parse(r.value));
      } catch (e) {}
      setLoaded(true);
    })();
  }, [storageKey]);

  const last = log.length ? log[log.length - 1].type : null;
  const status = !last ? "idle" : last === "finish" ? "done" : last === "break" ? "break" : "working";

  // Only job of this interval: redraw once a second so the numbers move.
  // If the phone pauses it, nothing is lost, since the math uses timestamps.
  useEffect(() => {
    if (status !== "working" && status !== "break") return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [status]);

  async function addEvent(type) {
    const next = [...log, { type, at: Date.now() }];
    setLog(next);
    setNow(Date.now());
    try { await window.storage.set(storageKey, JSON.stringify(next)); } catch (e) {}
    if (type === "finish") onFinish && onFinish();
  }
  async function reset() {
    setLog([]);
    try { await window.storage.set(storageKey, JSON.stringify([])); } catch (e) {}
  }

  if (!loaded) return null;
  // If he checked it off by hand without ever starting the tracker, hide it.
  if (checked && status === "idle") return null;

  const { workMs, breakMs, breakCount } = sumSession(log, now);
  const goalMs = minutes * 60 * 1000;
  const isCap = kind === "cap";
  const pctDone = Math.min(100, (workMs / goalMs) * 100);
  const capLeft = goalMs - workMs;

  const bigLabel = isCap ? (capLeft > 0 ? "LEFT" : "TIME'S UP") : "STUDIED";
  const bigValue = isCap ? formatDuration(Math.max(0, capLeft)) : formatDuration(workMs);
  const bigColor = isCap && capLeft <= 0 ? "#E06C6C" : status === "working" ? "#6FA8FF" : "#C9D2E0";

  return (
    <div style={S.timerBox}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ ...S.mono, fontSize: 10, color: "#7A8598", letterSpacing: 0.5 }}>
          {bigLabel}
          {status === "break" && <span style={{ color: "#F2C14E" }}> · ON BREAK</span>}
        </span>
        <span style={{ ...S.display, fontSize: 20, color: bigColor }}>{bigValue}</span>
      </div>

      {/* progress toward the goal (or how much of the cap is used) */}
      <div style={{ ...S.xpTrack, height: 5, marginTop: 7 }}>
        <div style={{ height: "100%", width: `${pctDone}%`, background: isCap ? (capLeft <= 0 ? "#E06C6C" : "#6FA8FF") : pctDone >= 100 ? "#F2C14E" : "#2E6FF2", transition: "width 0.4s" }} />
      </div>
      <div style={{ ...S.mono, fontSize: 9.5, color: "#556075", marginTop: 5 }}>
        {isCap ? `${minutes} min max` : pctDone >= 100 ? `goal hit ✓ — finish at a good stopping point` : `goal ${minutes} min`}
        {breakCount > 0 && ` · ${breakCount} break${breakCount === 1 ? "" : "s"} (${formatDuration(breakMs)})`}
      </div>

      {/* buttons change depending on where he is in the session */}
      {status !== "done" && (
        <div style={{ display: "flex", gap: 8, marginTop: 9 }}>
          {status === "idle" && <button onClick={() => addEvent("start")} style={S.timerBtnPrimary}>▶ Start</button>}
          {status === "working" && (
            <button onClick={() => addEvent("break")} style={S.timerBtnBreak}>{isCap ? "⏸ Pause" : "☕ Break"}</button>
          )}
          {status === "break" && <button onClick={() => addEvent("resume")} style={S.timerBtnPrimary}>▶ Back to it</button>}
          {status !== "idle" && <button onClick={() => addEvent("finish")} style={S.timerBtnGhost}>■ {isCap ? "Done" : "Finish"}</button>}
        </div>
      )}

      {/* the actual time log */}
      {log.length > 0 && (
        <div style={{ marginTop: 9 }}>
          {log.map((e, i) => (
            <div key={i} style={{ ...S.mono, fontSize: 10, color: "#7A8598", lineHeight: 1.7 }}>
              {EVENT_LABELS[e.type]} {formatClock(e.at)}
            </div>
          ))}
        </div>
      )}

      {status === "done" && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
          <span style={{ ...S.mono, fontSize: 10.5, color: "#F2C14E" }}>✓ Logged</span>
          <button onClick={reset} style={{ ...S.mono, fontSize: 10, color: "#556075", background: "none", border: "none", cursor: "pointer", padding: 0 }}>↺ reset</button>
        </div>
      )}
    </div>
  );
}

const EVENT_LABELS = { start: "▶ started", break: "☕ break", resume: "▶ back", finish: "■ finished" };

// Walks the log in order and adds up working time vs. break time.
// "now" is used for whatever's still in progress (the current work or break stretch).
function sumSession(log, now) {
  let workMs = 0, breakMs = 0, breakCount = 0;
  let mode = null, since = 0;
  for (const e of log) {
    if (mode === "work") workMs += e.at - since;
    if (mode === "break") breakMs += e.at - since;
    if (e.type === "start" || e.type === "resume") mode = "work";
    else if (e.type === "break") { mode = "break"; breakCount++; }
    else if (e.type === "finish") mode = null;
    since = e.at;
  }
  if (mode === "work") workMs += now - since;
  if (mode === "break") breakMs += now - since;
  return { workMs, breakMs, breakCount };
}

// 5025000 ms -> "1:23:45", 125000 -> "2:05"
function formatDuration(ms) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function formatClock(ms) {
  return new Date(ms).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function NotesPanel({ notes, noteInput, setNoteInput, showNotes, setShowNotes, addNote, deleteNote }) {
  return (
    <div style={{ padding: "16px 16px 0" }}>
      <button onClick={() => setShowNotes(!showNotes)} style={{ ...S.mono, fontSize: 10, letterSpacing: 1, color: "#7A8598", background: "#0F131B", border: "1px solid #1E2530", borderRadius: 10, cursor: "pointer", padding: "10px 0", width: "100%", textAlign: "center" }}>
        {showNotes ? `▴ NOTES (${notes.length})` : `▾ NOTES — problems, complaints, anything (${notes.length})`}
      </button>
      {showNotes && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={noteInput} onChange={(e) => setNoteInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addNote(); }}
              placeholder="e.g. packet Q14 made no sense"
              style={{ ...S.body, flex: 1, fontSize: 13, color: "#E8ECF4", background: "#12161F", border: "1px solid #1E2530", borderRadius: 8, padding: "10px 11px", outline: "none", minWidth: 0 }} />
            <button onClick={addNote} disabled={!noteInput.trim()} style={{ ...S.display, fontSize: 12, letterSpacing: 1, color: noteInput.trim() ? "#0B0E14" : "#556075", background: noteInput.trim() ? "#6FA8FF" : "#1E2530", border: "none", borderRadius: 8, padding: "10px 14px", cursor: noteInput.trim() ? "pointer" : "default" }}>ADD</button>
          </div>
          {notes.length === 0 ? (
            <p style={{ ...S.body, fontSize: 12, color: "#556075", textAlign: "center", padding: "14px 0 4px" }}>Nothing yet. Stuck on something? Class issue? Drop it here so it doesn't get forgotten.</p>
          ) : (
            <div style={{ marginTop: 10 }}>
              {notes.map((n) => (
                <div key={n.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#0F131B", border: "1px solid #1E2530", borderRadius: 10, padding: "10px 12px", marginBottom: 7 }}>
                  <span style={{ ...S.mono, fontSize: 9.5, color: "#556075", whiteSpace: "nowrap", marginTop: 2 }}>{n.stamp}</span>
                  <span style={{ ...S.body, fontSize: 12.5, color: "#C9D2E0", flex: 1, lineHeight: 1.5, wordBreak: "break-word" }}>{n.text}</span>
                  <button onClick={() => deleteNote(n.id)} style={{ background: "none", border: "none", color: "#3A4356", cursor: "pointer", fontSize: 13, padding: "0 2px" }} aria-label="Delete note">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BackupPanel({ completedDates, showBackup, setShowBackup, restoreInput, setRestoreInput, restoreMsg, restoreFromCode }) {
  // btoa() base64-encodes the JSON string so it's one copy-pasteable block of text.
  // Important: this is just encoding, NOT encryption - anyone could decode it in two
  // seconds with atob(). It's only here so his whole history can survive a future
  // update to a new version of the app, not to keep the data secret.
  const code = btoa(JSON.stringify({ g: "guri", d: completedDates }));
  const [copyState, setCopyState] = useState("idle");
  async function copyCode() {
    try { if (!navigator.clipboard) throw new Error("no clipboard"); await navigator.clipboard.writeText(code); setCopyState("copied"); }
    catch (e) { setCopyState("manual"); }
    setTimeout(() => setCopyState("idle"), 2500);
  }
  return (
    <div style={{ padding: "10px 16px 0" }}>
      <button onClick={() => setShowBackup(!showBackup)} style={{ ...S.mono, fontSize: 10, letterSpacing: 1, color: "#556075", background: "none", border: "none", cursor: "pointer", padding: "6px 0", width: "100%", textAlign: "center" }}>
        {showBackup ? "▴ HIDE BACKUP" : "▾ BACKUP / TRANSFER STREAK"}
      </button>
      {showBackup && (
        <div style={{ border: "1px solid #1E2530", borderRadius: 12, padding: "14px 14px", background: "#0F131B", marginTop: 4 }}>
          <div style={{ ...S.mono, fontSize: 10, letterSpacing: 1.5, color: "#7A8598" }}>YOUR TRANSFER CODE</div>
          <p style={{ ...S.body, fontSize: 11.5, color: "#8A94A8", margin: "5px 0 8px", lineHeight: 1.5 }}>If this app ever gets updated to a new version, copy this code (or screenshot it) and paste it into the new one to keep your whole calendar and streak.</p>
          <button onClick={copyCode} style={{ ...S.mono, fontSize: 12, color: "#6FA8FF", background: "#12161F", border: "1px solid #2E6FF2", borderRadius: 8, padding: "9px 12px", width: "100%", cursor: "pointer", wordBreak: "break-all", textAlign: "left", userSelect: "text" }}>
            {code}
            <span style={{ display: "block", fontSize: 9, color: copyState === "idle" ? "#556075" : "#F2C14E", marginTop: 5, letterSpacing: 1 }}>
              {copyState === "copied" ? "✓ COPIED" : copyState === "manual" ? "COPY BLOCKED — SCREENSHOT THIS INSTEAD" : "TAP TO COPY"}
            </span>
          </button>
          <div style={{ ...S.mono, fontSize: 10, letterSpacing: 1.5, color: "#7A8598", marginTop: 16 }}>RESTORE A STREAK</div>
          <div style={{ display: "flex", gap: 8, marginTop: 7 }}>
            <input value={restoreInput} onChange={(e) => setRestoreInput(e.target.value)} placeholder="paste code here"
              style={{ ...S.mono, flex: 1, fontSize: 12, color: "#E8ECF4", background: "#12161F", border: "1px solid #1E2530", borderRadius: 8, padding: "9px 10px", outline: "none", minWidth: 0 }} />
            <button onClick={restoreFromCode} disabled={!restoreInput.trim()} style={{ ...S.display, fontSize: 12, letterSpacing: 1, color: restoreInput.trim() ? "#0B0E14" : "#556075", background: restoreInput.trim() ? "#6FA8FF" : "#1E2530", border: "none", borderRadius: 8, padding: "9px 14px", cursor: restoreInput.trim() ? "pointer" : "default" }}>RESTORE</button>
          </div>
          {restoreMsg && <div style={{ ...S.mono, fontSize: 11, color: restoreMsg.startsWith("✓") ? "#F2C14E" : "#E06C6C", marginTop: 8 }}>{restoreMsg}</div>}
        </div>
      )}
    </div>
  );
}

function Header({ dayName, daysCleared, monthName }) {
  return (
    <div style={S.header}>
      <div>
        <div style={{ ...S.mono, fontSize: 10, letterSpacing: 3, color: "#556075" }}>SHSAT GRIND · {monthName}</div>
        <div style={{ ...S.display, fontSize: 26, color: "#E8ECF4", marginTop: 3 }}>GURI<span style={{ color: "#2E6FF2" }}>.</span> <span style={{ fontSize: 15, color: "#7A8598", fontWeight: 400 }}>{dayName}</span></div>
      </div>
      <div style={S.streakBadge}>
        <div style={{ ...S.display, fontSize: 20, color: "#F2C14E", lineHeight: 1 }}>{daysCleared}</div>
        <div style={{ ...S.mono, fontSize: 8.5, letterSpacing: 1, color: "#7A8598", marginTop: 2 }}>DAYS CLEARED</div>
      </div>
    </div>
  );
}

function Footer() {
  return <p style={{ ...S.mono, fontSize: 10, color: "#3A4356", textAlign: "center", padding: "18px 20px 26px", letterSpacing: 0.5, lineHeight: 1.7 }}>work before games, every day · sticky note &gt; a wall of notes nobody rereads</p>;
}

// ---- styles --------------------------------------------------------
const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
body { margin: 0; background: #0B0E14; }
@keyframes toastIn { from { opacity: 0; transform: translate(-50%, 14px); } to { opacity: 1; transform: translate(-50%, 0); } }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
`;

const S = {
  shell: { minHeight: "100vh", background: "#0B0E14", fontFamily: "'Inter', sans-serif", maxWidth: 480, margin: "0 auto", position: "relative" },
  display: { fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700 },
  body: { fontFamily: "'Inter', sans-serif" },
  mono: { fontFamily: "'JetBrains Mono', monospace" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 18px 12px" },
  streakBadge: { border: "1px solid #1E2530", borderRadius: 10, padding: "8px 12px", textAlign: "center", background: "#0F131B" },
  tabBar: { display: "flex", gap: 6, padding: "0 16px 14px", overflowX: "auto" },
  tabBtn: { ...{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700 }, fontSize: 11.5, letterSpacing: 0.5, border: "none", borderRadius: 20, padding: "8px 14px", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s" },
  xpWrap: { padding: "4px 18px 16px" },
  xpLabelRow: { display: "flex", justifyContent: "space-between", marginBottom: 6 },
  xpTrack: { height: 8, borderRadius: 4, background: "#161B26", overflow: "hidden", border: "1px solid #1E2530" },
  xpFill: { height: "100%", borderRadius: 4, transition: "width 0.45s cubic-bezier(0.22,1,0.36,1)" },
  quest: { width: "100%", padding: "13px 13px", marginBottom: 9, borderRadius: 12, border: "1px solid", transition: "all 0.2s", fontFamily: "inherit" },
  checkbox: { width: 22, height: 22, minWidth: 22, borderRadius: 7, border: "2px solid", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2, transition: "all 0.2s", padding: 0 },
  lockCard: { margin: "14px 16px 0", padding: "20px 16px", borderRadius: 14, border: "1px dashed", textAlign: "center", transition: "all 0.4s" },
  psRow: { display: "flex", justifyContent: "center", gap: 14 },
  psSym: { fontSize: 16, fontFamily: "'Chakra Petch', sans-serif", fontWeight: 600 },
  toast: { position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(90deg,#F2C14E,#FFDD87)", padding: "11px 20px", borderRadius: 30, animation: "toastIn 0.35s ease", zIndex: 50, whiteSpace: "nowrap", boxShadow: "0 6px 24px rgba(242,193,78,0.35)" },
  timerBox: { marginTop: 11, paddingTop: 11, borderTop: "1px solid #1E2530" },
  timerBtnPrimary: { flex: 1, fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 1, color: "#0B0E14", background: "#6FA8FF", border: "none", borderRadius: 8, padding: "8px 0", cursor: "pointer" },
  timerBtnBreak: { flex: 1, fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 1, color: "#0B0E14", background: "#F2C14E", border: "none", borderRadius: 8, padding: "8px 0", cursor: "pointer" },
  timerBtnGhost: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#7A8598", background: "transparent", border: "1px solid #2A3242", borderRadius: 8, padding: "8px 12px", cursor: "pointer" },
  schedRow: { display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" },
  schedNum: { width: 22, height: 22, minWidth: 22, borderRadius: 6, background: "#161B26", border: "1px solid #2A3242", color: "#6FA8FF", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 },
  restRule: { padding: "14px 16px", borderRadius: 12, border: "1px solid rgba(242,193,78,0.3)", background: "rgba(242,193,78,0.05)", textAlign: "left" },
  guideCard: { border: "1px solid #1E2530", borderRadius: 12, background: "#12161F", padding: "14px 14px", marginBottom: 10 },
  guideNum: { width: 24, height: 24, minWidth: 24, borderRadius: "50%", background: "#2E6FF2", color: "#fff", fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 },
  guideTip: { marginTop: 8, padding: "8px 10px", borderRadius: 8, background: "rgba(242,193,78,0.08)", border: "1px solid rgba(242,193,78,0.25)", fontFamily: "'Inter', sans-serif", fontSize: 11.5, color: "#D9C88A", lineHeight: 1.5 },
  navBtn: { width: 32, height: 32, borderRadius: 8, border: "1px solid #1E2530", background: "#12161F", color: "#8A94A8", fontSize: 16, cursor: "pointer" },
  calGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 },
  calDow: { textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: "#556075", padding: "4px 0" },
  calCell: { aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "1px solid" },
};
