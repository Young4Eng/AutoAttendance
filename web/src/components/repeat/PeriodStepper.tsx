interface Props {
  value: number;
  onChange: (p: number) => void;
  max?: number;
}

/** #55 — period P required when type ≠ absence (parent hides for absence). */
export function PeriodStepper({ value, onChange, max = 7 }: Props) {
  const periods = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <div>
      <label className="block text-xs font-medium text-on-surface-variant mb-1">기준 교시 P</label>
      <p className="text-[11px] text-outline mb-1.5">지각·조퇴·결과만 필요. 결석은 교시 없음.</p>
      <div className="flex flex-wrap gap-1" role="group" aria-label="기준 교시">
        {periods.map((p) => {
          const on = value === p;
          return (
            <button
              key={p}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(p)}
              className={
                on
                  ? 'px-3 py-2 rounded-lg border text-sm bg-primary-container text-white border-primary-container'
                  : 'px-3 py-2 rounded-lg border border-[#E4E4E7] text-sm text-on-surface-variant hover:bg-surface-container'
              }
            >
              {p}교시
            </button>
          );
        })}
      </div>
    </div>
  );
}
