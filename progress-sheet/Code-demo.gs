// SHSAT Quest Log: DEMO progress log (same as Code.gs, for the ?demo link)
// ---------------------------------------------------------------------------
// The Quest Log app on his phone sends a small update here every time he taps
// ✓ Done or 👨‍🏫 Ask tutor, every time he writes what was hard, and a quiet one
// with today's Kaplan time when he leaves the app. This script keeps the "Guri
// SHSAT Progress" Google Sheet up to date and emails Depinder each time a
// lesson is done, sent to the tutor, or gets a "this is hard" note.
//
// Setup, once: paste this into Extensions → Apps Script in the Sheet, run
// setup(), then Deploy → New deployment → Web app (Execute as: Me, Who has
// access: Anyone) and put the web app URL in the app's REPORT_URL.
//
// The app owns all the logic (what's done, what's next). This script only
// writes what it's sent, so the Sheet always matches his phone.

// The two lines that differ between the real Sheet and the demo copy
// (progress-sheet/Code-demo.gs): which Sheet, and whether to email.
const SHEET_ID = "1FILpGpOpXjYdK1Ag6kO1G-uaENrNSaK_BwjswdvMDs8";
const SEND_EMAILS = false; // the demo is public, so it never emails
const TITLE = "SHSAT Quest Log: demo progress";
const TZ = "America/New_York";
const MAX_EMAILS_PER_DAY = 30; // the web app URL is public, so cap the emails
const ACTION_LABELS = { done: "Done", tutor: "Ask tutor", undo: "Undone", note: "Said it's hard" };
const STATUSES = ["Done", "Done (knew it)", "For tutor", "Open"];

// ---- web app ----------------------------------------------------------------
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000); // two updates at once must not interleave their writes
  try {
    let data;
    try { data = JSON.parse(e.postData.contents); } catch (err) { return text("bad json"); }
    if (!valid(data)) return text("ignored");
    const ss = SpreadsheetApp.openById(SHEET_ID);
    ensureSetup(ss);
    writeLessons(ss, data);
    writeDay(ss, data);
    if (data.kind === "lesson" || data.kind === "note") {
      writeLog(ss, data);
      if (SEND_EMAILS && data.event.action !== "undo") sendEmail(ss, data);
    }
    return text("ok");
  } finally {
    lock.releaseLock();
  }
}

// Opening the web app URL in a browser shows this, to check it's running.
function doGet() {
  return text("Guri's progress log is running.");
}

function text(s) {
  return ContentService.createTextOutput(s);
}

// Anyone can post to a public URL, so only accept updates shaped like the app's.
function valid(d) {
  if (!d || d.v !== 1 || !Array.isArray(d.lessons) || d.lessons.length > 200) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(d.today)) || typeof d.at !== "number") return false;
  if (d.kind === "lesson" || d.kind === "note") {
    const ev = d.event || {};
    if (!ACTION_LABELS[ev.action] || typeof ev.lesson !== "string") return false;
    if ((d.kind === "note") !== (ev.action === "note")) return false;
    if (d.kind === "note" && typeof ev.text !== "string") return false;
  } else if (d.kind !== "sync") return false;
  return d.lessons.every((r) => Array.isArray(r) && (r.length === 6 || r.length === 7) && STATUSES.indexOf(r[3]) !== -1);
}

// ---- writing ----------------------------------------------------------------
// Lessons tab: one row per lesson, replaced in full with what the phone has.
// Column G is what he said is hard about it (open notes only).
function writeLessons(ss, d) {
  const sh = ss.getSheetByName("Lessons");
  const rows = d.lessons.map((r) => [str(r[0]), str(r[1]), str(r[2]), r[3], toDate(r[4]), str(r[5]), str(r[6])]);
  const old = Math.max(sh.getLastRow() - 1, 0);
  if (old > 0) sh.getRange(2, 1, old, 7).clearContent();
  if (rows.length) sh.getRange(2, 1, rows.length, 7).setValues(rows);
  sh.getRange("H2").setValue(new Date(d.at));
}

// Days tab: one row per date with that day's Kaplan minutes. Columns D and E
// are formulas, so only A:C are written.
function writeDay(ss, d) {
  const sh = ss.getSheetByName("Days");
  const day = toDate(d.today);
  const math = num(d.kaplan && d.kaplan.math), ela = num(d.kaplan && d.kaplan.ela);
  const col = sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), 1).getValues();
  let row = -1, last = 1;
  for (let i = 1; i < col.length; i++) {
    if (col[i][0] === "" || col[i][0] === null) continue;
    last = i + 1;
    if (sameDay(col[i][0], day)) row = i + 1;
  }
  if (row === -1) row = last + 1;
  sh.getRange(row, 1, 1, 3).setValues([[day, math, ela]]);
}

