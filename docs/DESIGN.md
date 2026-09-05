---
name: Editorial Utility
colors:
  surface: '#fbf8fc'
  surface-dim: '#dcd9dd'
  surface-bright: '#fbf8fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f2f7'
  surface-container: '#f0edf1'
  surface-container-high: '#eae7eb'
  surface-container-highest: '#e4e1e6'
  on-surface: '#1b1b1e'
  on-surface-variant: '#3e4947'
  inverse-surface: '#303033'
  inverse-on-surface: '#f3f0f4'
  outline: '#6e7977'
  outline-variant: '#bdc9c6'
  surface-tint: '#006a63'
  primary: '#005c55'
  on-primary: '#ffffff'
  primary-container: '#0f766e'
  on-primary-container: '#a3faef'
  inverse-primary: '#80d5cb'
  secondary: '#ba0035'
  on-secondary: '#ffffff'
  secondary-container: '#e21e49'
  on-secondary-container: '#fffbff'
  tertiary: '#7f4025'
  on-tertiary: '#ffffff'
  tertiary-container: '#9c573a'
  on-tertiary-container: '#ffe5db'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9cf2e8'
  primary-fixed-dim: '#80d5cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#00504a'
  secondary-fixed: '#ffdada'
  secondary-fixed-dim: '#ffb3b6'
  on-secondary-fixed: '#40000c'
  on-secondary-fixed-variant: '#920028'
  tertiary-fixed: '#ffdbce'
  tertiary-fixed-dim: '#ffb598'
  on-tertiary-fixed: '#370e00'
  on-tertiary-fixed-variant: '#72361b'
  background: '#fbf8fc'
  on-background: '#1b1b1e'
  surface-variant: '#e4e1e6'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Hanken Grotesk
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  body-code:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  gutter: 1.25rem
  sidebar-width: 16rem
  max-content-width: 78rem
---

## Brand & Style

This design system is tailored for secondary school homeroom educators managing complex daily attendance workflows. The design moves deliberately away from traditional, cluttered educational administrative software (e.g., bureaucratic table spreadsheets, outdated institutional blue headers, and juvenile illustrations). Instead, it adopts the focused clarity of Linear, the warmth of Notion, and the administrative rigor of Stripe.

The personality balances calm assurance with surgical efficiency:
- **Calm & Warm Neutrality:** Soft cream canvas backgrounds soften daily visual fatigue while maintaining an unmistakably modern, structured demeanor.
- **Instrumental Focus:** High typographic contrast and precise tabular alignment elevate attendance documentation into an intentional, focused micro-routine.
- **Dignified Professionalism:** Interactions feel tactile, quiet, and decisive. Actions that alter official institutional state are treated with clear hierarchy and deliberate chromatic commitment.

## Colors

The palette establishes a warm, distraction-free environment anchored by deep mineral ink tones and selective chromatic signals.

### Canvas & Surface Hierarchy
- **Canvas Base:** `#FBFBFA` (warm off-white foundation that eliminates cold monitor glare).
- **Surface Elevation (Cards, Panels):** `#FFFFFF` with whisper-quiet borders (`#E4E4E7`).
- **Surface Muted / Inset:** `#F4F4F5` (used for table headers, segment controls, and input backings).

### Primary Accents (Ink Teal)
- **Default:** `#0F766E` (primary interactive targets, selected rows, focused states).
- **Hover:** `#115E59`
- **Active / Pressed:** `#134E4A`
- **Subtle Surface Tint:** `#F0FDFA` (active cell selection, selected attendance chips).

### High-Impact Trigger (Crimson Coral)
- **Primary:** `#E11D48`
- **Hover:** `#BE123C`
- **Surface Tint:** `#FFF1F2`
- **Usage Rule:** Reserved strictly for high-consequence sync operations ("Send to Extension / Export to NEIS") to prevent accidental submission while serving as an unambiguous final action.

### Status Tints (Muted Badges & Chips)
- **Recognized Absence / Attendance (인정):** Slate Teal (`#0F766E` text, `#CCFBF1` background, `#99F6E4` border).
- **Illness (질병):** Amber Ocher (`#B45309` text, `#FEF3C7` background, `#FDE68A` border).
- **Unapproved / Truancy (미인정):** Coral Rose (`#BE123C` text, `#FFE4E6` background, `#FECDD3` border).
- **Other / Official (기타):** Muted Violet Slate (`#5B21B6` text, `#EDE9FE` background, `#DDD6FE` border).

