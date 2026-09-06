/** docs/data-contract.md · docs/auth.md */

export type Category = 'illness' | 'unexcused' | 'other' | 'recognized';
export type AttendanceType = 'late' | 'early_leave' | 'absence' | 'result';
export type RecordStatus = 'draft' | 'queued' | 'synced' | 'error';

export interface Owner {
  ownerSub: string;
  email?: string;
  displayName?: string;
}

export type EnrollStatus = 'enrolled' | 'transferred';

export interface Student {
  ownerSub: string;
  grade: number;
  class: number;
  number: number;
  name: string;
  status?: EnrollStatus;
  note?: string;
}

export interface ClassSettings {
  ownerSub: string;
  grade: number;
  class: number;
  capacity: number;
}

export interface AttendanceRecord {
  ownerSub: string;
  date: string; // YYYY-MM-DD
  year: number;
  grade: number;
  class: number;
  number: number;
  name: string;
  category: Category;
  type: AttendanceType;
  period: number;
  reason: string;
  status: RecordStatus;
}

export const CATEGORIES: readonly Category[] = [
  'illness',
  'unexcused',
  'other',
  'recognized',
] as const;

export const ATTENDANCE_TYPES: readonly AttendanceType[] = [
  'late',
  'early_leave',
  'absence',
  'result',
] as const;

export const RECORD_STATUSES: readonly RecordStatus[] = [
  'draft',
  'queued',
  'synced',
  'error',
] as const;

export const FIXTURE_OWNER_SUB = 'test-owner-aaa';
