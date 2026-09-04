/**
 * #5 감지 + #6 웹앱 대기열 수신.
 * P칸·저장·로그인 자동화 없음. 부분 실패를 synced로 표시하지 않음.
 */
import {
  originAllowed,
  validateQueueItem,
} from "./queue/contract.js";

const PAGE_KEY = "pageKind";
const QUEUE_KEY = "queueItems";

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.session.set({ [PAGE_KEY]: "unknown", [QUEUE_KEY]: [] });
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

/** 로그: 이름·번호 금지. row·type·code만. */
function logRow(row, type, result, code) {
  const parts = [`row=${row}`, `type=${type}`, `result=${result}`];
  if (code) parts.push(`code=${code}`);
  console.info("[출결메이트]", parts.join(" "));
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

  if (message.type === "get-queue") {
    chrome.storage.session.get(QUEUE_KEY).then((data) => {
      const items = Array.isArray(data[QUEUE_KEY]) ? data[QUEUE_KEY] : [];
      sendResponse({ ok: true, count: items.length });
    });
    return true;
  }

  sendResponse({ ok: false, code: "unknown_type" });
  return false;
});

/**
 * 웹앱(localhost:5173)만. 타 origin·타 확장 sender.id 거부.
 * synced로 바꾸지 않음 — 수신·보관만.
 */
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  const origin = sender.origin || sender.url || "";
  if (!originAllowed(origin)) {
    console.info("[출결메이트]", "reject origin");
    sendResponse({ ok: false, code: "forbidden_origin" });
    return false;
  }
  // 다른 확장이 위장하면 sender.id가 있음. 웹 페이지만 허용.
  if (sender.id) {
    console.info("[출결메이트]", "reject sender_id");
    sendResponse({ ok: false, code: "forbidden_sender" });
    return false;
  }
  if (!message || typeof message !== "object" || message.type !== "attendance.queue") {
    sendResponse({ ok: false, code: "bad_message" });
    return false;
  }
  if (!Array.isArray(message.items)) {
    sendResponse({ ok: false, code: "items_not_array" });
    return false;
  }

  const accepted = [];
  const errors = [];
  message.items.forEach((raw, row) => {
    const v = validateQueueItem(raw);
    if (!v.ok) {
      logRow(row, typeof raw?.type === "string" ? raw.type : "?", "reject", v.code);
      errors.push({ row, code: v.code });
      return;
    }
    logRow(row, v.item.type, "ok");
    accepted.push(v.item);
  });

  // 부분 실패: 받은 것만 보관. synced 표시 없음.
  chrome.storage.session.get(QUEUE_KEY).then((data) => {
    const prev = Array.isArray(data[QUEUE_KEY]) ? data[QUEUE_KEY] : [];
    const next = prev.concat(accepted);
    return chrome.storage.session.set({ [QUEUE_KEY]: next }).then(() => {
      sendResponse({
        ok: errors.length === 0,
        accepted: accepted.length,
        rejected: errors.length,
        errors,
        // status는 queued 유지. synced 금지.
      });
    });
  });
  return true;
});
