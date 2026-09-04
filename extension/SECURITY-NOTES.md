# extension/ 보안 메모 (#5 · #6 · #12)

- hosts: `*://*.neis.go.kr/*` + `http://localhost:5173/*`만. `<all_urls>` 없음.
- `permissions`: `storage` + `webNavigation`(getAllFrames만, URL 가로채기 없음). `externally_connectable`: localhost:5173만.
- 셀렉터: 화면 **라벨 텍스트**(번호·성명·마감·저장·출결마감구분 등). 실명 CSS 경로·원본 캡처 없음.
- 로그: `row`/`type`/`code`만. 이름·출석번호 금지.
- `/` 칸마다 타이핑 없음. `출결마감` 클릭 코드 없음. 기본 시운전은 저장 전 중단.
- 저장해도 `synced` 자동 표시 없음(육안 후).
- 로그인·인증서 자동화 없음.
