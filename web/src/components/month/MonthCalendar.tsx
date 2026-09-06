import type { ReactNode } from "react";
import type { AttendanceRecord } from "../../types/models";
import { TYPE_LABELS } from "../../lib/labels";
import {
  GRID_COLS,
  categoryChipShell,
  categoryTextClass,
  typeCategoryLabel,
} from "./chipStyles";
import { displayName, padNum } from "./displayName";

const DOW = ["월", "화", "수", "목", "금", "토", "일"];

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function weekend(d: Date) {
  const n = d.getDay();
  return n === 0 || n === 6;
}

type Props = {
  cells: Date[];
  month: number;
  today: string;
  open: string | null;
  namesByDate: Record<string, AttendanceRecord[]>;
  compact?: boolean;
  onSelect: (key: string) => void;
};

/** Full (month) or compact (day-panel) calendar grid. */
export function MonthCalendar({
  cells,
  month,
  today,
  open,
  namesByDate,
  compact = false,
  onSelect,
}: Props) {
  return (
    <div
      className={
        compact
          ? "bg-surface-container-lowest rounded-xl p-3.5 shadow-sm border border-[#E4E4E7] flex flex-col"
          : "bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col border border-[#E4E4E7]"
      }
    >
      <div
        className={
          compact
            ? "grid gap-1.5 mb-2 text-center py-2 bg-surface-container-low rounded-lg text-sm text-on-surface-variant font-semibold select-none"
            : "grid bg-surface-container-low text-center select-none py-2"
        }
        style={{ gridTemplateColumns: GRID_COLS }}
      >
        {DOW.map((d) => (
          <div
            key={d}
            className={
              "text-sm font-semibold py-1 " +
              (d === "토"
                ? "text-primary-container font-medium"
                : d === "일"
                  ? "text-secondary font-medium"
                  : "text-on-surface")
            }
          >
            {d}
          </div>
        ))}
      </div>
      <div
        className={compact ? "grid gap-1.5" : "grid gap-[2px] bg-surface-container"}
        style={{ gridTemplateColumns: GRID_COLS }}
      >
        {cells.map((d) => {
          const key = ymd(d);
          const out = d.getMonth() !== month - 1;
          const wk = weekend(d);
          const list = namesByDate[key] || [];
          const n = list.length;
          const sel = open === key;
          const isToday = key === today;

          if (compact) {
            return (
              <CompactCell
                key={key + String(out)}
                day={d.getDate()}
                out={out}
                wk={wk}
                sel={sel}
                isToday={isToday}
                n={n}
                list={list}
                disabled={wk || out}
                onClick={() => {
                  if (!wk && !out) onSelect(key);
                }}
              />
            );
          }

          return (
            <FullCell
              key={key + String(out)}
              day={d.getDate()}
              out={out}
              wk={wk}
              sel={sel}
              isToday={isToday}
              n={n}
              list={list}
              disabled={wk || out}
              onClick={() => {
                if (!wk && !out) onSelect(key);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function FullCell({
  day,
  out,
  wk,
  sel,
  isToday,
  n,
  list,
  disabled,
  onClick,
}: {
  day: number;
  out: boolean;
  wk: boolean;
  sel: boolean;
  isToday: boolean;
  n: number;
  list: AttendanceRecord[];
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={
        "min-h-[136px] p-2 flex flex-col justify-between text-left transition-colors group " +
        (wk || out
          ? "bg-[#F4F4F5] text-outline cursor-default opacity-60 "
          : "bg-surface-container-lowest hover:bg-surface cursor-pointer ") +
        (out ? "opacity-40 " : "") +
        (sel
          ? "ring-2 ring-primary ring-inset relative bg-gradient-to-b from-primary/5 to-transparent shadow-sm "
          : "")
      }
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 min-w-0">
          <span
            className={
              "text-sm font-semibold " +
              (sel || isToday ? "text-primary font-bold" : "text-on-surface")
            }
          >
            {day}
          </span>
          {isToday && !wk && !out ? (
            <span className="px-1.5 rounded bg-primary text-on-primary text-[10px] font-semibold leading-tight">
              오늘
            </span>
          ) : null}
        </div>
        {!wk && !out ? (
          n > 0 ? (
            <span
              className={
                "inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium shrink-0 " +
                (sel
                  ? "bg-primary text-on-primary font-semibold shadow-sm"
                  : "bg-primary-fixed text-on-primary-fixed")
              }
            >
              예외 {n}명
            </span>
          ) : (
            <span className="text-[11px] text-outline opacity-70 group-hover:opacity-100 transition-opacity shrink-0">
              전원 출석
            </span>
          )
        ) : null}
      </div>
      {!wk && !out ? (
        n > 0 ? (
          <div className="flex flex-col gap-1 my-0.5 min-h-0">
            {list.slice(0, 3).map((r) => (
              <div
                key={`${r.number}-${r.type}-${r.period}`}
                className={
                  "flex items-center justify-between px-1.5 py-0.5 rounded border text-[11px] " +
                  categoryChipShell(r.category)
                }
              >
                <span className="text-on-surface font-medium truncate">
                  {padNum(r.number)} {displayName(r.number, r.name)}
                </span>
                <span
                  className={
                    "font-semibold text-[11px] shrink-0 ml-1 " +
                    categoryTextClass(r.category)
                  }
                >
                  {typeCategoryLabel(r.type, r.category)}
                </span>
              </div>
            ))}
            {n > 3 ? (
              <span className="text-[10px] text-outline pl-1">+{n - 3}명</span>
            ) : null}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-60 text-outline text-xs transition-opacity">
              기록 추가 +
            </span>
          </div>
        )
      ) : (
        <div className="h-2" />
      )}
    </button>
  );
}

function CompactCell({
  day,
  out,
  wk,
  sel,
  isToday,
  n,
  list,
  disabled,
  onClick,
}: {
  day: number;
  out: boolean;
  wk: boolean;
  sel: boolean;
  isToday: boolean;
  n: number;
  list: AttendanceRecord[];
  disabled: boolean;
  onClick: () => void;
}) {
  // Summary chip: prefer single-type label when uniform; else 예외 N명. Empty = gap.
  let summary: ReactNode = null;
  if (!wk && !out) {
    if (n === 0) {
      summary = (
        <span className="px-1.5 py-0.5 rounded bg-surface-container/70 text-[10px] font-medium text-on-surface-variant truncate">
          전원 출석
        </span>
      );
    } else if (sel) {
      summary = (
        <div className="px-1.5 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary text-[10px] font-semibold flex items-center justify-between truncate">
          <span className="truncate">예외 {n}명</span>
          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 ml-0.5" />
        </div>
      );
    } else {
      const types = new Set(list.map((r) => r.type));
      if (types.size === 1) {
        const t = list[0].type;
        const cat = list[0].category;
        summary = (
          <div
            className={
              "px-1.5 py-0.5 rounded border text-[10px] font-medium flex items-center justify-between truncate " +
              categoryChipShell(cat) +
              " " +
              categoryTextClass(cat)
            }
          >
            <span className="truncate">
              {TYPE_LABELS[t]} {n}명
            </span>
            <span className="text-[9px] font-bold shrink-0 ml-0.5">
              {cat === "illness"
                ? "질병"
                : cat === "unexcused"
                  ? "미인정"
                  : cat === "recognized"
                    ? "인정"
                    : "기타"}
            </span>
          </div>
        );
      } else {
        summary = (
          <div className="px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold truncate">
            예외 {n}명
          </div>
        );
      }
    }
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={
        "h-24 p-2 rounded-lg flex flex-col justify-between text-left transition-all border " +
        (wk || out
          ? "bg-surface/40 opacity-70 border-[#E4E4E7]/30 cursor-default "
          : "bg-surface-container-low/40 hover:bg-surface-container-low/80 border-[#E4E4E7]/70 cursor-pointer ") +
        (out ? "opacity-30 " : "") +
        (sel
          ? "bg-surface-container-lowest ring-2 ring-primary ring-offset-1 ring-offset-surface shadow-md border-primary/50 "
          : "")
      }
    >
      <div className="flex items-center justify-between gap-1">
        {sel && isToday ? (
          <div className="flex items-center gap-1 min-w-0">
            <span className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold shadow-xs shrink-0">
              {day}
            </span>
            <span className="text-[10px] text-primary font-bold truncate">오늘</span>
          </div>
        ) : (
          <span
            className={
              "text-sm font-semibold " +
              (wk ? "text-outline" : "text-on-surface")
            }
          >
            {day}
          </span>
        )}
        {sel ? <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" /> : null}
      </div>
      <div className="flex flex-col mt-auto min-h-[20px]">{summary}</div>
    </button>
  );
}
