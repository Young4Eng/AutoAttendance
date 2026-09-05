import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AttendanceRecord, Owner } from '../types/models';
import {
  listAttendance,
  listAttendanceByDate,
  putAttendance,
} from '../db/store';
import { PreviewList } from '../components/PreviewList';
import { SlashRangeHint } from '../components/SlashRangeHint';
import { ConfirmSendDialog } from '../components/ConfirmSendDialog';
import { ConfirmClearDialog } from '../components/ConfirmClearDialog';
import { sendToExtension } from '../lib/sendToExtension';

function extMsg(code: string): string {
  if (code === 'missing_extension_id') return 'web/.env에 VITE_EXTENSION_ID가 없습니다. 크롬 확장 ID를 넣고 서버를 다시 켜세요.';
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

export function SendPreviewScreen({ owner, date, periodCount, onBack }: Props) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendStep, setSendStep] = useState<1 | 2>(1);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearStep, setClearStep] = useState<1 | 2>(1);

  const load = useCallback(async () => {
    const rows = date
      ? await listAttendanceByDate(owner.ownerSub, date)
      : await listAttendance(owner.ownerSub);
    setRecords(rows.filter(isQueueCandidate));
  }, [owner.ownerSub, date]);

  useEffect(() => {
    void load().catch(() => setError('미리보기 불러오기 실패'));
  }, [load]);

  const drafts = useMemo(
    () => records.filter((r) => r.status === 'draft' || r.status === 'error'),
    [records],
  );
  const draftCount = drafts.length;

  const toSend = useMemo(() => {
    if (drafts.length) return drafts;
    return records.filter((r) => r.status === 'queued');
  }, [drafts, records]);

  const openSend = () => {
    if (toSend.length === 0) {
      setError('보낼 초안·대기가 없습니다');
      return;
    }
    const bad = toSend.filter(
      (r) => r.category === 'other' && !r.reason.trim(),
    );
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
    try {
      for (const r of toSend) {
        if (r.category === 'other' && !r.reason.trim()) {
          throw new Error('reason_required_for_other');
        }
        const { ownerSub: _o, ...rest } = r;
        await putAttendance(owner.ownerSub, { ...rest, status: 'queued' });
      }
      setStatus(`${toSend.length}건을 대기로 보냅니다`);
      await load();
      const queued = toSend.map((r) => ({ ...r, status: 'queued' as const }));
      const ext = await sendToExtension(queued);
      if (ext.ok) {
        setStatus((s) => `${s ?? ''} · 확장 수신 ${ext.accepted}건`);
      } else {
        setStatus((s) => {
          const detail = ext.errors?.length
            ? ext.errors.slice(0, 3).map((e) => `${e.row + 1}행 ${e.code}`).join(', ')
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
    if (records.length === 0) {
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

  return (
    <div className="flex-1 p-6">
      <header className="flex items-start justify-between mb-4">
        <div>
          <h1>전송 미리보기</h1>
          <p className="muted">
            {date || '전체 날짜'} · 비출석 {records.length}건 · 출결마감 없음 · queued만 확장
          </p>
        </div>
        <button type="button" className="btn ghost" onClick={onBack}>
          출결로 돌아가기
        </button>
      </header>

      <section className="card">
        {status ? <p className="ok">{status}</p> : null}
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        <PreviewList records={records} periodCount={periodCount} />
        {/* SlashRangeHint also rendered per-row inside PreviewList */}
        {records[0] ? (
          <div className="preview-legend" aria-hidden={records.length === 0}>
            <SlashRangeHint
              category={records[0].category}
              type={records[0].type}
              period={records[0].period}
              periodCount={periodCount}
            />
          </div>
        ) : null}
        <div className="toolbar">
          <button type="button" className="btn secondary" onClick={openSend}>
            대기열에 넣기 ({draftCount})
          </button>
          <button type="button" className="btn danger" onClick={openClear}>
            대기만 초안으로
          </button>
        </div>
        <p className="muted tiny">
          일괄 전송·삭제는 두 번 확인합니다. 출석 행은 대기열에 넣지 않습니다.
        </p>
      </section>

      <ConfirmSendDialog
        open={sendOpen}
        step={sendStep}
        count={draftCount}
        onCancel={() => setSendOpen(false)}
        onConfirm={() => void confirmSend()}
      />
      <ConfirmClearDialog
        open={clearOpen}
        step={clearStep}
        count={draftCount}
        onCancel={() => setClearOpen(false)}
        onConfirm={() => void confirmClear()}
      />
    </div>
  );
}
