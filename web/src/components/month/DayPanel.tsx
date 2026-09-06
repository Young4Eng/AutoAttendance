import type { AttendanceRecord, AttendanceType, Category, Student } from "../../types/models";
import { REASON_PRESETS } from "../../lib/reasonPresets";
import { DayExceptionRow } from "./DayExceptionRow";

const TYPE_BTNS = [
  ["absence", "+ 결석", "person_add", "#B45309"],
  ["late", "+ 지각", "schedule", "#BE123C"],
  ["early_leave", "+ 조퇴", "logout", "#5B21B6"],
  ["result", "+ 결과", "hourglass_bottom", "#0F766E"],
] as const;

type Props = {
  open: string;
  weekdayKo: string;
  isToday: boolean;
  dayRows: AttendanceRecord[];
  rosterCount: number;
  pending: AttendanceType | null;
  bulk: boolean;
  picked: number[];
  q: string;
  hits: Student[];
  focusKey: string | null;
  onClose: () => void;
  onPending: (t: AttendanceType | null) => void;
  onBulk: (v: boolean) => void;
  onQ: (v: string) => void;
  onTogglePick: (n: number) => void;
  onConfirmPicks: () => void;
  onAddOne: (s: Student, t: AttendanceType) => void;
  onApplyReason: (text: string) => void;
  onFocusKey: (k: string | null) => void;
  onSave: (next: AttendanceRecord, previous?: AttendanceRecord) => void;
  onDelete: (r: AttendanceRecord) => void;
  onNavRepeat: () => void;
};

