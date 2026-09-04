# extension/ 보안 메모 (이슈 #5)

- `host_permissions` / content script matches: `*://*.neis.go.kr/*` + `http://localhost:5173/*`만. `<all_urls>` 없음.
- CSP: `script-src 'self'`. 원격 스크립트·`eval` 없음.
- 감지는 문서 제목·본문 문구(`일일출결관리(담임용)`)와 호스트만 사용. 그리드·저장·P칸 셀렉터 없음.
- `console` / storage에 학생 이름·출석번호를 넣지 않음. `page=homeroom-daily|other` 정도만.
- 로그인·저장·출결마감·대기열 전송은 이 이슈 범위 밖.
