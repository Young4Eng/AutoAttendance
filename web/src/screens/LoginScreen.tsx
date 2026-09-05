import { useCallback, useState } from "react";
import type { Owner } from "../types/models";
import { FIXTURE_OWNER_SUB } from "../types/models";
import { GoogleSignInButton } from "../components/GoogleSignInButton";

interface Props {
  onLogin: (owner: Owner) => void;
  error: string | null;
  onError: (message: string | null) => void;
}

export function LoginScreen({ onLogin, error, onError }: Props) {
  const [agree, setAgree] = useState(true);
  const handleOwner = useCallback(
    (owner: Owner) => {
      if (!agree) {
        onError("안내에 동의해야 시작할 수 있습니다");
        return;
      }
      onError(null);
      onLogin(owner);
    },
    [agree, onLogin, onError],
  );

  return (
    <div className="bg-[#FBFBFA] text-[#18181B] min-h-screen flex flex-col justify-between items-center p-6">
      <div className="w-full flex justify-end">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F0FDFA] text-[#0F766E] border border-teal-200/70">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          교원 전용 안전 계정 동기화
        </div>
      </div>
      <div className="w-full max-w-[420px] flex flex-col items-center text-center my-auto">
        <div className="w-16 h-16 rounded-2xl bg-[#0F766E] flex items-center justify-center shadow-sm mb-5 text-white text-2xl font-bold">
          출
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">출결메이트</h1>
        <p className="text-sm text-[#71717A] mb-8 leading-relaxed">
          나이스 일일출결 전, 담임교사를 위한 가벼운 초안 기록장.
          <br />
          예외 학생만 메모하면 크롬 확장이 나이스에 알아서 입력합니다.
        </p>
        <div className="w-full bg-white border border-[#E4E4E7] rounded-2xl p-7 shadow-sm">
          <div className="flex flex-col gap-5 text-left">
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 text-xs text-[#475569] space-y-2.5">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                <span className="font-semibold text-[#0F766E]">계정 DB 저장 및 동기화 안내</span>
              </div>
              <ul className="space-y-1.5 leading-relaxed text-[#3E4947]">
                <li>출결 초안(번호·성명·사유)은 <strong>출결메이트 계정 DB에 저장</strong>됩니다.</li>
                <li>브라우저 캐시를 삭제해도 유지되며, 동일한 구글 계정이라면 <strong>다른 PC에서도 이어서 확인·작업</strong>할 수 있습니다.</li>
                <li>나이스에 최종 반영된 출결은 나이스에 보관되며, 본 DB는 <strong>편리한 입력을 돕는 초안 보관함</strong>입니다.</li>
              </ul>
            </div>
            <label className="flex items-start gap-2.5 cursor-pointer select-none bg-white rounded-xl border border-[#E4E4E7] p-3.5">
              <input type="checkbox" className="w-4 h-4 mt-0.5 accent-[#0F766E]" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              <span className="text-xs font-medium leading-snug">
                위 안내를 읽었고, 이 학급 출결 초안을 계정에 저장하는 데 동의합니다.
                <span className="text-[#0F766E] text-[11px] font-semibold block mt-0.5">[필수]</span>
              </span>
            </label>
            <div className={agree ? "" : "pointer-events-none opacity-50"}>
              <GoogleSignInButton onOwner={handleOwner} onError={onError} />
            </div>
            {import.meta.env.DEV ? (
              <button type="button" className="w-full py-2 text-xs text-[#71717A]" onClick={() => handleOwner({ ownerSub: FIXTURE_OWNER_SUB, email: "fixture@local.test", displayName: "픽스처 교사" })}>
                개발용 픽스처
              </button>
            ) : null}
            {error ? <p className="text-sm text-[#BE123C]">{error}</p> : null}
            <div className="flex items-center justify-center gap-3 text-[11px] text-[#71717A] pt-1 border-t border-[#F4F4F5]">
              사용 방법 · 개인정보 안내
            </div>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-[#71717A]">
          <span>교실·교무실 PC 어디서든 연동</span>
          <span>공동인증서·넥사크로 불필요</span>
        </div>
      </div>
      <div className="text-xs text-[#A1A1AA] text-center">대한민국 중학교 교원 맞춤형 초안 워크스페이스 · 출결메이트</div>
    </div>
  );
}
