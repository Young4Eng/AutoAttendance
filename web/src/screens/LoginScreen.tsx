import { useCallback } from "react";
import type { Owner } from "../types/models";
import { FIXTURE_OWNER_SUB } from "../types/models";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import "./LoginScreen.css";

interface Props {
  onLogin: (owner: Owner) => void;
  error: string | null;
  onError: (message: string | null) => void;
}

export function LoginScreen({ onLogin, error, onError }: Props) {
  const handleOwner = useCallback(
    (owner: Owner) => {
      onError(null);
      onLogin(owner);
    },
    [onLogin, onError],
  );

  return (
    <div className="ls">
      <div className="ls-chip">구글 계정에 저장</div>
      <div className="ls-mid">
        <div className="ls-logo">출</div>
        <h1>출결메이트</h1>
        <p className="sub">
          나이스 일일출결 전, 담임교사를 위한 가벼운 초안 기록장.
          <br />
          예외 학생만 메모하면 크롬 확장이 나이스에 입력합니다.
        </p>
        <div className="ls-card">
          <GoogleSignInButton onOwner={handleOwner} onError={onError} />
          <div className="ls-div">교원 안심 인증</div>
          <div className="ls-note">
            <b>출결 초안은 출결메이트 계정 DB에 저장됩니다.</b>
            {"\n"}캐시를 지워도 남고, 같은 구글이면 다른 PC에서도 이어서 볼 수 있습니다.
            {"\n"}나이스에 넣은 값은 나이스에 있습니다. 인증서·비밀번호는 받지 않습니다.
          </div>
          {import.meta.env.DEV ? (
            <button
              type="button"
              className="btn secondary"
              onClick={() =>
                handleOwner({
                  ownerSub: FIXTURE_OWNER_SUB,
                  email: "fixture@local.test",
                  displayName: "픽스처 교사",
                })
              }
            >
              개발용 픽스처
            </button>
          ) : null}
          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div className="ls-meta">
          <span>공동인증서 불필요</span>
          <span>넥사크로 미설치</span>
        </div>
      </div>
      <div className="ls-foot">대한민국 중학교 교원 맞춤형 초안 · 출결메이트</div>
    </div>
  );
}
