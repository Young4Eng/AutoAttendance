const el = document.getElementById("status");

chrome.runtime.sendMessage({ type: "get-page-kind" }, (res) => {
  if (chrome.runtime.lastError || !res || !res.ok) {
    el.textContent = "상태 없음";
    el.className = "status no";
    return;
  }
  if (res.kind === "homeroom-daily") {
    el.textContent = "담임용 일일출결 화면";
    el.className = "status ok";
  } else if (res.kind === "other") {
    el.textContent = "대상 화면 아님 — 중단";
    el.className = "status no";
  } else {
    el.textContent = "아직 감지 안 됨 (나이스 탭을 여세요)";
    el.className = "status no";
  }
});
