// ======================================================
// 🚀 CRYPTO COPILOT MOBILE
// Firefox Android / X
// ======================================================

console.log("🚀 Crypto Copilot Mobile loaded");

const BUTTON_CLASS = "cc-mobile-button";
const MENU_CLASS = "cc-mobile-menu";
const TRANSLATION_CLASS = "cc-mobile-translation";


// ======================================================
// HELPERS
// ======================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


function getTweetText(tweet) {

  const textElement =
    tweet.querySelector('[data-testid="tweetText"]');

  if (!textElement) {
    return "";
  }

  return textElement.innerText.trim();
}


// ======================================================
// AI
// ======================================================

async function askAI(prompt, text) {

  try {

    const response =
      await browser.runtime.sendMessage({
        type: "ASK_AI",
        prompt,
        text
      });

    if (!response || !response.ok) {

      if (
        response?.error ===
        "OPENROUTER_KEY_MISSING"
      ) {

        const openSettings =
          confirm(
            "Crypto Copilot\n\nOpenRouter API Key وارد نشده است.\n\nتنظیمات را باز کنیم؟"
          );

        if (openSettings) {
          browser.runtime.openOptionsPage();
        }

        return null;
      }

      alert(
        response?.error ||
        "AI request failed."
      );

      return null;
    }

    return response.result;

  } catch (error) {

    console.error(
      "Crypto Copilot AI error:",
      error
    );

    alert(
      "ارتباط با AI برقرار نشد."
    );

    return null;
  }
}


// ======================================================
// X COMPOSER
// ======================================================

function findComposer() {

  const selectors = [

    '[data-testid="tweetTextarea_0"][contenteditable="true"]',

    '[data-testid="tweetTextarea_0"] [contenteditable="true"]',

    '[role="dialog"] [contenteditable="true"][role="textbox"]',

    '[role="dialog"] div[contenteditable="true"]',

    'div[contenteditable="true"][role="textbox"]'

  ];

  for (const selector of selectors) {

    const elements =
      document.querySelectorAll(selector);

    for (const element of elements) {

      const rect =
        element.getBoundingClientRect();

      if (
        rect.width > 0 &&
        rect.height > 0
      ) {
        return element;
      }
    }
  }

  return null;
}


async function waitForComposer(
  timeout = 8000
) {

  const start =
    Date.now();

  while (
    Date.now() - start <
    timeout
  ) {

    const composer =
      findComposer();

    if (composer) {
      return composer;
    }

    await sleep(150);
  }

  return null;
}


// ======================================================
// SAFE TEXT INSERT
// ======================================================

function insertTextIntoComposer(
  composer,
  text
) {

  if (!composer) {
    return false;
  }

  composer.focus();

  const selection =
    window.getSelection();

  const range =
    document.createRange();

  range.selectNodeContents(
    composer
  );

  range.collapse(false);

  selection.removeAllRanges();

  selection.addRange(range);


  // Method 1
  try {

    const inserted =
      document.execCommand(
        "insertText",
        false,
        text
      );

    if (inserted) {

      composer.dispatchEvent(
        new InputEvent(
          "input",
          {
            bubbles: true,
            inputType:
              "insertText",
            data:
              text
          }
        )
      );

      return true;
    }

  } catch (error) {

    console.log(
      "execCommand failed:",
      error
    );
  }


  // Method 2
  try {

    const dataTransfer =
      new DataTransfer();

    dataTransfer.setData(
      "text/plain",
      text
    );

    const pasteEvent =
      new ClipboardEvent(
        "paste",
        {
          clipboardData:
            dataTransfer,
          bubbles: true,
          cancelable: true
        }
      );

    composer.dispatchEvent(
      pasteEvent
    );

    return true;

  } catch (error) {

    console.log(
      "Paste fallback failed:",
      error
    );
  }

  return false;
}


// ======================================================
// OPEN REPLY
// ======================================================

async function openReplyComposer(
  tweet
) {

  const replyButton =
    tweet.querySelector(
      '[data-testid="reply"]'
    );

  if (!replyButton) {

    alert(
      "دکمه Reply پیدا نشد."
    );

    return null;
  }

  replyButton.click();

  await sleep(500);

  const composer =
    await waitForComposer();

  if (!composer) {

    alert(
      "کادر Reply پیدا نشد."
    );

    return null;
  }

  return composer;
}


// ======================================================
// SMART REPLY
// ======================================================

async function generateReply(
  tweet
) {

  const tweetText =
    getTweetText(tweet);

  if (!tweetText) {
    return;
  }

  const result =
    await askAI(
      `
Generate ONE short natural crypto Twitter reply.

Rules:
- Under 20 words.
- Do not repeat the original tweet.
- Sound like a real Crypto Twitter user.
- Give a short opinion or useful reaction.
- Maximum 2 emojis.
- No hashtags.
- Output ONLY the reply.
      `.trim(),
      tweetText
    );

  if (!result) {
    return;
  }

  const composer =
    await openReplyComposer(
      tweet
    );

  if (!composer) {
    return;
  }

  await sleep(200);

  const inserted =
    insertTextIntoComposer(
      composer,
      result
    );

  if (!inserted) {

    alert(
      "متن Reply وارد نشد."
    );

    return;
  }

  console.log(
    "✅ Reply inserted"
  );
}


// ======================================================
// TRANSLATE
// ======================================================

