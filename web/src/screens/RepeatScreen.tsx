import { useEffect, useMemo, useState } from "react";
import { listRoster, putAttendance } from "../db/store";
import type { AttendanceType, Category, Student } from "../types/models";
import { Shell, type AppScreen } from "./Shell";

function weekdays(start: string, end: string): string[] {
  const out: string[] = [];
  const cur = new Date(start + "T12:00:00");
  const last = new Date(end + "T12:00:00");
  while (cur <= last) {
    if (cur.getDay() !== 0 && cur.getDay() !== 6) out.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

const TYPES: { id: AttendanceType; label: string }[] = [
  { id: "absence", label: "결석" },
  { id: "late", label: "지각" },
  { id: "early_leave", label: "조퇴" },
  { id: "result", label: "결과" },
];
const CATS: { id: Category; label: string }[] = [
  { id: "illness", label: "질병" },
  { id: "unexcused", label: "미인정" },
  { id: "other", label: "기타" },
  { id: "recognized", label: "출석인정" },
];

type Props = { ownerSub: string; teacherLabel: string; screen: AppScreen; onNav: (s: AppScreen) => void; onLogout: () => void };

export function RepeatScreen({ ownerSub, teacherLabel, screen, onNav, onLogout }: Props) {
  const [roster, setRoster] = useState<Student[]>([]);
  const [q, setQ] = useState("");
  const [pick, setPick] = useState<Student | null>(null);
  const [start, setStart] = useState("2026-09-01");
  const [end, setEnd] = useState("2026-09-11");
  const [type, setType] = useState<AttendanceType>("absence");
  const [cat, setCat] = useState<Category>("illness");
  const [period, setPeriod] = useState(3);
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => { void listRoster(ownerSub).then(setRoster); }, [ownerSub]);
  const days = useMemo(() => weekdays(start, end), [start, end]);
  const hits = roster.filter((s) => !q || String(s.number).startsWith(q) || s.name.includes(q)).slice(0, 8);

  async function apply() {
    if (!pick) return;
    if (cat === "other" && !reason.trim()) { setMsg("기타는 사유 필수"); return; }
    if (type !== "absence" && period < 1) { setMsg("기준 교시 필요"); return; }
    for (const date of days) {
      await putAttendance(ownerSub, {
        date, year: Number(date.slice(0, 4)), grade: pick.grade, class: pick.class,
        number: pick.number, name: pick.name, category: cat, type,
        period: type === "absence" ? 0 : period, reason, status: "draft",
      });
    }
    setMsg(`${pick.name} · 평일 ${days.length}일`);
  }

  return (
    <Shell screen={screen} teacherLabel={teacherLabel} rosterCount={roster.length} onNav={onNav} onLogout={onLogout}>
      <main className="flex-1 p-6 max-w-3xl">
        <h1 className="text-2xl font-semibold m-0">장기·반복 출결 등록</h1>
        <p className="text-sm text-[#71717A] mt-1">종류는 결석·지각·조퇴·결과. 구분은 질병·미인정·기타·출석인정. 결석만 교시 없음. (#55)</p>
        <section className="mt-4">
          <h2 className="text-sm font-semibold">대상 학생</h2>
          <input className="h-10 w-full rounded-xl border border-[#E4E4E7] px-3 mt-1" value={q} onChange={(e) => setQ(e.target.value)} placeholder="번호 또는 이름" />
          <div className="mt-2 flex flex-col gap-1">
            {hits.map((s) => (
              <button key={s.number} type="button" onClick={() => setPick(s)}
                className={"text-left px-3 py-2 rounded-xl border " + (pick?.number===s.number ? "border-[#0F766E] bg-[#F0FDFA]" : "border-[#E4E4E7]")}>
                {s.number} {s.name}
              </button>
            ))}
          </div>
        </section>
        <section className="mt-5">
          <h2 className="text-sm font-semibold mb-2">출결 종류</h2>
          <div className="grid grid-cols-4 gap-2">
            {TYPES.map((t) => (
              <button key={t.id} type="button" onClick={() => setType(t.id)}
                className={"py-3 rounded-xl border text-sm " + (type===t.id ? "border-[#0F766E] bg-[#F0FDFA] font-semibold" : "border-[#E4E4E7]")}>{t.label}</button>
            ))}
          </div>
        </section>
        <section className="mt-5">
          <h2 className="text-sm font-semibold mb-2">사유 구분</h2>
          <div className="grid grid-cols-4 gap-2">
            {CATS.map((c) => (
              <button key={c.id} type="button" onClick={() => setCat(c.id)}
                className={"py-3 rounded-xl border text-sm " + (cat===c.id ? "border-[#0F766E] bg-[#F0FDFA] font-semibold" : "border-[#E4E4E7]")}>{c.label}</button>
            ))}
          </div>
        </section>
        {type !== "absence" ? (
          <section className="mt-5">
            <h2 className="text-sm font-semibold mb-2">기준 교시 P</h2>
            <div className="flex gap-1">
              {[1,2,3,4,5,6,7].map((p) => (
                <button key={p} type="button" onClick={() => setPeriod(p)}
                  className={"px-3 py-2 rounded-lg border text-sm " + (period===p ? "bg-[#0F766E] text-white border-[#0F766E]" : "border-[#E4E4E7]")}>{p}교시</button>
              ))}
            </div>
          </section>
        ) : null}
        <section className="mt-5">
          <h2 className="text-sm font-semibold mb-2">기간 (주말 제외)</h2>
          <div className="flex items-center gap-2">
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="h-10 rounded-xl border border-[#E4E4E7] px-2" />
            <span>~</span>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="h-10 rounded-xl border border-[#E4E4E7] px-2" />
            <span className="text-sm text-[#71717A]">평일 {days.length}일</span>
          </div>
        </section>
        <input className="mt-4 h-10 w-full rounded-xl border border-[#E4E4E7] px-3" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="사유" />
        <button type="button" className="mt-4 px-4 py-2 rounded-xl bg-[#0F766E] text-white" onClick={() => void apply().catch((e) => setMsg(String(e)))}>기간 적용</button>
        <p className="text-sm mt-2">{msg}</p>
      </main>
    </Shell>
  );
}
