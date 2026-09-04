/**
 * 출결마감구분 팝업 라벨·버튼 탐지 순수 헬퍼.
 * DOM 없음 — 텍스트·상태 레코드만. 실명·번호 값 금지.
 */
(function (g) {
  if (g.__chulgyeolMatePopupApply) return;
  g.__chulgyeolMatePopupApply = true;

  var CATEGORY_KO = {
    illness: "질병",
    unexcused: "미인정",
    other: "기타",
    recognized: "출석인정",
  };
  var TYPE_KO = {
    late: "지각",
    early_leave: "조퇴",
    absence: "결석",
    result: "결과",
  };
  var CATEGORY_LABELS = ["질병", "미인정", "기타", "출석인정"];
  var TYPE_LABELS = ["지각", "조퇴", "결석", "결과"];
  var OPTION_LABELS = CATEGORY_LABELS.concat(TYPE_LABELS).concat(["적용"]);

  function normText(s) {
    return String(s || "")
      .replace(/[\u200b-\u200d\ufeff]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isPopupTitleText(text) {
    var t = normText(text);
    if (!t || t.length > 48) return false;
    if (t === "출결마감구분" || t === "출결 구분 선택") return true;
    if (t.indexOf("출결마감구분") >= 0) return true;
    if (t.indexOf("출결 구분 선택") >= 0) return true;
    if (t.indexOf("출결마감") >= 0 && t.indexOf("구분") >= 0) return true;
    if (t.indexOf("구분 선택") >= 0) return true;
    return false;
  }

  function looksLikeClosePopupText(blob) {
    var t = normText(blob);
    if (!t) return false;
    var hasCat = false;
    var hasType = false;
    for (var i = 0; i < CATEGORY_LABELS.length; i++) {
      if (t.indexOf(CATEGORY_LABELS[i]) >= 0) {
        hasCat = true;
        break;
      }
    }
    for (var j = 0; j < TYPE_LABELS.length; j++) {
      if (t.indexOf(TYPE_LABELS[j]) >= 0) {
        hasType = true;
        break;
      }
    }
    return hasCat && hasType;
  }

  /** 폴백 수락: 제목「출결마감구분」+질병 필수. popupLike만으로는 거부. */
  function fallbackPopupNeedsTitle(blob) {
    var t = normText(blob);
    if (!t) return false;
    if (t.indexOf("출결마감구분") < 0) return false;
    if (t.indexOf("질병") < 0) return false;
    return true;
  }

  function blobHasPopupTitle(blob) {
    var t = normText(blob);
    if (!t) return false;
    if (t.indexOf("출결마감구분") >= 0) return true;
    if (t.indexOf("출결 구분 선택") >= 0) return true;
    if (t.indexOf("출결마감") >= 0 && t.indexOf("구분") >= 0) return true;
    return false;
  }

  function isEnabledState(flags) {
    flags = flags || {};
    if (flags.disabled === true) return false;
    var aria = flags.ariaDisabled;
    if (aria === true || aria === "true") return false;
    var cls = String(flags.className || "").toLowerCase();
    if (/\bdisabled\b|\bis-disabled\b|\bnexadisabled\b|\bdimmed\b|\bgrayed\b/.test(cls)) {
      return false;
    }
    if (String(flags.pointerEvents || "").toLowerCase() === "none") return false;
    var op = flags.opacity;
    if (op != null && op !== "") {
      var n = typeof op === "number" ? op : parseFloat(op);
      if (!isNaN(n) && n < 0.45) return false;
    }
    return true;
  }

  function isDisabledControlState(opts) {
    return !isEnabledState(opts);
  }

  function typeEnabledAfterCategory(categorySelected) {
    return Boolean(categorySelected);
  }

  function isApplyButtonText(text) {
    var t = normText(text);
    if (!t) return false;
    if (t.indexOf("출결마감") >= 0) return false;
    if (t === "적용") return true;
    if (t.indexOf("적용") === 0 && t.length <= 4) return true;
    return false;
  }

  function isCloseAllButtonText(text) {
    var t = normText(text);
    return t === "출결마감" || (t.indexOf("출결마감") >= 0 && t.indexOf("구분") < 0);
  }

  function isLeafOptionText(text, want) {
    var t = normText(text);
    var w = normText(want);
    if (!t || !w) return false;
    if (t === w) return true;
    if (t.indexOf(w) === 0 && t.length <= w.length + 2) {
      var rest = t.slice(w.length);
      return /^[\s*:：.]*$/.test(rest);
    }
    return false;
  }

  function endsWithOptionLabel(s) {
    for (var i = 0; i < OPTION_LABELS.length; i++) {
      var lab = OPTION_LABELS[i];
      if (s.length >= lab.length && s.slice(s.length - lab.length) === lab) return true;
    }
    return false;
  }

  function startsWithOptionLabel(s) {
    for (var i = 0; i < OPTION_LABELS.length; i++) {
      var lab = OPTION_LABELS[i];
      if (s.indexOf(lab) === 0) return true;
    }
    return false;
  }

  function labelTokenMatch(text, want) {
    var t = normText(text);
    var w = normText(want);
    if (!t || !w) return false;
    if (isLeafOptionText(t, w)) return true;
    if (t.length > 64) return false;
    var parts = t.split(/[\s|/·∙⋅,，、:：;；()\[\]{}<>]+/).filter(Boolean);
    for (var i = 0; i < parts.length; i++) {
      if (isLeafOptionText(parts[i], w)) return true;
    }
    if (OPTION_LABELS.indexOf(w) < 0) return false;
    var idx = t.indexOf(w);
    if (idx < 0) return false;
    var before = t.slice(0, idx);
    var after = t.slice(idx + w.length);
    return (!before || endsWithOptionLabel(before)) && (!after || startsWithOptionLabel(after));
  }

  function findLabelTextIndex(texts, want) {
    var w = normText(want);
    if (!w) return -1;
    var list = texts || [];
    for (var i = 0; i < list.length; i++) {
      if (isLeafOptionText(list[i], w)) return i;
    }
    for (var j = 0; j < list.length; j++) {
      var t2 = normText(list[j]);
      if (t2.indexOf(w) === 0 && t2.length <= w.length + 8) return j;
    }
    for (var k = 0; k < list.length; k++) {
      if (labelTokenMatch(list[k], w)) return k;
    }
    return -1;
  }

  function countLabelHits(list, want) {
    var n = 0;
    for (var i = 0; i < list.length; i++) {
      if (labelTokenMatch(list[i], want)) n++;
    }
    return n;
  }

  function popupDiagFromTexts(texts) {
    var list = texts || [];
    var titleHit = 0;
    var applyHit = 0;
    var closeAllHit = 0;
    var reasonHit = 0;
    for (var i = 0; i < list.length; i++) {
      var t = normText(list[i]);
      if (!t) continue;
      if (isPopupTitleText(t)) titleHit++;
      if (isApplyButtonText(t)) applyHit++;
      if (isCloseAllButtonText(t)) closeAllHit++;
      if (t === "사유" || t.indexOf("사유") === 0) reasonHit++;
    }
    var illnessHit = countLabelHits(list, "질병");
    var unexcusedHit = countLabelHits(list, "미인정");
    var otherHit = countLabelHits(list, "기타");
    var recognizedHit = countLabelHits(list, "출석인정");
    var lateHit = countLabelHits(list, "지각");
    var earlyHit = countLabelHits(list, "조퇴");
    var absenceHit = countLabelHits(list, "결석");
    var resultHit = countLabelHits(list, "결과");
    var joined = list.map(normText).join(" ");
    return {
      titleHit: titleHit,
      illnessHit: illnessHit,
      unexcusedHit: unexcusedHit,
      otherHit: otherHit,
      recognizedHit: recognizedHit,
      lateHit: lateHit,
      earlyHit: earlyHit,
      absenceHit: absenceHit,
      resultHit: resultHit,
      applyHit: applyHit,
      closeAllHit: closeAllHit,
      reasonHit: reasonHit,
      popupLike: looksLikeClosePopupText(joined) ? 1 : 0,
      titleRequiredOk: fallbackPopupNeedsTitle(joined) ? 1 : 0,
      textCount: list.length,
    };
  }

  g.ChulgyeolPopupApply = {
    CATEGORY_KO: CATEGORY_KO,
    TYPE_KO: TYPE_KO,
    CATEGORY_LABELS: CATEGORY_LABELS,
    TYPE_LABELS: TYPE_LABELS,
    OPTION_LABELS: OPTION_LABELS,
    normText: normText,
    isPopupTitleText: isPopupTitleText,
    looksLikeClosePopupText: looksLikeClosePopupText,
    fallbackPopupNeedsTitle: fallbackPopupNeedsTitle,
    blobHasPopupTitle: blobHasPopupTitle,
    isEnabledState: isEnabledState,
    isDisabledControlState: isDisabledControlState,
    typeEnabledAfterCategory: typeEnabledAfterCategory,
    isApplyButtonText: isApplyButtonText,
    isCloseAllButtonText: isCloseAllButtonText,
    isLeafOptionText: isLeafOptionText,
    labelTokenMatch: labelTokenMatch,
    findLabelTextIndex: findLabelTextIndex,
    popupDiagFromTexts: popupDiagFromTexts,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
