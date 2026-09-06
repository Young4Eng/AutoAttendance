import type { AttendanceRecord, AttendanceType, Category } from "../../types/models";
import { CATEGORY_LABELS, TYPE_LABELS } from "../../lib/labels";
import { typeChipClass } from "./chipStyles";
import { displayName, padNum } from "./displayName";
import { REASON_PRESETS } from "../../lib/reasonPresets";

const CATS = Object.keys(CATEGORY_LABELS) as Category[];

type Props = {
  row: AttendanceRecord;
  focused: boolean;
  onFocus: () => void;
  onSave: (next: AttendanceRecord, previous?: AttendanceRecord) => void;
  onDelete: () => void;
};

/** Dense one-line exception row (day-panel.html) — #55: P hidden for absence. */
export function DayExceptionRow({ row, focused, onFocus, onSave, onDelete }: Props) {
  const otherBad = row.category === "other" && !row.reason.trim();
  return (
    <div
      className={
        "py-1.5 px-1 rounded-md transition-colors flex items-center gap-1.5 flex-wrap " +
        (focused ? "bg-surface-container-low/80" : "hover:bg-surface-container-low/60")
      }
      onClick={onFocus}
    >
      <div className="w-16 shrink-0 text-sm font-semibold text-on-surface truncate tnum">
        {padNum(row.number)} {displayName(row.number, row.name)}
      </div>
      <span
        className={
          "px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 border " + typeChipClass(row.type)
        }
      >
        {TYPE_LABELS[row.type]}
      </span>
      <div className="inline-flex rounded border border-[#E4E4E7] p-0.5 bg-surface-container-low shrink-0 text-[10px]">
        {CATS.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSave({ ...row, category: cat });
            }}
            className={
              row.category === cat
                ? "px-1.5 py-0.5 rounded bg-surface-container-lowest font-bold shadow-xs " +
                  (cat === "illness"
                    ? "text-primary"
                    : cat === "unexcused"
                      ? "text-[#E11D48]"
                      : cat === "other"
                        ? "text-[#7C3AED]"
                        : "text-[#0D9488]")
                : "px-1.5 py-0.5 rounded text-on-surface-variant hover:text-on-surface"
            }
          >
            {cat === "recognized" ? "인정" : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>
      {row.type !== "absence" ? (
        <select
          className="px-1 py-1 rounded border border-[#E4E4E7] bg-surface-container-lowest text-[10px] font-semibold text-primary outline-none shrink-0"
          title="기준 교시"
          value={row.period || 1}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onSave({ ...row, period: Number(e.target.value) }, row)}
        >
          {[1, 2, 3, 4, 5, 6, 7].map((pr) => (
            <option key={pr} value={pr}>
              {pr}교시
            </option>
          ))}
        </select>
      ) : null}
      <div className="flex-1 min-w-[6rem]">
        <input
          className={
            "w-full px-2 py-1 rounded border bg-surface-container-lowest text-on-surface text-[11px] outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary " +
            (otherBad ? "border-[var(--error)]" : "border-[#E4E4E7]")
          }
          placeholder={otherBad ? "사유 입력 (필수)" : "사유 입력"}
          defaultValue={row.reason}
          onFocus={onFocus}
          onClick={(e) => e.stopPropagation()}
          onBlur={(e) => onSave({ ...row, reason: e.target.value })}
        />
      </div>
      <button
        type="button"
        title="삭제"
        className="w-5 h-5 rounded flex items-center justify-center text-outline hover:text-error transition-colors shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <span className="material-symbols-outlined text-[14px]">close</span>
      </button>
      {otherBad ? (
        <p className="w-full text-[11px] text-[var(--error)] m-0 pl-1">기타는 사유가 필요합니다</p>
      ) : null}
      {REASON_PRESETS[row.category].length > 0 ? (
        <div className="w-full flex flex-wrap gap-1 pl-[4.25rem] pt-0.5">
          {REASON_PRESETS[row.category].map((r) => (
            <button
              key={r}
              type="button"
              className={
                "px-1.5 py-0.5 rounded text-[10px] border " +
                (row.reason === r
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-surface-container border-[#E4E4E7] text-on-surface-variant")
              }
              onClick={(e) => {
                e.stopPropagation();
                onSave({ ...row, reason: r });
              }}
            >
              {r}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export type AddType = AttendanceType;
