console.log("🚀 Crypto Copilot Brave UI loaded");

const BUTTON_CLASS = "cc-brave-button";
const MENU_CLASS = "cc-brave-menu";

function closeMenus() {
  document
    .querySelectorAll(`.${MENU_CLASS}`)
    .forEach(menu => menu.remove());
}

function createMenu(tweet) {
  closeMenus();

  const menu = document.createElement("div");

  menu.className = MENU_CLASS;

  menu.innerHTML = `
    <div class="cc-brave-menu-item">🤖 Reply</div>
    <div class="cc-brave-menu-item">🌍 Translate</div>
    <div class="cc-brave-menu-item">🧵 Thread</div>
    <div class="cc-brave-menu-item">✍️ Custom Tweet</div>
  `;

  tweet.style.position = "relative";
  tweet.appendChild(menu);
}

function attachButton(tweet) {
  if (tweet.querySelector(`.${BUTTON_CLASS}`)) {
    return;
  }

  const actionBar = tweet.querySelector(
    '[role="group"]'
  );

  if (!actionBar) {
    return;
  }

  const button = document.createElement("button");

  button.className = BUTTON_CLASS;
  button.type = "button";
  button.textContent = "🤖";

  button.setAttribute(
    "aria-label",
    "Crypto Copilot"
  );

  button.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();

    createMenu(tweet);
  });

  actionBar.appendChild(button);
}

function scanTweets() {
  document
    .querySelectorAll("article")
    .forEach(attachButton);
}

const observer = new MutationObserver(() => {
  scanTweets();
});

function start() {
  if (!document.body) {
    return;
  }

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  scanTweets();

  console.log(
    "✅ Crypto Copilot UI scanner started"
  );
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    start
  );
} else {
  start();
}

document.addEventListener("click", event => {
  if (
    !event.target.closest(`.${MENU_CLASS}`) &&
    !event.target.closest(`.${BUTTON_CLASS}`)
  ) {
    closeMenus();
  }
});
