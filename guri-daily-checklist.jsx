import { useState, useEffect } from "react";

// ---- schedule data -------------------------------------------------
const KHANS_TASKS = [
  { id: "noscreen", time: "8:30–9:00", title: "Wake up clean", desc: "Cha, brush, chill. No PS5, no scrolling. Walk in with a fresh brain, not a fried one.", xp: 15 },
  { id: "kindle", time: "9:00–9:40", title: "Kindle 20–30 min", desc: "Reading now = free ELA points later. It doesn't even feel like studying.", xp: 15 },
  { id: "khans", time: "10:00–2:00", title: "Khan's class", desc: "Actually lock in. Half-listening wastes the whole 4 hours.", xp: 20 },
  { id: "packet", time: "after 4", title: "The Block: 5–7 packet questions", desc: "Worked through properly, not speedran. Phone stays outside the room.", xp: 30 },
  { id: "errorlog", time: "after 4", title: "Error log", desc: "Every miss goes in the notebook: what it tested, why you missed it, how to do it right. No googling answers.", xp: 20 },
];

const SUNDAY_TASKS = [
  { id: "class", time: "11:00–1:30", title: "Khan's class", desc: "Short day. Still lock in.", xp: 25 },
  { id: "wrap1", time: "after lunch", title: "Finish + check the packet", desc: "All 33 done before the new one drops. No last-day cram.", xp: 25 },
  { id: "wrap2", time: "after lunch", title: "Reread the week's error log", desc: "The whole week. This is where the points actually come from.", xp: 25 },
  { id: "wrap3", time: "after lunch", title: "Redo 3–5 missed questions", desc: "Without looking at the answer. Get them right now = you actually learned it.", xp: 25 },
];

