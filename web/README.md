# 출결메이트 web
Vite + React + TypeScript
이슈 2 로그인 ownerSub, 이슈 3 뼈대 CSV
크롬 확장 나이스 DOM Firestore Drive 분석은 이 폴더에 없습니다.

## 폴더
web/fixtures/roster-gaps.csv — 번호 1,2,3,4,7,9
web/src/auth csv db types App.tsx
web/.env.example SECURITY-NOTES.md

## 실행
1. cd web
2. copy env example to env file, set VITE_GOOGLE_CLIENT_ID optional
3. install deps then run vite (dev) and production build scripts
4. Client ID 없으면 픽스처 로그인(test-owner-aaa)

## 보안 요약
SECURITY-NOTES.md 참고. 토큰은 메모리만. IDB는 ownerSub 칸. 출결 원문 외부 전송 없음.
