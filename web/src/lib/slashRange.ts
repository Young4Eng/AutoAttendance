/** Slash slot ranges for type + period P (data-contract). */

import type { AttendanceType, Category } from '../types/models';
import { closeLabel } from './labels';

export const PERIOD_COUNT = 6;

export type SlotCode =
  | 'morning'
  | 'afternoon'
  | `period:${number}`;

export interface SlashRangeResult {
  /** Slots that receive `/` */
  slashSlots: SlotCode[];
  /** Remaining period slots stay 미마감 (not morning/afternoon) */
  unmarkedPeriodSlots: SlotCode[];
  closeLabel: string;
  /** Human-readable Korean hint for preview */
  hintText: string;
}

function periodSlot(n: number): SlotCode {
  return `period:${n}`;
}

/**
 * late: 조회 + 1…P
 * early_leave: P…n + 종례
 * absence: 조회 + all periods + 종례
 * result: P only
 */
export function computeSlashRange(
  type: AttendanceType,
  period: number,
  category: Category,
  periodCount: number = PERIOD_COUNT,
): SlashRangeResult {
  const n = Math.max(1, periodCount);
  const p = Math.min(Math.max(1, period), n);
  const slashSlots: SlotCode[] = [];

  switch (type) {
    case 'late':
      slashSlots.push('morning');
      for (let i = 1; i <= p; i++) slashSlots.push(periodSlot(i));
      break;
    case 'early_leave':
      for (let i = p; i <= n; i++) slashSlots.push(periodSlot(i));
      slashSlots.push('afternoon');
      break;
    case 'absence':
      slashSlots.push('morning');
      for (let i = 1; i <= n; i++) slashSlots.push(periodSlot(i));
      slashSlots.push('afternoon');
      break;
    case 'result':
      slashSlots.push(periodSlot(p));
      break;
  }

  const slashSet = new Set(slashSlots);
  const unmarkedPeriodSlots: SlotCode[] = [];
  for (let i = 1; i <= n; i++) {
    const s = periodSlot(i);
    if (!slashSet.has(s)) unmarkedPeriodSlots.push(s);
  }

  const label = closeLabel(category, type);
  const slotKo = (s: SlotCode): string => {
    if (s === 'morning') return '조회';
    if (s === 'afternoon') return '종례';
    return `${s.slice('period:'.length)}교시`;
  };
  const hintText = `마감 ${label} · / → ${slashSlots.map(slotKo).join(', ')}`;

  return { slashSlots, unmarkedPeriodSlots, closeLabel: label, hintText };
}
