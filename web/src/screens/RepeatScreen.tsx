import { useEffect, useMemo, useState } from 'react';
import { applyRepeat, listRoster } from '../db/store';
import type { AttendanceType, Category, Student } from '../types/models';
import { Shell, type AppScreen } from './Shell';
import { RepeatHero } from '../components/repeat/RepeatHero';
import { StudentPicker } from '../components/repeat/StudentPicker';
import { TypeCardGroup } from '../components/repeat/TypeCardGroup';
import { CategoryCardGroup } from '../components/repeat/CategoryCardGroup';
import { PeriodStepper } from '../components/repeat/PeriodStepper';
import { DateRangePanel } from '../components/repeat/DateRangePanel';
import { ReasonField } from '../components/repeat/ReasonField';
import {
  RepeatPendingList,
  type PendingItem,
} from '../components/repeat/RepeatPendingList';

function weekdays(start: string, end: string): string[] {
  const out: string[] = [];
  const cur = new Date(start + 'T12:00:00');
  const last = new Date(end + 'T12:00:00');
  if (Number.isNaN(cur.getTime()) || Number.isNaN(last.getTime()) || cur > last) return out;
  while (cur <= last) {
    if (cur.getDay() !== 0 && cur.getDay() !== 6) out.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function nowLabel(): string {
  const d = new Date();
  // Asia/Seoul display for local teacher UI
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const hh = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const mm = parts.find((p) => p.type === 'minute')?.value ?? '00';
  return `오늘 ${hh}:${mm}`;
}

type Props = {
  ownerSub: string;
  teacherLabel: string;
  screen: AppScreen;
  onNav: (s: AppScreen) => void;
  onLogout: () => void;
};

export function RepeatScreen({ ownerSub, teacherLabel, screen, onNav, onLogout }: Props) {
  const [roster, setRoster] = useState<Student[]>([]);
  const [q, setQ] = useState('');
  const [pick, setPick] = useState<Student | null>(null);
  const [start, setStart] = useState('2026-09-01');
  const [end, setEnd] = useState('2026-09-11');
  const [type, setType] = useState<AttendanceType>('absence');
  const [cat, setCat] = useState<Category>('illness');
  const [period, setPeriod] = useState(3);
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState('');
  const [pending, setPending] = useState<PendingItem[]>([]);

  useEffect(() => {
    void listRoster(ownerSub).then(setRoster);
  }, [ownerSub]);

  const days = useMemo(() => weekdays(start, end), [start, end]);
  const hits = roster
    .filter((s) => !q || String(s.number).startsWith(q) || s.name.includes(q))
    ;

  function resetForm() {
    setQ('');
    setPick(null);
    setType('absence');
    setCat('illness');
    setPeriod(3);
    setReason('');
    setMsg('');
  }

  async function apply() {
    if (!pick) {
      setMsg('대상 학생을 선택하세요');
      return;
    }
    if (cat === 'other' && !reason.trim()) {
      setMsg('기타는 사유 필수');
      return;
    }
    if (type !== 'absence' && period < 1) {
      setMsg('기준 교시 필요');
      return;
    }
    if (days.length === 0) {
      setMsg('적용할 평일이 없습니다');
      return;
    }
    const result = await applyRepeat(ownerSub, {
      grade: pick.grade,
      class: pick.class,
      number: pick.number,
      name: pick.name,
      category: cat,
      type,
      period: type === 'absence' ? 0 : period,
      reason,
      start,
      end,
    });
    const item: PendingItem = {
      id: `${Date.now()}-${pick.number}-${type}-${cat}`,
      number: pick.number,
      name: pick.name,
      category: cat,
      type,
      period: type === 'absence' ? 0 : period,
      start,
      end,
      dayCount: result.count,
      reason,
      createdLabel: nowLabel(),
    };
    setPending((prev) => [item, ...prev]);
    setMsg(`${pick.name || `학생${String(pick.number).padStart(2, '0')}`} · 평일 ${result.count}일`);
  }

  return (
    <Shell
      screen={screen}
      teacherLabel={teacherLabel}
      rosterCount={roster.length}
      onNav={onNav}
      onLogout={onLogout}
      fillViewport
    >
      <main className="relative bg-surface min-h-0 h-full flex-1 overflow-y-auto">
        <div className="max-w-[var(--max-content-width)] mx-auto px-8 py-6">
          <RepeatHero />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 — form */}
            <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-8 shadow-sm flex flex-col gap-6">
              <StudentPicker
                query={q}
                onQuery={setQ}
                hits={hits}
                pick={pick}
                onPick={setPick}
              />

              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-container text-on-primary-container text-[11px] font-bold">
                    2
                  </span>
                  <h2 className="text-lg font-semibold text-on-surface m-0">구분 및 형태 선택</h2>
                </div>
                <span className="text-[11px] font-medium text-outline">NEIS 서식 표준 · #55</span>
              </div>

              <div className="flex flex-col gap-3">
                <TypeCardGroup value={type} onChange={setType} />
                <CategoryCardGroup value={cat} onChange={setCat} />
                {type !== 'absence' ? (
                  <PeriodStepper value={period} onChange={setPeriod} />
                ) : null}
              </div>

              <DateRangePanel
                start={start}
                end={end}
                days={days}
                onStart={setStart}
                onEnd={setEnd}
              />

              <ReasonField
                value={reason}
                onChange={setReason}
                required={cat === 'other'}
                category={cat}
              />

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  className="px-6 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors text-[15px] font-semibold"
                  type="button"
                  onClick={resetForm}
                >
                  초기화
                </button>
                <button
                  className="flex items-center gap-1.5 px-8 py-3 rounded-lg bg-primary-container text-on-primary text-[15px] font-semibold shadow-sm hover:bg-primary transition-all active:scale-[0.98]"
                  type="button"
                  onClick={() => void apply().catch((e) => setMsg(String(e)))}
                >
                  <span className="material-symbols-outlined text-[18px]">playlist_add</span>
                  <span>장기 출결 등록하기</span>
                </button>
              </div>
              {msg ? <p className="text-sm text-on-surface-variant m-0">{msg}</p> : null}
            </div>

            {/* Right 5 — pending list */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <RepeatPendingList
                items={pending}
                onRemove={(id) => setPending((prev) => prev.filter((x) => x.id !== id))}
              />
            </div>
          </div>
        </div>
      </main>
    </Shell>
  );
}
