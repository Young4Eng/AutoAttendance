import type { ReactNode } from "react";

export type AppScreen = "month" | "preview" | "roster" | "repeat" | "guide" | "qa";

const NAV: { id: AppScreen; label: string; icon: string }[] = [
  { id: "month", label: "이번 달", icon: "calendar_today" },
  { id: "preview", label: "미리보기 (대기열)", icon: "send_to_mobile" },
  { id: "roster", label: "명단", icon: "group" },
  { id: "repeat", label: "장기·반복", icon: "event_repeat" },
  { id: "guide", label: "사용 방법", icon: "description" },
  { id: "qa", label: "질문", icon: "chat" },
];

type Props = {
  screen: AppScreen;
  teacherLabel: string;
  rosterCount?: number;
  onNav: (s: AppScreen) => void;
  onLogout: () => void;
  children: ReactNode;
  fillViewport?: boolean;
};

export function Shell({
  screen,
  teacherLabel,
  onNav,
  onLogout,
  children,
  fillViewport = false,
}: Props) {
  const initial = (teacherLabel || "담").trim().slice(0, 1);
  return (
    <div
      className={
        fillViewport
          ? "h-screen overflow-hidden bg-[var(--canvas)] text-[var(--text)] flex"
          : "min-h-screen bg-[var(--canvas)] text-[var(--text)]"
      }
    >
      <aside
        className={
          fillViewport
            ? "w-[var(--sidebar-width)] h-screen shrink-0 bg-[var(--canvas)] border-r border-[var(--border)] z-50 flex flex-col justify-between select-none overflow-y-auto"
            : "fixed left-0 top-0 h-screen w-[var(--sidebar-width)] bg-[var(--canvas)] border-r border-[var(--border)] z-50 flex flex-col justify-between select-none"
        }
        aria-label="주 메뉴"
      >
        <div className="flex flex-col">
          <div className="p-4 border-b border-[var(--border)] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary-container)] text-white grid place-items-center text-sm font-semibold">
              출
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold tracking-tight truncate">출결메이트</span>
              <span className="text-xs text-[var(--text-secondary)] truncate">중학교 담임 출결 초안</span>
            </div>
          </div>
          <nav className="p-2 flex flex-col gap-0.5">
            {NAV.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => onNav(n.id)}
                className={
                  screen === n.id
                    ? "flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--accent-bg)] text-[var(--primary-container)] font-medium text-left w-full border border-[var(--accent-border)]"
                    : "flex items-center gap-3 px-3 py-2 rounded-lg text-[var(--on-surface-variant)] hover:bg-[var(--surface-container)] text-left w-full"
                }
              >
                <span className="material-symbols-outlined text-[18px] shrink-0">{n.icon}</span>
                <span>{n.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="p-3 border-t border-[var(--border)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[var(--primary-container)] text-white grid place-items-center text-sm font-semibold shrink-0">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{teacherLabel || "로그인됨"}</div>
            <div className="text-[11px] text-[var(--text-secondary)]">구글 계정</div>
            <button
              type="button"
              className="text-left text-xs text-[var(--primary-container)] font-medium mt-0.5"
              onClick={onLogout}
            >
              로그아웃
            </button>
          </div>
        </div>
      </aside>
      <div
        className={
          fillViewport
            ? "flex-1 min-w-0 h-screen flex flex-col overflow-hidden"
            : "ml-[var(--sidebar-width)] min-h-screen flex"
        }
      >
        {children}
      </div>
    </div>
  );
}
