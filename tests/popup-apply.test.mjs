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
  assert.equal(P.isPopupTitleText("출결마감"), false);
});

check("hasPopupTitleInText requires 출결마감구분", () => {
  assert.equal(P.hasPopupTitleInText("출결마감구분"), true);
  assert.equal(P.hasPopupTitleInText("제목 출결마감구분 레이어"), true);
  assert.equal(P.hasPopupTitleInText("질병 지각 적용"), false);
  assert.equal(P.hasPopupTitleInText("출결마감"), false);
});

check("looksLikeClosePopupText requires title+cat+type", () => {
  assert.equal(P.looksLikeClosePopupText("질병 지각 적용"), false); // no title
  assert.equal(P.looksLikeClosePopupText("출결마감구분 질병 지각 적용"), true);
  assert.equal(P.looksLikeClosePopupText("출결마감구분 질병 미인정 기타"), false); // no type
  assert.equal(P.looksLikeClosePopupText("출결마감구분 지각 조퇴 결석"), false); // no cat
  assert.equal(P.looksLikeClosePopupText("출결마감구분 질병 조퇴 사유 적용"), true);
});

check("fallbackPopupNeedsTitle title+illness", () => {
  assert.equal(P.fallbackPopupNeedsTitle("출결마감구분 질병"), true);
  assert.equal(P.fallbackPopupNeedsTitle("출결마감구분 미인정"), false);
  assert.equal(P.fallbackPopupNeedsTitle("질병 지각"), false);
});

check("isEnabledState opacity and flags", () => {
  assert.equal(P.isEnabledState({}), true);
  assert.equal(P.isEnabledState({ disabled: true }), false);
  assert.equal(P.isEnabledState({ ariaDisabled: "true" }), false);
  assert.equal(P.isEnabledState({ pointerEvents: "none" }), false);
  assert.equal(P.isEnabledState({ opacity: 0.4 }), false);
  assert.equal(P.isEnabledState({ opacity: 0.54 }), false); // < 0.55
  assert.equal(P.isEnabledState({ opacity: 0.55 }), true);
  assert.equal(P.isEnabledState({ opacity: "1" }), true);
  assert.equal(P.isEnabledState({ className: "RadioItemControl is-disabled" }), false);
  assert.equal(P.isDisabledControlState({ opacity: 0.45 }), true);
});

check("isApplyButtonText rejects 출결마감", () => {
  assert.equal(P.isApplyButtonText("적용"), true);
  assert.equal(P.isApplyButtonText("출결마감"), false);
  assert.equal(P.isApplyButtonText("적용 출결마감"), false);
  assert.equal(P.isCloseAllButtonText("출결마감"), true);
});

check("isLeafOptionText / labelTokenMatch", () => {
  assert.equal(P.isLeafOptionText("질병", "질병"), true);
  assert.equal(P.labelTokenMatch("질병 미인정 기타", "질병"), true);
  assert.equal(P.labelTokenMatch("지각·조퇴·결석", "지각"), true);
  assert.equal(P.labelTokenMatch("미마감", "미인정"), false);
});

check("findLabelTextIndex", () => {
  const texts = ["질병", "미인정", "기타", "출석인정", "지각", "조퇴"];
  assert.equal(P.findLabelTextIndex(texts, "질병"), 0);
  assert.equal(P.findLabelTextIndex(texts, "지각"), 4);
  assert.equal(P.findLabelTextIndex(texts, "없는라벨"), -1);
});

check("popupDiagFromTexts hasTitle + anonymous counts", () => {
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
  assert.equal(d.hasTitle, 1);
  assert.equal(d.illnessHit, 1);
  assert.equal(d.lateHit, 1);
  assert.equal(d.applyHit, 1);
  assert.equal(d.popupLike, 1);
  assert.equal(d.closeAllHit, 0);
  for (const k of Object.keys(d)) {
    assert.equal(typeof d[k], "number");
  }
  const noTitle = P.popupDiagFromTexts(["질병", "지각", "적용"]);
  assert.equal(noTitle.hasTitle, 0);
  assert.equal(noTitle.popupLike, 0);
});

check("fixture html types start disabled; enable after category", () => {
  const html = readFileSync(new URL("./fixtures/neis-popup-nexacro.html", import.meta.url), "utf8");
  assert.ok(html.includes("출결마감구분"));
  assert.ok(html.includes("질병"));
  assert.ok(html.includes("지각"));
  assert.ok(html.includes(">적용<"));
  assert.ok(html.includes("contentsbox"));
  assert.ok(html.includes("is-disabled"));
  assert.ok(html.includes("data-section=\"type\"") || html.includes("data-section='type'") || html.includes('data-section="type"'));
  assert.ok(html.includes("classList.remove(\"is-disabled\")") || html.includes("classList.remove('is-disabled')"));
  assert.ok(!html.includes('role="dialog"'));
  assert.ok(!html.includes('type="radio"'));
});

check("CATEGORY/TYPE maps", () => {
  assert.equal(P.CATEGORY_KO.illness, "질병");
  assert.equal(P.TYPE_KO.late, "지각");
  assert.ok(P.OPTION_LABELS.includes("적용"));
});
