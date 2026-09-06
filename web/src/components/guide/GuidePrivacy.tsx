/** Privacy block — existing GuideScreen safe copy, sectioned. */
export function GuidePrivacy() {
  return (
    <section
      className="mb-12 p-6 md:p-8 rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm flex flex-col gap-6"
      id="privacy-section"
    >
      <div className="flex flex-col gap-1 border-b border-outline-variant/40 pb-4">
        <div className="inline-flex items-center gap-1.5 text-primary text-[11px] font-semibold">
          <span className="material-symbols-outlined text-[18px]">security</span>
          <span>개인정보 안내</span>
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-on-surface m-0">개인정보 안내</h2>
        <p className="text-[15px] leading-6 text-on-surface-variant m-0">
          이 프로그램은 담임이 나이스에 넣기 전에 출결 예외를 정리하는 초안 도구입니다.
        </p>
      </div>
      <div className="rounded-xl border border-[#99F6E4] bg-[#F0FDFA] p-4 text-sm leading-relaxed text-on-surface">
        출결 초안(번호·성명·사유)은 출결메이트 계정 DB에 저장됩니다. 캐시를 지워도 남고, 같은 구글이면
        다른 PC에서도 보입니다. 나이스에 넣은 값은 나이스에 있습니다. 인증서·비밀번호는 받지
        않습니다.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            n: "1",
            t: "처리 목적",
            b: "나이스 일일출결 입력 전에 결석·지각·조퇴·결과와 사유를 정리하고, 같은 구글 계정으로 다른 컴퓨터에서도 이어서 보기 위함입니다.",
          },
          {
            n: "2",
            t: "처리 항목",
            b: "교사: 구글 계정 식별값, 이메일, 이름. 학생 초안: 학년, 반, 출석번호, 성명, 날짜, 구분, 종류, 기준 교시, 사유. 받지 않음: 주민등록번호, 사진, 학부모 연락처, 나이스 비밀번호·인증서.",
          },
          {
            n: "3",
            t: "저장 위치",
            b: "출결 초안은 출결메이트 계정 DB에 저장됩니다. 브라우저 캐시를 지워도 삭제되지 않습니다. 같은 구글 계정으로 로그인하면 다른 PC에서도 보입니다.",
          },
          {
            n: "4",
            t: "보유·파기",
            b: "해당 학년도가 끝난 때, 또는 「기록 삭제」를 누른 때 중 빠른 때입니다. 나이스에 이미 저장한 출결은 나이스 규정에 따릅니다.",
          },
        ].map((x) => (
          <div key={x.n} className="p-4 rounded-lg bg-surface-container-low flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-[11px] font-bold shrink-0">
                {x.n}
              </span>
              <h3 className="text-[15px] font-semibold text-on-surface m-0">{x.t}</h3>
            </div>
            <p className="text-[13px] leading-5 text-on-surface-variant m-0 pl-8">{x.b}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
