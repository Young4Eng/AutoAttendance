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

check("looksLikeClosePopupText needs cat+type", () => {
  assert.equal(P.looksLikeClosePopupText("질병 지각 적용"), true);
  assert.equal(P.looksLikeClosePopupText("질병 미인정 기타"), false);
  assert.equal(P.looksLikeClosePopupText("지각 조퇴 결석"), false);
  assert.equal(P.looksLikeClosePopupText("질병 조퇴 사유 적용"), true);
});

check("fallbackPopupNeedsTitle requires title+illness", () => {
  assert.equal(P.fallbackPopupNeedsTitle("출결마감구분 질병 지각 적용"), true);
  assert.equal(P.fallbackPopupNeedsTitle("질병 지각 적용"), false); // no title
  assert.equal(P.fallbackPopupNeedsTitle("출결마감구분 미인정 지각"), false); // no 질병
  assert.equal(P.fallbackPopupNeedsTitle("미인정 미인정 지각"), false);
});

check("isApplyButtonText rejects 출결마감", () => {
  assert.equal(P.isApplyButtonText("적용"), true);
  assert.equal(P.isApplyButtonText("출결마감"), false);
  assert.equal(P.isApplyButtonText("적용 출결마감"), false);
  assert.equal(P.isCloseAllButtonText("출결마감"), true);
});

check("isLeafOptionText short labels", () => {
  for (const lab of ["질병", "미인정", "기타", "출석인정", "지각", "조퇴", "결석", "결과", "적용"]) {
    assert.equal(P.isLeafOptionText(lab, lab), true, lab);
  }
  assert.equal(P.isLeafOptionText("질병지각", "질병"), false);
  assert.equal(P.isLeafOptionText("미마감", "미인정"), false);
});

check("labelTokenMatch sparse rows", () => {
  assert.equal(P.labelTokenMatch("질병 미인정 기타 출석인정", "질병"), true);
  assert.equal(P.labelTokenMatch("질병/미인정/기타", "미인정"), true);
  assert.equal(P.labelTokenMatch("지각·조퇴·결석·결과", "지각"), true);
  assert.equal(P.labelTokenMatch("질병미인정기타출석인정", "기타"), true);
  assert.equal(P.labelTokenMatch("미마감", "미인정"), false);
  assert.equal(P.labelTokenMatch("저장", "적용"), false);
});

check("findLabelTextIndex", () => {
  const texts = ["질병", "미인정", "기타", "출석인정", "지각", "조퇴"];
  assert.equal(P.findLabelTextIndex(texts, "질병"), 0);
  assert.equal(P.findLabelTextIndex(texts, "지각"), 4);
  assert.equal(P.findLabelTextIndex(texts, "없는라벨"), -1);
});

check("findLabelTextIndex sparse token row", () => {
  const sparse = ["출결마감구분", "질병 미인정 기타 출석인정", "지각 조퇴 결석 결과", "적용"];
  assert.equal(P.findLabelTextIndex(sparse, "질병"), 1);
  assert.equal(P.findLabelTextIndex(sparse, "지각"), 2);
  assert.equal(P.findLabelTextIndex(sparse, "적용"), 3);
});

check("isEnabledState / typeEnabledAfterCategory", () => {
  assert.equal(P.isEnabledState({}), true);
  assert.equal(P.isEnabledState({ disabled: true }), false);
  assert.equal(P.isEnabledState({ ariaDisabled: "true" }), false);
  assert.equal(P.isEnabledState({ className: "RadioItemControl is-disabled" }), false);
  assert.equal(P.isEnabledState({ pointerEvents: "none", opacity: "0.45" }), false);
  assert.equal(P.isEnabledState({ opacity: "0.4" }), false);
  assert.equal(P.isEnabledState({ opacity: "1", className: "RadioItemControl" }), true);
  assert.equal(P.typeEnabledAfterCategory(false), false);
  assert.equal(P.typeEnabledAfterCategory(true), true);
  assert.equal(P.isDisabledControlState({ className: "is-disabled" }), true);
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
  assert.equal(d.titleRequiredOk, 1);
  assert.equal(d.closeAllHit, 0);
  for (const k of Object.keys(d)) {
    assert.equal(typeof d[k], "number");
  }
});

