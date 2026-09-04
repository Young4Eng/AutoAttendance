/**
 * 일일출결관리(담임용) 감지만.
 * 마커 없는 iframe이 pageKind를 other로 덮지 않게 함 (#20).
 */
(function () {
  if (globalThis.__chulgyeolMateDetect) return;
  globalThis.__chulgyeolMateDetect = true;
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

  function isTop() {
    try {
      return window === window.top;
    } catch {
      return false;
    }
  }

  function report() {
    if (!hostIsNeis()) return;
    const hit = textLooksLikeHomeroomDaily();
    if (hit) {
      chrome.runtime.sendMessage({ type: "page-kind", kind: "homeroom-daily" }, () => {
        void chrome.runtime.lastError;
      });
      return;
    }
    // 마커 없음: 자식 iframe은 침묵. 탑만 other 보고(메뉴 이탈).
    if (!isTop()) return;
    chrome.runtime.sendMessage({ type: "page-kind", kind: "other" }, () => {
      void chrome.runtime.lastError;
    });
  }

  report();
  let lastHit = textLooksLikeHomeroomDaily();
  setInterval(() => {
    const hit = textLooksLikeHomeroomDaily();
    if (hit !== lastHit) {
      lastHit = hit;
      report();
    } else if (hit) {
      // 주기적으로 유지(덮어쓰기 복구)
      report();
    }
  }, 2000);
})();
