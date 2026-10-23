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

// ---- the green check-off items for each kind of day --------------------
// These are in the order the day usually goes, so they double as a quick
// "where am I in my day" list.
const C = {
  home:    { id: "home",    title: "Home from school",        desc: "Snack, relax, decompress." },
  checked: { id: "checked", title: "Checked my answers",      desc: "Every couple pages. Wrong ones got a post-it with one line on why." },
  kindle:  { id: "kindle",  title: "Kindle 1hr+",             desc: "No cap on this one." },
  school:  { id: "schoolhw", title: "School homework done",   desc: "Whatever's due tomorrow." },
  dinner:  { id: "dinner",  title: "Dinner",                  desc: "Whenever it's ready." },
  nophone: { id: "nophone", title: "No phone before Khan's",  desc: "Kindle in the morning is fine." },
  homeeat: { id: "homeeat", title: "Home, eat, relax",        desc: "No set length." },
  handin:  { id: "handin",  title: "Handed in Khan's HW",     desc: "Due today." },
  postit:  { id: "postit",  title: "Post-it redo (weekly)",   desc: "Every page with a post-it, try it again. Got it? Rip it out." },
};
const DAY_PLANS = {
  weekday:   { label: "SCHOOL DAY", checks: [C.home, C.checked, C.kindle, C.school, C.dinner] },
  khans_sat: { label: "KHAN'S DAY · 10:00–1:30", checks: [C.nophone, { id: "class", title: "Khan's class", desc: "10:00–1:30. Lock in." }, C.handin, C.homeeat, C.checked, C.kindle, C.dinner] },
  khans_sun: { label: "KHAN'S DAY · 11:00–2:00", checks: [C.nophone, { id: "class", title: "Khan's class", desc: "11:00–2:00. Lock in." }, C.homeeat, C.checked, C.postit, C.kindle, C.dinner] },
};

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
  const [weekPast, setWeekPast] = useState([]);      // earlier days this week (Sun → yesterday), for the weekly totals
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

  useEffect(() => {
    (async () => {
      try { const r = await window.storage.get(`guri-day:${dateKey}`); if (r?.value) setChecked(JSON.parse(r.value)); } catch (e) {}
      try { const t = await window.storage.get(timesKey(dateKey)); if (t?.value) setTimes(JSON.parse(t.value)); } catch (e) {}
      try { const c = await window.storage.get("guri-completed-dates"); if (c?.value) setCompletedDates(JSON.parse(c.value)); } catch (e) {}
      try { const n = await window.storage.get("guri-notes"); if (n?.value) setNotes(JSON.parse(n.value)); } catch (e) {}
      // earlier days this week, Sunday up to yesterday
      const past = [];
      for (let i = dayIdx; i >= 1; i--) {
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
  const checksDone = plan.checks.every((c) => checked[c.id]);
  const allDone = kaplanDone && checksDone;

  // this week = earlier days + today
  const week = { math: study.byCat.math, ela: study.byCat.ela, khans: study.byCat.khans };
  for (const t of weekPast) {
    const r = readStudy(t.study || [], 0);
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
        <TodayTab {...{ plan, dayType, checked, toggleCheck, times, study, kaplanMs, kaplanDone, week, phoneMs, phoneOn, allDone, spamming, startCat, takeBreak, backToIt, stopStudy, togglePhone, justUnlocked, daysCleared }} />
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

// ---- TODAY tab -----------------------------------------------------
function TodayTab({ plan, dayType, checked, toggleCheck, times, study, kaplanMs, kaplanDone, week, phoneMs, phoneOn, allDone, spamming, startCat, takeBreak, backToIt, stopStudy, togglePhone, justUnlocked, daysCleared }) {
  const aimMs = KAPLAN_AIM_MIN * 60000;
  const goalMs = KAPLAN_GOAL_MIN * 60000;
  const aimHit = kaplanMs >= aimMs;
  const kaplanPct = Math.min(100, (kaplanMs / aimMs) * 100);
  const working = study.status === "working";
  const onBreak = study.status === "break";

  // Math vs ELA nudge - he did ELA first and started Math late, so Math gets pushed
  let nudge;
  if (week.math + week.ela === 0) nudge = "Start with Math today 📐";
  else if (week.math < week.ela) nudge = `Math is behind this week — start with Math 👉`;
  else nudge = "Math & ELA are balanced this week 👍";

  const khansLine = dayType === "khans_sat"
    ? "📝 Khan's HW is due today — hand it in"
    : `📝 Khan's HW this week: ${formatShort(week.khans)} · due Saturday${dayType === "weekday" && new Date().getDay() === 5 ? " (tomorrow!)" : ""}`;

  const phoneMin = phoneMs / 60000;
  const phonePct = Math.min(100, (phoneMs / (PHONE_CAP_MIN * 60000)) * 100);
  const phoneState = phoneMin >= PHONE_CAP_MIN ? "over" : phoneMin >= PHONE_AIM_MIN ? "warn" : "ok";
  const phoneColor = phoneState === "over" ? "#E06C6C" : phoneState === "warn" ? "#F2C14E" : "#6FA8FF";

  return (
    <>
      <div style={{ padding: "0 16px" }}>
        <div style={{ ...S.mono, fontSize: 10, letterSpacing: 2, color: "#556075", margin: "0 2px 10px" }}>{plan.label} · 🌙 DONE BY 10:30</div>

        {spamming && <div style={S.spamBanner}>chill lil kid, lock in 🔒</div>}

        {/* ---- study card ---- */}
        <div style={{ ...S.bigCard, borderColor: working ? "#2E6FF2" : onBreak ? "#F2C14E" : kaplanDone ? "#F2C14E" : "#1E2530" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ ...S.mono, fontSize: 10.5, letterSpacing: 1.5, color: "#7A8598" }}>📚 KAPLAN TODAY</span>
            <span style={{ ...S.mono, fontSize: 10.5, color: "#556075" }}>goal 2h · aim 2h 30m</span>
          </div>
          <div style={{ ...S.display, fontSize: 38, color: aimHit || kaplanDone ? "#F2C14E" : "#E8ECF4", marginTop: 4 }}>
            {formatDuration(kaplanMs)}
          </div>
          <div style={{ position: "relative", marginTop: 8 }}>
            <div style={S.xpTrack}>
              <div style={{ ...S.xpFill, width: `${kaplanPct}%`, background: kaplanDone ? "linear-gradient(90deg,#F2C14E,#FFDD87)" : "linear-gradient(90deg,#2E6FF2,#6FA8FF)" }} />
            </div>
            {/* gold line = the 2h goal the PS5 needs */}
            <div style={{ position: "absolute", top: -3, left: `${(KAPLAN_GOAL_MIN / KAPLAN_AIM_MIN) * 100}%`, width: 2, height: 14, background: "#F2C14E", borderRadius: 1 }} />
          </div>
          <div style={{ ...S.body, fontSize: 12, color: "#8A94A8", marginTop: 7 }}>
            {aimHit ? "Aim hit 🔥 That's a full day of Kaplan." : kaplanDone ? "PS5 goal hit ✓ Keep going to 2h 30m if you can." : `${formatDuration(goalMs - kaplanMs)} to the PS5 goal (gold line)`}
          </div>

          {/* today's split across everything */}
          <div style={{ ...S.mono, fontSize: 10.5, color: "#7A8598", marginTop: 10, lineHeight: 1.7 }}>
            {CAT_ORDER.map((c) => `${CATEGORIES[c].emoji} ${formatShort(study.byCat[c])}`).join("   ")}
          </div>

          {/* what's happening right now */}
          <div style={{ ...S.nowLine, color: working ? "#6FA8FF" : onBreak ? "#F2C14E" : "#8A94A8" }}>
            {working && `${CATEGORIES[study.cat].emoji} ${CATEGORIES[study.cat].label} · ${formatDuration(study.sinceMs)} this stretch`}
            {onBreak && `☕ On break · ${formatDuration(study.sinceMs)}${study.sinceMs > 15 * 60000 ? " — long break 👀" : ""}`}
            {!working && !onBreak && "Pick what you're working on 👇"}
          </div>

          {/* subject buttons */}
          <div style={S.catGrid}>
            {CAT_ORDER.map((c) => {
              const active = study.cat === c;
              return (
                <button key={c} onClick={() => startCat(c)}
                  style={{ ...S.catBtn, background: active && working ? "#2E6FF2" : active && onBreak ? "rgba(242,193,78,0.15)" : "#161B26", borderColor: active ? (working ? "#2E6FF2" : "#F2C14E") : "#2A3242", color: active && working ? "#fff" : "#C9D2E0" }}>
                  {CATEGORIES[c].emoji} {CATEGORIES[c].short}
                </button>
              );
            })}
          </div>

          {/* break / back / stop only show once something is running */}
          {(working || onBreak) && (
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {working && <button onClick={takeBreak} style={S.timerBtnBreak}>☕ Break</button>}
              {onBreak && <button onClick={backToIt} style={S.timerBtnPrimary}>▶ Back to it</button>}
              <button onClick={stopStudy} style={S.timerBtnGhost}>■ Stop</button>
            </div>
          )}

          {/* weekly view */}
          <div style={S.weekBox}>
            <div style={{ ...S.mono, fontSize: 10, color: "#7A8598" }}>THIS WEEK: 📐 Math {formatShort(week.math)} · 📖 ELA {formatShort(week.ela)}</div>
            <div style={{ ...S.body, fontSize: 12, color: week.math < week.ela || week.math + week.ela === 0 ? "#F2C14E" : "#6FE3B4", marginTop: 4 }}>{nudge}</div>
            <div style={{ ...S.body, fontSize: 12, color: "#8A94A8", marginTop: 6 }}>{khansLine}</div>
          </div>
        </div>

        {/* ---- green checklist ---- */}
        <div style={{ ...S.mono, fontSize: 10, letterSpacing: 2, color: "#556075", margin: "14px 2px 8px" }}>TODAY'S LIST</div>
        {plan.checks.map((c) => {
          const on = !!checked[c.id];
          return (
            <button key={c.id} onClick={() => toggleCheck(c.id)} aria-label={`${c.title}${on ? ", done" : ""}`}
              style={{ ...S.checkRow, borderColor: on ? "#3DDC97" : "#17261F", background: on ? "rgba(61,220,151,0.08)" : "#0F1713" }}>
              <span style={{ ...S.checkbox, borderColor: on ? "#3DDC97" : "#2A4A3E", background: on ? "#3DDC97" : "transparent" }}>
                {on && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span>}
              </span>
              <span style={{ flex: 1, textAlign: "left" }}>
                <span style={{ ...S.display, fontSize: 14.5, color: on ? "#6FE3B4" : "#E8ECF4", display: "block", textDecorationLine: on ? "line-through" : "none", textDecorationColor: "#2A4A3E" }}>{c.title}</span>
                <span style={{ ...S.body, fontSize: 12, color: on ? "#556075" : "#8A94A8", display: "block", marginTop: 3, lineHeight: 1.45 }}>{c.desc}</span>
              </span>
            </button>
          );
        })}

        {/* ---- phone ---- */}
        <div style={{ ...S.bigCard, borderColor: phoneOn ? phoneColor : "#1E2530", marginTop: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ ...S.mono, fontSize: 10.5, letterSpacing: 1.5, color: "#7A8598" }}>📱 PHONE TODAY</span>
            <span style={{ ...S.mono, fontSize: 10.5, color: "#556075" }}>max 2h 30m</span>
          </div>
          <div style={{ ...S.display, fontSize: 30, color: phoneState === "ok" ? "#E8ECF4" : phoneColor, marginTop: 4 }}>{formatDuration(phoneMs)}</div>
          <div style={{ position: "relative", marginTop: 8 }}>
            <div style={S.xpTrack}><div style={{ ...S.xpFill, width: `${phonePct}%`, background: phoneColor }} /></div>
            <div style={{ position: "absolute", top: -3, left: `${(PHONE_AIM_MIN / PHONE_CAP_MIN) * 100}%`, width: 2, height: 14, background: "#F2C14E", borderRadius: 1 }} />
          </div>
          <div style={{ ...S.body, fontSize: 12, color: phoneState === "ok" ? "#8A94A8" : phoneColor, marginTop: 7 }}>
            {phoneState === "over" ? "Time's up. That's the 2.5 hr max." : phoneState === "warn" ? "Past 2 hrs. Try to wrap it up." : "Try to stay under 2 hrs (the yellow line)."}
          </div>
          <button onClick={togglePhone} style={{ ...S.bigBtn, background: phoneOn ? "#1E2530" : "#2A3242", color: "#C9D2E0" }}>
            {phoneOn ? "■ DONE WITH PHONE" : "▶ START PHONE TIME"}
          </button>
        </div>
      </div>

      {/* ---- PS5 lock ---- */}
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
      <Row n="2" title="Kaplan ~75 min" sub="Math first if Math is behind this week." />
      <Row n="3" title="Phone + Kindle" sub="Phone max 2.5 hrs for the whole day, aim under 2." />
      <Row n="4" title="Kaplan ~75 min" />
      <Row n="5" title="School HW + a bit of Khan's HW" sub="Friday is the last day before Khan's HW is due." />
      <Row n="6" title="Dinner" />
      <Row n="7" title="Finish whatever's left" />
      <Row n="8" title="Done by 10:30" />

      <div style={{ height: 18 }} />
      <SectionLabel text="SATURDAY" />
      <Row n="1" title="No phone before class" sub="Kindle's fine." />
      <Row n="2" title="Khan's — 10:00–1:30" sub="Hand in Khan's HW." />
      <Row n="3" title="Home, eat, relax" />
      <Row n="4" title="Kaplan ~75 min" />
      <Row n="5" title="Phone + Kindle" />
      <Row n="6" title="Kaplan ~75 min + start next week's Khan's HW" />
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
