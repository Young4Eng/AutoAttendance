/** Google Identity Services button (openid email profile). No Client Secret. */

import { ownerFromCredentialJwt } from './credential';
import type { Owner } from '../types/models';
import { getSupabase } from '../db/supabaseClient';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              text?: string;
              shape?: string;
              width?: number;
            },
          ) => void;
          cancel: () => void;
        };
      };
    };
  }
}

const GIS_SRC = 'https://accounts.google.com/gsi/client';

let scriptPromise: Promise<void> | null = null;

function loadGisScript(): Promise<void> {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }
  if (scriptPromise) {
    return scriptPromise;
  }
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GIS_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('gis_load')));
      return;
    }
    const s = document.createElement('script');
    s.src = GIS_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('gis_load'));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export function getGoogleClientId(): string {
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() ?? '';
}

export async function mountGoogleButton(
  parent: HTMLElement,
  onOwner: (owner: Owner) => void,
  onError: (message: string) => void,
): Promise<void> {
  const clientId = getGoogleClientId();
  if (!clientId) {
    onError('VITE_GOOGLE_CLIENT_ID 없음');
    return;
  }
  await loadGisScript();
  if (!window.google?.accounts?.id) {
    onError('GIS 로드 실패');
    return;
  }
  parent.replaceChildren();
  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => {
      void (async () => {
        try {
          const local = ownerFromCredentialJwt(response.credential);
          const sb = getSupabase();
          if (!sb) {
            onOwner(local);
            return;
          }
          const { data, error } = await sb.auth.signInWithIdToken({
            provider: 'google',
            token: response.credential,
          });
          if (error || !data.user) {
            onError(error?.message || 'supabase_auth');
            return;
          }
          onOwner({
            ownerSub: data.user.id,
            email: data.user.email || local.email,
            displayName:
              (data.user.user_metadata?.full_name as string | undefined) || local.displayName,
          });
        } catch {
          onError('credential 파싱 실패');
        }
      })();
    },
    auto_select: false,
  });
  window.google.accounts.id.renderButton(parent, {
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    shape: 'rectangular',
    width: 280,
  });
}
