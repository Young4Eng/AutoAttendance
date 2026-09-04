import { readFileSync } from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const code = readFileSync(new URL("../extension/content/row-match.js", import.meta.url), "utf8");
const sandbox = { globalThis: {} };
sandbox.globalThis = sandbox;
vm.runInNewContext(code, sandbox);
const R = sandbox.ChulgyeolRowMatch;
assert.ok(R, "ChulgyeolRowMatch");

function check(name, fn) {
  try {
    fn();
    console.log("ok", name);
  } catch (e) {
    console.error("FAIL", name, e.message);
    process.exitCode = 1;
  }
}

/** Fixture-equivalent leaf records (no DOM). Numbers 1,2,3,4,7,9 — 학생01 at 9. */
function fixtureLeaves() {
  const rows = [
    { num: "1", name: "학생A1", y: 46 },
    { num: "2", name: "학생A2", y: 70 },
    { num: "3", name: "학생A3", y: 94 },
    { num: "4", name: "학생A4", y: 118 },
    { num: "7", name: "학생A7", y: 142 },
    { num: "9", name: "학생01", y: 166 },
  ];
  const leaves = [];
  // headers
  for (const [t, x] of [
    ["번호", 20],
    ["성명", 70],
    ["마감", 150],
    ["조회", 210],
    ["1교시", 270],
    ["2교시", 330],
    ["3교시", 390],
    ["종례", 450],
  ]) {
    leaves.push({ text: t, x, y: 14 });
  }
  for (const r of rows) {
    leaves.push({ text: r.num, x: 20, y: r.y });
    leaves.push({ text: r.name, x: 70, y: r.y });
    leaves.push({ text: "미마감", x: 150, y: r.y });
    leaves.push({ text: "미마감", x: 210, y: r.y });
    leaves.push({ text: "미마감", x: 270, y: r.y });
    leaves.push({ text: "미마감", x: 330, y: r.y });
    leaves.push({ text: "미마감", x: 390, y: r.y });
    leaves.push({ text: "미마감", x: 450, y: r.y });
  }
  return leaves;
}

check("isAttendanceNumberText", () => {
  assert.equal(R.isAttendanceNumberText("9"), true);
  assert.equal(R.isAttendanceNumberText("07"), true);
  assert.equal(R.isAttendanceNumberText(""), false);
  assert.equal(R.isAttendanceNumberText("번호"), false);
  assert.equal(R.isAttendanceNumberText("학생01"), false);
});

check("sameBandY", () => {
  assert.equal(R.sameBandY(166, 168, 14), true);
  assert.equal(R.sameBandY(166, 200, 14), false);
});

check("find pair 9+학생01 (not nth row)", () => {
  const leaves = fixtureLeaves();
  const pair = R.findNumberNamePairOnBand(leaves, "9", "학생01", 14);
  assert.ok(pair, "pair");
  assert.equal(leaves[pair.numIdx].text, "9");
  assert.equal(leaves[pair.nameIdx].text, "학생01");
  // 6th data row visually, but number is 9 — never treat index as number
  assert.notEqual(pair.numIdx, 9);
});

check("blank numbers skipped in scan (7 then 9)", () => {
  const leaves = fixtureLeaves();
  const pairs = Array.from(R.scanNumberNamePairs(leaves, 14));
  const nums = pairs.map((p) => String(p.numText)).sort((a, b) => Number(a) - Number(b));
  assert.equal(nums.join(","), "1,2,3,4,7,9");
  assert.equal(pairs.length, 6);
  const hit = R.matchWantInPairs(pairs, "9", "학생01");
  assert.ok(hit);
  assert.equal(hit.numText, "9");
  assert.equal(hit.nameText, "학생01");
  // no phantom 5/6/8
  assert.equal(R.matchWantInPairs(pairs, "5", "학생A5"), null);
  assert.equal(R.matchWantInPairs(pairs, "8", "학생A8"), null);
});

check("never match by row ordinal (5th visible ≠ number 5)", () => {
  const leaves = fixtureLeaves();
  // 5th data band is number 7
  const pair5 = R.findNumberNamePairOnBand(leaves, "5", "학생A7", 14);
  assert.equal(pair5, null);
  const pair7 = R.findNumberNamePairOnBand(leaves, "7", "학생A7", 14);
  assert.ok(pair7);
});

check("buildCellsOnBand with header centers", () => {
  const leaves = fixtureLeaves().filter((l) => l.y > 30);
  const centers = [20, 70, 150, 210, 270, 330, 390, 450];
  const cells = R.buildCellsOnBand(leaves, 166, 14, centers);
  assert.equal(cells.length, 8);
  assert.equal(cells[0].text, "9");
  assert.equal(cells[1].text, "학생01");
});

check("buildCellsOnBand LTR without centers", () => {
  const leaves = fixtureLeaves().filter((l) => Math.abs(l.y - 166) <= 14);
  const cells = R.buildCellsOnBand(leaves, 166, 14, null);
  assert.ok(cells.length >= 2);
  assert.equal(cells[0].text, "9");
  assert.equal(cells[1].text, "학생01");
});

check("anonymous counts only", () => {
  const leaves = fixtureLeaves();
  assert.equal(R.countExactText(leaves, "9"), 1);
  assert.equal(R.countExactText(leaves, "학생01"), 1);
  assert.equal(R.countExactText(leaves, "999"), 0);
});

check("fixture html tables=0 and 학생01 at 9", () => {
  const html = readFileSync(new URL("./fixtures/neis-grid-nexacro-rows.html", import.meta.url), "utf8");
  assert.equal(/\b<table\b/i.test(html), false);
  assert.match(html, />9</);
  assert.match(html, />학생01</);
  assert.match(html, /1,2,3,4,7,9/);
  // ensure 7 then 9 gap documented / present
  const nums = [...html.matchAll(/class="cell r\d+"[^>]*>\s*(\d+)\s*</g)].map((m) => m[1]);
  assert.equal(nums.join(","), "1,2,3,4,7,9");
});

if (!process.exitCode) console.log("all row-match tests passed");
