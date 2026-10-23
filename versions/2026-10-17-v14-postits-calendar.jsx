// Guri's SHSAT Quest Log
// A daily tracker app I built for my younger brother while he preps for the SHSAT.
// It tracks what he studied and for how long (Kaplan Math / ELA, school homework,
// Khan's homework), how long he was on his phone, and a few simple checkboxes for
// the rest of his day. His PS5 unlocks once he hits his Kaplan goal and checks
// everything off.
//
// Built with React (hooks only, no class components). Styled with plain JS style
// objects instead of a CSS file, since that's what runs cleanly as a single file.
//
// Timers never "count" - they save timestamps (start, break, back, stop) and work
// out the totals from the clock whenever they draw. That's what lets the phone
// sleep or the app close without losing any time.

import { useState, useEffect } from "react";

// ---- what he can study ------------------------------------------------
const CATEGORIES = {
  math:   { label: "Kaplan Math", short: "Math",      emoji: "📐", kaplan: true },
  ela:    { label: "Kaplan ELA",  short: "ELA",       emoji: "📖", kaplan: true },
  school: { label: "School HW",   short: "School HW", emoji: "🏫" },
  khans:  { label: "Khan's HW",   short: "Khan's HW", emoji: "📝" },
};
const CAT_ORDER = ["math", "ela", "school", "khans"];

const KAPLAN_GOAL_MIN = 120; // needed for the PS5
const KAPLAN_AIM_MIN = 150;  // what to actually aim for
const PHONE_AIM_MIN = 120;   // try to stay under this
const PHONE_CAP_MIN = 150;   // hard max

// ---- the green check-off items ------------------------------------------
// Each day's checks are split by where they show on screen, so they sit next to
// the thing they're about:
//   top     - before the work boxes (home from school, Khan's class...)
//   school  - inside the School work box
//   kaplan  - inside the Kaplan box
//   bottom  - after the work boxes (Kindle, dinner)
const C = {
  home:     { id: "home",     title: "Home from school",       desc: "Snack, relax, decompress." },
  schoolhw: { id: "schoolhw", title: "Homework done",          desc: "Whatever's due tomorrow." },
  schoolmon:{ id: "schoolhw", title: "Homework for Monday done", desc: "Get it out of the way." },
  checked:  { id: "checked",  title: "Checked my answers",     desc: "Marked every one right/wrong, figured out the wrong ones, post-its on. Redid today's post-its at the end." },
  postit:   { id: "postit",   title: "Post-its still left",    desc: "Redo every post-it still in the book. Got it? Take it off. Missed it? It stays." },
  kindle:   { id: "kindle",   title: "Kindle 1hr+",            desc: "No cap on this one." },
  dinner:   { id: "dinner",   title: "Dinner",                 desc: "Whenever it's ready." },
  nophone:  { id: "nophone",  title: "No phone before Khan's", desc: "Kindle in the morning is fine." },
  homeeat:  { id: "homeeat",  title: "Home, eat, relax",       desc: "No set length." },
  handin:   { id: "handin",   title: "Handed in Khan's HW",    desc: "Last week's set. New one starts today." },
};
const DAY_PLANS = {
  weekday: {
    label: "SCHOOL DAY",
    top: [C.home], school: [C.schoolhw], kaplan: [C.checked], bottom: [C.kindle, C.dinner],
  },
  khans_sat: {
    label: "KHAN'S DAY · 10:00–1:30",
    top: [C.nophone, { id: "class", title: "Khan's class", desc: "10:00–1:30. Lock in." }, C.handin, C.homeeat],
    school: [], kaplan: [C.checked], bottom: [C.kindle, C.dinner],
  },
  khans_sun: {
    label: "KHAN'S DAY · 11:00–2:00",
    top: [C.nophone, { id: "class", title: "Khan's class", desc: "11:00–2:00. Lock in." }, C.homeeat],
    school: [C.schoolmon], kaplan: [C.checked, C.postit], bottom: [C.kindle, C.dinner],
  },
};
const allChecks = (plan) => [...plan.top, ...plan.school, ...plan.kaplan, ...plan.bottom];

const KHANS_DEFAULT_TOTAL = 30; // questions per weekly set - editable in the app

// getDay() returns 0-6 for Sunday-Saturday, so this is a lookup table for which plan to use.
const DAY_TYPES = { 0: "khans_sun", 1: "weekday", 2: "weekday", 3: "weekday", 4: "weekday", 5: "weekday", 6: "khans_sat" };
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