check("popupDiagFromTexts sparse concatenated", () => {
  const sparse = [
    "출결마감구분",
    "질병 미인정 기타 출석인정",
    "지각 조퇴 결석 결과",
    "사유",
    "적용",
  ];
  const d = P.popupDiagFromTexts(sparse);
  assert.equal(d.titleHit, 1);
  assert.ok(d.illnessHit >= 1);
  assert.ok(d.unexcusedHit >= 1);
  assert.ok(d.lateHit >= 1);
  assert.equal(d.applyHit, 1);
  assert.equal(d.popupLike, 1);
  assert.equal(d.titleRequiredOk, 1);
});

check("popupDiag decoy unexcused without title fails titleRequiredOk", () => {
  const decoy = ["미인정", "미인정", "지각", "조퇴"];
  const d = P.popupDiagFromTexts(decoy);
  assert.equal(d.titleHit, 0);
  assert.equal(d.illnessHit, 0);
  assert.ok(d.unexcusedHit >= 1);
  assert.equal(d.popupLike, 1);
  assert.equal(d.titleRequiredOk, 0);
});

check("fixture html disabled types until category (no real names)", () => {
  const html = readFileSync(new URL("./fixtures/neis-popup-nexacro.html", import.meta.url), "utf8");
  assert.ok(html.includes("출결마감구분"));
  assert.ok(html.includes("질병"));
  assert.ok(html.includes("지각"));
  assert.ok(html.includes(">적용<"));
  assert.ok(html.includes("contentsbox"));
  assert.ok(html.includes("RadioItemControl"));
  assert.ok(html.includes("is-disabled"));
  assert.ok(html.includes("decoyUnexcused"));
  assert.ok(html.includes('id="hugeOuter"'));
  assert.ok(html.includes("data-section=\"type\""));
  assert.ok(html.includes("classList.remove(\"is-disabled\")") || html.includes("classList.remove('is-disabled')"));
  assert.ok(!html.includes('role="dialog"'));
  assert.ok(!html.includes('type="radio"'));
  assert.ok(html.includes("학생01"));
});

check("CATEGORY/TYPE maps", () => {
  assert.equal(P.CATEGORY_KO.illness, "질병");
  assert.equal(P.TYPE_KO.late, "지각");
  assert.ok(P.OPTION_LABELS.includes("적용"));
});

check("isClimbPopupRootContent requires title+action+category", () => {
  assert.equal(P.isClimbPopupRootContent("출결마감구분 질병 적용"), true);
  assert.equal(P.isClimbPopupRootContent("출결마감구분 미인정 닫기"), true);
  assert.equal(P.isClimbPopupRootContent("출결마감구분 질병"), false); // no action
  assert.equal(P.isClimbPopupRootContent("질병 적용 닫기"), false); // no title
  assert.equal(P.isClimbPopupRootContent("출결마감구분 적용"), false); // no category
});

check("pickSmallestPopupRoot prefers inner over huge decoy outer", () => {
  const innerText = "출결마감구분 질병 미인정 기타 출석인정 지각 조퇴 결석 결과 사유 적용 닫기";
  const outerPad = Array.from({ length: 80 }, (_, i) => `미인정${i} 지각${i} 미마감${i}`).join(" ");
  const outerText = `출결마감구분 ${outerPad} ${innerText}`;
  const candidates = [
    { id: 0, text: "출결마감구분", textCount: 1, width: 200, height: 24, tagName: "DIV" },
    {
      id: 1,
      text: innerText,
      textCount: 12,
      width: 340,
      height: 280,
      tagName: "DIV",
    },
    {
      id: 2,
      text: outerText,
      textCount: 345,
      width: 1280,
      height: 900,
      tagName: "DIV",
    },
  ];
  const pick = P.pickSmallestPopupRoot(candidates);
  assert.ok(pick, "pick");
  assert.equal(pick.id, 1);
  assert.ok(pick.textLen < P.POPUP_ROOT_MAX_TEXT_LEN);
  assert.ok(pick.textCount <= P.POPUP_ROOT_MAX_TEXT_COUNT);
});

