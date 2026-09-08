import { CHROME_STORE_URL } from "../lib/storeLinks";

/** Toolbar puzzle — 클릭하면 크롬 웹스토어 설치 페이지. */
export function PuzzleIcon({ className = "inline-block w-[18px] h-[18px] align-[-3px]" }: { className?: string }) {
  return (
    <a
      href={CHROME_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      title="크롬 웹스토어에서 출결메이트 설치"
      className="inline-flex items-center text-primary"
    >
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M20.5 11a2.5 2.5 0 0 0-1.7.68V9.5A2.5 2.5 0 0 0 16.3 7h-2.15c.22-.45.35-.95.35-1.5A2.85 2.85 0 0 0 11.65 2.65 2.85 2.85 0 0 0 8.8 5.5c0 .55.13 1.05.35 1.5H7A2.5 2.5 0 0 0 4.5 9.5v2.18A2.5 2.5 0 0 0 2 14.5a2.5 2.5 0 0 0 2.5 2.5c.4 0 .77-.1 1.1-.26V19A2.5 2.5 0 0 0 8.1 21.5h2.05c-.1.3-.15.62-.15.95a2.6 2.6 0 0 0 5.2 0c0-.33-.05-.65-.15-.95H17.5A2.5 2.5 0 0 0 20 19v-3.26c.33.16.7.26 1.1.26a2.5 2.5 0 0 0 0-5z" />
      </svg>
    </a>
  );
}
