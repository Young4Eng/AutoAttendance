import { PrivacyPolicyBody } from "../PrivacyPolicyBody";

export function GuidePrivacy() {
  return (
    <section
      className="mb-12 p-6 md:p-8 rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm flex flex-col gap-5"
      id="privacy-section"
    >
      <div className="flex flex-col gap-1 border-b border-outline-variant/40 pb-4">
        <div className="inline-flex items-center gap-1.5 text-primary text-[11px] font-semibold">
          <span className="material-symbols-outlined text-[18px]">security</span>
          <span>개인정보 처리방침</span>
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-on-surface m-0">개인정보 처리방침</h2>
        <p className="text-[15px] leading-6 text-on-surface-variant m-0">
          「개인정보 보호법」 제30조 및 개인정보보호위원회 작성지침 골격에 따른 처리방침입니다.
          로그인 화면과 동일한 제1조부터 제14조입니다.
        </p>
      </div>
      <div className="rounded-xl border border-[#99F6E4] bg-[#F0FDFA] p-4 text-sm leading-relaxed text-on-surface">
        출결 초안(번호·성명·사유)은 계정 DB에 저장됩니다. 캐시를 지워도 남고, 같은 구글이면 다른
        PC에서도 보입니다. 나이스에 넣은 값은 나이스에 있습니다. 인증서·비밀번호는 받지 않습니다.
      </div>
      <PrivacyPolicyBody />
    </section>
  );
}