const DAY_TYPES = {
  0: "sunday", 1: "rest", 2: "khans", 3: "khans", 4: "khans", 5: "rest", 6: "khans",
};
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ---- component -----------------------------------------------------
export default function GuriQuestLog() {
  const [checked, setChecked] = useState({});
  const [daysCleared, setDaysCleared] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [restoreInput, setRestoreInput] = useState("");
  const [restoreMsg, setRestoreMsg] = useState("");
  const [notes, setNotes] = useState([]);
  const [noteInput, setNoteInput] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  async function saveNotes(next) {
    setNotes(next);
    try {
      await window.storage.set("guri-notes", JSON.stringify(next));
    } catch (e) { console.error("notes save failed", e); }
  }

  function addNote() {
    const text = noteInput.trim();
    if (!text) return;
    const d = new Date();
    const stamp = `${DAY_NAMES[d.getDay()].slice(0, 3)} ${d.getMonth() + 1}/${d.getDate()}`;
    saveNotes([{ id: Date.now(), stamp, text }, ...notes]);
    setNoteInput("");
  }

  function deleteNote(id) {
    saveNotes(notes.filter((n) => n.id !== id));
  }

  async function restoreFromCode() {
    try {
      const data = JSON.parse(atob(restoreInput.trim()));
      if (typeof data.c !== "number" || data.g !== "guri") throw new Error("bad code");
      setDaysCleared(data.c);
      await window.storage.set("guri-days-cleared", JSON.stringify({ count: data.c }));
      setRestoreMsg(`✓ Restored — ${data.c} days cleared`);
      setRestoreInput("");
    } catch (e) {
      setRestoreMsg("✕ That code isn't right — check for typos");
    }
  }

  const now = new Date();
  const dayType = DAY_TYPES[now.getDay()];
  const dayName = DAY_NAMES[now.getDay()];
  const dateKey = todayKey();
  const tasks = dayType === "sunday" ? SUNDAY_TASKS : KHANS_TASKS;

  // load saved state
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(`guri-day:${dateKey}`);
        if (r?.value) setChecked(JSON.parse(r.value));
      } catch (e) { /* no save yet */ }
      try {
        const s = await window.storage.get("guri-days-cleared");
        if (s?.value) setDaysCleared(JSON.parse(s.value).count || 0);
      } catch (e) { /* no save yet */ }
      try {
        const n = await window.storage.get("guri-notes");
        if (n?.value) setNotes(JSON.parse(n.value));
      } catch (e) { /* no notes yet */ }
      setLoaded(true);
    })();
  }, [dateKey]);

  const doneCount = tasks.filter((t) => checked[t.id]).length;
  const totalXP = tasks.reduce((a, t) => a + t.xp, 0);
  const earnedXP = tasks.reduce((a, t) => a + (checked[t.id] ? t.xp : 0), 0);
  const pct = Math.round((earnedXP / totalXP) * 100);
  const allDone = dayType !== "rest" && doneCount === tasks.length;

  async function toggle(id) {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    try {
      await window.storage.set(`guri-day:${dateKey}`, JSON.stringify(next));
    } catch (e) { console.error("save failed", e); }

    const nowAllDone = tasks.every((t) => next[t.id]);
    const wasAllDone = tasks.every((t) => checked[t.id]);
    if (nowAllDone && !wasAllDone) {
      setJustUnlocked(true);
      const newCount = daysCleared + 1;
      setDaysCleared(newCount);
      try {
        await window.storage.set("guri-days-cleared", JSON.stringify({ count: newCount }));
      } catch (e) { console.error("save failed", e); }
      setTimeout(() => setJustUnlocked(false), 2400);
    } else if (!nowAllDone && wasAllDone && daysCleared > 0) {
      const newCount = daysCleared - 1;
      setDaysCleared(newCount);
      try {
        await window.storage.set("guri-days-cleared", JSON.stringify({ count: newCount }));
      } catch (e) { console.error("save failed", e); }
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

  // ---- rest day screen ----
  if (dayType === "rest") {
    return (
      <div style={S.shell}>
        <style>{FONTS}</style>
        <Header dayName={dayName} daysCleared={daysCleared} />
        <div style={S.restCard}>
          <div style={S.psRow}>{["△", "○", "✕", "□"].map((s, i) => (
            <span key={i} style={{ ...S.psSym, opacity: 0.35 }}>{s}</span>
          ))}</div>
          <div style={{ ...S.display, fontSize: 30, color: "#E8ECF4", marginTop: 14 }}>FREE DAY</div>
          <p style={{ ...S.body, color: "#9AA4B5", maxWidth: 340, margin: "12px auto 0", lineHeight: 1.6 }}>
            No quests today. One rule only:
          </p>
          <div style={S.restRule}>
            <span style={{ ...S.mono, color: "#F2C14E", fontSize: 12, letterSpacing: 1 }}>⚠ DO NOT TOUCH</span>
            <p style={{ ...S.body, color: "#C9D2E0", margin: "6px 0 0", fontSize: 14, lineHeight: 1.55 }}>
              The 3 practice tests in the back of the Kaplan book. Those are Sept/Oct dress rehearsals. Burning them now wastes them.
            </p>
          </div>
        </div>
        <NotesPanel {...{ notes, noteInput, setNoteInput, showNotes, setShowNotes, addNote, deleteNote }} />
        <BackupPanel {...{ daysCleared, showBackup, setShowBackup, restoreInput, setRestoreInput, restoreMsg, restoreFromCode }} />
        <Footer />
      </div>
    );
  }

  // ---- quest day screen ----
  return (
    <div style={S.shell}>
      <style>{FONTS}</style>
      <Header dayName={dayName} daysCleared={daysCleared} />

      {/* XP bar */}
      <div style={S.xpWrap}>
        <div style={S.xpLabelRow}>
          <span style={{ ...S.mono, fontSize: 11, color: "#7A8598", letterSpacing: 1.5 }}>
            {dayType === "sunday" ? "WEEKLY WRAP" : "DAILY QUESTS"}
          </span>
          <span style={{ ...S.mono, fontSize: 11, color: pct === 100 ? "#F2C14E" : "#6FA8FF", letterSpacing: 1 }}>
            {earnedXP} / {totalXP} XP
          </span>
        </div>
        <div style={S.xpTrack}>
          <div style={{ ...S.xpFill, width: `${pct}%`, background: pct === 100 ? "linear-gradient(90deg,#F2C14E,#FFDD87)" : "linear-gradient(90deg,#2E6FF2,#6FA8FF)" }} />
        </div>
      </div>

      {/* quest list */}
      <div style={{ padding: "0 16px" }}>
        {tasks.map((t) => {
          const on = !!checked[t.id];
          return (
            <button key={t.id} onClick={() => toggle(t.id)} style={{ ...S.quest, borderColor: on ? "#2E6FF2" : "#1E2530", background: on ? "rgba(46,111,242,0.08)" : "#12161F" }}>
              <div style={{ ...S.checkbox, borderColor: on ? "#2E6FF2" : "#3A4356", background: on ? "#2E6FF2" : "transparent" }}>
                {on && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span>}
              </div>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ ...S.display, fontSize: 15, color: on ? "#8FA6C9" : "#E8ECF4", textDecorationLine: on ? "line-through" : "none", textDecorationColor: "#3A4356" }}>
                    {t.title}
                  </span>
                  <span style={{ ...S.mono, fontSize: 10, color: "#556075", whiteSpace: "nowrap" }}>{t.time}</span>
                </div>
                <p style={{ ...S.body, fontSize: 12.5, color: on ? "#556075" : "#8A94A8", margin: "5px 0 0", lineHeight: 1.5 }}>
                  {t.desc}
                </p>
              </div>
              <span style={{ ...S.mono, fontSize: 10, color: on ? "#6FA8FF" : "#556075", alignSelf: "center" }}>+{t.xp}</span>
            </button>
          );
        })}
      </div>

      {/* PS5 lock card */}
      <div style={{ ...S.lockCard, borderColor: allDone ? "#F2C14E" : "#1E2530", background: allDone ? "rgba(242,193,78,0.07)" : "#0F131B" }}>
        <div style={S.psRow}>
          {["△", "○", "✕", "□"].map((s, i) => (
            <span key={i} style={{ ...S.psSym, color: allDone ? "#F2C14E" : "#3A4356", transition: "color 0.5s", transitionDelay: `${i * 0.1}s` }}>{s}</span>
          ))}
        </div>
        <div style={{ ...S.display, fontSize: 22, letterSpacing: 2, marginTop: 10, color: allDone ? "#F2C14E" : "#556075" }}>
          {allDone ? "PS5 UNLOCKED" : "PS5 LOCKED"}
        </div>
        <p style={{ ...S.body, fontSize: 12.5, color: allDone ? "#C9B27A" : "#556075", margin: "6px 0 0" }}>
          {allDone
            ? "Done for the day. It's yours — guilt-free. Nobody says a word."
            : `Clear ${tasks.length - doneCount} more quest${tasks.length - doneCount === 1 ? "" : "s"} → free play, no lectures.`}
        </p>
      </div>

      {justUnlocked && (
        <div style={S.toast}>
          <span style={{ ...S.display, fontSize: 14, letterSpacing: 1.5, color: "#0B0E14" }}>🏆 DAY CLEARED — {daysCleared} TOTAL</span>
        </div>
      )}

      <NotesPanel {...{ notes, noteInput, setNoteInput, showNotes, setShowNotes, addNote, deleteNote }} />
      <BackupPanel {...{ daysCleared, showBackup, setShowBackup, restoreInput, setRestoreInput, restoreMsg, restoreFromCode }} />
      <Footer />
    </div>
  );
}

