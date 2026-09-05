import { useState } from 'react';
import type { Owner } from './types/models';
import { LoginScreen } from './screens/LoginScreen';
import { MonthHome } from './screens/MonthHome';
import { SendPreviewScreen } from './screens/SendPreviewScreen';
import './App.css';

type Screen = 'month' | 'preview';

export default function App() {
  const [owner, setOwner] = useState<Owner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>('month');
  const [previewDate, setPreviewDate] = useState('');
  const [previewPeriods, setPreviewPeriods] = useState(6);

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

  if (screen === 'preview') {
    return (
      <SendPreviewScreen
        owner={owner}
        date={previewDate}
        periodCount={previewPeriods}
        onBack={() => setScreen('month')}
      />
    );
  }

  return (
    <MonthHome
      ownerSub={owner.ownerSub}
      teacherLabel={owner.displayName || owner.email || owner.ownerSub}
      onLogout={logout}
      onOpenPreview={() => {
        setPreviewDate(previewDate);
        setPreviewPeriods(previewPeriods);
        setScreen('preview');
      }}
    />
  );
}
