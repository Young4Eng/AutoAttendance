/** docs/data-contract.md 키·화이트리스트. 이름 임의 변경 금지. */
export const QUEUE_KEYS = Object.freeze([
  "ownerSub",
  "date",
  "year",
  "grade",
  "class",
  "number",
  "name",
  "category",
  "type",
  "period",
  "reason",
  "status",
]);

export const CATEGORIES = Object.freeze([
  "illness",
  "unexcused",
  "other",
  "recognized",
]);

export const TYPES = Object.freeze([
  "late",
  "early_leave",
  "absence",
  "result",
]);

const ALLOWED_ORIGINS = Object.freeze(["http://localhost:5173"]);

export function originAllowed(urlOrOrigin) {
  if (!urlOrOrigin || typeof urlOrOrigin !== "string") return false;
  try {
    const u = new URL(urlOrOrigin);
    return ALLOWED_ORIGINS.includes(u.origin);
  } catch {
    return ALLOWED_ORIGINS.includes(urlOrOrigin);
  }
}

/**
 * @returns {{ ok: true, item: object } | { ok: false, code: string }}
 */
export function validateQueueItem(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, code: "not_object" };
  }
  for (const k of QUEUE_KEYS) {
    if (!(k in raw)) return { ok: false, code: `missing_${k}` };
  }
  for (const k of Object.keys(raw)) {
    if (!QUEUE_KEYS.includes(k)) return { ok: false, code: `unknown_key_${k}` };
  }
  if (raw.status !== "queued") return { ok: false, code: "not_queued" };
  if (!CATEGORIES.includes(raw.category)) return { ok: false, code: "bad_category" };
  if (!TYPES.includes(raw.type)) return { ok: false, code: "bad_type" };
  if (typeof raw.period !== "number" || raw.period < 1) {
    return { ok: false, code: "bad_period" };
  }
  if (typeof raw.ownerSub !== "string" || !raw.ownerSub) {
    return { ok: false, code: "bad_ownerSub" };
  }
  if (raw.category === "other" && !(typeof raw.reason === "string" && raw.reason.trim())) {
    return { ok: false, code: "reason_required" };
  }
  const item = {};
  for (const k of QUEUE_KEYS) item[k] = raw[k];
  return { ok: true, item };
}
