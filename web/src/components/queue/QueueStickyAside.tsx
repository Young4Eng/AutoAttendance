import type { Category } from '../../types/models';
import { CATEGORY_LABELS } from '../../lib/labels';

interface Props {
  total: number;
  byCategory: Record<Category, number>;
  evidenceChecked: number;
  onSend: () => void;
  onClearQueue: () => void;
}

const LEGEND: { cat: Category; bar: string; dot: string }[] = [
  { cat: 'illness', bar: 'stroke-tertiary-container', dot: 'bg-tertiary-container' },
  { cat: 'unexcused', bar: 'stroke-secondary', dot: 'bg-secondary' },
  { cat: 'recognized', bar: 'stroke-primary', dot: 'bg-primary' },
  { cat: 'other', bar: 'stroke-outline', dot: 'bg-outline' },
];

/** Right sticky: category pie + evidence counters + safety notes + CTAs. */
export function QueueStickyAside({
  total,
  byCategory,
  evidenceChecked,
  onSend,
  onClearQueue,
}: Props) {
  const unchecked = Math.max(0, total - evidenceChecked);
  let offset = 0;
  const arcs = LEGEND.map(({ cat, bar, dot }) => {
    const n = byCategory[cat] ?? 0;
    const pct = total > 0 ? (n / total) * 100 : 0;
    const item = { cat, bar, dot, n, pct, offset };
    offset -= pct;
    return item;
  });

  return (
    <div className="lg:col-span-4 flex flex-col gap-3 w-full lg:sticky lg:top-4 self-start">
      <div className="p-4 rounded-xl bg-white border border-[#E4E4E7] shadow-sm flex flex-col gap-2">
        <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-2">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-primary">pie_chart</span>
            <span className="text-sm text-on-surface font-semibold">대기 누적 현황</span>
          </div>
          <span className="text-xs font-semibold text-primary px-2 py-0.5 rounded-full bg-primary-fixed">
            총 {total}건 대기
          </span>
        </div>
        <div className="flex items-center justify-center py-2 relative">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36" aria-hidden>
            <circle
              className="stroke-surface-container-high"
              cx="18"
              cy="18"
              fill="none"
              r="15.5"
              strokeWidth="3.5"
            />
            {arcs.map((a) =>
              a.n > 0 ? (
                <circle
                  key={a.cat}
                  className={a.bar}
                  cx="18"
                  cy="18"
                  fill="none"
                  r="15.5"
                  strokeDasharray={a.pct > 0 ? `${a.pct} 100` : '0 100'}
                  strokeDashoffset={a.offset}
                  strokeWidth="3.8"
                />
              ) : null,
            )}
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold text-on-surface leading-none">{total}</span>
            <span className="text-[11px] text-outline mt-0.5">대기 건수</span>
          </div>
        </div>
        <div className="flex flex-col gap-1 pt-1 text-[13px]">
          {arcs.map((a) => (
            <div
              key={a.cat}
              className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-surface-container-low transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${a.dot}`} />
                <span className="text-on-surface-variant font-medium">{CATEGORY_LABELS[a.cat]}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-outline text-xs">
                  {total > 0 ? `${a.pct.toFixed(1)}%` : '—'}
                </span>
                <span className="font-semibold text-on-surface w-10 text-right">{a.n}건</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-white border border-[#E4E4E7] shadow-sm flex flex-col gap-2">
        <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-2">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-primary">checklist</span>
            <span className="text-sm text-on-surface font-semibold">서류 점검 체크</span>
          </div>
          <span className="text-xs text-primary font-medium bg-surface-container px-2 py-0.5 rounded-full">
            {evidenceChecked} / {total}건 확인됨
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="p-2 rounded-lg bg-surface-container-low border border-[#E4E4E7] flex flex-col items-center text-center">
            <span className="text-xs text-on-surface-variant">서류 확인</span>
            <span className="text-xl font-bold text-primary mt-0.5">
              {evidenceChecked}
              <span className="text-xs font-normal text-on-surface-variant">건</span>
            </span>
          </div>
          <div className="p-2 rounded-lg bg-surface-container-low border border-[#E4E4E7] flex flex-col items-center text-center">
            <span className="text-xs text-outline">미체크 (메모용)</span>
            <span className="text-xl font-bold text-on-surface mt-0.5">
              {unchecked}
              <span className="text-xs font-normal text-outline">건</span>
            </span>
          </div>
        </div>
        <div className="flex items-start gap-1.5 p-2 rounded-lg bg-primary-fixed/30 border border-[#E4E4E7] mt-1 text-xs">
          <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">
            check_circle
          </span>
          <p className="text-on-surface leading-snug m-0">
            <strong className="font-semibold text-primary">
              체크 여부와 무관하게 {total}건 모두 전송 가능합니다.
            </strong>{' '}
            증빙 체크는 담임 서류 수합용 메모입니다.
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-surface-container-low border border-[#E4E4E7] shadow-sm flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary mb-1">
          <span className="material-symbols-outlined text-[20px]">security</span>
          <span className="text-sm font-semibold text-on-surface">나이스 전송 안전 수칙</span>
        </div>
        <ul className="flex flex-col gap-1.5 text-[13px] text-on-surface-variant list-none pl-0 m-0 break-keep">
          <li className="flex items-start gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">
              check_circle
            </span>
            <span>
              <strong>확장 직접 주입</strong>: 외부 서버 없이 브라우저 나이스 탭에 채웁니다.
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">
              check_circle
            </span>
            <span>
              <strong>계정 동기화</strong>: 교사 계정별로 이어서 작업할 수 있습니다.
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">
              check_circle
            </span>
            <span>
              <strong>최종 저장</strong>: 전송 후 나이스에서 누락·오류를 직접 검토·저장하세요.
            </span>
          </li>
        </ul>
        <button
          type="button"
          className="mt-2 w-full inline-flex items-center justify-center gap-2 h-10 rounded-xl bg-secondary-container text-on-secondary font-semibold shadow-md hover:bg-secondary transition-all disabled:opacity-40"
          onClick={onSend}
          disabled={total === 0}
        >
          <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
          {total}건 한 번에 전송
        </button>
        <button
          type="button"
          className="w-full text-xs text-on-surface-variant hover:text-on-surface py-1"
          onClick={onClearQueue}
        >
          대기만 초안으로 되돌리기
        </button>
      </div>
    </div>
  );
}
