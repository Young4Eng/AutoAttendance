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

  /** 제목 「출결마감구분」포함 여부(루트·폴백·TreeWalker용) */
  function hasPopupTitleInText(blob) {
    return blobHasPopupTitle(blob);
  }

  function blobHasPopupAction(blob) {
    var t = normText(blob);
    if (!t) return false;
    if (t.indexOf("닫기") >= 0) return true;
    if (t.indexOf("적용") >= 0) return true;
    return false;
  }

  function blobHasCategoryLabel(blob) {
    var t = normText(blob);
    if (!t) return false;
    for (var i = 0; i < CATEGORY_LABELS.length; i++) {
      if (t.indexOf(CATEGORY_LABELS[i]) >= 0) return true;
    }
    return false;
  }

  /**
   * climb 후보 본문: 제목 + (적용|닫기) + 구분 라벨.
   * titleRequiredOk(제목+질병)는 pick 단계에서 별도 강제.
   */
  function isClimbPopupRootContent(blob) {
    var t = normText(blob);
    if (!t) return false;
    if (!blobHasPopupTitle(t)) return false;
    if (!blobHasPopupAction(t)) return false;
    if (!blobHasCategoryLabel(t)) return false;
    return true;
  }

  /** 루트 크기 상한 — body/html·거대 래퍼 거부 */
  var POPUP_ROOT_MAX_TEXT_LEN = 900;
  var POPUP_ROOT_MAX_TEXT_COUNT = 72;
  var POPUP_ROOT_MAX_WIDTH = 900;
  var POPUP_ROOT_MAX_HEIGHT = 700;
  var POPUP_ROOT_MAX_AREA = 520000;
  var POPUP_ROOT_MIN_WIDTH = 120;
  var POPUP_ROOT_MIN_HEIGHT = 60;

  function isPopupRootSizeOk(rec) {
    rec = rec || {};
    var tag = String(rec.tagName || "").toUpperCase();
    if (tag === "BODY" || tag === "HTML") return false;
    var w = Number(rec.width) || 0;
    var h = Number(rec.height) || 0;
    if (w > 0 && w < POPUP_ROOT_MIN_WIDTH) return false;
    if (h > 0 && h < POPUP_ROOT_MIN_HEIGHT) return false;
    if (w > POPUP_ROOT_MAX_WIDTH || h > POPUP_ROOT_MAX_HEIGHT) return false;
    if (w > 0 && h > 0 && w * h > POPUP_ROOT_MAX_AREA) return false;
    var text = normText(rec.text);
    if (text.length > POPUP_ROOT_MAX_TEXT_LEN) return false;
    var tc = rec.textCount;
    if (tc != null && tc !== "" && Number(tc) > POPUP_ROOT_MAX_TEXT_COUNT) return false;
    return true;
  }

  /**
   * 조상 후보 중 가장 작은 유효 팝업 루트 선택.
   * 필수: isClimbPopupRootContent + fallbackPopupNeedsTitle(titleRequiredOk) + 크기 상한.
   * 동점이면 textLen → area → textCount 순으로 더 작은 쪽.
   * @returns {{ id: number, textLen: number, textCount: number, area: number } | null}
   */
  function pickSmallestPopupRoot(candidates) {
    var list = candidates || [];
    var best = null;
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (!c || c.id == null) continue;
      if (!isPopupRootSizeOk(c)) continue;
      var blob = normText(c.text);
      if (!isClimbPopupRootContent(blob)) continue;
      if (!fallbackPopupNeedsTitle(blob)) continue;
      var textLen = blob.length;
      var tc = c.textCount != null && c.textCount !== "" ? Number(c.textCount) : textLen;
      if (isNaN(tc)) tc = textLen;
      var w = Number(c.width) || 0;
      var h = Number(c.height) || 0;
      var area = w > 0 && h > 0 ? w * h : textLen * 10;
      var row = { id: c.id, textLen: textLen, textCount: tc, area: area };
      if (
        !best ||
        row.textLen < best.textLen ||
        (row.textLen === best.textLen && row.area < best.area) ||
        (row.textLen === best.textLen && row.area === best.area && row.textCount < best.textCount)
      ) {
        best = row;
      }
    }
    return best;
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


  /** getBoundingClientRect-like: width/height > 0 */
  function isClientRectVisible(r) {
    if (!r) return false;
    var w = Number(r.width) || 0;
    var h = Number(r.height) || 0;
    return w > 0 && h > 0;
  }

  /**
   * 팝업 오픈 성공 판정 — titleHit만으로 절대 성공 금지.
   * titleVisible + categoryVisible 필수.
   */
  function popupOpenVisibleOk(flags) {
    flags = flags || {};
    if (!flags.titleVisible) return false;
    if (!flags.categoryVisible) return false;
    // titleHit alone must never pass
    if (flags.titleVisible !== true && flags.categoryVisible !== true) return false;
    return true;
  }

  /** 클릭 전 비가시 → 클릭 후 가시 (새로 뜸) */
  function titleBecameNewlyVisible(beforeVisible, afterVisible) {
    return !beforeVisible && !!afterVisible;
  }

  /**
   * 클래스 문자열 → 토큰 배열(실명·번호 없음). SVGAnimatedString 대응.
   * Nexacro 현장: classList 없이 className이 'cl-textcl-placeholdercl-unselectable'
   * 처럼 공백 없이 이어 붙는 경우 → cl- 접두로 분리.
   */
  function classNameTokens(className) {
    var raw = className;
    try {
      if (raw && typeof raw === "object" && raw.baseVal != null) raw = raw.baseVal;
    } catch (e) {
      raw = "";
    }
    var s = String(raw || "");
    if (!s) return [];
    var chunks = s.split(/\s+/);
    var out = [];
    function pushTok(t) {
      t = String(t || "").replace(/[^A-Za-z0-9_\-]/g, "");
      if (!t || t.length > 64) return;
      if (out.indexOf(t) >= 0) return;
      out.push(t);
    }
    for (var i = 0; i < chunks.length; i++) {
      var chunk = chunks[i];
      if (!chunk) continue;
      var clCount = (chunk.match(/cl-/gi) || []).length;
      if (clCount >= 2) {
        // 'cl-textcl-placeholder' → split before each cl- (char class alone is greedy)
        var clParts = chunk.split(/(?=cl-)/i).filter(function (p) {
          return !!p;
        });
        for (var c = 0; c < clParts.length; c++) pushTok(clParts[c]);
      } else {
        pushTok(chunk);
      }
      if (out.length >= 12) break;
    }
    return out.slice(0, 12);
  }

  /** placeholder/text 리프(작은 rect·cl-text/cl-placeholder) 여부 — 익명 토큰·rect만. */
  function isPlaceholderCloseLeaf(tokens, rect, kind) {
    tokens = tokens || [];
    rect = anonRect(rect || {});
    var blob = tokens.join(" ").toLowerCase();
    var hasPh =
      /\bcl-text\b/.test(blob) ||
      /\bcl-placeholder\b/.test(blob) ||
      /\bunselectable\b/.test(blob);
    var small = rect.w > 0 && rect.h > 0 && rect.w <= 140 && rect.h <= 32;
    var kindCell = !kind || kind === "cell" || kind === "node" || kind === "placeholder";
    if (hasPh && (small || kindCell)) return true;
    if (kind === "placeholder") return true;
    if (kindCell && small && rect.h <= 22 && rect.w <= 120) return true;
    return false;
  }

  /** GridCellControl / nexacontentsbox / GridCell / contentsbox 컨테이너 토큰. */
  function isCloseCellContainerTokens(tokens) {
    var blob = (tokens || []).join(" ").toLowerCase();
    return /gridcell|cellcontrol|nexacontentsbox|contentsbox/.test(blob);
  }

  /** 후보 centerX − 「마감」헤더 centerX (익명 숫자). */
  function closeHeaderDx(cellCenterX, headerCenterX) {
    var a = Number(cellCenterX);
    var b = Number(headerCenterX);
    if (isNaN(a) || isNaN(b)) return null;
    return Math.round(a - b);
  }

  /** 마감 열 정렬: |dx| ≤ maxDx (기본 64). */
  function alignsWithCloseHeader(cellCenterX, headerCenterX, maxDx) {
    var dx = closeHeaderDx(cellCenterX, headerCenterX);
    if (dx == null) return false;
    var lim = maxDx == null ? 64 : Number(maxDx);
    if (isNaN(lim) || lim < 0) lim = 64;
    return Math.abs(dx) <= lim;
  }

  /**
   * placeholder 리프 + 조상 디스크립터 → 클릭 우선순위.
   * 부모 GridCell/contentsbox를 리프보다 앞에 둠. 먼 열 후보는 reject.
   * 각 항목: { id, tokens, rect, kind, centerX? }
   * headerCenterX 있으면 dx 필터. 반환: 정렬된 id 배열(+ meta는 테스트용 별도).
   */
  function orderCloseClimbTargets(leaf, ancestors, headerCenterX, maxDx) {
    leaf = leaf || {};
    ancestors = Array.isArray(ancestors) ? ancestors : [];
    var leafTok = leaf.tokens || classNameTokens(leaf.className || leaf.cls || "");
    var leafRect = anonRect(leaf.rect || {});
    var leafKind = leaf.kind || "cell";
    var leafIsPh = isPlaceholderCloseLeaf(leafTok, leafRect, leafKind);
    var items = [];
    function centerOf(rec, rect) {
      if (rec.centerX != null && !isNaN(Number(rec.centerX))) return Number(rec.centerX);
      return rect.x + rect.w / 2;
    }
    function consider(rec, role) {
      if (!rec) return;
      var tok = rec.tokens || classNameTokens(rec.className || rec.cls || "");
      var rect = anonRect(rec.rect || {});
      var cx = centerOf(rec, rect);
      var dx = headerCenterX != null ? closeHeaderDx(cx, headerCenterX) : null;
      var aligned =
        headerCenterX == null || headerCenterX === undefined
          ? true
          : alignsWithCloseHeader(cx, headerCenterX, maxDx);
      items.push({
        id: rec.id != null ? rec.id : role,
        tokens: tok,
        rect: rect,
        kind: String(rec.kind || role || "node").slice(0, 24),
        role: role,
        centerX: cx,
        dx: dx,
        aligned: aligned,
        isContainer: isCloseCellContainerTokens(tok),
        area: Math.max(0, rect.w) * Math.max(0, rect.h),
      });
    }
    consider(leaf, "leaf");
    for (var i = 0; i < ancestors.length && i < 8; i++) {
      consider(ancestors[i], "parent");
    }
    var kept = items.filter(function (it) {
      return it.aligned;
    });
    if (!kept.length) kept = items.slice();
    // placeholder면 컨테이너·더 큰 부모를 앞세움
    kept.sort(function (a, b) {
      if (leafIsPh) {
        var aCont = a.isContainer || (a.role === "parent" && a.area > leafRect.w * leafRect.h * 1.15) ? 0 : 1;
        var bCont = b.isContainer || (b.role === "parent" && b.area > leafRect.w * leafRect.h * 1.15) ? 0 : 1;
        if (aCont !== bCont) return aCont - bCont;
        if (a.role !== b.role) return a.role === "parent" ? -1 : 1;
        // larger parent preferred among containers
        if (a.isContainer && b.isContainer && a.area !== b.area) return b.area - a.area;
      } else {
        if (a.role === "leaf" && b.role !== "leaf") return -1;
        if (b.role === "leaf" && a.role !== "leaf") return 1;
      }
      var aDx = a.dx == null ? 0 : Math.abs(a.dx);
      var bDx = b.dx == null ? 0 : Math.abs(b.dx);
      if (aDx !== bDx) return aDx - bDx;
      return a.area - b.area;
    });
    return kept;
  }

  /** closeCellDump를 JSON 문자열로 — console/[object Object] 방지. 성명·번호 없음. */
  function stringifyCloseCellDump(dump) {
    var norm = normalizeCloseCellFailDump(dump || {});
    try {
      return JSON.stringify(norm);
    } catch (e) {
      return '{"candidateCount":0,"modes":[]}';
    }
  }

  /** rect 익명 숫자만 */
  function anonRect(r) {
    r = r || {};
    function n(v) {
      var x = Number(v);
      if (isNaN(x)) return 0;
      return Math.round(x);
    }
    return {
      x: n(r.x != null ? r.x : r.left),
      y: n(r.y != null ? r.y : r.top),
      w: n(r.width != null ? r.width : r.w),
      h: n(r.height != null ? r.height : r.h),
    };
  }

  /**
   * 클릭 후보 익명 레코드 — tag / class tokens / rect / kind 만.
   * text·value·이름·번호 금지.
   */
  function anonClickCandidate(rec) {
    rec = rec || {};
    return {
      tag: String(rec.tagName || rec.tag || "").toUpperCase().slice(0, 24),
      cls: classNameTokens(rec.className || rec.cls || ""),
      rect: anonRect(rec.rect || rec),
      kind: String(rec.kind || "node").slice(0, 24),
    };
  }

  /**
   * decoy titleHit vs 클릭 후 신규 가시.
   * after에 제목+질병(illness) 가시 필수.
   * 성공: 질병이 새로 뜸(현장 decoy titleHit=1·illness=0) 또는 제목이 새로 뜸.
   * titleHit 단독·before에 이미 제목+질병 둘 다 가시인데 after만 같은 경우(팝업 미오픈)는 거부하지 않되
   *   — 둘 다 before부터 가시면 false (페이지 decoy 쌍 오탐 방지; 실제 루트는 호출측 findOpenPopupVisible).
   */
  function popupNewlyOpenedOk(before, after) {
    before = before || {};
    after = after || {};
    if (!after.titleVisible || !after.illnessVisible) return false;
    var titleNew = titleBecameNewlyVisible(before.titleVisible, after.titleVisible);
    var illnessNew = titleBecameNewlyVisible(before.illnessVisible, after.illnessVisible);
    if (titleNew || illnessNew) return true;
    // 둘 다 클릭 전부터 가시 → decoy 잔여로 간주, 신규 오픈 아님
    return false;
  }

  /**
   * dry-run/openClosePopup 실패용 익명 dump 형태 검증·정규화.
   * 허용 키만. 문자열 text/name/번호 값 없음.
   */
  function normalizeCloseCellFailDump(dump) {
    dump = dump || {};
    var cands = Array.isArray(dump.candidates) ? dump.candidates : [];
    var outCands = [];
    for (var i = 0; i < cands.length && i < 24; i++) {
      outCands.push(anonClickCandidate(cands[i]));
    }
    function vis(v) {
      return v ? 1 : 0;
    }
    var before = dump.before || {};
    var after = dump.after || {};
    var dxRaw = dump.closeHeaderDx;
    var dxNum = dxRaw == null || dxRaw === "" ? null : Number(dxRaw);
    if (dxNum != null && isNaN(dxNum)) dxNum = null;
    var aligned =
      dump.closeHeaderAligned != null
        ? vis(dump.closeHeaderAligned)
        : dxNum == null
          ? 0
          : Math.abs(dxNum) <= 64
            ? 1
            : 0;
    return {
      candidates: outCands,
      before: {
        titleVisible: vis(before.titleVisible),
        illnessVisible: vis(before.illnessVisible),
        decoyTitle: vis(before.decoyTitle != null ? before.decoyTitle : before.titleVisible && !before.illnessVisible),
      },
      after: {
        titleVisible: vis(after.titleVisible),
        illnessVisible: vis(after.illnessVisible),
        titleNewly: vis(after.titleNewly != null ? after.titleNewly : titleBecameNewlyVisible(before.titleVisible, after.titleVisible)),
        illnessNewly: vis(after.illnessNewly != null ? after.illnessNewly : titleBecameNewlyVisible(before.illnessVisible, after.illnessVisible)),
      },
      modes: Array.isArray(dump.modes)
        ? dump.modes.map(function (m) {
            return String(m || "").slice(0, 32);
          }).slice(0, 16)
        : [],
      candidateCount: outCands.length,
      closeHeaderDx: dxNum,
      closeHeaderAligned: aligned,
    };
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
    hasPopupTitleInText: hasPopupTitleInText,
    looksLikeClosePopupText: looksLikeClosePopupText,
    fallbackPopupNeedsTitle: fallbackPopupNeedsTitle,
    blobHasPopupTitle: blobHasPopupTitle,
    blobHasPopupAction: blobHasPopupAction,
    blobHasCategoryLabel: blobHasCategoryLabel,
    isClimbPopupRootContent: isClimbPopupRootContent,
    isPopupRootSizeOk: isPopupRootSizeOk,
    pickSmallestPopupRoot: pickSmallestPopupRoot,
    POPUP_ROOT_MAX_TEXT_LEN: POPUP_ROOT_MAX_TEXT_LEN,
    POPUP_ROOT_MAX_TEXT_COUNT: POPUP_ROOT_MAX_TEXT_COUNT,
    isClientRectVisible: isClientRectVisible,
    popupOpenVisibleOk: popupOpenVisibleOk,
    titleBecameNewlyVisible: titleBecameNewlyVisible,
    classNameTokens: classNameTokens,
    isPlaceholderCloseLeaf: isPlaceholderCloseLeaf,
    isCloseCellContainerTokens: isCloseCellContainerTokens,
    closeHeaderDx: closeHeaderDx,
    alignsWithCloseHeader: alignsWithCloseHeader,
    orderCloseClimbTargets: orderCloseClimbTargets,
    stringifyCloseCellDump: stringifyCloseCellDump,
    anonRect: anonRect,
    anonClickCandidate: anonClickCandidate,
    popupNewlyOpenedOk: popupNewlyOpenedOk,
    normalizeCloseCellFailDump: normalizeCloseCellFailDump,
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
