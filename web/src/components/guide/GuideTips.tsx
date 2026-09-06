type Props = { onNavRepeat?: () => void };

export function GuideTips({ onNavRepeat }: Props) {
  return (
    <section className="flex flex-col gap-4 mb-12" id="tips-section">
      <div>
        <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
          Teacher tips
        </span>
        <h2 className="text-lg font-semibold tracking-tight text-on-surface m-0">실무 팁</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded bg-primary-fixed flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]">event_repeat</span>
              </div>
              <h3 className="text-[15px] font-semibold text-on-surface m-0">장기·반복 일괄 등록</h3>
            </div>
            <p className="text-[13px] leading-5 text-on-surface-variant mb-4">
              같은 종류·구분으로 여러 날이 이어지면{" "}
              <strong className="text-on-surface font-medium">장기·반복</strong>에서 학생과
              시작일·종료일만 지정하세요. 주말(토·일)은 자동 제외됩니다. (#55 종류/구분/P 규칙 유지)
            </p>
          </div>
          <button
            type="button"
            className="text-left text-[11px] text-primary font-semibold inline-flex items-center gap-1"
            onClick={onNavRepeat}
          >
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            장기·반복 화면
          </button>
        </div>
        <div className="p-6 rounded-xl bg-surface-container-lowest shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded bg-tertiary-fixed flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-[18px]">extension</span>
            </div>
            <h3 className="text-[15px] font-semibold text-on-surface m-0">확장 연결 확인</h3>
          </div>
          <p className="text-[13px] leading-5 text-on-surface-variant mb-0">
            전송 전 나이스 출결 탭이 열려 있고 확장이 연결되어 있는지 확인하세요. 세션이 끊기면 나이스
            새로고침 후 다시 시도합니다.
          </p>
        </div>
        <div className="p-6 rounded-xl bg-surface-container-lowest shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded bg-surface-container-high flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-[18px]">info</span>
            </div>
            <h3 className="text-[15px] font-semibold text-on-surface m-0">중학교 전용</h3>
          </div>
          <p className="text-[13px] leading-5 text-on-surface-variant mb-0">
            출결메이트는 중학교 출결 초안용입니다. 고등학교 NEIS 체계와는 다릅니다.
          </p>
        </div>
        <div className="p-6 rounded-xl bg-surface-container-lowest shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded bg-primary-container flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined text-[18px]">lock</span>
            </div>
            <h3 className="text-[15px] font-semibold text-on-surface m-0">인증서·비밀번호</h3>
          </div>
          <p className="text-[13px] leading-5 text-on-surface-variant mb-0">
            나이스 인증서·비밀번호는 받지 않습니다. 나이스에 넣은 값은 나이스에 있습니다.
          </p>
        </div>
      </div>
    </section>
  );
}
