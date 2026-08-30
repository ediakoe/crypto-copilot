const CENTRAL_AI_URL = "https://crypto-copilot-api.vercel.app/api/chat";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "CCP_AI") return;

  (async () => {
    try {
      const response = await fetch(CENTRAL_AI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: message.model || "openrouter/auto",
          temperature: message.temperature ?? 0.8,
          messages: message.messages || []
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.error) {
        sendResponse({
          ok: false,
          error: data?.error || `Crypto Copilot backend error (${response.status})`
        });
        return;
      }

      sendResponse({
        ok: true,
        text: String(data?.text || "").trim()
      });
    } catch (error) {
      console.error("Crypto Copilot central AI request failed", error);
      sendResponse({ ok: false, error: error?.message || "Central AI request failed" });
    }
  })();

  return true;
});
