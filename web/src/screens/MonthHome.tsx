import { useEffect, useMemo, useRef, useState } from "react";
import { parseRosterCsv } from "../csv/parseRoster";
import {
  deleteAttendanceRecord,
  listAttendance,
  listRoster,
  putAttendance,
  replaceRoster,
} from "../db/store";
import type { AttendanceRecord, AttendanceType, Category, Student } from "../types/models";
import "./MonthHome.css";

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

type Props = {
  ownerSub: string;
  teacherLabel: string;
  onLogout: () => void;
  onOpenPreview: () => void;
};

export function MonthHome({ ownerSub, teacherLabel, onLogout, onOpenPreview }: Props) {
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
          <button type="button" className="on">이번 달</button>
          <button type="button" onClick={onOpenPreview}>미리보기</button>
          <button type="button" onClick={() => fileRef.current?.click()}>명단</button>
          <button type="button" disabled>장기·반복</button>
          <button type="button" disabled>사용 방법</button>
        </nav>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onCsv(f).catch((err) => setMsg(String(err)));
            e.target.value = "";
          }}
        />
        <div className="mh-foot">
          <div className="mh-ok">명단 {roster.length}명</div>
          <div className="mh-muted">{teacherLabel}</div>
          <div className="mh-muted">{msg}</div>
          <button type="button" onClick={onLogout}>로그아웃</button>
        </div>
      </aside>
      <main className={"mh-main" + (open ? " split" : "")}>
        <div className="mh-banner">
          출결 초안은 계정에 저장됩니다. 같은 날짜는 한 번만 열고, 패널 안에서 학생을 더합니다.
        </div>
        <header className="mh-head">
          <h1>
            {year}년 {month}월
          </h1>
          <button type="button" className="x" disabled={weekend(now)} onClick={() => setOpen(today)}>
            오늘로 이동
          </button>
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
            const list = namesByDate[key] || [];
            const n = list.length;
            const heat = n >= 3 ? "h3" : n === 2 ? "h2" : n === 1 ? "h1" : "";
            return (
              <button
                key={key + String(out)}
                type="button"
                disabled={wk || out}
                className={`mh-cell${out ? " out" : ""}${wk ? " wk" : ""}${open === key ? " sel" : ""} ${heat}`}
                onClick={() => {
                  setOpen(key);
                  setPending(null);
                  setBulk(false);
                }}
              >
                <span>{d.getDate()}</span>
                {n > 0 && !wk ? <b>예외 {n}명</b> : null}
                {list.slice(0, 2).map((r) => (
                  <div key={r.number + r.type} className="mh-mini">
                    {String(r.number).padStart(2, "0")} {TYPE_KO[r.type]}
                  </div>
                ))}
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
              <p>
                {dayRows.length ? `예외 ${dayRows.length}명` : "이날 예외 없음"} · 결석{" "}
                {dayRows.filter((r) => r.type === "absence").length} · 지각{" "}
                {dayRows.filter((r) => r.type === "late").length}
              </p>
            </div>
            <button type="button" className="x" onClick={() => setOpen(null)}>
              닫기
            </button>
          </div>
          <div className="mh-actions">
            {KINDS.map((k) => (
              <button
                key={k}
                type="button"
                className={pending === k && !bulk ? "on" : ""}
                onClick={() => {
                  setPending(k);
                  setBulk(false);
                  setPicked([]);
                }}
              >
                + {TYPE_KO[k]}
              </button>
            ))}
            <button
              type="button"
              className={bulk ? "on" : ""}
              onClick={() => {
                setBulk(true);
                setPending(pending || "absence");
              }}
            >
              + 다수 일괄 등록
            </button>
          </div>
          <div className="mh-reasons">
            <span>자주 쓰는 사유</span>
            {REASONS.map((r) => (
              <button key={r} type="button" onClick={() => void applyReason(r)}>
                {r}
              </button>
            ))}
          </div>
          {pending ? (
            <>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="번호 또는 이름 일부" />
              <div className="mh-cards">
                {roster.length === 0 ? <p>명단에서 CSV를 먼저 가져오세요.</p> : null}
                {hits.map((s) => (
                  <button
                    key={s.number}
                    type="button"
                    className={picked.includes(s.number) ? "on" : ""}
                    onClick={() => {
                      if (bulk) {
                        setPicked((p) =>
                          p.includes(s.number) ? p.filter((n) => n !== s.number) : [...p, s.number],
                        );
                      } else {
                        void addOne(s, pending).then(() => {
                          setPending(null);
                          setQ("");
                        });
                      }
                    }}
                  >
                    {s.number} {s.name}
                  </button>
                ))}
                {bulk ? (
                  <button type="button" className="x" onClick={() => void confirmPicks()}>
                    {picked.length}명 등록
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <p className="mh-muted">+결석을 누른 뒤 학생을 고르면 줄이 생깁니다. 구분·교시·사유는 그 줄에서.</p>
          )}
          <div className="mh-cards">
            {dayRows.map((c) => {
              const key = `${c.number}-${c.type}-${c.period}`;
              return (
                <article key={key} onClick={() => setFocusKey(key)}>
                  <strong>
                    {String(c.number).padStart(2, "0")} {c.name}
                  </strong>
                  <em>{TYPE_KO[c.type]}</em>
                  <button
                    type="button"
                    className="x"
                    onClick={() => void deleteAttendanceRecord(ownerSub, c).then(reload)}
                  >
                    ×
                  </button>
                  <div className="cats">
                    {CATS.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={c.category === cat ? "on" : ""}
                        onClick={() => void save({ ...c, category: cat })}
                      >
                        {CAT_KO[cat]}
                      </button>
                    ))}
                  </div>
                  {c.type !== "absence" ? (
                    <div className="ps">
                      {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                        <button
                          key={p}
                          type="button"
                          className={c.period === p ? "on" : ""}
                          onClick={() => void save({ ...c, period: p })}
                        >
                          {p}교시
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <input
                    defaultValue={c.reason}
                    placeholder={c.category === "other" ? "사유 필수" : "사유"}
                    onFocus={() => setFocusKey(key)}
                    onBlur={(e) => void save({ ...c, reason: e.target.value })}
                  />
                </article>
              );
            })}
          </div>
          <div className="mh-panel-f">
            <span>계정에 저장됨</span>
            <button type="button" className="x" onClick={() => setOpen(null)}>
              완료
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
