import { readFileSync } from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const code = readFileSync(new URL("../extension/content/filter-bar-parse.js", import.meta.url), "utf8");
const sandbox = { globalThis: {} };
sandbox.globalThis = sandbox;
vm.runInNewContext(code, sandbox);
const F = sandbox.ChulgyeolFilterBar;
assert.ok(F, "ChulgyeolFilterBar");
assert.equal(typeof F.parseFilterBarByOrder, "function");

function check(name, fn) {
  try {
    fn();
    console.log("ok", name);
  } catch (e) {
    console.error("FAIL", name, e.message);
    process.exitCode = 1;
  }
}

check("normalizeDate dashed", () => {
  assert.equal(F.normalizeDate("2026-9-4"), "2026-09-04");
});
check("normalizeDate dots", () => {
  assert.equal(F.normalizeDate("2026.09.04"), "2026-09-04");
});
check("normalizeDate trailing dots", () => {
  assert.equal(F.normalizeDate("2026.09.04."), "2026-09-04");
  assert.equal(F.normalizeDate("2026.09.04.."), "2026-09-04");
});
check("normalizeDate korean", () => {
  assert.equal(F.normalizeDate("2026년 9월 4일"), "2026-09-04");
});
check("normalizeDate compact", () => {
  assert.equal(F.normalizeDate("20260904"), "2026-09-04");
});

check("parse bar spaced", () => {
  const p = F.parseFilterBarText("일일출결관리(담임용) 학년도 2026 학년 1 반 3 일자 2026-09-04 조회");
  assert.equal(p.year, 2026);
  assert.equal(p.grade, 1);
  assert.equal(p.class, 3);
  assert.equal(p.date, "2026-09-04");
});

check("parse bar nexacro-like tight", () => {
  const p = F.parseFilterBarText("학년도2026학년2반5일자2026.03.12");
  assert.equal(p.year, 2026);
  assert.equal(p.grade, 2);
  assert.equal(p.class, 5);
  assert.equal(p.date, "2026-03-12");
});

check("parse bar date trailing dot window", () => {
  const p = F.parseFilterBarText("학년도 2026 학년 1 반 3 일자 2026.09.04. 조회");
  assert.equal(p.year, 2026);
  assert.equal(p.grade, 1);
  assert.equal(p.class, 3);
  assert.equal(p.date, "2026-09-04");
});

check("parse bar split ymd after 일자", () => {
  const p = F.parseFilterBarText("학년도 2026 학년 3 반 1 일자 2026 09 04");
  assert.equal(p.year, 2026);
  assert.equal(p.date, "2026-09-04");
});

check("parseFilterBarByOrder same-band coords", () => {
  const labels = [
    { key: "year", x: 12, y: 8, right: 50 },
    { key: "grade", x: 120, y: 8, right: 148 },
    { key: "class", x: 190, y: 8, right: 208 },
    { key: "date", x: 260, y: 8, right: 286 },
  ];
  const tokens = [
    { text: "2026", x: 58, y: 8 },
    { text: "1", x: 152, y: 8 },
    { text: "3", x: 214, y: 8 },
    { text: "2026.09.04.", x: 292, y: 8 },
    { text: "조회", x: 400, y: 8 },
  ];
  const p = F.parseFilterBarByOrder(labels, tokens);
  assert.equal(p.year, 2026);
  assert.equal(p.grade, 1);
  assert.equal(p.class, 3);
  assert.equal(p.date, "2026-09-04");
});

check("parseFilterBarByOrder ignores off-band noise", () => {
  const labels = [
    { key: "year", x: 10, y: 10, right: 40 },
    { key: "grade", x: 100, y: 10, right: 130 },
    { key: "class", x: 160, y: 10, right: 180 },
    { key: "date", x: 220, y: 10, right: 250 },
  ];
  const tokens = [
    { text: "2026", x: 50, y: 10 },
    { text: "2", x: 135, y: 10 },
    { text: "5", x: 190, y: 10 },
    { text: "2026.03.12.", x: 260, y: 10 },
    { text: "999", x: 50, y: 200 },
  ];
  const p = F.parseFilterBarByOrder(labels, tokens);
  assert.equal(p.year, 2026);
  assert.equal(p.grade, 2);
  assert.equal(p.class, 5);
  assert.equal(p.date, "2026-03-12");
});

