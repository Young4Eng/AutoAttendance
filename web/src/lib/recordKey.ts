import type { AttendanceRecord, Category } from '../types/models';
import { CATEGORY_LABELS, TYPE_LABELS } from './labels';

/** Stable row id for selection / evidence memo (not persisted). */
export function recordKey(r: AttendanceRecord): string {
  return `${r.date}|${r.grade}|${r.class}|${r.number}|${r.period}|${r.type}|${r.category}`;
}

/** Display name — never invent stitch real names; empty → 학생NN. */
export function displayStudentName(r: Pick<AttendanceRecord, 'name' | 'number'>): string {
  const n = (r.name ?? '').trim();
  if (!n) return `학생${String(r.number).padStart(2, '0')}`;
  return n;
}

/**
 * #55 chip text: 구분 + 종류 (+ 교시 when not absence).
 * e.g. "질병 결석", "미인정 지각 (1교시)"
 */
export function queueTypeChip(r: Pick<AttendanceRecord, 'category' | 'type' | 'period'>): string {
  const base = `${CATEGORY_LABELS[r.category]} ${TYPE_LABELS[r.type]}`;
  if (r.type === 'absence' || r.period === 0) return base;
  return `${base} (${r.period}교시)`;
}

export function reasonDisplay(reason: string): string {
  const t = reason.trim();
  return t || '사유 미입력';
}

export type CategoryFilter = 'all' | Category;

export function weekOfMonth(ymd: string): 1 | 2 | 3 | 4 | 5 {
  const day = Number(ymd.slice(8, 10));
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  if (day <= 28) return 4;
  return 5;
}

const DOW = ['일', '월', '화', '수', '목', '금', '토'] as const;

export function formatDateKo(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${y}년 ${m}월 ${d}일 (${DOW[dt.getDay()]})`;
}
