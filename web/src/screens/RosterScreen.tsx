import { useEffect, useMemo, useRef, useState } from "react";
import { parseRosterCsv } from "../csv/parseRoster";
import { listRoster, replaceRoster } from "../db/store";
import type { Student } from "../types/models";
import { Shell, type AppScreen } from "./Shell";

type Props = {
  ownerSub: string;
  teacherLabel: string;
  screen: AppScreen;
  onNav: (s: AppScreen) => void;
  onLogout: () => void;
};

export function RosterScreen({ ownerSub, teacherLabel, screen, onNav, onLogout }: Props) {
  const [rows, setRows] = useState<Student[]>([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    void listRoster(ownerSub).then(setRows).catch((e) => setMsg(String(e)));
  }, [ownerSub]);
  const shown = useMemo(
    () => rows.filter((s) => !q.trim() || String(s.number).startsWith(q.trim()) || s.name.includes(q.trim())),
    [rows, q],
  );
  const gaps = useMemo(() => {
    if (rows.length === 0) return 0;
    const nums = rows.map((r) => r.number);
    return Math.max(0, Math.max(...nums) - nums.length);
  }, [rows]);

  return (
    <Shell screen={screen} teacherLabel={teacherLabel} rosterCount={rows.length} onNav={onNav} onLogout={onLogout}>
      <main className="flex-1 p-6">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold m-0">학급 명단 관리</h1>
            <p className="text-sm text-[#71717A] mt-1">결번은 빈 행으로 채우지 않습니다. CSV 헤더 grade,class,number,name</p>
          </div>
          <button type="button" className="px-3 py-2 rounded-xl bg-[#0F766E] text-white text-sm" onClick={() => fileRef.current?.click()}>
            명단 일괄 등록
          </button>
        </div>
        <div className="flex gap-3 mb-4">
          <div className="px-4 py-3 rounded-xl bg-[#F0EDF1]"><div className="text-xs text-[#71717A]">재적</div><div className="text-lg font-semibold">{rows.length}명</div></div>
          <div className="px-4 py-3 rounded-xl bg-[#F0EDF1]"><div className="text-xs text-[#71717A]">결번</div><div className="text-lg font-semibold">{gaps}건</div></div>
        </div>
        <input className="h-10 w-full max-w-sm rounded-xl border border-[#E4E4E7] px-3 mb-3" value={q} onChange={(e) => setQ(e.target.value)} placeholder="번호 또는 이름" />
        <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          void f.text().then(parseRosterCsv).then((parsed) => replaceRoster(ownerSub, parsed)).then(() => listRoster(ownerSub)).then(setRows).then(() => setMsg("가져왔습니다")).catch((err) => setMsg(String(err)));
          e.target.value = "";
        }} />
        <p className="text-sm text-[#71717A]">{msg}</p>
        <div className="mt-2 divide-y divide-[#E4E4E7] bg-white rounded-xl border border-[#E4E4E7]">
          {shown.map((s) => (
            <div key={s.number} className="flex items-center gap-4 px-4 py-3">
              <span className="w-10 font-semibold">{String(s.number).padStart(2, "0")}</span>
              <span className="flex-1">{s.name}</span>
              <span className="text-xs text-[#71717A]">{s.grade}학년 {s.class}반</span>
            </div>
          ))}
        </div>
      </main>
    </Shell>
  );
}
