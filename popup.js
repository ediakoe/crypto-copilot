const status = document.getElementById("status");
const recheck = document.getElementById("recheck");

function setStatus(text, type) {
  status.textContent = text;
  status.className = `status ${type || ""}`;
}

function check() {
  setStatus("Checking central AI…");
  chrome.runtime.sendMessage({ type: "CCP_HEALTH" }, (response) => {
    if (chrome.runtime.lastError) {
      setStatus(chrome.runtime.lastError.message, "bad");
      return;
    }
    if (response?.ok) {
      const version = response.data?.version ? ` (${response.data.version})` : "";
      setStatus(`Central AI is online${version}. Open X and use the tweet button.`, "ok");
      return;
    }
    setStatus(response?.error || "Central AI is offline.", "bad");
  });
}

recheck.addEventListener("click", check);
check();
