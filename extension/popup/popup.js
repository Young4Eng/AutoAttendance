const elStatus = document.getElementById("status");
const elQueue = document.getElementById("queue");
const elResult = document.getElementById("result");
const btnDry = document.getElementById("btnDry");
const btnSave = document.getElementById("btnSave");
const btnClear = document.getElementById("btnClear");

function formatResult(last) {
  if (!last) return "";
  if (last.state === "running") {
    return (last.dryRun ? "시운전 진행 중…" : "실제 입력 진행 중…") + " \ub05d나면 아이콘을 다시 누르세요";
  }
  if (last.ok) {
    return (
      "ok \u00b7 적용 " +
      (last.applied || 0) +
      " \u00b7 " +
      (last.dryRun ? "시운전(저장 안 함)" : "실제 입력(저장함)")
    );
  }
  var msg = "중단: " + (last.code || "error");
  if (last.diag && typeof last.diag === "object") {
    var parts = [];
    Object.keys(last.diag).forEach(function (k) {
      parts.push(k + "=" + last.diag[k]);
    });
    if (parts.length) msg += " \u00b7 " + parts.join(" ");
  }
  if (last.frames != null) msg += " \u00b7 frames=" + last.frames;
  if (last.reachable != null) msg += " \u00b7 reachable=" + last.reachable;
  return msg;
}

function showLast(last) {
  elResult.textContent = formatResult(last);
  elResult.className = last && last.state === "error" ? "result-err" : "muted";
}

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
      elStatus.textContent = "대상 화면 아님 \u2014 중단";
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
  chrome.storage.session.get("lastApply", (data) => {
    showLast(data && data.lastApply);
  });
}

function run(dryRun) {
  elResult.textContent = (dryRun ? "시운전 시작" : "실제 입력 시작") + " \u00b7 창을 닫습니다";
  btnDry.disabled = true;
  btnSave.disabled = true;
  chrome.runtime.sendMessage({ type: "run-apply", dryRun: dryRun }, () => {
    window.close();
  });
}

btnDry.addEventListener("click", () => run(true));
btnSave.addEventListener("click", () => {
  if (!confirm("나이스에 저장합니다. 출결마감은 누르지 않습니다. 진행할까요?")) return;
  run(false);
});
btnClear.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "clear-queue" }, () => {
    elResult.textContent = "대기열 비움";
    refresh();
  });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "session" && changes.lastApply) showLast(changes.lastApply.newValue);
});

refresh();

document.addEventListener("keydown", function (ev) {
  if (ev.key !== "Escape" && ev.key !== "Esc") return;
  chrome.runtime.sendMessage({ type: "abort-apply" }, function () {
    elResult.textContent = "중단 요청";
  });
});