// Log tab: one row per tap, newest at the bottom.
function writeLog(ss, d) {
  const sh = ss.getSheetByName("Log");
  const ev = d.event, s = d.summary || {};
  const what = ev.action === "note" ? ACTION_LABELS.note + ": " + str(ev.text) : ACTION_LABELS[ev.action];
  sh.appendRow([new Date(d.at), str(ev.subj), str(ev.lesson), what, num(s.left),
    num(d.kaplan && d.kaplan.math) + num(d.kaplan && d.kaplan.ela)]);
}

function sendEmail(ss, d) {
  const props = PropertiesService.getScriptProperties();
  const key = "emails:" + d.today;
  const sent = Number(props.getProperty(key) || 0);
  if (sent >= MAX_EMAILS_PER_DAY) return;
  props.setProperty(key, String(sent + 1));

  const ev = d.event, s = d.summary || {};
  const k = d.kaplan || {};
  const time = Utilities.formatDate(new Date(d.at), TZ, "h:mm a");
  const first = ev.action === "note"
    ? "Guri said " + ev.lesson + " (" + ev.subj + ") is hard: \u201C" + str(ev.text) + "\u201D (" + time + ")."
    : ev.action === "tutor"
      ? "Guri got some of " + ev.lesson + " (" + ev.subj + ") wrong and put it on his tutor list (" + time + ")."
      : "Guri finished " + ev.lesson + " (" + ev.subj + ") at " + time + ".";
  const subject = ev.action === "note" ? "📝 Guri says " + ev.lesson + " is hard: " + str(ev.text)
    : ev.action === "tutor" ? "👨‍🏫 Guri needs his tutor for " + ev.lesson
    : "✓ Guri finished " + ev.lesson;
  const body = [
    first,
    "",
    "Today: " + num(s.handledToday) + " lesson" + (num(s.handledToday) === 1 ? "" : "s") +
      ", Kaplan " + mins(num(k.math) + num(k.ela)) + " (Math " + mins(num(k.math)) + ", ELA " + mins(num(k.ela)) + ")",
    "Left: " + num(s.left) + " lessons, " + num(s.daysLeft) + " days to the test",
    "Next: " + str(s.next),
    "For his tutor: " + (str(s.tutor) || "nothing"),
    "Open his Notes tab with the tutor to go over what he wrote.",
    "",
    "Full log: " + ss.getUrl(),
  ].join("\n");
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), subject, body);
}

// ---- setup ------------------------------------------------------------------
// Builds the four tabs. Run it once from the editor; doPost also calls it, so
// a tab that goes missing gets rebuilt.
function setup() {
  ensureSetup(SpreadsheetApp.openById(SHEET_ID), true);
}