check("pickSmallestPopupRoot rejects body/html and oversize-only", () => {
  const good = "출결마감구분 질병 미인정 적용 닫기";
  assert.equal(
    P.pickSmallestPopupRoot([
      { id: 0, text: good, textCount: 10, width: 400, height: 300, tagName: "BODY" },
    ]),
    null,
  );
  assert.equal(
    P.pickSmallestPopupRoot([
      { id: 0, text: good + " " + "x".repeat(1000), textCount: 20, width: 400, height: 300, tagName: "DIV" },
    ]),
    null,
  );
  assert.equal(
    P.pickSmallestPopupRoot([
      { id: 0, text: good, textCount: 100, width: 400, height: 300, tagName: "DIV" },
    ]),
    null,
  );
});

check("fixture has decoy outer + inner dialog markers", () => {
  const html = readFileSync(new URL("./fixtures/neis-popup-nexacro.html", import.meta.url), "utf8");
  assert.ok(html.includes('id="hugeOuter"'));
  assert.ok(html.includes('data-decoy="outer"'));
  assert.ok(html.includes('id="decoyChrome"'));
  assert.ok(html.includes('id="popupLayer"'));
  assert.ok(html.includes("출결마감구분"));
  assert.ok(html.includes("질병"));
  assert.ok(html.includes(">적용<"));
  assert.ok(html.includes(">닫기<"));
  assert.ok(html.includes("decoyUnexcused"));
  assert.ok(html.includes("학생01"));
});

check("isClientRectVisible", () => {
  assert.equal(P.isClientRectVisible({ width: 10, height: 8 }), true);
  assert.equal(P.isClientRectVisible({ width: 0, height: 8 }), false);
  assert.equal(P.isClientRectVisible({ width: 10, height: 0 }), false);
  assert.equal(P.isClientRectVisible(null), false);
});

check("popupOpenVisibleOk requires title+category visible (not titleHit alone)", () => {
  assert.equal(P.popupOpenVisibleOk({ titleVisible: true, categoryVisible: true }), true);
  assert.equal(P.popupOpenVisibleOk({ titleVisible: true, categoryVisible: false, titleHit: 1 }), false);
  assert.equal(P.popupOpenVisibleOk({ titleVisible: false, categoryVisible: true, titleHit: 1 }), false);
  assert.equal(P.popupOpenVisibleOk({ titleHit: 1 }), false);
  assert.equal(P.popupOpenVisibleOk({}), false);
});

check("titleBecameNewlyVisible", () => {
  assert.equal(P.titleBecameNewlyVisible(false, true), true);
  assert.equal(P.titleBecameNewlyVisible(true, true), false);
  assert.equal(P.titleBecameNewlyVisible(false, false), false);
});

check("fixture closeCell opens popup; decoy title alone is not enough", () => {
  const html = readFileSync(new URL("./fixtures/neis-popup-nexacro.html", import.meta.url), "utf8");
  assert.ok(html.includes('id="closeCell"'));
  assert.ok(html.includes('id="popupLayer"'));
  assert.ok(html.includes('class="hidden"') || html.includes("classList.remove(\"hidden\")") || html.includes("classList.remove('hidden')"));
  assert.ok(html.includes("openPopup") || html.includes('classList.remove("hidden")') || html.includes("classList.remove('hidden')"));
  assert.ok(html.includes('data-decoy="title"'));
  assert.ok(html.includes("closeCellInput") || html.includes("bindOpen"));
  assert.ok(html.includes("elementFromPoint") === false); // browser-only; fixture just opens on click
  assert.ok(html.includes("학생01"));
  // decoy title present while layer starts hidden
  assert.ok(html.includes('id="popupLayer" class="hidden"') || html.includes('id="popupLayer" class="hidden" data-popup'));
});

check("classNameTokens / anonRect / anonClickCandidate anonymized", () => {
  const toks = P.classNameTokens("GridCellControl nexacontentsbox cell foo");
  assert.ok(toks.includes("GridCellControl"));
  assert.ok(toks.includes("nexacontentsbox"));
  const r = P.anonRect({ left: 10.2, top: 20.6, width: 40.4, height: 18.9 });
  assert.equal(r.x, 10);
  assert.equal(r.y, 21);
  assert.equal(r.w, 40);
  assert.equal(r.h, 19);
  const cand = P.anonClickCandidate({
    tagName: "div",
    className: "nexacontentsbox contentsbox",
    rect: { left: 1, top: 2, width: 3, height: 4 },
    kind: "contentsbox",
    textContent: "학생01", // must NOT appear in output
  });
  assert.equal(cand.tag, "DIV");
  assert.ok(cand.cls.includes("nexacontentsbox"));
  assert.equal(cand.kind, "contentsbox");
  assert.equal(cand.rect.w, 3);
  assert.ok(!JSON.stringify(cand).includes("학생"));
  assert.ok(!("textContent" in cand));
});

