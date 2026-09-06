const CARDS = [
  {
    icon: "cloud_sync",
    label: "계정 동기화",
    value: "같은 구글이면 다른 PC",
    tone: "bg-primary-fixed text-primary",
  },
  {
    icon: "edit_calendar",
    label: "입력 방식",
    value: "예외만 기록",
    tone: "bg-surface-container-high text-on-surface",
  },
  {
    icon: "extension",
    label: "나이스 전송",
    value: "크롬 확장 연동",
    tone: "bg-tertiary-fixed text-tertiary",
  },
  {
    icon: "school",
    label: "지원 범위",
    value: "중학교 출결 초안",
    tone: "bg-surface-container text-primary",
  },
] as const;

/** Four summary cards (guide.html KPI row density, no hype numbers). */
export function GuideSummaryCards() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12" aria-label="요약">
      {CARDS.map((c) => (
        <div
          key={c.label}
          className="p-4 rounded-xl bg-surface-container-lowest shadow-sm flex items-center gap-3"
        >
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${c.tone}`}
          >
            <span className="material-symbols-outlined text-[22px]">{c.icon}</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-semibold text-on-surface-variant">{c.label}</span>
            <span className="text-lg font-semibold text-on-surface leading-snug">{c.value}</span>
          </div>
        </div>
      ))}
    </section>
  );
}