function ensureSetup(ss, force) {
  if (!force && ss.getSheetByName("Now") && ss.getSheetByName("Lessons") && ss.getSheetByName("Days") && ss.getSheetByName("Log")) return;
  ss.setSpreadsheetTimeZone(TZ);
  const first = ss.getSheets()[0];
  if (!ss.getSheetByName("Now") && first.getLastRow() === 0) first.setName("Now");
  const now = tab(ss, "Now"), lessons = tab(ss, "Lessons"), days = tab(ss, "Days"), log = tab(ss, "Log");

  header(lessons, ["Subject", "Lesson", "Page", "Status", "Date", "Next", "What he says is hard"]);
  lessons.getRange("H1").setValue("Last update").setFontWeight("bold");
  lessons.getRange("E2:E").setNumberFormat("ddd m/d");
  lessons.getRange("H2").setNumberFormat("ddd m/d h:mm am/pm");
  widths(lessons, [80, 110, 150, 120, 90, 60, 220, 150]);
  const status = lessons.getRange("D2:D");
  lessons.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenTextStartsWith("Done").setBackground("#D9EAD3").setRanges([status]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo("For tutor").setBackground("#E6D9F2").setRanges([status]).build(),
  ]);

  header(days, ["Date", "Math (min)", "ELA (min)"]);
  days.getRange("D1").setFormula('={"Total (min)";ARRAYFORMULA(IF(LEN(A2:A),B2:B+C2:C,))}');
  days.getRange("E1").setFormula('={"Lessons (done or for tutor)";ARRAYFORMULA(IF(LEN(A2:A),' +
    'COUNTIFS(Lessons!E2:E,A2:A,Lessons!D2:D,"Done")+COUNTIFS(Lessons!E2:E,A2:A,Lessons!D2:D,"For tutor"),))}');
  days.getRange("D1:E1").setFontWeight("bold").setBackground("#1F3864").setFontColor("#FFFFFF");
  days.getRange("A2:A").setNumberFormat("ddd m/d");
  widths(days, [90, 90, 90, 90, 190]);

  header(log, ["When", "Subject", "Lesson", "What happened", "Lessons left", "Kaplan today (min)"]);
  log.getRange("A2:A").setNumberFormat("ddd m/d h:mm am/pm");
  widths(log, [150, 80, 110, 160, 100, 140]);

  const L = (r) => "Lessons!" + r;
  const rows = [
    [TITLE, ""],
    ["Fills in from his phone. Blue cells are settings you can change.", ""],
    ["", ""],
    ["Test date", ""],
    ["Days to the test", "=B4-TODAY()"],
    ["Lessons left", '=COUNTIF(' + L("D2:D") + ',"Open")+COUNTIF(' + L("D2:D") + ',"For tutor")'],
    ["Math left", '=COUNTIFS(' + L("A2:A") + ',"Math",' + L("D2:D") + ',"Open")+COUNTIFS(' + L("A2:A") + ',"Math",' + L("D2:D") + ',"For tutor")'],
    ["ELA left", '=COUNTIFS(' + L("A2:A") + ',"ELA",' + L("D2:D") + ',"Open")+COUNTIFS(' + L("A2:A") + ',"ELA",' + L("D2:D") + ',"For tutor")'],
    ["Lessons today (done or for tutor)", '=COUNTIFS(' + L("D2:D") + ',"Done",' + L("E2:E") + ',TODAY())+COUNTIFS(' + L("D2:D") + ',"For tutor",' + L("E2:E") + ',TODAY())'],
    ["Kaplan today (min)", "=IFERROR(VLOOKUP(TODAY(),Days!A2:D,4,FALSE),0)"],
    ["Next math", '=IFERROR(INDEX(FILTER(' + L("B2:B") + ',' + L("A2:A") + '="Math",' + L("F2:F") + '="Next"),1),"None left")'],
    ["Next ELA", '=IFERROR(INDEX(FILTER(' + L("B2:B") + ',' + L("A2:A") + '="ELA",' + L("F2:F") + '="Next"),1),"None left")'],
    ["For his tutor", '=IFERROR(TEXTJOIN(", ",TRUE,FILTER(' + L("A2:A") + '&" "&' + L("B2:B") + ',' + L("D2:D") + '="For tutor")),"Nothing")'],
    ["What he says is hard", '=IFERROR(TEXTJOIN("; ",TRUE,FILTER(' + L("B2:B") + '&": "&' + L("G2:G") + ',' + L("G2:G") + '<>"")),"Nothing")'],
    ["Lessons per day (plan)", 2],
    ["Done by, at that pace", "=IF(OR(B6=0,B15<=0),TODAY(),TODAY()+ROUNDUP(B6/B15,0)-1)"],
    ["Last update from his phone", '=IF(Lessons!H2="","Waiting for his phone",Lessons!H2)'],
  ];
  now.getRange(1, 1, rows.length, 2).setValues(rows);
  now.getRange("B4").setValue(new Date(2026, 10, 18)).setNumberFormat("mmm d, yyyy")
    .setNote("Source: his test date, from Depinder (Oct 2026)");
  now.getRange("B15").setNote("Source: the daily goal in his app");
  now.getRange("B4").setFontColor("#0000FF");
  now.getRange("B15").setFontColor("#0000FF");
  now.getRange("B16").setNumberFormat("ddd mmm d");
  now.getRange("B17").setNumberFormat("ddd m/d h:mm am/pm");
  now.getRange("B5:B17").setHorizontalAlignment("left");
  now.getRange("A1").setFontWeight("bold").setFontSize(14);
  now.getRange("A2").setFontColor("#666666");
  now.getRange("A4:A17").setFontWeight("bold");
  now.getRange("B13:B14").setWrap(true);
  widths(now, [230, 260]);
}

function tab(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function header(sh, names) {
  sh.getRange(1, 1, 1, names.length).setValues([names])
    .setFontWeight("bold").setBackground("#1F3864").setFontColor("#FFFFFF");
  sh.setFrozenRows(1);
}

function widths(sh, px) {
  px.forEach((w, i) => sh.setColumnWidth(i + 1, w));
}

// ---- small helpers ----------------------------------------------------------
function toDate(key) {
  return key ? Utilities.parseDate(String(key), TZ, "yyyy-MM-dd") : "";
}

function sameDay(a, b) {
  if (!(a instanceof Date) || !(b instanceof Date)) return false;
  return Utilities.formatDate(a, TZ, "yyyy-MM-dd") === Utilities.formatDate(b, TZ, "yyyy-MM-dd");
}

function str(v) {
  return v === undefined || v === null ? "" : String(v).slice(0, 200);
}

function num(v) {
  const n = Number(v);
  return isFinite(n) ? Math.round(n) : 0;
}

// 80 -> "1h 20m", 45 -> "45m"
function mins(m) {
  return m >= 60 ? Math.floor(m / 60) + "h " + (m % 60) + "m" : m + "m";
}
