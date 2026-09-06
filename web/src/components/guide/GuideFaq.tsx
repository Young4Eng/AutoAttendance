const ITEMS = [
  {
    q: "캐시 지우면 초안이 사라지나요?",
    a: "계정 DB에 있으면 남습니다. 같은 구글로 다시 들어오면 됩니다.",
  },
  {
    q: "전입·전출(결번)은 어떻게 하나요?",
    a: "명단에서 해당 번호를 맞춥니다. 결번 슬롯은 CSV에 만들지 않습니다. 픽스처는 학생01·결번 패턴을 따릅니다.",
  },
  {
    q: "출결마감을 누르나요?",
    a: "아니요. 미리보기에서 확장으로 보낸 뒤, 나이스 화면을 확인하고 나이스에서 저장합니다.",
  },
  {
    q: "나이스에 이미 넣은 출결을 다시 보내면?",
    a: "오류가 나고 그 건은 중단됩니다. 비어 있는 칸만 보냅니다. 이미 마감·입력된 날짜·학생은 대기열에서 빼 주세요.",
  },
] as const;

export function GuideFaq() {
  return (
    <section
      className="mb-12 p-6 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-4"
      id="faq-section"
    >
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-primary">help</span>
        <h2 className="text-[15px] font-semibold text-on-surface m-0">자주 묻는 질문</h2>
      </div>
      <div className="space-y-2">
        {ITEMS.map((item) => (
          <details
            key={item.q}
            className="group rounded-lg bg-surface-container p-3 cursor-pointer"
          >
            <summary className="flex items-center justify-between text-[15px] font-semibold text-on-surface list-none select-none">
              <span>Q. {item.q}</span>
              <span className="material-symbols-outlined text-[18px] text-outline transition-transform group-open:rotate-180">
                expand_more
              </span>
            </summary>
            <p className="text-[13px] leading-5 text-on-surface-variant mt-2 pt-2 mb-0 border-t border-transparent">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
