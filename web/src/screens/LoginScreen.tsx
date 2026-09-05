import { useCallback } from 'react';
import type { Owner } from '../types/models';
import { FIXTURE_OWNER_SUB } from '../types/models';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { LoginHint } from '../components/LoginHint';

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

  const handleGisError = useCallback(
    (message: string) => onError(message),
    [onError],
  );

  const loginFixture = () => {
    onError(null);
    onLogin({
      ownerSub: FIXTURE_OWNER_SUB,
      email: 'fixture@local.test',
      displayName: '픽스처 교사',
    });
  };

  return (
    <div className="app">
      <header className="header">
        <h1>출결메이트</h1>
        <LoginHint />
      </header>
      <section className="card login-card">
        <h2>로그인</h2>
        <GoogleSignInButton onOwner={handleOwner} onError={handleGisError} />
        {import.meta.env.DEV ? (
          <button type="button" className="btn secondary" onClick={loginFixture}>
            개발용 픽스처 (test-owner-aaa)
          </button>
        ) : null}
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
      </section>
    </div>
  );
}
