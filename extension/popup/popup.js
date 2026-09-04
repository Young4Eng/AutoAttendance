const elStatus = document.getElementById("status");
const elQueue = document.getElementById("queue");
const elResult = document.getElementById("result");
const btnDry = document.getElementById("btnDry");
const btnSave = document.getElementById("btnSave");
const btnClear = document.getElementById("btnClear");

function refresh() {
  chrome.runtime.sendMessage({ type: "get-page-kind" }, (res) => {
    if (chrome.runtime.lastError || !res || !res.ok) {
      elStatus.textContent = "상태 없음";
      elStatus.className = "status no";
      return;
    }
    if (res.kind === "homeroom-daily") {
      elStatus.textContent = "담임용 일일출결 화면";
      elStatus.className = "status ok";
    } else if (res.kind === "other") {
      elStatus.textContent = "대상 화면 아님 — 중단";
      elStatus.className = "status no";
    } else {
      elStatus.textContent = "아직 감지 안 됨";
      elStatus.className = "status no";
    }
  });
  chrome.runtime.sendMessage({ type: "get-queue" }, (res) => {
    const n = res && res.ok ? res.count : 0;
    elQueue.textContent = "대기열: " + n + "건";
  });
}

function run(dryRun) {
  elResult.textContent = dryRun ? "시운전 중…" : "저장 포함 적용 중…";
  btnDry.disabled = true;
  btnSave.disabled = true;
  chrome.runtime.sendMessage({ type: "run-apply", dryRun: dryRun }, (res) => {
    btnDry.disabled = false;
    btnSave.disabled = false;
    if (chrome.runtime.lastError || !res) {
      elResult.textContent = "실패: no_response";
      return;
    }
    if (res.ok) {
      elResult.textContent =
        "ok · 적용 " +
        (res.applied || 0) +
        " · " +
        (res.dryRun ? "저장 안 함" : "저장함") +
        " · synced 미설정";
    } else {
      var msg = "중단: " + (res.code || "error");
      if (res.diag && typeof res.diag === "object") {
        var parts = [];
        Object.keys(res.diag).forEach(function (k) {
          parts.push(k + "=" + res.diag[k]);
        });
        if (parts.length) msg += " · " + parts.join(" ");
      }
      if (res.frames != null) msg += " · frames=" + res.frames;
      if (res.reachable != null) msg += " · reachable=" + res.reachable;
      elResult.textContent = msg;
    }
    refresh();
  });
}

btnDry.addEventListener("click", () => run(true));
btnSave.addEventListener("click", () => {
  if (!confirm("나이스에 저장합니다. 출결마감은 누르지 않습니다. 계속?")) return;
  run(false);
});
btnClear.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "clear-queue" }, () => {
    elResult.textContent = "대기열 비움";
    refresh();
  });
});

refresh();
