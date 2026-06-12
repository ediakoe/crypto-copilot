// =========================
// 🚀 CRYPTO COPILOT PRO
// =========================

console.log("🚀 CRYPTO COPILOT PRO LOADED");

let API_KEY = "";

chrome.storage.local.get(["openrouter_api_key"], (result) => {
  if (result.openrouter_api_key) {
    API_KEY = result.openrouter_api_key;
  } else {
    const key = prompt("🔑 Crypto Copilot\n\nAPI Key مربوط به OpenRouter را وارد کنید:\n(یک بار کافیه، ذخیره میشه)");
    if (key && key.trim()) {
      API_KEY = key.trim();
      chrome.storage.local.set({ openrouter_api_key: API_KEY });
    }
  }
});

// =========================
// AI REQUEST
// =========================

async function askAI(prompt, tweetText = "") {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
        "HTTP-Referer": "https://x.com",
        "X-Title": "Crypto Copilot Pro"
      },
      body: JSON.stringify({
        model: "openrouter/auto",
        temperature: 0.9,
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: tweetText }
        ]
      })
    });
    const data = await response.json();
    if (data.error) { console.log(data.error); return null; }
    let output = data?.choices?.[0]?.message?.content?.trim();
    if (!output) return null;
    const seen = new Set();
    output = output.split("\n").filter(line => {
      const clean = line.trim().toLowerCase();
      if (seen.has(clean)) return false;
      seen.add(clean);
      return true;
    }).join("\n");
    return output;
  } catch (err) {
    console.log(err);
    return null;
  }
}

// =========================
// WAIT FOR EDITOR
// =========================

