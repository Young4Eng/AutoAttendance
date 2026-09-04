import { readFileSync } from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const code = readFileSync(new URL("../extension/content/popup-apply.js", import.meta.url), "utf8");
const sandbox = { globalThis: {} };
sandbox.globalThis = sandbox;
vm.runInNewContext(code, sandbox);
const P = sandbox.ChulgyeolPopupApply;
assert.ok(P, "ChulgyeolPopupApply");

function check(name, fn) {
  try {
    fn();
    console.log("ok", name);
  } catch (e) {
    console.error("FAIL", name, e.message);
    process.exitCode = 1;
  }
}

check("isPopupTitleText exact", () => {
  assert.equal(P.isPopupTitleText("출결마감구분"), true);
  assert.equal(P.isPopupTitleText("출결 구분 선택"), true);
});

check("isPopupTitleText contains", () => {
  assert.equal(P.isPopupTitleText("출결마감구분 선택"), true);
  assert.equal(P.isPopupTitleText("구분 선택"), true);
  assert.equal(P.isPopupTitleText("저장"), false);
  assert.equal(P.isPopupTitleText("출결마감"), false); // bare close-all title not enough
});

check("looksLikeClosePopupText needs cat+type", () => {
  assert.equal(P.looksLikeClosePopupText("질병 지각 적용"), true);
  assert.equal(P.looksLikeClosePopupText("질병 미인정 기타"), false);
  assert.equal(P.looksLikeClosePopupText("지각 조퇴 결석"), false);
  assert.equal(P.looksLikeClosePopupText("질병 조퇴 사유 적용"), true);
});

check("isApplyButtonText rejects 출결마감", () => {
  assert.equal(P.isApplyButtonText("적용"), true);
  assert.equal(P.isApplyButtonText("출결마감"), false);
  assert.equal(P.isApplyButtonText("적용 출결마감"), false);
  assert.equal(P.isCloseAllButtonText("출결마감"), true);
});

check("findLabelTextIndex", () => {
  const texts = ["질병", "미인정", "기타", "출석인정", "지각", "조퇴"];
  assert.equal(P.findLabelTextIndex(texts, "질병"), 0);
  assert.equal(P.findLabelTextIndex(texts, "지각"), 4);
  assert.equal(P.findLabelTextIndex(texts, "없는라벨"), -1);
});

check("popupDiagFromTexts anonymous counts", () => {
  const fixtureTexts = [
    "출결마감구분",
    "질병",
    "미인정",
    "기타",
    "출석인정",
    "지각",
    "조퇴",
    "결석",
    "결과",
    "사유",
    "적용",
  ];
  const d = P.popupDiagFromTexts(fixtureTexts);
  assert.equal(d.titleHit, 1);
  assert.equal(d.illnessHit, 1);
  assert.equal(d.lateHit, 1);
  assert.equal(d.applyHit, 1);
  assert.equal(d.popupLike, 1);
  assert.equal(d.closeAllHit, 0);
  // no student names in diag object values as strings of names — only counts
  for (const k of Object.keys(d)) {
    assert.equal(typeof d[k], "number");
  }
});

check("fixture html contains markers (no real names required)", () => {
  const html = readFileSync(new URL("./fixtures/neis-popup-nexacro.html", import.meta.url), "utf8");
  assert.ok(html.includes("출결마감구분"));
  assert.ok(html.includes("질병"));
  assert.ok(html.includes("지각"));
  assert.ok(html.includes(">적용<"));
  assert.ok(html.includes("contentsbox"));
  assert.ok(!html.includes("role=\"dialog\""));
});

check("CATEGORY/TYPE maps", () => {
  assert.equal(P.CATEGORY_KO.illness, "질병");
  assert.equal(P.TYPE_KO.late, "지각");
});
