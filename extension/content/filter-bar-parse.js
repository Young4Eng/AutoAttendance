/**
 * 조회조건(학년도·학년·반·일자) 순수 파서.
 * DOM 의존 없음 — 픽스처/노드 테스트와 content가 공유.
 */
(function (g) {
  if (g.__chulgyeolMateFilterBar) return;
  g.__chulgyeolMateFilterBar = true;

  function normText(s) {
    return String(s || "")
      .replace(/[\u200b-\u200d\ufeff]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeDate(s) {
    if (!s) return "";
    // Nexacro 달력 표시: 2026.09.04. (끝 점 포함)
    var t = normText(s).replace(/\.+$/g, "").replace(/\s+/g, " ");
    var m = t.match(/(\d{4})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]?\s*(\d{1,2})\s*일?/);
    if (!m) m = t.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
    if (!m) {
      var compact = t.match(/\b((?:19|20)\d{2})(\d{2})(\d{2})\b/);
      if (compact) m = compact;
    }
    if (!m) return "";
    var y = m[1];
    var mo = String(m[2]).padStart(2, "0");
    var d = String(m[3]).padStart(2, "0");
    var mi = Number(mo);
    var di = Number(d);
    if (mi < 1 || mi > 12 || di < 1 || di > 31) return "";
    return y + "-" + mo + "-" + d;
  }

  function parseYear(raw) {
    var m = String(raw || "").match(/(?:19|20)\d{2}/);
    return m ? Number(m[0]) : null;
  }

  function parseIntLoose(raw) {
    var m = String(raw || "").match(/\d{1,2}/);
    return m ? Number(m[0]) : null;
  }

  function emptyParsed() {
    return {
      year: null,
      grade: null,
      class: null,
      date: "",
      raw: { year: "", grade: "", class: "", date: "" },
    };
  }

  /** 현장 DIV: "2학년 3반 2026.09.04.Total" 등 — 라벨 문자열 없이 학년·반·일자 */
  var BAND_COMPACT_RE =
    /(\d+)학년\s*(\d+)반\s*((?:19|20)\d{2}[.\-/]\d{1,2}[.\-/]\d{1,2}\.?)/;

  function parseBandCompact(text) {
    var out = emptyParsed();
    var t = normText(text);
    if (!t) return out;
    var m = t.match(BAND_COMPACT_RE);
    if (!m) return out;
    out.raw.grade = m[1];
    out.grade = Number(m[1]);
    out.raw.class = m[2];
    out.class = Number(m[2]);
    var dn = normalizeDate(m[3]);
    if (dn) {
      out.raw.date = dn;
      out.date = dn;
      out.year = Number(dn.slice(0, 4));
      out.raw.year = String(out.year);
    } else {
      out.raw.date = String(m[3]).slice(0, 32);
    }
    return out;
  }

  function applyRawToOut(out, key, rawJoined) {
    var joined = normText(rawJoined);
    if (!joined) return;
    if (key === "year") {
      var y = parseYear(joined);
      if (y != null) {
        out.raw.year = String(y);
        out.year = y;
      } else {
        out.raw.year = joined.slice(0, 24);
      }
    } else if (key === "grade") {
      var gi = parseIntLoose(joined);
      if (gi != null) {
        out.raw.grade = String(gi);
        out.grade = gi;
      } else {
        out.raw.grade = joined.slice(0, 12);
      }
    } else if (key === "class") {
      var ci = parseIntLoose(joined);
      if (ci != null) {
        out.raw.class = String(ci);
        out.class = ci;
      } else {
        out.raw.class = joined.slice(0, 12);
      }
    } else if (key === "date") {
      var dn = normalizeDate(joined);
      if (!dn) {
        var parts = joined.match(/((?:19|20)\d{2})\D+(\d{1,2})\D+(\d{1,2})/);
        if (parts) dn = normalizeDate(parts[1] + "-" + parts[2] + "-" + parts[3]);
      }
      if (!dn) {
        var only = joined.match(/((?:19|20)\d{2}\d{2}\d{2})/);
        if (only) dn = normalizeDate(only[1]);
      }
      if (dn) {
        out.raw.date = dn;
        out.date = dn;
      } else {
        out.raw.date = joined.slice(0, 32);
      }
    }
  }

  /**
   * 화면/innerText 한 덩어리에서 4칸을 한꺼번에 뽑는다.
   * 예: "학년도 2026 학년 1 반 3 일자 2026-09-04"
   */
  function parseFilterBarText(text) {
    var t = normText(text);
    var out = emptyParsed();
    if (!t) return out;

    // 밴드 압축형(「2학년 3반 2026.09.04.」)이 있으면 라벨 파싱보다 우선·시드
    var bandSeed = parseBandCompact(t);
    if (bandSeed.grade != null) {
      out.grade = bandSeed.grade;
      out.raw.grade = bandSeed.raw.grade;
      out.class = bandSeed.class;
      out.raw.class = bandSeed.raw.class;
      if (bandSeed.date) {
        out.date = bandSeed.date;
        out.raw.date = bandSeed.raw.date;
      }
      if (bandSeed.year != null) {
        out.year = bandSeed.year;
        out.raw.year = bandSeed.raw.year;
      }
    }

    var iY = t.indexOf("학년도");
    if (iY >= 0) {
      var ys = t.slice(iY + 3, iY + 64);
      var ym = ys.match(/(?:19|20)\d{2}/);
      if (ym) {
        out.raw.year = ym[0];
        out.year = Number(ym[0]);
      }
    }

    // 학년도 다음의 '학년 N' (학년도에 흡수되지 않게)
    var gm = t.match(/학년도[\s\S]{0,72}?학년\s*[:：]?\s*(\d{1,2})/);
    if (gm && out.grade == null) {
      out.raw.grade = gm[1];
      out.grade = Number(gm[1]);
    }

    // '반 N' — 너무 앞의 무관 매칭 줄이려 학년도 이후 구간 우선
    var region = iY >= 0 ? t.slice(iY, iY + 220) : t;
    var cm = region.match(/반\s*[:：]?\s*(\d{1,2})/);
    if (!cm) cm = t.match(/반\s*[:：]?\s*(\d{1,2})/);
    // 밴드 압축이 이미 class를 채웠으면 「반 2026」오탐으로 덮지 않음
    if (cm && out.class == null) {
      out.raw.class = cm[1];
      out.class = Number(cm[1]);
    }

    var iD = t.indexOf("일자");
    if (iD >= 0) {
      // 일자 뒤 넓은 창 + 끝점(2026.09.04.)·분리 Y M D 대응
      var ds = t.slice(iD + 2, iD + 72).replace(/^[\s:：]+/, "");
      var dateNorm = normalizeDate(ds);
      if (!dateNorm) {
        var parts = ds.match(/((?:19|20)\d{2})\D+(\d{1,2})\D+(\d{1,2})/);
        if (parts) dateNorm = normalizeDate(parts[1] + "-" + parts[2] + "-" + parts[3]);
      }
      if (!dateNorm) {
        var only = ds.match(/((?:19|20)\d{2}\d{2}\d{2})/);
        if (only) dateNorm = normalizeDate(only[1]);
      }
      if (dateNorm) {
        out.raw.date = dateNorm;
        out.date = dateNorm;
      } else {
        out.raw.date = normText(ds).slice(0, 32);
      }
    } else {
      // 라벨 없이 날짜 패턴만 (필터 줄 추정, 끝점 허용)
      var any = t.match(/(?:19|20)\d{2}\s*[.\-/년]\s*\d{1,2}\s*[.\-/월]?\s*\d{1,2}\.?/);
      if (any) {
        var n = normalizeDate(any[0]);
        if (n) {
          out.raw.date = n;
          out.date = n;
        }
      }
    }

    // 라벨(학년도/학년/일자) 없을 때 밴드 압축형 폴백
    if (out.grade == null || out.class == null || !out.date || out.year == null) {
      var band = parseBandCompact(t);
      if (out.grade == null && band.grade != null) {
        out.grade = band.grade;
        out.raw.grade = band.raw.grade;
      }
      if (out.class == null && band.class != null) {
        out.class = band.class;
        out.raw.class = band.raw.class;
      }
      if (!out.date && band.date) {
        out.date = band.date;
        out.raw.date = band.raw.date;
      }
      if (out.year == null && band.year != null) {
        out.year = band.year;
        out.raw.year = band.raw.year;
      }
    }

    return out;
  }

  /**
   * 같은 필터 밴드에서 라벨·짧은 표시 토큰의 x/y로 4칸을 순서 할당.
   * labels: [{ key:'year'|'grade'|'class'|'date', x, y, right? }]
   * tokens: [{ text, x, y }]
   */
  function parseFilterBarByOrder(labels, tokens) {
    var out = emptyParsed();
    if (!labels || !labels.length) return out;

    var BAND = 40;
    var bandY = null;
    var i;
    for (i = 0; i < labels.length; i++) {
      if (labels[i] && labels[i].key === "year" && Number.isFinite(labels[i].y)) {
        bandY = labels[i].y;
        break;
      }
    }
    if (bandY == null) {
      for (i = 0; i < labels.length; i++) {
        if (labels[i] && Number.isFinite(labels[i].y)) {
          bandY = labels[i].y;
          break;
        }
      }
    }
    if (bandY == null) return out;

    var keyRank = { year: 0, grade: 1, class: 2, date: 3 };
    var bestByKey = {};
    for (i = 0; i < labels.length; i++) {
      var lab = labels[i];
      if (!lab || !lab.key || !Number.isFinite(lab.x) || !Number.isFinite(lab.y)) continue;
      if (Math.abs(lab.y - bandY) > BAND) continue;
      var prev = bestByKey[lab.key];
      if (!prev || lab.x < prev.x) bestByKey[lab.key] = lab;
    }

    var ordered = Object.keys(bestByKey)
      .map(function (k) {
        return bestByKey[k];
      })
      .sort(function (a, b) {
        if (a.x !== b.x) return a.x - b.x;
        return (keyRank[a.key] || 0) - (keyRank[b.key] || 0);
      });
    if (!ordered.length) return out;

    var labelWords = { 학년도: 1, 학년: 1, 반: 1, 일자: 1, 조회: 1 };
    var toks = [];
    var rawTokens = tokens || [];
    for (i = 0; i < rawTokens.length; i++) {
      var tok = rawTokens[i];
      if (!tok || !Number.isFinite(tok.x) || !Number.isFinite(tok.y)) continue;
      if (Math.abs(tok.y - bandY) > BAND) continue;
      var tx = normText(tok.text);
      if (!tx || tx.length > 32) continue;
      if (labelWords[tx]) continue;
      toks.push({ text: tx, x: tok.x, y: tok.y });
    }
    toks.sort(function (a, b) {
      return a.x - b.x;
    });

    for (i = 0; i < ordered.length; i++) {
      var L = ordered[i];
      var xMin = Number.isFinite(L.right) ? L.right - 2 : L.x + 2;
      var xMax =
        i + 1 < ordered.length
          ? ordered[i + 1].x - 1
          : (Number.isFinite(L.right) ? L.right : L.x) + 420;
      var bucket = [];
      for (var j = 0; j < toks.length; j++) {
        if (toks[j].x >= xMin && toks[j].x < xMax) bucket.push(toks[j].text);
      }
      applyRawToOut(out, L.key, bucket.join(" "));
    }

    return out;
  }

  function mergeFilterValues(domRaw, textParsed, orderParsed, extras) {
    domRaw = domRaw || {};
    textParsed = textParsed || emptyParsed();
    orderParsed = orderParsed || null;
    extras = extras || {};
    var bandParsed = extras.band || null;
    var dateInput = extras.dateInput || "";
    var labelPathEmpty = Boolean(extras.labelPathEmpty);

    var yearRaw = "";
    var gradeRaw = "";
    var classRaw = "";
    var dateRaw = "";
    var src = { year: "", grade: "", class: "", date: "" };

    function takeFrom(field, parsedVal, rawVal, srcName) {
      if (field === "year") {
        if (parsedVal != null && !parseYear(yearRaw)) {
          yearRaw = String(rawVal || parsedVal);
          src.year = srcName;
        }
      } else if (field === "grade") {
        if (parsedVal != null && !parseIntLoose(gradeRaw)) {
          gradeRaw = String(rawVal || parsedVal);
          src.grade = srcName;
        }
      } else if (field === "class") {
        if (parsedVal != null && !parseIntLoose(classRaw)) {
          classRaw = String(rawVal || parsedVal);
          src.class = srcName;
        }
      } else if (field === "date") {
        if (parsedVal && !normalizeDate(dateRaw)) {
          dateRaw = String(parsedVal);
          src.date = srcName;
        }
      }
    }

    function applyBandAndInput() {
      if (dateInput && !normalizeDate(dateRaw)) {
        dateRaw = String(dateInput);
        src.date = "input";
        if (!parseYear(yearRaw)) {
          var yi = parseYear(dateInput);
          if (yi != null) {
            yearRaw = String(yi);
            src.year = src.year || "input";
          }
        }
      }
      if (bandParsed) {
        takeFrom("grade", bandParsed.grade, bandParsed.raw && bandParsed.raw.grade, "band");
        takeFrom("class", bandParsed.class, bandParsed.raw && bandParsed.raw.class, "band");
        takeFrom("date", bandParsed.date, bandParsed.raw && bandParsed.raw.date, "band");
        takeFrom("year", bandParsed.year, bandParsed.raw && bandParsed.raw.year, "band");
      }
    }

    // 라벨 경로 비었으면 band/input을 먼저 (현장 dump: 학년도/학년/일자=0)
    if (labelPathEmpty) applyBandAndInput();

    if (orderParsed) {
      takeFrom("year", orderParsed.year, orderParsed.raw && orderParsed.raw.year, "order");
      takeFrom("grade", orderParsed.grade, orderParsed.raw && orderParsed.raw.grade, "order");
      takeFrom("class", orderParsed.class, orderParsed.raw && orderParsed.raw.class, "order");
      takeFrom("date", orderParsed.date, orderParsed.raw && orderParsed.raw.date, "order");
    }

    if (!parseYear(yearRaw) && domRaw.year) {
      yearRaw = String(domRaw.year);
      src.year = "dom";
    }
    if (!parseIntLoose(gradeRaw) && domRaw.grade) {
      gradeRaw = String(domRaw.grade);
      src.grade = "dom";
    }
    if (!parseIntLoose(classRaw) && domRaw.class) {
      classRaw = String(domRaw.class);
      src.class = "dom";
    }
    if (!normalizeDate(dateRaw) && domRaw.date) {
      dateRaw = String(domRaw.date);
      src.date = "dom";
    }

    // 라벨 경로가 있어도 빈 칸은 band/input으로 채움 (동등 merge)
    if (!labelPathEmpty) applyBandAndInput();

    if (!parseYear(yearRaw) && textParsed.year != null) {
      yearRaw = String(textParsed.raw.year || textParsed.year);
      src.year = "innerText";
    }
    if (!parseIntLoose(gradeRaw) && textParsed.grade != null) {
      gradeRaw = String(textParsed.raw.grade || textParsed.grade);
      src.grade = "innerText";
    }
    if (!parseIntLoose(classRaw) && textParsed.class != null) {
      classRaw = String(textParsed.raw.class || textParsed.class);
      src.class = "innerText";
    }
    if (!normalizeDate(dateRaw) && textParsed.date) {
      dateRaw = textParsed.date;
      src.date = "innerText";
    }

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
        softYear: String((textParsed.raw && textParsed.raw.year) || "").slice(0, 8),
        softGrade: String((textParsed.raw && textParsed.raw.grade) || "").slice(0, 4),
        softClass: String((textParsed.raw && textParsed.raw.class) || "").slice(0, 4),
        softDate: String((textParsed.raw && textParsed.raw.date) || textParsed.date || "").slice(0, 24),
        orderYear: String((orderParsed && orderParsed.raw && orderParsed.raw.year) || "").slice(0, 8),
        orderGrade: String((orderParsed && orderParsed.raw && orderParsed.raw.grade) || "").slice(0, 4),
        orderClass: String((orderParsed && orderParsed.raw && orderParsed.raw.class) || "").slice(0, 4),
        orderDate: String((orderParsed && orderParsed.date) || "").slice(0, 24),
        bandYear: String((bandParsed && bandParsed.raw && bandParsed.raw.year) || "").slice(0, 8),
        bandGrade: String((bandParsed && bandParsed.raw && bandParsed.raw.grade) || "").slice(0, 4),
        bandClass: String((bandParsed && bandParsed.raw && bandParsed.raw.class) || "").slice(0, 4),
        bandDate: String((bandParsed && bandParsed.date) || "").slice(0, 24),
        hasDateInput: Boolean(extras.hasDateInput),
        bandHit: Boolean(extras.bandHit),
        bandHitCount: Number(extras.bandHitCount) || 0,
        filterSrc: [src.year, src.grade, src.class, src.date].filter(Boolean).join("+") || "none",
        srcYear: src.year || "none",
        srcGrade: src.grade || "none",
        srcClass: src.class || "none",
        srcDate: src.date || "none",
      },
    };
  }

  g.ChulgyeolFilterBar = {
    normText: normText,
    normalizeDate: normalizeDate,
    parseYear: parseYear,
    parseIntLoose: parseIntLoose,
    BAND_COMPACT_RE: BAND_COMPACT_RE,
    parseBandCompact: parseBandCompact,
    parseFilterBarText: parseFilterBarText,
    parseFilterBarByOrder: parseFilterBarByOrder,
    mergeFilterValues: mergeFilterValues,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