// "2026-09-15" style key. Built by hand instead of .toISOString() because that
// converts to UTC first, which can roll the date over late at night.
function dateKeyFor(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ---- time math -----------------------------------------------------------
// The study log is a list of events like:
//   { type: "start", cat: "math", at }  { type: "break", at }  { type: "resume", at }  { type: "stop", at }
// This walks it in order and adds up time per category, plus break time.
function readStudy(log, now) {
  const byCat = { math: 0, ela: 0, school: 0, khans: 0 };
  let breakMs = 0, breakCount = 0;
  let mode = null, cat = null, since = 0;
  for (const e of log) {
    if (mode === "work" && cat) byCat[cat] += e.at - since;
    if (mode === "break") breakMs += e.at - since;
    if (e.type === "start") { cat = e.cat; mode = "work"; }
    else if (e.type === "resume") mode = "work";
    else if (e.type === "break") { mode = "break"; breakCount++; }
    else if (e.type === "stop") mode = null;
    since = e.at;
  }
  if (mode === "work" && cat) byCat[cat] += now - since;
  if (mode === "break") breakMs += now - since;
  const status = mode === "work" ? "working" : mode === "break" ? "break" : "idle";
  return { byCat, breakMs, breakCount, status, cat: mode ? cat : null, sinceMs: mode ? now - since : 0 };
}
// Time of the last thing that happened in a log. Used as "now" for past days,
// so a session he forgot to stop doesn't count as running forever.
function lastAt(log) { return log.length ? log[log.length - 1].at : 0; }
// Phone is simpler - just start/stop.
function isPhoneOn(log) { return log.length > 0 && log[log.length - 1].type === "start"; }
function phoneTotal(log, now) {
  let total = 0, startedAt = null;
  for (const e of log) {
    if (e.type === "start") startedAt = e.at;
    else if (e.type === "stop" && startedAt !== null) { total += e.at - startedAt; startedAt = null; }
  }
  if (startedAt !== null) total += now - startedAt;
  return total;
}
// Turns the logs into rows like { kind: "math", start, end } for the time log at the bottom.
function toRows(times) {
  const rows = [];
  let cur = null, cat = null;
  const close = (at) => { if (cur) { cur.end = at; rows.push(cur); cur = null; } };
  for (const e of times.study) {
    if (e.type === "start") { close(e.at); cat = e.cat; cur = { kind: cat, start: e.at, end: null }; }
    else if (e.type === "resume") { close(e.at); cur = { kind: cat, start: e.at, end: null }; }
    else if (e.type === "break") { close(e.at); cur = { kind: "break", start: e.at, end: null }; }
    else if (e.type === "stop") close(e.at);
  }
  if (cur) rows.push(cur);
  let ps = null;
  for (const e of times.phone) {
    if (e.type === "start") ps = e.at;
    else if (e.type === "stop" && ps !== null) { rows.push({ kind: "phone", start: ps, end: e.at }); ps = null; }
  }
  if (ps !== null) rows.push({ kind: "phone", start: ps, end: null });
  return rows.sort((a, b) => a.start - b.start);
}
function formatDuration(ms) {
  const total = Math.floor(Math.max(0, ms) / 1000);
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
// Shorter version for summaries: 7800000 -> "2h 10m"
function formatShort(ms) {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60), m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}
function formatClock(ms) {
  return new Date(ms).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

const SPAM_TAPS = 5;        // this many taps...
const SPAM_WINDOW = 60000;  // ...inside one minute = he's just messing with the buttons
const EMPTY_TIMES = { study: [], phone: [] };

// ---- root component --------------------------------------------------
export default function GuriQuestLog() {
  const [tab, setTab] = useState("today");
  const [checked, setChecked] = useState({});        // today's green checkboxes
  const [times, setTimes] = useState(EMPTY_TIMES);   // today's timer logs
  const [weekPast, setWeekPast] = useState([]);      // earlier days this week (Sat → yesterday), for the weekly totals
  const [khansQ, setKhansQ] = useState({ done: 0, total: KHANS_DEFAULT_TOTAL }); // this week's Khan's HW questions
  const [weekDone, setWeekDone] = useState({}); // this week's Kaplan plan checks, e.g. { m1: true }
  const [now, setNow] = useState(Date.now());
  const [completedDates, setCompletedDates] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [restoreInput, setRestoreInput] = useState("");
  const [restoreMsg, setRestoreMsg] = useState("");
  const [notes, setNotes] = useState([]);
  const [noteInput, setNoteInput] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  const today = new Date();
  const dayIdx = today.getDay();
  const dayType = DAY_TYPES[dayIdx];
  const dayName = DAY_NAMES[dayIdx];
  const dateKey = dateKeyFor(today);
  const plan = DAY_PLANS[dayType];
  const monthName = today.toLocaleString("en-US", { month: "long" }).toUpperCase();
  const daysCleared = completedDates.length;
  const timesKey = (k) => `guri-study:${k}`;
  // The week runs Saturday → Friday, because Khan's HW is handed in and a new set
  // comes out every Saturday. daysIntoWeek: Sat = 0, Sun = 1, ... Fri = 6.
  const daysIntoWeek = (dayIdx + 1) % 7;
  const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysIntoWeek);
  const weekKey = dateKeyFor(weekStart);

  useEffect(() => {
    (async () => {
      try { const r = await window.storage.get(`guri-day:${dateKey}`); if (r?.value) setChecked(JSON.parse(r.value)); } catch (e) {}
      try { const t = await window.storage.get(timesKey(dateKey)); if (t?.value) setTimes(JSON.parse(t.value)); } catch (e) {}
      try { const c = await window.storage.get("guri-completed-dates"); if (c?.value) setCompletedDates(JSON.parse(c.value)); } catch (e) {}
      try { const n = await window.storage.get("guri-notes"); if (n?.value) setNotes(JSON.parse(n.value)); } catch (e) {}
      try { const q = await window.storage.get(`guri-khansq:${weekKey}`); if (q?.value) setKhansQ(JSON.parse(q.value)); } catch (e) {}
      try { const w = await window.storage.get(`guri-kaplanweek:${KAPLAN_PLAN.id}`); if (w?.value) setWeekDone(JSON.parse(w.value)); } catch (e) {}
      // earlier days this week, Saturday up to yesterday
      const past = [];
      for (let i = daysIntoWeek; i >= 1; i--) {
        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
        try { const t = await window.storage.get(timesKey(dateKeyFor(d))); if (t?.value) past.push(JSON.parse(t.value)); } catch (e) {}
      }
      setWeekPast(past);
      setLoaded(true);
    })();
  }, [dateKey]);

  // ---- numbers, always worked out fresh from the logs ----
  const study = readStudy(times.study, now);
  const kaplanMs = study.byCat.math + study.byCat.ela;
  const phoneMs = phoneTotal(times.phone, now);
  const phoneOn = isPhoneOn(times.phone);
  const kaplanDone = kaplanMs >= KAPLAN_GOAL_MIN * 60000;
  const checksDone = allChecks(plan).every((c) => checked[c.id]);
  const allDone = kaplanDone && checksDone;

  // this week = earlier days + today
  const week = { math: study.byCat.math, ela: study.byCat.ela, khans: study.byCat.khans };
  for (const t of weekPast) {
    const r = readStudy(t.study || [], lastAt(t.study || []));
    week.math += r.byCat.math; week.ela += r.byCat.ela; week.khans += r.byCat.khans;
  }

  const running = study.status !== "idle" || phoneOn;
  const recentTaps = [...times.study, ...times.phone].filter((e) => now - e.at < SPAM_WINDOW).length;
  const spamming = recentTaps >= SPAM_TAPS;

  // redraw once a second while something runs (display only - math uses timestamps)
  useEffect(() => {
    if (!running && !spamming) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running, spamming]);

  // keep the calendar's cleared-days list in sync. An effect instead of a click
  // handler because the Kaplan goal can get hit just by time passing.
  useEffect(() => {
    if (!loaded) return;
    const inList = completedDates.includes(dateKey);
    if (allDone && !inList) {
      const next = [...completedDates, dateKey];
      setCompletedDates(next);
      setJustUnlocked(true);
      setTimeout(() => setJustUnlocked(false), 2400);
      window.storage.set("guri-completed-dates", JSON.stringify(next)).catch(() => {});
    } else if (!allDone && inList) {
      const next = completedDates.filter((d) => d !== dateKey);
      setCompletedDates(next);
      window.storage.set("guri-completed-dates", JSON.stringify(next)).catch(() => {});
    }
  }, [allDone, loaded, dateKey]);

  async function saveTimes(next) {
    setTimes(next);
    setNow(Date.now());
    try { await window.storage.set(timesKey(dateKey), JSON.stringify(next)); } catch (e) {}
  }

  // Tap a subject: starts it. If something else was running (another subject,
  // a break, or phone), that gets stopped first.
  function startCat(cat) {
    if (study.status === "working" && study.cat === cat) return; // already doing it
    const t = Date.now();
    const s = [...times.study];
    const p = [...times.phone];
    if (study.status !== "idle") s.push({ type: "stop", at: t });
    if (phoneOn) p.push({ type: "stop", at: t });
    s.push({ type: "start", cat, at: t });
    saveTimes({ study: s, phone: p });
  }
  function takeBreak() { saveTimes({ ...times, study: [...times.study, { type: "break", at: Date.now() }] }); }
  function backToIt() { saveTimes({ ...times, study: [...times.study, { type: "resume", at: Date.now() }] }); }
  function stopStudy() { saveTimes({ ...times, study: [...times.study, { type: "stop", at: Date.now() }] }); }
  function togglePhone() {
    const t = Date.now();
    if (phoneOn) return saveTimes({ ...times, phone: [...times.phone, { type: "stop", at: t }] });
    const s = study.status !== "idle" ? [...times.study, { type: "stop", at: t }] : times.study;
    saveTimes({ study: s, phone: [...times.phone, { type: "start", at: t }] });
  }

  // Kaplan week checklist: saved under the plan's id, not today's date,
  // so checks carry over from one day to the next.
  // Saves the DATE it was checked (not just true), so the calendar can show
  // what got done on which day. Older checks saved as plain true still count as done.
  async function toggleWeek(id) {
    const next = { ...weekDone };
    if (next[id]) delete next[id];
    else next[id] = dateKey;
    setWeekDone(next);
    try { await window.storage.set(`guri-kaplanweek:${KAPLAN_PLAN.id}`, JSON.stringify(next)); } catch (e) {}
  }

  // Khan's HW question counter. Clamped so it can't go below 0 or past the total.
  async function updateKhansQ(changes) {
    const next = { ...khansQ, ...changes };
    next.total = Math.max(1, Math.min(200, Math.round(next.total) || KHANS_DEFAULT_TOTAL));
    next.done = Math.max(0, Math.min(next.total, Math.round(next.done) || 0));
    setKhansQ(next);
    try { await window.storage.set(`guri-khansq:${weekKey}`, JSON.stringify(next)); } catch (e) {}
  }

  // Spread into a brand new object instead of changing the old one, because
  // React only notices a change when it gets a different object.
  async function toggleCheck(id) {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    try { await window.storage.set(`guri-day:${dateKey}`, JSON.stringify(next)); } catch (e) {}
  }

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
        <div style={{ ...S.mono, color: "#7A8598", padding: 40, textAlign: "center" }}>loading…</div>
      </div>
    );
  }

  return (
    <div style={S.shell}>
      <style>{FONTS}</style>
      <Header dayName={dayName} daysCleared={daysCleared} monthName={monthName} />
      <TabBar tab={tab} setTab={setTab} />

      {tab === "today" && (
        <TodayTab {...{ weekDone, toggleWeek, todayKey: dateKey, plan, dayType, daysIntoWeek, checked, toggleCheck, times, study, kaplanMs, kaplanDone, week, khansQ, updateKhansQ, phoneMs, phoneOn, allDone, spamming, startCat, takeBreak, backToIt, stopStudy, togglePhone, justUnlocked, daysCleared }} />
      )}
      {tab === "todo" && <ToDoTab weekDone={weekDone} toggleWeek={toggleWeek} todayKey={dateKey} />}
      {tab === "schedule" && <ScheduleTab />}
      {tab === "guide" && <PostItsTab />}
      {tab === "calendar" && <CalendarTab completedDates={completedDates} todayKey={dateKey} weekDone={weekDone} todayTimes={times} />}

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
    { id: "todo", label: "To Do" },
    { id: "schedule", label: "Schedule" },
    { id: "guide", label: "Post-its" },
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

// ---- TODAY tab -----------------------------------------------------
// Top to bottom in the order his day goes: green "top" checks, then a box for
// each kind of work (school → Kaplan → Khan's HW), then the rest of the green
// list, phone, the PS5 lock, and the time log.
function TodayTab(props) {
  const { plan, checked, toggleCheck, study, phoneOn, allDone, spamming, times, justUnlocked, daysCleared } = props;
  return (
    <>
      <div style={{ padding: "0 16px" }}>
        <div style={{ ...S.mono, fontSize: 10, letterSpacing: 2, color: "#556075", margin: "0 2px 10px" }}>{plan.label} · 🌙 DONE BY 10:30</div>
        {spamming && <div style={S.spamBanner}>chill lil kid, lock in 🔒</div>}

        {plan.top.map((c) => <CheckRow key={c.id} item={c} on={!!checked[c.id]} onToggle={toggleCheck} />)}

        <SchoolCard {...props} />
        <KaplanCard {...props} />
        <KhansCard {...props} />

        {plan.bottom.map((c) => <CheckRow key={c.id} item={c} on={!!checked[c.id]} onToggle={toggleCheck} />)}

        <PhoneCard {...props} />
      </div>

      <div style={{ ...S.lockCard, borderColor: allDone ? "#F2C14E" : "#1E2530", background: allDone ? "rgba(242,193,78,0.07)" : "#0F131B" }}>
        <div style={S.psRow}>{["△", "○", "✕", "□"].map((s, i) => (<span key={i} style={{ ...S.psSym, color: allDone ? "#F2C14E" : "#3A4356", transition: "color 0.5s", transitionDelay: `${i * 0.1}s` }}>{s}</span>))}</div>
        <div style={{ ...S.display, fontSize: 22, letterSpacing: 2, marginTop: 10, color: allDone ? "#F2C14E" : "#556075" }}>{allDone ? "PS5 UNLOCKED" : "PS5 LOCKED"}</div>
        <p style={{ ...S.body, fontSize: 12.5, color: allDone ? "#C9B27A" : "#556075", margin: "6px 0 0" }}>
          {allDone ? "Done for the day. It's yours — guilt-free. Nobody says a word." : "It's still locked..."}
        </p>
      </div>

      <TimeLog times={times} />

      {justUnlocked && (
        <div style={S.toast}><span style={{ ...S.display, fontSize: 14, letterSpacing: 1.5, color: "#0B0E14" }}>🏆 DAY CLEARED — {daysCleared} TOTAL</span></div>
      )}
    </>
  );
}

// One green check-off row. Used on its own and inside the work boxes.
function CheckRow({ item, on, onToggle, compact }) {
  return (
    <button onClick={() => onToggle(item.id)} aria-label={`${item.title}${on ? ", done" : ""}`}
      style={{ ...S.checkRow, marginBottom: compact ? 0 : 9, marginTop: compact ? 10 : 0, borderColor: on ? "#3DDC97" : "#17261F", background: on ? "rgba(61,220,151,0.08)" : "#0F1713" }}>
      <span style={{ ...S.checkbox, borderColor: on ? "#3DDC97" : "#2A4A3E", background: on ? "#3DDC97" : "transparent" }}>
        {on && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span>}
      </span>
      <span style={{ flex: 1, textAlign: "left" }}>
        <span style={{ ...S.display, fontSize: 14.5, color: on ? "#6FE3B4" : "#E8ECF4", display: "block", textDecorationLine: on ? "line-through" : "none", textDecorationColor: "#2A4A3E" }}>{item.title}</span>
        <span style={{ ...S.body, fontSize: 12, color: on ? "#556075" : "#8A94A8", display: "block", marginTop: 3, lineHeight: 1.45 }}>{item.desc}</span>
      </span>
    </button>
  );
}

// The "what's happening now" line plus Break / Back / Stop. Only shows inside
// whichever box is the one currently running.
function StudyControls({ study, takeBreak, backToIt, stopStudy }) {
  const working = study.status === "working";
  return (
    <>
      <div style={{ ...S.nowLine, color: working ? "#6FA8FF" : "#F2C14E" }}>
        {working
          ? `${CATEGORIES[study.cat].emoji} ${CATEGORIES[study.cat].label} · ${formatDuration(study.sinceMs)} this stretch`
          : `☕ On break · ${formatDuration(study.sinceMs)}${study.sinceMs > 15 * 60000 ? " — long break 👀" : ""}`}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {working ? <button onClick={takeBreak} style={S.timerBtnBreak}>☕ Break</button>
                 : <button onClick={backToIt} style={S.timerBtnPrimary}>▶ Back to it</button>}
        <button onClick={stopStudy} style={S.timerBtnGhost}>■ Stop</button>
      </div>
    </>
  );
}

// Is this box the one running right now? (cats = which categories belong to it)
function activeIn(study, cats) {
  return study.status !== "idle" && cats.includes(study.cat);
}
function boxBorder(study, cats, done) {
  if (activeIn(study, cats)) return study.status === "working" ? "#2E6FF2" : "#F2C14E";
  return done ? "#3DDC97" : "#1E2530";
}

// ---- 🏫 school work box ----
function SchoolCard(props) {
  const { plan, checked, toggleCheck, study, startCat } = props;
  const active = activeIn(study, ["school"]);
  const doneAll = plan.school.length > 0 && plan.school.every((c) => checked[c.id]);
  return (
    <div style={{ ...S.bigCard, borderColor: boxBorder(study, ["school"], doneAll) }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ ...S.mono, fontSize: 10.5, letterSpacing: 1.5, color: "#7A8598" }}>🏫 SCHOOL WORK</span>
        <span style={{ ...S.display, fontSize: 20, color: "#E8ECF4" }}>{formatDuration(study.byCat.school)}</span>
      </div>
      {active ? <StudyControls {...props} /> : (
        <button onClick={() => startCat("school")} style={{ ...S.bigBtn, background: "#2A3242", color: "#E8ECF4", marginTop: 10 }}>▶ START SCHOOL WORK</button>
      )}
      {plan.school.map((c) => <CheckRow key={c.id} item={c} on={!!checked[c.id]} onToggle={toggleCheck} compact />)}
    </div>
  );
}

