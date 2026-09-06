# 프론트에 맞춰 백엔드가 해야 할 일

구현 전에 고정하는 설계. 화면은 이미 있다. 서버는 그 화면이 거짓말하지 않게만 받친다.

관련: #54 시안 입히기(표시), #55 장기 종류/구분/P(데이터 규칙).

---

## 1. 화면이 서버에게 바라는 것

| 화면 | 사용자가 하는 일 | 서버가 보장해야 하는 일 |
| --- | --- | --- |
| 로그인 | 구글 한 번 | 신원은 Auth. `owner_id = auth.uid()`. 역할은 클라 localStorage가 정하지 않음 |
| 명단 | CSV로 학급을 통째 교체, 번호+이름 검색 | 그 교사 학급만. 결번(7 다음 9) 유지. 행 순번으로 메우지 않음 |
| 이번 달 | 칸마다 예외 인원 배지 | `date`별 학생 수. 주말은 쓰기를 거절해도 됨 |
| 날짜 패널 | +결석/지각/조퇴/결과, 구분 칩, P, 사유, X 삭제 | 한 줄 upsert / 한 줄 delete. 결석은 P=0만 |
| 장기·반복 #55 | 학생 1명 + 기간 + 종류 + 구분 + (필요 시 P) | 주말 제외한 평일 N줄을 **같은 규칙**으로 insert. 종류와 구분을 바꿔 받지 않음 |
| 미리보기 | 초안 목록, 확장으로 보냄, 대기를 초안으로 | 목록·status 변경. 나이스 DOM은 서버 밖 |
| 사용방법·Q&A | 읽기 | DB 없음. privacy 문구는 정적 |

확장 매크로·나이스 저장 확인은 **백엔드가 아니다.** 브라우저 확장 영역이다.

---

## 2. 지금 있는 것 / 구멍

이미 있음

- Auth: Google → `signInWithIdToken`
- 테이블 `roster`, `entries`
- RLS: `owner_id = auth.uid()::text`
- 클라 `store.ts`가 브라우저 IDB + Supabase를 동시에 씀

구멍 (프론트가 기대한 만큼 서버가 안 막음)

