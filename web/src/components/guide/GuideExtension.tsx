import { PuzzleIcon } from "../PuzzleIcon";
export function GuideExtension() {
  return (
    <section className="mb-12 p-6 md:p-8 rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm" id="extension-section">
      <div className="flex items-center gap-1.5 text-primary text-[11px] font-semibold mb-1">
        <span className="material-symbols-outlined text-[18px]">extension</span>
        <span>크롬 확장</span>
      </div>
      <h2 className="text-2xl font-semibold tracking-tight text-on-surface m-0 mb-2">나이스에 넣는 순서</h2>
      <p className="text-[15px] leading-6 text-on-surface-variant m-0 mb-4">
        웹에서 초안을 만든 뒤, 미리보기가 확장에 대기열을 넘깁니다. 확장이 나이스 칸을 채우는 것은
        출결 화면이 열린 상태에서 확장 창의 버튼을 눌렀을 때입니다.
      </p>
      <ol className="m-0 pl-5 flex flex-col gap-2 text-[14px] leading-6 text-on-surface">
        <li>출결메이트에서 명단과 예외를 입력하고 미리보기(대기열)로 갑니다.</li>
        <li>보낼 건을 고른 뒤 「나이스로 전송」을 눌러 확장 대기열에 넣습니다. 이 단계에서는 나이스 칸이 아직 안 채워집니다.</li>
        <li>크롬에서 나이스에 로그인한 다음 [학적 — 출결관리 — 일일출결관리(담임용)]을 열고 조회합니다.</li>
        <li>
          그 나이스 탭을 닫지 않은 채, 주소창 오른쪽{" "}
          <PuzzleIcon />
          {" "}아이콘에서 「출결메이트」를 엽니다.
        </li>
        <li>팝업에 「담임용 일일출결 화면」과 대기 건수가 보이면 「적용 후 저장」을 누릅니다. 처음이면 「시운전」으로 칸만 확인할 수 있습니다.</li>
        <li>나이스에 이미 입력된 칸을 다시 넣으면 오류로 멈춥니다. 비어 있는 날·학생만 보냅니다.</li>
        <li>날짜가 바뀌기 전에 나이스 저장 확인까지 끝냅니다. 「출결마감」은 프로그램이 누르지 않으며, 선생님도 이 프로그램으로는 누르지 않습니다.</li>
      </ol>
    </section>
  );
}
