console.log("🚀 Crypto Copilot Brave loaded");

function testCryptoCopilot() {
  console.log("✅ Crypto Copilot Brave is running on X");
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    testCryptoCopilot
  );
} else {
  testCryptoCopilot();
}
