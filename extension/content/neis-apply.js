/**
 * #12 라벨 기준 적용. CSS 실명 경로·/ 타이핑·출결마감 클릭 없음.
 * 기본 dryRun=true (저장 전 중단).
 */
(function () {
  if (globalThis.__chulgyeolMateApply) return;
  globalThis.__chulgyeolMateApply = true;
  const CATEGORY_KO = {
    illness: "질병",
    unexcused: "미인정",
    other: "기타",
    recognized: "출석인정",
  };
  const TYPE_KO = {
    late: "지각",
    early_leave: "조퇴",
    absence: "결석",
    result: "결과",
  };

  function closeLabel(category, type) {
    return CATEGORY_KO[category] + TYPE_KO[type];
  }

  function normalizeDate(s) {
    if (globalThis.ChulgyeolFilterBar && globalThis.ChulgyeolFilterBar.normalizeDate) {
      return globalThis.ChulgyeolFilterBar.normalizeDate(s);
    }
    if (!s) return "";
    const m = String(s).match(/(\d{4})\D(\d{1,2})\D(\d{1,2})/);
    if (!m) return "";
    return m[1] + "-" + m[2].padStart(2, "0") + "-" + m[3].padStart(2, "0");
  }

  function sleep(ms) {
    return new Promise(function (r) {
      setTimeout(r, ms);
    });
  }

  function visible(el) {
    if (!el || !(el instanceof Element)) return false;
    const st = getComputedStyle(el);
    if (st.display === "none" || st.visibility === "hidden") return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function normText(s) {
    return String(s || "")
      .replace(/[\u200b-\u200d\ufeff]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /** 사이드내비(메시지함 등) — 「반」라벨 오탐 제외 */
  function isSidenavContext(el) {
    var cur = el;
    var depth = 0;
    while (cur && cur.nodeType === 1 && depth < 24) {
      var id = String(cur.id || "").toLowerCase();
      var cls = "";
      try {
        cls = String(cur.className && cur.className.baseVal != null ? cur.className.baseVal : cur.className || "").toLowerCase();
      } catch (e) {
        cls = "";
      }
      var aria = "";
      try {
        aria = String((cur.getAttribute && (cur.getAttribute("aria-label") || cur.getAttribute("title"))) || "");
      } catch (e2) {
        aria = "";
      }
      var blob = id + " " + cls + " " + aria;
      if (/sidenavigation|sidenav|cl-sidenavigation|메시지함/i.test(blob)) return true;
      if (cur.tagName === "NAV" && /side|nav|메시지/i.test(blob)) return true;
      cur = cur.parentElement;
      depth++;
    }
    return false;
  }

  function findElementsByExactText(root, text) {
    const out = [];
    function walk(node) {
      if (!node || node.nodeType !== Node.ELEMENT_NODE) return;
      const el = node;
      if (el.tagName === "SCRIPT" || el.tagName === "STYLE") return;
      var own = "";
      for (var i = 0; i < el.childNodes.length; i++) {
        var n = el.childNodes[i];
        if (n.nodeType === Node.TEXT_NODE) own += n.textContent || "";
      }
      own = normText(own);
      if (own === text) out.push(el);
      for (var j = 0; j < el.children.length; j++) walk(el.children[j]);
    }
    walk(root);
    return out.filter(visible);
  }

  /** 짧은 라벨 노드(넥사크로 contentsbox 등). 긴 행 텍스트는 제외. */
  function findLabelHits(root, label) {
    var out = [];
    var all = root.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (!visible(el)) continue;
      if (el.tagName === "SCRIPT" || el.tagName === "STYLE") continue;
      var full = normText(el.textContent);
      if (full !== label && full.indexOf(label) !== 0) continue;
      if (full.length > label.length + 14) continue;
      var childHit = false;
      for (var c = 0; c < el.children.length; c++) {
        var cf = normText(el.children[c].textContent);
        if (cf === label || (cf.indexOf(label) === 0 && cf.length <= label.length + 14)) {
          childHit = true;
          break;
        }
      }
      if (childHit) continue;
      out.push(el);
    }
    return out;
  }

  function findPeriodHits(root) {
    var out = [];
    var all = root.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (!visible(el)) continue;
      var full = normText(el.textContent);
      if (full.length > 28) continue;
      var pm = full.match(/^(\d+)\s*교시/);
      if (!pm) continue;
      var childHas = false;
      for (var c = 0; c < el.children.length; c++) {
        if (/^\d+\s*교시/.test(normText(el.children[c].textContent))) {
          childHas = true;
          break;
        }
      }
      if (childHas) continue;
      out.push({ el: el, period: Number(pm[1]), rect: el.getBoundingClientRect() });
    }
    return out;
  }

  function findClickableByText(root, text) {
    var cands = findElementsByExactText(root, text);
    for (var i = 0; i < cands.length; i++) {
      var el = cands[i];
      var btn =
        el.closest("button, [role='button'], a, input[type='button'], input[type='submit']") ||
        el;
      if (visible(btn)) {
        var t = (btn.textContent || btn.value || "").replace(/\s+/g, " ").trim();
        if (t === text) return btn;
      }
    }
    var inputs = root.querySelectorAll("input[type='button'], input[type='submit']");
    for (var k = 0; k < inputs.length; k++) {
      if (inputs[k].value === text && visible(inputs[k])) return inputs[k];
    }
    return null;
  }

  function clickEl(el) {
    return clickOnce(el);
  }

  /** 실제 클릭 1회. pointer+click+elementFromPoint 이중 시퀀스 금지. */
  function clickOnce(el) {
    if (!el || !(el instanceof Element)) return false;
    var doc = el.ownerDocument || document;
    var view = doc.defaultView || window;
    var r = el.getBoundingClientRect();
    if (!(r.width > 0 && r.height > 0)) return false;
    var cx = r.left + r.width / 2;
    var cy = r.top + r.height / 2;
    var at = el;
    try {
      var hit = doc.elementFromPoint(cx, cy);
      if (hit && hit instanceof Element) at = hit;
    } catch (eP) {}
    try {
      if (typeof at.focus === "function") at.focus();
    } catch (eF) {}
    var init = {
      bubbles: true,
      cancelable: true,
      view: view,
      clientX: cx,
      clientY: cy,
      screenX: cx,
      screenY: cy,
      button: 0,
      buttons: 1,
      detail: 1,
    };
    try {
      at.dispatchEvent(new MouseEvent("mousedown", init));
      init.buttons = 0;
      at.dispatchEvent(new MouseEvent("mouseup", init));
      at.dispatchEvent(new MouseEvent("click", init));
    } catch (eM) {
      try {
        if (typeof at.click === "function") at.click();
      } catch (eC) {}
    }
    return true;
  }

  /**
   * Nexacro 친화 클릭: focus → pointer/mouse down-up-click (좌표 포함).
   * fireEvent 레거시·dblclick·mousedown→mouseup→click 순서 변형 지원.
   * usePoint 시 셀 중심 elementFromPoint 대상에도 동일 시퀀스.
   */
  function clickNexa(el, opts) {
    if (!el || !(el instanceof Element)) return false;
    opts = opts || {};
    var doc = el.ownerDocument || document;
    var view = doc.defaultView || window;
    var r = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
    var cx = r ? r.left + r.width / 2 : 0;
    var cy = r ? r.top + r.height / 2 : 0;
    var MouseEventCtor = view.MouseEvent || MouseEvent;
    function fire(type, target, buttons) {
      var evInit = {
        bubbles: true,
        cancelable: true,
        view: view,
        clientX: cx,
        clientY: cy,
        screenX: cx,
        screenY: cy,
        button: 0,
        buttons: buttons == null ? (type === "mousedown" || type === "pointerdown" ? 1 : 0) : buttons,
        detail: type === "dblclick" ? 2 : type === "click" ? 1 : 0,
      };
      try {
        target.dispatchEvent(new MouseEventCtor(type, evInit));
      } catch (eFire) {
        try {
          var ev = doc.createEvent("MouseEvents");
          ev.initMouseEvent(type, true, true, view, type === "dblclick" ? 2 : 1, cx, cy, cx, cy, false, false, false, false, 0, null);
          target.dispatchEvent(ev);
        } catch (e2) {}
      }
      // Nexacro/IE 레거시 fireEvent
      try {
        if (typeof target.fireEvent === "function") {
          var ieType = type.indexOf("pointer") === 0 ? null : "on" + type;
          if (ieType) target.fireEvent(ieType);
        }
      } catch (eIe) {}
    }
    function seq(target, mode) {
      if (!target) return;
      mode = mode || "full";
      try {
        if (typeof target.focus === "function") target.focus();
      } catch (eF) {}
      if (mode === "mouseOnly") {
        fire("mousedown", target, 1);
        fire("mouseup", target, 0);
        fire("click", target, 0);
      } else if (mode === "dblclick") {
        fire("mousedown", target, 1);
        fire("mouseup", target, 0);
        fire("click", target, 0);
        fire("mousedown", target, 1);
        fire("mouseup", target, 0);
        fire("click", target, 0);
        fire("dblclick", target, 0);
      } else {
        // full: pointer → mouse → click
        fire("pointerdown", target, 1);
        fire("mousedown", target, 1);
        fire("pointerup", target, 0);
        fire("mouseup", target, 0);
        fire("click", target, 0);
      }
      if (typeof target.click === "function") {
        try {
          target.click();
        } catch (eC) {}
      }
    }
    var mode = opts.mode || "full";
    seq(el, mode);
    if (opts.usePoint !== false && r && r.width > 0 && r.height > 0) {
      var at = null;
      try {
        at = doc.elementFromPoint(cx, cy);
      } catch (eP) {
        at = null;
      }
      if (at && at !== el) {
        seq(at, mode);
      }
    }
    return true;
  }

  /** 셀 중심 좌표만으로 elementFromPoint 클릭 */
  function clickNexaAtCenter(el, mode) {
    if (!el || !el.getBoundingClientRect) return false;
    var doc = el.ownerDocument || document;
    var r = el.getBoundingClientRect();
    if (!(r.width > 0 && r.height > 0)) return false;
    var cx = r.left + r.width / 2;
    var cy = r.top + r.height / 2;
    var at = null;
    try {
      at = doc.elementFromPoint(cx, cy);
    } catch (e) {
      at = null;
    }
    if (!at) at = el;
    return clickNexa(at, { usePoint: false, mode: mode || "full" });
  }

  function log(row, type, result, code) {
    var parts = ["row=" + row, "type=" + type, "result=" + result];
    if (code) parts.push("code=" + code);
    console.info("[출결메이트]", parts.join(" "));
  }

  function cellLabel(cell) {
    return normText((cell && cell.textContent) || "");
  }

  function gridDiag(root) {
    var text = normText(
      (root && root.body && root.body.innerText) || (root && root.innerText) || "",
    );
    return {
      tables: root.querySelectorAll ? root.querySelectorAll("table").length : 0,
      hasNum: text.indexOf("번호") >= 0,
      hasName: text.indexOf("성명") >= 0,
      hasClose: text.indexOf("마감") >= 0,
      hasPeriod: /\d+\s*교시/.test(text),
      hasMorning: text.indexOf("조회") >= 0,
      hitNum: findLabelHits(root, "번호").length,
      hitName: findLabelHits(root, "성명").length,
      hitClose: findLabelHits(root, "마감").length,
      hitPeriod: findPeriodHits(root).length,
    };
  }

  function labelIndex(texts, names) {
    for (var i = 0; i < texts.length; i++) {
      for (var n = 0; n < names.length; n++) {
        if (texts[i] === names[n] || texts[i].indexOf(names[n]) === 0) return i;
      }
    }
    return -1;
  }

  /** 헤더가 1~2줄로 갈라져도 번호·성명·마감 + N교시를 모은다. */
  function parseHeaderBlock(rows, startIdx) {
    if (!rows || startIdx >= rows.length) return null;
    var baseCells = rows[startIdx].cells;
    if (!baseCells || !baseCells.length) return null;
    var baseTexts = [];
    for (var c = 0; c < baseCells.length; c++) baseTexts.push(cellLabel(baseCells[c]));
    var idxNum = labelIndex(baseTexts, ["번호"]);
    var idxName = labelIndex(baseTexts, ["성명"]);
    var idxClose = labelIndex(baseTexts, ["마감"]);
    if (idxNum < 0 || idxName < 0 || idxClose < 0) return null;

    var col = { number: idxNum, name: idxName, close: idxClose };
    var periodCols = {};
    var periodCount = 0;
    var maxCols = baseCells.length;

    for (var r = startIdx; r < Math.min(rows.length, startIdx + 3); r++) {
      var cells = rows[r].cells;
      if (!cells) continue;
      maxCols = Math.max(maxCols, cells.length);
      for (var p = 0; p < cells.length; p++) {
        var tx = cellLabel(cells[p]);
        if (!tx) continue;
        if (col.morning == null && (tx === "조회" || tx.indexOf("조회") === 0)) col.morning = p;
        if (col.afternoon == null && (tx === "종례" || tx.indexOf("종례") === 0)) col.afternoon = p;
        if (col.reason == null && (tx === "사유" || tx.indexOf("사유") === 0)) col.reason = p;
        var pm = tx.match(/^(\d+)\s*교시/) || tx.match(/^(\d+)$/);
        // 순수 숫자만은 2번째 헤더 줄의 교시 번호일 수 있음 — 같은 줄에 '교시'가 있을 때만 숫자 단독 허용은 위험
        pm = tx.match(/^(\d+)\s*교시/);
        if (pm) {
          periodCols[Number(pm[1])] = p;
          periodCount = Math.max(periodCount, Number(pm[1]));
        }
      }
    }
    if (periodCount === 0) return null;
    return {
      col: col,
      periodCols: periodCols,
      periodCount: periodCount,
      colCount: maxCols,
      headerRows: 1,
    };
  }

  function findAttendanceGrid(root) {
    var tables = Array.prototype.slice.call(root.querySelectorAll("table")).filter(visible);
    var headerMap = null;
    var headerTable = null;
    var headerIdx = -1;

    for (var t = 0; t < tables.length; t++) {
      var table = tables[t];
      var rows = table.rows;
      if (!rows || !rows.length) continue;
      for (var i = 0; i < Math.min(rows.length, 15); i++) {
        var parsed = parseHeaderBlock(rows, i);
        if (!parsed) continue;
        headerMap = parsed;
        headerTable = table;
        headerIdx = i;
        var dataStart = i + 1;
        // 다음 줄이 교시 서브헤더일 수 있음 → 데이터는 더 아래
        if (i + 1 < rows.length) {
          var nextTexts = [];
          for (var c = 0; c < rows[i + 1].cells.length; c++) nextTexts.push(cellLabel(rows[i + 1].cells[c]));
          var subHeader = nextTexts.some(function (tx) { return /^(\d+)\s*교시/.test(tx) || tx === "조회" || tx === "종례"; });
          var looksData = nextTexts.some(function (tx) { return /^\d+$/.test(tx); });
          if (subHeader && !looksData) dataStart = i + 2;
        }
        if (rows.length > dataStart) {
          return {
            table: table,
            bodyTable: table,
            headerIdx: i,
            dataStart: dataStart,
            col: parsed.col,
            periodCols: parsed.periodCols,
            periodCount: parsed.periodCount,
            kind: "table-combined",
          };
        }
        break;
      }
      if (headerMap) break;
    }

    if (!headerMap) {
      var divGrid = findDivAttendanceGrid(root);
      if (divGrid) return divGrid;
      var spatial0 = findSpatialAttendanceGrid(root);
      if (spatial0) return spatial0;
      return null;
    }

    var best = null;
    for (var u = 0; u < tables.length; u++) {
      var bt = tables[u];
      if (!bt.rows || bt.rows.length < 1) continue;
      var dataStart2 = bt === headerTable ? headerIdx + 1 : 0;
      if (bt === headerTable && bt.rows.length > headerIdx + 1) {
        var nt = cellLabel(bt.rows[headerIdx + 1].cells[0] || {});
        if (/교시|조회|종례/.test(cellLabel(bt.rows[headerIdx + 1]))) dataStart2 = headerIdx + 2;
      }
      if (bt.rows.length <= dataStart2) continue;
      var sample = bt.rows[Math.min(dataStart2, bt.rows.length - 1)].cells;
      if (!sample || sample.length < 3) continue;
      var score = bt.rows.length;
      if (!best || score > best.score) best = { table: bt, dataStart: dataStart2, score: score };
    }
    if (!best) {
      var divGrid2 = findDivAttendanceGrid(root);
      if (divGrid2) return divGrid2;
      var spatial1 = findSpatialAttendanceGrid(root);
      if (spatial1) return spatial1;
      return null;
    }
    return {
      table: best.table,
      bodyTable: best.table,
      headerIdx: headerIdx,
      dataStart: best.dataStart,
      col: headerMap.col,
      periodCols: headerMap.periodCols,
      periodCount: headerMap.periodCount,
      kind: "table-split",
    };
  }

  function sameBand(a, b, tol) {
    return Math.abs(a.getBoundingClientRect().top - b.getBoundingClientRect().top) <= tol;
  }

  function pickNearBand(list, headerTop, maxDelta) {
    var best = null;
    var bestD = 1e9;
    for (var x = 0; x < list.length; x++) {
      var r = list[x].getBoundingClientRect();
      var d = Math.abs(r.top - headerTop);
      if (d > maxDelta) continue;
      if (d < bestD) {
        bestD = d;
        best = list[x];
      }
    }
    return best;
  }

  /**
   * 넥사크로류: table/공통 행 없이 화면 좌표로 번호·성명·마감·N교시 열을 묶는다.
   */
  function findSpatialAttendanceGrid(root) {
    var nums = findLabelHits(root, "번호");
    var names = findLabelHits(root, "성명");
    var closes = findLabelHits(root, "마감");
    if (!nums.length || !names.length || !closes.length) return null;

    var periods = findPeriodHits(root);
    var mornings = findLabelHits(root, "조회");
    var afternoons = findLabelHits(root, "종례");
    var reasons = findLabelHits(root, "사유");

    for (var i = 0; i < nums.length; i++) {
      for (var j = 0; j < names.length; j++) {
        if (!sameBand(nums[i], names[j], 30)) continue;
        for (var k = 0; k < closes.length; k++) {
          if (!sameBand(nums[i], closes[k], 30)) continue;
          var nR = nums[i].getBoundingClientRect();
          var aR = names[j].getBoundingClientRect();
          var cR = closes[k].getBoundingClientRect();
          if (Math.abs(nR.left - aR.left) < 6) continue;
          var headerTop = (nR.top + aR.top + cR.top) / 3;
          var headerBottom = Math.max(nR.bottom, aR.bottom, cR.bottom);

          var colHits = [
            { key: "number", el: nums[i] },
            { key: "name", el: names[j] },
            { key: "close", el: closes[k] },
          ];
          var periodCount = 0;
          for (var p = 0; p < periods.length; p++) {
            var pr = periods[p].rect;
            if (pr.top < headerTop - 12) continue;
            if (pr.top > headerBottom + 80) continue;
            colHits.push({ key: "period", el: periods[p].el, period: periods[p].period });
            periodCount = Math.max(periodCount, periods[p].period);
          }
          if (periodCount === 0) continue;

          var morningEl = pickNearBand(mornings, headerTop, 80);
          var afternoonEl = pickNearBand(afternoons, headerTop, 80);
          var reasonEl = pickNearBand(reasons, headerTop, 80);
          if (morningEl) colHits.push({ key: "morning", el: morningEl });
          if (afternoonEl) colHits.push({ key: "afternoon", el: afternoonEl });
          if (reasonEl) colHits.push({ key: "reason", el: reasonEl });

          colHits.sort(function (A, B) {
            return A.el.getBoundingClientRect().left - B.el.getBoundingClientRect().left;
          });

          var col = {};
          var periodColsIdx = {};
          var centers = [];
          for (var h = 0; h < colHits.length; h++) {
            var hit = colHits[h];
            var rr = hit.el.getBoundingClientRect();
            centers.push(rr.left + rr.width / 2);
            if (hit.key === "number") col.number = h;
            else if (hit.key === "name") col.name = h;
            else if (hit.key === "close") col.close = h;
            else if (hit.key === "morning") col.morning = h;
            else if (hit.key === "afternoon") col.afternoon = h;
            else if (hit.key === "reason") col.reason = h;
            else if (hit.key === "period") periodColsIdx[hit.period] = h;
          }
          if (col.number == null || col.name == null || col.close == null) continue;

          return {
            kind: "spatial",
            table: null,
            bodyTable: null,
            headerIdx: -1,
            dataStart: 0,
            col: col,
            periodCols: periodColsIdx,
            periodCount: periodCount,
            headerCenters: centers,
            headerBottom: headerBottom,
            root: root,
          };
        }
      }
    }
    return null;
  }

  function closeHeaderMaxDxValue() {
    var api = PA();
    if (api && typeof api.closeHeaderMaxDx === "function") {
      var n = Number(api.closeHeaderMaxDx(null));
      if (!isNaN(n) && n > 0 && n <= 80) return n;
    }
    if (api && api.CLOSE_HEADER_MAX_DX != null) {
      var d = Number(api.CLOSE_HEADER_MAX_DX);
      if (!isNaN(d) && d > 0 && d <= 80) return d;
    }
    return 40;
  }

  function closeHeaderAlignedOk(cellCenterX, headerCenterX) {
    if (headerCenterX == null || isNaN(Number(headerCenterX))) return false;
    if (cellCenterX == null || isNaN(Number(cellCenterX))) return false;
    var api = PA();
    var maxDx = closeHeaderMaxDxValue();
    if (api && typeof api.alignsWithCloseHeader === "function") {
      return !!api.alignsWithCloseHeader(cellCenterX, headerCenterX, maxDx);
    }
    return Math.abs(Number(cellCenterX) - Number(headerCenterX)) <= maxDx;
  }

  function cellCenterX(el) {
    if (!el || !el.getBoundingClientRect) return null;
    var r = el.getBoundingClientRect();
    if (!(r.width > 0 && r.height > 0)) return null;
    return r.left + r.width / 2;
  }

  /** 번호·성명 칸으로 행 Y 띠. 행 컨테이너가 그리드 전체여도 띠만 씀. */
  function rowBandFromRowAndCells(row, cells) {
    var top = null;
    var bottom = null;
    function acc(el) {
      if (!el || !el.getBoundingClientRect) return;
      var r = el.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) return;
      if (r.height > 90) return;
      top = top == null ? r.top : Math.min(top, r.top);
      bottom = bottom == null ? r.bottom : Math.max(bottom, r.bottom);
    }
    var list = cells || [];
    for (var i = 0; i < list.length && i < 4; i++) acc(list[i]);
    acc(row);
    if (top == null || bottom == null || bottom - top < 8) {
      var rr = row && row.getBoundingClientRect ? row.getBoundingClientRect() : null;
      if (rr && rr.height > 0 && rr.height <= 48) {
        return { top: rr.top, bottom: rr.bottom, midY: (rr.top + rr.bottom) / 2 };
      }
      return null;
    }
    if (bottom - top > 70) {
      var mid = (top + bottom) / 2;
      return { top: mid - 16, bottom: mid + 16, midY: mid };
    }
    return { top: top, bottom: bottom, midY: (top + bottom) / 2 };
  }

  function climbCloseCellFromPoint(el) {
    if (!el || !(el instanceof Element)) return null;
    var cur = el;
    for (var i = 0; i < 8 && cur; i++, cur = cur.parentElement) {
      if (!(cur instanceof Element)) break;
      var tag = (cur.tagName || "").toUpperCase();
      if (tag === "BODY" || tag === "HTML" || tag === "TR" || tag === "TABLE") break;
      var r = cur.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      if (r.width > 280 || r.height > 90) continue;
      return cur;
    }
    return el instanceof Element ? el : null;
  }

  /**
   * #52: closeIdx 칸을 쓰지 않는다. 마감 헤더 X × 행 midY.
   * MAX_DX를 올리지 않음. 정렬 안 되면 null.
   */
  function resolveCloseCellByHeaderX(row, cells, headerCenterX, headerBottom) {
    if (headerCenterX == null || isNaN(Number(headerCenterX))) return null;
    var hx = Number(headerCenterX);
    var band = rowBandFromRowAndCells(row, cells);
    if (!band) return null;
    var hb = headerBottom != null ? headerBottom : band.top - 24;

    var hitEl = null;
    try {
      if (document.elementFromPoint) {
        hitEl = document.elementFromPoint(hx, band.midY);
      }
    } catch (ePt) {
      hitEl = null;
    }
    if (hitEl) {
      var climbed = climbCloseCellFromPoint(hitEl);
      var cx = cellCenterX(climbed);
      if (climbed && closeHeaderAlignedOk(cx, hx)) return climbed;
    }

    var root = document.body || document.documentElement;
    var near = findCellNear(root, hx, band.top, band.bottom, hb);
    if (near && closeHeaderAlignedOk(cellCenterX(near), hx)) return near;

    if (cells && cells.length) {
      var best = null;
      var bestDx = 1e15;
      for (var i = 0; i < cells.length; i++) {
        var el = cells[i];
        var ccx = cellCenterX(el);
        if (ccx == null) continue;
        if (!closeHeaderAlignedOk(ccx, hx)) continue;
        var dx = Math.abs(ccx - hx);
        if (dx < bestDx) {
          bestDx = dx;
          best = el;
        }
      }
      if (best) return best;
    }
    return null;
  }

  function findCellNear(root, centerX, rowTop, rowBottom, headerBottom) {
    var best = null;
    var bestScore = 1e15;
    var all = root.querySelectorAll("div, span, td, th, input, a, button, li");
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (!visible(el)) continue;
      var r = el.getBoundingClientRect();
      if (r.bottom <= headerBottom + 1) continue;
      if (r.top > rowBottom + 6 || r.bottom < rowTop - 6) continue;
      var cx = r.left + r.width / 2;
      var dx = Math.abs(cx - centerX);
      if (dx > Math.max(48, r.width * 0.9)) continue;
      if (r.width > 480 || r.height > 100) continue;
      var midY = (rowTop + rowBottom) / 2;
      var score = dx + Math.abs((r.top + r.bottom) / 2 - midY) * 0.4 + r.width * 0.01;
      if (score < bestScore) {
        bestScore = score;
        best = el;
      }
    }
    return best;
  }

  function leafLabelEls(root, text) {
    var exact = findElementsByExactText(root, text);
    if (exact.length) return exact;
    return findLabelHits(root, text);
  }


  function findDivAttendanceGrid(root) {
    var nums = leafLabelEls(root, "번호");
    var names = leafLabelEls(root, "성명");
    var closes = leafLabelEls(root, "마감");
    if (!nums.length || !names.length || !closes.length) return null;
    // 공통 조상 행 후보
    for (var i = 0; i < nums.length; i++) {
      for (var j = 0; j < names.length; j++) {
        for (var k = 0; k < closes.length; k++) {
          var a = nums[i], b = names[j], c = closes[k];
          var row = commonRow(a, b, c);
          if (!row) continue;
          var cells = Array.prototype.slice.call(row.children).filter(visible);
          if (cells.length < 3) {
            cells = Array.prototype.slice.call(row.querySelectorAll(":scope > *")).filter(visible);
          }
          if (cells.length < 3) continue;
          var parsed = parseHeaderCellsFromEls(cells);
          if (!parsed || parsed.periodCount === 0) continue;
          var bodyParent = row.parentElement;
          if (!bodyParent) continue;
          return {
            table: null,
            bodyTable: null,
            headerRow: row,
            bodyParent: bodyParent,
            dataStart: 0,
            col: parsed.col,
            periodCols: parsed.periodCols,
            periodCount: parsed.periodCount,
            kind: "div-row",
            headerIdx: -1,
          };
        }
      }
    }
    return null;
  }

  function commonRow(a, b, c) {
    var p = a.parentElement;
    for (var d = 0; d < 6 && p; d++, p = p.parentElement) {
      if (p.contains(b) && p.contains(c)) {
        // 너무 큰 body/html 제외
        if (p === document.body || p === document.documentElement) continue;
        return p;
      }
    }
    return null;
  }

  function parseHeaderCellsFromEls(cells) {
    var texts = cells.map(cellLabel);
    var idxNum = labelIndex(texts, ["번호"]);
    var idxName = labelIndex(texts, ["성명"]);
    var idxClose = labelIndex(texts, ["마감"]);
    if (idxNum < 0 || idxName < 0 || idxClose < 0) return null;
    var col = { number: idxNum, name: idxName, close: idxClose };
    var periodCols = {};
    var periodCount = 0;
    for (var p = 0; p < texts.length; p++) {
      var tx = texts[p];
      if (col.morning == null && (tx === "조회" || tx.indexOf("조회") === 0)) col.morning = p;
      if (col.afternoon == null && (tx === "종례" || tx.indexOf("종례") === 0)) col.afternoon = p;
      if (col.reason == null && (tx === "사유" || tx.indexOf("사유") === 0)) col.reason = p;
      var pm = tx.match(/^(\d+)\s*교시/);
      if (pm) {
        periodCols[Number(pm[1])] = p;
        periodCount = Math.max(periodCount, Number(pm[1]));
      }
    }
    return { col: col, periodCols: periodCols, periodCount: periodCount, colCount: cells.length };
  }

  function rowCells(row) {
    if (!row) return [];
    if (row.cells && row.cells.length) return Array.prototype.slice.call(row.cells);
    return Array.prototype.slice.call(row.children || []).filter(visible);
  }

  function RM() {
    return globalThis.ChulgyeolRowMatch || null;
  }

  function PA() {
    return globalThis.ChulgyeolPopupApply || null;
  }

  /**
   * 보이는 짧은 리프 텍스트(좌표 포함). 헤더 아래만.
   * table.rows 가정 없음.
   */
  function collectSpatialLeafRecords(root, headerBottom) {
    var out = [];
    if (!root || !root.querySelectorAll) return out;
    var all = root.querySelectorAll("div, span, td, th, a, label, p, li, em, b, strong");
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (!visible(el)) continue;
      if (el.tagName === "SCRIPT" || el.tagName === "STYLE") continue;
      var r = el.getBoundingClientRect();
      if (headerBottom != null && r.bottom <= headerBottom + 2) continue;
      if (r.width > 520 || r.height > 80) continue;
      var own = "";
      for (var t = 0; t < el.childNodes.length; t++) {
        var n = el.childNodes[t];
        if (n.nodeType === Node.TEXT_NODE) own += n.textContent || "";
      }
      own = normText(own);
      var full = normText(el.textContent);
      var text = own;
      if (!text && el.children.length === 0) text = full;
      if (!text) continue;
      if (text.length > 40) continue;
      // 더 깊은 자식이 같은 텍스트면 부모 스킵
      var childSame = false;
      for (var c = 0; c < el.children.length; c++) {
        if (normText(el.children[c].textContent) === text) {
          childSame = true;
          break;
        }
      }
      if (childSame) continue;
      out.push({
        el: el,
        text: text,
        x: r.left + r.width / 2,
        y: (r.top + r.bottom) / 2,
        top: r.top,
        bottom: r.bottom,
        left: r.left,
        right: r.right,
      });
    }
    return out;
  }

  function leafDataOnly(records) {
    return (records || []).map(function (L) {
      return {
        text: L.text,
        x: L.x,
        y: L.y,
        top: L.top,
        bottom: L.bottom,
        left: L.left,
        right: L.right,
      };
    });
  }

  /** 익명 diag — 번호·성명 값 문자열 금지 */
  function rowMatchDiag(root, grid, wantNum, wantName) {
    var api = RM();
    var hb = grid && grid.headerBottom != null ? grid.headerBottom : null;
    var records = collectSpatialLeafRecords(root || document, hb);
    var data = leafDataOnly(records);
    var pairs = api ? api.scanNumberNamePairs(data, api.BAND_TOL_DEFAULT) : [];
    var pairsWide = api ? api.scanNumberNamePairs(data, api.BAND_TOL_WIDE) : [];
    var gdiag = gridDiag(root || document);
    return {
      tables: gdiag.tables,
      kind: (grid && grid.kind) || "none",
      hasCenters: grid && grid.headerCenters && grid.headerCenters.length ? 1 : 0,
      leafCount: records.length,
      hitNum: api ? api.countExactText(data, wantNum) : 0,
      hitName: api ? api.countExactText(data, wantName) : 0,
      rowCand: Math.max(pairs.length, pairsWide.length),
      headerHitNum: gdiag.hitNum,
      headerHitName: gdiag.hitName,
      headerHitClose: gdiag.hitClose,
      headerHitPeriod: gdiag.hitPeriod,
    };
  }

  /**
   * tables=0 / spatial: 번호+성명 밴드 매칭.
   * nth-row = n 금지. 빈 번호는 숫자 리프가 없어 자연 스킵.
   */
  function findRowSpatialByNumberName(grid, wantNum, wantName) {
    var api = RM();
    if (!api) return null;
    var root = (grid && grid.root) || document;
    var records = collectSpatialLeafRecords(root, grid.headerBottom);
    var data = leafDataOnly(records);
    var pair =
      api.findNumberNamePairOnBand(data, wantNum, wantName, api.BAND_TOL_DEFAULT) ||
      api.findNumberNamePairOnBand(data, wantNum, wantName, api.BAND_TOL_WIDE);
    if (!pair) {
      var scanned =
        api.matchWantInPairs(api.scanNumberNamePairs(data, api.BAND_TOL_DEFAULT), wantNum, wantName) ||
        api.matchWantInPairs(api.scanNumberNamePairs(data, api.BAND_TOL_WIDE), wantNum, wantName);
      if (scanned) {
        pair = { numIdx: scanned.numIdx, nameIdx: scanned.nameIdx, bandY: scanned.bandY };
      }
    }
    if (!pair) return null;

    var numRec = records[pair.numIdx];
    var nameRec = records[pair.nameIdx];
    if (!numRec || !nameRec) return null;
    var rowTop = Math.min(numRec.top, nameRec.top);
    var rowBottom = Math.max(numRec.bottom, nameRec.bottom);
    var bandTol = api.BAND_TOL_DEFAULT;
    var cells = [];

    if (grid.headerCenters && grid.headerCenters.length) {
      for (var h = 0; h < grid.headerCenters.length; h++) {
        cells.push(
          findCellNear(root, grid.headerCenters[h], rowTop, rowBottom, grid.headerBottom || 0),
        );
      }
      // 헤더 스냅 실패 시 밴드 리프로 보강
      var snapped = api.buildCellsOnBand(data, pair.bandY, bandTol, grid.headerCenters);
      for (var s2 = 0; s2 < snapped.length; s2++) {
        if (cells[s2]) continue;
        if (!snapped[s2]) continue;
        for (var ri = 0; ri < records.length; ri++) {
          if (
            records[ri].text === snapped[s2].text &&
            Math.abs(records[ri].x - snapped[s2].x) < 1 &&
            Math.abs(records[ri].y - snapped[s2].y) < 1
          ) {
            cells[s2] = records[ri].el;
            break;
          }
        }
      }
      if (grid.col && grid.col.number != null && !cells[grid.col.number]) cells[grid.col.number] = numRec.el;
      if (grid.col && grid.col.name != null && !cells[grid.col.name]) cells[grid.col.name] = nameRec.el;
      if (grid.col && grid.col.number != null && grid.col.name != null) {
        var nt = cellLabel(cells[grid.col.number]);
        var mt = cellLabel(cells[grid.col.name]);
        if (nt !== wantNum || mt !== wantName) {
          // 열 스냅이 어긋나도 밴드 쌍이 맞으면 번호·성명 칸만 교정
          cells[grid.col.number] = numRec.el;
          cells[grid.col.name] = nameRec.el;
        }
      }
    } else {
      var bandCells = api.buildCellsOnBand(data, pair.bandY, bandTol, null);
      for (var b = 0; b < bandCells.length; b++) {
        var bc = bandCells[b];
        var el = null;
        for (var rj = 0; rj < records.length; rj++) {
          if (
            records[rj].text === bc.text &&
            Math.abs(records[rj].x - bc.x) < 1 &&
            Math.abs(records[rj].y - bc.y) < 1
          ) {
            el = records[rj].el;
            break;
          }
        }
        cells.push(el || numRec.el);
      }
    }

    return {
      row: numRec.el,
      rowIndex: -1,
      cells: cells,
      bandY: pair.bandY,
    };
  }

  function findRowByNumberName(grid, number, name) {
    var wantNum = String(number).trim();
    var wantName = String(name).trim();
    // spatial·tables=0: HTML table.rows 가정 금지
    if (grid.kind === "spatial" || (!grid.bodyTable && !grid.table && grid.kind !== "div-row")) {
      return findRowSpatialByNumberName(grid, wantNum, wantName);
    }
    if (grid.kind === "div-row" && grid.bodyParent) {
      var kids = Array.prototype.slice.call(grid.bodyParent.children).filter(visible);
      for (var i = 0; i < kids.length; i++) {
        if (kids[i] === grid.headerRow) continue;
        var cells = rowCells(kids[i]);
        if (cells.length <= Math.max(grid.col.number, grid.col.name)) continue;
        var numText = cellLabel(cells[grid.col.number]);
        var nameText = cellLabel(cells[grid.col.name]);
        if (numText === "번호" || nameText === "성명") continue;
        if (!numText) continue; // 빈 번호 스킵
        if (numText === wantNum && nameText === wantName) {
          return { row: kids[i], rowIndex: i, cells: cells };
        }
      }
      // div 실패 시 좌표 폴백
      var spatialDiv = findRowSpatialByNumberName(
        {
          kind: "spatial",
          root: grid.root || document,
          headerBottom: grid.headerBottom || 0,
          headerCenters: grid.headerCenters,
          col: grid.col,
          periodCols: grid.periodCols,
          periodCount: grid.periodCount,
        },
        wantNum,
        wantName,
      );
      if (spatialDiv) return spatialDiv;
      return null;
    }
    var body = grid.bodyTable || grid.table;
    if (!body || !body.rows) {
      return findRowSpatialByNumberName(
        {
          kind: "spatial",
          root: grid.root || document,
          headerBottom: grid.headerBottom != null ? grid.headerBottom : 0,
          headerCenters: grid.headerCenters,
          col: grid.col,
          periodCols: grid.periodCols,
          periodCount: grid.periodCount,
        },
        wantNum,
        wantName,
      );
    }
    var start = grid.dataStart != null ? grid.dataStart : grid.headerIdx + 1;
    for (var r = start; r < body.rows.length; r++) {
      var row = body.rows[r];
      var cells2 = rowCells(row);
      if (cells2.length <= Math.max(grid.col.number, grid.col.name)) continue;
      var numText2 = cellLabel(cells2[grid.col.number]);
      var nameText2 = cellLabel(cells2[grid.col.name]);
      if (numText2 === "번호" || nameText2 === "성명") continue;
      if (!numText2) continue; // 빈 번호(7→9 공백) 스킵 — 순번≠번호
      if (numText2 === wantNum && nameText2 === wantName) {
        return { row: row, rowIndex: r, cells: cells2 };
      }
    }
    return null;
  }

  function FB() {
    return globalThis.ChulgyeolFilterBar || null;
  }

  function controlValue(el) {
    if (!el) return "";
    if (el.tagName === "SELECT") {
      var opt = el.options && el.options[el.selectedIndex];
      return normText((opt && opt.text) || el.value || "");
    }
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      return normText(el.value || el.getAttribute("value") || "");
    }
    return "";
  }

  function labelTextMatches(full, label) {
    if (full === label) return true;
    if (full.indexOf(label) !== 0) return false;
    var rest = full.slice(label.length);
    return rest.length <= 3 && /^[\s*:：]*$/.test(rest);
  }

  function exactLabelEls(labelText) {
    function notSide(el) {
      return !isSidenavContext(el);
    }
    var hits = findLabelHits(document, labelText).filter(function (el) {
      return labelTextMatches(normText(el.textContent), labelText) && notSide(el);
    });
    if (hits.length) return hits;
    var exact = findElementsByExactText(document, labelText).filter(notSide);
    if (exact.length) return exact;
    var soft = [];
    var all = document.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (!visible(el)) continue;
      if (!notSide(el)) continue;
      var full = normText(el.textContent);
      if (!labelTextMatches(full, labelText)) continue;
      if (full.length > labelText.length + 3) continue;
      soft.push(el);
    }
    return soft;
  }

  function collectNearValues(lab, labelText) {
    var r = lab.getBoundingClientRect();
    var cx = (r.left + r.right) / 2;
    var cy = (r.top + r.bottom) / 2;
    var found = [];
    var nodes = document.querySelectorAll("input, select, textarea, div, span");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el === lab || lab.contains(el)) continue;
      var isHiddenInp =
        el.tagName === "INPUT" && (el.type === "hidden" || !visible(el));
      if (!isHiddenInp && !visible(el)) continue;
      var er = el.getBoundingClientRect();
      var dist;
      if (isHiddenInp) {
        var pr = (el.parentElement && el.parentElement.getBoundingClientRect()) || er;
        var dxh = (pr.left + pr.right) / 2 - cx;
        var dyh = (pr.top + pr.bottom) / 2 - cy;
        dist = Math.sqrt(dxh * dxh + dyh * dyh);
        if (dist > 320) continue;
      } else {
        if (er.width > 420 || er.height > 90) continue;
        var dx = (er.left + er.right) / 2 - cx;
        var dy = (er.top + er.bottom) / 2 - cy;
        dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 280) continue;
      }
      var val = controlValue(el);
      if (!val && !isHiddenInp) {
        var tx = normText(el.textContent);
        if (!tx || tx.length > 32) continue;
        if (labelTextMatches(tx, labelText) || tx === labelText) continue;
        var childShorter = false;
        for (var c = 0; c < el.children.length; c++) {
          var ct = normText(el.children[c].textContent);
          if (ct && ct.length < tx.length && ct.length <= 32) {
            childShorter = true;
            break;
          }
        }
        if (childShorter) continue;
        val = tx;
      }
      if (!val) continue;
      var left = isHiddenInp ? cx : er.left;
      found.push({ val: val, dist: dist, left: left, top: isHiddenInp ? cy : er.top });
    }
    found.sort(function (a, b) {
      if (a.dist !== b.dist) return a.dist - b.dist;
      return a.left - b.left;
    });
    return found;
  }

  function pickByKind(values, kind) {
    var fb = FB();
    for (var i = 0; i < values.length; i++) {
      var v = values[i].val;
      if (kind === "year") {
        var y = fb ? fb.parseYear(v) : (String(v).match(/(?:19|20)\d{2}/) || [])[0];
        if (y != null && y !== "") return String(typeof y === "number" ? y : y);
      } else if (kind === "grade" || kind === "class") {
        var n = fb ? fb.parseIntLoose(v) : (String(v).match(/\d{1,2}/) || [])[0];
        if (n != null && n !== "") return String(n);
      } else if (kind === "date") {
        var d = normalizeDate(v);
        if (d) return d;
      }
    }
    if (kind === "date" && values.length >= 3) {
      // Y M D 분리 콤보
      var nums = [];
      for (var j = 0; j < values.length && nums.length < 3; j++) {
        var m = String(values[j].val).match(/\d{1,4}/);
        if (m) nums.push(m[0]);
      }
      if (nums.length >= 3) {
        var joined = nums[0] + "-" + nums[1] + "-" + nums[2];
        var nd = normalizeDate(joined);
        if (nd) return nd;
      }
    }
    return values.length ? values[0].val : "";
  }

  /** 4칸 공통: 라벨 → 근접/형제/숨은input 값 */
  function readFilterFieldDom(labelText, kind) {
    var labels = exactLabelEls(labelText);
    for (var i = 0; i < labels.length; i++) {
      var lab = labels[i];
      var climb = lab;
      for (var d = 0; d < 6 && climb; d++, climb = climb.parentElement) {
        if (!climb.querySelector) continue;
        var sel = climb.querySelector("select");
        if (sel && visible(sel)) {
          var sv = controlValue(sel);
          if (sv && pickByKind([{ val: sv, dist: 0 }], kind)) return pickByKind([{ val: sv, dist: 0 }], kind);
        }
        var inputs = climb.querySelectorAll("input");
        for (var u = 0; u < inputs.length; u++) {
          var inp = inputs[u];
          var iv = controlValue(inp);
          if (!iv) continue;
          var lr = lab.getBoundingClientRect();
          var ir = inp.getBoundingClientRect();
          if (inp.type !== "hidden" && visible(inp) && ir.left + ir.width / 2 < lr.left) continue;
          var picked = pickByKind([{ val: iv, dist: 0 }], kind);
          if (picked) return picked;
        }
      }
      var near = collectNearValues(lab, labelText);
      var got = pickByKind(near, kind);
      if (got) return got;
    }
    return "";
  }

  function pageInnerText() {
    return normText(
      (document.body && document.body.innerText) ||
        (document.documentElement && document.documentElement.innerText) ||
        "",
    );
  }

  /** 조회조건 라벨 좌표 (학년도/학년/반/일자) — 같은 밴드 순서 파서용 */
  function collectFilterBarLabels() {
    var specs = [
      { key: "year", text: "학년도" },
      { key: "grade", text: "학년" },
      { key: "class", text: "반" },
      { key: "date", text: "일자" },
    ];
    var found = [];
    for (var s = 0; s < specs.length; s++) {
      var els = exactLabelEls(specs[s].text);
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (!visible(el)) continue;
        var r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) continue;
        found.push({
          key: specs[s].key,
          text: specs[s].text,
          x: r.left,
          y: r.top,
          right: r.right,
          bottom: r.bottom,
        });
      }
    }
    return found;
  }

  /** 필터 밴드 근처 짧은 표시 토큰 (select/input 없이도 Nexacro 표시값) */
  function collectFilterBarTokens(bandY, bandTol) {
    var labelWords = { 학년도: 1, 학년: 1, 반: 1, 일자: 1, 조회: 1 };
    var nodes = document.querySelectorAll("div, span, td, th, label, a, p, li");
    var out = [];
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (!visible(el)) continue;
      var r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      if (r.width > 400 || r.height > 80) continue;
      if (bandY != null && Math.abs(r.top - bandY) > bandTol) continue;
      var tx = normText(el.textContent);
      if (!tx || tx.length > 32) continue;
      if (labelWords[tx]) continue;
      // 컨테이너 스킵: 자식에 더 짧은 동일 밴드 텍스트가 있으면 리프만
      var childShorter = false;
      for (var c = 0; c < el.children.length; c++) {
        var ct = normText(el.children[c].textContent);
        if (ct && ct.length < tx.length && ct.length <= 32) {
          childShorter = true;
          break;
        }
      }
      if (childShorter) continue;
      out.push({ text: tx, x: r.left, y: r.top });
    }
    return out;
  }

  /** input value 날짜 패턴 스캔 (visible 포함, 값만·이름 없음) */
  function scanDateFromInputs() {
    var inputs = document.querySelectorAll("input");
    var date = "";
    var hit = 0;
    for (var i = 0; i < inputs.length; i++) {
      var inp = inputs[i];
      if (isSidenavContext(inp)) continue;
      var v = controlValue(inp);
      if (!v) continue;
      var d = normalizeDate(v);
      if (!d) continue;
      hit++;
      if (!date) date = d;
    }
    return { date: date, hasDateInput: hit > 0, count: hit };
  }

  /** 짧은 DIV/페이지 텍스트에서 "2학년 3반 2026.09.04." 밴드 압축 파싱 */
  function scanBandCompactFromDom() {
    var fb = FB();
    var empty = { year: null, grade: null, class: null, date: "", raw: {} };
    if (!fb || !fb.parseBandCompact) return { parsed: empty, bandHit: false, count: 0 };
    var count = 0;
    var best = null;
    var nodes = document.querySelectorAll("div, span, td, th, label, a, p, li");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (isSidenavContext(el)) continue;
      var tx = normText(el.textContent);
      if (!tx || tx.length > 80) continue;
      if (!/\d+학년/.test(tx) || tx.indexOf("반") < 0) continue;
      var p = fb.parseBandCompact(tx);
      if (p && p.grade != null && p.class != null) {
        count++;
        if (!best) best = p;
      }
    }
    if (!best) {
      var p2 = fb.parseBandCompact(pageInnerText());
      if (p2 && p2.grade != null && p2.class != null) {
        best = p2;
        count++;
      }
    }
    return { parsed: best || empty, bandHit: count > 0, count: count };
  }

  function readFilters() {
    var fb = FB();
    var labels = collectFilterBarLabels();
    var hasYearLab = false;
    var hasGradeLab = false;
    var hasDateLab = false;
    var bandY = null;
    for (var i = 0; i < labels.length; i++) {
      if (labels[i].key === "year") {
        hasYearLab = true;
        if (bandY == null) bandY = labels[i].y;
      } else if (labels[i].key === "grade") {
        hasGradeLab = true;
      } else if (labels[i].key === "date") {
        hasDateLab = true;
      }
    }
    if (bandY == null && labels.length) bandY = labels[0].y;
    // 학년도/학년/일자 라벨 전부 없으면 라벨 경로 비활성 (반만 sidenav 오탐일 수 있음)
    var labelPathEmpty = !(hasYearLab || hasGradeLab || hasDateLab);

    var tokens = collectFilterBarTokens(bandY, 40);
    var orderParsed =
      !labelPathEmpty && fb && fb.parseFilterBarByOrder
        ? fb.parseFilterBarByOrder(labels, tokens)
        : null;

    var domRaw = labelPathEmpty
      ? { year: "", grade: "", class: "", date: "" }
      : {
          year: readFilterFieldDom("학년도", "year"),
          grade: readFilterFieldDom("학년", "grade"),
          class: readFilterFieldDom("반", "class"),
          date: readFilterFieldDom("일자", "date"),
        };

    var dateScan = scanDateFromInputs();
    var bandScan = scanBandCompactFromDom();

    var textParsed = fb
      ? fb.parseFilterBarText(pageInnerText())
      : { year: null, grade: null, class: null, date: "", raw: {} };

    var extras = {
      band: bandScan.parsed,
      dateInput: dateScan.date,
      hasDateInput: dateScan.hasDateInput,
      bandHit: bandScan.bandHit,
      bandHitCount: bandScan.count,
      labelPathEmpty: labelPathEmpty,
    };

    if (fb && fb.mergeFilterValues) {
      return fb.mergeFilterValues(domRaw, textParsed, orderParsed, extras);
    }
    // 최소 폴백: band/input 우선
    var year = bandScan.parsed.year;
    var grade = bandScan.parsed.grade;
    var klass = bandScan.parsed.class;
    var date = dateScan.date || bandScan.parsed.date || "";
    if (!year && date) year = Number(String(date).slice(0, 4)) || null;
    return {
      year: year,
      grade: grade,
      class: klass,
      date: normalizeDate(date),
      _raw: {
        year: String(year || "").slice(0, 24),
        grade: String(grade || "").slice(0, 12),
        class: String(klass || "").slice(0, 12),
        date: String(date || "").slice(0, 24),
        hasDateInput: dateScan.hasDateInput,
        bandHit: bandScan.bandHit,
        bandHitCount: bandScan.count,
        filterSrc: "band-input-fallback",
      },
    };
  }

  function filtersMatchItem(filters, item) {
    var diagBase = {
      year: filters.year,
      grade: filters.grade,
      class: filters.class,
      date: filters.date,
      rawYear: filters._raw && filters._raw.year,
      rawGrade: filters._raw && filters._raw.grade,
      rawClass: filters._raw && filters._raw.class,
      rawDate: filters._raw && filters._raw.date,
      softYear: filters._raw && filters._raw.softYear,
      softGrade: filters._raw && filters._raw.softGrade,
      softClass: filters._raw && filters._raw.softClass,
      softDate: filters._raw && filters._raw.softDate,
      orderYear: filters._raw && filters._raw.orderYear,
      orderGrade: filters._raw && filters._raw.orderGrade,
      orderClass: filters._raw && filters._raw.orderClass,
      orderDate: filters._raw && filters._raw.orderDate,
      filterSrc: filters._raw && filters._raw.filterSrc,
      srcYear: filters._raw && filters._raw.srcYear,
      srcGrade: filters._raw && filters._raw.srcGrade,
      srcClass: filters._raw && filters._raw.srcClass,
      srcDate: filters._raw && filters._raw.srcDate,
      hasDateInput: filters._raw && filters._raw.hasDateInput,
      bandHit: filters._raw && filters._raw.bandHit,
      bandHitCount: filters._raw && filters._raw.bandHitCount,
      itemYear: item.year,
      itemGrade: item.grade,
      itemClass: item.class,
      itemDate: item.date,
    };
    if (filters.year == null || !Number.isFinite(filters.year)) {
      return { ok: false, code: "year_unreadable", diag: diagBase };
    }
    if (Number(filters.year) !== Number(item.year)) {
      return { ok: false, code: "year_mismatch", diag: diagBase };
    }
    if (filters.grade == null || !Number.isFinite(filters.grade)) {
      return { ok: false, code: "grade_unreadable", diag: diagBase };
    }
    if (Number(filters.grade) !== Number(item.grade)) {
      return { ok: false, code: "grade_mismatch", diag: diagBase };
    }
    if (filters.class == null || !Number.isFinite(filters.class)) {
      return { ok: false, code: "class_unreadable", diag: diagBase };
    }
    if (Number(filters.class) !== Number(item.class)) {
      return { ok: false, code: "class_mismatch", diag: diagBase };
    }
    if (!filters.date) {
      return { ok: false, code: "date_unreadable", diag: diagBase };
    }
    if (filters.date !== normalizeDate(item.date)) {
      return { ok: false, code: "date_mismatch", diag: diagBase };
    }
    return { ok: true };
  }

  function findDateControls() {
    var root = document.body || document.documentElement;
    var labels = [];
    try {
      labels = findElementsByExactText(root, "일자").concat(findLabelHits(root, "일자") || []);
    } catch (eL) {
      labels = [];
    }
    var out = [];
    function push(el) {
      if (!el || out.indexOf(el) >= 0) return;
      if (!visible(el) && (el.tagName || "") !== "INPUT") return;
      out.push(el);
    }
    for (var i = 0; i < labels.length; i++) {
      var lab = labels[i];
      var box = lab.closest("div, td, li, [class*='contentsbox']") || lab.parentElement;
      if (box) {
        var ins = box.querySelectorAll("input, [class*='Edit'], [class*='calendar'], [class*='Date']");
        for (var k = 0; k < ins.length; k++) push(ins[k]);
      }
      var lr = lab.getBoundingClientRect();
      var all = root.querySelectorAll("input, [class*='calendar']");
      for (var j = 0; j < all.length && j < 80; j++) {
        var r = all[j].getBoundingClientRect();
        if (r.left + 4 < lr.right - 40) continue;
        if (Math.abs((r.top + r.bottom) / 2 - (lr.top + lr.bottom) / 2) > 22) continue;
        push(all[j]);
      }
    }
    return out;
  }

  function findLookupButton() {
    var root = document.body || document.documentElement;
    var dateY = null;
    var labels = [];
    try {
      labels = findElementsByExactText(root, "일자").concat(findLabelHits(root, "일자") || []);
    } catch (eL) {
      labels = [];
    }
    for (var i = 0; i < labels.length; i++) {
      if (!visible(labels[i])) continue;
      var lr = labels[i].getBoundingClientRect();
      if (lr.width > 0) {
        dateY = (lr.top + lr.bottom) / 2;
        break;
      }
    }
    var hits = [];
    try {
      hits = findElementsByExactText(root, "조회").concat(findLabelHits(root, "조회") || []);
    } catch (eB) {
      hits = [];
    }
    var best = null;
    var bestScore = 1e15;
    for (var j = 0; j < hits.length; j++) {
      var el = hits[j];
      if (!visible(el)) continue;
      var t = normText(el.textContent || "");
      if (t !== "조회") continue;
      var r = el.getBoundingClientRect();
      if (r.height > 48 || r.width > 120) continue;
      var cy = (r.top + r.bottom) / 2;
      if (dateY != null && Math.abs(cy - dateY) > 36) continue;
      var score = r.top + (dateY != null ? Math.abs(cy - dateY) * 8 : 0);
      if (score < bestScore) {
        bestScore = score;
        best = el;
      }
    }
    return best ? climbToolbarBtn(best) || best : null;
  }

  function dateToYmd(want) {
    var s = String(want || "").replace(/\D/g, "");
    if (s.length >= 8) return s.slice(0, 8);
    return "";
  }

  function typeEightDigits(el, ymd) {
    if (!el || !ymd || ymd.length !== 8) return false;
    clickOnce(el);
    try {
      el.focus();
    } catch (eF) {}
    try {
      if (typeof el.select === "function") el.select();
    } catch (eS) {}
    try {
      el.dispatchEvent(
        new KeyboardEvent("keydown", { key: "a", code: "KeyA", ctrlKey: true, bubbles: true }),
      );
    } catch (eA) {}
    setNexaText(el, "");
    for (var i = 0; i < 8; i++) {
      var ch = ymd.charAt(i);
      try {
        el.dispatchEvent(new KeyboardEvent("keydown", { key: ch, bubbles: true }));
      } catch (eK) {}
      var cur = "";
      try {
        cur = String(el.value || "");
      } catch (eC) {
        cur = "";
      }
      setNexaText(el, cur.replace(/\D/g, "").slice(0, i) + ch);
      try {
        el.dispatchEvent(new KeyboardEvent("keyup", { key: ch, bubbles: true }));
      } catch (eU) {}
    }
    setNexaText(el, ymd);
    return true;
  }

  /** 일자칸 클릭 → YYYYMMDD 8자리 → 조회 → 3~5초 대기. 날짜 묶음마다 항상. */
  async function alignNeisDate(item, forceLookup) {
    var want = normalizeDate(item && item.date);
    if (!want) return { ok: false, code: "date_unreadable" };
    var ymd = dateToYmd(want);
    if (!ymd) return { ok: false, code: "date_unreadable" };

    var filters = readFilters();
    var pre = filtersMatchItem(filters, item);
    if (pre.ok && !forceLookup) return pre;
    if (pre.code && pre.code !== "date_mismatch" && pre.code !== "date_unreadable" && pre.code.indexOf("mismatch") >= 0 && pre.code !== "date_mismatch") {
      return pre;
    }

    var controls = findDateControls();
    if (!controls.length) return pre.ok ? pre : { ok: false, code: pre.code || "date_unreadable" };
    typeEightDigits(controls[0], ymd);
    await sleep(400);
    var btn = findLookupButton();
    if (!btn) return { ok: false, code: "lookup_not_found" };
    clickOnce(btn);
    await sleep(4000);
    filters = readFilters();
    var fm = filtersMatchItem(filters, item);
    if (fm.ok) return fm;
    if (fm.code === "date_mismatch" || fm.code === "date_unreadable") {
      return { ok: true, soft: true, code: "date_lookup_soft" };
    }
    return fm;
  }

  function cellText(cell) {
    return ((cell && cell.textContent) || "").replace(/\s+/g, " ").trim();
  }

  function expectedSlashMap(type, period, periodCount) {
    var m = { morning: false, afternoon: false };
    for (var p = 1; p <= periodCount; p++) m["period:" + p] = false;
    if (type === "late") {
      m.morning = true;
      for (var a = 1; a <= period; a++) m["period:" + a] = true;
    } else if (type === "early_leave") {
      for (var b = period; b <= periodCount; b++) m["period:" + b] = true;
      m.afternoon = true;
    } else if (type === "absence") {
      m.morning = true;
      for (var c = 1; c <= periodCount; c++) m["period:" + c] = true;
      m.afternoon = true;
    } else if (type === "result") {
      m["period:" + period] = true;
    }
    return m;
  }

  function ownText(el) {
    if (!el || !el.childNodes) return "";
    var own = "";
    for (var t = 0; t < el.childNodes.length; t++) {
      if (el.childNodes[t].nodeType === Node.TEXT_NODE) own += el.childNodes[t].textContent || "";
    }
    return normText(own);
  }

  /**
   * 팝업 안 짧은 리프 텍스트. own-text 우선(Nexacro sparse contentsbox).
   * 긴 행은 토큰 매칭용으로 48자까지.
   */
  function controlClassName(el) {
    try {
      if (!el) return "";
      if (el.className && el.className.baseVal != null) return String(el.className.baseVal);
      return String(el.className || "");
    } catch (e) {
      return "";
    }
  }

  /** 회색·disabled — 종류는 구분 전 비활성 */
  function isControlDisabled(el) {
    if (!el || !(el instanceof Element)) return true;
    var api = PA();
    var cur = el;
    for (var d = 0; d < 6 && cur && cur.nodeType === 1; d++, cur = cur.parentElement) {
      var aria = "";
      try {
        aria = String((cur.getAttribute && cur.getAttribute("aria-disabled")) || "");
      } catch (e1) {
        aria = "";
      }
      var disAttr = false;
      try {
        disAttr = cur.disabled === true || (cur.getAttribute && cur.hasAttribute("disabled"));
      } catch (e2) {
        disAttr = false;
      }
      var st = null;
      try {
        st = getComputedStyle(cur);
      } catch (e3) {
        st = null;
      }
      var flags = {
        disabled: disAttr,
        ariaDisabled: aria === "true",
        className: controlClassName(cur),
        pointerEvents: st ? st.pointerEvents : "",
        opacity: st ? st.opacity : "",
      };
      if (api && api.isEnabledState) {
        if (!api.isEnabledState(flags)) return true;
      } else if (
        flags.disabled ||
        flags.ariaDisabled ||
        /\bdisabled\b|\bis-disabled\b/i.test(flags.className) ||
        flags.pointerEvents === "none"
      ) {
        return true;
      } else if (flags.opacity !== "" && parseFloat(flags.opacity) < 0.45) {
        return true;
      }
    }
    return false;
  }

  function collectVisibleShortTexts(root) {
    var out = [];
    if (!root || !root.querySelectorAll) return out;
    var all = root.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.tagName === "SCRIPT" || el.tagName === "STYLE") continue;
      if (!visible(el)) continue;
      var own = ownText(el);
      var full = normText(el.textContent);
      var text = own;
      if (!text && el.children.length === 0) text = full;
      if (!text) continue;
      if (text.length > 48) continue;
      var childSame = false;
      for (var c = 0; c < el.children.length; c++) {
        var ct = normText(el.children[c].textContent);
        if (ct === text || (own && ownText(el.children[c]) === own)) {
          childSame = true;
          break;
        }
      }
      if (childSame) continue;
      out.push(text);
    }
    return out;
  }

  function popupDiag(root) {
    var api = PA();
    var scope = root || document;
    var texts = collectVisibleShortTexts(scope);
    var d = api
      ? api.popupDiagFromTexts(texts)
      : { titleHit: 0, illnessHit: 0, lateHit: 0, applyHit: 0, popupLike: 0, textCount: texts.length };
    d.dialogLike = countDialogLikeContainers(scope);
    // short-text miss 시 전체 blob으로 titleRequiredOk 보강 (Nexacro 장문 셀)
    if (api && api.fallbackPopupNeedsTitle && scope && scope.textContent) {
      var full = normText(scope.textContent);
      if (api.fallbackPopupNeedsTitle(full)) d.titleRequiredOk = 1;
      if (api.blobHasPopupTitle && api.blobHasPopupTitle(full) && d.titleHit === 0) d.titleHit = 1;
      if (full.indexOf("질병") >= 0 && (!d.illnessHit || d.illnessHit === 0)) d.illnessHit = Math.max(1, d.illnessHit || 0);
    }
    return d;
  }

  function countDialogLikeContainers(root) {
    var n = 0;
    if (!root || !root.querySelectorAll) return 0;
    var sels = root.querySelectorAll(
      "[role='dialog'], .ui-dialog, .modal, .popup, .layer, [class*='popup'], [class*='Popup'], [id*='popup'], [id*='Popup']",
    );
    for (var i = 0; i < sels.length; i++) {
      if (visible(sels[i])) n++;
    }
    return n;
  }

  /**
   * 제목 앵커에서 조상 상승 → 제목+(적용|닫기)+구분 라벨을 포함한
   * 가장 작은 visible 루트. body/html·거대 textCount 거부. titleRequiredOk 필수.
   */
  function climbPopupRoot(el) {
    if (!el) return null;
    var api = PA();
    var start = el;
    if (start && start.nodeType === 3) start = start.parentElement;
    if (!start || !(start instanceof Element)) return null;
    var cands = [];
    var nodes = [];
    var cur = start;
    for (var k = 0; k < 28 && cur; k++, cur = cur.parentElement) {
      if (!(cur instanceof Element)) break;
      var tag = cur.tagName;
      if (tag === "BODY" || tag === "HTML") break;
      if (!visible(cur)) continue;
      var r = cur.getBoundingClientRect();
      var blob = normText(cur.textContent);
      var shorts = collectVisibleShortTexts(cur);
      cands.push({
        id: nodes.length,
        text: blob,
        textCount: shorts.length,
        width: r.width,
        height: r.height,
        tagName: tag,
      });
      nodes.push(cur);
    }
    if (api && api.pickSmallestPopupRoot) {
      var pick = api.pickSmallestPopupRoot(cands);
      if (pick && pick.id != null && nodes[pick.id]) return nodes[pick.id];
      return null;
    }
    // API 없을 때: 동일 규칙으로 최소 본문 길이 선택
    var best = null;
    var bestLen = Infinity;
    for (var i = 0; i < cands.length; i++) {
      var c = cands[i];
      var t = normText(c.text);
      if (c.width > 900 || c.height > 700) continue;
      if (t.length > 900 || c.textCount > 72) continue;
      if (t.indexOf("출결마감구분") < 0) continue;
      if (t.indexOf("질병") < 0) continue;
      if (t.indexOf("적용") < 0 && t.indexOf("닫기") < 0) continue;
      if (!(t.indexOf("질병") >= 0 || t.indexOf("미인정") >= 0 || t.indexOf("기타") >= 0 || t.indexOf("출석인정") >= 0))
        continue;
      if (t.length < bestLen) {
        bestLen = t.length;
        best = nodes[c.id];
      }
    }
    return best;
  }

  function findPopup() {
    var api = PA();
    var titleEls = [];
    var all = document.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.tagName === "SCRIPT" || el.tagName === "STYLE") continue;
      if (!visible(el)) continue;
      var full = normText(el.textContent);
      if (!full || full.length > 48) continue;
      var own = ownText(el);
      var cand = own || full;
      if (api ? api.isPopupTitleText(cand) : cand === "출결마감구분" || cand === "출결 구분 선택") {
        var childTitle = false;
        for (var c = 0; c < el.children.length; c++) {
          var ct = ownText(el.children[c]) || normText(el.children[c].textContent);
          if (api ? api.isPopupTitleText(ct) : ct === "출결마감구분") {
            childTitle = true;
            break;
          }
        }
        if (!childTitle) titleEls.push(el);
      }
    }
    // TreeWalker: 텍스트 노드 「출결마감구분」앵커 보강
    try {
      var rootTw = document.body || document.documentElement;
      if (rootTw && document.createTreeWalker) {
        var tw = document.createTreeWalker(rootTw, NodeFilter.SHOW_TEXT, null);
        var tn;
        while ((tn = tw.nextNode())) {
          var tx = normText(tn.textContent);
          if (!tx || tx.length > 64) continue;
          var titleTw =
            api && api.hasPopupTitleInText
              ? api.hasPopupTitleInText(tx)
              : tx.indexOf("출결마감구분") >= 0;
          if (!titleTw) continue;
          var pel = tn.parentElement;
          if (pel && visible(pel) && titleEls.indexOf(pel) < 0) titleEls.push(pel);
        }
      }
    } catch (eTw) {}

    function rootPassesTitleRequired(root) {
      if (!root || !visible(root)) return false;
      var blob = normText(root.textContent);
      if (api && api.fallbackPopupNeedsTitle) {
        if (!api.fallbackPopupNeedsTitle(blob)) return false;
        if (api.isClimbPopupRootContent && !api.isClimbPopupRootContent(blob)) return false;
        if (api.isPopupRootSizeOk) {
          var shorts = collectVisibleShortTexts(root);
          var rr = root.getBoundingClientRect();
          if (
            !api.isPopupRootSizeOk({
              text: blob,
              textCount: shorts.length,
              width: rr.width,
              height: rr.height,
              tagName: root.tagName,
            })
          ) {
            return false;
          }
        }
        return true;
      }
      return blob.indexOf("출결마감구분") >= 0 && blob.indexOf("질병") >= 0;
    }

    for (var j = 0; j < titleEls.length; j++) {
      var root = climbPopupRoot(titleEls[j]);
      if (rootPassesTitleRequired(root)) return root;
    }

    // Fallback: 동일 규칙으로 최소 루트 (popupLike 단독 거부)
    var containers = document.querySelectorAll(
      "div, [role='dialog'], section, aside, form, [class*='popup'], [class*='Popup'], [class*='layer']",
    );
    var fbCands = [];
    var fbNodes = [];
    for (var u = 0; u < containers.length; u++) {
      var box = containers[u];
      if (!visible(box)) continue;
      if (box.tagName === "BODY" || box.tagName === "HTML") continue;
      var br = box.getBoundingClientRect();
      var blob = normText(box.textContent);
      var shortTexts = collectVisibleShortTexts(box);
      fbCands.push({
        id: fbNodes.length,
        text: blob,
        textCount: shortTexts.length,
        width: br.width,
        height: br.height,
        tagName: box.tagName,
      });
      fbNodes.push(box);
    }
    if (api && api.pickSmallestPopupRoot) {
      var fbPick = api.pickSmallestPopupRoot(fbCands);
      if (fbPick && fbPick.id != null && fbNodes[fbPick.id]) return fbNodes[fbPick.id];
      return null;
    }
    var best = null;
    var bestLen = Infinity;
    for (var v = 0; v < fbCands.length; v++) {
      var fc = fbCands[v];
      if (!rootPassesTitleRequired(fbNodes[fc.id])) continue;
      var fl = normText(fc.text).length;
      if (fl < bestLen) {
        bestLen = fl;
        best = fbNodes[fc.id];
      }
    }
    return best;
  }

  /**
   * 팝업 루트 안에서만 구분/종류 라디오·라벨 선택 (Nexacro contentsbox).
   * input[type=radio]만 집지 않고 contentsbox/부모 셀 클릭.
   * 바깥 「미인정」오탐 방지 — popup 스코프 필수.
   */
  function selectRadioIn(popup, labelText, requireEnabled) {
    if (!popup || !labelText || !popup.querySelectorAll) return false;
    var api = PA();
    var want = normText(labelText);
    if (!want) return false;
    if (api && api.isCloseAllButtonText(want)) return false;

    var cands = [];
    var all = popup.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.tagName === "SCRIPT" || el.tagName === "STYLE") continue;
      if (!visible(el)) continue;
      var own = ownText(el);
      var full = normText(el.textContent);
      if (full.length > 64) continue;
      var score = 0;
      if (own && (api ? api.isLeafOptionText(own, want) : own === want)) score = 100;
      else if (api ? api.isLeafOptionText(full, want) : full === want) score = 90;
      else if (own && api && api.labelTokenMatch(own, want)) score = 70;
      else if (api && api.labelTokenMatch(full, want)) score = 50;
      else if (!api && full.indexOf(want) === 0 && full.length <= want.length + 8) score = 60;
      else continue;
      // 더 깊은 자식이 더 정확한 리프면 부모 스킵
      var childBetter = false;
      for (var c = 0; c < el.children.length; c++) {
        var ch = el.children[c];
        var co = ownText(ch);
        var cf = normText(ch.textContent);
        if (
          (co && (api ? api.isLeafOptionText(co, want) : co === want)) ||
          (api ? api.isLeafOptionText(cf, want) : cf === want)
        ) {
          childBetter = true;
          break;
        }
      }
      if (childBetter) continue;
      if (requireEnabled && isControlDisabled(el)) continue;
      var r = el.getBoundingClientRect();
      cands.push({ el: el, score: score, area: r.width * r.height });
    }
    cands.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.area - b.area;
    });

    for (var j = 0; j < cands.length; j++) {
      var node = cands[j].el;
      // 팝업 밖 노드 거부
      if (!popup.contains(node)) continue;
      if (requireEnabled && isControlDisabled(node)) continue;
      var lab = (node.closest && node.closest("label")) || node;
      var inp =
        (lab.querySelector && lab.querySelector("input[type='radio']")) ||
        (lab.htmlFor ? document.getElementById(lab.htmlFor) : null);
      if (!inp && lab.parentElement) {
        inp = lab.parentElement.querySelector("input[type='radio']");
      }
      if (!inp) {
        var near = node.parentElement;
        for (var d = 0; d < 5 && near && near !== popup && !inp; d++, near = near.parentElement) {
          if (!popup.contains(near)) break;
          if (near.querySelector) {
            var radios = near.querySelectorAll("input[type='radio']");
            if (radios.length === 1) inp = radios[0];
          }
        }
      }
      if (inp && popup.contains(inp)) {
        try {
          inp.checked = true;
          inp.dispatchEvent(new Event("change", { bubbles: true }));
        } catch (e) {}
        clickEl(inp);
      }
      // Nexacro: contentsbox / 부모 셀 우선 (radio input만이 아님)
      var clickTarget =
        (node.closest &&
          node.closest(
            "[class*='contentsbox'], [class*='ContentsBox'], [class*='radioitem'], [class*='RadioItem'], [class*='cell']",
          )) ||
        null;
      if (clickTarget && !popup.contains(clickTarget)) clickTarget = null;
      if (!clickTarget) {
        clickTarget =
          (node.closest &&
            node.closest("button, [role='button'], a, [onclick], label, td, th, li")) ||
          lab ||
          node;
      }
      if (clickTarget && popup.contains(clickTarget)) {
        var ctLab = normText(clickTarget.textContent || clickTarget.value || "");
        if (api && api.isCloseAllButtonText(ctLab) && ctLab.indexOf(want) < 0) continue;
        clickEl(clickTarget);
      }
      clickEl(node);
      return true;
    }
    return false;
  }

  /** @deprecated alias — selectRadioIn */
  function selectByVisibleLabel(popup, labelText, requireEnabled) {
    return selectRadioIn(popup, labelText, requireEnabled);
  }

  function setNexaText(el, text) {
    if (!el) return false;
    var v = String(text || "");
    try {
      el.focus();
    } catch (eF) {}
    var tag = (el.tagName || "").toUpperCase();
    if (tag === "INPUT" || tag === "TEXTAREA") {
      try {
        var proto = tag === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        var desc = Object.getOwnPropertyDescriptor(proto, "value");
        if (desc && desc.set) desc.set.call(el, v);
        else el.value = v;
      } catch (eV) {
        el.value = v;
      }
    } else if (el.isContentEditable || el.getAttribute("contenteditable") === "true") {
      el.textContent = v;
    } else {
      try {
        el.value = v;
      } catch (eX) {}
    }
    try {
      el.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true, data: v, inputType: "insertText" }));
    } catch (eI) {
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
    return true;
  }

  function reasonFieldCandidates(popup, labelEl) {
    var out = [];
    function push(el) {
      if (!el || !(el instanceof Element)) return;
      if (out.indexOf(el) >= 0) return;
      if (!visible(el) && (el.tagName || "") !== "INPUT") return;
      out.push(el);
    }
    var box = labelEl.closest("tr, li, td, [class*='contentsbox'], [class*='form'], div") || labelEl.parentElement;
    if (box) {
      var near = box.querySelectorAll("input, textarea, [contenteditable='true'], [class*='Edit'], [class*='edit'], [class*='input']");
      for (var i = 0; i < near.length; i++) push(near[i]);
    }
    var lr = labelEl.getBoundingClientRect();
    var all = popup.querySelectorAll("input, textarea, [contenteditable='true'], [class*='Edit']");
    for (var j = 0; j < all.length; j++) {
      var el = all[j];
      var r = el.getBoundingClientRect();
      if (!(r.width > 8 && r.height > 8)) continue;
      if (r.left + 4 < lr.right - 20) continue;
      if (r.top > lr.bottom + 28 || r.bottom < lr.top - 28) continue;
      push(el);
    }
    return out;
  }

  function fillReason(popup, reason) {
    var want = String(reason || "").trim();
    if (!popup) return !want;
    var labels = findElementsByExactText(popup, "사유");
    if (!labels.length) {
      labels = findLabelHits(popup, "사유") || [];
    }
    for (var i = 0; i < labels.length; i++) {
      var cands = reasonFieldCandidates(popup, labels[i]);
      for (var c = 0; c < cands.length; c++) {
        try {
          clickOnce(cands[c]);
        } catch (eC) {}
        if (setNexaText(cands[c], want)) return true;
      }
    }
    var fallback = popup.querySelector("input[type='text'], textarea, input:not([type])");
    if (fallback && visible(fallback)) {
      clickNexa(fallback, { usePoint: true, mode: "full" });
      return setNexaText(fallback, want);
    }
    return !want;
  }

  function findApplyControl(popup) {
    var api = PA();
    if (!popup || !popup.querySelectorAll) return null;
    var btn = findClickableByText(popup, "적용");
    if (btn && popup.contains(btn)) {
      var lab = (btn.textContent || btn.value || "").replace(/\s+/g, " ").trim();
      if (api ? api.isApplyButtonText(lab) : lab === "적용") {
        if (!(api && api.isCloseAllButtonText(lab))) return btn;
      }
    }
    var nodes = popup.querySelectorAll("*");
    var best = null;
    var bestArea = 1e15;
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.tagName === "SCRIPT" || el.tagName === "STYLE") continue;
      if (!visible(el)) continue;
      if (!popup.contains(el)) continue;
      var t = "";
      if (el.tagName === "INPUT") t = normText(el.value);
      else {
        t = ownText(el);
        if (!t && el.children.length === 0) t = normText(el.textContent);
        if (t.length > 8) continue;
      }
      if (!(api ? api.isApplyButtonText(t) : t === "적용")) continue;
      if (api && api.isCloseAllButtonText(t)) continue;
      // contentsbox / 버튼 셀 선호
      var target =
        (el.closest &&
          el.closest(
            "[class*='contentsbox'], [class*='ContentsBox'], button, [role='button'], a, input",
          )) ||
        el;
      if (!popup.contains(target)) target = el;
      var tLab = normText(target.textContent || target.value || "");
      if (api && api.isCloseAllButtonText(tLab) && tLab.indexOf("적용") < 0) continue;
      var r = target.getBoundingClientRect();
      var area = r.width * r.height;
      if (area < bestArea) {
        bestArea = area;
        best = target;
      }
    }
    return best;
  }

  function elClassRaw(el) {
    try {
      if (!el) return "";
      if (el.className && el.className.baseVal != null) return String(el.className.baseVal);
      return String(el.className || "");
    } catch (e) {
      return "";
    }
  }

  function elClassTokens(el) {
    var api = PA();
    var raw = elClassRaw(el);
    if (api && api.classNameTokens) return api.classNameTokens(raw);
    return String(raw || "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 12);
  }

  function clsBlob(el) {
    return elClassTokens(el).join(" ").toLowerCase();
  }

  /** 「마감」헤더 centerX (익명). 없으면 null. */
  function findCloseHeaderCenterX(root) {
    root = root || document.body || document.documentElement;
    if (!root) return null;
    var hits = leafLabelEls(root, "마감");
    if (!hits || !hits.length) {
      try {
        hits = findLabelHits(root, "마감");
      } catch (eH) {
        hits = [];
      }
    }
    var best = null;
    var bestY = 1e15;
    for (var i = 0; i < hits.length; i++) {
      var el = hits[i];
      if (!el || !visible(el)) continue;
      var r = el.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) continue;
      // 헤더는 보통 상단 — 가장 위쪽 가시 「마감」
      if (r.top < bestY) {
        bestY = r.top;
        best = r.left + r.width / 2;
      }
    }
    return best;
  }

  /**
   * placeholder 리프(작은 cl-text/cl-placeholder)면 부모 GridCell/contentsbox를
   * 클릭 후보로 상승 — 리프보다 앞에 둠. headerCenterX로 열 정렬 필터.
   */
  function closeClickTargets(cell, headerCenterX) {
    var out = [];
    if (!cell) return out;
    var api = PA();
    function push(el) {
      if (!el || !(el instanceof Element)) return;
      if (out.indexOf(el) >= 0) return;
      out.push(el);
    }
    var leafR = cell.getBoundingClientRect();
    var leafTok = elClassTokens(cell);
    var leafPh =
      api && api.isPlaceholderCloseLeaf
        ? api.isPlaceholderCloseLeaf(leafTok, leafR, "cell")
        : leafR.height <= 22 && leafR.width <= 120;
    var parents = [];
    var cur = cell.parentElement;
    for (var p = 0; p < 8 && cur; p++, cur = cur.parentElement) {
      if (!(cur instanceof Element)) break;
      var tag = (cur.tagName || "").toUpperCase();
      if (tag === "BODY" || tag === "HTML" || tag === "TR" || tag === "TABLE") break;
      var tok = elClassTokens(cur);
      var cb = tok.join(" ").toLowerCase();
      var pr = cur.getBoundingClientRect();
      if (pr.width < 2 || pr.height < 2) continue;
      if (pr.width > 480 || pr.height > 140) continue;
      var isNexa =
        (api && api.isCloseCellContainerTokens && api.isCloseCellContainerTokens(tok)) ||
        /contentsbox|nexacontentsbox|gridcell|cellcontrol|gridband|nexa/.test(cb) ||
        tag === "TD";
      var larger = pr.width * pr.height > leafR.width * leafR.height * 1.15;
      // placeholder면 class 힌트 없어도 더 큰 부모 DIV를 후보에 포함
      if (!isNexa && !(leafPh && larger && tag === "DIV")) continue;
      parents.push(cur);
    }
    // placeholder: 부모 컨테이너를 리프보다 먼저
    if (leafPh) {
      for (var pi = 0; pi < parents.length; pi++) push(parents[pi]);
      push(cell);
    } else {
      push(cell);
      for (var pj = 0; pj < parents.length; pj++) push(parents[pj]);
    }
    // Nexacro: cell 내부 input/edit
    var inputs = cell.querySelectorAll(
      "input, textarea, [contenteditable='true'], [class*='Edit'], [class*='edit']",
    );
    for (var ii = 0; ii < inputs.length; ii++) {
      if (visible(inputs[ii]) || inputs[ii].tagName === "INPUT") push(inputs[ii]);
    }
    var inners = cell.querySelectorAll(
      "a, button, input, [onclick], [role='button'], [class*='contentsbox'], [class*='ContentsBox'], [class*='nexacontentsbox'], [class*='nexa'], [class*='cell'], [class*='GridCell'], div, span",
    );
    for (var i = 0; i < inners.length; i++) {
      var el = inners[i];
      if (!visible(el)) continue;
      var r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      if (r.width > 240 || r.height > 80) continue;
      // placeholder 리프 자신은 이미 처리 — 중복 push는 no-op
      push(el);
    }
    // 마감 헤더 열 정렬: 멀리 떨어진 후보 제거. 전부 탈락 시 빈 배열(오클릭 금지 #50)
    if (headerCenterX != null && !isNaN(Number(headerCenterX))) {
      var hx = Number(headerCenterX);
      var maxDx =
        api && api.closeHeaderMaxDx
          ? api.closeHeaderMaxDx(null)
          : api && api.CLOSE_HEADER_MAX_DX != null
            ? api.CLOSE_HEADER_MAX_DX
            : 40;
      var filtered = [];
      for (var fi = 0; fi < out.length; fi++) {
        var fe = out[fi];
        var fr = fe.getBoundingClientRect();
        var fcx = fr.left + fr.width / 2;
        var okAlign =
          api && api.alignsWithCloseHeader
            ? api.alignsWithCloseHeader(fcx, hx, maxDx)
            : Math.abs(fcx - hx) <= maxDx;
        if (okAlign) filtered.push(fe);
      }
      out = filtered;
    }
    // 정렬: placeholder면 컨테이너 우선, 아니면 input→nexa→작은 면적
    out.sort(function (a, b) {
      if (leafPh) {
        var aPar = parents.indexOf(a) >= 0 || (api && api.isCloseCellContainerTokens && api.isCloseCellContainerTokens(elClassTokens(a)));
        var bPar = parents.indexOf(b) >= 0 || (api && api.isCloseCellContainerTokens && api.isCloseCellContainerTokens(elClassTokens(b)));
        if (aPar !== bPar) return aPar ? -1 : 1;
        if (a === cell && b !== cell && !bPar) return 1;
        if (b === cell && a !== cell && !aPar) return -1;
      } else {
        if (a === cell) return -1;
        if (b === cell) return 1;
      }
      var atag = (a.tagName || "").toUpperCase();
      var btag = (b.tagName || "").toUpperCase();
      var aIn = atag === "INPUT" || atag === "TEXTAREA" ? 0 : 1;
      var bIn = btag === "INPUT" || btag === "TEXTAREA" ? 0 : 1;
      if (aIn !== bIn) return aIn - bIn;
      var aNexa = /nexacontentsbox|contentsbox|gridcell/i.test(clsBlob(a)) ? 0 : 1;
      var bNexa = /nexacontentsbox|contentsbox|gridcell/i.test(clsBlob(b)) ? 0 : 1;
      if (aNexa !== bNexa) return aNexa - bNexa;
      var ar = a.getBoundingClientRect();
      var br = b.getBoundingClientRect();
      // placeholder: 부모는 더 큰 면적 선호
      if (leafPh && aPar && bPar) return br.width * br.height - ar.width * ar.height;
      return ar.width * ar.height - br.width * br.height;
    });
    return out;
  }

  /** 루트 안 제목「출결마감구분」가시 여부 (rect+visible) */
  function titleVisibleIn(root) {
    if (!root || !root.querySelectorAll) return false;
    var api = PA();
    var all = root.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.tagName === "SCRIPT" || el.tagName === "STYLE") continue;
      if (!visible(el)) continue;
      var r = el.getBoundingClientRect();
      if (api && api.isClientRectVisible && !api.isClientRectVisible(r)) continue;
      if (!(r.width > 0 && r.height > 0)) continue;
      var own = ownText(el);
      var full = normText(el.textContent);
      var cand = own || (full.length <= 48 ? full : "");
      if (!cand) continue;
      var ok = api ? api.isPopupTitleText(cand) : cand.indexOf("출결마감구분") >= 0;
      if (ok) return true;
    }
    return false;
  }

  /** 루트 안 구분(질병|미인정|기타|출석인정) 컨트롤 가시 */
  function categoryVisibleIn(root) {
    if (!root || !root.querySelectorAll) return false;
    var api = PA();
    var labels = (api && api.CATEGORY_LABELS) || ["질병", "미인정", "기타", "출석인정"];
    var all = root.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.tagName === "SCRIPT" || el.tagName === "STYLE") continue;
      if (!visible(el)) continue;
      var r = el.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) continue;
      var own = ownText(el);
      var full = normText(el.textContent);
      for (var j = 0; j < labels.length; j++) {
        var want = labels[j];
        var match = api
          ? api.isLeafOptionText(own, want) || api.labelTokenMatch(full.length <= 64 ? full : own, want)
          : own === want || full === want;
        if (match) return true;
      }
    }
    return false;
  }

  /** 루트(또는 document) 안 「질병」리프 가시 — decoy 구분 탐지용 */
  function illnessVisibleIn(root) {
    if (!root || !root.querySelectorAll) return false;
    var api = PA();
    var all = root.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.tagName === "SCRIPT" || el.tagName === "STYLE") continue;
      if (!visible(el)) continue;
      var r = el.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) continue;
      var own = ownText(el);
      var full = normText(el.textContent);
      var match = api
        ? api.isLeafOptionText(own, "질병") ||
          (full.length <= 16 && api.labelTokenMatch(full, "질병"))
        : own === "질병" || full === "질병";
      if (match) return true;
    }
    return false;
  }

  /** 문서 전역 제목·질병 가시 스냅샷 (decoy titleHit 구분) */
  function probeTitleIllnessVisible(scope) {
    var root = scope || document.body || document.documentElement;
    if (!root) return { titleVisible: false, illnessVisible: false };
    // title: document-wide short visible title (decoy chrome 포함)
    var titleVis = false;
    var illnessVis = false;
    try {
      titleVis = titleVisibleIn(root);
    } catch (eT) {
      titleVis = false;
    }
    try {
      illnessVis = illnessVisibleIn(root);
    } catch (eI) {
      illnessVis = false;
    }
    return { titleVisible: !!titleVis, illnessVisible: !!illnessVis };
  }

  /**
   * 마감 셀 클릭 실패 익명 dump — tag/class tokens/rect/후보·전후 가시만.
   * 성명·번호·cell text 값 금지. console.info 익명.
   */
  function buildCloseCellFailDump(cell, targets, before, after, modes, headerCenterX) {
    var api = PA();
    var cands = [];
    var list = targets && targets.length ? targets : cell ? [cell] : [];
    var hx = headerCenterX != null && !isNaN(Number(headerCenterX)) ? Number(headerCenterX) : null;
    var maxDx =
      api && api.CLOSE_HEADER_MAX_DX != null ? api.CLOSE_HEADER_MAX_DX : 40;
    var primaryDx = null;
    var cellX = null;
    if (cell && cell.getBoundingClientRect) {
      var cellRect0 = cell.getBoundingClientRect();
      cellX = cellRect0.left + cellRect0.width / 2;
    }
    for (var i = 0; i < list.length && i < 20; i++) {
      var el = list[i];
      if (!el || !el.getBoundingClientRect) continue;
      var r = el.getBoundingClientRect();
      var kind = "node";
      var tag = (el.tagName || "").toUpperCase();
      var cls = elClassRaw(el);
      var toks = elClassTokens(el);
      var blob = toks.join(" ").toLowerCase();
      if (el === cell) {
        kind =
          api && api.isPlaceholderCloseLeaf && api.isPlaceholderCloseLeaf(toks, r, "cell")
            ? "placeholder"
            : "cell";
      } else if (tag === "INPUT" || tag === "TEXTAREA") kind = "input";
      else if (/nexacontentsbox|contentsbox/i.test(blob)) kind = "contentsbox";
      else if (/gridcell|cellcontrol/i.test(blob)) kind = "gridcell";
      else if (cell && cell.contains && !cell.contains(el)) kind = "parent";
      var rec = { tagName: tag, className: cls, rect: r, kind: kind };
      var cand;
      if (api && api.anonClickCandidate) cand = api.anonClickCandidate(rec);
      else
        cand = {
          tag: tag,
          cls: toks.slice(0, 8),
          rect: {
            x: Math.round(r.left),
            y: Math.round(r.top),
            w: Math.round(r.width),
            h: Math.round(r.height),
          },
          kind: kind,
        };
      if (hx != null) {
        var cx = r.left + r.width / 2;
        var dx =
          api && api.closeHeaderDx ? api.closeHeaderDx(cx, hx) : Math.round(cx - hx);
        cand.dx = dx;
        if (primaryDx == null && (el === cell || kind === "parent" || kind === "gridcell" || kind === "contentsbox")) {
          primaryDx = dx;
        }
      }
      cands.push(cand);
    }
    if (primaryDx == null && cell && hx != null) {
      var cr = cell.getBoundingClientRect();
      primaryDx =
        api && api.closeHeaderDx
          ? api.closeHeaderDx(cr.left + cr.width / 2, hx)
          : Math.round(cr.left + cr.width / 2 - hx);
    }
    var raw = {
      candidates: cands,
      before: before || {},
      after: after || {},
      modes: modes || [],
      headerX: hx != null ? Math.round(hx) : null,
      cellX: cellX != null ? Math.round(cellX) : null,
      closeHeaderDx: primaryDx,
      closeHeaderAligned:
        primaryDx == null
          ? 0
          : Math.abs(primaryDx) <= maxDx
            ? 1
            : 0,
    };
    if (api && api.normalizeCloseCellFailDump) return api.normalizeCloseCellFailDump(raw);
    return raw;
  }

  function logCloseCellFailDump(dump) {
    try {
      var d = dump || {};
      var api = PA();
      var jsonStr =
        api && api.stringifyCloseCellDump
          ? api.stringifyCloseCellDump(d)
          : JSON.stringify(d);
      console.info(
        "[출결메이트]",
        "close_cell_dump",
        "cand=" + (d.candidateCount != null ? d.candidateCount : (d.candidates && d.candidates.length) || 0),
        "beforeTitle=" + ((d.before && d.before.titleVisible) || 0),
        "beforeIllness=" + ((d.before && d.before.illnessVisible) || 0),
        "afterTitle=" + ((d.after && d.after.titleVisible) || 0),
        "afterIllness=" + ((d.after && d.after.illnessVisible) || 0),
        "titleNewly=" + ((d.after && d.after.titleNewly) || 0),
        "illnessNewly=" + ((d.after && d.after.illnessNewly) || 0),
        "decoyTitle=" + ((d.before && d.before.decoyTitle) || 0),
        "headerX=" + (d.headerX != null ? d.headerX : ""),
        "cellX=" + (d.cellX != null ? d.cellX : ""),
        "closeHeaderDx=" + (d.closeHeaderDx != null ? d.closeHeaderDx : ""),
        "closeHeaderAligned=" + (d.closeHeaderAligned != null ? d.closeHeaderAligned : 0),
        "modes=" + ((d.modes && d.modes.join(",")) || ""),
      );
      // JSON 문자열 — [object Object] 복붙 불가 방지. 성명·번호 없음.
      console.info("[출결메이트]", "close_cell_dump_json", jsonStr);
    } catch (eLog) {}
  }

  /**
   * 성공: visible 팝업 루트 AND 제목 가시 AND 구분 컨트롤 가시.
   * titleHit(decoy) 단독 성공 금지.
   */
  function findOpenPopupVisible() {
    var api = PA();
    var root = findPopup();
    if (!root || !visible(root)) return null;
    var rr = root.getBoundingClientRect();
    if (!(rr.width > 0 && rr.height > 0)) return null;
    var titleVis = titleVisibleIn(root);
    var catVis = categoryVisibleIn(root);
    var ok = api && api.popupOpenVisibleOk
      ? api.popupOpenVisibleOk({ titleVisible: titleVis, categoryVisible: catVis, titleHit: 0 })
      : titleVis && catVis;
    if (!ok) return null;
    return root;
  }

  /** 클릭 후 제목·구분이 새로 가시화될 때까지 poll */
  async function waitForVisiblePopup(maxMs) {
    var deadline = Date.now() + (maxMs || 3600);
    while (Date.now() < deadline) {
      var popup = findOpenPopupVisible();
      if (popup) return popup;
      await sleep(120);
    }
    return null;
  }

  async function openClosePopup(row, closeIdx, cellsOpt, headerCenterXOpt) {
    var cells = cellsOpt || rowCells(row);
    var beforeOpen = findOpenPopupVisible();
    if (beforeOpen) return { ok: true, popup: beforeOpen };

    // decoy titleHit vs 신규: 클릭 전 문서 전역 제목·질병 가시 스냅샷
    var beforeProbe = probeTitleIllnessVisible(document.body || document.documentElement);
    var headerCx =
      headerCenterXOpt != null && !isNaN(Number(headerCenterXOpt))
        ? Number(headerCenterXOpt)
        : findCloseHeaderCenterX(document.body || document.documentElement);

    // #52: closeIdx(880칸) 버리고 헤더X×행Y로 재선택. 정렬 실패면 클릭 안 함.
    var cell = resolveCloseCellByHeaderX(row, cells, headerCx, null);
    if (!cell) {
      var idxCell = cells && closeIdx != null ? cells[closeIdx] : null;
      var dumpIdx = buildCloseCellFailDump(
        idxCell,
        idxCell ? [idxCell] : [],
        beforeProbe,
        beforeProbe,
        [],
        headerCx,
      );
      logCloseCellFailDump(dumpIdx);
      var diagIdx = popupDiag(document);
      diagIdx.closeCellDump = dumpIdx;
      diagIdx.headerX = dumpIdx.headerX != null ? dumpIdx.headerX : null;
      diagIdx.cellX = dumpIdx.cellX != null ? dumpIdx.cellX : null;
      diagIdx.closeHeaderDx = dumpIdx.closeHeaderDx != null ? dumpIdx.closeHeaderDx : null;
      diagIdx.closeHeaderAligned = 0;
      diagIdx.resolve = "headerX_x_rowY";
      return { ok: false, code: "close_col_misaligned", diag: diagIdx };
    }

    var targets = closeClickTargets(cell, headerCx);
    // #50: 「마감」헤더와 centerX 미정렬이면 클릭하지 않음
    if (!targets.length) {
      if (headerCx != null && !isNaN(Number(headerCx))) {
        var dumpMis = buildCloseCellFailDump(
          cell,
          cell ? [cell] : [],
          beforeProbe,
          beforeProbe,
          [],
          headerCx,
        );
        logCloseCellFailDump(dumpMis);
        var diagMis = popupDiag(document);
        diagMis.closeCellDump = dumpMis;
        try {
          var apiMis = PA();
          diagMis.closeCellDumpJson =
            apiMis && apiMis.stringifyCloseCellDump
              ? apiMis.stringifyCloseCellDump(dumpMis)
              : JSON.stringify(dumpMis);
        } catch (eMis) {
          diagMis.closeCellDumpJson = "";
        }
        diagMis.headerX = dumpMis.headerX != null ? dumpMis.headerX : null;
        diagMis.cellX = dumpMis.cellX != null ? dumpMis.cellX : null;
        diagMis.closeHeaderDx = dumpMis.closeHeaderDx != null ? dumpMis.closeHeaderDx : null;
        diagMis.closeHeaderAligned =
          dumpMis.closeHeaderAligned != null ? dumpMis.closeHeaderAligned : 0;
        diagMis.beforeTitleVisible = beforeProbe.titleVisible ? 1 : 0;
        diagMis.beforeIllnessVisible = beforeProbe.illnessVisible ? 1 : 0;
        diagMis.afterTitleVisible = beforeProbe.titleVisible ? 1 : 0;
        diagMis.afterIllnessVisible = beforeProbe.illnessVisible ? 1 : 0;
        diagMis.titleNewly = 0;
        diagMis.illnessNewly = 0;
        return { ok: false, code: "close_col_misaligned", diag: diagMis };
      }
      targets = [cell];
    }
    var modes = ["once"];
    var modesTried = ["once"];
    var popup = null;
    var target = targets[0];
    for (var attempt = 0; attempt < 2; attempt++) {
      clickOnce(target);
      await sleep(500);
      popup = await waitForVisiblePopup(1200);
      if (popup) {
        var afterInPopup = {
          titleVisible: titleVisibleIn(popup),
          illnessVisible: illnessVisibleIn(popup) || categoryVisibleIn(popup),
        };
        // titleHit(decoy) 단독 금지: 팝업 루트 안 제목+질병(구분) 가시 필수
        if (!afterInPopup.titleVisible || !afterInPopup.illnessVisible) {
          popup = null;
          continue;
        }
        // decoy titleHit 단독은 여기 도달 불가 — 제목+질병 가시 쌍이 게이트.
        // beforeProbe는 실패 dump에서 decoy vs 신규 구분에 사용.
        break;
      }
    }
    if (!popup) {
      var afterProbe = probeTitleIllnessVisible(document.body || document.documentElement);
      var dump = buildCloseCellFailDump(
        cell,
        targets,
        beforeProbe,
        afterProbe,
        modesTried,
        headerCx,
      );
      logCloseCellFailDump(dump);
      var diag = popupDiag(document);
      diag.closeCellDump = dump;
      // diag에 JSON 문자열 요약 — [object Object] 금지
      try {
        var apiS = PA();
        diag.closeCellDumpJson =
          apiS && apiS.stringifyCloseCellDump
            ? apiS.stringifyCloseCellDump(dump)
            : JSON.stringify(dump);
      } catch (eJ) {
        diag.closeCellDumpJson = "";
      }
      diag.headerX = dump.headerX != null ? dump.headerX : null;
      diag.cellX = dump.cellX != null ? dump.cellX : null;
      diag.closeHeaderDx = dump.closeHeaderDx != null ? dump.closeHeaderDx : null;
      diag.closeHeaderAligned = dump.closeHeaderAligned != null ? dump.closeHeaderAligned : 0;
      diag.beforeTitleVisible = beforeProbe.titleVisible ? 1 : 0;
      diag.beforeIllnessVisible = beforeProbe.illnessVisible ? 1 : 0;
      diag.afterTitleVisible = afterProbe.titleVisible ? 1 : 0;
      diag.afterIllnessVisible = afterProbe.illnessVisible ? 1 : 0;
      diag.titleNewly =
        beforeProbe.titleVisible === false && afterProbe.titleVisible ? 1 : 0;
      diag.illnessNewly =
        beforeProbe.illnessVisible === false && afterProbe.illnessVisible ? 1 : 0;
      return { ok: false, code: "popup_not_found", diag: diag };
    }
    return { ok: true, popup: popup };
  }

  /** 종류 라벨이 활성(회색 해제)될 때까지 대기 */
  async function waitForTypeEnabled(popup, typeLabel, maxMs) {
    var want = normText(typeLabel);
    var api = PA();
    var deadline = Date.now() + (maxMs || 2800);
    while (Date.now() < deadline) {
      if (!popup || !popup.querySelectorAll) return false;
      var all = popup.querySelectorAll("*");
      for (var i = 0; i < all.length; i++) {
        var el = all[i];
        if (!visible(el)) continue;
        var own = ownText(el);
        var full = normText(el.textContent);
        var match =
          (own && (api ? api.isLeafOptionText(own, want) : own === want)) ||
          (api ? api.isLeafOptionText(full, want) : full === want);
        if (!match) continue;
        if (!isControlDisabled(el)) return true;
      }
      await sleep(90);
    }
    return false;
  }

  async function applyPopup(popup, item) {
    var catLabel = CATEGORY_KO[item.category];
    var typeLabel = TYPE_KO[item.type];
    // 구분(질병 등) — 활성 우선
    if (!selectRadioIn(popup, catLabel, true) && !selectRadioIn(popup, catLabel, false)) {
      return { ok: false, code: "category_not_found", diag: popupDiag(popup) };
    }
    // 종류는 구분 선택 전 회색 — enable 대기 후 클릭
    var enabled = await waitForTypeEnabled(popup, typeLabel, 2800);
    if (!enabled) {
      return { ok: false, code: "type_not_enabled", diag: popupDiag(popup) };
    }
    if (!selectRadioIn(popup, typeLabel, true)) {
      return { ok: false, code: "type_not_found", diag: popupDiag(popup) };
    }
    await sleep(120);
    if (item.category === "other" || (item.reason && String(item.reason).trim())) {
      if (!fillReason(popup, item.reason || "")) {
        return { ok: false, code: "reason_field_missing", diag: popupDiag(popup) };
      }
    }
    var applyBtn = findApplyControl(popup);
    if (!applyBtn) {
      return { ok: false, code: "popup_no_apply", diag: popupDiag(popup) };
    }
    // 출결마감 절대 클릭 금지
    var applyLab = normText(applyBtn.textContent || applyBtn.value || "");
    var api = PA();
    if (api && api.isCloseAllButtonText(applyLab) && !api.isApplyButtonText(applyLab)) {
      return { ok: false, code: "popup_no_apply", diag: popupDiag(popup) };
    }
    clickEl(applyBtn);
    await sleep(450);
    return { ok: true };
  }

  function periodCellDiag(grid, period, cells) {
    return {
      period: Number(period) || 0,
      hasPeriodCol: grid && grid.periodCols && grid.periodCols[period] != null ? 1 : 0,
      cellPresent: cells && grid && grid.periodCols && cells[grid.periodCols[period]] ? 1 : 0,
      periodCount: (grid && grid.periodCount) || 0,
      kind: (grid && grid.kind) || "none",
      centers: grid && grid.headerCenters ? grid.headerCenters.length : 0,
    };
  }

  function findPeriodHeaderCenterX(period) {
    var want = Number(period);
    if (!Number.isFinite(want) || want < 1) return null;
    var hits = findPeriodHits(document.body || document.documentElement);
    var best = null;
    var bestY = 1e15;
    for (var i = 0; i < hits.length; i++) {
      if (Number(hits[i].period) !== want) continue;
      var r = hits[i].rect;
      if (!r || !(r.width > 0)) continue;
      if (r.top < bestY) {
        bestY = r.top;
        best = r.left + r.width / 2;
      }
    }
    return best;
  }

  function rowSlashCount(row, cells, grid) {
    var n = 0;
    var list = cells || [];
    for (var i = 0; i < list.length; i++) {
      var t = cellLabel(list[i]);
      if (t && t.indexOf("/") >= 0) n += 1;
    }
    if (n > 0) return n;
    var hxList = [];
    try {
      var hits = findPeriodHits(document.body || document.documentElement);
      for (var h = 0; h < hits.length; h++) {
        var r = hits[h].rect;
        if (r && r.width > 0) hxList.push(r.left + r.width / 2);
      }
    } catch (eH) {}
    for (var x = 0; x < hxList.length; x++) {
      var el = resolveCloseCellByHeaderX(row, list, hxList[x], grid && grid.headerBottom);
      var tx = cellLabel(el);
      if (tx && tx.indexOf("/") >= 0) n += 1;
    }
    return n;
  }

  function clickPeriodCell(row, grid, period, cellsOpt, item) {
    var cells = cellsOpt || rowCells(row);
    var typ = item && item.type;
    if (typ === "absence") {
      if (rowSlashCount(row, cells, grid) >= 2) {
        return { ok: true, skipped: true, code: "absence_already_filled" };
      }
    }
    var hx = findPeriodHeaderCenterX(period);
    if (hx == null && grid && grid.headerCenters && grid.periodCols && grid.periodCols[period] != null) {
      hx = grid.headerCenters[grid.periodCols[period]];
    }
    var cell = hx != null ? resolveCloseCellByHeaderX(row, cells, hx, grid && grid.headerBottom) : null;
    if (!cell && grid && grid.periodCols && grid.periodCols[period] != null) {
      cell = cells[grid.periodCols[period]] || null;
    }
    if (!cell) {
      return { ok: false, code: "period_cell_missing", diag: periodCellDiag(grid, period, cells) };
    }
    if (hx != null && !closeHeaderAlignedOk(cellCenterX(cell), hx)) {
      return { ok: false, code: "period_col_misaligned", diag: periodCellDiag(grid, period, cells) };
    }
    clickOnce(cell);
    return { ok: true };
  }

  function verifyRow(row, grid, item, cellsOpt) {
    var cells = cellsOpt || rowCells(row);
    var wantClose = closeLabel(item.category, item.type);
    var closeEl = null;
    var hx = findCloseHeaderCenterX(document.body || document.documentElement);
    if (hx != null) closeEl = resolveCloseCellByHeaderX(row, cells, hx, grid && grid.headerBottom);
    if (!closeEl && grid && grid.col && grid.col.close != null) closeEl = cells[grid.col.close];
    var closeText = cellLabel(closeEl);
    var catKo = CATEGORY_KO[item.category] || "";
    var typeKo = TYPE_KO[item.type] || "";
    var closeOk =
      (closeText && wantClose && closeText.indexOf(wantClose) >= 0) ||
      (catKo && typeKo && closeText.indexOf(catKo) >= 0 && closeText.indexOf(typeKo) >= 0);
    if (!closeOk) return { ok: false, code: "close_label_mismatch", closeText: closeText || "" };
    // Nexacro(spatial/div): '/' 표시가 table과 다름 → 마감 라벨 일치면 soft OK
    if (grid.kind === "spatial" || grid.kind === "div-row") {
      return { ok: true, soft: true };
    }
    var expect = expectedSlashMap(item.type, item.period, grid.periodCount);
    function check(cell, should) {
      if (!cell) return !should;
      var t = cellLabel(cell);
      var slash = t.indexOf("/") >= 0;
      if (should) return slash;
      return !slash || t.indexOf("미마감") >= 0;
    }
    if (grid.col.morning != null && !check(cells[grid.col.morning], expect.morning)) {
      return { ok: false, code: "slash_morning" };
    }
    for (var p = 1; p <= grid.periodCount; p++) {
      var idx = grid.periodCols[p];
      if (idx == null) continue;
      if (!check(cells[idx], expect["period:" + p])) {
        return { ok: false, code: "slash_period_" + p };
      }
    }
    if (grid.col.afternoon != null && !check(cells[grid.col.afternoon], expect.afternoon)) {
      return { ok: false, code: "slash_afternoon" };
    }
    return { ok: true };
  }


  function climbToolbarBtn(el) {
    if (!el || !(el instanceof Element)) return null;
    var cur = el;
    for (var i = 0; i < 6 && cur; i++, cur = cur.parentElement) {
      if (!(cur instanceof Element)) break;
      var tag = (cur.tagName || "").toUpperCase();
      if (tag === "BODY" || tag === "HTML") break;
      var r = cur.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) continue;
      if (r.width > 220 || r.height > 56) continue;
      return cur;
    }
    return el;
  }

  /** 그리드 위 파란 툴바 「저장」. 출결마감·마감취소 제외. */
  function findNeisSaveButton() {
    var root = document.body || document.documentElement;
    var closeHits = [];
    try {
      closeHits = findElementsByExactText(root, "출결마감").concat(findLabelHits(root, "출결마감") || []);
    } catch (eC) {
      closeHits = [];
    }
    var closeX = null;
    var closeY = null;
    for (var c = 0; c < closeHits.length; c++) {
      var ct = normText(closeHits[c].textContent || "");
      if (ct !== "출결마감" && ct.indexOf("출결마감") !== 0) continue;
      if (ct.length > 8) continue;
      if (!visible(closeHits[c])) continue;
      var cr = closeHits[c].getBoundingClientRect();
      if (cr.width < 8 || cr.height < 8) continue;
      closeX = cr.left + cr.width / 2;
      closeY = (cr.top + cr.bottom) / 2;
      break;
    }
    var hits = [];
    try {
      hits = findElementsByExactText(root, "저장").concat(findLabelHits(root, "저장") || []);
    } catch (eS) {
      hits = [];
    }
    var best = null;
    var bestScore = 1e15;
    for (var i = 0; i < hits.length; i++) {
      var el = hits[i];
      if (!visible(el)) continue;
      var t = normText(el.textContent || el.value || "");
      if (t !== "저장") continue;
      if (t.indexOf("출결마감") >= 0) continue;
      var r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8 || r.height > 48) continue;
      var cx = r.left + r.width / 2;
      var cy = (r.top + r.bottom) / 2;
      var score = r.top;
      if (closeX != null) {
        if (cy < closeY - 28 || cy > closeY + 28) continue;
        if (cx >= closeX - 4) continue;
        score = Math.abs(cy - closeY) * 8 + (closeX - cx);
      }
      if (score < bestScore) {
        bestScore = score;
        best = el;
      }
    }
    return best ? climbToolbarBtn(best) : findClickableByText(root, "저장");
  }

  function clickSaveOnly() {
    var btn = findNeisSaveButton();
    if (!btn) return { ok: false, code: "save_not_found" };
    var label = normText(btn.textContent || btn.value || "");
    if (label.indexOf("출결마감") >= 0 && label !== "저장") {
      return { ok: false, code: "refused_close_button" };
    }
    if (label !== "저장" && label.indexOf("저장") !== 0) {
      return { ok: false, code: "save_ambiguous" };
    }
    clickOnce(btn);
    return { ok: true };
  }

  function findSaveConfirmRoot() {
    var root = document.body || document.documentElement;
    var needles = ["저장하시겠습니까", "저장 하시겠습니까"];
    var all = root.querySelectorAll("div, span, p, td, li");
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (!visible(el)) continue;
      var t = normText(el.textContent || "");
      if (!t || t.length > 80) continue;
      var hit = false;
      for (var n = 0; n < needles.length; n++) {
        if (t.indexOf(needles[n]) >= 0) {
          hit = true;
          break;
        }
      }
      if (!hit) continue;
      var cur = el;
      for (var up = 0; up < 12 && cur; up++, cur = cur.parentElement) {
        if (!(cur instanceof Element)) break;
        var blob = normText(cur.textContent || "");
        var br = cur.getBoundingClientRect();
        if (br.width > 900 || br.height > 620) continue;
        if (blob.indexOf("저장하시겠습니까") >= 0 && blob.indexOf("취소") >= 0) return cur;
      }
      return el;
    }
    return null;
  }

  function collectExactLabels(scope, label) {
    var root = scope || document.body || document.documentElement;
    var hits = [];
    try {
      hits = findElementsByExactText(root, label).concat(findLabelHits(root, label) || []);
    } catch (eH) {
      hits = [];
    }
    var out = [];
    for (var i = 0; i < hits.length; i++) {
      var el = hits[i];
      if (!visible(el)) continue;
      var tx = normText(el.textContent || "");
      if (tx !== label && tx.indexOf(label) !== 0) continue;
      if (tx.length > label.length + 2) continue;
      var r = el.getBoundingClientRect();
      if (r.width < 6 || r.height < 6) continue;
      out.push({ el: el, r: r, cx: r.left + r.width / 2, cy: (r.top + r.bottom) / 2 });
    }
    return out;
  }

  /** 제목 「확인」이 아니라 「취소」 왼쪽·더 아래쪽 확인. */
  function findConfirmButton(scope) {
    var oks = collectExactLabels(scope, "확인");
    var cans = collectExactLabels(scope, "취소");
    var best = null;
    var bestScore = 1e15;
    for (var i = 0; i < oks.length; i++) {
      var ok = oks[i];
      if (ok.r.height > 56 || ok.r.width > 180) continue;
      for (var j = 0; j < cans.length; j++) {
        var c = cans[j];
        if (Math.abs(ok.cy - c.cy) > 40) continue;
        if (ok.cx >= c.cx - 2) continue;
        var score = Math.abs(ok.cy - c.cy) * 10 + (c.cx - ok.cx);
        if (score < bestScore) {
          bestScore = score;
          best = ok.el;
        }
      }
    }
    if (best) return climbToolbarBtn(best) || best;
    if (oks.length) {
      oks.sort(function (a, b) {
        return b.cy - a.cy;
      });
      return climbToolbarBtn(oks[0].el) || oks[0].el;
    }
    return null;
  }

  function saveConfirmStillOpen() {
    return !!findSaveConfirmRoot();
  }

  async function confirmSaveDialog() {
    var waitUntil = Date.now() + 3000;
    var appeared = null;
    while (Date.now() < waitUntil) {
      appeared = findSaveConfirmRoot();
      if (appeared) break;
      await sleep(150);
    }
    if (!appeared) return { ok: false, code: "save_confirm_not_found" };

    for (var n = 0; n < 2; n++) {
      var box = findSaveConfirmRoot();
      if (!box) return { ok: true };
      var okBtn = findConfirmButton(box) || findConfirmButton(document.body);
      if (!okBtn) return { ok: false, code: "save_confirm_btn_missing" };
      clickOnce(okBtn);
      await sleep(500);
      if (!saveConfirmStillOpen()) return { ok: true };
    }
    return {
      ok: !saveConfirmStillOpen(),
      code: saveConfirmStillOpen() ? "save_confirm_still_open" : undefined,
    };
  }

  function findDialogByNeedles(needles) {
    var root = document.body || document.documentElement;
    var all = root.querySelectorAll("div, span, p, td, li");
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (!visible(el)) continue;
      var t = normText(el.textContent || "");
      if (!t || t.length > 80) continue;
      var hit = false;
      for (var n = 0; n < needles.length; n++) {
        if (t.indexOf(needles[n]) >= 0) {
          hit = true;
          break;
        }
      }
      if (!hit) continue;
      var box = el;
      for (var up = 0; up < 8 && box; up++, box = box.parentElement) {
        if (!(box instanceof Element)) break;
        var br = box.getBoundingClientRect();
        if (br.width > 120 && br.width < 720 && br.height > 80 && br.height < 420) return box;
      }
      return el;
    }
    return null;
  }

  function findLoneConfirmIn(scope) {
    var oks = collectExactLabels(scope, "확인");
    if (!oks.length) return null;
    oks.sort(function (a, b) {
      return b.cy - a.cy;
    });
    return climbToolbarBtn(oks[0].el) || oks[0].el;
  }

  async function dismissSavedAlert() {
    var waitUntil = Date.now() + 3000;
    var box = null;
    while (Date.now() < waitUntil) {
      box = findDialogByNeedles(["저장했습니다", "저장하였습니다"]);
      if (box) break;
      await sleep(150);
    }
    if (!box) return { ok: true, skipped: true };
    for (var n = 0; n < 2; n++) {
      var cur = findDialogByNeedles(["저장했습니다", "저장하였습니다"]);
      if (!cur) return { ok: true };
      var okBtn = findLoneConfirmIn(cur) || findLoneConfirmIn(document.body);
      if (!okBtn) return { ok: false, code: "saved_alert_btn_missing" };
      clickOnce(okBtn);
      await sleep(500);
      if (!findDialogByNeedles(["저장했습니다", "저장하였습니다"])) return { ok: true };
    }
    return { ok: true };
  }

  async function saveDateAndConfirm() {
    var sv = clickSaveOnly();
    if (!sv.ok) return sv;
    await sleep(500);
    var q = await confirmSaveDialog();
    if (!q.ok) return q;
    await sleep(400);
    return dismissSavedAlert();
  }

  async function applyQueue(opts) {
    var items = ((opts && opts.items) || []).slice();
    var dryRun = !opts || opts.dryRun !== false;
    if (!items.length) return { ok: false, code: "empty_items" };
    items.sort(function (a, b) {
      return String(normalizeDate(a.date) || "").localeCompare(String(normalizeDate(b.date) || ""));
    });

    var leftover = findOpenPopupVisible();
    if (leftover) {
      var closer = findElementsByExactText(leftover, "닫기")[0] || findLabelHits(leftover, "닫기")[0];
      if (closer) clickOnce(closer);
      await sleep(400);
    }

    var filters = readFilters();
    var grid = null;
    for (var attempt = 0; attempt < 6; attempt++) {
      grid = findAttendanceGrid(document);
      if (grid) break;
      await sleep(400);
    }
    if (!grid) {
      return { ok: false, code: "grid_not_found", diag: gridDiag(document) };
    }

    var applied = 0;
    var lastDate = null;
    for (var row = 0; row < items.length; row++) {
      var item = items[row];
      var nextDate = normalizeDate(item.date);
      if (!dryRun && lastDate && nextDate && nextDate !== lastDate) {
        var midSave = await saveDateAndConfirm();
        if (!midSave.ok) {
          log(row, item.type || "?", "stop", midSave.code || "save_before_date_change");
          return { ok: false, code: midSave.code || "save_before_date_change", applied: applied, dryRun: false };
        }
        await sleep(700);
      }
      var newDate = !lastDate || !nextDate || nextDate !== lastDate;
      lastDate = nextDate || lastDate;
      var fm = await alignNeisDate(item, newDate);
      if (!fm.ok) {
        log(row, item.type || "?", "stop", fm.code);
        return { ok: false, code: fm.code, applied: applied, dryRun: dryRun };
      }
      grid = findAttendanceGrid(document) || grid;
      var hit = findRowByNumberName(grid, item.number, item.name);
      if (!hit) {
        log(row, item.type || "?", "stop", "row_not_found");
        return {
          ok: false,
          code: "row_not_found",
          applied: applied,
          dryRun: dryRun,
          diag: rowMatchDiag(document, grid, item.number, item.name),
        };
      }
      var closeHdrCx = null;
      if (grid.headerCenters && grid.col && grid.col.close != null && grid.headerCenters[grid.col.close] != null) {
        closeHdrCx = grid.headerCenters[grid.col.close];
      }
      var pop = await openClosePopup(hit.row, grid.col.close, hit.cells, closeHdrCx);
      if (!pop.ok) {
        log(row, item.type || "?", "stop", pop.code);
        return { ok: false, code: pop.code, applied: applied, dryRun: dryRun, diag: pop.diag };
      }
      var ap = await applyPopup(pop.popup, item);
      if (!ap.ok) {
        log(row, item.type || "?", "stop", ap.code);
        return { ok: false, code: ap.code, applied: applied, dryRun: dryRun, diag: ap.diag };
      }
      await sleep(500);
      var cp = clickPeriodCell(hit.row, grid, item.period, hit.cells, item);
      if (!cp.ok) {
        log(row, item.type || "?", "stop", cp.code);
        return { ok: false, code: cp.code, applied: applied, dryRun: dryRun, diag: cp.diag };
      }
      await sleep(500);
      var ver = verifyRow(hit.row, grid, item, hit.cells);
      if (!ver.ok) {
        // 넥사크로는 마감 글자가 늦게 바뀜. 적용까지 했으면 날짜 작업을 끝까지 하고 저장한다.
        if (dryRun || ver.code === "close_label_mismatch") {
          log(row, item.type || "?", "ok_verify_soft", ver.code);
          applied += 1;
          continue;
        }
        log(row, item.type || "?", "stop", ver.code);
        return { ok: false, code: ver.code, applied: applied, dryRun: dryRun };
      }
      log(row, item.type || "?", "ok");
      applied += 1;
    }

    if (dryRun) {
      console.info("[출결메이트]", "dryRun=true save_skipped");
      return { ok: true, applied: applied, dryRun: true, saved: false };
    }
    var sv = await saveDateAndConfirm();
    if (!sv.ok) return { ok: false, code: sv.code, applied: applied, dryRun: false, saved: false };
    console.info("[출결메이트]", "saved=true synced_not_set");
    return { ok: true, applied: applied, dryRun: false, saved: true };
  }

  chrome.runtime.onMessage.addListener(function (message, _sender, sendResponse) {
    if (!message || typeof message !== "object") {
      sendResponse({ ok: false, code: "bad_message" });
      return false;
    }
    if (message.type === "mate-ping") {
      sendResponse({ ok: true, ping: true });
      return false;
    }
    if (message.type === "apply-queue") {
      applyQueue({ items: message.items || [], dryRun: message.dryRun !== false })
        .then(function (res) {
          sendResponse(res);
        })
        .catch(function () {
          sendResponse({ ok: false, code: "apply_threw" });
        });
      return true;
    }
    return false;
  });
})();
