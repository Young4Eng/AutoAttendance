/**
 * Supabase is the source of truth (docs/BACKEND.md §7, issue #58).
 * IndexedDB is cache-only: written after a successful cloud write, or used as
 * read fallback when Supabase is unset / unreachable. Never dual-write ahead
 * of the server. No service_role in the browser.
 */
import { stripCsvFormula } from '../lib/csvSafe';
import type {
  AttendanceRecord,
  AttendanceType,
  Category,
  ClassSettings,
  EnrollStatus,
  Student,
} from "../types/models";
import * as idb from "./idb";
import { getSupabase } from "./supabaseClient";

function sb() {
  return getSupabase();
}

/** Map PostgREST / RPC errors to BACKEND.md code strings when present. */
function rpcErrorMessage(err: { message?: string; details?: string; hint?: string }): string {
  const raw = `${err.message ?? ""} ${err.details ?? ""} ${err.hint ?? ""}`;
  const codes = [
    "bad_type",
    "bad_category",
    "absence_period_must_be_0",
    "bad_period",
    "reason_required",
    "weekend_not_allowed",
    "bad_status",
    "bad_rows",
    "bad_roster_row",
    "bad_entry_row",
    "bad_range",
    "not_authenticated",
  ] as const;
  for (const code of codes) {
    if (raw.includes(code)) return code;
  }
  return err.message?.trim() || "rpc_failed";
}

function clientValidate(record: Omit<AttendanceRecord, "ownerSub">): void {
  if (record.category === "other" && !record.reason.trim()) {
    throw new Error("reason_required");
  }
  if (record.type === "absence") {
    if (record.period !== 0) throw new Error("absence_period_must_be_0");
  } else if (record.period < 1 || record.period > 7) {
    throw new Error("bad_period");
  }
}

export async function replaceRoster(
  ownerSub: string,
  students: Omit<Student, "ownerSub">[],
): Promise<void> {
  const client = sb();
  if (client) {
    const { error } = await client.rpc("replace_roster", {
      rows: students.map((s) => ({
        grade: s.grade,
        class: s.class,
        number: s.number,
        name: s.name,
        status: s.status ?? "enrolled",
        note: s.note ?? "",
      })),
    });
    if (error) throw new Error(rpcErrorMessage(error));
    await idb.replaceRoster(ownerSub, students);
    return;
  }
  await idb.replaceRoster(ownerSub, students);
}

export async function listRoster(ownerSub: string): Promise<Student[]> {
  const client = sb();
  if (client) {
    const { data, error } = await client.from("roster").select("*").eq("owner_id", ownerSub);
    if (!error && data) {
      const rows = data
        .map((r) => ({
          ownerSub,
          grade: r.grade as number,
          class: r.class as number,
          number: r.number as number,
          name: String(r.name),
          status: (r.status === "transferred" ? "transferred" : "enrolled") as EnrollStatus,
          note: String(r.note ?? ""),
        }))
        .sort((a, b) => a.number - b.number);
      // Refresh cache from cloud (best-effort).
      void idb.replaceRoster(
        ownerSub,
        rows.map(({ ownerSub: _o, ...rest }) => rest),
      );
      return rows;
    }
  }
  return idb.listRoster(ownerSub);
}

function rowOf(ownerSub: string, r: Omit<AttendanceRecord, "ownerSub">) {
  return {
    owner_id: ownerSub,
    date: r.date,
    year: r.year,
    grade: r.grade,
    class: r.class,
    number: r.number,
    name: r.name,
    category: r.category,
    type: r.type,
    period: r.period,
    reason: stripCsvFormula(r.reason),
    status: r.status,
  };
}

export async function putAttendance(
  ownerSub: string,
  record: Omit<AttendanceRecord, "ownerSub">,
): Promise<void> {
  record = {
    ...record,
    name: stripCsvFormula(record.name),
    reason: stripCsvFormula(record.reason),
  };
  clientValidate(record);
  const client = sb();
  if (client) {
    const { error } = await client.rpc("upsert_entry", {
      p_row: rowOf(ownerSub, record),
    });
    if (error) throw new Error(rpcErrorMessage(error));
    await idb.putAttendance(ownerSub, record);
    return;
  }
  await idb.putAttendance(ownerSub, record);
}

