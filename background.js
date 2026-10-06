const AI_URL = "https://text.pollinations.ai/";

function buildPrompt(messages) {
  return (Array.isArray(messages) ? messages : [])
    .map((m) => `${m.role || "user"}: ${m.content || ""}`)
    .join("\n\n")
    .slice(0, 6000);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "CCP_HEALTH") {
    sendResponse({ ok: true, status: 200, data: { ok: true, service: "Pollinations", version: "2.2.6" } });
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
      const prompt = buildPrompt(messages);
      const response = await fetch(`${AI_URL}${encodeURIComponent(prompt)}`, { method: "GET" });
      const text = (await response.text()).trim();
      if (!response.ok || !text || text.startsWith("{")) {
        sendResponse({ ok: false, error: text.slice(0, 180) || `AI error (${response.status})` });
        return;
      }
      sendResponse({ ok: true, text });
    } catch (error) {
      sendResponse({ ok: false, error: error?.message || "AI request failed" });
    }
  })();

  return true;
});
