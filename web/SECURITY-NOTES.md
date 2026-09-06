# web/ 보안 메모 (이슈 #2 · #3 · 계정 DB)

- 구글 GIS 범위는 `openid email profile`만. Client Secret·`service_role`을 프론트에 두지 않는다.
- 세션은 Supabase Auth가 검증한다. Access/refresh를 임의로 직접 `localStorage`에 두지 않는다(Auth SDK 기본 저장은 SECURITY·auth 문서 기준).
- IndexedDB 키는 항상 `ownerSub|…`로 시작한다. 로그인 전 명단·출결 쓰기 금지.
- **계정 DB(Supabase):** `roster`/`entries`에 이름·사유 포함 저장·동기화 허용. RLS `owner_id = auth.uid()`. env 없으면 로컬만.
- GitHub·CI·Analytics에는 가명 픽스처(`학생01`, `test-owner-aaa`)만. 실명·사유 원문 커밋 금지.
- CSV·화면 출력은 프레임워크 이스케이프. `innerHTML`/`eval` 없이 번호 공백(7→9)을 채우지 않는다.

## 확장 메시지 (#6)

- `sendToExtension`은 `VITE_EXTENSION_ID`로만 전송. 확장 background가 임의 서버로 출결 JSON을 fetch하지 않는다.
- 키는 data-contract 그대로. 확장이 origin·sender를 검사하고 실패 시 거부한다.
- 부분 실패를 synced로 표시하지 않는다.
