import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AttendanceRecord,
  Owner,
  Student,
} from '../types/models';
import {
  deleteAttendanceRecord,
  listAttendanceByDate,
  listRoster,
  putAttendance,
  replaceRoster,
} from '../db/idb';
import { parseRosterCsv } from '../csv/parseRoster';
import { PERIOD_COUNT } from '../lib/slashRange';
import { DateBar } from '../components/DateBar';
import { RosterList } from '../components/RosterList';
import type { RowDraft } from '../components/StudentRow';

function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function yearFromDate(date: string): number {
  const y = Number(date.slice(0, 4));
  return Number.isFinite(y) ? y : new Date().getFullYear();
}

function sk(s: Pick<Student, 'grade' | 'class' | 'number'>): string {
  return `${s.grade}|${s.class}|${s.number}`;
}

function defaultDraft(): RowDraft {
  return {
    present: true,
    category: 'illness',
    type: 'late',
    period: 1,
    reason: '',
    status: null,
    error: null,
  };
}

function recordToDraft(r: AttendanceRecord): RowDraft {
  return {
    present: false,
    category: r.category,
    type: r.type,
    period: r.period,
    reason: r.reason,
    status: r.status,
    error: r.status === 'error' ? '오류 상태' : null,
  };
}

interface Props {
  owner: Owner;
  onLogout: () => void;
  onPreview: (date: string, periodCount: number) => void;
}

