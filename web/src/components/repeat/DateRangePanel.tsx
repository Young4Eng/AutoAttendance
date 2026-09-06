const DOW = ['일', '월', '화', '수', '목', '금', '토'] as const;

function dowLabel(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return DOW[new Date(y, m - 1, d).getDay()];
}

function chipLabel(ymd: string): string {
  const m = ymd.slice(5, 7);
  const d = ymd.slice(8, 10);
  return `${m}.${d}(${dowLabel(ymd)})`;
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

interface Props {
  start: string;
  end: string;
  days: string[];
  onStart: (v: string) => void;
  onEnd: (v: string) => void;
}

/** Step 3 — continuous date range + weekday preview chips. */
export function DateRangePanel({ start, end, days, onStart, onEnd }: Props) {
  const weekends = weekendCount(start, end);
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
            className="px-3 py-0.5 bg-surface-container-lowest text-[11px] font-semibold text-primary rounded shadow-sm"
            type="button"
          >
            연속 기간
          </button>
          <button
            className="px-3 py-0.5 text-outline text-[11px] font-medium cursor-not-allowed opacity-60"
            type="button"
            disabled
            title="추후 지원"
          >
            특정 날짜 복수 선택
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">시작일</label>
          <div className="flex items-center bg-surface-container-low rounded-lg px-4 py-2 gap-1.5">
            <span className="material-symbols-outlined text-outline text-[18px]">calendar_month</span>
            <input
              className="bg-transparent w-full text-on-surface text-xs font-medium focus:outline-none"
              type="date"
              value={start}
              onChange={(e) => onStart(e.target.value)}
              aria-label="시작일"
            />
            {start ? (
              <span className="text-[11px] font-semibold text-on-surface-variant shrink-0">
                ({dowLabel(start)})
              </span>
            ) : null}
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">종료일</label>
          <div className="flex items-center bg-surface-container-low rounded-lg px-4 py-2 gap-1.5">
            <span className="material-symbols-outlined text-outline text-[18px]">calendar_month</span>
            <input
              className="bg-transparent w-full text-on-surface text-xs font-medium focus:outline-none"
              type="date"
              value={end}
              onChange={(e) => onEnd(e.target.value)}
              aria-label="종료일"
            />
            {end ? (
              <span className="text-[11px] font-semibold text-on-surface-variant shrink-0">
                ({dowLabel(end)})
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="bg-surface-container-low rounded-lg p-4 flex items-start gap-2">
        <span className="material-symbols-outlined text-primary text-[20px] mt-0.5 shrink-0">
          filter_alt_off
        </span>
        <div className="flex flex-col min-w-0">
          <span className="text-[15px] font-medium text-on-surface">주말 자동 제외 필터 적용됨</span>
          <p className="text-[13px] text-on-surface-variant mt-0.5 mb-0">
            토·일요일({weekends}일)은 자동으로 생성에서 제외되며, 총 평일 {days.length}일간
            기록됩니다.
          </p>
          {days.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {days.map((d) => (
                <span
                  key={d}
                  className="px-2 py-0.5 rounded bg-surface-container-lowest text-[11px] font-medium text-on-surface"
                >
                  {chipLabel(d)}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