### Typography & Structure
- **Text Primary:** `#18181B` (Zinc-900, near-black for razor-sharp legibility).
- **Text Secondary:** `#71717A` (Zinc-500, metadata, timestamps, roll numbers).
- **Text Placeholder / Disabled:** `#A1A1AA` (Zinc-400).
- **Structural Border:** `#E4E4E7` (Zinc-200, clean 1px delineations).

## Typography

The type system prioritizes high-density tabular clarity alongside relaxed editorial readability. While standard Latin strings render via **Hanken Grotesk**, systematic fallbacks should target clean neo-grotesque Korean equivalents (e.g., Pretendard) through CSS font stacks: `font-family: "Hanken Grotesk", "Pretendard", -apple-system, sans-serif`.

### Guidelines
- **Tabular Figures:** Always apply `font-feature-settings: "tnum" 1` to class roll numbers, attendance tallies, dates, and student identifiers to ensure strictly aligned tabular layouts.
- **Rhythmic Densities:** Data grid cells utilize `body-md` (13px) for names and notes, paired with `label-md` for categorical badges. Screen titles leverage `headline-md` (24px) with subtle negative tracking (`-0.015em`) to evoke executive polish.
- **Visual Restraint:** Avoid ultra-heavy weights (700+) except on critical alert badges. The default strong weight is capped at 600 (SemiBold).

## Layout & Spacing

The layout is built around a disciplined desktop-first productivity canvas composed of two primary structures: a fixed utility navigation bar/sidebar and a flexible central workspace.

### Grid & Ergonomics
- **Structure:** Left sidebar (256px / `16rem`) locked in position; main content zone auto-stretches up to a max-width of `1248px` (`78rem`), centered with `2rem` outer padding on standard viewports.
- **Attendance Roster Grid:** Rows maintain an exact vertical pitch of 48px to preserve spatial muscle memory during repetitive keyboard-guided roll checks.
- **Vertical Spacing:** Generous whitespace (`2rem` to `3rem`) surrounds major thematic sections (e.g., Class Summary Cards versus Daily Attendance Matrix), preventing dense tabular data from feeling suffocating.
- **Micro Spacing:** Internal controls and form elements rely strictly on the 4px base scale: 4px (`space-2xs`), 8px (`space-xs`), 12px (`space-sm`), and 16px (`space-md`).

## Elevation & Depth

This design system deliberately minimizes simulated real-world physics. Visual hierarchy relies on **crisp 1px borders and layered tonal surfaces** rather than dramatic multi-directional drop shadows.

### Elevation Levels
- **Level 0 (Canvas):** `#FBFBFA` background; flat base.
- **Level 1 (Cards & Data Panels):** `#FFFFFF` background bound by a crisp 1px solid border (`#E4E4E7`). No shadow, or a minimal ambient blur: `0 1px 2px 0 rgba(24, 24, 27, 0.04)`.
- **Level 2 (Interactive Floating / Dropdowns / Datepickers):** `#FFFFFF` surface with border `#E4E4E7` and low-opacity diffused drop: `0 8px 24px -4px rgba(24, 24, 27, 0.08), 0 2px 6px -1px rgba(24, 24, 27, 0.04)`.
- **Level 3 (Modal Dialogs / Confirmation Sheets):** `#FFFFFF` surface with explicit scrim backdrop (`rgba(24, 24, 27, 0.35)` with `backdrop-filter: blur(4px)`) and soft deep shadow: `0 20px 32px -8px rgba(24, 24, 27, 0.12)`.

## Shapes

The design system maintains a balanced geometry characterized by refined 12px to 16px radii. This creates an inviting tactile quality that avoids the sterile rigidity of sharp institutional grids and the casual softness of consumer toy interfaces.

### Standard Allocations
- **Primary Content Panels & Data Containers:** `16px` (`rounded-xl`).
- **Interactive Controls (Buttons, Inputs, Row Hover Backings):** `10px` to `12px` (`rounded-lg`).
- **Pills, State Chips, and Status Indicators:** Fully rounded capsule format (`9999px`) for instant parsing against rectangular inputs.
- **Inner Nested Elements:** Always offset radii so that inner corners follow `outer_radius - padding` to preserve optical harmony.

## Components

