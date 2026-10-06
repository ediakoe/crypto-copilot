const status = document.getElementById("status");
const recheck = document.getElementById("recheck");

function setStatus(text, type) {
  status.textContent = text;
  status.className = `status ${type || ""}`;
}

function check() {
  setStatus("Checking AI…");
  chrome.runtime.sendMessage({ type: "CCP_HEALTH" }, (response) => {
    if (chrome.runtime.lastError) {
      setStatus(chrome.runtime.lastError.message, "bad");
      return;
    }
    if (response?.ok) {
      setStatus("Connected. No API key needed. Open X and use the tweet button.", "ok");
      return;
    }
    setStatus(response?.error || "AI is offline.", "bad");
  });
}

recheck.addEventListener("click", check);
check();
