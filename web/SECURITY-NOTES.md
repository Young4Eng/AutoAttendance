# web/ 보안 메모 (이슈 #2 · #3)

- 구글 GIS 범위는 `openid email profile`만. Client Secret·refresh token을 프론트에 두지 않는다.
- ID/access token은 React 메모리(상태)에만 두고 `localStorage`에 저장하지 않는다.
- IndexedDB 키는 항상 `ownerSub|…`로 시작한다. API는 `ownerSub` 필수이며 로그인 전 명단·출결 쓰기를 막는다.
- 출결·성명 원문은 외부 서버·Firestore·Analytics로 보내지 않는다. 가명 픽스처(`학생01`, `test-owner-aaa`)만 저장소에 올린다.
- CSV·화면 출력은 프레임워크 이스케이프로 렌더한다. `innerHTML`/`eval` 없이 번호 공백(7→9)을 채우지 않는다.

## 확장 메시지 (#6)

- `sendToExtension`은 `VITE_EXTENSION_ID`로만 전송. 출결 원문을 우리 서버로 fetch하지 않는다.
- 키는 data-contract 그대로. 확장이 origin·sender를 검사하고 실패 시 거부한다.
- 부분 실패를 synced로 표시하지 않는다.