export type ApplyRepeatResult = { dates: string[]; count: number };

/** Long-term / repeat: weekdays only, one transaction on server (#58 / #55). */
export async function applyRepeat(
  ownerSub: string,
  args: {
    grade: number;
    class: number;
    number: number;
    name: string;
    type: AttendanceType;
    category: Category;
    period: number;
    reason: string;
    start: string;
    end: string;
  },
): Promise<ApplyRepeatResult> {
  args = {
    ...args,
    name: stripCsvFormula(args.name),
    reason: stripCsvFormula(args.reason),
  };
  const period = args.type === "absence" ? 0 : args.period;
  if (args.category === "other" && !args.reason.trim()) {
    throw new Error("reason_required");
  }
  if (args.type !== "absence" && (period < 1 || period > 7)) {
    throw new Error("bad_period");
  }

  const client = sb();
  if (client) {
    const { data, error } = await client.rpc("apply_repeat", {
      p_grade: args.grade,
      p_class: args.class,
      p_number: args.number,
      p_name: args.name,
      p_type: args.type,
      p_category: args.category,
      p_period: period,
      p_reason: args.reason,
      p_start: args.start,
      p_end: args.end,
    });
    if (error) throw new Error(rpcErrorMessage(error));
    const payload = (data ?? {}) as { dates?: string[]; count?: number };
    const dates = (payload.dates ?? []).map(String);
    // Cache each upserted weekday after server success.
    for (const date of dates) {
      await idb.putAttendance(ownerSub, {
        date,
        year: Number(date.slice(0, 4)),
        grade: args.grade,
        class: args.class,
        number: args.number,
        name: args.name,
        category: args.category,
        type: args.type,
        period,
        reason: args.reason,
        status: "draft",
      });
    }
    return { dates, count: payload.count ?? dates.length };
  }

  // Offline / no Supabase: same weekday loop, still all-or-nothing via sequential throws.
  const dates: string[] = [];
  const cur = new Date(args.start + "T12:00:00");
  const last = new Date(args.end + "T12:00:00");
  if (Number.isNaN(cur.getTime()) || Number.isNaN(last.getTime()) || cur > last) {
    throw new Error("bad_range");
  }
  while (cur <= last) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) {
      const date = cur.toISOString().slice(0, 10);
      await idb.putAttendance(ownerSub, {
        date,
        year: Number(date.slice(0, 4)),
        grade: args.grade,
        class: args.class,
        number: args.number,
        name: args.name,
        category: args.category,
        type: args.type,
        period,
        reason: args.reason,
        status: "draft",
      });
      dates.push(date);
    }
    cur.setDate(cur.getDate() + 1);
  }
  return { dates, count: dates.length };
}

function asRecord(r: Record<string, unknown>): AttendanceRecord {
  return {
    ownerSub: String(r.owner_id),
    date: String(r.date),
    year: Number(r.year),
    grade: Number(r.grade),
    class: Number(r.class),
    number: Number(r.number),
    name: String(r.name),
    category: r.category as AttendanceRecord["category"],
    type: r.type as AttendanceRecord["type"],
    period: Number(r.period),
    reason: String(r.reason ?? ""),
    status: r.status as AttendanceRecord["status"],
  };
}

export async function listAttendance(ownerSub: string): Promise<AttendanceRecord[]> {
  const client = sb();
  if (client) {
    const { data, error } = await client.from("entries").select("*").eq("owner_id", ownerSub);
    if (!error && data) {
      return data.map((r) => asRecord(r as Record<string, unknown>));
    }
  }
  return idb.listAttendance(ownerSub);
}

