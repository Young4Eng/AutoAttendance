import { GuideHero } from "../components/guide/GuideHero";
import { GuideSummaryCards } from "../components/guide/GuideSummaryCards";
import { GuideWorkflow } from "../components/guide/GuideWorkflow";
import { GuideCsv } from "../components/guide/GuideCsv";
import { GuideTips } from "../components/guide/GuideTips";
import { GuideFaq } from "../components/guide/GuideFaq";
import { GuidePrivacy } from "../components/guide/GuidePrivacy";
import { GuideExtension } from "../components/guide/GuideExtension";
import { Shell, type AppScreen } from "./Shell";

type Props = {
  teacherLabel: string;
  screen: AppScreen;
  onNav: (s: AppScreen) => void;
  onLogout: () => void;
};

function jump(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function GuideScreen({ teacherLabel, screen, onNav, onLogout }: Props) {
  return (
    <Shell
      screen={screen}
      teacherLabel={teacherLabel}
      onNav={onNav}
      onLogout={onLogout}
      fillViewport
    >
      <main className="relative bg-surface min-h-0 h-full flex-1 overflow-y-auto">
        <div className="max-w-[var(--max-content-width)] mx-auto px-8 py-6">
          <div className="flex flex-col w-full">
            <GuideHero onJump={jump} />
            <GuideSummaryCards />
            <GuideWorkflow
              onNavRoster={() => onNav("roster")}
              onNavMonth={() => onNav("month")}
              onNavPreview={() => onNav("preview")}
            />
            <GuideCsv />
            <GuideTips onNavRepeat={() => onNav("repeat")} />
            <GuideFaq />
            <GuideExtension />
            <GuidePrivacy />
            <section className="p-8 rounded-xl bg-primary text-on-primary shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col gap-1 text-center md:text-left">
                <div className="inline-flex items-center justify-center md:justify-start gap-1.5 text-on-primary-container text-[11px] font-semibold">
                  <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
                  <span>다음 단계</span>
                </div>
                <h2 className="text-lg font-semibold tracking-tight text-on-primary m-0">
                  이번 달에서 예외만 기록해 보세요
                </h2>
                <p className="text-[13px] leading-5 text-primary-fixed-dim m-0">
                  미리보기에서 확장으로 보내고, 출결마감은 누르지 않습니다.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  className="px-6 py-2 rounded-lg bg-surface-container-lowest text-primary hover:bg-surface-bright text-[15px] font-semibold transition-colors shadow-sm inline-flex items-center gap-2"
                  onClick={() => onNav("month")}
                >
                  <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                  <span>이번 달</span>
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-primary-container text-on-primary hover:bg-primary transition-colors text-[15px] font-semibold inline-flex items-center gap-2"
                  onClick={() => onNav("repeat")}
                >
                  <span className="material-symbols-outlined text-[20px]">event_repeat</span>
                  <span>장기·반복</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </Shell>
  );
}
