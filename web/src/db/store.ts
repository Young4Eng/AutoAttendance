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
  const client = sb();
  if (!client) return idb.replaceRoster(ownerSub, students);
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
  if (error) throw new Error(error.message);
}

export async function listRoster(ownerSub: string): Promise<Student[]> {
  const client = sb();
  if (!client) return idb.listRoster(ownerSub);
  const { data, error } = await client.from("roster").select("*").eq("owner_id", ownerSub);
  if (error) throw new Error(error.message);
  return (data ?? [])
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
  const client = sb();
  if (!client) return idb.putAttendance(ownerSub, record);
  if (record.category === "other" && !record.reason.trim()) {
    throw new Error("reason_required_for_other");
  }
  if (record.type !== "absence" && record.period < 1) {
    throw new Error("invalid_period");
  }
  const { error } = await client.from("entries").upsert(rowOf(ownerSub, record));
  if (error) throw new Error(error.message);
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
  if (!client) return idb.listAttendance(ownerSub);
  const { data, error } = await client.from("entries").select("*").eq("owner_id", ownerSub);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => asRecord(r as Record<string, unknown>));
}

export async function listAttendanceByDate(
  ownerSub: string,
  date: string,
): Promise<AttendanceRecord[]> {
  const client = sb();
  if (!client) return idb.listAttendanceByDate(ownerSub, date);
  const { data, error } = await client
    .from("entries")
    .select("*")
    .eq("owner_id", ownerSub)
    .eq("date", date);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => asRecord(r as Record<string, unknown>));
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
