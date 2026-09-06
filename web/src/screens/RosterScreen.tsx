import { useEffect, useMemo, useRef, useState } from "react";
import { decodeRosterCsvFile } from "../csv/decodeRoster";
import { formatRosterCsvError, parseRosterCsv, sampleRosterCsv } from "../csv/parseRoster";
import {
  deleteStudent,
  getSettings,
  listAttendance,
  listRoster,
  putSettings,
  replaceRoster,
  upsertStudent,
} from "../db/store";
import type { ClassSettings, EnrollStatus, Student } from "../types/models";
import { Shell, type AppScreen } from "./Shell";

type Props = {
  ownerSub: string;
  teacherLabel: string;
  screen: AppScreen;
  onNav: (s: AppScreen) => void;
  onLogout: () => void;
};

export function RosterScreen({ ownerSub, teacherLabel, screen, onNav, onLogout }: Props) {
  const [rows, setRows] = useState<Student[]>([]);
  const [settings, setSettings] = useState<ClassSettings>({ ownerSub, grade: 2, class: 3, capacity: 30 });
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState<"all" | "enrolled" | "transferred">("all");
  const [form, setForm] = useState<{ number: string; name: string; note: string; status: EnrollStatus } | null>(null);
  const [menu, setMenu] = useState<number | null>(null);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  async function reload() {
    const [st, att, set] = await Promise.all([listRoster(ownerSub), listAttendance(ownerSub), getSettings(ownerSub)]);
    setRows(st);
    setSettings(set);
    const c: Record<number, number> = {};
    for (const a of att) c[a.number] = (c[a.number] || 0) + 1;
    setCounts(c);
  }
  useEffect(() => {
    void reload().catch((e) => setMsg(String(e)));
  }, [ownerSub]);

  const enrolled = rows.filter((s) => s.status !== "transferred");
  const cap = Math.max(settings.capacity, ...rows.map((r) => r.number), 0);
  const missing = useMemo(() => {
    const have = new Set(rows.map((r) => r.number));
    const out: number[] = [];
    for (let n = 1; n <= cap; n++) if (!have.has(n)) out.push(n);
    return out;
  }, [rows, cap]);

  const shown = rows
    .filter((s) => (filter === "all" ? true : filter === "transferred" ? s.status === "transferred" : s.status !== "transferred"))
    .filter((s) => !q.trim() || String(s.number).startsWith(q.trim()) || s.name.includes(q.trim()));

  function downloadTemplate() {
    const blob = new Blob([sampleRosterCsv(settings.grade, settings.class)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "roster-sample.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function saveForm() {
    if (!form) return;
    const number = Number(form.number);
    if (!Number.isInteger(number) || number < 1) { setMsg("번호가 올바르지 않습니다"); return; }
    if (!form.name.trim()) { setMsg("성명을 입력하세요"); return; }
    await upsertStudent(ownerSub, {
      grade: settings.grade, class: settings.class, number,
      name: form.name.trim(), note: form.note, status: form.status,
    });
    setForm(null);
    setMsg("저장했습니다");
    await reload();
  }

  return (
    <Shell screen={screen} teacherLabel={teacherLabel} rosterCount={enrolled.length} onNav={onNav} onLogout={onLogout}>
      <main className="flex-1 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-semibold m-0">학급 명단 관리 ({settings.grade}학년 {settings.class}반)</h1>
            <p className="text-sm text-[#71717A] mt-1 mb-0">총 재적 {enrolled.length}명{missing.length ? ` · 결번 ${missing.length}건` : ""}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="px-3 py-2 rounded-xl border border-[#E4E4E7] text-sm" onClick={downloadTemplate}>CSV 양식 받기</button>
            <button type="button" className="px-3 py-2 rounded-xl border border-[#E4E4E7] text-sm" onClick={() => fileRef.current?.click()}>명단 일괄 등록</button>
            <button type="button" className="px-3 py-2 rounded-xl bg-[#0F766E] text-white text-sm" onClick={() => setForm({ number: String((enrolled.at(-1)?.number ?? 0) + 1), name: "", note: "", status: "enrolled" })}>학생 추가</button>
          </div>
        </div>
        <p className="text-xs text-[#71717A] mb-3 leading-relaxed">
          grade·class·number는 숫자만 / UTF-8 CSV / 실명 커밋 금지.
          엑셀은 「CSV UTF-8(쉼표로 분리)」로 저장하세요. CP949(한글 Windows)도 자동 인식합니다.
          「CSV 양식 받기」는 결번 예시(1·2·3·4·7·9, 학생01…) 샘플입니다.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="px-4 py-3 rounded-xl bg-[#F0EDF1]"><div className="text-xs text-[#71717A]">실제 재적</div><div className="text-lg font-semibold">{enrolled.length}명</div></div>
          <div className="px-4 py-3 rounded-xl bg-[#F0EDF1]">
            <div className="text-xs text-[#71717A]">배정 정원</div>
            <input type="number" min={1} className="w-16 h-8 rounded border px-1" value={settings.capacity}
              onChange={(e) => setSettings({ ...settings, capacity: Number(e.target.value) || 0 })}
              onBlur={() => void putSettings(ownerSub, { grade: settings.grade, class: settings.class, capacity: settings.capacity })} />
          </div>
          <div className="px-4 py-3 rounded-xl bg-[#F0EDF1]"><div className="text-xs text-[#71717A]">결번</div><div className="text-lg font-semibold">{missing.length}건</div><div className="text-xs">{missing.slice(0, 8).join(", ") || "없음"}</div></div>
          <div className="px-4 py-3 rounded-xl bg-[#F0EDF1]">
            <div className="text-xs text-[#71717A]">학년 반</div>
            <input type="number" className="w-12 h-8 rounded border px-1 mr-1" value={settings.grade}
              onChange={(e) => setSettings({ ...settings, grade: Number(e.target.value) || 1 })}
              onBlur={() => void putSettings(ownerSub, { grade: settings.grade, class: settings.class, capacity: settings.capacity })} />
            <input type="number" className="w-12 h-8 rounded border px-1" value={settings.class}
              onChange={(e) => setSettings({ ...settings, class: Number(e.target.value) || 1 })}
              onBlur={() => void putSettings(ownerSub, { grade: settings.grade, class: settings.class, capacity: settings.capacity })} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {(["all", "enrolled", "transferred"] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={"px-3 py-1 rounded-full text-sm border " + (filter === f ? "border-[var(--primary-container)] bg-[var(--accent-bg)] text-[var(--primary-container)] font-medium" : "border-[var(--border)]")}>
              {f === "all" ? "전체" : f === "enrolled" ? "재학" : "결번(전출)"}
            </button>
          ))}
          <input className="h-9 flex-1 min-w-[10rem] rounded-xl border border-[#E4E4E7] px-3" value={q} onChange={(e) => setQ(e.target.value)} placeholder="번호 또는 이름" />
        </div>
        <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          void decodeRosterCsvFile(f)
            .then(parseRosterCsv)
            .then((parsed) => replaceRoster(ownerSub, parsed))
            .then(reload)
            .then(() => setMsg("가져왔습니다"))
            .catch((err) => setMsg(formatRosterCsvError(err)));
          e.target.value = "";
        }} />
        {form ? (
          <div className="mb-4 p-4 rounded-xl border border-[#0F766E] bg-[#F0FDFA] grid gap-2 max-w-lg">
            <b>학생 저장</b>
            <label className="text-sm">번호 <input className="ml-2 h-9 rounded border px-2" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} /></label>
            <label className="text-sm">성명 <input className="ml-2 h-9 rounded border px-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label className="text-sm">특이사항 <input className="ml-2 h-9 rounded border px-2 w-64" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
            <label className="text-sm">학적
              <select className="ml-2 h-9 rounded border" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as EnrollStatus })}>
                <option value="enrolled">재학</option>
                <option value="transferred">전출(결번 유지)</option>
              </select>
            </label>
            <div className="flex gap-2">
              <button type="button" className="px-3 py-1.5 rounded-lg bg-[#0F766E] text-white text-sm" onClick={() => void saveForm()}>저장</button>
              <button type="button" className="px-3 py-1.5 rounded-lg border text-sm" onClick={() => setForm(null)}>취소</button>
            </div>
          </div>
        ) : null}
        <p className="text-sm text-[#71717A]">{msg}</p>
        <p className="text-xs text-[#71717A] mb-2">결번은 당기지 않습니다.</p>
        {rows.length === 0 ? (
          <div className="mb-4 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-bg)] px-4 py-3 text-sm text-[var(--accent-active)]">
            명단 없음 · 「CSV 양식 받기」샘플을 올리거나 「학생 추가」로 시작하세요. 빈 번호(결번)는 채우지 않습니다.
          </div>
        ) : null}
        <div className="bg-white rounded-xl border border-[#E4E4E7] overflow-hidden">
          <div className="grid grid-cols-[3rem_6rem_1fr_5rem_4rem] gap-2 px-4 py-2 text-xs text-[#71717A] border-b bg-[#FAFAFA]">
            <span>번호</span><span>성명</span><span>특이사항 및 학적</span><span>출결 메모</span><span>관리</span>
          </div>
          {shown.map((s) => (
            <div key={`${s.grade}-${s.class}-${s.number}`} className="grid grid-cols-[3rem_6rem_1fr_5rem_4rem] gap-2 px-4 h-12 border-b border-[#F4F4F5] items-center relative">
              <span className="font-semibold tnum">{String(s.number).padStart(2, "0")}</span>
              <span>{s.name}</span>
              <span className="text-sm">{s.status === "transferred" ? "전출" : "재학"}{s.note ? ` · ${s.note}` : ""}</span>
              <button type="button" className="text-sm text-[#0F766E]" onClick={() => onNav("month")}>{counts[s.number] ? `${counts[s.number]}건` : "—"}</button>
              <div>
                <button type="button" className="px-2" onClick={() => setMenu(menu === s.number ? null : s.number)}>⋯</button>
                {menu === s.number ? (
                  <div className="absolute right-4 mt-1 bg-white border rounded-lg shadow text-sm z-10">
                    <button type="button" className="block px-3 py-2 w-full text-left" onClick={() => { setForm({ number: String(s.number), name: s.name, note: s.note ?? "", status: s.status ?? "enrolled" }); setMenu(null); }}>수정</button>
                    <button type="button" className="block px-3 py-2 w-full text-left text-[#BE123C]" onClick={() => { void deleteStudent(ownerSub, s).then(reload); setMenu(null); }}>삭제</button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
          {missing.length ? <div className="px-4 py-2 text-xs text-[#A1A1AA]">결번(명단에 없음): {missing.join(", ")}</div> : null}
        </div>
      </main>
    </Shell>
  );
}
