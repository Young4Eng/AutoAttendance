import { useEffect, useMemo, useRef, useState } from "react";
import { parseRosterCsv } from "../csv/parseRoster";
import {
  deleteAttendanceRecord,
  listAttendance,
  listRoster,
  putAttendance,
  replaceRoster,
} from "../db/idb";
import type { AttendanceRecord, AttendanceType, Category, Student } from "../types/models";
import "./MonthHome.css";
import { Shell, type AppScreen } from "./Shell";

const DOW = ["월", "화", "수", "목", "금", "토", "일"];
const CAT_KO: Record<Category, string> = {
  illness: "질병",
  unexcused: "미인정",
  other: "기타",
  recognized: "출석인정",
};
const TYPE_KO: Record<AttendanceType, string> = {
  late: "지각",
  early_leave: "조퇴",
  absence: "결석",
  result: "결과",
};
const CATS = Object.keys(CAT_KO) as Category[];
const KINDS = Object.keys(TYPE_KO) as AttendanceType[];
const REASONS = ["독감 진단", "감기몸살", "교통 지연", "가정사(경조사)", "체험학습"];

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function weekend(d: Date) {
  const n = d.getDay();
  return n === 0 || n === 6;
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

type AppScreen = "month" | "preview" | "roster" | "repeat" | "guide" | "qa";

type Props = {
  ownerSub: string;
  teacherLabel: string;
  onLogout: () => void;
  screen: AppScreen;
  onNav: (s: AppScreen) => void;
};

export function MonthHome({ ownerSub, teacherLabel, onLogout, onNav, screen }: Props) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const today = ymd(now);
  const cells = useMemo(() => monthCells(year, month), [year, month]);
  const [open, setOpen] = useState<string | null>(weekend(now) ? null : today);
  const [roster, setRoster] = useState<Student[]>([]);
  const [rows, setRows] = useState<AttendanceRecord[]>([]);
  const [pending, setPending] = useState<AttendanceType | null>(null);
  const [bulk, setBulk] = useState(false);
  const [picked, setPicked] = useState<number[]>([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function reload() {
    const [st, att] = await Promise.all([listRoster(ownerSub), listAttendance(ownerSub)]);
    setRoster(st);
    setRows(att);
  }
  useEffect(() => {
    void reload().catch((e) => setMsg(String(e)));
  }, [ownerSub]);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of rows) m[r.date] = (m[r.date] || 0) + 1;
    return m;
  }, [rows]);
  const namesByDate = useMemo(() => {
    const m: Record<string, AttendanceRecord[]> = {};
    for (const r of rows) (m[r.date] ||= []).push(r);
    return m;
  }, [rows]);

  const dayRows = open ? rows.filter((r) => r.date === open) : [];
  const weekdayKo = open
    ? ["일", "월", "화", "수", "목", "금", "토"][new Date(open + "T12:00:00").getDay()]
    : "";
  const hits = roster
    .filter((s) => !q.trim() || String(s.number).startsWith(q.trim()) || s.name.includes(q.trim()))
    .slice(0, 12);

  async function save(partial: Omit<AttendanceRecord, "ownerSub">) {
    await putAttendance(ownerSub, { ...partial, status: partial.status || "draft" });
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
      category: "illness",
      type,
      period: type === "absence" ? 0 : 1,
      reason: "",
      status: "draft",
    });
  }

  async function confirmPicks() {
    if (!open || !pending) return;
    const set = new Set(picked);
    for (const s of roster.filter((x) => set.has(x.number))) {
      await addOne(s, pending);
    }
    setPicked([]);
    setBulk(false);
    setPending(null);
    setQ("");
  }

  async function onCsv(file: File) {
    const parsed = parseRosterCsv(await file.text());
    await replaceRoster(ownerSub, parsed);
    setMsg(`명단 ${parsed.length}명`);
    await reload();
  }

  async function applyReason(text: string) {
    const target =
      dayRows.find((r) => `${r.number}-${r.type}-${r.period}` === focusKey) || dayRows[dayRows.length - 1];
    if (!target) return;
    await save({ ...target, reason: text });
  }

  return (
    <Shell screen={screen} teacherLabel={teacherLabel} rosterCount={roster.length} onNav={onNav} onLogout={onLogout}>
      <main className={"flex-1 p-6 " + (open ? "max-w-[calc(100%-24rem)]" : "")}>
        <div className="mb-4 rounded-xl border border-[#99F6E4] bg-[#F0FDFA] px-4 py-3 text-sm leading-relaxed text-[#134E4A]">
          출결 초안은 계정에 저장됩니다. 같은 날짜는 한 번만 열고, 패널 안에서 학생을 더합니다.
        </div>
        <header className="flex items-end justify-between mb-4">
          <h1 className="text-2xl font-semibold tracking-tight m-0">
            {year}년 {month}월
          </h1>
          <button type="button" disabled={weekend(now)} onClick={() => setOpen(today)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E4E4E7] bg-white text-sm">
            <span className="material-symbols-outlined text-[16px]">today</span>
            오늘로 이동
          </button>
        </header>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-[#E4E4E7]">
          <div className="grid grid-cols-7 bg-[#F4F4F5] text-center select-none py-2">
            {DOW.map((d) => (
              <div key={d} className={"text-sm font-semibold py-1 " + (d==="토"||d==="일" ? "text-[#A1A1AA]" : "text-[#18181B]")}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 border-t border-[#E4E4E7]">
          {cells.map((d) => {
            const key = ymd(d);
            const out = d.getMonth() !== month - 1;
            const wk = weekend(d);
            const list = namesByDate[key] || [];
            const n = list.length;
            const sel = open === key;
            return (
              <button
                key={key + String(out)}
                type="button"
                disabled={wk || out}
                onClick={() => { setOpen(key); setPending(null); setBulk(false); }}
                className={
                  "min-h-[110px] p-2 flex flex-col text-left border-r border-b border-[#E4E4E7] " +
                  (wk || out ? "bg-[#F4F4F5] text-[#A1A1AA] cursor-default " : "bg-white hover:bg-[#FAFAFA] cursor-pointer ") +
                  (out ? "opacity-40 " : "") +
                  (sel ? "ring-2 ring-inset ring-[#0F766E] bg-gradient-to-b from-[#0F766E]/5 to-transparent " : "")
                }
              >
                <div className="flex items-center justify-between">
                  <span className={"text-sm font-semibold " + (sel ? "text-[#0F766E]" : "")}>{d.getDate()}</span>
                  {n > 0 && !wk ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-[#0F766E] text-white text-[11px] font-semibold">예외 {n}명</span>
                  ) : null}
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  {list.slice(0, 2).map((r) => (
                    <div key={r.number + r.type} className="flex items-center justify-between px-1.5 py-0.5 rounded bg-[#F4F4F5] text-[11px]">
                      <span>{String(r.number).padStart(2,"0")} {TYPE_KO[r.type]}</span>
                    </div>
                  ))}
                  {n === 0 && !wk && !out ? (
                    <span className="opacity-0 hover:opacity-60 text-[#6E7977] text-xs text-center mt-auto">기록 추가 +</span>
                  ) : null}
                </div>
              </button>
            );
          })}
          </div>
        </div>
      </main>
      {open ? (
        <section className="w-[24rem] border-l border-[#E4E4E7] bg-white p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold m-0">{open.slice(5).replace("-", "월 ")}일 ({weekdayKo})</h2>
              <p className="text-xs text-[#71717A] m-0 mt-1">
                {dayRows.length ? `예외 ${dayRows.length}명` : "이날 예외 없음"} · 결석 {dayRows.filter((r) => r.type === "absence").length} · 지각 {dayRows.filter((r) => r.type === "late").length}
              </p>
            </div>
            <button type="button" className="material-symbols-outlined text-[#71717A]" onClick={() => setOpen(null)}>close</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {([
              ["absence","+ 결석","person_add","#B45309"],
              ["late","+ 지각","schedule","#BE123C"],
              ["early_leave","+ 조퇴","logout","#5B21B6"],
              ["result","+ 결과","hourglass_bottom","#0F766E"],
            ] as const).map(([k, lab, ic, col]) => (
              <button key={k} type="button"
                onClick={() => { setPending(k); setBulk(false); setPicked([]); }}
                className={"flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg border text-sm bg-white " + (pending===k && !bulk ? "border-[#0F766E] ring-1 ring-[#0F766E]" : "border-[#E4E4E7]")}>
                <span className="material-symbols-outlined text-[15px]" style={{color: col}}>{ic}</span>
                {lab}
              </button>
            ))}
            <button type="button" onClick={() => { setBulk(true); setPending(pending || "absence"); }}
              className={"w-full flex items-center justify-center gap-1 py-1.5 rounded-lg border text-sm " + (bulk ? "border-[#0F766E]" : "border-[#E4E4E7]")}>
              <span className="material-symbols-outlined text-[15px]">playlist_add_check</span>
              + 다수 일괄 등록
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-1 text-[11px] text-[#3E4947]">
            <span className="font-medium">자주 쓰는 사유:</span>
            {REASONS.map((r) => (
              <button key={r} type="button" onClick={() => void applyReason(r)}
                className="px-1.5 py-0.5 rounded bg-[#F0EDF1] hover:bg-[#EAE7EB] border border-[#E4E4E7]">{r}</button>
            ))}
          </div>
          {pending ? (
            <>
              <input className="h-9 rounded-lg border border-[#E4E4E7] px-3 text-sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder="번호 또는 이름 일부" />
              <div className="flex flex-col gap-1">
                {roster.length === 0 ? <p className="text-sm text-[#71717A]">명단에서 CSV를 먼저 가져오세요.</p> : null}
                {hits.map((s) => (
                  <button key={s.number} type="button"
                    className={"text-left px-2 py-1.5 rounded-lg text-sm " + (picked.includes(s.number) ? "bg-[#CCFBF1]" : "hover:bg-[#F4F4F5]")}
                    onClick={() => {
                      if (bulk) setPicked((p) => p.includes(s.number) ? p.filter((n) => n !== s.number) : [...p, s.number]);
                      else void addOne(s, pending).then(() => { setPending(null); setQ(""); });
                    }}>{s.number} {s.name}</button>
                ))}
                {bulk ? <button type="button" className="rounded-lg border border-[#E4E4E7] py-1.5 text-sm" onClick={() => void confirmPicks()}>{picked.length}명 등록</button> : null}
              </div>
            </>
          ) : (
            <p className="text-xs text-[#71717A]">+결석을 누른 뒤 학생을 고르면 줄이 생깁니다.</p>
          )}
          <div className="flex flex-col gap-1 overflow-auto">
            {dayRows.map((c) => {
              const key = `${c.number}-${c.type}-${c.period}`;
              return (
                <div key={key} onClick={() => setFocusKey(key)} className="py-2 px-1.5 hover:bg-[#F4F4F5]/80 rounded-lg flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-24 shrink-0 font-semibold truncate">{String(c.number).padStart(2,"0")} {c.name}</div>
                    <span className="px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] text-[11px] font-bold border border-[#FDE68A]">{TYPE_KO[c.type]}</span>
                    <button type="button" className="ml-auto material-symbols-outlined text-[16px] text-[#A1A1AA]"
                      onClick={() => void deleteAttendanceRecord(ownerSub, c).then(reload)}>close</button>
                  </div>
                  <div className="inline-flex rounded-md border border-[#E4E4E7] p-0.5 bg-[#F4F4F5] w-fit text-[11px]">
                    {CATS.map((cat) => (
                      <button key={cat} type="button" onClick={() => void save({ ...c, category: cat })}
                        className={"px-1.5 py-0.5 rounded " + (c.category===cat ? "bg-white font-bold text-[#0F766E] shadow-sm" : "text-[#71717A]")}>
                        {CAT_KO[cat]}
                      </button>
                    ))}
                  </div>
                  {c.type !== "absence" ? (
                    <div className="flex flex-wrap gap-1">
                      {[1,2,3,4,5,6,7].map((pr) => (
                        <button key={pr} type="button" onClick={() => void save({ ...c, period: pr })}
                          className={"px-1.5 py-0.5 rounded text-[11px] border " + (c.period===pr ? "bg-[#0F766E] text-white border-[#0F766E]" : "border-[#E4E4E7]")}>
                          {pr}교시
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <input className="h-8 rounded-md border border-[#E4E4E7] px-2 text-sm"
                    defaultValue={c.reason} placeholder={c.category==="other" ? "사유 필수" : "사유"}
                    onFocus={() => setFocusKey(key)} onBlur={(e) => void save({ ...c, reason: e.target.value })} />
                </div>
              );
            })}
          </div>
          <div className="mt-auto flex items-center justify-between text-xs text-[#71717A]">
            <span>계정에 저장됨</span>
            <button type="button" className="px-3 py-1.5 rounded-lg bg-[#0F766E] text-white text-sm" onClick={() => setOpen(null)}>완료</button>
          </div>
        </section>
      ) : null}
    </Shell>
  );
}
