import { Shell, type AppScreen } from "./Shell";
import "./MonthHome.css";

type Props = {
  teacherLabel: string;
  screen: AppScreen;
  onNav: (s: AppScreen) => void;
  onLogout: () => void;
};

export function GuideScreen({ teacherLabel, screen, onNav, onLogout }: Props) {
  return (
    <Shell screen={screen} teacherLabel={teacherLabel} onNav={onNav} onLogout={onLogout}>
      <main className="mh-main">
        <h1>사용 방법</h1>
        <h2>개인정보 안내</h2>
        <p>
          출결 초안(번호·성명·사유)은 출결메이트 계정 DB에 저장됩니다. 캐시를 지워도 남고, 같은 구글이면 다른
          PC에서도 보입니다. 나이스에 넣은 값은 나이스에 있습니다. 인증서·비밀번호는 받지 않습니다.
        </p>
        <p>전문은 docs/privacy.md. 학교 결재 문구는 담당 확인 후 이 페이지에 그대로 넣습니다.</p>
        <h2>조작</h2>
        <ul>
          <li>이번 달 칸을 하루당 한 번 엽니다.</li>
          <li>+결석 +지각 +조퇴 +결과로 줄을 만들고, 줄에서 구분·교시·사유를 고릅니다.</li>
          <li>결석에는 기준 교시가 없습니다.</li>
          <li>주말은 회색입니다.</li>
          <li>미리보기에서만 확장으로 보냅니다. 출결마감은 누르지 않습니다.</li>
        </ul>
      </main>
    </Shell>
  );
}
