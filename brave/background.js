console.log("🚀 Crypto Copilot Brave background loaded");

const DEFAULT_MODEL = "openrouter/auto";

chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {

    if (
      !message ||
      message.type !== "ASK_AI"
    ) {
      return;
    }

    askAI(
      message.prompt || "",
      message.text || ""
    )
      .then(result => {
        sendResponse({
          ok: true,
          result
        });
      })
      .catch(error => {

        console.error(
          "Crypto Copilot AI:",
          error
        );

        sendResponse({
          ok: false,
          error:
            error?.message ||
            "AI request failed."
        });
      });

    return true;
  }
);


async function askAI(
  prompt,
  text
) {

  const stored =
    await chrome.storage.local.get([
      "openrouter_api_key",
      "openrouter_model"
    ]);

  const apiKey =
    stored.openrouter_api_key;

  const model =
    stored.openrouter_model ||
    DEFAULT_MODEL;


  if (!apiKey) {

    throw new Error(
      "OPENROUTER_KEY_MISSING"
    );
  }


  const response =
    await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "Authorization":
            `Bearer ${apiKey}`,

          "HTTP-Referer":
            "https://x.com",

          "X-Title":
            "Crypto Copilot Brave"
        },

        body: JSON.stringify({

          model,

          temperature: 0.9,

          messages: [

            {
              role: "system",
              content: prompt
            },

            {
              role: "user",
              content: text
            }

          ]

        })
      }
    );


  const data =
    await response.json();


  if (
    !response.ok ||
    data.error
  ) {

    throw new Error(
      data?.error?.message ||
      `OpenRouter request failed: ${response.status}`
    );
  }


  const result =
    data?.choices?.[0]
      ?.message
      ?.content
      ?.trim();


  if (!result) {

    throw new Error(
      "AI returned an empty response."
    );
  }


  return result;
}
