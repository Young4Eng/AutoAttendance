type Props = {
  year: number;
  month: number;
  classLabel?: string;
  rosterCount: number;
  semesterDays: number;
  monthTotal: number;
  /** Zero counts omitted (gaps). */
  breakdown: { label: string; count: number }[];
  onPrev: () => void;
  onToday: () => void;
  onNext: () => void;
};

/** Month title, nav, and stats chips (month.html density). */
export function MonthHero({
  year,
  month,
  classLabel,
  rosterCount,
  semesterDays,
  monthTotal,
  breakdown,
  onPrev,
  onToday,
  onNext,
}: Props) {
  const parts = breakdown.filter((b) => b.count > 0);
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
      <div className="flex flex-col gap-1">
        {classLabel ? (
          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <span className="inline-flex w-2 h-2 rounded-full bg-primary" />
            <span>
              {classLabel}
              {rosterCount > 0 ? (
                <span className="text-outline font-normal"> (총 {rosterCount}명)</span>
              ) : null}
            </span>
          </div>
        ) : null}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold tracking-tight text-on-surface m-0">
            {year}년 {month}월
          </h1>
          <div className="inline-flex items-center bg-surface-container rounded-lg p-0.5 gap-0.5 shadow-sm">
            <button
              type="button"
              aria-label="이전 달"
              className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors"
              onClick={onPrev}
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button
              type="button"
              className="px-2 py-0.5 rounded text-sm text-on-surface hover:bg-surface-container-highest transition-colors"
              onClick={onToday}
            >
              오늘
            </button>
            <button
              type="button"
              aria-label="다음 달"
              className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors"
              onClick={onNext}
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
        <p className="text-sm text-on-surface-variant m-0">
          예외 인원만 기록하면 크롬 확장이 나이스에 바로 입력합니다.
        </p>
      </div>
      <div className="flex items-center gap-3 self-start md:self-auto bg-surface-container-low px-4 py-2 rounded-xl shadow-sm">
        <div className="flex flex-col shrink-0">
          <span className="text-xs text-on-surface-variant">학기 누적 수업일수</span>
          <span className="text-lg font-semibold text-on-surface">
            {semesterDays}
            <span className="text-xs font-normal text-on-surface-variant ml-0.5">일</span>
          </span>
        </div>
        <div className="h-6 w-px bg-surface-container-high shrink-0" />
        <div className="flex flex-col shrink-0">
          <span className="text-xs text-on-surface-variant">이번 달 예외 총계</span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-semibold text-primary">
              {monthTotal}
              <span className="text-xs font-normal text-on-surface-variant ml-0.5">건</span>
            </span>
            {parts.length > 0 ? (
              <span className="text-xs text-on-surface-variant">
                ({parts.map((p) => `${p.label} ${p.count}`).join(" · ")})
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
