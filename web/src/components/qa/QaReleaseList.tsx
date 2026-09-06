type Release = {
  version: string;
  date: string;
  title: string;
  chips: { label: string; tone: string }[];
  points: string[];
  icon: string;
  latest?: boolean;
};

const RELEASES: Release[] = [
  {
    version: "최근",
    date: "2026",
    title: "미리보기·장기·이번 달 시안 밀도 (#69)",
    chips: [
      { label: "UI", tone: "bg-primary/10 text-primary" },
      { label: "#69", tone: "bg-surface-container text-on-surface-variant" },
    ],
    points: [
      "미리보기 2단·대기열 표 밀도",
      "장기·반복 좌폼/우대기 · #55 종류/구분/P 유지",
      "이번 달·일 패널 스크롤·학생NN 픽스처",
    ],
    icon: "bolt",
    latest: true,
  },
  {
    version: "#55",
    date: "규칙",
    title: "출결 종류·구분·기준 교시 교정",
    chips: [{ label: "규칙", tone: "bg-primary/10 text-primary" }],
    points: [
      "종류 = 결석·지각·조퇴·결과",
      "구분 = 질병·미인정·기타·출석인정",
      "결석만 기준 교시(P) 숨김",
    ],
    icon: "rule",
  },
  {
    version: "기반",
    date: "웹",
    title: "계정 DB 초안 · 확장 전송",
    chips: [{ label: "기반", tone: "bg-surface-container text-on-surface-variant" }],
    points: [
      "출결 초안은 계정 DB에 저장 (캐시 삭제와 무관)",
      "미리보기에서 확장으로 전송 · 출결마감은 누르지 않음",
      "행 순번이 아니라 출석번호+성명으로 맞춤",
    ],
    icon: "flag",
  },
];

export function QaReleaseList() {
  return (
    <section className="flex flex-col gap-4" id="release-section">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">history</span>
          <h2 className="text-lg font-semibold tracking-tight text-on-surface m-0">
            버전·규칙 노트
          </h2>
        </div>
        <span className="text-[11px] font-semibold text-on-surface-variant">
          {RELEASES.length}개 요약
        </span>
      </div>
      <div className="relative flex flex-col gap-4">
        <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-surface-container-highest" />
        {RELEASES.map((r) => (
          <article key={r.version + r.title} className="relative flex gap-4 items-start">
            <div
              className={
                r.latest
                  ? "w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 z-10 shadow-sm"
                  : "w-8 h-8 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center shrink-0 z-10"
              }
            >
              <span className="material-symbols-outlined text-[18px]">{r.icon}</span>
            </div>
            <div className="flex-1 p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={
                      r.latest
                        ? "text-lg font-semibold text-primary"
                        : "text-lg font-semibold text-on-surface"
                    }
                  >
                    {r.version}
                  </span>
                  {r.latest ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary text-on-primary">
                      최신
                    </span>
                  ) : null}
                  {r.chips.map((c) => (
                    <span
                      key={c.label}
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${c.tone}`}
                    >
                      {c.label}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-on-surface-variant font-mono">{r.date}</span>
              </div>
              <h3 className="text-[15px] font-semibold text-on-surface m-0">{r.title}</h3>
              <div className="p-2 rounded-lg bg-surface-container-low flex flex-col gap-1">
                {r.points.map((p) => (
                  <div key={p} className="flex items-start gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[16px] shrink-0 mt-0.5">
                      check_circle
                    </span>
                    <span className="text-[13px] leading-tight text-on-surface">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