- `type`/`category`/`period`/`status` CHECK 없음. 시안처럼 종류에 질병을 넣어도 DB가 받음 (#55)
- 결석에 `period=3`이 들어가도 DB가 받음
- 주말 `date`를 넣어도 DB가 받음
- `status`가 draft/queued/error 외에 무엇이든 됨
- 명단 교체가 `delete 전체 + insert`라 중간에 실패하면 학급이 빈다
- 달력·미리보기가 클라우드만 보면 방금 쓴 줄이 빠짐 (이미 merge로 우회). 서버가 단일 원본이 아님
- 장기 N일을 클라 for-loop로 insert. 한 건 실패해도 나머지는 남는 반쪽 기간
- 전송 성공/나이스 반영 여부를 서버가 모름 (`queued`만 있음)
- 동의 시각, 학급(학년·반) 메타, 인덱스, 감사 로그 없음

#54는 HTML·CSS다. 새 테이블이 필요 없다.

---

## 3. 데이터 모델 (프론트 필드와 1:1)

### 3.1 소유자

별도 `teachers` 테이블은 1차에 필수는 아니다. `auth.users`면 충분하다.

있으면 좋은 컬럼(나중): `display_name`, `agreed_at`, `grade`, `class`.  
학년·반을 명단 각 행에만 두면, 빈 명단일 때 화면에 “2학년 3반”을 서버가 모른다.

### 3.2 `roster` (지금 유지)

- PK: `(owner_id, grade, class, number)`
- `name` not null
- `number` 연속일 필요 없음
- 조회: `owner_id`만. 검색(번호 prefix·이름 contains)은 학급이 작아 클라 필터로 충분. 서버 ILIKE는 나중

교체 의미: “이 학급 스냅샷을 이 목록으로 교체”.  
백엔드 기능으로 있어야 할 것: **트랜잭션 한 번에 replace**. 지금처럼 클라 delete+insert는 기능이 아니라 사고 지점이다.

### 3.3 `entries` (초안 원본)

프론트 `AttendanceRecord`와 같게.

| 컬럼 | 규칙 |
| --- | --- |
| owner_id | `auth.uid()`만. 클라 값을 믿되 RLS가 최종 |
| date | `YYYY-MM-DD`. 주말이면 insert 거절(권장) |
| year | date의 연도. 학년도와 다를 수 있음. 1차는 달력 연도 |
| grade, class, number, name | 명단과 맞추는 게 이상적. 1차는 클라가 명단에서 복사. 서버는 number+name 공란 거절 |
| category | `illness` `unexcused` `other` `recognized` 만 |
| type | `absence` `late` `early_leave` `result` 만. **구분 네 개를 여기 넣으면 거절** (#55) |
| period | 결석이면 **반드시 0**. 그 외 **1..7** |
| reason | `other`이면 공백 거절. 그 외 빈 문자열 허용 |
| status | `draft` `queued` `error` 만(#58). 미리보기 “대기 취소” = queued→draft. 행 삭제 아님. **CHECK는 `synced`도 허용** — data-contract·확장이 이미 씀. 1차 미리보기 흐름은 draft/queued/error |

PK `(owner_id, date, grade, class, number, type, period)`

같은 날 같은 학생

- 결석 1줄 + 지각(3교시) 1줄은 허용(키가 다름)
- 결석을 두 줄 넣는 것은 PK가 막음
- 지각 교시만 바꾸면 키가 바뀌므로, 프론트가 예전 키 delete + 새 upsert를 한다. 서버는 “키 변경” API가 있으면 더 안전

### 3.4 넣지 말 것

- 나이스 비밀번호·인증서
- 확장 대기열 사본(세션 스토리지가 맞음)
- 학생 주민번호·연락처
- service_role

---

## 4. 서버가 제공해야 하는 기능 (API 단위)

PostgREST + RLS로 충분한 것과, DB 함수가 필요한 것을 나눈다.

### A. 인증

- Google ID 토큰 → 세션
- 이후 모든 요청 `auth.uid()`
- Site URL = Vercel 주소 (이미 운영 설정)

백엔드 코드로 새로 만들 일 없음. 설정이다.

### B. 명단

1. `listRoster` — 자기 행만, `number` 정렬  
2. `replaceRoster(rows[])` — **한 트랜잭션**. 실패 시 이전 명단 유지  
3. (선택) `upsertStudent` / `deleteStudent` — 시안 “학생 추가”가 살아나면

체크: grade/class/number 정수, name 비어 있지 않음, 같은 번호 두 명 거절.

### C. 출결 한 줄 (달력 패널)

1. `upsertEntry` — #55 규칙 서버에서 재검증. 클라 검증은 UX  
2. `deleteEntry` — 키로 한 줄. 남의 줄은 RLS  
3. `listEntries(from, to)` — 달력 월 조회. 지금은 전체 select라 학기 쌓이면 느려짐  
4. `listEntriesByDate(date)` — 패널·미리보기

체크 실패 시 에러 코드 고정: `bad_type` `bad_category` `absence_period_must_be_0` `bad_period` `reason_required` `weekend_not_allowed`

프론트 미리보기·확장이 이미 비슷한 코드를 쓴다. **서버도 같은 코드 문자열**을 쓰는 게 계약이다.

### D. 장기·반복 (#55의 본체)

화면: 학생 1 + 종류 4칩 + 구분 4칩 + (결석 아니면 P) + 기간.

서버 함수 하나면 프론트 for-loop를 없앨 수 있다.

`applyRepeat(student, type, category, period, reason, start, end) → { dates[], count }`

- 기간 안 평일만 (토일 제외). 공휴일은 1차 생략 가능  
- 각 날짜에 C의 같은 체크  
- 전부 성공 또는 전부 실패(트랜잭션)  
- 이미 있는 같은 키는 upsert (덮어쓰기). “이미 있음 스킵”은 나중 옵션

주말을 프론트만 빼면, 누군가 API를 직접 칠 때 토요일이 생긴다. 장기 기능의 진실은 서버에 있어야 한다.

### E. 미리보기·전송 상태

서버 책임

- draft 목록  
- `markQueued(keys[])`  
- `markDraft(keys[])` — “대기만 초안으로”. **delete all 금지**

서버 밖

- 크롬 확장으로 `attendance.queue` 보내기  
- 나이스 클릭·저장·확인  

`sent`/`applied` 상태는 확장이 성공 콜백을 줄 때만 의미 있다. 1차는 queued/draft면 충분하다. “지웠더니 달력이 빈다”는 markDraft가 delete가 되어서가 원인이다. 백엔드는 delete와 status 변경을 분리해야 한다.

### F. 달력 집계 (있으면 좋은 것)

`monthSummary(year, month) → [{ date, studentCount, types[] }]`

지금은 클라가 전 행을 받아 센다. 반 40명 × 수업일로는 버틴다. 정식으로 가면 이 뷰가 달력 배지와 일치한다. “예외 N명”은 줄 수가 아니라 **학생 수**. 같은 날 지각+조퇴면 1명이다. 서버 집계도 `count(distinct number)`여야 한다.

---

## 5. 규칙 엔진 (프론트와 공유할 단일 진실)

이 표가 백엔드 CHECK / RPC의 전부다.

```
종류 type     구분 category              P
absence       illness|unexcused|other|recognized   0 만
late          동일                                 1..7
early_leave   동일                                 1..7
result        동일                                 1..7

other ⇒ reason trim 필수
토·일 ⇒ 기본 거절
출석 행 ⇒ 저장하지 않음 (없음 = 출석)
```

시안 `stitch/repeat`의 “출결 종류 = 질병/미인정/…”은 **틀린 라벨**이다. 백엔드는 그 HTML을 따라가면 안 된다. #55가 진실이다.

빗금 칸(조회~종례)은 나이스가 종류+P로 채운다. DB에 `/` 칸을 저장할 필요 없다. 미리보기 힌트는 클라 `slashRange`면 된다.

---

## 6. 보안 (이미 말한 것과 프론트 맞춤)

- 인증: 서버(Auth). 브라우저 if로 비번 비교 없음  
- 인가: RLS 매 요청. `owner_id`를 URL로 바꿔도 빈 결과  
- 입력: 화이트리스트. 사유는 텍스트. SQL 문자열 접합 없음  
- 비밀: anon만 웹. service_role 없음  
- 동의: 로그인 체크는 UX. 증적이 필요하면 `agreed_at`만 Auth metadata 또는 작은 테이블  
- 스토리지 버킷 public 쓰지 않음 (파일 업로드 없음)  
- rate: 명단 replace·장기 apply에 요청 제한이면 충분  

나이스 해킹 경로로 쓰이면 안 되므로, 서버는 나이스에 접속하지 않는다.

---

## 7. IDB와 서버의 역할

지금은 둘 다 써서 달력/미리보기가 어긋났다.

목표

- **원본은 `entries` / `roster`**
- IDB는 오프라인 캐시이거나, 없앤다
- 쓰기는 서버 성공 후에만 화면에 반영. 실패면 에러

**#58 방향 (클라 `web/src/db/store.ts`):** Supabase가 단일 원본. IDB는 서버 성공 후 캐시·미설정 시 로컬 폴백만. 이중 원본 쓰기(선 IDB 후 클라우드)는 제거. `replace_roster` / `upsert_entry` / `apply_repeat` RPC 사용.

1차 마무리는 “서버 규칙 + 트랜잭션 replace/repeat”이면 된다. 동기화 엔진을 새로 만들지 않는다.

---

## 8. 구현 순서 (나중에 코드 칠 때)

1. CHECK + RPC `upsert_entry` / `apply_repeat` / `replace_roster` (규칙 고정)  
2. `list_entries(from,to)` 인덱스 `(owner_id, date)`  
3. 클라 `store.ts`가 IDB 우회 없이 이 RPC만 호출  
4. 미리보기 status만 바꾸는 RPC  
5. (선택) `month_summary`

#54 픽셀은 이 목록과 병렬. 백엔드 범위 밖이다.

---

## 9. 한 줄

프론트는 이미 “누구의, 어느 날, 어떤 종류·구분·P·사유”를 만든다.  
백엔드 마무리는 그 튜플을 **교사 본인만, #55 규칙으로, 주말 없이, 지울 때 달력을 비우지 않게** 저장하는 것이다.  
나이스에 칸을 채우는 기능은 백엔드에 넣지 않는다.
