import { useCallback, useEffect, useRef, useState } from 'react';
import type { Owner, Student } from './types/models';
import { FIXTURE_OWNER_SUB } from './types/models';
import { getGoogleClientId, mountGoogleButton } from './auth/gis';
import { parseRosterCsv } from './csv/parseRoster';
import { listRoster, replaceRoster } from './db/idb';
import './App.css';

export default function App() {
  const [owner, setOwner] = useState<Owner | null>(null);
  const [roster, setRoster] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const gisHostRef = useRef<HTMLDivElement | null>(null);
  const clientId = getGoogleClientId();

  const loadRoster = useCallback(async (ownerSub: string) => {
    const rows = await listRoster(ownerSub);
    setRoster(rows);
  }, []);

  useEffect(() => {
    if (owner) return;
    if (!clientId) return;
    const el = gisHostRef.current;
    if (!el) return;
    let cancelled = false;
    (async () => {
      try {
        await mountGoogleButton(
          el,
          (next) => {
            if (!cancelled) {
              setError(null);
              setOwner(next);
            }
          },
          (message) => {
            if (!cancelled) setError(message);
          },
        );
      } catch {
        if (!cancelled) setError('GIS 초기화 실패');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [owner, clientId]);

  useEffect(() => {
    if (!owner) {
      setRoster([]);
      return;
    }
    void loadRoster(owner.ownerSub).catch(() => setError('명단 불러오기 실패'));
  }, [owner, loadRoster]);

  const loginFixture = () => {
    setError(null);
    setStatus(null);
    setOwner({
      ownerSub: FIXTURE_OWNER_SUB,
      email: 'fixture@local.test',
      displayName: '픽스처 교사',
    });
  };

  const logout = () => {
    setOwner(null);
    setRoster([]);
    setStatus(null);
    setError(null);
  };

  const onCsvSelected = async (file: File | null) => {
    if (!owner) {
      setError('로그인 후에만 명단을 저장할 수 있습니다.');
      return;
    }
    if (!file) return;
    setError(null);
    setStatus(null);
    try {
      const text = await file.text();
      const rows = parseRosterCsv(text);
      await replaceRoster(owner.ownerSub, rows);
      await loadRoster(owner.ownerSub);
      setStatus(`명단 ${rows.length}명 저장 (빈 번호는 채우지 않음)`);
    } catch (e) {
      const code = e instanceof Error ? e.message : 'csv_error';
      setError(`CSV 처리 실패: ${code}`);
    }
  };

  if (!owner) {
    return (
      <div className="app">
        <header className="header">
          <h1>출결메이트</h1>
          <p className="muted">구글 계정으로 로그인한 뒤, 가명 명단 CSV를 로컬에만 저장합니다.</p>
        </header>
        <section className="card login-card">
          <h2>로그인</h2>
          {clientId ? (
            <div className="gis-host" ref={gisHostRef} />
          ) : (
            <p className="muted">VITE_GOOGLE_CLIENT_ID가 없어 GIS 버튼을 숨깁니다.</p>
          )}
          <button type="button" className="btn secondary" onClick={loginFixture}>
            픽스처로 들어가기 (test-owner-aaa)
          </button>
          {error ? <p className="error" role="alert">{error}</p> : null}
        </section>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header row">
        <div>
          <h1>출결메이트</h1>
          <p className="muted">
            {owner.displayName ?? '교사'} · ownerSub 앞부분 {owner.ownerSub.slice(0, 8)}…
          </p>
        </div>
        <button type="button" className="btn ghost" onClick={logout}>
          로그아웃
        </button>
      </header>

      <section className="card">
        <h2>명단 CSV 가져오기</h2>
        <p className="muted">형식: grade,class,number,name · 빈 출석번호는 만들지 않습니다.</p>
        <label className="file-label">
          CSV 선택
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(ev) => {
              const f = ev.target.files?.[0] ?? null;
              void onCsvSelected(f);
              ev.target.value = '';
            }}
          />
        </label>
        {status ? <p className="ok">{status}</p> : null}
        {error ? <p className="error" role="alert">{error}</p> : null}
      </section>

      <section className="card">
        <h2>저장된 명단</h2>
        {roster.length === 0 ? (
          <p className="muted">아직 명단이 없습니다. fixtures/roster-gaps.csv 를 올려 보세요.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>학년</th>
                  <th>반</th>
                  <th>번호</th>
                  <th>성명</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((s) => (
                  <tr key={`${s.grade}-${s.class}-${s.number}`}>
                    <td>{s.grade}</td>
                    <td>{s.class}</td>
                    <td>{s.number}</td>
                    <td>{s.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {roster.length > 0 ? (
          <p className="muted">
            번호: {roster.map((s) => s.number).join(', ')} (연속이 아니어도 그대로 표시)
          </p>
        ) : null}
      </section>
    </div>
  );
}
