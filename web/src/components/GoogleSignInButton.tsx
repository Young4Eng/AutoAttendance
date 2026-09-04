import { useEffect, useRef } from 'react';
import type { Owner } from '../types/models';
import { getGoogleClientId, mountGoogleButton } from '../auth/gis';

interface Props {
  onOwner: (owner: Owner) => void;
  onError: (message: string) => void;
}

/** GIS button host — hidden when VITE_GOOGLE_CLIENT_ID is missing. */
export function GoogleSignInButton({ onOwner, onError }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const clientId = getGoogleClientId();

  useEffect(() => {
    if (!clientId) return;
    const el = hostRef.current;
    if (!el) return;
    let cancelled = false;
    void mountGoogleButton(
      el,
      (next) => {
        if (!cancelled) onOwner(next);
      },
      (message) => {
        if (!cancelled) onError(message);
      },
    ).catch(() => {
      if (!cancelled) onError('GIS 초기화 실패');
    });
    return () => {
      cancelled = true;
    };
  }, [clientId, onOwner, onError]);

  if (!clientId) {
    return <p className="muted">VITE_GOOGLE_CLIENT_ID가 없어 GIS 버튼을 숨깁니다.</p>;
  }
  return <div className="gis-host" ref={hostRef} />;
}
