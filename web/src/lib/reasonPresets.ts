import type { Category } from '../types/models';

export const REASON_PRESETS: Record<Category, string[]> = {
  illness: ['두통', '복통', '현기증', '구토', '설사', '감기', '인후통', '병원 진료'],
  unexcused: ['늦잠', '무단 외출', '등교 거부'],
  other: [],
  recognized: ['체험 학습', '외부대회 참석', '학교 프로그램 참여'],
};

export function reasonParts(raw: string): string[] {
  return String(raw || '')
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function toggleReason(current: string, chip: string): string {
  const parts = reasonParts(current);
  const i = parts.indexOf(chip);
  if (i >= 0) parts.splice(i, 1);
  else parts.push(chip);
  return parts.join(', ');
}
