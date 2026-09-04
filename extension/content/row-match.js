/**
 * Nexacro류(tables=0) 행 매칭 순수 헬퍼.
 * DOM 없음 — 좌표·텍스트 레코드만. 출석번호≠행 순번.
 */
(function (g) {
  if (g.__chulgyeolMateRowMatch) return;
  g.__chulgyeolMateRowMatch = true;

  var BAND_TOL_DEFAULT = 14;
  var BAND_TOL_WIDE = 28;
  var CENTER_SNAP_PX = 56;

  function normText(s) {
    return String(s || "")
      .replace(/[\u200b-\u200d\ufeff]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function sameBandY(y1, y2, tol) {
    if (y1 == null || y2 == null) return false;
    return Math.abs(Number(y1) - Number(y2)) <= (tol == null ? BAND_TOL_DEFAULT : tol);
  }

  /** 출석번호 칸: 1~3자리 숫자만. 빈 칸·헤더 제외. */
  function isAttendanceNumberText(text) {
    return /^\d{1,3}$/.test(normText(text));
  }

  function leafY(leaf) {
    if (!leaf) return null;
    if (leaf.y != null) return Number(leaf.y);
    if (leaf.top != null && leaf.bottom != null) return (Number(leaf.top) + Number(leaf.bottom)) / 2;
    if (leaf.top != null) return Number(leaf.top);
    return null;
  }

  function leafX(leaf) {
    if (!leaf) return 0;
    if (leaf.x != null) return Number(leaf.x);
    if (leaf.left != null && leaf.right != null) return (Number(leaf.left) + Number(leaf.right)) / 2;
    if (leaf.left != null) return Number(leaf.left);
    return 0;
  }

  /**
   * 같은 수평 밴드에서 wantNum + wantName 쌍.
   * leaves: [{ text, x, y|top, ... }]
   * 행 순번을 번호로 쓰지 않음. 빈 번호 텍스트는 후보가 될 수 없음.
   */
  function findNumberNamePairOnBand(leaves, wantNum, wantName, bandTol) {
    var num = normText(wantNum);
    var name = normText(wantName);
    if (!num || !name) return null;
    if (!isAttendanceNumberText(num)) return null;
    var tol = bandTol == null ? BAND_TOL_DEFAULT : bandTol;
    var list = leaves || [];
    var numIdxs = [];
    for (var i = 0; i < list.length; i++) {
      if (normText(list[i].text) === num) numIdxs.push(i);
    }
    for (var n = 0; n < numIdxs.length; n++) {
      var ni = numIdxs[n];
      var ny = leafY(list[ni]);
      var nx = leafX(list[ni]);
      var best = null;
      for (var j = 0; j < list.length; j++) {
        if (j === ni) continue;
        if (normText(list[j].text) !== name) continue;
        var jy = leafY(list[j]);
        if (!sameBandY(ny, jy, tol)) continue;
        var jx = leafX(list[j]);
        // 성명은 보통 번호 오른쪽; 좌우 바뀌어도 허용하되 같은 밴드 우선
        var dx = jx - nx;
        var score = Math.abs(jy - ny) * 10 + (dx >= 0 ? 0 : 30) + Math.abs(dx) * 0.01;
        if (!best || score < best.score) {
          best = { numIdx: ni, nameIdx: j, bandY: ny, score: score };
        }
      }
      if (best) return { numIdx: best.numIdx, nameIdx: best.nameIdx, bandY: best.bandY };
    }
    return null;
  }

  /**
   * 밴드 위 짧은 리프를 헤더 열 중심에 스냅하거나, 없으면 좌→우 수집.
   * 반환: 셀 레코드 배열 (null 슬롯 가능 when centers).
   */
  function buildCellsOnBand(leaves, bandY, bandTol, headerCenters) {
    var tol = bandTol == null ? BAND_TOL_DEFAULT : bandTol;
    var onBand = [];
    var list = leaves || [];
    for (var i = 0; i < list.length; i++) {
      if (!sameBandY(leafY(list[i]), bandY, tol)) continue;
      onBand.push(list[i]);
    }
    onBand.sort(function (a, b) {
      return leafX(a) - leafX(b);
    });
    if (!headerCenters || !headerCenters.length) return onBand;

    var cells = [];
    for (var c = 0; c < headerCenters.length; c++) {
      var cx = Number(headerCenters[c]);
      var best = null;
      var bestD = 1e15;
      for (var k = 0; k < onBand.length; k++) {
        var d = Math.abs(leafX(onBand[k]) - cx);
        if (d < bestD) {
          bestD = d;
          best = onBand[k];
        }
      }
      cells.push(best && bestD <= CENTER_SNAP_PX ? best : null);
    }
    return cells;
  }

  /**
   * 모든 번호(숫자만)·성명 쌍을 같은 밴드에서 스캔.
   * 빈 번호 칸은 isAttendanceNumberText로 자연 제외.
   * 반환 쌍에 텍스트가 있어도 호출측 로그에는 개수만 쓸 것.
   */
  function scanNumberNamePairs(leaves, bandTol) {
    var tol = bandTol == null ? BAND_TOL_DEFAULT : bandTol;
    var list = leaves || [];
    var pairs = [];
    var usedName = {};
    for (var i = 0; i < list.length; i++) {
      var t = normText(list[i].text);
      if (!isAttendanceNumberText(t)) continue;
      var iy = leafY(list[i]);
      var ix = leafX(list[i]);
      var bestJ = -1;
      var bestScore = 1e15;
      for (var j = 0; j < list.length; j++) {
        if (j === i) continue;
        var nt = normText(list[j].text);
        if (!nt || isAttendanceNumberText(nt)) continue;
        if (nt.length > 24) continue;
        if (/^(번호|성명|마감|조회|종례|사유|\d+교시)$/.test(nt)) continue;
        var jy = leafY(list[j]);
        if (!sameBandY(iy, jy, tol)) continue;
        var jx = leafX(list[j]);
        var dx = jx - ix;
        if (dx < -20) continue;
        var score = Math.abs(jy - iy) * 10 + (dx >= 0 ? 0 : 40) + Math.abs(dx) * 0.01;
        if (score < bestScore) {
          bestScore = score;
          bestJ = j;
        }
      }
      if (bestJ < 0) continue;
      if (usedName[bestJ]) continue;
      usedName[bestJ] = true;
      pairs.push({
        numIdx: i,
        nameIdx: bestJ,
        numText: t,
        nameText: normText(list[bestJ].text),
        bandY: iy,
      });
    }
    return pairs;
  }

  function matchWantInPairs(pairs, wantNum, wantName) {
    var num = normText(wantNum);
    var name = normText(wantName);
    if (!num || !name) return null;
    var list = pairs || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].numText === num && list[i].nameText === name) return list[i];
    }
    return null;
  }

  /** 익명 카운트만 — 값 문자열 금지 */
  function countExactText(leaves, text) {
    var want = normText(text);
    if (!want) return 0;
    var n = 0;
    var list = leaves || [];
    for (var i = 0; i < list.length; i++) {
      if (normText(list[i].text) === want) n++;
    }
    return n;
  }

  g.ChulgyeolRowMatch = {
    BAND_TOL_DEFAULT: BAND_TOL_DEFAULT,
    BAND_TOL_WIDE: BAND_TOL_WIDE,
    CENTER_SNAP_PX: CENTER_SNAP_PX,
    normText: normText,
    sameBandY: sameBandY,
    isAttendanceNumberText: isAttendanceNumberText,
    findNumberNamePairOnBand: findNumberNamePairOnBand,
    buildCellsOnBand: buildCellsOnBand,
    scanNumberNamePairs: scanNumberNamePairs,
    matchWantInPairs: matchWantInPairs,
    countExactText: countExactText,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
