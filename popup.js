const apiKey = document.getElementById("apiKey");
const save = document.getElementById("save");
const toggle = document.getElementById("toggle");
const status = document.getElementById("status");

function setStatus(text, type = "") {
  status.textContent = text;
  status.className = `status ${type}`;
}

async function load() {
  const data = await chrome.storage.local.get(["openrouter_api_key"]);
  if (data.openrouter_api_key) {
    apiKey.value = data.openrouter_api_key;
    setStatus("✓ API Key saved and ready", "ok");
  } else {
    setStatus("API Key not configured yet");
  }
}

save.addEventListener("click", async () => {
  const value = apiKey.value.trim();
  if (!value) {
    setStatus("Enter your OpenRouter API Key", "bad");
    return;
  }
  await chrome.storage.local.set({ openrouter_api_key: value });
  setStatus("✓ API Key saved", "ok");
});

toggle.addEventListener("click", () => {
  apiKey.type = apiKey.type === "password" ? "text" : "password";
  toggle.textContent = apiKey.type === "password" ? "◉" : "◌";
});

load();