function NotesPanel({ notes, noteInput, setNoteInput, showNotes, setShowNotes, addNote, deleteNote }) {
  return (
    <div style={{ padding: "16px 16px 0" }}>
      <button
        onClick={() => setShowNotes(!showNotes)}
        style={{ ...S.mono, fontSize: 10, letterSpacing: 1, color: "#7A8598", background: "#0F131B", border: "1px solid #1E2530", borderRadius: 10, cursor: "pointer", padding: "10px 0", width: "100%", textAlign: "center" }}
      >
        {showNotes ? `▴ NOTES (${notes.length})` : `▾ NOTES — problems, complaints, anything (${notes.length})`}
      </button>

      {showNotes && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addNote(); }}
              placeholder="e.g. packet Q14 made no sense"
              style={{ ...S.body, flex: 1, fontSize: 13, color: "#E8ECF4", background: "#12161F", border: "1px solid #1E2530", borderRadius: 8, padding: "10px 11px", outline: "none", minWidth: 0 }}
            />
            <button onClick={addNote} disabled={!noteInput.trim()} style={{ ...S.display, fontSize: 12, letterSpacing: 1, color: noteInput.trim() ? "#0B0E14" : "#556075", background: noteInput.trim() ? "#6FA8FF" : "#1E2530", border: "none", borderRadius: 8, padding: "10px 14px", cursor: noteInput.trim() ? "pointer" : "default" }}>
              ADD
            </button>
          </div>

          {notes.length === 0 ? (
            <p style={{ ...S.body, fontSize: 12, color: "#556075", textAlign: "center", padding: "14px 0 4px" }}>
              Nothing yet. Stuck on something? Class issue? Drop it here so it doesn't get forgotten.
            </p>
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

function BackupPanel({ daysCleared, showBackup, setShowBackup, restoreInput, setRestoreInput, restoreMsg, restoreFromCode }) {
  const code = btoa(JSON.stringify({ g: "guri", c: daysCleared }));
  const [copyState, setCopyState] = useState("idle");

  async function copyCode() {
    try {
      if (!navigator.clipboard) throw new Error("no clipboard");
      await navigator.clipboard.writeText(code);
      setCopyState("copied");
    } catch (e) {
      setCopyState("manual");
    }
    setTimeout(() => setCopyState("idle"), 2500);
  }

  return (
    <div style={{ padding: "10px 16px 0" }}>
      <button
        onClick={() => setShowBackup(!showBackup)}
        style={{ ...S.mono, fontSize: 10, letterSpacing: 1, color: "#556075", background: "none", border: "none", cursor: "pointer", padding: "6px 0", width: "100%", textAlign: "center" }}
      >
        {showBackup ? "▴ HIDE BACKUP" : "▾ BACKUP / TRANSFER STREAK"}
      </button>

      {showBackup && (
        <div style={{ border: "1px solid #1E2530", borderRadius: 12, padding: "14px 14px", background: "#0F131B", marginTop: 4 }}>
          <div style={{ ...S.mono, fontSize: 10, letterSpacing: 1.5, color: "#7A8598" }}>YOUR TRANSFER CODE</div>
          <p style={{ ...S.body, fontSize: 11.5, color: "#8A94A8", margin: "5px 0 8px", lineHeight: 1.5 }}>
            If this app ever gets updated to a new version, copy this code (or screenshot it) and paste it into the new one to keep your Days Cleared streak.
          </p>
          <button onClick={copyCode} style={{ ...S.mono, fontSize: 12, color: "#6FA8FF", background: "#12161F", border: "1px solid #2E6FF2", borderRadius: 8, padding: "9px 12px", width: "100%", cursor: "pointer", wordBreak: "break-all", textAlign: "left", userSelect: "text" }}>
            {code}
            <span style={{ display: "block", fontSize: 9, color: copyState === "idle" ? "#556075" : "#F2C14E", marginTop: 5, letterSpacing: 1 }}>
              {copyState === "copied" ? "✓ COPIED" : copyState === "manual" ? "COPY BLOCKED — SCREENSHOT THIS INSTEAD" : "TAP TO COPY"}
            </span>
          </button>

          <div style={{ ...S.mono, fontSize: 10, letterSpacing: 1.5, color: "#7A8598", marginTop: 16 }}>RESTORE A STREAK</div>
          <div style={{ display: "flex", gap: 8, marginTop: 7 }}>
            <input
              value={restoreInput}
              onChange={(e) => setRestoreInput(e.target.value)}
              placeholder="paste code here"
              style={{ ...S.mono, flex: 1, fontSize: 12, color: "#E8ECF4", background: "#12161F", border: "1px solid #1E2530", borderRadius: 8, padding: "9px 10px", outline: "none", minWidth: 0 }}
            />
            <button onClick={restoreFromCode} disabled={!restoreInput.trim()} style={{ ...S.display, fontSize: 12, letterSpacing: 1, color: restoreInput.trim() ? "#0B0E14" : "#556075", background: restoreInput.trim() ? "#6FA8FF" : "#1E2530", border: "none", borderRadius: 8, padding: "9px 14px", cursor: restoreInput.trim() ? "pointer" : "default" }}>
              RESTORE
            </button>
          </div>
          {restoreMsg && (
            <div style={{ ...S.mono, fontSize: 11, color: restoreMsg.startsWith("✓") ? "#F2C14E" : "#E06C6C", marginTop: 8 }}>{restoreMsg}</div>
          )}
        </div>
      )}
    </div>
  );
}

function Header({ dayName, daysCleared }) {
  return (
    <div style={S.header}>
      <div>
        <div style={{ ...S.mono, fontSize: 10, letterSpacing: 3, color: "#556075" }}>SHSAT GRIND · AUGUST</div>
        <div style={{ ...S.display, fontSize: 26, color: "#E8ECF4", marginTop: 3 }}>
          GURI<span style={{ color: "#2E6FF2" }}>.</span> <span style={{ fontSize: 15, color: "#7A8598", fontWeight: 400 }}>{dayName}</span>
        </div>
      </div>
      <div style={S.streakBadge}>
        <div style={{ ...S.display, fontSize: 20, color: "#F2C14E", lineHeight: 1 }}>{daysCleared}</div>
        <div style={{ ...S.mono, fontSize: 8.5, letterSpacing: 1, color: "#7A8598", marginTop: 2 }}>DAYS CLEARED</div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <p style={{ ...S.mono, fontSize: 10, color: "#3A4356", textAlign: "center", padding: "18px 20px 26px", letterSpacing: 0.5, lineHeight: 1.7 }}>
      work before games, every day · error log &gt; 100 extra questions
    </p>
  );
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
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 18px 14px" },
  streakBadge: { border: "1px solid #1E2530", borderRadius: 10, padding: "8px 12px", textAlign: "center", background: "#0F131B" },
  xpWrap: { padding: "4px 18px 16px" },
  xpLabelRow: { display: "flex", justifyContent: "space-between", marginBottom: 6 },
  xpTrack: { height: 8, borderRadius: 4, background: "#161B26", overflow: "hidden", border: "1px solid #1E2530" },
  xpFill: { height: "100%", borderRadius: 4, transition: "width 0.45s cubic-bezier(0.22,1,0.36,1)" },
  quest: { display: "flex", gap: 12, width: "100%", padding: "13px 13px", marginBottom: 9, borderRadius: 12, border: "1px solid", cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit" },
  checkbox: { width: 22, height: 22, minWidth: 22, borderRadius: 7, border: "2px solid", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2, transition: "all 0.2s" },
  lockCard: { margin: "14px 16px 0", padding: "20px 16px", borderRadius: 14, border: "1px dashed", textAlign: "center", transition: "all 0.4s" },
  psRow: { display: "flex", justifyContent: "center", gap: 14 },
  psSym: { fontSize: 16, fontFamily: "'Chakra Petch', sans-serif", fontWeight: 600 },
  restCard: { margin: "30px 16px 0", padding: "34px 20px", borderRadius: 16, border: "1px solid #1E2530", background: "#0F131B", textAlign: "center" },
  restRule: { margin: "20px auto 0", maxWidth: 340, padding: "14px 16px", borderRadius: 12, border: "1px solid rgba(242,193,78,0.3)", background: "rgba(242,193,78,0.05)", textAlign: "left" },
  toast: { position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(90deg,#F2C14E,#FFDD87)", padding: "11px 20px", borderRadius: 30, animation: "toastIn 0.35s ease", zIndex: 50, whiteSpace: "nowrap", boxShadow: "0 6px 24px rgba(242,193,78,0.35)" },
};
