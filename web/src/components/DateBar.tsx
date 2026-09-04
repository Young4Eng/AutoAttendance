import { PERIOD_COUNT } from '../lib/slashRange';

interface Props {
  date: string;
  periodCount: number;
  onDateChange: (date: string) => void;
  onPeriodCountChange: (n: number) => void;
}

export function DateBar({
  date,
  periodCount,
  onDateChange,
  onPeriodCountChange,
}: Props) {
  return (
    <div className="DateBar row-controls">
      <label className="field">
        <span>날짜</span>
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </label>
      <label className="field">
        <span>교시 수</span>
        <input
          type="number"
          min={1}
          max={12}
          value={periodCount}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n) && n >= 1) onPeriodCountChange(n);
          }}
          aria-label="하루 교시 수"
        />
      </label>
      <span className="muted tiny">기본 {PERIOD_COUNT}교시</span>
    </div>
  );
}
