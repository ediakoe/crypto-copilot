const AI_URL = "https://devtoolbox-api.devtoolbox-api.workers.dev/ai/generate";

function buildPrompt(messages) {
  return (Array.isArray(messages) ? messages : [])
    .map((m) => `${m.role || "user"}: ${m.content || ""}`)
    .join("\n\n")
    .slice(0, 6000);
}

function readableError(value, status) {
  if (value == null || value === "") return `AI error (${status || "unknown"})`;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "{}" || trimmed === "[]") return `AI provider returned an empty error (${status || "unknown"})`;
    try {
      return readableError(JSON.parse(trimmed), status);
    } catch {
      return trimmed.slice(0, 220);
    }
  }
  if (typeof value === "object") {
    const nested = value.error || value.message || value.response;
    if (nested && nested !== value) return readableError(nested, status);
    const text = JSON.stringify(value);
    return text && text !== "{}" ? text.slice(0, 220) : `AI provider returned an empty error (${status || "unknown"})`;
  }
  return String(value);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "CCP_HEALTH") {
    sendResponse({ ok: true, status: 200, data: { ok: true, service: "DevToolBox", version: "2.2.7" } });
    return;
  }
  if (message?.type !== "CCP_AI") return;

  (async () => {
    try {
      const messages = Array.isArray(message.messages) ? message.messages : [];
      if (!messages.length) {
        sendResponse({ ok: false, error: "No AI messages supplied" });
        return;
      }
      const response = await fetch(AI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: buildPrompt(messages) })
      });
      const raw = await response.text();
      let data = {};
      try { data = JSON.parse(raw); } catch { data = { response: raw }; }
      const text = String(data.response || data.text || "").trim();
      if (!response.ok || !text) {
        sendResponse({ ok: false, error: readableError(data.error || raw, response.status) });
        return;
      }
      sendResponse({ ok: true, text });
    } catch (error) {
      sendResponse({ ok: false, error: error?.message || "AI request failed" });
    }
  })();
  return true;
});
