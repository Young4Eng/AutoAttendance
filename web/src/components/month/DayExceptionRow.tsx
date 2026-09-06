import type { AttendanceRecord, AttendanceType, Category } from "../../types/models";
import { CATEGORY_LABELS, TYPE_LABELS } from "../../lib/labels";
import { REASON_PRESETS, reasonParts, toggleReason } from "../../lib/reasonPresets";
import { typeChipClass } from "./chipStyles";
import { displayName, padNum } from "./displayName";

const CATS: Category[] = ["illness", "unexcused", "other", "recognized"];
const TYPES: AttendanceType[] = ["absence", "late", "early_leave", "result"];

type Props = {
  row: AttendanceRecord;
  focused: boolean;
  onFocus: () => void;
  onSave: (next: AttendanceRecord, previous?: AttendanceRecord) => void;
  onDelete: () => void;
  onEndDate: (row: AttendanceRecord, end: string) => void;
  onCollapse: () => void;
};

export function DayExceptionRow({ row, focused, onFocus, onSave, onDelete, onEndDate, onCollapse }: Props) {
  const otherBad = row.category === "other" && !row.reason.trim();
  const reasons = REASON_PRESETS[row.category];
  const catLabel = row.category === "recognized" ? "인정" : CATEGORY_LABELS[row.category];
  const summary = [
    TYPE_LABELS[row.type],
    catLabel,
    row.type !== "absence" && row.period ? `${row.period}교시` : "",
    row.reason,
  ].filter(Boolean).join(" · ");

  if (!focused) {
    return (
      <button
        type="button"
        className="w-full text-left py-2.5 px-2 rounded-lg hover:bg-surface-container-low/60 flex items-center gap-2"
        onClick={onFocus}
      >
        <span className="w-16 shrink-0 text-sm font-semibold">
          {padNum(row.number)} {displayName(row.number, row.name)}
        </span>
        <span className={"px-1.5 py-0.5 rounded text-[11px] font-bold border " + typeChipClass(row.type)}>
          {TYPE_LABELS[row.type]}
        </span>
        <span className="text-sm text-on-surface-variant truncate">{summary.replace(TYPE_LABELS[row.type] + " · ", "")}</span>
      </button>
    );
  }

  return (
    <div className="py-3 px-2 rounded-lg bg-surface-container-low flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="text-base font-semibold text-on-surface truncate">
          {padNum(row.number)} {displayName(row.number, row.name)}
        </div>
        <button
          type="button"
          title="입력 완료"
          className="ml-auto w-9 h-9 rounded-lg flex items-center justify-center bg-primary-container text-on-primary"
          onClick={(e) => {
            e.stopPropagation();
            onCollapse();
          }}
        >
          <span className="material-symbols-outlined text-[20px]">check</span>
        </button>
        <button
          type="button"
          title="삭제"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-error"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            className={
              "py-2 rounded-lg text-sm font-semibold border " +
              (row.type === t
                ? typeChipClass(t) + " ring-1 ring-primary"
                : "bg-white border-[#E4E4E7] text-on-surface-variant")
            }
            onClick={(e) => {
              e.stopPropagation();
              const period = t === "absence" ? 0 : row.period || 1;
              onSave({ ...row, type: t, period }, row);
            }}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {CATS.map((cat) => (
          <button
            key={cat}
            type="button"
            className={
              "py-2 rounded-lg text-sm border " +
              (row.category === cat
                ? "bg-white border-primary font-semibold ring-1 ring-primary"
                : "bg-white border-[#E4E4E7] text-on-surface-variant")
            }
            onClick={(e) => {
              e.stopPropagation();
              onSave({ ...row, category: cat });
            }}
          >
            {cat === "recognized" ? "인정" : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {row.type !== "absence" ? (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm text-on-surface-variant shrink-0">교시</span>
          {[1, 2, 3, 4, 5, 6, 7].map((pr) => (
            <button
              key={pr}
              type="button"
              className={
                "w-9 h-9 rounded-lg text-sm font-semibold border " +
                (row.period === pr
                  ? "bg-primary-container text-on-primary border-primary"
                  : "bg-white border-[#E4E4E7]")
              }
              onClick={(e) => {
                e.stopPropagation();
                onSave({ ...row, period: pr }, row);
              }}
            >
              {pr}
            </button>
          ))}
        </div>
      ) : null}

      <input
        className={
          "w-full h-10 px-3 rounded-lg border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary " +
          (otherBad ? "border-[var(--error)]" : "border-[#E4E4E7]")
        }
        placeholder={otherBad ? "사유 입력 (필수)" : "구체적 사유"}
        key={row.reason}
        defaultValue={row.reason}
        onFocus={onFocus}
        onClick={(e) => e.stopPropagation()}
        onBlur={(e) => onSave({ ...row, reason: e.target.value })}
      />
      {reasons.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {reasons.map((r) => (
            <button
              key={r}
              type="button"
              className={
                "px-2.5 py-1.5 rounded-lg text-sm border " +
                (reasonParts(row.reason).includes(r)
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-white border-[#E4E4E7] text-on-surface-variant")
              }
              onClick={(e) => {
                e.stopPropagation();
                onSave({ ...row, reason: toggleReason(row.reason, r) });
              }}
            >
              {r}
            </button>
          ))}
        </div>
      ) : null}
      {otherBad ? <p className="text-sm text-[var(--error)] m-0">기타는 사유가 필요합니다</p> : null}

      <label className="flex items-center gap-2 text-sm text-on-surface-variant">
        <span className="shrink-0">종료일</span>
        <input
          type="date"
          className="h-10 px-2 rounded-lg border border-[#E4E4E7] text-sm bg-white"
          defaultValue={row.date}
          min={row.date}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            const end = e.target.value;
            if (end && end !== row.date) onEndDate(row, end);
          }}
        />
        <span className="text-xs text-outline">비우면 이날만</span>
      </label>
    </div>
  );
}
