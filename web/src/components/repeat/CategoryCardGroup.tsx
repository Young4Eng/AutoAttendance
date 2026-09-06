import type { Category } from '../../types/models';

/** #55 — category once: 질병|미인정|기타|출석인정. */
const CATS: {
  id: Category;
  label: string;
  subtitle: string;
  icon: string;
}[] = [
  { id: 'illness', label: '질병', subtitle: '진단서·처방전', icon: 'healing' },
  { id: 'unexcused', label: '미인정', subtitle: '무단·개인사정', icon: 'event_busy' },
  { id: 'other', label: '기타', subtitle: '학교장 사전승인', icon: 'help_outline' },
  { id: 'recognized', label: '출석인정', subtitle: '대회·격리·경조사', icon: 'task_alt' },
];

interface Props {
  value: Category;
  onChange: (c: Category) => void;
}

export function CategoryCardGroup({ value, onChange }: Props) {
  return (
    <div>
      <label className="block text-xs font-medium text-on-surface-variant mb-1">출결 구분</label>
      <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="출결 구분">
        {CATS.map((c) => {
          const on = value === c.id;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(c.id)}
              className={
                on
                  ? 'flex flex-col items-center justify-center py-3 px-1.5 rounded-lg transition-all bg-amber-50 text-amber-900 shadow-sm relative'
                  : 'flex flex-col items-center justify-center py-3 px-1.5 rounded-lg transition-all bg-surface-container-low text-on-surface-variant hover:bg-surface-container relative'
              }
            >
              {on ? (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600" />
                </span>
              ) : null}
              <span
                className={
                  'material-symbols-outlined text-[20px] mb-1 ' +
                  (on ? 'text-amber-700' : 'text-outline')
                }
              >
                {c.icon}
              </span>
              <span className="text-[15px] font-semibold leading-tight">{c.label}</span>
              <span
                className={
                  'text-[10px] mt-0.5 truncate ' + (on ? 'text-amber-700/80' : 'text-outline')
                }
              >
                {c.subtitle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