export function TodayAttendanceScreen({ owner, onLogout, onPreview }: Props) {
  const [date, setDate] = useState(todayYmd);
  const [periodCount, setPeriodCount] = useState(PERIOD_COUNT);
  const [roster, setRoster] = useState<Student[]>([]);
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({});
  /** Remember last saved key per student so we can delete on clear / re-key. */
  const [savedKeys, setSavedKeys] = useState<
    Record<string, Pick<AttendanceRecord, 'period' | 'type' | 'grade' | 'class' | 'number'>>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const students = await listRoster(owner.ownerSub);
    const att = await listAttendanceByDate(owner.ownerSub, date);
    const byStudent = new Map<string, AttendanceRecord>();
    for (const r of att) {
      const key = sk(r);
      const prev = byStudent.get(key);
      if (!prev) byStudent.set(key, r);
    }
    const nextDrafts: Record<string, RowDraft> = {};
    const nextSaved: typeof savedKeys = {};
    for (const s of students) {
      const key = sk(s);
      const rec = byStudent.get(key);
      if (rec) {
        nextDrafts[key] = recordToDraft(rec);
        nextSaved[key] = {
          grade: rec.grade,
          class: rec.class,
          number: rec.number,
          period: rec.period,
          type: rec.type,
        };
      } else {
        nextDrafts[key] = defaultDraft();
      }
    }
    setRoster(students);
    setDrafts(nextDrafts);
    setSavedKeys(nextSaved);
  }, [owner.ownerSub, date]);

  useEffect(() => {
    void load().catch(() => setError('명단·출결 불러오기 실패'));
  }, [load]);

  const nonPresentCount = useMemo(
    () => Object.values(drafts).filter((d) => !d.present).length,
    [drafts],
  );

  const onChange = (studentKey: string, patch: Partial<RowDraft>) => {
    setDrafts((prev) => {
      const cur = prev[studentKey] ?? defaultDraft();
      const next = { ...cur, ...patch };
      if (patch.present === true) {
        next.error = null;
        next.status = null;
      }
      return { ...prev, [studentKey]: next };
    });
  };

  const onSave = async (studentKey: string) => {
    const student = roster.find((s) => sk(s) === studentKey);
    const draft = drafts[studentKey];
    if (!student || !draft) return;
    setError(null);
    setStatus(null);

    if (draft.present) {
      await onClear(studentKey);
      return;
    }

    if (draft.category === 'other' && !draft.reason.trim()) {
      onChange(studentKey, {
        error: '기타는 사유가 필요합니다',
        status: 'error',
      });
      setError('기타(other)는 사유 필수 — 대기열에 넣을 수 없습니다');
      return;
    }

    const year = yearFromDate(date);
    const payload: Omit<AttendanceRecord, 'ownerSub'> = {
      date,
      year,
      grade: student.grade,
      class: student.class,
      number: student.number,
      name: student.name,
      category: draft.category,
      type: draft.type,
      period: draft.period,
      reason: draft.reason.trim(),
      status: 'draft',
    };

    try {
      const prev = savedKeys[studentKey];
      if (
        prev &&
        (prev.period !== payload.period || prev.type !== payload.type)
      ) {
        await deleteAttendanceRecord(owner.ownerSub, { date, ...prev });
      }
      await putAttendance(owner.ownerSub, payload);
      setSavedKeys((sks) => ({
        ...sks,
        [studentKey]: {
          grade: payload.grade,
          class: payload.class,
          number: payload.number,
          period: payload.period,
          type: payload.type,
        },
      }));
      onChange(studentKey, { status: 'draft', error: null });
      setStatus(`${student.name} 임시저장(draft)`);
    } catch (e) {
      const code = e instanceof Error ? e.message : 'save_error';
      onChange(studentKey, { status: 'error', error: code });
      setError(`저장 실패: ${code}`);
    }
  };

  const onClear = async (studentKey: string) => {
    const student = roster.find((s) => sk(s) === studentKey);
    setError(null);
    try {
      const prev = savedKeys[studentKey];
      if (prev) {
        await deleteAttendanceRecord(owner.ownerSub, { date, ...prev });
        setSavedKeys((sks) => {
          const next = { ...sks };
          delete next[studentKey];
          return next;
        });
      }
      onChange(studentKey, defaultDraft());
      if (student) setStatus(`${student.name} 출석(기록 없음)`);
    } catch {
      setError('출석으로 되돌리기 실패');
    }
  };

  const onCsvSelected = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setStatus(null);
    try {
      const text = await file.text();
      const rows = parseRosterCsv(text);
      await replaceRoster(owner.ownerSub, rows);
      await load();
      setStatus(`명단 ${rows.length}명 저장 (빈 번호는 채우지 않음)`);
    } catch (e) {
      const code = e instanceof Error ? e.message : 'csv_error';
      setError(`CSV 처리 실패: ${code}`);
    }
  };

  const goPreview = () => {
    const invalid = Object.entries(drafts).filter(
      ([, d]) =>
        !d.present && d.category === 'other' && !d.reason.trim(),
    );
    if (invalid.length > 0) {
      setError('기타 사유 공란인 행이 있어 미리보기로 갈 수 없습니다');
      for (const [k] of invalid) {
        onChange(k, { error: '기타는 사유가 필요합니다', status: 'error' });
      }
      return;
    }
    onPreview(date, periodCount);
  };

  return (
    <div className="app">
      <header className="header row">
        <div>
          <h1>오늘 출결</h1>
          <p className="muted">
            {owner.displayName ?? '교사'} · ownerSub {owner.ownerSub.slice(0, 8)}…
          </p>
        </div>
        <button type="button" className="btn ghost" onClick={onLogout}>
          로그아웃
        </button>
      </header>

      <section className="card">
        <DateBar
          date={date}
          periodCount={periodCount}
          onDateChange={setDate}
          onPeriodCountChange={setPeriodCount}
        />
        {status ? <p className="ok">{status}</p> : null}
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      <section className="card">
        <div className="section-head row">
          <h2>명단</h2>
          <span className="muted tiny">
            비출석 {nonPresentCount}명 · 번호 간격은 빈 행 없이 간격만
          </span>
        </div>
        <RosterList
          students={roster}
          drafts={drafts}
          periodCount={periodCount}
          onChange={onChange}
          onSave={(k) => void onSave(k)}
          onClear={(k) => void onClear(k)}
        />
        <div className="toolbar">
          <button type="button" className="btn secondary" onClick={goPreview}>
            미리보기
          </button>
        </div>
      </section>

      <section className="card csv-card">
        <button
          type="button"
          className="btn ghost linkish"
          onClick={() => setCsvOpen((v) => !v)}
        >
          {csvOpen ? '명단 CSV 접기' : '명단 CSV 가져오기'}
        </button>
        {csvOpen ? (
          <>
            <p className="muted tiny">
              형식: grade,class,number,name · 빈 출석번호는 만들지 않습니다.
            </p>
            <label className="file-label">
              CSV 선택
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(ev) => {
                  const f = ev.target.files?.[0] ?? null;
                  void onCsvSelected(f);
                  ev.target.value = '';
                }}
              />
            </label>
          </>
        ) : null}
      </section>
    </div>
  );
}
