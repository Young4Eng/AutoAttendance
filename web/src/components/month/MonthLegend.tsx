/** Footer legend + tip from month.html. */
export function MonthLegend() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-surface-container-lowest rounded-xl shadow-sm mt-4">
      <div className="flex items-center flex-wrap gap-3">
        <span className="text-sm font-medium text-on-surface-variant shrink-0">사유 구분 범례:</span>
        <span className="inline-flex px-1.5 py-0.5 rounded bg-[#fff7ed] border border-[#fed7aa] text-[11px] font-semibold text-[#B45309]">
          질병 (결석·지각·조퇴)
        </span>
        <span className="inline-flex px-1.5 py-0.5 rounded bg-[#fef2f2] border border-[#fecaca] text-[11px] font-semibold text-[#BE123C]">
          미인정 (결석·지각·조퇴)
        </span>
        <span className="inline-flex px-1.5 py-0.5 rounded bg-[#ecfdf5] border border-[#a7f3d0] text-[11px] font-semibold text-primary">
          인정 (출석인정)
        </span>
        <span className="inline-flex px-1.5 py-0.5 rounded bg-[#f0fdfa] border border-[#99f6e4] text-[11px] font-semibold text-primary-container">
          기타 (학교장 허가 등)
        </span>
      </div>
      <div className="flex items-center gap-1 text-primary text-sm shrink-0">
        <span className="material-symbols-outlined text-[16px]">touch_app</span>
        <span>날짜 칸을 누르면 개별 사유 등록/수정 패널이 열립니다</span>
      </div>
    </div>
  );
}
