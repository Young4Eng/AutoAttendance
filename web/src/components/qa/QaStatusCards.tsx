/** Three status cards — factual, no hype % / marketing. */
export function QaStatusCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary text-[22px]">deployed_code</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] font-semibold text-on-surface-variant">저장</span>
          <span className="text-[15px] font-semibold text-on-surface">출결메이트 계정 DB</span>
        </div>
      </div>
      <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-tertiary text-[22px]">gavel</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] font-semibold text-on-surface-variant">규칙</span>
          <span className="text-[15px] font-semibold text-on-surface truncate">
            종류/구분/P · #55
          </span>
        </div>
      </div>
      <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary-container/15 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary-container text-[22px]">
            extension
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] font-semibold text-on-surface-variant">전송</span>
          <span className="text-[15px] font-semibold text-primary">확장 → 나이스 (마감 금지)</span>
        </div>
      </div>
    </div>
  );
}
