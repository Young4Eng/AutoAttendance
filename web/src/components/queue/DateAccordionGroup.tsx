import { useMemo, useState } from 'react';
import type { AttendanceRecord, Category } from '../../types/models';
import { CATEGORY_LABELS } from '../../lib/labels';
import { formatDateKo, recordKey } from '../../lib/recordKey';
import { QueueTable } from './QueueTable';

interface Props {
  date: string;
  records: AttendanceRecord[];
  selected: Set<string>;
  evidence: Set<string>;
  defaultOpen?: boolean;
  onToggleRow: (key: string, checked: boolean) => void;
  onToggleEvidence: (key: string, checked: boolean) => void;
  onToggleGroup: (keys: string[], checked: boolean) => void;
}

function catSummary(rows: AttendanceRecord[]): string {
  const counts: Partial<Record<Category, number>> = {};
  for (const r of rows) counts[r.category] = (counts[r.category] ?? 0) + 1;
  return (Object.keys(counts) as Category[])
    .map((c) => `${CATEGORY_LABELS[c]} ${counts[c]}`)
    .join(' · ');
}

/** One date accordion: header + dense QueueTable. */
export function DateAccordionGroup({
  date,
  records,
  selected,
  evidence,
  defaultOpen = true,
  onToggleRow,
  onToggleEvidence,
  onToggleGroup,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const keys = useMemo(() => records.map(recordKey), [records]);
  const allOn = keys.length > 0 && keys.every((k) => selected.has(k));
  const summary = catSummary(records);

  return (
    <div className="rounded-xl bg-white border border-[#E4E4E7] shadow-sm overflow-hidden transition-all">
      <div
        className="flex items-center justify-between p-3 bg-surface-container-low border-b border-[#E4E4E7] cursor-pointer select-none"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-[#E4E4E7] text-primary focus:ring-primary"
            checked={allOn}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onToggleGroup(keys, e.target.checked)}
            aria-label={`${date} 전체 선택`}
          />
          <span className="w-2 h-4 rounded-full bg-primary shrink-0" />
          <h2 className="text-sm text-on-surface font-semibold m-0">{formatDateKo(date)}</h2>
          <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-semibold">
            {records.length}건 대기
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-outline hidden sm:inline">{summary}</span>
          <span
            className={`material-symbols-outlined text-[20px] text-outline transition-transform duration-200 ${open ? '' : 'rotate-180'}`}
          >
            expand_less
          </span>
        </div>
      </div>
      {open ? (
        <QueueTable
          records={records}
          selected={selected}
          evidence={evidence}
          onToggleRow={onToggleRow}
          onToggleEvidence={onToggleEvidence}
          onToggleGroup={onToggleGroup}
        />
      ) : null}
    </div>
  );
}
