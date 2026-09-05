# 웹 배포 (Vercel)

웹은 Vercel 주소로 연다. 확장은 각 교사 크롬.

## Vercel
1. https://vercel.com 구글 계정으로 로그인
2. Add New → Project → `Young4Eng/AutoAttendance`
3. Root Directory: `web`
4. Framework: Vite
5. Environment Variables
   - VITE_GOOGLE_CLIENT_ID
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
   - VITE_EXTENSION_ID
6. Deploy
7. 나온 주소(예: https://autoattendance.vercel.app)를 채팅에 보낸다.

service_role 넣지 말 것.

## 그 주소로 해야 할 일
- 구글 클라우드 웹 클라이언트 Authorized JavaScript origins에 `https://그주소`
- Supabase Authentication URL Configuration Site URL / Redirect에 `https://그주소`
- 확장 `externally_connectable`과 `queue/contract.js` ALLOWED_ORIGINS — 주소 받으면 코드에 넣음

로컬 개발은 그대로 http://localhost:5173
