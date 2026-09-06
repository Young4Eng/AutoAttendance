import type { AttendanceType, Category } from '../../types/models';
import { CATEGORY_LABELS, TYPE_LABELS } from '../../lib/labels';

export type PendingItem = {
  id: string;
  number: number;
  name: string;
  category: Category;
  type: AttendanceType;
  period: number;
  start: string;
  end: string;
  dayCount: number;
  reason: string;
  createdLabel: string;
};

function displayName(number: number, name: string): string {
  const n = (name ?? '').trim();
  if (!n) return `학생${String(number).padStart(2, '0')}`;
  return n;
}

function chipClass(category: Category): string {
  if (category === 'illness') return 'bg-amber-100 text-amber-900';
  if (category === 'unexcused') return 'bg-rose-100 text-rose-900';
  if (category === 'other') return 'bg-purple-100 text-purple-900';
  return 'bg-teal-100 text-teal-900';
}

function typeChip(item: PendingItem): string {
  const base = `${CATEGORY_LABELS[item.category]} ${TYPE_LABELS[item.type]}`;
  if (item.type === 'absence' || item.period === 0) return base;
  return `${base} (${item.period}교시)`;
}

interface Props {
  items: PendingItem[];
  onRemove: (id: string) => void;
}

/** Right column — session pending / applied batches (no stitch real-name mocks). */
export function RepeatPendingList({ items, onRemove }: Props) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-[20px]">rule</span>
          <h3 className="text-lg font-semibold text-on-surface m-0">등록 대기 및 적용 내역</h3>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-[11px] font-semibold text-on-primary-fixed-variant">
          총 {items.length}건 대기
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-on-surface-variant m-0 py-6 text-center">
          아직 등록한 장기·반복 건이 없습니다.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-lg bg-surface-container-low flex flex-col gap-1.5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[15px] font-semibold text-on-surface truncate">
                    {String(item.number).padStart(2, '0')}번 {displayName(item.number, item.name)}
                  </span>
                  <span
                    className={
                      'px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ' +
                      chipClass(item.category)
                    }
                  >
                    {typeChip(item)}
                  </span>
                </div>
                <button
                  className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors shrink-0"
                  title="목록에서 제거"
                  type="button"
                  onClick={() => onRemove(item.id)}
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-on-surface-variant text-xs font-medium mt-1">
                <span className="material-symbols-outlined text-[16px] text-primary shrink-0">
                  date_range
                </span>
                <span className="truncate">
                  {item.start.replace(/-/g, '.')} ~ {item.end.replace(/-/g, '.')} (평일{' '}
                  {item.dayCount}일간)
                </span>
              </div>
              <p className="text-[13px] text-on-surface-variant bg-surface-container-lowest p-1.5 rounded mt-1 mb-0">
                {item.reason.trim() || '사유 미입력'}
              </p>
              <div className="flex items-center justify-between pt-1.5 text-outline text-[11px] font-medium">
                <span className="truncate">작성: {item.createdLabel}</span>
                <span className="text-primary font-medium shrink-0">초안 반영 완료</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
