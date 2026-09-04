import { readFileSync } from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const code = readFileSync(new URL("../extension/content/popup-apply.js", import.meta.url), "utf8");
const sandbox = { globalThis: {} };
sandbox.globalThis = sandbox;
vm.runInNewContext(code, sandbox);
const P = sandbox.ChulgyeolPopupApply;
assert.ok(P);

function check(name, fn) {
  try {
    fn();
    console.log("ok", name);
  } catch (e) {
    console.error("FAIL", name, e.message);
    process.exitCode = 1;
  }
}

check("isPopupTitleText", () => {
  assert.equal(P.isPopupTitleText("출결마감구분"), true);
  assert.equal(P.isPopupTitleText("출결마감"), false);
});

check("hasPopupTitleInText", () => {
  assert.equal(P.hasPopupTitleInText("출결마감구분 질병"), true);
  assert.equal(P.hasPopupTitleInText("질병 지각"), false);
});

check("looksLikeClosePopupText cat+type (title optional)", () => {
  assert.equal(P.looksLikeClosePopupText("질병 지각 적용"), true);
  assert.equal(P.looksLikeClosePopupText("질병 미인정 기타"), false);
  assert.equal(P.looksLikeClosePopupText("지각 조퇴"), false);
});

check("fallbackPopupNeedsTitle / titleRequiredOk", () => {
  assert.equal(P.fallbackPopupNeedsTitle("출결마감구분 질병 지각"), true);
  assert.equal(P.fallbackPopupNeedsTitle("질병 지각 적용"), false);
});

check("isEnabledState / typeEnabledAfterCategory", () => {
  assert.equal(P.isEnabledState({}), true);
  assert.equal(P.isEnabledState({ disabled: true }), false);
  assert.equal(P.isEnabledState({ opacity: "0.4" }), false);
  assert.equal(P.isEnabledState({ className: "is-disabled" }), false);
  assert.equal(P.isEnabledState({ pointerEvents: "none" }), false);
  assert.equal(P.typeEnabledAfterCategory(false), false);
  assert.equal(P.typeEnabledAfterCategory(true), true);
  assert.equal(P.isDisabledControlState({ className: "is-disabled" }), true);
});

check("isLeafOptionText / labelTokenMatch", () => {
  for (const lab of ["질병", "미인정", "기타", "출석인정", "지각", "조퇴", "결석", "결과", "적용"]) {
    assert.equal(P.isLeafOptionText(lab, lab), true, lab);
  }
  assert.equal(P.isLeafOptionText("미마감", "미인정"), false);
  assert.equal(P.labelTokenMatch("질병 미인정 기타", "질병"), true);
  assert.equal(P.labelTokenMatch("질병미인정기타출석인정", "기타"), true);
  assert.equal(P.labelTokenMatch("미마감", "미인정"), false);
});

check("findLabelTextIndex sparse", () => {
  assert.equal(P.findLabelTextIndex(["질병 미인정 기타", "지각 조퇴"], "지각"), 1);
  assert.equal(P.findLabelTextIndex(["질병", "미인정"], "질병"), 0);
});

check("isApply rejects 출결마감", () => {
  assert.equal(P.isApplyButtonText("적용"), true);
  assert.equal(P.isApplyButtonText("출결마감"), false);
});

check("popupDiag counts", () => {
  const d = P.popupDiagFromTexts([
    "출결마감구분", "질병", "미인정", "기타", "출석인정", "지각", "조퇴", "결석", "결과", "사유", "적용",
  ]);
  assert.equal(d.titleHit, 1);
  assert.equal(d.hasTitle, 1);
  assert.equal(d.titleRequiredOk, 1);
  assert.equal(d.illnessHit, 1);
  assert.equal(d.lateHit, 1);
  assert.equal(d.applyHit, 1);
  assert.equal(d.popupLike, 1);
  for (const k of Object.keys(d)) assert.equal(typeof d[k], "number");
});

check("popupDiag sparse + decoy", () => {
  const sparse = P.popupDiagFromTexts(["출결마감구분", "질병 미인정 기타 출석인정", "지각 조퇴 결석 결과", "적용"]);
  assert.ok(sparse.illnessHit >= 1);
  assert.ok(sparse.lateHit >= 1);
  assert.equal(sparse.titleRequiredOk, 1);
  const decoy = P.popupDiagFromTexts(["미인정", "미인정", "지각", "조퇴"]);
  assert.equal(decoy.titleRequiredOk, 0);
  assert.equal(decoy.popupLike, 1); // cat+type without title
  assert.equal(decoy.hasTitle, 0);
});

check("fixture sparse nexacro", () => {
  const html = readFileSync(new URL("./fixtures/neis-popup-nexacro.html", import.meta.url), "utf8");
  assert.ok(html.includes("출결마감구분"));
  assert.ok(html.includes("contentsbox"));
  assert.ok(html.includes("질병") && html.includes("지각") && html.includes(">적용<"));
  assert.ok(html.includes("is-disabled") || html.includes("aria-disabled"));
  assert.ok(!html.includes('role="dialog"'));
  assert.ok(!html.includes('type="radio"'));
});

check("CATEGORY/TYPE/OPTION", () => {
  assert.equal(P.CATEGORY_KO.illness, "질병");
  assert.equal(P.TYPE_KO.late, "지각");
  assert.ok(P.OPTION_LABELS.includes("적용"));
});
