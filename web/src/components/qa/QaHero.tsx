export type QaTab = "all" | "release" | "faq" | "suggest";

type Props = {
  tab: QaTab;
  onTab: (t: QaTab) => void;
};

const TABS: { id: QaTab; label: string }[] = [
  { id: "all", label: "전체보기" },
  { id: "release", label: "릴리즈 패치 노트" },
  { id: "faq", label: "자주 묻는 질문(Q&A)" },
  { id: "suggest", label: "기능 제안·오류 제보" },
];

/** Hero + tab filter (qa.html density). */
export function QaHero({ tab, onTab }: Props) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            <span
              className="material-symbols-outlined text-[15px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
            <span className="text-[11px] font-semibold tracking-wide">버전 히스토리 & FAQ</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-on-surface m-0">
            패치 노트 및 Q&A
          </h1>
          <p className="text-[13px] leading-5 text-on-surface-variant max-w-2xl m-0">
            출결메이트 업데이트 요약과 담임 업무에서 자주 나오는 질문입니다. (#55 종류/구분/P ·
            출결마감 안 함)
          </p>
        </div>
        <div
          className="inline-flex p-1 bg-surface-container rounded-xl gap-1 self-start lg:self-auto flex-wrap"
          role="tablist"
          aria-label="패치·Q&A 구분"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={
                tab === t.id
                  ? "px-3 py-2 rounded-lg text-xs font-semibold bg-surface-container-lowest text-primary shadow-sm transition-all"
                  : "px-3 py-2 rounded-lg text-xs font-medium text-on-surface-variant hover:text-on-surface transition-all"
              }
              onClick={() => onTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
