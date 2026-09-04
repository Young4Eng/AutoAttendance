# 구글 계정 — 신원만, 출결은 계정 칸에

교사가 구글 계정으로 구분되고, 출결 기록은 **그 계정 칸에만** 보인다.  
구글은 **누구인지**만 알려 준다. 학생 명단·출결·사유를 구글·우리 서버 DB에 평문으로 올리지 않는다.

## 왜 이렇게

- 출결은 학생 개인정보다. 프로젝트 Firebase/Supabase에 실명을 두면 우리(또는 호스팅 업체)가 처리자가 된다.
- 브라우저 `if (email === …)` 나 프론트에 심은 비밀번호는 로그인이 아니다.
- 구글 로그인 버튼을 달고 데이터를 한 통에 섞으면, 다른 교사 PC 북마크만으로 학급이 보인다.

## 1차가 하는 일

1. 구글 로그인 (Google Identity Services / 확장 `chrome.identity`)
2. 구글이 준 안정 ID `sub`로 IndexedDB를 나눈다. `ownerSub`가 다른 레코드는 UI에 안 불러온다
3. 화면에 보이는 것은 이메일·이름(구글 프로필)뿐
4. 로그아웃하면 그 칸을 닫는다. 다른 계정으로 열면 다른 칸만 보인다
5. 로그인 전에 출결을 쓰지 않는다. 게스트·공유 서랍 없음

요청 범위:

```text
openid email profile
```

Drive, Gmail, Contacts, 캘린더 권한은 받지 않는다.

## 1차가 하지 않는 일

- 프로젝트 소유 Firestore / Supabase / 우리 API에 학생 이름·출결 평문 저장
- 구글 비밀번호를 우리 창에 입력받거나 저장
- Client Secret, service_role, refresh token을 프론트·확장 소스에 넣기
- `localStorage.isAdmin` 같은 값으로 권한 판단
- 로그인 UI만 있고 실제로는 한 IndexedDB를 공유

## 토큰

- ID 토큰은 **구글 서명 검증** 전에 신원으로 쓰지 않는다. 웹앱이 서버 없이 동작하면, 검증 가능한 값은 `google.accounts.id` 콜백의 credential을 라이브러리가 확인한 뒤의 `sub`다.
- Access token·refresh token을 `localStorage`에 두지 않는다. 메모리 또는 `chrome.identity` 캐시만.
- 로그에 `sub` 전체·이메일을 남기지 않는다. `sub` 앞 6자 해시 정도만.

## 데이터 모양

```json
{
  "ownerSub": "test-owner-aaa",
  "date": "2026-08-28",
  "year": 2026,
  "grade": 2,
  "class": 3,
  "number": 1,
  "name": "학생01",
  "category": "illness",
  "type": "late",
  "period": 3,
  "reason": "",
  "status": "queued"
}
```

테스트 픽스처 `ownerSub`는 `test-owner-aaa`.

조회·수정·삭제는 항상 `ownerSub === 지금 로그인한 sub`.  
프론트에서 필터만 하고 끝나면 부족하다. DB 키를 `ownerSub`로 시작해 다른 칸 객체를 열지 않는다.

## 기기 이동 (2차, 기본 꺼짐)

학교 PC와 집 PC를 같이 쓰려면 **교사 본인 구글 드라이브 앱 데이터 폴더**만 검토한다.

- 범위: `https://www.googleapis.com/auth/drive.appdata` (앱이 만든 파일만)
- 파일은 AES-GCM 암호문. 열쇠는 교사 암호에서 Web Crypto로 유도. 암호는 저장하지 않음
- 평문 JSON을 Drive·GitHub·이슈에 올리지 않음
- 동기화는 교사가 켠 뒤에만

이 2차는 별 이슈다. 1차 로그인 PR에 넣지 않는다.

## 구현 메모

- 웹: Google Cloud OAuth 클라이언트(웹). Client ID만. Secret 없음
- 확장: 별도 Chrome 확장 클라이언트 + `chrome.identity.getAuthToken` 또는 `launchWebAuthFlow`
- 승인된 origin / 확장 ID만 콘솔에 등록
- 테스트 계정만 쓰는 동안 OAuth consent는 External + Testing
- `.env.example`에 `VITE_GOOGLE_CLIENT_ID=` 이름만. 값은 `.env` (gitignore)

## 가온 체크 (로그인 PR)

- [ ] 출결 원문이 우리 서버·Firestore·Analytics로 나가지 않는다
- [ ] 계정마다 IndexedDB 칸이 갈린다. 로그아웃 후 다른 계정으로 이전 학급이 안 보인다
- [ ] 범위가 openid email profile 뿐
- [ ] Secret·refresh token이 저장소에 없다
- [ ] 토큰이 localStorage에 없다
- [ ] 픽스처는 가짜 `ownerSub` + 학생01
