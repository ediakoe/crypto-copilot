(() => {
  if (window.__cryptoCopilotV206) return;
  window.__cryptoCopilotV206 = true;

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  let panel = null;
  let anchor = null;
  let busy = false;

  const css = document.createElement('style');
  css.textContent = `
    .ccp206-fab{position:relative!important;width:34px!important;height:34px!important;min-width:34px!important;margin:0 4px!important;padding:0!important;border:1px solid rgba(132,145,255,.68)!important;border-radius:11px!important;background:linear-gradient(135deg,#6478ff,#9a69ff)!important;color:#fff!important;font:800 16px/34px Arial,sans-serif!important;text-align:center!important;cursor:pointer!important;box-shadow:0 6px 20px rgba(100,115,255,.32)!important;z-index:10!important;transition:transform .16s ease,box-shadow .16s ease,filter .16s ease!important}.ccp206-fab:hover{transform:translateY(-1px) scale(1.05)!important;box-shadow:0 9px 25px rgba(100,115,255,.45)!important;filter:brightness(1.08)!important}
    .ccp206-panel{position:fixed;z-index:2147483647;width:360px;max-width:calc(100vw - 18px);background:linear-gradient(180deg,#0c1018 0%,#0a0e15 100%);color:#f5f7fb;border:1px solid rgba(255,255,255,.11);border-radius:20px;box-shadow:0 30px 90px rgba(0,0,0,.66),0 0 0 1px rgba(105,121,255,.04);font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow:hidden;backdrop-filter:blur(22px);animation:ccp206In .16s ease-out}@keyframes ccp206In{from{opacity:0;transform:translateY(5px) scale(.985)}to{opacity:1;transform:none}}
    .ccp206-head{padding:16px;background:radial-gradient(circle at 100% 0,rgba(116,101,255,.22),transparent 40%),linear-gradient(135deg,rgba(105,121,255,.16),rgba(154,105,255,.05));border-bottom:1px solid rgba(255,255,255,.08)}
    .ccp206-brand{display:flex;align-items:center;gap:10px}.ccp206-logo{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:linear-gradient(135deg,#6478ff,#9a69ff);box-shadow:0 8px 22px rgba(100,115,255,.28);font-size:17px}.ccp206-title{font-weight:820;font-size:15px;letter-spacing:-.01em}.ccp206-sub{margin-top:3px;color:#8993a5;font-size:10px}
    .ccp206-status{display:flex;align-items:center;gap:8px;margin:11px 12px 3px;padding:10px 11px;border-radius:12px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.06);color:#aab3c2;font-size:11px;line-height:1.45}.ccp206-status .dot{width:6px;height:6px;border-radius:50%;background:#717b8d;flex:0 0 6px}.ccp206-status.ok{color:#79e1a7;background:rgba(60,210,125,.075);border-color:rgba(60,210,125,.14)}.ccp206-status.ok .dot{background:#5ee09a;box-shadow:0 0 10px rgba(94,224,154,.65)}.ccp206-status.err{color:#ff8c99;background:rgba(255,70,95,.075);border-color:rgba(255,70,95,.14)}.ccp206-status.err .dot{background:#ff7185}
    .ccp206-context{margin:10px 12px 4px;padding:11px 12px;border-radius:13px;background:rgba(255,255,255,.027);border:1px solid rgba(255,255,255,.06);color:#aeb7c6;font-size:11px;line-height:1.45;max-height:62px;overflow:hidden}.ccp206-label{padding:8px 13px 5px;color:#6e788a;font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
    .ccp206-body{padding:7px 10px 12px}.ccp206-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ccp206-btn{width:100%;min-height:66px;padding:10px;border:1px solid rgba(255,255,255,.065);border-radius:13px;background:rgba(255,255,255,.035);color:#edf0f5;text-align:left;cursor:pointer;transition:background .15s ease,border-color .15s ease,transform .15s ease}.ccp206-btn:hover{background:rgba(105,121,255,.10);border-color:rgba(105,121,255,.18);transform:translateY(-1px)}.ccp206-btn:disabled{opacity:.5;cursor:default;transform:none}.ccp206-icon{display:block;font-size:17px;margin-bottom:7px}.ccp206-btn strong{display:block;font-size:11px;font-weight:750}.ccp206-btn span{display:block;margin-top:2px;color:#758094;font-size:9px;line-height:1.35}
    .ccp206-full{width:100%;min-height:42px;margin-top:8px;padding:10px;border:1px solid rgba(255,255,255,.075);border-radius:12px;background:rgba(255,255,255,.035);color:#e7ebf2;text-align:left;cursor:pointer}.ccp206-full:hover{background:rgba(255,255,255,.065)}
    .ccp206-generate{width:100%;min-height:46px;margin-top:10px;padding:11px 14px;border:0;border-radius:12px;background:linear-gradient(135deg,#6579ff,#9a69ff);color:#fff;font-weight:800;font-size:12px;cursor:pointer;box-shadow:0 10px 28px rgba(102,118,255,.22);transition:.16s}.ccp206-generate:hover{transform:translateY(-1px);filter:brightness(1.08)}.ccp206-generate:disabled{opacity:.55;cursor:default;transform:none}.ccp206-back{width:100%;margin-top:8px;padding:9px;border:1px solid rgba(255,255,255,.075);border-radius:10px;background:rgba(255,255,255,.025);color:#9ca6b7;cursor:pointer}
    .ccp206-result{margin:10px 12px;padding:12px;border-radius:13px;background:rgba(105,121,255,.075);border:1px solid rgba(105,121,255,.14);white-space:pre-wrap;line-height:1.55;max-height:240px;overflow:auto;font-size:12px}.ccp206-actions{display:flex;gap:7px;margin-top:10px}.ccp206-mini{flex:1;padding:8px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.05);color:#fff;border-radius:9px;cursor:pointer}.ccp206-mini:hover{background:rgba(255,255,255,.09)}
    .ccp206-loading{text-align:center;padding:25px 18px;color:#aab3c2;font-size:11px}.ccp206-spinner{display:inline-flex;gap:4px;margin-top:10px}.ccp206-spinner i{display:block;width:5px;height:5px;border-radius:50%;background:#7888ff;animation:ccp206Pulse 1s infinite alternate}.ccp206-spinner i:nth-child(2){animation-delay:.16s}.ccp206-spinner i:nth-child(3){animation-delay:.32s}@keyframes ccp206Pulse{to{opacity:.25;transform:translateY(-2px)}}
  `;
  document.documentElement.appendChild(css);

  function closePanel(){ if(panel){panel.remove();panel=null;} anchor=null; busy=false; }
  function placePanel(){ if(!panel||!anchor)return; const r=anchor.getBoundingClientRect(); const w=Math.min(360,innerWidth-18); panel.style.left=Math.max(9,Math.min(r.left,innerWidth-w-9))+'px'; panel.style.top=Math.max(9,Math.min(r.bottom+8,innerHeight-panel.offsetHeight-9))+'px'; }
  function esc(v){return String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
  function setStatus(text,type=''){const el=panel?.querySelector('.ccp206-status');if(!el)return;el.innerHTML=`<span class="dot"></span><span>${esc(text)}</span>`;el.className='ccp206-status '+type;placePanel();}
  function loading(text){if(!panel)return;panel.querySelectorAll('button').forEach(b=>b.disabled=true);const body=panel.querySelector('.ccp206-body');body.innerHTML=`<div class="ccp206-loading">${esc(text)}<div class="ccp206-spinner"><i></i><i></i><i></i></div></div>`;placePanel();}
  function item(icon,title,desc,handler){const b=document.createElement('button');b.className='ccp206-btn';b.type='button';b.innerHTML=`<span class="ccp206-icon">${icon}</span><strong>${esc(title)}</strong><span>${esc(desc)}</span>`;b.onclick=handler;return b;}

  function tweetText(tweet){return tweet?.querySelector('[data-testid="tweetText"]')?.innerText?.trim()||'';}
  function replyButton(tweet){return tweet?.querySelector('[data-testid="reply"]');}
  function editor(){return document.querySelector('[role="dialog"] [contenteditable="true"]')||document.querySelector('[data-testid="tweetTextarea_0"][contenteditable="true"]')||document.querySelector('[data-testid="tweetTextarea_0"] [contenteditable="true"]');}

  function askAI(prompt,system='Write natural concise crypto Twitter copy. Output only the text. No hashtags. Maximum 2 emojis.'){
    return new Promise(resolve=>{
      chrome.runtime.sendMessage({type:'CCP_AI',temperature:.8,messages:[{role:'system',content:system},{role:'user',content:prompt}]},res=>{
        if(chrome.runtime.lastError){resolve({ok:false,error:chrome.runtime.lastError.message});return;}
        resolve(res?.ok?{ok:true,text:res.text||''}:{ok:false,error:res?.error||'Unknown background error'});
      });
    });
  }

  async function waitEditor(timeout=7000){const end=Date.now()+timeout;while(Date.now()<end){const e=editor();if(e)return e;await sleep(120);}return null;}
  async function insertOnce(text){
    const e=await waitEditor();
    if(!e)return {ok:false,error:'X composer was not found.'};
    if(e.dataset.ccpInserted==='1')return {ok:true};
    e.dataset.ccpInserted='1';
    try{e.focus();document.execCommand('insertText',false,text);}catch{}
    if(!e.innerText.trim()){
      try{const range=document.createRange();range.selectNodeContents(e);range.collapse(false);const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);document.execCommand('insertText',false,text);}catch{}
    }
    e.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:text}));
    await sleep(180);
    return {ok:true};
  }

  async function ensureSingleReplyComposer(tweet){
    const existing=editor();
    if(existing)return existing;
    const reply=replyButton(tweet);
    if(!reply)return null;
    reply.click();
    await sleep(650);
    return waitEditor();
  }

  function showResult(title,text,tweet){
    if(!panel)return;
    panel.innerHTML=`<div class="ccp206-head"><div class="ccp206-brand"><div class="ccp206-logo">✦</div><div><div class="ccp206-title">${esc(title)}</div><div class="ccp206-sub">Generated by Crypto Copilot</div></div></div></div><div class="ccp206-result">${esc(text)}</div><div class="ccp206-body"><div class="ccp206-actions"><button class="ccp206-mini" id="ccpCopy">Copy</button><button class="ccp206-mini" id="ccpInsert">Insert into X</button></div></div>`;
    panel.querySelector('#ccpCopy').onclick=()=>navigator.clipboard?.writeText(text);
    panel.querySelector('#ccpInsert').onclick=async()=>{
      if(busy)return; busy=true;
      const comp=await ensureSingleReplyComposer(tweet);
      if(!comp){setStatus('⚠️ X reply composer could not be opened.','err');busy=false;return;}
      const r=await insertOnce(text);
      if(!r.ok){setStatus('⚠️ '+r.error,'err');busy=false;return;}
      setStatus('✓ Inserted once','ok');await sleep(450);closePanel();
    };
    placePanel();
  }

  async function generateReply(tweet,mode){
    if(busy)return;
    busy=true;
    const text=tweetText(tweet);
    if(!text){setStatus('Could not read this Tweet.','err');busy=false;return;}
    const specs={short:'under 12 words, sharp and natural',smart:'under 25 words, insightful with one original opinion',professional:'under 25 words, credible and polished'};
    loading(`Generating ${mode} reply…`);
    const ai=await askAI(`Reply to this Tweet. Style: ${specs[mode]}. Output exactly ONE reply.\n\n${text}`);
    if(!ai.ok){setStatus('❌ '+ai.error,'err');busy=false;return;}
    showResult(`${mode[0].toUpperCase()+mode.slice(1)} Reply`,ai.text,tweet);
    busy=false;
  }

  async function translate(tweet){
    if(busy)return;busy=true;const text=tweetText(tweet);if(!text){setStatus('Could not read this Tweet.','err');busy=false;return;}loading('Translating…');
    const ai=await askAI(`Translate this Tweet into natural Persian. Preserve crypto terms, names and tone. Output only the translation.\n\n${text}`,'You are a high-quality Persian translator for Crypto Twitter.');
    if(!ai.ok){setStatus('❌ '+ai.error,'err');busy=false;return;}
    let box=tweet.querySelector('.ccp206-translation');if(!box){box=document.createElement('div');box.className='ccp206-translation';box.style.cssText='margin:10px 12px;padding:12px 14px;border-radius:13px;background:rgba(105,121,255,.08);border:1px solid rgba(105,121,255,.14);color:#eef1f7;direction:rtl;line-height:1.9;font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';tweet.appendChild(box);}box.textContent=ai.text;closePanel();
  }

  async function diagnostic(){if(busy)return;busy=true;loading('Testing API bridge…');const r=await askAI('Reply with exactly CCP_OK','You are a diagnostic endpoint. Return exactly: CCP_OK');if(r.ok&&r.text==='CCP_OK')setStatus('✓ API bridge is working','ok');else if(r.ok)setStatus('✓ API responded: '+r.text,'ok');else setStatus('❌ '+r.error,'err');busy=false;}

  function showSubmenu(tweet){
    panel.innerHTML=`<div class="ccp206-head"><div class="ccp206-brand"><div class="ccp206-logo">⚡</div><div><div class="ccp206-title">Smart Reply</div><div class="ccp206-sub">Choose style, then press Generate</div></div></div></div><div class="ccp206-body"><div class="ccp206-grid" id="styles"></div><button class="ccp206-generate" id="generate" disabled>✨ Generate Reply</button><button class="ccp206-back" id="back">← Back to tools</button></div>`;
    let selected='smart';
    const styles=panel.querySelector('#styles');
    const generate=panel.querySelector('#generate');
    const cards={};
    [['◉','Short','Fast & punchy','short'],['✦','Smart','Insightful & natural','smart'],['◆','Professional','Polished & credible','professional']].forEach(([icon,title,desc,key])=>{
      const b=item(icon,title,desc,()=>{selected=key;Object.values(cards).forEach(x=>x.classList.remove('selected'));b.classList.add('selected');generate.disabled=false;});
      cards[key]=b;styles.appendChild(b);
    });
    generate.disabled=false;cards.smart.classList.add('selected');
    generate.onclick=()=>generateReply(tweet,selected);
    panel.querySelector('#back').onclick=()=>openPanel(tweet,anchor);
    placePanel();
  }

  function openPanel(tweet,button){
    closePanel();anchor=button;panel=document.createElement('div');panel.className='ccp206-panel';
    const text=tweetText(tweet);const preview=text.length>155?text.slice(0,155)+'…':text;
    panel.innerHTML=`<div class="ccp206-head"><div class="ccp206-brand"><div class="ccp206-logo">✦</div><div><div class="ccp206-title">Crypto Copilot</div><div class="ccp206-sub">Premium AI tools for Crypto Twitter</div></div></div></div>${preview?`<div class="ccp206-context">${esc(preview)}</div>`:''}<div class="ccp206-status"><span class="dot"></span><span>Checking API…</span></div><div class="ccp206-label">AI TOOLS</div><div class="ccp206-body"><div class="ccp206-grid"></div><button class="ccp206-full" id="diag">🧪 Diagnostic <span style="color:#748097">· Test API connection</span></button></div>`;
    document.body.appendChild(panel);
    const grid=panel.querySelector('.ccp206-grid');
    grid.appendChild(item('⚡','Smart Reply','Short · Smart · Professional',()=>showSubmenu(tweet)));
    grid.appendChild(item('🔁','Smart Quote','AI quote comment',()=>setStatus('Smart Quote UI ready.')));
    grid.appendChild(item('🌍','Translate','Natural Persian',()=>translate(tweet)));
    grid.appendChild(item('✎','Rewrite','Sharper copy',()=>setStatus('Rewrite UI ready.')));
    grid.appendChild(item('🧵','Thread','3-post thread',()=>setStatus('Thread UI ready.')));
    grid.appendChild(item('📈','Trend Radar','Trend-based post',()=>setStatus('Trend Radar UI ready.')));
    panel.querySelector('#diag').onclick=diagnostic;
    chrome.storage.local.get(['openrouter_api_key'],data=>setStatus(data.openrouter_api_key?'✓ API connected':'⚠️ API not configured',data.openrouter_api_key?'ok':'err'));
    placePanel();
  }

  function attach(tweet){
    if(tweet.querySelector('.ccp206-fab'))return;
    const host=tweet.querySelector('[role="group"]');if(!host)return;
    const b=document.createElement('button');b.className='ccp206-fab';b.type='button';b.textContent='✦';b.title='Crypto Copilot';b.setAttribute('aria-label','Crypto Copilot');
    b.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openPanel(tweet,b);},{capture:true});
    host.appendChild(b);
  }

  function scan(){document.querySelectorAll('article').forEach(attach);}
  scan();new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',event=>{if(panel&&!panel.contains(event.target)&&!event.target.closest('.ccp206-fab'))closePanel();});
  window.addEventListener('resize',placePanel);window.addEventListener('scroll',closePanel,true);
  console.log('🚀 Crypto Copilot V2.0.7 UI Core active');
})();