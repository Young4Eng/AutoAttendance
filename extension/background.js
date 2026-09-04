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

async function listFrames(tabId) {
  try {
    const frames = await chrome.webNavigation.getAllFrames({ tabId });
    if (!Array.isArray(frames) || !frames.length) {
      return [{ frameId: 0, url: "" }];
    }
    // neis 문서만. about:blank 등은 뒤로.
    const neis = [];
    const other = [];
    for (const f of frames) {
      const url = f.url || "";
      const row = { frameId: f.frameId, url };
      if (/\.neis\.go\.kr/i.test(url)) neis.push(row);
      else other.push(row);
    }
    const rank = (rows) => {
      const children = rows.filter((r) => r.frameId !== 0);
      const top = rows.filter((r) => r.frameId === 0);
      return children.concat(top);
    };
    return rank(neis).concat(rank(other));
  } catch {
    return [{ frameId: 0, url: "" }];
  }
}

/** content script가 없는 iframe에 파일을 다시 싣는다. */
async function ensureScripts(tabId, frameIds) {
  if (!chrome.scripting || !chrome.scripting.executeScript) {
    return { ok: false, code: "no_scripting" };
  }
  const files = ["content/detect.js", "content/neis-apply.js"];
  // 1) allFrames 한 번 (host_permissions 범위)
  try {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files,
    });
  } catch {
    // 개별 프레임으로 재시도
  }
  for (const frameId of frameIds) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId, frameIds: [frameId] },
        files,
      });
    } catch {
      // 접근 불가 프레임 스킵
    }
  }
  return { ok: true };
}

async function pingFrame(tabId, frameId) {
  try {
    const res = await chrome.tabs.sendMessage(
      tabId,
      { type: "mate-ping" },
      { frameId },
    );
    return Boolean(res && res.ok);
  } catch {
    return false;
  }
}

async function runApply(dryRun) {
  const data = await chrome.storage.session.get(QUEUE_KEY);
  const items = Array.isArray(data[QUEUE_KEY]) ? data[QUEUE_KEY] : [];
  if (!items.length) return { ok: false, code: "empty_queue" };
  const tab = await findNeisTab();
  if (!tab?.id) return { ok: false, code: "no_neis_tab" };

  const frames = await listFrames(tab.id);
  const frameIds = frames.map((f) => f.frameId);
  // 익명 진단: 개수만
  console.info(
    "[출결메이트]",
    "frames=",
    frames.length,
    "neisFrames=",
    frames.filter((f) => /\.neis\.go\.kr/i.test(f.url || "")).length,
  );

  // 먼저 ping. 실패한 프레임만 재주입 (리스너 중복 방지 가드 있음).
  let reachable = [];
  for (const frameId of frameIds) {
    if (await pingFrame(tab.id, frameId)) reachable.push(frameId);
  }
  if (!reachable.length) {
    await ensureScripts(tab.id, frameIds);
    reachable = [];
    for (const frameId of frameIds) {
      if (await pingFrame(tab.id, frameId)) reachable.push(frameId);
    }
  }
  console.info("[출결메이트]", "reachable=", reachable.length);
  const targets = reachable.length ? reachable : frameIds;

  const payload = {
    type: "apply-queue",
    items,
    dryRun: Boolean(dryRun),
  };
  let lastCode = reachable.length ? "apply_no_grid" : "content_unreachable";
  let softFail = null;
  for (const frameId of targets) {
    try {
      const res = await chrome.tabs.sendMessage(tab.id, payload, { frameId });
      if (!res || typeof res !== "object") {
        lastCode = "no_response";
        continue;
      }
      if (res.ok) return res;
      if (res.code === "grid_not_found") {
        softFail = softFail || res;
        continue;
      }
      return res;
    } catch {
      // next
    }
  }
  return softFail || { ok: false, code: lastCode, frames: frames.length, reachable: reachable.length };
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
    const frameId = sender.frameId || 0;
    chrome.storage.session.get(PAGE_KEY).then((data) => {
      const prev = data[PAGE_KEY] || "unknown";
      let next = hostOk ? kind : "other";
      // 자식 iframe의 other로 담임용 감지를 지우지 않음
      if (next === "other" && prev === "homeroom-daily" && frameId !== 0) {
        sendResponse({ ok: true, kind: prev, ignored: true });
        return;
      }
      chrome.storage.session.set({ [PAGE_KEY]: next });
      setBadge(next, sender.tab?.id).catch(() => {});
      console.info(
        "[출결메이트]",
        "page=",
        next,
        "frame=",
        frameId,
        "badge=",
        next === "homeroom-daily" ? "ON" : "off",
      );
      sendResponse({ ok: true, kind: next });
    });
    return true;
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
