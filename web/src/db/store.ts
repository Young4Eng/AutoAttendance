import type { AttendanceRecord, Student } from "../types/models";
import * as idb from "./idb";
import { getSupabase } from "./supabaseClient";

function sb() {
  return getSupabase();
}

export async function replaceRoster(
  ownerSub: string,
  students: Omit<Student, "ownerSub">[],
): Promise<void> {
  await idb.replaceRoster(ownerSub, students);
  const client = sb();
  if (!client) return;
  await client.from("roster").delete().eq("owner_id", ownerSub);
  if (students.length === 0) return;
  const { error } = await client.from("roster").insert(
    students.map((s) => ({
      owner_id: ownerSub,
      grade: s.grade,
      class: s.class,
      number: s.number,
      name: s.name,
    })),
  );
  if (error) {
    // 브라우저 DB에는 있음. 클라우드만 실패.
    console.warn(error.message);
  }
}

export async function listRoster(ownerSub: string): Promise<Student[]> {
  const local = await idb.listRoster(ownerSub);
  const client = sb();
  if (!client) return local;
  const { data, error } = await client.from("roster").select("*").eq("owner_id", ownerSub);
  if (error || !data || data.length === 0) return local;
  return data
    .map((r) => ({
      ownerSub,
      grade: r.grade,
      class: r.class,
      number: r.number,
      name: r.name,
    }))
    .sort((a, b) => a.number - b.number);
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
    reason: r.reason,
    status: r.status,
  };
}

export async function putAttendance(
  ownerSub: string,
  record: Omit<AttendanceRecord, "ownerSub">,
): Promise<void> {
  if (record.category === "other" && !record.reason.trim()) {
    throw new Error("reason_required_for_other");
  }
  if (record.type !== "absence" && record.period < 1) {
    throw new Error("invalid_period");
  }
  await idb.putAttendance(ownerSub, record);
  const client = sb();
  if (!client) return;
  const { error } = await client.from("entries").upsert(rowOf(ownerSub, record));
  if (error) console.warn(error.message);
}

function recKey(r: Pick<AttendanceRecord, "date" | "grade" | "class" | "number" | "type" | "period">) {
  return `${r.date}|${r.grade}|${r.class}|${r.number}|${r.type}|${r.period}`;
}

function mergeAttendance(local: AttendanceRecord[], remote: AttendanceRecord[]) {
  const map = new Map<string, AttendanceRecord>();
  for (const r of remote) map.set(recKey(r), r);
  for (const r of local) map.set(recKey(r), r);
  return [...map.values()];
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
  const local = await idb.listAttendance(ownerSub);
  const client = sb();
  if (!client) return local;
  const { data, error } = await client.from("entries").select("*").eq("owner_id", ownerSub);
  if (error || !data) return local;
  return mergeAttendance(local, data.map((r) => asRecord(r as Record<string, unknown>)));
}

export async function listAttendanceByDate(
  ownerSub: string,
  date: string,
): Promise<AttendanceRecord[]> {
  const local = await idb.listAttendanceByDate(ownerSub, date);
  const client = sb();
  if (!client) return local;
  const { data, error } = await client
    .from("entries")
    .select("*")
    .eq("owner_id", ownerSub)
    .eq("date", date);
  if (error || !data) return local;
  return mergeAttendance(local, data.map((r) => asRecord(r as Record<string, unknown>)));
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
  return data?.length ?? 0;
}

export async function deleteAllAttendance(ownerSub: string): Promise<number> {
  const n = await idb.deleteAllAttendance(ownerSub);
  const client = sb();
  if (client) {
    const { error } = await client.from("entries").delete().eq("owner_id", ownerSub);
    if (error) console.warn(error.message);
  }
  return n;
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
}
