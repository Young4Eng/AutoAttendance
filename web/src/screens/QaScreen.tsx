import { useEffect, useState } from "react";
import { QaHero, type QaTab } from "../components/qa/QaHero";
import { QaStatusCards } from "../components/qa/QaStatusCards";
import { QaReleaseList } from "../components/qa/QaReleaseList";
import { QaFaqList } from "../components/qa/QaFaqList";
import { Shell, type AppScreen } from "./Shell";

type Props = {
  teacherLabel: string;
  screen: AppScreen;
  onNav: (s: AppScreen) => void;
  onLogout: () => void;
};

export function QaScreen({ teacherLabel, screen, onNav, onLogout }: Props) {
  const [tab, setTab] = useState<QaTab>("all");

  useEffect(() => {
    if (tab !== "suggest") return;
    const t = window.setTimeout(() => {
      document.getElementById("suggest-box")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
    return () => window.clearTimeout(t);
  }, [tab]);

  const showRelease = tab === "all" || tab === "release";
  const showFaq = tab === "all" || tab === "faq" || tab === "suggest";

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
          <div className="flex flex-col w-full gap-8">
            <QaHero tab={tab} onTab={setTab} />
            <QaStatusCards />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {showRelease ? (
                <div
                  className={
                    tab === "release" ? "lg:col-span-12" : "lg:col-span-7"
                  }
                >
                  <QaReleaseList />
                </div>
              ) : null}
              {showFaq ? (
                <div
                  className={
                    tab === "all" ? "lg:col-span-5" : "lg:col-span-12"
                  }
                >
                  <QaFaqList highlightSuggest={tab === "suggest"} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </Shell>
  );
}
