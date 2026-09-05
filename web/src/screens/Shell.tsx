import type { ReactNode } from "react";

export type AppScreen = "month" | "preview" | "roster" | "repeat" | "guide" | "qa";

const NAV: { id: AppScreen; label: string; icon: string }[] = [
  { id: "month", label: "이번 달", icon: "calendar_today" },
  { id: "preview", label: "미리보기", icon: "send_to_mobile" },
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
};

export function Shell({ screen, teacherLabel, rosterCount, onNav, onLogout, children }: Props) {
  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#18181B]">
      <aside className="fixed left-0 top-0 h-screen w-[220px] bg-[#FBFBFA] border-r border-[#E4E4E7] z-50 flex flex-col justify-between select-none">
        <div className="flex flex-col">
          <div className="p-4 border-b border-[#E4E4E7] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0F766E] text-white grid place-items-center text-sm font-semibold">출</div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold tracking-tight truncate">출결메이트</span>
              <span className="text-xs text-[#71717A] truncate">중학교 담임 출결 초안</span>
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
                    ? "flex items-center gap-3 px-3 py-2 rounded-lg bg-[#F0EDF1] text-[#1B1B1E] font-medium text-left w-full"
                    : "flex items-center gap-3 px-3 py-2 rounded-lg text-[#3E4947] hover:bg-[#F0EDF1] text-left w-full"
                }
              >
                <span className="material-symbols-outlined text-[18px] shrink-0">{n.icon}</span>
                <span>{n.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="p-3 border-t border-[#E4E4E7] flex flex-col gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] bg-[#F0FDFA] text-[#0F766E] border border-[#99F6E4] w-fit">
            구글 계정에 저장
          </div>
          <div className="text-xs text-[#71717A]">명단 {rosterCount ?? "—"}명</div>
          <div className="text-xs text-[#71717A] truncate">{teacherLabel}</div>
          <button type="button" className="text-left text-sm px-2 py-1 rounded-lg hover:bg-[#F0EDF1]" onClick={onLogout}>
            로그아웃
          </button>
        </div>
      </aside>
      <div className="ml-[220px] min-h-screen flex">{children}</div>
    </div>
  );
}