check("classNameTokens splits concatenated cl- prefixes", () => {
  const toks = P.classNameTokens("cl-textcl-placeholdercl-unselectable");
  // vm realm arrays: compare via JSON / includes (not deepEqual prototypes)
  assert.equal(JSON.stringify([...toks]), JSON.stringify(["cl-text", "cl-placeholder", "cl-unselectable"]));
  assert.ok(toks.includes("cl-text"));
  assert.ok(toks.includes("cl-placeholder"));
  assert.ok(toks.includes("cl-unselectable"));
  const mixed = P.classNameTokens("GridCellControl cl-textcl-placeholder");
  assert.ok(mixed.includes("GridCellControl"));
  assert.ok(mixed.includes("cl-text"));
  assert.ok(mixed.includes("cl-placeholder"));
  const spaced = P.classNameTokens("cl-text cl-placeholder");
  assert.ok(spaced.includes("cl-text"));
  assert.ok(spaced.includes("cl-placeholder"));
});

check("orderCloseClimbTargets prefers parent GridCell over placeholder leaf", () => {
  const leaf = {
    id: "ph",
    tokens: ["cl-text", "cl-placeholder", "cl-unselectable"],
    rect: { x: 831, y: 584, w: 100, h: 19 },
    kind: "cell",
    centerX: 881,
  };
  const ancestors = [
    {
      id: "box",
      tokens: ["nexacontentsbox", "contentsbox"],
      rect: { x: 826, y: 580, w: 110, h: 24 },
      kind: "contentsbox",
      centerX: 881,
    },
    {
      id: "grid",
      tokens: ["GridCellControl", "cell"],
      rect: { x: 820, y: 576, w: 120, h: 28 },
      kind: "gridcell",
      centerX: 880,
    },
  ];
  const ordered = P.orderCloseClimbTargets(leaf, ancestors, 880, 40);
  assert.ok(ordered.length >= 2);
  assert.equal(ordered[0].id, "grid"); // largest container first among parents
  assert.ok(ordered.some((x) => x.id === "ph"));
  assert.ok(ordered[0].id !== "ph");
  assert.ok(P.isPlaceholderCloseLeaf(leaf.tokens, leaf.rect, "cell"));
  assert.ok(P.isCloseCellContainerTokens(["GridCellControl", "cell"]));
});

check("alignsWithCloseHeader / closeHeaderDx reject far-off candidates", () => {
  assert.equal(P.CLOSE_HEADER_MAX_DX, 40);
  assert.equal(P.closeHeaderMaxDx(111), 40); // half=55.5 → min(40,55.5)=40
  assert.equal(P.closeHeaderMaxDx(60), 30); // half=30
  assert.equal(P.closeHeaderDx(881, 880), 1);
  assert.equal(P.alignsWithCloseHeader(881, 880, 40), true);
  assert.equal(P.alignsWithCloseHeader(200, 880, 40), false);
  assert.equal(P.alignsWithCloseHeader(880 + 244, 880), false); // field #50 dx=244
  const leaf = {
    id: "far",
    tokens: ["cl-text", "cl-placeholder"],
    rect: { x: 10, y: 584, w: 100, h: 19 },
    kind: "cell",
    centerX: 60,
  };
  const parent = {
    id: "near",
    tokens: ["GridCellControl"],
    rect: { x: 850, y: 576, w: 120, h: 28 },
    kind: "gridcell",
    centerX: 910,
  };
  const ordered = P.orderCloseClimbTargets(leaf, [parent], 880, 40);
  assert.ok(ordered.every((x) => x.aligned));
  assert.ok(ordered.some((x) => x.id === "near"));
  assert.ok(!ordered.some((x) => x.id === "far")); // far leaf rejected by dx
});