### Buttons
- **Primary Action (Ink Teal):** Solid `#0F766E`, white text, 12px border radius, 36px height, font-weight 500. Hover: `#115E59`. Focus ring: 2px `#0F766E` offset by 2px white space.
- **Export / Extension Trigger (Coral Red):** Solid `#E11D48`, white text, 36px height. Reserved solely for sending drafts to external systems. Hover: `#BE123C`.
- **Secondary / Ghost:** Transparent background, 1px border `#E4E4E7`, `#18181B` text. Hover: `#F4F4F5`.

### Attendance Status Chips
- Pill geometry (`border-radius: 9999px`), 24px height, horizontal padding 10px.
- **Illness (질병):** Background `#FEF3C7`, text `#B45309`, border 1px solid `#FDE68A`.
- **Unapproved (미인정):** Background `#FFE4E6`, text `#BE123C`, border 1px solid `#FECDD3`.
- **Approved / Official (출석인정):** Background `#CCFBF1`, text `#0F766E`, border 1px solid `#99F6E4`.
- **Other (기타):** Background `#EDE9FE`, text `#5B21B6`, border 1px solid `#DDD6FE`.

### Roster Matrix & Data Table
- Outer container wrapped in a 16px rounded `#FFFFFF` card with `#E4E4E7` border.
- **Row Heights:** 48px fixed height with seamless border-bottom (`#F4F4F5`).
- **Row Hover:** Transitions subtly to `#FAFAFA` with zero jitter.
- **Focused / Multi-Selected Rows:** Background shifts to `#F0FDFA` with an inner left accent indicator (3px solid `#0F766E`).

### Input Fields & Selects
- Height 36px, background `#FFFFFF`, border 1px solid `#E4E4E7`, radius 10px, typography `body-md`.
- Focus state switches border to `#0F766E` with an ambient glow of `box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12)`.
- Numeric roll calls and student codes use monospaced figures.

### Quick Attendance Toggle Group
- Segmented pill container (`#F4F4F5` background, 6px padding) with sliding `#FFFFFF` active state thumb, allowing teachers to mark an entire row with a single keystroke or click without opening modal dialogues.

---

## 구현 시 시안 대비 수정

스티치 화면(`9_1` 히트맵, `9_3_2` 하루 패널, `_5` 로그인, `_2` 장기·반복, `_3`/`100` 미리보기, `_4` 명단, `_8` 사용 방법, `q_a`)을 **레이아웃 기준으로 쓴다.** 시안을 다시 뽑지 않아도 된다. 아래는 구현·카피에서만 고친다. 목업 가명은 유지해도 된다.

### 공통 카피

| 시안 | 구현 |
| --- | --- |
| 칩 「이 PC에만 저장」 | 「구글 계정에 저장」 |
| 「출결 원문은 이 브라우저에만 남습니다」 | 짧은 안내 |
| 「외부 서버에 학생 정보가 저장되지 않습니다」 | 삭제 |
| 「임시 저장됨 (이 PC)」 / 「크롬 로컬」 | 「계정에 저장됨」 |
| 「이 PC 기록 삭제」 | 「계정 초안 삭제」 |
| 주 시작이 일요일인 달력 | 월요일 시작 |
| 연도 2025만 박힌 화면 | 실제 학년도. 예시는 2026년 9월 |

짧은 안내 (로그인 카드, 이번 달·미리보기 상단 배너):

```
출결 초안(번호·성명·사유)은 출결메이트 계정 DB에 저장됩니다.
브라우저 캐시를 지워도 남고, 같은 구글 계정이면 다른 PC에서도 이어서 볼 수 있습니다.
나이스에 이미 저장한 출결은 나이스에 있습니다. 이 DB는 초안입니다.
자세히 → 사용 방법 · 개인정보 안내
```

로그인 확인 버튼: `위 안내를 읽었고, 이 학급 출결 초안을 계정에 저장하는 데 동의합니다.`

삭제 버튼 위: `이 계정으로 저장된 명단·출결 초안이 DB에서 삭제됩니다. 나이스에 넣은 값은 지워지지 않습니다.`

한글 본문은 Pretendard. 시안 영문 폰트(Hanken)는 라틴 폴백.

사이드바 순서 유지: 이번 달 / 미리보기 / 명단 / 장기·반복 / 사용 방법 / 질문(또는 패치 노트 및 Q&A). **개인정보 메뉴를 새로 만들지 않는다.** 전문은 사용 방법 섹션. 원문 `docs/privacy.md`.

