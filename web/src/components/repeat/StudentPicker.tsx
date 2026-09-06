import type { Student } from '../../types/models';

function displayName(s: Student): string {
  const n = (s.name ?? '').trim();
  if (!n) return `학생${String(s.number).padStart(2, '0')}`;
  return n;
}

interface Props {
  query: string;
  onQuery: (q: string) => void;
  hits: Student[];
  pick: Student | null;
  onPick: (s: Student | null) => void;
}

/** Step 1 — search + select a single student. */
export function StudentPicker({ query, onQuery, hits, pick, onPick }: Props) {
  const selectedLabel = pick
    ? `${String(pick.number).padStart(2, '0')}번 ${displayName(pick)}`
    : '';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-1.5">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-container text-on-primary-container text-[11px] font-bold">
            1
          </span>
          <h2 className="text-lg font-semibold text-on-surface m-0">대상 학생 선택</h2>
        </div>
        <span className="text-[11px] font-semibold text-on-surface-variant">단일 학생 지정</span>
      </div>
      <div className="relative">
        <div className="flex items-center bg-surface-container-low rounded-lg px-4 py-2 gap-2">
          <span className="material-symbols-outlined text-outline text-[18px]">search</span>
          <input
            className="bg-transparent w-full text-on-surface text-[15px] font-semibold focus:outline-none placeholder:text-outline truncate"
            placeholder="이름 또는 출석번호 검색..."
            type="text"
            value={pick ? selectedLabel : query}
            onChange={(e) => {
              if (pick) onPick(null);
              onQuery(e.target.value);
            }}
            onFocus={() => {
              if (pick) {
                onPick(null);
                onQuery('');
              }
            }}
            aria-label="학생 검색"
          />
          {pick ? (
            <span className="px-1.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed-variant text-[11px] font-semibold shrink-0">
              선택됨
            </span>
          ) : null}
        </div>
        {pick ? (
          <div className="mt-1 flex items-center gap-1.5 text-on-surface-variant text-[11px] font-semibold px-1">
            <span className="material-symbols-outlined text-[14px] text-primary">badge</span>
            <span>
              {pick.grade}학년 {pick.class}반 · 출석번호 {pick.number}
            </span>
          </div>
        ) : null}
        {!pick && hits.length > 0 ? (
          <div className="mt-2 flex flex-col gap-1 max-h-48 overflow-y-auto">
            {hits.map((s) => (
              <button
                key={`${s.grade}-${s.class}-${s.number}`}
                type="button"
                onClick={() => {
                  onPick(s);
                  onQuery('');
                }}
                className="text-left px-3 py-2 rounded-lg border border-[#E4E4E7] hover:border-primary-container hover:bg-[#F0FDFA] transition-colors"
              >
                <span className="font-semibold text-sm text-on-surface">
                  {String(s.number).padStart(2, '0')}번 {displayName(s)}
                </span>
                <span className="text-xs text-on-surface-variant ml-2">
                  {s.grade}학년 {s.class}반
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
