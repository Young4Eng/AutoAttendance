/**
 * 출결마감구분 팝업 라벨·버튼 탐지 순수 헬퍼.
 * DOM 없음 — 텍스트 레코드만. 실명·번호 값 금지.
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

  function normText(s) {
    return String(s || "")
      .replace(/[\u200b-\u200d\ufeff]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /** 팝업 제목: 정확 일치 또는 출결마감/구분 선택 포함 */
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

  /**
   * 본문 텍스트가 출결마감구분 레이어처럼 보이는지.
   * 구분(질병 등) + 종류(지각 등) 마커가 같이 있어야 함.
   */
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

  /** 「적용」만. 「출결마감」은 거부. */
  function isApplyButtonText(text) {
    var t = normText(text);
    if (!t) return false;
    if (t.indexOf("출결마감") >= 0) return false;
    return t === "적용";
  }

  function isCloseAllButtonText(text) {
    var t = normText(text);
    return t === "출결마감" || (t.indexOf("출결마감") >= 0 && t.indexOf("구분") < 0);
  }

  /**
   * texts: string[] 보이는 짧은 라벨.
   * want와 정확·선두 일치하는 첫 후보 인덱스.
   */
  function findLabelTextIndex(texts, want) {
    var w = normText(want);
    if (!w) return -1;
    var list = texts || [];
    for (var i = 0; i < list.length; i++) {
      var t = normText(list[i]);
      if (t === w) return i;
    }
    for (var j = 0; j < list.length; j++) {
      var t2 = normText(list[j]);
      if (t2.indexOf(w) === 0 && t2.length <= w.length + 8) return j;
    }
    return -1;
  }

  /** 익명 diag — 값 문자열 없이 히트 카운트만 */
  function popupDiagFromTexts(texts) {
    var list = texts || [];
    var titleHit = 0;
    var illnessHit = 0;
    var unexcusedHit = 0;
    var otherHit = 0;
    var recognizedHit = 0;
    var lateHit = 0;
    var earlyHit = 0;
    var absenceHit = 0;
    var resultHit = 0;
    var applyHit = 0;
    var closeAllHit = 0;
    var reasonHit = 0;
    var popupLike = 0;
    for (var i = 0; i < list.length; i++) {
      var t = normText(list[i]);
      if (!t) continue;
      if (isPopupTitleText(t)) titleHit++;
      if (t === "질병" || t.indexOf("질병") === 0) illnessHit++;
      if (t === "미인정" || t.indexOf("미인정") === 0) unexcusedHit++;
      if (t === "기타" || t.indexOf("기타") === 0) otherHit++;
      if (t === "출석인정" || t.indexOf("출석인정") === 0) recognizedHit++;
      if (t === "지각" || t.indexOf("지각") === 0) lateHit++;
      if (t === "조퇴" || t.indexOf("조퇴") === 0) earlyHit++;
      if (t === "결석" || t.indexOf("결석") === 0) absenceHit++;
      if (t === "결과" || t.indexOf("결과") === 0) resultHit++;
      if (isApplyButtonText(t)) applyHit++;
      if (isCloseAllButtonText(t)) closeAllHit++;
      if (t === "사유" || t.indexOf("사유") === 0) reasonHit++;
    }
    var joined = list.map(normText).join(" ");
    if (looksLikeClosePopupText(joined)) popupLike = 1;
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
      popupLike: popupLike,
      textCount: list.length,
    };
  }

  g.ChulgyeolPopupApply = {
    CATEGORY_KO: CATEGORY_KO,
    TYPE_KO: TYPE_KO,
    CATEGORY_LABELS: CATEGORY_LABELS,
    TYPE_LABELS: TYPE_LABELS,
    normText: normText,
    isPopupTitleText: isPopupTitleText,
    looksLikeClosePopupText: looksLikeClosePopupText,
    isApplyButtonText: isApplyButtonText,
    isCloseAllButtonText: isCloseAllButtonText,
    findLabelTextIndex: findLabelTextIndex,
    popupDiagFromTexts: popupDiagFromTexts,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
