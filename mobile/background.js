const DEFAULT_MODEL = "openrouter/auto";

browser.runtime.onMessage.addListener(async (message) => {
  if (!message || message.type !== "ASK_AI") {
    return;
  }

  try {
    const stored = await browser.storage.local.get([
      "openrouter_api_key",
      "openrouter_model"
    ]);

    const apiKey = stored.openrouter_api_key;
    const model =
      stored.openrouter_model || DEFAULT_MODEL;

    if (!apiKey) {
      return {
        ok: false,
        error: "OPENROUTER_KEY_MISSING"
      };
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://x.com",
          "X-Title": "Crypto Copilot Mobile"
        },

        body: JSON.stringify({
          model,
          temperature: 0.9,

          messages: [
            {
              role: "system",
              content: message.prompt || ""
            },
            {
              role: "user",
              content: message.text || ""
            }
          ]
        })
      }
    );

    const data =
      await response.json();

    if (!response.ok || data.error) {
      return {
        ok: false,
        error:
          data?.error?.message ||
          `OpenRouter request failed: ${response.status}`
      };
    }

    const result =
      data?.choices?.[0]?.message?.content?.trim();

    if (!result) {
      return {
        ok: false,
        error: "AI returned an empty response."
      };
    }

    return {
      ok: true,
      result
    };

  } catch (error) {

    console.error(
      "Crypto Copilot:",
      error
    );

    return {
      ok: false,
      error:
        error?.message ||
        "AI request failed."
    };
  }
});
