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
- #28/0.3.7: 필터 innerText·전방향 근접·숨은 input. softYear/filterSrc diag. 권한 추가 없음.
- #30/0.4.0: 조회조건 4칸 동일 전략(밴드 좌표 순서·DOM 근접·innerText). 끝점 일자 normalize. unreadable/mismatch 유지. 픽스처+단위테스트. 권한 추가 없음.
- #30 follow-up/0.4.1: 라벨(학년도·학년·일자) 없이도 input 날짜·「N학년 M반 날짜」밴드 압축 파싱. sidenav(메시지함/cl-sidenavigation) 「반」오탐 제외. hasDateInput/bandHit 익명 diag. 권한 추가 없음.

- #33/0.4.2: tables=0(Nexacro) 행을 번호+성명 밴드·리프 스캔으로 매칭. table.rows/nth-row=번호 가정 없음. 빈 번호 스킵. row_not_found 시 hitNum/hitName/rowCand 익명 diag. row-match 순수헬퍼+픽스처. 권한 추가 없음.

- #35/0.4.3: 적용 UI 통짜(Nexacro). 마감 셀·contentsbox 재시도로 팝업 오픈, 출결마감구분/질병+지각 레이어 탐지, 라벨 텍스트로 구분·종류·적용(출결마감 제외), P칸 좌표 1회 클릭. popup_not_found/popup_no_apply/period_cell_missing 익명 diag. popup-apply 순수헬퍼+픽스처. 권한 추가 없음.

- #37/0.4.4: sparse 리프/토큰 라벨 + `selectRadioIn`(contentsbox/부모 셀·팝업 스코프). 제목+질병으로 팝업 확정(popupLike 단독 거부). 구분 후 종류 enable 대기·비활성 스킵. 적용만·출결마감 거부. 권한 추가 없음.
- #42/0.4.5: climbPopupRoot가 제목 앵커에서 조상 중 제목+(적용|닫기)+구분 라벨·titleRequiredOk를 만족하는 **가장 작은** visible 루트만 채택(거대 outer/layer·textCount 상한 거부). 픽스처 decoy outer+단위테스트. 권한 추가 없음.
