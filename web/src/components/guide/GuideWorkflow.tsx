type Props = {
  onNavRoster?: () => void;
  onNavMonth?: () => void;
  onNavPreview?: () => void;
};

/** Four-step routine cards with safe fixture copy. */
export function GuideWorkflow({ onNavRoster, onNavMonth, onNavPreview }: Props) {
  return (
    <section className="flex flex-col gap-4 mb-12" id="workflow-section">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
            Standard Workflow
          </span>
          <h2 className="text-lg font-semibold tracking-tight text-on-surface m-0">
            핵심 4단계 출결 루틴
          </h2>
        </div>
        <span className="text-xs text-on-surface-variant">
          순서대로 하면 나이스 전송 준비가 끝납니다
        </span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <article className="p-6 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-2 py-0.5 rounded bg-surface-container text-primary text-[11px] font-semibold">
                STEP 01
              </span>
              <span className="material-symbols-outlined text-[22px] text-outline">badge</span>
            </div>
            <h3 className="text-[15px] font-semibold text-on-surface m-0 mb-2">명단 CSV 가져오기</h3>
            <p className="text-[13px] leading-5 text-on-surface-variant mb-4">
              최초 1회. 헤더 <code className="text-xs">grade,class,number,name</code>. 결번은 만들지
              않습니다. 픽스처는 학생01·결번(1·2·3·4·7·9).
            </p>
            <div className="p-2 rounded-lg bg-surface-container-low flex flex-col gap-1 mb-4 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">01번 학생01</span>
                <span className="text-primary font-semibold">등록됨</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">02번 학생02</span>
                <span className="text-primary font-semibold">등록됨</span>
              </div>
              <div className="flex items-center justify-between text-secondary">
                <span>03번 (결번)</span>
                <span className="font-semibold">만들지 않음</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="text-left text-[11px] text-primary font-semibold inline-flex items-center gap-1"
            onClick={onNavRoster}
          >
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            명단 화면
          </button>
        </article>

        <article className="p-6 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed text-[11px] font-semibold">
                STEP 02
              </span>
              <span className="material-symbols-outlined text-[22px] text-primary">edit_calendar</span>
            </div>
            <h3 className="text-[15px] font-semibold text-on-surface m-0 mb-2">이번 달에서 예외 입력</h3>
            <p className="text-[13px] leading-5 text-on-surface-variant mb-4">
              날짜를 한 번 연 뒤 +결석/+지각/+조퇴/+결과로 줄을 만들고 구분·사유를 고릅니다. 결석에는
              교시 없음.
            </p>
            <div className="p-2 rounded-lg bg-surface-container-low flex flex-wrap gap-1 mb-4">
              <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] text-[11px] font-semibold">
                질병결석
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#CCFBF1] text-[#0F766E] text-[11px] font-semibold">
                인정조퇴
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#FFE4E6] text-[#BE123C] text-[11px] font-semibold">
                미인정지각
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#EDE9FE] text-[#5B21B6] text-[11px] font-semibold">
                기타결과
              </span>
            </div>
          </div>
          <button
            type="button"
            className="text-left text-[11px] text-primary font-semibold inline-flex items-center gap-1"
            onClick={onNavMonth}
          >
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            이번 달
          </button>
        </article>

        <article className="p-6 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-2 py-0.5 rounded bg-surface-container text-primary text-[11px] font-semibold">
                STEP 03
              </span>
              <span className="material-symbols-outlined text-[22px] text-outline">fact_check</span>
            </div>
            <h3 className="text-[15px] font-semibold text-on-surface m-0 mb-2">미리보기(대기열) 검토</h3>
            <p className="text-[13px] leading-5 text-on-surface-variant mb-4">
              보낼 건을 확인하고 증빙 메모를 체크합니다. 출결마감은 누르지 않습니다.
            </p>
            <div className="p-2 rounded-lg bg-surface-container-low flex flex-col gap-1 mb-4 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-on-surface font-medium">전송 대기</span>
                <span className="font-semibold text-primary">queued</span>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant">
                <span>증빙 메모</span>
                <span className="font-semibold text-on-surface">선택 사항</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="text-left text-[11px] text-primary font-semibold inline-flex items-center gap-1"
            onClick={onNavPreview}
          >
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            미리보기
          </button>
        </article>

        <article className="p-6 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary text-[11px] font-semibold">
                STEP 04
              </span>
              <span className="material-symbols-outlined text-[22px] text-secondary">send_to_mobile</span>
            </div>
            <h3 className="text-[15px] font-semibold text-on-surface m-0 mb-2">확장으로 나이스 전송</h3>
            <p className="text-[13px] leading-5 text-on-surface-variant mb-4">
              나이스 출결 탭을 연 뒤 미리보기에서 보냅니다. 최종 저장은 나이스에서 선생님이 확인합니다.
            </p>
            <div className="p-2 rounded-lg bg-secondary-fixed flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-secondary">bolt</span>
                <span className="text-[11px] font-semibold text-on-secondary-fixed">확장 전송</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-secondary text-[11px] font-semibold">
                마감 금지
              </span>
            </div>
          </div>
          <div className="text-[11px] text-on-surface-variant inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-secondary">done_all</span>
            <span>화면 확인 후 나이스 저장</span>
          </div>
        </article>
      </div>
    </section>
  );
}
