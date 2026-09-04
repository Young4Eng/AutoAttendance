/**
 * 감지 + 대기열 수신 + 적용 지시.
 * synced 자동 표시 없음. 출결마감·로그인 자동화 없음.
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

function logRow(row, type, result, code) {
  const parts = [`row=${row}`, `type=${type}`, `result=${result}`];
  if (code) parts.push(`code=${code}`);
  console.info("[출결메이트]", parts.join(" "));
}

async function findNeisTab() {
  const tabs = await chrome.tabs.query({ url: ["*://*.neis.go.kr/*"] });
  const active = tabs.find((t) => t.active) || tabs[0];
  return active || null;
}

async function listFrameIds(tabId) {
  try {
    const frames = await chrome.webNavigation.getAllFrames({ tabId });
    if (!Array.isArray(frames) || !frames.length) return [0];
    // Prefer child frames first (나이스 그리드가 iframe인 경우), then top.
    const ids = frames.map((f) => f.frameId);
    const children = ids.filter((id) => id !== 0);
    return children.concat(ids.includes(0) ? [0] : []);
  } catch {
    return [0];
  }
}

async function runApply(dryRun) {
  const data = await chrome.storage.session.get(QUEUE_KEY);
  const items = Array.isArray(data[QUEUE_KEY]) ? data[QUEUE_KEY] : [];
  if (!items.length) return { ok: false, code: "empty_queue" };
  const tab = await findNeisTab();
  if (!tab?.id) return { ok: false, code: "no_neis_tab" };
  const payload = {
    type: "apply-queue",
    items,
    dryRun: Boolean(dryRun),
  };
  const frameIds = await listFrameIds(tab.id);
  let lastCode = "content_unreachable";
  let softFail = null; // grid_not_found 등 — 다른 프레임 계속
  for (const frameId of frameIds) {
    try {
      const res = await chrome.tabs.sendMessage(tab.id, payload, { frameId });
      if (!res || typeof res !== "object") {
        lastCode = "no_response";
        continue;
      }
      if (res.ok) return res;
      // 이 프레임에 그리드 없음 → iframe 후보 계속
      if (res.code === "grid_not_found") {
        softFail = softFail || res;
        continue;
      }
      // 그리드는 있는데 매칭·팝업 등 실패 → 그 결과 반환
      return res;
    } catch {
      // 수신자 없는 프레임
    }
  }
  return softFail || { ok: false, code: lastCode };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== "object") {
    sendResponse({ ok: false, code: "bad_message" });
    return false;
  }

  if (message.type === "page-kind") {
    const kind = message.kind === "homeroom-daily" ? "homeroom-daily" : "other";
    const hostOk = Boolean(
      sender.tab?.url && /\.neis\.go\.kr(\/|$|\?|#)/i.test(sender.tab.url),
    );
    const next = hostOk ? kind : "other";
    chrome.storage.session.set({ [PAGE_KEY]: next });
    setBadge(next, sender.tab?.id).catch(() => {});
    console.info(
      "[출결메이트]",
      "page=",
      next,
      "badge=",
      next === "homeroom-daily" ? "ON" : "off",
    );
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

  if (message.type === "clear-queue") {
    chrome.storage.session.set({ [QUEUE_KEY]: [] }).then(() => {
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message.type === "run-apply") {
    // dryRun 기본 true
    const dryRun = message.dryRun !== false;
    runApply(dryRun).then((res) => sendResponse(res));
    return true;
  }

  sendResponse({ ok: false, code: "unknown_type" });
  return false;
});

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  const origin = sender.origin || sender.url || "";
  if (!originAllowed(origin)) {
    console.info("[출결메이트]", "reject origin");
    sendResponse({ ok: false, code: "forbidden_origin" });
    return false;
  }
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

  chrome.storage.session.get(QUEUE_KEY).then((data) => {
    const prev = Array.isArray(data[QUEUE_KEY]) ? data[QUEUE_KEY] : [];
    const next = prev.concat(accepted);
    return chrome.storage.session.set({ [QUEUE_KEY]: next }).then(() => {
      sendResponse({
        ok: errors.length === 0,
        accepted: accepted.length,
        rejected: errors.length,
        errors,
      });
    });
  });
  return true;
});
