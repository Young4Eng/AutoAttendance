# 출결메이트 확장

MV3. 유저스크립트 없음. 이슈 #5 감지 · #6 메시지 · #12 라벨 기준 적용.

## 하는 일

- 담임용 일일출결 화면 감지 + 배지 `ON`
- 웹앱 대기열 수신 (origin·sender 검사)
- **마감** 칸 → `출결마감구분` 팝업 → 구분·종류·사유 → **P교시 한 번 클릭** → (선택) `저장`
- 시운전: 저장 전 중단 (팝업 기본)

## 하지 않는 일

- `<all_urls>` · 유저스크립트 · 로그인/인증서
- `출결마감` 클릭 · `/` 타이핑 · 셀렉터 추측(실명 경로)
- 원본 캡처 커밋 · 자동 `synced`

## 사용

- `scripting`: 시운전 직전 neis iframe에 content 재주입 (#18). 원격 코드 없음.
- `webNavigation`: 시운전 시 iframe에도 `apply-queue` 전달 (URL 가로채기 없음).
- `all_frames: true`: 나이스가 iframe 안에 그리드를 두는 경우가 있어, 라벨 탐지를 프레임마다 돌림. `<all_urls>` 아님.

1. `extension/` 압축 해제 로드
2. `VITE_EXTENSION_ID`에 확장 ID
3. 웹앱에서 대기열 전송
4. 나이스 담임용 화면에서 확장 팝업 → **시운전 (저장 전 중단)** 먼저

가명 그리드 픽스처: `tests/fixtures/neis-grid-dummy.html` (빈 번호 7→9).
Nexacro 팝업 픽스처: `tests/fixtures/neis-popup-nexacro.html` (출결마감구분·구분 후 종류 enable·적용).
