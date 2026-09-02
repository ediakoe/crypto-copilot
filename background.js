const CENTRAL_AI_URL = "https://crypto-copilot-api.diako1.workers.dev/";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "CCP_HEALTH") {
    (async () => {
      try {
        const r = await fetch(CENTRAL_AI_URL, { method: "GET" });
        const data = await r.json().catch(() => ({}));
        sendResponse({ ok: r.ok && data?.ok === true, status: r.status, data });
      } catch (error) {
        sendResponse({ ok: false, status: 0, error: error?.message || "Worker unreachable" });
      }
    })();
    return true;
  }

  if (message?.type !== "CCP_AI") return;

  (async () => {
    try {
      const messages = Array.isArray(message.messages) ? message.messages : [];
      if (!messages.length) {
        sendResponse({ ok: false, error: "No AI messages supplied" });
        return;
      }

      const response = await fetch(CENTRAL_AI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: message.model || "openrouter/auto",
          temperature: typeof message.temperature === "number" ? message.temperature : 0.82,
          messages
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.error) {
        sendResponse({
          ok: false,
          error: data?.error || `Central AI error (${response.status})`
        });
        return;
      }

      sendResponse({ ok: true, text: String(data?.text || "").trim() });
    } catch (error) {
      console.error("Crypto Copilot central AI request failed", error);
      sendResponse({
        ok: false,
        error: error?.message || "Central AI request failed"
      });
    }
  })();

  return true;
});
