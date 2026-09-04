import type { AttendanceType } from '../types/models';
import { ATTENDANCE_TYPES } from '../types/models';
import { TYPE_LABELS } from '../lib/labels';

interface Props {
  value: AttendanceType;
  onChange: (t: AttendanceType) => void;
  disabled?: boolean;
  id?: string;
}

export function TypeSelect({ value, onChange, disabled, id }: Props) {
  return (
    <label className="field compact">
      <span>종류</span>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as AttendanceType)}
      >
        {ATTENDANCE_TYPES.map((t) => (
          <option key={t} value={t}>
            {TYPE_LABELS[t]}
          </option>
        ))}
      </select>
    </label>
  );
}
