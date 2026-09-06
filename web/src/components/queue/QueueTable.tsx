import type { AttendanceRecord } from '../../types/models';
import {
  displayStudentName,
  queueTypeChip,
  reasonDisplay,
  recordKey,
} from '../../lib/recordKey';
import { STATUS_LABELS } from '../../lib/labels';

interface Props {
  records: AttendanceRecord[];
  selected: Set<string>;
  evidence: Set<string>;
  onToggleRow: (key: string, checked: boolean) => void;
  onToggleEvidence: (key: string, checked: boolean) => void;
  onToggleGroup: (keys: string[], checked: boolean) => void;
}

const CHIP: Record<string, string> = {
  illness: 'bg-tertiary-fixed text-on-tertiary-fixed',
  unexcused: 'bg-secondary-fixed text-on-secondary-fixed',
  other: 'bg-inverse-primary text-on-primary-fixed-variant',
  recognized: 'bg-primary-fixed text-on-primary-fixed',
};

/** Dense queue table: 번호·성명·구분종류칩·사유·증빙·상태. */
export function QueueTable({
  records,
  selected,
  evidence,
  onToggleRow,
  onToggleEvidence,
  onToggleGroup,
}: Props) {
  const keys = records.map(recordKey);
  const allOn = keys.length > 0 && keys.every((k) => selected.has(k));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-[#E4E4E7] bg-white text-xs text-outline">
            <th className="py-2 px-3 w-10 text-center">
              <input
                type="checkbox"
                className="w-3.5 h-3.5 rounded border-[#E4E4E7] text-primary"
                checked={allOn}
                onChange={(e) => onToggleGroup(keys, e.target.checked)}
                aria-label="그룹 전체 선택"
              />
            </th>
            <th className="py-2 px-2 w-16 whitespace-nowrap">번호</th>
            <th className="py-2 px-2 w-20 whitespace-nowrap">성명</th>
            <th className="py-2 px-3 w-40 whitespace-nowrap">출결 구분</th>
            <th className="py-2 px-3">상세 사유</th>
            <th
              className="py-2 px-2 w-24 text-center whitespace-nowrap"
              title="교사 점검용 (미체크여도 전송 가능)"
            >
              증빙 확인
            </th>
            <th className="py-2 px-2 w-16 text-center whitespace-nowrap">상태</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E4E4E7] text-[13px]">
          {records.map((r) => {
            const key = recordKey(r);
            const on = selected.has(key);
            const ev = evidence.has(key);
            const chip = CHIP[r.category] ?? CHIP.other;
            const reason = reasonDisplay(r.reason);
            return (
              <tr key={key} className="hover:bg-surface-container-low transition-colors">
                <td className="py-1.5 px-3 text-center">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 rounded border-[#E4E4E7] text-primary"
                    checked={on}
                    onChange={(e) => onToggleRow(key, e.target.checked)}
                    aria-label={`${r.number}번 선택`}
                  />
                </td>
                <td className="py-1.5 px-2 text-outline whitespace-nowrap tnum">
                  {String(r.number).padStart(2, '0')}번
                </td>
                <td className="py-1.5 px-2 font-semibold text-on-surface whitespace-nowrap">
                  {displayStudentName(r)}
                </td>
                <td className="py-1.5 px-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${chip}`}
                  >
                    {queueTypeChip(r)}
                  </span>
                </td>
                <td
                  className="py-1.5 px-3 font-medium text-on-surface truncate max-w-[220px]"
                  title={reason}
                >
                  {reason}
                </td>
                <td className="py-1.5 px-2">
                  <label className="inline-flex items-center justify-center gap-1 cursor-pointer select-none w-full">
                    <input
                      type="checkbox"
                      className="w-3.5 h-3.5 rounded border-[#E4E4E7] text-primary focus:ring-primary"
                      checked={ev}
                      onChange={(e) => onToggleEvidence(key, e.target.checked)}
                    />
                    <span
                      className={`text-[11px] font-medium whitespace-nowrap ${ev ? 'text-primary' : 'text-outline'}`}
                    >
                      {ev ? '확인' : '미체크'}
                    </span>
                  </label>
                </td>
                <td className="py-1.5 px-2 text-center">
                  <span
                    className={`material-symbols-outlined text-[18px] ${ev || r.status === 'queued' ? 'text-primary' : 'text-outline'}`}
                    title={STATUS_LABELS[r.status]}
                  >
                    task_alt
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