/** Right column day panel — dense list with max-h scroll (day-panel.html). */
export function DayPanel({
  open,
  weekdayKo,
  isToday,
  dayRows,
  rosterCount,
  pending,
  bulk,
  picked,
  q,
  hits,
  focusKey,
  onClose,
  onPending,
  onBulk,
  onQ,
  onTogglePick,
  onConfirmPicks,
  onAddOne,
  onApplyReason,
  onFocusKey,
  onSave,
  onDelete,
  onNavRepeat,
}: Props) {
  const abs = dayRows.filter((r) => r.type === "absence").length;
  const late = dayRows.filter((r) => r.type === "late").length;
  const early = dayRows.filter((r) => r.type === "early_leave").length;
  const result = dayRows.filter((r) => r.type === "result").length;
  const present = Math.max(0, rosterCount - new Set(dayRows.map((r) => r.number)).size);
  const focused = dayRows.find((r) => `${r.number}-${r.type}-${r.period}` === focusKey) || dayRows[0];
  const cat: Category = focused?.category ?? "illness";
  const reasons = REASON_PRESETS[cat];

  const md = open.slice(5, 7);
  const dd = open.slice(8, 10);
  const title = `${Number(md)}월 ${Number(dd)}일 (${weekdayKo})`;

  // Empty counts stay gaps (omit zero).
  const bits: { label: string; className: string; count: number }[] = [
    { label: "결석", className: "text-[#B45309]", count: abs },
    { label: "지각", className: "text-[#BE123C]", count: late },
    { label: "조퇴", className: "text-[#5B21B6]", count: early },
    { label: "결과", className: "text-[#0F766E]", count: result },
  ].filter((b) => b.count > 0);

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-md border border-[#E4E4E7] flex flex-col overflow-hidden h-full min-h-[520px]">
      <div className="px-4 py-3 bg-surface-container-low border-b border-[#E4E4E7] flex items-center justify-between">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-on-surface m-0 truncate">{title}</h2>
            {isToday ? (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                오늘
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mt-0.5 flex-wrap">
            <span className="font-semibold text-on-surface">
              {dayRows.length ? `예외 학생 ${dayRows.length}명` : "이날 예외 없음"}
            </span>
            {bits.map((b) => (
              <span key={b.label} className="inline-flex items-center gap-1">
                <span className="text-outline">·</span>
                <span className={b.className}>
                  {b.label} {b.count}
                </span>
              </span>
            ))}
            {rosterCount > 0 ? (
              <span className="inline-flex items-center gap-1">
                <span className="text-outline">·</span>
                <span className="text-outline-variant">정상 출석 {present}명</span>
              </span>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          title="닫기"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors shrink-0"
          onClick={onClose}
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <div className="p-3 bg-surface-container-low/40 border-b border-[#E4E4E7] flex flex-col gap-2">
        <div className="grid grid-cols-4 gap-1.5">
          {TYPE_BTNS.map(([k, lab, ic, col]) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                onPending(k);
                onBulk(false);
              }}
              className={
                "flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-surface-container-lowest border text-on-surface text-xs transition-colors shadow-xs " +
                (pending === k && !bulk
                  ? "border-primary ring-1 ring-primary"
                  : "border-[#E4E4E7] hover:border-primary/50")
              }
            >
              <span className="material-symbols-outlined text-[14px]" style={{ color: col }}>
                {ic}
              </span>
              <span>{lab}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-on-surface-variant overflow-x-auto">
          <span className="shrink-0 font-medium">자주 쓰는 사유:</span>
          {reasons.length === 0 ? (
            <span className="text-outline">기타는 직접 입력</span>
          ) : (
            reasons.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onApplyReason(r)}
                className="px-1.5 py-0.5 rounded bg-surface-container hover:bg-surface-container-high border border-[#E4E4E7] transition-colors whitespace-nowrap"
              >
                {r}
              </button>
            ))
          )}
        </div>
        <div className="mt-1 p-2 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between gap-2">
          <div className="flex items-start gap-1.5 min-w-0">
            <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">
              tips_and_updates
            </span>
            <p className="text-[11px] text-on-surface-variant leading-tight truncate m-0">
              <span className="font-medium text-on-surface">일괄 입력 팁:</span> 동일 사유·연속
              결석은 일괄 등록을 활용하세요.
            </p>
          </div>
          <button
            type="button"
            onClick={onNavRepeat}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary-container hover:bg-primary text-on-primary text-[11px] font-semibold transition-all shrink-0 shadow-xs whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[13px] shrink-0">event_repeat</span>
            <span>동일 결석 사유 일괄 입력 ↗</span>
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            onBulk(true);
            onPending(pending || "absence");
          }}
          className={
            "w-full flex items-center justify-center gap-1 py-1.5 rounded-lg border text-sm " +
            (bulk ? "border-primary ring-1 ring-primary" : "border-[#E4E4E7]")
          }
        >
          <span className="material-symbols-outlined text-[15px]">playlist_add_check</span>+ 다수
          일괄 등록
        </button>
      </div>

      {pending ? (
        <div className="px-3 py-2 border-b border-[#E4E4E7] flex flex-col gap-1.5">
          <input
            className="h-9 rounded-lg border border-[#E4E4E7] px-3 text-sm"
            value={q}
            onChange={(e) => onQ(e.target.value)}
            placeholder="번호 또는 이름 일부"
          />
          <div className="grid grid-cols-2 gap-1 max-h-28 overflow-y-auto pr-0.5">
            {hits.length === 0 ? (
              <p className="col-span-2 text-xs text-on-surface-variant m-0">명단에서 CSV를 먼저 가져오세요.</p>
            ) : null}
            {hits.map((s) => (
              <button
                key={s.number}
                type="button"
                className={
                  "text-left px-2 py-1 rounded-md text-[12px] leading-tight border transition-colors " +
                  (picked.includes(s.number)
                    ? "bg-teal-50 border-teal-200 text-teal-900"
                    : "bg-white border-[#E4E4E7] hover:border-teal-300 hover:bg-teal-50/40")
                }
                onClick={() => {
                  if (bulk) onTogglePick(s.number);
                  else if (pending) void onAddOne(s, pending);
                }}
              >
                <span className="font-semibold">{String(s.number).padStart(2,"0")}</span>
                <span className="ml-1 truncate">{s.name || `학생${String(s.number).padStart(2, "0")}`}</span>
              </button>
            ))}
          </div>
          {bulk ? (
            <button
              type="button"
              className="rounded-lg border border-[#E4E4E7] py-1.5 text-sm"
              onClick={() => void onConfirmPicks()}
            >
              {picked.length}명 등록
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="max-h-[440px] overflow-y-auto divide-y divide-[#E4E4E7]/70 px-3 py-1 bg-surface-container-lowest flex-1">
        {dayRows.length === 0 && !pending ? (
          <p className="text-sm text-on-surface-variant bg-[#F0FDFA] border border-[#99F6E4] rounded-xl px-3 py-2 my-2">
            오늘 예외 없음 · 전원 출석. +결석 등으로 예외만 추가하세요.
          </p>
        ) : null}
        {dayRows.map((c) => {
          const key = `${c.number}-${c.type}-${c.period}`;
          return (
            <DayExceptionRow
              key={key}
              row={c}
              focused={focusKey === key}
              onFocus={() => onFocusKey(key)}
              onSave={(next, prev) => onSave(next, prev)}
              onDelete={() => onDelete(c)}
            />
          );
        })}
      </div>

      <div className="mt-auto flex items-center justify-between text-xs text-on-surface-variant px-4 py-3 border-t border-[#E4E4E7]">
        <span>계정에 저장됨</span>
        <button
          type="button"
          className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary text-sm font-semibold"
          onClick={onClose}
        >
          완료
        </button>
      </div>
    </div>
  );
}
