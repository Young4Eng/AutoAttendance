import type { AttendanceType, Category } from '../types/models';
import { computeSlashRange } from '../lib/slashRange';

interface Props {
  category: Category;
  type: AttendanceType;
  period: number;
  periodCount: number;
}

export function SlashRangeHint({ category, type, period, periodCount }: Props) {
  const range = computeSlashRange(type, period, category, periodCount);
  return (
    <p className="SlashRangeHint muted tiny" title={range.hintText}>
      {range.hintText}
    </p>
  );
}
