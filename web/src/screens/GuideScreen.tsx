import { Shell, type AppScreen } from "./Shell";
type Props = { teacherLabel: string; screen: AppScreen; onNav: (s: AppScreen) => void; onLogout: () => void };
export function GuideScreen(p: Props) {
  return (
    <Shell {...p}>
      <main className="flex-1 p-6 max-w-3xl">
        <h1 className="text-2xl font-semibold">사용 방법</h1>
        <h2 className="mt-6 text-lg font-semibold">개인정보 안내</h2>
        <div className="mt-2 rounded-xl border border-[#99F6E4] bg-[#F0FDFA] p-4 text-sm leading-relaxed">
          출결 초안(번호·성명·사유)은 출결메이트 계정 DB에 저장됩니다. 캐시를 지워도 남고, 같은 구글이면 다른 PC에서도 보입니다.
          나이스에 넣은 값은 나이스에 있습니다. 인증서·비밀번호는 받지 않습니다. 전문은 docs/privacy.md.
        </div>
        <h2 className="mt-6 text-lg font-semibold">4단계</h2>
        <ol className="mt-2 space-y-2 text-sm list-decimal pl-5">
          <li>명단 CSV를 가져온다. 결번은 만들지 않는다.</li>
          <li>이번 달에서 날짜를 한 번 연다.</li>
          <li>+결석/+지각/+조퇴/+결과로 줄을 만들고 구분·사유를 고른다. 결석에는 교시 없음.</li>
          <li>미리보기에서 확장으로 보낸다. 출결마감은 누르지 않는다.</li>
        </ol>
      </main>
    </Shell>
  );
}
