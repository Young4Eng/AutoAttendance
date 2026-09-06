/** Top hero: engine badge + title + verification chip. */
export function RepeatHero() {
  return (
    <section className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-primary text-xs font-medium uppercase tracking-wider mb-1">
          <span className="material-symbols-outlined text-[16px]">event_repeat</span>
          <span>출결 일괄 관리 엔진</span>
        </div>
        <h1 className="text-[32px] leading-10 font-semibold tracking-tight text-on-surface m-0">
          장기·반복 출결 등록
        </h1>
        <p className="text-[13px] leading-5 text-on-surface-variant mt-1 mb-0">
          학생 한 명을 지정하여 특정 기간이나 여러 날짜의 출결 예외를 일괄 생성합니다. 주말(토·일)은
          자동으로 제외됩니다.
        </p>
      </div>
      <div className="flex items-center gap-1.5 bg-surface-container-low px-4 py-2 rounded-lg shadow-sm shrink-0">
        <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
        <span className="text-[11px] font-semibold text-on-surface-variant">
          2학기 정규 출석인정 규정 자동 검증 중
        </span>
      </div>
    </section>
  );
}
