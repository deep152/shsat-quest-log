import { useState, useEffect } from "react";

// ---- schedule data -------------------------------------------------
const WEEKDAY_TASKS = [
  {
    id: "home", time: "—", title: "Home from school",
    desc: "Snack, relax, decompress. No set length — just don't skip it.",
    xp: 5,
  },
  {
    id: "block1", time: "100 min", title: "Block 1 — Study Run → Check → Rework",
    desc: "Closed-book work, then grade with the sticky-note trick, then rework misses before peeking at the answer.",
    xp: 30, timer: [
      { label: "Study Run — answer key CLOSED", minutes: 60 },
      { label: "Check & Sticky-Note misses", minutes: 20 },
      { label: "Instant Rework — before peeking", minutes: 20 },
    ],
  },
  {
    id: "phone", time: "60 min cap", title: "Phone",
    desc: "Capped at an hour.",
    xp: 10, timer: [{ label: "Phone — 60 min cap", minutes: 60 }],
  },
  {
    id: "kindle", time: "1hr+", title: "Kindle",
    desc: "At least an hour — more is great, no cap on this one.",
    xp: 10,
  },
  {
    id: "block2", time: "100 min", title: "Block 2 — Study Run → Check → Rework",
    desc: "Same cycle as Block 1, new material.",
    xp: 30, timer: [
      { label: "Study Run — answer key CLOSED", minutes: 60 },
      { label: "Check & Sticky-Note misses", minutes: 20 },
      { label: "Instant Rework — before peeking", minutes: 20 },
    ],
  },
  {
    id: "dinner", time: "30–60 min", title: "Dinner",
    desc: "Whenever it's ready.",
    xp: 5,
  },
  {
    id: "block3", time: "35 min", title: "Block 3 — Ghost Review (after dinner)",
    desc: "No new material. Only flip to pages with a sticky note and rework them. Fixed it? Rip it out.",
    xp: 10, timer: [{ label: "Ghost Review — sticky-note pages only", minutes: 35 }],
  },
];

const KHANS_SAT_TASKS = [
  { id: "nophone", time: "morning", title: "No phone before Khan's", desc: "Walk in with a fresh brain, not a fried one.", xp: 20 },
  { id: "class", time: "10:00–1:30", title: "Khan's class", desc: "Lock in for the full session.", xp: 25 },
  {
    id: "homeblock", time: "75 min", title: "Home Block — Study Run → Check → Rework",
    desc: "One full cycle after class, once he's home and eaten.",
    xp: 35, timer: [
      { label: "Study Run — answer key CLOSED", minutes: 45 },
      { label: "Check & Sticky-Note misses", minutes: 15 },
      { label: "Instant Rework — before peeking", minutes: 15 },
    ],
  },
  {
    id: "ghost", time: "25 min", title: "Ghost Review",
    desc: "Flip only to sticky-note pages and rework them.",
    xp: 20, timer: [{ label: "Ghost Review — sticky-note pages only", minutes: 25 }],
  },
];
const KHANS_SUN_TASKS = KHANS_SAT_TASKS.map((t) => (t.id === "class" ? { ...t, time: "11:00–2:00" } : t));

const DAY_TYPES = { 0: "khans_sun", 1: "weekday", 2: "weekday", 3: "weekday", 4: "weekday", 5: "weekday", 6: "khans_sat" };
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