check("misaligned-only candidates rejected (no fallback) — field dx=244", () => {
  // 0.4.8 field: closeHeaderDx=244 closeHeaderAligned=0 — must NOT keep candidates
  const headerX = 637;
  const leaf = {
    id: "wrong",
    tokens: ["cl-text", "cl-placeholder"],
    rect: { x: 831, y: 581, w: 100, h: 25 },
    kind: "cell",
    centerX: 881,
  };
  const parent = {
    id: "wrongParent",
    tokens: ["cl-grid-cell", "cl-grid-cell-inherit"],
    rect: { x: 826, y: 576, w: 111, h: 36 },
    kind: "parent",
    centerX: 881.5,
  };
  const ordered = P.orderCloseClimbTargets(leaf, [parent], headerX, 40);
  assert.equal(ordered.length, 0);
  assert.equal(P.alignsWithCloseHeader(881, headerX, 40), false);
  assert.equal(Math.abs(P.closeHeaderDx(881, headerX)), 244);
});

check("aligned close-cell candidate accepted under 마감 header", () => {
  const headerX = 880;
  const leaf = {
    id: "ph",
    tokens: ["cl-text", "cl-placeholder"],
    rect: { x: 831, y: 584, w: 100, h: 19 },
    kind: "cell",
    centerX: 881,
  };
  const parent = {
    id: "grid",
    tokens: ["GridCellControl", "cell"],
    rect: { x: 820, y: 576, w: 120, h: 28 },
    kind: "gridcell",
    centerX: 880,
  };
  const ordered = P.orderCloseClimbTargets(leaf, [parent], headerX, 40);
  assert.ok(ordered.length >= 1);
  assert.ok(ordered.every((x) => x.aligned));
  assert.ok(ordered.some((x) => x.id === "grid"));
});

check("stringifyCloseCellDump is JSON string without names/numbers", () => {
  const dump = {
    candidates: [
      {
        tagName: "DIV",
        className: "cl-textcl-placeholdercl-unselectable",
        rect: { left: 831, top: 584, width: 100, height: 19 },
        kind: "placeholder",
        text: "학생01",
      },
      {
        tagName: "DIV",
        className: "GridCellControl cell",
        rect: { left: 820, top: 576, width: 120, height: 28 },
        kind: "gridcell",
      },
    ],
    before: { titleVisible: true, illnessVisible: false },
    after: { titleVisible: true, illnessVisible: false },
    modes: ["full", "mouseOnly", "dblclick"],
    headerX: 880,
    cellX: 881,
    closeHeaderDx: 1,
  };
  const s = P.stringifyCloseCellDump(dump);
  assert.equal(typeof s, "string");
  assert.ok(s.startsWith("{"));
  assert.ok(!s.includes("학생"));
  assert.ok(!s.includes("[object Object]"));
  const parsed = JSON.parse(s);
  assert.equal(parsed.candidateCount, 2);
  assert.ok(parsed.candidates[0].cls.includes("cl-text"));
  assert.ok(parsed.candidates[0].cls.includes("cl-placeholder"));
  assert.equal(parsed.before.decoyTitle, 1);
  assert.equal(parsed.after.illnessNewly, 0);
  assert.equal(parsed.headerX, 880);
  assert.equal(parsed.cellX, 881);
  assert.equal(parsed.closeHeaderDx, 1);
  assert.equal(parsed.closeHeaderAligned, 1);
});

check("popupNewlyOpenedOk distinguishes decoy titleHit vs newly visible", () => {
  // field: decoy title before, illness appears after click
  assert.equal(
    P.popupNewlyOpenedOk(
      { titleVisible: true, illnessVisible: false },
      { titleVisible: true, illnessVisible: true },
    ),
    true,
  );
  // both newly appear
  assert.equal(
    P.popupNewlyOpenedOk(
      { titleVisible: false, illnessVisible: false },
      { titleVisible: true, illnessVisible: true },
    ),
    true,
  );
  // titleHit alone after (no illness) — fail
  assert.equal(
    P.popupNewlyOpenedOk(
      { titleVisible: true, illnessVisible: false },
      { titleVisible: true, illnessVisible: false },
    ),
    false,
  );
  // both already visible before (decoy pair) — not newly opened
  assert.equal(
    P.popupNewlyOpenedOk(
      { titleVisible: true, illnessVisible: true },
      { titleVisible: true, illnessVisible: true },
    ),
    false,
  );
});

