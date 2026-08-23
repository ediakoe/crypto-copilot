chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "CCP_AI") return;

  (async () => {
    try {
      const { openrouter_api_key: apiKey } = await chrome.storage.local.get("openrouter_api_key");
      if (!apiKey) {
        sendResponse({ ok: false, error: "API_NOT_CONFIGURED" });
        return;
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://x.com",
          "X-Title": "Crypto Copilot V2 Premium"
        },
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
          error: data?.error?.message || `OpenRouter error (${response.status})`
        });
        return;
      }

      sendResponse({ ok: true, text: data?.choices?.[0]?.message?.content?.trim() || "" });
    } catch (error) {
      console.error("Crypto Copilot AI request failed", error);
      sendResponse({ ok: false, error: error?.message || "AI request failed" });
    }
  })();

  return true;
});
