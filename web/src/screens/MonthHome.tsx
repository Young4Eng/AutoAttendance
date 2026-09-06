import { useEffect, useMemo, useState } from "react";
import {
  deleteAttendanceRecord,
  listAttendance,
  listRoster,
  putAttendance,
} from "../db/store";
import type { AttendanceRecord, AttendanceType, Category, Student } from "../types/models";
import { Shell, type AppScreen } from "./Shell";
import { MonthHero } from "../components/month/MonthHero";
import { MonthCalendar } from "../components/month/MonthCalendar";
import { MonthLegend } from "../components/month/MonthLegend";
import { DayPanel } from "../components/month/DayPanel";

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function weekend(d: Date) {
  const n = d.getDay();
  return n === 0 || n === 6;
}
function weekdaysBetween(start: string, end: string): string[] {
  const out: string[] = [];
  const cur = new Date(start + "T12:00:00");
  const last = new Date(end + "T12:00:00");
  if (Number.isNaN(cur.getTime()) || Number.isNaN(last.getTime()) || cur > last) return out;
  while (cur <= last) {
    if (!weekend(cur)) out.push(ymd(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}
function monthCells(year: number, month: number): Date[] {
  const first = new Date(year, month - 1, 1);
  const pad = (first.getDay() + 6) % 7;
  const start = new Date(year, month - 1, 1 - pad);
  return Array.from({ length: 42 }, (_, i) => {
    const x = new Date(start);
    x.setDate(start.getDate() + i);
    return x;
  });
}


type Props = {
  ownerSub: string;
  teacherLabel: string;
  onLogout: () => void;
  screen: AppScreen;
  onNav: (s: AppScreen) => void;
};

export function MonthHome({ ownerSub, teacherLabel, onLogout, onNav, screen }: Props) {
  const now = new Date();
  const today = ymd(now);
  const [cursor, setCursor] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const year = cursor.getFullYear();
  const month = cursor.getMonth() + 1;
  const cells = useMemo(() => monthCells(year, month), [year, month]);
  const [open, setOpen] = useState<string | null>(weekend(now) ? null : today);
  const [roster, setRoster] = useState<Student[]>([]);
  const [rows, setRows] = useState<AttendanceRecord[]>([]);
  const [pending, setPending] = useState<AttendanceType | null>(null);
  const [pendingCat, setPendingCat] = useState<Category>("illness");
  const [bulk, setBulk] = useState(false);
  const [picked, setPicked] = useState<number[]>([]);
  const [q, setQ] = useState("");
  const [focusKey, setFocusKey] = useState<string | null>(null);

  async function reload() {
    const [st, att] = await Promise.all([listRoster(ownerSub), listAttendance(ownerSub)]);
    setRoster(st);
    setRows(att);
  }
  useEffect(() => {
    void reload().catch((e) => void String(e));
  }, [ownerSub]);

  const namesByDate = useMemo(() => {
    const m: Record<string, AttendanceRecord[]> = {};
    for (const r of rows) (m[r.date] ||= []).push(r);
    return m;
  }, [rows]);

  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;
  const monthRows = useMemo(
    () => rows.filter((r) => r.date.startsWith(monthPrefix)),
    [rows, monthPrefix],
  );

  const breakdown = useMemo(() => {
    const abs = monthRows.filter((r) => r.type === "absence").length;
    const late = monthRows.filter((r) => r.type === "late").length;
    const early = monthRows.filter((r) => r.type === "early_leave").length;
    const recognized = monthRows.filter((r) => r.category === "recognized").length;
    return [
      { label: "결석", count: abs },
      { label: "지각", count: late },
      { label: "조퇴", count: early },
      { label: "인정", count: recognized },
    ];
  }, [monthRows]);

  const dayRows = open ? rows.filter((r) => r.date === open) : [];
  const weekdayKo = open
    ? ["일", "월", "화", "수", "목", "금", "토"][new Date(open + "T12:00:00").getDay()]
    : "";
  const hits = roster
    .filter((s) => !q.trim() || String(s.number).startsWith(q.trim()) || s.name.includes(q.trim()))
    ;

  const classLabel = useMemo(() => {
    const s = roster[0];
    if (!s) return undefined;
    const sem = month >= 3 && month <= 8 ? "1학기" : "2학기";
    return `${year}학년도 ${sem} · ${s.grade}학년 ${s.class}반`;
  }, [roster, year, month]);


  async function save(
    partial: Omit<AttendanceRecord, "ownerSub">,
    previous?: Omit<AttendanceRecord, "ownerSub">,
  ) {
    const next = { ...partial, status: partial.status || "draft" };
    if (
      previous &&
      (previous.period !== next.period ||
        previous.type !== next.type ||
        previous.date !== next.date)
    ) {
      await deleteAttendanceRecord(ownerSub, previous);
    }
    await putAttendance(ownerSub, next);
    await reload();
  }

  async function addOne(s: Student, type: AttendanceType) {
    if (!open) return;
    await save({
      date: open,
      year: Number(open.slice(0, 4)),
      grade: s.grade,
      class: s.class,
      number: s.number,
      name: s.name,
      category: pendingCat,
      type,
      period: type === "absence" ? 0 : 1,
      reason: "",
      status: "draft",
    });
    setQ("");
  }

  async function confirmPicks() {
    if (!open || !pending) return;
    const set = new Set(picked);
    for (const s of roster.filter((x) => set.has(x.number))) {
      await save({
        date: open,
        year: Number(open.slice(0, 4)),
        grade: s.grade,
        class: s.class,
        number: s.number,
        name: s.name,
        category: pendingCat,
        type: pending,
        period: pending === "absence" ? 0 : 1,
        reason: "",
        status: "draft",
      });
    }
    setPicked([]);
    setBulk(false);
    setQ("");
  }


  async function applyEndDate(row: AttendanceRecord, end: string) {
    if (!end || end <= row.date) return;
    for (const date of weekdaysBetween(row.date, end)) {
      if (date === row.date) continue;
      await putAttendance(ownerSub, {
        ...row,
        date,
        year: Number(date.slice(0, 4)),
        period: row.type === "absence" ? 0 : row.period,
        status: "draft",
      });
    }
    await reload();
  }

  function selectDay(key: string) {
    setOpen(key);
    setPending(null);
    setBulk(false);
    setPicked([]);
    setQ("");
    setFocusKey(null);
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
        <div
          className={
            open
              ? "w-full px-6 py-4 h-full"
              : "max-w-[var(--max-content-width)] mx-auto px-8 py-6"
          }
        >
          <MonthHero
            year={year}
            month={month}
            classLabel={classLabel}
            rosterCount={roster.length}
            monthTotal={monthRows.length}
            breakdown={breakdown}
            onPrev={() => setCursor(new Date(year, month - 2, 1))}
            onNext={() => setCursor(new Date(year, month, 1))}
          />

          {open ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              <div className="lg:col-span-7 min-w-0">
                <MonthCalendar
                  cells={cells}
                  month={month}
                  today={today}
                  open={open}
                  namesByDate={namesByDate}
                  compact
                  onSelect={selectDay}
                />
              </div>
              <div className="lg:col-span-5 min-w-0">
                <DayPanel
                  open={open}
                  weekdayKo={weekdayKo}
                  isToday={open === today}
                  dayRows={dayRows}
                  rosterCount={roster.length}
                  pending={pending}
                  bulk={bulk}
                  picked={picked}
                  q={q}
                  hits={hits}
                  focusKey={focusKey}
                  onClose={() => {
                    setOpen(null);
                    setPending(null);
                    setBulk(false);
                  }}
                  onPending={setPending}
                  onBulk={setBulk}
                  onQ={setQ}
                  onTogglePick={(n) =>
                    setPicked((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n]))
                  }
                  onConfirmPicks={() => void confirmPicks()}
                  onAddOne={(s, t) => void addOne(s, t)}
                  onFocusKey={setFocusKey}
                  onSave={(next, prev) => void save(next, prev)}
                  onEndDate={(row, end) => void applyEndDate(row, end)}
                  onDelete={(r) => void deleteAttendanceRecord(ownerSub, r).then(reload)}
                  onNavRepeat={() => onNav("repeat")}
                />
              </div>
            </div>
          ) : (
            <>
              <MonthCalendar
                cells={cells}
                month={month}
                today={today}
                open={open}
                namesByDate={namesByDate}
                onSelect={selectDay}
              />
              <MonthLegend />
            </>
          )}
        </div>
      </main>
    </Shell>
  );
}
