import type { Student } from '../types/models';
import { StudentRow, type RowDraft } from './StudentRow';

interface Props {
  students: Student[];
  drafts: Record<string, RowDraft>;
  periodCount: number;
  onChange: (studentKey: string, patch: Partial<RowDraft>) => void;
  onSave: (studentKey: string) => void;
  onClear: (studentKey: string) => void;
}

function studentKey(s: Student): string {
  return `${s.grade}|${s.class}|${s.number}`;
}

/** Renders only existing roster numbers; gaps use spacing, not filler rows. */
export function RosterList({
  students,
  drafts,
  periodCount,
  onChange,
  onSave,
  onClear,
}: Props) {
  if (students.length === 0) {
    return <p className="muted">명단이 없습니다. CSV를 올려 주세요.</p>;
  }
  return (
    <ul className="RosterList">
      {students.map((s, i) => {
        const key = studentKey(s);
        const prev = i > 0 ? students[i - 1].number : s.number;
        const gapBefore = i > 0 ? Math.max(0, s.number - prev - 1) : 0;
        const draft = drafts[key];
        if (!draft) return null;
        return (
          <StudentRow
            key={key}
            student={s}
            draft={draft}
            periodCount={periodCount}
            gapBefore={gapBefore}
            onChange={(patch) => onChange(key, patch)}
            onSave={() => onSave(key)}
            onClear={() => onClear(key)}
          />
        );
      })}
    </ul>
  );
}
