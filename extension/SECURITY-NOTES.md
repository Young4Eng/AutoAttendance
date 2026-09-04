# extension/ 보안 메모 (#5 · #6 · #12)

- hosts: `*://*.neis.go.kr/*` + `http://localhost:5173/*`만. `<all_urls>` 없음.
- `permissions`: `storage` + `webNavigation`(getAllFrames만) + `scripting`(neis 프레임에 content 재주입만). URL 가로채기·원격코드 없음. `externally_connectable`: localhost:5173만.
- 셀렉터: 화면 **라벨 텍스트**(번호·성명·마감·저장·출결마감구분 등). 실명 CSS 경로·원본 캡처 없음.
- 로그: `row`/`type`/`code`만. 이름·출석번호 금지.
- `/` 칸마다 타이핑 없음. `출결마감` 클릭 코드 없음. 기본 시운전은 저장 전 중단.
- 저장해도 `synced` 자동 표시 없음(육안 후).
- 로그인·인증서 자동화 없음.

- #20: 자식 iframe이 pageKind를 other로 덮지 않음. 그리드는 헤더/본문 테이블 분리 대응. 권한 추가 없음(0.3.3).

- #22/0.3.4: 그리드 헤더 2줄·분리 table·div 행 라벨 탐색. grid_not_found 시 tables/hasNumLabel 등 익명 diag만. 권한 추가 없음.
- #24/0.3.5: 넥사크로류 좌표·라벨 그리드 + 팝업 익명 diag(hitNum 등). 권한 추가 없음.
- #26/0.3.6: 학년도 등 필터 라벨 우측 콤보/표시값 읽기. year_unreadable 구분. raw는 짧은 숫자·날짜만. 권한 추가 없음.