check("normalizeCloseCellFailDump strips names and keeps visibility flags", () => {
  const dump = P.normalizeCloseCellFailDump({
    candidates: [
      {
        tagName: "DIV",
        className: "GridCellControl nexacontentsbox",
        rect: { left: 5, top: 6, width: 50, height: 20 },
        kind: "parent",
        text: "학생01",
      },
    ],
    before: { titleVisible: true, illnessVisible: false },
    after: { titleVisible: true, illnessVisible: false },
    modes: ["full", "dblclick"],
    headerX: 100,
    cellX: 103,
    closeHeaderDx: 3,
  });
  assert.equal(dump.before.decoyTitle, 1);
  assert.equal(dump.before.titleVisible, 1);
  assert.equal(dump.before.illnessVisible, 0);
  assert.equal(dump.after.titleNewly, 0);
  assert.equal(dump.after.illnessNewly, 0);
  assert.equal(dump.candidateCount, 1);
  assert.ok(dump.modes.includes("dblclick"));
  assert.equal(dump.headerX, 100);
  assert.equal(dump.cellX, 103);
  assert.equal(dump.closeHeaderDx, 3);
  assert.equal(dump.closeHeaderAligned, 1);
  const s = JSON.stringify(dump);
  assert.ok(!s.includes("학생"));
  assert.ok(!s.includes("미마감"));
  assert.ok(s.includes("GridCellControl") || s.includes("nexacontentsbox"));

  const mis = P.normalizeCloseCellFailDump({
    candidates: [{ tagName: "DIV", className: "cl-grid-cell", rect: { left: 826, top: 576, width: 111, height: 36 }, kind: "parent" }],
    before: { titleVisible: true, illnessVisible: false },
    after: { titleVisible: true, illnessVisible: false },
    modes: [],
    headerX: 637,
    cellX: 881,
    closeHeaderDx: 244,
    closeHeaderAligned: 0,
  });
  assert.equal(mis.closeHeaderAligned, 0);
  assert.equal(mis.closeHeaderDx, 244);
  assert.equal(mis.headerX, 637);
  assert.equal(mis.cellX, 881);
  assert.equal(mis.modes.length, 0);
});

check("fixture has GridCell parent + nexacontentsbox + dblclick open path", () => {
  const html = readFileSync(new URL("./fixtures/neis-popup-nexacro.html", import.meta.url), "utf8");
  assert.ok(html.includes('id="closeCellWrap"'));
  assert.ok(html.includes("GridCellControl"));
  assert.ok(html.includes("nexacontentsbox"));
  assert.ok(html.includes("dblclick"));
  assert.ok(html.includes('id="closeCell"'));
  assert.ok(html.includes('data-decoy="title"'));
  assert.ok(html.includes("학생01"));
});

check("fixture placeholder leaf + parent GridCell climb path", () => {
  const html = readFileSync(new URL("./fixtures/neis-popup-nexacro.html", import.meta.url), "utf8");
  assert.ok(html.includes('id="closePlaceholder"'));
  assert.ok(html.includes("cl-textcl-placeholdercl-unselectable"));
  assert.ok(html.includes('id="closeCellWrap"'));
  assert.ok(html.includes("GridCellControl"));
  assert.ok(html.includes("stopPropagation")); // leaf alone must not open
});

check("fixture has aligned close cell + misaligned wrong-col candidate (#50)", () => {
  const html = readFileSync(new URL("./fixtures/neis-popup-nexacro.html", import.meta.url), "utf8");
  assert.ok(html.includes('id="closeHeaderLabel"'));
  assert.ok(html.includes('data-close-header="1"'));
  assert.ok(html.includes('data-close-aligned="1"'));
  assert.ok(html.includes('id="misalignedCloseCand"'));
  assert.ok(html.includes('data-close-aligned="0"'));
  assert.ok(html.includes('data-decoy="wrong-col"'));
  // spatial: misaligned at left 826 vs header 600 → dx large
  assert.ok(html.includes("left:826px"));
  assert.ok(html.includes("left:600px"));
});
