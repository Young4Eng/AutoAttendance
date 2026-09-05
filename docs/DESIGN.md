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