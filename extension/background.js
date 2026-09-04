/**
 * FIRST-ISSUES #4 / GitHub #5 뼈대: 화면 종류·배지만.
 * 클릭 자동화·로그인·출결 JSON·이름·번호 없음.
 */
const PAGE_KEY = "pageKind";

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.session.set({ [PAGE_KEY]: "unknown" });
});

async function setBadge(kind, tabId) {
  const on = kind === "homeroom-daily";
  const text = on ? "ON" : "";
  const opts = tabId != null ? { tabId } : {};
  await chrome.action.setBadgeText({ text, ...opts });
  if (on) {
    await chrome.action.setBadgeBackgroundColor({ color: "#0B7A45", ...opts });
  }
}

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
    const tabId = sender.tab?.id;
    chrome.storage.session.set({ [PAGE_KEY]: next });
    setBadge(next, tabId).catch(() => {});
    console.info("[출결메이트]", "page=", next, "badge=", next === "homeroom-daily" ? "ON" : "off");
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
