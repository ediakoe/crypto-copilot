(() => {
  if (window.__cryptoCopilotV2) return;
  window.__cryptoCopilotV2 = true;

  console.log("🚀 Crypto Copilot V2 loaded");

  let API_KEY = "";
  const menus = new Set();

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  chrome.storage.local.get(["openrouter_api_key"], (result) => {
    API_KEY = result.openrouter_api_key || "";
    if (!API_KEY) setTimeout(() => openSettings(), 700);
  });

  function injectStyles() {
    if (document.getElementById("cc-v2-styles")) return;
    const style = document.createElement("style");
    style.id = "cc-v2-styles";
    style.textContent = `
      .cc-v2-menu{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#f5f7fa;background:rgba(15,18,24,.96);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border:1px solid rgba(255,255,255,.10);box-shadow:0 22px 60px rgba(0,0,0,.48),0 0 0 1px rgba(255,255,255,.02);border-radius:20px;overflow:hidden;animation:ccIn .16s ease-out;}
      @keyframes ccIn{from{opacity:0;transform:translateY(6px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
      .cc-v2-head{padding:16px 16px 13px;border-bottom:1px solid rgba(255,255,255,.08);background:linear-gradient(135deg,rgba(70,120,255,.16),rgba(120,70,255,.08));}
      .cc-v2-brand{display:flex;align-items:center;gap:10px;font-weight:750;font-size:15px;letter-spacing:-.2px}
      .cc-v2-logo{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:linear-gradient(135deg,#6d7cff,#9b6dff);box-shadow:0 7px 22px rgba(105,110,255,.35);font-size:17px}
      .cc-v2-sub{font-size:11px;color:#8d96a8;margin-top:4px;margin-left:42px}
      .cc-v2-body{padding:10px}
      .cc-v2-section{font-size:10px;font-weight:700;color:#717b8d;text-transform:uppercase;letter-spacing:.12em;padding:4px 7px 7px}
      .cc-v2-item{display:flex;align-items:center;gap:11px;width:100%;box-sizing:border-box;padding:10px 10px;border:0;background:transparent;color:#edf0f5;border-radius:12px;cursor:pointer;text-align:left;font-size:13px;transition:background .15s,transform .15s}
      .cc-v2-item:hover{background:rgba(255,255,255,.075);transform:translateX(2px)}
      .cc-v2-icon{width:30px;height:30px;border-radius:9px;background:rgba(255,255,255,.065);display:grid;place-items:center;font-size:15px;flex:0 0 30px}
      .cc-v2-label{font-weight:600}.cc-v2-desc{font-size:10px;color:#7f899b;margin-top:2px}
      .cc-v2-chevron{margin-left:auto;color:#697386;font-size:14px}
      .cc-v2-settings{position:fixed;z-index:2147483647;width:340px;max-width:calc(100vw - 24px);right:18px;top:72px;background:rgba(14,17,23,.98);border:1px solid rgba(255,255,255,.11);border-radius:22px;box-shadow:0 25px 80px rgba(0,0,0,.55);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#f4f6fa;padding:18px;animation:ccIn .18s ease-out}
      .cc-v2-settings h3{margin:0;font-size:17px}.cc-v2-settings p{margin:5px 0 16px;color:#8791a3;font-size:12px}
      .cc-v2-input{width:100%;box-sizing:border-box;background:#0b0e13;border:1px solid rgba(255,255,255,.1);color:#fff;border-radius:12px;padding:11px 12px;outline:none;font-size:12px}.cc-v2-input:focus{border-color:#6877ff;box-shadow:0 0 0 3px rgba(104,119,255,.12)}
      .cc-v2-save{margin-top:10px;width:100%;border:0;border-radius:12px;padding:11px;background:linear-gradient(135deg,#6878ff,#946dff);color:#fff;font-weight:700;cursor:pointer}
      .cc-v2-close{position:absolute;right:14px;top:12px;background:transparent;border:0;color:#8791a3;font-size:18px;cursor:pointer}
      .cc-v2-result{margin:8px 10px 10px;padding:12px;border-radius:14px;background:rgba(105,120,255,.08);border:1px solid rgba(105,120,255,.16);font-size:12px;line-height:1.55;color:#e9ecf4;white-space:pre-wrap}
      .cc-v2-result-actions{display:flex;gap:7px;margin-top:10px}.cc-v2-mini{flex:1;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.055);color:#dfe4ed;border-radius:9px;padding:7px;cursor:pointer;font-size:11px}
      .cc-v2-translate{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:10px 12px 4px 52px;padding:12px 14px;border-radius:15px;background:linear-gradient(135deg,rgba(105,120,255,.10),rgba(145,105,255,.06));border:1px solid rgba(105,120,255,.14);color:#e9ecf4;direction:rtl;line-height:1.9;font-size:13px;animation:ccIn .2s ease-out}
      .cc-v2-fab{cursor:pointer;margin-left:8px;width:34px;height:34px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:17px;border:0;background:transparent;transition:.18s;position:relative}
      .cc-v2-fab:hover{background:rgba(105,120,255,.16);transform:scale(1.08)}
    `;
    document.documentElement.appendChild(style);
  }

  function openSettings() {
    const old = document.querySelector(".cc-v2-settings");
    if (old) { old.remove(); return; }
    const panel = document.createElement("div");
    panel.className = "cc-v2-settings";
    panel.innerHTML = `<button class="cc-v2-close">×</button><h3>Crypto Copilot</h3><p>AI settings · V2 Premium</p><label style="font-size:11px;color:#9aa3b3;display:block;margin-bottom:7px">OpenRouter API Key</label><input class="cc-v2-input" type="password" placeholder="sk-or-..." value="${API_KEY ? "••••••••••••••••" : ""}"><button class="cc-v2-save">Save API Key</button>`;
    document.body.appendChild(panel);
    panel.querySelector(".cc-v2-close").onclick = () => panel.remove();
    panel.querySelector(".cc-v2-save").onclick = () => {
      const input = panel.querySelector("input");
      if (input.value && !input.value.startsWith("••")) {
        API_KEY = input.value.trim();
        chrome.storage.local.set({openrouter_api_key: API_KEY});
      }
      panel.remove();
    };
  }

  async function askAI(system, user = "") {
    if (!API_KEY) { openSettings(); return null; }
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${API_KEY}`,"HTTP-Referer":"https://x.com","X-Title":"Crypto Copilot V2"},
        body:JSON.stringify({model:"openrouter/auto",temperature:.85,messages:[{role:"system",content:system},{role:"user",content:user}]})
      });
      const data = await response.json();
      if (data.error) { console.error("Crypto Copilot AI error:",data.error); return null; }
      return data?.choices?.[0]?.message?.content?.trim() || null;
    } catch(err){ console.error("Crypto Copilot request failed:",err); return null; }
  }

  function waitForEditor(timeout=8000){
    return new Promise(resolve=>{
      const find=()=>document.querySelector('[data-testid="tweetTextarea_0"][contenteditable="true"]')||document.querySelector('[role="dialog"] [contenteditable="true"]');
      const found=find(); if(found) return resolve(found);
      const obs=new MutationObserver(()=>{const el=find();if(el){obs.disconnect();clearTimeout(timer);resolve(el);}});
      obs.observe(document.body,{childList:true,subtree:true});
      const timer=setTimeout(()=>{obs.disconnect();resolve(null)},timeout);
    });
  }

  async function insertIntoComposer(text){
    const editor=await waitForEditor();
    if(!editor) return false;
    editor.focus();
    const dt=new DataTransfer();dt.setData("text/plain",text);
    editor.dispatchEvent(new ClipboardEvent("paste",{clipboardData:dt,bubbles:true,cancelable:true}));
    await sleep(180);
    if(!editor.innerText.trim()) document.execCommand("insertText",false,text);
    editor.focus();
    const sel=window.getSelection(),range=document.createRange();range.selectNodeContents(editor);range.collapse(false);sel.removeAllRanges();sel.addRange(range);
    return true;
  }

  function getTweetText(tweet){return tweet.querySelector('[data-testid="tweetText"]')?.innerText?.trim()||"";}

  function createItem(icon,label,desc,handler){
    const btn=document.createElement("button");btn.className="cc-v2-item";
    btn.innerHTML=`<span class="cc-v2-icon">${icon}</span><span><div class="cc-v2-label">${label}</div><div class="cc-v2-desc">${desc}</div></span><span class="cc-v2-chevron">›</span>`;
    btn.onclick=handler;return btn;
  }

  function createMenu(tweet,button){
    const menu=document.createElement("div");menu.className="cc-v2-menu";menu.style.cssText+="position:fixed;z-index:2147483647;width:286px;display:none";
    const text=getTweetText(tweet);
    menu.innerHTML=`<div class="cc-v2-head"><div class="cc-v2-brand"><span class="cc-v2-logo">✦</span><span>Crypto Copilot</span></div><div class="cc-v2-sub">AI tools for Crypto Twitter</div></div><div class="cc-v2-body"><div class="cc-v2-section">AI Actions</div></div>`;
    const body=menu.querySelector(".cc-v2-body");

    const runReply=async(mode)=>{
      menu.style.display="none";
      const reply=tweet.querySelector('[data-testid="reply"]');if(reply) reply.click();
      const prompts={short:"Write ONE natural crypto Twitter reply under 12 words. Be sharp, human and concise.",smart:"Write ONE insightful crypto Twitter reply under 25 words. Add a fresh opinion, not a summary.",professional:"Write ONE professional crypto Twitter reply under 25 words. Sound credible and informed."};
      const result=await askAI(`${prompts[mode]} Output only the reply. No hashtags. Max 2 emojis.`,text);
      if(result) await insertIntoComposer(result);
    };

    body.appendChild(createItem("⚡","Smart Reply","Generate a natural reply",()=>{
      const sub=document.createElement("div");sub.className="cc-v2-menu";sub.style.cssText+="position:fixed;z-index:2147483647;width:260px;display:none";
      sub.innerHTML=`<div class="cc-v2-head"><div class="cc-v2-brand"><span class="cc-v2-logo">⚡</span><span>Reply Style</span></div><div class="cc-v2-sub">Choose how Copilot should sound</div></div><div class="cc-v2-body"></div>`;
      const sb=sub.querySelector(".cc-v2-body");sb.appendChild(createItem("◉","Short","Fast and punchy",()=>runReply("short")));sb.appendChild(createItem("✦","Smart","Fresh opinion",()=>runReply("smart")));sb.appendChild(createItem("◆","Professional","Credible tone",()=>runReply("professional")));
      document.body.appendChild(sub);menus.add({menu:sub,button});const r=button.getBoundingClientRect();sub.style.left=Math.min(r.left,innerWidth-275)+"px";sub.style.top=Math.max(12,r.top-170)+"px";sub.style.display="block";
    }));

    body.appendChild(createItem("🌍","Translate","Persian translation",async()=>{
      menu.style.display="none";const result=await askAI("Translate the tweet into natural Persian. Preserve crypto terms and tone. Output only the translation.",text);if(!result)return;
      let box=tweet.querySelector(".cc-v2-translate");if(!box){box=document.createElement("div");box.className="cc-v2-translate";tweet.querySelector('[data-testid="tweetText"]')?.parentElement.appendChild(box);}box.textContent=result;
    }));

    body.appendChild(createItem("✎","Rewrite","Improve the wording",async()=>{
      menu.style.display="none";const result=await askAI("Rewrite this tweet to be sharper, more natural and engaging for Crypto Twitter. Keep the meaning. Output only the rewritten text.",text);if(result) await showResult(menu,button,result,"Rewrite");
    }));

    body.appendChild(createItem("🧵","Thread","Turn an idea into a thread",async()=>{
      menu.style.display="none";const result=await askAI("Turn this tweet into a concise 3-post crypto Twitter thread. Number each post 1/3, 2/3, 3/3. Output only the thread.",text);if(result) await showResult(menu,button,result,"Thread");
    }));

    const tools=document.createElement("div");tools.style.cssText="border-top:1px solid rgba(255,255,255,.08);margin-top:6px;padding-top:7px";
    tools.appendChild(createItem("🚀","Project Tweet","Create a new crypto post",async()=>{
      menu.style.display="none";const project=prompt("Project name:");if(!project)return;const result=await askAI(`Write one punchy Crypto Twitter post about ${project}. Insider tone, 1-3 sentences, max 2 emojis, no hashtags. Output only the post.`);if(result){document.querySelector('[data-testid="SideNav_NewTweet_Button"]')?.click();await sleep(700);await insertIntoComposer(result);}
    }));
    tools.appendChild(createItem("⚙","Settings","API key and preferences",()=>openSettings()));body.appendChild(tools);
    return menu;
  }

  async function showResult(menu,button,text,title){
    menu.innerHTML=`<div class="cc-v2-head"><div class="cc-v2-brand"><span class="cc-v2-logo">✦</span><span>${title}</span></div><div class="cc-v2-sub">Generated by Crypto Copilot</div></div><div class="cc-v2-result">${text.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}<div class="cc-v2-result-actions"><button class="cc-v2-mini cc-copy">Copy</button><button class="cc-v2-mini cc-insert">Insert</button></div></div>`;
    menu.querySelector(".cc-copy").onclick=()=>navigator.clipboard?.writeText(text);
    menu.querySelector(".cc-insert").onclick=async()=>{menu.style.display="none";const reply=menu.__tweet?.querySelector('[data-testid="reply"]');if(reply)reply.click();await sleep(500);await insertIntoComposer(text)};
    menu.__tweet=menu.__tweet||button.closest("article");
    menu.style.display="block";
  }

  function attachButton(tweet){
    if(!tweet || tweet.querySelector(".cc-v2-fab")) return;
    const actionBar=tweet.querySelector('[role="group"]');if(!actionBar)return;
    const button=document.createElement("button");button.className="cc-v2-fab";button.type="button";button.title="Crypto Copilot";button.textContent="✦";
    const menu=createMenu(tweet,button);document.body.appendChild(menu);menus.add({menu,button});
    button.onclick=e=>{e.stopPropagation();menus.forEach(x=>{if(x.menu!==menu)x.menu.style.display="none"});if(menu.style.display==="block"){menu.style.display="none";return;}const r=button.getBoundingClientRect();menu.style.left=Math.min(r.left,innerWidth-300)+"px";menu.style.top=Math.min(innerHeight-520,Math.max(10,r.top-430))+"px";menu.style.display="block"};
    actionBar.appendChild(button);
  }

  document.addEventListener("click",e=>{menus.forEach(x=>{if(!x.menu.contains(e.target)&&!x.button.contains(e.target))x.menu.style.display="none"})});
  window.addEventListener("resize",()=>menus.forEach(x=>x.menu.style.display="none"));
  window.addEventListener("scroll",()=>menus.forEach(x=>x.menu.style.display="none"),true);

  function scan(){document.querySelectorAll("article").forEach(attachButton)}
  injectStyles();scan();
  new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
  console.log("✅ Crypto Copilot V2 active");
})();
