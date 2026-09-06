import type { AttendanceRecord } from '../types/models';
import { CATEGORY_LABELS, TYPE_LABELS, STATUS_LABELS } from '../lib/labels';
import { SlashRangeHint } from './SlashRangeHint';
import { CategoryChip } from './CategoryChip';

interface Props {
  records: AttendanceRecord[];
  periodCount: number;
}

export function PreviewList({ records, periodCount }: Props) {
  if (records.length === 0) {
    return (
      <p className="muted">
        보낼 사람 없음. 출석만 있는 날은 대기열이 비어 있습니다.
      </p>
    );
  }
  return (
    <ul className="PreviewList">
      {records.map((r) => {
        const key = `${r.date}|${r.grade}|${r.class}|${r.number}|${r.period}|${r.type}`;
        return (
          <li key={key} className="PreviewList-item">
            <div className="PreviewList-head">
              <span className="num tnum">{r.number}</span>
              <span className="name">{r.name}</span>
              <CategoryChip category={r.category} />
              <span className={`RowStatusChip status-${r.status}`}>
                {STATUS_LABELS[r.status]}
              </span>
            </div>
            <p className="PreviewList-meta">
              {r.date} · {CATEGORY_LABELS[r.category]}{TYPE_LABELS[r.type]} ·{' '}
              {r.period === 0 ? '결석(교시없음)' : `${r.period}교시`}
              {r.reason ? ` · ${r.reason}` : ''}
            </p>
            <SlashRangeHint
              category={r.category}
              type={r.type}
              period={r.period}
              periodCount={periodCount}
            />
          </li>
        );
      })}
    </ul>
  );
}
