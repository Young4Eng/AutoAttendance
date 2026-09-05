import { useMemo, useState } from "react";

const DOW = ["월", "화", "수", "목", "금", "토", "일"];

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isWeekend(d: Date): boolean {
  const n = d.getDay();
  return n === 0 || n === 6;
}

function monthCells(year: number, month: number): Date[] {
  const first = new Date(year, month - 1, 1);
  const pad = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(1 - pad);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const x = new Date(start);
    x.setDate(start.getDate() + i);
    cells.push(x);
  }
  return cells;
}

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
  const counts: Record<string, number> = { "2026-09-03": 3, "2026-09-08": 1 };

  return (
    <div style={{ fontFamily: "Pretendard, sans-serif", background: "#fbfbfa", minHeight: "100vh", color: "#18181b" }}>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <aside style={{ width: 220, borderRight: "1px solid #e4e4e7", padding: 16 }}>
          <div style={{ fontWeight: 700 }}>출결메이트</div>
          <div style={{ fontSize: 12, color: "#71717a", margin: "8px 0 16px" }}>구글 계정에 저장</div>
          <div style={{ padding: "8px 10px", borderRadius: 10, background: "#f0fdfa", color: "#0f766e" }}>이번 달</div>
          <button type="button" onClick={onOpenPreview} style={navBtn}>
            미리보기
          </button>
          <div style={{ padding: "8px 10px", color: "#a1a1aa" }}>명단 · 장기·반복 · 사용 방법</div>
          <div style={{ marginTop: 24, fontSize: 12, color: "#71717a" }}>{teacherLabel}</div>
          <button type="button" onClick={onLogout} style={navBtn}>
            로그아웃
          </button>
        </aside>
        <main style={{ flex: 1, padding: 24 }}>
          <div
            style={{
              background: "#f0fdfa",
              border: "1px solid #99f6e4",
              borderRadius: 12,
              padding: 12,
              fontSize: 13,
              lineHeight: 1.5,
              marginBottom: 16,
              whiteSpace: "pre-line",
            }}
          >
            {`출결 초안(번호·성명·사유)은 출결메이트 계정 DB에 저장됩니다.
브라우저 캐시를 지워도 남고, 같은 구글 계정이면 다른 PC에서도 이어서 볼 수 있습니다.
나이스에 이미 저장한 출결은 나이스에 있습니다. 이 DB는 초안입니다.`}
          </div>
          <h1 style={{ margin: "0 0 8px" }}>2026년 9월</h1>
          <p style={{ color: "#71717a", fontSize: 13 }}>칸 한 번 = 그날 패널. 주말은 선택 불가. 옛 「오늘 출결」 전원 명단은 없음.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {DOW.map((d) => (
              <div key={d} style={{ fontSize: 12, color: "#71717a", padding: 6 }}>
                {d}
              </div>
            ))}
            {cells.map((d) => {
              const key = ymd(d);
              const out = d.getMonth() !== month - 1;
              const wknd = isWeekend(d);
              const n = counts[key] || 0;
              return (
                <button
                  key={key + String(out)}
                  type="button"
                  disabled={wknd || out}
                  onClick={() => setOpen(key)}
                  style={{
                    minHeight: 72,
                    border: "1px solid #e4e4e7",
                    borderRadius: 12,
                    background: wknd || out ? "#f4f4f5" : "#fff",
                    opacity: out ? 0.35 : 1,
                    textAlign: "left",
                    padding: 8,
                  }}
                >
                  {d.getDate()}
                  {n > 0 && !wknd ? (
                    <div style={{ marginTop: 6, fontSize: 11, background: "#0f766e", color: "#fff", display: "inline-block", borderRadius: 99, padding: "1px 6px" }}>
                      예외 {n}명
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
          {open ? (
            <p style={{ marginTop: 16 }}>
              {open} · 패널 자리입니다. +결석 +지각 +조퇴 +결과 (같은 날짜 다시 클릭 없음)
            </p>
          ) : null}
        </main>
      </div>
    </div>
  );
}

const navBtn: React.CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  background: "none",
  border: 0,
  padding: "8px 10px",
  cursor: "pointer",
};
