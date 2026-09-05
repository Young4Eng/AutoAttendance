import { Shell, type AppScreen } from "./Shell";
import "./MonthHome.css";

type Props = {
  teacherLabel: string;
  screen: AppScreen;
  onNav: (s: AppScreen) => void;
  onLogout: () => void;
};

export function QaScreen({ teacherLabel, screen, onNav, onLogout }: Props) {
  return (
    <Shell screen={screen} teacherLabel={teacherLabel} onNav={onNav} onLogout={onLogout}>
      <main className="mh-main">
        <h1>패치 노트 및 Q&A</h1>
        <p>
          <b>캐시 지우면 초안이 사라지나요?</b> 계정 DB에 있으면 남습니다. 같은 구글로 다시 들어오면 됩니다.
        </p>
        <p>
          <b>출결마감을 누르나요?</b> 아니요.
        </p>
        <p>
          <b>번호가 비어 있으면?</b> 행 순번이 아니라 출석번호+성명으로 맞춥니다.
        </p>
        <p>
          <b>시안 HTML을 그대로 옮긴 화면인가요?</b> 구성(메뉴·달력·패널·명단·장기·미리보기·안내)을 붙였습니다. 픽셀은
          계속 맞춥니다.
        </p>
      </main>
    </Shell>
  );
}
