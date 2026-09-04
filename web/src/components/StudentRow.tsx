import type {
  AttendanceRecord,
  AttendanceType,
  Category,
  Student,
} from '../types/models';
import { CategorySelect } from './CategorySelect';
import { TypeSelect } from './TypeSelect';
import { PeriodStepper } from './PeriodStepper';
import { ReasonField } from './ReasonField';
import { RowStatusChip } from './RowStatusChip';

export interface RowDraft {
  present: boolean;
  category: Category;
  type: AttendanceType;
  period: number;
  reason: string;
  status: AttendanceRecord['status'] | null;
  error?: string | null;
}

interface Props {
  student: Student;
  draft: RowDraft;
  periodCount: number;
  gapBefore?: number;
  onChange: (patch: Partial<RowDraft>) => void;
  onSave: () => void;
  onClear: () => void;
}

export function StudentRow({
  student,
  draft,
  periodCount,
  gapBefore = 0,
  onChange,
  onSave,
  onClear,
}: Props) {
  const reasonRequired = !draft.present && draft.category === 'other';
  return (
    <li
      className="StudentRow"
      style={gapBefore > 0 ? { marginTop: `${0.35 + gapBefore * 0.55}rem` } : undefined}
      data-number={student.number}
    >
      <div className="StudentRow-head">
        <span className="num" aria-label={`출석번호 ${student.number}`}>
          {student.number}
        </span>
        <span className="name">{student.name}</span>
        <RowStatusChip
          status={draft.present ? null : draft.status}
          present={draft.present}
        />
      </div>
      <div className="StudentRow-controls">
        <label className="check present-toggle">
          <input
            type="checkbox"
            checked={draft.present}
            onChange={(e) => onChange({ present: e.target.checked })}
          />
          출석
        </label>
        {!draft.present ? (
          <>
            <CategorySelect
              value={draft.category}
              onChange={(category) => onChange({ category })}
            />
            <TypeSelect
              value={draft.type}
              onChange={(type) => onChange({ type })}
            />
            <PeriodStepper
              value={draft.period}
              max={periodCount}
              onChange={(period) => onChange({ period })}
            />
            <ReasonField
              value={draft.reason}
              required={reasonRequired}
              error={draft.error}
              onChange={(reason) => onChange({ reason, error: null })}
            />
            <div className="row-actions">
              <button type="button" className="btn compact secondary" onClick={onSave}>
                저장
              </button>
              <button type="button" className="btn compact ghost" onClick={onClear}>
                출석으로
              </button>
            </div>
          </>
        ) : null}
      </div>
    </li>
  );
}
