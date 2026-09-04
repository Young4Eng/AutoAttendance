/** Korean labels for data-contract enums — keep codes separate from UI text. */

import type { AttendanceType, Category, RecordStatus } from '../types/models';

export const CATEGORY_LABELS: Record<Category, string> = {
  illness: '질병',
  unexcused: '미인정',
  other: '기타',
  recognized: '출석인정',
};

export const TYPE_LABELS: Record<AttendanceType, string> = {
  late: '지각',
  early_leave: '조퇴',
  absence: '결석',
  result: '결과',
};

export const STATUS_LABELS: Record<RecordStatus, string> = {
  draft: '미입력',
  queued: '대기',
  synced: '반영',
  error: '오류',
};

/** Close-column label e.g. 질병지각 */
export function closeLabel(category: Category, type: AttendanceType): string {
  return `${CATEGORY_LABELS[category]}${TYPE_LABELS[type]}`;
}
