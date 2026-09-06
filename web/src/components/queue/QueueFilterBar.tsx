import type { Category } from '../../types/models';
import { CATEGORY_LABELS } from '../../lib/labels';
import type { CategoryFilter } from '../../lib/recordKey';

export type ScopeTab = 'month' | 'lastMonth' | 'range';

interface Props {
  total: number;
  selectedCount: number;
  allSelected: boolean;
  scope: ScopeTab;
  from: string;
  to: string;
  category: CategoryFilter;
  categoryCounts: Record<Category | 'all', number>;
  query: string;
  onToggleAll: (checked: boolean) => void;
  onSendSelected: () => void;
  onHoldSelected: () => void;
  onScope: (s: ScopeTab) => void;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  onCategory: (c: CategoryFilter) => void;
  onQuery: (q: string) => void;
}

export function QueueFilterBar({
  total,
  selectedCount,
  allSelected,
  scope,
  from,
  to,
  category,
  categoryCounts,
  query,
  onToggleAll,
  onSendSelected,
  onHoldSelected,
  onScope,
  onFrom,
  onTo,
  onCategory,
  onQuery,
}: Props) {
  const cats: CategoryFilter[] = ['all', 'illness', 'unexcused', 'recognized', 'other'];

  return (
    <div className="w-full mb-3 p-1 bg-white rounded-xl border border-[#E4E4E7] shadow-sm flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap px-2 py-1">
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-[#E4E4E7] text-primary focus:ring-primary"
            checked={allSelected && total > 0}
            onChange={(e) => onToggleAll(e.target.checked)}
          />
          <span className="text-sm font-semibold text-on-surface">전체 선택 ({total}건)</span>
        </label>
        <span className="text-outline text-xs">|</span>
        <button type="button" className="px-2 py-1 rounded-md bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-medium transition-colors flex items-center gap-1" onClick={onSendSelected} disabled={selectedCount === 0}>
          <span className="material-symbols-outlined text-[15px] text-primary">check_circle</span>
          <span>선택한 건만 나이스로 전송 ({selectedCount}건)</span>
        </button>
        <button type="button" className="px-2 py-1 rounded-md text-on-surface-variant hover:bg-surface-container-low text-xs transition-colors" onClick={onHoldSelected} disabled={selectedCount === 0}>
          일괄 보류
        </button>
      </div>
      <div className="flex items-center gap-2 flex-wrap px-2 pb-1">
        <div className="flex items-center rounded-lg bg-surface-container-low p-0.5 border border-[#E4E4E7]">
          <button type="button" className={scope === 'month' ? 'px-2.5 py-1 rounded-md bg-white text-on-surface text-xs font-semibold shadow-sm' : 'px-2 py-1 rounded-md text-on-surface-variant text-xs'} onClick={() => onScope('month')}>이번 달</button>
          <button type="button" className={scope === 'lastMonth' ? 'px-2.5 py-1 rounded-md bg-white text-on-surface text-xs font-semibold shadow-sm' : 'px-2 py-1 rounded-md text-on-surface-variant text-xs'} onClick={() => onScope('lastMonth')}>저번 달</button>
          <button type="button" className={scope === 'range' ? 'px-2.5 py-1 rounded-md bg-white text-on-surface text-xs font-semibold shadow-sm' : 'px-2 py-1 rounded-md text-on-surface-variant text-xs'} onClick={() => onScope('range')}>기간</button>
        </div>
        <label className="text-xs text-on-surface-variant flex items-center gap-1">
          시작
          <input type="date" className="bg-white rounded-lg border border-[#E4E4E7] px-2 py-1 text-xs" value={from} onChange={(e) => { onFrom(e.target.value); onScope('range'); }} />
        </label>
        <label className="text-xs text-on-surface-variant flex items-center gap-1">
          종료
          <input type="date" className="bg-white rounded-lg border border-[#E4E4E7] px-2 py-1 text-xs" value={to} onChange={(e) => { onTo(e.target.value); onScope('range'); }} />
        </label>
        <select className="bg-white rounded-lg border border-[#E4E4E7] px-2 py-1 text-xs text-on-surface focus:outline-none" value={category} onChange={(e) => onCategory(e.target.value as CategoryFilter)}>
          {cats.map((c) => (
            <option key={c} value={c}>
              {c === 'all' ? `모든 유형 (${categoryCounts.all})` : `${CATEGORY_LABELS[c]} (${categoryCounts[c]})`}
            </option>
          ))}
        </select>
        <div className="relative min-w-[160px]">
          <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[16px] text-outline">search</span>
          <input className="w-full pl-7 pr-2 py-1 rounded-lg bg-white border border-[#E4E4E7] text-xs placeholder:text-outline focus:outline-none" placeholder="학생명 / 번호 / 사유 검색..." type="search" value={query} onChange={(e) => onQuery(e.target.value)} />
        </div>
      </div>
    </div>
  );
}