// ---- 📚 Kaplan box (Math + ELA together) ----
function KaplanCard(props) {
  const { plan, checked, toggleCheck, study, kaplanMs, kaplanDone, week, startCat } = props;
  const active = activeIn(study, ["math", "ela"]);
  const aimMs = KAPLAN_AIM_MIN * 60000;
  const goalMs = KAPLAN_GOAL_MIN * 60000;
  const aimHit = kaplanMs >= aimMs;
  const pct = Math.min(100, (kaplanMs / aimMs) * 100);

  // He did ELA first and started Math late, so Math gets pushed when it's behind.
  let nudge, nudgeColor = "#F2C14E";
  if (week.math + week.ela === 0) nudge = "Start with Math 📐";
  else if (week.math < week.ela) nudge = "Math is behind this week — start with Math 👉";
  else { nudge = "Math & ELA are balanced this week 👍"; nudgeColor = "#6FE3B4"; }

  return (
    <div style={{ ...S.bigCard, borderColor: boxBorder(study, ["math", "ela"], kaplanDone) }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ ...S.mono, fontSize: 10.5, letterSpacing: 1.5, color: "#7A8598" }}>📚 KAPLAN</span>
        <span style={{ ...S.mono, fontSize: 10.5, color: "#556075" }}>goal 2h · aim 2h 30m</span>
      </div>
      <div style={{ ...S.display, fontSize: 36, color: kaplanDone ? "#F2C14E" : "#E8ECF4", marginTop: 4 }}>{formatDuration(kaplanMs)}</div>
      <div style={{ position: "relative", marginTop: 8 }}>
        <div style={S.xpTrack}>
          <div style={{ ...S.xpFill, width: `${pct}%`, background: kaplanDone ? "linear-gradient(90deg,#F2C14E,#FFDD87)" : "linear-gradient(90deg,#2E6FF2,#6FA8FF)" }} />
        </div>
        <div style={{ position: "absolute", top: -3, left: `${(KAPLAN_GOAL_MIN / KAPLAN_AIM_MIN) * 100}%`, width: 2, height: 14, background: "#F2C14E", borderRadius: 1 }} />
      </div>
      <div style={{ ...S.body, fontSize: 12, color: "#8A94A8", marginTop: 7 }}>
        {aimHit ? "Aim hit 🔥 That's a full day of Kaplan." : kaplanDone ? "PS5 goal hit ✓ Keep going to 2h 30m if you can." : `${formatDuration(goalMs - kaplanMs)} to the PS5 goal (gold line)`}
      </div>
      <div style={{ ...S.mono, fontSize: 10.5, color: "#7A8598", marginTop: 8 }}>
        today: 📐 Math {formatShort(study.byCat.math)} · 📖 ELA {formatShort(study.byCat.ela)}
      </div>

      <div style={{ ...S.catGrid, marginTop: 10 }}>
        {["math", "ela"].map((c) => {
          const isOn = study.cat === c && study.status !== "idle";
          const working = isOn && study.status === "working";
          return (
            <button key={c} onClick={() => startCat(c)}
              style={{ ...S.catBtn, background: working ? "#2E6FF2" : isOn ? "rgba(242,193,78,0.15)" : "#161B26", borderColor: isOn ? (working ? "#2E6FF2" : "#F2C14E") : "#2A3242", color: working ? "#fff" : "#C9D2E0" }}>
              {CATEGORIES[c].emoji} {CATEGORIES[c].short}
            </button>
          );
        })}
      </div>
      {active && <div style={{ marginTop: 2 }}><StudyControls {...props} /></div>}

      <div style={S.weekBox}>
        <div style={{ ...S.mono, fontSize: 10, color: "#7A8598" }}>THIS WEEK: 📐 Math {formatShort(week.math)} · 📖 ELA {formatShort(week.ela)}</div>
        <div style={{ ...S.body, fontSize: 12, color: nudgeColor, marginTop: 4 }}>{nudge}</div>
      </div>

      <KaplanWeekInBox {...props} />

      {plan.kaplan.map((c) => <CheckRow key={c.id} item={c} on={!!checked[c.id]} onToggle={toggleCheck} compact />)}
    </div>
  );
}