export async function listAttendanceByDate(
  ownerSub: string,
  date: string,
): Promise<AttendanceRecord[]> {
  const client = sb();
  if (client) {
    const { data, error } = await client
      .from("entries")
      .select("*")
      .eq("owner_id", ownerSub)
      .eq("date", date);
    if (!error && data) {
      return data.map((r) => asRecord(r as Record<string, unknown>));
    }
  }
  return idb.listAttendanceByDate(ownerSub, date);
}

export async function deleteAttendance(
  ownerSub: string,
  date: string,
  options?: { onlyDraft?: boolean },
): Promise<number> {
  const client = sb();
  if (!client) return idb.deleteAttendance(ownerSub, date, options);
  let q = client.from("entries").delete().eq("owner_id", ownerSub).eq("date", date);
  if (options?.onlyDraft) q = q.eq("status", "draft");
  const { data, error } = await q.select();
  if (error) throw new Error(error.message);
  const n = data?.length ?? 0;
  await idb.deleteAttendance(ownerSub, date, options);
  return n;
}

export async function deleteAllAttendance(ownerSub: string): Promise<number> {
  const client = sb();
  if (client) {
    const { data, error } = await client.from("entries").delete().eq("owner_id", ownerSub).select();
    if (error) throw new Error(error.message);
    const n = data?.length ?? 0;
    await idb.deleteAllAttendance(ownerSub);
    return n;
  }
  return idb.deleteAllAttendance(ownerSub);
}

export async function deleteAttendanceRecord(
  ownerSub: string,
  record: Pick<AttendanceRecord, "date" | "grade" | "class" | "number" | "period" | "type">,
): Promise<void> {
  const client = sb();
  if (!client) return idb.deleteAttendanceRecord(ownerSub, record);
  const { error } = await client
    .from("entries")
    .delete()
    .eq("owner_id", ownerSub)
    .eq("date", record.date)
    .eq("grade", record.grade)
    .eq("class", record.class)
    .eq("number", record.number)
    .eq("period", record.period)
    .eq("type", record.type);
  if (error) throw new Error(error.message);
  await idb.deleteAttendanceRecord(ownerSub, record);
}

export async function upsertStudent(
  ownerSub: string,
  student: Omit<Student, "ownerSub">,
): Promise<void> {
  const cur = await listRoster(ownerSub);
  const next = cur
    .filter((s) => !(s.grade === student.grade && s.class === student.class && s.number === student.number))
    .concat([{ ...student, ownerSub }])
    .map(({ ownerSub: _o, ...rest }) => rest);
  await replaceRoster(ownerSub, next);
}

export async function deleteStudent(
  ownerSub: string,
  student: Pick<Student, "grade" | "class" | "number">,
): Promise<void> {
  const cur = await listRoster(ownerSub);
  await replaceRoster(
    ownerSub,
    cur
      .filter((s) => !(s.grade === student.grade && s.class === student.class && s.number === student.number))
      .map(({ ownerSub: _o, ...rest }) => rest),
  );
}

const SETTINGS_KEY = "chulgyeol-class-settings";

export async function getSettings(ownerSub: string): Promise<ClassSettings> {
  const fallback: ClassSettings = { ownerSub, grade: 2, class: 3, capacity: 30 };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY + ":" + ownerSub);
    if (raw) Object.assign(fallback, JSON.parse(raw));
  } catch {
    /* ignore */
  }
  const client = sb();
  if (!client) return fallback;
  const { data } = await client.from("class_settings").select("*").eq("owner_id", ownerSub).maybeSingle();
  if (!data) return fallback;
  return {
    ownerSub,
    grade: Number(data.grade) || fallback.grade,
    class: Number(data.class) || fallback.class,
    capacity: Number(data.capacity) || fallback.capacity,
  };
}

export async function putSettings(ownerSub: string, s: Omit<ClassSettings, "ownerSub">): Promise<void> {
  localStorage.setItem(SETTINGS_KEY + ":" + ownerSub, JSON.stringify(s));
  const client = sb();
  if (!client) return;
  const { error } = await client.from("class_settings").upsert({
    owner_id: ownerSub,
    grade: s.grade,
    class: s.class,
    capacity: s.capacity,
  });
  if (error) throw new Error(error.message);
}
