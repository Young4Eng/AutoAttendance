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

  function findElementsByExactText(root, text) {
    const out = [];
    function walk(node) {
      if (!node || node.nodeType !== Node.ELEMENT_NODE) return;
      const el = node;
      if (el.tagName === "SCRIPT" || el.tagName === "STYLE") return;
      var own = "";
      for (var i = 0; i < el.childNodes.length; i++) {
        var n = el.childNodes[i];
        if (n.nodeType === Node.TEXT_NODE) own += (n.textContent || "").trim();
      }
      if (own === text) out.push(el);
      for (var j = 0; j < el.children.length; j++) walk(el.children[j]);
    }
    walk(root);
    return out.filter(visible);
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
    return ((cell && cell.textContent) || "").replace(/\s+/g, " ").trim();
  }

  function parseHeaderCells(cells) {
    var texts = [];
    for (var c = 0; c < cells.length; c++) texts.push(cellLabel(cells[c]));
    var idxNum = -1, idxName = -1, idxClose = -1;
    for (var h = 0; h < texts.length; h++) {
      var tx = texts[h];
      if (idxNum < 0 && (tx === "번호" || tx.indexOf("번호") === 0)) idxNum = h;
      if (idxName < 0 && (tx === "성명" || tx.indexOf("성명") === 0)) idxName = h;
      if (idxClose < 0 && (tx === "마감" || tx.indexOf("마감") === 0)) idxClose = h;
    }
    if (idxNum < 0 || idxName < 0 || idxClose < 0) return null;
    var col = { number: idxNum, name: idxName, close: idxClose };
    var periodCols = {};
    var periodCount = 0;
    for (var p = 0; p < texts.length; p++) {
      var tx = texts[p];
      if (tx === "조회" || tx.indexOf("조회") === 0) col.morning = p;
      if (tx === "종례" || tx.indexOf("종례") === 0) col.afternoon = p;
      if (tx === "사유" || tx.indexOf("사유") === 0) col.reason = p;
      var pm = tx.match(/^(\d+)\s*교시/);
      if (pm) {
        periodCols[Number(pm[1])] = p;
        periodCount = Math.max(periodCount, Number(pm[1]));
      }
    }
    if (periodCount === 0) return null;
    return { col: col, periodCols: periodCols, periodCount: periodCount, colCount: cells.length };
  }

  /**
   * 나이스는 헤더 테이블 / 본문 테이블이 갈라진 경우가 많음.
   * 같은 테이블에 헤더+데이터가 있으면 그걸 쓰고, 없으면 헤더 맵 + 다른 본문 테이블.
   */
  function findAttendanceGrid(root) {
    var tables = Array.prototype.slice.call(root.querySelectorAll("table")).filter(visible);
    var headerMap = null;
    var headerTable = null;
    var headerIdx = -1;

    for (var t = 0; t < tables.length; t++) {
      var table = tables[t];
      var rows = table.rows;
      if (!rows || !rows.length) continue;
      var limit = Math.min(rows.length, 12);
      for (var i = 0; i < limit; i++) {
        var parsed = parseHeaderCells(rows[i].cells);
        if (!parsed) continue;
        headerMap = parsed;
        headerTable = table;
        headerIdx = i;
        // 같은 테이블에 데이터 행이 있으면 바로 사용
        if (rows.length > i + 1) {
          return {
            table: table,
            bodyTable: table,
            headerIdx: i,
            col: parsed.col,
            periodCols: parsed.periodCols,
            periodCount: parsed.periodCount,
          };
        }
        break;
      }
      if (headerMap) break;
    }
    if (!headerMap) return null;

    // 본문만 있는 테이블: 열 수가 비슷하고 숫자·이름이 있는 행
    var best = null;
    for (var u = 0; u < tables.length; u++) {
      var bt = tables[u];
      if (bt === headerTable && bt.rows.length <= headerIdx + 1) continue;
      if (!bt.rows || bt.rows.length < 1) continue;
      var sample = bt.rows[0].cells;
      if (!sample || sample.length < headerMap.colCount - 2) continue;
      var dataStart = bt === headerTable ? headerIdx + 1 : 0;
      if (bt.rows.length <= dataStart) continue;
      var score = bt.rows.length;
      if (!best || score > best.score) {
        best = { table: bt, dataStart: dataStart, score: score };
      }
    }
    if (!best) return null;
    return {
      table: best.table,
      bodyTable: best.table,
      headerIdx: best.dataStart - 1,
      dataStart: best.dataStart,
      col: headerMap.col,
      periodCols: headerMap.periodCols,
      periodCount: headerMap.periodCount,
    };
  }

  function findRowByNumberName(grid, number, name) {
    var wantNum = String(number).trim();
    var wantName = String(name).trim();
    var body = grid.bodyTable || grid.table;
    var start = grid.dataStart != null ? grid.dataStart : grid.headerIdx + 1;
    for (var i = start; i < body.rows.length; i++) {
      var row = body.rows[i];
      if (!row.cells || row.cells.length <= Math.max(grid.col.number, grid.col.name)) continue;
      var numText = cellLabel(row.cells[grid.col.number]);
      var nameText = cellLabel(row.cells[grid.col.name]);
      // 헤더 잔상 스킵
      if (numText === "번호" || nameText === "성명") continue;
      if (numText === wantNum && nameText === wantName) return { row: row, rowIndex: i };
    }
    return null;
  }

  function readNearbyValue(labelText) {
    var labels = findElementsByExactText(document, labelText);
    for (var i = 0; i < labels.length; i++) {
      var lab = labels[i];
      var wrap = lab.closest("td, th, label, div, span, li") || lab.parentElement;
      if (!wrap) continue;
      var box = wrap.parentElement || wrap;
      var sel = box.querySelector("select");
      if (sel && visible(sel)) {
        return (sel.options[sel.selectedIndex] && sel.options[sel.selectedIndex].text || sel.value || "").trim();
      }
      var inp = box.querySelector("input:not([type='hidden']):not([type='button']):not([type='submit'])");
      if (inp && visible(inp)) return (inp.value || "").trim();
      var sib = wrap.nextElementSibling;
      for (var k = 0; k < 3 && sib; k++, sib = sib.nextElementSibling) {
        var s2 = sib.querySelector && sib.querySelector("select");
        if (sib.tagName === "SELECT") s2 = sib;
        if (s2 && visible(s2)) {
          return (s2.options[s2.selectedIndex] && s2.options[s2.selectedIndex].text || s2.value || "").trim();
        }
        var i2 = sib.querySelector && sib.querySelector("input:not([type='hidden'])");
        if (i2 && visible(i2)) return (i2.value || "").trim();
      }
    }
    return "";
  }

  function readFilters() {
    var yearRaw = readNearbyValue("학년도");
    var gradeRaw = readNearbyValue("학년");
    var classRaw = readNearbyValue("반");
    var dateRaw = readNearbyValue("일자");
    return {
      year: Number((String(yearRaw).match(/\d{4}/) || [])[0] || NaN),
      grade: Number((String(gradeRaw).match(/\d+/) || [])[0] || NaN),
      class: Number((String(classRaw).match(/\d+/) || [])[0] || NaN),
      date: normalizeDate(dateRaw),
    };
  }

  function filtersMatchItem(filters, item) {
    if (filters.year !== item.year) return { ok: false, code: "year_mismatch" };
    if (filters.grade !== item.grade) return { ok: false, code: "grade_mismatch" };
    if (filters.class !== item.class) return { ok: false, code: "class_mismatch" };
    if (filters.date !== item.date) return { ok: false, code: "date_mismatch" };
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

  async function openClosePopup(row, closeIdx) {
    var cell = row.cells[closeIdx];
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

  function clickPeriodCell(row, grid, period) {
    var idx = grid.periodCols[period];
    if (idx == null) return { ok: false, code: "period_col_missing" };
    var cell = row.cells[idx];
    if (!cell) return { ok: false, code: "period_cell_missing" };
    var target = cell.querySelector("a, button, input, [onclick], div, span") || cell;
    clickEl(target);
    return { ok: true };
  }

  function hasSlash(cell) {
    return cellText(cell).indexOf("/") >= 0;
  }

  function verifyRow(row, grid, item) {
    var wantClose = closeLabel(item.category, item.type);
    var closeText = cellText(row.cells[grid.col.close]);
    if (closeText.indexOf(wantClose) < 0) return { ok: false, code: "close_label_mismatch" };
    var expect = expectedSlashMap(item.type, item.period, grid.periodCount);
    function check(cell, should) {
      if (!cell) return !should;
      var t = cellText(cell);
      var slash = t.indexOf("/") >= 0;
      if (should) return slash;
      return !slash || t.indexOf("미마감") >= 0;
    }
    if (grid.col.morning != null && !check(row.cells[grid.col.morning], expect.morning)) {
      return { ok: false, code: "slash_morning" };
    }
    for (var p = 1; p <= grid.periodCount; p++) {
      var idx = grid.periodCols[p];
      if (idx == null) continue;
      if (!check(row.cells[idx], expect["period:" + p])) {
        return { ok: false, code: "slash_period_" + p };
      }
    }
    if (grid.col.afternoon != null && !check(row.cells[grid.col.afternoon], expect.afternoon)) {
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
    var grid = findAttendanceGrid(document);
    if (!grid) return { ok: false, code: "grid_not_found" };

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
      var pop = await openClosePopup(hit.row, grid.col.close);
      if (!pop.ok) {
        log(row, item.type || "?", "stop", pop.code);
        return { ok: false, code: pop.code, applied: applied, dryRun: dryRun };
      }
      var ap = await applyPopup(pop.popup, item);
      if (!ap.ok) {
        log(row, item.type || "?", "stop", ap.code);
        return { ok: false, code: ap.code, applied: applied, dryRun: dryRun };
      }
      var cp = clickPeriodCell(hit.row, grid, item.period);
      if (!cp.ok) {
        log(row, item.type || "?", "stop", cp.code);
        return { ok: false, code: cp.code, applied: applied, dryRun: dryRun };
      }
      await sleep(500);
      var ver = verifyRow(hit.row, grid, item);
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
