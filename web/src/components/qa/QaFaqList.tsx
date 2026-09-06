import { useState } from "react";

type Faq = { id: string; q: string; a: string };

/** Core FAQs from existing QaScreen + safe extras. */
const FAQS: Faq[] = [
  {
    id: "cache",
    q: "캐시 지우면 초안이 사라지나요?",
    a: "계정 DB에 있으면 남습니다. 같은 구글로 다시 들어오면 됩니다.",
  },
  {
    id: "deadline",
    q: "출결마감을 누르나요?",
    a: "아니요. 미리보기에서 확장으로 보낸 뒤 나이스 화면을 확인하고, 나이스에서 저장합니다.",
  },
  {
    id: "number",
    q: "번호가 비면?",
    a: "행 순번이 아니라 출석번호+성명으로 맞춥니다.",
  },
  {
    id: "55",
    q: "장기 화면 종류가 질병으로 되어 있는데요?",
    a: "시안 오류입니다. 종류는 결석·지각·조퇴·결과입니다. 구분은 질병·미인정·기타·출석인정. 결석만 교시 없음. (#55)",
  },
  {
    id: "evidence",
    q: "증빙 체크를 안 해도 전송되나요?",
    a: "됩니다. 증빙 체크는 담임용 메모입니다. 전송 내용(구분·종류·교시·사유)과는 별개입니다.",
  },
];

type Props = { highlightSuggest?: boolean };

export function QaFaqList({ highlightSuggest }: Props) {
  const [open, setOpen] = useState<string | null>("deadline");

  return (
    <section className="flex flex-col gap-6" id="faq-section">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">quiz</span>
            <h2 className="text-lg font-semibold tracking-tight text-on-surface m-0">
              자주 묻는 질문 (FAQ)
            </h2>
          </div>
          <span className="text-[11px] font-medium text-primary">핵심 규칙 포함</span>
        </div>
        <div className="flex flex-col gap-2">
          {FAQS.map((f, i) => {
            const isOpen = open === f.id;
            return (
              <div
                key={f.id}
                className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  className="w-full p-4 flex items-center justify-between text-left gap-3 hover:bg-surface-container-low transition-colors"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : f.id)}
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary shrink-0">
                      Q{i + 1}
                    </span>
                    <span className="text-[15px] font-semibold text-on-surface leading-snug">
                      {f.q}
                    </span>
                  </div>
                  <span
                    className="material-symbols-outlined text-on-surface-variant text-[20px] shrink-0 transition-transform"
                    style={{ transform: isOpen ? "rotate(180deg)" : undefined }}
                  >
                    expand_more
                  </span>
                </button>
                {isOpen ? (
                  <div className="px-4 pb-4 text-[13px] leading-5 text-on-surface-variant">
                    <div className="p-3 rounded-lg bg-surface-container">
                      <p className="m-0">{f.a}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div
        id="suggest-box"
        className={
          highlightSuggest
            ? "p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-4 ring-2 ring-primary/30"
            : "p-4 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-4"
        }
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">support_agent</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-primary">기능 제안·오류 제보</span>
            <h3 className="text-lg font-semibold tracking-tight text-on-surface m-0">
              더 필요한 안내가 있나요?
            </h3>
          </div>
        </div>
        <p className="text-[13px] leading-5 text-on-surface-variant m-0">
          실명·학교명·학생 원문 사유는 제보에 넣지 마세요. 재현 단계와 화면 이름(#69 guide/qa 등)만
          적으면 충분합니다. 레포 이슈로 남겨 주세요.
        </p>
        <a
          className="inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg bg-primary text-on-primary text-[15px] font-semibold hover:bg-primary-container transition-colors shadow-sm w-fit"
          href="https://github.com/Young4Eng/AutoAttendance/issues"
          target="_blank"
          rel="noreferrer"
        >
          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          <span>GitHub 이슈 열기</span>
        </a>
      </div>
    </section>
  );
}
