interface Props {
  value: number;
  max: number;
  onChange: (p: number) => void;
  disabled?: boolean;
}

export function PeriodStepper({ value, max, onChange, disabled }: Props) {
  const clamp = (n: number) => Math.min(Math.max(1, n), Math.max(1, max));
  return (
    <div className="PeriodStepper field compact">
      <span>기준 교시 P</span>
      <div className="stepper">
        <button
          type="button"
          className="btn compact"
          disabled={disabled || value <= 1}
          onClick={() => onChange(clamp(value - 1))}
          aria-label="교시 감소"
        >
          −
        </button>
        <input
          type="number"
          min={1}
          max={max}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(clamp(Number(e.target.value) || 1))}
          aria-label="기준 교시"
        />
        <button
          type="button"
          className="btn compact"
          disabled={disabled || value >= max}
          onClick={() => onChange(clamp(value + 1))}
          aria-label="교시 증가"
        >
          +
        </button>
      </div>
    </div>
  );
}
