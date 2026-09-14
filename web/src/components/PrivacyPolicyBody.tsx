/** 출결메이트 개인정보 처리방침 본문. docs/privacy-policy.md 와 같게 유지. */
export function PrivacyPolicyBody({ compact = false }: { compact?: boolean }) {
  const box = compact
    ? "max-h-56 overflow-y-auto rounded-lg border border-[#E2E8F0] bg-white p-3 text-left text-[11px] leading-5 text-[#334155]"
    : "flex flex-col gap-4 text-[14px] leading-6 text-on-surface";
  const h = compact ? "text-[12px] font-semibold mt-2 mb-0.5 first:mt-0" : "text-[15px] font-semibold m-0 mb-1";
  const p = compact ? "m-0 mb-1" : "m-0 text-on-surface-variant";
  return (
    <div className={box}>
      <p className={p}>시행일: 2026년 9월 6일</p>
      <p className={p}>
        출결메이트 운영자는 「개인정보 보호법」 제30조에 따라 처리 현황을 공개합니다. 처리 정보는
        교원 계정과 학급 출결 초안입니다. 나이스에 반영된 공식 출결은 나이스가 보관합니다.
      </p>

      <h3 className={h}>제1조 처리 목적</h3>
      <p className={p}>
        1. 구글 계정을 통한 교원 신원 확인 및 계정별 초안 구분<br />
        2. 학급 명단 및 출결 초안의 저장·조회·동일 계정 동기화<br />
        3. 이용자가 설치한 크롬 확장이 나이스 일일출결 화면에 초안을 입력하도록 보조<br />
        광고·마케팅 목적으로 처리하지 않습니다.
      </p>

      <h3 className={h}>제2조 처리 및 보유 기간</h3>
      <p className={p}>
        교원 구글 식별값·이메일·표시 이름, 학급 명단 및 출결 초안은 회원 탈퇴 또는 기록 삭제 시까지
        보유합니다. 접속 기록은 1년 또는 호스팅 사업자 기본 보존 기간 중 짧은 기간입니다.
      </p>

      <h3 className={h}>제3조 제3자 제공</h3>
      <p className={p}>
        학생 출결 초안을 제3자에게 제공하거나 판매하지 않습니다. 법령에 따른 수사·감독 기관 요청이
        있는 경우에만 그 범위에서 제공할 수 있습니다.
      </p>

      <h3 className={h}>제4조 처리의 위탁</h3>
      <p className={p}>
        Google(계정 인증), Supabase(초안 DB 호스팅), Vercel(웹 호스팅). 운영자 서버는 초안을
        나이스로 보내지 않습니다. 확장은 이용자 브라우저 안에서만 나이스 화면을 다룹니다.
      </p>

      <h3 className={h}>제5조 정보주체의 권리</h3>
      <p className={p}>
        교원은 열람·정정·삭제·처리정지·동의 철회를 서비스 안 기록 삭제 또는 운영자 요청으로 할 수
        있습니다. 학생·법정대리인 요청은 원칙적으로 소속 학교를 통하여 처리합니다.
      </p>

      <h3 className={h}>제6조 처리 항목</h3>
      <p className={p}>
        교원: 구글 계정 식별값, 이메일, 표시 이름. 학생 초안: 학년, 반, 출석번호, 성명, 구분·종류,
        기준 교시, 사유, 학적 메모. 자동 수집: 로그인 시각, 브라우저 종류 등 최소 정보. 주민등록번호
        등 고유식별정보와 진단서 파일은 수집하지 않습니다.
      </p>

      <h3 className={h}>제7조 파기</h3>
      <p className={p}>
        보유 기간 경과, 목적 달성 또는 삭제 요청 시 지체 없이 파기합니다. 전자 파일은 복구 불가능한
        방법으로 삭제합니다.
      </p>

      <h3 className={h}>제8조 안전성 확보조치</h3>
      <p className={p}>
        데이터베이스 행 수준 보안으로 본인 정보만 열람·변경합니다. 웹은 HTTPS를 사용합니다. 비밀번호는
        구글에 위임하며 운영자가 보관하지 않습니다. 관리용 비밀키는 브라우저에 두지 않습니다.
      </p>

      <h3 className={h}>제9조 자동 수집 장치</h3>
      <p className={p}>
        로그인 유지·보안을 위한 세션 및 로컬 저장소만 사용합니다. 광고 추적 쿠키는 사용하지 않습니다.
      </p>

      <h3 className={h}>제10조 개인정보 보호책임자</h3>
      <p className={p}>
        보호책임자: 조영욱(서울 대명중학교). 문의: whduddnr@daemyeong.sen.ms.kr. 침해 신고는
        개인정보침해신고센터(118), 개인정보보호포털(privacy.go.kr)을 이용할 수 있습니다.
      </p>

      <h3 className={h}>제11조 학생 및 만 14세 미만 아동의 개인정보</h3>
      <p className={p}>
        회원·이용자는 교원이며, 만 14세 미만 아동을 회원으로 모집하지 않습니다. 다만 담임이 넣는
        명단·출결 초안에는 학생 성명·출석번호가 들어가며 만 14세 미만 학생이 포함될 수 있습니다.
        이 정보는 나이스 일일출결 보조 초안에만 씁니다. 학생 또는 법정대리인은 소속 학교를 통하여
        열람·정정·삭제·처리정지를 요구할 수 있고, 운영자는 학교 또는 담임 요청 시 해당 초안을
        삭제합니다. 학생 정보를 광고·마케팅·프로파일링에 쓰지 않습니다.
      </p>

      <h3 className={h}>제12조 방침의 변경</h3>
      <p className={p}>변경하는 경우 변경 내용과 시행일을 서비스 화면에 공개합니다.</p>
    </div>
  );
}
