# extension/ 보안 메모 (이슈 #5 · #6)

- `host_permissions` / content script matches: `*://*.neis.go.kr/*` + `http://localhost:5173/*`만. `<all_urls>` 없음.
- `permissions`: `storage`만 (pageKind·queueItems session). tabs/cookies/debugger 없음.
- `externally_connectable.matches`: `http://localhost:5173/*`만. 타 origin 메시지 거부.
- `onMessageExternal`: origin 검사 + 웹 페이지만(타 확장 `sender.id` 거부).
- 대기열 키는 `docs/data-contract.md` 그대로. 임의 rename 금지.
- CSP: `script-src 'self'`. 원격 스크립트·`eval` 없음.
- 로그: `row=3 type=late result=ok` — 이름·출석번호 없음.
- 수신해도 `synced`로 바꾸지 않음. P칸·저장·출결마감·로그인 자동화 없음.
