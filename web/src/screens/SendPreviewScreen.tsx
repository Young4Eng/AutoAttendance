import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AttendanceRecord, Category, Owner } from '../types/models';
import {
  listAttendance,
  listAttendanceByDate,
  putAttendance,
} from '../db/store';
import { ConfirmSendDialog } from '../components/ConfirmSendDialog';
import { ConfirmClearDialog } from '../components/ConfirmClearDialog';
import { QueueHero } from '../components/queue/QueueHero';
import { ExtensionStatusBanner } from '../components/queue/ExtensionStatusBanner';
import { QueueFilterBar, type ScopeTab } from '../components/queue/QueueFilterBar';
import { DateAccordionGroup } from '../components/queue/DateAccordionGroup';
import { QueueStickyAside } from '../components/queue/QueueStickyAside';
import { sendToExtension } from '../lib/sendToExtension';
import {
  displayStudentName,
  recordKey,
  type CategoryFilter,
} from '../lib/recordKey';

function extMsg(code: string): string {
  if (code === 'missing_extension_id')
    return 'web/.env에 VITE_EXTENSION_ID가 없습니다. 크롬 확장 ID를 넣고 서버를 다시 켜세요.';
  if (code === 'no_chrome_runtime') return '크롬이 아니거나 확장이 없습니다.';
  if (code === 'empty_queue') return '보낼 queued가 없습니다.';
  if (code === 'runtime_error') return '확장이 메시지를 거절했습니다. 확장 로드·ID를 확인하세요.';
  return '확장 미연결(' + code + ')';
}

interface Props {
  owner: Owner;
  date: string;
  periodCount: number;
  onBack: () => void;
}

/** Non-present rows only — present never appears in queue. */
function isQueueCandidate(r: AttendanceRecord): boolean {
  return r.status === 'draft' || r.status === 'queued' || r.status === 'error';
}

