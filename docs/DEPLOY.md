# 웹 배포 (GitHub Pages)

주소: https://young4eng.github.io/AutoAttendance/

확장은 각 PC 크롬. 웹은 이 주소.

## 당신이 할 일
1. 저장소 Settings → Secrets and variables → Actions 에
   - VITE_GOOGLE_CLIENT_ID
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
   - VITE_EXTENSION_ID
2. Settings → Pages → Source: GitHub Actions
3. `docs/pages.yml.example` 내용을 `.github/workflows/pages.yml` 로 저장소에 만든다.
   (지금 PAT는 workflow 파일을 푸시할 권한이 없음)
4. 구글 클라우드 origins에 https://young4eng.github.io
5. Supabase URL Configuration Site URL
   https://young4eng.github.io/AutoAttendance/
