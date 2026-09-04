import { useState } from 'react';
import type { Owner } from './types/models';
import { LoginScreen } from './screens/LoginScreen';
import { TodayAttendanceScreen } from './screens/TodayAttendanceScreen';
import { SendPreviewScreen } from './screens/SendPreviewScreen';
import './App.css';

type Screen = 'today' | 'preview';

export default function App() {
  const [owner, setOwner] = useState<Owner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>('today');
  const [previewDate, setPreviewDate] = useState('');
  const [previewPeriods, setPreviewPeriods] = useState(6);

  const logout = () => {
    setOwner(null);
    setError(null);
    setScreen('today');
  };

  if (!owner) {
    return (
      <LoginScreen
        onLogin={(o) => {
          setOwner(o);
          setScreen('today');
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
        onBack={() => setScreen('today')}
      />
    );
  }

  return (
    <TodayAttendanceScreen
      owner={owner}
      onLogout={logout}
      onPreview={(date, periodCount) => {
        setPreviewDate(date);
        setPreviewPeriods(periodCount);
        setScreen('preview');
      }}
    />
  );
}