하단: 확장 연결됨/안 됨 + 버전, 구글 이름·이메일·로그아웃, 계정 초안 삭제.

출결마감 버튼 없음. 빨간 버튼은 미리보기의 「확장으로 보내기」만.

### 로그인 (`_5`)

- 구글 버튼만. 게스트 없음. 나이스 비번·인증서 입력란 없음.
- 카드 안 파란 안내 박스를 짧은 안내로 교체. 「외부 서버에 저장되지 않습니다」 삭제.
- 확인을 누르기 전에는 명단·출결 화면으로 들어가지 않음.

### 이번 달 (`9_1`)

- 큰 월 달력. 월~금만 활성. 토·일 회색.
- 칸 본체는 날짜 + **예외 n명 배지**. 색은 인원이 많을수록 진한 틸.
- 칸 안에 이름 나열은 2~3명까지 optional. 그 이상은 배지만. 이름은 패널.
- 공휴일(추석 등)은 주말과 같이 비활성으로 둬도 됨. 1차는 주말만 강제.
- 칸 클릭 1회 → 오른쪽 하루 패널. 같은 날을 학생마다 다시 누르지 않음.
- 위 요약 칩: 결석 n · 지각 n · 조퇴 n · 결과 n (출석 전원은 숫자 없음).

### 하루 패널 (`9_3_2`)

- 제목 `9월 3일 (수)`. 닫기 전까지 유지.
- 큰 버튼: `+ 결석` `+ 지각` `+ 조퇴` `+ 결과`. `+ 다수 일괄`이 있으면 같은 종류를 여러 명 고르는 진입으로만 사용. 사유는 일괄 복붙하지 않음.
- 학생 고르기: 번호 또는 이름 **일부 자동완성** + 체크. 명단에 있는 사람만.
- 카드 한 줄: 번호·이름 / 종류 표시 / 구분 4칩 / 사유.
- 구분 칩: `질병` `미인정` `기타` `출석인정`. 드롭다운 금지.
- 결석 카드: 기준 교시(P) 숨김.
- 지각·조퇴·결과: `1`~`7` 칸. 힌트 지각=조회~P, 조퇴=P~종례, 결과=P만.
- 기타 → 사유 필수, 빈 칸이면 완료 비활성.
- 자주 쓰는 사유 칩은 넣어도 됨. 눌러도 그 카드 사유만 채움.
- 패널 하단 완료 = 계정 DB 저장. 문구 「계정에 저장됨」.
- 출석한 학생은 패널에 안 그림.

### 장기·반복 (`_2`)

- 학생 1명 + `기간` 또는 `날짜 선택`.
- 주말 제외. 캡션 `주말 제외 · 평일 n일`.
- 구분 4칩, 종류 4칩, 결석이면 P 없음, 사유 하나.
- 적용 전 확인: `학생09 · 평일 9일 · 질병결석` 형태.

### 명단 (`_4`)

- 표 번호 | 성명 | 비고. 빈 번호(7 다음 9) 유지.
- CSV 가져오기 / 템플릿 / 행 추가.
- 번호·이름 입력 시 기존 명단 자동완성.
- CSV 올리기 직전 한 줄: 성명이 계정 DB에 저장됨.

### 미리보기 (`_3`, `100`)

- 날짜 섹션. 출석 행 없음. 주말 날짜 없음.
- 안내: 날짜가 바뀌기 전 나이스 저장은 확장이 합니다. 출결마감은 누르지 않습니다.
- 유일 위험 버튼: 「확장으로 보내기」 (`#E11D48`).
- 상태: 대기 / 적용됨(육안 확인 전) / 오류.

### 사용 방법 (`_8`) · Q&A

- 첫 섹션 **개인정보 안내** = `docs/privacy.md` 전문.
- 이어서 조작: 달력 하루 한 번, 결석은 교시 없음, 주말 제외, 확장 저장.
- Q&A는 그 다음. 개인정보를 Q&A 접은 항목 속에만 넣지 않음.

### 하지 않음

- 나이스 헤더·넥사크로 격자 복제
- 34명 빈 출석 표가 홈
- YYYYMMDD 타이핑이 날짜 입력의 본체
- 출결마감 자동화 UI
- 실명 GitHub 커밋 (시안 가명은 로컬 구현 목업으로만)
