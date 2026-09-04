/** Short login copy for teachers. */
export function LoginHint() {
  return (
    <p className="muted LoginHint">
      구글 계정으로 로그인한 뒤, 가명 명단 CSV를 로컬 IndexedDB에만 저장합니다. 토큰은
      localStorage에 두지 않습니다.
    </p>
  );
}
