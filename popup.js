const apiKey = document.getElementById("apiKey");
const save = document.getElementById("save");
const toggle = document.getElementById("toggle");
const status = document.getElementById("status");

async function load() {
  const data = await chrome.storage.local.get(["openrouter_api_key"]);
  if (data.openrouter_api_key) {
    apiKey.value = data.openrouter_api_key;
    apiKey.dataset.saved = "true";
    save.textContent = "✓ API Key Saved";
    setStatus("API is connected. You only need to change it if you want a different key.", "ok");
  } else {
    setStatus("First setup: enter your OpenRouter API Key, then save it.");
  }
}

function setStatus(text, type = "") {
  status.textContent = text;
  status.className = `status ${type}`;
}

save.addEventListener("click", async () => {
  const value = apiKey.value.trim();
  if (!value) {
    setStatus("Enter your OpenRouter API Key first.", "bad");
    return;
  }

  await chrome.storage.local.set({ openrouter_api_key: value });
  apiKey.dataset.saved = "true";
  save.textContent = "✓ API Key Saved";
  setStatus("API is connected and saved locally. No API message will appear on X.", "ok");
});

toggle.addEventListener("click", () => {
  apiKey.type = apiKey.type === "password" ? "text" : "password";
  toggle.textContent = apiKey.type === "password" ? "◉" : "◌";
});

load();