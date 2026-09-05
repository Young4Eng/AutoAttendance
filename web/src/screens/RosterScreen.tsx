import { useEffect, useMemo, useRef, useState } from "react";
import { parseRosterCsv } from "../csv/parseRoster";
import { listRoster, replaceRoster } from "../db/store";
import type { Student } from "../types/models";
import { Shell, type AppScreen } from "./Shell";
import "./MonthHome.css";

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
    () =>
      rows.filter((s) => !q.trim() || String(s.number).startsWith(q.trim()) || s.name.includes(q.trim())),
    [rows, q],
  );

  return (
    <Shell screen={screen} teacherLabel={teacherLabel} rosterCount={rows.length} onNav={onNav} onLogout={onLogout}>
      <main className="mh-main">
        <div className="mh-banner">번호 빈칸은 만들지 않습니다. 7 다음 9처럼 결번은 그대로 둡니다. CSV 헤더: grade,class,number,name</div>
        <h1>학급 명단</h1>
        <p className="mh-muted">{msg || `재적 ${rows.length}명`}</p>
        <p>
          <button type="button" className="x" onClick={() => fileRef.current?.click()}>
            명단 CSV 가져오기
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              void f
                .text()
                .then(parseRosterCsv)
                .then((parsed) => replaceRoster(ownerSub, parsed).then(() => listRoster(ownerSub)))
                .then(setRows)
                .then(() => setMsg("가져왔습니다"))
                .catch((err) => setMsg(String(err)));
              e.target.value = "";
            }}
          />
        </p>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="번호 또는 이름" />
        <div className="mh-cards" style={{ marginTop: 12 }}>
          {shown.map((s) => (
            <article key={s.number}>
              <strong>
                {String(s.number).padStart(2, "0")} {s.name}
              </strong>
              <em>
                {s.grade}학년 {s.class}반
              </em>
            </article>
          ))}
        </div>
      </main>
    </Shell>
  );
}
