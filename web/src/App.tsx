import { useState } from 'react';
import type { Owner } from './types/models';
import { LoginScreen } from './screens/LoginScreen';
import { MonthHome } from './screens/MonthHome';
import { SendPreviewScreen } from './screens/SendPreviewScreen';
import { RosterScreen } from './screens/RosterScreen';
import { RepeatScreen } from './screens/RepeatScreen';
import { GuideScreen } from './screens/GuideScreen';
import { QaScreen } from './screens/QaScreen';
import type { AppScreen } from './screens/Shell';
import './App.css';

export default function App() {
  const [owner, setOwner] = useState<Owner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [screen, setScreen] = useState<AppScreen>('month');
  const [previewPeriods] = useState(6);

  const logout = () => {
    setOwner(null);
    setError(null);
    setScreen('month');
  };

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
  const label = owner.displayName || owner.email || owner.ownerSub;

  if (screen === 'preview') {
    return (
      <SendPreviewScreen
        owner={owner}
        date=""
        periodCount={previewPeriods}
        onBack={() => setScreen('month')}
      />
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