export function SendPreviewScreen({ owner, date, periodCount: _periodCount, onBack }: Props) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendStep, setSendStep] = useState<1 | 2>(1);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearStep, setClearStep] = useState<1 | 2>(1);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [evidence, setEvidence] = useState<Set<string>>(() => new Set());
  const [held, setHeld] = useState<Set<string>>(() => new Set());
  const monthNow = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const last = new Date(y, d.getMonth() + 1, 0).getDate();
    return { from: `${y}-${m}-01`, to: `${y}-${m}-${String(last).padStart(2, '0')}` };
  };
  const lastMonthNow = () => {
    const d = new Date();
    const dt = new Date(d.getFullYear(), d.getMonth() - 1, 1);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const last = new Date(y, dt.getMonth() + 1, 0).getDate();
    return { from: `${y}-${m}-01`, to: `${y}-${m}-${String(last).padStart(2, '0')}` };
  };
  const initial = monthNow();
  const [scope, setScope] = useState<ScopeTab>('month');
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [query, setQuery] = useState('');
  const [extOk, setExtOk] = useState(true);

  const load = useCallback(async () => {
    const rows = date
      ? await listAttendanceByDate(owner.ownerSub, date)
      : await listAttendance(owner.ownerSub);
    const filtered = rows
      .filter(isQueueCandidate)
      .sort((a, b) => (a.date === b.date ? a.number - b.number : a.date < b.date ? -1 : 1));
    setRecords(filtered);
    setSelected(new Set(filtered.map(recordKey)));
  }, [owner.ownerSub, date]);

  useEffect(() => {
    void load().catch(() => setError('미리보기 불러오기 실패'));
  }, [load]);

  const active = useMemo(
    () => records.filter((r) => !held.has(recordKey(r))),
    [records, held],
  );

  const categoryCounts = useMemo(() => {
    const c: Record<Category | 'all', number> = {
      all: active.length,
      illness: 0,
      unexcused: 0,
      other: 0,
      recognized: 0,
    };
    for (const r of active) c[r.category] += 1;
    return c;
  }, [active]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return active.filter((r) => {
      if (from && r.date < from) return false;
      if (to && r.date > to) return false;
      if (category !== 'all' && r.category !== category) return false;
      if (!q) return true;
      const name = displayStudentName(r).toLowerCase();
      return (
        name.includes(q) ||
        String(r.number).includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.date.includes(q)
      );
    });
  }, [active, from, to, category, query]);

  const byDate = useMemo(() => {
    const map = new Map<string, AttendanceRecord[]>();
    for (const r of filtered) {
      const list = map.get(r.date) ?? [];
      list.push(r);
      map.set(r.date, list);
    }
    return [...map.entries()].sort(([a], [b]) => (a < b ? -1 : 1));
  }, [filtered]);

  const byCategory = useMemo(() => {
    const c: Record<Category, number> = {
      illness: 0,
      unexcused: 0,
      other: 0,
      recognized: 0,
    };
    for (const r of filtered) c[r.category] += 1;
    return c;
  }, [filtered]);

  const filteredKeys = useMemo(() => filtered.map(recordKey), [filtered]);
  const selectedVisible = useMemo(
    () => filteredKeys.filter((k) => selected.has(k)),
    [filteredKeys, selected],
  );
  const allSelected =
    filteredKeys.length > 0 && filteredKeys.every((k) => selected.has(k));

  const evidenceChecked = useMemo(
    () => filteredKeys.filter((k) => evidence.has(k)).length,
    [filteredKeys, evidence],
  );

  const grade = filtered[0]?.grade ?? records[0]?.grade;
  const classNum = filtered[0]?.class ?? records[0]?.class;

  const drafts = useMemo(
    () =>
      filtered.filter(
        (r) =>
          selected.has(recordKey(r)) &&
          (r.status === 'draft' || r.status === 'error' || r.status === 'queued'),
      ),
    [filtered, selected],
  );

  const toSend = useMemo(() => {
    const selectedRows = filtered.filter((r) => selected.has(recordKey(r)));
    const needQueue = selectedRows.filter(
      (r) => r.status === 'draft' || r.status === 'error',
    );
    if (needQueue.length) return needQueue;
    return selectedRows.filter((r) => r.status === 'queued');
  }, [filtered, selected]);

  const openSend = () => {
    if (toSend.length === 0 && drafts.length === 0) {
      setError('보낼 사람 없음');
      return;
    }
    const target = toSend.length ? toSend : drafts;
    const bad = target.filter((r) => r.category === 'other' && !r.reason.trim());
    if (bad.length > 0) {
      setError('기타 사유 공란인 행은 대기열에 넣을 수 없습니다');
      return;
    }
    setError(null);
    setSendStep(1);
    setSendOpen(true);
  };

  const confirmSend = async () => {
    if (sendStep === 1) {
      setSendStep(2);
      return;
    }
    setSendOpen(false);
    setError(null);
    const target = toSend.length ? toSend : drafts;
    try {
      for (const r of target) {
        if (r.category === 'other' && !r.reason.trim()) {
          throw new Error('reason_required_for_other');
        }
        const { ownerSub: _o, ...rest } = r;
        await putAttendance(owner.ownerSub, { ...rest, status: 'queued' });
      }
      setStatus(`${target.length}건을 대기로 보냅니다`);
      await load();
      const queued = target.map((r) => ({ ...r, status: 'queued' as const }));
      const ext = await sendToExtension(queued);
      setExtOk(ext.ok);
      if (ext.ok) {
        setStatus((s) => `${s ?? ''} · 확장 수신 ${ext.accepted}건`);
      } else {
        setStatus((s) => {
          const detail = ext.errors?.length
            ? ext.errors
                .slice(0, 3)
                .map((e) => `${e.row + 1}행 ${e.code}`)
                .join(', ')
            : extMsg(ext.code);
          return `${s ?? ''} · 확장 거절 ${ext.rejected ?? 0}건 (${detail})`;
        });
      }
    } catch (e) {
      const code = e instanceof Error ? e.message : 'queue_error';
      setError(`대기열 반영 실패: ${code}`);
    }
  };

  const openClear = () => {
    if (records.filter((x) => x.status === 'queued').length === 0) {
      setError('되돌릴 대기가 없습니다');
      return;
    }
    setError(null);
    setClearStep(1);
    setClearOpen(true);
  };

  const confirmClear = async () => {
    if (clearStep === 1) {
      setClearStep(2);
      return;
    }
    setClearOpen(false);
    setError(null);
    try {
      let n = 0;
      for (const r of records.filter((x) => x.status === 'queued')) {
        const { ownerSub: _o, ...rest } = r;
        await putAttendance(owner.ownerSub, { ...rest, status: 'draft' });
        n += 1;
      }
      setStatus(`대기 ${n}건을 초안으로 되돌렸습니다. 달력 기록은 그대로입니다.`);
      await load();
    } catch {
      setError('삭제 실패');
    }
  };

  const toggleRow = (key: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const toggleGroup = (keys: string[], checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const k of keys) {
        if (checked) next.add(k);
        else next.delete(k);
      }
      return next;
    });
  };

  const toggleEvidence = (key: string, checked: boolean) => {
    setEvidence((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => toggleGroup(filteredKeys, checked);

  const holdSelected = () => {
    if (selectedVisible.length === 0) return;
    setHeld((prev) => {
      const next = new Set(prev);
      for (const k of selectedVisible) next.add(k);
      return next;
    });
    setSelected((prev) => {
      const next = new Set(prev);
      for (const k of selectedVisible) next.delete(k);
      return next;
    });
    setStatus(`${selectedVisible.length}건을 보류했습니다 (이 세션에서만 숨김)`);
  };

  return (
    <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden bg-surface">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-[var(--max-content-width)] mx-auto px-6 py-5">
          <div className="flex items-center justify-end mb-2">
            <button
              type="button"
              className="text-xs text-on-surface-variant hover:text-on-surface px-2 py-1 rounded-md hover:bg-surface-container"
              onClick={onBack}
            >
              출결로 돌아가기
            </button>
          </div>

          <QueueHero
            total={filtered.length}
            grade={grade}
            classNum={classNum}
            onSendAll={openSend}
          />
          <ExtensionStatusBanner
            connected={extOk}
            onRefresh={() => {
              setExtOk(Boolean(import.meta.env.VITE_EXTENSION_ID));
              setStatus('확장 상태를 확인했습니다');
            }}
          />
          <QueueFilterBar
            total={filtered.length}
            selectedCount={selectedVisible.length}
            allSelected={allSelected}
            scope={scope}
            from={from}
            to={to}
            category={category}
            categoryCounts={categoryCounts}
            query={query}
            onToggleAll={toggleAll}
            onSendSelected={openSend}
            onHoldSelected={holdSelected}
            onScope={(s) => {
              setScope(s);
              if (s === 'month') {
                const m = monthNow();
                setFrom(m.from);
                setTo(m.to);
              }
              if (s === 'lastMonth') {
                const m = lastMonthNow();
                setFrom(m.from);
                setTo(m.to);
              }
            }}
            onFrom={setFrom}
            onTo={setTo}
            onCategory={setCategory}
            onQuery={setQuery}
          />

          {status ? <p className="ok text-sm mb-2">{status}</p> : null}
          {error ? (
            <p className="error text-sm mb-2" role="alert">
              {error}
            </p>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start mb-6">
            <div className="lg:col-span-8 flex flex-col gap-2 w-full">
              <div className="flex items-center justify-between px-1 text-xs text-outline">
                <div className="flex items-center gap-2">
                  <span>
                    대기열 그룹 {byDate.length}개
                    {byDate.length ? ` · ${filtered.length}건 표시` : ''}
                  </span>
                  {held.size > 0 ? (
                    <>
                      <span className="text-surface-container-highest">•</span>
                      <button
                        type="button"
                        className="text-primary hover:underline font-medium"
                        onClick={() => setHeld(new Set())}
                      >
                        보류 {held.size}건 다시 보기
                      </button>
                    </>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-primary font-medium">
                    증빙 미체크 {Math.max(0, filtered.length - evidenceChecked)}건
                    (미체크 시에도 전송 가능)
                  </span>
                </div>
              </div>

              {byDate.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#E4E4E7] bg-surface-container-low p-6 text-sm text-on-surface-variant">
                  보낼 사람 없음. 출석만 있는 날은 대기열이 비어 있습니다. 목업 실명은 쓰지
                  않습니다 (학생01…).
                </div>
              ) : (
                byDate.map(([d, rows], i) => (
                  <DateAccordionGroup
                    key={d}
                    date={d}
                    records={rows}
                    selected={selected}
                    evidence={evidence}
                    defaultOpen={i < 4}
                    onToggleRow={toggleRow}
                    onToggleEvidence={toggleEvidence}
                    onToggleGroup={toggleGroup}
                  />
                ))
              )}
            </div>

            <QueueStickyAside
              total={filtered.length}
              byCategory={byCategory}
              evidenceChecked={evidenceChecked}
              onSend={openSend}
              onClearQueue={openClear}
            />
          </div>

          <footer className="w-full pb-6">
            <div className="p-4 rounded-xl bg-surface-container-high text-on-surface-variant flex items-start gap-3 shadow-sm border border-[#E4E4E7]">
              <span className="material-symbols-outlined text-[22px] text-primary shrink-0 mt-0.5">
                info
              </span>
              <p className="text-sm text-on-surface leading-relaxed m-0">
                나이스 일일출결에서 확장 아이콘을 누르거나 「{filtered.length}건 한 번에 나이스로
                전송」을 누르면 열려 있는 나이스 탭에 채워집니다. 최종 저장·승인은 선생님께서
                직접 검토 후 완료하세요.
              </p>
            </div>
          </footer>
        </div>
      </div>

      <ConfirmSendDialog
        open={sendOpen}
        step={sendStep}
        count={toSend.length || drafts.length}
        onCancel={() => setSendOpen(false)}
        onConfirm={() => void confirmSend()}
      />
      <ConfirmClearDialog
        open={clearOpen}
        step={clearStep}
        count={records.filter((r) => r.status === 'queued').length}
        onCancel={() => setClearOpen(false)}
        onConfirm={() => void confirmClear()}
      />
    </div>
  );
}
