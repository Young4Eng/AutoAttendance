const DOW = ['일', '월', '화', '수', '목', '금', '토'] as const;

export type DateMode = 'range' | 'picks';

function dowLabel(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return DOW[new Date(y, m - 1, d).getDay()];
}

function chipLabel(ymd: string): string {
  return `${ymd.slice(5, 7)}.${ymd.slice(8, 10)}(${dowLabel(ymd)})`;
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function weekendCount(start: string, end: string): number {
  let n = 0;
  const cur = new Date(start + 'T12:00:00');
  const last = new Date(end + 'T12:00:00');
  if (Number.isNaN(cur.getTime()) || Number.isNaN(last.getTime()) || cur > last) return 0;
  while (cur <= last) {
    const day = cur.getDay();
    if (day === 0 || day === 6) n += 1;
    cur.setDate(cur.getDate() + 1);
  }
  return n;
}

function monthCells(year: number, month: number): Date[] {
  const first = new Date(year, month - 1, 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  const out: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push(d);
  }
  return out;
}

interface Props {
  mode: DateMode;
  start: string;
  end: string;
  days: string[];
  picks: string[];
  calYear: number;
  calMonth: number;
  onMode: (m: DateMode) => void;
  onStart: (v: string) => void;
  onEnd: (v: string) => void;
  onTogglePick: (ymd: string) => void;
  onCalPrev: () => void;
  onCalNext: () => void;
}

export function DateRangePanel({
  mode,
  start,
  end,
  days,
  picks,
  calYear,
  calMonth,
  onMode,
  onStart,
  onEnd,
  onTogglePick,
  onCalPrev,
  onCalNext,
}: Props) {
  const weekends = weekendCount(start, end);
  const cells = monthCells(calYear, calMonth);
  const pickSet = new Set(picks);
  const shown = mode === 'picks' ? [...picks].sort() : days;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-container text-on-primary-container text-[11px] font-bold">
            3
          </span>
          <h2 className="text-lg font-semibold text-on-surface m-0">날짜 및 기간 설정</h2>
        </div>
        <div className="flex items-center gap-1 bg-surface-container-low p-0.5 rounded-lg">
          <button
            className={
              mode === 'range'
                ? 'px-3 py-0.5 bg-surface-container-lowest text-[11px] font-semibold text-primary rounded shadow-sm'
                : 'px-3 py-0.5 text-outline text-[11px] font-medium'
            }
            type="button"
            onClick={() => onMode('range')}
          >
            연속 기간
          </button>
          <button
            className={
              mode === 'picks'
                ? 'px-3 py-0.5 bg-surface-container-lowest text-[11px] font-semibold text-primary rounded shadow-sm'
                : 'px-3 py-0.5 text-outline text-[11px] font-medium'
            }
            type="button"
            onClick={() => onMode('picks')}
          >
            특정 날짜 복수 선택
          </button>
        </div>
      </div>

      {mode === 'range' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">시작일</label>
              <div className="flex items-center bg-surface-container-low rounded-lg px-4 py-2 gap-1.5">
                <span className="material-symbols-outlined text-outline text-[18px]">calendar_month</span>
                <input className="bg-transparent w-full text-on-surface text-xs font-medium focus:outline-none" type="date" value={start} onChange={(e) => onStart(e.target.value)} />
                {start ? <span className="text-[11px] font-semibold text-on-surface-variant shrink-0">({dowLabel(start)})</span> : null}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">종료일</label>
              <div className="flex items-center bg-surface-container-low rounded-lg px-4 py-2 gap-1.5">
                <span className="material-symbols-outlined text-outline text-[18px]">calendar_month</span>
                <input className="bg-transparent w-full text-on-surface text-xs font-medium focus:outline-none" type="date" value={end} onChange={(e) => onEnd(e.target.value)} />
                {end ? <span className="text-[11px] font-semibold text-on-surface-variant shrink-0">({dowLabel(end)})</span> : null}
              </div>
            </div>
          </div>
          <div className="bg-surface-container-low rounded-lg p-4 flex items-start gap-2">
            <span className="material-symbols-outlined text-primary text-[20px] mt-0.5 shrink-0">filter_alt_off</span>
            <div className="flex flex-col min-w-0">
              <span className="text-[15px] font-medium text-on-surface">주말 자동 제외 필터 적용됨</span>
              <p className="text-[13px] text-on-surface-variant mt-0.5 mb-0">
                토·일요일({weekends}일)은 자동으로 생성에서 제외되며, 총 평일 {days.length}일간 기록됩니다.
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-surface-container-low rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <button type="button" className="p-1" onClick={onCalPrev} aria-label="이전 달">
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span className="text-sm font-semibold">{calYear}년 {calMonth}월</span>
            <button type="button" className="p-1" onClick={onCalNext} aria-label="다음 달">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
          <div className="grid grid-cols-7 text-center text-[11px] text-outline mb-1">
            {DOW.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d) => {
              const key = ymd(d);
              const out = d.getMonth() !== calMonth - 1;
              const wk = d.getDay() === 0 || d.getDay() === 6;
              const on = pickSet.has(key);
              return (
                <button
                  key={key + String(out)}
                  type="button"
                  disabled={wk}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!wk) onTogglePick(key);
                  }}
                  className={
                    'h-8 rounded text-xs ' +
                    (wk
                      ? 'text-outline/40 cursor-default'
                      : on
                        ? 'bg-primary-container text-on-primary font-semibold'
                        : out
                          ? 'bg-surface-container-lowest text-outline hover:bg-teal-50'
                          : 'bg-surface-container-lowest hover:bg-teal-50')
                  }
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
          <p className="text-[12px] text-on-surface-variant mt-2 mb-0">주말은 선택할 수 없습니다. 고른 평일 {picks.length}일.</p>
        </div>
      )}

      {shown.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {shown.map((d) => (
            <span key={d} className="px-2 py-0.5 rounded bg-surface-container-lowest text-[11px] font-medium text-on-surface">
              {chipLabel(d)}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
