/** CSV rules from existing GuideScreen (safe fixtures). */
export function GuideCsv() {
  return (
    <section className="mb-12 p-6 rounded-xl bg-surface-container-lowest shadow-sm" id="csv-section">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-[20px] text-primary">table</span>
        <h2 className="text-lg font-semibold text-on-surface m-0">명단 CSV</h2>
      </div>
      <p className="text-[13px] leading-5 text-on-surface-variant m-0 mb-3">
        헤더 <code className="text-xs">grade,class,number,name</code>. grade·class·number는 숫자만(예:
        2,3,1 — 「2학년」불가). UTF-8 CSV 권장(엑셀: CSV UTF-8). CP949도 지원. 실명 샘플·커밋 금지.
        픽스처는 학생01·결번(1·2·3·4·7·9).
      </p>
      <ol className="m-0 pl-5 space-y-2 text-[13px] text-on-surface list-decimal">
        <li>명단 CSV를 가져온다. 결번은 만들지 않는다.</li>
        <li>이번 달에서 날짜를 한 번 연다.</li>
        <li>+결석/+지각/+조퇴/+결과로 줄을 만들고 구분·사유를 고른다. 결석에는 교시 없음.</li>
        <li>미리보기에서 확장으로 보낸다. 출결마감은 누르지 않는다.</li>
      </ol>
    </section>
  );
}