function waitForEditor(timeout = 8000) {
  return new Promise((resolve) => {
    const find = () =>
      document.querySelector('[data-testid="tweetTextarea_0"][contenteditable="true"]') ||
      document.querySelector('[role="dialog"] [contenteditable="true"]');

    const found = find();
    if (found) return resolve(found);

    const obs = new MutationObserver(() => {
      const el = find();
      if (el) {
        obs.disconnect();
        clearTimeout(t);
        setTimeout(() => resolve(el), 300);
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
    const t = setTimeout(() => { obs.disconnect(); resolve(null); }, timeout);
  });
}

// =========================
// INSERT INTO X
// =========================

async function insertIntoComposer(text) {
  const editor = await waitForEditor();
  if (!editor) { console.log("EDITOR NOT FOUND"); return false; }

  console.log("✅ editor found");

  // focus روی editor
  editor.click();
  editor.focus();
  await new Promise(r => setTimeout(r, 150));

  const mentions = [...new Set((editor.innerText.match(/@\w+/g) || []))];
  const cleanText = [...new Set(
    text.split(/(?<=[.!?])\s+/).map(t => t.trim()).filter(Boolean)
  )].join(" ");
  const finalText = mentions.length ? `${mentions.join(" ")} ${cleanText}` : cleanText;

  try {
    // paste event — editor باید focused باشه
    const dataTransfer = new DataTransfer();
    dataTransfer.setData("text/plain", finalText);
    editor.dispatchEvent(new ClipboardEvent("paste", {
      clipboardData: dataTransfer,
      bubbles: true,
      cancelable: true
    }));

    await new Promise(r => setTimeout(r, 200));
    console.log("after paste:", editor.innerText);

    // اگه paste کار نکرد
    if (!editor.innerText.trim()) {
      document.execCommand("insertText", false, finalText);
      await new Promise(r => setTimeout(r, 100));
    }

    // cursor آخر متن
    editor.focus();
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);

    console.log("✅ INSERTED:", editor.innerText);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

// =========================
// MENU ITEM
// =========================

function createMenuItem(text) {
  const item = document.createElement("div");
  item.innerText = text;
  Object.assign(item.style, {
    padding: "11px 15px", cursor: "pointer", fontSize: "14px",
    color: "white", transition: "0.18s", userSelect: "none",
    fontWeight: "500", display: "flex", alignItems: "center", gap: "10px"
  });
  item.onmouseenter = () => { item.style.background = "rgba(255,255,255,0.08)"; };
  item.onmouseleave = () => { item.style.background = "transparent"; };
  return item;
}

const allMenus = new Set();
document.addEventListener("click", (e) => {
  allMenus.forEach(({ menu, btn }) => {
    if (!menu.contains(e.target) && !btn.contains(e.target))
      menu.style.display = "none";
  });
});

// =========================
// ATTACH BUTTON
// =========================

function attachButton(tweet) {
  if (tweet.querySelector(".ai-menu-btn")) return;
  const actionBar = tweet.querySelector('[role="group"]');
  if (!actionBar) return;

  const tweetTextElement = tweet.querySelector('[data-testid="tweetText"]');
  const cleanTweet = tweetTextElement ? tweetTextElement.innerText : "";

  const menuBtn = document.createElement("div");
  menuBtn.innerText = "🤖";
  menuBtn.className = "ai-menu-btn";
  Object.assign(menuBtn.style, {
    cursor: "pointer", marginLeft: "12px", fontSize: "18px",
    display: "flex", alignItems: "center", justifyContent: "center",
    width: "34px", height: "34px", borderRadius: "999px", transition: "0.18s"
  });
  menuBtn.onmouseenter = () => { menuBtn.style.background = "rgba(29,155,240,0.16)"; };
  menuBtn.onmouseleave = () => { menuBtn.style.background = "transparent"; };

  const menu = document.createElement("div");
  Object.assign(menu.style, {
    position: "fixed", background: "#16181c",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px",
    padding: "7px 0", minWidth: "240px", zIndex: "999999",
    display: "none", flexDirection: "column", boxShadow: "0 0 30px rgba(0,0,0,0.45)"
  });
  allMenus.add({ menu, btn: menuBtn });

  // SMART REPLY
  const replyItem = createMenuItem("🤖 Smart Reply");
  replyItem.onclick = async () => {
    menu.style.display = "none";
    replyItem.innerText = "⏳ Generating...";

    const replyBtn = tweet.querySelector('[data-testid="reply"]');
    if (replyBtn) replyBtn.click();

    const result = await askAI(
      `Generate ONE short crypto twitter reply.
- Under 15 words
- NEVER repeat tweet text
- Fresh opinion, elite CT degen voice
- Max 2 emojis, no hashtags
- Output ONLY the reply`,
      cleanTweet
    );

    if (result) await insertIntoComposer(result);
    replyItem.innerText = "🤖 Smart Reply";
  };

  // TRANSLATE
  const translateItem = createMenuItem("🌍 ترجمه");
  translateItem.onclick = async () => {
    menu.style.display = "none";
    translateItem.innerText = "⏳ در حال ترجمه...";
    const result = await askAI("Translate ONLY the tweet into Persian. No explanation.", cleanTweet);
    if (result) {
      let box = tweet.querySelector(".translate-box");
      if (!box) {
        box = document.createElement("div");
        box.className = "translate-box";
        Object.assign(box.style, {
          marginTop: "10px", marginLeft: "52px", marginRight: "12px",
          padding: "14px 16px", borderRadius: "16px",
          background: "rgba(29,155,240,0.08)", color: "#e7e9ea",
          direction: "rtl", lineHeight: "2", fontSize: "14px"
        });
        const tc = tweet.querySelector('[data-testid="tweetText"]');
        if (tc) tc.parentElement.appendChild(box);
      }
      box.innerText = result;
    }
    translateItem.innerText = "🌍 ترجمه";
  };

  // PROJECT TWEET
  const projectItem = createMenuItem("🚀 Project Tweet");
  projectItem.onclick = async () => {
    menu.style.display = "none";
    const project = prompt("نام پروژه را وارد کن:");
    if (!project) return;
    projectItem.innerText = "⏳ در حال تولید...";

    const result = await askAI(
      `Write a crypto twitter post about ${project}.
- 1 to 3 punchy sentences
- CT insider voice, real alpha vibes
- Max 2 emojis, no hashtags
- Output ONLY the tweet`,
      ""
    );

    if (result) {
      const postBtn = document.querySelector('[data-testid="SideNav_NewTweet_Button"]');
      if (postBtn) {
        postBtn.click();
        await new Promise(r => setTimeout(r, 800));
        await insertIntoComposer(result);
      }
    }
    projectItem.innerText = "🚀 Project Tweet";
  };

  menu.appendChild(replyItem);
  menu.appendChild(translateItem);
  menu.appendChild(projectItem);

  menuBtn.onclick = (e) => {
    e.stopPropagation();
    allMenus.forEach(({ menu: m }) => { if (m !== menu) m.style.display = "none"; });
    if (menu.style.display === "flex") {
      menu.style.display = "none";
    } else {
      const r = menuBtn.getBoundingClientRect();
      menu.style.top = r.top > 160 ? (r.top - 160) + "px" : (r.bottom + 8) + "px";
      menu.style.left = Math.min(r.left, window.innerWidth - 250) + "px";
      menu.style.display = "flex";
    }
  };

  actionBar.appendChild(menuBtn);
  document.body.appendChild(menu);
}

// =========================
// MUTATION OBSERVER
// =========================

const observer = new MutationObserver((mutations) => {
  mutations.forEach(m => [...m.addedNodes].forEach(node => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.tagName === "ARTICLE") attachButton(node);
    node.querySelectorAll?.("article").forEach(attachButton);
  }));
});

observer.observe(document.body, { childList: true, subtree: true });
document.querySelectorAll("article").forEach(attachButton);
console.log("✅ Crypto Copilot active");
