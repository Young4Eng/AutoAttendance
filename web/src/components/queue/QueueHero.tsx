interface Props {
  total: number;
  grade?: number;
  classNum?: number;
  onSendAll: () => void;
}

/** Top hero: badges + title + coral bulk-send CTA. */
export function QueueHero({ total, grade, classNum, onSendAll }: Props) {
  const classLabel =
    grade != null && classNum != null ? `${grade}학년 ${classNum}반` : '학급';

  return (
    <section className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-3">
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-semibold whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            대기열 활성
          </span>
          <span className="text-xs text-outline tracking-wider uppercase whitespace-nowrap">
            NEIS BULK DISPATCH QUEUE
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface text-xs border border-[#E4E4E7] whitespace-nowrap font-medium">
            <span className="material-symbols-outlined text-[14px] text-primary">school</span>
            {classLabel}
          </span>
        </div>
        <div className="flex items-baseline gap-2 mt-1 flex-wrap">
          <h1 className="text-2xl text-on-surface font-semibold tracking-tight m-0">
            나이스 전송 대기열
          </h1>
          <span className="text-lg text-primary font-semibold">
            (총 {total}건 대기 중)
          </span>
        </div>
        <p className="text-sm text-on-surface-variant mt-0.5 mb-0">
          <span className="font-medium text-on-surface">{classLabel}</span> 출결 승인 대기
          목록입니다. 나이스에 이미 입력된 건을 다시 넣으면 오류가 납니다. 빈 칸만 보내세요.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 px-6 h-10 rounded-xl bg-secondary-container text-on-secondary shadow-md hover:bg-secondary transition-all active:scale-95 select-none focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
          title={`${total}건을 나이스로 전송 준비합니다`}
          onClick={onSendAll}
          disabled={total === 0}
        >
          <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
          <span className="font-semibold tracking-wide whitespace-nowrap">
            {total}건 한 번에 나이스로 전송
          </span>
        </button>
      </div>
    </section>
  );
}
