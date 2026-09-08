import { CHROME_STORE_URL } from "../../lib/storeLinks";
interface Props {
  connected?: boolean;
  onRefresh?: () => void;
}

/** Chrome extension link status strip under the hero. */
export function ExtensionStatusBanner({ connected = true, onRefresh }: Props) {
  return (
    <div className="w-full mb-3 p-3 rounded-xl bg-surface-container-low border border-[#E4E4E7] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div className="flex items-center gap-3 min-w-0">
        <a
          href={CHROME_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-primary shrink-0 shadow-sm border border-[#E4E4E7]"
          title="크롬 웹스토어에서 설치"
        >
          <span className="material-symbols-outlined text-[20px]">extension</span>
        </a>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-on-surface truncate text-sm">
              {connected ? '크롬 확장 프로그램 정상 연결됨' : '크롬 확장 미연결 · 스토어에서 설치'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${connected ? 'bg-primary-container animate-pulse' : 'bg-outline'}`}
            />
          </div>
          <span className="text-xs text-on-surface-variant truncate">
            나이스 일일출결 탭 연동 · queued만 확장 전송
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant bg-surface-container px-2 py-1 rounded-md border border-[#E4E4E7]">
          <span className="material-symbols-outlined text-[15px] text-primary">verified</span>
          {connected ? '인증 세션 유효' : '세션 미확인'}
        </span>
        <a
          href={CHROME_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2 py-1 rounded-md bg-primary-container text-on-primary text-xs flex items-center gap-0.5"
        >
          <span className="material-symbols-outlined text-[14px]">download</span>
          스토어에서 설치
        </a>
        <button
          type="button"
          className="px-2 py-1 rounded-md hover:bg-surface-container text-outline hover:text-on-surface text-xs flex items-center gap-0.5 transition-colors"
          onClick={onRefresh}
        >
          <span className="material-symbols-outlined text-[14px]">refresh</span>
          상태 확인
        </button>
      </div>
    </div>
  );
}
