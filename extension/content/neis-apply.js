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
    if (!el) return false;
    el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    if (typeof el.click === "function") el.click();
    return true;
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

  function collectVisibleShortTexts(root) {
    var out = [];
    if (!root || !root.querySelectorAll) return out;
    var all = root.querySelectorAll("div, span, td, th, label, a, p, li, button, em, b, strong");
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (!visible(el)) continue;
      var full = normText(el.textContent);
      if (!full || full.length > 40) continue;
      var childSame = false;
      for (var c = 0; c < el.children.length; c++) {
        if (normText(el.children[c].textContent) === full) {
          childSame = true;
          break;
        }
      }
      if (childSame) continue;
      out.push(full);
    }
    return out;
  }

  function popupDiag(root) {
    var api = PA();
    var texts = collectVisibleShortTexts(root || document);
    var d = api
      ? api.popupDiagFromTexts(texts)
      : { titleHit: 0, illnessHit: 0, lateHit: 0, applyHit: 0, popupLike: 0, textCount: texts.length };
    d.dialogLike = countDialogLikeContainers(root || document);
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

  function climbPopupRoot(el) {
    if (!el) return null;
    var cur = el;
    for (var d = 0; d < 14 && cur; d++) {
      if (!(cur instanceof Element)) break;
      var hit =
        cur.closest &&
        cur.closest(
          "[role='dialog'], .ui-dialog, .modal, .popup, .layer, [class*='popup'], [class*='Popup'], [class*='layer'], [class*='Layer']",
        );
      if (hit && visible(hit)) return hit;
      cur = cur.parentElement;
    }
    // Nexacro: climb to a reasonably sized visible container with popup-like body
    cur = el;
    var best = null;
    for (var k = 0; k < 12 && cur && cur !== document.body; k++, cur = cur.parentElement) {
      if (!visible(cur)) continue;
      var r = cur.getBoundingClientRect();
      if (r.width < 160 || r.height < 80) continue;
      if (r.width > 900 || r.height > 700) continue;
      var blob = normText(cur.textContent);
      var api = PA();
      if (api && api.looksLikeClosePopupText(blob)) best = cur;
      else if (!best && blob.indexOf("적용") >= 0 && blob.indexOf("질병") >= 0) best = cur;
    }
    return best;
  }

  function findPopup() {
    var api = PA();
    var titleEls = [];
    var all = document.querySelectorAll("div, span, td, th, label, a, p, li, em, b, strong");
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (!visible(el)) continue;
      var full = normText(el.textContent);
      if (!full || full.length > 48) continue;
      var own = "";
      for (var t = 0; t < el.childNodes.length; t++) {
        if (el.childNodes[t].nodeType === Node.TEXT_NODE) own += el.childNodes[t].textContent || "";
      }
      own = normText(own);
      var cand = own || full;
      if (api ? api.isPopupTitleText(cand) : cand === "출결마감구분" || cand === "출결 구분 선택") {
        // prefer leaf-ish
        var childTitle = false;
        for (var c = 0; c < el.children.length; c++) {
          var ct = normText(el.children[c].textContent);
          if (api ? api.isPopupTitleText(ct) : ct === "출결마감구분") {
            childTitle = true;
            break;
          }
        }
        if (!childTitle) titleEls.push(el);
      }
    }
    for (var j = 0; j < titleEls.length; j++) {
      var root = climbPopupRoot(titleEls[j]);
      if (root && visible(root)) return root;
    }

    // Fallback: visible dialog-like with 질병+지각 (구분+종류)
    var containers = document.querySelectorAll(
      "div, [role='dialog'], section, aside, form, [class*='popup'], [class*='Popup'], [class*='layer']",
    );
    var best = null;
    var bestScore = -1;
    for (var u = 0; u < containers.length; u++) {
      var box = containers[u];
      if (!visible(box)) continue;
      var br = box.getBoundingClientRect();
      if (br.width < 180 || br.height < 100) continue;
      if (br.width > 920 || br.height > 720) continue;
      var blob = normText(box.textContent);
      if (blob.length > 4000) continue;
      if (!(api ? api.looksLikeClosePopupText(blob) : blob.indexOf("질병") >= 0 && blob.indexOf("지각") >= 0)) {
        continue;
      }
      var score = 0;
      if (blob.indexOf("적용") >= 0) score += 5;
      if (blob.indexOf("사유") >= 0) score += 2;
      if (blob.indexOf("출결마감구분") >= 0 || blob.indexOf("구분 선택") >= 0) score += 4;
      // prefer tighter containers
      score += Math.max(0, 40 - Math.floor(blob.length / 80));
      if (score > bestScore) {
        bestScore = score;
        best = box;
      }
    }
    return best;
  }

  /** 보이는 라벨 텍스트로 선택 (radio 없어도 클릭). */
  function selectByVisibleLabel(popup, labelText) {
    if (!popup || !labelText) return false;
    var want = normText(labelText);
    var els = findElementsByExactText(popup, want);
    if (!els.length) {
      // soft: short nodes starting with label
      var soft = [];
      var all = popup.querySelectorAll("div, span, td, th, label, a, p, li, em, b, strong");
      for (var i = 0; i < all.length; i++) {
        var el = all[i];
        if (!visible(el)) continue;
        var full = normText(el.textContent);
        if (full !== want && !(full.indexOf(want) === 0 && full.length <= want.length + 8)) continue;
        var childHit = false;
        for (var c = 0; c < el.children.length; c++) {
          var cf = normText(el.children[c].textContent);
          if (cf === want || (cf.indexOf(want) === 0 && cf.length <= want.length + 8)) {
            childHit = true;
            break;
          }
        }
        if (!childHit) soft.push(el);
      }
      els = soft;
    }
    for (var j = 0; j < els.length; j++) {
      var node = els[j];
      var lab = (node.closest && node.closest("label")) || node;
      var inp =
        (lab.querySelector && lab.querySelector("input[type='radio']")) ||
        (lab.htmlFor ? document.getElementById(lab.htmlFor) : null);
      if (!inp && lab.parentElement) {
        inp = lab.parentElement.querySelector("input[type='radio']");
      }
      // Nexacro: nearby radio / clickable contentsbox
      if (!inp) {
        var near = node.parentElement;
        for (var d = 0; d < 4 && near && !inp; d++, near = near.parentElement) {
          if (near.querySelector) inp = near.querySelector("input[type='radio']");
        }
      }
      if (inp) {
        try {
          inp.checked = true;
          inp.dispatchEvent(new Event("change", { bubbles: true }));
        } catch (e) {}
        clickEl(inp);
      }
      var clickTarget =
        node.closest("button, [role='button'], a, [onclick], [class*='contentsbox'], [class*='ContentsBox']") ||
        lab ||
        node;
      clickEl(clickTarget);
      clickEl(node);
      return true;
    }
    return false;
  }

  function fillReason(popup, reason) {
    var labels = findElementsByExactText(popup, "사유");
    if (!labels.length) {
      var soft = findLabelHits(popup, "사유");
      labels = soft;
    }
    for (var i = 0; i < labels.length; i++) {
      var box = labels[i].closest("tr, div, li, td, [class*='contentsbox']") || labels[i].parentElement;
      var inp =
        box &&
        box.querySelector(
          "input[type='text'], textarea, input:not([type]), input[type='search']",
        );
      if (inp && (visible(inp) || inp.type === "hidden")) {
        if (!visible(inp) && inp.type !== "hidden") continue;
        inp.focus();
        inp.value = reason || "";
        inp.dispatchEvent(new Event("input", { bubbles: true }));
        inp.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
      // Nexacro editable div
      var edit =
        box &&
        box.querySelector("[contenteditable='true'], [class*='edit'], input");
      if (edit && visible(edit)) {
        if (edit.tagName === "INPUT" || edit.tagName === "TEXTAREA") {
          edit.value = reason || "";
          edit.dispatchEvent(new Event("input", { bubbles: true }));
        } else {
          edit.textContent = reason || "";
          edit.dispatchEvent(new Event("input", { bubbles: true }));
        }
        return true;
      }
    }
    var fallback = popup.querySelector("input[type='text'], textarea");
    if (fallback && visible(fallback)) {
      fallback.value = reason || "";
      fallback.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    }
    return !(reason && String(reason).trim());
  }

  function findApplyControl(popup) {
    var api = PA();
    // exact 적용 via clickable helpers
    var btn = findClickableByText(popup, "적용");
    if (btn) {
      var lab = (btn.textContent || btn.value || "").replace(/\s+/g, " ").trim();
      if (api ? api.isApplyButtonText(lab) : lab === "적용") return btn;
    }
    var nodes = popup.querySelectorAll("div, span, a, button, input, li, td, th, label");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (!visible(el)) continue;
      var t = "";
      if (el.tagName === "INPUT") t = normText(el.value);
      else {
        var own = "";
        for (var n = 0; n < el.childNodes.length; n++) {
          if (el.childNodes[n].nodeType === Node.TEXT_NODE) own += el.childNodes[n].textContent || "";
        }
        t = normText(own) || normText(el.textContent);
        if (t.length > 8) continue;
      }
      if (api ? api.isApplyButtonText(t) : t === "적용") {
        if (api && api.isCloseAllButtonText(t)) continue;
        return el;
      }
    }
    return null;
  }

  function closeClickTargets(cell) {
    var out = [];
    if (!cell) return out;
    function push(el) {
      if (!el || !(el instanceof Element)) return;
      if (out.indexOf(el) >= 0) return;
      out.push(el);
    }
    push(cell);
    var inners = cell.querySelectorAll(
      "a, button, input, [onclick], [role='button'], [class*='contentsbox'], [class*='ContentsBox'], [class*='cell'], div, span",
    );
    for (var i = 0; i < inners.length; i++) {
      var el = inners[i];
      if (!visible(el)) continue;
      var r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      if (r.width > 240 || r.height > 80) continue;
      push(el);
    }
    // prefer smaller inner clickables first after cell itself
    out.sort(function (a, b) {
      if (a === cell) return -1;
      if (b === cell) return 1;
      var ar = a.getBoundingClientRect();
      var br = b.getBoundingClientRect();
      return ar.width * ar.height - br.width * br.height;
    });
    // cell first again
    if (out[0] !== cell) {
      out = [cell].concat(out.filter(function (x) { return x !== cell; }));
    }
    return out;
  }

  async function openClosePopup(row, closeIdx, cellsOpt) {
    var cells = cellsOpt || rowCells(row);
    var cell = cells[closeIdx];
    if (!cell) return { ok: false, code: "no_close_cell", diag: popupDiag(document) };
    var targets = closeClickTargets(cell);
    var popup = null;
    for (var attempt = 0; attempt < Math.max(3, targets.length); attempt++) {
      var target = targets[attempt % targets.length];
      clickEl(target);
      for (var w = 0; w < 5; w++) {
        await sleep(180);
        popup = findPopup();
        if (popup) break;
      }
      if (popup) break;
    }
    if (!popup) {
      return { ok: false, code: "popup_not_found", diag: popupDiag(document) };
    }
    return { ok: true, popup: popup };
  }

  async function applyPopup(popup, item) {
    var catLabel = CATEGORY_KO[item.category];
    var typeLabel = TYPE_KO[item.type];
    if (!selectByVisibleLabel(popup, catLabel)) {
      return { ok: false, code: "category_not_found", diag: popupDiag(popup) };
    }
    await sleep(140);
    if (!selectByVisibleLabel(popup, typeLabel)) {
      return { ok: false, code: "type_not_found", diag: popupDiag(popup) };
    }
    await sleep(140);
    if (item.category === "other" || (item.reason && String(item.reason).trim())) {
      if (!fillReason(popup, item.reason || "")) {
        return { ok: false, code: "reason_field_missing", diag: popupDiag(popup) };
      }
    }
    var applyBtn = findApplyControl(popup);
    if (!applyBtn) {
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

  function clickPeriodCell(row, grid, period, cellsOpt) {
    var idx = grid.periodCols[period];
    var cells = cellsOpt || rowCells(row);
    var cell = idx != null ? cells[idx] : null;

    // spatial re-snap if missing
    if (!cell && grid.kind === "spatial" && grid.headerCenters && grid.periodCols[period] != null) {
      var center = grid.headerCenters[grid.periodCols[period]];
      var rr = row.getBoundingClientRect ? row.getBoundingClientRect() : null;
      var rowTop = rr ? rr.top : 0;
      var rowBottom = rr ? rr.bottom : rowTop + 24;
      if (cellsOpt && cellsOpt.length) {
        for (var i = 0; i < cellsOpt.length; i++) {
          if (!cellsOpt[i] || !cellsOpt[i].getBoundingClientRect) continue;
          var cr = cellsOpt[i].getBoundingClientRect();
          rowTop = Math.min(rowTop || cr.top, cr.top);
          rowBottom = Math.max(rowBottom || cr.bottom, cr.bottom);
        }
      }
      cell = findCellNear(
        grid.root || document,
        center,
        rowTop,
        rowBottom,
        grid.headerBottom || 0,
      );
    }

    if (idx == null) {
      return { ok: false, code: "period_col_missing", diag: periodCellDiag(grid, period, cells) };
    }
    if (!cell) {
      return { ok: false, code: "period_cell_missing", diag: periodCellDiag(grid, period, cells) };
    }
    var target =
      cell.querySelector(
        "a, button, input, [onclick], [class*='contentsbox'], [class*='ContentsBox'], div, span",
      ) || cell;
    clickEl(target);
    return { ok: true };
  }

  function verifyRow(row, grid, item, cellsOpt) {
    var cells = cellsOpt || rowCells(row);
    var wantClose = closeLabel(item.category, item.type);
    var closeText = cellLabel(cells[grid.col.close]);
    var catKo = CATEGORY_KO[item.category] || "";
    var typeKo = TYPE_KO[item.type] || "";
    var closeOk =
      closeText.indexOf(wantClose) >= 0 ||
      (catKo && typeKo && closeText.indexOf(catKo) >= 0 && closeText.indexOf(typeKo) >= 0);
    if (!closeOk) return { ok: false, code: "close_label_mismatch" };
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


  function clickSaveOnly() {
    var btn = findClickableByText(document, "저장");
    if (!btn) return { ok: false, code: "save_not_found" };
    var label = (btn.textContent || btn.value || "").replace(/\s+/g, " ").trim();
    if (label !== "저장") return { ok: false, code: "save_ambiguous" };
    // 출결마감 문자열이 섞인 버튼 거부
    if (label.indexOf("출결마감") >= 0) return { ok: false, code: "refused_close_button" };
    clickEl(btn);
    return { ok: true };
  }

  async function applyQueue(opts) {
    var items = (opts && opts.items) || [];
    var dryRun = !opts || opts.dryRun !== false;
    if (!items.length) return { ok: false, code: "empty_items" };

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
    for (var row = 0; row < items.length; row++) {
      var item = items[row];
      var fm = filtersMatchItem(filters, item);
      if (!fm.ok) {
        log(row, item.type || "?", "stop", fm.code);
        return { ok: false, code: fm.code, applied: applied, dryRun: dryRun };
      }
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
      var pop = await openClosePopup(hit.row, grid.col.close, hit.cells);
      if (!pop.ok) {
        log(row, item.type || "?", "stop", pop.code);
        return { ok: false, code: pop.code, applied: applied, dryRun: dryRun, diag: pop.diag };
      }
      var ap = await applyPopup(pop.popup, item);
      if (!ap.ok) {
        log(row, item.type || "?", "stop", ap.code);
        return { ok: false, code: ap.code, applied: applied, dryRun: dryRun, diag: ap.diag };
      }
      var cp = clickPeriodCell(hit.row, grid, item.period, hit.cells);
      if (!cp.ok) {
        log(row, item.type || "?", "stop", cp.code);
        return { ok: false, code: cp.code, applied: applied, dryRun: dryRun, diag: cp.diag };
      }
      await sleep(500);
      var ver = verifyRow(hit.row, grid, item, hit.cells);
      if (!ver.ok) {
        // dryRun: popup→적용→P칸까지 왔으면 표시 검증은 soft (Nexacro 갱신 지연/표기 차이)
        if (dryRun) {
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
    var sv = clickSaveOnly();
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
