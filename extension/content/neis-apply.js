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
    if (!s) return "";
    const m = String(s).match(/(\d{4})\D(\d{1,2})\D(\d{1,2})/);
    if (!m) return String(s).trim();
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

  function findRowByNumberName(grid, number, name) {
    var wantNum = String(number).trim();
    var wantName = String(name).trim();
    if (grid.kind === "spatial" && grid.headerCenters) {
      var root = grid.root || document;
      var numCenter = grid.headerCenters[grid.col.number];
      var candidates = findLabelHits(root, wantNum);
      if (!candidates.length) {
        // 숫자만 있는 칸
        var all = root.querySelectorAll("*");
        for (var i = 0; i < all.length; i++) {
          var el = all[i];
          if (!visible(el)) continue;
          if (normText(el.textContent) === wantNum) candidates.push(el);
        }
      }
      for (var c = 0; c < candidates.length; c++) {
        var eln = candidates[c];
        var rn = eln.getBoundingClientRect();
        if (rn.bottom <= grid.headerBottom + 2) continue;
        var cx = rn.left + rn.width / 2;
        if (Math.abs(cx - numCenter) > 48) continue;
        var rowTop = rn.top;
        var rowBottom = rn.bottom;
        var cells = [];
        for (var h = 0; h < grid.headerCenters.length; h++) {
          cells.push(findCellNear(root, grid.headerCenters[h], rowTop, rowBottom, grid.headerBottom));
        }
        if (!cells[grid.col.number] || !cells[grid.col.name]) continue;
        var numText = cellLabel(cells[grid.col.number]);
        var nameText = cellLabel(cells[grid.col.name]);
        if (numText === wantNum && nameText === wantName) {
          return { row: eln, rowIndex: c, cells: cells };
        }
      }
      return null;
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
        if (numText === wantNum && nameText === wantName) {
          return { row: kids[i], rowIndex: i, cells: cells };
        }
      }
      return null;
    }
    var body = grid.bodyTable || grid.table;
    var start = grid.dataStart != null ? grid.dataStart : grid.headerIdx + 1;
    for (var r = start; r < body.rows.length; r++) {
      var row = body.rows[r];
      var cells2 = rowCells(row);
      if (cells2.length <= Math.max(grid.col.number, grid.col.name)) continue;
      var numText2 = cellLabel(cells2[grid.col.number]);
      var nameText2 = cellLabel(cells2[grid.col.name]);
      if (numText2 === "번호" || nameText2 === "성명") continue;
      if (numText2 === wantNum && nameText2 === wantName) {
        return { row: row, rowIndex: r, cells: cells2 };
      }
    }
    return null;
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
    var hits = findLabelHits(document, labelText).filter(function (el) {
      return labelTextMatches(normText(el.textContent), labelText);
    });
    if (hits.length) return hits;
    var exact = findElementsByExactText(document, labelText);
    if (exact.length) return exact;
    // 짧은 텍스트에 라벨이 앞에 붙는 경우
    var soft = [];
    var all = document.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (!visible(el)) continue;
      var full = normText(el.textContent);
      if (!labelTextMatches(full, labelText)) continue;
      if (full.length > labelText.length + 3) continue;
      soft.push(el);
    }
    return soft;
  }

  /** 라벨 오른쪽·같은 줄의 콤보/입력/짧은 표시 텍스트 (넥사크로 Combo 포함). */
  function readValueRightOf(lab) {
    var r = lab.getBoundingClientRect();
    var best = "";
    var bestScore = 1e15;
    var nodes = document.querySelectorAll("input, select, textarea, div, span");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (!visible(el)) continue;
      if (el === lab || lab.contains(el) || el.contains(lab)) continue;
      var er = el.getBoundingClientRect();
      if (er.left < r.right - 8) continue;
      if (er.left - r.right > 420) continue;
      if (Math.abs(er.top - r.top) > 28) continue;
      if (er.width > 360 || er.height > 60) continue;

      var val = controlValue(el);
      if (!val) {
        var tx = normText(el.textContent);
        if (!tx || tx.length > 24) continue;
        if (tx === normText(lab.textContent)) continue;
        // 자식에 더 짧은 동일 텍스트 있으면 스킵(컨테이너)
        var childShorter = false;
        for (var c = 0; c < el.children.length; c++) {
          var ct = normText(el.children[c].textContent);
          if (ct && ct.length < tx.length && ct.length <= 24) {
            childShorter = true;
            break;
          }
        }
        if (childShorter) continue;
        val = tx;
      }
      if (!val) continue;
      var score = er.left - r.right + Math.abs(er.top - r.top) * 2;
      if (score < bestScore) {
        bestScore = score;
        best = val;
      }
    }
    return best;
  }

  function readNearbyValue(labelText) {
    var labels = exactLabelEls(labelText);
    for (var i = 0; i < labels.length; i++) {
      var lab = labels[i];
      var climb = lab;
      for (var d = 0; d < 6 && climb; d++, climb = climb.parentElement) {
        if (!climb.querySelector) continue;
        var sel = climb.querySelector("select");
        if (sel && visible(sel)) {
          var sv = controlValue(sel);
          if (sv) return sv;
        }
        var inputs = climb.querySelectorAll(
          "input:not([type='hidden']):not([type='button']):not([type='submit']):not([type='checkbox']):not([type='radio'])",
        );
        for (var u = 0; u < inputs.length; u++) {
          if (!visible(inputs[u])) continue;
          // 라벨 왼쪽 입력은 다른 필드일 수 있음 → 라벨 오른쪽만
          var ir = inputs[u].getBoundingClientRect();
          var lr = lab.getBoundingClientRect();
          if (ir.left + ir.width / 2 < lr.left) continue;
          var iv = controlValue(inputs[u]);
          if (iv) return iv;
        }
      }
      var wrap = lab.closest("td, th, label, div, span, li") || lab.parentElement;
      if (wrap) {
        var sib = wrap.nextElementSibling;
        for (var k = 0; k < 4 && sib; k++, sib = sib.nextElementSibling) {
          if (sib.tagName === "SELECT" && visible(sib)) {
            var s2 = controlValue(sib);
            if (s2) return s2;
          }
          var nested = sib.querySelector && sib.querySelector("select, input:not([type='hidden']):not([type='button'])");
          if (nested && visible(nested)) {
            var nv = controlValue(nested);
            if (nv) return nv;
          }
          var st = normText(sib.textContent);
          if (st && st.length <= 24 && st !== labelText) return st;
        }
      }
      var right = readValueRightOf(lab);
      if (right) return right;
      var near = readValueNearAny(lab, labelText);
      if (near) return near;
    }
    return "";
  }

  /** 라벨 기준 전방향 근접 값(위·아래·오른쪽). 숨은 input value도 허용. */
  function readValueNearAny(lab, labelText) {
    var r = lab.getBoundingClientRect();
    var cx = (r.left + r.right) / 2;
    var cy = (r.top + r.bottom) / 2;
    var best = "";
    var bestScore = 1e15;
    var nodes = document.querySelectorAll("input, select, textarea, div, span");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el === lab || lab.contains(el)) continue;
      var er = el.getBoundingClientRect();
      // hidden input: rect 0이어도 value 사용
      var isHiddenInp =
        el.tagName === "INPUT" && (el.type === "hidden" || !visible(el));
      if (!isHiddenInp && !visible(el)) continue;
      if (!isHiddenInp) {
        if (er.width > 400 || er.height > 80) continue;
        var dx = (er.left + er.right) / 2 - cx;
        var dy = (er.top + er.bottom) / 2 - cy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 240) continue;
      } else {
        // 숨은 입력은 조상 근접만
        if (!lab.parentElement || !lab.parentElement.contains(el)) {
          var pr = (el.parentElement && el.parentElement.getBoundingClientRect()) || er;
          var dxh = (pr.left + pr.right) / 2 - cx;
          var dyh = (pr.top + pr.bottom) / 2 - cy;
          if (Math.sqrt(dxh * dxh + dyh * dyh) > 280) continue;
        }
      }
      var val = controlValue(el);
      if (!val && !isHiddenInp) {
        var tx = normText(el.textContent);
        if (!tx || tx.length > 28) continue;
        if (labelTextMatches(tx, labelText) || tx === labelText) continue;
        var childShorter = false;
        for (var c = 0; c < el.children.length; c++) {
          var ct = normText(el.children[c].textContent);
          if (ct && ct.length < tx.length && ct.length <= 28) {
            childShorter = true;
            break;
          }
        }
        if (childShorter) continue;
        val = tx;
      }
      if (!val) continue;
      var score;
      if (isHiddenInp) score = 50;
      else {
        var er2 = el.getBoundingClientRect();
        var ddx = (er2.left + er2.right) / 2 - cx;
        var ddy = (er2.top + er2.bottom) / 2 - cy;
        score = Math.sqrt(ddx * ddx + ddy * ddy);
        if (ddx > 0) score *= 0.7; // 오른쪽 가산
      }
      if (score < bestScore) {
        bestScore = score;
        best = val;
      }
    }
    return best;
  }

  /** 화면에 보이는 텍스트 순서(넥사크로 콤보 DOM 우회). */
  function readFiltersFromInnerText() {
    var text = normText(
      (document.body && document.body.innerText) ||
        (document.documentElement && document.documentElement.innerText) ||
        "",
    );
    var out = { year: "", grade: "", class: "", date: "" };
    var iY = text.indexOf("학년도");
    if (iY >= 0) {
      var ys = text.slice(iY + 3, iY + 48);
      var ym = ys.match(/(?:19|20)\d{2}/);
      if (ym) out.year = ym[0];
    }
    var gm = text.match(/학년도[\s\S]{0,48}?학년\s*[:：]?\s*(\d{1,2})/);
    if (gm) out.grade = gm[1];
    var cm = text.match(/반\s*[:：]?\s*(\d{1,2})/);
    if (cm) out.class = cm[1];
    var dm = text.match(/일자\s*[:：]?\s*(\d{4}\D{1,4}\d{1,2}\D{1,4}\d{1,2})/);
    if (dm) out.date = dm[1];
    return out;
  }

  function parseYear(raw) {
    var m = String(raw || "").match(/(?:19|20)\d{2}/);
    return m ? Number(m[0]) : null;
  }

  function parseIntLoose(raw) {
    var m = String(raw || "").match(/\d+/);
    return m ? Number(m[0]) : null;
  }

  function readFilters() {
    var yearRaw = readNearbyValue("학년도");
    var gradeRaw = readNearbyValue("학년");
    var classRaw = readNearbyValue("반");
    var dateRaw = readNearbyValue("일자");
    var soft = readFiltersFromInnerText();
    var src = "dom";
    if (!parseYear(yearRaw) && soft.year) {
      yearRaw = soft.year;
      src = "innerText";
    }
    if (!parseIntLoose(gradeRaw) && soft.grade) {
      gradeRaw = soft.grade;
      if (src === "dom") src = "innerText";
      else src = "mixed";
    }
    if (!parseIntLoose(classRaw) && soft.class) {
      classRaw = soft.class;
      if (src === "dom") src = "innerText";
      else if (src !== "innerText") src = "mixed";
    }
    if (!normalizeDate(dateRaw) && soft.date) {
      dateRaw = soft.date;
      if (src === "dom") src = "innerText";
      else if (src !== "innerText") src = "mixed";
    }
    // 학년 라벨이 학년도에 흡수된 경우: DOM 학년 재시도 없이 soft만
    return {
      year: parseYear(yearRaw),
      grade: parseIntLoose(gradeRaw),
      class: parseIntLoose(classRaw),
      date: normalizeDate(dateRaw),
      _raw: {
        year: String(yearRaw || "").slice(0, 24),
        grade: String(gradeRaw || "").slice(0, 12),
        class: String(classRaw || "").slice(0, 12),
        date: String(dateRaw || "").slice(0, 24),
        softYear: String(soft.year || "").slice(0, 8),
        filterSrc: src,
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
      filterSrc: filters._raw && filters._raw.filterSrc,
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

  function findPopup() {
    var titles = findElementsByExactText(document, "출결마감구분").concat(
      findElementsByExactText(document, "출결 구분 선택"),
    );
    for (var i = 0; i < titles.length; i++) {
      var root =
        titles[i].closest("[role='dialog'], .ui-dialog, .modal, .popup, .layer") ||
        titles[i].closest("div");
      if (root && visible(root)) return root;
    }
    return null;
  }

  function selectRadioIn(popup, labelText) {
    var els = findElementsByExactText(popup, labelText);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var lab = el.closest("label") || el;
      var inp =
        (lab.querySelector && lab.querySelector("input[type='radio']")) ||
        (lab.htmlFor ? popup.querySelector("#" + lab.htmlFor) : null);
      if (!inp && lab.parentElement) inp = lab.parentElement.querySelector("input[type='radio']");
      if (inp && visible(inp)) {
        inp.checked = true;
        inp.dispatchEvent(new Event("change", { bubbles: true }));
        clickEl(inp);
        clickEl(lab);
        return true;
      }
      clickEl(el);
      return true;
    }
    return false;
  }

  function fillReason(popup, reason) {
    var labels = findElementsByExactText(popup, "사유");
    for (var i = 0; i < labels.length; i++) {
      var box = labels[i].closest("tr, div, li, td") || labels[i].parentElement;
      var inp = box && box.querySelector("input[type='text'], textarea, input:not([type])");
      if (inp && visible(inp)) {
        inp.focus();
        inp.value = reason || "";
        inp.dispatchEvent(new Event("input", { bubbles: true }));
        inp.dispatchEvent(new Event("change", { bubbles: true }));
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

  async function openClosePopup(row, closeIdx, cellsOpt) {
    var cells = cellsOpt || rowCells(row);
    var cell = cells[closeIdx];
    if (!cell) return { ok: false, code: "no_close_cell" };
    var target = cell.querySelector("a, button, input, [onclick], div, span") || cell;
    clickEl(target);
    await sleep(450);
    var popup = findPopup();
    if (!popup) return { ok: false, code: "popup_not_found" };
    return { ok: true, popup: popup };
  }

  async function applyPopup(popup, item) {
    if (!selectRadioIn(popup, CATEGORY_KO[item.category])) return { ok: false, code: "category_not_found" };
    await sleep(120);
    if (!selectRadioIn(popup, TYPE_KO[item.type])) return { ok: false, code: "type_not_found" };
    await sleep(120);
    if (item.category === "other" || (item.reason && String(item.reason).trim())) {
      if (!fillReason(popup, item.reason || "")) return { ok: false, code: "reason_field_missing" };
    }
    var applyBtn = findClickableByText(popup, "적용");
    if (!applyBtn) return { ok: false, code: "apply_not_found" };
    clickEl(applyBtn);
    await sleep(450);
    return { ok: true };
  }

  function clickPeriodCell(row, grid, period, cellsOpt) {
    var idx = grid.periodCols[period];
    if (idx == null) return { ok: false, code: "period_col_missing" };
    var cells = cellsOpt || rowCells(row);
    var cell = cells[idx];
    if (!cell) return { ok: false, code: "period_cell_missing" };
    var target = cell.querySelector("a, button, input, [onclick], div, span") || cell;
    clickEl(target);
    return { ok: true };
  }

    function verifyRow(row, grid, item, cellsOpt) {
    var cells = cellsOpt || rowCells(row);
    var wantClose = closeLabel(item.category, item.type);
    var closeText = cellLabel(cells[grid.col.close]);
    if (closeText.indexOf(wantClose) < 0) return { ok: false, code: "close_label_mismatch" };
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
        return { ok: false, code: "row_not_found", applied: applied, dryRun: dryRun };
      }
      var pop = await openClosePopup(hit.row, grid.col.close, hit.cells);
      if (!pop.ok) {
        log(row, item.type || "?", "stop", pop.code);
        return { ok: false, code: pop.code, applied: applied, dryRun: dryRun };
      }
      var ap = await applyPopup(pop.popup, item);
      if (!ap.ok) {
        log(row, item.type || "?", "stop", ap.code);
        return { ok: false, code: ap.code, applied: applied, dryRun: dryRun };
      }
      var cp = clickPeriodCell(hit.row, grid, item.period, hit.cells);
      if (!cp.ok) {
        log(row, item.type || "?", "stop", cp.code);
        return { ok: false, code: cp.code, applied: applied, dryRun: dryRun };
      }
      await sleep(500);
      var ver = verifyRow(hit.row, grid, item, hit.cells);
      if (!ver.ok) {
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