// Inside the Kaplan box: what he checked off today (still crossed off, tap to
// undo - so a mis-tap never makes something vanish) and what's NEXT in each
// subject. The full plan with dates lives on the To Do tab.
function KaplanWeekInBox({ weekDone, toggleWeek, todayKey }) {
  const [showHow, setShowHow] = useState(false);
  const section = (label, items) => {
    const doneToday = items.filter((i) => weekDone[i.id] === todayKey);
    const next = items.find((i) => !weekDone[i.id]);
    return (
      <div key={label} style={{ marginTop: 8 }}>
        <div style={{ ...S.mono, fontSize: 10, color: "#7A8598", margin: "0 2px 4px" }}>{label}</div>
        {doneToday.map((i) => <PlanRow key={i.id} i={i} on toggleWeek={toggleWeek} />)}
        {next ? (
          <>
            <PlanRow i={next} on={false} isNext late={next.due < todayKey} toggleWeek={toggleWeek} showDue />
            {TOPICS[next.id] && (
              <a href={youtubeLink(TOPICS[next.id])} target="_blank" rel="noopener noreferrer" style={S.ytLink}>
                ▶ YouTube: {TOPICS[next.id]}
              </a>
            )}
          </>
        ) : <div style={{ ...S.body, fontSize: 12.5, color: "#3DDC97", margin: "0 2px" }}>All done ✓</div>}
      </div>
    );
  };
  return (
    <div style={S.weekBox}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ ...S.mono, fontSize: 10, letterSpacing: 1.5, color: "#7A8598" }}>DO NEXT</span>
        <button onClick={() => setShowHow(!showHow)} style={{ ...S.mono, fontSize: 10, color: "#F2C14E", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          {showHow ? "hide how-to ▴" : "how lessons work ▾"}
        </button>
      </div>
      {showHow && <HowToBox />}
      {section("📐 Math", KAPLAN_PLAN.math)}
      {section("📖 ELA", KAPLAN_PLAN.ela)}
      <PaceLine weekDone={weekDone} todayKey={todayKey} />
      <div style={{ ...S.mono, fontSize: 10, color: "#556075", margin: "6px 2px 0" }}>full plan with dates → To Do tab</div>
    </div>
  );
}

// ---- 📝 Khan's HW box (time + question counter) ----
function KhansCard(props) {
  const { dayType, daysIntoWeek, study, week, khansQ, updateKhansQ, startCat } = props;
  const [editingTotal, setEditingTotal] = useState(false);
  const [totalInput, setTotalInput] = useState(String(khansQ.total));
  const active = activeIn(study, ["khans"]);
  const { done, total } = khansQ;
  const pct = Math.round((done / total) * 100);
  const allDoneQ = done >= total;

  // Pace: the set is due Saturday, so spread it over Sat → Fri (7 days).
  // By tonight he should be at about (days so far / 7) of the total.
  const dayNum = daysIntoWeek + 1; // Sat = 1 ... Fri = 7
  const target = Math.min(total, Math.ceil((total * dayNum) / 7));
  let pace, paceColor;
  if (allDoneQ) { pace = "All done ✓ Hand it in Saturday."; paceColor = "#6FE3B4"; }
  else if (done >= target) { pace = `On pace ✓ (${target} by tonight keeps you on track)`; paceColor = "#6FE3B4"; }
  else { pace = `Behind — try to get to ${target} by tonight`; paceColor = "#F2C14E"; }

  const due = dayType === "khans_sat" ? "new set today · due next Saturday"
            : daysIntoWeek === 6 ? "due tomorrow!" : "due Saturday";

  function commitTotal() {
    const n = parseInt(totalInput, 10);
    if (!isNaN(n)) updateKhansQ({ total: n });
    setEditingTotal(false);
  }

  return (
    <div style={{ ...S.bigCard, borderColor: boxBorder(study, ["khans"], allDoneQ) }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ ...S.mono, fontSize: 10.5, letterSpacing: 1.5, color: "#7A8598" }}>📝 KHAN'S HW</span>
        <span style={{ ...S.mono, fontSize: 10.5, color: daysIntoWeek === 6 && !allDoneQ ? "#F2C14E" : "#556075" }}>{due}</span>
      </div>

      {/* question counter */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
        <span style={{ ...S.display, fontSize: 36, color: allDoneQ ? "#3DDC97" : "#E8ECF4" }}>{done}</span>
        {editingTotal ? (
          <span style={{ ...S.mono, fontSize: 13, color: "#7A8598" }}>
            / <input autoFocus type="number" value={totalInput} onChange={(e) => setTotalInput(e.target.value)}
                onBlur={commitTotal} onKeyDown={(e) => { if (e.key === "Enter") commitTotal(); }}
                style={S.totalInput} aria-label="Total questions this week" />
          </span>
        ) : (
          <button onClick={() => { setTotalInput(String(total)); setEditingTotal(true); }} style={S.totalBtn} aria-label="Change total questions">
            / {total} questions ✎
          </button>
        )}
        <span style={{ ...S.display, fontSize: 16, color: allDoneQ ? "#3DDC97" : "#6FA8FF", marginLeft: "auto" }}>{pct}%</span>
      </div>
      <div style={{ ...S.xpTrack, marginTop: 8 }}>
        <div style={{ ...S.xpFill, width: `${pct}%`, background: allDoneQ ? "#3DDC97" : "linear-gradient(90deg,#2E6FF2,#6FA8FF)" }} />
      </div>
      <div style={{ ...S.body, fontSize: 12, color: paceColor, marginTop: 7 }}>{pace}</div>

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button onClick={() => updateKhansQ({ done: done - 1 })} style={S.qBtn} aria-label="One less question">−1</button>
        <button onClick={() => updateKhansQ({ done: done + 1 })} style={{ ...S.qBtn, flex: 2 }} aria-label="One more question">+1</button>
        <button onClick={() => updateKhansQ({ done: done + 5 })} style={S.qBtn} aria-label="Five more questions">+5</button>
      </div>

      <div style={{ ...S.mono, fontSize: 10.5, color: "#7A8598", marginTop: 10 }}>
        time today {formatShort(study.byCat.khans)} · this week {formatShort(week.khans)}
      </div>
      {active ? <StudyControls {...props} /> : (
        <button onClick={() => startCat("khans")} style={{ ...S.bigBtn, background: "#2A3242", color: "#E8ECF4", marginTop: 10 }}>▶ START KHAN'S HW</button>
      )}
    </div>
  );
}

// ---- 📱 phone box ----
function PhoneCard({ phoneMs, phoneOn, togglePhone }) {
  const phoneMin = phoneMs / 60000;
  const pct = Math.min(100, (phoneMs / (PHONE_CAP_MIN * 60000)) * 100);
  const state = phoneMin >= PHONE_CAP_MIN ? "over" : phoneMin >= PHONE_AIM_MIN ? "warn" : "ok";
  const color = state === "over" ? "#E06C6C" : state === "warn" ? "#F2C14E" : "#6FA8FF";
  return (
    <div style={{ ...S.bigCard, borderColor: phoneOn ? color : "#1E2530", marginTop: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ ...S.mono, fontSize: 10.5, letterSpacing: 1.5, color: "#7A8598" }}>📱 PHONE TODAY</span>
        <span style={{ ...S.mono, fontSize: 10.5, color: "#556075" }}>max 2h 30m</span>
      </div>
      <div style={{ ...S.display, fontSize: 30, color: state === "ok" ? "#E8ECF4" : color, marginTop: 4 }}>{formatDuration(phoneMs)}</div>
      <div style={{ position: "relative", marginTop: 8 }}>
        <div style={S.xpTrack}><div style={{ ...S.xpFill, width: `${pct}%`, background: color }} /></div>
        <div style={{ position: "absolute", top: -3, left: `${(PHONE_AIM_MIN / PHONE_CAP_MIN) * 100}%`, width: 2, height: 14, background: "#F2C14E", borderRadius: 1 }} />
      </div>
      <div style={{ ...S.body, fontSize: 12, color: state === "ok" ? "#8A94A8" : color, marginTop: 7 }}>
        {state === "over" ? "Time's up. That's the 2.5 hr max." : state === "warn" ? "Past 2 hrs. Try to wrap it up." : "Try to stay under 2 hrs (the yellow line)."}
      </div>
      <button onClick={togglePhone} style={{ ...S.bigBtn, background: phoneOn ? "#1E2530" : "#2A3242", color: "#C9D2E0" }}>
        {phoneOn ? "■ DONE WITH PHONE" : "▶ START PHONE TIME"}
      </button>
    </div>
  );
}

