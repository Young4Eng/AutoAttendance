import { Shell, type AppScreen } from "./Shell";
type Props = { teacherLabel: string; screen: AppScreen; onNav: (s: AppScreen) => void; onLogout: () => void };
export function QaScreen(p: Props) {
  return (
    <Shell {...p}>
      <main className="flex-1 p-6 max-w-3xl">
        <h1 className="text-2xl font-semibold">패치 노트 및 Q&A</h1>
        <div className="mt-4 space-y-4 text-sm">
          <p><b>캐시 지우면 초안이 사라지나요?</b><br/>계정 DB에 있으면 남습니다. 같은 구글로 다시 들어오면 됩니다.</p>
          <p><b>출결마감을 누르나요?</b><br/>아니요.</p>
          <p><b>번호가 비면?</b><br/>행 순번이 아니라 출석번호+성명으로 맞춥니다.</p>
          <p><b>장기 화면 종류가 질병으로 되어 있는데요?</b><br/>시안 오류입니다. 종류는 결석·지각·조퇴·결과입니다. (#55)</p>
        </div>
      </main>
    </Shell>
  );
}
