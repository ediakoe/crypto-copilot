(() => {
  if (window.__cryptoCopilotV2Premium) return;
  window.__cryptoCopilotV2Premium = true;

  console.log("🚀 Crypto Copilot V2 Premium loaded");

  let API_KEY = "";
  let activeMenu = null;

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const esc = value => String(value).replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[char]));

  chrome.storage.local.get(["openrouter_api_key"], result => { API_KEY = result.openrouter_api_key || ""; });

  function injectStyles() {
    if (document.getElementById("ccp-v2-styles")) return;
    const style = document.createElement("style");
    style.id = "ccp-v2-styles";
    style.textContent = `
      .ccp-fab{width:34px;height:34px;border:0;border-radius:999px;background:transparent;color:#fff;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;font-size:17px;transition:transform .18s ease,background .18s ease}.ccp-fab:hover{background:rgba(104,119,255,.16);transform:scale(1.08)}
      .ccp-menu{position:fixed;z-index:2147483647;width:310px;color:#f5f7fb;background:rgba(14,17,24,.97);border:1px solid rgba(255,255,255,.10);border-radius:20px;box-shadow:0 24px 70px rgba(0,0,0,.55);overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;backdrop-filter:blur(20px);animation:ccpIn .16s ease-out}@keyframes ccpIn{from{opacity:0;transform:translateY(6px) scale(.97)}to{opacity:1;transform:none}}
      .ccp-head{padding:15px 16px 13px;background:linear-gradient(135deg,rgba(104,119,255,.18),rgba(157,105,255,.08));border-bottom:1px solid rgba(255,255,255,.08)}.ccp-brand{display:flex;align-items:center;gap:10px;font-size:15px;font-weight:750}.ccp-logo{width:31px;height:31px;border-radius:10px;display:grid;place-items:center;background:linear-gradient(135deg,#6878ff,#9b6dff);box-shadow:0 7px 22px rgba(104,119,255,.3)}.ccp-sub{margin:4px 0 0 41px;color:#8d96a8;font-size:11px}
      .ccp-context{margin:10px;padding:10px 11px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.035);border-radius:13px;color:#aeb6c5;font-size:11px;line-height:1.45;max-height:54px;overflow:hidden}.ccp-section{padding:2px 16px 7px;color:#707a8d;font-size:10px;font-weight:750;letter-spacing:.12em;text-transform:uppercase}.ccp-body{padding:9px 10px 11px}
      .ccp-item{width:100%;display:flex;align-items:center;gap:11px;border:0;background:transparent;color:#edf0f5;text-align:left;border-radius:12px;padding:9px 10px;cursor:pointer;transition:background .15s,transform .15s}.ccp-item:hover{background:rgba(255,255,255,.065);transform:translateX(2px)}.ccp-icon{width:31px;height:31px;border-radius:9px;background:rgba(255,255,255,.065);display:grid;place-items:center;flex:0 0 31px}.ccp-label{font-size:13px;font-weight:650}.ccp-desc{margin-top:2px;color:#7f899a;font-size:10px}.ccp-arrow{margin-left:auto;color:#687286}.ccp-divider{height:1px;background:rgba(255,255,255,.07);margin:6px 0}
      .ccp-result{margin:0 10px 10px;padding:12px;border-radius:14px;background:rgba(104,119,255,.08);border:1px solid rgba(104,119,255,.15);font-size:12px;line-height:1.6;white-space:pre-wrap;max-height:250px;overflow:auto}.ccp-actions{display:flex;gap:7px;margin-top:10px}.ccp-mini{flex:1;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.055);color:#e3e7ef;border-radius:9px;padding:8px;cursor:pointer;font-size:11px}
      .ccp-loading{padding:18px;text-align:center;color:#9da7b7;font-size:12px}.ccp-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#7d88ff;animation:ccpPulse 1s infinite alternate}.ccp-dot:nth-child(2){animation-delay:.18s}.ccp-dot:nth-child(3){animation-delay:.36s}@keyframes ccpPulse{to{opacity:.25;transform:translateY(-2px)}}
      .ccp-translate{margin:10px 12px 5px 52px;padding:12px 14px;border-radius:15px;background:linear-gradient(135deg,rgba(104,119,255,.10),rgba(157,105,255,.06));border:1px solid rgba(104,119,255,.14);color:#e9ecf4;direction:rtl;line-height:1.9;font-size:13px;animation:ccpIn .2s ease-out}.ccp-settings{position:fixed;z-index:2147483647;width:350px;max-width:calc(100vw - 24px);right:18px;top:70px;background:#0e1118;color:#f4f6fa;border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:18px;box-shadow:0 25px 80px rgba(0,0,0,.58);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.ccp-settings h3{margin:0;font-size:17px}.ccp-settings p{margin:5px 0 17px;color:#8791a3;font-size:12px}.ccp-input{box-sizing:border-box;width:100%;background:#090c11;border:1px solid rgba(255,255,255,.1);border-radius:11px;color:#fff;padding:11px;outline:0}.ccp-input:focus{border-color:#6878ff;box-shadow:0 0 0 3px rgba(104,120,255,.12)}.ccp-save{width:100%;margin-top:10px;padding:11px;border:0;border-radius:11px;background:linear-gradient(135deg,#6878ff,#986dff);color:#fff;font-weight:700;cursor:pointer}.ccp-close{position:absolute;right:13px;top:10px;background:transparent;border:0;color:#8b95a6;font-size:20px;cursor:pointer}
    `;
    document.documentElement.appendChild(style);
  }

  function getTweetText(tweet) { return tweet?.querySelector('[data-testid="tweetText"]')?.innerText?.trim() || ""; }
  function closeMenu() { if (activeMenu) activeMenu.remove(); activeMenu = null; }
  function positionMenu(menu, button) { const r=button.getBoundingClientRect(); menu.style.display="block"; const h=menu.offsetHeight||420; menu.style.left=`${Math.max(10,Math.min(r.left,innerWidth-320))}px`; menu.style.top=`${Math.max(10,Math.min(r.bottom+8,innerHeight-h-10))}px`; }

  function openSettings() {
    document.querySelector(".ccp-settings")?.remove();
    const panel=document.createElement("div"); panel.className="ccp-settings";
    panel.innerHTML=`<button class="ccp-close">×</button><h3>Crypto Copilot</h3><p>Premium AI settings</p><label style="display:block;color:#9aa3b3;font-size:11px;margin-bottom:7px">OpenRouter API Key</label><input class="ccp-input" type="password" placeholder="sk-or-..." autocomplete="off"><button class="ccp-save">Save API Key</button>`;
    document.body.appendChild(panel); const input=panel.querySelector(".ccp-input");
    panel.querySelector(".ccp-close").onclick=()=>panel.remove(); panel.querySelector(".ccp-save").onclick=()=>{const key=input.value.trim();if(key){API_KEY=key;chrome.storage.local.set({openrouter_api_key:API_KEY});}panel.remove();};
  }

  async function askAI(system,user="") {
    if(!API_KEY){openSettings();return null;}
    try{const response=await fetch("https://openrouter.ai/api/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${API_KEY}`,"HTTP-Referer":"https://x.com","X-Title":"Crypto Copilot V2 Premium"},body:JSON.stringify({model:"openrouter/auto",temperature:.82,messages:[{role:"system",content:system},{role:"user",content:user}]})});const data=await response.json();if(!response.ok||data.error){console.error("Crypto Copilot AI error",data.error||response.status);return null}return data?.choices?.[0]?.message?.content?.trim()||null}catch(error){console.error("Crypto Copilot request failed",error);return null}
  }

  function waitForEditor(timeout=8000){return new Promise(resolve=>{const find=()=>document.querySelector('[data-testid="tweetTextarea_0"][contenteditable="true"]')||document.querySelector('[role="dialog"] [contenteditable="true"]');const found=find();if(found)return resolve(found);const observer=new MutationObserver(()=>{const editor=find();if(editor){observer.disconnect();clearTimeout(timer);resolve(editor)}});observer.observe(document.body,{childList:true,subtree:true});const timer=setTimeout(()=>{observer.disconnect();resolve(null)},timeout)})}
  async function insertIntoComposer(text){const editor=await waitForEditor();if(!editor)return false;editor.click();editor.focus();try{const dt=new DataTransfer();dt.setData("text/plain",text);editor.dispatchEvent(new ClipboardEvent("paste",{clipboardData:dt,bubbles:true,cancelable:true}))}catch(_){}await sleep(180);if(!editor.innerText.trim())document.execCommand("insertText",false,text);editor.focus();const selection=window.getSelection(),range=document.createRange();range.selectNodeContents(editor);range.collapse(false);selection.removeAllRanges();selection.addRange(range);return true}

  function createItem(icon,label,desc,handler){const item=document.createElement("button");item.className="ccp-item";item.innerHTML=`<span class="ccp-icon">${icon}</span><span><div class="ccp-label">${label}</div><div class="ccp-desc">${desc}</div></span><span class="ccp-arrow">›</span>`;item.onclick=handler;return item}
  async function showResult(menu,tweet,title,text){menu.innerHTML=`<div class="ccp-head"><div class="ccp-brand"><span class="ccp-logo">✦</span><span>${esc(title)}</span></div><div class="ccp-sub">Generated by Crypto Copilot</div></div><div class="ccp-result">${esc(text)}<div class="ccp-actions"><button class="ccp-mini ccp-copy">Copy</button><button class="ccp-mini ccp-insert">Insert</button></div></div>`;menu.querySelector(".ccp-copy").onclick=async()=>{try{await navigator.clipboard.writeText(text)}catch(_){}};menu.querySelector(".ccp-insert").onclick=async()=>{const reply=tweet.querySelector('[data-testid="reply"]');if(reply)reply.click();await sleep(550);await insertIntoComposer(text);closeMenu()};menu.style.display="block"}

  async function runReply(menu,tweet,mode){menu.innerHTML=`<div class="ccp-loading">Generating <span class="ccp-dot"></span> <span class="ccp-dot"></span> <span class="ccp-dot"></span></div>`;const prompts={short:"Write ONE natural crypto Twitter reply under 12 words. Sharp, human, concise.",smart:"Write ONE insightful crypto Twitter reply under 25 words. Add a fresh opinion, not a summary.",professional:"Write ONE credible professional crypto Twitter reply under 25 words. Natural and informed."};const result=await askAI(`${prompts[mode]} Output only the reply. No hashtags. Maximum 2 emojis.`,getTweetText(tweet));if(!result){closeMenu();return}const reply=tweet.querySelector('[data-testid="reply"]');if(reply)reply.click();await sleep(500);await insertIntoComposer(result);closeMenu()}

  function createMenu(tweet,button){
    closeMenu();const menu=document.createElement("div");menu.className="ccp-menu";const text=getTweetText(tweet);const preview=text.length>125?`${text.slice(0,125)}…`:text;
    menu.innerHTML=`<div class="ccp-head"><div class="ccp-brand"><span class="ccp-logo">✦</span><span>Crypto Copilot</span></div><div class="ccp-sub">AI tools for Crypto Twitter</div></div>${preview?`<div class="ccp-context">${esc(preview)}</div>`:""}<div class="ccp-section">AI Actions</div><div class="ccp-body"></div>`;
    const body=menu.querySelector(".ccp-body");
    body.appendChild(createItem("⚡","Smart Reply","Choose a natural reply style",()=>{menu.innerHTML=`<div class="ccp-head"><div class="ccp-brand"><span class="ccp-logo">⚡</span><span>Smart Reply</span></div><div class="ccp-sub">Choose your voice</div></div><div class="ccp-body"></div>`;const sub=menu.querySelector(".ccp-body");sub.appendChild(createItem("◉","Short","Fast and punchy",()=>runReply(menu,tweet,"short")));sub.appendChild(createItem("✦","Smart","Fresh opinion and insight",()=>runReply(menu,tweet,"smart")));sub.appendChild(createItem("◆","Professional","Credible and informed",()=>runReply(menu,tweet,"professional")));positionMenu(menu,button)}));
    body.appendChild(createItem("🌍","Translate","Natural Persian translation",async()=>{menu.innerHTML=`<div class="ccp-loading">Translating <span class="ccp-dot"></span> <span class="ccp-dot"></span> <span class="ccp-dot"></span></div>`;const result=await askAI("Translate the tweet into natural Persian. Preserve crypto terminology and tone. Output only the translation.",text);if(!result){closeMenu();return}let box=tweet.querySelector(".ccp-translate");if(!box){box=document.createElement("div");box.className="ccp-translate";tweet.querySelector('[data-testid="tweetText"]')?.parentElement.appendChild(box)}box.textContent=result;closeMenu()}));
    body.appendChild(createItem("✎","Rewrite","Sharper and more engaging",async()=>{menu.innerHTML=`<div class="ccp-loading">Rewriting <span class="ccp-dot"></span> <span class="ccp-dot"></span> <span class="ccp-dot"></span></div>`;const result=await askAI("Rewrite this tweet to be sharper, more natural and engaging for Crypto Twitter. Preserve the meaning. Output only the rewritten text.",text);if(result)await showResult(menu,tweet,"Rewrite",result);else closeMenu()}));
    body.appendChild(createItem("🧵","Thread","Turn the idea into 3 posts",async()=>{menu.innerHTML=`<div class="ccp-loading">Building thread <span class="ccp-dot"></span> <span class="ccp-dot"></span> <span class="ccp-dot"></span></div>`;const result=await askAI("Turn this into a concise 3-post crypto Twitter thread. Number each post 1/3, 2/3, 3/3. Output only the thread.",text);if(result)await showResult(menu,tweet,"Thread",result);else closeMenu()}));
    const divider=document.createElement("div");divider.className="ccp-divider";body.appendChild(divider);
    body.appendChild(createItem("🚀","Project Tweet","Create a new crypto post",async()=>{const project=prompt("Project name:");if(!project)return;menu.innerHTML=`<div class="ccp-loading">Creating post <span class="ccp-dot"></span> <span class="ccp-dot"></span> <span class="ccp-dot"></span></div>`;const result=await askAI(`Write one punchy Crypto Twitter post about ${project}. Insider tone, 1-3 sentences, max 2 emojis, no hashtags. Output only the post.`);if(result){document.querySelector('[data-testid="SideNav_NewTweet_Button"]')?.click();await sleep(700);await insertIntoComposer(result)}closeMenu()}));
    body.appendChild(createItem("⚙","Settings","API key and preferences",()=>{closeMenu();openSettings()}));
    document.body.appendChild(menu);activeMenu=menu;positionMenu(menu,button);
  }

  function attachButton(tweet){if(!tweet||tweet.querySelector(".ccp-fab"))return;const actionBar=tweet.querySelector('[role="group"]');if(!actionBar)return;const button=document.createElement("button");button.className="ccp-fab";button.type="button";button.textContent="✦";button.title="Crypto Copilot";button.setAttribute("aria-label","Crypto Copilot");button.onclick=event=>{event.preventDefault();event.stopPropagation();createMenu(tweet,button)};actionBar.appendChild(button)}
  function scan(){document.querySelectorAll("article").forEach(attachButton)}

  injectStyles();scan();const observer=new MutationObserver(scan);observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener("click",event=>{if(activeMenu&&!activeMenu.contains(event.target)&&!event.target.closest(".ccp-fab"))closeMenu()});window.addEventListener("scroll",closeMenu,true);
  console.log("✅ Crypto Copilot V2 Premium active");
})();