check("parseFilterBarByOrder split date tokens", () => {
  const labels = [
    { key: "year", x: 0, y: 0, right: 30 },
    { key: "date", x: 200, y: 0, right: 230 },
  ];
  const tokens = [
    { text: "2026", x: 40, y: 0 },
    { text: "2026", x: 240, y: 0 },
    { text: "09", x: 280, y: 0 },
    { text: "04", x: 310, y: 0 },
  ];
  const p = F.parseFilterBarByOrder(labels, tokens);
  assert.equal(p.year, 2026);
  assert.equal(p.date, "2026-09-04");
});

check("fixture html has no select/input and trailing-dot date", () => {
  const html = readFileSync(new URL("./fixtures/neis-filter-bar-nexacro.html", import.meta.url), "utf8");
  assert.equal(/<select\b/i.test(html), false);
  assert.equal(/<input\b/i.test(html), false);
  assert.match(html, /2026\.09\.04\./);
  assert.match(html, /position:\s*absolute/);
  assert.match(html, /학년도/);
  assert.match(html, />\s*1\s*</);
  assert.match(html, />\s*3\s*</);
});

check("merge prefers order over empty dom/text", () => {
  const order = F.parseFilterBarByOrder(
    [
      { key: "year", x: 0, y: 0, right: 20 },
      { key: "grade", x: 80, y: 0, right: 100 },
      { key: "class", x: 140, y: 0, right: 160 },
      { key: "date", x: 200, y: 0, right: 220 },
    ],
    [
      { text: "2026", x: 30, y: 0 },
      { text: "1", x: 110, y: 0 },
      { text: "3", x: 170, y: 0 },
      { text: "2026.09.04.", x: 230, y: 0 },
    ],
  );
  const text = F.parseFilterBarText("");
  const m = F.mergeFilterValues({ year: "", grade: "", class: "", date: "" }, text, order);
  assert.equal(m.year, 2026);
  assert.equal(m.grade, 1);
  assert.equal(m.class, 3);
  assert.equal(m.date, "2026-09-04");
  assert.equal(m._raw.srcYear, "order");
  assert.equal(m._raw.srcDate, "order");
});

check("merge prefers text when dom empty", () => {
  const text = F.parseFilterBarText("학년도 2026 학년 1 반 2 일자 2026-09-04");
  const m = F.mergeFilterValues({ year: "", grade: "", class: "", date: "" }, text);
  assert.equal(m.year, 2026);
  assert.equal(m.grade, 1);
  assert.equal(m.class, 2);
  assert.equal(m.date, "2026-09-04");
  assert.equal(m._raw.srcDate, "innerText");
});

check("merge keeps dom when present", () => {
  const text = F.parseFilterBarText("학년도 2025 학년 9 반 9 일자 2025-01-01");
  const m = F.mergeFilterValues(
    { year: "2026", grade: "1", class: "3", date: "2026-09-04" },
    text,
  );
  assert.equal(m.year, 2026);
  assert.equal(m.grade, 1);
  assert.equal(m.class, 3);
  assert.equal(m.date, "2026-09-04");
  assert.equal(m._raw.srcYear, "dom");
});

check("merge order beats conflicting innerText", () => {
  const order = {
    year: 2026,
    grade: 1,
    class: 3,
    date: "2026-09-04",
    raw: { year: "2026", grade: "1", class: "3", date: "2026-09-04" },
  };
  const text = F.parseFilterBarText("학년도 2025 학년 9 반 9 일자 2025-01-01");
  const m = F.mergeFilterValues({ year: "", grade: "", class: "", date: "" }, text, order);
  assert.equal(m.year, 2026);
  assert.equal(m.grade, 1);
  assert.equal(m.class, 3);
  assert.equal(m.date, "2026-09-04");
  assert.equal(m._raw.srcGrade, "order");
});

if (!process.exitCode) console.log("all filter-bar-parse tests passed");
