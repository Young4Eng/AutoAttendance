import { CHROME_STORE_URL } from "../../lib/storeLinks";
type Props = {
  onJump: (id: string) => void;
};

/** Hero + in-page anchors (guide.html density). */
export function GuideHero({ onJump }: Props) {
  const link =
    "inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-container text-on-surface-variant hover:text-primary hover:bg-surface-container-high text-[11px] font-semibold transition-colors";
  return (
    <header className="relative mb-8 p-6 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex flex-col gap-1 min-w-0">
        <div className="inline-flex items-center gap-1.5 text-primary text-[11px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span>교무업무 경감 가이드</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-on-surface m-0">
          출결메이트 사용 방법
        </h1>
        <p className="text-[13px] leading-5 text-on-surface-variant max-w-2xl m-0">
          나이스에 넣기 전 출결 예외를 정리하는 초안 도구입니다. 명단 → 이번 달 입력 → 미리보기 →
          확장 전송, 네 단계로 끝냅니다.
        </p>
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <button type="button" className={link} onClick={() => onJump("workflow-section")}>
            <span className="material-symbols-outlined text-[15px]">linear_scale</span>
            <span>4단계 출결 루틴</span>
          </button>
          <button type="button" className={link} onClick={() => onJump("csv-section")}>
            <span className="material-symbols-outlined text-[15px]">table</span>
            <span>명단 CSV</span>
          </button>
          <button type="button" className={link} onClick={() => onJump("tips-section")}>
            <span className="material-symbols-outlined text-[15px]">tips_and_updates</span>
            <span>실무 팁</span>
          </button>
          <button type="button" className={link} onClick={() => onJump("faq-section")}>
            <span className="material-symbols-outlined text-[15px]">help</span>
            <span>자주 묻는 질문</span>
          </button>
          <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer" className={link}>
            <span className="material-symbols-outlined text-[15px]">extension</span>
            <span>확장 설치</span>
          </a>
          <button
            type="button"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary-fixed text-on-primary-fixed hover:bg-primary hover:text-on-primary text-[11px] font-semibold transition-colors"
            onClick={() => onJump("privacy-section")}
          >
            <span className="material-symbols-outlined text-[15px]">shield</span>
            <span>개인정보 안내</span>
          </button>
        </div>
      </div>
    </header>
  );
}
