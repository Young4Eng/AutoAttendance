import { useMemo, useState } from "react";
import "./MonthHome.css";

const DOW = ["월", "화", "수", "목", "금", "토", "일"];
const CATS = ["질병", "미인정", "기타", "출석인정"] as const;

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

type Card = {
  id: string;
  number: number;
  name: string;
  kind: "결석" | "지각" | "조퇴" | "결과";
  cat: (typeof CATS)[number];
  period?: number;
  reason: string;
};

type Props = {
  teacherLabel: string;
  onLogout: () => void;
  onOpenPreview: () => void;
};

export function MonthHome({ teacherLabel, onLogout, onOpenPreview }: Props) {
  const year = 2026;
  const month = 9;
  const cells = useMemo(() => monthCells(year, month), []);
  const [open, setOpen] = useState<string | null>(null);
  const [cards, setCards] = useState<Record<string, Card[]>>({
    "2026-09-03": [
      { id: "a", number: 2, name: "학생02", kind: "결석", cat: "질병", reason: "비염" },
      { id: "b", number: 9, name: "학생09", kind: "지각", cat: "미인정", period: 2, reason: "버스" },
    ],
    "2026-09-08": [{ id: "c", number: 7, name: "학생07", kind: "조퇴", cat: "기타", period: 5, reason: "병원" }],
  });
  const [q, setQ] = useState("");

  const dayCards = open ? cards[open] || [] : [];
  const weekdayKo = open
    ? ["일", "월", "화", "수", "목", "금", "토"][new Date(open + "T12:00:00").getDay()]
    : "";

  function add(kind: Card["kind"]) {
    if (!open) return;
    const n = kind === "결석" ? 1 : kind === "지각" ? 9 : 7;
    const name = n === 1 ? "학생01" : n === 9 ? "학생09" : "학생07";
    const next: Card = {
      id: String(Date.now()),
      number: n,
      name,
      kind,
      cat: "질병",
      period: kind === "결석" ? undefined : 3,
      reason: "",
    };
    setCards((prev) => ({ ...prev, [open]: [...(prev[open] || []), next] }));
  }

  return (
    <div className="mh">
      <aside className="mh-side">
        <div className="mh-brand">
          <div className="mh-logo">출</div>
          <div>
            <strong>출결메이트</strong>
            <div className="mh-sub">중학교 담임 출결 초안</div>
          </div>
        </div>
        <span className="mh-chip">구글 계정에 저장</span>
        <nav>
          <button type="button" className="on">
            이번 달
          </button>
          <button type="button" onClick={onOpenPreview}>
            미리보기
          </button>
          <button type="button" disabled>
            명단
          </button>
          <button type="button" disabled>
            장기·반복
          </button>
          <button type="button" disabled>
            사용 방법
          </button>
          <button type="button" disabled>
            질문
          </button>
        </nav>
        <div className="mh-foot">
          <div className="mh-ok">크롬 확장 연결은 이후</div>
          <div className="mh-muted">{teacherLabel}</div>
          <button type="button" onClick={onLogout}>
            로그아웃
          </button>
        </div>
      </aside>

      <main className={"mh-main" + (open ? " split" : "")}>
        <div className="mh-banner">
          출결 초안(번호·성명·사유)은 출결메이트 계정 DB에 저장됩니다. 캐시를 지워도 남고, 같은 구글이면 다른
          PC에서도 보입니다. 나이스에 넣은 값은 나이스에 있습니다.
          <span> 사용 방법 · 개인정보 안내</span>
        </div>

        <header className="mh-head">
          <h1>2026년 9월</h1>
          <p>칸을 한 번 누르면 그날만 엽니다. 주말은 회색입니다.</p>
        </header>

        <div className="mh-cal">
          {DOW.map((d) => (
            <div key={d} className={"mh-dow" + (d === "토" || d === "일" ? " wk" : "")}>
              {d}
            </div>
          ))}
          {cells.map((d) => {
            const key = ymd(d);
            const out = d.getMonth() !== month - 1;
            const wk = weekend(d);
            const n = (cards[key] || []).length;
            const heat = n >= 3 ? "h3" : n === 2 ? "h2" : n === 1 ? "h1" : "";
            return (
              <button
                key={key + String(out)}
                type="button"
                disabled={wk || out}
                className={`mh-cell${out ? " out" : ""}${wk ? " wk" : ""}${open === key ? " sel" : ""} ${heat}`}
                onClick={() => setOpen(key)}
              >
                <span>{d.getDate()}</span>
                {n > 0 && !wk ? <b>예외 {n}명</b> : null}
              </button>
            );
          })}
        </div>
      </main>

      {open ? (
        <section className="mh-panel">
          <div className="mh-panel-h">
            <div>
              <h2>
                {open.slice(5).replace("-", "월 ")}일 ({weekdayKo})
              </h2>
              <p>{dayCards.length ? `예외 ${dayCards.length}명` : "이날 예외 없음"}</p>
            </div>
            <button type="button" className="x" onClick={() => setOpen(null)}>
              닫기
            </button>
          </div>
          <div className="mh-actions">
            <button type="button" onClick={() => add("결석")}>
              + 결석
            </button>
            <button type="button" onClick={() => add("지각")}>
              + 지각
            </button>
            <button type="button" onClick={() => add("조퇴")}>
              + 조퇴
            </button>
            <button type="button" onClick={() => add("결과")}>
              + 결과
            </button>
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="번호 또는 이름 일부"
          />
          <div className="mh-cards">
            {dayCards.map((c) => (
              <article key={c.id}>
                <strong>
                  {String(c.number).padStart(2, "0")} {c.name}
                </strong>
                <em>{c.kind}</em>
                <div className="cats">
                  {CATS.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={c.cat === cat ? "on" : ""}
                      onClick={() =>
                        setCards((prev) => ({
                          ...prev,
                          [open]: (prev[open] || []).map((x) => (x.id === c.id ? { ...x, cat } : x)),
                        }))
                      }
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                {c.kind !== "결석" ? (
                  <div className="ps">
                    {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={c.period === p ? "on" : ""}
                        onClick={() =>
                          setCards((prev) => ({
                            ...prev,
                            [open]: (prev[open] || []).map((x) => (x.id === c.id ? { ...x, period: p } : x)),
                          }))
                        }
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                ) : null}
                <input
                  value={c.reason}
                  placeholder="사유"
                  onChange={(e) =>
                    setCards((prev) => ({
                      ...prev,
                      [open]: (prev[open] || []).map((x) => (x.id === c.id ? { ...x, reason: e.target.value } : x)),
                    }))
                  }
                />
              </article>
            ))}
          </div>
          <div className="mh-panel-f">계정에 저장됨 · 완료는 다음 연결</div>
        </section>
      ) : null}
    </div>
  );
}
