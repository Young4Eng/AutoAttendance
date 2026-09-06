import { useCallback, useEffect, useRef, useState } from 'react';
import type { Owner } from './types/models';
import { LoginScreen } from './screens/LoginScreen';
import { MonthHome } from './screens/MonthHome';
import { SendPreviewScreen } from './screens/SendPreviewScreen';
import { RosterScreen } from './screens/RosterScreen';
import { RepeatScreen } from './screens/RepeatScreen';
import { GuideScreen } from './screens/GuideScreen';
import { QaScreen } from './screens/QaScreen';
import { Shell } from './screens/Shell';
import type { AppScreen } from './screens/Shell';
import { getSupabase } from './db/supabaseClient';
import { ownerFromAuthUser, SESSION_EXPIRED_MESSAGE } from './auth/session';
import './App.css';

export default function App() {
  const [owner, setOwner] = useState<Owner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [screen, setScreen] = useState<AppScreen>('month');
  const [previewPeriods] = useState(6);
  /** Avoid LoginScreen flash while getSession runs. */
  const [bootReady, setBootReady] = useState(() => getSupabase() === null);
  const intentionalSignOut = useRef(false);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setBootReady(true);
      return;
    }

    let cancelled = false;

    void sb.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      const user = data.session?.user;
      if (user) {
        setOwner(ownerFromAuthUser(user));
        setScreen('month');
      }
      setBootReady(true);
    });

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;

      if (session?.user) {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
          setOwner(ownerFromAuthUser(session.user));
        }
        return;
      }

      // No session: logout, expiry, or failed refresh.
      setOwner(null);
      setScreen('month');
      if (
        !intentionalSignOut.current &&
        (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED')
      ) {
        setError(SESSION_EXPIRED_MESSAGE);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const logout = useCallback(() => {
    intentionalSignOut.current = true;
    const sb = getSupabase();
    void (async () => {
      try {
        if (sb) {
          await sb.auth.signOut();
        }
      } finally {
        setOwner(null);
        setError(null);
        setScreen('month');
        intentionalSignOut.current = false;
      }
    })();
  }, []);

  if (!bootReady) {
    return (
      <div className="bg-[var(--canvas)] text-[var(--text-secondary)] min-h-screen flex items-center justify-center text-sm">
        불러오는 중…
      </div>
    );
  }

  if (!owner) {
    return (
      <LoginScreen
        onLogin={(o) => {
          setOwner(o);
          setScreen('month');
        }}
        error={error}
        onError={setError}
      />
    );
  }

  const nav = (s: AppScreen) => setScreen(s);
  const label = owner.displayName || owner.email || '담임';

  if (screen === 'preview') {
    return (
      <Shell screen={screen} teacherLabel={label} onNav={nav} onLogout={logout} fillViewport>
        <SendPreviewScreen owner={owner} date="" periodCount={previewPeriods} onBack={() => setScreen('month')} />
      </Shell>
    );
  }
  if (screen === 'roster') {
    return (
      <RosterScreen ownerSub={owner.ownerSub} teacherLabel={label} screen={screen} onNav={nav} onLogout={logout} />
    );
  }
  if (screen === 'repeat') {
    return (
      <RepeatScreen ownerSub={owner.ownerSub} teacherLabel={label} screen={screen} onNav={nav} onLogout={logout} />
    );
  }
  if (screen === 'guide') {
    return <GuideScreen teacherLabel={label} screen={screen} onNav={nav} onLogout={logout} />;
  }
  if (screen === 'qa') {
    return <QaScreen teacherLabel={label} screen={screen} onNav={nav} onLogout={logout} />;
  }

  return (
    <MonthHome ownerSub={owner.ownerSub} teacherLabel={label} onLogout={logout} onNav={nav} screen={screen} />
  );
}
