import { useEffect, useState } from "react";

/** 시안 code.html의 body에서 사이드바를 빼고 본문만 붙인다. */
export function StitchMain({ folder }: { folder: string }) {
  const [html, setHtml] = useState("<p class='p-6 text-sm text-[#71717A]'>시안 불러오는 중…</p>");
  useEffect(() => {
    let alive = true;
    void fetch(`/stitch/${folder}/code.html`)
      .then((r) => r.text())
      .then((t) => {
        const body = t.split(/<body[^>]*>/i)[1]?.split(/<\/body>/i)[0] ?? t;
        const noAside = body.replace(/<aside[\s\S]*?<\/aside>/i, "");
        if (alive) setHtml(noAside);
      })
      .catch(() => {
        if (alive) setHtml("<p class='p-6'>시안 파일을 찾지 못했습니다.</p>");
      });
    return () => {
      alive = false;
    };
  }, [folder]);
  return (
    <div
      className="flex-1 min-w-0 overflow-auto stitch-embed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