async function translateTweet(
  tweet
) {

  const tweetText =
    getTweetText(tweet);

  if (!tweetText) {
    return;
  }

  const result =
    await askAI(
      `
Translate ONLY this tweet into clean Persian.

Rules:
- Persian only.
- No explanation.
- Preserve crypto terminology.
- Do not add information.
- Return only the translation.
      `.trim(),
      tweetText
    );

  if (!result) {
    return;
  }

  let box =
    tweet.querySelector(
      `.${TRANSLATION_CLASS}`
    );

  if (!box) {

    box =
      document.createElement(
        "div"
      );

    box.className =
      TRANSLATION_CLASS;

    const tweetTextElement =
      tweet.querySelector(
        '[data-testid="tweetText"]'
      );

    if (
      tweetTextElement &&
      tweetTextElement.parentElement
    ) {

      tweetTextElement.parentElement
        .appendChild(box);

    } else {

      tweet.appendChild(box);
    }
  }

  box.textContent =
    result;
}


// ======================================================
// THREAD
// ======================================================

async function generateThread(
  tweet
) {

  const tweetText =
    getTweetText(tweet);

  if (!tweetText) {
    return;
  }

  const result =
    await askAI(
      `
Create a short crypto Twitter thread.

Rules:
- 4 to 5 posts.
- Number each post.
- Natural human tone.
- Useful insight.
- Do not invent facts.
- Maximum 1 emoji per post.
- No unnecessary hashtags.
- Output ONLY the thread.
      `.trim(),
      tweetText
    );

  if (!result) {
    return;
  }

  try {

    await navigator.clipboard.writeText(
      result
    );

    alert(
      "🧵 Thread کپی شد."
    );

  } catch {

    alert(result);
  }
}


// ======================================================
// CUSTOM TWEET
// ======================================================

async function customTweet() {

  const topic =
    prompt(
      "✍️ موضوع یا متن توییت را وارد کن:"
    );

  if (!topic?.trim()) {
    return;
  }

  const result =
    await askAI(
      `
Write one natural crypto Twitter post.

Rules:
- Human tone.
- Concise.
- Engaging.
- Maximum 2 emojis.
- No hashtags unless necessary.
- Do not invent facts.
- Output ONLY the tweet.
      `.trim(),
      topic.trim()
    );

  if (!result) {
    return;
  }

  try {

    await navigator.clipboard.writeText(
      result
    );

    alert(
      "✍️ Tweet آماده شد و کپی شد."
    );

  } catch {

    alert(result);
  }
}


// ======================================================
// MENU
// ======================================================

function closeMenus() {

  document
    .querySelectorAll(
      `.${MENU_CLASS}`
    )
    .forEach(menu => {

      menu.remove();
    });
}


function createMenuItem(
  label
) {

  const item =
    document.createElement(
      "div"
    );

  item.className =
    "cc-mobile-menu-item";

  item.textContent =
    label;

  return item;
}


function createMenu(
  tweet,
  button
) {

  closeMenus();

  const menu =
    document.createElement(
      "div"
    );

  menu.className =
    MENU_CLASS;


  // Reply
  const reply =
    createMenuItem(
      "🤖 Reply"
    );

  reply.addEventListener(
    "click",
    async event => {

      event.stopPropagation();

      menu.remove();

      reply.textContent =
        "⏳ Generating...";

      await generateReply(
        tweet
      );
    }
  );


  // Translate
  const translate =
    createMenuItem(
      "🌍 Translate"
    );

  translate.addEventListener(
    "click",
    async event => {

      event.stopPropagation();

      menu.remove();

      await translateTweet(
        tweet
      );
    }
  );


  // Thread
  const thread =
    createMenuItem(
      "🧵 Thread"
    );

  thread.addEventListener(
    "click",
    async event => {

      event.stopPropagation();

      menu.remove();

      await generateThread(
        tweet
      );
    }
  );


  // Custom Tweet
  const custom =
    createMenuItem(
      "✍️ Custom Tweet"
    );

  custom.addEventListener(
    "click",
    async event => {

      event.stopPropagation();

      menu.remove();

      await customTweet();
    }
  );


  menu.appendChild(
    reply
  );

  menu.appendChild(
    translate
  );

  menu.appendChild(
    thread
  );

  menu.appendChild(
    custom
  );


  tweet.style.position =
    "relative";

  tweet.appendChild(
    menu
  );
}


// ======================================================
// BUTTON
// ======================================================

function attachButton(
  tweet
) {

  if (
    tweet.querySelector(
      `.${BUTTON_CLASS}`
    )
  ) {
    return;
  }

  const actionBar =
    tweet.querySelector(
      '[role="group"]'
    );

  if (!actionBar) {
    return;
  }

  const button =
    document.createElement(
      "button"
    );

  button.className =
    BUTTON_CLASS;

  button.type =
    "button";

  button.textContent =
    "🤖";

  button.setAttribute(
    "aria-label",
    "Crypto Copilot"
  );


  button.addEventListener(
    "click",
    event => {

      event.preventDefault();

      event.stopPropagation();

      createMenu(
        tweet,
        button
      );
    }
  );


  actionBar.appendChild(
    button
  );
}


// ======================================================
// SCAN X
// ======================================================

function scanTweets() {

  document
    .querySelectorAll(
      "article"
    )
    .forEach(
      attachButton
    );
}


// ======================================================
// MUTATION OBSERVER
// ======================================================

const observer =
  new MutationObserver(
    () => {

      scanTweets();
    }
  );


function startObserver() {

  if (!document.body) {
    return;
  }

  observer.observe(
    document.body,
    {
      childList: true,
      subtree: true
    }
  );

  scanTweets();
}


if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    startObserver
  );

} else {

  startObserver();
}


// ======================================================
// CLOSE MENU OUTSIDE
// ======================================================

document.addEventListener(
  "click",
  event => {

    if (
      !event.target.closest(
        `.${MENU_CLASS}`
      ) &&
      !event.target.closest(
        `.${BUTTON_CLASS}`
      )
    ) {

      closeMenus();
    }
  }
);

console.log(
  "✅ Crypto Copilot Mobile active"
);
