import type { ReactNode } from "react";

export type AppScreen = "month" | "preview" | "roster" | "repeat" | "guide" | "qa";

const NAV: { id: AppScreen; label: string }[] = [
  { id: "month", label: "이번 달" },
  { id: "preview", label: "미리보기" },
  { id: "roster", label: "명단" },
  { id: "repeat", label: "장기·반복" },
  { id: "guide", label: "사용 방법" },
  { id: "qa", label: "패치 노트 및 Q&A" },
];

type Props = {
  screen: AppScreen;
  teacherLabel: string;
  rosterCount?: number;
  onNav: (s: AppScreen) => void;
  onLogout: () => void;
  children: ReactNode;
};

export function Shell({ screen, teacherLabel, rosterCount, onNav, onLogout, children }: Props) {
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
          {NAV.map((n) => (
            <button key={n.id} type="button" className={screen === n.id ? "on" : ""} onClick={() => onNav(n.id)}>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="mh-foot">
          <div className="mh-ok">명단 {rosterCount ?? "—"}명</div>
          <div className="mh-muted">{teacherLabel}</div>
          <button type="button" onClick={onLogout}>
            로그아웃
          </button>
        </div>
      </aside>
      <div style={{ flex: 1, minWidth: 0, display: "flex" }}>{children}</div>
    </div>
  );
}
