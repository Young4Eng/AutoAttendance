/**
 * 일일출결관리(담임용) 화면인지 감지만 한다.
 * 그리드·출결마감구분·P칸·저장 버튼 셀렉터는 추측하지 않는다 (#5 범위 밖).
 */
(function () {
  const MARKERS = [
    "일일출결관리(담임용)",
    "일일출결관리（담임용）",
  ];

  function hostIsNeis() {
    return /\.neis\.go\.kr$/i.test(location.hostname);
  }

  function textLooksLikeHomeroomDaily() {
    const title = document.title || "";
    const bodyText = (document.body && document.body.innerText) || "";
    const hay = `${title}\n${bodyText}`;
    return MARKERS.some((m) => hay.includes(m));
  }

  function detect() {
    if (!hostIsNeis()) {
      return "other";
    }
    return textLooksLikeHomeroomDaily() ? "homeroom-daily" : "other";
  }

  function report() {
    const kind = detect();
    chrome.runtime.sendMessage({ type: "page-kind", kind }, () => {
      void chrome.runtime.lastError;
    });
  }

  report();

  // SPA·메뉴 전환 대비: 짧은 주기로 재감지 (DOM 셀렉터 없음)
  let last = "";
  const tick = () => {
    const kind = detect();
    if (kind !== last) {
      last = kind;
      report();
    }
  };
  setInterval(tick, 2000);
})();
