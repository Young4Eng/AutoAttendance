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
  /** Ignored for display — real names must not appear in the sidebar. */
  teacherLabel: string;
  rosterCount?: number;
  onNav: (s: AppScreen) => void;
  onLogout: () => void;
  children: ReactNode;
  /** Lock to viewport; sidebar + main scroll independently (preview/repeat). */
  fillViewport?: boolean;
};

export function Shell({
  screen,
  rosterCount,
  onNav,
  onLogout,
  children,
  fillViewport = false,
}: Props) {
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
        <div className="p-3 border-t border-[var(--border)] flex flex-col gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] bg-[var(--accent-bg)] text-[var(--primary-container)] border border-[var(--accent-border)] w-fit">
            구글 계정에 저장
          </div>
          <div className="text-xs text-[var(--text-secondary)]">명단 {rosterCount ?? "—"}명</div>
          <div className="text-xs text-[var(--text-secondary)] truncate">담임 전용</div>
          <button
            type="button"
            className="text-left text-sm px-2 py-1 rounded-lg hover:bg-[var(--surface-container)]"
            onClick={onLogout}
          >
            로그아웃
          </button>
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
