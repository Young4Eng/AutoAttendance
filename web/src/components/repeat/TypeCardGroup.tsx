import type { AttendanceType } from '../../types/models';

/** #55 — type cards only: 지각|조퇴|결석|결과 (ignore wrong stitch labels). */
const TYPES: {
  id: AttendanceType;
  label: string;
  subtitle: string;
  icon: string;
}[] = [
  { id: 'late', label: '지각', subtitle: '기준 교시 필요', icon: 'schedule' },
  { id: 'early_leave', label: '조퇴', subtitle: '기준 교시 필요', icon: 'logout' },
  { id: 'absence', label: '결석', subtitle: '종일 · 교시 없음', icon: 'person_off' },
  { id: 'result', label: '결과', subtitle: '기준 교시 필요', icon: 'swap_horiz' },
];

interface Props {
  value: AttendanceType;
  onChange: (t: AttendanceType) => void;
}

export function TypeCardGroup({ value, onChange }: Props) {
  return (
    <div>
      <label className="block text-xs font-medium text-on-surface-variant mb-1">출결 종류</label>
      <div
        className="grid grid-cols-4 gap-1.5 p-1 bg-surface-container rounded-lg"
        role="group"
        aria-label="출결 종류"
      >
        {TYPES.map((t) => {
          const on = value === t.id;
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(t.id)}
              className={
                on
                  ? 'flex flex-col items-center justify-center py-3 px-1.5 rounded-lg transition-all bg-teal-50 text-teal-900 shadow-sm relative'
                  : 'flex flex-col items-center justify-center py-3 px-1.5 rounded-lg transition-all bg-surface-container-low text-on-surface-variant hover:bg-surface-container relative'
              }
            >
              {on ? (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600" />
                </span>
              ) : null}
              <span
                className={
                  'material-symbols-outlined text-[20px] mb-1 ' +
                  (on ? 'text-teal-700' : 'text-outline')
                }
              >
                {t.icon}
              </span>
              <span className="text-[15px] font-semibold leading-tight">{t.label}</span>
              <span
                className={
                  'text-[10px] mt-0.5 truncate ' + (on ? 'text-teal-700/80' : 'text-outline')
                }
              >
                {t.subtitle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
