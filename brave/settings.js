const apiKeyInput =
  document.getElementById("apiKey");

const modelInput =
  document.getElementById("model");

const saveBtn =
  document.getElementById("saveBtn");

const clearBtn =
  document.getElementById("clearBtn");

const status =
  document.getElementById("status");


function showStatus(
  message,
  success = true
) {

  status.textContent =
    message;

  status.className =
    success
      ? "success"
      : "error";

  clearTimeout(
    showStatus.timer
  );

  showStatus.timer =
    setTimeout(() => {

      status.textContent =
        "";

      status.className =
        "";

    }, 3000);
}


async function loadSettings() {

  try {

    const data =
      await chrome.storage.local.get([
        "openrouter_api_key",
        "openrouter_model"
      ]);

    apiKeyInput.value =
      data.openrouter_api_key ||
      "";

    modelInput.value =
      data.openrouter_model ||
      "openrouter/auto";

  } catch (error) {

    console.error(error);

    showStatus(
      "خطا در خواندن تنظیمات.",
      false
    );
  }
}


saveBtn.addEventListener(
  "click",
  async () => {

    const apiKey =
      apiKeyInput.value.trim();

    const model =
      modelInput.value.trim() ||
      "openrouter/auto";

    if (!apiKey) {

      showStatus(
        "لطفاً OpenRouter API Key را وارد کنید.",
        false
      );

      apiKeyInput.focus();

      return;
    }

    if (
      !apiKey.startsWith("sk-or-")
    ) {

      showStatus(
        "فرمت API Key درست به نظر نمی‌رسد.",
        false
      );

      apiKeyInput.focus();

      return;
    }

    try {

      await chrome.storage.local.set({

        openrouter_api_key:
          apiKey,

        openrouter_model:
          model

      });

      showStatus(
        "تنظیمات با موفقیت ذخیره شد."
      );

    } catch (error) {

      console.error(error);

      showStatus(
        "ذخیره تنظیمات انجام نشد.",
        false
      );
    }
  }
);


clearBtn.addEventListener(
  "click",
  async () => {

    try {

      await chrome.storage.local.remove([
        "openrouter_api_key",
        "openrouter_model"
      ]);

      apiKeyInput.value =
        "";

      modelInput.value =
        "openrouter/auto";

      showStatus(
        "API Key حذف شد."
      );

    } catch (error) {

      console.error(error);

      showStatus(
        "حذف API Key انجام نشد.",
        false
      );
    }
  }
);


loadSettings();
