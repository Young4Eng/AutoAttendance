/**
 * #5 뼈대: 화면 종류만 보관. 출결 JSON·이름·번호는 두지 않는다.
 */
const PAGE_KEY = "pageKind";

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.session.set({ [PAGE_KEY]: "unknown" });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== "object") {
    sendResponse({ ok: false, code: "bad_message" });
    return false;
  }

  if (message.type === "page-kind") {
    const kind = message.kind === "homeroom-daily" ? "homeroom-daily" : "other";
    const hostOk = Boolean(
      sender.tab?.url && /\.neis\.go\.kr(\/|$|\?|#)/i.test(sender.tab.url)
    );
    const next = hostOk ? kind : "other";
    chrome.storage.session.set({ [PAGE_KEY]: next });
    // 로그: 이름·번호 금지
    console.info("[출결메이트]", "page=", next, "hostOk=", hostOk);
    sendResponse({ ok: true, kind: next });
    return false;
  }

  if (message.type === "get-page-kind") {
    chrome.storage.session.get(PAGE_KEY).then((data) => {
      sendResponse({ ok: true, kind: data[PAGE_KEY] || "unknown" });
    });
    return true;
  }

  sendResponse({ ok: false, code: "unknown_type" });
  return false;
});
