/**
 * IndexedDB partitioned by ownerSub.
 * Keys always start with ownerSub| so other partitions are not opened by API.
 */

import type { AttendanceRecord, Student } from '../types/models';

const DB_NAME = 'autoattend';
const DB_VERSION = 1;
const STORE_STUDENTS = 'students';
const STORE_ATTENDANCE = 'attendance';

function requireOwnerSub(ownerSub: string): string {
  const s = ownerSub.trim();
  if (!s) {
    throw new Error('ownerSub_required');
  }
  return s;
}

function studentKey(s: Pick<Student, 'ownerSub' | 'grade' | 'class' | 'number'>): string {
  return `${s.ownerSub}|${s.grade}|${s.class}|${s.number}`;
}

function attendanceKey(r: Pick<
  AttendanceRecord,
  'ownerSub' | 'date' | 'grade' | 'class' | 'number' | 'period' | 'type'
>): string {
  return `${r.ownerSub}|${r.date}|${r.grade}|${r.class}|${r.number}|${r.period}|${r.type}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error('idb_open'));
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_STUDENTS)) {
        db.createObjectStore(STORE_STUDENTS);
      }
      if (!db.objectStoreNames.contains(STORE_ATTENDANCE)) {
        db.createObjectStore(STORE_ATTENDANCE);
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

function ownerRange(ownerSub: string): IDBKeyRange {
  const prefix = `${ownerSub}|`;
  return IDBKeyRange.bound(prefix, `${prefix}\uffff`, false, false);
}

export async function replaceRoster(
  ownerSub: string,
  students: Omit<Student, 'ownerSub'>[],
): Promise<void> {
  const owner = requireOwnerSub(ownerSub);
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_STUDENTS, 'readwrite');
    const store = tx.objectStore(STORE_STUDENTS);
    const range = ownerRange(owner);
    const clearReq = store.openCursor(range);
    clearReq.onerror = () => reject(clearReq.error ?? new Error('idb_clear'));
    clearReq.onsuccess = () => {
      const cursor = clearReq.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
        return;
      }
      for (const row of students) {
        const record: Student = { ...row, ownerSub: owner };
        store.put(record, studentKey(record));
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('idb_tx'));
  });
  db.close();
}

export async function listRoster(ownerSub: string): Promise<Student[]> {
  const owner = requireOwnerSub(ownerSub);
  const db = await openDb();
  const rows = await new Promise<Student[]>((resolve, reject) => {
    const tx = db.transaction(STORE_STUDENTS, 'readonly');
    const store = tx.objectStore(STORE_STUDENTS);
    const req = store.openCursor(ownerRange(owner));
    const out: Student[] = [];
    req.onerror = () => reject(req.error ?? new Error('idb_list'));
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) {
        resolve(out);
        return;
      }
      const value = cursor.value as Student;
      if (value.ownerSub === owner) {
        out.push(value);
      }
      cursor.continue();
    };
  });
  db.close();
  return rows.sort((a, b) => a.number - b.number);
}

export async function putAttendance(
  ownerSub: string,
  record: Omit<AttendanceRecord, 'ownerSub'>,
): Promise<void> {
  const owner = requireOwnerSub(ownerSub);
  if (record.category === 'other' && !record.reason.trim()) {
    throw new Error('reason_required_for_other');
  }
  if (record.type !== 'absence' && record.period < 1) {
    throw new Error('invalid_period');
  }
  const full: AttendanceRecord = { ...record, ownerSub: owner };
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_ATTENDANCE, 'readwrite');
    tx.objectStore(STORE_ATTENDANCE).put(full, attendanceKey(full));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('idb_put'));
  });
  db.close();
}

export async function listAttendance(ownerSub: string): Promise<AttendanceRecord[]> {
  const owner = requireOwnerSub(ownerSub);
  const db = await openDb();
  const rows = await new Promise<AttendanceRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORE_ATTENDANCE, 'readonly');
    const store = tx.objectStore(STORE_ATTENDANCE);
    const req = store.openCursor(ownerRange(owner));
    const out: AttendanceRecord[] = [];
    req.onerror = () => reject(req.error ?? new Error('idb_list_att'));
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) {
        resolve(out);
        return;
      }
      const value = cursor.value as AttendanceRecord;
      if (value.ownerSub === owner) {
        out.push(value);
      }
      cursor.continue();
    };
  });
  db.close();
  return rows;
}

function ownerDateRange(ownerSub: string, date: string): IDBKeyRange {
  const prefix = `${ownerSub}|${date}|`;
  return IDBKeyRange.bound(prefix, `${prefix}\uffff`, false, false);
}

export async function listAttendanceByDate(
  ownerSub: string,
  date: string,
): Promise<AttendanceRecord[]> {
  const owner = requireOwnerSub(ownerSub);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('invalid_date');
  }
  const db = await openDb();
  const rows = await new Promise<AttendanceRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORE_ATTENDANCE, 'readonly');
    const store = tx.objectStore(STORE_ATTENDANCE);
    const req = store.openCursor(ownerDateRange(owner, date));
    const out: AttendanceRecord[] = [];
    req.onerror = () => reject(req.error ?? new Error("idb_list_att_date"));
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) {
        resolve(out);
        return;
      }
      const value = cursor.value as AttendanceRecord;
      if (value.ownerSub === owner && value.date === date) {
        out.push(value);
      }
      cursor.continue();
    };
  });
  db.close();
  return rows.sort((a, b) => a.number - b.number || a.period - b.period);
}

export async function deleteAttendance(
  ownerSub: string,
  date: string,
  options?: { onlyDraft?: boolean },
): Promise<number> {
  const owner = requireOwnerSub(ownerSub);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('invalid_date');
  }
  const onlyDraft = options?.onlyDraft ?? false;
  const db = await openDb();
  const deleted = await new Promise<number>((resolve, reject) => {
    const tx = db.transaction(STORE_ATTENDANCE, 'readwrite');
    const store = tx.objectStore(STORE_ATTENDANCE);
    const req = store.openCursor(ownerDateRange(owner, date));
    let count = 0;
    req.onerror = () => reject(req.error ?? new Error("idb_del_att"));
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) {
        return;
      }
      const value = cursor.value as AttendanceRecord;
      if (value.ownerSub === owner && value.date === date) {
        if (!onlyDraft || value.status === 'draft') {
          cursor.delete();
          count += 1;
        }
      }
      cursor.continue();
    };
    tx.oncomplete = () => resolve(count);
    tx.onerror = () => reject(tx.error ?? new Error("idb_del_tx"));
  });
  db.close();
  return deleted;
}

export async function deleteAttendanceRecord(
  ownerSub: string,
  record: Pick<
    AttendanceRecord,
    'date' | 'grade' | 'class' | 'number' | 'period' | 'type'
  >,
): Promise<void> {
  const owner = requireOwnerSub(ownerSub);
  const key = attendanceKey({ ...record, ownerSub: owner });
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_ATTENDANCE, 'readwrite');
    tx.objectStore(STORE_ATTENDANCE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("idb_del_one"));
  });
  db.close();
}
