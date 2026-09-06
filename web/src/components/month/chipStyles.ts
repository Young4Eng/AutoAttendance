import type { AttendanceType, Category } from "../../types/models";
import { CATEGORY_LABELS, TYPE_LABELS } from "../../lib/labels";

/** Category-tinted mini chip backgrounds (text + color, not color-only). */
export function categoryChipShell(category: Category): string {
  if (category === "illness") return "bg-[#fff7ed] border-[#fed7aa]";
  if (category === "unexcused") return "bg-[#fef2f2] border-[#fecaca]";
  if (category === "recognized") return "bg-[#ecfdf5] border-[#a7f3d0]";
  return "bg-[#f0fdfa] border-[#99f6e4]";
}

export function categoryTextClass(category: Category): string {
  if (category === "illness") return "text-[#B45309]";
  if (category === "unexcused") return "text-[#BE123C]";
  if (category === "recognized") return "text-[#0F766E]";
  return "text-[#0F766E]";
}

export function typeChipClass(type: AttendanceType): string {
  if (type === "absence") return "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]";
  if (type === "late") return "bg-[#FFE4E6] text-[#9F1239] border-[#FECDD3]";
  if (type === "early_leave") return "bg-[#EDE9FE] text-[#5B21B6] border-[#DDD6FE]";
  return "bg-[#CCFBF1] text-[#0F766E] border-[#99F6E4]";
}

export function typeCategoryLabel(type: AttendanceType, category: Category): string {
  return `${TYPE_LABELS[type]}(${CATEGORY_LABELS[category]})`;
}

export const GRID_COLS =
  "repeat(5, minmax(0, 1.35fr)) repeat(2, minmax(0, 0.65fr))" as const;