// Full history for the day, tucked at the bottom and collapsed. Anything under a
// minute is hidden (button mashing) but counted, so it's still honest.
function TimeLog({ times }) {
  const [open, setOpen] = useState(false);
  const rows = toRows(times);
  const real = rows.filter((r) => r.end === null || r.end - r.start >= 60000);
  const tiny = rows.length - real.length;
  if (rows.length === 0) return null;
  const emojiFor = (k) => (k === "break" ? "☕" : k === "phone" ? "📱" : CATEGORIES[k].emoji);
  const labelFor = (k) => (k === "break" ? "break" : k === "phone" ? "phone" : CATEGORIES[k].short);

  return (
    <div style={{ padding: "14px 16px 0" }}>
      <button onClick={() => setOpen(!open)} style={{ ...S.mono, fontSize: 10, letterSpacing: 1, color: "#556075", background: "none", border: "none", cursor: "pointer", padding: "6px 0", width: "100%", textAlign: "center" }}>
        {open ? "▴ HIDE TIME LOG" : `▾ TIME LOG (${real.length})`}
      </button>
      {open && (
        <div style={{ border: "1px solid #1E2530", borderRadius: 12, background: "#0F131B", padding: "10px 12px", marginTop: 4 }}>
          {real.map((r, i) => (
            <div key={i} style={{ ...S.mono, fontSize: 10.5, color: r.kind === "break" ? "#7A6A3E" : "#8A94A8", lineHeight: 1.9, display: "flex", justifyContent: "space-between", gap: 8 }}>
              <span>{emojiFor(r.kind)} {labelFor(r.kind)} · {formatClock(r.start)} – {r.end ? formatClock(r.end) : "now"}</span>
              <span style={{ color: "#556075" }}>{r.end ? formatDuration(r.end - r.start) : "running"}</span>
            </div>
          ))}
          {tiny > 0 && <div style={{ ...S.mono, fontSize: 10, color: "#556075", marginTop: 6 }}>+ {tiny} tap{tiny === 1 ? "" : "s"} under a minute (hidden)</div>}
        </div>
      )}
    </div>
  );
}

// ---- SCHEDULE tab (suggested order, for reference) ------------------
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
      <p style={{ ...S.body, fontSize: 13, color: "#8A94A8", lineHeight: 1.6, margin: "4px 0 16px" }}>
        Suggested order. Kaplan goal is 2 hrs a day for the PS5, aim for 2.5. School HW and Khan's HW go on top of that — do a bit of each every day.
      </p>
      <SectionLabel text="MON – FRI" />
      <Row n="1" title="Home from school" sub="Snack, chill." />
      <Row n="2" title="School homework" sub="Get it out of the way first." />
      <Row n="3" title="Kaplan ~75 min" sub="Math first if Math is behind this week." />
      <Row n="4" title="Phone + Kindle" sub="Phone max 2.5 hrs for the whole day, aim under 2." />
      <Row n="5" title="Kaplan ~75 min" />
      <Row n="6" title="Khan's HW — a few questions" sub="Stay on pace so Friday isn't a cram. Update the counter." />
      <Row n="7" title="Dinner" />
      <Row n="8" title="Done by 10:30" />

      <div style={{ height: 18 }} />
      <SectionLabel text="SATURDAY" />
      <Row n="1" title="No phone before class" sub="Kindle's fine." />
      <Row n="2" title="Khan's — 10:00–1:30" sub="Hand in Khan's HW." />
      <Row n="3" title="Home, eat, relax" />
      <Row n="4" title="Kaplan ~75 min" />
      <Row n="5" title="Phone + Kindle" />
      <Row n="6" title="Kaplan ~75 min + start the new Khan's HW set" />
      <Row n="7" title="Dinner, then free until 10:30" />

      <div style={{ height: 18 }} />
      <SectionLabel text="SUNDAY" />
      <Row n="1" title="No phone before class" sub="Kindle's fine." />
      <Row n="2" title="Khan's — 11:00–2:00" />
      <Row n="3" title="Home, eat, relax" />
      <Row n="4" title="Kaplan ~75 min" />
      <Row n="5" title="Phone + Kindle" />
      <Row n="6" title="Kaplan ~45 min + Post-it redo ~30 min" sub="Redo time counts as Kaplan." />
      <Row n="7" title="School HW for Monday" />
      <Row n="8" title="Dinner, then free until 10:30" />

      <div style={{ ...S.restRule, margin: "20px 0 4px" }}>
        <span style={{ ...S.mono, color: "#F2C14E", fontSize: 12, letterSpacing: 1 }}>⚠ THE DEAL</span>
        <p style={{ ...S.body, color: "#C9D2E0", margin: "6px 0 0", fontSize: 13, lineHeight: 1.55 }}>
          Work before games, every day. Hit 2 hrs of Kaplan, check off your list, and the PS5 might be yours again.
        </p>
      </div>
    </div>
  );
}

// ---- POST-ITS tab -----------------------------------------------------
// The full method for every lesson, step by step. The Kaplan box and To Do tab
// only show a short version and point here.
function PostItsTab() {
  const Step = ({ n, title, children, tip }) => (
    <div style={S.guideCard}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div style={S.guideNum}>{n}</div>
        <div style={{ flex: 1 }}>
          <div style={{ ...S.display, fontSize: 15, color: "#E8ECF4" }}>{title}</div>
          <div style={{ ...S.body, fontSize: 13, color: "#B8C2D4", margin: "6px 0 0", lineHeight: 1.6 }}>{children}</div>
          {tip && <div style={S.guideTip}>{tip}</div>}
        </div>
      </div>
    </div>
  );
  return (
    <div style={{ padding: "4px 16px 4px" }}>
      <SectionLabel text="HOW EVERY LESSON WORKS" />
      <p style={{ ...S.body, fontSize: 13, color: "#8A94A8", lineHeight: 1.6, margin: "0 2px 14px" }}>
        Same steps every time. ELA lessons that say "do the full lesson" start at step 3.
      </p>

      <Step n="1" title="Perform set first">
        Don't read the lesson yet. Do the <b>Perform</b> questions at the end of it, then check them in the back.
        <div style={{ ...S.mono, fontSize: 11, color: "#6FA8FF", marginTop: 6 }}>Math answers p.{MATH_ANSWERS_PAGE} · ELA answers p.{ELA_ANSWERS_PAGE}</div>
      </Step>

      <Step n="2" title="Decide" tip="Guessing and getting lucky doesn't count. If you weren't sure how to do it, do the lesson.">
        <div>✅ Got <b>4–5 right</b> and you actually knew how → <b>next lesson</b>.</div>
        <div style={{ marginTop: 4 }}>📖 Got fewer, or guessed on some → <b>do the lesson</b> (step 3).</div>
      </Step>

      <Step n="3" title="Do the lesson">
        Start from its first page. Check every question as you go and mark each one with a red pen or highlighter: <b>✓ right</b> or <b>✗ wrong</b>.
      </Step>

      <Step n="4" title="Figure out every wrong one" tip={<>Ask AI like this: <i>"Explain [the topic] for the SHSAT like I'm in 8th grade. Show one example, then give me 3 practice questions and check my answers."</i></>}>
        Read the explanation in the back. Still don't get it? Watch a <b>YouTube</b> video on the topic, or ask <b>ChatGPT or Gemini</b>. Don't move on until you could explain it to someone else.
      </Step>

      <Step n="5" title="Redo the Perform set">
        Same as the lesson: mark right/wrong, figure out every wrong one.
      </Step>

      <Step n="6" title="Notebook, then post-it">
        Redo every wrong question in your <b>notebook</b> without looking. Then stick a <b>post-it</b> on that question in the book with:
        <div style={{ marginTop: 4 }}>• the page and question number</div>
        <div>• one line on why you missed it, like <i>"forgot the negative sign"</i>, <i>"didn't know the rule"</i>, <i>"rushed"</i></div>
      </Step>

      <div style={{ height: 8 }} />
      <SectionLabel text="WHEN TO REDO POST-ITS" />
      <Step n="🌙" title="End of every session">
        Redo that day's post-its <b>without looking</b>. Got it? Take the post-it off. Missed it? It stays.
      </Step>
      <Step n="☀️" title="Start of the next session (5 min)">
        Redo whatever post-its are still left from yesterday.
      </Step>
      <Step n="📅" title="Sunday">
        Redo any post-its still left in the book from the week.
      </Step>
    </div>
  );
}