function getTasks(dayType) {
  if (dayType === "weekday") return WEEKDAY_TASKS;
  if (dayType === "khans_sat") return KHANS_SAT_TASKS;
  return KHANS_SUN_TASKS;
}
function dateKeyFor(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ---- root component --------------------------------------------------
export default function GuriQuestLog() {
  const [tab, setTab] = useState("today");
  const [checked, setChecked] = useState({});
  const [completedDates, setCompletedDates] = useState([]);
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

  async function toggle(id) {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    try { await window.storage.set(`guri-day:${dateKey}`, JSON.stringify(next)); } catch (e) {}

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
          {...{ sectionLabel, pct, earnedXP, totalXP, tasks, checked, toggle, completeViaTimer, allDone, doneCount, justUnlocked, daysCleared }}
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

// ---- TODAY tab -----------------------------------------------------
function TodayTab({ sectionLabel, pct, earnedXP, totalXP, tasks, checked, toggle, completeViaTimer, allDone, doneCount, justUnlocked, daysCleared }) {
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
          <span style={{ ...S.mono, fontSize: 9.5, color: "#7A8598" }}>timed block</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: 3, background: "#3DDC97", display: "inline-block" }} />
          <span style={{ ...S.mono, fontSize: 9.5, color: "#7A8598" }}>just check it off</span>
        </span>
      </div>
      <div style={{ padding: "0 16px" }}>
        {tasks.map((t) => {
          const on = !!checked[t.id];
          const isFixed = !t.timer;
          const accent = isFixed ? "#3DDC97" : "#2E6FF2";
          const accentLight = isFixed ? "#6FE3B4" : "#6FA8FF";
          const accentSoft = isFixed ? "rgba(61,220,151,0.08)" : "rgba(46,111,242,0.08)";
          const uncheckedBorder = isFixed ? "#17261F" : "#1E2530";
          const uncheckedBg = isFixed ? "#0F1713" : "#12161F";
          return (
            <div key={t.id} style={{ ...S.quest, borderColor: on ? accent : uncheckedBorder, background: on ? accentSoft : uncheckedBg }}>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => toggle(t.id)} aria-label={on ? "Mark incomplete" : "Mark complete"}
                  style={{ ...S.checkbox, borderColor: on ? accent : (isFixed ? "#2A4A3E" : "#3A4356"), background: on ? accent : "transparent", cursor: "pointer" }}>
                  {on && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span>}
                </button>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ ...S.display, fontSize: 15, color: on ? accentLight : "#E8ECF4", textDecorationLine: on ? "line-through" : "none", textDecorationColor: "#3A4356" }}>{t.title}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
                      {isFixed && <span style={{ ...S.mono, fontSize: 8, color: "#3DDC97", letterSpacing: 0.5, border: "1px solid #2A4A3E", borderRadius: 4, padding: "1px 4px" }}>NO TIMER</span>}
                      <span style={{ ...S.mono, fontSize: 10, color: "#556075" }}>{t.time}</span>
                    </span>
                  </div>
                  <p style={{ ...S.body, fontSize: 12.5, color: on ? "#556075" : "#8A94A8", margin: "5px 0 0", lineHeight: 1.5 }}>{t.desc}</p>
                </div>
                <span style={{ ...S.mono, fontSize: 10, color: on ? accentLight : "#556075", alignSelf: "flex-start", marginTop: 2 }}>+{t.xp}</span>
              </div>
              {t.timer && !on && <BlockTimer phases={t.timer} onFinish={() => completeViaTimer(t.id)} />}
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
      <Row n="1" title="Home from school" sub="Snack, chill, decompress. No set length." />
      <Row n="2" title="Block 1 — 100 min" sub="60 Study Run (book closed) → 20 Check & sticky-note → 20 Instant Rework." />
      <Row n="3" title="Phone — 60 min cap" sub="Timed, capped at an hour." />
      <Row n="4" title="Kindle — 1hr+" sub="No cap here. More reading is always good." />
      <Row n="5" title="Block 2 — 100 min" sub="Same cycle as Block 1, new material." />
      <Row n="6" title="Dinner — 30–60 min" sub="Whenever it's ready." />
      <Row n="7" title="Block 3 — 35 min" sub="Ghost Review only — no new material, just sticky-note pages." />
      <Row n="8" title="Kindle in bed → lights out" sub="Winds the day down on reading, not a screen." />

      <div style={{ height: 18 }} />
      <SectionLabel text="SATURDAY" />
      <Row n="1" title="No phone before class" sub="Fresh brain walking in." />
      <Row n="2" title="Khan's — 10:00–1:30" />
      <Row n="3" title="Home Block — 75 min" sub="45 Study Run → 15 Check → 15 Rework." />
      <Row n="4" title="Ghost Review — 25 min" />

      <div style={{ height: 18 }} />
      <SectionLabel text="SUNDAY" />
      <Row n="1" title="No phone before class" sub="Fresh brain walking in." />
      <Row n="2" title="Khan's — 11:00–2:00" />
      <Row n="3" title="Home Block — 75 min" sub="45 Study Run → 15 Check → 15 Rework." />
      <Row n="4" title="Ghost Review — 25 min" />

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
        This is how to check your Kaplan pages without the constant flip-flip-flipping. It's the whole error-log system — do it this way and you don't need a separate notebook.
      </p>
      <Step n="1" title="Study Run" desc="Do the pages exactly like normal. The rule: answer key stays completely closed. No peeking until the whole section's done." />
      <Step n="2" title="Check & Sticky-Note" desc="Open the answer key and grade. Got it right? Leave it, move on. Got it wrong? Grab a sticky note, write the correct letter (A/B/C/D) on the sticky side, and tape it right over Kaplan's explanation — completely blocking it." />
      <Step n="3" title="Instant Rework" desc="Before moving to new pages, go back to everything you missed. The answer's hidden under the sticky note, so you have to actually solve it again on scrap paper." tip="This step is the whole point — re-solving it yourself sticks way better than just reading why you were wrong." />
      <Step n="4" title="Reveal & Log" desc="Lift the sticky note. Got it right this time? Flip it over and write one line on the front — like 'missed the negative sign' or 'underline the main idea.' Leave the note in the book." />
      <Step n="5" title="Ghost Review (later)" desc="During a Ghost Review block, only open pages that still have a sticky note. Try the question again. Nail it easily? Rip the sticky out, it's dead. Miss it again? It stays for next time." tip="The sticky note is the error log. Once it's ripped out, that mistake is actually fixed." />
    </div>
  );
}

// ---- CALENDAR tab -----------------------------------------------------
function CalendarTab({ completedDates, todayKey }) {
  const [offset, setOffset] = useState(0);
  const base = new Date();
  const viewDate = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthLabel = viewDate.toLocaleString("en-US", { month: "long", year: "numeric" });
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
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

// ---- sequential block timer -----------------------------------------
function BlockTimer({ phases, onFinish }) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(phases[0].minutes * 60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const untouched = phaseIndex === 0 && secondsLeft === phases[0].minutes * 60;

  useEffect(() => {
    if (!running || done) return;
    if (secondsLeft <= 0) {
      if (phaseIndex + 1 < phases.length) {
        setPhaseIndex((p) => p + 1);
        setSecondsLeft(phases[phaseIndex + 1].minutes * 60);
      } else {
        setRunning(false);
        setDone(true);
        onFinish && onFinish();
      }
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [running, secondsLeft, phaseIndex, done]);

  function reset() { setRunning(false); setDone(false); setPhaseIndex(0); setSecondsLeft(phases[0].minutes * 60); }
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div style={S.timerBox}>
      {done ? (
        <div style={{ ...S.mono, fontSize: 11.5, color: "#F2C14E", textAlign: "center" }}>✓ Timer complete — quest checked off</div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ ...S.mono, fontSize: 10, color: "#7A8598", letterSpacing: 0.5 }}>PHASE {phaseIndex + 1}/{phases.length} · {phases[phaseIndex].label}</span>
            <span style={{ ...S.display, fontSize: 17, color: running ? "#6FA8FF" : "#C9D2E0" }}>{mm}:{ss}</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {!running ? (
              <button onClick={() => setRunning(true)} style={S.timerBtnPrimary}>{untouched ? "▶ Start Timer" : "▶ Resume"}</button>
            ) : (
              <button onClick={() => setRunning(false)} style={S.timerBtnPrimary}>⏸ Pause</button>
            )}
            {!untouched && <button onClick={reset} style={S.timerBtnGhost}>↺ Reset</button>}
          </div>
        </>
      )}
    </div>
  );
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
