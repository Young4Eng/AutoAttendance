import { useRef, useState } from "react";
import { parseRosterCsv } from "../csv/parseRoster";
import { listRoster, replaceRoster } from "../db/store";
import { Shell, type AppScreen } from "./Shell";
import { StitchMain } from "./StitchMain";

type Props = {
  ownerSub: string;
  teacherLabel: string;
  screen: AppScreen;
  onNav: (s: AppScreen) => void;
  onLogout: () => void;
};

export function RosterScreen({ ownerSub, teacherLabel, screen, onNav, onLogout }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");
  return (
    <Shell screen={screen} teacherLabel={teacherLabel} onNav={onNav} onLogout={onLogout}>
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[#E4E4E7] bg-white text-sm">
          <button type="button" className="px-3 py-1.5 rounded-lg border border-[#E4E4E7]" onClick={() => fileRef.current?.click()}>CSV 가져오기</button>
          <span className="text-[#71717A]">{msg}</span>
          <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            void f.text().then(parseRosterCsv).then((rows) => replaceRoster(ownerSub, rows)).then(() => listRoster(ownerSub)).then((r) => setMsg(`${r.length}명`)).catch((err) => setMsg(String(err)));
            e.target.value = "";
          }} />
        </div>
        <StitchMain folder="_4" />
      </div>
    </Shell>
  );
}