// ---- CALENDAR tab -----------------------------------------------------
// Each day shows Kaplan time and how many plan items got checked off that day
// out of how many were planned. Tap a day to see its list.
//   green  = 3h+ of Kaplan AND everything planned for that day got done
//   orange = one of the two
//   red    = neither
// Days with nothing planned (catch-up Sundays) are judged on time only.
const CAL_HOURS_GOAL = 3;
const ALL_PLAN = () => [...KAPLAN_PLAN.math.map((i) => ({ ...i, subj: "📐" })), ...KAPLAN_PLAN.ela.map((i) => ({ ...i, subj: "📖" }))];
const PLAN_START = "2026-10-12";
// Check-off dates only started being saved Oct 17, so days before that show
// Kaplan time but aren't colored or judged on lessons.
const DATES_SAVED_FROM = "2026-10-17";

// 11400000 -> "3h10", 2700000 -> "45m"
function formatCell(ms) {
  const min = Math.floor(ms / 60000);
  if (min === 0) return "0m";
  const h = Math.floor(min / 60), m = min % 60;
  return h ? `${h}h${m ? String(m).padStart(2, "0") : ""}` : `${m}m`;
}

function CalendarTab({ completedDates, todayKey, weekDone, todayTimes }) {
  const [offset, setOffset] = useState(0); // how many months forward/back from today
  const [picked, setPicked] = useState(todayKey);
  const [dayTimes, setDayTimes] = useState({}); // { "2026-10-20": { study: [...], phone: [...] } }
  const base = new Date();
  const viewDate = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthLabel = viewDate.toLocaleString("en-US", { month: "long", year: "numeric" });
  const firstWeekday = new Date(year, month, 1).getDay(); // blank cells before the 1st
  // "day 0" of next month rolls back to the last day of THIS month = how many days it has
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const keyFor = (d) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  // load the saved timer logs for every past day in the month being shown
  useEffect(() => {
    (async () => {
      const out = {};
      for (let d = 1; d <= daysInMonth; d++) {
        const k = keyFor(d);
        if (k >= todayKey) break;
        try { const r = await window.storage.get(`guri-study:${k}`); if (r?.value) out[k] = JSON.parse(r.value); } catch (e) {}
      }
      setDayTimes(out);
    })();
  }, [year, month, todayKey]);

  const completedSet = new Set(completedDates);
  const plan = ALL_PLAN();

  // everything about one day, worked out from the logs and the plan
  function dayInfo(k) {
    const t = k === todayKey ? todayTimes : dayTimes[k];
    const log = (t && t.study) || [];
    const r = readStudy(log, k === todayKey ? Date.now() : lastAt(log));
    const kaplanMs = r.byCat.math + r.byCat.ela;
    const planned = plan.filter((i) => i.due === k);
    const doneHere = plan.filter((i) => weekDone[i.id] === k);
    const hoursOK = kaplanMs >= CAL_HOURS_GOAL * 3600000;
    const lessonsOK = planned.length === 0 ? true : doneHere.length >= planned.length;
    const tracked = k >= PLAN_START && k <= todayKey;
    const judged = k >= DATES_SAVED_FROM;
    let color = null;
    if (tracked && judged && k < todayKey) color = hoursOK && lessonsOK ? "ok" : hoursOK || lessonsOK ? "mid" : "bad";
    if (k === todayKey && hoursOK && lessonsOK) color = "ok";
    return { kaplanMs, byCat: r.byCat, planned, doneHere, hoursOK, lessonsOK, tracked, judged, color, cleared: completedSet.has(k) };
  }
  const COLORS = {
    ok:  { bg: "rgba(61,220,151,0.14)",  text: "#3DDC97" },
    mid: { bg: "rgba(242,193,78,0.14)",  text: "#F2C14E" },
    bad: { bg: "rgba(224,108,108,0.14)", text: "#E06C6C" },
  };

  const pickedInfo = picked ? dayInfo(picked) : null;

  return (
    <div style={{ padding: "4px 16px 4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <button onClick={() => setOffset((o) => o - 1)} style={S.navBtn} aria-label="Previous month">‹</button>
        <div style={{ ...S.display, fontSize: 16, color: "#E8ECF4" }}>{monthLabel}</div>
        <button onClick={() => setOffset((o) => o + 1)} style={S.navBtn} aria-label="Next month">›</button>
      </div>

      <div style={S.calGrid}>
        {DAY_SHORT.map((d, i) => (<div key={i} style={S.calDow}>{d}</div>))}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const k = keyFor(d);
          const info = dayInfo(k);
          const c = info.color ? COLORS[info.color] : null;
          const isToday = k === todayKey;
          const isPicked = k === picked;
          const showNums = info.tracked && (info.kaplanMs > 0 || info.planned.length > 0 || info.doneHere.length > 0);
          return (
            <button key={i} onClick={() => setPicked(k)} aria-label={`${shortDate(k)}`}
              style={{ ...S.calCell, cursor: "pointer", padding: 0, fontFamily: "inherit",
                borderColor: isPicked ? "#E8ECF4" : isToday ? "#6FA8FF" : "transparent",
                background: c ? c.bg : "transparent" }}>
              <span style={{ ...S.mono, fontSize: 11, color: isToday ? "#6FA8FF" : c ? c.text : "#8A94A8" }}>{d}</span>
              {showNums && (
                <>
                  <span style={{ ...S.mono, fontSize: 8.5, color: "#C9D2E0", lineHeight: 1.2 }}>{formatCell(info.kaplanMs)}</span>
                  <span style={{ ...S.mono, fontSize: 8.5, color: "#8A94A8", lineHeight: 1.2 }}>
                    {!info.judged ? "" : info.planned.length ? `${info.doneHere.length}/${info.planned.length}` : info.doneHere.length ? `+${info.doneHere.length}` : ""}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>

      <p style={{ ...S.body, fontSize: 11, color: "#556075", textAlign: "center", marginTop: 12, lineHeight: 1.6 }}>
        Each day: Kaplan time · lessons done / planned.<br />
        <span style={{ color: "#3DDC97" }}>Green</span> = {CAL_HOURS_GOAL}h+ and planned lessons done · <span style={{ color: "#F2C14E" }}>orange</span> = one · <span style={{ color: "#E06C6C" }}>red</span> = neither
      </p>

      {pickedInfo && <DayDetail k={picked} info={pickedInfo} todayKey={todayKey} weekDone={weekDone} />}
    </div>
  );
}

// The list that shows up under the calendar for the day you tap.
function DayDetail({ k, info, todayKey, weekDone }) {
  const isPast = k < todayKey;
  const isFuture = k > todayKey;
  const statusFor = (i) => {
    const when = weekDone[i.id];
    if (when) return { on: true, note: typeof when === "string" ? (when === k ? "done" : `done ${shortDate(when)}${when > k ? " (late)" : " (early)"}`) : "done" };
    if (isFuture) return { on: false, note: "coming up" };
    if (isPast) return { on: false, note: "not done → still to do", late: true };
    return { on: false, note: "to do today" };
  };
  const extra = info.doneHere.filter((i) => i.due !== k);
  const Row = ({ i, on, note, late }) => (
    <div style={{ display: "flex", gap: 8, alignItems: "baseline", padding: "6px 0", borderBottom: "1px solid #161B26" }}>
      <span style={{ fontSize: 12, color: on ? "#3DDC97" : late ? "#F2C14E" : "#556075", width: 14 }}>{on ? "✓" : "○"}</span>
      <span style={{ ...S.body, fontSize: 13, color: on ? "#8A94A8" : "#E8ECF4", flex: 1, textDecorationLine: on ? "line-through" : "none" }}>{i.subj} {i.lesson}</span>
      <span style={{ ...S.mono, fontSize: 9.5, color: late ? "#F2C14E" : "#556075", whiteSpace: "nowrap" }}>{note}</span>
    </div>
  );
  return (
    <div style={{ ...S.bigCard, borderColor: "#1E2530", marginTop: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ ...S.display, fontSize: 16, color: "#E8ECF4" }}>{shortDate(k)}{k === todayKey ? " · today" : ""}</span>
        {info.cleared && <span style={{ ...S.mono, fontSize: 10, color: "#F2C14E" }}>🎮 PS5 unlocked</span>}
      </div>
      {!isFuture && (
        <div style={{ ...S.mono, fontSize: 11, color: info.hoursOK ? "#3DDC97" : "#8A94A8", marginTop: 6 }}>
          📚 Kaplan {formatShort(info.kaplanMs)} (📐 {formatShort(info.byCat.math)} · 📖 {formatShort(info.byCat.ela)}) {info.hoursOK ? "✓" : `· goal ${CAL_HOURS_GOAL}h`}
        </div>
      )}

      <div style={{ ...S.mono, fontSize: 10, letterSpacing: 1.5, color: "#7A8598", margin: "12px 0 2px" }}>PLANNED FOR THIS DAY</div>
      {info.planned.length === 0
        ? <div style={{ ...S.body, fontSize: 12.5, color: "#8A94A8", padding: "6px 0" }}>Nothing new planned. Catch-up and post-its.</div>
        : info.planned.map((i) => <Row key={i.id} i={i} {...statusFor(i)} />)}

      {extra.length > 0 && (
        <>
          <div style={{ ...S.mono, fontSize: 10, letterSpacing: 1.5, color: "#7A8598", margin: "12px 0 2px" }}>ALSO DONE THIS DAY</div>
          {extra.map((i) => <Row key={i.id} i={i} on note={i.due < k ? `was due ${shortDate(i.due)}` : `ahead · due ${shortDate(i.due)}`} />)}
        </>
      )}
    </div>
  );
}

// ---- the Kaplan plan (updated Oct 17) -----------------------------------
// One list per subject, in order, each item with the day it should be done by.
// He works down the list; the first unchecked item is NEXT. Anything past its
// date and not checked counts as "behind". Sundays 10/25 and 11/1 have nothing
// due - they're for catching up and the post-it redo.
//
// Nothing is cut: he has 3-3.5 hrs a day. Things he's already good at go fast
// because of the Perform-first rule. Tags come from his Khan's diagnostics
// (F Jul 4, G Aug 30, H Sep 26):
//   focus  = wrong on most diagnostics -> do the full lesson even if Perform goes OK
//   strong = right on most diagnostics -> Perform first, probably quick
//
// The ids m1-m7 and e1-e5 are the same as the first week's plan, so what he
// already checked off (10.1, 10.2, 10.3) stays crossed off.
const KAPLAN_PLAN = {
  id: "2026-10-12", // storage key - keep the same so old checks carry over
  math: [
    { id: "m1",  due: "2026-10-13", lesson: "Lesson 10.1", page: "page 300", text: "Redo only the questions you got wrong before." },
    { id: "m2",  due: "2026-10-14", lesson: "Lesson 10.2", page: "page 306", text: "Perform questions just before page 315." },
    { id: "m3",  due: "2026-10-15", lesson: "Lesson 10.3", page: "page 315", text: "Perform questions just before page 320." },
    { id: "m4",  due: "2026-10-18", lesson: "Lesson 10.4", page: "page 320", text: "Backsolving. Perform questions just before page 325.", tag: "focus" },
    { id: "m5",  due: "2026-10-19", lesson: "Lesson 11.1", page: "page 326", text: "Fractions & decimals. Perform questions just before page 334.", tag: "focus" },
    { id: "m6",  due: "2026-10-19", lesson: "Lesson 11.2", page: "page 334", text: "Number lines, factors, multiples. Perform questions just before page 343.", tag: "focus" },
    { id: "m7",  due: "2026-10-20", lesson: "Lesson 11.3", page: "page 343", text: "Percents. Perform questions just before page 350.", tag: "strong" },
    { id: "m8",  due: "2026-10-20", lesson: "Lesson 11.4", text: "Statistics terms. Perform questions first." },
    { id: "m9",  due: "2026-10-21", lesson: "Lesson 11.5", text: "Rates. Perform questions first.", tag: "focus" },
    { id: "m10", due: "2026-10-22", lesson: "Lesson 11.6", text: "Ratios. Perform questions first." },
    { id: "m11", due: "2026-10-22", lesson: "Lesson 11.7", text: "Coordinate plane. Perform questions first." },
    { id: "m12", due: "2026-10-23", lesson: "Lesson 11.8", text: "Probability. Perform questions first." },
    { id: "m13", due: "2026-10-24", lesson: "Lesson 12.1", text: "Algebra. Perform questions first.", tag: "focus" },
    { id: "m14", due: "2026-10-26", lesson: "Lesson 12.2", text: "Algebra. Perform questions first.", tag: "focus" },
    { id: "m15", due: "2026-10-27", lesson: "Lesson 12.3", text: "Algebra. Perform questions first.", tag: "focus" },
    { id: "m16", due: "2026-10-28", lesson: "Lesson 14.3", text: "Word Problems: Algebra. Perform questions first.", tag: "focus" },
    { id: "m17", due: "2026-10-29", lesson: "Lesson 14.1", text: "Word Problems: Arithmetic. Perform questions first.", tag: "focus" },
    { id: "m18", due: "2026-10-30", lesson: "Lesson 13.1", text: "Geometry. Perform questions first." },
    { id: "m19", due: "2026-10-30", lesson: "Lesson 13.2", text: "Geometry. Perform questions first." },
    { id: "m20", due: "2026-10-31", lesson: "Lesson 13.3", text: "Geometry. Perform questions first." },
    { id: "m21", due: "2026-10-31", lesson: "Lesson 13.4", text: "Geometry. Perform questions first." },
    { id: "m22", due: "2026-11-02", lesson: "Lesson 14.4", text: "Perform questions first." },
    { id: "m23", due: "2026-11-02", lesson: "Lesson 14.2", text: "Perform questions first." },
    { id: "m24", due: "2026-11-03", lesson: "Lesson 15.3", text: "Surveys. Perform questions first." },
    { id: "m25", due: "2026-11-03", lesson: "Chapter 16", text: "Mixed Perform Sets. Do as many as you can." },
  ],
  ela: [
    { id: "e1",  due: "2026-10-18", lesson: "Lesson 4.1", page: "pages 52–63", text: "Redo only the questions you got wrong before.", tag: "focus" },
    { id: "e2",  due: "2026-10-18", lesson: "Lesson 4.3", page: "pages 78–94", text: "Redo only your wrong ones.", tag: "focus" },
    { id: "e3",  due: "2026-10-19", lesson: "Lesson 4.6", page: "page 119", text: "Skip the reading. Do only the Perform questions just before page 137.", tag: "strong" },
    { id: "e4",  due: "2026-10-20", lesson: "Lesson 5.1", page: "page 138", text: "Do the full lesson." },
    { id: "e5",  due: "2026-10-21", lesson: "Lesson 5.2", page: "page 154", text: "Do the full lesson." },
    { id: "e6",  due: "2026-10-22", lesson: "Lesson 6.1", text: "Do the full lesson." },
    { id: "e7",  due: "2026-10-23", lesson: "Lesson 6.2", text: "Elimination. Do the full lesson." },
    { id: "e8",  due: "2026-10-26", lesson: "Lesson 7.1", text: "Fiction. Do the full lesson." },
    { id: "e9",  due: "2026-10-27", lesson: "Lesson 7.2", text: "Poetry. Do the full lesson." },
    { id: "e10", due: "2026-10-28", lesson: "Lesson 7.3", text: "Science. Do the full lesson." },
    { id: "e11", due: "2026-10-29", lesson: "Chapter 8", text: "ELA review. Do the full chapter." },
    { id: "e12", due: "2026-10-30", lesson: "Chapter 17", text: "Do the full chapter." },
    { id: "e13", due: "2026-11-02", lesson: "Chapter 18", text: "Strategic Review." },
    { id: "e14", due: "2026-11-03", lesson: "ELA post-its", text: "Redo every ELA post-it in the book." },
  ],
};
const TAGS = {
  focus:  { label: "🎯 weak spot · do the full lesson even if Perform goes OK", color: "#F2C14E" },
  strong: { label: "💪 you're good at this · Perform first, probably quick", color: "#6FE3B4" },
};
// What to search on YouTube for each lesson (only where the topic is known).
const TOPICS = {
  m3: "SHSAT picking numbers strategy", m4: "SHSAT backsolving", m5: "fractions and decimals 8th grade",
  m6: "factors multiples LCM GCF number line", m7: "SHSAT percent problems", m8: "mean median mode range",
  m9: "rate problems distance rate time", m10: "ratios and proportions SHSAT", m11: "coordinate plane 8th grade",
  m12: "SHSAT probability", m13: "solving equations SHSAT algebra", m14: "solving equations SHSAT algebra",
  m15: "solving equations SHSAT algebra", m16: "SHSAT algebra word problems", m17: "SHSAT arithmetic word problems",
  m18: "SHSAT geometry", m19: "SHSAT geometry", m20: "SHSAT geometry", m21: "SHSAT geometry", m24: "surveys and sampling 8th grade math",
  e1: "misplaced modifiers grammar", e2: "subject verb agreement grammar", e3: "SHSAT revising editing",
  e4: "SHSAT reading comprehension strategy", e5: "SHSAT reading comprehension strategy", e6: "SHSAT reading comprehension strategy",
  e7: "process of elimination reading comprehension", e8: "SHSAT fiction passage", e9: "how to answer poetry questions SHSAT",
  e10: "SHSAT science passage reading",
};
const youtubeLink = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

const MATH_ANSWERS_PAGE = 641;
const ELA_ANSWERS_PAGE = 533;

// "2026-10-18" -> "Sun 10/18"
function shortDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  return `${DAY_NAMES[new Date(y, m - 1, d).getDay()].slice(0, 3)} ${m}/${d}`;
}
// how many items are past their date and not done
function countBehind(items, weekDone, todayKey) {
  return items.filter((i) => i.due < todayKey && !weekDone[i.id]).length;
}

// One row of the plan.
function PlanRow({ i, on, isNext, late, toggleWeek, showDue, doneOn }) {
  return (
    <button onClick={() => toggleWeek(i.id)} aria-label={`${i.lesson}${on ? ", done" : ""}`}
      style={{ ...S.weekRow, borderColor: on ? "#2A4A3E" : isNext ? "#6FA8FF" : late ? "rgba(242,193,78,0.4)" : "#1E2530", background: on ? "rgba(61,220,151,0.06)" : isNext ? "rgba(46,111,242,0.08)" : "#0F131B" }}>
      <span style={{ ...S.checkbox, width: 20, height: 20, minWidth: 20, borderColor: on ? "#3DDC97" : "#3A4356", background: on ? "#3DDC97" : "transparent" }}>
        {on && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
      </span>
      <span style={{ flex: 1, textAlign: "left" }}>
        <span style={{ ...S.display, fontSize: 13.5, color: on ? "#556075" : "#E8ECF4", textDecorationLine: on ? "line-through" : "none" }}>
          {i.lesson}{i.page && <span style={{ ...S.mono, fontSize: 10.5, color: on ? "#3A4356" : "#6FA8FF", fontWeight: 400 }}> ({i.page})</span>}
        </span>
        <span style={{ ...S.body, fontSize: 12, color: on ? "#3A4356" : "#8A94A8", display: "block", marginTop: 2, lineHeight: 1.45 }}>{i.text}</span>
        {i.tag && !on && <span style={{ ...S.mono, fontSize: 9.5, color: TAGS[i.tag].color, display: "block", marginTop: 4, lineHeight: 1.4 }}>{TAGS[i.tag].label}</span>}
      </span>
      <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, alignSelf: "center" }}>
        {isNext && <span style={{ ...S.mono, fontSize: 9, color: "#6FA8FF" }}>NEXT</span>}
        {showDue && !on && <span style={{ ...S.mono, fontSize: 9, color: late ? "#F2C14E" : "#556075", whiteSpace: "nowrap" }}>{late ? "late · " : "by "}{shortDate(i.due)}</span>}
        {on && typeof doneOn === "string" && <span style={{ ...S.mono, fontSize: 9, color: "#3A4356", whiteSpace: "nowrap" }}>done {shortDate(doneOn)}</span>}
      </span>
    </button>
  );
}

function HowToBox() {
  return (
    <div style={S.howBox}>
      <div style={{ ...S.mono, fontSize: 10, letterSpacing: 1.5, color: "#F2C14E" }}>HOW EVERY LESSON WORKS</div>
      <ol style={{ ...S.body, fontSize: 12.5, color: "#C9D2E0", margin: "6px 0 0", paddingLeft: 18, lineHeight: 1.6 }}>
        <li><b>Perform</b> set first. Check it in the back (Math p.{MATH_ANSWERS_PAGE}, ELA p.{ELA_ANSWERS_PAGE}).</li>
        <li>4–5 right and you knew how → next lesson.</li>
        <li>Fewer, or you guessed → do the lesson. Mark every question ✓ or ✗.</li>
        <li>Every wrong one: figure out why (back of book, YouTube, ChatGPT/Gemini), redo it in your notebook, post-it on it.</li>
      </ol>
      <div style={{ ...S.body, fontSize: 12, color: "#8A94A8", marginTop: 8 }}>Full steps → Post-its tab</div>
    </div>
  );
}

// Pace line shared by the Kaplan box and the To Do tab.
function PaceLine({ weekDone, todayKey }) {
  const behind = countBehind(KAPLAN_PLAN.math, weekDone, todayKey) + countBehind(KAPLAN_PLAN.ela, weekDone, todayKey);
  const isSunday = new Date().getDay() === 0;
  if (behind === 0) return <div style={{ ...S.body, fontSize: 12.5, color: "#6FE3B4", margin: "8px 2px 0" }}>On track ✓</div>;
  return (
    <div style={{ ...S.body, fontSize: 12.5, color: "#F2C14E", margin: "8px 2px 0" }}>
      {behind} behind. {isSunday ? "Today's a catch-up day — knock some out." : "Do today's, then one extra to catch up."}
    </div>
  );
}

// ---- TO DO tab -------------------------------------------------------
// The whole plan, in order, with dates. Done items stay crossed off.
function ToDoTab({ weekDone, toggleWeek, todayKey }) {
  const all = [...KAPLAN_PLAN.math, ...KAPLAN_PLAN.ela];
  const doneCount = all.filter((i) => weekDone[i.id]).length;
  const List = ({ title, items }) => {
    const next = items.find((i) => !weekDone[i.id]);
    const count = items.filter((i) => weekDone[i.id]).length;
    return (
      <div style={{ marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "0 2px 6px" }}>
          <span style={{ ...S.display, fontSize: 15, color: "#E8ECF4" }}>{title}</span>
          <span style={{ ...S.mono, fontSize: 10, color: count === items.length ? "#3DDC97" : "#7A8598" }}>{count}/{items.length}</span>
        </div>
        {items.map((i) => (
          <PlanRow key={i.id} i={i} on={!!weekDone[i.id]} isNext={next && next.id === i.id}
            late={i.due < todayKey && !weekDone[i.id]} toggleWeek={toggleWeek} showDue doneOn={weekDone[i.id]} />
        ))}
      </div>
    );
  };
  return (
    <div style={{ padding: "4px 16px 4px" }}>
      <SectionLabel text="KAPLAN PLAN · UNTIL TEST DAY" />
      <p style={{ ...S.body, fontSize: 13, color: "#8A94A8", lineHeight: 1.6, margin: "0 2px 0" }}>
        About 2 hrs Math + 1 hr ELA a day. Go in order, starting at the one marked <span style={{ color: "#6FA8FF" }}>NEXT</span>. Sundays are for catching up. {doneCount}/{all.length} done.
      </p>
      <PaceLine weekDone={weekDone} todayKey={todayKey} />
      <HowToBox />
      <List title="📐 Math" items={KAPLAN_PLAN.math} />
      <List title="📖 ELA" items={KAPLAN_PLAN.ela} />
    </div>
  );
}

function SectionLabel({ text }) {
  return <div style={{ ...S.mono, fontSize: 10, letterSpacing: 2, color: "#556075", margin: "2px 0 10px" }}>{text}</div>;
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
  bigCard: { border: "1px solid", borderRadius: 14, background: "#12161F", padding: "14px 14px", marginBottom: 10, transition: "border-color 0.3s" },
  bigBtn: { width: "100%", marginTop: 12, border: "none", borderRadius: 10, padding: "13px 0", fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: 1.5, cursor: "pointer" },
  checkRow: { display: "flex", gap: 12, width: "100%", padding: "12px 13px", marginBottom: 9, borderRadius: 12, border: "1px solid", cursor: "pointer", fontFamily: "inherit", alignItems: "flex-start" },
  spamBanner: { textAlign: "center", fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: 0.5, color: "#0B0E14", background: "#F2C14E", borderRadius: 10, padding: "10px 0", marginBottom: 10 },
  nowLine: { fontFamily: "'Inter', sans-serif", fontSize: 12.5, marginTop: 10, marginBottom: 8 },
  catGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  catBtn: { border: "1px solid", borderRadius: 10, padding: "11px 0", fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 0.5, cursor: "pointer", transition: "all 0.15s" },
  weekBox: { marginTop: 12, paddingTop: 10, borderTop: "1px solid #1E2530" },
  qBtn: { flex: 1, border: "1px solid #2A3242", background: "#161B26", color: "#E8ECF4", borderRadius: 10, padding: "10px 0", fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 15, cursor: "pointer" },
  totalBtn: { background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#7A8598" },
  totalInput: { width: 54, background: "#161B26", border: "1px solid #2A3242", borderRadius: 6, color: "#E8ECF4", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, padding: "3px 6px" },
  weekRow: { display: "flex", gap: 10, width: "100%", padding: "9px 10px", marginBottom: 6, borderRadius: 10, border: "1px solid", cursor: "pointer", fontFamily: "inherit", alignItems: "flex-start" },
  howBox: { marginTop: 10, padding: "11px 12px", borderRadius: 10, border: "1px solid rgba(242,193,78,0.3)", background: "rgba(242,193,78,0.05)" },
  ytLink: { display: "inline-block", fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "#E06C6C", textDecoration: "none", margin: "0 2px 6px", padding: "4px 8px", border: "1px solid rgba(224,108,108,0.35)", borderRadius: 6 },
  todoBig: { border: "1px solid #1E2530", borderRadius: 14, background: "#12161F", padding: "16px 14px", marginBottom: 12, textAlign: "center" },
  todoNote: { fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#8A94A8", lineHeight: 1.6, margin: "6px 0 0" },
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
