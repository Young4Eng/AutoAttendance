import { useEffect, useMemo, useState } from "react";
import { listRoster, putAttendance } from "../db/store";
import type { AttendanceType, Category, Student } from "../types/models";
import { Shell, type AppScreen } from "./Shell";
import "./MonthHome.css";

function weekdays(start: string, end: string): string[] {
  const out: string[] = [];
  const cur = new Date(start + "T12:00:00");
  const last = new Date(end + "T12:00:00");
  while (cur <= last) {
    const d = cur.getDay();
    if (d !== 0 && d !== 6) out.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
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
  const [q, setQ] = useState("");
  const [pick, setPick] = useState<Student | null>(null);
  const [start, setStart] = useState("2026-09-01");
  const [end, setEnd] = useState("2026-09-11");
  const [type, setType] = useState<AttendanceType>("absence");
  const [cat, setCat] = useState<Category>("illness");
  const [period, setPeriod] = useState(3);
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    void listRoster(ownerSub).then(setRoster);
  }, [ownerSub]);

  const days = useMemo(() => weekdays(start, end), [start, end]);
  const hits = roster.filter((s) => String(s.number).startsWith(q) || s.name.includes(q)).slice(0, 8);

  async function apply() {
    if (!pick) return;
    if (cat === "other" && !reason.trim()) {
      setMsg("기타는 사유 필수");
      return;
    }
    for (const date of days) {
      await putAttendance(ownerSub, {
        date,
        year: Number(date.slice(0, 4)),
        grade: pick.grade,
        class: pick.class,
        number: pick.number,
        name: pick.name,
        category: cat,
        type,
        period: type === "absence" ? 0 : period,
        reason,
        status: "draft",
      });
    }
    setMsg(`${pick.name} · 평일 ${days.length}일 등록`);
  }

  return (
    <Shell screen={screen} teacherLabel={teacherLabel} rosterCount={roster.length} onNav={onNav} onLogout={onLogout}>
      <main className="mh-main">
        <h1>장기·반복</h1>
        <p className="mh-muted">학생 한 명, 기간의 주말 제외. 시안 _2.</p>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="번호 또는 이름" />
        <div className="mh-cards">
          {hits.map((s) => (
            <button key={s.number} type="button" className={pick?.number === s.number ? "on" : ""} onClick={() => setPick(s)}>
              {s.number} {s.name}
            </button>
          ))}
        </div>
        <p>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          ~
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          주말 제외 · 평일 {days.length}일
        </p>
        <p>
          <select value={type} onChange={(e) => setType(e.target.value as AttendanceType)}>
            <option value="absence">결석</option>
            <option value="late">지각</option>
            <option value="early_leave">조퇴</option>
            <option value="result">결과</option>
          </select>
          <select value={cat} onChange={(e) => setCat(e.target.value as Category)}>
            <option value="illness">질병</option>
            <option value="unexcused">미인정</option>
            <option value="other">기타</option>
            <option value="recognized">출석인정</option>
          </select>
          {type !== "absence" ? (
            <input type="number" min={1} max={7} value={period} onChange={(e) => setPeriod(Number(e.target.value))} />
          ) : null}
        </p>
        <p>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="사유" />
        </p>
        <button type="button" className="x" onClick={() => void apply().catch((e) => setMsg(String(e)))}>
          기간 적용
        </button>
        <p>{msg}</p>
      </main>
    </Shell>
  );
}
